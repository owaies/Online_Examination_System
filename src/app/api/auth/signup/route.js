import sql from '@/lib/db';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { name, gender, college, email, mob, password, institutionCode } = await req.json();
    
    if (!name || !gender || !college || !email || !mob || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Resolve institution ID
    let institutionId = 'demo-institute';
    if (institutionCode) {
      const codeClean = institutionCode.trim();
      const instResult = await sql`
        SELECT id, status FROM "institution" 
        WHERE LOWER(institution_code) = LOWER(${codeClean})
      `;
      if (instResult.length === 0) {
        return NextResponse.json({ error: 'Invalid institution code' }, { status: 400 });
      }
      if (instResult[0].status === 'suspended') {
        return NextResponse.json({ error: 'This institution is suspended' }, { status: 403 });
      }
      institutionId = instResult[0].id;
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
      INSERT INTO "user" (name, gender, college, email, mob, password, institution_id)
      VALUES (${name}, ${gender}, ${college}, ${email}, ${parseInt(mob)}, ${password}, ${institutionId})
    `;
    
    // Auto-create session
    const token = signToken({
      email: email,
      name: name,
      role: 'student',
      institution_id: institutionId
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
