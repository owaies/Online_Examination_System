# Session authorization checks

Session tokens are signed and verified locally, but privileged access also
depends on current database state. The session loader rechecks institution
status and privileged-account password-change state before returning a session.

These checks fail closed:

- a database error during the institution lookup invalidates the session; a missing row retains the existing demo-institution behavior;
- a suspended institution is returned as suspended for the caller to block;
- a missing admin/teacher/super-admin record invalidates the session;
- a database error during either authorization lookup returns no session rather
  than silently trusting stale token claims;
- password-change state is rechecked for admin, teacher, and super-admin roles.

## Manual regression checks

1. Sign in as a student and verify a valid active institution remains usable.
2. Suspend the institution and verify protected routes treat the session as suspended.
3. Verify the configured demo-institution fallback continues to work when no institution row is returned.
4. Sign in as each privileged role and verify a required password change is surfaced.
5. Simulate a database lookup failure and verify protected routes do not accept the token as an authenticated session.
