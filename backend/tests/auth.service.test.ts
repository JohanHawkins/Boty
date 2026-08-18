import { describe, expect, it, vi } from 'vitest';
import type { User } from '../src/models/user.js';

vi.mock('../src/models/user.js', () => ({
  createUser: vi.fn(),
  findUserByUsername: vi.fn(),
}));

import { createUser, findUserByUsername } from '../src/models/user.js';
import { hashPassword, registerUser, verifyPassword } from '../src/services/auth.js';
import { HttpError } from '../src/middleware/error.js';

const mockedFind = vi.mocked(findUserByUsername);
const mockedCreate = vi.mocked(createUser);

const userRow: User = {
  id: 1,
  username: 'ana',
  passwordHash: 'salt:hash',
  createdAt: new Date(),
};

describe('auth service', () => {
  it('hashPassword y verifyPassword funcionan en par', () => {
    const stored = hashPassword('secreto');
    expect(stored).toContain(':');
    expect(verifyPassword('secreto', stored)).toBe(true);
    expect(verifyPassword('otro', stored)).toBe(false);
  });

  it('verifyPassword devuelve false ante un hash inválido', () => {
    expect(verifyPassword('x', 'sin-formato')).toBe(false);
  });

  it('registra un usuario nuevo', async () => {
    mockedFind.mockResolvedValue(null);
    mockedCreate.mockResolvedValue(userRow);

    const user = await registerUser('ana', '1234');

    expect(user).toEqual(userRow);
    expect(mockedCreate).toHaveBeenCalledWith('ana', expect.stringContaining(':'));
  });

  it('rechaza username corto o password corta', async () => {
    await expect(registerUser('a', '1234')).rejects.toBeInstanceOf(HttpError);
    await expect(registerUser('ana', '12')).rejects.toBeInstanceOf(HttpError);
  });

  it('rechaza un username ya registrado', async () => {
    mockedFind.mockResolvedValue(userRow);
    await expect(registerUser('ana', '1234')).rejects.toBeInstanceOf(HttpError);
  });
});
