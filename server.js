require('dotenv').config({ quiet: true });
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const { attachUser, requireAuth } = require('./src/middleware/requireAuth');
const { errorHandler } = require('./src/middleware/errorHandler');
const ai = require('./src/lib/ai');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(attachUser);

// --- Public routes ---------------------------------------------------------
app.use('/api/auth', require('./src/routes/auth'));

app.get('/api/config', (req, res) => {
  res.json({ aiConfigured: ai.isConfigured() });
});

// --- Protected API routes ---------------------------------------------------
app.use('/api/dashboard', requireAuth, require('./src/routes/dashboard'));
app.use('/api/tasks', requireAuth, require('./src/routes/tasks'));
app.use('/api/family', requireAuth, require('./src/routes/family'));
app.use('/api/chat', requireAuth, require('./src/routes/chat'));
app.use('/api/notifications', requireAuth, require('./src/routes/notifications'));
app.use('/api/bills', requireAuth, require('./src/routes/bills'));
app.use('/api/decisions', requireAuth, require('./src/routes/decisions'));
app.use('/api/ecolife', requireAuth, require('./src/routes/ecolife'));
app.use('/api/goals', requireAuth, require('./src/routes/goals'));
app.use('/api/timeline', requireAuth, require('./src/routes/timeline'));
app.use('/api/search', requireAuth, require('./src/routes/search'));
app.use('/api/ai', requireAuth, require('./src/routes/ai'));
app.use('/api/settings', requireAuth, require('./src/routes/settings'));
app.use('/api/push', requireAuth, require('./src/routes/push'));
app.use('/api/demo', requireAuth, require('./src/routes/demo'));

// --- Static frontend (single-page app) --------------------------------------
// no-cache (not no-store): the browser still keeps a copy but must revalidate
// with the server on every load, so a plain refresh always picks up CSS/JS
// edits during development instead of silently serving a stale cached copy.
app.use(express.static(path.join(__dirname, 'public'), { cacheControl: false, setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache') }));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

app.use(errorHandler);

// Only auto-start the HTTP listener when run directly (`node server.js` /
// `npm start`) — exporting `app` lets the test suite mount it on an
// ephemeral port instead, with no change to normal runtime behavior.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`LifeAdmin running at http://localhost:${PORT}`);
    if (!ai.isConfigured()) {
      console.log('AI features disabled — set GROQ_API_KEY (or ANTHROPIC_API_KEY) in .env to enable the assistant.');
    }
  });
}

module.exports = app;
