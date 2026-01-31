/**
 * ddotz-hud Transcript Parser
 */

import { existsSync, readFileSync } from 'node:fs';
import type { TranscriptData, AgentInfo } from './types.js';

export function parseTranscript(transcriptPath: string | undefined): TranscriptData {
  const result: TranscriptData = {
    agents: [],
    todos: { pending: 0, inProgress: 0, completed: 0, total: 0 },
    sessionStart: null,
    backgroundTasks: 0,
  };

  if (!transcriptPath || !existsSync(transcriptPath)) return result;

  try {
    const content = readFileSync(transcriptPath, 'utf-8');
    const lines = content.split('\n');

    const runningAgents = new Map<string, AgentInfo>();

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const entry = JSON.parse(line);

        // Session start: 첫 번째 timestamp가 있는 entry를 사용
        if (!result.sessionStart && entry.timestamp) {
          result.sessionStart = new Date(entry.timestamp);
        }

        // Agent tracking
        if (entry.type === 'tool_use' && entry.name === 'Task') {
          const agentType = entry.params?.subagent_type || 'unknown';
          const agentId = entry.tool_use_id || `agent-${Date.now()}`;
          runningAgents.set(agentId, {
            type: agentType,
            model: entry.params?.model,
            description: entry.params?.description,
            startTime: new Date(entry.timestamp),
          });
        }

        if (entry.type === 'tool_result' && entry.tool_use_id) {
          runningAgents.delete(entry.tool_use_id);
        }

        // Todo tracking
        if (entry.type === 'tool_use' && entry.name === 'TodoWrite') {
          const todos = entry.params?.todos || [];
          result.todos = { pending: 0, inProgress: 0, completed: 0, total: 0 };
          for (const todo of todos) {
            result.todos.total++;
            if (todo.status === 'completed') result.todos.completed++;
            else if (todo.status === 'in_progress') result.todos.inProgress++;
            else result.todos.pending++;
          }
        }

        // Background task tracking
        if (entry.type === 'tool_use' && entry.name === 'Bash' && entry.params?.run_in_background) {
          result.backgroundTasks++;
        }

      } catch { /* skip invalid lines */ }
    }

    result.agents = Array.from(runningAgents.values());

  } catch { /* ignore */ }

  return result;
}
