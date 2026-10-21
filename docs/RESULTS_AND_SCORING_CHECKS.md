# Exam Results and Scoring Checks

Use a small fixture exam with known correct answers to verify scoring changes.

- All correct answers produce the expected maximum score.
- All incorrect answers produce the expected minimum score.
- A partially correct attempt matches the documented scoring rule.
- Missing optional answers are treated consistently with the product's rules.
- Repeated submission follows the intended retry policy and does not create duplicate results.
- Client-provided score fields are not treated as authoritative.
- The result summary, leaderboard, and persisted record agree after a page refresh.

Run these checks after changes to question schemas, submission handlers, scoring logic, or result queries.
