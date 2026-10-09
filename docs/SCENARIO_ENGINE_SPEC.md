# Source of truth

Specification: performance-v1.1. Runtime data: `backend/contracts/product-spec.json`. The tables below and runtime prompts must change together. Run `node scripts/check-spec.mjs` to detect drift.

# Scenario engine

Experience is the employee complexity standard. Stakeholder seniority is independent (Individual Contributor, Manager, Director, VP, C-Level / Board). Seniority never silently sets employee experience.

| Axis | Foundation | Experienced | Advanced | Executive |
| --- | --- | --- | --- | --- |
| stakeholderSophistication | Direct, operational | Pragmatic and skeptical | Cross-functional and evidence seeking | Strategic, board-level judgment |
| informationTransparency | Explicit; reveal context after a relevant question | Partial until asked | Reveal selectively based on response quality | Sparse; distinguish unknowns from assumptions |
| objectionAmbiguity | One clear concern | Stated concern may mask a practical risk | Layered concerns requiring diagnosis | Strategic tradeoffs without a single right answer |
| pressure | low | medium | high | high |
| competingConcerns | 1 | 2 | 3 | 4 |
| commercialComplexity | Simple; no implied authority | Value versus timing | Dependencies, alternatives and authorization | Risk allocation, long-term value and governance |
| timePressure | Enough time to clarify | Moderate | Limited time | Short executive attention window |
| politicalComplexity | Single stakeholder | Owner and evaluator may differ | Conflicting stakeholders | Multiple decision owners and competing incentives |
| hiddenAgenda | No unstated agenda | Simulated hypothesis, never a customer fact | Hypothetical risk posture revealed through relevant questions | Hypothetical strategic concern, not invented customer information |
| competingPriorities | One priority | Two linked priorities | Cost, risk and operational continuity | Strategy, financial risk, accountability and time |
| consequenceOfFailure | Recoverable misunderstanding | Delayed next step | Loss of credibility | Strategic misalignment |
| stakeholderAuthority | Use supplied authority only | Separate recommendation from approval | Confirm decision rights | Validate governance and escalation |
| negotiationSophistication | Simple tradeoffs | Require a reciprocal trade | Conditional trades and alternatives | Consequence-aware options and principled boundaries |
| evaluationStandard | Recognize concern, clarify and respond relevantly | Diagnose cause, connect value and confirm the next step | Prioritize ambiguity, preserve boundaries and manage competing concerns | Synthesize ambiguity, surface tradeoffs, state uncertainty and secure accountable decisions |

## Runtime contract

Input: interaction context, taxonomy row, experience profile, stakeholder seniority, persona, objective, conditional hidden priorities, performance plan, intended behaviors, employee evidence history, target capability, turn history, latest employee response and stakeholder state.

One stakeholder model call per turn; one repair only for invalid dialogue/schema. The model chooses ANSWER, PROBE, CLARIFY, CHALLENGE, PUSH_BACK, REVEAL_CONCERN, ESCALATE, NEGOTIATE, ADVANCE or END internally. No fixed objection order or eight-turn sequence. Custom scenario concern lists are possibilities, not a script. A customized difficulty can set pressure but does not erase the employee complexity profile.

State: OPEN, CURIOUS, SKEPTICAL, CONCERNED, RESISTANT, NEGOTIATING, FRUSTRATED, REASSURED, READY_TO_ADVANCE, READY_TO_EXIT. Output: stakeholderResponse, interactionState, objectionStatus (NONE/OPEN/CLARIFIED/RESOLVED), difficulty, capabilityBeingTested, optional completionReason. Only dialogue is shown.

Completion: OBJECTIVE_REACHED, OBJECTION_RESOLVED, NEXT_STEP_REACHED, STAKEHOLDER_EXIT, EMPLOYEE_FATAL_ERROR, MAX_SAFE_TURNS (24 employee turns), USER_END. At least one employee turn and a final stakeholder response are required before assessment. Failed/incomplete sessions produce no assessment or memory update. Navigation cancels application of late responses.

Demo: deterministic, explicitly synthetic dialogue may complete after three responses. This fixture behavior never governs Live Mode.
