import { useCallback, useRef, useState } from 'react';
import type { ChatMessage } from '../types/chat';
import { sendChat } from '../services/api';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const historyRef = useRef<ChatMessage[]>([]);

  const sendMessage = useCallback(async (content: string) => {
    const text = content.trim();
    if (!text) {
      return;
    }

    const userMessage: ChatMessage = { role: 'user', content: text };
    const history = [...historyRef.current, userMessage];
    historyRef.current = history;
    setMessages(history);
    setIsLoading(true);
    setError(null);

    try {
      const assistantMessage = await sendChat(history);
      historyRef.current = [...history, assistantMessage];
      setMessages(historyRef.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    historyRef.current = [];
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearChat };
}
