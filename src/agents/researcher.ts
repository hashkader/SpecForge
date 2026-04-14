import { OrchestrationPlan, ResearchContext } from '../types/index.ts';
import { logger } from '../utils/logger.ts';

export async function runResearcher(plan: OrchestrationPlan): Promise<ResearchContext> {
  logger.divider('RESEARCHER');
  logger.agent('RESEARCHER', 'Received plan — beginning research...');
  logger.input('RESEARCHER', 'Questions to answer', plan.questionsForResearch);

  // STUB: Phase 2 replaces this with real web search + filesystem tools
  const context: ResearchContext = {
    priorArt: [
      'PayFast Payments API v2 documentation',
      'South African PCI-DSS compliance requirements',
      'Split payment patterns (Stripe Connect as reference)',
    ],
    relevantFiles: [
      'src/services/payment.ts',
      'src/types/checkout.ts',
      'src/middleware/auth.ts',
    ],
    existingPatterns: [
      'Repository pattern already used in src/services/',
      'Zod schemas used for all API input validation',
      'Existing webhook handler pattern in src/webhooks/',
    ],
    summary:
      `[STUB] Research for "${plan.featureSummary}". ` +
      `Phase 2 will perform real web searches and codebase scans.`,
  };

  logger.output('RESEARCHER', 'ResearchContext', context);
  return context;
}