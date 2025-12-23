import { MainLayout } from '@/components/layout/MainLayout';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Coffee, Brain, Volume2, VolumeX, Flame, Clock, Target, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

type SessionType = 'work' | 'shortBreak' | 'longBreak';

const DEFAULT_SETTINGS = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  soundEnabled: true,
  autoStartBreaks: false,
  autoStartWork: false,
};

export default function Pomodoro() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('pomodoro-settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [completedSessions, setCompletedSessions] = useState(() => {
    const saved = localStorage.getItem('pomodoro-sessions-today');
    const data = saved ? JSON.parse(saved) : { count: 0, date: new Date().toDateString() };
    return data.date === new Date().toDateString() ? data.count : 0;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoro-sessions-today', JSON.stringify({
      count: completedSessions,
      date: new Date().toDateString()
    }));
  }, [completedSessions]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoro-settings', JSON.stringify(settings));
  }, [settings]);

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

  const playSound = useCallback(() => {
    if (settings.soundEnabled) {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  }, [settings.soundEnabled]);

  const handleSessionComplete = useCallback(() => {
    setIsRunning(false);
    playSound();
    
    if (sessionType === 'work') {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      if (newCompletedSessions % settings.sessionsBeforeLongBreak === 0) {
        setSessionType('longBreak');
        setTimeLeft(settings.longBreakDuration * 60);
        toast.success(t('pomodoro.longBreakTime'), { icon: '☕' });
        if (settings.autoStartBreaks) setIsRunning(true);
      } else {
        setSessionType('shortBreak');
        setTimeLeft(settings.shortBreakDuration * 60);
        toast.success(t('pomodoro.shortBreakTime'), { icon: '🧘' });
        if (settings.autoStartBreaks) setIsRunning(true);
      }
    } else {
      setSessionType('work');
      setTimeLeft(settings.workDuration * 60);
      toast.success(t('pomodoro.workTime'), { icon: '🎯' });
      if (settings.autoStartWork) setIsRunning(true);
    }

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(t('pomodoro.sessionComplete'), {
        body: sessionType === 'work' ? t('pomodoro.takeBreak') : t('pomodoro.backToWork'),
        icon: '/favicon.ico'
      });
    }
  }, [sessionType, completedSessions, settings, playSound, t]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleSessionComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, handleSessionComplete]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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

  const sessionConfig = {
    work: {
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      ringColor: 'stroke-primary',
      gradient: 'from-primary/20 to-amber-500/20',
      icon: Brain,
    },
    shortBreak: {
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      ringColor: 'stroke-emerald-500',
      gradient: 'from-emerald-500/20 to-teal-500/20',
      icon: Coffee,
    },
    longBreak: {
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      ringColor: 'stroke-blue-500',
      gradient: 'from-blue-500/20 to-indigo-500/20',
      icon: Coffee,
    },
  };

  const currentSession = sessionConfig[sessionType];

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Timer className="w-4 h-4" />
            {t('pomodoro.title')}
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t('pomodoro.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('pomodoro.subtitle')}</p>
        </div>

        {/* Session Type Selector */}
        <div className="flex justify-center gap-2 mb-8">
          {(['work', 'shortBreak', 'longBreak'] as SessionType[]).map((type) => {
            const config = sessionConfig[type];
            const Icon = config.icon;
            return (
              <Button
                key={type}
                variant={sessionType === type ? 'default' : 'outline'}
                onClick={() => switchSession(type)}
                className={cn(
                  'gap-2 transition-all duration-300',
                  sessionType === type && 'shadow-lg'
                )}
              >
                <Icon className="w-4 h-4" />
                {t(`pomodoro.${type}`)}
              </Button>
            );
          })}
        </div>

        {/* Timer Display */}
        <div className={cn(
          "glass-card p-12 text-center mb-8 bg-gradient-to-br transition-all duration-500",
          currentSession.gradient
        )}>
          <div className="relative inline-flex items-center justify-center">
            {/* Progress Ring */}
            <svg className="w-72 h-72 transform -rotate-90">
              <circle
                cx="144"
                cy="144"
                r="130"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-muted/10"
              />
              <circle
                cx="144"
                cy="144"
                r="130"
                strokeWidth="12"
                fill="none"
                strokeDasharray={2 * Math.PI * 130}
                strokeDashoffset={2 * Math.PI * 130 * (1 - progress / 100)}
                className={cn('transition-all duration-1000', currentSession.ringColor)}
                strokeLinecap="round"
              />
            </svg>
            
            {/* Time Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <currentSession.icon className={cn('w-8 h-8 mb-2', currentSession.color)} />
              <span className={cn('text-7xl font-bold tracking-tight', currentSession.color)}>
                {formatTime(timeLeft)}
              </span>
              <span className="text-muted-foreground mt-2 text-sm uppercase tracking-wider">
                {t(`pomodoro.${sessionType}`)}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center items-center gap-6 mt-10">
            <Button
              variant="outline"
              size="lg"
              onClick={resetTimer}
              className="w-14 h-14 rounded-full p-0 border-2"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
            
            <Button
              size="lg"
              onClick={toggleTimer}
              className={cn(
                'w-24 h-24 rounded-full p-0 shadow-xl transition-all duration-300',
                isRunning ? 'scale-95' : 'hover:scale-105'
              )}
            >
              {isRunning ? (
                <Pause className="w-10 h-10" />
              ) : (
                <Play className="w-10 h-10 ms-1" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setTempSettings(settings);
                setShowSettings(true);
              }}
              className="w-14 h-14 rounded-full p-0 border-2"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card p-5 text-center group hover:border-primary/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Flame className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">{completedSessions}</p>
            <p className="text-xs text-muted-foreground">{t('pomodoro.completedSessions')}</p>
          </div>
          
          <div className="glass-card p-5 text-center group hover:border-emerald-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {Math.floor((completedSessions * settings.workDuration) / 60)}h {(completedSessions * settings.workDuration) % 60}m
            </p>
            <p className="text-xs text-muted-foreground">{t('pomodoro.totalFocusTime')}</p>
          </div>
          
          <div className="glass-card p-5 text-center group hover:border-blue-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {settings.sessionsBeforeLongBreak - (completedSessions % settings.sessionsBeforeLongBreak)}
            </p>
            <p className="text-xs text-muted-foreground">{t('pomodoro.untilLongBreak')}</p>
          </div>
        </div>

        {/* Session Progress Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-3 h-3 rounded-full transition-all duration-300',
                i < (completedSessions % settings.sessionsBeforeLongBreak)
                  ? 'bg-primary scale-110'
                  : 'bg-muted'
              )}
            />
          ))}
        </div>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {t('pomodoro.settings')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              {/* Duration Settings */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">{t('pomodoro.durations')}</h4>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">{t('pomodoro.work')}</Label>
                    <Input
                      type="number"
                      value={tempSettings.workDuration}
                      onChange={(e) => setTempSettings({ ...tempSettings, workDuration: parseInt(e.target.value) || 25 })}
                      min={1}
                      max={60}
                      className="text-center"
                    />
                    <p className="text-[10px] text-muted-foreground text-center">{t('pomodoro.minutes')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{t('pomodoro.shortBreak')}</Label>
                    <Input
                      type="number"
                      value={tempSettings.shortBreakDuration}
                      onChange={(e) => setTempSettings({ ...tempSettings, shortBreakDuration: parseInt(e.target.value) || 5 })}
                      min={1}
                      max={30}
                      className="text-center"
                    />
                    <p className="text-[10px] text-muted-foreground text-center">{t('pomodoro.minutes')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{t('pomodoro.longBreak')}</Label>
                    <Input
                      type="number"
                      value={tempSettings.longBreakDuration}
                      onChange={(e) => setTempSettings({ ...tempSettings, longBreakDuration: parseInt(e.target.value) || 15 })}
                      min={1}
                      max={60}
                      className="text-center"
                    />
                    <p className="text-[10px] text-muted-foreground text-center">{t('pomodoro.minutes')}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">{t('pomodoro.sessionsBeforeLongBreak')}</Label>
                  <Input
                    type="number"
                    value={tempSettings.sessionsBeforeLongBreak}
                    onChange={(e) => setTempSettings({ ...tempSettings, sessionsBeforeLongBreak: parseInt(e.target.value) || 4 })}
                    min={1}
                    max={10}
                  />
                </div>
              </div>

              {/* Automation Settings */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">{t('pomodoro.automation')}</h4>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    <span className="text-sm">{t('pomodoro.soundEnabled')}</span>
                  </div>
                  <Switch
                    checked={tempSettings.soundEnabled}
                    onCheckedChange={(checked) => setTempSettings({ ...tempSettings, soundEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm">{t('pomodoro.autoStartBreaks')}</span>
                  <Switch
                    checked={tempSettings.autoStartBreaks}
                    onCheckedChange={(checked) => setTempSettings({ ...tempSettings, autoStartBreaks: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm">{t('pomodoro.autoStartWork')}</span>
                  <Switch
                    checked={tempSettings.autoStartWork}
                    onCheckedChange={(checked) => setTempSettings({ ...tempSettings, autoStartWork: checked })}
                  />
                </div>
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
