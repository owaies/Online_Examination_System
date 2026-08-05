import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { answers } = await req.json(); // Map of { qid: selectedOptionId }
    const email = session.email;
    const instId = session.institution_id;

    // Verify attempt ownership and state
    const attempt = await sql`
      SELECT id, status FROM "quiz_attempt"
      WHERE id = ${id} AND email = ${email} AND institution_id = ${instId}
    `;

    if (attempt.length === 0) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt[0].status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Cannot save answers on a submitted/expired attempt' }, { status: 400 });
    }

    // Save/update answers JSONB and last active time
    await sql`
      UPDATE "quiz_attempt"
      SET answers = ${JSON.stringify(answers)}, last_active_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, message: 'Answers autosaved successfully.' });
  } catch (error) {
    console.error('Autosave attempt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.isSuspended) {
      return NextResponse.json({ error: "Your institution's E-Examiner access is currently suspended." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { autoSubmit } = body;
    const email = session.email;
    const instId = session.institution_id;

    // 1. Fetch attempt record
    const attemptResult = await sql`
      SELECT id, eid, attempt_number, started_at, status, answers, question_set
      FROM "quiz_attempt"
      WHERE id = ${id} AND email = ${email} AND institution_id = ${instId}
    `;

    if (attemptResult.length === 0) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    const attempt = attemptResult[0];
    if (attempt.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Attempt is already submitted' }, { status: 400 });
    }

    // 2. Fetch quiz details
    const quizResult = await sql`
      SELECT eid, title, time, total, sahi, wrong, tag, email as teacher_email, passing_percentage, show_result, show_correct_answers, leaderboard_enabled
      FROM "quiz"
      WHERE eid = ${attempt.eid}
    `;
    const quiz = quizResult[0];

    // 3. Retrieve authoritative questions and correct answers from the attempt's snapshotted question_set
    const snapshottedQuestions = attempt.question_set || [];

    // 4. Score student answers
    const studentAnswers = attempt.answers || {};
    let score = 0;
    let sahiCount = 0;
    let wrongCount = 0;

    snapshottedQuestions.forEach(q => {
      const selected = studentAnswers[q.qid];
      const qMarks = q.marks || quiz.sahi;
      const correctAnsId = q.correct_ansid;

      if (selected) {
        if (selected === correctAnsId) {
          score += qMarks;
          sahiCount++;
        } else {
          score -= quiz.wrong;
          wrongCount++;
        }
      }
    });

    const now = new Date();
    const timeTaken = Math.max(0, Math.round((now.getTime() - new Date(attempt.started_at).getTime()) / 1000));
    const submissionStatus = autoSubmit ? 'AUTO_SUBMITTED' : 'SUBMITTED';

    // 5. Update attempt record
    await sql`
      UPDATE "quiz_attempt"
      SET 
        submitted_at = NOW(),
        status = ${submissionStatus},
        score = ${score},
        sahi = ${sahiCount},
        wrong = ${wrongCount},
        time_taken = ${timeTaken}
      WHERE id = ${id}
    `;

    // 6. Fetch settings to determine Sync rule
    let settingsResult = await sql`
      SELECT multiple_attempts_rule FROM "institution_setting" WHERE institution_id = ${instId}
    `;
    const attemptRule = settingsResult[0]?.multiple_attempts_rule || 'BEST_ATTEMPT';

    // 7. Check legacy history
    const existingHistory = await sql`
      SELECT score FROM "history" WHERE email = ${email} AND eid = ${attempt.eid}
    `;

    let doSync = false;
    if (existingHistory.length === 0) {
      doSync = true;
    } else {
      const prevScore = existingHistory[0].score;
      if (attemptRule === 'BEST_ATTEMPT' && score > prevScore) {
        doSync = true;
      } else if (attemptRule === 'LATEST_ATTEMPT') {
        doSync = true;
      }
    }

    if (doSync) {
      if (existingHistory.length > 0) {
        await sql`
          UPDATE "history"
          SET score = ${score}, sahi = ${sahiCount}, wrong = ${wrongCount}, date = NOW()
          WHERE email = ${email} AND eid = ${attempt.eid}
        `;
      } else {
        await sql`
          INSERT INTO "history" (email, eid, score, level, sahi, wrong, date)
          VALUES (${email}, ${attempt.eid}, ${score}, ${quiz.total}, ${sahiCount}, ${wrongCount}, NOW())
        `;
      }

      // 8. Recalculate rank total score
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

    // 9. Calculate rank on this quiz within their institution
    const allAttempts = await sql`
      SELECT h.email, h.score, h.date 
      FROM "history" h
      JOIN "user" u ON h.email = u.email
      WHERE h.eid = ${attempt.eid} AND u.institution_id = ${instId}
      ORDER BY h.score DESC, h.date ASC
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

    const teacherName = quiz.teacher_email ? quiz.teacher_email.split('@')[0].replace(/^\w/, c => c.toUpperCase()) : 'Teacher';

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
    console.error('Submit attempt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
