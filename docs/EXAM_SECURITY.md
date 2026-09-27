# Examination security review

The application handles authentication, question banks, exam configuration, and attempts.

## Authorization
Verify administrative operations cannot be performed by ordinary users.

## Exam integrity
Client-side answers or timers must not be treated as trusted evidence for scoring or authorization.

## Input handling
Validate imported questions, identifiers, and exam configuration before persistence.

## Release
Review authentication behavior, environment variables, and production API responses using a clean session.
