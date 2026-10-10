const test = require('node:test');
const assert = require('node:assert/strict');
const { startApp, makeClient, signUp } = require('./helpers');

test('decisions', async (t) => {
  const app = await startApp();
  t.after(() => app.close());

  await t.test('create a decision, add criteria and options, and get correct deterministic weighted scoring', async () => {
    const c = makeClient(app.base);
    await signUp(c);

    const created = await c.post('/api/decisions', { question: 'New laptop or repair?' });
    assert.equal(created.status, 201);
    const id = created.data.decision.id;

    const critCost = await c.post(`/api/decisions/${id}/criteria`, { name: 'Cost', weight: 5 });
    const critLongevity = await c.post(`/api/decisions/${id}/criteria`, { name: 'Longevity', weight: 3 });
    assert.equal(critCost.status, 201);

    const optRepair = await c.post(`/api/decisions/${id}/options`, { name: 'Repair' });
    const optBuy = await c.post(`/api/decisions/${id}/options`, { name: 'Buy new' });

    // Repair: cheap (5 on Cost) but not durable (2 on Longevity)
    await c.patch(`/api/decisions/${id}/options/${optRepair.data.option.id}`, { criterionId: critCost.data.criterion.id, rating: 5 });
    await c.patch(`/api/decisions/${id}/options/${optRepair.data.option.id}`, { criterionId: critLongevity.data.criterion.id, rating: 2 });
    // Buy new: expensive (2 on Cost) but durable (5 on Longevity)
    await c.patch(`/api/decisions/${id}/options/${optBuy.data.option.id}`, { criterionId: critCost.data.criterion.id, rating: 2 });
    await c.patch(`/api/decisions/${id}/options/${optBuy.data.option.id}`, { criterionId: critLongevity.data.criterion.id, rating: 5 });

    const detail = await c.get(`/api/decisions/${id}`);
    assert.equal(detail.status, 200);
    // maxPossible = (5+3)*5 = 40. Repair: 5*5 + 2*3 = 31 -> 78%. Buy: 2*5 + 5*3 = 25 -> 63%.
    const repairScore = detail.data.scoring.ranked.find((r) => r.name === 'Repair');
    const buyScore = detail.data.scoring.ranked.find((r) => r.name === 'Buy new');
    assert.equal(repairScore.weightedScore, 31);
    assert.equal(repairScore.percent, 78);
    assert.equal(buyScore.weightedScore, 25);
    assert.equal(buyScore.percent, 63);
    assert.equal(detail.data.scoring.recommendedOptionId, optRepair.data.option.id, 'the higher-weighted Cost criterion should favor Repair');
  });

  await t.test('an option missing a rating for some criterion defaults to neutral (3) and is flagged incomplete', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const decision = await c.post('/api/decisions', { question: 'Incomplete ratings test' });
    const id = decision.data.decision.id;
    const crit = await c.post(`/api/decisions/${id}/criteria`, { name: 'Only criterion', weight: 4 });
    const opt = await c.post(`/api/decisions/${id}/options`, { name: 'Unrated option' });
    void crit;

    const detail = await c.get(`/api/decisions/${id}`);
    const scored = detail.data.scoring.ranked.find((r) => r.id === opt.data.option.id);
    assert.equal(scored.incomplete, true);
    assert.equal(scored.weightedScore, 3 * 4, 'unrated criterion should default to neutral rating (3)');
  });

  await t.test('deciding records the chosen option and marks the decision decided', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const decision = await c.post('/api/decisions', { question: 'Pick one' });
    const id = decision.data.decision.id;
    const opt = await c.post(`/api/decisions/${id}/options`, { name: 'The chosen one' });

    const decided = await c.post(`/api/decisions/${id}/decide`, { optionId: opt.data.option.id });
    assert.equal(decided.status, 200);

    const detail = await c.get(`/api/decisions/${id}`);
    assert.equal(detail.data.decision.status, 'decided');
    assert.equal(detail.data.decision.chosenOptionId, opt.data.option.id);
  });

  await t.test('deciding with an option id that does not belong to this decision is rejected', async () => {
    const c = makeClient(app.base);
    await signUp(c);
    const decision = await c.post('/api/decisions', { question: 'Invalid decide test' });
    const res = await c.post(`/api/decisions/${decision.data.decision.id}/decide`, { optionId: 999999 });
    assert.equal(res.status, 400);
  });

  await t.test('decisions are private to their owner', async () => {
    const a = makeClient(app.base);
    await signUp(a);
    const decision = await a.post('/api/decisions', { question: 'Private decision' });

    const b = makeClient(app.base);
    await signUp(b);
    const res = await b.get(`/api/decisions/${decision.data.decision.id}`);
    assert.equal(res.status, 404);
  });
});
