import type { ChatMessage } from '../types/chat';

interface MessageProps {
  message: ChatMessage;
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`message ${isUser ? 'message--user' : 'message--bot'}`}>
      <div className="message__bubble">
        <span className="message__role">{isUser ? 'Tú' : 'Boty'}</span>
        <p className="message__text">{message.content}</p>
      </div>
    </div>
  );
}
