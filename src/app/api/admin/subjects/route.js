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
    const academicYearId = searchParams.get('academicYearId');
    if (!academicYearId) {
      return NextResponse.json({ error: 'Missing academicYearId parameter' }, { status: 400 });
    }

    const instId = session.institution_id;

    // Verify year ownership
    const yearCheck = await sql`
      SELECT id FROM "academic_year" WHERE id = ${academicYearId} AND institution_id = ${instId}
    `;
    if (yearCheck.length === 0) {
      return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });
    }

    // Fetch subjects and aggregated unit IDs mapped to them
    const subjects = await sql`
      SELECT s.id, s.name, s.code, s.description, s.status,
             COALESCE(json_agg(aus.academic_unit_id) FILTER (WHERE aus.academic_unit_id IS NOT NULL), '[]'::json) as mapped_units
      FROM "subject" s
      LEFT JOIN "academic_unit_subject" aus ON s.id = aus.subject_id
      WHERE s.institution_id = ${instId} AND s.academic_year_id = ${academicYearId}
      GROUP BY s.id
      ORDER BY s.name ASC
    `;

    return NextResponse.json({ success: true, subjects });
  } catch (error) {
    console.error('Fetch subjects error:', error);
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
    const { name, code, description, academicYearId, academicUnitIds } = await req.json();

    if (!name || !academicYearId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify year ownership
    const yearCheck = await sql`
      SELECT id FROM "academic_year" WHERE id = ${academicYearId} AND institution_id = ${instId}
    `;
    if (yearCheck.length === 0) {
      return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });
    }

    const subjectId = Math.random().toString(36).substring(2, 15);

    await sql.begin(async sql => {
      // 1. Insert subject
      await sql`
        INSERT INTO "subject" (id, institution_id, academic_year_id, name, code, description)
        VALUES (${subjectId}, ${instId}, ${academicYearId}, ${name.trim()}, ${code ? code.trim() : null}, ${description || null})
      `;

      // 2. Insert unit mappings if provided
      if (academicUnitIds && Array.isArray(academicUnitIds)) {
        for (const unitId of academicUnitIds) {
          // Verify unit exists in same institution/year
          const unitCheck = await sql`
            SELECT id FROM "academic_unit" WHERE id = ${unitId} AND institution_id = ${instId} AND academic_year_id = ${academicYearId}
          `;
          if (unitCheck.length > 0) {
            await sql`
              INSERT INTO "academic_unit_subject" (institution_id, academic_year_id, academic_unit_id, subject_id)
              VALUES (${instId}, ${academicYearId}, ${unitId}, ${subjectId})
            `;
          }
        }
      }
    });

    return NextResponse.json({ success: true, subjectId });
  } catch (error) {
    console.error('Create subject error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A subject with this name already exists in this academic year' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const instId = session.institution_id;
    const { id, name, code, description, academicUnitIds } = await req.json();

    if (!id || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify ownership
    const existing = await sql`
      SELECT id, academic_year_id FROM "subject" WHERE id = ${id} AND institution_id = ${instId}
    `;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    const academicYearId = existing[0].academic_year_id;

    await sql.begin(async sql => {
      // 1. Update subject details
      await sql`
        UPDATE "subject"
        SET name = ${name.trim()}, code = ${code ? code.trim() : null}, description = ${description || null}, updated_at = NOW()
        WHERE id = ${id} AND institution_id = ${instId}
      `;

      // 2. Clear existing unit mappings
      await sql`
        DELETE FROM "academic_unit_subject" WHERE subject_id = ${id}
      `;

      // 3. Insert updated unit mappings
      if (academicUnitIds && Array.isArray(academicUnitIds)) {
        for (const unitId of academicUnitIds) {
          const unitCheck = await sql`
            SELECT id FROM "academic_unit" WHERE id = ${unitId} AND institution_id = ${instId} AND academic_year_id = ${academicYearId}
          `;
          if (unitCheck.length > 0) {
            await sql`
              INSERT INTO "academic_unit_subject" (institution_id, academic_year_id, academic_unit_id, subject_id)
              VALUES (${instId}, ${academicYearId}, ${unitId}, ${id})
            `;
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update subject error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A subject with this name already exists in this academic year' }, { status: 400 });
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
      return NextResponse.json({ error: 'Missing subject ID' }, { status: 400 });
    }

    const instId = session.institution_id;

    // Verify ownership
    const existing = await sql`
      SELECT id FROM "subject" WHERE id = ${id} AND institution_id = ${instId}
    `;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    // Check teacher assignments linked to this subject
    const teacherAssign = await sql`SELECT id FROM "teacher_assignment" WHERE subject_id = ${id}`;
    if (teacherAssign.length > 0) {
      return NextResponse.json({ error: 'Cannot delete subject because teachers are assigned to it.' }, { status: 400 });
    }

    // Check quizzes linked to this subject
    const quizzes = await sql`SELECT eid FROM "quiz" WHERE subject_id = ${id}`;
    if (quizzes.length > 0) {
      return NextResponse.json({ error: 'Cannot delete subject because quizzes are assigned to it.' }, { status: 400 });
    }

    await sql.begin(async sql => {
      await sql`DELETE FROM "academic_unit_subject" WHERE subject_id = ${id}`;
      await sql`DELETE FROM "subject" WHERE id = ${id} AND institution_id = ${instId}`;
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete subject error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
