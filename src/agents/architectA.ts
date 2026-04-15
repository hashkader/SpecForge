import { OrchestrationPlan, ResearchContext, ArchitecturalProposal } from '../types/index.js';
import { logger } from '../utils/logger.js';

export async function runArchitectA(
  plan: OrchestrationPlan,
  research: ResearchContext,
  previousCritique?: string
): Promise<ArchitecturalProposal> {
  logger.divider('ARCHITECT A');

  const isRevision = !!previousCritique;
  logger.agent(
    'ARCHITECT_A',
    isRevision ? 'Revising proposal based on Architect B critique...' : 'Generating initial proposal...'
  );

  logger.input('ARCHITECT_A', 'Briefing', {
    featureSummary: plan.featureSummary,
    architecturalConcerns: plan.architecturalConcerns,
    priorArtCount: research.priorArt.length,
    relevantFilesCount: research.relevantFiles.length,
    existingPatternsCount: research.existingPatterns.length,
    researchSummary: research.summary.slice(0, 200) + '...',
    keyFindings: research.priorArt.slice(0, 3).map(f => ({
      claim: f.claim,
      source: f.source,
      confidence: f.confidence,
    })),
  });

  if (previousCritique) {
    logger.input('ARCHITECT_A', 'Critique to address', previousCritique);
  }

  // STUB: Phase 3 replaces with a real Claude API call
  const proposal: ArchitecturalProposal = {
    title: `Architecture proposal: ${plan.featureSummary}`,
    approach:
      'Extend the existing payment service with a PayFast split-payment adapter. ' +
      'Introduce a SplitPaymentService that wraps PayFast API calls and maps ' +
      'to the existing checkout flow via a new checkout step.',
    components: [
      {
        name: 'SplitPaymentService',
        responsibility: 'Orchestrate split payment logic and PayFast API calls',
        technology: 'TypeScript class using composition with existing PaymentService',
      },
      {
        name: 'PayFastAdapter',
        responsibility: 'Translate internal payment models to PayFast API contracts',
        technology: 'TypeScript with Zod schema validation',
      },
      {
        name: 'WebhookHandler',
        responsibility: 'Receive and process PayFast ITN webhook notifications',
        technology: 'Extends existing webhook handler pattern',
      },
    ],
    tradeoffs: [
      {
        benefit: 'Builds on existing PaymentService — minimal new surface area',
        cost: 'Inherits any existing PaymentService coupling',
      },
      {
        benefit: 'Adapter pattern isolates PayFast specifics behind an interface',
        cost: 'Extra abstraction layer adds indirection',
      },
    ],
    assumptions: [
      'Existing PaymentService is injectable / mockable',
      'Webhook infrastructure is already deployed',
      'PayFast sandbox credentials are available for testing',
      'Maximum 5 split recipients per transaction (per PayFast API limits)',
    ],
    estimatedComplexity: 'medium',
  };

  logger.output('ARCHITECT_A', 'ArchitecturalProposal', proposal);
  return proposal;
}