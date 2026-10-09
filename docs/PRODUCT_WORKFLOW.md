# Product workflow

Category: AI Performance Coach. Interaction is the performance moment and ownership boundary.

UNDERSTAND → PREPARE → PRACTICE → PERFORM → OBSERVE → DIAGNOSE → IMPROVE → NEXT PERFORMANCE MOMENT.

## Ownership and lifecycle

Interaction stores interactionId, employeeId, customer, stakeholder, role, subtype, experience, seniority, date, objective, agenda, context, priority, status and capability focus. It points to the latest preparation, practice sessions, current transcript/analysis, assessment, intervention and next action. Compatibility aliases id/userId remain.

UPCOMING → PREPARING → PREPARED → PRACTICING → READY → PERFORMED → ANALYZING → ANALYZED → IMPROVING → COMPLETED. Failure states: PREPARATION_FAILED, PRACTICE_FAILED, ANALYSIS_FAILED. Preparation requires a saved valid plan; readiness requires a supported completed practice assessment; analysis requires the current transcript. Direct status mutation is rejected. Retry transitions are defined in src/performance-moment.ts.

## Screens

Dashboard leads with the next moment and one resolved action, then upcoming/recent moments and learning. Creation offers reviewed natural-language candidates plus structured taxonomy, experience and seniority. Applying candidates requires selecting fields and exposes replaced values. Preparation leads with objective, one risk, intended behaviors, best three questions, three watch-outs and targeted practice. Detailed sources and commercial context expand below. Company Coach uses explicitly supplied local context; General Coach has none. Unknown authority is “Not provided”.

Practice uses a unique session and shared interaction context. End & evaluate requires an actual exchange. Provider failure, malformed output or leaving an active session prevents assessment. Results lead with qualitative readiness, observed evidence, primary improvement and next practice; dimensions are expandable. Transcript paste/upload attaches to the same moment, with explicit employee speaker label. Plan vs Actual cites plan behavior IDs and exact transcript sources. Preparation effectiveness counts successful, missed and unobservable behaviors, without financial ROI claims.

One supported intervention determines the next targeted practice. The next interaction carries previousInteractionId and the next plan receives prior evidence and intervention learning. Capability memory appends observations; duplicates do not count as independent history.

## Isolation and deployment boundary

LIVE and DEMO use separate storage keys. Mode changes reload the application to abandon in-flight UI operations. Demo seeds one synthetic Enterprise Renewal and three labelled synthetic prior observations once per empty demo profile. Explicit demo fixtures run the same orchestration loop without provider requests. Live failures never select demo.

Employee profiles are local browser partitions, not secure authentication. Signing into another local profile archives/restores its own local state. This MVP has no server database, team tenancy, SSO or cross-device synchronization. Do not describe it as a secure multi-tenant deployment. The backend gateway is stateless with respect to employee performance; deployment access controls remain an infrastructure responsibility.

Primary navigation: Home, My performance, Validation. Demo is a secondary explicit mode. Error boundaries recover to home; known operation failures preserve retryable states.
