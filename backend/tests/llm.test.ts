import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/config/index.js', () => ({
  default: {
    llm: { mode: 'demo', apiKey: '', model: 'x', url: 'y' },
  },
}));

import { generateChatReply } from '../src/services/llm.js';

describe('modo demo', () => {
  it('responde sin API key cuando LLM_MODE=demo', async () => {
    const res = await generateChatReply([{ role: 'user', content: 'hola' }]);
    expect(res.model).toBe('demo-mode');
    expect(res.content).toBeTruthy();
  });

  it('reconoce preguntas sobre quién es', async () => {
    const res = await generateChatReply([{ role: 'user', content: 'quién eres?' }]);
    expect(res.content).toMatch(/Boty/);
  });
});
