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

The JavaScript scripts use `db-connection.mjs` to load settings from the process environment, `.env.local`, or `.env`, and fail fast when required values are missing. The Python schema inspection script reads the same `DB_*` names from the process environment; export them before running it.

Never put real connection credentials in migration scripts or commit environment files.
