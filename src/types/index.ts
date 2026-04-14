export interface FeatureRequest {
  raw: string;
  timestamp: string;
}

export interface OrchestrationPlan {
  featureSummary: string;
  problemStatement: string;
  scope: string[];
  constraints: string[];
  questionsForResearch: string[];
  architecturalConcerns: string[];
}

export interface ResearchContext {
  priorArt: SourcedFinding[];
  relevantFiles: CodebaseFile[];
  existingPatterns: SourcedFinding[];
  summary: string;
}

export interface ProposedComponent {
  name: string;
  responsibility: string;
  technology: string;
}

export interface Tradeoff {
  benefit: string;
  cost: string;
}

export interface ArchitecturalProposal {
  title: string;
  approach: string;
  components: ProposedComponent[];
  tradeoffs: Tradeoff[];
  assumptions: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
}

export interface CritiqueDimension {
  name: string;
  score: number;
  feedback: string;
}

export interface Critique {
  score: number;
  dimensions: CritiqueDimension[];
  conflicts: ConflictRecord[];
  overallFeedback: string;
  passed: boolean;
}


export interface AssumptionCheck {
  assumption: string;
  valid: boolean;
  evidence: SourcedFinding | null;
  notes: string;
}

export interface ValidationReport {
  passed: boolean;
  assumptionsChecked: AssumptionCheck[];
  blockers: string[];
  warnings: string[];
}

export interface ADR {
  title: string;
  date: string;
  status: 'proposed' | 'accepted' | 'rejected';
  context: string;
  decision: string;
  consequences: string[];
  alternativesConsidered: string[];
  debateRounds: number;
  conflicts: ConflictRecord[];
}

export interface SourcedFinding {
  claim: string;
  source: string;
  sourceType: 'web' | 'file' | 'inferred';
  excerpt: string;
  retrievedAt: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface CodebaseFile {
  path: string;
  relativePath: string;
  content: string;
  language: string;
  relevanceReason: string;
}

export interface ConflictRecord {
  claim: string;
  contradictedBy: string;
  source: string;
  severity: 'high' | 'medium' | 'low';
  resolution: 'unresolved' | 'revision-needed' | 'accepted-risk';
}