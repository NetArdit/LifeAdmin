-- LifeAdmin SQLite schema
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email_verified INTEGER NOT NULL DEFAULT 0,
  phone_verified INTEGER NOT NULL DEFAULT 0,
  theme TEXT NOT NULL DEFAULT 'system',
  language TEXT NOT NULL DEFAULT 'en',
  ai_enabled INTEGER NOT NULL DEFAULT 1,
  notif_prefs TEXT NOT NULL DEFAULT '{"task":true,"comment":true,"chat":true,"bill":true,"decision":true,"ai":true}',
  timezone TEXT, -- IANA name, e.g. Europe/Belgrade; NULL until the person's browser tells it
  reminder_prefs TEXT NOT NULL DEFAULT '{}', -- JSON: what differs from the defaults in src/lib/reminders.js
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL, -- 'phone' | 'email'
  code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'verify',
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Password-reset tokens (Phase 8.2). Only a SHA-256 hash of the token is
-- stored, so a database read never yields a usable reset link. expires_at is
-- epoch milliseconds (compared in JS, not via SQL string comparison).
-- used_at is set on successful use, and on supersession by a newer request.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);

CREATE TABLE IF NOT EXISTS families (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS family_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  phone TEXT, -- for members invited but not yet registered
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'member', -- owner | admin | member
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  muted_until TEXT, -- this member's devices stay quiet about this circle until then; the bell still fills
  UNIQUE(family_id, user_id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id INTEGER REFERENCES families(id) ON DELETE SET NULL,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'private', -- private | family
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'todo', -- todo | in_progress | completed | cancelled
  priority TEXT NOT NULL DEFAULT 'medium', -- critical | high | medium | low
  due_date TEXT, -- ISO date
  start_time TEXT, -- ISO datetime
  duration_minutes INTEGER,
  recurrence TEXT, -- null | 'daily' | 'weekly' | 'weekdays' | 'monthly'
  recurrence_until TEXT,
  reminder_mode TEXT NOT NULL DEFAULT 'default', -- default | none | custom
  reminder_minutes_before INTEGER, -- only with reminder_mode 'custom'
  notes TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_owner ON tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_family ON tasks(family_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

CREATE TABLE IF NOT EXISTS task_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comments_task ON task_comments(task_id);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_family ON messages(family_id, created_at);

CREATE TABLE IF NOT EXISTS message_reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  UNIQUE(message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- task | comment | chat | bill | decision | ai | family
  title TEXT NOT NULL,
  body TEXT,
  link TEXT, -- e.g. '#/tasks/12'
  family_id INTEGER REFERENCES families(id) ON DELETE SET NULL, -- the circle the event belongs to, if any
  push_kind TEXT, -- the fixed sentence a device shows, when it is not the one of the type
  -- The push to the person's devices (notify.js): pending (owed) | sent | none | failed | muted | quiet | left | expired; NULL: this server sends none
  push_status TEXT,
  push_attempts INTEGER NOT NULL DEFAULT 0,
  push_retry_at TEXT, -- while owed: nobody tries it again before this moment
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notif_push_owed ON notifications(id) WHERE push_status = 'pending';

CREATE TABLE IF NOT EXISTS bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id INTEGER REFERENCES families(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other', -- electricity, water, internet, phone, rent, subscription, insurance, loan, other
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  due_date TEXT NOT NULL,
  recurrence TEXT NOT NULL DEFAULT 'monthly', -- none | weekly | monthly | yearly
  status TEXT NOT NULL DEFAULT 'unpaid', -- unpaid | paid
  reminder_mode TEXT NOT NULL DEFAULT 'default', -- default | none | custom
  reminder_minutes_before INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bills_owner ON bills(owner_id);
CREATE INDEX IF NOT EXISTS idx_bills_due ON bills(due_date);

CREATE TABLE IF NOT EXISTS bill_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  paid_at TEXT NOT NULL DEFAULT (datetime('now')),
  note TEXT
);

CREATE TABLE IF NOT EXISTS decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id INTEGER REFERENCES families(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- open | decided
  recommendation TEXT, -- JSON blob: {optionId, confidence, reasoning, missingInfo}
  chosen_option_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS decision_criteria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  decision_id INTEGER NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 3 -- 1-5
);

CREATE TABLE IF NOT EXISTS decision_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  decision_id INTEGER NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pros TEXT, -- JSON array
  cons TEXT, -- JSON array
  risks TEXT, -- JSON array
  scores TEXT NOT NULL DEFAULT '{}' -- JSON: {criterionId: 1-5}
);

CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'personal', -- learning | fitness | financial | career | habit | personal
  target_date TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active | completed | abandoned
  progress INTEGER NOT NULL DEFAULT 0, -- 0-100
  reminder_mode TEXT NOT NULL DEFAULT 'default', -- default | none | custom
  reminder_minutes_before INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS goal_milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  due_date TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS eco_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- transport | energy | food | shopping | waste | water
  action TEXT NOT NULL,
  quantity REAL,
  unit TEXT,
  logged_at TEXT NOT NULL DEFAULT (datetime('now')),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_eco_owner ON eco_logs(owner_id, logged_at);

CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  family_id INTEGER REFERENCES families(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- task_created, task_completed, bill_paid, decision_made, goal_progress, comment, message, member_joined, ...
  summary TEXT NOT NULL,
  link TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_family ON activity_log(family_id, created_at);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- user | assistant
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_msg_conv ON ai_messages(conversation_id);

CREATE TABLE IF NOT EXISTS shopping_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity TEXT,
  added_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  done INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_shopping_family ON shopping_items(family_id);

-- Reminders that depend on time (src/lib/reminders.js). One row per person, item, occurrence and rule.
-- source_id has no foreign key: it names a task, a bill, a goal or a milestone, by source_type.
CREATE TABLE IF NOT EXISTS planned_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- task | bill | goal | milestone
  source_id INTEGER NOT NULL,
  occurrence_key TEXT NOT NULL, -- the due date or moment this reminder is for
  rule_key TEXT NOT NULL, -- 'before:60'
  scheduled_at TEXT NOT NULL, -- UTC, '2026-10-13T07:00:00Z'
  timezone TEXT NOT NULL, -- the zone the moment was worked out in
  status TEXT NOT NULL DEFAULT 'pending', -- pending | claimed | sent | cancelled | failed
  claimed_until TEXT, -- the lease of the run that holds the row
  claim_token TEXT, -- that run's own mark: only its holder may finish the row
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT, -- a code, never content
  sent_at TEXT,
  cancelled_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, source_type, source_id, occurrence_key, rule_key)
);

CREATE INDEX IF NOT EXISTS idx_planned_due ON planned_reminders(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_planned_source ON planned_reminders(source_type, source_id, status);

-- Browsers and phones that asked for notifications (src/lib/push.js). One row per browser. It belongs to the
-- session it was made in and goes with it. The address and the secret are stored encrypted; endpoint_hash is
-- what tells two rows of the same browser apart.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  endpoint_hash TEXT NOT NULL UNIQUE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  failures INTEGER NOT NULL DEFAULT 0,
  last_ok_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_session ON push_subscriptions(session_id);

-- How often something was tried (src/lib/ratelimit.js): one row per limit and party. The party is a keyed hash.
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  hits INTEGER NOT NULL,
  expires_at INTEGER NOT NULL, -- milliseconds: when the current window ends
  PRIMARY KEY (bucket, key_hash)
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expiry ON rate_limits(expires_at);
