// Deterministic priority/urgency engine — no AI. Spec §28.
const { daysUntil } = require('./dates');

const PRIORITY_WEIGHT = { critical: 4, high: 3, medium: 2, low: 1 };

// Returns a numeric urgency score and a bucket label for a task-like item
// (needs: due_date, priority, status).
function scoreItem(item) {
  if (item.status === 'completed' || item.status === 'cancelled') {
    return { score: -1, bucket: 'done' };
  }
  const pw = PRIORITY_WEIGHT[item.priority] || 2;
  const days = daysUntil(item.due_date);

  let deadlineScore;
  if (days === null) deadlineScore = 1; // no due date
  else if (days < 0) deadlineScore = 10; // overdue
  else if (days === 0) deadlineScore = 8; // due today
  else if (days === 1) deadlineScore = 6;
  else if (days <= 3) deadlineScore = 4;
  else if (days <= 7) deadlineScore = 2;
  else deadlineScore = 1;

  const score = deadlineScore * 2 + pw;

  let bucket;
  if (days !== null && days < 0) bucket = 'overdue';
  else if (score >= 12) bucket = 'needs_attention';
  else if (score >= 7) bucket = 'coming_soon';
  else bucket = 'can_wait';

  return { score, bucket, daysUntil: days };
}

function rankItems(items) {
  return items
    .map((item) => ({ item, ...scoreItem(item) }))
    .filter((x) => x.bucket !== 'done')
    .sort((a, b) => b.score - a.score);
}

function groupByBucket(items) {
  const ranked = rankItems(items);
  const groups = { overdue: [], needs_attention: [], coming_soon: [], can_wait: [] };
  for (const r of ranked) groups[r.bucket].push(r);
  return groups;
}

module.exports = { scoreItem, rankItems, groupByBucket, PRIORITY_WEIGHT };
