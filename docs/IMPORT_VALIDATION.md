# Bulk import validation

Bulk imports should fail clearly on malformed data instead of partially creating invalid records.

## Validate
Check required fields, option structure, correct-answer membership, duplicate identifiers, and unsupported values before persistence.

## Feedback
Report the affected record or row when possible so an administrator can correct the source file.

## Regression
Test an entirely valid file, a mixed-validity file, an empty file, duplicate questions, and missing correct answers.

## Confirm endpoint

The preview response is informational and is not trusted as authorization to write. The confirm action revalidates each row on the server, accepts only positive safe-integer marks, rebuilds subject and topic references from records belonging to the active institution, and rejects malformed options, answer keys, difficulty values, or tags before opening the import transaction. Unknown optional topics remain unassigned, matching the preview warning behavior.

Run the focused checks with:

```bash
node --test src/lib/question-import-validation.test.mjs
```
