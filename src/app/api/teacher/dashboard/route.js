import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.isSuspended) {
      return NextResponse.json({ error: "Your institution's E-Examiner access is currently suspended. Please contact your institution administrator." }, { status: 403 });
    }

    const instId = session.institution_id;

    // 1. Get students belonging to this institution
    const students = await sql`
      SELECT name, gender, college, email, mob FROM "user" 
      WHERE institution_id = ${instId}
      ORDER BY name ASC
    `;

    // 2. Get feedbacks submitted by students belonging to this institution
    const feedbacks = await sql`
      SELECT f.id, f.name, f.email, f.subject, f.feedback, f.date, f.time 
      FROM "feedback" f
      JOIN "user" u ON f.email = u.email
      WHERE u.institution_id = ${instId}
      ORDER BY f.date DESC, f.time DESC
    `;

    // 3. Get rankings of students belonging to this institution
    const rankings = await sql`
      SELECT r.email, r.score, u.name, u.college
      FROM "rank" r
      JOIN "user" u ON r.email = u.email
      WHERE u.institution_id = ${instId}
      ORDER BY r.score DESC
    `;

    // 4. Get quizzes created by this teacher
    const quizzes = await sql`
      SELECT eid, title, total, sahi, wrong, time, tag, date, email
      FROM "quiz"
      WHERE email = ${session.email} AND institution_id = ${instId}
      ORDER BY date DESC
    `;

    return NextResponse.json({
      students,
      feedbacks,
      rankings,
      quizzes
    });
  } catch (error) {
    console.error('Teacher dashboard fetch error:', error);
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

    const { title, sahi, wrong, time, tag, desc, questions } = await req.json();
    
    if (!title || !sahi || !wrong || !time || !questions || questions.length === 0) {
      return NextResponse.json({ error: 'Missing required quiz fields' }, { status: 400 });
    }

    const eid = Math.random().toString(36).substring(2, 15);
    const email = session.email;
    const instId = session.institution_id;
    const totalQuestions = questions.length;

    // Use transaction for atomic insertion of Quiz + Questions + Options + Answers
    await sql.begin(async sql => {
      // 1. Insert Quiz
      await sql`
        INSERT INTO "quiz" (eid, title, sahi, wrong, total, time, intro, tag, date, email, institution_id)
        VALUES (${eid}, ${title}, ${parseInt(sahi)}, ${parseInt(wrong)}, ${totalQuestions}, ${parseInt(time)}, ${desc || ''}, ${tag || 'general'}, NOW(), ${email}, ${instId})
      `;

      // 2. Insert Questions, Options, and Correct Answers
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qid = Math.random().toString(36).substring(2, 15);
        const sn = i + 1;

        // Insert Question
        await sql`
          INSERT INTO "questions" (eid, qid, qns, choice, sn)
          VALUES (${eid}, ${qid}, ${q.qns}, 4, ${sn})
        `;

        // Insert Options
        const optionIds = {
          a: Math.random().toString(36).substring(2, 15),
          b: Math.random().toString(36).substring(2, 15),
          c: Math.random().toString(36).substring(2, 15),
          d: Math.random().toString(36).substring(2, 15)
        };

        await sql`
          INSERT INTO "options" (qid, option, optionid)
          VALUES 
            (${qid}, ${q.a}, ${optionIds.a}),
            (${qid}, ${q.b}, ${optionIds.b}),
            (${qid}, ${q.c}, ${optionIds.c}),
            (${qid}, ${q.d}, ${optionIds.d})
        `;

        // Insert Correct Answer
        const correctAnsId = optionIds[q.correct.toLowerCase()];
        await sql`
          INSERT INTO "answer" (qid, ansid)
          VALUES (${qid}, ${correctAnsId})
        `;
      }
    });

    return NextResponse.json({ success: true, eid });
  } catch (error) {
    console.error('Quiz creation error:', error);
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

    const instId = session.institution_id;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'quiz' | 'student' | 'feedback'
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });
    }

    if (type === 'quiz') {
      // Verify ownership of the quiz and matching tenant
      const quizCheck = await sql`
        SELECT email, institution_id FROM "quiz" WHERE eid = ${id}
      `;
      if (quizCheck.length === 0) {
        return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
      }
      if (quizCheck[0].email !== session.email || quizCheck[0].institution_id !== instId) {
        return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
      }

      // Use transaction to clean up quiz
      await sql.begin(async sql => {
        // Find all question IDs for this quiz
        const questions = await sql`
          SELECT qid FROM "questions" WHERE eid = ${id}
        `;
        const qids = questions.map(q => q.qid);

        if (qids.length > 0) {
          // Delete options
          await sql`DELETE FROM "options" WHERE qid IN (${qids})`;
          // Delete answers
          await sql`DELETE FROM "answer" WHERE qid IN (${qids})`;
        }

        // Delete questions
        await sql`DELETE FROM "questions" WHERE eid = ${id}`;
        // Delete history
        await sql`DELETE FROM "history" WHERE eid = ${id}`;
        // Delete quiz
        await sql`DELETE FROM "quiz" WHERE eid = ${id}`;
      });
    } else if (type === 'student') {
      // Verify student matches the institution
      const studentCheck = await sql`
        SELECT institution_id FROM "user" WHERE email = ${id}
      `;
      if (studentCheck.length === 0 || studentCheck[0].institution_id !== instId) {
        return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
      }

      await sql.begin(async sql => {
        // Delete ranks
        await sql`DELETE FROM "rank" WHERE email = ${id}`;
        // Delete history
        await sql`DELETE FROM "history" WHERE email = ${id}`;
        // Delete student
        await sql`DELETE FROM "user" WHERE email = ${id}`;
      });
    } else if (type === 'feedback') {
      // Verify feedback submitter belongs to this institution
      const fbCheck = await sql`
        SELECT f.id FROM "feedback" f
        JOIN "user" u ON f.email = u.email
        WHERE f.id = ${id} AND u.institution_id = ${instId}
      `;
      if (fbCheck.length === 0) {
        return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
      }

      await sql`
        DELETE FROM "feedback" WHERE id = ${id}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Teacher delete action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
