import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.isSuspended) {
      return NextResponse.json({ error: 'Institution suspended' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');
    const topicId = searchParams.get('topicId');
    const difficulty = searchParams.get('difficulty');
    const status = searchParams.get('status') || 'ACTIVE';
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sort') || 'newest';

    const offset = (page - 1) * limit;
    const instId = session.institution_id;
    const email = session.email;

    // Build query parts dynamically to ensure performance and prevent injections
    let whereClause = sql`q.institution_id = ${instId} AND (q.creator_id = ${email} OR q.sharing = 'INSTITUTION')`;

    if (subjectId) {
      whereClause = sql`${whereClause} AND q.subject_id = ${subjectId}`;
    }
    if (topicId) {
      whereClause = sql`${whereClause} AND q.topic_id = ${topicId}`;
    }
    if (difficulty && difficulty !== 'ALL') {
      whereClause = sql`${whereClause} AND q.difficulty = ${difficulty}`;
    }
    if (status && status !== 'ALL') {
      whereClause = sql`${whereClause} AND q.status = ${status}`;
    }
    if (search && search.trim() !== '') {
      const searchPattern = `%${search.trim()}%`;
      whereClause = sql`${whereClause} AND q.qns ILIKE ${searchPattern}`;
    }
    // Only return master questions (those where eid is null, i.e. in the reusable question bank)
    whereClause = sql`${whereClause} AND q.eid IS NULL`;

    let orderBy = sql`q.qid DESC`;
    if (sortBy === 'oldest') {
      orderBy = sql`q.qid ASC`;
    } else if (sortBy === 'difficulty') {
      orderBy = sql`q.difficulty DESC`;
    } else if (sortBy === 'marks') {
      orderBy = sql`q.marks DESC`;
    }

    // Get count for pagination
    const totalCountResult = await sql`
      SELECT COUNT(*) as count 
      FROM "questions" q
      WHERE ${whereClause}
    `;
    const totalCount = parseInt(totalCountResult[0].count);

    // Fetch questions with options and correct answers
    const questions = await sql`
      SELECT q.qid, q.qns, q.marks, q.difficulty, q.status, q.sharing, q.explanation, q.tags, q.creator_id,
             s.name as subject_name, t.name as topic_name,
             (SELECT JSON_AGG(JSON_BUILD_OBJECT('optionid', o.optionid, 'option', o.option)) FROM "options" o WHERE o.qid = q.qid) as options,
             (SELECT a.ansid FROM "answer" a WHERE a.qid = q.qid LIMIT 1) as correct_ansid
      FROM "questions" q
      LEFT JOIN "subject" s ON q.subject_id = s.id
      LEFT JOIN "topic" t ON q.topic_id = t.id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;

    return NextResponse.json({
      questions,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Questions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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

    const { 
      subjectId, topicId, difficulty, qns, options, correct, marks, explanation, tags, sharing 
    } = await req.json();

    if (!subjectId || !qns || !options || options.length !== 4 || !correct || !marks) {
      return NextResponse.json({ error: 'Missing required question fields' }, { status: 400 });
    }

    const instId = session.institution_id;
    const email = session.email;

    // IDOR protection: Verify subject belongs to the same institution
    const subjectCheck = await sql`
      SELECT id FROM "subject" WHERE id = ${subjectId} AND institution_id = ${instId}
    `;
    if (subjectCheck.length === 0) {
      return NextResponse.json({ error: 'Forbidden: Subject unauthorized' }, { status: 403 });
    }

    // Verify topic belongs to same subject/institution
    if (topicId) {
      const topicCheck = await sql`
        SELECT id FROM "topic" WHERE id = ${topicId} AND institution_id = ${instId} AND subject_id = ${subjectId}
      `;
      if (topicCheck.length === 0) {
        return NextResponse.json({ error: 'Forbidden: Topic unauthorized' }, { status: 403 });
      }
    }

    const qid = 'q-' + Math.random().toString(36).substring(2, 11);

    await sql.begin(async sql => {
      // 1. Insert Question
      await sql`
        INSERT INTO "questions" (
          qid, eid, qns, choice, sn, subject_id, topic_id, marks, difficulty, status, explanation, tags, sharing, institution_id, creator_id
        ) VALUES (
          ${qid}, NULL, ${qns.trim()}, 4, 1, ${subjectId}, ${topicId || null}, ${parseInt(marks)}, 
          ${difficulty || 'UNSPECIFIED'}, 'ACTIVE', ${explanation || null}, ${JSON.stringify(tags || [])}::jsonb, 
          ${sharing || 'PRIVATE'}, ${instId}, ${email}
        )
      `;

      // 2. Insert Options
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

      // 3. Insert Correct Answer
      const correctAnsId = optionIds[correct.toLowerCase()];
      await sql`
        INSERT INTO "answer" (qid, ansid)
        VALUES (${qid}, ${correctAnsId})
      `;
    });

    return NextResponse.json({ success: true, qid });
  } catch (error) {
    console.error('Question POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
