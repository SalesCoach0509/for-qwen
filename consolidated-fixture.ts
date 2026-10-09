import { Page, expect } from '@playwright/test';
export async function gateway(page:Page,options:{fail?:string;malformed?:string;score?:number}={}){
 const calls:any[]=[];
 await page.route('http://localhost:3001/**',async route=>{
  const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
  const send=(body:unknown,status=200)=>route.fulfill({status,headers,contentType:'application/json',body:JSON.stringify(body)});
  if(route.request().method()==='OPTIONS')return send({},204);
  if(route.request().url().endsWith('/api/health'))return send({status:options.fail==='all'?'degraded':'ok',apiKeySet:options.fail!=='all',provider:'contract-test',model:'fixture'});
  if(route.request().url().endsWith('/api/diagnostic/llm-test'))return send({success:options.fail!=='all'},options.fail==='all'?503:200);
  const body=route.request().postDataJSON(),op=body.options?.operation||'ROLEPLAY';calls.push(body);
  if(options.fail===op||options.fail==='all')return send({error:'LIVE_AI_ERROR',message:'Test provider failure'},503);
  if(options.malformed===op)return send({content:'{}'});
  if(op==='ROLEPLAY')return send({stakeholderResponse:body.userMessage?'The delivery timeline is my concern. What is the next step?':'I am concerned about the delivery timeline.',response:'Unused alias',sessionId:body.sessionId,interactionId:body.config.interactionId,interactionState:'CONCERNED',objectionStatus:'OPEN',difficulty:'medium',capabilityBeingTested:body.config.targetCapability});
  let p:any={};try{p=JSON.parse(body.messages[1].content);}catch{}
  let out:any;
  switch(op){
   case 'CONTEXT_INTAKE':out={customer:'Suggested Acme',stakeholderRole:'CFO',interactionType:'renewal',objective:'Suggested objective',experienceLevel:'Advanced',focusCapability:'Objection Handling'};break;
   case 'CONTEXT_RISK_INTERPRETATION':out={behavior:'Responding before clarifying',meetingImplication:'The underlying concern remains unclear',successBehavior:'Clarify the delivery concern first',evidenceIds:(p.evidence||[]).map((e:any)=>e.evidenceId),confidence:.8,pattern:'Repeated early responses'};break;
   case 'PERFORMANCE_PLAN_GENERATION':out={objective:p.interaction.objective||'Agree next steps',stakeholderPriorities:['Delivery confidence'],relevantContext:[],commercialGuidance:{tradeOffs:[],escalationItems:[]},likelyObjections:['Possible delivery concern'],recommendedQuestions:['What is the main concern?','What would success look like?','Who owns the next step?','What is the date?'],recommendedPositioning:['Tie value to the stated concern'],thingsToAvoid:[],personalCoachingFocus:'Clarify first',practiceRecommendation:p.priorLearning?'Apply previous learning: '+p.priorLearning:'Practice clarification',unknowns:['Policy'],intendedBehaviors:[{id:'b1',behavior:'Clarify before responding',priority:'high',successCriterion:'Ask a diagnostic question'}],watchOuts:[{behavior:'Premature concession',whyItMatters:'Unresolved risk',preferredAlternative:'Clarify first'}],items:[{text:'Fabricated fact',classification:'KNOWN',source:'Fabricated fact',evidenceIds:[]},{text:'Discount authority',classification:'UNKNOWN',source:'No supplied policy',evidenceIds:[]}]};break;
   case 'PRACTICE_EVIDENCE_EXTRACTION':out={evidence:p.turns.filter((t:any)=>t.role==='user').map((t:any)=>({turnNumber:t.turnNumber,sourceText:t.content,behaviorObserved:'Asked for clarification',classification:'OBSERVED',confidence:.9}))};break;
   case 'CAPABILITY_EVALUATION':out={score:p.evidence.length?(options.score??3.8):null,confidence:.85,strength:'Clarified the concern',weakness:'Confirm the next step',dimensions:{Clarification:{score:options.score??3.8,evidenceIds:p.evidence.map((e:any)=>e.evidenceId),opportunity:p.evidence.length>0},Advancement:{score:1,evidenceIds:[],opportunity:false}}};break;
   case 'ASSESSMENT_JUDGE':out={approvedEvidenceIds:p.evidence.map((e:any)=>e.evidenceId),approvedDimensions:['Clarification','Advancement'],approvedRowIndices:p.planComparison?.rows.map((_:any,i:number)=>i)||[],scoreSupported:p.evidence.length>0,confidence:.85,reason:'Supported by source'};break;
   case 'PRACTICE_INTERVENTION_GENERATION':out={recommendation:'Rehearse owner and date',successCriterion:'Agree both'};break;
   case 'TRANSCRIPT_FACT_EXTRACTION':out={facts:p.lines.filter((l:any)=>l.text.includes(':')).map((l:any)=>({line:l.line,speaker:l.text.split(':')[0],sourceText:l.text.slice(l.text.indexOf(':')+1).trim(),eventType:'QUESTION',confidence:.9}))};break;
   case 'BEHAVIOR_EXTRACTION':out={behaviors:p.facts.filter((f:any)=>f.speakerType==='EMPLOYEE').map((f:any)=>({description:'Asked for clarification',evidenceIds:[f.id],classification:'OBSERVED'}))};break;
   case 'PLAN_VS_ACTUAL':out={rows:p.intendedBehaviors.map((b:any)=>({behaviorId:b.id,actual:'Asked for clarification',evidenceIds:p.facts.filter((f:any)=>f.speakerType==='EMPLOYEE').map((f:any)=>f.id),impact:'Medium',confidence:.8,whyItMatters:'Clarification improves relevance',execution:'SUCCESSFUL'}))};break;
   case 'INTERVENTION_GENERATION':out={title:'Confirm ownership',targetBehavior:'Agree owner and date',whyItMatters:'Clarity on follow-up',exercise:'Practice the final commitment',difficulty:'medium',successCriterion:'Confirm owner and date',evidenceIds:p.diagnosis.evidence.map((e:any)=>e.evidenceId)};break;
   case 'CAPABILITY_UPDATE_JUDGE':out={decision:'UPDATED',reason:'Supported observation',confidence:.8,patterns:['Invalid one-source pattern'],patternSourceIds:p.sourceIds,interventionOutcome:'insufficient_evidence'};break;
   case 'SCENARIO_PLAN_GENERATION':out={scenarioTitle:'Custom value discussion',stakeholderRole:'CFO',personality:'Skeptical',objectives:['Understand value'],likelyObjections:['Delivery uncertainty'],desiredOutcome:'Agree review',requiredBehaviors:['Clarify the concern'],forbiddenMoves:['Invent facts'],knownFacts:['Fabricated fact'],unknowns:[],objectionLadder:[],triggerConditions:[]};break;
   default:throw new Error('Unrecognised test operation '+op);
  }
  if(op==='SCENARIO_PLAN_GENERATION')out={pressureLevel:'medium',commercialConstraints:'Unknown',hiddenPriorities:[],...out};
  return send({content:JSON.stringify(out)});
 });return calls;
}
export async function login(page:Page){await page.goto('http://127.0.0.1:3000/');await page.getByPlaceholder('Your name').fill('Test Employee');await page.getByPlaceholder('your.email@company.com').fill('test@example.com');await page.getByRole('button',{name:'Sign In',exact:true}).click();}
export async function create(page:Page){await page.getByRole('button',{name:'Add performance moment',exact:true}).click();await page.getByPlaceholder('e.g., Renewal Meeting').fill('Renewal review');await page.getByPlaceholder('e.g., Acme Corporation').fill('Acme');await page.getByPlaceholder('What does success look like?').fill('Agree a recovery plan');await page.getByPlaceholder('e.g., CFO').fill('CFO');}
export async function plan(page:Page){await create(page);await page.getByRole('button',{name:'Generate Preparation Brief'}).click();await expect(page.getByRole('heading',{name:'Performance Plan',exact:true})).toBeVisible();}
export const saved=(page:Page,mode='LIVE')=>page.evaluate(mode=>JSON.parse(localStorage.getItem(mode==='DEMO'?'performance_coach_state_demo':'performance_coach_state')||'{}'),mode);
