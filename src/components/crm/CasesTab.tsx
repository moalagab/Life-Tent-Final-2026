import { useState } from 'react';
import { Plus, Search, AlertCircle, Clock, CheckCircle2, MoreVertical, Trash2, Edit, Briefcase, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/hooks/useLanguage';
import { useCustomerCases, useDeleteCase, CustomerCase, CaseStatus, CasePriority } from '@/hooks/useCRM';
import { CaseFormDialog } from './CaseFormDialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const statusConfig: Record<CaseStatus, { label: string; labelAr: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'Open', labelAr: 'مفتوحة', icon: AlertCircle, variant: 'destructive' },
  in_progress: { label: 'In Progress', labelAr: 'قيد التنفيذ', icon: Clock, variant: 'default' },
  pending: { label: 'Pending', labelAr: 'معلقة', icon: Clock, variant: 'secondary' },
  resolved: { label: 'Resolved', labelAr: 'محلولة', icon: CheckCircle2, variant: 'outline' },
  closed: { label: 'Closed', labelAr: 'مغلقة', icon: CheckCircle2, variant: 'secondary' },
};

const priorityConfig: Record<CasePriority, { label: string; labelAr: string; color: string }> = {
  low: { label: 'Low', labelAr: 'منخفضة', color: 'bg-green-500' },
  medium: { label: 'Medium', labelAr: 'متوسطة', color: 'bg-primary/80' },
  high: { label: 'High', labelAr: 'عالية', color: 'bg-orange-500' },
  urgent: { label: 'Urgent', labelAr: 'عاجلة', color: 'bg-red-500' },
};

export function CasesTab() {
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === 'ar';
  const { data: cases, isLoading } = useCustomerCases();
  const deleteCase = useDeleteCase();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<CustomerCase | null>(null);

  const filteredCases = cases?.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleDelete = async (id: string) => {
    try {
      await deleteCase.mutateAsync(id);
      toast.success(isRTL ? 'تم حذف الحالة' : 'Case deleted');
    } catch {
      toast.error(isRTL ? 'حدث خطأ' : 'Error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRTL ? 'بحث عن حالة...' : 'Search cases...'}
            className="pl-10"
          />
        </div>
        <Button onClick={() => { setEditingCase(null); setIsFormOpen(true); }}>
          <Plus className="w-4 h-4 me-2" />
          {isRTL ? 'حالة جديدة' : 'New Case'}
        </Button>
      </div>

      {filteredCases.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">{isRTL ? 'لا يوجد حالات' : 'No cases yet'}</p>
          <Button variant="outline" className="mt-4" onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 me-2" />
            {isRTL ? 'أضف أول حالة' : 'Add first case'}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCases.map((caseItem) => {
            const StatusIcon = statusConfig[caseItem.status].icon;
            return (
              <Card key={caseItem.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-2 h-2 rounded-full ${priorityConfig[caseItem.priority].color}`} />
                        <h3 className="font-semibold">{caseItem.title}</h3>
                        <Badge variant={statusConfig[caseItem.status].variant} className="flex items-center gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {isRTL ? statusConfig[caseItem.status].labelAr : statusConfig[caseItem.status].label}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {caseItem.customer && (
                          <span>{isRTL ? 'العميل:' : 'Customer:'} {caseItem.customer.name}</span>
                        )}
                        {caseItem.due_date && (
                          <span>
                            {isRTL ? 'موعد التسليم:' : 'Due:'} {format(new Date(caseItem.due_date), 'PP', { locale: isRTL ? ar : undefined })}
                          </span>
                        )}
                      </div>
                      
                      {caseItem.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{caseItem.description}</p>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingCase(caseItem); setIsFormOpen(true); }}>
                          <Edit className="w-4 h-4 me-2" />
                          {isRTL ? 'تعديل' : 'Edit'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(caseItem.id)}>
                          <Trash2 className="w-4 h-4 me-2" />
                          {isRTL ? 'حذف' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CaseFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        caseData={editingCase}
      />
    </div>
  );
}
