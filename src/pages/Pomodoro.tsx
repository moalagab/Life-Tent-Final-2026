import { MainLayout } from '@/components/layout/MainLayout';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Coffee, Brain, Volume2, VolumeX, Flame, Clock, Target, Timer, BarChart3, CheckSquare, X, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useTasks } from '@/hooks/useTasks';
import { useCreatePomodoroSession, usePomodoroStats, useTodaySessions, useWeeklySessions } from '@/hooks/usePomodoro';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

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
  const { t, isRTL } = useLanguage();
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('pomodoro-settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('timer');

  // Hooks
  const { data: tasks } = useTasks();
  const createSession = useCreatePomodoroSession();
  const stats = usePomodoroStats();
  const { data: todaySessions } = useTodaySessions();
  const { data: weeklySessions } = useWeeklySessions();

  const incompleteTasks = tasks?.filter(t => t.status !== 'done') || [];

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    
    // Save session to database
    createSession.mutate({
      task_id: selectedTaskId,
      session_type: sessionType,
      duration_minutes: sessionType === 'work' ? settings.workDuration : 
                        sessionType === 'shortBreak' ? settings.shortBreakDuration : 
                        settings.longBreakDuration,
      completed_at: new Date().toISOString(),
      notes: null,
    });
    
    if (sessionType === 'work') {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      const sessionsLimit = settings.sessionsBeforeLongBreak > 0 ? settings.sessionsBeforeLongBreak : 4;
      if (newCompletedSessions % sessionsLimit === 0) {
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

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(t('pomodoro.sessionComplete'), {
        body: sessionType === 'work' ? t('pomodoro.takeBreak') : t('pomodoro.backToWork'),
        icon: '/favicon.ico'
      });
    }
  }, [sessionType, completedSessions, settings, playSound, t, createSession, selectedTaskId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleSessionComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, handleSessionComplete]);

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
  const selectedTask = tasks?.find(t => t.id === selectedTaskId);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Timer className="w-4 h-4" />
            {t('pomodoro.title')}
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t('pomodoro.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('pomodoro.subtitle')}</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timer" className="gap-2">
              <Timer className="w-4 h-4" />
              {t('pomodoro.timer')}
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              {t('pomodoro.statistics')}
            </TabsTrigger>
          </TabsList>

          {/* Timer Tab */}
          <TabsContent value="timer" className="mt-6">
            {/* Task Selection */}
            <div className="glass-card p-4 mb-6">
              <Label className="flex items-center gap-2 mb-3">
                <CheckSquare className="w-4 h-4" />
                {t('pomodoro.linkToTask')}
              </Label>
              <div className="flex gap-2">
                <Select value={selectedTaskId || ''} onValueChange={(val) => setSelectedTaskId(val || null)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={t('pomodoro.selectTask')} />
                  </SelectTrigger>
                  <SelectContent>
                    {incompleteTasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'w-2 h-2 rounded-full',
                            task.priority === 'high' ? 'bg-destructive' :
                            task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                          )} />
                          {task.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTaskId && (
                  <Button variant="ghost" size="icon" onClick={() => setSelectedTaskId(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {selectedTask && (
                <p className="text-xs text-muted-foreground mt-2">
                  {t('pomodoro.focusingOn')}: {selectedTask.title}
                </p>
              )}
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

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-card p-5 text-center group hover:border-primary/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Flame className="w-6 h-6 text-primary" />
                </div>
                <p className="text-3xl font-bold text-foreground">{stats.todaySessions}</p>
                <p className="text-xs text-muted-foreground">{t('pomodoro.todaySessions')}</p>
              </div>
              
              <div className="glass-card p-5 text-center group hover:border-emerald-500/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {Math.floor(stats.todayMinutes / 60)}h {stats.todayMinutes % 60}m
                </p>
                <p className="text-xs text-muted-foreground">{t('pomodoro.todayFocusTime')}</p>
              </div>
              
              <div className="glass-card p-5 text-center group hover:border-blue-500/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {(() => { const n = settings.sessionsBeforeLongBreak > 0 ? settings.sessionsBeforeLongBreak : 4; return n - (completedSessions % n); })()}
                </p>
                <p className="text-xs text-muted-foreground">{t('pomodoro.untilLongBreak')}</p>
              </div>
            </div>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="mt-6 space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Flame className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.totalSessions}</p>
                <p className="text-xs text-muted-foreground">{t('pomodoro.totalSessions')}</p>
              </div>
              
              <div className="glass-card p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {Math.floor(stats.totalMinutes / 60)}h
                </p>
                <p className="text-xs text-muted-foreground">{t('pomodoro.totalHours')}</p>
              </div>
              
              <div className="glass-card p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.weeklySessions}</p>
                <p className="text-xs text-muted-foreground">{t('pomodoro.thisWeek')}</p>
              </div>
              
              <div className="glass-card p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.weeklySessions > 0 ? Math.round(stats.weeklyMinutes / stats.weeklySessions) : 0}m
                </p>
                <p className="text-xs text-muted-foreground">{t('pomodoro.avgSession')}</p>
              </div>
            </div>

            {/* Weekly Chart */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                {t('pomodoro.weeklyActivity')}
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.dailyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="day" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      label={{ value: t('pomodoro.minutes'), angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number, name: string) => [
                        `${value} ${t('pomodoro.minutes')}`,
                        t('pomodoro.focusTime')
                      ]}
                    />
                    <Bar 
                      dataKey="minutes" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sessions Chart */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                {t('pomodoro.sessionsTrend')}
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.dailyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="day" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value} ${t('pomodoro.sessions')}`, '']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sessions" 
                      stroke="hsl(142.1 76.2% 36.3%)"
                      fill="hsl(142.1 76.2% 36.3% / 0.2)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Sessions */}
            {todaySessions && todaySessions.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  {t('pomodoro.recentSessions')}
                </h3>
                <div className="space-y-3">
                  {todaySessions.slice(0, 5).map((session) => {
                    const task = tasks?.find(t => t.id === session.task_id);
                    return (
                      <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center',
                            session.session_type === 'work' ? 'bg-primary/10' :
                            session.session_type === 'shortBreak' ? 'bg-emerald-500/10' : 'bg-blue-500/10'
                          )}>
                            {session.session_type === 'work' ? (
                              <Brain className={cn('w-4 h-4', 'text-primary')} />
                            ) : (
                              <Coffee className={cn('w-4 h-4', 
                                session.session_type === 'shortBreak' ? 'text-emerald-500' : 'text-blue-500'
                              )} />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {t(`pomodoro.${session.session_type}`)}
                            </p>
                            {task && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <CheckSquare className="w-3 h-3" />
                                {task.title}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-end">
                          <p className="text-sm font-medium text-foreground">
                            {session.duration_minutes}m
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

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

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">{t('pomodoro.automation')}</h4>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    {tempSettings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
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
