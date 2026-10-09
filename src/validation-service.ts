import { BACKEND_URL } from './backend-url';
import { checkBackendHealth, RoleplayProvider, setLLMAvailable } from './llm-provider';
import { generateBrief, generateRoleplayConfig, generatePracticeEvaluation, analyzeTranscript } from './ai-service';
import { store } from './store';
import { Interaction } from './types';
export type Gate={name:string;status:'PASS'|'FAIL'|'BLOCKED'|'NOT RUN';detail:string};
export const initialGates=():Gate[]=>['Provider gateway','Preparation and personalization','Dynamic practice and isolation','Evidence and scoring integrity','Transcript, plan comparison and coaching'].map(name=>({name,status:'NOT RUN',detail:''}));
export async function runValidation(report:(g:Gate[])=>void){
 const gates=initialGates();const update=(i:number,status:Gate['status'],detail:string)=>{gates[i]={...gates[i],status,detail};report([...gates]);};
 if(store.getState().mode==='DEMO'){update(0,'BLOCKED','Switch to Live Mode. Synthetic fixtures cannot certify live AI.');return gates;}
 try{
  const health=await checkBackendHealth();setLLMAvailable(health.available,health.provider,health.model);
  if(!health.available)throw new Error('Provider unavailable');
  const response=await fetch(BACKEND_URL+'/api/diagnostic/llm-test',{method:'POST',signal:AbortSignal.timeout(125000)});
  const probe=await response.json();if(!response.ok||!probe.success)throw new Error('Probe failed');
  update(0,'PASS',`Real gateway probe succeeded: ${health.provider} / ${health.model}.`);
 }catch{update(0,'BLOCKED','The real provider could not be reached. Gates 2–5 were not run.');return gates;}
 const interaction:Interaction={id:crypto.randomUUID(),userId:'validation-only',name:'Validation discovery',customer:'Validation account',role:'Seller',stakeholderRole:'Business Leader',interactionType:'needs-discovery',experienceLevel:'Advanced',stakeholderSeniority:'VP',focusCapability:'Discovery',objective:'Understand the operational bottleneck',agenda:'Explore current process',dateTime:new Date().toISOString(),status:'UPCOMING',createdAt:new Date().toISOString()};
 let brief;
 try{brief=await generateBrief(interaction,[],null);if(!brief.intendedBehaviors?.length||brief.personalPerformanceRisk?.evidenceIds.length||brief.commercialGuidance.discountLimits!=='Not provided')throw new Error();update(1,'PASS','Plan contains intended behaviors; no invented history or commercial authority.');}catch{update(1,'FAIL','Plan or personalization contract failed. Dependent gates were not run.');return gates;}
 const config=generateRoleplayConfig(interaction,brief),session=crypto.randomUUID();
 let opening='',reply='';
 try{
  const first=await RoleplayProvider.getRoleplayResponse('',config,[],session);opening=first.response;
  const second=await RoleplayProvider.getRoleplayResponse('What is the biggest bottleneck in your current process?',config,[{role:'ai',content:opening},{role:'user',content:'What is the biggest bottleneck in your current process?'}],session);reply=second.response;
  const isolated=await RoleplayProvider.getRoleplayResponse('',{...config,interactionId:crypto.randomUUID()},[],crypto.randomUUID());
  if(first.sessionId!==session||second.sessionId!==session||isolated.sessionId===session||opening===reply||/system prompt|internal state|<think>/i.test(opening+reply))throw new Error();
  update(2,'PASS','Responses change with input; session identities and dialogue-only output validated.');
 }catch{update(2,'FAIL','Dynamic practice, output or session assertion failed.');}
 try{
  let rejected=false;try{await generatePracticeEvaluation([],config,session);}catch{rejected=true;}
  if(!rejected)throw new Error();
  const noEvidence=await generatePracticeEvaluation([{role:'ai',content:'Hello'},{role:'user',content:'…'},{role:'ai',content:'Please share your objective'}],config,crypto.randomUUID());
  if(noEvidence.capabilityScores.some(c=>c.score>0||c.evidence.length))throw new Error();
  if(!reply)throw new Error();
  const turns=[{role:'ai',content:opening},{role:'user',content:'What is the biggest bottleneck in your current process?'},{role:'ai',content:reply}];
  const scored=await generatePracticeEvaluation(turns,config,session);
  if(scored.capabilityScores.some(c=>c.score>0&&!c.evidence.length||c.evidence.some(e=>!turns.some(t=>t.role==='user'&&t.content.includes(e.sourceText||'___')))))throw new Error();
  const repeated=await generatePracticeEvaluation(turns,config,crypto.randomUUID());
  if(Math.abs((scored.capabilityScores[0]?.score||0)-(repeated.capabilityScores[0]?.score||0))>1)throw new Error();
  update(3,'PASS','Incomplete practice rejected; zero-evidence assessment abstained; quotes trace to employee turns; repeat score stayed within one rubric point.');
 }catch{update(3,'FAIL','Evidence, abstention or scoring assertion failed.');}
 try{
  const text='Customer: Our process takes too long.\nYou: Where does the delay usually occur?\nCustomer: During handover.';
  const a=await analyzeTranscript(text,interaction,brief,crypto.randomUUID());
  if(a.planVsActual.some(r=>!r.intendedSource?.startsWith(brief.id)||r.observation==='OBSERVED'&&!r.evidenceIds?.length)||!a.nextIntervention.successCriterion||a.capabilityDiagnosis.some(c=>c.evidence.some(e=>!text.includes(e.sourceText||'___'))))throw new Error();
  update(4,'PASS','Separated operations preserve plan identity, transcript quotes and one actionable intervention.');
 }catch{update(4,'FAIL','Transcript, plan comparison or coaching assertion failed.');}
 return gates;
}
