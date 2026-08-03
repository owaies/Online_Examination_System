import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.isSuspended) {
      return NextResponse.json({ error: "Your institution's E-Examiner access is currently suspended. Please contact your institution administrator." }, { status: 403 });
    }

    const email = session.email;
    const instId = session.institution_id;

    // 1. Fetch active enrollment details
    const enrollmentResult = await sql`
      SELECT se.academic_year_id, se.academic_unit_id, se.section_id, 
             y.name as year_name, au.name as unit_name, sec.name as section_name
      FROM "student_enrollment" se
      JOIN "academic_year" y ON se.academic_year_id = y.id
      JOIN "academic_unit" au ON se.academic_unit_id = au.id
      LEFT JOIN "section" sec ON se.section_id = sec.id
      WHERE se.student_id = ${email} AND se.institution_id = ${instId} AND y.status = 'active'
      LIMIT 1
    `;
    const activeEnrollment = enrollmentResult[0] || null;

    // 2. Get quizzes matching the student's active enrollment
    let quizzes = [];
    if (activeEnrollment) {
      quizzes = await sql`
        SELECT q.eid, q.title, q.total, q.sahi, q.wrong, q.time, q.tag, q.date, q.email,
               (SELECT COUNT(*) FROM "history" h WHERE h.eid = q.eid AND h.email = ${email}) as attempted,
               y.name as year_name, au.name as unit_name, sec.name as section_name, s.name as subject_name
        FROM "quiz" q
        JOIN "academic_year" y ON q.academic_year_id = y.id
        JOIN "academic_unit" au ON q.academic_unit_id = au.id
        LEFT JOIN "section" sec ON q.section_id = sec.id
        JOIN "subject" s ON q.subject_id = s.id
        WHERE q.institution_id = ${instId}
          AND q.academic_year_id = ${activeEnrollment.academic_year_id}
          AND q.academic_unit_id = ${activeEnrollment.academic_unit_id}
          AND (q.section_id = ${activeEnrollment.section_id || null} OR q.section_id IS NULL)
        ORDER BY q.date DESC
      `;
    }

    // 3. Get student history
    const history = await sql`
      SELECT h.eid, h.score, h.sahi, h.wrong, h.date, q.title, q.total, q.time
      FROM "history" h
      JOIN "quiz" q ON h.eid = q.eid
      WHERE h.email = ${email}
      ORDER BY h.date DESC
    `;

    // 4. Get global leaderboard / ranking restricted to student's institution
    const rankings = await sql`
      SELECT r.email, r.score, u.name, u.college
      FROM "rank" r
      JOIN "user" u ON r.email = u.email
      WHERE u.institution_id = ${instId}
      ORDER BY r.score DESC, r.time ASC
      LIMIT 10
    `;

    return NextResponse.json({
      user: { name: session.name, email: session.email },
      activeEnrollment,
      quizzes,
      history,
      rankings
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.isSuspended) {
      return NextResponse.json({ error: "Your institution's E-Examiner access is currently suspended. Please contact your institution administrator." }, { status: 403 });
    }

    const { feedback, subject } = await req.json();
    if (!feedback || !subject) {
      return NextResponse.json({ error: 'Missing feedback fields' }, { status: 400 });
    }

    const id = Math.random().toString(36).substring(2, 15);
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString();

    await sql`
      INSERT INTO "feedback" (id, name, email, subject, feedback, date, time)
      VALUES (${id}, ${session.name}, ${session.email}, ${subject}, ${feedback}, ${date}, ${time})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
