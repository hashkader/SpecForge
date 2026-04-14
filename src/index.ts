import { Command } from 'commander';
import * as dotenv from 'dotenv';
import { runOrchestrator } from './agents/orchestrator.js';
import { runResearcher } from './agents/researcher.js';
import { runArchitectA } from './agents/architectA.js';
import { runArchitectB } from './agents/architectB.js';
import { runValidator } from './agents/validator.js';
import { runScribe } from './agents/scribe.js';
import { FeatureRequest } from './types/index.js';
import { logger } from './utils/logger.js';

dotenv.config();

const program = new Command();

program
  .name('specforge')
  .description('Multi-agent architectural specification generator')
  .version('0.1.0');

program
  .command('spec <feature>')
  .description('Generate an ADR from a natural language feature request')
  .option('-m, --max-rounds <number>', 'Maximum debate rounds before forcing exit', '3')
  .action(async (feature: string, options: { maxRounds: string }) => {

    const maxRounds = parseInt(options.maxRounds, 10);

    logger.divider('SPECFORGE — PIPELINE START');
    logger.agent('CLI', `Input: "${feature}"`);
    logger.agent('CLI', `Max debate rounds: ${maxRounds}`);

    // Step 1 — wrap raw string in a typed object immediately
    const request: FeatureRequest = {
      raw: feature,
      timestamp: new Date().toISOString(),
    };

    // Step 2 — Orchestrator analyzes the request (only real API call in Phase 1)
    // IN:  FeatureRequest
    // OUT: OrchestrationPlan
    const plan = await runOrchestrator(request);

    // Step 3 — Researcher + Architect A (sequential now, parallel in Phase 2)
    // IN:  OrchestrationPlan
    // OUT: ResearchContext
    const research = await runResearcher(plan);

    // IN:  OrchestrationPlan + ResearchContext
    // OUT: ArchitecturalProposal
    let proposal = await runArchitectA(plan, research);

    // Step 4 — Debate loop
    // IN:  ArchitecturalProposal
    // OUT: Critique { score, passed, overallFeedback }
    // If passed === false → send overallFeedback back to Architect A → revised proposal → repeat
    let debateRounds = 0;
    let critique = await runArchitectB(proposal);

    while (!critique.passed && debateRounds < maxRounds) {
      debateRounds++;
      logger.loop(debateRounds, maxRounds, `Score ${critique.score}/10 — sending critique back to Architect A`);

      proposal = await runArchitectA(plan, research, critique.overallFeedback);
      critique = await runArchitectB(proposal);
    }

    if (critique.passed) {
      logger.success(`Debate converged — final score: ${critique.score}/10 (rounds: ${debateRounds + 1})`);
    } else {
      logger.agent('CLI', `Max rounds reached — proceeding with best proposal (score: ${critique.score}/10)`);
    }

    // Step 5 — Validator
    // IN:  ArchitecturalProposal
    // OUT: ValidationReport { passed, blockers, warnings }
    const validation = await runValidator(proposal);

    if (!validation.passed) {
      logger.error('Pipeline halted — validation found blockers:', validation.blockers);
      process.exit(1);
    }

    // Step 6 — Scribe
    // IN:  proposal + critique + validation + debateRounds
    // OUT: ADR document
    const adr = await runScribe(proposal, critique, validation, debateRounds + 1);

    logger.divider('SPECFORGE — PIPELINE COMPLETE');
    logger.success(`ADR: "${adr.title}"`);
    console.log(JSON.stringify(adr, null, 2));
  });

program.parse();