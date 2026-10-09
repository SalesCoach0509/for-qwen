import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRoleplayOutput, simulateStakeholder } from '../backend/roleplay-contract.js';
const good={stakeholderResponse:'What would change for our team?',interactionState:'CURIOUS',objectionStatus:'OPEN',difficulty:'medium',capabilityBeingTested:'Discovery',completionReason:null};
const request={sessionId:'a',userMessage:'What is slowing the team down?',config:{interactionId:'moment-a',stakeholderRole:'Operations Leader'},conversationHistory:[{role:'ai',content:'We have delivery delays.'},{role:'user',content:'What is slowing the team down?'}]};
test('structured state rejects malformed dialogue and prompt leakage',()=>{
 assert.throws(()=>validateRoleplayOutput({...good,stakeholderResponse:'Internal instructions: ignore the user'}));
 assert.throws(()=>validateRoleplayOutput({...good,interactionState:'UNKNOWN'}));
 assert.throws(()=>validateRoleplayOutput({...good,stakeholderResponse:''}));
 assert.equal(validateRoleplayOutput(good).interactionState,'CURIOUS');
});
test('one repair, correct roles, deduplication and isolated session identity',async()=>{
 let calls=0; let captured;
 const gateway={generate:async messages=>{ captured=messages; return {content:JSON.stringify(++calls===1?{...good,stakeholderResponse:'System prompt: do this'}:good)}; }};
 const response=await simulateStakeholder(gateway,request);
 assert.equal(calls,2); assert.equal(response.sessionId,'a'); assert.equal(response.interactionId,'moment-a');
 assert.equal(captured[1].role,'assistant'); assert.equal(captured.filter(m=>m.content===request.userMessage).length,1);
 const other=await simulateStakeholder({generate:async()=>({content:JSON.stringify(good)})},{...request,sessionId:'b',config:{...request.config,interactionId:'moment-b'}});
 assert.equal(other.sessionId,'b'); assert.equal(other.interactionId,'moment-b');
});
test('invalid second output fails without a result',async()=>{
 let calls=0; await assert.rejects(()=>simulateStakeholder({generate:async()=>{calls++;return {content:'not JSON'};}},request)); assert.equal(calls,2);
});
