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
  output_style?: string | Record<string, any>;  // 글쓰기 스타일 (문자열 또는 객체)
}

export interface RateLimits {
  fiveHour: number;
  weekly: number;
  fiveHourResetsAt: string | null;  // ISO timestamp when 5h window resets
}

export interface GitInfo {
  branch: string;
  version: string;       // 프로젝트 버전: "vX.Y.Z"
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

export interface EffortInfo {
  level: string;   // low, medium, high, xhigh, max
  icon: string;    // ○, ◐, ●, ◉, ◈
}

export interface HudContext {
  stdin: StatuslineStdin;
  rateLimits: RateLimits | null;
  git: GitInfo | null;
  transcript: TranscriptData;
  contextPercent: number;
  cost: number;
  resetTimeLeft: string;  // 5h rolling window reset time left
  effort: EffortInfo | null;
}
