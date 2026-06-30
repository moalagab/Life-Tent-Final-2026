import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/hooks/useLanguage';
import { useCreateCustomer, useUpdateCustomer, Customer, CustomerStatus, PIPELINE_STAGES } from '@/hooks/useCRM';
import { toast } from 'sonner';

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: CustomerStatus;
  pipeline_stage: string;
  notes: string;
}

export function CustomerFormDialog({ open, onOpenChange, customer }: CustomerFormDialogProps) {
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === 'ar';
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      status: 'lead',
      pipeline_stage: 'new',
      notes: '',
    },
  });

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company || '',
        status: customer.status,
        pipeline_stage: customer.pipeline_stage,
        notes: customer.notes || '',
      });
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        company: '',
        status: 'lead',
        pipeline_stage: 'new',
        notes: '',
      });
    }
  }, [customer, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (customer) {
        await updateCustomer.mutateAsync({ id: customer.id, ...data });
        toast.success(isRTL ? 'تم تحديث العميل' : 'Customer updated');
      } else {
        await createCustomer.mutateAsync(data);
        toast.success(isRTL ? 'تم إضافة العميل' : 'Customer added');
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
            {customer ? (isRTL ? 'تعديل العميل' : 'Edit Customer') : (isRTL ? 'عميل جديد' : 'New Customer')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{isRTL ? 'الاسم' : 'Name'} *</Label>
            <Input {...register('name', { required: true })} placeholder={isRTL ? 'اسم العميل' : 'Customer name'} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
              <Input {...register('email')} type="email" placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'الهاتف' : 'Phone'}</Label>
              <Input {...register('phone')} placeholder="+966..." />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{isRTL ? 'الشركة' : 'Company'}</Label>
            <Input {...register('company')} placeholder={isRTL ? 'اسم الشركة' : 'Company name'} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{isRTL ? 'الحالة' : 'Status'}</Label>
              <Select value={watch('status')} onValueChange={(v) => setValue('status', v as CustomerStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">{isRTL ? 'عميل محتمل' : 'Lead'}</SelectItem>
                  <SelectItem value="prospect">{isRTL ? 'مرشح' : 'Prospect'}</SelectItem>
                  <SelectItem value="active">{isRTL ? 'نشط' : 'Active'}</SelectItem>
                  <SelectItem value="inactive">{isRTL ? 'غير نشط' : 'Inactive'}</SelectItem>
                  <SelectItem value="churned">{isRTL ? 'مفقود' : 'Churned'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'مرحلة Pipeline' : 'Pipeline Stage'}</Label>
              <Select value={watch('pipeline_stage')} onValueChange={(v) => setValue('pipeline_stage', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {isRTL ? stage.label : stage.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{isRTL ? 'ملاحظات' : 'Notes'}</Label>
            <Textarea {...register('notes')} rows={3} placeholder={isRTL ? 'ملاحظات إضافية...' : 'Additional notes...'} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={createCustomer.isPending || updateCustomer.isPending}>
              {customer ? (isRTL ? 'تحديث' : 'Update') : (isRTL ? 'إضافة' : 'Add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
