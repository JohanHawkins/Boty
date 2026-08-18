import { pool } from '../db/index.js';

export interface User {
  id: number;
  username: string;
  passwordHash: string;
  createdAt: Date;
}

interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  created_at: Date;
}

function mapRow(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const { rows } = await pool.query<UserRow>(
    'SELECT id, username, password_hash, created_at FROM users WHERE username = $1',
    [username]
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function createUser(username: string, passwordHash: string): Promise<User> {
  const { rows } = await pool.query<UserRow>(
    `INSERT INTO users (username, password_hash)
     VALUES ($1, $2)
     RETURNING id, username, password_hash, created_at`,
    [username, passwordHash]
  );
  return mapRow(rows[0]);
}
