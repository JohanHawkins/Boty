import { useCallback, useRef, useState } from 'react';
import type { ChatMessage } from '../types/chat';
import { sendChat } from '../services/api';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const historyRef = useRef<ChatMessage[]>([]);
  const sendingRef = useRef(false);
  const requestIdRef = useRef(0);

  const sendMessage = useCallback(async (content: string) => {
    const text = content.trim();
    if (!text || sendingRef.current) {
      return;
    }

    const userMessage: ChatMessage = { role: 'user', content: text };
    const history = [...historyRef.current, userMessage];
    historyRef.current = history;
    setMessages(history);
    sendingRef.current = true;
    setIsLoading(true);
    setError(null);

    const requestId = requestIdRef.current;

    try {
      const assistantMessage = await sendChat(history);
      if (requestId !== requestIdRef.current) {
        return;
      }
      historyRef.current = [...history, assistantMessage];
      setMessages(historyRef.current);
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      sendingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    requestIdRef.current += 1;
    sendingRef.current = false;
    historyRef.current = [];
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearChat };
}
