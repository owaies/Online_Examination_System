# Examination admin release checklist

Before releasing an admin-facing change:

## Authorization
Verify ordinary users cannot reach administrative question, pool, blueprint, or import operations.

## Data integrity
Confirm edits do not silently alter existing exam attempts or published question data.

## Validation
Exercise successful and rejected inputs for every changed form or API route.

## Production
Run lint/build checks, review environment variables, and verify the deployed application against a clean browser session.
