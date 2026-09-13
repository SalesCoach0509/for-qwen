# AI Performance Coach — MVP v0.1

> An AI-powered performance development system for enterprise sales professionals.  
> **Prepare → Practice → Perform → Analyze → Coach → Improve**

---

## Overview

The AI Performance Coach helps employees become better at their actual work by providing:

1. **Personalized preparation** before important customer interactions
2. **Realistic roleplay practice** with AI-powered stakeholder simulation
3. **Evidence-based evaluation** of performance across 8 capabilities
4. **Plan vs Actual analysis** comparing intended vs actual behavior
5. **Continuous capability tracking** with trend analysis over time
6. **Targeted coaching interventions** based on demonstrated weaknesses

The primary capability under development is **Objection Handling**, with a 5-level behavioral rubric.

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd performance-coach

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# (Optional) Add your OpenAI API key for real AI responses
# Leave empty to use demo mode with simulated responses
```

### Running Locally

```bash
# Development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck
```

The app will be available at `http://localhost:3000`.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_LLM_PROVIDER` | AI provider: `openai` or `gemini` | `openai` |
| `VITE_OPENAI_API_KEY` | OpenAI API key | (empty = demo mode) |
| `VITE_OPENAI_MODEL` | OpenAI model to use | `gpt-4o-mini` |
| `VITE_GEMINI_API_KEY` | Gemini API key (alternative) | (empty) |
| `VITE_GEMINI_MODEL` | Gemini model | `gemini-1.5-flash` |
| `VITE_USE_MOCK_AI` | Force demo mode | `false` |

### Demo Mode vs Real AI

- **Demo Mode** (no API key): Uses intelligent keyword-based simulation. Fully functional for demos and testing.
- **Real AI Mode** (with API key): Uses actual LLM for more nuanced, context-aware responses.

The app automatically detects whether an API key is configured and shows the status in the UI.

---

## Demo Experience

1. Click **"Try Demo — Enterprise Renewal"** on the login screen
2. See the personalized **Preparation Brief** (brain-map style)
3. Click **"Practice this interaction"** to start roleplay
4. Handle objections as the AI CFO challenges you
5. Receive **evidence-backed evaluation** with Objection Handling score
6. Click **"Upload transcript"** and load the demo transcript
7. See **Plan vs Actual analysis** with impact ratings
8. Get **capability diagnosis** and next intervention
9. View **Capability Progress** page to see history updates

The complete demo takes under 5 minutes.

---

## Architecture

### Frontend Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS v4** for styling
- **Recharts** for data visualization
- **Framer Motion** for animations
- **Lucide React** for icons
- **UUID** for ID generation

### Data Storage

- **localStorage** for client-side persistence
- Custom store with pub/sub pattern
- No backend required for MVP

### AI Architecture

```
┌─────────────────────────────────────────────┐
│              AI Service Layer                │
├─────────────────────────────────────────────┤
│  LLM Provider Abstraction                   │
│  ├── OpenAI Provider                        │
│  ├── Gemini Provider                        │
│  └── Mock Provider (fallback)               │
├─────────────────────────────────────────────┤
│  Modular AI Operations                      │
│  ├── Brief Generator                        │
│  ├── Roleplay Agent                         │
│  ├── Practice Evaluator                     │
│  ├── Transcript Analyzer                    │
│  └── Capability Assessor                    │
├─────────────────────────────────────────────┤
│  Structured Output Validation               │
│  └── JSON Schema enforcement                │
└─────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Provider-agnostic LLM**: Swap between OpenAI/Gemini without code changes
2. **Graceful degradation**: Falls back to mock if LLM unavailable
3. **Structured outputs**: JSON mode for reliable parsing
4. **Evidence-based scoring**: Every score backed by specific behavioral evidence
5. **Modular prompts**: Each AI operation has independent system prompt

---

## Capability Model

### 8 Performance Dimensions

1. **Discovery** — Uncovering business needs and impact
2. **Questioning** — Strategic use of open/closed questions
3. **Active Listening** — Demonstrating understanding
4. **Value Articulation** — Connecting solutions to outcomes
5. **Objection Handling** — Addressing concerns effectively ⭐
6. **Negotiation** — Maintaining leverage while advancing
7. **Commercial Discipline** — Preserving value and authority
8. **Next-Step Control** — Securing commitments

### 5-Level Scale

| Level | Label | Description |
|-------|-------|-------------|
| 1 | Novice | Reacts poorly, argues, discounts unnecessarily |
| 2 | Developing | Acknowledges but generic/weak response |
| 3 | Functional | Clarifies concern, provides relevant response |
| 4 | Strong | Identifies underlying concern, uses value logic |
| 5 | Advanced | Handles layered objections, adapts dynamically |

### Objection Handling Rubric (Primary Focus)

Detailed behavioral rubric with specific indicators for each level. See `src/objection-rubric.ts`.

---

## Data Model

```
User → Interactions → PreparationBrief
                   → PracticeSession → PracticeTurns
                   → Transcript → PostInteractionAnalysis
                                → CapabilityAssessment
                                → CoachingIntervention

CapabilityHistory (persistent across interactions)
  ├── scores[] (with dates and sources)
  ├── trend (improving/stable/declining)
  ├── knownWeakness
  └── nextRecommendation
```

---

## Project Structure

```
src/
├── ai-service.ts          # AI operations (brief, roleplay, evaluation, analysis)
├── llm-provider.ts        # LLM abstraction (OpenAI, Gemini)
├── objection-rubric.ts    # Behavioral rubric for scoring
├── store.ts               # State management with localStorage
├── types.ts               # TypeScript type definitions
├── data/
│   └── seed.ts            # Demo data and initial capability history
├── components/
│   ├── Login.tsx           # Authentication screen
│   ├── Dashboard.tsx       # Main hub with upcoming interactions
│   ├── CreateInteraction.tsx # Interaction creation form
│   ├── PerformanceBrief.tsx  # Visual brain-map brief
│   ├── Roleplay.tsx        # Practice session with AI stakeholder
│   ├── PracticeResults.tsx   # Evaluation with capability scores
│   ├── UploadTranscript.tsx  # Transcript input
│   ├── PostInteraction.tsx   # Plan vs Actual analysis
│   ├── CapabilityProgress.tsx # Capability history visualization
│   ├── Roadmap.tsx         # Product vision and roadmap
│   └── LLMStatus.tsx       # AI provider status indicator
└── App.tsx                 # Main app with routing
```

---

## Testing

### Manual Testing Checklist

- [ ] Login with demo mode
- [ ] Create interaction with full context
- [ ] Generate preparation brief
- [ ] Complete roleplay session (8 turns)
- [ ] View practice results with evidence
- [ ] Upload demo transcript
- [ ] View Plan vs Actual analysis
- [ ] Check capability history update
- [ ] Repeat loop with updated capabilities

### With Real LLM

```bash
# Set your API key
export VITE_OPENAI_API_KEY=sk-...

# Run dev server
npm run dev
```

The UI will show "AI: openai" instead of "Demo Mode" when real LLM is active.

---

## Known Limitations (MVP v0.1)

### Not Yet Implemented

- ❌ Real database (PostgreSQL) — using localStorage
- ❌ Server-side API key protection — keys in browser env
- ❌ Authentication system — simple name/email login
- ❌ Multi-user support — single-user demo
- ❌ Organization tenancy — single org
- ❌ File upload parsing — paste only
- ❌ Live meeting assistance — post-meeting only
- ❌ CRM/Calendar integration — manual input
- ❌ Streaming responses — full response at once
- ❌ Voice interaction — text only

### Current Workarounds

- API keys are client-side (acceptable for demo, not production)
- All data in localStorage (no server persistence)
- No real authentication (demo user only)
- Mock AI provides deterministic responses for testing

---

## Future Roadmap

### Phase 1: Real LLM ✅ (Current)
- Provider abstraction with OpenAI/Gemini support
- Structured outputs with JSON mode
- Graceful fallback to mock

### Phase 2: Backend & Auth
- PostgreSQL database
- Supabase authentication
- Server-side API key management
- Organization tenancy

### Phase 3: Live Coaching
- Streaming transcription (Deepgram/Whisper)
- Real-time context matching
- Browser extension delivery
- In-meeting nudges

### Phase 4: Enterprise
- Company knowledge ingestion
- Document embeddings
- Team capability heatmaps
- CRM/Calendar integrations
- SSO

---

## Security Notes

- **Demo Mode**: No API keys needed, fully client-side
- **Real AI Mode**: API keys in browser environment variables
- **Production**: Requires server-side proxy for API key protection
- **Data**: All data stored locally in browser (no server transmission in demo)
- **Privacy**: No data leaves the browser in demo mode

---

## Deployment

For complete deployment instructions, see **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

### Quick Deploy to Railway

1. Push this repository to GitHub
2. Create a new project on [Railway](https://railway.app) from your GitHub repo
3. Add environment variable: `GEMINI_API_KEY` (get from [Google AI Studio](https://aistudio.google.com/apikey))
4. Deploy

The application will be available at your Railway URL with Live AI mode enabled.

### Architecture

- **Frontend**: React + TypeScript + Vite (served as static files)
- **Backend**: Express.js (serves API + frontend)
- **AI**: Google Gemini 2.5 Flash (server-side only)
- **Deployment**: Docker container on Railway

---

## License

Proprietary — All rights reserved.

---

## Support

For questions or issues, contact the development team.
