import type { ApiError, ChatMessage } from '../types/chat';

export async function sendChat(messages: ChatMessage[]): Promise<ChatMessage> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    const body: ApiError | null = await res.json().catch(() => null);
    throw new Error(body?.error || `Error del servidor (${res.status})`);
  }

  return (await res.json()) as ChatMessage;
}
