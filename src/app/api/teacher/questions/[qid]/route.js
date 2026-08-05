import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.isSuspended) {
      return NextResponse.json({ error: 'Institution suspended' }, { status: 403 });
    }

    const { qid } = await params;
    const { 
      subjectId, topicId, difficulty, qns, options, correct, marks, explanation, tags, sharing 
    } = await req.json();

    const instId = session.institution_id;
    const email = session.email;

    // 1. Fetch the master question and verify ownership
    const questionCheck = await sql`
      SELECT creator_id, institution_id FROM "questions" 
      WHERE qid = ${qid} AND eid IS NULL AND institution_id = ${instId}
    `;

    if (questionCheck.length === 0) {
      return NextResponse.json({ error: 'Question not found or unauthorized' }, { status: 404 });
    }

    // Only the creator can edit the question
    if (questionCheck[0].creator_id !== email) {
      return NextResponse.json({ error: 'Forbidden: You do not own this question' }, { status: 403 });
    }

    // IDOR protection: Verify subject and topic belong to the same institution
    if (subjectId) {
      const subjectCheck = await sql`
        SELECT id FROM "subject" WHERE id = ${subjectId} AND institution_id = ${instId}
      `;
      if (subjectCheck.length === 0) {
        return NextResponse.json({ error: 'Forbidden: Subject unauthorized' }, { status: 403 });
      }
    }

    if (topicId && subjectId) {
      const topicCheck = await sql`
        SELECT id FROM "topic" WHERE id = ${topicId} AND institution_id = ${instId} AND subject_id = ${subjectId}
      `;
      if (topicCheck.length === 0) {
        return NextResponse.json({ error: 'Forbidden: Topic unauthorized' }, { status: 403 });
      }
    }

    await sql.begin(async sql => {
      // 1. Update Question
      await sql`
        UPDATE "questions" SET
          subject_id = COALESCE(${subjectId}, subject_id),
          topic_id = ${topicId || null},
          qns = COALESCE(${qns}, qns),
          marks = COALESCE(${parseInt(marks)}, marks),
          difficulty = COALESCE(${difficulty}, difficulty),
          explanation = ${explanation || null},
          tags = COALESCE(${JSON.stringify(tags || [])}::jsonb, tags),
          sharing = COALESCE(${sharing}, sharing)
        WHERE qid = ${qid} AND eid IS NULL
      `;

      // 2. Update Options if provided
      if (options && options.length === 4) {
        // Fetch existing optionids for this question to map correctly
        const existingOptions = await sql`SELECT optionid FROM "options" WHERE qid = ${qid}`;
        if (existingOptions.length === 4) {
          // Re-insert/update options. To keep it simple and robust:
          await sql`DELETE FROM "options" WHERE qid = ${qid}`;
          
          const optionIds = {
            a: Math.random().toString(36).substring(2, 15),
            b: Math.random().toString(36).substring(2, 15),
            c: Math.random().toString(36).substring(2, 15),
            d: Math.random().toString(36).substring(2, 15)
          };

          await sql`
            INSERT INTO "options" (qid, option, optionid)
            VALUES 
              (${qid}, ${options[0].option}, ${optionIds.a}),
              (${qid}, ${options[1].option}, ${optionIds.b}),
              (${qid}, ${options[2].option}, ${optionIds.c}),
              (${qid}, ${options[3].option}, ${optionIds.d})
          `;

          // Update correct answer
          const correctAnsId = optionIds[correct.toLowerCase()];
          await sql`UPDATE "answer" SET ansid = ${correctAnsId} WHERE qid = ${qid}`;
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Question PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.isSuspended) {
      return NextResponse.json({ error: 'Institution suspended' }, { status: 403 });
    }

    const { qid } = await params;
    const instId = session.institution_id;
    const email = session.email;

    // Fetch the master question
    const questionCheck = await sql`
      SELECT creator_id FROM "questions" 
      WHERE qid = ${qid} AND eid IS NULL AND institution_id = ${instId}
    `;

    if (questionCheck.length === 0) {
      return NextResponse.json({ error: 'Question not found or unauthorized' }, { status: 404 });
    }

    // Only the creator can delete/archive the question
    if (questionCheck[0].creator_id !== email) {
      return NextResponse.json({ error: 'Forbidden: You do not own this question' }, { status: 403 });
    }

    // Check if the question has historical usage (used in snapshotted quiz questions)
    // Wait, since snapshotted quiz questions also share the same `qid` (but have a non-null `eid`),
    // we query if any records exist with this qid where `eid` is NOT NULL:
    const usageCheck = await sql`
      SELECT COUNT(*) as count FROM "questions" WHERE qid = ${qid} AND eid IS NOT NULL
    `;

    if (parseInt(usageCheck[0].count) > 0) {
      // Archive it instead of deleting to preserve history
      await sql`
        UPDATE "questions" SET status = 'ARCHIVED' WHERE qid = ${qid} AND eid IS NULL
      `;
      return NextResponse.json({ success: true, archived: true, message: 'Question archived due to historical exam usage.' });
    }

    // If no historical usage, we can safely delete completely
    await sql.begin(async sql => {
      await sql`DELETE FROM "answer" WHERE qid = ${qid}`;
      await sql`DELETE FROM "options" WHERE qid = ${qid}`;
      await sql`DELETE FROM "pool_question" WHERE qid = ${qid}`;
      await sql`DELETE FROM "questions" WHERE qid = ${qid} AND eid IS NULL`;
    });

    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    console.error('Question DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
