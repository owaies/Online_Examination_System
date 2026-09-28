# Online Examination System Architecture

## Runtime flow

```text
Browser → Next.js UI → application/API layer → persistent data services
```

## Change boundaries

- Keep authentication and authorization checks at the server boundary.
- Validate exam, question, and submission payloads before persistence.
- Treat candidate-submitted content as untrusted input.
- Keep timing and attempt state authoritative on the server when an API layer is involved.
- Avoid exposing answer keys or administrative fields to candidate-facing responses.

## Verification priorities

1. Candidate login and session restoration.
2. Exam loading and question navigation.
3. Submission validation and duplicate-submit handling.
4. Admin question/exam management.
5. Production build and route smoke tests.
