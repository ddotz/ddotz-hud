#!/usr/bin/env node
/**
 * ddotz-hud - Enhanced Statusline for Claude Code
 *
 * Layout:
 * Line 1: Model | Git | CWD
 * Line 2: profile | 5h:XX% wk:XX% | ctx% | $cost | duration | agents:N | bg:N/5
 */

import { readStdin, getContextPercent } from './stdin.js';
import { getRateLimits } from './rate-limits.js';
import { getGitInfo } from './git.js';
import { parseTranscript } from './transcript.js';
import { estimateCost } from './cost.js';
import { render } from './render.js';
import { DIM, RESET } from './colors.js';
import type { HudContext } from './types.js';

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}hr ${minutes}m`;
  }
  return `${minutes}m`;
}

async function main(): Promise<void> {
  try {
    const stdin = await readStdin();

    if (!stdin) {
      console.log(`${DIM}[ddotz-hud] No stdin${RESET}`);
      return;
    }

    // Debug: stdin 구조 확인
    // console.error('[DEBUG] stdin keys:', Object.keys(stdin));
    // console.error('[DEBUG] output_style:', typeof stdin.output_style, JSON.stringify(stdin.output_style));

    const cwd = stdin.cwd || process.cwd();

    // Gather all data
    const [rateLimits, transcript] = await Promise.all([
      getRateLimits(),
      Promise.resolve(parseTranscript(stdin.transcript_path)),
    ]);

    const git = getGitInfo(cwd);
    const contextPercent = getContextPercent(stdin);
    const cost = estimateCost(stdin);

    const sessionStart = transcript.sessionStart || new Date();
    const durationMs = Date.now() - sessionStart.getTime();
    const duration = formatDuration(durationMs);

    // Build context
    const ctx: HudContext = {
      stdin,
      rateLimits,
      git,
      transcript,
      contextPercent,
      cost,
      duration,
    };

    // Render and output
    console.log(render(ctx));

  } catch (error) {
    console.log(`${DIM}[ddotz-hud] Error${RESET}`);
  }
}

main();
