import type { ChatMessage } from '../types/chat';

interface MessageProps {
  message: ChatMessage;
  onSelectOption?: (option: string) => void;
  disabled?: boolean;
}

export function Message({ message, onSelectOption, disabled }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`message ${isUser ? 'message--user' : 'message--bot'}`}>
      <div className="message__bubble">
        <span className="message__role">{isUser ? 'Tú' : 'Boty'}</span>
        <p className="message__text">{message.content}</p>
        {message.options && message.options.length > 0 && (
          <div className="message__options">
            {message.options.map((option) => (
              <button
                key={option}
                type="button"
                className="message__option"
                onClick={() => onSelectOption?.(option)}
                disabled={disabled}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
