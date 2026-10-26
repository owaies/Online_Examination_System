import sql from '@/lib/db';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req) {
  try {
    let payload;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return NextResponse.json({ error: 'Invalid signup payload' }, { status: 400 });
    }

    const { name, gender, college, email, mob, password, institutionCode } = payload;
    const requiredFields = [name, gender, college, email, mob, password];
    if (requiredFields.some((value) => typeof value !== 'string' || !value.trim())) {
      return NextResponse.json({ error: 'All required fields must be non-empty strings' }, { status: 400 });
    }
    if (institutionCode !== undefined && institutionCode !== null && typeof institutionCode !== 'string') {
      return NextResponse.json({ error: 'Institution code must be text' }, { status: 400 });
    }

    const nameClean = name.trim();
    const genderClean = gender.trim();
    const collegeClean = college.trim();
    const emailClean = email.trim().toLowerCase();
    const mobileClean = mob.trim();
    const institutionCodeClean = typeof institutionCode === 'string' ? institutionCode.trim() : '';

    if (
      nameClean.length > 100 ||
      genderClean.length > 30 ||
      collegeClean.length > 150 ||
      emailClean.length > 254 ||
      !EMAIL_PATTERN.test(emailClean) ||
      !/^\d{7,15}$/.test(mobileClean) ||
      password.length < 8 ||
      Buffer.byteLength(password, 'utf8') > 72 ||
      institutionCodeClean.length > 64
    ) {
      return NextResponse.json({ error: 'Signup details are invalid or exceed the allowed limits' }, { status: 400 });
    }

    // Resolve institution ID
    let institutionId = 'demo-institute';
    if (institutionCodeClean) {
      const codeClean = institutionCodeClean;
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
      SELECT email FROM "user" WHERE email = ${emailClean}
    `;
    
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    await sql`
      INSERT INTO "user" (name, gender, college, email, mob, password, institution_id)
      VALUES (${nameClean}, ${genderClean}, ${collegeClean}, ${emailClean}, ${parseInt(mobileClean, 10)}, ${hashedPassword}, ${institutionId})
    `;
    
    // Auto-create session
    const token = signToken({
      email: emailClean,
      name: nameClean,
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
    
    return NextResponse.json({ success: true, user: { email: emailClean, name: nameClean, role: 'student' } });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
