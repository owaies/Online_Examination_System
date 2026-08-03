import sql from '@/lib/db';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { email, password, role } = await req.json();
    
    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    let dbUser = null;
    let name = '';
    let sessionRole = role;
    const emailClean = email.trim().toLowerCase();
    
    if (role === 'student') {
      const result = await sql`
        SELECT name, email, password, institution_id FROM "user" 
        WHERE LOWER(email) = LOWER(${emailClean})
      `;
      if (result.length > 0) {
        const userRecord = result[0];
        const isMatch = await bcrypt.compare(password, userRecord.password);
        if (isMatch) {
          dbUser = userRecord;
          name = dbUser.name;
          sessionRole = 'student';
        }
      }
    } else if (role === 'teacher') {
      const result = await sql`
        SELECT email, password, institution_id FROM "admin" 
        WHERE LOWER(email) = LOWER(${emailClean}) AND role = 'admin'
      `;
      if (result.length > 0) {
        const userRecord = result[0];
        const isMatch = await bcrypt.compare(password, userRecord.password);
        if (isMatch) {
          dbUser = userRecord;
          name = 'Teacher';
          sessionRole = 'teacher';
        }
      }
    } else if (role === 'admin') {
      const result = await sql`
        SELECT email, role, password, institution_id, password_change_required FROM "admin" 
        WHERE LOWER(email) = LOWER(${emailClean}) AND (role = 'head' OR role = 'super_admin')
      `;
      if (result.length > 0) {
        const userRecord = result[0];
        const isMatch = await bcrypt.compare(password, userRecord.password);
        if (isMatch) {
          dbUser = userRecord;
          if (dbUser.role === 'super_admin') {
            name = 'Super Admin';
            sessionRole = 'super_admin';
          } else {
            name = 'Administrator';
            sessionRole = 'admin';
          }
        }
      }
    }
    
    if (!dbUser) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check if institution is suspended
    if (dbUser.institution_id) {
      const instResult = await sql`
        SELECT status FROM "institution" WHERE id = ${dbUser.institution_id}
      `;
      if (instResult.length > 0 && instResult[0].status === 'suspended') {
        return NextResponse.json({
          error: "Your institution's E-Examiner access is currently suspended. Please contact your institution administrator."
        }, { status: 403 });
      }
    }
    
    const token = signToken({
      email: dbUser.email,
      name: name,
      role: sessionRole,
      institution_id: dbUser.institution_id || null,
      password_change_required: dbUser.password_change_required || false
    });
    
    const cookieStore = await cookies();
    cookieStore.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });
    
    return NextResponse.json({ 
      success: true, 
      user: { 
        email: dbUser.email, 
        name, 
        role: sessionRole,
        password_change_required: dbUser.password_change_required || false
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
