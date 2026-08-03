import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';

    // 1. Fetch institutions list with optional search/filters
    let query = sql`
      SELECT id, name, institution_code, institution_type, email, phone, website, address, logo_url, status, created_at
      FROM "institution"
      WHERE 1=1
    `;

    if (search) {
      query = sql`${query} AND (LOWER(name) LIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(institution_code) LIKE ${'%' + search.toLowerCase() + '%'})`;
    }
    if (type) {
      query = sql`${query} AND institution_type = ${type}`;
    }
    if (status) {
      query = sql`${query} AND status = ${status}`;
    }

    const institutions = await query;

    // 2. Fetch platform statistics dynamically from DB
    const totalInsts = await sql`SELECT COUNT(*) as count FROM "institution"`;
    const activeInsts = await sql`SELECT COUNT(*) as count FROM "institution" WHERE status = 'active'`;
    const suspendedInsts = await sql`SELECT COUNT(*) as count FROM "institution" WHERE status = 'suspended'`;
    const totalTeachers = await sql`SELECT COUNT(*) as count FROM "admin" WHERE role = 'admin'`;
    const totalStudents = await sql`SELECT COUNT(*) as count FROM "user"`;

    return NextResponse.json({
      success: true,
      institutions,
      stats: {
        totalInstitutions: parseInt(totalInsts[0].count),
        activeInstitutions: parseInt(activeInsts[0].count),
        suspendedInstitutions: parseInt(suspendedInsts[0].count),
        totalTeachers: parseInt(totalTeachers[0].count),
        totalStudents: parseInt(totalStudents[0].count)
      }
    });
  } catch (error) {
    console.error('Superadmin institutions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      name, institutionCode, institutionType, email, phone, website, address, logoUrl,
      adminName, adminEmail, adminPassword
    } = await req.json();

    if (!name || !institutionCode || !institutionType || !email || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const codeClean = institutionCode.trim();
    const emailClean = adminEmail.trim().toLowerCase();

    // Validate institution code uniqueness
    const codeCheck = await sql`
      SELECT id FROM "institution" WHERE LOWER(institution_code) = LOWER(${codeClean})
    `;
    if (codeCheck.length > 0) {
      return NextResponse.json({ error: 'Institution code is already taken' }, { status: 400 });
    }

    // Validate admin email uniqueness
    const emailCheckUser = await sql`SELECT email FROM "user" WHERE LOWER(email) = LOWER(${emailClean})`;
    const emailCheckAdmin = await sql`SELECT email FROM "admin" WHERE LOWER(email) = LOWER(${emailClean})`;
    if (emailCheckUser.length > 0 || emailCheckAdmin.length > 0) {
      return NextResponse.json({ error: 'Administrator email is already registered' }, { status: 400 });
    }

    const institutionId = Math.random().toString(36).substring(2, 15);
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Atomically create institution and provision its admin
    await sql.begin(async sql => {
      await sql`
        INSERT INTO "institution" (id, name, institution_code, institution_type, email, phone, website, address, logo_url, status)
        VALUES (${institutionId}, ${name}, ${codeClean}, ${institutionType}, ${email}, ${phone || null}, ${website || null}, ${address || null}, ${logoUrl || null}, 'active')
      `;

      await sql`
        INSERT INTO "admin" (email, password, role, institution_id, password_change_required)
        VALUES (${emailClean}, ${hashedPassword}, 'head', ${institutionId}, true)
      `;
    });

    return NextResponse.json({ success: true, institutionId });
  } catch (error) {
    console.error('Superadmin create institution error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
