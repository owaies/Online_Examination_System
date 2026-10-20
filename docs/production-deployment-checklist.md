# Production Deployment Verification Checklist

Use this checklist before releasing the Online Examination System and again after infrastructure or authentication changes. Record the release commit and the person who performed each check.

## 1. Configuration and secrets

- [ ] Configure a long, unique `JWT_SECRET` (or the exact secret variable consumed by the current application) outside source control.
- [ ] Configure the production PostgreSQL host, database, username, and password through the deployment environment.
- [ ] Confirm production credentials and local `.env` files are not tracked by Git.
- [ ] Review the environment variable names against the application's current configuration before deploying; do not assume example names are automatically consumed.

## 2. Database connectivity and TLS

- [ ] Confirm the production database endpoint supports TLS.
- [ ] Verify PostgreSQL server certificates in production. Do not set `DB_SSL_REJECT_UNAUTHORIZED=false` in production.
- [ ] Use `DB_SSL=true` where explicit TLS enablement is required by the environment.
- [ ] Apply any required database migrations and verify the application can read and write the expected tables.
- [ ] Confirm network rules permit connections only from expected application hosts.

## 3. Build and application checks

Run the project's checks from the repository root:

```bash
npm install
npm run lint
npm run build
```

- [ ] Resolve lint and build failures before release.
- [ ] Start the production server using the deployment's normal command and confirm it remains healthy.
- [ ] Open the sign-in page and verify the main examination page renders without browser-console errors.

## 4. Authentication and authorization

- [ ] Register or use a designated test account, then sign in and sign out.
- [ ] Confirm invalid credentials do not create an authenticated session.
- [ ] Confirm unauthenticated requests cannot access protected examination or administrative actions.
- [ ] Confirm a normal student cannot perform administrator-only question or user-management actions.
- [ ] Check that submitted answers and result views belong to the signed-in user and intended examination.
- [ ] Verify timed examinations handle submission and expiry consistently.

Use non-production test accounts and sample data for these checks.

## 5. Diagnostics and sensitive errors

- [ ] Confirm public database diagnostics remain disabled in production.
- [ ] Verify error responses do not expose SQL, stack traces, connection strings, tokens, or database credentials.
- [ ] Review application logs for unexpected authentication failures, database errors, and repeated server errors.
- [ ] Ensure logs do not contain passwords, bearer tokens, or full sensitive answer payloads.

## 6. Release smoke test

- [ ] Visit the production URL over HTTPS.
- [ ] Complete one short test examination using a test account.
- [ ] Verify the submitted result is persisted and shown correctly.
- [ ] Check an administrative workflow with an authorized test account.
- [ ] Confirm the previous known-good release can be restored if the deployment fails.

## Release record

- Release commit:
- Deployment URL:
- Database migration/version:
- Checks run and results:
- Known issues:
- Rollback reference:
- Verified by / date:

Do not mark a check as passed unless it was actually run against the intended release environment.
