import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { createUser, findUserByUsername, type User } from '../models/user.js';
import { HttpError } from '../middleware/error.js';

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 50;
export const PASSWORD_MIN = 4;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) {
    return false;
  }
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function registerUser(username: string, password: string): Promise<User> {
  const name = username.trim();

  if (name.length < USERNAME_MIN || name.length > USERNAME_MAX) {
    throw new HttpError(
      400,
      `El nombre de usuario debe tener entre ${USERNAME_MIN} y ${USERNAME_MAX} caracteres`
    );
  }
  if (password.length < PASSWORD_MIN) {
    throw new HttpError(400, `El acceso debe tener al menos ${PASSWORD_MIN} caracteres`);
  }

  const existing = await findUserByUsername(name);
  if (existing) {
    throw new HttpError(409, 'El nombre de usuario ya está en uso');
  }

  return createUser(name, hashPassword(password));
}
