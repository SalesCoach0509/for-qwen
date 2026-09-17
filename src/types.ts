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

export interface CapabilityScore {
  capability: CapabilityName;
  score: number; // 1.0 - 5.0
  level: CapabilityLevel;
  evidence: EvidenceItem[];
  strength?: string;
  weakness?: string;
  recommendedIntervention?: string;
  confidence: number; // 0-1
}

export interface EvidenceItem {
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
  scenarioPlan?: ScenarioPlan;
  status: 'upcoming' | 'prepared' | 'practiced' | 'performed' | 'analyzed';
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
}

export interface PlanVsActual {
  intended: string;
  actual: string;
  impact: 'Low' | 'Medium' | 'High';
  explanation: string;
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
}
