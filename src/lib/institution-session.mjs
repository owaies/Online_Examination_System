export function getInstitutionAccessState(rows) {
  if (!Array.isArray(rows) || rows.length === 0 || !rows[0] || typeof rows[0] !== 'object') {
    return 'missing';
  }

  return rows[0].status === 'suspended' ? 'suspended' : 'active';
}

export function resolveInstitutionSession(decoded, rows) {
  const state = getInstitutionAccessState(rows);
  if (state === 'missing') return null;
  if (state === 'suspended') return { ...decoded, isSuspended: true };
  return decoded;
}
