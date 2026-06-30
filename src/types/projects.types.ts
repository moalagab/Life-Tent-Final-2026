export type HealthStatus = 'on_track' | 'at_risk' | 'overdue' | 'not_started';
export type ProjectPhase = 'initiation' | 'planning' | 'execution' | 'monitoring' | 'closing';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type RiskStatus = 'open' | 'mitigated' | 'closed';

export interface PhaseProgress {
  initiation: number;
  planning: number;
  execution: number;
  monitoring: number;
  closing: number;
}

export interface RiskCount {
  high: number;
  medium: number;
  low: number;
}

export interface EnrichedProject {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: string;
  phase: ProjectPhase;
  due_date?: string;
  progress: number;
  color?: string;
  para_category?: string;
  // Health fields (added 2026-06-25)
  health_score: number;
  health_status: HealthStatus;
  phase_progress: PhaseProgress;
  velocity: number;
  forecasted_end?: string;
  risk_count: RiskCount;
  last_activity_at: string;
  ai_brief?: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

export interface ProjectPhaseRecord {
  id: string;
  project_id: string;
  phase: ProjectPhase;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  target_date?: string;
  checklist: ChecklistItem[];
  notes?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ProjectRisk {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description?: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  severity: RiskLevel;
  status: RiskStatus;
  mitigation?: string;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  project_id: string;
  user_id: string;
  event_type: string;
  title: string;
  description?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type ProjectZone = 'command' | 'work' | 'strategy' | 'context' | 'resources';
export type WorkSubView = 'list' | 'kanban' | 'timeline';
