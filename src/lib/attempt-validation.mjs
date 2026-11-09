const MAX_AUTOSAVED_ANSWERS = 1000;
const MAX_ANSWER_ID_LENGTH = 128;

export function normalizeAttemptAnswers(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const entries = Object.entries(value);
  if (entries.length > MAX_AUTOSAVED_ANSWERS) {
    return null;
  }

  for (const [questionId, optionId] of entries) {
    if (!questionId || questionId.length > MAX_ANSWER_ID_LENGTH) {
      return null;
    }

    const validStringOption =
      typeof optionId === "string" &&
      optionId.length > 0 &&
      optionId.length <= MAX_ANSWER_ID_LENGTH;
    const validNumericOption =
      typeof optionId === "number" &&
      Number.isSafeInteger(optionId) &&
      optionId >= 0;

    if (!validStringOption && !validNumericOption) {
      return null;
    }
  }

  return value;
}


export function normalizeAttemptSubmission(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  if (
    Object.hasOwn(value, "autoSubmit") &&
    typeof value.autoSubmit !== "boolean"
  ) {
    return null;
  }

  return { autoSubmit: value.autoSubmit === true };
}
