/**
 * ddotz-hud Cost Estimation
 */

import type { StatuslineStdin } from './types.js';

interface ModelPricing {
  input: number;      // per million tokens
  output: number;     // per million tokens
  cacheCreate: number;
  cacheRead: number;
}

const PRICING: Record<string, ModelPricing> = {
  opus: {
    input: 15,
    output: 75,
    cacheCreate: 18.75,
    cacheRead: 1.5,
  },
  sonnet: {
    input: 3,
    output: 15,
    cacheCreate: 3.75,
    cacheRead: 0.3,
  },
  haiku: {
    input: 0.25,
    output: 1.25,
    cacheCreate: 0.3,
    cacheRead: 0.03,
  },
};

function getModelTier(modelId: string): ModelPricing {
  const id = modelId.toLowerCase();
  if (id.includes('opus')) return PRICING.opus;
  if (id.includes('haiku')) return PRICING.haiku;
  return PRICING.sonnet; // default
}

export function estimateCost(stdin: StatuslineStdin): number {
  const usage = stdin.context_window?.current_usage;
  if (!usage) return 0;

  const modelId = stdin.model?.id || '';
  const pricing = getModelTier(modelId);

  const inputTokens = usage.input_tokens || 0;
  const cacheCreation = usage.cache_creation_input_tokens || 0;
  const cacheRead = usage.cache_read_input_tokens || 0;

  // Estimate output as ~30% of input
  const estimatedOutput = Math.round(inputTokens * 0.3);

  const cost = (
    (inputTokens / 1_000_000) * pricing.input +
    (estimatedOutput / 1_000_000) * pricing.output +
    (cacheCreation / 1_000_000) * pricing.cacheCreate +
    (cacheRead / 1_000_000) * pricing.cacheRead
  );

  return cost;
}
