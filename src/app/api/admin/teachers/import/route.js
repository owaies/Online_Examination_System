import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.isSuspended) {
      return NextResponse.json({ error: 'Institution suspended' }, { status: 403 });
    }

    const { action, rows } = await req.json();
    if (!action || !rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const instId = session.institution_id;

    if (action === 'preview') {
      const validatedRows = [];
      let validCount = 0;
      let errorCount = 0;
      let conflictCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const errors = [];
        const warnings = [];

        const name = row.name;
        const email = row.email;

        if (!name) errors.push('Missing teacher name');
        if (!email) {
          errors.push('Missing email address');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push('Invalid email address format');
        }

        // Conflict check: Check if email is already registered
        if (email) {
          const emailClean = email.trim().toLowerCase();
          const emailCheckUser = await sql`SELECT email FROM "user" WHERE email = ${emailClean}`;
          const emailCheckAdmin = await sql`SELECT email FROM "admin" WHERE email = ${emailClean}`;
          
          if (emailCheckUser.length > 0 || emailCheckAdmin.length > 0) {
            errors.push('Email is already registered on E-Examiner');
            conflictCount++;
          }
        }

        if (errors.length > 0) errorCount++;
        else validCount++;

        validatedRows.push({
          index: i + 1,
          name,
          email: email?.trim()?.toLowerCase(),
          errors,
          warnings
        });
      }

      return NextResponse.json({
        success: true,
        preview: {
          rows: validatedRows,
          summary: {
            total: rows.length,
            valid: validCount,
            errors: errorCount,
            conflicts: conflictCount
          }
        }
      });
    }

    if (action === 'confirm') {
      const importId = 'imp-' + Math.random().toString(36).substring(2, 11);
      const generatedCredentials = [];

      await sql.begin(async sql => {
        // Log in import history
        await sql`
          INSERT INTO "import_history" (id, institution_id, imported_by, file_name, row_count, import_type)
          VALUES (${importId}, ${instId}, ${session.email}, 'Teacher_Import_CSV', ${rows.length}, 'TEACHER')
        `;

        for (const row of rows) {
          // Generate a secure random password
          const tempPassword = Math.random().toString(36).substring(2, 10) + '@' + Math.random().toString(36).substring(2, 5).toUpperCase();
          const hash = await bcrypt.hash(tempPassword, 10);
          
          const emailClean = row.email.trim().toLowerCase();

          // Create Teacher account in "admin" table
          await sql`
            INSERT INTO "admin" (email, password, role, institution_id, password_change_required)
            VALUES (${emailClean}, ${hash}, 'admin', ${instId}, true)
          `;

          generatedCredentials.push({
            name: row.name,
            email: emailClean,
            tempPassword
          });
        }
      });

      return NextResponse.json({ success: true, credentials: generatedCredentials });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    console.error('Teachers import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
