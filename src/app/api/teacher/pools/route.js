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
    const instId = session.institution_id;

    let query = sql`
      SELECT p.id, p.name, p.subject_id, p.created_by, s.name as subject_name,
             (SELECT COUNT(*) FROM "pool_question" pq WHERE pq.pool_id = p.id) as question_count
      FROM "question_pool" p
      LEFT JOIN "subject" s ON p.subject_id = s.id
      WHERE p.institution_id = ${instId}
    `;

    if (subjectId) {
      query = sql`${query} AND p.subject_id = ${subjectId}`;
    }

    const pools = await sql`${query} ORDER BY p.name ASC`;
    return NextResponse.json({ pools });
  } catch (error) {
    console.error('Pools GET error:', error);
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

    const { name, subjectId, qids } = await req.json();

    if (!name || !subjectId || !qids || qids.length === 0) {
      return NextResponse.json({ error: 'Missing pool name, subjectId, or questions' }, { status: 400 });
    }

    const instId = session.institution_id;

    // IDOR check: Verify subject belongs to the same institution
    const subjectCheck = await sql`
      SELECT id FROM "subject" WHERE id = ${subjectId} AND institution_id = ${instId}
    `;
    if (subjectCheck.length === 0) {
      return NextResponse.json({ error: 'Forbidden: Subject unauthorized' }, { status: 403 });
    }

    // Verify all qids belong to the same institution/subject
    const validQuestions = await sql`
      SELECT qid FROM "questions"
      WHERE qid IN (${qids}) AND eid IS NULL AND institution_id = ${instId} AND subject_id = ${subjectId}
    `;

    if (validQuestions.length !== qids.length) {
      return NextResponse.json({ error: 'Forbidden: Some question IDs are invalid or belong to another context.' }, { status: 403 });
    }

    const poolId = 'pool-' + Math.random().toString(36).substring(2, 11);

    await sql.begin(async sql => {
      // 1. Insert pool
      await sql`
        INSERT INTO "question_pool" (id, institution_id, name, subject_id, created_by)
        VALUES (${poolId}, ${instId}, ${name.trim()}, ${subjectId}, ${session.email})
      `;

      // 2. Insert pool mappings
      for (const qid of qids) {
        await sql`
          INSERT INTO "pool_question" (pool_id, qid)
          VALUES (${poolId}, ${qid})
        `;
      }
    });

    return NextResponse.json({ success: true, poolId });
  } catch (error) {
    console.error('Pools POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
