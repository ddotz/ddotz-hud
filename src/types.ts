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
}

export interface GitInfo {
  branch: string;
  status: string;        // 변경된 파일 수: "(N)"
  additions: number;     // 추가된 라인 수
  deletions: number;     // 삭제된 라인 수
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
