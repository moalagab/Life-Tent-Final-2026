import { useState } from 'react';
import { Plus, Search, Mail, Phone, Building2, MoreVertical, Trash2, Edit, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/hooks/useLanguage';
import { useCustomers, useDeleteCustomer, Customer, CustomerStatus } from '@/hooks/useCRM';
import { CustomerFormDialog } from './CustomerFormDialog';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2 } from 'lucide-react';

const statusConfig: Record<CustomerStatus, { label: string; labelAr: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  lead: { label: 'Lead', labelAr: 'عميل محتمل', variant: 'secondary' },
  prospect: { label: 'Prospect', labelAr: 'مرشح', variant: 'outline' },
  active: { label: 'Active', labelAr: 'نشط', variant: 'default' },
  inactive: { label: 'Inactive', labelAr: 'غير نشط', variant: 'secondary' },
  churned: { label: 'Churned', labelAr: 'مفقود', variant: 'destructive' },
};

export function CustomersTab() {
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === 'ar';
  const { data: customers, isLoading } = useCustomers();
  const deleteCustomer = useDeleteCustomer();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers?.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer.mutateAsync(id);
      toast.success(isRTL ? 'تم حذف العميل' : 'Customer deleted');
    } catch {
      toast.error(isRTL ? 'حدث خطأ' : 'Error occurred');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRTL ? 'بحث عن عميل...' : 'Search customers...'}
            className="ps-10"
          />
        </div>
        <Button onClick={() => { setEditingCustomer(null); setIsFormOpen(true); }}>
          <Plus className="w-4 h-4 me-2" />
          {isRTL ? 'عميل جديد' : 'New Customer'}
        </Button>
      </div>

      {/* Customers Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="text-center py-16">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">{isRTL ? 'لا يوجد عملاء' : 'No customers yet'}</p>
          <Button variant="outline" className="mt-4" onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 me-2" />
            {isRTL ? 'أضف أول عميل' : 'Add first customer'}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold truncate">{customer.name}</h3>
                      <Badge variant={statusConfig[customer.status].variant}>
                        {isRTL ? statusConfig[customer.status].labelAr : statusConfig[customer.status].label}
                      </Badge>
                    </div>
                    
                    {customer.company && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Building2 className="w-3 h-3" />
                        <span className="truncate">{customer.company}</span>
                      </div>
                    )}
                    
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(customer)}>
                        <Edit className="w-4 h-4 me-2" />
                        {isRTL ? 'تعديل' : 'Edit'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDelete(customer.id)}
                      >
                        <Trash2 className="w-4 h-4 me-2" />
                        {isRTL ? 'حذف' : 'Delete'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CustomerFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        customer={editingCustomer}
      />
    </div>
  );
}
