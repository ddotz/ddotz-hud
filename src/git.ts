/**
 * ddotz-hud Git Info
 */

import { execSync } from 'node:child_process';
import type { GitInfo } from './types.js';

export function getGitInfo(cwd: string): GitInfo | null {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD 2>/dev/null', {
      cwd,
      encoding: 'utf-8',
      timeout: 1000,
    }).trim();

    let status = '';
    let additions = 0;
    let deletions = 0;

    try {
      const statusOutput = execSync('git status --porcelain 2>/dev/null', {
        cwd,
        encoding: 'utf-8',
        timeout: 1000,
      }).trim();
      if (statusOutput) {
        const lines = statusOutput.split('\n').filter(l => l.trim());
        status = `(${lines.length})`;
      }
    } catch { /* ignore */ }

    // Get additions/deletions from git diff --stat
    try {
      const diffStat = execSync('git diff --stat 2>/dev/null | tail -1', {
        cwd,
        encoding: 'utf-8',
        timeout: 2000,
      }).trim();

      // Parse: "N files changed, X insertions(+), Y deletions(-)"
      const addMatch = diffStat.match(/(\d+)\s+insertion/);
      const delMatch = diffStat.match(/(\d+)\s+deletion/);
      if (addMatch) additions = parseInt(addMatch[1], 10);
      if (delMatch) deletions = parseInt(delMatch[1], 10);

      // Also check staged changes
      const stagedStat = execSync('git diff --cached --stat 2>/dev/null | tail -1', {
        cwd,
        encoding: 'utf-8',
        timeout: 2000,
      }).trim();

      const stagedAddMatch = stagedStat.match(/(\d+)\s+insertion/);
      const stagedDelMatch = stagedStat.match(/(\d+)\s+deletion/);
      if (stagedAddMatch) additions += parseInt(stagedAddMatch[1], 10);
      if (stagedDelMatch) deletions += parseInt(stagedDelMatch[1], 10);
    } catch { /* ignore */ }

    return { branch, status, additions, deletions };
  } catch {
    return null;
  }
}
