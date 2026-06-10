import { useState } from 'react';
import { useCustomers, useCustomerCases, useCustomerCommunications } from '@/hooks/useCRM';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, Briefcase, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ProjectCRMTabProps {
  projectId: string;
}

const statusColors: Record<string, string> = {
  lead: 'bg-blue-500',
  prospect: 'bg-purple-500',
  customer: 'bg-green-500',
  churned: 'bg-red-500',
};

const pipelineColors: Record<string, string> = {
  new: 'bg-slate-500',
  contacted: 'bg-blue-500',
  qualified: 'bg-purple-500',
  proposal: 'bg-primary/80',
  negotiation: 'bg-orange-500',
  closed_won: 'bg-green-500',
  closed_lost: 'bg-red-500',
};

export function ProjectCRMTab({ projectId }: ProjectCRMTabProps) {
  const { data: customers, isLoading } = useCustomers();
  const { data: cases } = useCustomerCases();
  const { data: communications } = useCustomerCommunications();
  const [activeTab, setActiveTab] = useState('customers');

  // Filter by project
   
  const projectCustomers = customers?.filter((c: any) => c.project_id === projectId) || [];
   
  const customerIds = projectCustomers.map((c: any) => c.id);
   
  const projectCases = cases?.filter((c: any) => customerIds.includes(c.customer_id)) || [];
   
  const projectComms = communications?.filter((c: any) => customerIds.includes(c.customer_id)) || [];

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">جارٍ التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="customers" className="gap-1">
            <Users className="w-4 h-4" />
            العملاء
            <Badge variant="secondary" className="text-xs ml-1">{projectCustomers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="cases" className="gap-1">
            <Briefcase className="w-4 h-4" />
            الحالات
            <Badge variant="secondary" className="text-xs ml-1">{projectCases.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="communications" className="gap-1">
            <MessageSquare className="w-4 h-4" />
            التواصل
            <Badge variant="secondary" className="text-xs ml-1">{projectComms.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Customers */}
        <TabsContent value="customers" className="mt-4">
          {projectCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا يوجد عملاء مرتبطين بهذا المشروع</p>
              <p className="text-sm mt-2">يمكنك ربط العملاء من قسم CRM</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {projectCustomers.map((customer: any) => (
                <Card key={customer.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{customer.name}</h4>
                        {customer.company && (
                          <p className="text-sm text-muted-foreground">{customer.company}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${statusColors[customer.status]} text-white`}>
                          {customer.status}
                        </Badge>
                        {customer.pipeline_stage && (
                          <Badge variant="outline" className={pipelineColors[customer.pipeline_stage]}>
                            {customer.pipeline_stage}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {customer.email && <span>{customer.email}</span>}
                      {customer.phone && <span>{customer.phone}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Cases */}
        <TabsContent value="cases" className="mt-4">
          {projectCases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد حالات</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {projectCases.map((caseItem: any) => {
                 
                const customer = projectCustomers.find((c: any) => c.id === caseItem.customer_id);
                return (
                  <Card key={caseItem.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{caseItem.title}</h4>
                          <p className="text-sm text-muted-foreground">{customer?.name}</p>
                        </div>
                        <Badge variant={caseItem.status === 'resolved' ? 'secondary' : 'default'}>
                          {caseItem.status}
                        </Badge>
                      </div>
                      {caseItem.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{caseItem.description}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Communications */}
        <TabsContent value="communications" className="mt-4">
          {projectComms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا يوجد سجل تواصل</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projectComms.map((comm: any) => {
                 
                const customer = projectCustomers.find((c: any) => c.id === comm.customer_id);
                return (
                  <Card key={comm.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{comm.subject || comm.type}</h4>
                          <p className="text-sm text-muted-foreground">{customer?.name}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comm.contact_date || comm.created_at), 'dd MMM yyyy', { locale: ar })}
                        </span>
                      </div>
                      {comm.content && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{comm.content}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
