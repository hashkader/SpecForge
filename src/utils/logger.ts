import chalk from 'chalk';

export type AgentName =
  | 'ORCHESTRATOR'
  | 'RESEARCHER'
  | 'ARCHITECT_A'
  | 'ARCHITECT_B'
  | 'VALIDATOR'
  | 'SCRIBE'
  | 'CLI'
  | 'LOOP';

const colors: Record<AgentName, (t: string) => string> = {
  ORCHESTRATOR: chalk.magenta,
  RESEARCHER:   chalk.cyan,
  ARCHITECT_A:  chalk.green,
  ARCHITECT_B:  chalk.red,
  VALIDATOR:    chalk.yellow,
  SCRIBE:       chalk.blue,
  CLI:          chalk.white,
  LOOP:         chalk.hex('#FFA500'),
};

export const logger = {
  agent(agent: AgentName, message: string) {
    console.log(colors[agent](`[${agent}] ${message}`));
  },

  input(agent: AgentName, label: string, data: unknown) {
    console.log(colors[agent](`[${agent}] → IN  (${label}):`));
    console.log(chalk.gray(JSON.stringify(data, null, 2)));
  },

  output(agent: AgentName, label: string, data: unknown) {
    console.log(colors[agent](`[${agent}] ← OUT (${label}):`));
    console.log(chalk.gray(JSON.stringify(data, null, 2)));
  },

  loop(round: number, max: number, message: string) {
    console.log(colors['LOOP'](`[LOOP] Round ${round}/${max} — ${message}`));
  },

  divider(label: string) {
    const line = '─'.repeat(24);
    console.log(chalk.gray(`\n${line} ${label} ${line}\n`));
  },

  success(message: string) {
    console.log(chalk.green(`✓ ${message}`));
  },

  error(message: string, detail?: unknown) {
    console.log(chalk.red(`✗ ${message}`));
    if (detail) console.error(chalk.red(JSON.stringify(detail, null, 2)));
  },
};