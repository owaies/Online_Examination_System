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

## Signup boundary checks
- Send malformed JSON and non-object JSON bodies; expect HTTP 400 and no database write.
- Try missing, non-string, whitespace-only, malformed, and overlong required fields; expect HTTP 400.
- Verify mobile values contain 7–15 digits and passwords are 8–72 UTF-8 bytes before bcrypt hashing.
- Confirm a valid payload still creates a student with a normalized lowercase email.
- If an institution code is supplied, verify non-text or overlong values are rejected before the institution lookup.

