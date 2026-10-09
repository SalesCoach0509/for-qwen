// Explicit synthetic fixture provider. Never selected by network/health failure.
import { LLMMessage, LLMResponse, LLMProvider } from './llm-provider';
import { OBJECTION_DIMENSIONS, RoleplayConfig, StakeholderState, CompletionReason } from './types';
export class DemoProvider implements LLMProvider {
 name='Synthetic demo';
 async chat(messages:LLMMessage[],options?:{operation?:string}):Promise<LLMResponse>{
  let input:any={};try{input=JSON.parse(messages[messages.length-1].content);}catch{/* Legacy scenario form is text. */}
  const value=demoOperation(options?.operation||'',input);
  if(options?.operation==='SCENARIO_PLAN_GENERATION')value.pressureLevel='medium';
  if(options?.operation==='PERFORMANCE_PLAN_GENERATION'&&input.priorLearning){
   value.practiceRecommendation='Apply the previous intervention: confirm the owner, action and date with the CFO before closing.';
   value.intendedBehaviors=[{id:'b1',behavior:'Confirm owner, action and date before closing',priority:'high',successCriterion:'Stakeholder explicitly confirms the next-step owner and timing'}];
  }
  return {content:JSON.stringify(value)};
 }
}
export function demoOperation(operation:string,p:any):any {
 const behavior='Clarify the underlying concern before proposing a solution';
 const success='Ask one diagnostic question and confirm the concern before responding';
 const recommendation='Rehearse the renewal with a skeptical CFO. Clarify the implementation concern, then agree an owner and date for the next step.';
 switch(operation){
 case 'CONTEXT_INTAKE':return {customer:'Acme Corporation (synthetic)',stakeholder:'Morgan',stakeholderRole:'CFO',interactionType:'renewal',objective:'Retain the account and agree a recovery plan',risks:['Implementation uncertainty'],focusCapability:'Objection Handling',experienceLevel:'Experienced'};
 case 'CONTEXT_RISK_INTERPRETATION':return {behavior:'Responding before diagnosing the concern',meetingImplication:'The proposed solution may address price when the concern is delivery.',successBehavior:behavior,evidenceIds:(p.evidence||[]).map((e:any)=>e.evidenceId),confidence:.75,pattern:'Three synthetic observations of responding before clarification'};
 case 'PERFORMANCE_PLAN_GENERATION':return {objective:p.interaction.objective||'Agree a renewal decision process',stakeholderPriorities:['INFERRED: implementation reliability may matter'],relevantContext:[p.interaction.notes||'Synthetic renewal'],commercialGuidance:{discountLimits:'Not provided',relevantPackage:'Not provided',tradeOffs:[],escalationItems:[],note:'Synthetic fixture'},likelyObjections:['Possible concern: implementation risk'],recommendedQuestions:['What is the biggest concern behind the renewal decision?','What would demonstrate that delivery risk is under control?','Who should own the next step, and by when?','Which decision criteria remain unresolved?'],recommendedPositioning:['Connect the recovery plan to the stated business risk'],thingsToAvoid:[],personalCoachingFocus:behavior,practiceRecommendation:recommendation,unknowns:['Discount authority','Delivery commitments'],intendedBehaviors:[{id:'b1',behavior,priority:'high',successCriterion:success},{id:'b2',behavior:'Agree a named owner and date',priority:'medium',successCriterion:'Confirm owner, action and date'}],watchOuts:[{behavior:'Offering a concession too early',whyItMatters:'It may leave delivery risk unresolved',preferredAlternative:'Clarify the concern first'}],items:[{text:p.interaction.objective,classification:'KNOWN',source:p.interaction.objective,evidenceIds:[]},{text:'Delivery risk may shape the renewal',classification:'INFERRED',source:'Synthetic context hypothesis',evidenceIds:[]},{text:'Discount authority',classification:'UNKNOWN',source:'No company policy supplied',evidenceIds:[]},{text:behavior,classification:'RECOMMENDED',source:'Synthetic coaching',evidenceIds:[]}]};
 case 'PRACTICE_EVIDENCE_EXTRACTION':return {evidence:(p.turns||[]).filter((t:any)=>t.role==='user').map((t:any)=>({turnNumber:t.turnNumber,sourceText:t.content,behaviorObserved:t.content.includes('?')?'Asked a diagnostic question':'Made a response to the concern',classification:'OBSERVED',confidence:.8}))};
 case 'CAPABILITY_EVALUATION':return {score:p.evidence.length?3:null,confidence:.75,strength:p.evidence.length?'Engaged with the stakeholder concern':'',weakness:p.evidence.length?'Confirm the concern and next-step ownership':'',dimensions:Object.fromEntries(OBJECTION_DIMENSIONS.map((d,i)=>[d,{score:i<3&&p.evidence.length?3:null,evidenceIds:p.evidence.map((e:any)=>e.evidenceId),opportunity:i<3&&p.evidence.length>0}]))};
 case 'ASSESSMENT_JUDGE':return {approvedEvidenceIds:p.evidence.filter((e:any)=>e.classification==='OBSERVED').map((e:any)=>e.evidenceId),approvedDimensions:OBJECTION_DIMENSIONS.slice(0,3),approvedRowIndices:p.planComparison?.rows.map((r:any,i:number)=>r.evidenceIds?.length?i:-1).filter((i:number)=>i>=0)||[],scoreSupported:p.evidence.some((e:any)=>e.classification==='OBSERVED'),confidence:.75,reason:'Synthetic fixture verifies supplied citations'};
 case 'PRACTICE_INTERVENTION_GENERATION':return {recommendation,successCriterion:success};
 case 'TRANSCRIPT_FACT_EXTRACTION':return {facts:(p.lines||[]).filter((l:any)=>l.text.includes(':')).map((l:any)=>({line:l.line,speaker:l.text.split(':')[0].trim(),sourceText:l.text.slice(l.text.indexOf(':')+1).trim(),eventType:'OTHER',confidence:.9}))};
 case 'BEHAVIOR_EXTRACTION':return {behaviors:p.facts.filter((f:any)=>f.speakerType==='EMPLOYEE').map((f:any)=>({description:f.sourceText.includes('?')?'Asked a clarifying question':'Responded to the stakeholder',evidenceIds:[f.id],classification:'OBSERVED'}))};
 case 'PLAN_VS_ACTUAL':return {rows:p.intendedBehaviors.map((b:any)=>{const f=p.facts.find((f:any)=>f.speakerType==='EMPLOYEE');return {behaviorId:b.id,actual:f?'Employee responded; review the cited words':'NOT OBSERVED',evidenceIds:f?[f.id]:[],impact:'Medium',confidence:.6,whyItMatters:'Checking execution keeps the next plan tied to observed work',execution:f?'MISSED':'NOT_OBSERVABLE'};})};
 case 'INTERVENTION_GENERATION':return {title:p.diagnosis.score?'Clarify, then advance':'Collect fuller evidence',targetBehavior:p.diagnosis.score?behavior:'Provide a transcript with employee turns',whyItMatters:'A supported diagnosis needs observable employee behavior',exercise:p.diagnosis.score?recommendation:'Add a fuller speaker-labelled transcript',difficulty:'medium',successCriterion:success,evidenceIds:p.diagnosis.evidence.map((e:any)=>e.evidenceId)};
 case 'CAPABILITY_UPDATE_JUDGE':return {decision:p.evidence.length?'UPDATED':'NO_CHANGE',reason:'Synthetic fixture memory decision',confidence:.75,patterns:[],patternSourceIds:[],interventionOutcome:'insufficient_evidence'};
 case 'SCENARIO_PLAN_GENERATION':return {scenarioTitle:'Synthetic Enterprise Renewal',stakeholderRole:'CFO',personality:'Analytical and skeptical',objectives:['Agree renewal next steps'],likelyObjections:['Delivery uncertainty'],commercialConstraints:'No authority supplied',hiddenPriorities:[],desiredOutcome:'Agree owner and date',knownFacts:[],unknowns:['Discount authority'],objectionLadder:[],triggerConditions:['Respond to the employee'],requiredBehaviors:[behavior],forbiddenMoves:['Invent commitments']};
 default:throw new Error('This operation has no synthetic fixture. Switch to Live Mode to use a configured provider.');
 }
}
export function demoRoleplay(message:string,config:RoleplayConfig,history:{role:string;content:string}[],sessionId?:string){
 const n=history.filter(t=>t.role==='user').length;
 const done=n>=3;
 const response=!message?'Before we renew, I need to understand how you will address our implementation concerns.':done?'Let’s set up a delivery review with an owner and date. Please send the proposed agenda.':message.includes('?')?'The uncertainty about delivery is more concerning than the price. What would a reliable recovery plan look like?':'Help me understand how that addresses the delivery risk.';
 return {response,stakeholderResponse:response,sessionId:sessionId!,interactionId:config.interactionId!,interactionState:(done?'READY_TO_ADVANCE':'CONCERNED') as StakeholderState,completionReason:done?'NEXT_STEP_REACHED' as CompletionReason:undefined,conversationState:done?'COMPLETED':'IN_PROGRESS'};
}
