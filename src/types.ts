export type GitProvider = 'none' | 'github' | 'gitlab';
export type AuthMethod = 'none' | 'bearer' | 'login';
export type HealthState = 'healthy' | 'warning' | 'critical' | 'unknown';

export interface Project {
  id: number;
  name: string;
  description: string;
  apiBaseUrl: string;
  authMethod: AuthMethod;
  loginEndpoint: string;
  tokenField: string;
  gitProvider: GitProvider;
  repoUrl: string;
  gitProjectId: string;
  supportEndpoint: string;
  healthEndpoint: string;
  deployEndpoint: string;
  docsUrl: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectDraft = Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & { id?: number };

export interface Ticket {
  id: number | string;
  /** Human-readable reference: ticket_number when the API provides one, else the id */
  ref: string;
  subject: string;
  details: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: number | string | null;
  author: string | null;
  message: string;
  createdAt: string | null;
}

export interface GitCommit { message: string; author: string; date: string; webUrl: string; }
export interface GitMr { title: string; author: string; webUrl: string; updatedAt: string; }
export interface GitBranch {
  name: string;
  default: boolean;
  lastActivity: string | null;
  webUrl: string | null;
}
export interface GitInfo {
  openMrCount: number;
  mrs: GitMr[];
  commits: GitCommit[];
  branches: GitBranch[];
  failedPipelines: number | null;
}

// One entry of a health-response component group (services, workers, instances…)
export interface HealthComponent {
  group: string;
  name: string;
  status: string;
  ok: boolean;
  error: string | null;
}

export interface HealthMeta {
  status: string | null;
  app: string | null;
  version: string | null;
  environment: string | null;
}

export interface ProjectStatus {
  projectId: number;
  health: HealthState;
  latencyMs: number | null;
  httpStatus: number | null;
  error: string | null;
  healthComponents: HealthComponent[] | null;
  healthMeta: HealthMeta | null;
  checkedAt: string | null;
  tickets: Ticket[] | null;
  ticketsError: string | null;
  git: GitInfo | null;
  gitError: string | null;
}

export interface HttpResponse {
  status: number;
  ok: boolean;
  body: string;
  headers: Record<string, string>;
}
