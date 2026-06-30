import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, X, CheckSquare, FolderKanban, Target, FileText,
  Wallet, Flame, Calendar, BookOpen, Loader2,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCreateTask } from '@/hooks/useTasks';
import { useCreateProject } from '@/hooks/useProjects';
import { useCreateGoal } from '@/hooks/useGoals';
import { useCreateHabit } from '@/hooks/useHabits';
import { useCreateResource } from '@/hooks/useResources';
import { useCreateEvent } from '@/hooks/useEvents';
import { useProjects } from '@/hooks/useProjects';
import { useActiveAreas } from '@/hooks/useAreas';

type ObjType = 'task' | 'project' | 'goal' | 'note' | 'finance' | 'habit' | 'event' | 'resource';

const TYPES = [
  { type: 'task'     as ObjType, ar: 'مهمة',   en: 'Task',     icon: CheckSquare,  from: 'from-blue-500',    to: 'to-blue-600'     },
  { type: 'project'  as ObjType, ar: 'مشروع',  en: 'Project',  icon: FolderKanban, from: 'from-green-500',   to: 'to-emerald-600'  },
  { type: 'goal'     as ObjType, ar: 'هدف',    en: 'Goal',     icon: Target,       from: 'from-purple-500',  to: 'to-violet-600'   },
  { type: 'note'     as ObjType, ar: 'ملاحظة', en: 'Note',     icon: FileText,     from: 'from-amber-500',   to: 'to-orange-500'   },
  { type: 'finance'  as ObjType, ar: 'معاملة', en: 'Finance',  icon: Wallet,       from: 'from-emerald-500', to: 'to-teal-600'     },
  { type: 'habit'    as ObjType, ar: 'عادة',   en: 'Habit',    icon: Flame,        from: 'from-orange-500',  to: 'to-red-500'      },
  { type: 'event'    as ObjType, ar: 'حدث',    en: 'Event',    icon: Calendar,     from: 'from-cyan-500',    to: 'to-blue-500'     },
  { type: 'resource' as ObjType, ar: 'مورد',   en: 'Resource', icon: BookOpen,     from: 'from-pink-500',    to: 'to-rose-500'     },
] as const;

export function UniversalFAB() {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'select' | 'form'>('select');
  const [selectedType, setSelectedType] = useState<ObjType | null>(null);
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [habitIcon, setHabitIcon] = useState('✨');
  const [isPending, setIsPending] = useState(false);

  const createTask = useCreateTask();
  const createProject = useCreateProject();
  const createGoal = useCreateGoal();
  const createHabit = useCreateHabit();
  const createResource = useCreateResource();
  const createEvent = useCreateEvent();
  const { data: projects } = useProjects();
  const { data: areas } = useActiveAreas();

  const reset = () => {
    setStep('select');
    setSelectedType(null);
    setTitle('');
    setProjectId('');
    setAreaId('');
    setHabitIcon('✨');
    setIsPending(false);
  };

  const handleClose = () => { setOpen(false); reset(); };

  const handleSelectType = (type: ObjType) => {
    if (type === 'finance') {
      navigate('/finance?new=1');
      handleClose();
      return;
    }
    setSelectedType(type);
    setStep('form');
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setIsPending(true);
    try {
      let createdId: string | undefined;
      const cleanTitle = title.trim();

      switch (selectedType) {
        case 'task': {
          const data = await createTask.mutateAsync({
            title: cleanTitle,
            status: 'todo',
            priority: 'medium',
            ...(projectId && projectId !== 'none' ? { project_id: projectId } : {}),
          });
          createdId = data?.id;
          break;
        }
        case 'project': {
          const data = await createProject.mutateAsync({
            title: cleanTitle,
            status: 'planning',
            ...(areaId && areaId !== 'none' ? { area_id: areaId } : {}),
          });
          createdId = data?.id;
          break;
        }
        case 'goal': {
          const data = await createGoal.mutateAsync({
            title: cleanTitle,
            perspective: 'personal',
            is_active: true,
            ...(projectId && projectId !== 'none' ? { project_id: projectId } : {}),
          });
          createdId = data?.id;
          break;
        }
        case 'note': {
          const data = await createResource.mutateAsync({
            title: cleanTitle,
            type: 'note',
            status: 'active',
            ...(projectId && projectId !== 'none' ? { project_id: projectId } : {}),
            ...(areaId && areaId !== 'none' ? { area_id: areaId } : {}),
          });
          createdId = data?.id;
          break;
        }
        case 'habit': {
          const data = await createHabit.mutateAsync({
            name: cleanTitle,
            icon: habitIcon,
            frequency: 'daily',
            target_count: 1,
            is_active: true,
          });
          createdId = data?.id;
          break;
        }
        case 'event': {
          const start = new Date();
          start.setHours(start.getHours() + 1, 0, 0, 0);
          const end = new Date(start);
          end.setHours(end.getHours() + 1);
          await createEvent.mutateAsync({
            title: cleanTitle,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
          });
          break;
        }
        case 'resource': {
          const data = await createResource.mutateAsync({
            title: cleanTitle,
            type: 'document',
            status: 'active',
            ...(projectId && projectId !== 'none' ? { project_id: projectId } : {}),
            ...(areaId && areaId !== 'none' ? { area_id: areaId } : {}),
          });
          createdId = data?.id;
          break;
        }
      }

      const typeConf = TYPES.find(t => t.type === selectedType);
      toast.success(isAr ? `تم إنشاء ${typeConf?.ar}` : `${typeConf?.en} created`, {
        action: createdId && selectedType !== 'event' ? {
          label: isAr ? 'عرض' : 'View',
          onClick: () => {
            const routes: Partial<Record<ObjType, string>> = {
              project:  `/projects/${createdId}`,
              goal:     `/goals/${createdId}`,
              note:     `/resources/${createdId}`,
              habit:    `/habits/${createdId}`,
              resource: `/resources/${createdId}`,
            };
            const route = routes[selectedType!];
            if (route) navigate(route);
          },
        } : undefined,
      });

      handleClose();
    } catch {
      toast.error(isAr ? 'حدث خطأ، حاول مجدداً' : 'Something went wrong');
    } finally {
      setIsPending(false);
    }
  };

  const selectedConf = TYPES.find(t => t.type === selectedType);
  const SelectedIcon = selectedConf?.icon ?? Plus;

  const showProjectLink = ['task', 'goal', 'note', 'resource'].includes(selectedType ?? '');
  const showAreaLink    = ['project', 'note', 'resource'].includes(selectedType ?? '');

  return (
    <>
      {/* FAB button */}
      <button
        onClick={() => setOpen(true)}
        aria-label={isAr ? 'إنشاء جديد' : 'Create new'}
        className={cn(
          'fixed end-4 z-[45] w-14 h-14 rounded-2xl shadow-xl',
          'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground',
          'hover:scale-105 active:scale-95 hover:shadow-2xl hover:shadow-primary/30',
          'transition-all duration-200 flex items-center justify-center',
          'md:bottom-6 md:end-6',
        )}
        style={{
          bottom: isMobile
            ? 'calc(49px + env(safe-area-inset-bottom, 0px) + 14px)'
            : '24px',
        }}
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      {/* Sheet */}
      <Sheet open={open} onOpenChange={v => { if (!v) handleClose(); }}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
          {/* Handle bar */}
          <div className="w-10 h-1.5 bg-muted-foreground/20 rounded-full mx-auto mb-5 mt-1" />

          {step === 'select' ? (
            <>
              <SheetHeader className="mb-5 px-0">
                <SheetTitle className="text-base font-bold text-start">
                  {isAr ? 'ماذا تريد أن تُنشئ؟' : 'What do you want to create?'}
                </SheetTitle>
              </SheetHeader>

              <div className="grid grid-cols-4 gap-3 pb-6">
                {TYPES.map(cfg => {
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={cfg.type}
                      onClick={() => handleSelectType(cfg.type)}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-muted/30 hover:bg-muted/60 active:scale-95 transition-all"
                    >
                      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br', cfg.from, cfg.to)}>
                        <Icon className="w-5 h-5 text-white" strokeWidth={1.75} />
                      </div>
                      <span className="text-[11px] font-semibold text-foreground/80 text-center leading-tight">
                        {isAr ? cfg.ar : cfg.en}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <SheetHeader className="mb-5 px-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => setStep('select')} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br', selectedConf?.from, selectedConf?.to)}>
                    <SelectedIcon className="w-4 h-4 text-white" />
                  </div>
                  <SheetTitle className="text-base font-bold">
                    {isAr ? `إنشاء ${selectedConf?.ar}` : `New ${selectedConf?.en}`}
                  </SheetTitle>
                </div>
              </SheetHeader>

              <div className="space-y-4 pb-8">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-muted-foreground">
                    {selectedType === 'habit' ? (isAr ? 'اسم العادة' : 'Habit name') : (isAr ? 'العنوان' : 'Title')}
                  </Label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder={isAr ? 'اكتب هنا...' : 'Enter title...'}
                    dir="auto"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleCreate(); }}
                    className="bg-muted/40 border-border/60 text-base h-11"
                  />
                </div>

                {selectedType === 'habit' && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-muted-foreground">{isAr ? 'الرمز' : 'Icon'}</Label>
                    <Input
                      value={habitIcon}
                      onChange={e => setHabitIcon(e.target.value.slice(0, 2))}
                      className="bg-muted/40 w-16 text-center text-2xl h-11"
                      maxLength={2}
                    />
                  </div>
                )}

                {showProjectLink && projects && projects.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-muted-foreground">{isAr ? 'ربط بمشروع' : 'Link to project'}</Label>
                    <Select value={projectId} onValueChange={setProjectId}>
                      <SelectTrigger className="bg-muted/40 h-11">
                        <SelectValue placeholder={isAr ? 'اختياري' : 'Optional'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{isAr ? 'بدون ربط' : 'None'}</SelectItem>
                        {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {showAreaLink && areas && areas.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-muted-foreground">{isAr ? 'ربط بمجال' : 'Link to area'}</Label>
                    <Select value={areaId} onValueChange={setAreaId}>
                      <SelectTrigger className="bg-muted/40 h-11">
                        <SelectValue placeholder={isAr ? 'اختياري' : 'Optional'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{isAr ? 'بدون ربط' : 'None'}</SelectItem>
                        {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  onClick={handleCreate}
                  disabled={!title.trim() || isPending}
                  className="w-full h-11 text-base font-semibold"
                >
                  {isPending
                    ? <Loader2 className="w-4 h-4 animate-spin me-2" />
                    : <Plus className="w-4 h-4 me-2" />
                  }
                  {isAr ? 'إنشاء' : 'Create'}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
