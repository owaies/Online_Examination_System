# Quiz attempt autosave smoke tests

1. Sign in as a student and start a quiz attempt.
2. Select options for several questions and confirm autosave succeeds.
3. Send an autosave request with malformed JSON, an array instead of an object, an empty question key, an object-valued option, or more than 1,000 selections; confirm HTTP 400 and that stored answers remain unchanged.
4. Confirm both numeric and string option identifiers used by the quiz UI are accepted.
5. Suspend the student's institution and confirm autosave returns HTTP 403.
6. Submit or expire an attempt while an autosave is in flight; confirm the autosave cannot overwrite the final attempt state and returns HTTP 409 when the state changes before its update.
7. Confirm a student cannot autosave another student's attempt or an attempt belonging to another institution.
8. Run the standalone payload validator tests with `node --test scratch/test_attempt_validation.mjs`.

9. Send two submission requests for the same in-progress attempt concurrently; confirm only one request transitions the attempt and the other receives HTTP 409.
10. Confirm the submission update remains scoped to the authenticated student's email and institution, even if an attempt identifier is supplied from another account.


## Institution status regression

- Confirm a session is rejected when the institution record is missing.
- Confirm only an institution with status `active` can resolve a normal session.
- Confirm `suspended` remains distinguishable for the existing suspension flow.
- Confirm pending, inactive, disabled, empty, and unknown status values do not grant access.


## Attempt submission payload

- Submit a valid attempt with `autoSubmit: false` and confirm it is recorded as a normal submission.
- Submit a valid attempt with `autoSubmit: true` and confirm it follows the automatic-submission status path.
- Send malformed JSON, a non-object JSON value, or a non-boolean `autoSubmit` value; confirm the endpoint returns HTTP 400 without changing the attempt.
- Omit `autoSubmit` and confirm the request retains the normal-submission default.
