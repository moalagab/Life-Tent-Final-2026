import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { useCustomers, useUpdateCustomer, PIPELINE_STAGES, Customer } from '@/hooks/useCRM';
import { CustomerFormDialog } from './CustomerFormDialog';
import { Plus, User, Mail, Building2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function PipelineTab() {
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === 'ar';
  const { data: customers, isLoading } = useCustomers();
  const updateCustomer = useUpdateCustomer();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const getCustomersByStage = (stageId: string) => {
    return customers?.filter((c) => c.pipeline_stage === stageId) || [];
  };

  const moveCustomer = async (customer: Customer, direction: 'next' | 'prev') => {
    const currentIndex = PIPELINE_STAGES.findIndex((s) => s.id === customer.pipeline_stage);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (newIndex >= 0 && newIndex < PIPELINE_STAGES.length) {
      try {
        await updateCustomer.mutateAsync({
          id: customer.id,
          pipeline_stage: PIPELINE_STAGES[newIndex].id,
        });
        toast.success(isRTL ? 'تم نقل العميل' : 'Customer moved');
      } catch {
        toast.error(isRTL ? 'حدث خطأ' : 'Error occurred');
      }
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
      <div className="flex justify-end">
        <Button onClick={() => { setSelectedCustomer(null); setIsFormOpen(true); }}>
          <Plus className="w-4 h-4 me-2" />
          {isRTL ? 'عميل جديد' : 'New Customer'}
        </Button>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {PIPELINE_STAGES.map((stage) => {
            const stageCustomers = getCustomersByStage(stage.id);
            const stageIndex = PIPELINE_STAGES.findIndex((s) => s.id === stage.id);
            
            return (
              <Card key={stage.id} className="w-72 flex-shrink-0">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                      {isRTL ? stage.label : stage.labelEn}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {stageCustomers.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-2 pb-2 space-y-2 max-h-96 overflow-y-auto">
                  {stageCustomers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {isRTL ? 'لا يوجد عملاء' : 'No customers'}
                    </div>
                  ) : (
                    stageCustomers.map((customer) => (
                      <Card 
                        key={customer.id} 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => { setSelectedCustomer(customer); setIsFormOpen(true); }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="w-3 h-3 text-muted-foreground" />
                                <span className="font-medium text-sm truncate">{customer.name}</span>
                              </div>
                              {customer.company && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Building2 className="w-3 h-3" />
                                  <span className="truncate">{customer.company}</span>
                                </div>
                              )}
                              {customer.email && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate">{customer.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3 pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              disabled={stageIndex === 0}
                              onClick={(e) => { e.stopPropagation(); moveCustomer(customer, 'prev'); }}
                            >
                              {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              disabled={stageIndex === PIPELINE_STAGES.length - 1}
                              onClick={(e) => { e.stopPropagation(); moveCustomer(customer, 'next'); }}
                            >
                              {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <CustomerFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        customer={selectedCustomer}
      />
    </div>
  );
}
