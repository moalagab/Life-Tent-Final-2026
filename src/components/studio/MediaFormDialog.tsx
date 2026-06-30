import { useState, useEffect } from 'react';
import { Loader2, Star, BookOpen, Film, Headphones, FileText, Tv } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/hooks/useLanguage';
import { useGoals } from '@/hooks/useGoals';
import { useProjects } from '@/hooks/useProjects';
import { MediaItem } from '@/hooks/useMedia';
import { GenreSelector } from './GenreFilter';
import { cn } from '@/lib/utils';

type MediaType = 'book' | 'movie' | 'series' | 'podcast' | 'article';
type MediaStatus = 'want' | 'in_progress' | 'completed' | 'abandoned';

interface MediaFormData {
  title: string;
  author: string;
  type: MediaType;
  status: MediaStatus;
  total_pages: string;
  progress: number;
  rating: number;
  notes: string;
  goal_id: string;
  project_id: string;
  genre: string;
}

const emptyFormData: MediaFormData = {
  title: '',
  author: '',
  type: 'book',
  status: 'want',
  total_pages: '',
  progress: 0,
  rating: 0,
  notes: '',
  goal_id: '',
  project_id: '',
  genre: '',
};

interface MediaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MediaFormData) => Promise<void>;
  initialData?: MediaItem | null;
  isLoading?: boolean;
}

export function MediaFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading = false
}: MediaFormDialogProps) {
  const { currentLanguage } = useLanguage();
  const { data: goals } = useGoals();
  const { data: projects } = useProjects();
  const [formData, setFormData] = useState<MediaFormData>(emptyFormData);

  const isEditMode = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        author: initialData.author || '',
        type: initialData.type as MediaType,
        status: initialData.status as MediaStatus,
        total_pages: initialData.total_pages?.toString() || '',
        progress: initialData.progress || 0,
        rating: initialData.rating || 0,
        notes: initialData.notes || '',
        goal_id: initialData.goal_id || '',
        project_id: initialData.project_id || '',
        genre: initialData.genre || '',
      });
    } else {
      setFormData(emptyFormData);
    }
  }, [initialData, open]);

  const handleSubmit = async () => {
    if (!formData.title) return;
    await onSubmit(formData);
    setFormData(emptyFormData);
  };

  const typeOptions = [
    { value: 'book', label: currentLanguage === 'ar' ? 'كتاب' : 'Book', icon: BookOpen },
    { value: 'movie', label: currentLanguage === 'ar' ? 'فيلم' : 'Movie', icon: Film },
    { value: 'series', label: currentLanguage === 'ar' ? 'مسلسل' : 'Series', icon: Tv },
    { value: 'podcast', label: currentLanguage === 'ar' ? 'بودكاست' : 'Podcast', icon: Headphones },
    { value: 'article', label: currentLanguage === 'ar' ? 'مقال' : 'Article', icon: FileText },
  ];

  const statusOptions = [
    { value: 'want', label: currentLanguage === 'ar' ? 'أريد القراءة/المشاهدة' : 'Want to Read/Watch' },
    { value: 'in_progress', label: currentLanguage === 'ar' ? 'قيد التقدم' : 'In Progress' },
    { value: 'completed', label: currentLanguage === 'ar' ? 'مكتمل' : 'Completed' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode 
              ? (currentLanguage === 'ar' ? 'تعديل العنصر' : 'Edit Item')
              : (currentLanguage === 'ar' ? 'إضافة عنصر جديد' : 'Add New Item')
            }
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {currentLanguage === 'ar' ? 'النوع' : 'Type'}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {typeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: option.value as MediaType })}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-xl border transition-all',
                      formData.type === option.value
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {currentLanguage === 'ar' ? 'العنوان' : 'Title'} *
            </label>
            <Input
              placeholder={currentLanguage === 'ar' ? 'اسم الكتاب أو الفيلم...' : 'Book or movie name...'}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              dir="auto"
            />
          </div>

          {/* Author */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {currentLanguage === 'ar' ? 'المؤلف/المخرج' : 'Author/Director'}
            </label>
            <Input
              placeholder={currentLanguage === 'ar' ? 'اسم المؤلف...' : 'Author name...'}
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              dir="auto"
            />
          </div>

          {/* Genre */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {currentLanguage === 'ar' ? 'التصنيف' : 'Genre'}
            </label>
            <GenreSelector
              value={formData.genre}
              onChange={(genre) => setFormData({ ...formData, genre })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {currentLanguage === 'ar' ? 'الحالة' : 'Status'}
            </label>
            <Select 
              value={formData.status} 
              onValueChange={(value: MediaStatus) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Total Pages (for books) */}
          {formData.type === 'book' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {currentLanguage === 'ar' ? 'عدد الصفحات' : 'Total Pages'}
              </label>
              <Input
                type="number"
                placeholder="300"
                value={formData.total_pages}
                onChange={(e) => setFormData({ ...formData, total_pages: e.target.value })}
              />
            </div>
          )}

          {/* Progress Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                {currentLanguage === 'ar' ? 'نسبة الإنجاز' : 'Progress'}
              </label>
              <span className="text-sm font-bold text-primary">{formData.progress}%</span>
            </div>
            <Slider
              value={[formData.progress]}
              onValueChange={(v) => setFormData({ ...formData, progress: v[0] })}
              max={100}
              step={5}
              className="py-2"
            />
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {currentLanguage === 'ar' ? 'التقييم' : 'Rating'}
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: formData.rating === star ? 0 : star })}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <Star className={cn(
                    'w-7 h-7 transition-colors',
                    star <= formData.rating ? 'text-primary fill-primary' : 'text-muted'
                  )} />
                </button>
              ))}
            </div>
          </div>

          {/* Link to Goal */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {currentLanguage === 'ar' ? 'ربط بهدف' : 'Link to Goal'}
            </label>
            <Select 
              value={formData.goal_id || 'none'} 
              onValueChange={(value) => setFormData({ ...formData, goal_id: value === 'none' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={currentLanguage === 'ar' ? 'اختر هدفًا...' : 'Select a goal...'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {currentLanguage === 'ar' ? 'بدون هدف' : 'No Goal'}
                </SelectItem>
                {goals?.filter(g => !g.archived_at).map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Link to Project */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {currentLanguage === 'ar' ? 'ربط بمشروع' : 'Link to Project'}
            </label>
            <Select 
              value={formData.project_id || 'none'} 
              onValueChange={(value) => setFormData({ ...formData, project_id: value === 'none' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={currentLanguage === 'ar' ? 'اختر مشروعًا...' : 'Select a project...'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {currentLanguage === 'ar' ? 'بدون مشروع' : 'No Project'}
                </SelectItem>
                {projects?.filter(p => p.status !== 'archived').map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {currentLanguage === 'ar' ? 'ملاحظات' : 'Notes'}
            </label>
            <Textarea
              placeholder={currentLanguage === 'ar' ? 'ملاحظاتك حول هذا العنصر...' : 'Your notes about this item...'}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              dir="auto"
            />
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            variant="gold"
            disabled={isLoading || !formData.title}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              isEditMode 
                ? (currentLanguage === 'ar' ? 'حفظ التغييرات' : 'Save Changes')
                : (currentLanguage === 'ar' ? 'إضافة' : 'Add')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
