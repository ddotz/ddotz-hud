/**
 * ddotz-hud Type Definitions
 */

export interface StatuslineStdin {
  transcript_path: string;
  cwd: string;
  model: {
    id: string;
    display_name: string;
  };
  context_window: {
    context_window_size: number;
    used_percentage?: number;
    current_usage?: {
      input_tokens: number;
      cache_creation_input_tokens: number;
      cache_read_input_tokens: number;
    };
  };
}

export interface RateLimits {
  fiveHour: number;
  weekly: number;
}

export interface GitInfo {
  branch: string;
  status: string;
}

export interface TranscriptData {
  agents: AgentInfo[];
  todos: TodoStats;
  sessionStart: Date | null;
  backgroundTasks: number;
}

export interface AgentInfo {
  type: string;
  model?: string;
  description?: string;
  startTime: Date;
}

export interface TodoStats {
  pending: number;
  inProgress: number;
  completed: number;
  total: number;
}

export interface HudContext {
  stdin: StatuslineStdin;
  rateLimits: RateLimits | null;
  git: GitInfo | null;
  transcript: TranscriptData;
  contextPercent: number;
  cost: number;
  duration: string;
}
