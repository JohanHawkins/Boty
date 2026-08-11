import { useChat } from '../hooks/useChat';
import { Chat } from '../components/Chat';

export function ChatPage() {
  const { messages, isLoading, error, sendMessage, clearChat } = useChat();

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">Boty</h1>
        <button className="page__clear" onClick={clearChat} disabled={messages.length === 0}>
          Nueva conversación
        </button>
      </header>
      <Chat messages={messages} isLoading={isLoading} error={error} onSend={sendMessage} />
    </div>
  );
}
