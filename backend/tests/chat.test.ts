import { describe, expect, it, vi } from 'vitest';
import type { Response } from 'express';
import { chat } from '../src/controllers/chat.js';
import { generateChatReply } from '../src/services/llm.js';
import { HttpError } from '../src/middleware/error.js';

vi.mock('../src/services/llm.js', () => ({
  generateChatReply: vi.fn(),
}));

const mockedGenerate = vi.mocked(generateChatReply);

function mockRes() {
  const res = { json: vi.fn() };
  return res as unknown as Response;
}

describe('chat controller', () => {
  it('rechaza si "messages" falta o no es un arreglo', async () => {
    const res = mockRes();
    await expect(chat({ body: {} } as never, res)).rejects.toBeInstanceOf(HttpError);
    await expect(chat({ body: { messages: 'nope' } } as never, res)).rejects.toBeInstanceOf(HttpError);
  });

  it('rechaza un arreglo vacío', async () => {
    const res = mockRes();
    await expect(chat({ body: { messages: [] } } as never, res)).rejects.toBeInstanceOf(HttpError);
  });

  it('rechaza mensajes con forma inválida', async () => {
    const res = mockRes();
    await expect(
      chat({ body: { messages: [{ role: 'system', content: 'x' }] } } as never, res)
    ).rejects.toBeInstanceOf(HttpError);
  });

  it('llama al LLM y responde con el mensaje del asistente', async () => {
    const res = mockRes();
    mockedGenerate.mockResolvedValue({ content: 'Hola', model: 'gpt-4o-mini' });

    await chat(
      { body: { messages: [{ role: 'user', content: 'Hola' }] } } as never,
      res
    );

    expect(mockedGenerate).toHaveBeenCalledWith([{ role: 'user', content: 'Hola' }]);
    expect(res.json).toHaveBeenCalledWith({
      role: 'assistant',
      content: 'Hola',
      model: 'gpt-4o-mini',
    });
  });

  it('incluye "options" en la respuesta cuando el LLM las devuelve', async () => {
    const res = mockRes();
    const options = ['Gestion de Correos y Contraseñas', 'Recordatorios', 'Guardar informacion'];
    mockedGenerate.mockResolvedValue({
      content: '¡Hola!',
      model: 'demo-mode',
      options,
    });

    await chat({ body: { messages: [{ role: 'user', content: 'hola' }] } } as never, res);

    expect(res.json).toHaveBeenCalledWith({
      role: 'assistant',
      content: '¡Hola!',
      model: 'demo-mode',
      options,
    });
  });
});
