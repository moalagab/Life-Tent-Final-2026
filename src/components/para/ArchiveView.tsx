import React, { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useArchivedItems, ArchivedItem } from '@/hooks/useArchive';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Archive, RotateCcw, FolderKanban, Layers, Target, CheckSquare, Database, Users, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

 
const typeConfig: Record<ArchivedItem['type'], { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  project: { label: 'مشروع', icon: FolderKanban, color: 'bg-blue-500' },
  area: { label: 'مجال', icon: Layers, color: 'bg-purple-500' },
  goal: { label: 'هدف', icon: Target, color: 'bg-primary/80' },
  task: { label: 'مهمة', icon: CheckSquare, color: 'bg-green-500' },
  resource: { label: 'مورد', icon: Database, color: 'bg-cyan-500' },
  customer: { label: 'عميل', icon: Users, color: 'bg-pink-500' },
};

export function ArchiveView() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<ArchivedItem['type'] | 'all'>('all');
  const queryClient = useQueryClient();

  const { data: archivedItems, isLoading } = useArchivedItems();

  const filteredItems = archivedItems?.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = activeType === 'all' || item.type === activeType;
    return matchesSearch && matchesType;
  });

  const handleRestore = async (item: ArchivedItem) => {
    try {
      let tableName = '';
      let updateData: Record<string, unknown> = {};

      switch (item.type) {
        case 'project':
          tableName = 'projects';
          updateData = { para_category: 'project', archived_at: null };
          break;
        case 'area':
          tableName = 'areas';
          updateData = { status: 'active', archived_at: null };
          break;
        case 'goal':
          tableName = 'goals';
          updateData = { is_active: true, archived_at: null };
          break;
        case 'task':
          tableName = 'tasks';
          updateData = { archived_at: null };
          break;
        case 'resource':
          tableName = 'resources';
          updateData = { status: 'active', archived_at: null };
          break;
        case 'customer':
          tableName = 'customers';
          updateData = { archived_at: null };
          break;
      }

      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName as any)
        .update(updateData)
        .eq('id', item.id);

      if (error) throw error;

      toast.success('تم استعادة العنصر بنجاح');
      queryClient.invalidateQueries({ queryKey: ['archived-items'] });
      queryClient.invalidateQueries({ queryKey: [tableName] });
    } catch (error) {
      toast.error('حدث خطأ في استعادة العنصر');
    }
  };

  const groupedByType = filteredItems?.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<ArchivedItem['type'], ArchivedItem[]>);

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">جارٍ التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">الأرشيف (Archive)</h2>
          <p className="text-muted-foreground">جميع العناصر المؤرشفة من كافة أقسام النظام</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Archive className="w-4 h-4 ml-2" />
          {archivedItems?.length || 0} عنصر
        </Badge>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="بحث في الأرشيف..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Type filter pills */}
      <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveType('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
            activeType === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
          }`}
        >
          الكل
          <span className="bg-white/20 px-1 rounded-full">{archivedItems?.length || 0}</span>
        </button>
        {Object.entries(typeConfig).map(([type, config]) => {
          const count = groupedByType?.[type as ArchivedItem['type']]?.length || 0;
          if (count === 0) return null;
          return (
            <button
              key={type}
              onClick={() => setActiveType(type as ArchivedItem['type'])}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                activeType === type ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              <config.icon className="w-3.5 h-3.5" />
              {config.label}
              <span className="bg-white/20 px-1 rounded-full">{count}</span>
            </button>
          );
        })}
      </div>

      {filteredItems?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Archive className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>لا توجد عناصر مؤرشفة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems?.map((item) => {
            const config = typeConfig[item.type];
            const Icon = config.icon;
            return (
              <div
                key={`${item.type}-${item.id}`}
                className="rounded-2xl border border-border/50 bg-card/50 p-4 space-y-2 relative overflow-hidden opacity-75 hover:opacity-100 transition-opacity"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${config.color}`} />
                <div className="flex items-start justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-muted/60`}>
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm line-clamp-1">{item.title}</p>
                      <Badge variant="outline" className="text-xs mt-0.5">{config.label}</Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRestore(item)}>
                        <RotateCcw className="w-4 h-4 ml-2" />
                        استعادة
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>تمت الأرشفة</span>
                  <span>{format(new Date(item.archived_at), 'dd MMM yyyy', { locale: ar })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
