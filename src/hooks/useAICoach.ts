import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type CoachMode = 'briefing' | 'chat' | 'habit';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UseAICoachReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string, mode?: CoachMode) => Promise<void>;
  requestBriefing: () => Promise<void>;
  clearMessages: () => void;
}

export function useAICoach(): UseAICoachReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callCoach = useCallback(async (
    mode: CoachMode,
    userMessage?: string,
  ) => {
    setIsLoading(true);
    setError(null);

    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) {
      setError('يجب تسجيل الدخول أولاً');
      setIsLoading(false);
      return;
    }

    // Add user message to state immediately (optimistic)
    const newUserMsg: ChatMessage | null = userMessage
      ? { role: 'user', content: userMessage }
      : null;

    const updatedMessages = newUserMsg ? [...messages, newUserMsg] : messages;
    if (newUserMsg) setMessages(updatedMessages);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/ai-coach`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode,
          message: userMessage ?? '',
          session_messages: updatedMessages.slice(0, -1), // send history without last user msg
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message ?? `HTTP ${res.status}`);
      }

      const contentType = res.headers.get('content-type') ?? '';
      if (contentType.includes('text/event-stream') && res.body) {
        // Stream the response
        const assistantMsg: ChatMessage = { role: 'assistant', content: '' };
        setMessages(prev => [...prev, assistantMsg]);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const delta =
                parsed.delta?.text ??
                parsed.choices?.[0]?.delta?.content ??
                '';
              if (delta) {
                setMessages(prev => {
                  const copy = [...prev];
                  copy[copy.length - 1] = {
                    ...copy[copy.length - 1],
                    content: copy[copy.length - 1].content + delta,
                  };
                  return copy;
                });
              }
            } catch {
              // ignore parse errors on partial chunks
            }
          }
        }
      } else {
        // Non-streaming fallback
        const json = await res.json();
        const content = json.content ?? json.message ?? 'لم يرد المساعد';
        setMessages(prev => [...prev, { role: 'assistant', content }]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطأ غير متوقع';
      setError(msg);
      // Remove the optimistic user message on error
      if (newUserMsg) {
        setMessages(prev => prev.filter(m => m !== newUserMsg));
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const sendMessage = useCallback((text: string, mode: CoachMode = 'chat') => {
    return callCoach(mode, text);
  }, [callCoach]);

  const requestBriefing = useCallback(() => {
    return callCoach('briefing');
  }, [callCoach]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, requestBriefing, clearMessages };
}
