/**
 * ddotz-hud Renderer
 */

import { homedir } from 'node:os';
import type { HudContext } from './types.js';
import {
  RESET, DIM, BOLD, CYAN, MAGENTA, BLUE,
  getContextColor, getLimitColor, getCostColor
} from './colors.js';

function shortenPath(path: string, maxLen = 30): string {
  if (!path || path.length <= maxLen) return path;

  const home = homedir();
  if (path.startsWith(home)) {
    path = '~' + path.slice(home.length);
  }

  if (path.length <= maxLen) return path;

  const parts = path.split('/');
  let result = parts[parts.length - 1];
  for (let i = parts.length - 2; i >= 0; i--) {
    const test = parts[i] + '/' + result;
    if (test.length > maxLen - 3) break;
    result = test;
  }

  return '.../' + result;
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}hr ${minutes}m`;
  }
  return `${minutes}m`;
}

export function render(ctx: HudContext): string {
  const modelName = ctx.stdin.model?.display_name || ctx.stdin.model?.id || 'Unknown';
  const cwd = ctx.stdin.cwd || process.cwd();

  // Line 1: Model | Git | CWD
  const line1Parts: string[] = [];
  line1Parts.push(`${BOLD}${modelName}${RESET}`);

  if (ctx.git) {
    const gitStr = `${CYAN}\u2387 ${ctx.git.branch}${ctx.git.status ? ' ' + ctx.git.status : ''}${RESET}`;
    line1Parts.push(gitStr);
  } else {
    line1Parts.push(`${DIM}\u2387 no git${RESET}`);
  }

  line1Parts.push(`${DIM}${shortenPath(cwd)}${RESET}`);

  // Line 2: profile | 5h:XX% wk:XX% | ctx% | $cost | duration | agents:N | bg:N/5
  const line2Parts: string[] = [];

  // Profile: 글쓰기 스타일 (output-style) 표시
  let outputStyle = 'default';
  if (ctx.stdin.output_style) {
    if (typeof ctx.stdin.output_style === 'string') {
      outputStyle = ctx.stdin.output_style;
    } else if (typeof ctx.stdin.output_style === 'object') {
      // output_style이 객체인 경우 (name, id 등의 필드 처리)
      const styleObj = ctx.stdin.output_style as any;
      outputStyle = styleObj.name || styleObj.id || styleObj.display_name || 'default';
    }
  }
  line2Parts.push(`${CYAN}${outputStyle}${RESET}`);

  // Rate Limits (always show both 5h and wk)
  if (ctx.rateLimits) {
    const fiveColor = getLimitColor(ctx.rateLimits.fiveHour);
    const weekColor = getLimitColor(ctx.rateLimits.weekly);
    line2Parts.push(`5h:${fiveColor}${ctx.rateLimits.fiveHour}%${RESET} wk:${weekColor}${ctx.rateLimits.weekly}%${RESET}`);
  } else {
    line2Parts.push(`5h:${DIM}--%${RESET} wk:${DIM}--%${RESET}`);
  }

  // Context
  const contextColor = getContextColor(ctx.contextPercent);
  line2Parts.push(`${contextColor}${ctx.contextPercent.toFixed(1)}%${RESET}`);

  // Cost
  if (ctx.cost > 0) {
    const costColor = getCostColor(ctx.cost);
    line2Parts.push(`${costColor}$${ctx.cost.toFixed(2)}${RESET}`);
  } else {
    line2Parts.push(`${DIM}$0.00${RESET}`);
  }

  // Duration
  line2Parts.push(ctx.duration);

  // Agents (only if > 0)
  const agentCount = ctx.transcript.agents.length;
  if (agentCount > 0) {
    line2Parts.push(`${MAGENTA}agents:${agentCount}${RESET}`);
  }

  // Background tasks (only if > 0)
  if (ctx.transcript.backgroundTasks > 0) {
    line2Parts.push(`${BLUE}bg:${ctx.transcript.backgroundTasks}/5${RESET}`);
  }

  // Compose output
  const sep = ` ${DIM}|${RESET} `;
  const line1 = line1Parts.join(sep);
  const line2 = `  ${line2Parts.join(sep)}`;

  // Replace spaces with non-breaking for terminal alignment
  return [
    line1.replace(/ /g, '\u00A0'),
    line2.replace(/ /g, '\u00A0')
  ].join('\n');
}
