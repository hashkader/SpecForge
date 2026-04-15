import { ArchitecturalProposal, Critique } from '../types/index.js';
import { logger } from '../utils/logger.js';

const PASS_THRESHOLD = 7;

export async function runArchitectB(proposal: ArchitecturalProposal): Promise<Critique> {
  logger.divider('ARCHITECT B');
  logger.agent('ARCHITECT_B', 'Received proposal — scoring and critiquing...');
  logger.input('ARCHITECT_B', 'ArchitecturalProposal', proposal);

  // STUB: Phase 4 replaces with a real adversarial Claude API call
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
        feedback: 'SplitPaymentService using composition reduces coupling correctly.',
      },
      {
        name: 'Stack alignment',
        score: 9,
        feedback: 'Correctly uses existing Zod validation and webhook patterns.',
      },
    ],
    conflicts: [
      {
        claim: 'Maximum 5 split recipients per transaction',
        contradictedBy: 'Correct per PayFast documentation — no actual conflict',
        source: 'https://developers.payfast.co.za/api#split_payments',
        severity: 'low',
        resolution: 'accepted-risk',
      },
    ],
    overallFeedback:
      'Solid proposal. Composition pattern correctly applied. ' +
      'Ensure ITN webhook handler accounts for per-recipient notifications.',
    passed: true,
  };

  logger.agent(
    'ARCHITECT_B',
    `Score: ${critique.score}/10 — threshold is ${PASS_THRESHOLD} — ${critique.passed ? 'PASSED ✓' : 'FAILED ✗'}`
  );
  logger.agent('ARCHITECT_B', `Conflicts detected: ${critique.conflicts.length}`);
  logger.output('ARCHITECT_B', 'Critique', critique);

  return critique;
}