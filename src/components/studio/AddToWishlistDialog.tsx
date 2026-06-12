import { useState } from 'react';
import { Loader2, ShoppingCart, BookOpen, DollarSign, Calendar, Link as LinkIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/hooks/useLanguage';
import { useCreateWishlistItem } from '@/hooks/useWishlist';
import { MediaItem } from '@/hooks/useMedia';
import { toast } from 'sonner';

interface AddToWishlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaItem: MediaItem | null;
}

export function AddToWishlistDialog({ open, onOpenChange, mediaItem }: AddToWishlistDialogProps) {
  const { currentLanguage } = useLanguage();
  const createWishlistItem = useCreateWishlistItem();
  
  const [formData, setFormData] = useState({
    estimated_price: '',
    currency: 'SAR',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    url: '',
    notes: '',
    target_date: '',
  });

  const handleSubmit = async () => {
    if (!mediaItem) return;

    try {
      await createWishlistItem.mutateAsync({
        name: mediaItem.title,
        description: mediaItem.author ? `${currentLanguage === 'ar' ? 'المؤلف:' : 'Author:'} ${mediaItem.author}` : undefined,
        category: currentLanguage === 'ar' ? 'كتب' : 'Books',
        estimated_price: formData.estimated_price ? parseFloat(formData.estimated_price) : undefined,
        currency: formData.currency,
        priority: formData.priority,
        url: formData.url || undefined,
        notes: formData.notes || undefined,
        target_date: formData.target_date || undefined,
        status: 'pending',
        linked_media_id: mediaItem.id,
      });

      toast.success(
        currentLanguage === 'ar' 
          ? 'تمت إضافة الكتاب لقائمة الأمنيات' 
          : 'Book added to wishlist'
      );
      onOpenChange(false);
      setFormData({
        estimated_price: '',
        currency: 'SAR',
        priority: 'medium',
        url: '',
        notes: '',
        target_date: '',
      });
    } catch (error) {
      toast.error(currentLanguage === 'ar' ? 'حدث خطأ' : 'Error occurred');
    }
  };

  const priorityOptions = [
    { value: 'low', label: currentLanguage === 'ar' ? 'منخفضة' : 'Low' },
    { value: 'medium', label: currentLanguage === 'ar' ? 'متوسطة' : 'Medium' },
    { value: 'high', label: currentLanguage === 'ar' ? 'عالية' : 'High' },
    { value: 'urgent', label: currentLanguage === 'ar' ? 'عاجل' : 'Urgent' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            {currentLanguage === 'ar' ? 'إضافة لقائمة الأمنيات' : 'Add to Wishlist'}
          </DialogTitle>
          <DialogDescription>
            {currentLanguage === 'ar' 
              ? 'أضف هذا الكتاب لقائمة أمنياتك المالية لتتبع مدخراتك'
              : 'Add this book to your financial wishlist to track your savings'}
          </DialogDescription>
        </DialogHeader>

        {mediaItem && (
          <div className="space-y-4 mt-4">
            {/* Book Info */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground truncate">{mediaItem.title}</h4>
                {mediaItem.author && (
                  <p className="text-sm text-muted-foreground truncate">{mediaItem.author}</p>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  {currentLanguage === 'ar' ? 'السعر التقريبي' : 'Estimated Price'}
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.estimated_price}
                  onChange={(e) => setFormData({ ...formData, estimated_price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {currentLanguage === 'ar' ? 'العملة' : 'Currency'}
                </label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAR">SAR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {currentLanguage === 'ar' ? 'الأولوية' : 'Priority'}
              </label>
              <Select 
                value={formData.priority} 
                onValueChange={(value: typeof formData.priority) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {currentLanguage === 'ar' ? 'تاريخ الشراء المستهدف' : 'Target Purchase Date'}
              </label>
              <Input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              />
            </div>

            {/* URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" />
                {currentLanguage === 'ar' ? 'رابط الشراء' : 'Purchase URL'}
              </label>
              <Input
                type="url"
                placeholder="https://..."
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {currentLanguage === 'ar' ? 'ملاحظات' : 'Notes'}
              </label>
              <Textarea
                placeholder={currentLanguage === 'ar' ? 'ملاحظات إضافية...' : 'Additional notes...'}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                dir="auto"
              />
            </div>

            {/* Submit */}
            <Button 
              onClick={handleSubmit} 
              className="w-full" 
              variant="gold"
              disabled={createWishlistItem.isPending}
            >
              {createWishlistItem.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 me-2" />
                  {currentLanguage === 'ar' ? 'إضافة لقائمة الأمنيات' : 'Add to Wishlist'}
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
