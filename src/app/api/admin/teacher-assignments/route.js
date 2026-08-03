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

    const assignments = await sql`
      SELECT ta.id, ta.teacher_id, ta.academic_unit_id, ta.section_id, ta.subject_id, 
             au.name as unit_name, s.name as subject_name, sec.name as section_name
      FROM "teacher_assignment" ta
      JOIN "academic_unit" au ON ta.academic_unit_id = au.id
      LEFT JOIN "section" sec ON ta.section_id = sec.id
      JOIN "subject" s ON ta.subject_id = s.id
      WHERE ta.institution_id = ${instId} AND ta.academic_year_id = ${academicYearId}
      ORDER BY ta.teacher_id ASC, au.name ASC, sec.name ASC
    `;

    return NextResponse.json({ success: true, assignments });
  } catch (error) {
    console.error('Fetch teacher assignments error:', error);
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
    const { teacherId, academicYearId, academicUnitId, sectionId, subjectId } = await req.json();

    if (!teacherId || !academicYearId || !academicUnitId || !subjectId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify teacher exists in institution and has admin/teacher role
    const teacherCheck = await sql`
      SELECT email FROM "admin" WHERE email = ${teacherId} AND institution_id = ${instId} AND role = 'admin'
    `;
    if (teacherCheck.length === 0) {
      return NextResponse.json({ error: 'Teacher not found or unauthorized' }, { status: 400 });
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

    // Verify section association if provided
    if (sectionId) {
      const sectionCheck = await sql`
        SELECT id FROM "section" WHERE id = ${sectionId} AND institution_id = ${instId} AND academic_unit_id = ${academicUnitId}
      `;
      if (sectionCheck.length === 0) {
        return NextResponse.json({ error: 'Section not found or does not belong to the selected academic unit' }, { status: 400 });
      }
    }

    // Verify subject association
    const subjectCheck = await sql`
      SELECT id FROM "subject" WHERE id = ${subjectId} AND institution_id = ${instId} AND academic_year_id = ${academicYearId}
    `;
    if (subjectCheck.length === 0) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    // Check duplicate assignment
    const duplicateCheck = await sql`
      SELECT id FROM "teacher_assignment" 
      WHERE teacher_id = ${teacherId} AND academic_year_id = ${academicYearId} AND academic_unit_id = ${academicUnitId} 
        AND (section_id = ${sectionId || null} OR (section_id IS NULL AND ${sectionId || null} IS NULL)) AND subject_id = ${subjectId}
    `;
    if (duplicateCheck.length > 0) {
      return NextResponse.json({ error: 'Teacher assignment already exists' }, { status: 400 });
    }

    const assignId = Math.random().toString(36).substring(2, 15);

    await sql`
      INSERT INTO "teacher_assignment" (id, institution_id, academic_year_id, teacher_id, academic_unit_id, section_id, subject_id)
      VALUES (${assignId}, ${instId}, ${academicYearId}, ${teacherId}, ${academicUnitId}, ${sectionId || null}, ${subjectId})
    `;

    return NextResponse.json({ success: true, assignId });
  } catch (error) {
    console.error('Create teacher assignment error:', error);
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
      return NextResponse.json({ error: 'Missing assignment ID' }, { status: 400 });
    }

    const instId = session.institution_id;

    // Verify ownership
    const existing = await sql`
      SELECT id FROM "teacher_assignment" WHERE id = ${id} AND institution_id = ${instId}
    `;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Teacher assignment not found' }, { status: 404 });
    }

    await sql`DELETE FROM "teacher_assignment" WHERE id = ${id} AND institution_id = ${instId}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete teacher assignment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
