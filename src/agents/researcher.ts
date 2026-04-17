// ─────────────────────────────────────────────
// src/agents/researcher.ts — PHASE 2
//
// Three steps in sequence:
//
// 1. CODEBASE SCAN — reads real files from CODEBASE_PATH
// 2. WEB RESEARCH — real searches via Anthropic native tool
// 3. SYNTHESIS — Claude writes a summary for Architect A
// ─────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import {
  OrchestrationPlan,
  ResearchContext,
  SourcedFinding,
  CodebaseFile,
} from '../types/index.js';
import { logger } from '../utils/logger.js';
import { parseJson } from '../utils/parseJson.js';

const READABLE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx',
  '.json', '.md', '.yaml', '.yml',
  '.prisma', '.sql',
]);

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build',
  '.next', 'coverage', '.turbo', 'out',
]);

const MAX_FILES_FULL_CONTENT = 20;
const MAX_FILE_CHARS = 3000;

// ─── Native Anthropic Web Search ─────────────
// Anthropic's built-in search — no external API key.
// Claude performs real web searches internally.
// 'as const' is required so TypeScript treats these
// as literal types, not generic strings.
const webSearchTool = {
  type: 'web_search_20250305' as const,
  name: 'web_search' as const,
};

// ─── Codebase Scanner ─────────────────────────
// Walks CODEBASE_PATH and returns readable files.
// Runs entirely locally — no API calls.
function scanCodebase(codebasePath: string): CodebaseFile[] {
  const files: CodebaseFile[] = [];
  let fullContentCount = 0;

  function walk(dir: string) {
    if (fullContentCount >= MAX_FILES_FULL_CONTENT) return;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (fullContentCount >= MAX_FILES_FULL_CONTENT) break;

      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(codebasePath, fullPath);

      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!READABLE_EXTENSIONS.has(ext)) continue;

        try {
          const rawContent = fs.readFileSync(fullPath, 'utf-8');
          const content = rawContent.length > MAX_FILE_CHARS
            ? rawContent.slice(0, MAX_FILE_CHARS) + '\n... [truncated]'
            : rawContent;

          files.push({
            path: fullPath,
            relativePath,
            content,
            language: ext.replace('.', '') || 'text',
            relevanceReason: '',
          });

          fullContentCount++;
        } catch {
          // skip unreadable files
        }
      }
    }
  }

  walk(codebasePath);
  return files;
}

// ─── Real Web Research ────────────────────────
// One Claude call with the native web_search tool.
// Anthropic handles the search loop internally —
// Claude decides what to search, reads live results,
// and keeps searching until it has enough information.
// We make one API call and get back real findings.
// No manual loop, no fake data, no external API key.
async function runWebResearch(
  client: Anthropic,
  plan: OrchestrationPlan,
  scannedFiles: CodebaseFile[]
): Promise<SourcedFinding[]> {
  logger.agent('RESEARCHER', 'Starting real web research...');

  const fileSummary = scannedFiles.length > 0
    ? `Codebase files found:\n${scannedFiles.map(f => `- ${f.relativePath}`).join('\n')}`
    : 'No codebase files found (CODEBASE_PATH may not be set)';

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 8192,
    system: `You are SpecForge's Researcher agent. Use web_search to find accurate, 
sourced information to help an architect design a technical solution.
Search for every research question provided. Use official documentation where possible.`,
    tools: [webSearchTool],
    messages: [
      {
        role: 'user',
        content: `Research these questions for: "${plan.featureSummary}"

${plan.questionsForResearch.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

${fileSummary}

After searching, you MUST respond with ONLY a raw JSON array. No prose. No explanation.
Start your response with [ and end with ].
Each element must be exactly:
{
  "claim": "specific factual statement",
  "source": "URL where you found this",
  "sourceType": "web",
  "excerpt": "direct quote or paraphrase from the source",
  "retrievedAt": "${new Date().toISOString()}",
  "confidence": "high"
}`,
      },
    ],
  });

  logger.agent('RESEARCHER', `Web research done — stop_reason: "${response.stop_reason}"`);

  const textBlock = response.content.find(
    (b: Anthropic.ContentBlock) => b.type === 'text'
  );

  if (!textBlock || textBlock.type !== 'text') {
    logger.error('RESEARCHER', 'No text block in response');
    return [];
  }

  // First attempt — parse directly
  try {
    const findings = parseJson<SourcedFinding[]>(textBlock.text);
    logger.agent('RESEARCHER', `Found ${findings.length} sourced findings`);
    return findings;
  } catch {
    // Second attempt — Claude returned prose instead of JSON.
    // Ask it to reformat what it already found.
    logger.agent('RESEARCHER', 'Parse failed — asking Claude to reformat as JSON...');

    const reformatResponse = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: `You extract research findings and output them as a JSON array.
Respond with ONLY a raw JSON array. Start with [. End with ]. No prose. No markdown.`,
      messages: [
        {
          role: 'user',
          content: `Convert this research into a JSON array of findings:

${textBlock.text}

Each finding must be:
{
  "claim": "specific factual statement",
  "source": "URL or source name",
  "sourceType": "web",
  "excerpt": "relevant quote or paraphrase",
  "retrievedAt": "${new Date().toISOString()}",
  "confidence": "high" | "medium" | "low"
}

Output ONLY the JSON array starting with [`,
        },
      ],
    });

    const reformatBlock = reformatResponse.content.find(
      (b: Anthropic.ContentBlock) => b.type === 'text'
    );

    if (!reformatBlock || reformatBlock.type !== 'text') {
      logger.error('RESEARCHER', 'Reformat also failed — returning empty findings');
      return [];
    }

    try {
      const findings = parseJson<SourcedFinding[]>(reformatBlock.text);
      logger.agent('RESEARCHER', `Reformat succeeded — ${findings.length} findings extracted`);
      return findings;
    } catch {
      logger.error('RESEARCHER', 'Both parse attempts failed — returning empty findings');
      return [];
    }
  }
}

// ─── Synthesis ────────────────────────────────
// Claude reads all findings and file content and
// writes a coherent summary for Architect A.
// Also identifies which codebase files are relevant.
async function synthesiseFindings(
  client: Anthropic,
  plan: OrchestrationPlan,
  webFindings: SourcedFinding[],
  codebaseFiles: CodebaseFile[]
): Promise<{ summary: string; relevantFiles: CodebaseFile[] }> {
  logger.agent('RESEARCHER', 'Synthesising findings into summary...');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2048,
    system: `You are SpecForge's Researcher. Synthesise research findings into a
briefing for an architect. Respond with ONLY valid JSON. No markdown. No code fences. Start with {.

Required structure:
{
  "summary": "prose summary of findings for the architect",
  "relevantFilePaths": ["array of relative file paths relevant to this feature"]
}`,
    messages: [
      {
        role: 'user',
        content: `Feature: "${plan.featureSummary}"

Web research findings:
${JSON.stringify(webFindings, null, 2)}

Codebase files available:
${codebaseFiles.map(f => `${f.relativePath} (${f.language})`).join('\n') || 'None'}

Write a synthesis summary for the architect and identify relevant files.`,
      },
    ],
  });

  const textBlock = response.content.find((b: Anthropic.ContentBlock) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    return { summary: 'Synthesis failed — no text response', relevantFiles: [] };
  }

  const parsed = parseJson<{ summary: string; relevantFilePaths: string[] }>(textBlock.text);

  const relevantFiles = codebaseFiles
    .filter(f => parsed.relevantFilePaths.includes(f.relativePath))
    .map(f => ({ ...f, relevanceReason: 'Identified as relevant by Researcher synthesis' }));

  return { summary: parsed.summary, relevantFiles };
}

// ─── Main Export ──────────────────────────────
export async function runResearcher(plan: OrchestrationPlan): Promise<ResearchContext> {
  const client = new Anthropic();

  logger.divider('RESEARCHER');
  logger.agent('RESEARCHER', 'Phase 2 Researcher — real web search + codebase scan');
  logger.input('RESEARCHER', 'Questions to answer', plan.questionsForResearch);

  // Step 1: Codebase scan (local, no API call)
  const codebasePath = process.env.CODEBASE_PATH;
  let scannedFiles: CodebaseFile[] = [];

  if (!codebasePath) {
    logger.agent('RESEARCHER', 'CODEBASE_PATH not set — skipping codebase scan');
  } else if (!fs.existsSync(codebasePath)) {
    logger.agent('RESEARCHER', `CODEBASE_PATH "${codebasePath}" does not exist — skipping`);
  } else {
    logger.agent('RESEARCHER', `Scanning codebase at: ${codebasePath}`);
    scannedFiles = scanCodebase(codebasePath);
    logger.agent('RESEARCHER', `Codebase scan complete — ${scannedFiles.length} files found`);
  }

  // Step 2: Real web research (native Anthropic search)
  const webFindings = await runWebResearch(client, plan, scannedFiles);

  // Step 3: Synthesis — Claude writes the summary
  const { summary, relevantFiles } = await synthesiseFindings(
    client, plan, webFindings, scannedFiles
  );

  // Step 4: Build existingPatterns from relevant codebase files
  const existingPatterns: SourcedFinding[] = relevantFiles.map(f => ({
    claim: `File ${f.relativePath} exists and is written in ${f.language}`,
    source: f.path,
    sourceType: 'file' as const,
    excerpt: f.content.slice(0, 200),
    retrievedAt: new Date().toISOString(),
    confidence: 'high' as const,
  }));

  const context: ResearchContext = {
    priorArt: webFindings,
    relevantFiles,
    existingPatterns,
    summary,
  };

  logger.output('RESEARCHER', 'ResearchContext (summary)', {
    priorArtCount: context.priorArt.length,
    relevantFilesCount: context.relevantFiles.length,
    existingPatternsCount: context.existingPatterns.length,
    summaryPreview: context.summary.slice(0, 150) + '...',
  });

  return context;
}