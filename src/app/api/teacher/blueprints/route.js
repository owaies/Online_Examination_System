import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.isSuspended) {
      return NextResponse.json({ error: 'Institution suspended' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');
    const instId = session.institution_id;

    let query = sql`
      SELECT b.id, b.name, b.subject_id, b.created_by, b.rules, s.name as subject_name
      FROM "exam_blueprint" b
      LEFT JOIN "subject" s ON b.subject_id = s.id
      WHERE b.institution_id = ${instId}
    `;

    if (subjectId) {
      query = sql`${query} AND b.subject_id = ${subjectId}`;
    }

    const blueprints = await sql`${query} ORDER BY b.name ASC`;
    return NextResponse.json({ blueprints });
  } catch (error) {
    console.error('Blueprints GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.isSuspended) {
      return NextResponse.json({ error: 'Institution suspended' }, { status: 403 });
    }

    const { name, subjectId, rules } = await req.json();

    if (!name || !subjectId || !rules) {
      return NextResponse.json({ error: 'Missing name, subjectId, or rules' }, { status: 400 });
    }

    const instId = session.institution_id;

    // IDOR check: Verify subject belongs to the same institution
    const subjectCheck = await sql`
      SELECT id FROM "subject" WHERE id = ${subjectId} AND institution_id = ${instId}
    `;
    if (subjectCheck.length === 0) {
      return NextResponse.json({ error: 'Forbidden: Subject unauthorized' }, { status: 403 });
    }

    const blueprintId = 'bp-' + Math.random().toString(36).substring(2, 11);

    await sql`
      INSERT INTO "exam_blueprint" (id, institution_id, name, subject_id, created_by, rules)
      VALUES (${blueprintId}, ${instId}, ${name.trim()}, ${subjectId}, ${session.email}, ${JSON.stringify(rules)}::jsonb)
    `;

    return NextResponse.json({ success: true, blueprintId });
  } catch (error) {
    console.error('Blueprints POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
