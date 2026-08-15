import { Request, Response } from 'express';
import { generateChatReply } from '../services/llm.js';
import { HttpError } from '../middleware/error.js';

interface ChatRequestBody {
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export async function chat(req: Request, res: Response): Promise<void> {
  const { messages } = req.body as ChatRequestBody;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new HttpError(400, 'El campo "messages" es requerido y debe ser un arreglo no vacío');
  }

  const invalid = messages.some(
    (m) =>
      !m ||
      typeof m.content !== 'string' ||
      (m.role !== 'user' && m.role !== 'assistant')
  );
  if (invalid) {
    throw new HttpError(
      400,
      'Cada mensaje debe tener role ("user" o "assistant") y content (string)'
    );
  }

  const result = await generateChatReply(messages);
  res.json({
    role: 'assistant',
    content: result.content,
    model: result.model,
    ...(result.options ? { options: result.options } : {}),
  });
}
