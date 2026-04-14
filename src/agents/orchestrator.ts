import Anthropic from '@anthropic-ai/sdk';
import { FeatureRequest, OrchestrationPlan } from '../types/index.ts';
import { logger } from '../utils/logger.ts';
import { parseJson } from '../utils/parseJson.js';


const SYSTEM_PROMPT = `You are SpecForge's Orchestrator — a senior technical lead responsible for analyzing feature requests and producing structured briefing documents for a team of specialized AI agents.

Your job is to deeply analyze a feature request and decompose it into:
- A clear problem statement
- What is and isn't in scope
- Technical and business constraints
- Specific research questions for a Researcher agent
- Architectural concerns for a Proposer agent

Respond with ONLY raw valid JSON. No markdown. No code fences. No backticks. No explanation. Start your response with { and end it with }.

Required JSON structure:
{
  "featureSummary": "single sentence describing what is being built",
  "problemStatement": "the underlying problem this feature solves for the user",
  "scope": ["array of what IS in scope"],
  "constraints": ["technical or business constraints to respect"],
  "questionsForResearch": ["specific questions the Researcher agent should answer"],
  "architecturalConcerns": ["specific architectural issues Architect A must address"]
}`;

export async function runOrchestrator(request: FeatureRequest): Promise<OrchestrationPlan> {
  const client = new Anthropic(); 
  logger.divider('ORCHESTRATOR');
  logger.agent('ORCHESTRATOR', 'Received feature request — analyzing...');
  logger.input('ORCHESTRATOR', 'FeatureRequest', request);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Analyze this feature request and produce the structured briefing:\n\n"${request.raw}"`,
      },
    ],
  });

  const rawText =
    response.content[0].type === 'text' ? response.content[0].text : '';

  logger.agent(
    'ORCHESTRATOR',
    `API responded — stop_reason: "${response.stop_reason}", tokens used: ${response.usage.input_tokens} in / ${response.usage.output_tokens} out`
  );

  const plan: OrchestrationPlan = parseJson<OrchestrationPlan>(rawText);

  logger.output('ORCHESTRATOR', 'OrchestrationPlan', plan);
  logger.success('Plan produced — routing to Researcher and Architect A');

  return plan;
}