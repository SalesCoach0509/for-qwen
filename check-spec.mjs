import fs from 'node:fs';
import assert from 'node:assert/strict';
const spec=JSON.parse(fs.readFileSync(new URL('../shared/product-spec.json',import.meta.url)));
const doc=n=>fs.readFileSync(new URL('../docs/'+n+'.md',import.meta.url),'utf8');
assert.equal(spec.taxonomy.length,28);
assert.equal(new Set(spec.taxonomy.map(m=>m.id)).size,28);
for(const m of spec.taxonomy){assert.ok(doc('PERFORMANCE_MOMENT_TAXONOMY').includes(m.id));assert.ok(doc('PERFORMANCE_MOMENT_TAXONOMY').includes(m.objective));}
for(const [level,profile] of Object.entries(spec.profiles)){assert.ok(doc('SCENARIO_ENGINE_SPEC').includes(level));for(const value of Object.values(profile))assert.ok(doc('SCENARIO_ENGINE_SPEC').includes(String(value)));}
for(const p of spec.personas)for(const value of Object.values(p))assert.ok(doc('STAKEHOLDER_PERSONA_LIBRARY').includes(value));
for(const [cap,rubric] of Object.entries(spec.rubric)){assert.ok(doc('CAPABILITY_RUBRIC_LIBRARY').includes(cap));for(const anchor of Object.values(rubric.scale))assert.ok(doc('CAPABILITY_RUBRIC_LIBRARY').includes(anchor));}
const contracts=JSON.parse(fs.readFileSync(new URL('../shared/operation-contracts.json',import.meta.url)));for(const op of Object.keys(contracts))assert.ok(doc('AI_OPERATION_CATALOG').includes(op));
console.log('Specification alignment passed: 28 moments, 4 profiles, 6 personas, 8 rubrics, 13 operations.');
