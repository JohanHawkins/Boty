export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
  options?: string[];
}

export interface ApiError {
  error: string;
}
