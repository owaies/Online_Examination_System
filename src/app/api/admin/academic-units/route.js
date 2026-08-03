import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Check if parentId would cause circular dependency if linked to unitId
async function checkCircular(parentId, unitId) {
  if (!parentId) return false;
  if (parentId === unitId) return true;
  let currentId = parentId;
  const visited = new Set();
  while (currentId) {
    if (visited.has(currentId)) return true;
    visited.add(currentId);
    const parentUnit = await sql`SELECT parent_id FROM "academic_unit" WHERE id = ${currentId}`;
    if (parentUnit.length === 0) break;
    currentId = parentUnit[0].parent_id;
    if (currentId === unitId) return true;
  }
  return false;
}

export async function GET(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.isSuspended) {
      return NextResponse.json({ error: 'Access suspended' }, { status: 403 });
    }
    if (session.passwordChangeRequired) {
      return NextResponse.json({ error: 'Password change required' }, { status: 403 });
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

    const units = await sql`
      SELECT id, name, type, parent_id, display_order, status 
      FROM "academic_unit" 
      WHERE institution_id = ${instId} AND academic_year_id = ${academicYearId}
      ORDER BY display_order ASC, name ASC
    `;
    return NextResponse.json({ success: true, units });
  } catch (error) {
    console.error('Fetch academic units error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.isSuspended) {
      return NextResponse.json({ error: 'Access suspended' }, { status: 403 });
    }
    if (session.passwordChangeRequired) {
      return NextResponse.json({ error: 'Password change required' }, { status: 403 });
    }

    const instId = session.institution_id;
    const body = await req.json();

    const { name, type, academicYearId, parentId, displayOrder, presetUnits } = body;

    if (!academicYearId) {
      return NextResponse.json({ error: 'Missing academicYearId' }, { status: 400 });
    }

    // Verify year ownership
    const yearCheck = await sql`
      SELECT id FROM "academic_year" WHERE id = ${academicYearId} AND institution_id = ${instId}
    `;
    if (yearCheck.length === 0) {
      return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });
    }

    // Support preset batch insertions
    if (presetUnits && Array.isArray(presetUnits)) {
      await sql.begin(async sql => {
        // Map temporary IDs to generated database IDs
        const idMap = {};
        for (const u of presetUnits) {
          const newId = Math.random().toString(36).substring(2, 15);
          idMap[u.tempId] = newId;

          // Find correct parent ID (could be another newly created preset unit, or existing)
          const actualParentId = u.parentTempId ? idMap[u.parentTempId] : (u.parentId || null);

          await sql`
            INSERT INTO "academic_unit" (id, institution_id, academic_year_id, parent_id, name, type, display_order)
            VALUES (${newId}, ${instId}, ${academicYearId}, ${actualParentId}, ${u.name.trim()}, ${u.type}, ${u.displayOrder || 0})
          `;
        }
      });
      return NextResponse.json({ success: true });
    }

    // Single unit insertion
    if (!name || !type) {
      return NextResponse.json({ error: 'Missing name or type' }, { status: 400 });
    }

    if (parentId) {
      const parentCheck = await sql`
        SELECT id FROM "academic_unit" WHERE id = ${parentId} AND institution_id = ${instId}
      `;
      if (parentCheck.length === 0) {
        return NextResponse.json({ error: 'Parent unit not found' }, { status: 404 });
      }
    }

    const unitId = Math.random().toString(36).substring(2, 15);

    await sql`
      INSERT INTO "academic_unit" (id, institution_id, academic_year_id, parent_id, name, type, display_order)
      VALUES (${unitId}, ${instId}, ${academicYearId}, ${parentId || null}, ${name.trim()}, ${type}, ${displayOrder || 0})
    `;

    return NextResponse.json({ success: true, unitId });
  } catch (error) {
    console.error('Create academic unit error:', error);
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
    const { id, name, type, parentId, displayOrder, status } = await req.json();

    if (!id || !name || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify ownership
    const existing = await sql`
      SELECT id, parent_id FROM "academic_unit" WHERE id = ${id} AND institution_id = ${instId}
    `;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Academic unit not found' }, { status: 404 });
    }

    if (parentId) {
      const parentCheck = await sql`
        SELECT id FROM "academic_unit" WHERE id = ${parentId} AND institution_id = ${instId}
      `;
      if (parentCheck.length === 0) {
        return NextResponse.json({ error: 'Parent unit not found' }, { status: 404 });
      }

      // Prevent circular relationship
      const isCircular = await checkCircular(parentId, id);
      if (isCircular) {
        return NextResponse.json({ error: 'Circular parent relationship detected' }, { status: 400 });
      }
    }

    await sql`
      UPDATE "academic_unit"
      SET name = ${name.trim()}, type = ${type}, parent_id = ${parentId || null}, display_order = ${displayOrder || 0}, status = ${status || 'active'}, updated_at = NOW()
      WHERE id = ${id} AND institution_id = ${instId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update academic unit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.isSuspended) {
      return NextResponse.json({ error: 'Access suspended' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing academic unit ID' }, { status: 400 });
    }

    const instId = session.institution_id;

    // Verify ownership
    const existing = await sql`
      SELECT id FROM "academic_unit" WHERE id = ${id} AND institution_id = ${instId}
    `;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Academic unit not found' }, { status: 404 });
    }

    // 1. Check if unit has child units
    const children = await sql`SELECT id FROM "academic_unit" WHERE parent_id = ${id}`;
    if (children.length > 0) {
      return NextResponse.json({ error: 'Cannot delete unit because it has child units. Delete the children first.' }, { status: 400 });
    }

    // 2. Check if unit has sections
    const sections = await sql`SELECT id FROM "section" WHERE academic_unit_id = ${id}`;
    if (sections.length > 0) {
      return NextResponse.json({ error: 'Cannot delete unit because sections are linked to it.' }, { status: 400 });
    }

    // 3. Check if unit has teacher assignments
    const teacherAssign = await sql`SELECT id FROM "teacher_assignment" WHERE academic_unit_id = ${id}`;
    if (teacherAssign.length > 0) {
      return NextResponse.json({ error: 'Cannot delete unit because teachers are assigned to it.' }, { status: 400 });
    }

    // 4. Check if unit has student enrollments
    const enrollments = await sql`SELECT id FROM "student_enrollment" WHERE academic_unit_id = ${id}`;
    if (enrollments.length > 0) {
      return NextResponse.json({ error: 'Cannot delete unit because students are enrolled in it.' }, { status: 400 });
    }

    // 5. Check if unit has quizzes
    const quizzes = await sql`SELECT eid FROM "quiz" WHERE academic_unit_id = ${id}`;
    if (quizzes.length > 0) {
      return NextResponse.json({ error: 'Cannot delete unit because quizzes are assigned to it.' }, { status: 400 });
    }

    await sql`DELETE FROM "academic_unit" WHERE id = ${id} AND institution_id = ${instId}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete academic unit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
