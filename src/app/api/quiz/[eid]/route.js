import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eid } = await params;

    // Fetch quiz info
    const quizResult = await sql`
      SELECT title, time, total, sahi, wrong FROM "quiz" WHERE eid = ${eid}
    `;

    if (quizResult.length === 0) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    const quiz = quizResult[0];

    // Fetch questions
    const questions = await sql`
      SELECT qid, qns, sn FROM "questions" WHERE eid = ${eid} ORDER BY sn ASC
    `;

    // Fetch options for all questions
    const qids = questions.map(q => q.qid);
    let options = [];
    if (qids.length > 0) {
      options = await sql`
        SELECT qid, option, optionid FROM "options" WHERE qid IN (${qids})
      `;
    }

    // Structure output
    const structuredQuestions = questions.map(q => ({
      ...q,
      options: options.filter(o => o.qid === q.qid)
    }));

    return NextResponse.json({
      quiz,
      questions: structuredQuestions
    });
  } catch (error) {
    console.error('Quiz details fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eid } = await params;
    const { answers } = await req.json(); // Map of { qid: selectedOptionId }
    const email = session.email;

    // Fetch quiz details
    const quizResult = await sql`
      SELECT total, sahi, wrong FROM "quiz" WHERE eid = ${eid}
    `;
    if (quizResult.length === 0) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    const quiz = quizResult[0];
    const sahiMark = quiz.sahi;
    const wrongMark = quiz.wrong;

    // Fetch correct answers
    const questions = await sql`
      SELECT qid FROM "questions" WHERE eid = ${eid}
    `;
    const qids = questions.map(q => q.qid);
    
    let correctAnswers = [];
    if (qids.length > 0) {
      correctAnswers = await sql`
        SELECT qid, ansid FROM "answer" WHERE qid IN (${qids})
      `;
    }

    let score = 0;
    let sahiCount = 0;
    let wrongCount = 0;

    correctAnswers.forEach(correct => {
      const selected = answers[correct.qid];
      if (selected) {
        if (selected === correct.ansid) {
          score += sahiMark;
          sahiCount++;
        } else {
          score -= wrongMark;
          wrongCount++;
        }
      }
    });

    // Check if history already exists
    const existingHistory = await sql`
      SELECT email FROM "history" WHERE email = ${email} AND eid = ${eid}
    `;

    if (existingHistory.length > 0) {
      await sql`
        UPDATE "history" 
        SET score = ${score}, sahi = ${sahiCount}, wrong = ${wrongCount}, date = NOW()
        WHERE email = ${email} AND eid = ${eid}
      `;
    } else {
      await sql`
        INSERT INTO "history" (email, eid, score, level, sahi, wrong, date)
        VALUES (${email}, ${eid}, ${score}, ${quiz.total}, ${sahiCount}, ${wrongCount}, NOW())
      `;
    }

    // Recalculate global rank
    const sumResult = await sql`
      SELECT SUM(score) as total_score FROM "history" WHERE email = ${email}
    `;
    const totalScore = parseInt(sumResult[0]?.total_score || '0');

    const existingRank = await sql`
      SELECT email FROM "rank" WHERE email = ${email}
    `;

    if (existingRank.length > 0) {
      await sql`
        UPDATE "rank" SET score = ${totalScore}, time = NOW() WHERE email = ${email}
      `;
    } else {
      await sql`
        INSERT INTO "rank" (email, score, time) VALUES (${email}, ${totalScore}, NOW())
      `;
    }

    return NextResponse.json({
      success: true,
      score,
      sahi: sahiCount,
      wrong: wrongCount,
      total: quiz.total
    });
  } catch (error) {
    console.error('Quiz submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
