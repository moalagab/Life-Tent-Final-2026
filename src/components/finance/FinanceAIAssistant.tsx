import { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, Loader2, Sparkles, TrendingDown, PiggyBank, 
  Calculator, X, Maximize2, Minimize2, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useMonthlyStats, useTransactions, useAccounts } from '@/hooks/useFinance';
import { useDebts, useEnvelopes, useSinkingFunds } from '@/hooks/useAdvancedFinance';
import { useBudgets } from '@/hooks/useBudgets';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type AnalysisType = 'finance-assistant' | 'spending-analysis' | 'debt-strategy' | 'budget-suggestions';

export function FinanceAIAssistant() {
  const { currentLanguage } = useLanguage();
  const language = currentLanguage;

  const { data: monthlyStats } = useMonthlyStats();
  const { data: transactions } = useTransactions();
  const { data: accounts } = useAccounts();
  const { data: debts } = useDebts();
  const { data: envelopes } = useEnvelopes();
  const { data: sinkingFunds } = useSinkingFunds();
  const { data: budgets } = useBudgets();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisType, setAnalysisType] = useState<AnalysisType>('finance-assistant');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getFinancialContext = () => {
    const recentTransactions = transactions?.slice(0, 20).map(t => ({
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description,
      date: t.date,
    }));

    return {
      monthlyStats: {
        income: monthlyStats?.monthlyIncome || 0,
        expenses: monthlyStats?.monthlyExpenses || 0,
        netWorth: monthlyStats?.netWorth || 0,
        savingsRate: monthlyStats?.monthlyIncome ? 
          ((monthlyStats.monthlyIncome - (monthlyStats?.monthlyExpenses || 0)) / monthlyStats.monthlyIncome * 100).toFixed(1) : 0,
      },
      accounts: accounts?.map(a => ({ name: a.name, balance: a.balance, type: a.type })),
      debts: debts?.filter(d => d.status === 'active').map(d => ({
        name: d.name,
        remaining: d.remaining_amount,
        total: d.total_amount,
        interestRate: d.interest_rate,
      })),
      envelopesCount: envelopes?.length || 0,
      sinkingFundsCount: sinkingFunds?.length || 0,
      budgetsCount: budgets?.length || 0,
      recentTransactions,
    };
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('يجب تسجيل الدخول');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/finance-ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          type: analysisType,
          context: getFinancialContext(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      try {
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices?.[0]?.delta?.content;
                if (content) {
                  assistantContent += content;
                  setMessages(prev => {
                    const newMessages = [...prev];
                    if (newMessages[newMessages.length - 1].role === 'assistant') {
                      newMessages[newMessages.length - 1].content = assistantContent;
                    }
                    return newMessages;
                  });
                }
              } catch {
                // Skip invalid JSON lines
              }
            }
          }
        }
      } finally {
        reader?.cancel().catch(() => {});
      }
    } catch (error) {
      console.error('AI Assistant error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: language === 'ar' 
          ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.' 
          : 'Sorry, an error occurred. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { 
      type: 'spending-analysis' as const, 
      icon: TrendingDown, 
      label: language === 'ar' ? 'حلل مصروفاتي' : 'Analyze my spending',
      prompt: language === 'ar' ? 'حلل مصروفاتي الأخيرة وأعطني نصائح للتوفير' : 'Analyze my recent spending and give me saving tips'
    },
    { 
      type: 'debt-strategy' as const, 
      icon: Calculator, 
      label: language === 'ar' ? 'خطة سداد الديون' : 'Debt payoff plan',
      prompt: language === 'ar' ? 'ساعدني في وضع خطة لسداد ديوني' : 'Help me create a debt payoff plan'
    },
    { 
      type: 'budget-suggestions' as const, 
      icon: PiggyBank, 
      label: language === 'ar' ? 'اقتراح ميزانية' : 'Budget suggestions',
      prompt: language === 'ar' ? 'اقترح لي ميزانية مناسبة بناءً على دخلي ومصروفاتي' : 'Suggest a suitable budget based on my income and expenses'
    },
  ];

  const handleQuickAction = (action: typeof quickActions[0]) => {
    setAnalysisType(action.type);
    setInput(action.prompt);
    setTimeout(() => handleSend(), 100);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 start-6 z-50 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        size="icon"
      >
        <Sparkles className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div 
      className={cn(
        "fixed z-50 bg-background border rounded-2xl shadow-2xl flex flex-col transition-all duration-300",
        isExpanded 
          ? "inset-4 md:inset-8" 
          : "bottom-6 start-6 w-[380px] h-[500px] max-h-[80vh]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-transparent rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{language === 'ar' ? 'المساعد المالي الذكي' : 'AI Finance Assistant'}</h3>
            <p className="text-xs text-muted-foreground">{language === 'ar' ? 'مدعوم بالذكاء الاصطناعي' : 'Powered by AI'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">
                {language === 'ar' ? 'مرحباً! كيف يمكنني مساعدتك؟' : 'Hello! How can I help you?'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? 'اسألني عن مصروفاتك، الميزانية، الديون، أو أي استفسار مالي' 
                  : 'Ask me about your expenses, budget, debts, or any financial question'}
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium px-1">
                {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
              </p>
              {quickActions.map((action, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={() => handleQuickAction(action)}
                >
                  <action.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? "flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  message.role === 'user' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                )}>
                  {message.role === 'user' 
                    ? <MessageSquare className="w-4 h-4" />
                    : <Bot className="w-4 h-4" />
                  }
                </div>
                <div className={cn(
                  "rounded-2xl px-4 py-3 max-w-[85%]",
                  message.role === 'user' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                )}>
                  <p className="text-sm whitespace-pre-wrap" dir="auto">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <Input
            dir="auto"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={language === 'ar' ? 'اكتب سؤالك...' : 'Type your question...'}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
