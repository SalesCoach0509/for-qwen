# MVP acceptance criteria

Run TypeScript, production build, node API/roleplay tests, and Playwright regression. Fixture tests exercise contracts and failure paths; they do not claim real-provider quality. Run the in-app Live Validation separately against deployment credentials.

| Area | Objective acceptance | Automated evidence |
| --- | --- | --- |
| Dashboard | Next performance moment is primary; one resolved action | consolidated.spec.ts connected journey |
| Creation | 28 taxonomy subtypes; independent level/seniority; candidate review before overwrite | consolidated.spec.ts intake |
| Preparation | One risk, intended behaviors, 3 primary questions, explicit unknown authority and provenance | connected journey + malformed-output tests |
| Roleplay | Natural dialogue, current input/context, strict state/identity, one repair, explicit completion | roleplay-contract.test.mjs + integrity stale-response test |
| Evaluation | Extraction precedes score; quotes grounded; unobserved dimensions null; failed practice unassessed | connected journey + provider failure + forged evidence tests |
| Transcript | Source line and speaker match; linked current transcript | integrity transcript test + connected journey |
| Plan vs Actual | Saved intended IDs; actual source citations; NOT OBSERVED without evidence | integrity transcript + connected journey |
| Capability memory | No duplicate source score; old evidence immutable; judge-controlled update; pattern threshold3 | integrity memory tests |
| Coaching | One target behavior/exercise/success criterion; next plan consumes learning | connected journey |
| Validation | Gateway outage BLOCKED; dependent gates NOT RUN | consolidated outage test |
| Demo | One synthetic seed; full loop; no semantic network calls | consolidated demo test |
| Separation | Live storage unchanged after demo; local profiles partition state | demo test + integrity profile test |
| Session isolation | Reject wrong session/interaction and stale transcript; ignore late responses | integrity store/stale tests + API test |
| Error handling | No blank page; malformed/provider errors produce recoverable states | malformed/failure/browser pageerror assertions |
| Assets | Every HTML asset exists; unknown asset404; app routes HTML | backend-smoke.test.mjs |
| Deployment | Clean archive extracted, manifest verified; release marker matches; live gates run | release verification + required live deployment check |

## Release gates

Do not label deployment or model quality PASS from a local build. Docker is NOT RUN when no Docker engine is available. No credentials means external-provider validation is BLOCKED. Published deployment must confirm release.json and /api/health, asset MIME types, company-context privacy/access controls, and the complete prepare → practice → real transcript → next adapted plan journey.

The existing latest user ZIP is the compatibility baseline. Obsolete tests for removed live demo buttons and monolithic response schemas are replaced by consolidated/integrity regression suites. Legacy source is retained outside the deliverable in the working backup.
