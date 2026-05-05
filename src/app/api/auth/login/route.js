import sql from '@/lib/db';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, password, role } = await req.json();
    
    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    let dbUser = null;
    let name = '';
    
    if (role === 'student') {
      const result = await sql`
        SELECT name, email FROM "user" 
        WHERE email = ${email} AND password = ${password}
      `;
      if (result.length > 0) {
        dbUser = result[0];
        name = dbUser.name;
      }
    } else if (role === 'teacher') {
      const result = await sql`
        SELECT email FROM "admin" 
        WHERE email = ${email} AND password = ${password} AND role = 'admin'
      `;
      if (result.length > 0) {
        dbUser = result[0];
        name = 'Teacher';
      }
    } else if (role === 'admin') {
      const result = await sql`
        SELECT email FROM "admin" 
        WHERE email = ${email} AND password = ${password} AND role = 'head'
      `;
      if (result.length > 0) {
        dbUser = result[0];
        name = 'Administrator';
      }
    }
    
    if (!dbUser) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    
    const token = signToken({
      email: dbUser.email,
      name: name,
      role: role
    });
    
    const cookieStore = await cookies();
    cookieStore.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });
    
    return NextResponse.json({ success: true, user: { email: dbUser.email, name, role } });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
