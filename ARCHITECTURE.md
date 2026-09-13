# AI Performance Coach — Architecture Document

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   React UI   │  │  State Store │  │   AI Service Layer   │  │
│  │  (Screens)   │←→│ (localStorage)│←→│  (LLM + Mock)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                              ↓                   │
│                                    ┌──────────────────┐         │
│                                    │  LLM Provider    │         │
│                                    │  Abstraction     │         │
│                                    └──────────────────┘         │
│                                         ↓         ↓              │
│                                   ┌────────┐  ┌────────┐       │
│                                   │ OpenAI │  │ Gemini │       │
│                                   └────────┘  └────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. CREATE INTERACTION
   User Input → Store → Interaction Entity

2. PREPARE
   Interaction → AI Service → LLM/Mock → PreparationBrief → Store

3. PRACTICE
   Brief → RoleplayConfig → AI Roleplay Agent → PracticeSession
   PracticeSession → AI Evaluator → PracticeEvaluation → Store

4. PERFORM (External)
   Real meeting happens outside the app

5. ANALYZE
   Transcript + Brief → AI Analyzer → PostInteractionAnalysis → Store

6. COACH
   Analysis → CapabilityAssessment → CoachingIntervention → Store

7. IMPROVE
   Assessment → CapabilityHistory Update → Trend Analysis → Store
```

---

## Module Architecture

### 1. LLM Provider Layer (`src/llm-provider.ts`)

**Purpose**: Abstract away LLM provider differences.

**Interface**:
```typescript
interface LLMProvider {
  name: string;
  chat(messages: LLMMessage[], options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }): Promise<LLMResponse>;
}
```

**Providers**:
- `OpenAIProvider` — Uses OpenAI Chat Completions API
- `GeminiProvider` — Uses Google Generative Language API

**Key Features**:
- Environment-based configuration
- JSON mode for structured outputs
- Automatic error handling
- Fallback to mock when unavailable

### 2. AI Service Layer (`src/ai-service.ts`)

**Purpose**: Implement all AI-powered operations.

**Operations**:
1. `generateBrief()` — Creates preparation brief
2. `generateRoleplayConfig()` — Configures roleplay scenario
3. `getRoleplayResponse()` — Generates stakeholder responses
4. `generatePracticeEvaluation()` — Evaluates practice session
5. `analyzeTranscript()` — Analyzes real interaction
6. `updateCapabilityHistory()` — Updates capability tracking

**Design Pattern**: Each operation has:
- Real LLM implementation (primary)
- Mock implementation (fallback)
- Automatic fallback on error

### 3. Objection Handling Rubric (`src/objection-rubric.ts`)

**Purpose**: Define behavioral criteria for scoring.

**5 Levels**:
1. **Novice** — Reacts poorly, argues, discounts
2. **Developing** — Acknowledges but generic
3. **Functional** — Clarifies and responds relevantly
4. **Strong** — Identifies root cause, uses value logic
5. **Advanced** — Handles layered objections, adapts

**Usage**: Rubric is embedded in LLM prompts for consistent evaluation.

### 4. State Management (`src/store.ts`)

**Purpose**: Manage application state with persistence.

**Pattern**: Custom pub/sub store with localStorage.

**Entities**:
- User, Organization
- Interaction, PreparationBrief
- PracticeSession, PracticeTurn
- Transcript, PostInteractionAnalysis
- CapabilityHistory

**Key Methods**:
- `addInteraction()`, `updateInteraction()`
- `addBrief()`, `addPracticeSession()`
- `addAnalysis()`, `updateCapabilityHistory()`

---

## AI Prompt Architecture

### Modular Prompt Design

Each AI operation has a dedicated system prompt:

#### Brief Generator
```
Role: AI performance coach
Task: Generate concise preparation brief
Constraints: Never invent pricing/policies
Output: JSON with specific structure
```

#### Roleplay Agent
```
Role: Stakeholder (CFO/VP/etc.)
Personality: From config
Objectives: Test specific capabilities
Rules: Be realistic, adapt, don't reveal answers
```

#### Practice Evaluator
```
Role: Capability assessor
Rubric: 5-level objection handling scale
Task: Evaluate conversation against rubric
Output: JSON with evidence-backed scores
```

#### Transcript Analyzer
```
Role: Interaction analyst
Task: Compare planned vs actual behavior
Focus: Objection handling specifically
Output: JSON with impact ratings
```

### Structured Outputs

All AI operations use JSON mode for reliable parsing:

```typescript
// Example: Practice Evaluation
{
  "objectionHandlingScore": 3.5,
  "objectionHandlingLevel": 3,
  "evidence": [
    {
      "statement": "Asked clarifying questions",
      "observationType": "observed",
      "confidence": 0.85
    }
  ],
  "strength": "Reframed around value",
  "weakness": "Did not identify root concern",
  "recommendedIntervention": "Practice layered objections"
}
```

---

## Security Architecture

### Current (MVP)

```
┌─────────────────────────────────┐
│         Browser                  │
│  ┌───────────────────────────┐  │
│  │  Environment Variables    │  │
│  │  (VITE_OPENAI_API_KEY)    │  │
│  └───────────────────────────┘  │
│              ↓                   │
│  ┌───────────────────────────┐  │
│  │  Direct API Calls         │  │
│  │  (Client → OpenAI)        │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

**Risks**:
- API keys exposed in browser
- No server-side validation
- No rate limiting

**Mitigation**:
- Demo mode doesn't require keys
- Keys only in development environment
- Not suitable for production without backend

### Future (Production)

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Browser │ ←→  │  Backend │ ←→  │   LLM    │
│  (React) │     │  (API)   │     │  (OpenAI)│
└──────────┘     └──────────┘     └──────────┘
                      ↓
                 ┌──────────┐
                 │ Database │
                 │(Postgres)│
                 └──────────┘
```

**Improvements**:
- API keys on server only
- Authentication & authorization
- Rate limiting & monitoring
- Audit logging

---

## Data Model

### Core Entities

```typescript
// User & Organization
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
}

// Interaction (the core unit of work)
interface Interaction {
  id: string;
  userId: string;
  name: string;              // "Renewal Meeting"
  customer: string;          // "Acme Corporation"
  role: string;              // "Account Executive"
  dateTime: string;
  objective: string;
  agenda: string;
  notes: string;
  status: 'upcoming' | 'prepared' | 'practiced' | 'performed' | 'analyzed';
}

// Preparation Brief (AI-generated)
interface PreparationBrief {
  id: string;
  interactionId: string;
  objective: string;
  stakeholderPriorities: string[];
  relevantContext: string[];
  commercialGuidance: CommercialGuidance;
  likelyObjections: string[];
  recommendedQuestions: string[];
  personalCoachingFocus: string;
  practiceRecommendation: string;
}

// Practice Session
interface PracticeSession {
  id: string;
  interactionId: string;
  config: RoleplayConfig;
  turns: PracticeTurn[];
  status: 'active' | 'completed';
}

// Capability History (persistent)
interface CapabilityHistory {
  capability: CapabilityName;
  scores: { date: string; score: number; source: string }[];
  currentScore: number;
  trend: 'improving' | 'stable' | 'declining';
  knownWeakness?: string;
  nextRecommendation?: string;
}
```

### Relationships

```
User 1:N Interaction
Interaction 1:1 PreparationBrief
Interaction 1:N PracticeSession
PracticeSession 1:N PracticeTurn
Interaction 1:1 Transcript
Interaction 1:1 PostInteractionAnalysis
PostInteractionAnalysis 1:N CapabilityAssessment
CapabilityAssessment N:1 CapabilityHistory
```

---

## Extension Points

### 1. Live Meeting Assistance (Future)

```
Current: Post-meeting transcript upload
Future:  Real-time audio → transcription → context matching → nudges

Architecture:
- AudioStreamService (WebSocket)
- TranscriptionService (Deepgram/Whisper)
- ContextEngine (real-time brief matching)
- InterventionTrigger (when to nudge)
- DeliveryService (browser extension / mobile)
```

### 2. Company Knowledge (Future)

```
Current: User-provided context only
Future:  Company documents → embeddings → retrieval → grounded coaching

Architecture:
- Document ingestion pipeline
- Vector database (embeddings)
- Retrieval-augmented generation (RAG)
- Company-specific prompt templates
```

### 3. Enterprise Features (Future)

```
- Multi-tenant architecture
- Organization-level capability heatmaps
- Manager dashboards (with consent)
- CRM/Calendar integrations
- SSO (SAML/OIDC)
- Audit logging
```

---

## Performance Considerations

### Current

- **Bundle Size**: ~680KB (main JS)
- **Load Time**: < 2s on fast connection
- **AI Latency**: 1-3s for mock, 2-5s for real LLM
- **Storage**: localStorage (5-10MB limit)

### Optimizations

- Code splitting (future)
- Lazy loading screens
- Image optimization
- Service worker for offline support

---

## Testing Strategy

### Unit Tests (Future)

- AI service functions
- State management
- Type validation
- Rubric scoring logic

### Integration Tests (Future)

- Full user journey
- LLM provider switching
- Error handling
- Fallback behavior

### Adversarial Tests (Current)

See `docs/ADVERSARIAL_TESTS.md` for test cases covering:
- Factual grounding
- Scoring consistency
- Hallucination detection
- Evidence mismatch
- Score stability

---

## Deployment

### Development

```bash
npm run dev
# http://localhost:3000
```

### Production

```bash
npm run build
# Deploy dist/ to Vercel/Netlify/static host
```

### Environment Variables

```bash
# .env.production
VITE_LLM_PROVIDER=openai
VITE_OPENAI_API_KEY=sk-...
```

---

## Monitoring & Observability (Future)

### Metrics to Track

- AI operation success rate
- LLM latency (p50, p95)
- Fallback frequency
- User journey completion rate
- Capability score distribution

### Logging

- AI operation inputs/outputs
- Error rates and types
- User actions (anonymized)
- Performance metrics

---

## Conclusion

The AI Performance Coach MVP demonstrates the core thesis:

> Employees need preparation for performance moments, followed by evidence-based feedback that makes them better at the next moment.

The architecture is designed to:
1. Prove the thesis with a working demo
2. Scale to production with minimal rework
3. Extend to live coaching and enterprise features
4. Maintain evidence-based, trustworthy AI behavior

The primary capability under development (Objection Handling) provides a focused test case for the entire system.
