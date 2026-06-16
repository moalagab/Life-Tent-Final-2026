import { useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { parseArabicCapture, ParsedCapture } from '@/lib/nlp/arabicParser';
import { useCreateTransaction, useAccounts } from './useFinance';
import { useCreateTask } from './useTasks';

export interface NaturalCaptureResult {
  text:        string;
  setText:     (t: string) => void;
  parsed:      ParsedCapture | null;
  isCreating:  boolean;
  error:       string | null;
  submit:      () => Promise<void>;
  reset:       () => void;
}

export function useNaturalCapture(): NaturalCaptureResult {
  const [text, setText_]     = useState('');
  const [error, setError]    = useState<string | null>(null);

  const { data: accounts = [] } = useAccounts();
  const createTransaction = useCreateTransaction();
  const createTask        = useCreateTask();

  const parsed = useMemo<ParsedCapture | null>(() => {
    const trimmed = text.trim();
    if (trimmed.length < 3) return null;
    return parseArabicCapture(trimmed);
  }, [text]);

  const setText = useCallback((t: string) => {
    setText_(t);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setText_('');
    setError(null);
  }, []);

  const submit = useCallback(async () => {
    if (!parsed) return;
    setError(null);

    const dateStr = parsed.date
      ? format(parsed.date.date, 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd');

    try {
      if (parsed.type === 'expense' || parsed.type === 'income' ||
          parsed.type === 'subscription' || parsed.type === 'debt') {
        if (!parsed.amount) {
          setError('لم يتم تحديد المبلغ. مثال: "دفعت فاتورة الكهرباء 350 ريال"');
          return;
        }
        const defaultAccount = accounts[0];
        if (!defaultAccount) {
          setError('لا يوجد حساب بنكي. أضف حساباً من صفحة المالية أولاً.');
          return;
        }

        const txType =
          parsed.type === 'income'                           ? 'income'
          : parsed.type === 'subscription' || parsed.type === 'debt' ? 'expense'
          : 'expense';

        await createTransaction.mutateAsync({
          amount:      parsed.amount.value,
          type:        txType as 'income' | 'expense' | 'transfer' | 'investment',
          date:        dateStr,
          category:    parsed.category,
          description: parsed.title,
          account_id:  defaultAccount.id,
        });

      } else if (parsed.type === 'task') {
        await createTask.mutateAsync({
          title:    parsed.title,
          status:   'pending',
          priority: 'medium',
          due_date: parsed.date ? dateStr : undefined,
        });

      } else if (parsed.type === 'reminder') {
        await createTask.mutateAsync({
          title:    parsed.title || parsed.raw,
          status:   'pending',
          priority: 'medium',
          due_date: dateStr,
        });
      }

      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ');
    }
  }, [parsed, accounts, createTransaction, createTask, reset]);

  const isCreating = createTransaction.isPending || createTask.isPending;

  return { text, setText, parsed, isCreating, error, submit, reset };
}
