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

interface ProjectTasksTabProps {
  projectId: string;
}

const statusOptions = [
  { value: 'all', label: 'الكل' },
  { value: 'todo', label: 'للعمل' },
  { value: 'in_progress', label: 'قيد التنفيذ' },
  { value: 'done', label: 'مكتمل' },
];

const priorityOptions = [
  { value: 'all', label: 'الكل' },
  { value: 'high', label: 'عالي', color: 'bg-red-500' },
  { value: 'medium', label: 'متوسط', color: 'bg-amber-500' },
  { value: 'low', label: 'منخفض', color: 'bg-green-500' },
];

export function ProjectTasksTab({ projectId }: ProjectTasksTabProps) {
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
      toast.success(`تم تنفيذ العملية على ${selectedTasks.length} مهام`);
      setSelectedTasks([]);
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('العنوان مطلوب');
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
      toast.success('تم إنشاء المهمة');
      setIsCreateOpen(false);
      setNewTask({ title: '', description: '', priority: 'medium', kr_id: '' });
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    try {
      await updateTask.mutateAsync({ id: taskId, status: status as any });
      toast.success('تم تحديث الحالة');
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const getKrTitle = (krId: string | null) => {
    if (!krId || !keyResults) return null;
    const kr = keyResults.find((k: any) => k.id === krId);
    return kr?.title;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">جارٍ التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="الأولوية" />
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
          مهمة جديدة
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedTasks.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">تم تحديد {selectedTasks.length} مهام</span>
          <Button size="sm" variant="outline" onClick={() => handleBulkAction('complete')}>
            <CheckSquare className="w-4 h-4 ml-1" />
            إكمال
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkAction('archive')}>
            <Archive className="w-4 h-4 ml-1" />
            أرشفة
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
            <Trash2 className="w-4 h-4 ml-1" />
            حذف
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
            <span className="text-sm text-muted-foreground">تحديد الكل</span>
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
                        <SelectItem value="todo">للعمل</SelectItem>
                        <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                        <SelectItem value="done">مكتمل</SelectItem>
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
                          حذف
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
            <p>لا توجد مهام</p>
          </div>
        )}
      </div>

      {/* Create Task Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>مهمة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>العنوان</Label>
              <Input
                dir="auto"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="عنوان المهمة..."
              />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea
                dir="auto"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="وصف المهمة..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الأولوية</Label>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">عالي</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="low">منخفض</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ربط بـ KR</Label>
                <Select value={newTask.kr_id || 'none'} onValueChange={(v) => setNewTask({ ...newTask, kr_id: v === 'none' ? '' : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختياري" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون</SelectItem>
                    {keyResults?.map((kr: any) => (
                      <SelectItem key={kr.id} value={kr.id}>{kr.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>إلغاء</Button>
              <Button onClick={handleCreateTask} disabled={createTask.isPending}>إنشاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
