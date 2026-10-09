// These domain checks run inside the browser against the same modules as the UI.
import { test, expect } from '@playwright/test';
import { gateway, login, plan, saved } from './consolidated-fixture';
test.use({launchOptions:process.env.PLAYWRIGHT_CHROME_PATH?{executablePath:process.env.PLAYWRIGHT_CHROME_PATH}:{},video:'off'});
test('forged quotes and stakeholder statements cannot produce an employee score',async({page})=>{
 await gateway(page);await login(page);
 await page.route('**/api/ai/chat',async(route)=>{
  const body=route.request().postDataJSON();if(body.options.operation!=='PRACTICE_EVIDENCE_EXTRACTION')return route.fallback();
  return route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({content:JSON.stringify({evidence:[{turnNumber:1,sourceText:'I need certainty.',behaviorObserved:'Recognised risk',classification:'OBSERVED',confidence:.9},{turnNumber:2,sourceText:'I confirmed the decision criteria',behaviorObserved:'Asked excellent questions',classification:'OBSERVED',confidence:.9}]})})});
 });
 const result=await page.evaluate(async()=>{
  const {generatePracticeAssessment}=await import('/src/assessment-service.ts');
  return generatePracticeAssessment([{role:'ai',content:'I need certainty.'},{role:'user',content:'Hello'},{role:'ai',content:'Tell me more'}],{interactionId:'i',targetCapability:'Objection Handling',stakeholderRole:'CFO'},'forgery-test');
 });expect(result.capabilityScores[0].evidence).toEqual([]);expect(result.readiness).toBe('INSUFFICIENT_EVIDENCE');expect(result.capabilityScores[0].score).toBe(0);
});
test('transcript facts, intended behavior and missing opportunity stay grounded',async({page})=>{
 await gateway(page);await login(page);await plan(page);
 await page.route('**/api/ai/chat',async route=>{const b=route.request().postDataJSON();if(b.options.operation!=='TRANSCRIPT_FACT_EXTRACTION')return route.fallback();return route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({content:JSON.stringify({facts:[{line:1,speaker:'You',sourceText:'Delivery worries me.',confidence:.9,eventType:'OBJECTION'},{line:2,speaker:'You',sourceText:'Invented response',confidence:.9,eventType:'CLARIFICATION'}]})})});});
 const a=await page.evaluate(async()=>{const {store}=await import('/src/store.ts');const {analyzeSemantically}=await import('/src/analysis-pipeline.ts');return analyzeSemantically('Customer: Delivery worries me.\nYou: Hello.',store.getState().interactions[0],store.getState().briefs[0],'tx-forged');});
 expect(a.capabilityDiagnosis[0].evidence).toEqual([]);expect(a.planVsActual[0].actual).toBe('NOT OBSERVED');expect(a.planVsActual[0].execution).toBe('NOT_OBSERVABLE');expect(a.planVsActual[0].confidence).toBe(0);
});
test('memory is immutable, source-idempotent and requires three independent pattern sources',async({page})=>{
 await gateway(page);await login(page);
 const result=await page.evaluate(async()=>{
  const {updateCapabilityHistory}=await import('/src/capability-memory.ts');
  const evidence=(n:number)=>({evidenceId:'e'+n,interactionId:'i'+n,sessionId:'s'+n,sourceId:'s'+n,sourceType:'PRACTICE',speaker:'Employee',sourceText:'What concerns you?',statement:'Clarified concern',behaviorObserved:'Clarified concern',source:'roleplay',classification:'OBSERVED',confidence:.8,timestamp:new Date().toISOString()});
  const score={capability:'Objection Handling',score:3,level:3,evidence:[evidence(1)],confidence:.8,recommendedIntervention:'Clarify first'};
  const first=await updateCapabilityHistory([], [score], 'Practice');const snapshot=JSON.stringify(first);
  const duplicate=await updateCapabilityHistory(first,[score],'Practice');
  const second=await updateCapabilityHistory(first,[{...score,evidence:[evidence(2)]}],'Practice');
  return {firstUnchanged:JSON.stringify(first)===snapshot,first,duplicate,second};
 });expect(result.firstUnchanged).toBe(true);expect(result.duplicate).toEqual(result.first);expect(result.second[0].scores).toHaveLength(2);expect(result.second[0].evidenceHistory).toHaveLength(2);expect(result.second[0].patterns).toEqual([]);
});
test('memory judge failure leaves estimate unchanged and records NO_CHANGE',async({page})=>{
 await gateway(page,{fail:'CAPABILITY_UPDATE_JUDGE'});await login(page);
 const result=await page.evaluate(async()=>{const {updateCapabilityHistory}=await import('/src/capability-memory.ts');return updateCapabilityHistory([{capability:'Discovery',scores:[{date:new Date().toISOString(),score:3,source:'Practice',sourceId:'old'}],currentScore:3,trend:'stable',evidenceHistory:[]}],[{capability:'Discovery',score:5,level:5,confidence:.9,evidence:[{evidenceId:'new',sourceId:'new',sourceText:'What matters?',statement:'Asked',classification:'OBSERVED',confidence:.9}]}],'Practice');});
 expect(result[0].currentScore).toBe(3);expect(result[0].scores).toHaveLength(1);expect(result[0].updateDecision.decision).toBe('NO_CHANGE');
});
test('leaving practice ignores the delayed response and records incomplete session',async({page})=>{
 await gateway(page);await login(page);await plan(page);let release:()=>void=()=>{};const pending=new Promise<void>(r=>release=r);
 await page.route('**/api/ai/roleplay/respond',async route=>{await pending;const b=route.request().postDataJSON();await route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({stakeholderResponse:'Late response',sessionId:b.sessionId,interactionId:b.config.interactionId,interactionState:'CURIOUS'})});});
 await page.getByRole('button',{name:'Practice this moment',exact:true}).first().click();await expect(page.getByRole('heading',{name:'Practice this moment',exact:true})).toBeVisible();await page.locator('header button').first().click();release();await expect(page.getByRole('heading',{name:'AI Performance Coach',exact:true})).toBeVisible();await page.waitForTimeout(200);
 const s=await saved(page);expect(s.practiceSessions[0].status).toBe('failed');expect(s.practiceSessions[0].turns).toEqual([]);expect(s.practiceEvaluations).toEqual([]);expect(s.interactions[0].status).toBe('PRACTICE_FAILED');
});
test('store rejects cross-session evaluation, invalid lifecycle and stale transcript analysis',async({page})=>{
 await gateway(page);await login(page);await plan(page);
 const result=await page.evaluate(async()=>{
  const {store}=await import('/src/store.ts');const i=store.getState().interactions[0];const failures=[];
  for(const run of [()=>store.transitionInteraction(i.id,'ANALYZED'),()=>store.addPracticeEvaluation({id:'e',interactionId:i.id,sessionId:'wrong'}),()=>store.addAnalysis({id:'a',interactionId:i.id,transcriptId:'wrong'}),()=>store.updateInteraction(i.id,{status:'READY'})]){try{run();failures.push(false);}catch{failures.push(true);}}
  return failures;
 });expect(result).toEqual([true,true,true,true]);
});
test('custom scenario preserves supplied facts',async({page})=>{
 const calls=await gateway(page);await login(page);await plan(page);await page.getByRole('button',{name:'Customize practice scenario'}).click();
 await page.getByLabel(/Solution|Product/).first().fill('Actual solution');
 await page.getByLabel('Known facts').fill('Customer supplied fact');await page.getByRole('button',{name:/Generate.*[Ss]cenario/}).click();await expect(page.getByText('Custom value discussion',{exact:true})).toBeVisible();
 const s=await saved(page);expect(s.interactions[0].scenarioPlan.knownFacts).toEqual(['Customer supplied fact']);expect(calls.some(c=>c.options?.operation==='SCENARIO_PLAN_GENERATION')).toBe(true);
});
test('failed custom scenario saves no scenario and keeps prepared lifecycle',async({page})=>{
 await gateway(page,{fail:'SCENARIO_PLAN_GENERATION'});await login(page);await plan(page);await page.getByRole('button',{name:'Customize practice scenario'}).click();await page.getByLabel('Solution being sold').fill('Actual solution');await page.getByRole('button',{name:'Generate scenario plan',exact:true}).click();await expect(page.getByText(/Test provider failure/)).toBeVisible();const s=await saved(page);expect(s.interactions[0].scenarioPlan).toBeUndefined();expect(s.interactions[0].status).toBe('PREPARED');
});
test('saved legacy status and custom scenario survive migration',async({page})=>{
 const calls=await gateway(page);await login(page);await plan(page);
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('performance_coach_state')!);s.interactions[0].status='prepared';s.interactions[0].scenarioPlan={scenarioTitle:'Saved scenario',stakeholderRole:'Procurement Lead',objectives:['Clarify risk'],likelyObjections:['Risk'],pressureLevel:'high',personality:'Direct',commercialConstraints:'Unknown',hiddenPriorities:[],desiredOutcome:'Agree review',module:'negotiation'};localStorage.setItem('performance_coach_state',JSON.stringify(s));});
 await page.reload();await page.getByRole('button',{name:'Practice this moment',exact:true}).first().click();await expect(page.getByRole('heading',{name:'Saved scenario'})).toBeVisible();await expect(page.getByText('I am concerned about the delivery timeline.',{exact:true})).toBeVisible();expect(calls.find(c=>c.config)?.config.stakeholderRole).toBe('Procurement Lead');expect((await saved(page)).interactions[0].status).toBe('PRACTICING');
});
test('weak scored practice never marks the moment ready',async({page})=>{
 await gateway(page,{score:1.5});await login(page);await plan(page);await page.getByRole('button',{name:'Practice this moment',exact:true}).first().click();await expect(page.getByPlaceholder('Respond naturally as yourself...')).toBeEnabled();await page.getByPlaceholder('Respond naturally as yourself...').fill('What concerns you?');await page.getByPlaceholder('Respond naturally as yourself...').press('Enter');await expect(page.getByText('The delivery timeline is my concern. What is the next step?',{exact:true})).toBeVisible();await page.getByRole('button',{name:'End & evaluate'}).click();await expect(page.getByText('PRACTICE ONCE MORE',{exact:true})).toBeVisible();expect((await saved(page)).interactions[0].status).not.toBe('READY');
});
test('wrong response session fails without showing another session dialogue',async({page})=>{
 await gateway(page);await login(page);await plan(page);await page.route('**/api/ai/roleplay/respond',async route=>{const b=route.request().postDataJSON();return route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({stakeholderResponse:'Another employee response',sessionId:'wrong-session',interactionId:b.config.interactionId,interactionState:'CURIOUS'})});});await page.getByRole('button',{name:'Practice this moment',exact:true}).first().click();await expect(page.getByText('Practice could not be completed. No performance assessment was generated.',{exact:true})).toBeVisible();await expect(page.getByText('Another employee response',{exact:true})).toHaveCount(0);expect((await saved(page)).practiceEvaluations).toEqual([]);
});
test('all validation gates execute production operations using the explicit test gateway',async({page})=>{
 const calls=await gateway(page);await login(page);await page.getByRole('button',{name:'MVP Validation',exact:true}).click();await page.getByRole('button',{name:'Run Validation Suite'}).click();await expect(page.getByText('PASS',{exact:true})).toHaveCount(5);expect(calls.filter(c=>c.options?.operation==='CAPABILITY_EVALUATION').length).toBeGreaterThanOrEqual(3);expect((await saved(page)).capabilityHistory).toEqual([]);expect((await saved(page)).interactions).toEqual([]);
});
test('local employee profiles retain separate histories',async({page})=>{
 await gateway(page);await login(page);await plan(page);await page.reload();await page.getByRole('button',{name:'Sign Out'}).click();await page.getByPlaceholder('Your name').fill('Other Employee');await page.getByPlaceholder('your.email@company.com').fill('other@example.com');await page.getByRole('button',{name:'Sign In',exact:true}).click();expect((await saved(page)).interactions).toEqual([]);
 await page.getByRole('button',{name:'Sign Out'}).click();await page.getByPlaceholder('Your name').fill('Test Employee');await page.getByPlaceholder('your.email@company.com').fill('test@example.com');await page.getByRole('button',{name:'Sign In',exact:true}).click();expect((await saved(page)).interactions).toHaveLength(1);
});
