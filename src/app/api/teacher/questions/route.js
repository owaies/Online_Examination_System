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
      return NextResponse.json({ error: "Your institution's E-Examiner access is currently suspended. Please contact your institution administrator." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const eid = searchParams.get('eid');

    if (!eid) {
      return NextResponse.json({ error: 'Missing quiz ID' }, { status: 400 });
    }

    const instId = session.institution_id;

    // Verify ownership of the quiz and matching tenant
    const quizCheck = await sql`
      SELECT email, institution_id FROM "quiz" WHERE eid = ${eid}
    `;
    if (quizCheck.length === 0) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    if (quizCheck[0].email !== session.email || quizCheck[0].institution_id !== instId) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    // Fetch questions
    const questions = await sql`
      SELECT qid, qns, sn FROM "questions" WHERE eid = ${eid} ORDER BY sn ASC
    `;

    const qids = questions.map(q => q.qid);
    let options = [];
    let answers = [];

    if (qids.length > 0) {
      options = await sql`
        SELECT qid, option, optionid FROM "options" WHERE qid IN (${qids})
      `;
      answers = await sql`
        SELECT qid, ansid FROM "answer" WHERE qid IN (${qids})
      `;
    }

    const structuredQuestions = questions.map(q => {
      const qOptions = options.filter(o => o.qid === q.qid);
      const qAnswer = answers.find(a => a.qid === q.qid);
      return {
        qid: q.qid,
        qns: q.qns,
        sn: q.sn,
        options: qOptions,
        correctOptionId: qAnswer ? qAnswer.ansid : null
      };
    });

    return NextResponse.json({ success: true, questions: structuredQuestions });
  } catch (error) {
    console.error('Questions fetch error:', error);
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
      return NextResponse.json({ error: "Your institution's E-Examiner access is currently suspended. Please contact your institution administrator." }, { status: 403 });
    }

    const { eid, qns, a, b, c, d, correct } = await req.json();

    if (!eid || !qns || !a || !b || !c || !d || !correct) {
      return NextResponse.json({ error: 'Missing required question fields' }, { status: 400 });
    }

    const instId = session.institution_id;

    // Verify ownership of the quiz and matching tenant
    const quizCheck = await sql`
      SELECT email, total, institution_id FROM "quiz" WHERE eid = ${eid}
    `;
    if (quizCheck.length === 0) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    if (quizCheck[0].email !== session.email || quizCheck[0].institution_id !== instId) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    const qid = Math.random().toString(36).substring(2, 15);
    
    // Find next sn
    const snResult = await sql`
      SELECT COALESCE(MAX(sn), 0) as max_sn FROM "questions" WHERE eid = ${eid}
    `;
    const nextSn = parseInt(snResult[0].max_sn) + 1;

    const optionIds = {
      a: Math.random().toString(36).substring(2, 15),
      b: Math.random().toString(36).substring(2, 15),
      c: Math.random().toString(36).substring(2, 15),
      d: Math.random().toString(36).substring(2, 15)
    };

    const correctAnsId = optionIds[correct.toLowerCase()];
    if (!correctAnsId) {
      return NextResponse.json({ error: 'Invalid correct option specified' }, { status: 400 });
    }

    await sql.begin(async sql => {
      // 1. Insert Question
      await sql`
        INSERT INTO "questions" (eid, qid, qns, choice, sn)
        VALUES (${eid}, ${qid}, ${qns}, 4, ${nextSn})
      `;

      // 2. Insert Options
      await sql`
        INSERT INTO "options" (qid, option, optionid)
        VALUES 
          (${qid}, ${a}, ${optionIds.a}),
          (${qid}, ${b}, ${optionIds.b}),
          (${qid}, ${c}, ${optionIds.c}),
          (${qid}, ${d}, ${optionIds.d})
      `;

      // 3. Insert Correct Answer
      await sql`
        INSERT INTO "answer" (qid, ansid)
        VALUES (${qid}, ${correctAnsId})
      `;

      // 4. Increment total questions in quiz
      await sql`
        UPDATE "quiz" SET total = total + 1 WHERE eid = ${eid}
      `;
    });

    return NextResponse.json({ success: true, qid });
  } catch (error) {
    console.error('Add question error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.isSuspended) {
      return NextResponse.json({ error: "Your institution's E-Examiner access is currently suspended. Please contact your institution administrator." }, { status: 403 });
    }

    const { qid, qns, options, correctOptionId } = await req.json();

    if (!qid || !qns || !options || options.length !== 4 || !correctOptionId) {
      return NextResponse.json({ error: 'Missing required question fields' }, { status: 400 });
    }

    const instId = session.institution_id;

    // Verify question ownership and matching tenant
    const ownerCheck = await sql`
      SELECT q.eid, z.email, z.institution_id 
      FROM "questions" q
      JOIN "quiz" z ON q.eid = z.eid
      WHERE q.qid = ${qid}
    `;

    if (ownerCheck.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    if (ownerCheck[0].email !== session.email || ownerCheck[0].institution_id !== instId) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    await sql.begin(async sql => {
      // 1. Update Question Text
      await sql`
        UPDATE "questions" SET qns = ${qns} WHERE qid = ${qid}
      `;

      // 2. Update Options
      for (const opt of options) {
        await sql`
          UPDATE "options" 
          SET option = ${opt.option} 
          WHERE optionid = ${opt.optionid} AND qid = ${qid}
        `;
      }

      // 3. Update Correct Answer
      await sql`
        UPDATE "answer" SET ansid = ${correctOptionId} WHERE qid = ${qid}
      `;
    });

    return NextResponse.json({ success: true, message: 'Question updated successfully.' });
  } catch (error) {
    console.error('Update question error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.isSuspended) {
      return NextResponse.json({ error: "Your institution's E-Examiner access is currently suspended. Please contact your institution administrator." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const qid = searchParams.get('qid');

    if (!qid) {
      return NextResponse.json({ error: 'Missing question ID' }, { status: 400 });
    }

    const instId = session.institution_id;

    // Verify question ownership and matching tenant
    const ownerCheck = await sql`
      SELECT q.eid, z.email, z.institution_id 
      FROM "questions" q
      JOIN "quiz" z ON q.eid = z.eid
      WHERE q.qid = ${qid}
    `;

    if (ownerCheck.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    if (ownerCheck[0].email !== session.email || ownerCheck[0].institution_id !== instId) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    const eid = ownerCheck[0].eid;

    await sql.begin(async sql => {
      // 1. Delete options
      await sql`
        DELETE FROM "options" WHERE qid = ${qid}
      `;

      // 2. Delete correct answer
      await sql`
        DELETE FROM "answer" WHERE qid = ${qid}
      `;

      // 3. Delete question
      await sql`
        DELETE FROM "questions" WHERE qid = ${qid}
      `;

      // 4. Decrement total count in quiz
      await sql`
        UPDATE "quiz" SET total = GREATEST(0, total - 1) WHERE eid = ${eid}
      `;
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete question error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
