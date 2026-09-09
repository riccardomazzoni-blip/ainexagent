-- Schema DB per il progetto ainexagent.
-- Neon non accetta più istruzioni separate da ';' in una sola query dalla
-- tab Query del dashboard Vercel: eseguire un blocco alla volta.
-- Nota: lib/db.ts esegue comunque questo stesso schema in modo "pigro"
-- (CREATE TABLE IF NOT EXISTS) alla prima query di ogni funzione serverless,
-- quindi in condizioni normali non serve eseguirlo a mano.

create extension if not exists pgcrypto;

create table if not exists ig_posts_queue (
  id uuid primary key default gen_random_uuid(),
  caption text not null,
  image_urls text[] not null,
  scheduled_for timestamptz not null,
  status text not null default 'pending', -- pending | published | failed
  published_at timestamptz,
  permalink text,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ig_posts_queue_pending
  on ig_posts_queue (scheduled_for)
  where status = 'pending';

create table if not exists ig_tokens (
  id int primary key,
  access_token text not null,
  ig_user_id text not null,
  issued_at timestamptz not null,
  expires_at timestamptz not null
);
