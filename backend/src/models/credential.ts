import { pool } from '../db/index.js';

export interface Credential {
  id: number;
  userId: number;
  title: string;
  value: string;
  createdAt: Date;
}

interface CredentialRow {
  id: number;
  user_id: number;
  title: string;
  value: string;
  created_at: Date;
}

function mapRow(row: CredentialRow): Credential {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    value: row.value,
    createdAt: row.created_at,
  };
}

export async function createCredential(
  userId: number,
  title: string,
  value: string
): Promise<Credential> {
  const { rows } = await pool.query<CredentialRow>(
    `INSERT INTO credentials (user_id, title, value)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, title, value, created_at`,
    [userId, title, value]
  );
  return mapRow(rows[0]);
}

export async function findCredentialsByUserId(userId: number): Promise<Credential[]> {
  const { rows } = await pool.query<CredentialRow>(
    `SELECT id, user_id, title, value, created_at
     FROM credentials
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows.map(mapRow);
}
