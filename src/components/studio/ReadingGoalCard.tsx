import { useState } from 'react';
import { Target, Edit3, Check, X, TrendingUp, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/hooks/useLanguage';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReadingGoalCardProps {
  booksRead: number;
  onNavigateToGoals?: () => void;
}

export function ReadingGoalCard({ booksRead, onNavigateToGoals }: ReadingGoalCardProps) {
  const { t, currentLanguage } = useLanguage();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [goalValue, setGoalValue] = useState('');

  const readingGoal = profile?.reading_goal_yearly || 24;
  const progress = Math.min((booksRead / readingGoal) * 100, 100);
  const remaining = Math.max(readingGoal - booksRead, 0);
  const isOnTrack = booksRead >= (readingGoal / 12) * (new Date().getMonth() + 1);

  const handleStartEdit = () => {
    setGoalValue(readingGoal.toString());
    setIsEditing(true);
  };

  const handleSaveGoal = async () => {
    const newGoal = parseInt(goalValue);
    if (isNaN(newGoal) || newGoal < 1) {
      toast.error(currentLanguage === 'ar' ? 'أدخل رقمًا صحيحًا' : 'Enter a valid number');
      return;
    }

    try {
      await updateProfile.mutateAsync({ reading_goal_yearly: newGoal });
      toast.success(currentLanguage === 'ar' ? 'تم تحديث الهدف' : 'Goal updated');
      setIsEditing(false);
    } catch (error) {
      toast.error(currentLanguage === 'ar' ? 'حدث خطأ' : 'Error occurred');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setGoalValue('');
  };

  return (
    <div className="glass-card p-6 mb-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-20 -end-20 w-40 h-40 bg-gradient-gold opacity-10 rounded-full blur-3xl" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold-glow">
              <Target className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {currentLanguage === 'ar' ? `هدف القراءة ${new Date().getFullYear()}` : `${new Date().getFullYear()} Reading Goal`}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className={cn(
                  'w-4 h-4',
                  isOnTrack ? 'text-green-500' : 'text-amber-500'
                )} />
                {isOnTrack 
                  ? (currentLanguage === 'ar' ? 'على المسار الصحيح' : 'On track')
                  : (currentLanguage === 'ar' ? 'تحتاج للمزيد' : 'Need more reading')
                }
              </p>
            </div>
          </div>

          {/* Edit button */}
          {!isEditing ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleStartEdit}
              className="text-muted-foreground hover:text-primary"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={goalValue}
                onChange={(e) => setGoalValue(e.target.value)}
                className="w-20 h-8 text-center"
                min={1}
                autoFocus
              />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSaveGoal}
                disabled={updateProfile.isPending}
                className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleCancel}
                className="text-destructive hover:bg-destructive/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10">
            <span className="text-2xl font-bold gold-text">{booksRead}</span>
            <p className="text-xs text-muted-foreground mt-1">
              {currentLanguage === 'ar' ? 'كتب مكتملة' : 'Books Read'}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/50 border border-border">
            <span className="text-2xl font-bold text-foreground">{readingGoal}</span>
            <p className="text-xs text-muted-foreground mt-1">
              {currentLanguage === 'ar' ? 'الهدف السنوي' : 'Yearly Goal'}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/50 border border-border">
            <span className="text-2xl font-bold text-muted-foreground">{remaining}</span>
            <p className="text-xs text-muted-foreground mt-1">
              {currentLanguage === 'ar' ? 'المتبقي' : 'Remaining'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {currentLanguage === 'ar' ? 'التقدم' : 'Progress'}
            </span>
            <span className="font-bold gold-text">{Math.round(progress)}%</span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-gold rounded-full transition-all duration-700 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {progress > 10 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Link to Goals */}
        {onNavigateToGoals && (
          <Button 
            variant="link" 
            onClick={onNavigateToGoals}
            className="mt-4 p-0 h-auto text-primary hover:text-primary/80"
          >
            {currentLanguage === 'ar' ? 'ربط بالأهداف ←' : 'Link to Goals →'}
          </Button>
        )}
      </div>
    </div>
  );
}
