# STATIC AI PATH AUDIT

## CRITICAL BUG IDENTIFIED

**The roleplay conversation is NOT using conversation history!**

### Current Flow (BROKEN):
```
Roleplay.tsx (line 94):
  getRoleplayResponse(input.trim(), config)
  ↓
ai-service.ts (line 489):
  getRoleplayResponse(userMessage, config)
  ↓
ai-service.ts (line 498):
  getRoleplayLLM(userMessage, config)
  ↓
  Creates prompt with ONLY:
  - System prompt (persona)
  - Current user message
  ↓
  Backend /api/ai/chat receives NO conversation history
  ↓
  Gemini generates response with NO context of previous turns
```

### Why It Appears Scripted:
- AI has no memory of what was said before
- Each response is generated in isolation
- Appears to follow a fixed script because it's reacting to single messages
- Cannot adapt to conversation flow

## COMPLETE AI PATH AUDIT

| Operation | Current Path | Classification | Problem |
|-----------|--------------|----------------|---------|
| **1. Preparation** | `generateBrief()` → `generateBriefWithLLM()` → Backend `/api/ai/prepare` | REAL_LLM | ✅ Working |
| **2. Scenario Generation** | `generateRoleplayConfig()` | RULE_BASED | ⚠️ Static config, not LLM-generated |
| **3. Stakeholder Opening** | `getRoleplayResponse('', config)` → `getRoleplayLLM()` | REAL_LLM | ❌ No conversation history |
| **4. Stakeholder Response** | `getRoleplayResponse(userMessage, config)` → `getRoleplayLLM()` | REAL_LLM | ❌ **CRITICAL: No conversation history passed** |
| **5. Difficulty Adaptation** | None | NOT_IMPLEMENTED | ❌ Not implemented |
| **6. Roleplay Evaluation** | `generatePracticeEvaluation()` → `generateEvalWithLLM()` → Backend `/api/ai/evaluate` | REAL_LLM | ✅ Working (receives full conversation) |
| **7. Evidence Extraction** | Part of evaluation | REAL_LLM | ✅ Working |
| **8. Capability Scoring** | Part of evaluation | REAL_LLM | ✅ Working |
| **9. Transcript Analysis** | `analyzeTranscript()` → `analyzeWithLLM()` → Backend `/api/ai/analyze` | REAL_LLM | ✅ Working |
| **10. Plan vs Actual** | Part of transcript analysis | REAL_LLM | ✅ Working |
| **11. Capability Diagnosis** | Part of transcript analysis | REAL_LLM | ✅ Working |
| **12. Pattern Detection** | `detectPatterns()` in capability-memory.ts | RULE_BASED | ⚠️ Rule-based, not LLM |
| **13. Intervention Generation** | `generateIntervention()` in capability-memory.ts | RULE_BASED | ⚠️ Rule-based, not LLM |
| **14. Capability Update** | `updateCapabilityHistory()` → `judgeCapabilityStateUpdate()` | MIXED | ⚠️ Uses judge LLM but fallback is rule-based |
| **15. Validation Gate 2** | `validatePreparationQuality()` | LOCAL | ⚠️ Tests mock/real outputs locally |
| **16. Validation Gate 3** | `runObjectionHandlingBenchmark()` | LOCAL | ⚠️ Tests mock/real outputs locally |
| **17. Validation Gate 4** | `validateEvidenceTraceability()` | LOCAL | ⚠️ Tests mock/real outputs locally |
| **18. Validation Gate 5** | `runAdversarialTests()` | LOCAL | ⚠️ Tests mock/real outputs locally |

## ROOT CAUSE ANALYSIS

### Primary Issue: Missing Conversation History

**Location:** `src/components/Roleplay.tsx` line 94
```typescript
const response = await getRoleplayResponse(input.trim(), config);
```

**Problem:** Only passing current message, not `session.turns`

**Location:** `src/ai-service.ts` line 489
```typescript
export async function getRoleplayResponse(userMessage: string, config: RoleplayConfig): Promise<string>
```

**Problem:** Function signature doesn't accept conversation history

**Location:** `src/ai-service.ts` line 498-510
```typescript
async function getRoleplayLLM(userMessage: string, config: RoleplayConfig): Promise<string> {
  const provider = createLLMProvider();
  roleplayState.turnCount++;
  
  const systemPrompt = `You are ${config.stakeholderRole}...`;
  
  const response = await provider.chat(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage || 'Start conversation.' }],
    { temperature: 0.8 }
  );
  return response.content;
}
```

**Problem:** Only sending system prompt + current message, no conversation history

### Secondary Issues:

1. **Silent Fallback to Mock** (ai-service.ts line 493-495)
   ```typescript
   if (isLLMAvailable()) {
     try { return await getRoleplayLLM(userMessage, config); }
     catch (e) { console.error('LLM roleplay failed:', e); }
   }
   return getRoleplayMock(userMessage, config);
   ```
   - In LIVE MODE, should NOT fall back to mock
   - Should throw error instead

2. **Mock Function Still Exists** (ai-service.ts line 513-528)
   - Contains hardcoded responses
   - Should not be called in LIVE MODE

3. **Backend Endpoint Missing** 
   - Frontend calls `/api/ai/chat` (generic endpoint)
   - Should have dedicated `/api/ai/roleplay/respond` endpoint
   - Should accept conversation history

## REQUIRED FIXES

### Fix 1: Pass Conversation History

**File:** `src/components/Roleplay.tsx`
- Change line 94 to pass `session.turns`

**File:** `src/ai-service.ts`
- Update `getRoleplayResponse()` signature to accept conversation history
- Update `getRoleplayLLM()` to include conversation in prompt

### Fix 2: Remove Silent Fallback

**File:** `src/ai-service.ts`
- In LIVE MODE, throw error instead of falling back to mock
- Only use mock in DEMO MODE

### Fix 3: Create Dedicated Backend Endpoint

**File:** `backend/server.js`
- Create `/api/ai/roleplay/respond` endpoint
- Accept conversation history
- Return structured response with metadata

### Fix 4: Add Conversation Context to Prompt

**File:** `src/ai-service.ts`
- Build conversation history string
- Include in system prompt or as separate messages
- Ensure Gemini has full context

## IMPLEMENTATION PLAN

1. Update function signatures to accept conversation history
2. Update Roleplay component to pass session.turns
3. Update getRoleplayLLM to build conversation context
4. Create dedicated backend endpoint
5. Remove silent fallback in LIVE MODE
6. Add metadata to responses for verification
7. Test with manual acceptance tests

## EXPECTED RESULT

After fix:
- AI receives full conversation history
- Responses are contextually aware
- Stakeholder reacts to actual employee behavior
- No scripted/deterministic responses
- Dynamic difficulty adaptation possible
