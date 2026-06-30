import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PlanningPipeline {
  id: string;
  project_id: string | null;
  user_id: string;
  title: string;
  description: string | null;
  
  // Stage 1: Strategy & Direction
  strategy_vision: string | null;
  strategy_why: string | null;
  strategy_where: string | null;
  strategy_completed: boolean | null;
  
  // Stage 2: Validation
  validation_problem: string | null;
  validation_solution: string | null;
  validation_target_market: string | null;
  validation_completed: boolean | null;
  
  // Stage 3: Business Model
  business_revenue_model: string | null;
  business_cost_structure: string | null;
  business_value_proposition: string | null;
  business_completed: boolean | null;
  
  // Stage 4: Feasibility
  feasibility_technical: string | null;
  feasibility_financial: string | null;
  feasibility_timeline: string | null;
  feasibility_resources: string | null;
  feasibility_completed: boolean | null;
  
  // Stage 5: Go/No-Go
  decision: 'go' | 'no_go' | 'pending' | null;
  decision_notes: string | null;
  decision_date: string | null;
  
  current_stage: number | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export type PlanningPipelineInsert = Omit<PlanningPipeline, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export function usePlanningPipelines() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['planning-pipelines', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planning_pipeline')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PlanningPipeline[];
    },
    enabled: !!user,
  });
}

export function usePlanningPipelinesByStage(stage: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['planning-pipelines-stage', stage, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planning_pipeline')
        .select('*')
        .eq('current_stage', stage)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PlanningPipeline[];
    },
    enabled: !!user,
  });
}

export function useCreatePlanningPipeline() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (pipeline: Partial<PlanningPipelineInsert>) => {
      const { data, error } = await supabase
        .from('planning_pipeline')
        .insert({ 
          title: pipeline.title || 'Untitled Project',
          user_id: user!.id,
          ...pipeline 
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-pipelines'] });
    },
  });
}

export function useUpdatePlanningPipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PlanningPipeline> & { id: string }) => {
      const { data, error } = await supabase
        .from('planning_pipeline')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-pipelines'] });
    },
  });
}

export function useDeletePlanningPipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('planning_pipeline')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-pipelines'] });
    },
  });
}

export function useConvertToProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (pipelineId: string) => {
      // Get the pipeline data
      const { data: pipeline, error: fetchError } = await supabase
        .from('planning_pipeline')
        .select('*')
        .eq('id', pipelineId)
        .single();
      
      if (fetchError) throw fetchError;

      // Create a new project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          title: pipeline.title,
          description: pipeline.description,
          vision: pipeline.strategy_vision,
          user_id: user!.id,
          phase: 'planning',
          status: 'active',
        })
        .select()
        .single();
      
      if (projectError) throw projectError;

      // Update the pipeline with the project reference
      const { error: updateError } = await supabase
        .from('planning_pipeline')
        .update({ 
          project_id: project.id, 
          status: 'converted',
          decision: 'go',
          decision_date: new Date().toISOString()
        })
        .eq('id', pipelineId);
      
      if (updateError) throw updateError;

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-pipelines'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
