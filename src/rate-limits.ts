/**
 * ddotz-hud Rate Limits API
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import https from 'node:https';
import type { RateLimits } from './types.js';

const CACHE_TTL_MS = 300000; // 5 minutes cache TTL

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

interface Credentials {
  sessionKey: string;
  orgId: string;
}

function getCredentials(): Credentials | null {
  // 1. Try Environment Variables First
  if (process.env.CLAUDE_SESSION_KEY && process.env.CLAUDE_ORG_ID) {
    return {
      sessionKey: process.env.CLAUDE_SESSION_KEY,
      orgId: process.env.CLAUDE_ORG_ID
    };
  }

  // 2. Try User Config File (~/.claude/ddotz-hud-config.json)
  try {
    const configPath = join(homedir(), '.claude/ddotz-hud-config.json');
    if (existsSync(configPath)) {
      const content = readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed.sessionKey && parsed.orgId) {
        return {
          sessionKey: parsed.sessionKey,
          orgId: parsed.orgId
        };
      }
    }
  } catch { /* ignore */ }

  return null;
}

interface UsageApiResponse {
  five_hour?: { utilization?: number; resets_at?: string };
  seven_day?: { utilization?: number; resets_at?: string };
}

async function fetchUsage(creds: Credentials): Promise<UsageApiResponse | null> {
  return new Promise((resolve) => {
    // Validate orgId avoids path traversal
    if (creds.orgId.includes('..') || creds.orgId.includes('/')) {
      return resolve(null);
    }

    const req = https.request({
      hostname: 'claude.ai',
      path: `/api/organizations/${creds.orgId}/usage`,
      method: 'GET',
      headers: {
        'Cookie': `sessionKey=${creds.sessionKey}`,
        'Accept': 'application/json',
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

  const creds = getCredentials();
  if (!creds) {
    return null; // Return null so renderer handles it gracefully
  }

  const response = await fetchUsage(creds);
  if (!response) {
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
