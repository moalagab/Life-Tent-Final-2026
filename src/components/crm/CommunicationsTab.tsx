import { useState } from 'react';
import { Plus, Search, Phone, Mail, Calendar, MessageSquare, FileText, MoreVertical, Trash2, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/hooks/useLanguage';
import { useCustomerCommunications, useDeleteCommunication, CustomerCommunication, CommunicationType } from '@/hooks/useCRM';
import { CommunicationFormDialog } from './CommunicationFormDialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const typeConfig: Record<CommunicationType, { label: string; labelAr: string; icon: React.ElementType; color: string }> = {
  call: { label: 'Call', labelAr: 'مكالمة', icon: Phone, color: 'bg-green-500' },
  email: { label: 'Email', labelAr: 'بريد', icon: Mail, color: 'bg-blue-500' },
  meeting: { label: 'Meeting', labelAr: 'اجتماع', icon: Calendar, color: 'bg-purple-500' },
  note: { label: 'Note', labelAr: 'ملاحظة', icon: FileText, color: 'bg-yellow-500' },
  message: { label: 'Message', labelAr: 'رسالة', icon: MessageSquare, color: 'bg-pink-500' },
};

export function CommunicationsTab() {
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === 'ar';
  const { data: communications, isLoading } = useCustomerCommunications();
  const deleteCommunication = useDeleteCommunication();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const filteredCommunications = communications?.filter((c) =>
    c.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleDelete = async (id: string) => {
    try {
      await deleteCommunication.mutateAsync(id);
      toast.success(isRTL ? 'تم حذف السجل' : 'Communication deleted');
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
            placeholder={isRTL ? 'بحث في سجل التواصل...' : 'Search communications...'}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 me-2" />
          {isRTL ? 'تسجيل تواصل' : 'Log Communication'}
        </Button>
      </div>

      {filteredCommunications.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">{isRTL ? 'لا يوجد سجلات تواصل' : 'No communications logged'}</p>
          <Button variant="outline" className="mt-4" onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 me-2" />
            {isRTL ? 'سجل أول تواصل' : 'Log first communication'}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCommunications.map((comm) => {
            const TypeIcon = typeConfig[comm.type].icon;
            return (
              <Card key={comm.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full ${typeConfig[comm.type].color} flex items-center justify-center text-white flex-shrink-0`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">
                            {isRTL ? typeConfig[comm.type].labelAr : typeConfig[comm.type].label}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(comm.contact_date), 'PPp', { locale: isRTL ? ar : undefined })}
                          </span>
                        </div>
                        
                        {comm.subject && (
                          <h4 className="font-medium mb-1">{comm.subject}</h4>
                        )}
                        
                        {comm.customer && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <User className="w-3 h-3" />
                            <span>{comm.customer.name}</span>
                          </div>
                        )}
                        
                        {comm.content && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{comm.content}</p>
                        )}
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(comm.id)}>
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

      <CommunicationFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </div>
  );
}
