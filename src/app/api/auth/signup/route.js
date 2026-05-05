import sql from '@/lib/db';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { name, gender, college, email, mob, password } = await req.json();
    
    if (!name || !gender || !college || !email || !mob || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Check if user already exists
    const existing = await sql`
      SELECT email FROM "user" WHERE email = ${email}
    `;
    
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }
    
    // Insert new user
    await sql`
      INSERT INTO "user" (name, gender, college, email, mob, password)
      VALUES (${name}, ${gender}, ${college}, ${email}, ${parseInt(mob)}, ${password})
    `;
    
    // Auto-create session
    const token = signToken({
      email: email,
      name: name,
      role: 'student'
    });
    
    const cookieStore = await cookies();
    cookieStore.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });
    
    return NextResponse.json({ success: true, user: { email, name, role: 'student' } });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
