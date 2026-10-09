import { CapabilityHistory, CapabilityScore } from './types';
import { semantic, confidence, strings } from './semantic-client';

// Difficulty is reviewed by the judge, never an automatic score bonus.
export function calculateWeightedScore(history: CapabilityHistory): number {
 let sum=0,total=0;
 for(const entry of history.scores){
  const age=Math.max(0,(Date.now()-new Date(entry.date).getTime())/86400000);
  const w=Math.pow(0.5,age/14)*(entry.source.startsWith('Real')?1.3:1)*Math.max(0.01,entry.confidence??0.5);
  if(Number.isFinite(w)&&entry.score>=1&&entry.score<=5){sum+=entry.score*w;total+=w;}
 }
 return total?sum/total:0;
}
export function detectPatterns(history:CapabilityHistory):string[]{
 return new Set((history.evidenceHistory||[]).map(e=>e.sourceId).filter(Boolean)).size>=3 ? history.patterns||[] : [];
}
export async function updateCapabilityHistory(current:CapabilityHistory[],newScores:CapabilityScore[],source:string):Promise<CapabilityHistory[]> {
 const result=[...current];
 for(const score of newScores){
  if(score.score<1||score.score>5||!score.evidence.length)continue;
  const index=result.findIndex(h=>h.capability===score.capability);
  const prior:CapabilityHistory=index<0?{capability:score.capability,currentScore:0,scores:[],trend:'stable',evidenceHistory:[]}:result[index];
  const evidence=score.evidence.filter(e=>e.evidenceId&&e.sourceId&&e.sourceText&&e.classification==='OBSERVED'&&!(prior.evidenceHistory||[]).some(old=>old.evidenceId===e.evidenceId));
  if(!evidence.length)continue;
  const sourceIds=[...new Set(evidence.map(e=>e.sourceId!))];
  if(sourceIds.some(id=>prior.scores.some(s=>s.sourceId===id)))continue;
  let judge:any;
  try { judge=await semantic('CAPABILITY_UPDATE_JUDGE','Decide whether new observed employee evidence supports updating capability memory. Consider prior evidence, confidence, recency, difficulty and prior intervention. New capabilities require the same verification. Return {"decision":"UPDATED|NO_CHANGE","reason":"","confidence":0,"patterns":[],"patternSourceIds":[],"interventionOutcome":"improved|unchanged|regressed|insufficient_evidence"}. Behavioral patterns require at least three distinct source IDs demonstrating the SAME behavior. Do not infer causation from score change.',{prior,newAssessment:score,evidence,source,sourceIds}); }
  catch { judge={decision:'NO_CHANGE',reason:'Memory judge unavailable; capability estimate retained.',confidence:0}; }
  const updated=judge.decision==='UPDATED'&&typeof judge.reason==='string'&&judge.reason.trim()&&confidence(judge.confidence)>0;
  const history=[...(prior.evidenceHistory||[]),...evidence];
  const scores=updated?[...prior.scores,{date:new Date().toISOString(),score:score.score,source,sourceId:sourceIds[0],confidence:score.confidence,difficulty:score.scenarioDifficulty}]:prior.scores;
  const estimate=updated?calculateWeightedScore({...prior,scores}):prior.currentScore;
  const independent=new Set(history.map(e=>e.sourceId));
  const approvedPatternSources=new Set(strings(judge.patternSourceIds).filter(id=>independent.has(id)));
  const entry:CapabilityHistory={...prior,scores,currentScore:estimate,estimatedLevel:estimate||undefined,evidenceHistory:history,evidenceCount:history.length,evidenceCoverage:history.length,
   updateDecision:{decision:updated?'UPDATED':'NO_CHANGE',reason:typeof judge.reason==='string'?judge.reason:'Invalid memory decision; estimate retained.',confidence:confidence(judge.confidence)},
   trend:updated&&prior.currentScore?estimate>prior.currentScore+.15?'improving':estimate<prior.currentScore-.15?'declining':'stable':prior.trend,
   confidence:updated?Math.min(score.confidence,confidence(judge.confidence)):prior.confidence,
   knownWeakness:updated?score.weakness:prior.knownWeakness,nextRecommendation:updated?score.recommendedIntervention:prior.nextRecommendation,
   recentIntervention:updated?score.recommendedIntervention:prior.recentIntervention,
   interventions:updated&&score.recommendedIntervention?[...(prior.interventions||[]),score.recommendedIntervention]:prior.interventions||[],
   patterns:updated&&approvedPatternSources.size>=3?strings(judge.patterns):detectPatterns(prior),lastUpdated:new Date().toISOString(),
   interventionOutcomes:prior.recentIntervention?[...(prior.interventionOutcomes||[]),{intervention:prior.recentIntervention,result:updated&&['improved','unchanged','regressed'].includes(judge.interventionOutcome)?judge.interventionOutcome:'insufficient_evidence',evidenceIds:evidence.map(e=>e.evidenceId!),date:new Date().toISOString()}]:prior.interventionOutcomes||[]};
  if(index<0)result.push(entry);else result[index]=entry;
 }
 return result;
}
