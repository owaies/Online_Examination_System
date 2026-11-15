# Exam question and option randomization

When an active exam enables `shuffle_questions` or `shuffle_options`, the quiz detail route randomizes a copy of the stored attempt snapshot before returning it to the browser.

Both operations use the shared Fisher-Yates helper in `src/lib/shuffle.mjs`. Each pass chooses a swap index from the remaining unshuffled prefix, avoiding the distribution bias of sorting with a random comparator. The helper returns a new array and does not mutate the persisted question snapshot or option arrays.

## Automated verification

Run the focused regression suite from the repository root:

```bash
node --test src/lib/shuffle.test.mjs
```

The suite checks a deterministic permutation, preservation of the original array, empty and single-item inputs, and duplicate values.

## Manual exam checks

- Enable question shuffling and confirm the question order can vary between newly generated attempts.
- Enable option shuffling and confirm every option remains present exactly once.
- Confirm an active attempt keeps its snapshotted questions and answer identifiers.
- Confirm disabling both settings preserves the stored order.
- Confirm shuffling never changes the persisted attempt snapshot or the correct-answer fields withheld from student responses.
