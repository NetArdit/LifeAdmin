// Short encouraging lines for goal reminders. Written here, picked here: no AI call per notification, so this
// works with the AI off and costs nothing.
//
// Rules the lines keep (test/motivation.test.js checks them):
//   - no guilt, no pressure, no "behind" or "late": a reminder is an invitation;
//   - nothing that is not true: a line about progress or days left is only used when the goal really has that
//     number (there is no streak data in the app, so there is no line about a streak);
//   - no name of the goal, no money, no health detail inside a line: those stay inside the app;
//   - the line is not the same twice in a row for one person (`last` is the key used before).
//
// A line is { key, when(ctx) -> bool, text(ctx) -> string }.

const GENERIC = [
  ['g1', 'A small step today is enough.'],
  ['g2', 'Five minutes counts. Start with the easiest part.'],
  ['g3', 'You decided this mattered. One small step keeps it moving.'],
  ['g4', 'Small steps add up. Pick one you can do right now.'],
  ['g5', 'Whenever you are ready, one little push is all it takes.'],
  ['g6', 'Progress, not perfection. Take the next small step.'],
];

const BY_CATEGORY = {
  learning: [
    ['learning1', 'Ten minutes of learning today is a good day.'],
    ['learning2', 'Open it for a few minutes: curiosity does the rest.'],
  ],
  fitness: [
    ['fitness1', 'A short walk or stretch counts. Move a little today.'],
    ['fitness2', 'Your body will thank you for even a few minutes.'],
  ],
  financial: [
    ['financial1', 'A calm look at your plan for a few minutes is a good step.'],
    ['financial2', 'One small, steady step is better than none.'],
  ],
  career: [
    ['career1', 'One focused half hour moves your work forward.'],
    ['career2', 'Pick the one thing that matters most for it today.'],
  ],
  habit: [
    ['habit1', 'Habits grow from small, repeated steps. Do the small version today.'],
    ['habit2', 'Make it easy: the smallest version still counts.'],
  ],
  personal: [
    ['personal1', 'Take a moment for what matters to you.'],
    ['personal2', 'A little attention today keeps it close.'],
  ],
};

const LINES = [
  ...GENERIC.map(([key, text]) => ({ key, when: () => true, text: () => text })),
  ...Object.entries(BY_CATEGORY).flatMap(([cat, list]) => list.map(([key, text]) => ({ key, when: (c) => c.category === cat, text: () => text }))),
  { key: 'days-today', when: (c) => c.daysLeft === 0, text: () => 'Your target date is today. Whatever you can do, one small step counts.' },
  { key: 'days-1', when: (c) => c.daysLeft === 1, text: () => 'Your target date is tomorrow. A small step now keeps it calm.' },
  { key: 'days-n', when: (c) => c.daysLeft >= 2 && c.daysLeft <= 60, text: (c) => `${c.daysLeft} days to your target date. A small step today keeps it comfortable.` },
  { key: 'progress-n', when: (c) => c.progress >= 1 && c.progress <= 99, text: (c) => `You are already ${c.progress}% of the way. One more small step.` },
  { key: 'step-1', when: (c) => c.isStep, text: () => 'The next step is small and clear. Ready when you are.' },
  { key: 'step-2', when: (c) => c.isStep, text: () => 'One step at a time: this is the next one.' },
];

const DAY = 86400000;

/** Whole days from `today` (YYYY-MM-DD) to a date, or null when there is none. */
function daysUntil(date, today) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(date)) return null;
  return Math.round((Date.parse(`${date.slice(0, 10)}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY);
}

/**
 * Picks a line for a goal (or one of its steps). `last` is the key this person got before; it is never picked
 * again straight away unless it is the only one that fits. `rng` is injectable for tests.
 */
function pickMotivation({ goal, isStep = false, today, last = null, rng = Math.random }) {
  const ctx = {
    category: goal && goal.category,
    daysLeft: goal ? daysUntil(goal.target_date, today) : null,
    progress: goal && Number.isInteger(goal.progress) ? goal.progress : 0,
    isStep,
  };
  const fits = LINES.filter((l) => l.when(ctx));
  const fresh = fits.filter((l) => l.key !== last);
  const pool = fresh.length ? fresh : fits;
  const line = pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
  return { key: line.key, text: line.text(ctx) };
}

module.exports = { pickMotivation, LINES, daysUntil };
