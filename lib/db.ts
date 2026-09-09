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
// del processo. Le tabelle reali su Neon esistevano già (create prima di
// questo codice) con questa stessa struttura, verificata a mano il 9/9/2026
// via information_schema — qui la replichiamo solo per un setup da zero.
let schemaReady = false;

export async function ensureSchema(): Promise<void> {
  if (schemaReady) return;

  await query(`create extension if not exists pgcrypto`);

  await query(`
    create table if not exists ig_posts_queue (
      id uuid primary key default gen_random_uuid(),
      status text not null default 'scheduled'
        check (status = any (array['scheduled', 'publishing', 'published', 'failed'])),
      caption text not null default '',
      image_urls text[] not null,
      scheduled_for timestamptz not null,
      published_at timestamptz,
      ig_media_id text,
      ig_permalink text,
      error text,
      attempts int not null default 0,
      created_at timestamptz not null default now()
    )
  `);

  await query(`
    create index if not exists idx_ig_posts_queue_scheduled
      on ig_posts_queue (scheduled_for)
      where status = 'scheduled'
  `);

  await query(`
    create table if not exists ig_tokens (
      id int primary key,
      access_token text not null,
      ig_user_id text not null,
      issued_at timestamptz not null,
      expires_at timestamptz not null,
      updated_at timestamptz not null default now()
    )
  `);

  schemaReady = true;
}

export interface QueuedPost {
  id: string;
  status: "scheduled" | "publishing" | "published" | "failed";
  caption: string;
  image_urls: string[];
  scheduled_for: Date;
  published_at: Date | null;
  ig_media_id: string | null;
  ig_permalink: string | null;
  error: string | null;
  attempts: number;
  created_at: Date;
}

/**
 * Reclama atomicamente il prossimo post scaduto in coda: lo sposta in
 * 'publishing' e incrementa attempts in una singola query (FOR UPDATE SKIP
 * LOCKED), così due esecuzioni concorrenti del cron non pubblicano mai lo
 * stesso post due volte.
 */
export async function getNextDuePost(): Promise<QueuedPost | null> {
  await ensureSchema();
  const result = await query<QueuedPost>(`
    update ig_posts_queue
    set status = 'publishing', attempts = attempts + 1
    where id = (
      select id from ig_posts_queue
      where status = 'scheduled' and scheduled_for <= now()
      order by scheduled_for asc
      limit 1
      for update skip locked
    )
    returning *
  `);
  return result.rows[0] ?? null;
}

export async function markPostPublished(
  id: string,
  mediaId: string,
  permalink: string | null
): Promise<void> {
  await ensureSchema();
  await query(
    `update ig_posts_queue
     set status = 'published', published_at = now(), ig_media_id = $2, ig_permalink = $3, error = null
     where id = $1`,
    [id, mediaId, permalink]
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
  updated_at: Date;
}

export async function getActiveToken(): Promise<IgToken | null> {
  await ensureSchema();
  const result = await query<IgToken>(`select * from ig_tokens where id = 1`);
  return result.rows[0] ?? null;
}

export async function updateTokenExpiry(id: number, expiresAt: Date): Promise<void> {
  await ensureSchema();
  await query(`update ig_tokens set expires_at = $2, updated_at = now() where id = $1`, [
    id,
    expiresAt,
  ]);
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
       expires_at = excluded.expires_at,
       updated_at = now()`,
    [token.id, token.accessToken, token.igUserId, token.expiresAt]
  );
}
