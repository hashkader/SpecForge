import Anthropic from '@anthropic-ai/sdk';
import {
  OrchestrationPlan,
  ResearchContext,
  ArchitecturalProposal,
} from '../types/index.js';
import { logger } from '../utils/logger.js';
import { parseJson } from '../utils/parseJson.js';

const SYSTEM_PROMPT = `You are SpecForge's Architect A — a senior software engineer responsible 
for proposing technical solutions based on research findings and codebase context.

Your proposals must be:
- Grounded in the actual research findings provided (not assumptions)
- Aligned with existing patterns found in the codebase
- Specific enough to be implementable
- Honest about limitations discovered in research

CRITICAL: If research findings reveal that a requested approach is not possible
(e.g. a third-party API doesn't support the requested feature), you MUST propose
an alternative approach that achieves the same goal differently. Do not propose
something the research shows is impossible.

Respond with ONLY raw valid JSON. No markdown. No explanation. Start with { and end with }.

Required JSON structure:
{
  "title": "Architecture proposal: <feature summary>",
  "approach": "2-3 sentence description of the overall technical approach",
  "components": [
    {
      "name": "ComponentName",
      "responsibility": "what this component does",
      "technology": "specific technology/pattern used"
    }
  ],
  "tradeoffs": [
    {
      "benefit": "a specific advantage of this approach",
      "cost": "a specific disadvantage or risk"
    }
  ],
  "assumptions": [
    "specific assumption about the codebase or infrastructure that must be true"
  ],
  "estimatedComplexity": "low" | "medium" | "high"
}`;

function buildPrompt(
  plan: OrchestrationPlan,
  research: ResearchContext,
  previousCritique?: string
): string {
  const isRevision = !!previousCritique;

  const findingsSection = research.priorArt.length > 0
    ? `WEB RESEARCH FINDINGS (treat these as facts):
${research.priorArt.map((f, i) =>
  `${i + 1}. [${f.confidence.toUpperCase()} confidence] ${f.claim}
   Source: ${f.source}`
).join('\n')}`
    : 'WEB RESEARCH: No findings available';

  const filesSection = research.relevantFiles.length > 0
    ? `RELEVANT CODEBASE FILES:
${research.relevantFiles.map(f =>
  `--- ${f.relativePath} (${f.language}) ---
${f.content.slice(0, 500)}${f.content.length > 500 ? '\n... [truncated]' : ''}`
).join('\n\n')}`
    : 'CODEBASE FILES: None found (CODEBASE_PATH may not be set)';

  const patternsSection = research.existingPatterns.length > 0
    ? `EXISTING CODEBASE PATTERNS:
${research.existingPatterns.map(p => `- ${p.claim}`).join('\n')}`
    : '';

  const summarySection = `RESEARCHER SUMMARY:
${research.summary}`;

  const concernsSection = `ARCHITECTURAL CONCERNS TO ADDRESS:
${plan.architecturalConcerns.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;

  const constraintsSection = `CONSTRAINTS:
${plan.constraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;

  const revisionSection = isRevision
    ? `\nPREVIOUS PROPOSAL WAS REJECTED. CRITIQUE TO ADDRESS:
${previousCritique}

Your revised proposal MUST specifically address each point in the critique above.`
    : '';

  return `${isRevision ? 'REVISION REQUEST' : 'INITIAL PROPOSAL REQUEST'}
Feature: "${plan.featureSummary}"
Problem: "${plan.problemStatement}"

${findingsSection}

${summarySection}

${filesSection}

${patternsSection}

${concernsSection}

${constraintsSection}
${revisionSection}

Produce a technical architecture proposal as a JSON object.
Start with { and end with }. No markdown. No explanation.`;
}

export async function runArchitectA(
  plan: OrchestrationPlan,
  research: ResearchContext,
  previousCritique?: string
): Promise<ArchitecturalProposal> {
  const client = new Anthropic();

  logger.divider('ARCHITECT A');

  const isRevision = !!previousCritique;
  logger.agent(
    'ARCHITECT_A',
    isRevision
      ? 'Revising proposal based on Architect B critique...'
      : 'Generating initial proposal from research context...'
  );

  logger.input('ARCHITECT_A', 'Context summary', {
    featureSummary: plan.featureSummary,
    priorArtFindings: research.priorArt.length,
    relevantFiles: research.relevantFiles.map(f => f.relativePath),
    existingPatterns: research.existingPatterns.length,
    isRevision,
    researchSummaryPreview: research.summary.slice(0, 200) + '...',
  });

  if (previousCritique) {
    logger.input('ARCHITECT_A', 'Critique to address', previousCritique);
  }

  const userMessage = buildPrompt(plan, research, previousCritique);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: userMessage },
    ],
  });

  logger.agent(
    'ARCHITECT_A',
    `API responded — stop_reason: "${response.stop_reason}", ` +
    `tokens: ${response.usage.input_tokens} in / ${response.usage.output_tokens} out`
  );

  const rawText = response.content[0].type === 'text'
    ? response.content[0].text
    : '';

  const proposal = parseJson<ArchitecturalProposal>(rawText);

  logger.output('ARCHITECT_A', 'ArchitecturalProposal', proposal);
  return proposal;
}