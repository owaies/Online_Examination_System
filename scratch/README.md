# Database maintenance scripts

The scripts in this directory inspect or modify the configured database. Review each migration before running it, use a staging or disposable database first, and take a backup before applying schema or data changes.

## Connection configuration

Set these variables in the process environment or in an untracked `.env.local` or `.env` file at the repository root:

- `DB_HOST`: database hostname
- `DB_NAME`: database name
- `DB_USER`: database username
- `DB_PASS`: database password
- `DB_PORT`: database port
- `DB_SSL`: optional; set to `false` only for a database that does not use TLS
- `DB_SSLMODE`: optional PostgreSQL SSL mode for the Python inspection script; defaults to `require`

The scripts that import `db-connection.mjs` load settings from the process environment, `.env.local`, or `.env`, and fail fast when required values are missing. Tenant-isolation checks, security-patch verification, super-admin bootstrap, and administrator password reset use this shared connection helper. The Python schema inspection script reads the same `DB_*` names from the process environment; export them before running it.

TLS certificate verification is enabled by default. Set `DB_SSL=false` only for a database that does not use TLS. For a disposable local database with a self-signed certificate, `DB_SSL_REJECT_UNAUTHORIZED=false` disables certificate verification and should not be used with production data.

The password-reset script requires `TARGET_ADMIN_EMAIL` and `NEW_ADMIN_PASSWORD`. The bootstrap script requires `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD`. Keep these values in an untracked environment file or a secret manager, never in source code. The integration scripts return a non-zero exit status when a check fails and attempt to clean up their test records.

If a credential has ever been committed, rotate it. Removing it from the current files does not remove historical copies from Git.
