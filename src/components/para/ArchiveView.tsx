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

function getTypeConfig(isAr: boolean): Record<
  ArchivedItem['type'],
  { label: string; icon: React.ComponentType<{ className?: string }>; bar: string; iconColor: string }
> {
  return {
    project:  { label: isAr ? 'مشروع' : 'Project',  icon: FolderKanban, bar: 'bg-blue-500',    iconColor: 'text-blue-500'    },
    area:     { label: isAr ? 'مجال'   : 'Area',     icon: Layers,       bar: 'bg-purple-500',  iconColor: 'text-purple-500'  },
    goal:     { label: isAr ? 'هدف'    : 'Goal',     icon: Target,       bar: 'bg-primary',     iconColor: 'text-primary'     },
    task:     { label: isAr ? 'مهمة'   : 'Task',     icon: CheckSquare,  bar: 'bg-green-500',   iconColor: 'text-green-500'   },
    resource: { label: isAr ? 'مورد'   : 'Resource', icon: Database,     bar: 'bg-cyan-500',    iconColor: 'text-cyan-500'    },
    customer: { label: isAr ? 'عميل'   : 'Customer', icon: Users,        bar: 'bg-pink-500',    iconColor: 'text-pink-500'    },
  };
}

export function ArchiveView() {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType]   = useState<ArchivedItem['type'] | 'all'>('all');
  const queryClient = useQueryClient();

  const typeConfig = getTypeConfig(isAr);

  const { data: archivedItems, isLoading } = useArchivedItems();

  const filteredItems = archivedItems?.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = activeType === 'all' || item.type === activeType;
    return matchesSearch && matchesType;
  });

  const groupedByType = filteredItems?.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<ArchivedItem['type'], ArchivedItem[]>);

  const RESTORE_MAP: Record<ArchivedItem['type'], { table: 'projects' | 'areas' | 'goals' | 'tasks' | 'resources' | 'customers'; data: Record<string, unknown> }> = {
    project:  { table: 'projects',  data: { para_category: 'project', archived_at: null } },
    area:     { table: 'areas',     data: { status: 'active', archived_at: null } },
    goal:     { table: 'goals',     data: { is_active: true, archived_at: null } },
    task:     { table: 'tasks',     data: { archived_at: null } },
    resource: { table: 'resources', data: { status: 'active', archived_at: null } },
    customer: { table: 'customers', data: { archived_at: null } },
  };

  const handleRestore = async (item: ArchivedItem) => {
    try {
      const { table: tableName, data: updateData } = RESTORE_MAP[item.type];

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', item.id);

      if (error) throw error;

      toast.success(isAr ? 'تم استعادة العنصر بنجاح' : 'Item restored successfully');
      queryClient.invalidateQueries({ queryKey: ['archived-items'] });
      queryClient.invalidateQueries({ queryKey: [tableName] });
    } catch {
      toast.error(isAr ? 'حدث خطأ في استعادة العنصر' : 'Error restoring item');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl bg-muted/40" />)}
      </div>
    );
  }

  const totalCount = archivedItems?.length ?? 0;
  const dateLocale = isAr ? ar : undefined;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{isAr ? 'الأرشيف' : 'Archive'}</h2>
          <p className="text-sm text-muted-foreground">{isAr ? 'جميع العناصر المؤرشفة من كافة أقسام النظام' : 'All archived items from every section of the system'}</p>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2 self-start sm:self-auto">
          <Archive className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{totalCount}</span>
          <span className="text-xs text-muted-foreground">{isAr ? 'عنصر' : 'items'}</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={isAr ? 'بحث في الأرشيف...' : 'Search archive...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pe-10 bg-muted/50 border-border/50"
        />
      </div>

      {/* Type filter pills */}
      <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setActiveType('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
            activeType === 'all'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted'
          }`}
        >
          {isAr ? 'الكل' : 'All'}
          <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeType === 'all' ? 'bg-white/20' : 'bg-muted'}`}>
            {totalCount}
          </span>
        </button>
        {(Object.entries(typeConfig) as [ArchivedItem['type'], typeof typeConfig[keyof typeof typeConfig]][]).map(([type, config]) => {
          const count = groupedByType?.[type]?.length ?? 0;
          if (count === 0) return null;
          return (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                activeType === type
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              <config.icon className="w-3.5 h-3.5" />
              {config.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeType === type ? 'bg-white/20' : 'bg-muted'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredItems?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-4">
            <Archive className="w-8 h-8 opacity-40" />
          </div>
          <p className="font-medium mb-1">{isAr ? 'لا توجد عناصر مؤرشفة' : 'No archived items'}</p>
          <p className="text-xs">{isAr ? 'العناصر التي تؤرشفها ستظهر هنا' : 'Items you archive will appear here'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredItems?.map((item) => {
            const config = typeConfig[item.type];
            const Icon = config.icon;
            return (
              <div
                key={`${item.type}-${item.id}`}
                className="glass-card relative overflow-hidden p-4 space-y-2.5 opacity-70 hover:opacity-100 transition-opacity duration-200"
              >
                {/* color bar */}
                <div className={`absolute top-0 inset-x-0 h-0.5 rounded-t-2xl ${config.bar}`} />

                <div className="flex items-start justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                      <Icon className={`w-5 h-5 ${config.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm line-clamp-1">{item.title}</p>
                      <Badge variant="outline" className="text-xs mt-0.5 py-0">{config.label}</Badge>
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
                        <RotateCcw className="w-4 h-4 me-2" />{isAr ? 'استعادة' : 'Restore'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.description}</p>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5 border-t border-border/30">
                  <span>{isAr ? 'مؤرشف' : 'Archived'}</span>
                  <span>{format(new Date(item.archived_at), 'dd MMM yyyy', { locale: dateLocale })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
