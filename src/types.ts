// Core domain types for AI Performance Coach

export type CapabilityName = 
  | 'Discovery' 
  | 'Questioning' 
  | 'Active Listening' 
  | 'Value Articulation' 
  | 'Objection Handling' 
  | 'Negotiation' 
  | 'Commercial Discipline' 
  | 'Next-Step Control';

export type CapabilityLevel = 1 | 2 | 3 | 4 | 5;

export type ObjectionHandlingDimension = 'Recognition' | 'Clarification' | 'Acknowledgement' | 'Response Relevance' | 'Value Preservation' | 'Commercial Discipline' | 'Conversational Control' | 'Advancement';
export const OBJECTION_DIMENSIONS: ObjectionHandlingDimension[] = ['Recognition', 'Clarification', 'Acknowledgement', 'Response Relevance', 'Value Preservation', 'Commercial Discipline', 'Conversational Control', 'Advancement'];

export interface CapabilityScore {
  capability: CapabilityName;
  score: number; // 1.0 - 5.0
  level: CapabilityLevel;
  evidence: EvidenceItem[];
  strength?: string;
  weakness?: string;
  recommendedIntervention?: string;
  confidence: number; // 0-1
  dimensions?: Partial<Record<ObjectionHandlingDimension, number | null>>;
}

export interface EvidenceItem {
  evidenceId?: string;
  interactionId?: string;
  sessionId?: string;
  sourceType?: 'TRANSCRIPT' | 'PRACTICE' | 'OBSERVATION';
  sourceId?: string;
  speaker?: string;
  sourceText?: string;
  behaviorObserved?: string;
  classification?: 'OBSERVED' | 'INFERRED';
  statement: string;
  source: 'transcript' | 'roleplay' | 'observation' | 'inference';
  confidence: number;
  timestamp?: string;
  observationType?: 'known' | 'observed' | 'inferred' | 'recommended';
  capability?: CapabilityName;
  turnNumber?: number; // For roleplay evidence traceability
  lineReference?: string; // For transcript evidence traceability (e.g., "Line 5-7")
}

export interface CapabilityHistory {
  capability: CapabilityName;
  scores: { date: string; score: number; source: string }[];
  currentScore: number;
  trend: 'improving' | 'stable' | 'declining';
  knownWeakness?: string;
  recentIntervention?: string;
  nextRecommendation?: string;
  confidence?: number;
  evidenceHistory?: EvidenceItem[];
  evidenceCoverage?: number;
  lastUpdated?: string;
  scenarioDifficulty?: 'low' | 'medium' | 'high';
  patterns?: string[];
  interventions?: string[];
  interventionOutcomes?: { intervention: string; result: 'improved' | 'unchanged' | 'regressed' | 'insufficient_evidence'; evidenceIds: string[]; date: string }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  context?: CompanyContext;
}

export interface CompanyContext {
  products?: string;
  pricing?: string;
  discountRules?: string;
  salesMethodology?: string;
  customerPersonas?: string;
  objectionHandling?: string;
  policies?: string;
  sop?: string;
  approvedMessaging?: string;
}

export type PerformanceMomentStatus =
  | 'UPCOMING' | 'PREPARING' | 'PREPARED' | 'PRACTICING' | 'READY'
  | 'PERFORMED' | 'ANALYZING' | 'ANALYZED' | 'IMPROVING' | 'COMPLETED'
  | 'PREPARATION_FAILED' | 'PRACTICE_FAILED' | 'ANALYSIS_FAILED';

export interface AiOperationMetadata {
  operation: string;
  provider: string;
  model: string;
  promptVersion: string;
  requestId: string;
  latency: number;
  timestamp: string;
  success: boolean;
  errorType?: string;
}

export interface ProductEvent {
  event: 'PERFORMANCE_MOMENT_CREATED' | 'PREPARATION_VIEWED' | 'PREPARATION_GENERATED' | 'PRACTICE_STARTED' | 'PRACTICE_COMPLETED' | 'REAL_PERFORMANCE_SUBMITTED' | 'ANALYSIS_COMPLETED' | 'EVIDENCE_GENERATED' | 'CAPABILITY_STATE_CHANGED' | 'INTERVENTION_COMPLETED' | 'REPEAT_INTERACTION' | 'TIME_TO_NEXT_PERFORMANCE';
  interactionId: string;
  timestamp: string;
  detail?: string;
}

export interface Interaction {
  id: string;
  userId: string;
  name: string;
  customer: string;
  role: string;
  dateTime: string;
  objective: string;
  agenda: string;
  notes?: string;
  additionalContext?: string;
  status: PerformanceMomentStatus;
  scenarioPlan?: ScenarioPlan;
  stakeholder?: string;
  stakeholderRole?: string;
  interactionType?: string;
  priority?: 'low' | 'medium' | 'high';
  focusCapability?: CapabilityName;
  createdAt: string;
}

export type PracticeModule =
  | 'discovery'
  | 'negotiation'
  | 'renewal-expansion';

export interface DealIntelligence {
  module: PracticeModule;
  dealStage: string;
  dealValue: string;
  contractTerm: string;
  solution: string;
  buyerRole: string;
  buyerContext: string;
  triggerEvent: string;
  businessImpact: string;
  stakeholderMap: string;
  competition: string;
  commercialContext: string;
  sellerObjective: string;
  desiredNextStep: string;
  knownFacts: string;
  unknowns: string;
  difficulty: 'foundation' | 'standard' | 'advanced';
}

export interface PreparationBrief {
  id: string;
  interactionId: string;
  objective: string;
  stakeholderPriorities: string[];
  relevantContext: string[];
  commercialGuidance: CommercialGuidance;
  likelyObjections: string[];
  recommendedQuestions: string[];
  recommendedPositioning: string[];
  thingsToAvoid: string[];
  personalCoachingFocus: string;
  practiceRecommendation: string;
  unknowns?: string[];
  risks?: string[];
  whyPersonalized?: string;
  sourceMode?: 'GENERAL_COACH' | 'COMPANY_COACH';
  companySource?: string;
  priorLearning?: string;
  sourceProvenance?: Record<string, 'CUSTOMER_CONTEXT' | 'EMPLOYEE_HISTORY' | 'COMPANY_POLICY' | 'MODEL_RECOMMENDATION' | 'UNKNOWN'>;
  generatedAt: string;
}

export interface CommercialGuidance {
  discountLimits: string;
  relevantPackage: string;
  tradeOffs: string[];
  escalationItems: string[];
  note: string;
}

export interface RoleplayConfig {
  stakeholderRole: string;
  objectives: string[];
  likelyObjections: string[];
  personality: string;
  pressureLevel: 'low' | 'medium' | 'high';
  commercialConstraints: string;
  hiddenPriorities: string[];
  desiredOutcome: string;
  interactionContext?: string;
  performancePlan?: string;
  targetCapability?: CapabilityName;
  employeeCapabilityState?: string;
  targetBehavior?: string;
  module?: PracticeModule;
  scenarioTitle?: string;
  dealIntelligence?: DealIntelligence;
  knownFacts?: string[];
  unknowns?: string[];
  objectionLadder?: string[];
  triggerConditions?: string[];
  requiredBehaviors?: string[];
  forbiddenMoves?: string[];
}

export interface ScenarioPlan extends RoleplayConfig {
  interactionId: string;
  sourceMode?: 'REAL_CONTEXT' | 'DEMO';
  module: PracticeModule;
  scenarioTitle: string;
  dealIntelligence: DealIntelligence;
  knownFacts: string[];
  unknowns: string[];
  objectionLadder: string[];
  triggerConditions: string[];
  requiredBehaviors: string[];
  forbiddenMoves: string[];
}

export interface PracticeSession {
  id: string;
  interactionId: string;
  config: RoleplayConfig;
  turns: PracticeTurn[];
  status: 'active' | 'completed';
  startedAt: string;
  completedAt?: string;
}

export interface PracticeTurn {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: string;
}

export interface PracticeEvaluation {
  id: string;
  sessionId: string;
  interactionId: string;
  overallReadiness: number; // 0-100
  readiness?: 'READY' | 'READY_ONE_RISK_REMAINS' | 'PRACTICE_ONCE_MORE' | 'INSUFFICIENT_EVIDENCE';
  capabilityScores: CapabilityScore[];
  strengths: string[];
  weaknesses: string[];
  nextPractice: string;
  generatedAt: string;
}

export interface Transcript {
  id: string;
  interactionId: string;
  content: string;
  source: 'upload' | 'paste' | 'demo';
  uploadedAt: string;
  performancePlanId?: string;
  practiceSessionIds?: string[];
  capabilitySnapshotBefore?: CapabilityHistory[];
}

export interface PlanVsActual {
  intended: string;
  actual: string;
  impact: 'Low' | 'Medium' | 'High';
  explanation: string;
  evidenceIds?: string[];
  sourceText?: string;
  observation?: 'OBSERVED' | 'NOT_OBSERVED' | 'INSUFFICIENT_EVIDENCE';
}

export interface PostInteractionAnalysis {
  id: string;
  interactionId: string;
  transcriptId: string;
  planVsActual: PlanVsActual[];
  strengths: string[];
  missedOpportunities: string[];
  capabilityDiagnosis: CapabilityScore[];
  repeatedPatterns: string[];
  likelyImpact: string;
  nextIntervention: CoachingIntervention;
  generatedAt: string;
}

export interface CoachingIntervention {
  id: string;
  title: string;
  description: string;
  targetCapability: CapabilityName;
  recommendedAction: string;
  estimatedDuration: string;
  priority: 'high' | 'medium' | 'low';
  behaviour?: string;
  whyItMatters?: string;
  exercise?: string;
  difficulty?: 'low' | 'medium' | 'high';
  successCriterion?: string;
}

export interface AppState {
  user: User | null;
  organization: Organization | null;
  interactions: Interaction[];
  briefs: PreparationBrief[];
  practiceSessions: PracticeSession[];
  practiceEvaluations: PracticeEvaluation[];
  transcripts: Transcript[];
  analyses: PostInteractionAnalysis[];
  capabilityHistory: CapabilityHistory[];
  companyContext: CompanyContext | null;
  aiOperations?: AiOperationMetadata[];
  productEvents?: ProductEvent[];
}
