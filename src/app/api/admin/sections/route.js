import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const academicUnitId = searchParams.get('academicUnitId');
    const academicYearId = searchParams.get('academicYearId');

    if (!academicUnitId && !academicYearId) {
      return NextResponse.json({ error: 'Missing academicUnitId or academicYearId parameter' }, { status: 400 });
    }

    const instId = session.institution_id;

    if (academicUnitId) {
      // Verify unit ownership
      const unitCheck = await sql`
        SELECT id FROM "academic_unit" WHERE id = ${academicUnitId} AND institution_id = ${instId}
      `;
      if (unitCheck.length === 0) {
        return NextResponse.json({ error: 'Academic unit not found' }, { status: 404 });
      }

      const sections = await sql`
        SELECT id, name, capacity, status, academic_unit_id
        FROM "section" 
        WHERE institution_id = ${instId} AND academic_unit_id = ${academicUnitId}
        ORDER BY name ASC
      `;
      return NextResponse.json({ success: true, sections });
    } else {
      // Verify year ownership
      const yearCheck = await sql`
        SELECT id FROM "academic_year" WHERE id = ${academicYearId} AND institution_id = ${instId}
      `;
      if (yearCheck.length === 0) {
        return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });
      }

      const sections = await sql`
        SELECT id, name, capacity, status, academic_unit_id
        FROM "section" 
        WHERE institution_id = ${instId} AND academic_year_id = ${academicYearId}
        ORDER BY name ASC
      `;
      return NextResponse.json({ success: true, sections });
    }
  } catch (error) {
    console.error('Fetch sections error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const instId = session.institution_id;
    const { name, capacity, academicYearId, academicUnitId } = await req.json();

    if (!name || !academicYearId || !academicUnitId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify year ownership
    const yearCheck = await sql`
      SELECT id FROM "academic_year" WHERE id = ${academicYearId} AND institution_id = ${instId}
    `;
    if (yearCheck.length === 0) {
      return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });
    }

    // Verify unit ownership
    const unitCheck = await sql`
      SELECT id FROM "academic_unit" WHERE id = ${academicUnitId} AND institution_id = ${instId} AND academic_year_id = ${academicYearId}
    `;
    if (unitCheck.length === 0) {
      return NextResponse.json({ error: 'Academic unit not found' }, { status: 404 });
    }

    const sectionId = Math.random().toString(36).substring(2, 15);

    await sql`
      INSERT INTO "section" (id, institution_id, academic_year_id, academic_unit_id, name, capacity)
      VALUES (${sectionId}, ${instId}, ${academicYearId}, ${academicUnitId}, ${name.trim()}, ${capacity ? parseInt(capacity) : null})
    `;

    return NextResponse.json({ success: true, sectionId });
  } catch (error) {
    console.error('Create section error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A section with this name already exists in this academic unit' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing section ID' }, { status: 400 });
    }

    const instId = session.institution_id;

    // Verify ownership
    const existing = await sql`
      SELECT id FROM "section" WHERE id = ${id} AND institution_id = ${instId}
    `;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Check student enrollments linked to this section
    const enrollments = await sql`SELECT id FROM "student_enrollment" WHERE section_id = ${id}`;
    if (enrollments.length > 0) {
      return NextResponse.json({ error: 'Cannot delete section because students are enrolled in it.' }, { status: 400 });
    }

    // Check teacher assignments linked to this section
    const teacherAssign = await sql`SELECT id FROM "teacher_assignment" WHERE section_id = ${id}`;
    if (teacherAssign.length > 0) {
      return NextResponse.json({ error: 'Cannot delete section because teachers are assigned to it.' }, { status: 400 });
    }

    // Check quizzes linked to this section
    const quizzes = await sql`SELECT eid FROM "quiz" WHERE section_id = ${id}`;
    if (quizzes.length > 0) {
      return NextResponse.json({ error: 'Cannot delete section because quizzes are assigned to it.' }, { status: 400 });
    }

    await sql`DELETE FROM "section" WHERE id = ${id} AND institution_id = ${instId}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete section error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
