import { ArchitecturalProposal, ValidationReport, SourcedFinding } from '../types/index.js';
import { logger } from '../utils/logger.js';

export async function runValidator(proposal: ArchitecturalProposal): Promise<ValidationReport> {
  logger.divider('VALIDATOR');
  logger.agent('VALIDATOR', 'Checking proposal assumptions against codebase...');
  logger.input('VALIDATOR', 'Assumptions to verify', proposal.assumptions);

  // STUB: Phase 5 replaces with real filesystem reads + Claude verification
  const report: ValidationReport = {
    passed: true,
    assumptionsChecked: proposal.assumptions.map((assumption) => {
      const evidence: SourcedFinding = {
        claim: assumption,
        source: '[STUB] Phase 5 will provide real file paths',
        sourceType: 'file',
        excerpt: '[STUB] Phase 5 will include the actual file excerpt',
        retrievedAt: new Date().toISOString(),
        confidence: 'low',
      };

      return {
        assumption,
        valid: true,
        evidence,
        notes: '[STUB] Phase 5 will verify against real codebase files.',
      };
    }),
    blockers: [],
    warnings: ['Validation is stubbed — real codebase checks run in Phase 5.'],
  };

  logger.agent(
    'VALIDATOR',
    `Validation complete — ${report.blockers.length} blocker(s) — ${report.passed ? 'PASSED ✓' : 'FAILED ✗'}`
  );
  logger.output('VALIDATOR', 'ValidationReport', report);

  return report;
}