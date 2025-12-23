import { MainLayout } from '@/components/layout/MainLayout';
import { BookOpen, FileText, GraduationCap, Plus, Search, Tag, Sparkles, Play, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Note {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  updatedAt: string;
}

interface Course {
  id: string;
  title: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  category: string;
  thumbnail: string;
}

const mockNotes: Note[] = [
  { id: '1', title: 'Strategic Planning Framework', excerpt: 'Key insights from the annual planning session including OKR methodology...', tags: ['Strategy', 'OKR'], updatedAt: '2 hours ago' },
  { id: '2', title: 'Arabic Vocabulary - Week 12', excerpt: 'New words and phrases learned this week focusing on business terminology...', tags: ['Arabic', 'Learning'], updatedAt: '1 day ago' },
  { id: '3', title: 'Investment Research Notes', excerpt: 'Analysis of emerging market trends and potential opportunities in the GCC...', tags: ['Finance', 'Research'], updatedAt: '3 days ago' },
];

const mockCourses: Course[] = [
  { id: '1', title: 'Advanced Financial Modeling', progress: 75, totalLessons: 24, completedLessons: 18, category: 'Finance', thumbnail: '📊' },
  { id: '2', title: 'Project Management Professional', progress: 45, totalLessons: 40, completedLessons: 18, category: 'Management', thumbnail: '📋' },
  { id: '3', title: 'Arabic Calligraphy Mastery', progress: 30, totalLessons: 16, completedLessons: 5, category: 'Arts', thumbnail: '✍️' },
];

export default function Knowledge() {
  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Knowledge Base</h1>
            <p className="text-muted-foreground mt-1">Your second brain - Notes & Courses</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg">
              <Sparkles className="w-5 h-5 mr-2" />
              AI Insights
            </Button>
            <Button variant="gold" size="lg">
              <Plus className="w-5 h-5 mr-2" />
              New Note
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'notes', label: 'Notes', icon: FileText },
          { id: 'courses', label: 'Courses', icon: GraduationCap },
        ].map((tab) => (
          <button
            key={tab.id}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              tab.id === 'notes' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notes Section */}
        <div className="lg:col-span-2">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-foreground">Recent Notes</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  className="pl-10 pr-4 py-2 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
                />
              </div>
            </div>

            <div className="space-y-4">
              {mockNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {note.title}
                    </h4>
                    <span className="text-xs text-muted-foreground">{note.updatedAt}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{note.excerpt}</p>
                  <div className="flex items-center gap-2">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Courses Section */}
        <div>
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-foreground">Active Courses</h3>
              <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                View All <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-4">
              {mockCourses.map((course) => (
                <div
                  key={course.id}
                  className="p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{course.thumbnail}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">
                        {course.title}
                      </h4>
                      <span className="text-xs text-muted-foreground">{course.category}</span>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
                    </button>
                  </div>

                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">Progress</span>
                      <span className="text-xs font-medium text-foreground">{course.progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-gold rounded-full transition-all"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>

                  <span className="text-xs text-muted-foreground">
                    {course.completedLessons}/{course.totalLessons} lessons
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
