import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import sql from './db';

const SECRET_KEY = process.env.JWT_SECRET || 'fallback-secret-key-12345';

export function signToken(payload) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) return null;
  
  const decoded = verifyToken(token);
  if (!decoded) return null;

  // Verify if institution is suspended
  if (decoded.institution_id) {
    try {
      const inst = await sql`
        SELECT status FROM "institution" WHERE id = ${decoded.institution_id}
      `;
      if (inst.length > 0 && inst[0].status === 'suspended') {
        return { ...decoded, isSuspended: true };
      }
    } catch (e) {
      console.error("Failed to check institution status in auth:", e);
    }
  }

  // Verify if password change is required for admin/teacher
  if (decoded.role === 'admin' || decoded.role === 'teacher') {
    try {
      const adminUser = await sql`
        SELECT password_change_required FROM "admin" WHERE email = ${decoded.email}
      `;
      if (adminUser.length > 0 && adminUser[0].password_change_required) {
        return { ...decoded, passwordChangeRequired: true };
      }
    } catch (e) {
      console.error("Failed to check password_change_required in auth:", e);
    }
  }

  return decoded;
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session_token');
}
