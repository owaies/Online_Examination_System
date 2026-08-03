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
    const academicUnitId = searchParams.get('academicUnitId');
    const sectionId = searchParams.get('sectionId');

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

    let query = sql`
      SELECT se.id, se.student_id, se.roll_number, se.status, 
             u.name as student_name, au.name as unit_name, sec.name as section_name
      FROM "student_enrollment" se
      JOIN "user" u ON se.student_id = u.email
      JOIN "academic_unit" au ON se.academic_unit_id = au.id
      LEFT JOIN "section" sec ON se.section_id = sec.id
      WHERE se.institution_id = ${instId} AND se.academic_year_id = ${academicYearId}
    `;

    if (academicUnitId) {
      query = sql`${query} AND se.academic_unit_id = ${academicUnitId}`;
    }
    if (sectionId) {
      query = sql`${query} AND se.section_id = ${sectionId}`;
    }

    query = sql`${query} ORDER BY u.name ASC`;

    const enrollments = await query;
    return NextResponse.json({ success: true, enrollments });
  } catch (error) {
    console.error('Fetch student enrollments error:', error);
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
    const { studentIds, academicYearId, academicUnitId, sectionId } = await req.json();

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0 || !academicYearId || !academicUnitId) {
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

    // Verify section ownership if provided
    if (sectionId) {
      const sectionCheck = await sql`
        SELECT id FROM "section" WHERE id = ${sectionId} AND institution_id = ${instId} AND academic_unit_id = ${academicUnitId}
      `;
      if (sectionCheck.length === 0) {
        return NextResponse.json({ error: 'Section not found' }, { status: 400 });
      }
    }

    await sql.begin(async sql => {
      for (const studentId of studentIds) {
        // Verify student exists and belongs to same institution
        const studentCheck = await sql`
          SELECT email FROM "user" WHERE email = ${studentId} AND institution_id = ${instId}
        `;
        if (studentCheck.length > 0) {
          const enrollId = Math.random().toString(36).substring(2, 15);
          
          // Upsert enrollment for this year
          await sql`
            INSERT INTO "student_enrollment" (id, institution_id, academic_year_id, student_id, academic_unit_id, section_id)
            VALUES (${enrollId}, ${instId}, ${academicYearId}, ${studentId}, ${academicUnitId}, ${sectionId || null})
            ON CONFLICT (academic_year_id, student_id) 
            DO UPDATE SET academic_unit_id = ${academicUnitId}, section_id = ${sectionId || null}, updated_at = NOW()
          `;
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bulk student enrollment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
