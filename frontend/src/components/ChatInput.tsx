import { useState, type FormEvent } from 'react';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) {
      return;
    }
    onSend(text);
    setValue('');
  };

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <input
        className="chat-input__field"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Escribe un mensaje..."
        disabled={disabled}
        autoFocus
      />
      <button className="chat-input__button" type="submit" disabled={disabled || !value.trim()}>
        Enviar
      </button>
    </form>
  );
}
