# AI operation catalog

Live path: frontend operation → POST /api/ai/chat → existing universal gateway → configured provider. Roleplay uses POST /api/ai/roleplay/respond through the same gateway. Keys remain server-side. Provider/model selection is deployment configuration; configured fallback remains a real provider, never synthetic content.

Version: performance-v1.1. Machine-readable envelopes: backend/contracts/operation-contracts.json. Each semantic request has messages (system/user/assistant), options.operation, jsonMode:true, temperature and bounded maxTokens. Specialized operation inputs are the final JSON user message, except the retained scenario editor’s structured text input. Server validates envelopes/required fields; frontend validates business semantics, quotes, identity and enums before persistence.

| Operation | Required input fields | Required output fields |
| --- | --- | --- |
| CONTEXT_INTAKE | description, taxonomy | Optional supported candidate fields |
| CONTEXT_RISK_INTERPRETATION | interaction, context, evidence | behavior:string, meetingImplication:string, successBehavior:string, evidenceIds:array, confidence:number |
| PERFORMANCE_PLAN_GENERATION | interaction, context, risk | objective:string, personalCoachingFocus:string, practiceRecommendation:string, intendedBehaviors:array, items:array, watchOuts:array, recommendedQuestions:array, commercialGuidance:object |
| SCENARIO_PLAN_GENERATION | Scenario editor facts as structured text | scenarioTitle:string, stakeholderRole:string, personality:string, pressureLevel:string, objectives:array, likelyObjections:array, commercialConstraints:string, hiddenPriorities:array, desiredOutcome:string, knownFacts:array, unknowns:array, objectionLadder:array, triggerConditions:array, requiredBehaviors:array, forbiddenMoves:array |
| PRACTICE_EVIDENCE_EXTRACTION | turns | evidence:array |
| CAPABILITY_EVALUATION | evidence, context, rubric | confidence:number, dimensions:object |
| ASSESSMENT_JUDGE | evidence, proposed, context | approvedEvidenceIds:array, approvedDimensions:array, approvedRowIndices:array, scoreSupported:boolean, confidence:number, reason:string |
| PRACTICE_INTERVENTION_GENERATION | score, config | recommendation:string, successCriterion:string |
| TRANSCRIPT_FACT_EXTRACTION | lines | facts:array |
| BEHAVIOR_EXTRACTION | facts, context | behaviors:array |
| PLAN_VS_ACTUAL | intendedBehaviors, facts, behaviors | rows:array |
| INTERVENTION_GENERATION | diagnosis, context | title:string, targetBehavior:string, whyItMatters:string, exercise:string, difficulty:string, successCriterion:string, evidenceIds:array |
| CAPABILITY_UPDATE_JUDGE | prior, newAssessment, evidence, sourceIds | decision:string, reason:string, confidence:number, patterns:array, patternSourceIds:array, interventionOutcome:string |

## Call budgets

Prepare: context/risk interpretation + plan (2). Intake and custom scenario are optional user actions (1 each). Practice: one stateful response per turn; invalid output may repair once. Practice assessment: extraction + evaluation + judge + intervention only with supported evidence (3–4). Transcript: facts + behaviors + plan comparison + capability evaluation + judge + coaching (6). Memory: one update judge per newly scored capability. No judge on each valid practice turn.

## Roleplay request/response

Request: sessionId, config.interactionId, stakeholderRole and all scenario context, userMessage, conversationHistory with ai/user roles. Response: stakeholderResponse, interactionState, objectionStatus, difficulty, capabilityBeingTested, optional completionReason, echoed sessionId and interactionId. Response dialogue must be nonempty and ≤3000 characters. Histories ≤60 turns; safety completion after 24 employee turns. Internal-instruction leakage is rejected and repaired once, then fails without assessment.

## Failure and observability

Invalid input: 400. Invalid operation output: 502. Provider failure: 500/503; roleplay failures return a clean no-assessment message. Superseded monolithic prepare/evaluate/analyze endpoints return 410. Frontend never falls back in Live Mode. Operation metadata includes provider/model label, operation, prompt version, request ID, latency, timestamp and success. Do not log keys, raw provider error bodies or transcript contents.

Validation calls production functions and gateway, with no employee-memory writes. Gate 1 probes actual provider availability; outage is BLOCKED and Gates 2–5 NOT RUN. Subsequent gates assert plan integrity, dynamic roleplay/session isolation, evidence/abstention, transcript/plan/coaching. These are bounded runtime assertions, not a certification of every model response. Fixture tests are explicitly separate.

Demo fixtures are selected only by explicit DEMO mode. They never certify live model quality.
