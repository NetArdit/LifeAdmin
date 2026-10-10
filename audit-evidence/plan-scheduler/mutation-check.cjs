const fs = require('fs');
const { spawnSync } = require('child_process');
process.chdir('C:/Users/Promotech/OneDrive/Desktop/claude projects/LifeAdmin-main');
const muts = [
  ['M1 reintroduce buildBusyBlocks double-merge', 'src/lib/scheduler.js', 'blocks.push(...extra);\n  return blocks;', 'blocks.push(...extra);\n  return mergeBlocks(blocks);', 'test/scheduler.test.js'],
  ['M2 remove minBlock guard (old fragmentation bug)', 'src/lib/scheduler.js', 'const use = Math.min(avail, maxMinutes);\n      if (use < minMinutes) continue;', 'const use = Math.min(avail, maxMinutes);', 'test/scheduler.test.js'],
  ['M3 break overnight split (always single range)', 'src/lib/scheduler.js', 'if (endMin > startMin) return [{ start: startMin, end: endMin }];\n  return [\n    { start: startMin, end: DAY_MINUTES },\n    { start: 0, end: endMin },\n  ];', 'return [{ start: startMin, end: endMin }];', 'test/scheduler.test.js'],
  ['M4 revert /plan/apply to server-side date reconstruction', 'src/routes/ai.js', "const startMs = Date.parse(block && block.startISO);\n        const endMs = Date.parse(block && block.endISO);", "const startMs = new Date(`${date}T${block.start}:00`).getTime();\n        const endMs = new Date(`${date}T${block.end}:00`).getTime();", 'test/plan-apply.test.js'],
  ['M5 remove db.tx atomicity wrap', 'src/routes/ai.js', 'let created = 0;\n    db.tx(() => {\n      for (const b of blocks) {', 'let created = 0;\n    (() => {\n      for (const b of blocks) {', 'test/plan-apply.test.js'],
];
for (const [name, file, a, b, testFile] of muts) {
  const orig = fs.readFileSync(file, 'utf8');
  if (!orig.includes(a)) { console.log('?? ' + name + ': anchor missing'); continue; }
  fs.writeFileSync(file, orig.replace(a, () => b));
  const res = spawnSync(process.execPath, ['--test', testFile], { encoding: 'utf8', timeout: 60000 });
  fs.writeFileSync(file, orig);
  const m = /ℹ fail (\d+)/.exec(res.stdout || '');
  const n = m ? Number(m[1]) : -1;
  console.log((n > 0 ? 'CAUGHT ' : 'MISSED!') + '  ' + name + '  (failing: ' + n + ')');
}
