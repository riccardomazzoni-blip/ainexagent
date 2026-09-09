import { Pool, type QueryResultRow } from "pg";

// Pool riutilizzato tra invocazioni della funzione serverless (Vercel).
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL non impostata");
    }
    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

async function query<T extends QueryResultRow>(text: string, params: unknown[] = []) {
  const client = getPool();
  return client.query<T>(text, params);
}

// Init "pigra": crea le tabelle se non esistono, una sola volta per lifetime
// del processo. Evita di dover gestire migrazioni separate per un progetto
// di queste dimensioni.
let schemaReady = false;

export async function ensureSchema(): Promise<void> {
  if (schemaReady) return;

  await query(`create extension if not exists pgcrypto`);

  await query(`
    create table if not exists ig_posts_queue (
      id uuid primary key default gen_random_uuid(),
      caption text not null,
      image_urls text[] not null,
      scheduled_for timestamptz not null,
      status text not null default 'pending',
      published_at timestamptz,
      permalink text,
      error text,
      created_at timestamptz not null default now()
    )
  `);

  await query(`
    create index if not exists idx_ig_posts_queue_pending
      on ig_posts_queue (scheduled_for)
      where status = 'pending'
  `);

  await query(`
    create table if not exists ig_tokens (
      id int primary key,
      access_token text not null,
      ig_user_id text not null,
      issued_at timestamptz not null,
      expires_at timestamptz not null
    )
  `);

  schemaReady = true;
}

export interface QueuedPost {
  id: string;
  caption: string;
  image_urls: string[];
  scheduled_for: Date;
  status: "pending" | "published" | "failed";
  published_at: Date | null;
  permalink: string | null;
  error: string | null;
  created_at: Date;
}

/** Prossimo post in coda con scheduled_for <= ora, il più vecchio prima. */
export async function getNextDuePost(): Promise<QueuedPost | null> {
  await ensureSchema();
  const result = await query<QueuedPost>(
    `select * from ig_posts_queue
     where status = 'pending' and scheduled_for <= now()
     order by scheduled_for asc
     limit 1`
  );
  return result.rows[0] ?? null;
}

export async function markPostPublished(
  id: string,
  permalink: string | null
): Promise<void> {
  await ensureSchema();
  await query(
    `update ig_posts_queue
     set status = 'published', published_at = now(), permalink = $2, error = null
     where id = $1`,
    [id, permalink]
  );
}

export async function markPostFailed(id: string, error: string): Promise<void> {
  await ensureSchema();
  await query(`update ig_posts_queue set status = 'failed', error = $2 where id = $1`, [
    id,
    error,
  ]);
}

export interface IgToken {
  id: number;
  access_token: string;
  ig_user_id: string;
  issued_at: Date;
  expires_at: Date;
}

export async function getActiveToken(): Promise<IgToken | null> {
  await ensureSchema();
  const result = await query<IgToken>(`select * from ig_tokens where id = 1`);
  return result.rows[0] ?? null;
}

export async function updateTokenExpiry(id: number, expiresAt: Date): Promise<void> {
  await ensureSchema();
  await query(`update ig_tokens set expires_at = $2 where id = $1`, [id, expiresAt]);
}

export async function setToken(token: {
  id: number;
  accessToken: string;
  igUserId: string;
  expiresAt: Date;
}): Promise<void> {
  await ensureSchema();
  await query(
    `insert into ig_tokens (id, access_token, ig_user_id, issued_at, expires_at)
     values ($1, $2, $3, now(), $4)
     on conflict (id) do update set
       access_token = excluded.access_token,
       ig_user_id = excluded.ig_user_id,
       issued_at = now(),
       expires_at = excluded.expires_at`,
    [token.id, token.accessToken, token.igUserId, token.expiresAt]
  );
}
