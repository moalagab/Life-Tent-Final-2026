import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CourseLesson {
  id: string;
  course_id: string;
  user_id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  order_index: number | null;
  is_completed: boolean | null;
  completed_at: string | null;
  notes: string | null;
  video_url: string | null;
  resources: unknown;
  created_at: string;
  updated_at: string;
}

export interface CourseNote {
  id: string;
  course_id: string;
  lesson_id: string | null;
  user_id: string;
  title: string;
  content: string | null;
  note_type: string | null;
  tags: string[] | null;
  is_important: boolean | null;
  review_count: number | null;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseFlashcard {
  id: string;
  course_id: string;
  lesson_id: string | null;
  user_id: string;
  question: string;
  answer: string;
  difficulty: number | null;
  next_review_at: string | null;
  review_count: number | null;
  correct_count: number | null;
  created_at: string;
  updated_at: string;
}

// Course Lessons Hooks
export function useCourseLessons(courseId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['course-lessons', courseId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as CourseLesson[];
    },
    enabled: !!user && !!courseId,
  });
}

export function useCreateCourseLesson() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (lesson: Omit<CourseLesson, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('course_lessons')
        .insert({ ...lesson, user_id: user!.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-lessons', variables.course_id] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useUpdateCourseLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CourseLesson> & { id: string }) => {
      const { data, error } = await supabase
        .from('course_lessons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-lessons', data.course_id] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useDeleteCourseLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, courseId }: { id: string; courseId: string }) => {
      const { error } = await supabase
        .from('course_lessons')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return courseId;
    },
    onSuccess: (courseId) => {
      queryClient.invalidateQueries({ queryKey: ['course-lessons', courseId] });
    },
  });
}

// Course Notes Hooks
export function useCourseNotes(courseId: string, lessonId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['course-notes', courseId, lessonId, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('course_notes')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });
      
      if (lessonId) {
        query = query.eq('lesson_id', lessonId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as CourseNote[];
    },
    enabled: !!user && !!courseId,
  });
}

export function useCreateCourseNote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (note: Omit<CourseNote, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('course_notes')
        .insert({ ...note, user_id: user!.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-notes', variables.course_id] });
    },
  });
}

export function useUpdateCourseNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CourseNote> & { id: string }) => {
      const { data, error } = await supabase
        .from('course_notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-notes', data.course_id] });
    },
  });
}

export function useDeleteCourseNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, courseId }: { id: string; courseId: string }) => {
      const { error } = await supabase
        .from('course_notes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return courseId;
    },
    onSuccess: (courseId) => {
      queryClient.invalidateQueries({ queryKey: ['course-notes', courseId] });
    },
  });
}

// Course Flashcards Hooks
export function useCourseFlashcards(courseId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['course-flashcards', courseId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_flashcards')
        .select('*')
        .eq('course_id', courseId)
        .order('next_review_at', { ascending: true });
      
      if (error) throw error;
      return data as CourseFlashcard[];
    },
    enabled: !!user && !!courseId,
  });
}

export function useFlashcardsForReview(courseId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['flashcards-review', courseId, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('course_flashcards')
        .select('*')
        .lte('next_review_at', new Date().toISOString())
        .order('next_review_at', { ascending: true });
      
      if (courseId) {
        query = query.eq('course_id', courseId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as CourseFlashcard[];
    },
    enabled: !!user,
  });
}

export function useCreateCourseFlashcard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (flashcard: Omit<CourseFlashcard, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('course_flashcards')
        .insert({ ...flashcard, user_id: user!.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-flashcards', variables.course_id] });
      queryClient.invalidateQueries({ queryKey: ['flashcards-review'] });
    },
  });
}

export function useUpdateCourseFlashcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CourseFlashcard> & { id: string }) => {
      const { data, error } = await supabase
        .from('course_flashcards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-flashcards', data.course_id] });
      queryClient.invalidateQueries({ queryKey: ['flashcards-review'] });
    },
  });
}

export function useDeleteCourseFlashcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, courseId }: { id: string; courseId: string }) => {
      const { error } = await supabase
        .from('course_flashcards')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return courseId;
    },
    onSuccess: (courseId) => {
      queryClient.invalidateQueries({ queryKey: ['course-flashcards', courseId] });
      queryClient.invalidateQueries({ queryKey: ['flashcards-review'] });
    },
  });
}

// Helper function for spaced repetition
export function calculateNextReview(difficulty: number, isCorrect: boolean): Date {
  const now = new Date();
  let newDifficulty = difficulty;
  
  if (isCorrect) {
    newDifficulty = Math.min(5, difficulty + 1);
  } else {
    newDifficulty = Math.max(0, difficulty - 2);
  }
  
  // Intervals in days based on difficulty
  const intervals = [1, 2, 4, 7, 14, 30];
  const daysToAdd = intervals[newDifficulty] || 1;
  
  now.setDate(now.getDate() + daysToAdd);
  return now;
}
