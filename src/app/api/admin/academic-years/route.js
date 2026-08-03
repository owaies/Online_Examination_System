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
      return NextResponse.json({ error: 'Access suspended' }, { status: 403 });
    }
    if (session.passwordChangeRequired) {
      return NextResponse.json({ error: 'Password change required' }, { status: 403 });
    }

    const instId = session.institution_id;
    const years = await sql`
      SELECT id, name, start_date, end_date, status 
      FROM "academic_year" 
      WHERE institution_id = ${instId}
      ORDER BY start_date DESC
    `;
    return NextResponse.json({ success: true, years });
  } catch (error) {
    console.error('Fetch academic years error:', error);
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
    const { name, startDate, endDate, status } = await req.json();

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 });
    }

    const yearId = Math.random().toString(36).substring(2, 15);
    const statusVal = status === 'active' ? 'active' : 'archived';

    await sql.begin(async sql => {
      if (statusVal === 'active') {
        // Enforce only one active academic year per institution
        await sql`
          UPDATE "academic_year" 
          SET status = 'archived', updated_at = NOW() 
          WHERE institution_id = ${instId} AND status = 'active'
        `;
      }

      await sql`
        INSERT INTO "academic_year" (id, institution_id, name, start_date, end_date, status)
        VALUES (${yearId}, ${instId}, ${name.trim()}, ${startDate}, ${endDate}, ${statusVal})
      `;
    });

    return NextResponse.json({ success: true, yearId });
  } catch (error) {
    console.error('Create academic year error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'An academic year with this name already exists' }, { status: 400 });
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
    if (session.isSuspended) {
      return NextResponse.json({ error: 'Access suspended' }, { status: 403 });
    }
    if (session.passwordChangeRequired) {
      return NextResponse.json({ error: 'Password change required' }, { status: 403 });
    }

    const instId = session.institution_id;
    const { id, name, startDate, endDate, status } = await req.json();

    if (!id || !name || !startDate || !endDate || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 });
    }

    // Verify ownership
    const existing = await sql`
      SELECT id FROM "academic_year" WHERE id = ${id} AND institution_id = ${instId}
    `;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Academic year not found' }, { status: 404 });
    }

    const statusVal = status === 'active' ? 'active' : 'archived';

    await sql.begin(async sql => {
      if (statusVal === 'active') {
        // Enforce only one active academic year per institution
        await sql`
          UPDATE "academic_year" 
          SET status = 'archived', updated_at = NOW() 
          WHERE institution_id = ${instId} AND status = 'active' AND id != ${id}
        `;
      }

      await sql`
        UPDATE "academic_year"
        SET name = ${name.trim()}, start_date = ${startDate}, end_date = ${endDate}, status = ${statusVal}, updated_at = NOW()
        WHERE id = ${id} AND institution_id = ${instId}
      `;
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update academic year error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'An academic year with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
