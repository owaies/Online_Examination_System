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
      return NextResponse.json({ error: "Your institution's E-Examiner access is currently suspended. Please contact your institution administrator." }, { status: 403 });
    }

    const instId = session.institution_id;

    // Fetch teachers belonging to this institution
    const teachers = await sql`
      SELECT email FROM "admin" 
      WHERE role = 'admin' AND institution_id = ${instId} 
      ORDER BY email ASC
    `;

    // Fetch students belonging to this institution
    const students = await sql`
      SELECT name, gender, college, email, mob FROM "user" 
      WHERE institution_id = ${instId} 
      ORDER BY name ASC
    `;

    // Fetch institution details
    const instResult = await sql`
      SELECT id, name, institution_code, institution_type, email, phone, website, address, logo_url, status, created_at
      FROM "institution"
      WHERE id = ${instId}
    `;

    return NextResponse.json({ 
      success: true,
      teachers, 
      students,
      institution: instResult[0] || null
    });
  } catch (error) {
    console.error('Admin dashboard fetch error:', error);
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
      return NextResponse.json({ error: "Your institution's E-Examiner access is currently suspended. Please contact your institution administrator." }, { status: 403 });
    }

    const instId = session.institution_id;
    const body = await req.json();
    const { type, email, password, name, gender, college, mob } = body;

    if (!type || !email || !password) {
      return NextResponse.json({ error: 'Missing required credentials' }, { status: 400 });
    }

    const emailClean = email.trim().toLowerCase();

    // Check if email already registered in user/admin tables
    const emailCheckUser = await sql`SELECT email FROM "user" WHERE LOWER(email) = LOWER(${emailClean})`;
    const emailCheckAdmin = await sql`SELECT email FROM "admin" WHERE LOWER(email) = LOWER(${emailClean})`;
    if (emailCheckUser.length > 0 || emailCheckAdmin.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    if (type === 'teacher') {
      await sql`
        INSERT INTO "admin" (email, password, role, institution_id)
        VALUES (${emailClean}, ${password}, 'admin', ${instId})
      `;
    } else if (type === 'student') {
      if (!name || !gender || !college || !mob) {
        return NextResponse.json({ error: 'Missing student fields' }, { status: 400 });
      }
      await sql`
        INSERT INTO "user" (name, gender, college, email, mob, password, institution_id)
        VALUES (${name}, ${gender}, ${college}, ${emailClean}, ${parseInt(mob)}, ${password}, ${instId})
      `;
    } else {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin create user error:', error);
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
      return NextResponse.json({ error: "Your institution's E-Examiner access is currently suspended. Please contact your institution administrator." }, { status: 403 });
    }

    const instId = session.institution_id;
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const type = searchParams.get('type') || 'teacher';

    if (!email) {
      return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
    }

    const emailClean = email.trim().toLowerCase();

    if (type === 'teacher') {
      // Ensure teacher belongs to this institution
      const result = await sql`
        DELETE FROM "admin" 
        WHERE email = ${emailClean} AND role = 'admin' AND institution_id = ${instId}
      `;
    } else if (type === 'student') {
      // Ensure student belongs to this institution
      const result = await sql`
        DELETE FROM "user" 
        WHERE email = ${emailClean} AND institution_id = ${instId}
      `;
    } else {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete user error:', error);
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
      return NextResponse.json({ error: "Your institution's E-Examiner access is currently suspended. Please contact your institution administrator." }, { status: 403 });
    }

    const instId = session.institution_id;
    const body = await req.json();
    const { name, phone, website, address, logoUrl } = body;

    // Update institution details
    await sql`
      UPDATE "institution"
      SET
        name = COALESCE(${name || null}, name),
        phone = COALESCE(${phone || null}, phone),
        website = COALESCE(${website || null}, website),
        address = COALESCE(${address || null}, address),
        logo_url = COALESCE(${logoUrl || null}, logo_url),
        updated_at = NOW()
      WHERE id = ${instId}
    `;

    return NextResponse.json({ success: true, message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Admin profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
