import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check database connectivity and admin table structure
    const adminCount = await sql`SELECT COUNT(*) as cnt FROM "admin"`;
    
    // Check if expected super admin exists (without exposing password)
    const superAdminCheck = await sql`
      SELECT email, role, institution_id, 
             CASE WHEN password LIKE '$2%' THEN 'bcrypt_hashed' ELSE 'plaintext_or_other' END as password_type,
             password_change_required
      FROM "admin" 
      WHERE role = 'super_admin'
    `;

    // Check if expected head admin exists
    const headCheck = await sql`
      SELECT email, role, institution_id,
             CASE WHEN password LIKE '$2%' THEN 'bcrypt_hashed' ELSE 'plaintext_or_other' END as password_type,
             password_change_required
      FROM "admin"
      WHERE role = 'head'
    `;

    // Check institutions
    const institutions = await sql`
      SELECT id, name, status FROM "institution"
    `;

    // Check phase 2 tables exist
    const phase2Tables = {};
    const tableNames = ['academic_year', 'academic_unit', 'section', 'subject', 'teacher_assignment', 'student_enrollment'];
    for (const t of tableNames) {
      try {
        const count = await sql`SELECT COUNT(*) as cnt FROM ${sql(t)}`;
        phase2Tables[t] = parseInt(count[0].cnt);
      } catch (e) {
        phase2Tables[t] = 'TABLE_MISSING';
      }
    }

    return NextResponse.json({
      database_connected: true,
      total_admins: parseInt(adminCount[0].cnt),
      super_admins: superAdminCheck.map(a => ({ email: a.email, role: a.role, password_type: a.password_type, institution_id: a.institution_id, pwd_change: a.password_change_required })),
      institute_admins: headCheck.map(a => ({ email: a.email, role: a.role, password_type: a.password_type, institution_id: a.institution_id, pwd_change: a.password_change_required })),
      institutions: institutions.map(i => ({ id: i.id, name: i.name, status: i.status })),
      phase2_tables: phase2Tables
    });
  } catch (error) {
    return NextResponse.json({
      database_connected: false,
      error: error.message
    }, { status: 500 });
  }
}
