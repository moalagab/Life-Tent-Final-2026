-- Create course_lessons table for tracking individual lessons
CREATE TABLE public.course_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  order_index INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  video_url TEXT,
  resources JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_notes table for study notes
CREATE TABLE public.course_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  note_type TEXT DEFAULT 'note', -- note, summary, flashcard, question
  tags TEXT[],
  is_important BOOLEAN DEFAULT false,
  review_count INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_flashcards table for spaced repetition
CREATE TABLE public.course_flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  difficulty INTEGER DEFAULT 0, -- 0-5 for spaced repetition
  next_review_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  review_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_flashcards ENABLE ROW LEVEL SECURITY;

-- RLS policies for course_lessons
CREATE POLICY "Users can view own course_lessons" ON public.course_lessons
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own course_lessons" ON public.course_lessons
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own course_lessons" ON public.course_lessons
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own course_lessons" ON public.course_lessons
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for course_notes
CREATE POLICY "Users can view own course_notes" ON public.course_notes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own course_notes" ON public.course_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own course_notes" ON public.course_notes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own course_notes" ON public.course_notes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for course_flashcards
CREATE POLICY "Users can view own course_flashcards" ON public.course_flashcards
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own course_flashcards" ON public.course_flashcards
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own course_flashcards" ON public.course_flashcards
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own course_flashcards" ON public.course_flashcards
  FOR DELETE USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX idx_course_lessons_course_id ON public.course_lessons(course_id);
CREATE INDEX idx_course_notes_course_id ON public.course_notes(course_id);
CREATE INDEX idx_course_notes_lesson_id ON public.course_notes(lesson_id);
CREATE INDEX idx_course_flashcards_course_id ON public.course_flashcards(course_id);
CREATE INDEX idx_course_flashcards_next_review ON public.course_flashcards(next_review_at);

-- Update triggers for updated_at
CREATE TRIGGER update_course_lessons_updated_at
  BEFORE UPDATE ON public.course_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_notes_updated_at
  BEFORE UPDATE ON public.course_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_flashcards_updated_at
  BEFORE UPDATE ON public.course_flashcards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();