import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/config/index.js', () => ({
  default: {
    llm: { mode: 'demo', apiKey: '', model: 'x', url: 'y' },
    db: { url: 'postgres://x:x@localhost:5432/boty' },
  },
}));

vi.mock('../src/models/user.js', () => ({
  findUserByUsername: vi.fn(),
}));

vi.mock('../src/models/credential.js', () => ({
  createCredential: vi.fn(),
  findCredentialsByUserId: vi.fn(),
}));

vi.mock('../src/services/auth.js', () => ({
  verifyPassword: vi.fn(),
  registerUser: vi.fn(),
  USERNAME_MIN: 3,
  USERNAME_MAX: 50,
  PASSWORD_MIN: 4,
}));

import { generateChatReply } from '../src/services/llm.js';
import { findUserByUsername } from '../src/models/user.js';
import { createCredential, findCredentialsByUserId } from '../src/models/credential.js';
import { verifyPassword, registerUser } from '../src/services/auth.js';

const mockedFind = vi.mocked(findUserByUsername);
const mockedVerify = vi.mocked(verifyPassword);
const mockedRegister = vi.mocked(registerUser);
const mockedCreate = vi.mocked(createCredential);
const mockedList = vi.mocked(findCredentialsByUserId);

const demoUser = {
  id: 1,
  username: 'juan',
  passwordHash: 'salt:hash',
  createdAt: new Date(),
};

const anaUser = {
  id: 7,
  username: 'ana',
  passwordHash: 'salt:hash',
  createdAt: new Date(),
};

const identifiedHistory = [
  { role: 'user', content: 'ana 1234' },
  { role: 'assistant', content: '¡Hola ana! Tu acceso es correcto. ¿En qué te puedo ayudar?' },
] as const;

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

  it('verifica las credenciales contra la BD al enviar usuario y acceso', async () => {
    mockedFind.mockResolvedValue({
      id: 1,
      username: 'ana',
      passwordHash: 'salt:hash',
      createdAt: new Date(),
    });
    mockedVerify.mockReturnValue(true);

    const res = await generateChatReply([{ role: 'user', content: 'ana 1234' }]);

    expect(mockedFind).toHaveBeenCalledWith('ana');
    expect(mockedVerify).toHaveBeenCalledWith('1234', 'salt:hash');
    expect(res.content).toContain('¡Hola ana!');
  });

  it('informa cuando el usuario no está registrado', async () => {
    mockedFind.mockResolvedValue(null);

    const res = await generateChatReply([{ role: 'user', content: 'nadie 9999' }]);

    expect(res.content).toContain('No tengo registrado el usuario "nadie"');
  });

  it('informa cuando el acceso no coincide', async () => {
    mockedFind.mockResolvedValue({
      id: 1,
      username: 'ana',
      passwordHash: 'salt:hash',
      createdAt: new Date(),
    });
    mockedVerify.mockReturnValue(false);

    const res = await generateChatReply([{ role: 'user', content: 'ana 9999' }]);

    expect(res.content).toContain('no coincide');
  });

  describe('registro de usuarios desde el chat', () => {
    const askForUsername = [
      {
        role: 'assistant',
        content:
          'Por favor, dime tu nombre de usuario y tu acceso. Si no lo tienes, dímelo y lo creamos.',
      },
      { role: 'user', content: 'no tengo' },
    ];

    it('guía el registro completo: no tengo → usuario → acceso → cuenta creada', async () => {
      mockedFind.mockResolvedValue(null);
      mockedRegister.mockResolvedValue({ ...demoUser, username: 'juan' });

      const step1 = await generateChatReply(askForUsername);
      expect(step1.content).toContain('Dime tu nombre de usuario');

      const step2 = await generateChatReply([
        ...askForUsername,
        { role: 'assistant', content: step1.content },
        { role: 'user', content: 'juan' },
      ]);
      expect(step2.content).toContain('está disponible');
      expect(step2.content).toContain('tu acceso');

      const step3 = await generateChatReply([
        ...askForUsername,
        { role: 'assistant', content: step1.content },
        { role: 'user', content: 'juan' },
        { role: 'assistant', content: step2.content },
        { role: 'user', content: '1234' },
      ]);
      expect(mockedRegister).toHaveBeenCalledWith('juan', '1234');
      expect(step3.content).toContain('creada correctamente');
    });

    it('avisa si el nombre de usuario ya está en uso', async () => {
      mockedFind.mockResolvedValue({
        id: 1,
        username: 'ana',
        passwordHash: 'salt:hash',
        createdAt: new Date(),
      });

      const res = await generateChatReply([
        {
          role: 'assistant',
          content: '¡Perfecto! Vamos a crear tu cuenta. Dime tu nombre de usuario para registrarte.',
        },
        { role: 'user', content: 'ana' },
      ]);

      expect(res.content).toContain('ya está en uso');
    });

    it('crea la cuenta al confirmar con "si" desde "¿Quieres que lo cree?"', async () => {
      const res = await generateChatReply([
        {
          role: 'assistant',
          content:
            'No tengo registrado el usuario "ana". ¿Quieres que lo cree? Dime tu nombre de usuario y tu acceso y lo registro.',
        },
        { role: 'user', content: 'si' },
      ]);

      expect(res.content).toContain('Dime tu nombre de usuario');
    });

    it('registra de una sola vez usuario y acceso al confirmar', async () => {
      mockedFind.mockResolvedValue(null);
      mockedRegister.mockResolvedValue({ ...demoUser, username: 'ana' });

      const res = await generateChatReply([
        {
          role: 'assistant',
          content:
            'No tengo registrado el usuario "ana". ¿Quieres que lo cree? Dime tu nombre de usuario y tu acceso y lo registro.',
        },
        { role: 'user', content: 'ana 1234' },
      ]);

      expect(mockedRegister).toHaveBeenCalledWith('ana', '1234');
      expect(res.content).toContain('creada correctamente');
    });

    it('respeta la decisión de no crear la cuenta', async () => {
      const res = await generateChatReply([
        {
          role: 'assistant',
          content:
            'No tengo registrado el usuario "ana". ¿Quieres que lo cree? Dime tu nombre de usuario y tu acceso y lo registro.',
        },
        { role: 'user', content: 'no' },
      ]);

      expect(res.content).toContain('no crearé la cuenta');
    });
  });

  describe('gestión de credenciales del usuario identificado', () => {
    it('ofrece Guardar y Consultar al elegir Gestión de Correos', async () => {
      const res = await generateChatReply([
        ...identifiedHistory,
        { role: 'user', content: 'Gestion de Correos y Contraseñas' },
      ]);

      expect(res.options).toEqual(['Guardar Contraseñas', 'Contraseñas Guardadas']);
      expect(res.content).toContain('¿Qué deseas hacer?');
    });

    it('pide credenciales si no está identificado al querer guardar', async () => {
      const res = await generateChatReply([
        { role: 'user', content: 'Guardar Contraseñas' },
      ]);

      expect(res.content).toContain('dime tu nombre de usuario y tu acceso');
    });

    it('guía el guardado: opción → título → valor → credencial creada', async () => {
      mockedFind.mockResolvedValue(anaUser);

      const step1 = await generateChatReply([
        ...identifiedHistory,
        { role: 'user', content: 'Guardar Contraseñas' },
      ]);
      expect(step1.content).toContain('dime qué quieres guardar');

      const step2 = await generateChatReply([
        ...identifiedHistory,
        { role: 'user', content: 'Guardar Contraseñas' },
        { role: 'assistant', content: step1.content },
        { role: 'user', content: 'correo de trabajo' },
      ]);
      expect(step2.content).toContain('correo de trabajo');
      expect(step2.content).toContain('Ahora dime el valor');

      const step3 = await generateChatReply([
        ...identifiedHistory,
        { role: 'user', content: 'Guardar Contraseñas' },
        { role: 'assistant', content: step1.content },
        { role: 'user', content: 'correo de trabajo' },
        { role: 'assistant', content: step2.content },
        { role: 'user', content: 'pass123' },
      ]);

      expect(mockedCreate).toHaveBeenCalledWith(7, 'correo de trabajo', 'pass123');
      expect(step3.content).toContain('Guardé el dato "correo de trabajo"');
    });

    it('lista las contraseñas guardadas', async () => {
      mockedFind.mockResolvedValue(anaUser);
      mockedList.mockResolvedValue([
        { id: 1, userId: 7, title: 'netflix', value: 'pass456', createdAt: new Date() },
        { id: 2, userId: 7, title: 'gmail', value: 'correo123', createdAt: new Date() },
      ]);

      const res = await generateChatReply([
        ...identifiedHistory,
        { role: 'user', content: 'Contraseñas Guardadas' },
      ]);

      expect(res.content).toContain('netflix: pass456');
      expect(res.content).toContain('gmail: correo123');
    });

    it('avisa cuando aún no hay contraseñas guardadas', async () => {
      mockedFind.mockResolvedValue(anaUser);
      mockedList.mockResolvedValue([]);

      const res = await generateChatReply([
        ...identifiedHistory,
        { role: 'user', content: 'Contraseñas Guardadas' },
      ]);

      expect(res.content).toContain('Aún no tienes contraseñas guardadas');
    });
  });
});
