import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get all students
    const students = await sql`
      SELECT name, gender, college, email, mob FROM "user" ORDER BY name ASC
    `;

    // 2. Get feedbacks
    const feedbacks = await sql`
      SELECT id, name, email, subject, feedback, date, time FROM "feedback" ORDER BY date DESC, time DESC
    `;

    // 3. Get rankings
    const rankings = await sql`
      SELECT r.email, r.score, u.name, u.college
      FROM "rank" r
      JOIN "user" u ON r.email = u.email
      ORDER BY r.score DESC
    `;

    // 4. Get quizzes created by anyone (or specifically teachers)
    const quizzes = await sql`
      SELECT eid, title, total, sahi, wrong, time, tag, date, email
      FROM "quiz"
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

    const { title, sahi, wrong, time, tag, desc, questions } = await req.json();
    
    if (!title || !sahi || !wrong || !time || !questions || questions.length === 0) {
      return NextResponse.json({ error: 'Missing required quiz fields' }, { status: 400 });
    }

    const eid = Math.random().toString(36).substring(2, 15);
    const email = session.email;
    const totalQuestions = questions.length;

    // Use transaction for atomic insertion of Quiz + Questions + Options + Answers
    await sql.begin(async sql => {
      // 1. Insert Quiz
      await sql`
        INSERT INTO "quiz" (eid, title, sahi, wrong, total, time, intro, tag, date, email)
        VALUES (${eid}, ${title}, ${parseInt(sahi)}, ${parseInt(wrong)}, ${totalQuestions}, ${parseInt(time)}, ${desc || ''}, ${tag || 'general'}, NOW(), ${email})
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

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'quiz' | 'student' | 'feedback'
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });
    }

    if (type === 'quiz') {
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
      await sql.begin(async sql => {
        // Delete ranks
        await sql`DELETE FROM "rank" WHERE email = ${id}`;
        // Delete history
        await sql`DELETE FROM "history" WHERE email = ${id}`;
        // Delete student
        await sql`DELETE FROM "user" WHERE email = ${id}`;
      });
    } else if (type === 'feedback') {
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
