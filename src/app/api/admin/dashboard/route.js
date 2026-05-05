import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch teachers (who have role = 'admin' in the database, while head admin is 'head')
    const teachers = await sql`
      SELECT email FROM "admin" WHERE role = 'admin' ORDER BY email ASC
    `;

    return NextResponse.json({ teachers });
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

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    // Check if teacher already exists in admin table
    const existing = await sql`
      SELECT email FROM "admin" WHERE email = ${email}
    `;

    if (existing.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Insert new teacher (role is 'admin')
    await sql`
      INSERT INTO "admin" (email, password, role)
      VALUES (${email}, ${password}, 'admin')
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin create teacher error:', error);
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
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
    }

    // Delete teacher (make sure not to delete the head admin)
    await sql`
      DELETE FROM "admin" WHERE email = ${email} AND role = 'admin'
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete teacher error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
