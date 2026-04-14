# SpecForge — Claude Code Context

## What this project is
SpecForge is a multi-agent CLI tool that converts a natural language feature request into a
validated Architecture Decision Record (ADR). It uses Claude as the backbone for every agent.

## Agent roster
| Agent | File | Role |
|---|---|---|
| Orchestrator | `src/agents/orchestrator.ts` | Analyzes requests, routes between agents, owns the debate loop |
| Researcher | `src/agents/researcher.ts` | Gathers prior art and scans codebase context |
| Architect A | `src/agents/architectA.ts` | Proposes the technical solution |
| Architect B | `src/agents/architectB.ts` | Adversarially scores and critiques Architect A's proposal |
| Validator | `src/agents/validator.ts` | Checks the proposal's assumptions against the real codebase |
| Scribe | `src/agents/scribe.ts` | Formats the approved proposal as a structured ADR |

## Orchestration pattern
- Orchestrator → spawns Researcher + Architect A in parallel (Promise.all)
- Outputs merge into Architect B
- Architect B critique → Orchestrator loop → back to Architect A if score < threshold
- Validated proposal → human checkpoint → Scribe → ADR file in /output

## Key types
All shared data contracts live in `src/types/index.ts`. Never pass raw strings between agents —
always use typed objects so the data contract is explicit and refactorable.

## Build phases
- Phase 1 (current): Scaffold + real Orchestrator API call + stub agents + debate loop skeleton
- Phase 2: Researcher with web search + filesystem tools
- Phase 3: Architect A with real proposal generation
- Phase 4: Architect B with real adversarial critique and scoring
- Phase 5: Validator with real codebase scanning
- Phase 6: Scribe + HITL checkpoint + ADR file output
- Phase 7: MCP integrations (GitHub, Jira)

## Running
```bash
npm run spec "Add PayFast split payment support to the checkout flow"
```

## Environment
Requires `ANTHROPIC_API_KEY` in `.env`