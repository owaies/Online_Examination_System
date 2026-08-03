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
      SELECT total, sahi, wrong, title, tag, email FROM "quiz" WHERE eid = ${eid}
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
      SELECT email, score FROM "history" WHERE email = ${email} AND eid = ${eid}
    `;

    let isBestAttempt = false;

    if (existingHistory.length > 0) {
      const prevScore = existingHistory[0].score;
      if (score > prevScore) {
        isBestAttempt = true;
        await sql`
          UPDATE "history" 
          SET score = ${score}, sahi = ${sahiCount}, wrong = ${wrongCount}, date = NOW()
          WHERE email = ${email} AND eid = ${eid}
        `;
      }
    } else {
      isBestAttempt = true;
      await sql`
        INSERT INTO "history" (email, eid, score, level, sahi, wrong, date)
        VALUES (${email}, ${eid}, ${score}, ${quiz.total}, ${sahiCount}, ${wrongCount}, NOW())
      `;
    }

    if (isBestAttempt) {
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
    }

    // Calculate student's dynamic rank on this quiz
    const allAttempts = await sql`
      SELECT email, score, date FROM "history" WHERE eid = ${eid} ORDER BY score DESC, date ASC
    `;
    
    let rank = 1;
    let rankIndex = 1;
    let prevAttemptScore = null;
    let prevAttemptDate = null;
    
    for (let i = 0; i < allAttempts.length; i++) {
      const att = allAttempts[i];
      if (prevAttemptScore !== null) {
        if (att.score !== prevAttemptScore || new Date(att.date).getTime() !== new Date(prevAttemptDate).getTime()) {
          rankIndex = i + 1;
        }
      }
      if (att.email === email) {
        rank = rankIndex;
        break;
      }
      prevAttemptScore = att.score;
      prevAttemptDate = att.date;
    }

    const teacherName = quiz.email ? quiz.email.split('@')[0].replace(/^\w/, c => c.toUpperCase()) : 'Teacher';

    return NextResponse.json({
      success: true,
      score,
      sahi: sahiCount,
      wrong: wrongCount,
      total: quiz.total,
      title: quiz.title,
      tag: quiz.tag,
      teacherName,
      rank,
      totalStudents: allAttempts.length
    });
  } catch (error) {
    console.error('Quiz submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
