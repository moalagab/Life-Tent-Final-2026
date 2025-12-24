import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/hooks/useLanguage';
import { useCreateCase, useUpdateCase, useCustomers, CustomerCase, CaseStatus, CasePriority } from '@/hooks/useCRM';
import { toast } from 'sonner';

interface CaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseData?: CustomerCase | null;
}

interface FormData {
  customer_id: string;
  title: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
  due_date: string;
}

export function CaseFormDialog({ open, onOpenChange, caseData }: CaseFormDialogProps) {
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === 'ar';
  const createCase = useCreateCase();
  const updateCase = useUpdateCase();
  const { data: customers } = useCustomers();

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      customer_id: '',
      title: '',
      description: '',
      status: 'open',
      priority: 'medium',
      due_date: '',
    },
  });

  useEffect(() => {
    if (caseData) {
      reset({
        customer_id: caseData.customer_id,
        title: caseData.title,
        description: caseData.description || '',
        status: caseData.status,
        priority: caseData.priority,
        due_date: caseData.due_date || '',
      });
    } else {
      reset({
        customer_id: '',
        title: '',
        description: '',
        status: 'open',
        priority: 'medium',
        due_date: '',
      });
    }
  }, [caseData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (caseData) {
        await updateCase.mutateAsync({ id: caseData.id, ...data });
        toast.success(isRTL ? 'تم تحديث الحالة' : 'Case updated');
      } else {
        await createCase.mutateAsync(data);
        toast.success(isRTL ? 'تم إضافة الحالة' : 'Case added');
      }
      onOpenChange(false);
    } catch {
      toast.error(isRTL ? 'حدث خطأ' : 'Error occurred');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {caseData ? (isRTL ? 'تعديل الحالة' : 'Edit Case') : (isRTL ? 'حالة جديدة' : 'New Case')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{isRTL ? 'العميل' : 'Customer'} *</Label>
            <Select value={watch('customer_id')} onValueChange={(v) => setValue('customer_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder={isRTL ? 'اختر العميل' : 'Select customer'} />
              </SelectTrigger>
              <SelectContent>
                {customers?.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{isRTL ? 'العنوان' : 'Title'} *</Label>
            <Input {...register('title', { required: true })} placeholder={isRTL ? 'عنوان الحالة' : 'Case title'} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{isRTL ? 'الحالة' : 'Status'}</Label>
              <Select value={watch('status')} onValueChange={(v) => setValue('status', v as CaseStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">{isRTL ? 'مفتوحة' : 'Open'}</SelectItem>
                  <SelectItem value="in_progress">{isRTL ? 'قيد التنفيذ' : 'In Progress'}</SelectItem>
                  <SelectItem value="pending">{isRTL ? 'معلقة' : 'Pending'}</SelectItem>
                  <SelectItem value="resolved">{isRTL ? 'محلولة' : 'Resolved'}</SelectItem>
                  <SelectItem value="closed">{isRTL ? 'مغلقة' : 'Closed'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'الأولوية' : 'Priority'}</Label>
              <Select value={watch('priority')} onValueChange={(v) => setValue('priority', v as CasePriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{isRTL ? 'منخفضة' : 'Low'}</SelectItem>
                  <SelectItem value="medium">{isRTL ? 'متوسطة' : 'Medium'}</SelectItem>
                  <SelectItem value="high">{isRTL ? 'عالية' : 'High'}</SelectItem>
                  <SelectItem value="urgent">{isRTL ? 'عاجلة' : 'Urgent'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{isRTL ? 'تاريخ الاستحقاق' : 'Due Date'}</Label>
            <Input {...register('due_date')} type="date" />
          </div>

          <div className="space-y-2">
            <Label>{isRTL ? 'الوصف' : 'Description'}</Label>
            <Textarea {...register('description')} rows={3} placeholder={isRTL ? 'وصف الحالة...' : 'Case description...'} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={createCase.isPending || updateCase.isPending}>
              {caseData ? (isRTL ? 'تحديث' : 'Update') : (isRTL ? 'إضافة' : 'Add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
