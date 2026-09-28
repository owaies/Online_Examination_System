# Examination Route Map

The current application contains distinct route areas for:

- `/admin`
- `/student`
- `/teacher`
- `/superadmin`
- `/quiz`
- `/change-password`
- API routes under `/api`

The root page is the general application entry point.

## Change discipline

Add role-specific pages beneath the existing role directory instead of mixing unrelated workflows in the root route. Keep shared authentication and layout concerns in the appropriate app-level files.

## QA pass

When changing routes, verify direct navigation, protected navigation, refresh behavior, and not-found behavior. Also check that a user cannot reach a privileged route only by typing its URL directly.
