import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
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

    // Fetch the original question (authorized check: creator or shared)
    const original = await sql`
      SELECT q.qid, q.qns, q.subject_id, q.topic_id, q.marks, q.difficulty, q.status, q.explanation, q.tags, q.sharing, q.creator_id
      FROM "questions" q
      WHERE q.qid = ${qid} AND q.eid IS NULL AND q.institution_id = ${instId} 
        AND (q.creator_id = ${email} OR q.sharing = 'INSTITUTION')
    `;

    if (original.length === 0) {
      return NextResponse.json({ error: 'Question not found or unauthorized' }, { status: 404 });
    }

    const q = original[0];
    const newQid = 'q-' + Math.random().toString(36).substring(2, 11);
    const newQnsText = `${q.qns} (Copy)`;

    // Fetch original options
    const originalOptions = await sql`
      SELECT o.option, o.optionid,
             (SELECT 1 FROM "answer" a WHERE a.qid = q.qid AND a.ansid = o.optionid) as is_correct
      FROM "options" o
      WHERE o.qid = ${qid}
    `;

    if (originalOptions.length === 0) {
      return NextResponse.json({ error: 'Invalid question: missing options' }, { status: 400 });
    }

    await sql.begin(async sql => {
      // 1. Insert cloned question (cloner becomes creator)
      await sql`
        INSERT INTO "questions" (
          qid, eid, qns, choice, sn, subject_id, topic_id, marks, difficulty, status, explanation, tags, sharing, institution_id, creator_id
        ) VALUES (
          ${newQid}, NULL, ${newQnsText}, 4, 1, ${q.subject_id}, ${q.topic_id}, ${q.marks}, 
          ${q.difficulty}, 'ACTIVE', ${q.explanation}, ${JSON.stringify(q.tags || [])}::jsonb, 
          'PRIVATE', ${instId}, ${email}
        )
      `;

      // 2. Insert cloned options with new IDs
      const optionMap = {
        a: Math.random().toString(36).substring(2, 15),
        b: Math.random().toString(36).substring(2, 15),
        c: Math.random().toString(36).substring(2, 15),
        d: Math.random().toString(36).substring(2, 15)
      };

      const keys = ['a', 'b', 'c', 'd'];
      let correctAnsId = null;

      for (let i = 0; i < Math.min(originalOptions.length, 4); i++) {
        const key = keys[i];
        const newOptId = optionMap[key];
        
        await sql`
          INSERT INTO "options" (qid, option, optionid)
          VALUES (${newQid}, ${originalOptions[i].option}, ${newOptId})
        `;

        if (originalOptions[i].is_correct) {
          correctAnsId = newOptId;
        }
      }

      // If correct answer wasn't set, default to first option
      if (!correctAnsId) {
        correctAnsId = optionMap.a;
      }

      // 3. Insert Correct Answer
      await sql`
        INSERT INTO "answer" (qid, ansid)
        VALUES (${newQid}, ${correctAnsId})
      `;
    });

    return NextResponse.json({ success: true, qid: newQid });
  } catch (error) {
    console.error('Question clone error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
