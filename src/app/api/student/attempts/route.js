import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eid = searchParams.get('eid');
    if (!eid) {
      return NextResponse.json({ error: 'Missing quiz ID' }, { status: 400 });
    }

    const email = session.email;
    const instId = session.institution_id;

    // Fetch attempts
    const attempts = await sql`
      SELECT id, attempt_number, started_at, submitted_at, status, score, sahi, wrong, time_taken
      FROM "quiz_attempt"
      WHERE eid = ${eid} AND email = ${email} AND institution_id = ${instId}
      ORDER BY attempt_number ASC
    `;

    return NextResponse.json({ success: true, attempts });
  } catch (error) {
    console.error('Fetch attempts error:', error);
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
      return NextResponse.json({ error: "Your institution's E-Examiner access is currently suspended." }, { status: 403 });
    }

    const { eid } = await req.json();
    if (!eid) {
      return NextResponse.json({ error: 'Missing quiz ID' }, { status: 400 });
    }

    const email = session.email;
    const instId = session.institution_id;

    // 1. Fetch quiz details
    const quizResult = await sql`
      SELECT eid, title, time, total, max_attempts, scheduled_start, scheduled_end, institution_id, academic_year_id, academic_unit_id, section_id, quiz_status,
             selection_mode, pool_id, blueprint_id, subject_id
      FROM "quiz"
      WHERE eid = ${eid}
    `;
    if (quizResult.length === 0) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    const quiz = quizResult[0];

    // Tenant Isolation
    if (quiz.institution_id !== instId) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    // 2. Validate Student active enrollment
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

    // 3. Verify Exam scheduling
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

    // 4. Check Attempt limit
    const attemptsResult = await sql`
      SELECT COUNT(*) as count FROM "quiz_attempt"
      WHERE eid = ${eid} AND email = ${email} AND institution_id = ${instId}
    `;
    const attemptCount = parseInt(attemptsResult[0]?.count || '0');
    if (attemptCount >= (quiz.max_attempts || 1)) {
      return NextResponse.json({ error: 'Maximum attempt limit reached for this exam.' }, { status: 403 });
    }

    // Check if there is an in-progress attempt that can be resumed
    const activeAttempt = await sql`
      SELECT id, attempt_number, started_at, answers
      FROM "quiz_attempt"
      WHERE eid = ${eid} AND email = ${email} AND status = 'IN_PROGRESS'
      LIMIT 1
    `;

    if (activeAttempt.length > 0) {
      return NextResponse.json({
        success: true,
        attempt: activeAttempt[0],
        message: 'Resuming active attempt.'
      });
    }

    // 5. Generate randomized/snapshotted question set
    let questionSet = [];
    
    if (quiz.selection_mode === 'RANDOM_SET_PER_STUDENT' || quiz.blueprint_id || quiz.pool_id) {
      let poolQids = null;
      if (quiz.pool_id) {
        const poolMapping = await sql`SELECT qid FROM "pool_question" WHERE pool_id = ${quiz.pool_id}`;
        poolQids = poolMapping.map(m => m.qid);
        if (poolQids.length === 0) {
          return NextResponse.json({ error: 'Question pool is empty.' }, { status: 400 });
        }
      }

      let eligibleQuery = sql`
        SELECT q.qid, q.qns, q.marks, q.difficulty, q.explanation, q.tags, q.topic_id,
               (SELECT JSON_AGG(JSON_BUILD_OBJECT('optionid', o.optionid, 'option', o.option)) FROM "options" o WHERE o.qid = q.qid) as options,
               (SELECT a.ansid FROM "answer" a WHERE a.qid = q.qid LIMIT 1) as correct_ansid
        FROM "questions" q
        WHERE q.eid IS NULL AND q.institution_id = ${instId} AND q.subject_id = ${quiz.subject_id} AND q.status = 'ACTIVE'
      `;

      if (poolQids && poolQids.length > 0) {
        eligibleQuery = sql`${eligibleQuery} AND q.qid IN (${poolQids})`;
      }

      const allEligible = await sql`${eligibleQuery}`;

      if (quiz.blueprint_id) {
        const blueprintResult = await sql`SELECT rules FROM "exam_blueprint" WHERE id = ${quiz.blueprint_id}`;
        if (blueprintResult.length === 0) {
          return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
        }
        const rules = blueprintResult[0].rules || {};
        
        const easyCount = parseInt(rules.easy || '0');
        const mediumCount = parseInt(rules.medium || '0');
        const hardCount = parseInt(rules.hard || '0');

        const easyQs = allEligible.filter(q => q.difficulty === 'EASY').sort(() => Math.random() - 0.5);
        const mediumQs = allEligible.filter(q => q.difficulty === 'MEDIUM').sort(() => Math.random() - 0.5);
        const hardQs = allEligible.filter(q => q.difficulty === 'HARD').sort(() => Math.random() - 0.5);

        if (easyQs.length < easyCount || mediumQs.length < mediumCount || hardQs.length < hardCount) {
          return NextResponse.json({ error: `Not enough matching questions in Question Bank. Needs: ${easyCount} Easy, ${mediumCount} Medium, ${hardCount} Hard.` }, { status: 400 });
        }

        questionSet = [
          ...easyQs.slice(0, easyCount),
          ...mediumQs.slice(0, mediumCount),
          ...hardQs.slice(0, hardCount)
        ];
      } else {
        const randomized = allEligible.sort(() => Math.random() - 0.5);
        if (randomized.length < quiz.total) {
          return NextResponse.json({ error: `Not enough questions in pool. Required: ${quiz.total}, Available: ${randomized.length}` }, { status: 400 });
        }
        questionSet = randomized.slice(0, quiz.total);
      }
    } else {
      const quizQuestions = await sql`
        SELECT q.qid, q.qns, q.marks, q.difficulty, q.explanation, q.tags, q.topic_id,
               (SELECT JSON_AGG(JSON_BUILD_OBJECT('optionid', o.optionid, 'option', o.option)) FROM "options" o WHERE o.qid = q.qid) as options,
               (SELECT a.ansid FROM "answer" a WHERE a.qid = q.qid LIMIT 1) as correct_ansid
        FROM "questions" q
        WHERE q.eid = ${eid}
        ORDER BY q.sn ASC
      `;
      questionSet = quizQuestions;
    }

    // 6. Create new attempt
    const attemptId = 'att-' + Math.random().toString(36).substring(2, 15);
    const newAttemptNumber = attemptCount + 1;

    const insertResult = await sql`
      INSERT INTO "quiz_attempt" (id, institution_id, eid, email, attempt_number, status, started_at, question_set)
      VALUES (${attemptId}, ${instId}, ${eid}, ${email}, ${newAttemptNumber}, 'IN_PROGRESS', NOW(), ${JSON.stringify(questionSet)}::jsonb)
      RETURNING id, attempt_number, started_at
    `;

    return NextResponse.json({
      success: true,
      attempt: insertResult[0],
      message: 'New attempt started.'
    });
  } catch (error) {
    console.error('Create attempt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
