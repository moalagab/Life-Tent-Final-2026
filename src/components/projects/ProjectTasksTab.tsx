import { useState, useMemo } from 'react';
import { useTasks, useUpdateTask, useDeleteTask, useCreateTask, Task } from '@/hooks/useTasks';
import { useKeyResults } from '@/hooks/useGoals';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, MoreVertical, Filter, CheckSquare, Trash2, Archive, Target, Calendar, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';

interface ProjectTasksTabProps {
  projectId: string;
}

export function ProjectTasksTab({ projectId }: ProjectTasksTabProps) {
  const { currentLanguage } = useLanguage();

  const statusOptions = [
    { value: 'all', label: currentLanguage === 'ar' ? 'الكل' : 'All' },
    { value: 'todo', label: currentLanguage === 'ar' ? 'للعمل' : 'To Do' },
    { value: 'in_progress', label: currentLanguage === 'ar' ? 'قيد التنفيذ' : 'In Progress' },
    { value: 'done', label: currentLanguage === 'ar' ? 'مكتمل' : 'Done' },
  ];

  const priorityOptions = [
    { value: 'all', label: currentLanguage === 'ar' ? 'الكل' : 'All' },
    { value: 'high', label: currentLanguage === 'ar' ? 'عالي' : 'High', color: 'bg-red-500' },
    { value: 'medium', label: currentLanguage === 'ar' ? 'متوسط' : 'Medium', color: 'bg-primary/80' },
    { value: 'low', label: currentLanguage === 'ar' ? 'منخفض' : 'Low', color: 'bg-green-500' },
  ];
  const { data: allTasks, isLoading } = useTasks();
  const { data: keyResults } = useKeyResults();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', kr_id: '' });

  // Filter tasks for this project
  const projectTasks = useMemo(() => {
    if (!allTasks) return [];
     
    return allTasks.filter((task: any) => task.project_id === projectId);
  }, [allTasks, projectId]);

  // Apply filters
  const filteredTasks = useMemo(() => {
     
    return projectTasks.filter((task: any) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      return true;
    });
  }, [projectTasks, statusFilter, priorityFilter]);

  const handleToggleSelect = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTasks.length === filteredTasks.length) {
      setSelectedTasks([]);
    } else {
       
      setSelectedTasks(filteredTasks.map((t: any) => t.id));
    }
  };

  const handleBulkAction = async (action: 'complete' | 'archive' | 'delete') => {
    try {
      for (const taskId of selectedTasks) {
        if (action === 'complete') {
          await updateTask.mutateAsync({ id: taskId, status: 'done' });
        } else if (action === 'archive') {
           
          await updateTask.mutateAsync({ id: taskId, archived_at: new Date().toISOString() } as any);
        } else if (action === 'delete') {
          await deleteTask.mutateAsync(taskId);
        }
      }
      toast.success(currentLanguage === 'ar' ? `تم تنفيذ العملية على ${selectedTasks.length} مهام` : `Action applied to ${selectedTasks.length} tasks`);
      setSelectedTasks([]);
    } catch (error) {
      toast.error(currentLanguage === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast.error(currentLanguage === 'ar' ? 'العنوان مطلوب' : 'Title is required');
      return;
    }

    try {
      await createTask.mutateAsync({
        title: newTask.title,
        description: newTask.description || null,

        priority: newTask.priority as any,
        project_id: projectId,
        kr_id: newTask.kr_id || null,
        status: 'todo',

      } as any);
      toast.success(currentLanguage === 'ar' ? 'تم إنشاء المهمة' : 'Task created');
      setIsCreateOpen(false);
      setNewTask({ title: '', description: '', priority: 'medium', kr_id: '' });
    } catch (error) {
      toast.error(currentLanguage === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    try {

      await updateTask.mutateAsync({ id: taskId, status: status as any });
      toast.success(currentLanguage === 'ar' ? 'تم تحديث الحالة' : 'Status updated');
    } catch (error) {
      toast.error(currentLanguage === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const getKrTitle = (krId: string | null) => {
    if (!krId || !keyResults) return null;
     
    const kr = keyResults.find((k: any) => k.id === krId);
    return kr?.title;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">{currentLanguage === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder={currentLanguage === 'ar' ? 'الحالة' : 'Status'} />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder={currentLanguage === 'ar' ? 'الأولوية' : 'Priority'} />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-gradient-gold text-primary-foreground">
          <Plus className="w-4 h-4 ml-2" />
          {currentLanguage === 'ar' ? 'مهمة جديدة' : 'New Task'}
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedTasks.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">{currentLanguage === 'ar' ? `تم تحديد ${selectedTasks.length} مهام` : `${selectedTasks.length} tasks selected`}</span>
          <Button size="sm" variant="outline" onClick={() => handleBulkAction('complete')}>
            <CheckSquare className="w-4 h-4 ml-1" />
            {currentLanguage === 'ar' ? 'إكمال' : 'Complete'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkAction('archive')}>
            <Archive className="w-4 h-4 ml-1" />
            {currentLanguage === 'ar' ? 'أرشفة' : 'Archive'}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
            <Trash2 className="w-4 h-4 ml-1" />
            {currentLanguage === 'ar' ? 'حذف' : 'Delete'}
          </Button>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-2">
        {filteredTasks.length > 0 && (
          <div className="flex items-center gap-2 px-2">
            <Checkbox 
              checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">{currentLanguage === 'ar' ? 'تحديد الكل' : 'Select All'}</span>
          </div>
        )}

        {filteredTasks.map((task: any) => {
          const krTitle = getKrTitle(task.kr_id);
          return (
            <Card key={task.id} className={`transition-all ${task.status === 'done' ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox 
                    checked={selectedTasks.includes(task.id)}
                    onCheckedChange={() => handleToggleSelect(task.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </h4>
                      <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}>
                        {priorityOptions.find(p => p.value === task.priority)?.label}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {krTitle && (
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {krTitle}
                        </span>
                      )}
                      {task.due_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(task.due_at), 'dd MMM', { locale: ar })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={task.status} onValueChange={(v) => handleStatusChange(task.id, v)}>
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">{currentLanguage === 'ar' ? 'للعمل' : 'To Do'}</SelectItem>
                        <SelectItem value="in_progress">{currentLanguage === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</SelectItem>
                        <SelectItem value="done">{currentLanguage === 'ar' ? 'مكتمل' : 'Done'}</SelectItem>
                      </SelectContent>
                    </Select>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => deleteTask.mutateAsync(task.id)}>
                          <Trash2 className="w-4 h-4 ml-2" />
                          {currentLanguage === 'ar' ? 'حذف' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{currentLanguage === 'ar' ? 'لا توجد مهام' : 'No tasks found'}</p>
          </div>
        )}
      </div>

      {/* Create Task Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{currentLanguage === 'ar' ? 'مهمة جديدة' : 'New Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{currentLanguage === 'ar' ? 'العنوان' : 'Title'}</Label>
              <Input
                dir="auto"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder={currentLanguage === 'ar' ? 'عنوان المهمة...' : 'Task title...'}
              />
            </div>
            <div>
              <Label>{currentLanguage === 'ar' ? 'الوصف' : 'Description'}</Label>
              <Textarea
                dir="auto"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder={currentLanguage === 'ar' ? 'وصف المهمة...' : 'Task description...'}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{currentLanguage === 'ar' ? 'الأولوية' : 'Priority'}</Label>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">{currentLanguage === 'ar' ? 'عالي' : 'High'}</SelectItem>
                    <SelectItem value="medium">{currentLanguage === 'ar' ? 'متوسط' : 'Medium'}</SelectItem>
                    <SelectItem value="low">{currentLanguage === 'ar' ? 'منخفض' : 'Low'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{currentLanguage === 'ar' ? 'ربط بـ KR' : 'Link to KR'}</Label>
                <Select value={newTask.kr_id || 'none'} onValueChange={(v) => setNewTask({ ...newTask, kr_id: v === 'none' ? '' : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder={currentLanguage === 'ar' ? 'اختياري' : 'Optional'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{currentLanguage === 'ar' ? 'بدون' : 'None'}</SelectItem>
                    {keyResults?.map((kr: any) => (
                      <SelectItem key={kr.id} value={kr.id}>{kr.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>{currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
              <Button onClick={handleCreateTask} disabled={createTask.isPending}>{currentLanguage === 'ar' ? 'إنشاء' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
