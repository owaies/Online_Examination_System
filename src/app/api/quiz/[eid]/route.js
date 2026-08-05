import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.isSuspended) {
      return NextResponse.json({ error: "Your institution's E-Examiner access is currently suspended." }, { status: 403 });
    }

    const { eid } = await params;
    const email = session.email;
    const instId = session.institution_id;

    // Fetch quiz info and verify tenant isolation
    const quizResult = await sql`
      SELECT eid, title, description, time, total, sahi, wrong, max_attempts, 
             scheduled_start, scheduled_end, shuffle_questions, shuffle_options, 
             show_result, show_correct_answers, leaderboard_enabled, quiz_status, institution_id, academic_year_id, academic_unit_id, section_id
      FROM "quiz" 
      WHERE eid = ${eid}
    `;

    if (quizResult.length === 0) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    const quiz = quizResult[0];
    if (quiz.institution_id !== instId) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    // Verify Active Enrollment
    const enrollment = await sql`
      SELECT academic_year_id, academic_unit_id, section_id
      FROM "student_enrollment"
      WHERE student_id = ${email} AND institution_id = ${instId} AND status = 'active'
      LIMIT 1
    `;
    if (enrollment.length === 0) {
      return NextResponse.json({ error: 'Forbidden: You have no active enrollment.' }, { status: 403 });
    }

    const activeEnroll = enrollment[0];
    if (activeEnroll.academic_year_id !== quiz.academic_year_id || activeEnroll.academic_unit_id !== quiz.academic_unit_id) {
      return NextResponse.json({ error: 'Forbidden: This exam is not for your class.' }, { status: 403 });
    }
    if (quiz.section_id && activeEnroll.section_id !== quiz.section_id) {
      return NextResponse.json({ error: 'Forbidden: This exam is restricted to another section.' }, { status: 403 });
    }

    // Verify Scheduling
    const now = new Date();
    if (quiz.scheduled_start && now < new Date(quiz.scheduled_start)) {
      return NextResponse.json({ error: 'This exam has not started yet.' }, { status: 403 });
    }
    if (quiz.scheduled_end && now > new Date(quiz.scheduled_end)) {
      return NextResponse.json({ error: 'This exam has already ended.' }, { status: 403 });
    }
    if (quiz.quiz_status === 'DRAFT') {
      return NextResponse.json({ error: 'This exam is not published.' }, { status: 403 });
    }

    // Check attempts limit
    const attempts = await sql`
      SELECT COUNT(*) as count FROM "quiz_attempt"
      WHERE eid = ${eid} AND email = ${email} AND status = 'SUBMITTED'
    `;
    const attemptCount = parseInt(attempts[0]?.count || '0');
    if (attemptCount >= (quiz.max_attempts || 1)) {
      return NextResponse.json({ error: 'Maximum attempt limit reached for this exam.' }, { status: 403 });
    }

    // Check if there is an active in-progress attempt
    const activeAttempt = await sql`
      SELECT id, question_set FROM "quiz_attempt"
      WHERE eid = ${eid} AND email = ${email} AND status = 'IN_PROGRESS'
      LIMIT 1
    `;

    let structuredQuestions = [];

    if (activeAttempt.length > 0 && activeAttempt[0].question_set) {
      // Load questions from the attempt's snapshotted/randomized question_set
      const fullQuestionSet = activeAttempt[0].question_set || [];
      
      // Strip correct answers and explanations for exam room security
      structuredQuestions = fullQuestionSet.map((q, idx) => {
        const { correct_ansid, explanation, ...clientSafeQuestion } = q;
        
        // Shuffle options if enabled
        let qOpts = clientSafeQuestion.options || [];
        if (quiz.shuffle_options) {
          qOpts = [...qOpts].sort(() => Math.random() - 0.5);
        }
        
        return {
          ...clientSafeQuestion,
          sn: idx + 1,
          options: qOpts
        };
      });

      if (quiz.shuffle_questions) {
        structuredQuestions = structuredQuestions.sort(() => Math.random() - 0.5);
      }
    } else {
      // If no active attempt started, do not return questions (Start Screen view)
      structuredQuestions = [];
    }

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
  // Legacy handler fallback (redirect/rewrite logic to attempts endpoint)
  try {
    const { eid } = await params;
    const session = await getSession();
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.email;
    const instId = session.institution_id;

    // Check if there is an in-progress attempt we can submit
    const activeAttempt = await sql`
      SELECT id FROM "quiz_attempt"
      WHERE eid = ${eid} AND email = ${email} AND status = 'IN_PROGRESS'
      LIMIT 1
    `;

    if (activeAttempt.length === 0) {
      return NextResponse.json({ error: 'No active attempt found to submit.' }, { status: 400 });
    }

    // Rewrite this post call internally to submit attempt
    const body = await req.json();
    const mockReq = {
      json: async () => body
    };

    const submitUrl = new URL(`/api/student/attempts/${activeAttempt[0].id}`, 'http://localhost');
    const { POST: submitHandler } = await import('../../student/attempts/[id]/route.js');
    return await submitHandler(mockReq, { params: { id: activeAttempt[0].id } });
  } catch (error) {
    console.error('Legacy submission redirect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
