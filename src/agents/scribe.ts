import { ArchitecturalProposal, Critique, ValidationReport, ADR } from '../types/index.js';
import { logger } from '../utils/logger.js';

export async function runScribe(
  proposal: ArchitecturalProposal,
  critique: Critique,
  validation: ValidationReport,
  debateRounds: number
): Promise<ADR> {
  logger.divider('SCRIBE');
  logger.agent('SCRIBE', `Generating ADR — debate took ${debateRounds} round(s)...`);

  // STUB: Phase 6 replaces with a real Claude call + file write to /output
  const adr: ADR = {
    title: proposal.title,
    date: new Date().toISOString().split('T')[0],
    status: 'proposed',
    context: proposal.approach,
    decision:
      `Adopt the proposed ${proposal.estimatedComplexity}-complexity architecture ` +
      `using ${proposal.components.map((c) => c.name).join(', ')}.`,
    consequences: [
      ...proposal.tradeoffs.map((t) => `+ ${t.benefit}`),
      ...proposal.tradeoffs.map((t) => `- ${t.cost}`),
      ...validation.warnings,
    ],
    alternativesConsidered: [
      '[STUB] Phase 4 will populate real alternatives from debate rounds.',
      `Architect B feedback: "${critique.overallFeedback}"`,
    ],
    debateRounds,
    conflicts: critique.conflicts,
  };

  logger.output('SCRIBE', 'ADR', adr);
  logger.success(`ADR ready: "${adr.title}"`);

  return adr;
}