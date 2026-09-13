# AI Performance Coach - Chain of Operations Explained

## 📊 Complete Application Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  (React Frontend - src/components/)                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API REQUEST LAYER                          │
│  (src/llm-provider.ts - Backend Proxy)                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVER                             │
│  (backend/server.js - Express Routes)                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       AI GATEWAY                                │
│  (backend/ai-gateway/ - Provider Abstraction)                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    LLM PROVIDER                                 │
│  (NVIDIA NIM / DeepSeek / Gemini / OpenAI)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Chain 1: Roleplay Conversation

### User Journey
```
User clicks "Start Roleplay"
        ↓
Frontend creates session with unique ID
        ↓
Frontend sends POST /api/ai/roleplay/respond
        ↓
Backend receives request with conversation history
        ↓
AI Gateway validates model capabilities
        ↓
Provider adapter formats request for NVIDIA NIM
        ↓
NVIDIA NIM API generates stakeholder response
        ↓
Backend validates and cleans response
        ↓
Frontend displays stakeholder dialogue
        ↓
User reads response and types reply
        ↓
Cycle repeats with updated conversation history
```

### Technical Chain
```javascript
// 1. Frontend (Roleplay.tsx)
const response = await getRoleplayResponse(
  userMessage,           // User's latest message
  config,                // Stakeholder config
  conversationHistory,   // Full conversation
  sessionId              // Unique session ID
);

// 2. LLM Provider (llm-provider.ts)
const response = await fetch(`${BACKEND_URL}/api/ai/roleplay/respond`, {
  method: 'POST',
  body: JSON.stringify({
    userMessage,
    config,
    conversationHistory,
    sessionId
  })
});

// 3. Backend Route (server.js)
app.post('/api/ai/roleplay/respond', async (req, res) => {
  const { userMessage, config, conversationHistory, sessionId } = req.body;
  
  // Build messages for AI
  const messages = [
    { role: 'system', content: stakeholderContext },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];
  
  // Call AI Gateway
  const result = await aiGateway.generate(messages, {
    temperature: 0.8,
    maxTokens: 500
  });
  
  // Clean response
  const cleanedResponse = validateAndCleanRoleplayResponse(
    result.content, 
    config.stakeholderRole
  );
  
  res.json({ 
    response: cleanedResponse,
    sessionId,
    conversationState
  });
});

// 4. AI Gateway (gateway.js)
async generate(messages, options) {
  // Validate capabilities
  const capabilityCheck = checkModelCapabilities(this.model, [
    TEXT_GENERATION,
    CONVERSATION
  ]);
  
  if (!capabilityCheck.supported) {
    return { error: 'MODEL_CAPABILITY_UNSUPPORTED' };
  }
  
  // Call provider
  return await this.provider.generate(messages, options);
}

// 5. Provider Adapter (provider-adapters.js)
class OpenAICompatibleAdapter {
  async generate(messages, options) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens
      })
    });
    
    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage
    };
  }
}

// 6. NVIDIA NIM API
// POST https://integrate.api.nvidia.com/v1/chat/completions
// Returns stakeholder response
```

---

## 🔗 Chain 2: Practice Evaluation

### User Journey
```
User completes roleplay session
        ↓
User clicks "End & Evaluate"
        ↓
Frontend sends POST /api/ai/evaluate
        ↓
Backend receives conversation turns
        ↓
AI Gateway validates model capabilities
        ↓
Provider adapter formats evaluation request
        ↓
NVIDIA NIM API analyzes conversation
        ↓
Backend parses structured JSON response
        ↓
Frontend displays capability scores
        ↓
Capability history is updated
```

### Technical Chain
```javascript
// 1. Frontend (PracticeResults.tsx)
const evaluation = await generatePracticeEvaluation(
  turns,      // All conversation turns
  config,     // Roleplay config
  sessionId   // Session ID
);

// 2. Backend Route (server.js)
app.post('/api/ai/evaluate', async (req, res) => {
  const { turns, config } = req.body;
  
  // Format conversation
  const conversation = turns.map(t => 
    `${t.role === 'ai' ? config.stakeholderRole : 'Employee'}: ${t.content}`
  ).join('\n');
  
  // Call AI Gateway
  const result = await aiGateway.generate([
    { role: 'system', content: evaluationPrompt },
    { role: 'user', content: conversation }
  ], { 
    jsonMode: true,
    temperature: 0.2
  });
  
  // Parse structured response
  const evaluation = JSON.parse(result.content);
  res.json(evaluation);
});

// 3. AI Gateway
// Same as roleplay - validates capabilities and calls provider

// 4. NVIDIA NIM API
// Returns structured JSON:
{
  "objectionHandlingScore": 3.5,
  "objectionHandlingLevel": 3,
  "evidence": [
    {
      "turnNumber": 2,
      "statement": "Asked clarifying question",
      "observationType": "observed",
      "confidence": 0.9
    }
  ],
  "strength": "Good clarification skills",
  "weakness": "Needs more value reframing",
  "recommendedIntervention": "Practice value articulation"
}

// 5. Frontend processes evaluation
// Updates capability history
// Displays scores and evidence
```

---

## 🔗 Chain 3: Transcript Analysis

### User Journey
```
User uploads/pastes transcript
        ↓
Frontend sends POST /api/ai/analyze
        ↓
Backend receives transcript + brief
        ↓
AI Gateway validates model capabilities
        ↓
Provider adapter formats analysis request
        ↓
NVIDIA NIM API analyzes transcript
        ↓
Backend parses structured response
        ↓
Frontend displays Plan vs Actual
        ↓
Capability diagnosis is generated
```

### Technical Chain
```javascript
// 1. Frontend (PostInteraction.tsx)
const analysis = await analyzeTranscript(
  transcript,    // Raw transcript text
  interaction,   // Interaction context
  brief          // Preparation brief
);

// 2. Backend Route (server.js)
app.post('/api/ai/analyze', async (req, res) => {
  const { transcript, interaction, brief } = req.body;
  
  // Call AI Gateway
  const result = await aiGateway.generate([
    { role: 'system', content: analysisPrompt },
    { role: 'user', content: `Transcript:\n${transcript}` }
  ], { jsonMode: true });
  
  // Parse structured response
  const analysis = JSON.parse(result.content);
  res.json(analysis);
});

// 3. NVIDIA NIM API
// Returns structured JSON:
{
  "planVsActual": [
    {
      "intended": "Establish value before price",
      "actual": "Moved to pricing early",
      "impact": "High",
      "explanation": "Reduced negotiating leverage"
    }
  ],
  "strengths": ["Good acknowledgment"],
  "missedOpportunities": ["Didn't clarify underlying concern"],
  "objectionHandlingScore": 2.5,
  "objectionHandlingEvidence": [...],
  "repeatedPatterns": ["Premature discounting"],
  "nextIntervention": {...}
}
```

---

## 🔗 Chain 4: Capability Memory Update

### User Journey
```
Evaluation completes
        ↓
Frontend calls updateCapabilityHistory()
        ↓
Judge LLM validates new evidence
        ↓
Capability scores are updated
        ↓
Trends are calculated
        ↓
Patterns are detected
        ↓
Next intervention is recommended
        ↓
Frontend displays updated capability state
```

### Technical Chain
```javascript
// 1. Frontend (capability-memory.ts)
async function updateCapabilityHistory(
  current,      // Current capability history
  newScores,    // New evaluation scores
  source        // Source of evaluation
) {
  // 2. Judge LLM validates update
  const judgeResult = await judgeCapabilityStateUpdate(
    {
      capability: cap.capability,
      currentScore: cap.currentScore,
      trend: cap.trend,
      evidenceCount: cap.scores.length
    },
    {
      score: newScore.score,
      source,
      confidence: newScore.confidence
    }
  );
  
  // 3. If judge approves, update history
  if (judgeResult.decision === 'UPDATED') {
    const updatedScores = [...cap.scores, {
      date: today,
      score: newScore.score,
      source
    }];
    
    // 4. Calculate weighted score
    const weightedScore = calculateWeightedScore({
      ...cap,
      scores: updatedScores
    });
    
    // 5. Detect patterns
    const patterns = detectPatterns({
      ...cap,
      scores: updatedScores
    });
    
    // 6. Generate intervention
    const intervention = generateIntervention(
      { ...cap, scores: updatedScores, trend },
      patterns
    );
    
    return {
      ...cap,
      scores: updatedScores,
      currentScore: weightedScore,
      trend,
      knownWeakness: newScore.weakness,
      recentIntervention: intervention.title,
      nextRecommendation: intervention.recommendedAction
    };
  }
}

// 7. Judge LLM (judge.ts)
async function judgeCapabilityStateUpdate(currentState, newEvidence) {
  const provider = createLLMProvider();
  
  const response = await provider.chat([
    {
      role: 'system',
      content: `Evaluate if capability state should be updated...`
    }
  ], { jsonMode: true });
  
  return JSON.parse(response.content);
  // Returns: { decision: 'UPDATED' | 'NO_CHANGE', reason, confidence }
}
```

---

## 🔗 Chain 5: Preparation Brief Generation

### User Journey
```
User creates interaction
        ↓
Frontend sends POST /api/ai/prepare
        ↓
Backend receives interaction context
        ↓
AI Gateway validates model capabilities
        ↓
Provider adapter formats preparation request
        ↓
NVIDIA NIM API generates brief
        ↓
Backend parses structured response
        ↓
Frontend displays Performance Brain Map
```

### Technical Chain
```javascript
// 1. Frontend (PerformanceBrief.tsx)
const brief = await generateBrief(
  interaction,         // Interaction details
  capabilityHistory    // Employee's capability history
);

// 2. Backend Route (server.js)
app.post('/api/ai/prepare', async (req, res) => {
  const { interaction } = req.body;
  
  // Build personalized prompt
  const capabilityContext = capabilityHistory.map(cap => 
    `${cap.capability}: ${cap.currentScore}/5`
  ).join('\n');
  
  // Call AI Gateway
  const result = await aiGateway.generate([
    { role: 'system', content: preparationPrompt },
    { role: 'user', content: `Interaction: ${interaction.name}\n\n${capabilityContext}` }
  ], { jsonMode: true });
  
  // Parse structured response
  const brief = JSON.parse(result.content);
  res.json(brief);
});

// 3. NVIDIA NIM API
// Returns structured JSON:
{
  "objective": "Renew contract and identify expansion",
  "stakeholderPriorities": ["Cost reduction", "Implementation certainty"],
  "relevantContext": ["Renewal situation", "Active competitive situation"],
  "commercialGuidance": {
    "discountLimits": "Not provided",
    "relevantPackage": "Core platform renewal"
  },
  "likelyObjections": ["Price is too high", "Competitor quoted less"],
  "recommendedQuestions": ["What's the business impact?"],
  "recommendedPositioning": ["Lead with invested value"],
  "thingsToAvoid": ["Don't lead with pricing"],
  "personalCoachingFocus": "Your Objection Handling (2.7/5) needs work...",
  "practiceRecommendation": "Practice value-before-price..."
}
```

---

## 🔗 Chain 6: Model Capability Validation

### System Journey
```
Application starts
        ↓
Backend loads environment variables
        ↓
AI Gateway initializes with provider/model
        ↓
Gateway checks model in capability registry
        ↓
If model found: validate capabilities
        ↓
If capabilities sufficient: initialize provider adapter
        ↓
If capabilities insufficient: throw error
        ↓
If model not found: throw error
        ↓
Application ready to serve requests
```

### Technical Chain
```javascript
// 1. Backend startup (server.js)
try {
  aiGateway = initializeGatewayFromEnv();
  console.log('✅ AI Gateway initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize AI Gateway:', error.message);
  process.exit(1);
}

// 2. Gateway initialization (gateway.js)
function initializeGatewayFromEnv() {
  const provider = process.env.LLM_PROVIDER || 'gemini';
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  
  aiGateway.initialize({ provider, apiKey, model });
  return aiGateway;
}

// 3. Gateway initialize method
initialize(config) {
  const { provider, apiKey, model } = config;
  
  // Check model in registry
  const capabilityCheck = checkModelCapabilities(model, [
    TEXT_GENERATION,
    CONVERSATION
  ]);
  
  if (!capabilityCheck.supported) {
    throw new Error(capabilityCheck.error);
  }
  
  // Create provider adapter
  this.provider = createProviderAdapter({
    provider,
    apiKey,
    model
  });
  
  this.model = model;
  this.initialized = true;
}

// 4. Capability check (model-capabilities.js)
function checkModelCapabilities(modelId, requiredCapabilities) {
  const modelInfo = MODEL_CAPABILITY_REGISTRY[modelId];
  
  if (!modelInfo) {
    return {
      supported: false,
      error: `Model ${modelId} not found in capability registry`
    };
  }
  
  const missingCapabilities = requiredCapabilities.filter(
    cap => !modelInfo.capabilities.includes(cap)
  );
  
  if (missingCapabilities.length > 0) {
    return {
      supported: false,
      error: `Model does not support: ${missingCapabilities.join(', ')}`
    };
  }
  
  return { supported: true, modelInfo };
}

// 5. Provider adapter creation (provider-adapters.js)
function createProviderAdapter(config) {
  const { provider, apiKey, model, baseUrl } = config;
  
  switch (provider) {
    case 'nvidia-nim':
      return new OpenAICompatibleAdapter({
        name: 'nvidia-nim',
        apiKey,
        model,
        baseUrl: baseUrl || 'https://integrate.api.nvidia.com/v1'
      });
    
    case 'gemini':
      return new GeminiAdapter({ apiKey, model });
    
    // ... other providers
  }
}
```

---

## 🔗 Chain 7: Response Validation & Cleaning

### System Journey
```
AI provider returns response
        ↓
Backend receives raw response
        ↓
Validate response structure
        ↓
Check for prompt leakage patterns
        ↓
Remove internal instructions
        ↓
Remove meta-commentary
        ↓
Trim whitespace
        ↓
Return cleaned response to frontend
```

### Technical Chain
```javascript
// 1. Backend receives response
const result = await aiGateway.generate(messages, options);
let text = result.content;

// 2. Validate and clean (server.js)
function validateAndCleanRoleplayResponse(text, stakeholderRole) {
  // Define leakage patterns
  const leakagePatterns = [
    /Check Rules & Constraints:.*?(?=\n\n|$)/gi,
    /Rules & Constraints:.*?(?=\n\n|$)/gi,
    /Internal (Note|Instruction|Reasoning):.*?(?=\n\n|$)/gi,
    /As (an? )?(AI|assistant|language model).*?(?=\n\n|$)/gi,
    /Evaluation criteria:.*?(?=\n\n|$)/gi,
    /\[System:.*?\]/gi,
    /<thinking>.*?<\/thinking>/gi,
    /<reasoning>.*?<\/reasoning>/gi
  ];
  
  let cleaned = text;
  
  // Remove each pattern
  for (const pattern of leakagePatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Remove meta-commentary
  cleaned = cleaned.replace(
    /Remember,? I('m| am) (playing|acting|roleplaying).*?(?=\n\n|$)/gi, 
    ''
  );
  cleaned = cleaned.replace(
    /I('m| am) (staying|remaining) in (character|role).*?(?=\n\n|$)/gi, 
    ''
  );
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  // Safety check - don't remove too much
  if (cleaned.length < text.length * 0.5) {
    console.warn('⚠️ Response cleaning removed significant content');
    return text; // Return original
  }
  
  return cleaned;
}

// 3. Return cleaned response
res.json({ 
  response: cleanedText,
  sessionId,
  conversationState
});
```

---

## 🔗 Chain 8: Error Handling & Fallback

### System Journey
```
AI operation is called
        ↓
Check if LLM is available
        ↓
If available: call AI Gateway
        ↓
If AI Gateway succeeds: return result
        ↓
If AI Gateway fails: throw error
        ↓
Frontend catches error
        ↓
Display error message to user
        ↓
User can retry or end session
```

### Technical Chain
```javascript
// 1. Frontend checks availability
if (isLLMAvailable()) {
  try {
    return await generateBriefWithLLM(interaction, capabilityHistory);
  } catch (e) {
    console.error('LLM brief failed:', e);
    throw new Error(`LIVE AI ERROR: Brief generation failed. ${e}`);
  }
}

// 2. Backend validates provider
if (!this.isConfigured()) {
  throw new Error(`${this.name} provider not properly configured`);
}

// 3. Provider makes API call
try {
  const response = await fetch(`${this.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`${this.name} API error: ${JSON.stringify(error)}`);
  }
  
  return await response.json();
} catch (error) {
  console.error(`✗ ${this.name} call failed:`, error);
  throw error;
}

// 4. Frontend handles error
try {
  const response = await getRoleplayResponse(...);
  // Success - display response
} catch (error) {
  console.error('Roleplay error:', error);
  setSessionFailed(true);
  // Display error UI
}
```

---

## 📋 Complete Data Flow Summary

```
┌──────────────────────────────────────────────────────────────┐
│ 1. USER ACTION                                               │
│    - Clicks button, types message, uploads file             │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. FRONTEND PROCESSING                                       │
│    - Validates input                                          │
│    - Creates request payload                                  │
│    - Adds session ID, conversation history                   │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. API REQUEST                                               │
│    - POST to backend endpoint                                 │
│    - Includes JSON payload                                    │
│    - Backend proxy handles routing                            │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. BACKEND ROUTING                                           │
│    - Express route handler                                    │
│    - Extracts request data                                    │
│    - Calls AI Gateway                                         │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. AI GATEWAY                                                │
│    - Validates model capabilities                             │
│    - Selects provider adapter                                 │
│    - Formats request for provider                             │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 6. PROVIDER ADAPTER                                          │
│    - Formats API request                                      │
│    - Adds authentication                                      │
│    - Sends to LLM provider API                                │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 7. LLM PROVIDER API                                          │
│    - NVIDIA NIM / Gemini / OpenAI                             │
│    - Processes request                                        │
│    - Returns response                                         │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 8. RESPONSE PROCESSING                                       │
│    - Provider adapter parses response                         │
│    - AI Gateway validates structure                           │
│    - Backend cleans/validates response                        │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 9. FRONTEND PROCESSING                                       │
│    - Parses response                                          │
│    - Updates state                                            │
│    - Updates capability history                               │
│    - Displays to user                                         │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 10. USER FEEDBACK                                            │
│     - User sees result                                       │
│     - User provides next input                               │
│     - Cycle repeats                                          │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Concepts

### 1. Provider Abstraction
The AI Gateway abstracts away provider differences. Whether using NVIDIA NIM, Gemini, or OpenAI, the application code remains the same.

### 2. Capability Validation
Before any AI operation, the system validates that the selected model supports the required capabilities (text generation, conversation, structured output, etc.).

### 3. Session Isolation
Each roleplay session has a unique ID. Conversation history is passed with each request, but sessions never share state.

### 4. Evidence Grounding
All capability assessments must include evidence with turn/line references. No scores without supporting evidence.

### 5. Response Validation
All AI responses are validated and cleaned to prevent prompt leakage and ensure only user-visible content is displayed.

### 6. Error Handling
If any AI operation fails, the error is propagated to the user. No silent fallbacks in LIVE MODE.

---

## 📊 Configuration Chain

```
Environment Variables (Railway)
        ↓
LLM_PROVIDER=nvidia-nim
LLM_API_KEY=your-key
LLM_MODEL=deepseek-ai/deepseek-v4-flash-0731
        ↓
Backend loads variables (server.js)
        ↓
AI Gateway initializes (gateway.js)
        ↓
Model validated in registry (model-capabilities.js)
        ↓
Provider adapter created (provider-adapters.js)
        ↓
Ready to serve requests
```

---

## 🔐 Security Chain

```
API Key stored in Railway environment
        ↓
Backend reads from process.env
        ↓
Key never exposed to frontend
        ↓
Backend adds to API request headers
        ↓
LLM provider authenticates request
        ↓
Response returns to backend
        ↓
Backend returns cleaned response to frontend
        ↓
Frontend never sees API key
```

---

## 📝 Summary

The AI Performance Coach uses a **chain of operations** pattern where:

1. **User actions** trigger frontend processing
2. **Frontend** sends requests to backend
3. **Backend** routes to AI Gateway
4. **AI Gateway** validates and selects provider
5. **Provider adapter** formats request for LLM API
6. **LLM API** generates response
7. **Response** flows back through the chain
8. **Validation/cleaning** at each step
9. **Frontend** displays result to user
10. **State updates** (capability history, session state)

Each link in the chain has **validation**, **error handling**, and **security checks** to ensure reliability and data integrity.
