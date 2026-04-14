import { ArchitecturalProposal, Critique } from '../types/index.ts';
import { logger } from '../utils/logger.ts';

const PASS_THRESHOLD = 7;

export async function runArchitectB(proposal: ArchitecturalProposal): Promise<Critique> {
  logger.divider('ARCHITECT B');
  logger.agent('ARCHITECT_B', 'Received proposal — scoring and critiquing...');
  logger.input('ARCHITECT_B', 'ArchitecturalProposal', proposal);

  // STUB: Phase 4 replaces this with a real adversarial Claude API call
  const critique: Critique = {
    score: 8,
    dimensions: [
      {
        name: 'Scalability',
        score: 8,
        feedback: 'Service-level adapter scales horizontally without shared state.',
      },
      {
        name: 'Coupling',
        score: 7,
        feedback:
          'SplitPaymentService extending PaymentService introduces inheritance coupling. ' +
          'Consider composition over inheritance.',
      },
      {
        name: 'Stack alignment',
        score: 9,
        feedback: 'Correctly uses existing Zod validation and webhook patterns.',
      },
    ],
    overallFeedback:
      'Solid proposal. The adapter pattern is correct. ' +
      'Consider refactoring to use composition rather than inheritance for the ' +
      'SplitPaymentService to reduce coupling risk.',
    passed: true,
  };

  logger.agent(
    'ARCHITECT_B',
    `Score: ${critique.score}/10 — threshold is ${PASS_THRESHOLD} — ${critique.passed ? 'PASSED ✓' : 'FAILED ✗'}`
  );
  logger.output('ARCHITECT_B', 'Critique', critique);

  return critique;
}