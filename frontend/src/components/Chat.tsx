import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types/chat';
import { Message } from './Message';
import { ChatInput } from './ChatInput';

interface ChatProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSend: (content: string) => void;
}

export function Chat({ messages, isLoading, error, onSend }: ChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="chat">
      <div className="chat__messages">
        {messages.length === 0 && (
          <div className="chat__empty">
            <h2>¡Hola! Soy Boty 🤖</h2>
            <p>Pregúntame lo que quieras.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <Message key={i} message={m} />
        ))}
        {isLoading && (
          <div className="message message--bot">
            <div className="message__bubble">
              <span className="message__role">Boty</span>
              <p className="message__text message__text--typing">Escribiendo...</p>
            </div>
          </div>
        )}
        {error && <div className="chat__error">{error}</div>}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={onSend} disabled={isLoading} />
    </div>
  );
}
