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

    return { branch, status };
  } catch {
    return null;
  }
}
