export function parsePositiveInteger(value) {
  const normalized = typeof value === "string" ? value.trim() : value;
  if (typeof normalized === "number") {
    return Number.isSafeInteger(normalized) && normalized > 0 ? normalized : null;
  }
  if (typeof normalized !== "string" || !/^\d+$/.test(normalized)) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function normalizeConfirmedQuestionRows(rows, subjects, topics) {
  if (!Array.isArray(rows) || rows.length === 0 || !Array.isArray(subjects) || !Array.isArray(topics)) {
    return null;
  }

  const subjectIds = new Map(
    subjects.map((subject) => [String(subject.name ?? "").trim().toLowerCase(), subject.id]),
  );
  const topicIds = new Map(
    topics.map((topic) => [
      String(topic.subject_id) + "_" + String(topic.name ?? "").trim().toLowerCase(),
      topic.id,
    ]),
  );

  const normalizedRows = [];
  for (const row of rows) {
    if (!row || typeof row !== "object" || Array.isArray(row)) return null;

    const question = typeof row.question === "string" ? row.question.trim() : "";
    const optA = typeof row.optA === "string" ? row.optA.trim() : "";
    const optB = typeof row.optB === "string" ? row.optB.trim() : "";
    const optC = typeof row.optC === "string" ? row.optC.trim() : "";
    const optD = typeof row.optD === "string" ? row.optD.trim() : "";
    const correct = typeof row.correct === "string" ? row.correct.trim().toUpperCase() : "";
    const marks = parsePositiveInteger(row.marks);
    const difficulty = typeof row.difficulty === "string"
      ? row.difficulty.trim().toUpperCase()
      : "UNSPECIFIED";
    const subjectName = typeof row.subjectName === "string" ? row.subjectName.trim() : "";
    const subjectId = subjectIds.get(subjectName.toLowerCase());
    const topicName = typeof row.topicName === "string" ? row.topicName.trim() : "";
    const topicId = topicName && subjectId
      ? topicIds.get(String(subjectId) + "_" + topicName.toLowerCase()) ?? null
      : null;
    const explanation = row.explanation == null
      ? ""
      : typeof row.explanation === "string" ? row.explanation.trim() : null;
    const tags = row.tags === undefined ? [] : row.tags;

    if (
      !question ||
      !optA || !optB || !optC || !optD ||
      !["A", "B", "C", "D"].includes(correct) ||
      marks === null ||
      !["EASY", "MEDIUM", "HARD", "UNSPECIFIED"].includes(difficulty) ||
      !subjectId ||
      explanation === null ||
      !Array.isArray(tags) ||
      !tags.every((tag) => typeof tag === "string")
    ) {
      return null;
    }

    normalizedRows.push({
      question,
      optA,
      optB,
      optC,
      optD,
      correct,
      marks,
      difficulty,
      subjectName,
      subjectId,
      topicName,
      topicId,
      explanation,
      tags: tags.map((tag) => tag.trim()).filter(Boolean),
    });
  }

  return normalizedRows;
}
