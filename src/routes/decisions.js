const express = require('express');
const db = require('../db');
const { asyncRoute } = require('../middleware/errorHandler');
const { isNonEmpty, ValidationError } = require('../lib/validate');
const { logActivity } = require('../lib/family');
const { safeJson } = require('../lib/auth');
const ai = require('../lib/ai');

const router = express.Router();

function loadFull(decisionId, userId) {
  const decision = db.get('SELECT * FROM decisions WHERE id = ? AND owner_id = ?', [decisionId, userId]);
  if (!decision) return null;
  const criteria = db.all('SELECT * FROM decision_criteria WHERE decision_id = ?', [decisionId]);
  const options = db.all('SELECT * FROM decision_options WHERE decision_id = ?', [decisionId]);
  return { decision, criteria, options };
}

// Deterministic weighted scoring (spec §16: user can change weights, math is
// never delegated to the AI). Missing ratings default to neutral (3) and are
// flagged as incomplete so confidence reflects that.
function scoreOptions(criteria, options) {
  const maxPossible = criteria.reduce((s, c) => s + c.weight, 0) * 5 || 1;
  const scored = options.map((o) => {
    const ratings = safeJson(o.scores, {});
    let total = 0;
    let incomplete = false;
    for (const c of criteria) {
      const r = ratings[String(c.id)];
      if (r == null) {
        incomplete = true;
        total += 3 * c.weight; // neutral default
      } else {
        total += r * c.weight;
      }
    }
    return {
      id: o.id,
      name: o.name,
      pros: safeJson(o.pros, []),
      cons: safeJson(o.cons, []),
      risks: safeJson(o.risks, []),
      ratings,
      weightedScore: total,
      percent: Math.round((total / maxPossible) * 100),
      incomplete,
    };
  });
  scored.sort((a, b) => b.weightedScore - a.weightedScore);

  let confidence = 'low';
  if (scored.length >= 2) {
    const gapPct = ((scored[0].weightedScore - scored[1].weightedScore) / maxPossible) * 100;
    if (gapPct > 15 && !scored[0].incomplete) confidence = 'high';
    else if (gapPct > 5) confidence = 'medium';
  } else if (scored.length === 1) {
    confidence = 'medium';
  }

  return { ranked: scored, confidence, recommendedOptionId: scored[0] ? scored[0].id : null };
}

function mapDecision(d) {
  return {
    id: d.id,
    question: d.question,
    status: d.status,
    chosenOptionId: d.chosen_option_id,
    recommendation: safeJson(d.recommendation, null),
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  };
}

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const rows = db.all('SELECT * FROM decisions WHERE owner_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json({ decisions: rows.map(mapDecision) });
  })
);

router.post(
  '/',
  asyncRoute(async (req, res) => {
    const question = req.body && req.body.question;
    if (!isNonEmpty(question)) throw new ValidationError('Describe the decision you want help with.');
    const result = db.run('INSERT INTO decisions (owner_id, question) VALUES (?, ?)', [req.user.id, question.trim()]);
    res.status(201).json({ decision: mapDecision(db.get('SELECT * FROM decisions WHERE id = ?', [result.lastInsertRowid])) });
  })
);

router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const full = loadFull(req.params.id, req.user.id);
    if (!full) return res.status(404).json({ error: 'Decision not found.' });
    const scoring = scoreOptions(full.criteria, full.options);
    res.json({
      decision: mapDecision(full.decision),
      criteria: full.criteria.map((c) => ({ id: c.id, name: c.name, weight: c.weight })),
      options: full.options.map((o) => ({ id: o.id, name: o.name, pros: safeJson(o.pros, []), cons: safeJson(o.cons, []), risks: safeJson(o.risks, []) })),
      scoring,
    });
  })
);

// Ask AI to propose criteria + analyze options (pros/cons/risks/ratings).
// The weighted math itself is always computed deterministically above.
router.post(
  '/:id/analyze',
  asyncRoute(async (req, res) => {
    const full = loadFull(req.params.id, req.user.id);
    if (!full) return res.status(404).json({ error: 'Decision not found.' });

    const existingOptions = (req.body && req.body.options) || full.options.map((o) => o.name);
    if (!existingOptions.length) throw new ValidationError('Add at least one option to analyze.');

    const result = await ai.analyzeDecision({
      question: full.decision.question,
      existingOptions,
      existingCriteria: full.criteria.map((c) => c.name),
    });
    if (!result.ok) return res.json(result);

    const data = result.data;

    // Merge suggested criteria (only add ones that don't already exist by name).
    const existingCriteriaNames = new Set(full.criteria.map((c) => c.name.toLowerCase()));
    for (const c of data.suggestedCriteria) {
      if (!existingCriteriaNames.has(c.name.toLowerCase())) {
        db.run('INSERT INTO decision_criteria (decision_id, name, weight) VALUES (?, ?, ?)', [
          full.decision.id,
          c.name,
          c.weight,
        ]);
        existingCriteriaNames.add(c.name.toLowerCase());
      }
    }
    const criteria = db.all('SELECT * FROM decision_criteria WHERE decision_id = ?', [full.decision.id]);
    const criteriaByName = Object.fromEntries(criteria.map((c) => [c.name.toLowerCase(), c]));

    // Upsert options with AI analysis.
    const existingOptionsByName = Object.fromEntries(full.options.map((o) => [o.name.toLowerCase(), o]));
    for (const opt of data.options) {
      const ratingsById = {};
      for (const [critName, rating] of Object.entries(opt.ratings || {})) {
        const crit = criteriaByName[critName.toLowerCase()];
        if (crit) ratingsById[crit.id] = rating;
      }
      const existing = existingOptionsByName[opt.name.toLowerCase()];
      if (existing) {
        db.run('UPDATE decision_options SET pros = ?, cons = ?, risks = ?, scores = ? WHERE id = ?', [
          JSON.stringify(opt.pros || []),
          JSON.stringify(opt.cons || []),
          JSON.stringify(opt.risks || []),
          JSON.stringify(ratingsById),
          existing.id,
        ]);
      } else {
        db.run('INSERT INTO decision_options (decision_id, name, pros, cons, risks, scores) VALUES (?,?,?,?,?,?)', [
          full.decision.id,
          opt.name,
          JSON.stringify(opt.pros || []),
          JSON.stringify(opt.cons || []),
          JSON.stringify(opt.risks || []),
          JSON.stringify(ratingsById),
        ]);
      }
    }

    const finalOptions = db.all('SELECT * FROM decision_options WHERE decision_id = ?', [full.decision.id]);
    const scoring = scoreOptions(criteria, finalOptions);
    const recommendation = {
      reasoningSummary: data.reasoningSummary,
      missingInfo: data.missingInfo,
      confidence: scoring.confidence,
      recommendedOptionId: scoring.recommendedOptionId,
    };
    db.run("UPDATE decisions SET recommendation = ?, updated_at = datetime('now') WHERE id = ?", [
      JSON.stringify(recommendation),
      full.decision.id,
    ]);

    res.json({
      ok: true,
      decision: mapDecision(db.get('SELECT * FROM decisions WHERE id = ?', [full.decision.id])),
      criteria: criteria.map((c) => ({ id: c.id, name: c.name, weight: c.weight })),
      options: finalOptions.map((o) => ({ id: o.id, name: o.name, pros: safeJson(o.pros, []), cons: safeJson(o.cons, []), risks: safeJson(o.risks, []) })),
      scoring,
    });
  })
);

router.post(
  '/:id/criteria',
  asyncRoute(async (req, res) => {
    const full = loadFull(req.params.id, req.user.id);
    if (!full) return res.status(404).json({ error: 'Decision not found.' });
    const { name, weight } = req.body || {};
    if (!isNonEmpty(name)) throw new ValidationError('Criterion name is required.');
    const result = db.run('INSERT INTO decision_criteria (decision_id, name, weight) VALUES (?, ?, ?)', [
      full.decision.id,
      name.trim(),
      Math.min(5, Math.max(1, Number(weight) || 3)),
    ]);
    res.status(201).json({ criterion: db.get('SELECT * FROM decision_criteria WHERE id = ?', [result.lastInsertRowid]) });
  })
);

router.patch(
  '/:id/criteria/:critId',
  asyncRoute(async (req, res) => {
    const full = loadFull(req.params.id, req.user.id);
    if (!full) return res.status(404).json({ error: 'Decision not found.' });
    const weight = Math.min(5, Math.max(1, Number(req.body && req.body.weight) || 3));
    db.run('UPDATE decision_criteria SET weight = ? WHERE id = ? AND decision_id = ?', [weight, req.params.critId, full.decision.id]);
    res.json({ ok: true });
  })
);

router.delete(
  '/:id/criteria/:critId',
  asyncRoute(async (req, res) => {
    const full = loadFull(req.params.id, req.user.id);
    if (!full) return res.status(404).json({ error: 'Decision not found.' });
    db.run('DELETE FROM decision_criteria WHERE id = ? AND decision_id = ?', [req.params.critId, full.decision.id]);
    res.json({ ok: true });
  })
);

router.post(
  '/:id/options',
  asyncRoute(async (req, res) => {
    const full = loadFull(req.params.id, req.user.id);
    if (!full) return res.status(404).json({ error: 'Decision not found.' });
    const { name } = req.body || {};
    if (!isNonEmpty(name)) throw new ValidationError('Option name is required.');
    const result = db.run('INSERT INTO decision_options (decision_id, name) VALUES (?, ?)', [full.decision.id, name.trim()]);
    res.status(201).json({ option: db.get('SELECT * FROM decision_options WHERE id = ?', [result.lastInsertRowid]) });
  })
);

router.patch(
  '/:id/options/:optId',
  asyncRoute(async (req, res) => {
    const full = loadFull(req.params.id, req.user.id);
    if (!full) return res.status(404).json({ error: 'Decision not found.' });
    const option = full.options.find((o) => String(o.id) === req.params.optId);
    if (!option) return res.status(404).json({ error: 'Option not found.' });

    const b = req.body || {};
    if (b.criterionId != null && b.rating != null) {
      const scores = safeJson(option.scores, {});
      scores[String(b.criterionId)] = Math.min(5, Math.max(1, Number(b.rating)));
      db.run('UPDATE decision_options SET scores = ? WHERE id = ?', [JSON.stringify(scores), option.id]);
    }
    if (b.pros) db.run('UPDATE decision_options SET pros = ? WHERE id = ?', [JSON.stringify(b.pros), option.id]);
    if (b.cons) db.run('UPDATE decision_options SET cons = ? WHERE id = ?', [JSON.stringify(b.cons), option.id]);
    res.json({ ok: true });
  })
);

router.delete(
  '/:id/options/:optId',
  asyncRoute(async (req, res) => {
    const full = loadFull(req.params.id, req.user.id);
    if (!full) return res.status(404).json({ error: 'Decision not found.' });
    db.run('DELETE FROM decision_options WHERE id = ? AND decision_id = ?', [req.params.optId, full.decision.id]);
    res.json({ ok: true });
  })
);

router.post(
  '/:id/decide',
  asyncRoute(async (req, res) => {
    const full = loadFull(req.params.id, req.user.id);
    if (!full) return res.status(404).json({ error: 'Decision not found.' });
    const optionId = req.body && req.body.optionId;
    if (!full.options.find((o) => o.id === optionId)) throw new ValidationError('Invalid option.');
    db.run("UPDATE decisions SET status = 'decided', chosen_option_id = ?, updated_at = datetime('now') WHERE id = ?", [
      optionId,
      full.decision.id,
    ]);
    logActivity({
      userId: req.user.id,
      familyId: full.decision.family_id,
      type: 'decision_made',
      summary: `${req.user.first_name} decided: "${full.decision.question}"`,
      link: `#/decisionflow/${full.decision.id}`,
    });
    res.json({ ok: true });
  })
);

router.delete(
  '/:id',
  asyncRoute(async (req, res) => {
    const full = loadFull(req.params.id, req.user.id);
    if (!full) return res.status(404).json({ error: 'Decision not found.' });
    db.run('DELETE FROM decisions WHERE id = ?', [full.decision.id]);
    res.json({ ok: true });
  })
);

module.exports = router;
