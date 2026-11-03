export function getInstitutionAccessState(rows) {
  if (!Array.isArray(rows) || rows.length === 0 || !rows[0] || typeof rows[0] !== 'object') {
    return 'missing';
  }

  if (rows[0].status === 'active') return 'active';
  if (rows[0].status === 'suspended') return 'suspended';
  return 'inactive';
}

export function resolveInstitutionSession(decoded, rows) {
  const state = getInstitutionAccessState(rows);
  if (state === 'suspended') return { ...decoded, isSuspended: true };
  if (state !== 'active') return null;
  return decoded;
}
