import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const session = await getSession();
    if (!session) {
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

    // 1. Fetch quiz details
    const quizResult = await sql`
      SELECT eid, title, tag, total, sahi, wrong, email, institution_id FROM "quiz" WHERE eid = ${eid}
    `;
    if (quizResult.length === 0) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    const quiz = quizResult[0];

    // Tenant Isolation Check
    if (session.role !== 'super_admin' && quiz.institution_id !== instId) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    // 2. Enforce authorization rules
    if (session.role === 'teacher') {
      // Teachers must own the quiz to view its private analytics
      if (quiz.email !== session.email) {
        return NextResponse.json({ error: 'Forbidden: You do not own this quiz' }, { status: 403 });
      }
    }

    // 3. Fetch attempts restricted to this institution
    const attempts = await sql`
      SELECT h.email, h.score, h.sahi, h.wrong, h.date, u.name, u.college
      FROM "history" h
      JOIN "user" u ON h.email = u.email
      WHERE h.eid = ${eid} AND u.institution_id = ${instId}
      ORDER BY h.score DESC, h.date ASC
    `;

    // 4. Calculate competition ranks
    let currentRank = 1;
    let rankIndex = 1;
    let prevScore = null;
    let prevDate = null;

    const rankedAttempts = attempts.map((att, index) => {
      const score = att.score;
      const dateVal = new Date(att.date).getTime();

      if (prevScore !== null) {
        if (score !== prevScore || dateVal !== prevDate) {
          rankIndex = index + 1;
        }
      }

      prevScore = score;
      prevDate = dateVal;

      return {
        rank: rankIndex,
        name: att.name,
        college: att.college,
        email: att.email,
        score: att.score,
        sahi: att.sahi,
        wrong: att.wrong,
        date: att.date
      };
    });

    const teacherName = quiz.email ? quiz.email.split('@')[0].replace(/^\w/, c => c.toUpperCase()) : 'Teacher';

    return NextResponse.json({
      success: true,
      quiz: {
        ...quiz,
        teacherName
      },
      leaderboard: rankedAttempts
    });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
