import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Briefcase, GitBranch, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { CustomersTab } from './CustomersTab';
import { CasesTab } from './CasesTab';
import { PipelineTab } from './PipelineTab';
import { CommunicationsTab } from './CommunicationsTab';

export function CRMView() {
  const { currentLanguage } = useLanguage();
  const isRTL = currentLanguage === 'ar';
  const [activeTab, setActiveTab] = useState('customers');

  const tabs = [
    { id: 'customers', label: isRTL ? 'العملاء' : 'Customers', icon: Users },
    { id: 'pipeline', label: isRTL ? 'Pipeline' : 'Pipeline', icon: GitBranch },
    { id: 'cases', label: isRTL ? 'الحالات' : 'Cases', icon: Briefcase },
    { id: 'communications', label: isRTL ? 'سجل التواصل' : 'Communications', icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="customers" className="mt-6">
          <CustomersTab />
        </TabsContent>

        <TabsContent value="pipeline" className="mt-6">
          <PipelineTab />
        </TabsContent>

        <TabsContent value="cases" className="mt-6">
          <CasesTab />
        </TabsContent>

        <TabsContent value="communications" className="mt-6">
          <CommunicationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
