import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Manual .env.local loader to bypass external dependencies
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      if (key) {
        process.env[key] = val;
      }
    }
  });
}

const sql = postgres({
  host: "aws-0-ap-northeast-1.pooler.supabase.com",
  database: "postgres",
  username: "postgres.tpqvmupdvxqloykqkpwj",
  password: "Owaies@2026",
  port: 6543,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("=== SUPER ADMIN SECURE BOOTSTRAP COMMAND ===");

    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!email || !password) {
      console.error("\nError: Missing SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD environment variables.");
      console.error("Please add the following variables to your '.env.local' file:\n");
      console.error("SUPER_ADMIN_EMAIL=your-super-admin-email@domain.com");
      console.error("SUPER_ADMIN_PASSWORD=your-super-secure-password\n");
      process.exit(1);
    }

    const emailClean = email.trim().toLowerCase();

    if (password.length < 8) {
      console.error("Error: SUPER_ADMIN_PASSWORD must be at least 8 characters long.");
      process.exit(1);
    }

    console.log(`Target Super Admin Email: ${emailClean}`);
    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if any super admin exists
    const existing = await sql`
      SELECT email FROM "admin" WHERE role = 'super_admin'
    `;

    if (existing.length > 0) {
      console.log("Super Admin already exists. Rotating credentials...");
      await sql`
        UPDATE "admin" 
        SET email = ${emailClean}, password = ${hashedPassword}, password_change_required = false
        WHERE role = 'super_admin'
      `;
      console.log("Super Admin rotated successfully!");
    } else {
      console.log("No existing Super Admin found. Bootstrapping new account...");
      await sql`
        INSERT INTO "admin" (email, password, role, institution_id, password_change_required)
        VALUES (${emailClean}, ${hashedPassword}, 'super_admin', NULL, false)
      `;
      console.log("Super Admin bootstrapped successfully!");
    }

    // Double check: ensure 'superadmin@e-examiner.com' with plaintext 'superpassword' no longer exists
    console.log("Verifying legacy/plaintext superadmin accounts are cleaned up...");
    await sql`
      DELETE FROM "admin" 
      WHERE email = 'superadmin@e-examiner.com' AND role = 'super_admin' AND email != ${emailClean}
    `;

  } catch (error) {
    console.error("Bootstrap execution failed:", error);
  } finally {
    process.exit(0);
  }
}

main();
