/**
 * ddotz-hud Git Info
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GitInfo } from './types.js';

export function getGitInfo(cwd: string): GitInfo | null {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD 2>/dev/null', {
      cwd,
      encoding: 'utf-8',
      timeout: 1000,
    }).trim();

    // Get version from package.json or plugin.json
    let version = '';
    try {
      const pkgPath = join(cwd, 'package.json');
      const pluginPath = join(cwd, '.claude-plugin/plugin.json');

      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        if (pkg.version) {
          version = `v${pkg.version}`;
        }
      } else if (existsSync(pluginPath)) {
        const plugin = JSON.parse(readFileSync(pluginPath, 'utf-8'));
        if (plugin.version) {
          version = `v${plugin.version}`;
        }
      }
    } catch { /* ignore */ }

    return { branch, version };
  } catch {
    return null;
  }
}
