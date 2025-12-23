import { MainLayout } from '@/components/layout/MainLayout';
import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings, Coffee, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type SessionType = 'work' | 'shortBreak' | 'longBreak';

const DEFAULT_SETTINGS = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

export default function Pomodoro() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);

  const getDuration = useCallback((type: SessionType) => {
    switch (type) {
      case 'work':
        return settings.workDuration * 60;
      case 'shortBreak':
        return settings.shortBreakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
    }
  }, [settings]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleSessionComplete = () => {
    setIsRunning(false);
    
    if (sessionType === 'work') {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      if (newCompletedSessions % settings.sessionsBeforeLongBreak === 0) {
        setSessionType('longBreak');
        setTimeLeft(settings.longBreakDuration * 60);
        toast.success(t('pomodoro.longBreakTime'));
      } else {
        setSessionType('shortBreak');
        setTimeLeft(settings.shortBreakDuration * 60);
        toast.success(t('pomodoro.shortBreakTime'));
      }
    } else {
      setSessionType('work');
      setTimeLeft(settings.workDuration * 60);
      toast.success(t('pomodoro.workTime'));
    }

    // Play notification sound
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(t('pomodoro.sessionComplete'));
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getDuration(sessionType));
  };

  const switchSession = (type: SessionType) => {
    setIsRunning(false);
    setSessionType(type);
    setTimeLeft(getDuration(type));
  };

  const saveSettings = () => {
    setSettings(tempSettings);
    setTimeLeft(tempSettings.workDuration * 60);
    setSessionType('work');
    setShowSettings(false);
    toast.success(t('common.success'));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((getDuration(sessionType) - timeLeft) / getDuration(sessionType)) * 100;

  const sessionColors = {
    work: 'text-primary',
    shortBreak: 'text-success',
    longBreak: 'text-blue-500',
  };

  const sessionBgColors = {
    work: 'bg-primary/10',
    shortBreak: 'bg-success/10',
    longBreak: 'bg-blue-500/10',
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">{t('pomodoro.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('pomodoro.subtitle')}</p>
        </div>

        {/* Session Type Selector */}
        <div className="flex justify-center gap-2 mb-8">
          <Button
            variant={sessionType === 'work' ? 'default' : 'outline'}
            onClick={() => switchSession('work')}
            className="gap-2"
          >
            <Brain className="w-4 h-4" />
            {t('pomodoro.work')}
          </Button>
          <Button
            variant={sessionType === 'shortBreak' ? 'default' : 'outline'}
            onClick={() => switchSession('shortBreak')}
            className="gap-2"
          >
            <Coffee className="w-4 h-4" />
            {t('pomodoro.shortBreak')}
          </Button>
          <Button
            variant={sessionType === 'longBreak' ? 'default' : 'outline'}
            onClick={() => switchSession('longBreak')}
            className="gap-2"
          >
            <Coffee className="w-4 h-4" />
            {t('pomodoro.longBreak')}
          </Button>
        </div>

        {/* Timer Display */}
        <div className="glass-card p-12 text-center mb-8">
          <div className="relative inline-flex items-center justify-center">
            {/* Progress Ring */}
            <svg className="w-64 h-64 transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted/20"
              />
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={2 * Math.PI * 120}
                strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                className={cn('transition-all duration-1000', sessionColors[sessionType])}
                strokeLinecap="round"
              />
            </svg>
            
            {/* Time Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('text-6xl font-bold', sessionColors[sessionType])}>
                {formatTime(timeLeft)}
              </span>
              <span className="text-muted-foreground mt-2 capitalize">
                {t(`pomodoro.${sessionType}`)}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={resetTimer}
              className="w-14 h-14 rounded-full p-0"
            >
              <RotateCcw className="w-6 h-6" />
            </Button>
            <Button
              size="lg"
              onClick={toggleTimer}
              className={cn('w-20 h-20 rounded-full p-0', sessionBgColors[sessionType], sessionColors[sessionType], 'hover:opacity-80')}
            >
              {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ms-1" />}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowSettings(true)}
              className="w-14 h-14 rounded-full p-0"
            >
              <Settings className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-5 text-center">
            <p className="text-3xl font-bold text-primary">{completedSessions}</p>
            <p className="text-sm text-muted-foreground">{t('pomodoro.completedSessions')}</p>
          </div>
          <div className="glass-card p-5 text-center">
            <p className="text-3xl font-bold text-success">
              {Math.floor((completedSessions * settings.workDuration) / 60)}h {(completedSessions * settings.workDuration) % 60}m
            </p>
            <p className="text-sm text-muted-foreground">{t('pomodoro.totalFocusTime')}</p>
          </div>
        </div>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('pomodoro.settings')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>{t('pomodoro.workDuration')} ({t('pomodoro.minutes')})</Label>
                <Input
                  type="number"
                  value={tempSettings.workDuration}
                  onChange={(e) => setTempSettings({ ...tempSettings, workDuration: parseInt(e.target.value) || 25 })}
                  min={1}
                  max={60}
                />
              </div>
              <div>
                <Label>{t('pomodoro.shortBreakDuration')} ({t('pomodoro.minutes')})</Label>
                <Input
                  type="number"
                  value={tempSettings.shortBreakDuration}
                  onChange={(e) => setTempSettings({ ...tempSettings, shortBreakDuration: parseInt(e.target.value) || 5 })}
                  min={1}
                  max={30}
                />
              </div>
              <div>
                <Label>{t('pomodoro.longBreakDuration')} ({t('pomodoro.minutes')})</Label>
                <Input
                  type="number"
                  value={tempSettings.longBreakDuration}
                  onChange={(e) => setTempSettings({ ...tempSettings, longBreakDuration: parseInt(e.target.value) || 15 })}
                  min={1}
                  max={60}
                />
              </div>
              <div>
                <Label>{t('pomodoro.sessionsBeforeLongBreak')}</Label>
                <Input
                  type="number"
                  value={tempSettings.sessionsBeforeLongBreak}
                  onChange={(e) => setTempSettings({ ...tempSettings, sessionsBeforeLongBreak: parseInt(e.target.value) || 4 })}
                  min={1}
                  max={10}
                />
              </div>
              <Button onClick={saveSettings} className="w-full">
                {t('common.save')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
