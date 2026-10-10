// Canonical goal-progress calculation (Visual Redesign Batch 7C).
//
// Both the live API (src/routes/goals.js's recomputeProgress) and the
// demo-data seeder (src/db/seed-demo.js) need to turn a goal's milestone
// list into the same {progress, allDone} pair. Before this batch they did
// not: seed-demo.js wrote a hand-picked `progress` value directly into the
// INSERT that did not match the milestones it was simultaneously creating
// (e.g. 2-of-4 done milestones seeded alongside a stored progress of 40,
// not 50) — a real, live inconsistency found during Batch 7A/7B research.
// Factoring the calculation out once, here, means neither call site can
// drift from the other again: there is exactly one place that turns
// "which milestones are done" into "what percentage is that."
function computeProgress(milestones) {
  const total = milestones.length;
  if (!total) return { progress: 0, allDone: false };
  const done = milestones.filter((m) => m.done).length;
  return { progress: Math.round((done / total) * 100), allDone: done === total };
}

module.exports = { computeProgress };
