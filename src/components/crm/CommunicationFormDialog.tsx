import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/hooks/useLanguage';
import { useCreateCommunication, useCustomers, CommunicationType } from '@/hooks/useCRM';
import { toast } from 'sonner';

interface CommunicationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  customer_id: string;
  type: CommunicationType;
  subject: string;
  content: string;
  contact_date: string;
}

export function CommunicationFormDialog({ open, onOpenChange }: CommunicationFormDialogProps) {
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === 'ar';
  const createCommunication = useCreateCommunication();
  const { data: customers } = useCustomers();

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      customer_id: '',
      type: 'note',
      subject: '',
      content: '',
      contact_date: new Date().toISOString().slice(0, 16),
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createCommunication.mutateAsync({
        ...data,
        contact_date: new Date(data.contact_date).toISOString(),
      });
      toast.success(isRTL ? 'تم تسجيل التواصل' : 'Communication logged');
      reset();
      onOpenChange(false);
    } catch {
      toast.error(isRTL ? 'حدث خطأ' : 'Error occurred');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isRTL ? 'تسجيل تواصل جديد' : 'Log Communication'}</DialogTitle>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{isRTL ? 'النوع' : 'Type'}</Label>
              <Select value={watch('type')} onValueChange={(v) => setValue('type', v as CommunicationType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">{isRTL ? 'مكالمة' : 'Call'}</SelectItem>
                  <SelectItem value="email">{isRTL ? 'بريد إلكتروني' : 'Email'}</SelectItem>
                  <SelectItem value="meeting">{isRTL ? 'اجتماع' : 'Meeting'}</SelectItem>
                  <SelectItem value="message">{isRTL ? 'رسالة' : 'Message'}</SelectItem>
                  <SelectItem value="note">{isRTL ? 'ملاحظة' : 'Note'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'التاريخ والوقت' : 'Date & Time'}</Label>
              <Input {...register('contact_date')} type="datetime-local" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{isRTL ? 'الموضوع' : 'Subject'}</Label>
            <Input {...register('subject')} placeholder={isRTL ? 'موضوع التواصل' : 'Communication subject'} />
          </div>

          <div className="space-y-2">
            <Label>{isRTL ? 'المحتوى' : 'Content'}</Label>
            <Textarea {...register('content')} rows={4} placeholder={isRTL ? 'تفاصيل التواصل...' : 'Communication details...'} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={createCommunication.isPending}>
              {isRTL ? 'تسجيل' : 'Log'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
