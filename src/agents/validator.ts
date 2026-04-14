import { ArchitecturalProposal, ValidationReport } from '../types/index.ts';
import { logger } from '../utils/logger.ts';

export async function runValidator(proposal: ArchitecturalProposal): Promise<ValidationReport> {
  logger.divider('VALIDATOR');
  logger.agent('VALIDATOR', 'Checking proposal assumptions against codebase...');
  logger.input('VALIDATOR', 'Assumptions to verify', proposal.assumptions);

  // STUB: Phase 5 replaces this with real filesystem reads + Claude validation
  const report: ValidationReport = {
    passed: true,
    assumptionsChecked: proposal.assumptions.map((assumption) => ({
      assumption,
      valid: true,
      evidence: '[STUB] Phase 5 will verify against real codebase files.',
    })),
    blockers: [],
    warnings: ['[STUB] Real codebase validation will run in Phase 5.'],
  };

  logger.agent(
    'VALIDATOR',
    `Validation complete — ${report.blockers.length} blocker(s) — ${report.passed ? 'PASSED ✓' : 'FAILED ✗'}`
  );
  logger.output('VALIDATOR', 'ValidationReport', report);

  return report;
}