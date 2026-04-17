#!/usr/bin/env node
/**
 * ddotz-hud - Enhanced Statusline for Claude Code
 *
 * Layout:
 * Line 1: Model | Git | CWD
 * Line 2: profile | 5h:XX% wk:XX% | ctx% | $cost | Reset Xh XXm left | agents:N | bg:N/5
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { readStdin, getContextPercent } from './stdin.js';
import { getRateLimits } from './rate-limits.js';
import { getGitInfo } from './git.js';
import { parseTranscript } from './transcript.js';
import { estimateCost } from './cost.js';
import { render } from './render.js';
import { DIM, RESET } from './colors.js';
import type { HudContext, EffortInfo } from './types.js';

function formatResetTimeLeft(resetsAtIso: string | null): string {
  if (!resetsAtIso) {
    return 'Reset --:-- left';
  }

  const now = Date.now();
  const resetTime = new Date(resetsAtIso).getTime();
  const remainingMs = resetTime - now;

  if (remainingMs <= 0) {
    // Already reset or resetting now
    return 'Reset 00:00 left';
  }

  const totalMinutes = Math.floor(remainingMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Format as "Reset hh:mm left"
  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  return `Reset ${hh}:${mm} left`;
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

    const resetTimeLeft = formatResetTimeLeft(rateLimits?.fiveHourResetsAt ?? null);

    // Effort level from settings.json
    let effort: EffortInfo | null = null;
    try {
      const settingsPath = join(homedir(), '.claude/settings.json');
      if (existsSync(settingsPath)) {
        const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
        const level = settings.effortLevel;
        if (level) {
          const iconMap: Record<string, string> = { low: '○', medium: '◐', high: '●', xhigh: '◉', max: '◈' };
          effort = { level, icon: iconMap[level] ?? '◐' };
        }
      }
    } catch { /* ignore */ }

    // Build context
    const ctx: HudContext = {
      stdin,
      rateLimits,
      git,
      transcript,
      contextPercent,
      cost,
      resetTimeLeft,
      effort,
    };

    // Render and output
    console.log(render(ctx));

  } catch (error) {
    console.log(`${DIM}[ddotz-hud] Error${RESET}`);
  }
}

main();
