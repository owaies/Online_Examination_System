import sql from '@/lib/db';
import { getSession, signToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmPassword } = await req.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Password strength check (8+ characters)
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'New password and confirmation do not match' }, { status: 400 });
    }

    if (newPassword === currentPassword) {
      return NextResponse.json({ error: 'New password cannot be the same as current password' }, { status: 400 });
    }

    const email = session.email;
    let table = session.role === 'student' ? 'user' : 'admin';

    // Fetch user password hash
    const userResult = await sql`
      SELECT password FROM ${sql(table)} WHERE email = ${email}
    `;

    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User record not found' }, { status: 404 });
    }

    const user = userResult[0];

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
    }

    // Hash and update to new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (table === 'admin') {
      await sql`
        UPDATE "admin" 
        SET password = ${hashedPassword}, password_change_required = false 
        WHERE email = ${email}
      `;
    } else {
      await sql`
        UPDATE "user" 
        SET password = ${hashedPassword} 
        WHERE email = ${email}
      `;
    }

    // Re-sign token with password_change_required = false to update the cookie session
    const token = signToken({
      email: session.email,
      name: session.name,
      role: session.role,
      institution_id: session.institution_id || null,
      password_change_required: false
    });

    const cookieStore = await cookies();
    cookieStore.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    return NextResponse.json({ success: true, role: session.role, message: 'Password changed successfully!' });
  } catch (error) {
    console.error('Change password API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
