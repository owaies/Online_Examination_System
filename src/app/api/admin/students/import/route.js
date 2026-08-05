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

    // Fetch active academic years, units, and sections for validation
    const years = await sql`SELECT id, name FROM "academic_year" WHERE institution_id = ${instId}`;
    const units = await sql`SELECT id, name FROM "academic_unit" WHERE institution_id = ${instId}`;
    const sections = await sql`SELECT id, name, academic_unit_id FROM "section" WHERE institution_id = ${instId}`;

    const yearsMap = new Map(years.map(y => [y.name.toLowerCase().trim(), y.id]));
    const unitsMap = new Map(units.map(u => [u.name.toLowerCase().trim(), u.id]));
    const sectionsMap = new Map(sections.map(s => [`${s.academic_unit_id}_${s.name.toLowerCase().trim()}`, s.id]));

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
        const rollNumber = row.roll_number;
        const yearName = (row.academic_year || '').toLowerCase().trim();
        const unitName = (row.academic_unit || '').toLowerCase().trim();
        const sectionName = (row.section || '').toLowerCase().trim();

        if (!name) errors.push('Missing student name');
        if (!email) {
          errors.push('Missing email address');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push('Invalid email address format');
        }

        if (!rollNumber) errors.push('Missing roll number');

        let yearId = null;
        if (!yearName) {
          errors.push('Academic Year is required');
        } else {
          yearId = yearsMap.get(yearName);
          if (!yearId) errors.push(`Academic Year "${row.academic_year}" not found`);
        }

        let unitId = null;
        if (!unitName) {
          errors.push('Class/Academic Unit is required');
        } else {
          unitId = unitsMap.get(unitName);
          if (!unitId) errors.push(`Class/Academic Unit "${row.academic_unit}" not found`);
        }

        let sectionId = null;
        if (sectionName && unitId) {
          sectionId = sectionsMap.get(`${unitId}_${sectionName}`);
          if (!sectionId) errors.push(`Section "${row.section}" not found in this class`);
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
          rollNumber,
          yearName: row.academic_year,
          yearId,
          unitName: row.academic_unit,
          unitId,
          sectionName: row.section,
          sectionId,
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
          VALUES (${importId}, ${instId}, ${session.email}, 'Student_Import_CSV', ${rows.length}, 'STUDENT')
        `;

        // Fetch college name of the institution to assign
        const institutionResult = await sql`SELECT name FROM "institution" WHERE id = ${instId}`;
        const collegeName = institutionResult[0]?.name || 'Institution';

        for (const row of rows) {
          // Generate a secure random password
          const tempPassword = Math.random().toString(36).substring(2, 10) + '@' + Math.random().toString(36).substring(2, 5).toUpperCase();
          const hash = await bcrypt.hash(tempPassword, 10);
          
          const emailClean = row.email.trim().toLowerCase();

          // 1. Create Student account in "user" table
          await sql`
            INSERT INTO "user" (name, gender, college, email, mob, password, institution_id)
            VALUES (${row.name.trim()}, 'M', ${collegeName}, ${emailClean}, 9999999999, ${hash}, ${instId})
          `;

          // 2. Create Student enrollment mapping
          const enrollId = Math.random().toString(36).substring(2, 15);
          await sql`
            INSERT INTO "student_enrollment" (id, institution_id, academic_year_id, student_id, academic_unit_id, section_id)
            VALUES (${enrollId}, ${instId}, ${row.yearId}, ${emailClean}, ${row.unitId}, ${row.sectionId || null})
            ON CONFLICT (academic_year_id, student_id) 
            DO UPDATE SET academic_unit_id = ${row.unitId}, section_id = ${row.sectionId || null}, updated_at = NOW()
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
    console.error('Students import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
