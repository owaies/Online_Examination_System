import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const instId = session.institution_id;
    const isStudent = session.role === 'student';
    const isTeacher = session.role === 'teacher';

    // 1. Fetch settings for this institution
    let settingsResult = await sql`
      SELECT * FROM "institution_setting" WHERE institution_id = ${instId}
    `;
    let settings = settingsResult[0];
    if (!settings) {
      settings = {
        leaderboard_enabled: true,
        leaderboard_level_exam: true,
        leaderboard_level_subject: true,
        leaderboard_level_section: true,
        leaderboard_level_unit: true,
        student_visibility: 'FULL_LEADERBOARD',
        top_n_count: 10,
        min_qualifying_exams: 3
      };
    }

    // Enforce student global leaderboard toggle
    if (isStudent && !settings.leaderboard_enabled) {
      return NextResponse.json({ error: 'Leaderboards have been disabled by your institution.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const level = searchParams.get('level'); // 'exam' | 'subject' | 'section' | 'unit'
    const eid = searchParams.get('eid');
    const subjectId = searchParams.get('subjectId');
    const academicUnitId = searchParams.get('academicUnitId');
    const sectionId = searchParams.get('sectionId');
    const academicYearId = searchParams.get('academicYearId');

    if (!level) {
      return NextResponse.json({ error: 'Missing ranking level parameter.' }, { status: 400 });
    }

    // Verify student visibility check for levels
    if (isStudent) {
      if (level === 'exam' && !settings.leaderboard_level_exam) {
        return NextResponse.json({ error: 'Exam leaderboards are disabled.' }, { status: 403 });
      }
      if (level === 'subject' && !settings.leaderboard_level_subject) {
        return NextResponse.json({ error: 'Subject leaderboards are disabled.' }, { status: 403 });
      }
      if (level === 'section' && !settings.leaderboard_level_section) {
        return NextResponse.json({ error: 'Section leaderboards are disabled.' }, { status: 403 });
      }
      if (level === 'unit' && !settings.leaderboard_level_unit) {
        return NextResponse.json({ error: 'Class leaderboards are disabled.' }, { status: 403 });
      }
    }

    let rawRankings = [];

    // --- LEVEL 1: EXAM RANKING ---
    if (level === 'exam') {
      if (!eid) return NextResponse.json({ error: 'Missing exam ID' }, { status: 400 });
      
      // Verify quiz exists and matches institution
      const qCheck = await sql`
        SELECT institution_id, leaderboard_enabled FROM "quiz" WHERE eid = ${eid}
      `;
      if (qCheck.length === 0 || qCheck[0].institution_id !== instId) {
        return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
      }
      if (isStudent && !qCheck[0].leaderboard_enabled) {
        return NextResponse.json({ error: 'Leaderboard is disabled for this exam.' }, { status: 403 });
      }

      // Query submitted attempts
      rawRankings = await sql`
        SELECT a.email, a.score, a.time_taken, u.name, u.college
        FROM "quiz_attempt" a
        JOIN "user" u ON a.email = u.email
        WHERE a.eid = ${eid} AND a.institution_id = ${instId} AND a.status IN ('SUBMITTED', 'AUTO_SUBMITTED')
        ORDER BY a.score DESC, a.time_taken ASC, a.submitted_at ASC
      `;
    } 

    // --- LEVEL 2: SUBJECT RANKING ---
    else if (level === 'subject') {
      if (!subjectId || !academicUnitId || !academicYearId) {
        return NextResponse.json({ error: 'Missing parameters for subject leaderboard.' }, { status: 400 });
      }

      // Calculate normalized score: obtained_marks / total_marks * 100 for all quizzes in this subject
      // Filter by min_qualifying_exams
      const minExams = settings.min_qualifying_exams || 3;

      rawRankings = await sql`
        WITH student_exams AS (
          SELECT h.email, h.score, q.total, q.sahi
          FROM "history" h
          JOIN "quiz" q ON h.eid = q.eid
          WHERE q.subject_id = ${subjectId} 
            AND q.academic_unit_id = ${academicUnitId} 
            AND q.academic_year_id = ${academicYearId}
            AND q.institution_id = ${instId}
        ),
        normalized_scores AS (
          SELECT email, 
                 COUNT(*) as exams_attempted,
                 AVG(score::float / (total * sahi) * 100) as avg_percentage
          FROM student_exams
          GROUP BY email
        )
        SELECT n.email, n.avg_percentage as score, 0 as time_taken, u.name, u.college
        FROM normalized_scores n
        JOIN "user" u ON n.email = u.email
        WHERE n.exams_attempted >= ${minExams}
        ORDER BY score DESC
      `;
    }

    // --- LEVEL 3: SECTION RANKING ---
    else if (level === 'section') {
      if (!sectionId || !academicYearId) {
        return NextResponse.json({ error: 'Missing parameters for section leaderboard.' }, { status: 400 });
      }

      rawRankings = await sql`
        WITH student_exams AS (
          SELECT h.email, h.score, q.total, q.sahi
          FROM "history" h
          JOIN "quiz" q ON h.eid = q.eid
          JOIN "student_enrollment" se ON h.email = se.student_id
          WHERE se.section_id = ${sectionId}
            AND q.academic_year_id = ${academicYearId}
            AND q.institution_id = ${instId}
        ),
        normalized_scores AS (
          SELECT email, 
                 AVG(score::float / (total * sahi) * 100) as avg_percentage
          FROM student_exams
          GROUP BY email
        )
        SELECT n.email, n.avg_percentage as score, 0 as time_taken, u.name, u.college
        FROM normalized_scores n
        JOIN "user" u ON n.email = u.email
        ORDER BY score DESC
      `;
    }

    // --- LEVEL 4: ACADEMIC UNIT (CLASS) RANKING ---
    else if (level === 'unit') {
      if (!academicUnitId || !academicYearId) {
        return NextResponse.json({ error: 'Missing parameters for class leaderboard.' }, { status: 400 });
      }

      rawRankings = await sql`
        WITH student_exams AS (
          SELECT h.email, h.score, q.total, q.sahi
          FROM "history" h
          JOIN "quiz" q ON h.eid = q.eid
          JOIN "student_enrollment" se ON h.email = se.student_id
          WHERE se.academic_unit_id = ${academicUnitId}
            AND q.academic_year_id = ${academicYearId}
            AND q.institution_id = ${instId}
        ),
        normalized_scores AS (
          SELECT email, 
                 AVG(score::float / (total * sahi) * 100) as avg_percentage
          FROM student_exams
          GROUP BY email
        )
        SELECT n.email, n.avg_percentage as score, 0 as time_taken, u.name, u.college
        FROM normalized_scores n
        JOIN "user" u ON n.email = u.email
        ORDER BY score DESC
      `;
    }

    // Compute competition ranking (e.g. 1, 2, 2, 4)
    let rankedList = [];
    let currentRank = 1;
    let rankIndex = 1;
    let prevScore = null;
    let prevTime = null;

    rawRankings.forEach((row, index) => {
      const score = parseFloat(row.score);
      const time = parseInt(row.time_taken);

      if (prevScore !== null) {
        if (score !== prevScore || time !== prevTime) {
          rankIndex = index + 1;
        }
      }

      prevScore = score;
      prevTime = time;

      rankedList.push({
        rank: rankIndex,
        name: row.name,
        college: row.college,
        email: row.email,
        score: Math.round(score * 100) / 100, // round to 2 decimals
        time_taken: row.time_taken
      });
    });

    // Apply visibility filter for students
    if (isStudent) {
      const visibility = settings.student_visibility || 'FULL_LEADERBOARD';
      const myRow = rankedList.find(r => r.email === session.email);
      const myRankInfo = myRow ? { rank: myRow.rank, score: myRow.score } : null;

      if (visibility === 'HIDDEN') {
        return NextResponse.json({ success: true, visibility, leaderboard: [], myRank: null });
      }

      if (visibility === 'OWN_RANK_ONLY') {
        return NextResponse.json({ success: true, visibility, leaderboard: [], myRank: myRankInfo });
      }

      if (visibility === 'TOP_N') {
        const topNLimit = settings.top_n_count || 10;
        const topNList = rankedList.slice(0, topNLimit);
        // Anonymize emails for privacy
        const filteredList = topNList.map(r => ({ rank: r.rank, name: r.name, college: r.college, score: r.score }));
        return NextResponse.json({
          success: true,
          visibility,
          leaderboard: filteredList,
          myRank: myRankInfo
        });
      }
    }

    // For Admins/Teachers or FULL_LEADERBOARD, return entire list
    // Anonymize/remove emails if student is querying to protect privacy
    const outputList = rankedList.map(r => ({
      rank: r.rank,
      name: r.name,
      college: r.college,
      score: r.score,
      time_taken: r.time_taken,
      ...(isStudent ? {} : { email: r.email }) // Only expose email to teachers/admins
    }));

    const myRow = rankedList.find(r => r.email === session.email);
    const myRankInfo = myRow ? { rank: myRow.rank, score: myRow.score } : null;

    return NextResponse.json({
      success: true,
      visibility: isStudent ? settings.student_visibility : 'FULL_LEADERBOARD',
      leaderboard: outputList,
      myRank: myRankInfo
    });
  } catch (error) {
    console.error('Dynamic leaderboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
