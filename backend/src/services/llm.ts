import config from '../config/index.js';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LlmResponse {
  content: string;
  model: string;
}

const SYSTEM_PROMPT =
  'Eres Boty, un asistente útil, amable y conciso. Respondes siempre en el idioma del usuario.';

export async function generateChatReply(messages: ChatMessage[]): Promise<LlmResponse> {
  if (!config.llm.apiKey || config.llm.apiKey === 'tu_api_key_aqui') {
    throw new Error('LLM_API_KEY no configurada. Revisa tu archivo .env');
  }

  const history: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];

  const response = await fetch(config.llm.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.llm.apiKey}`,
    },
    body: JSON.stringify({
      model: config.llm.model,
      messages: history,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Error del LLM (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
    model: string;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('El LLM no devolvió contenido en la respuesta');
  }

  return { content, model: data.model };
}
