# Bulk import validation

Bulk imports should fail clearly on malformed data instead of partially creating invalid records.

## Validate
Check required fields, option structure, correct-answer membership, duplicate identifiers, and unsupported values before persistence.

## Feedback
Report the affected record or row when possible so an administrator can correct the source file.

## Regression
Test an entirely valid file, a mixed-validity file, an empty file, duplicate questions, and missing correct answers.
