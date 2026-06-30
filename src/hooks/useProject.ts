import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  EnrichedProject,
  ProjectRisk,
  ActivityEvent,
  ProjectPhaseRecord,
  PhaseProgress,
  RiskCount,
  HealthStatus,
} from '@/types/projects.types';

function defaultPhaseProgress(): PhaseProgress {
  return { initiation: 0, planning: 0, execution: 0, monitoring: 0, closing: 0 };
}

function defaultRiskCount(): RiskCount {
  return { high: 0, medium: 0, low: 0 };
}

function coerceProject(raw: Record<string, unknown>): EnrichedProject {
  return {
    ...(raw as EnrichedProject),
    health_score:     (raw.health_score as number)        ?? 0,
    health_status:    ((raw.health_status as string)      ?? 'not_started') as HealthStatus,
    phase_progress:   (raw.phase_progress as PhaseProgress) ?? defaultPhaseProgress(),
    velocity:         (raw.velocity as number)            ?? 0,
    risk_count:       (raw.risk_count as RiskCount)       ?? defaultRiskCount(),
    last_activity_at: (raw.last_activity_at as string)    ?? new Date().toISOString(),
    settings:         (raw.settings as Record<string, unknown>) ?? {},
    progress:         (raw.progress as number)            ?? 0,
  };
}

export function useProject(projectId: string) {
  const [project, setProject]   = useState<EnrichedProject | null>(null);
  const [phases, setPhases]     = useState<ProjectPhaseRecord[]>([]);
  const [risks, setRisks]       = useState<ProjectRisk[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('projects')
      .select(
        'id, user_id, title, description, status, phase, para_category, color, due_date, progress, ' +
        'health_score, health_status, phase_progress, velocity, forecasted_end, ' +
        'risk_count, last_activity_at, ai_brief, settings, created_at, updated_at'
      )
      .eq('id', projectId)
      .single();

    if (err) { setError(err.message); return; }
    setProject(coerceProject(data as Record<string, unknown>));
  }, [projectId]);

  const fetchPhases = useCallback(async () => {
    const { data } = await supabase
      .from('project_phases')
      .select('id, project_id, phase, status, progress, target_date, checklist, notes')
      .eq('project_id', projectId)
      .order('phase');
    setPhases((data as ProjectPhaseRecord[]) ?? []);
  }, [projectId]);

  const fetchRisks = useCallback(async () => {
    const { data } = await supabase
      .from('project_risks')
      .select('id, project_id, user_id, title, description, probability, impact, severity, status, mitigation, created_at')
      .eq('project_id', projectId)
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    setRisks((data as ProjectRisk[]) ?? []);
  }, [projectId]);

  const fetchActivity = useCallback(async () => {
    const { data } = await supabase
      .from('project_activity_feed')
      .select('id, project_id, user_id, event_type, title, description, metadata, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(20);
    setActivity((data as ActivityEvent[]) ?? []);
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProject(), fetchPhases(), fetchRisks(), fetchActivity()])
      .finally(() => setLoading(false));

    const channel = supabase
      .channel(`project-detail-${projectId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'projects',
        filter: `id=eq.${projectId}`,
      }, () => fetchProject())
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'project_activity_feed',
        filter: `project_id=eq.${projectId}`,
      }, () => fetchActivity())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId, fetchProject, fetchPhases, fetchRisks, fetchActivity]);

  return { project, phases, risks, activity, loading, error, refetch: fetchProject };
}

// ── Risk mutations ─────────────────────────────────────────────────────────────

export async function createProjectRisk(
  risk: Omit<ProjectRisk, 'id' | 'severity' | 'created_at'>
): Promise<ProjectRisk | null> {
  const { data, error } = await supabase
    .from('project_risks')
    .insert(risk)
    .select()
    .single();
  if (error) { console.error(error); return null; }
  return data as ProjectRisk;
}

export async function updateProjectRisk(
  id: string,
  updates: Partial<Pick<ProjectRisk, 'title' | 'description' | 'probability' | 'impact' | 'status' | 'mitigation'>>
): Promise<boolean> {
  const { error } = await supabase.from('project_risks').update(updates).eq('id', id);
  if (error) { console.error(error); return false; }
  return true;
}

export async function deleteProjectRisk(id: string): Promise<boolean> {
  const { error } = await supabase.from('project_risks').delete().eq('id', id);
  if (error) { console.error(error); return false; }
  return true;
}

export async function logProjectActivity(
  event: Omit<ActivityEvent, 'id' | 'created_at'>
): Promise<void> {
  await supabase.from('project_activity_feed').insert(event);
}
