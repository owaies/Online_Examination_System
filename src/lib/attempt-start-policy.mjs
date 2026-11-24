/**
 * Decide whether a student should resume an existing attempt, start a new one,
 * or be blocked by the configured attempt limit.
 */
export function resolveAttemptStart({ hasActiveAttempt, attemptCount, maxAttempts }) {
  if (hasActiveAttempt) {
    return "resume";
  }

  const count = Number(attemptCount);
  const configuredLimit = Number(maxAttempts);
  const limit = Number.isSafeInteger(configuredLimit) && configuredLimit > 0
    ? configuredLimit
    : 1;

  if (!Number.isSafeInteger(count) || count < 0) {
    return "limit-reached";
  }

  return count >= limit ? "limit-reached" : "start";
}
