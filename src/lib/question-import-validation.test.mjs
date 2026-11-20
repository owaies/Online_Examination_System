import assert from "node:assert/strict";
import { test } from "node:test";

import {
  normalizeConfirmedQuestionRows,
  parsePositiveInteger,
} from "./question-import-validation.mjs";

const subjects = [{ id: 12, name: "Mathematics" }];
const topics = [{ id: 34, subject_id: 12, name: "Algebra" }];

function validRow(overrides = {}) {
  return {
    question: "  Solve 2 + 2  ",
    optA: "  3 ",
    optB: "  4 ",
    optC: "  5 ",
    optD: "  6 ",
    correct: "b",
    marks: " 2 ",
    difficulty: "easy",
    subjectName: " Mathematics ",
    subjectId: 999,
    topicName: " Algebra ",
    topicId: 999,
    explanation: "  Basic addition  ",
    tags: [" algebra ", "arithmetic"],
    ...overrides,
  };
}

test("positive marks accept safe integers and digit-only strings", () => {
  assert.equal(parsePositiveInteger(2), 2);
  assert.equal(parsePositiveInteger(" 12 "), 12);
});

test("positive marks reject fractions, suffixes, zero, negatives, and unsafe values", () => {
  for (const value of ["2.5", "10marks", "0", "-1", "", "9007199254740992", NaN, Infinity, true]) {
    assert.equal(parsePositiveInteger(value), null, String(value));
  }
});

test("confirmed rows are normalized and tenant references are rebuilt", () => {
  const [row] = normalizeConfirmedQuestionRows([validRow()], subjects, topics);

  assert.equal(row.question, "Solve 2 + 2");
  assert.equal(row.correct, "B");
  assert.equal(row.marks, 2);
  assert.equal(row.difficulty, "EASY");
  assert.equal(row.subjectId, 12);
  assert.equal(row.topicId, 34);
  assert.equal(row.explanation, "Basic addition");
  assert.deepEqual(row.tags, ["algebra", "arithmetic"]);
});

test("unknown optional topics remain unassigned", () => {
  const [row] = normalizeConfirmedQuestionRows(
    [validRow({ topicName: "Geometry" })],
    subjects,
    topics,
  );
  assert.equal(row.topicId, null);
});

test("confirmation rejects invalid rows and forged subject references", () => {
  assert.equal(normalizeConfirmedQuestionRows([], subjects, topics), null);
  assert.equal(normalizeConfirmedQuestionRows([null], subjects, topics), null);
  assert.equal(normalizeConfirmedQuestionRows([validRow({ correct: "E" })], subjects, topics), null);
  assert.equal(normalizeConfirmedQuestionRows([validRow({ marks: "5points" })], subjects, topics), null);
  assert.equal(normalizeConfirmedQuestionRows([validRow({ optC: "" })], subjects, topics), null);
  assert.equal(normalizeConfirmedQuestionRows([validRow({ subjectName: "Other school" })], subjects, topics), null);
  assert.equal(normalizeConfirmedQuestionRows([validRow({ tags: "not-an-array" })], subjects, topics), null);
});
