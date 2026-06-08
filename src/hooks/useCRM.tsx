import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type CustomerStatus = 'lead' | 'prospect' | 'active' | 'inactive' | 'churned';
export type CaseStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
export type CasePriority = 'low' | 'medium' | 'high' | 'urgent';
export type CommunicationType = 'call' | 'email' | 'meeting' | 'note' | 'message';

export interface Customer {
  id: string;
  user_id: string;
  project_id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  status: CustomerStatus;
  pipeline_stage: string;
  notes?: string | null;
  tags?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerCase {
  id: string;
  user_id: string;
  customer_id: string;
  title: string;
  description?: string | null;
  status: CaseStatus;
  priority: CasePriority;
  due_date?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface CustomerCommunication {
  id: string;
  user_id: string;
  customer_id: string;
  case_id?: string | null;
  type: CommunicationType;
  subject?: string | null;
  content?: string | null;
  contact_date: string;
  created_at: string;
  customer?: Customer;
}

// Pipeline stages
export const PIPELINE_STAGES = [
  { id: 'new', label: 'جديد', labelEn: 'New', color: 'bg-blue-500' },
  { id: 'contacted', label: 'تم التواصل', labelEn: 'Contacted', color: 'bg-yellow-500' },
  { id: 'qualified', label: 'مؤهل', labelEn: 'Qualified', color: 'bg-purple-500' },
  { id: 'proposal', label: 'عرض سعر', labelEn: 'Proposal', color: 'bg-orange-500' },
  { id: 'negotiation', label: 'تفاوض', labelEn: 'Negotiation', color: 'bg-pink-500' },
  { id: 'won', label: 'ربح', labelEn: 'Won', color: 'bg-green-500' },
  { id: 'lost', label: 'خسارة', labelEn: 'Lost', color: 'bg-red-500' },
];

// Customers hooks
export function useCustomers(projectId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['customers', projectId],
    queryFn: async () => {
      let query = supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!user,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (customer: Omit<Partial<Customer>, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('customers')
         
        .insert({ ...customer, user_id: user!.id } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Customer> & { id: string }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// Cases hooks
export function useCustomerCases(customerId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['customer-cases', customerId],
    queryFn: async () => {
      let query = supabase
        .from('customer_cases')
        .select('*, customer:customers(*)')
        .order('created_at', { ascending: false });
      
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as CustomerCase[];
    },
    enabled: !!user,
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (caseData: Omit<Partial<CustomerCase>, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('customer_cases')
         
        .insert({ ...caseData, user_id: user!.id } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-cases'] });
    },
  });
}

export function useUpdateCase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, customer, ...updates }: Partial<CustomerCase> & { id: string }) => {
      const { data, error } = await supabase
        .from('customer_cases')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-cases'] });
    },
  });
}

export function useDeleteCase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customer_cases').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-cases'] });
    },
  });
}

// Communications hooks
export function useCustomerCommunications(customerId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['customer-communications', customerId],
    queryFn: async () => {
      let query = supabase
        .from('customer_communications')
        .select('*, customer:customers(*)')
        .order('contact_date', { ascending: false });
      
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as CustomerCommunication[];
    },
    enabled: !!user,
  });
}

export function useCreateCommunication() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (comm: Omit<Partial<CustomerCommunication>, 'id' | 'user_id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('customer_communications')
         
        .insert({ ...comm, user_id: user!.id } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-communications'] });
    },
  });
}

export function useDeleteCommunication() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customer_communications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-communications'] });
    },
  });
}
