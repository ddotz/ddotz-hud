/**
 * ddotz-hud Stdin Parser
 */

import type { StatuslineStdin } from './types.js';

export async function readStdin(): Promise<StatuslineStdin | null> {
  if (process.stdin.isTTY) return null;

  const chunks: string[] = [];
  process.stdin.setEncoding('utf8');

  for await (const chunk of process.stdin) {
    chunks.push(chunk as string);
  }

  const raw = chunks.join('');
  if (!raw.trim()) return null;

  try {
    return JSON.parse(raw) as StatuslineStdin;
  } catch {
    return null;
  }
}

export function getContextPercent(stdin: StatuslineStdin): number {
  const nativePercent = stdin.context_window?.used_percentage;
  if (typeof nativePercent === 'number' && !Number.isNaN(nativePercent)) {
    return Math.min(100, Math.max(0, nativePercent));
  }

  const size = stdin.context_window?.context_window_size;
  if (!size || size <= 0) return 0;

  const usage = stdin.context_window?.current_usage;
  const totalTokens = (usage?.input_tokens ?? 0) +
    (usage?.cache_creation_input_tokens ?? 0) +
    (usage?.cache_read_input_tokens ?? 0);

  return Math.min(100, (totalTokens / size) * 100);
}

export function getModelName(stdin: StatuslineStdin): string {
  return stdin.model?.display_name ?? stdin.model?.id ?? 'Unknown';
}
