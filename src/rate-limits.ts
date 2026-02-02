/**
 * ddotz-hud Rate Limits API
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import https from 'node:https';
import type { RateLimits } from './types.js';

const CACHE_TTL_MS = 30000; // 30 seconds

interface UsageCache {
  timestamp: number;
  data: RateLimits | null;
}

function getCachePath(): string {
  return join(homedir(), '.claude/hud/.usage-cache.json');
}

function readCache(): UsageCache | null {
  try {
    const cachePath = getCachePath();
    if (!existsSync(cachePath)) return null;
    const content = readFileSync(cachePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function writeCache(data: RateLimits | null): void {
  try {
    const cachePath = getCachePath();
    const cacheDir = dirname(cachePath);
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true });
    }
    const cache: UsageCache = { timestamp: Date.now(), data };
    writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  } catch { /* ignore */ }
}

function getCredentials(): string | null {
  // macOS Keychain
  if (process.platform === 'darwin') {
    try {
      const result = execSync(
        '/usr/bin/security find-generic-password -s "Claude Code-credentials" -w 2>/dev/null',
        { encoding: 'utf-8', timeout: 2000 }
      ).trim();
      if (result) {
        const parsed = JSON.parse(result);
        const creds = parsed.claudeAiOauth || parsed;
        if (creds.accessToken) return creds.accessToken;
      }
    } catch { /* continue */ }
  }

  // File fallback
  try {
    const credPath = join(homedir(), '.claude/.credentials.json');
    if (existsSync(credPath)) {
      const content = readFileSync(credPath, 'utf-8');
      const parsed = JSON.parse(content);
      const creds = parsed.claudeAiOauth || parsed;
      if (creds.accessToken) return creds.accessToken;
    }
  } catch { /* ignore */ }

  return null;
}

interface UsageApiResponse {
  five_hour?: { utilization?: number; resets_at?: string };
  seven_day?: { utilization?: number; resets_at?: string };
}

async function fetchUsage(accessToken: string): Promise<UsageApiResponse | null> {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/api/oauth/usage',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'anthropic-beta': 'oauth-2025-04-20',
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try { resolve(JSON.parse(data)); } catch { resolve(null); }
        } else { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.end();
  });
}

export async function getRateLimits(): Promise<RateLimits | null> {
  // Check cache
  const cache = readCache();
  if (cache && (Date.now() - cache.timestamp < CACHE_TTL_MS)) {
    return cache.data;
  }

  const token = getCredentials();
  if (!token) {
    writeCache(null);
    return null;
  }

  const response = await fetchUsage(token);
  if (!response) {
    writeCache(null);
    return null;
  }

  const data: RateLimits = {
    fiveHour: Math.round(response.five_hour?.utilization ?? 0),
    weekly: Math.round(response.seven_day?.utilization ?? 0),
    fiveHourResetsAt: response.five_hour?.resets_at ?? null,
  };

  writeCache(data);
  return data;
}
