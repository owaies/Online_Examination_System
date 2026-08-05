import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.isSuspended) {
      return NextResponse.json({ error: "Your institution's E-Examiner access is currently suspended." }, { status: 403 });
    }

    const instId = session.institution_id;

    // Fetch settings
    let settingsResult = await sql`
      SELECT * FROM "institution_setting" WHERE institution_id = ${instId}
    `;

    if (settingsResult.length === 0) {
      // Create defaults if not present
      await sql`
        INSERT INTO "institution_setting" (institution_id, timezone, leaderboard_enabled, student_visibility)
        VALUES (${instId}, 'Asia/Kolkata', TRUE, 'FULL_LEADERBOARD')
      `;
      settingsResult = await sql`
        SELECT * FROM "institution_setting" WHERE institution_id = ${instId}
      `;
    }

    return NextResponse.json({ success: true, settings: settingsResult[0] });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.isSuspended) {
      return NextResponse.json({ error: "Your institution's E-Examiner access is currently suspended." }, { status: 403 });
    }

    const instId = session.institution_id;
    const body = await req.json();

    const {
      timezone,
      leaderboard_enabled,
      leaderboard_level_exam,
      leaderboard_level_subject,
      leaderboard_level_section,
      leaderboard_level_unit,
      student_visibility,
      top_n_count,
      min_qualifying_exams,
      multiple_attempts_rule
    } = body;

    // Upsert the configuration details
    await sql`
      INSERT INTO "institution_setting" (
        institution_id, timezone, leaderboard_enabled, 
        leaderboard_level_exam, leaderboard_level_subject, 
        leaderboard_level_section, leaderboard_level_unit, 
        student_visibility, top_n_count, min_qualifying_exams, 
        multiple_attempts_rule
      )
      VALUES (
        ${instId}, 
        COALESCE(${timezone || null}, 'Asia/Kolkata'), 
        COALESCE(${leaderboard_enabled}, TRUE), 
        COALESCE(${leaderboard_level_exam}, TRUE), 
        COALESCE(${leaderboard_level_subject}, TRUE), 
        COALESCE(${leaderboard_level_section}, TRUE), 
        COALESCE(${leaderboard_level_unit}, TRUE), 
        COALESCE(${student_visibility || null}, 'FULL_LEADERBOARD'), 
        COALESCE(${top_n_count ? parseInt(top_n_count) : null}, 10), 
        COALESCE(${min_qualifying_exams ? parseInt(min_qualifying_exams) : null}, 3), 
        COALESCE(${multiple_attempts_rule || null}, 'BEST_ATTEMPT')
      )
      ON CONFLICT (institution_id) DO UPDATE SET
        timezone = EXCLUDED.timezone,
        leaderboard_enabled = EXCLUDED.leaderboard_enabled,
        leaderboard_level_exam = EXCLUDED.leaderboard_level_exam,
        leaderboard_level_subject = EXCLUDED.leaderboard_level_subject,
        leaderboard_level_section = EXCLUDED.leaderboard_level_section,
        leaderboard_level_unit = EXCLUDED.leaderboard_level_unit,
        student_visibility = EXCLUDED.student_visibility,
        top_n_count = EXCLUDED.top_n_count,
        min_qualifying_exams = EXCLUDED.min_qualifying_exams,
        multiple_attempts_rule = EXCLUDED.multiple_attempts_rule
    `;

    return NextResponse.json({ success: true, message: 'Settings updated successfully.' });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
