# Secure database maintenance

These scripts can inspect or modify authentication records. Use a staging or disposable database unless a production operation is explicitly intended, and take a verified backup before any data migration.

## Required database settings

Configure `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, and `DB_PORT` through the process environment or an untracked `.env.local` / `.env` file. The shared `scratch/db-connection.mjs` helper validates the settings and enables TLS certificate verification by default.

- `DB_SSL=false` disables TLS and is suitable only for a database that does not support TLS.
- `DB_SSL_REJECT_UNAUTHORIZED=false` disables certificate verification for a self-signed local test database only. Do not use it with production data.

## Scripts that need additional safeguards

- `reset_admin_password.mjs`: requires `TARGET_ADMIN_EMAIL` and `NEW_ADMIN_PASSWORD`.
- `bootstrap_superadmin.mjs`: requires `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD`.
- `debug_passwords.mjs`: requires `CHECK_ADMIN_EMAIL` and `CHECK_ADMIN_PASSWORD`; it reports whether the stored value is a bcrypt hash and whether the supplied password matches, without printing the stored hash or password.
- `hash_existing_passwords.mjs`: refuses to modify records unless `ALLOW_PASSWORD_HASH_MIGRATION=true` is explicitly set. Review the target database and take a backup before enabling this guard.

Keep all of these values in an untracked environment file or secret manager. Do not paste secrets into scripts, terminal logs, issue comments, or commit messages.

## Historical credential exposure

Removing a credential from the current source does not erase copies in Git history, clones, logs, or CI artifacts. Rotate any database or administrator credential that was previously committed, review access logs, and remove leaked values from secret stores where practical. Never assume a source-code edit alone completes incident response.
