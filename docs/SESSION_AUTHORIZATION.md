# Session authorization checks

Session tokens are signed and verified locally, but privileged access also
depends on current database state. The session loader rechecks institution
status and privileged-account password-change state before returning a session.

These checks fail closed:

- a missing institution record invalidates the session;
- a suspended institution is returned as suspended for the caller to block;
- a missing admin/teacher/super-admin record invalidates the session;
- a database error during either authorization lookup returns no session rather
  than silently trusting stale token claims;
- password-change state is rechecked for admin, teacher, and super-admin roles.

## Manual regression checks

1. Sign in as a student and verify a valid active institution remains usable.
2. Suspend the institution and verify protected routes treat the session as suspended.
3. Remove or invalidate the institution record and verify the session is rejected.
4. Sign in as each privileged role and verify a required password change is surfaced.
5. Simulate a database lookup failure and verify protected routes do not accept the token as an authenticated session.
