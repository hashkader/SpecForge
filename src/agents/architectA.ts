import { OrchestrationPlan, ResearchContext, ArchitecturalProposal } from '../types/index.ts';
import { logger } from '../utils/logger.ts';

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

  logger.input('ARCHITECT_A', 'OrchestrationPlan + ResearchContext', {
    featureSummary: plan.featureSummary,
    architecturalConcerns: plan.architecturalConcerns,
    existingPatterns: research.existingPatterns,
    relevantFiles: research.relevantFiles,
  });

  if (previousCritique) {
    logger.input('ARCHITECT_A', 'Critique to address', previousCritique);
  }

  // STUB: Phase 3 replaces this with a real Claude API call
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
        technology: 'TypeScript class extending existing PaymentService',
      },
      {
        name: 'PayFastAdapter',
        responsibility: 'Translate internal payment models to PayFast API contracts',
        technology: 'TypeScript with Zod schema validation',
      },
      {
        name: 'WebhookHandler',
        responsibility: 'Receive and process PayFast payment confirmation webhooks',
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
    ],
    estimatedComplexity: 'medium',
  };

  logger.output('ARCHITECT_A', 'ArchitecturalProposal', proposal);
  return proposal;
}