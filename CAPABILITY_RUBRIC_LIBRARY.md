# Source of truth

Specification: performance-v1.1. Runtime data: `shared/product-spec.json`. The tables below and runtime prompts must change together. Run `node scripts/check-spec.mjs` to detect drift.

# Capability rubric library

Active Listening includes clarification. Commercial Discipline and Negotiation are related but tracked separately. A missing opportunity is NOT OBSERVED, never a low score.

## Discovery

Observable behavior: Explore need, impact, stakeholders and decision criteria.

| Level | Anchor |
| --- | --- |
| 1 | Ignores the expressed problem and pitches despite a clear discovery opportunity |
| 2 | Asks a broad question but does not follow the answer |
| 3 | Clarifies a relevant need and business impact |
| 4 | Connects need, impact, decision criteria and stakeholders through follow-up |
| 5 | Prioritizes conflicting needs and tests assumptions under demonstrated complexity |

NOT OBSERVED: No relevant opportunity or no grounded employee evidence; never score zero as a measured level.

Confidence: Low: one narrow observation; medium: several direct observations; high: consistent independent contexts with a successful grounding judge.

Illustrative acceptable quote (not an automatic score): “Which part of the handover creates the largest delay?” The exact employee words and source ID must exist.

## Questioning

Observable behavior: Ask focused questions and follow the response.

| Level | Anchor |
| --- | --- |
| 1 | Counterproductive observed response |
| 2 | Partial or generic response to an available opportunity |
| 3 | Relevant and functional response |
| 4 | Adaptive response grounded in the underlying concern |
| 5 | Consistent judgment across demonstrated complexity |

NOT OBSERVED: No relevant opportunity or no grounded employee evidence; never score zero as a measured level.

Confidence: Low: one narrow observation; medium: several direct observations; high: consistent independent contexts with a successful grounding judge.

Illustrative acceptable quote (not an automatic score): “What makes that the priority now?” The exact employee words and source ID must exist.

## Active Listening

Observable behavior: Acknowledge, clarify and accurately reflect the stated concern.

| Level | Anchor |
| --- | --- |
| 1 | Misstates or dismisses the expressed concern |
| 2 | Acknowledges superficially without checking meaning |
| 3 | Clarifies and accurately reflects the concern |
| 4 | Tests an ambiguous interpretation and adapts to the answer |
| 5 | Reconciles competing stakeholder meanings with precise confirmation |

NOT OBSERVED: No relevant opportunity or no grounded employee evidence; never score zero as a measured level.

Confidence: Low: one narrow observation; medium: several direct observations; high: consistent independent contexts with a successful grounding judge.

Illustrative acceptable quote (not an automatic score): “It sounds like delivery certainty matters more than price. Have I understood correctly?” The exact employee words and source ID must exist.

## Value Articulation

Observable behavior: Link verified need to relevant value without inventing ROI.

| Level | Anchor |
| --- | --- |
| 1 | Invents outcomes or unrelated claims |
| 2 | Lists generic benefits without linking to the stated need |
| 3 | Connects a supported benefit to an expressed need |
| 4 | Tests relevance and addresses a tradeoff using verified facts |
| 5 | Prioritizes stakeholder-specific value under conflicting constraints without overstating proof |

NOT OBSERVED: No relevant opportunity or no grounded employee evidence; never score zero as a measured level.

Confidence: Low: one narrow observation; medium: several direct observations; high: consistent independent contexts with a successful grounding judge.

Illustrative acceptable quote (not an automatic score): “You identified handover delays; let us check whether this workflow addresses that need.” The exact employee words and source ID must exist.

## Objection Handling

Observable behavior: Recognize, clarify, acknowledge, respond and advance while preserving value.

| Level | Anchor |
| --- | --- |
| 1 | Counterproductive observed response |
| 2 | Partial or generic response to an available opportunity |
| 3 | Relevant and functional response |
| 4 | Adaptive response grounded in the underlying concern |
| 5 | Consistent judgment across demonstrated complexity |

NOT OBSERVED: No relevant opportunity or no grounded employee evidence; never score zero as a measured level.

Confidence: Low: one narrow observation; medium: several direct observations; high: consistent independent contexts with a successful grounding judge.

Illustrative acceptable quote (not an automatic score): “What is the underlying concern about the implementation timeline?” The exact employee words and source ID must exist.

## Negotiation

Observable behavior: Explore interests, options and reciprocal authorized trades.

| Level | Anchor |
| --- | --- |
| 1 | Concedes without authority or exchange |
| 2 | Discusses position without exploring interests |
| 3 | Explores an interest and proposes a reciprocal option |
| 4 | Tests alternatives and boundaries before making an authorized trade |
| 5 | Finds a defensible agreement across conflicting constraints and stakeholders |

NOT OBSERVED: No relevant opportunity or no grounded employee evidence; never score zero as a measured level.

Confidence: Low: one narrow observation; medium: several direct observations; high: consistent independent contexts with a successful grounding judge.

Illustrative acceptable quote (not an automatic score): “If we change the scope, what can you commit to in return?” The exact employee words and source ID must exist.

## Commercial Discipline

Observable behavior: Respect authority, policies and escalation boundaries.

| Level | Anchor |
| --- | --- |
| 1 | Invents authority or commits beyond stated limits |
| 2 | Recognizes a limit but leaves an ambiguous commitment |
| 3 | States limits and confirms an approval path |
| 4 | Preserves value through a conditional, reciprocal trade |
| 5 | Maintains governance and relationship under layered commercial pressure |

NOT OBSERVED: No relevant opportunity or no grounded employee evidence; never score zero as a measured level.

Confidence: Low: one narrow observation; medium: several direct observations; high: consistent independent contexts with a successful grounding judge.

Illustrative acceptable quote (not an automatic score): “I cannot authorize that concession; I will confirm the approval path.” The exact employee words and source ID must exist.

## Next-Step Control

Observable behavior: Agree a specific action, owner and time.

| Level | Anchor |
| --- | --- |
| 1 | Ends despite an available opportunity with no next action |
| 2 | Suggests vague follow-up |
| 3 | Agrees a specific action and owner |
| 4 | Confirms action, owner, date and purpose |
| 5 | Resolves dependencies and secures an achievable mutual commitment under complexity |

NOT OBSERVED: No relevant opportunity or no grounded employee evidence; never score zero as a measured level.

Confidence: Low: one narrow observation; medium: several direct observations; high: consistent independent contexts with a successful grounding judge.

Illustrative acceptable quote (not an automatic score): “Can Alex own the delivery review and send the findings by Friday?” The exact employee words and source ID must exist.

## Objection Handling dimensions

| Dimension | Observable opportunity |
| --- | --- |
| Recognition | Identifies the actual stated objection rather than assuming price |
| Clarification | Asks and follows a diagnostic question before proposing a response |
| Acknowledgement | Accurately acknowledges the concern without conceding unsupported claims |
| Response Relevance | Responds to the diagnosed concern using supplied facts |
| Value Preservation | Connects verified outcomes to the response without inventing ROI |
| Commercial Discipline | Respects supplied authority and makes reciprocal, authorized trades only |
| Conversational Control | Keeps a constructive thread while allowing the stakeholder to respond |
| Advancement | Secures an appropriate next step with owner and date when opportunity exists |

Each dimension uses 1–5 or null (NOT OBSERVED). A scored dimension requires an opportunity, a judge-approved name and a judge-approved observed evidence ID. Primary Objection Handling score is the arithmetic mean of supported dimensions, rounded to one decimal. Other capabilities use the judge-supported rubric score. Internal zero means no estimate and is displayed as unobserved, never as a measured zero. No readiness percentage is computed.

Readiness is coaching guidance for the target capability: ≥3.5 READY, ≥2.5 READY — ONE RISK REMAINS, otherwise PRACTICE ONCE MORE; no score means INSUFFICIENT EVIDENCE. It is not a calibrated probability of meeting success. Confidence is bounded by extraction, assessment and judge confidence.

Memory estimate: weighted mean of approved assessments. Weight = 0.5^(ageDays/14) × sourceWeight × confidence; sourceWeight 1.3 for real performance and 1 for practice. Difficulty informs the memory judge, never a numerical bonus. Trend compares the new estimate to the previous estimate, threshold ±0.15. Cross-capability overall display is an unweighted mean of available estimates, not readiness.
