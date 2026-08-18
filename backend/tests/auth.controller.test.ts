import { describe, expect, it, vi } from 'vitest';
import type { Response } from 'express';
import { register } from '../src/controllers/auth.js';
import { registerUser } from '../src/services/auth.js';
import { HttpError } from '../src/middleware/error.js';

vi.mock('../src/services/auth.js', () => ({
  registerUser: vi.fn(),
}));

const mockedRegister = vi.mocked(registerUser);

function mockRes() {
  const res = { json: vi.fn(), status: vi.fn().mockReturnThis() } as unknown as Response;
  return res as unknown as Response & { json: ReturnType<typeof vi.fn>; status: ReturnType<typeof vi.fn> };
}

describe('auth controller', () => {
  it('rechaza si faltan username o password', async () => {
    const res = mockRes();
    await expect(register({ body: {} } as never, res)).rejects.toBeInstanceOf(HttpError);
    await expect(register({ body: { username: 'ana' } } as never, res)).rejects.toBeInstanceOf(
      HttpError
    );
  });

  it('registra al usuario y responde 201', async () => {
    const res = mockRes();
    mockedRegister.mockResolvedValue({
      id: 1,
      username: 'ana',
      passwordHash: 'salt:hash',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    });

    await register({ body: { username: 'ana', password: '1234' } } as never, res);

    expect(mockedRegister).toHaveBeenCalledWith('ana', '1234');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: 1,
      username: 'ana',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    });
  });
});
