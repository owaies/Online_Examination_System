import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import sql from './db';

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

export function signToken(payload) {
  return jwt.sign(payload, getSecretKey(), { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getSecretKey());
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

  // Authorization checks must fail closed when their database lookup fails.
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
      return null;
    }
  }

  // Recheck privileged account state on every session read, including super admins.
  if (['admin', 'teacher', 'super_admin'].includes(decoded.role)) {
    try {
      const adminUser = await sql`
        SELECT password_change_required FROM "admin" WHERE email = ${decoded.email}
      `;
      if (adminUser.length === 0) return null;
      if (adminUser[0].password_change_required) {
        return { ...decoded, passwordChangeRequired: true };
      }
    } catch (e) {
      console.error("Failed to check password_change_required in auth:", e);
      return null;
    }
  }

  return decoded;
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session_token');
}
