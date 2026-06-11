import React, { useState } from 'react';
import { 
  ShoppingBag, Plus, ExternalLink, Loader2, MoreVertical, 
  Edit, Trash2, Check, Star, Clock, Target, Image as ImageIcon,
  Link as LinkIcon, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useWishlistItems, useCreateWishlistItem, useUpdateWishlistItem, useDeleteWishlistItem, WishlistItem } from '@/hooks/useWishlist';
import { useEnvelopes, useSinkingFunds } from '@/hooks/useAdvancedFinance';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { type Locale } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

const CATEGORIES = [
  { id: 'electronics', label: { ar: 'إلكترونيات', en: 'Electronics' } },
  { id: 'fashion', label: { ar: 'أزياء', en: 'Fashion' } },
  { id: 'home', label: { ar: 'منزل', en: 'Home' } },
  { id: 'travel', label: { ar: 'سفر', en: 'Travel' } },
  { id: 'education', label: { ar: 'تعليم', en: 'Education' } },
  { id: 'health', label: { ar: 'صحة', en: 'Health' } },
  { id: 'entertainment', label: { ar: 'ترفيه', en: 'Entertainment' } },
  { id: 'other', label: { ar: 'أخرى', en: 'Other' } },
];

interface WishlistFormData {
  name: string;
  description: string;
  estimated_price: string;
  currency: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  url: string;
  image_url: string;
  target_date: string;
  saved_amount: string;
  linked_envelope_id: string;
  linked_sinking_fund_id: string;
  notes: string;
}

interface ItemFormProps {
  isEdit?: boolean;
  language: string;
  formData: WishlistFormData;
  setFormData: React.Dispatch<React.SetStateAction<WishlistFormData>>;
  envelopes: { id: string; name: string }[] | undefined;
  sinkingFunds: { id: string; name: string }[] | undefined;
  handleCreate: () => void;
  handleUpdate: () => void;
  isCreatePending: boolean;
  isUpdatePending: boolean;
}

function ItemForm({
  isEdit = false,
  language,
  formData,
  setFormData,
  envelopes,
  sinkingFunds,
  handleCreate,
  handleUpdate,
  isCreatePending,
  isUpdatePending,
}: ItemFormProps) {
  return (
    <div className="space-y-4 mt-4 max-h-[65vh] overflow-y-auto pe-2">
      <Input
        dir="auto"
        placeholder={language === 'ar' ? 'اسم المنتج/الخدمة' : 'Item name'}
        value={formData.name}
        onChange={(e) => { const v = e.target.value; setFormData(prev => ({ ...prev, name: v })); }}
      />

      <Textarea
        dir="auto"
        placeholder={language === 'ar' ? 'الوصف (اختياري)' : 'Description (optional)'}
        value={formData.description}
        onChange={(e) => { const v = e.target.value; setFormData(prev => ({ ...prev, description: v })); }}
        rows={2}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            {language === 'ar' ? 'السعر التقريبي' : 'Estimated Price'}
          </label>
          <Input
            type="number"
            placeholder="0"
            value={formData.estimated_price}
            onChange={(e) => { const v = e.target.value; setFormData(prev => ({ ...prev, estimated_price: v })); }}
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            {language === 'ar' ? 'العملة' : 'Currency'}
          </label>
          <Select value={formData.currency} onValueChange={(v) => setFormData(prev => ({ ...prev, currency: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SAR">SAR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="AED">AED</SelectItem>
              <SelectItem value="EGP">EGP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            {language === 'ar' ? 'الأولوية' : 'Priority'}
          </label>
          <Select value={formData.priority} onValueChange={(v) => setFormData(prev => ({ ...prev, priority: v as WishlistItem['priority'] }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">{language === 'ar' ? 'منخفض' : 'Low'}</SelectItem>
              <SelectItem value="medium">{language === 'ar' ? 'متوسط' : 'Medium'}</SelectItem>
              <SelectItem value="high">{language === 'ar' ? 'مرتفع' : 'High'}</SelectItem>
              <SelectItem value="urgent">{language === 'ar' ? 'عاجل' : 'Urgent'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            {language === 'ar' ? 'الفئة' : 'Category'}
          </label>
          <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
            <SelectTrigger><SelectValue placeholder={language === 'ar' ? 'اختر' : 'Select'} /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.label[language as 'ar' | 'en']}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
          <LinkIcon className="w-3 h-3" />
          {language === 'ar' ? 'رابط المنتج' : 'Product URL'}
        </label>
        <Input
          type="url"
          placeholder="https://..."
          value={formData.url}
          onChange={(e) => { const v = e.target.value; setFormData(prev => ({ ...prev, url: v })); }}
        />
      </div>

      <div>
        <label className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
          <ImageIcon className="w-3 h-3" />
          {language === 'ar' ? 'رابط الصورة' : 'Image URL'}
        </label>
        <Input
          type="url"
          placeholder="https://..."
          value={formData.image_url}
          onChange={(e) => { const v = e.target.value; setFormData(prev => ({ ...prev, image_url: v })); }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            {language === 'ar' ? 'تاريخ الهدف' : 'Target Date'}
          </label>
          <Input
            type="date"
            value={formData.target_date}
            onChange={(e) => { const v = e.target.value; setFormData(prev => ({ ...prev, target_date: v })); }}
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            {language === 'ar' ? 'المبلغ الموفر' : 'Saved Amount'}
          </label>
          <Input
            type="number"
            placeholder="0"
            value={formData.saved_amount}
            onChange={(e) => { const v = e.target.value; setFormData(prev => ({ ...prev, saved_amount: v })); }}
          />
        </div>
      </div>

      {(envelopes?.length || 0) > 0 && (
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            {language === 'ar' ? 'ربط بمغلف' : 'Link to Envelope'}
          </label>
          <Select value={formData.linked_envelope_id} onValueChange={(v) => setFormData(prev => ({ ...prev, linked_envelope_id: v === 'none' ? '' : v }))}>
            <SelectTrigger><SelectValue placeholder={language === 'ar' ? 'اختر مغلف' : 'Select envelope'} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{language === 'ar' ? 'بدون' : 'None'}</SelectItem>
              {envelopes?.map(env => (
                <SelectItem key={env.id} value={env.id}>{env.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {(sinkingFunds?.length || 0) > 0 && (
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            {language === 'ar' ? 'ربط بصندوق ادخار' : 'Link to Sinking Fund'}
          </label>
          <Select value={formData.linked_sinking_fund_id} onValueChange={(v) => setFormData(prev => ({ ...prev, linked_sinking_fund_id: v === 'none' ? '' : v }))}>
            <SelectTrigger><SelectValue placeholder={language === 'ar' ? 'اختر صندوق' : 'Select fund'} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{language === 'ar' ? 'بدون' : 'None'}</SelectItem>
              {sinkingFunds?.map(fund => (
                <SelectItem key={fund.id} value={fund.id}>{fund.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Textarea
        dir="auto"
        placeholder={language === 'ar' ? 'ملاحظات إضافية' : 'Additional notes'}
        value={formData.notes}
        onChange={(e) => { const v = e.target.value; setFormData(prev => ({ ...prev, notes: v })); }}
        rows={2}
      />

      <Button
        onClick={isEdit ? handleUpdate : handleCreate}
        className="w-full"
        disabled={isCreatePending || isUpdatePending}
      >
        {(isCreatePending || isUpdatePending) ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isEdit ? (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes') : (language === 'ar' ? 'إضافة' : 'Add')}
      </Button>
    </div>
  );
}

interface ItemCardProps {
  item: WishlistItem;
  language: string;
  locale: Locale;
  getPriorityColor: (priority: string) => string;
  getPriorityLabel: (priority: string) => string;
  openEditDialog: (item: WishlistItem) => void;
  handleStartSaving: (id: string) => void;
  handleMarkAsPurchased: (id: string) => void;
  handleDelete: (id: string) => void;
}

function ItemCard({
  item,
  language,
  locale,
  getPriorityColor,
  getPriorityLabel,
  openEditDialog,
  handleStartSaving,
  handleMarkAsPurchased,
  handleDelete,
}: ItemCardProps) {
  const savedPercent = item.estimated_price ? ((item.saved_amount || 0) / item.estimated_price) * 100 : 0;
  const categoryLabel = CATEGORIES.find(c => c.id === item.category)?.label[language as 'ar' | 'en'] || item.category;

  return (
    <div className="glass-card p-4 hover:shadow-lg transition-all duration-300 group">
      <div className="flex gap-4">
        {/* Image */}
        <div className="w-24 h-24 rounded-xl bg-muted/50 flex-shrink-0 overflow-hidden">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{item.name}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className={cn('text-xs', getPriorityColor(item.priority))}>
                  {getPriorityLabel(item.priority)}
                </Badge>
                {categoryLabel && (
                  <Badge variant="outline" className="text-xs">
                    {categoryLabel}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {item.url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(item.url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEditDialog(item)}>
                    <Edit className="w-4 h-4 me-2" />
                    {language === 'ar' ? 'تعديل' : 'Edit'}
                  </DropdownMenuItem>
                  {item.status === 'pending' && (
                    <DropdownMenuItem onClick={() => handleStartSaving(item.id)}>
                      <Wallet className="w-4 h-4 me-2" />
                      {language === 'ar' ? 'بدء التوفير' : 'Start Saving'}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => handleMarkAsPurchased(item.id)}>
                    <Check className="w-4 h-4 me-2" />
                    {language === 'ar' ? 'تم الشراء' : 'Mark Purchased'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(item.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 me-2" />
                    {language === 'ar' ? 'حذف' : 'Delete'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {item.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{item.description}</p>
          )}

          <div className="mt-3 space-y-2">
            {item.estimated_price && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {language === 'ar' ? 'السعر' : 'Price'}
                </span>
                <span className="font-semibold">
                  {item.estimated_price.toLocaleString()} {item.currency}
                </span>
              </div>
            )}

            {item.saved_amount !== undefined && item.saved_amount > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {language === 'ar' ? 'الموفر' : 'Saved'}: {item.saved_amount?.toLocaleString()} {item.currency}
                  </span>
                  <span className="text-primary font-medium">{savedPercent.toFixed(0)}%</span>
                </div>
                <Progress value={savedPercent} className="h-1.5" />
              </div>
            )}

            {item.target_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{format(new Date(item.target_date), 'PPP', { locale })}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WishlistManager() {
  const { t, currentLanguage } = useLanguage();
  const language = currentLanguage;
  const locale = language === 'ar' ? ar : enUS;

  const { data: items, isLoading } = useWishlistItems();
  const { data: envelopes } = useEnvelopes();
  const { data: sinkingFunds } = useSinkingFunds();
  const createItem = useCreateWishlistItem();
  const updateItem = useUpdateWishlistItem();
  const deleteItem = useDeleteWishlistItem();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimated_price: '',
    currency: 'SAR',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    category: '',
    url: '',
    image_url: '',
    target_date: '',
    saved_amount: '',
    linked_envelope_id: '',
    linked_sinking_fund_id: '',
    notes: '',
  });

  const pendingItems = items?.filter(i => i.status === 'pending') || [];
  const savingItems = items?.filter(i => i.status === 'saved_for') || [];
  const purchasedItems = items?.filter(i => i.status === 'purchased') || [];

  const totalWishlistValue = pendingItems.reduce((sum, i) => sum + (i.estimated_price || 0), 0);
  const totalSaved = items?.reduce((sum, i) => sum + (i.saved_amount || 0), 0) || 0;

  const handleCreate = async () => {
    if (!formData.name) {
      toast.error(language === 'ar' ? 'أدخل اسم العنصر' : 'Enter item name');
      return;
    }

    try {
      await createItem.mutateAsync({
        name: formData.name,
        description: formData.description || null,
        estimated_price: parseFloat(formData.estimated_price) || null,
        currency: formData.currency,
        priority: formData.priority,
        category: formData.category || null,
        url: formData.url || null,
        image_url: formData.image_url || null,
        target_date: formData.target_date || null,
        saved_amount: parseFloat(formData.saved_amount) || 0,
        linked_envelope_id: formData.linked_envelope_id || null,
        linked_sinking_fund_id: formData.linked_sinking_fund_id || null,
        notes: formData.notes || null,
        status: 'pending',
      });
      toast.success(language === 'ar' ? 'تمت الإضافة بنجاح' : 'Item added successfully');
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;

    try {
      await updateItem.mutateAsync({
        id: editingItem.id,
        name: formData.name,
        description: formData.description || null,
        estimated_price: parseFloat(formData.estimated_price) || null,
        currency: formData.currency,
        priority: formData.priority,
        category: formData.category || null,
        url: formData.url || null,
        image_url: formData.image_url || null,
        target_date: formData.target_date || null,
        saved_amount: parseFloat(formData.saved_amount) || 0,
        linked_envelope_id: formData.linked_envelope_id || null,
        linked_sinking_fund_id: formData.linked_sinking_fund_id || null,
        notes: formData.notes || null,
      });
      toast.success(language === 'ar' ? 'تم التحديث' : 'Updated successfully');
      setIsEditDialogOpen(false);
      setEditingItem(null);
      resetForm();
    } catch (error) {
      toast.error(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem.mutateAsync(id);
      toast.success(language === 'ar' ? 'تم الحذف' : 'Deleted successfully');
    } catch (error) {
      toast.error(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleMarkAsPurchased = async (id: string) => {
    try {
      await updateItem.mutateAsync({ id, status: 'purchased' as WishlistItem['status'] });
      toast.success(language === 'ar' ? 'تم تسجيل الشراء' : 'Marked as purchased');
    } catch (error) {
      toast.error(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleStartSaving = async (id: string) => {
    try {
      await updateItem.mutateAsync({ id, status: 'saved_for' as WishlistItem['status'] });
      toast.success(language === 'ar' ? 'بدأ التوفير' : 'Started saving');
    } catch (error) {
      toast.error(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const openEditDialog = (item: WishlistItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      estimated_price: item.estimated_price?.toString() || '',
      currency: item.currency || 'SAR',
      priority: item.priority,
      category: item.category || '',
      url: item.url || '',
      image_url: item.image_url || '',
      target_date: item.target_date || '',
      saved_amount: item.saved_amount?.toString() || '',
      linked_envelope_id: item.linked_envelope_id || '',
      linked_sinking_fund_id: item.linked_sinking_fund_id || '',
      notes: item.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      estimated_price: '',
      currency: 'SAR',
      priority: 'medium',
      category: '',
      url: '',
      image_url: '',
      target_date: '',
      saved_amount: '',
      linked_envelope_id: '',
      linked_sinking_fund_id: '',
      notes: '',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-primary text-primary-foreground';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      urgent: { ar: 'عاجل', en: 'Urgent' },
      high: { ar: 'مرتفع', en: 'High' },
      medium: { ar: 'متوسط', en: 'Medium' },
      low: { ar: 'منخفض', en: 'Low' },
    };
    return labels[priority]?.[language] || priority;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" />
            {language === 'ar' ? 'قائمة الأمنيات' : 'Wishlist'}
          </h2>
          <p className="text-muted-foreground">
            {pendingItems.length} {language === 'ar' ? 'عناصر في القائمة' : 'items in list'}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold">
              <Plus className="w-4 h-4 me-2" />
              {language === 'ar' ? 'إضافة عنصر' : 'Add Item'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {language === 'ar' ? 'إضافة عنصر جديد' : 'Add New Item'}
              </DialogTitle>
            </DialogHeader>
            <ItemForm
              language={language}
              formData={formData}
              setFormData={setFormData}
              envelopes={envelopes}
              sinkingFunds={sinkingFunds}
              handleCreate={handleCreate}
              handleUpdate={handleUpdate}
              isCreatePending={createItem.isPending}
              isUpdatePending={updateItem.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              {language === 'ar' ? 'إجمالي القيمة' : 'Total Value'}
            </span>
          </div>
          <p className="text-2xl font-bold">{totalWishlistValue.toLocaleString()} SAR</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-success" />
            <span className="text-sm text-muted-foreground">
              {language === 'ar' ? 'إجمالي الموفر' : 'Total Saved'}
            </span>
          </div>
          <p className="text-2xl font-bold text-success">{totalSaved.toLocaleString()} SAR</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-muted-foreground">
              {language === 'ar' ? 'عاجل/مهم' : 'Urgent/High'}
            </span>
          </div>
          <p className="text-2xl font-bold text-orange-500">
            {pendingItems.filter(i => i.priority === 'urgent' || i.priority === 'high').length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            {language === 'ar' ? 'الكل' : 'All'} ({items?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pending">
            {language === 'ar' ? 'في الانتظار' : 'Pending'} ({pendingItems.length})
          </TabsTrigger>
          <TabsTrigger value="saving">
            {language === 'ar' ? 'جاري التوفير' : 'Saving'} ({savingItems.length})
          </TabsTrigger>
          <TabsTrigger value="purchased">
            {language === 'ar' ? 'تم الشراء' : 'Purchased'} ({purchasedItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {items?.length === 0 ? (
            <div className="text-center py-12 glass-card">
              <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {language === 'ar' ? 'لا توجد عناصر في القائمة' : 'No items in your wishlist'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {items?.map(item => <ItemCard
                  key={item.id}
                  item={item}
                  language={language}
                  locale={locale}
                  getPriorityColor={getPriorityColor}
                  getPriorityLabel={getPriorityLabel}
                  openEditDialog={openEditDialog}
                  handleStartSaving={handleStartSaving}
                  handleMarkAsPurchased={handleMarkAsPurchased}
                  handleDelete={handleDelete}
                />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {pendingItems.map(item => <ItemCard
                  key={item.id}
                  item={item}
                  language={language}
                  locale={locale}
                  getPriorityColor={getPriorityColor}
                  getPriorityLabel={getPriorityLabel}
                  openEditDialog={openEditDialog}
                  handleStartSaving={handleStartSaving}
                  handleMarkAsPurchased={handleMarkAsPurchased}
                  handleDelete={handleDelete}
                />)}
          </div>
        </TabsContent>

        <TabsContent value="saving" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {savingItems.map(item => <ItemCard
                  key={item.id}
                  item={item}
                  language={language}
                  locale={locale}
                  getPriorityColor={getPriorityColor}
                  getPriorityLabel={getPriorityLabel}
                  openEditDialog={openEditDialog}
                  handleStartSaving={handleStartSaving}
                  handleMarkAsPurchased={handleMarkAsPurchased}
                  handleDelete={handleDelete}
                />)}
          </div>
        </TabsContent>

        <TabsContent value="purchased" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {purchasedItems.map(item => <ItemCard
                  key={item.id}
                  item={item}
                  language={language}
                  locale={locale}
                  getPriorityColor={getPriorityColor}
                  getPriorityLabel={getPriorityLabel}
                  openEditDialog={openEditDialog}
                  handleStartSaving={handleStartSaving}
                  handleMarkAsPurchased={handleMarkAsPurchased}
                  handleDelete={handleDelete}
                />)}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تعديل العنصر' : 'Edit Item'}
            </DialogTitle>
          </DialogHeader>
          <ItemForm
            isEdit
            language={language}
            formData={formData}
            setFormData={setFormData}
            envelopes={envelopes}
            sinkingFunds={sinkingFunds}
            handleCreate={handleCreate}
            handleUpdate={handleUpdate}
            isCreatePending={createItem.isPending}
            isUpdatePending={updateItem.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
