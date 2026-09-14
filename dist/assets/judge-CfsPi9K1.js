import{i,c}from"./index-YDVKFDy_.js";async function s(e,o){if(!i())return{decision:"UPDATED",previousState:e,newState:{...e,currentScore:o.score},reason:"Demo mode: accepting new evidence",confidence:.5};try{const t=c(),n=`You are deciding whether new evidence justifies updating an employee's capability state.

Current State:
- Capability: ${e.capability}
- Current Score: ${e.currentScore}/5
- Trend: ${e.trend}
- Evidence Count: ${e.evidenceCount}

New Evidence:
- Score: ${o.score}/5
- Source: ${o.source}
- Confidence: ${o.confidence}

Consider:
1. Is the new evidence from a credible source (real interaction > practice)?
2. Is the confidence level high enough to warrant update?
3. Does the new score significantly differ from current state?
4. Is this a one-time anomaly or consistent with trend?

Return JSON:
{
  "decision": "UPDATED|NO_CHANGE",
  "previousState": {...},
  "newState": {...},
  "reason": "explanation",
  "confidence": 0.0-1.0
}`,r=await t.chat([{role:"system",content:n}],{temperature:.3,jsonMode:!0});return JSON.parse(r.content)}catch(t){return console.error("Judge state update failed:",t),{decision:"UPDATED",previousState:e,newState:{...e,currentScore:o.score},reason:"Judge failed, accepting update",confidence:.4}}}export{s as judgeCapabilityStateUpdate};
