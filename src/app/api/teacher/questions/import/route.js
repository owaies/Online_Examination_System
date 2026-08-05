import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

function isFormula(val) {
  if (typeof val !== 'string') return false;
  return ['=', '+', '-', '@'].includes(val.trim()[0]);
}

function sanitizeFormula(val) {
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  if (['=', '+', '-', '@'].includes(trimmed[0])) {
    return `'` + trimmed; // Prepend single quote to neutralize formula injection
  }
  return trimmed;
}

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.isSuspended) {
      return NextResponse.json({ error: 'Institution suspended' }, { status: 403 });
    }

    const { action, rows } = await req.json();
    if (!action || !rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const instId = session.institution_id;
    const email = session.email;

    // Fetch authorized subjects and topics for validation
    const subjects = await sql`SELECT id, name FROM "subject" WHERE institution_id = ${instId}`;
    const topics = await sql`SELECT id, name, subject_id FROM "topic" WHERE institution_id = ${instId}`;

    const subjectsMap = new Map(subjects.map(s => [s.name.toLowerCase().trim(), s.id]));
    const topicsMap = new Map(topics.map(t => [`${t.subject_id}_${t.name.toLowerCase().trim()}`, t.id]));

    if (action === 'preview') {
      const validatedRows = [];
      let validCount = 0;
      let errorCount = 0;
      let warningCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const errors = [];
        const warnings = [];

        const question = row.question;
        const optA = row.option_a;
        const optB = row.option_b;
        const optC = row.option_c;
        const optD = row.option_d;
        const correct = row.correct_answer;
        const marksStr = row.marks;
        const difficulty = (row.difficulty || 'UNSPECIFIED').toUpperCase().trim();
        const subjectName = (row.subject || '').toLowerCase().trim();
        const topicName = (row.topic || '').toLowerCase().trim();

        if (!question) errors.push('Missing question text');
        if (!optA || !optB || !optC || !optD) errors.push('Missing options (a, b, c, d are all required)');
        if (!correct || !['A', 'B', 'C', 'D'].includes(correct.toUpperCase().trim())) {
          errors.push('Correct answer must be A, B, C, or D');
        }

        const marks = parseInt(marksStr);
        if (isNaN(marks) || marks <= 0) {
          errors.push('Marks must be a positive integer');
        }

        if (!['EASY', 'MEDIUM', 'HARD', 'UNSPECIFIED'].includes(difficulty)) {
          errors.push('Invalid difficulty (must be EASY, MEDIUM, HARD, or UNSPECIFIED)');
        }

        let subjectId = null;
        if (!subjectName) {
          errors.push('Subject name is required');
        } else {
          subjectId = subjectsMap.get(subjectName);
          if (!subjectId) errors.push(`Subject "${row.subject}" not found in institution`);
        }

        let topicId = null;
        if (topicName && subjectId) {
          topicId = topicsMap.get(`${subjectId}_${topicName}`);
          if (!topicId) warnings.push(`Topic "${row.topic}" not found; it will be imported as unspecified/general`);
        }

        // Duplicate Question Detection
        if (question && subjectId) {
          const normalizedQns = question.trim().replace(/\s+/g, ' ').toLowerCase();
          // Check for similar question in same subject
          const duplicateCheck = await sql`
            SELECT qid FROM "questions" 
            WHERE institution_id = ${instId} AND subject_id = ${subjectId} AND eid IS NULL
              AND LOWER(REGEXP_REPLACE(qns, '\\s+', ' ', 'g')) = ${normalizedQns}
          `;
          if (duplicateCheck.length > 0) {
            warnings.push('Possible duplicate question already exists in this subject.');
            warningCount++;
          }
        }

        if (errors.length > 0) errorCount++;
        else validCount++;

        validatedRows.push({
          index: i + 1,
          question,
          optA, optB, optC, optD,
          correct: correct?.toUpperCase()?.trim(),
          marks,
          difficulty,
          subjectName: row.subject,
          subjectId,
          topicName: row.topic,
          topicId,
          explanation: row.explanation,
          tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [],
          errors,
          warnings
        });
      }

      return NextResponse.json({
        success: true,
        preview: {
          rows: validatedRows,
          summary: {
            total: rows.length,
            valid: validCount,
            errors: errorCount,
            warnings: warningCount
          }
        }
      });
    }

    if (action === 'confirm') {
      const importId = 'imp-' + Math.random().toString(36).substring(2, 11);
      let insertedCount = 0;

      await sql.begin(async sql => {
        // Log in import history
        await sql`
          INSERT INTO "import_history" (id, institution_id, imported_by, file_name, row_count, import_type)
          VALUES (${importId}, ${instId}, ${email}, 'Question_Import_CSV', ${rows.length}, 'QUESTION')
        `;

        for (const row of rows) {
          const qid = 'q-' + Math.random().toString(36).substring(2, 11);
          
          // Neutralize Spreadsheet Formula Injections
          const qnsSanitized = sanitizeFormula(row.question);
          const optASanitized = sanitizeFormula(row.optA);
          const optBSanitized = sanitizeFormula(row.optB);
          const optCSanitized = sanitizeFormula(row.optC);
          const optDSanitized = sanitizeFormula(row.optD);
          const explanationSanitized = sanitizeFormula(row.explanation);

          await sql`
            INSERT INTO "questions" (
              qid, eid, qns, choice, sn, subject_id, topic_id, marks, difficulty, status, explanation, tags, sharing, institution_id, creator_id
            ) VALUES (
              ${qid}, NULL, ${qnsSanitized}, 4, 1, ${row.subjectId}, ${row.topicId || null}, ${parseInt(row.marks)}, 
              ${row.difficulty || 'UNSPECIFIED'}, 'ACTIVE', ${explanationSanitized || null}, ${JSON.stringify(row.tags || [])}::jsonb, 
              'PRIVATE', ${instId}, ${email}
            )
          `;

          const optionIds = {
            a: Math.random().toString(36).substring(2, 15),
            b: Math.random().toString(36).substring(2, 15),
            c: Math.random().toString(36).substring(2, 15),
            d: Math.random().toString(36).substring(2, 15)
          };

          await sql`
            INSERT INTO "options" (qid, option, optionid)
            VALUES 
              (${qid}, ${optASanitized}, ${optionIds.a}),
              (${qid}, ${optBSanitized}, ${optionIds.b}),
              (${qid}, ${optCSanitized}, ${optionIds.c}),
              (${qid}, ${optDSanitized}, ${optionIds.d})
          `;

          const correctAnsId = optionIds[row.correct.toLowerCase()];
          await sql`
            INSERT INTO "answer" (qid, ansid)
            VALUES (${qid}, ${correctAnsId})
          `;

          insertedCount++;
        }
      });

      return NextResponse.json({ success: true, count: insertedCount });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    console.error('Questions import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
