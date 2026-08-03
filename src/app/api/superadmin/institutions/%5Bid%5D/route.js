import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const instResult = await sql`
      SELECT id, name, institution_code, institution_type, email, phone, website, address, logo_url, status, created_at
      FROM "institution"
      WHERE id = ${id}
    `;

    if (instResult.length === 0) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    const inst = instResult[0];

    // Fetch institution-specific counts
    const teachersCount = await sql`
      SELECT COUNT(*) as count FROM "admin" WHERE role = 'admin' AND institution_id = ${id}
    `;
    const studentsCount = await sql`
      SELECT COUNT(*) as count FROM "user" WHERE institution_id = ${id}
    `;
    const quizzesCount = await sql`
      SELECT COUNT(*) as count FROM "quiz" WHERE institution_id = ${id}
    `;

    // Fetch the admin email for this institution
    const adminUser = await sql`
      SELECT email FROM "admin" WHERE role = 'head' AND institution_id = ${id}
      LIMIT 1
    `;

    return NextResponse.json({
      success: true,
      institution: inst,
      adminEmail: adminUser[0]?.email || 'N/A',
      stats: {
        teachersCount: parseInt(teachersCount[0].count),
        studentsCount: parseInt(studentsCount[0].count),
        quizzesCount: parseInt(quizzesCount[0].count)
      }
    });
  } catch (error) {
    console.error('Superadmin institution details GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const { status, name, phone, website, address, logoUrl } = body;

    const instCheck = await sql`SELECT id FROM "institution" WHERE id = ${id}`;
    if (instCheck.length === 0) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    // Dynamic field updates
    await sql`
      UPDATE "institution"
      SET 
        status = COALESCE(${status || null}, status),
        name = COALESCE(${name || null}, name),
        phone = COALESCE(${phone || null}, phone),
        website = COALESCE(${website || null}, website),
        address = COALESCE(${address || null}, address),
        logo_url = COALESCE(${logoUrl || null}, logo_url),
        updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, message: 'Institution updated successfully.' });
  } catch (error) {
    console.error('Superadmin institution PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
