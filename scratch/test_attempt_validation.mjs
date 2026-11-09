import assert from "node:assert/strict";
import test from "node:test";

import { normalizeAttemptAnswers, normalizeAttemptSubmission } from "../src/lib/attempt-validation.mjs";

test("accepts string and numeric option identifiers", () => {
  assert.deepEqual(
    normalizeAttemptAnswers({ "101": 3, "102": "option-c" }),
    { "101": 3, "102": "option-c" },
  );
});

test("rejects missing, array, and primitive answer payloads", () => {
  for (const value of [undefined, null, [], "answers", 42]) {
    assert.equal(normalizeAttemptAnswers(value), null);
  }
});

test("rejects empty or oversized question identifiers", () => {
  assert.equal(normalizeAttemptAnswers({ "": "option-a" }), null);
  assert.equal(normalizeAttemptAnswers({ ["q".repeat(129)]: "option-a" }), null);
});

test("rejects non-scalar or empty option identifiers", () => {
  for (const optionId of ["", "x".repeat(129), null, {}, [], true]) {
    assert.equal(normalizeAttemptAnswers({ "101": optionId }), null);
  }
});

test("rejects unsafe numeric option identifiers", () => {
  for (const optionId of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(normalizeAttemptAnswers({ "101": optionId }), null);
  }
});

test("bounds the number of answers in one autosave request", () => {
  const answers = Object.fromEntries(
    Array.from({ length: 1001 }, (_, index) => [String(index + 1), index + 1]),
  );
  assert.equal(normalizeAttemptAnswers(answers), null);
});


test("normalizes valid attempt submission options", () => {
  assert.deepEqual(normalizeAttemptSubmission({ autoSubmit: true }), { autoSubmit: true });
  assert.deepEqual(normalizeAttemptSubmission({ autoSubmit: false }), { autoSubmit: false });
  assert.deepEqual(normalizeAttemptSubmission({}), { autoSubmit: false });
});

test("rejects malformed attempt submission payloads", () => {
  for (const value of [undefined, null, [], "submit", 42]) {
    assert.equal(normalizeAttemptSubmission(value), null);
  }
  for (const autoSubmit of ["true", 1, null, {}, []]) {
    assert.equal(normalizeAttemptSubmission({ autoSubmit }), null);
  }
});
