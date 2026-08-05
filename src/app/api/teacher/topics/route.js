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

    if (!subjectId) {
      return NextResponse.json({ error: 'subjectId is required' }, { status: 400 });
    }

    // Verify subject belongs to the same institution (IDOR protection)
    const subjectCheck = await sql`
      SELECT id FROM "subject" 
      WHERE id = ${subjectId} AND institution_id = ${session.institution_id}
    `;
    if (subjectCheck.length === 0) {
      return NextResponse.json({ error: 'Forbidden: Subject not found or unauthorized' }, { status: 403 });
    }

    // Fetch all topics and subtopics
    const topics = await sql`
      SELECT id, name, parent_id 
      FROM "topic"
      WHERE institution_id = ${session.institution_id} AND subject_id = ${subjectId}
      ORDER BY name ASC
    `;

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Topics GET error:', error);
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

    const { subjectId, name, parentId } = await req.json();

    if (!subjectId || !name) {
      return NextResponse.json({ error: 'subjectId and name are required' }, { status: 400 });
    }

    // Verify subject belongs to the same institution (IDOR protection)
    const subjectCheck = await sql`
      SELECT id FROM "subject" 
      WHERE id = ${subjectId} AND institution_id = ${session.institution_id}
    `;
    if (subjectCheck.length === 0) {
      return NextResponse.json({ error: 'Forbidden: Subject not found or unauthorized' }, { status: 403 });
    }

    // If parentId is specified, check if the parent topic exists in the same subject/institution context
    if (parentId) {
      const parentCheck = await sql`
        SELECT id FROM "topic"
        WHERE id = ${parentId} AND institution_id = ${session.institution_id} AND subject_id = ${subjectId}
      `;
      if (parentCheck.length === 0) {
        return NextResponse.json({ error: 'Invalid parent topic ID' }, { status: 400 });
      }
    }

    const id = 'top-' + Math.random().toString(36).substring(2, 11);

    await sql`
      INSERT INTO "topic" (id, institution_id, subject_id, name, parent_id)
      VALUES (${id}, ${session.institution_id}, ${subjectId}, ${name.trim()}, ${parentId || null})
    `;

    return NextResponse.json({ success: true, topicId: id });
  } catch (error) {
    console.error('Topics POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
