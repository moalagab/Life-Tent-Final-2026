/**
 * AICoachPanel — Claude-powered personal coach widget.
 *
 * Modes:
 *   - Daily Briefing button: requests a morning summary
 *   - Chat input: free conversation with user context
 *
 * Used in Dashboard (Index.tsx) and can be embedded anywhere.
 */
import { useRef, useEffect, useState } from 'react';
import { Sparkles, Send, RotateCcw, Sun, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAICoach } from '@/hooks/useAICoach';
import { useLanguage } from '@/hooks/useLanguage';

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  const isUser = role === 'user';
  return (
    <div className={cn('flex gap-2 items-end', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm',
        )}
      >
        {content}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface AICoachPanelProps {
  className?: string;
}

export function AICoachPanel({ className }: AICoachPanelProps) {
  const { messages, isLoading, error, sendMessage, requestBriefing, clearMessages } = useAICoach();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';

  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className={cn('flex flex-col rounded-xl border border-border/50 bg-background overflow-hidden', className)}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="font-semibold text-sm text-foreground">
            {isAr ? 'مساعدك الشخصي' : 'AI Coach'}
          </span>
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
        </div>
        {!isEmpty && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-[160px] max-h-[340px]">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full py-6 gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-500" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              {isAr
                ? 'اطلب ملخصك اليومي أو تحدث معي عن يومك'
                : 'Request your daily briefing or start chatting'}
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble key={i} role={msg.role} content={msg.content} />
          ))
        )}
        {error && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick action */}
      {isEmpty && (
        <div className="px-3 pb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={requestBriefing}
            disabled={isLoading}
            className="w-full gap-2 text-amber-600 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-900/40 dark:hover:bg-amber-900/20"
          >
            <Sun className="w-3.5 h-3.5" />
            {isAr ? 'ملخص الصباح' : 'Morning Briefing'}
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border/40 px-3 py-2.5 flex gap-2 items-end bg-muted/10">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isAr ? 'اكتب رسالتك...' : 'Type a message…'}
          disabled={isLoading}
          rows={1}
          className="flex-1 resize-none min-h-[36px] max-h-[100px] text-sm rounded-lg border-border/50 bg-background"
          dir={isAr ? 'rtl' : 'ltr'}
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="h-9 w-9 p-0 shrink-0"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className={cn('w-4 h-4', isAr && 'scale-x-[-1]')} />
          )}
        </Button>
      </div>

    </div>
  );
}
