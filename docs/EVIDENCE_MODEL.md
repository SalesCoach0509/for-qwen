# Evidence model

Required runtime fields: evidenceId, interactionId, sessionId, sourceType, sourceId, speaker, sourceText, behaviorObserved, capability, classification, confidence and timestamp. PRACTICE references an employee turn number; TRANSCRIPT references a labelled source line. Transcript sessionId is its source ID because no practice session owns real performance. OBSERVATION is reserved for later sources. Legacy fields remain readable but unsupported old records cannot establish new scored evidence.

## Source hierarchy

Observed employee quote → extracted behavior → rubric assessment → grounding judge → accepted score. INFERRED evidence cannot support a score. Exact text checks reject fabricated quotes; speaker matching rejects stakeholder statements attributed to the employee. Employee speaker label is supplied during transcript submission; common employee aliases are supported. Unlabelled text cannot establish employee attribution.

Preparation provenance: KNOWN must be an exact excerpt of supplied context/history/company information; unsupported KNOWN claims downgrade to INFERRED. UNKNOWN remains explicit. RECOMMENDED is advice. Risk without employee evidence is a low-confidence context hypothesis. A recurring pattern needs three independent source IDs and a judge-supported interpretation.

## Transcript operations

Fact extraction emits speaker, line, exact source text, confidence and event type: OBJECTION, QUESTION, CLARIFICATION, VALUE_STATEMENT, CONCESSION, COMMITMENT, NEXT_STEP, COMPETITOR_REFERENCE, BUSINESS_PAIN, DECISION_CRITERIA, RISK, ESCALATION, OTHER. Behavior extraction cites facts. Plan comparison uses only saved intendedBehavior IDs; unsupported actuals become NOT OBSERVED. Capability assessment precedes an assessment judge; coaching follows supported diagnosis.

Plan row: intended, intendedSource (plan ID + behavior ID), actual, actualSource (fact IDs), evidenceIds, sourceText, impact, confidence, whyItMatters, execution. Execution is SUCCESSFUL, MISSED or NOT_OBSERVABLE. Missing transcript opportunity is not a penalty. Only judge-approved rows retain an observed execution claim.

## Memory

Accepted historical quotes are immutable. Evidence IDs and source IDs deduplicate repeated assessment. The memory judge sees prior/new evidence, assessment confidence, difficulty, recency and previous intervention. UPDATED requires a valid reason and positive confidence. NO_CHANGE or judge failure retains the estimate and records the decision; valid new evidence is retained without silently changing scores. Intervention outcomes need a supported judge comparison; otherwise insufficient_evidence. No causal efficacy claim follows from a score change.

Historical source-level scores remain unchanged. Append-only observations may belong to a retained estimate without an update. Pattern claims require at least three distinct supporting sources; several lines from one transcript count as one source.

Limits: exact-quote validation proves source presence, not correctness of every model interpretation. Semantic grounding, calibration, dynamism and intervention usefulness require real-provider evaluation.
