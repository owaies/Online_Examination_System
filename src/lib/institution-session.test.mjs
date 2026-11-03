import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getInstitutionAccessState, resolveInstitutionSession } from './institution-session.mjs';

const decoded = { email: 'student@example.com', role: 'student', institution_id: 42 };

test('missing institution records invalidate the session', () => {
  assert.equal(getInstitutionAccessState([]), 'missing');
  assert.equal(getInstitutionAccessState(null), 'missing');
  assert.equal(resolveInstitutionSession(decoded, []), null);
});

test('active institution records preserve the decoded session', () => {
  const rows = [{ status: 'active' }];
  assert.equal(getInstitutionAccessState(rows), 'active');
  assert.equal(resolveInstitutionSession(decoded, rows), decoded);
});

test('suspended institutions are surfaced to the caller', () => {
  const rows = [{ status: 'suspended' }];
  assert.equal(getInstitutionAccessState(rows), 'suspended');
  assert.deepEqual(resolveInstitutionSession(decoded, rows), { ...decoded, isSuspended: true });
});


test('unknown and non-active institution states invalidate sessions', () => {
  for (const state of ['pending', 'inactive', 'disabled', '', null, undefined]) {
    const rows = [{ status: state }];
    assert.equal(getInstitutionAccessState(rows), 'inactive');
    assert.equal(resolveInstitutionSession(decoded, rows), null);
  }
});
