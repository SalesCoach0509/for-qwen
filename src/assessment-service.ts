import { v4 as uuidv4 } from 'uuid';
import { CapabilityScore, EvidenceItem, OBJECTION_DIMENSIONS, PracticeEvaluation, RoleplayConfig } from './types';
import { semantic, confidence, strings } from './semantic-client';
import { rubricLibrary } from './product-spec';

export async function evaluateEvidence(evidence: EvidenceItem[], context: RoleplayConfig, planComparison?: unknown): Promise<CapabilityScore & { approvedRows?: number[] }> {
  const capability = context.targetCapability || 'Objection Handling';
  const raw=await semantic('CAPABILITY_EVALUATION', `Evaluate only supplied OBSERVED employee evidence against the supplied rubric and complexity standard. Missing opportunity is NOT OBSERVED, never a penalty. Return {"score":null,"confidence":0,"strength":"","weakness":"","dimensions":{}}. Each Objection Handling dimension is {"score":1-5 or null,"evidenceIds":[],"opportunity":true|false}. Dimensions: ${OBJECTION_DIMENSIONS.join(', ')}. Other capabilities use score 1-5 or null with explicit evidence.`, { evidence, context, rubric:rubricLibrary[capability] });
  const judge=await semantic('ASSESSMENT_JUDGE', 'Verify the score, every behavior and each dimension against the exact source quotes and rubric. Also verify every supplied plan comparison against its facts: intended must come from plan, actual and execution from quoted facts. Approve only observed employee behavior. Return {"approvedEvidenceIds":[],"approvedDimensions":[],"approvedRowIndices":[],"scoreSupported":false,"confidence":0,"reason":""}. No evidence means scoreSupported false. Never approve inference as observation.', { evidence, proposed:raw, context, planComparison, rubric:rubricLibrary[capability] });
  const approved=new Set(strings(judge.approvedEvidenceIds));
  const grounded=evidence.filter(e=>e.classification==='OBSERVED' && approved.has(e.evidenceId!));
  const dims=Object.fromEntries(OBJECTION_DIMENSIONS.map(name=>{
    const d=raw.dimensions?.[name];
    const valid=judge.scoreSupported===true && strings(judge.approvedDimensions).includes(name) && d?.opportunity===true && typeof d.score==='number' && d.score>=1 && d.score<=5 && strings(d.evidenceIds).some(id=>grounded.some(e=>e.evidenceId===id));
    return [name, valid?d.score:null];
  }));
  const values=Object.values(dims).filter((n):n is number=>typeof n==='number');
  const proposed=capability==='Objection Handling' ? (values.length ? values.reduce((a,b)=>a+b,0)/values.length : 0) : raw.score;
  const score=judge.scoreSupported===true && grounded.length && grounded.every(e=>e.confidence>0) && confidence(raw.confidence)>0 && confidence(judge.confidence)>0 && typeof proposed==='number' && proposed>=1 && proposed<=5 ? Math.round(proposed*10)/10 : 0;
  return { capability,scenarioDifficulty:context.experienceLevel||context.pressureLevel,score,level:Math.max(1,Math.min(5,Math.round(score))) as CapabilityScore['level'],evidence:score?grounded:[],confidence:score?Math.min(confidence(raw.confidence),confidence(judge.confidence),...grounded.map(e=>e.confidence)):0,strength:score?String(raw.strength||''):undefined,weakness:score?String(raw.weakness||''):undefined,dimensions:capability==='Objection Handling'?dims:{},approvedRows:Array.isArray(judge.approvedRowIndices)?judge.approvedRowIndices.filter(Number.isInteger):[] };
}

export async function generatePracticeAssessment(turns: {role:string;content:string}[], config:RoleplayConfig, sessionId=''):Promise<PracticeEvaluation> {
  if (!sessionId || !config.interactionId || !turns.some(t=>t.role==='user') || turns[turns.length-1]?.role!=='ai') throw new Error('Practice could not be completed. No performance assessment was generated.');
  const extracted=await semantic('PRACTICE_EVIDENCE_EXTRACTION','Extract only observable employee behaviours from the practice conversation. Return {"evidence":[{"turnNumber":1,"sourceText":"exact employee words","behaviorObserved":"","classification":"OBSERVED","confidence":0.7}]}. The quote must be an exact substring of the cited employee turn; inference is not observed performance.', {turns:turns.map((t,i)=>({...t,turnNumber:i+1})),intendedBehaviors:config.intendedBehaviors});
  if (!Array.isArray(extracted.evidence)) throw new Error('Invalid evidence extraction output');
  const seen=new Set<string>();
  const evidence:EvidenceItem[]=extracted.evidence.flatMap((e:any)=>{
    const t=turns[e.turnNumber-1],quote=typeof e.sourceText==='string'?e.sourceText.trim():'';
    if (!Number.isInteger(e.turnNumber)||!t||t.role!=='user'||quote.length<3||!/[a-zA-Z0-9]/.test(quote)||!t.content.includes(quote)||e.classification!=='OBSERVED'||typeof e.behaviorObserved!=='string') return [];
    const id=`${sessionId}:turn-${e.turnNumber}`; if(seen.has(id))return [];seen.add(id);
    return [{evidenceId:id,interactionId:config.interactionId,sessionId,sourceType:'PRACTICE' as const,sourceId:sessionId,speaker:'Employee',sourceText:quote,behaviorObserved:e.behaviorObserved,statement:e.behaviorObserved,source:'roleplay' as const,classification:'OBSERVED' as const,observationType:'observed' as const,capability:config.targetCapability||'Objection Handling',confidence:confidence(e.confidence),timestamp:new Date().toISOString(),turnNumber:e.turnNumber}];
  });
  const score=await evaluateEvidence(evidence,config);
  let nextPractice='Insufficient evidence. Practice a fuller conversation to observe the target behavior.';
  if(score.score){const intervention=await semantic('PRACTICE_INTERVENTION_GENERATION','Recommend exactly one short practice intervention for the supported gap. Return {"recommendation":"","successCriterion":""}. Adapt to the previous intervention, employee history, current complexity and intended behaviors.',{score,config});if(typeof intervention.recommendation!=='string'||typeof intervention.successCriterion!=='string')throw new Error('Invalid practice coaching output');nextPractice=`${intervention.recommendation} Success: ${intervention.successCriterion}`;}
  score.recommendedIntervention=nextPractice;
  return {id:uuidv4(),sessionId,interactionId:config.interactionId,overallReadiness:0,readiness:!score.score?'INSUFFICIENT_EVIDENCE':score.score>=3.5?'READY':score.score>=2.5?'READY_ONE_RISK_REMAINS':'PRACTICE_ONCE_MORE',capabilityScores:[score],strengths:score.strength?[score.strength]:[],weaknesses:score.weakness?[score.weakness]:[],nextPractice,generatedAt:new Date().toISOString()};
}
