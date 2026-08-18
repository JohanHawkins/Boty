import { Request, Response } from 'express';
import { registerUser } from '../services/auth.js';
import { HttpError } from '../middleware/error.js';

interface RegisterRequestBody {
  username?: unknown;
  password?: unknown;
}

export async function register(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body as RegisterRequestBody;

  if (typeof username !== 'string' || typeof password !== 'string') {
    throw new HttpError(400, 'Los campos "username" y "password" son requeridos');
  }

  const user = await registerUser(username, password);
  res.status(201).json({
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
  });
}
