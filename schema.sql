-- Schema DB per il progetto ainexagent.
-- Verificato contro il database reale su Neon il 9 settembre 2026
-- (information_schema.columns + pg_constraint), non più una ricostruzione
-- approssimativa. lib/db.ts esegue questo stesso schema in modo "pigro"
-- (CREATE TABLE IF NOT EXISTS) alla prima query di ogni funzione serverless,
-- quindi in condizioni normali non serve eseguirlo a mano.

create extension if not exists pgcrypto;

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
);

create index if not exists idx_ig_posts_queue_scheduled
  on ig_posts_queue (scheduled_for)
  where status = 'scheduled';

create table if not exists ig_tokens (
  id int primary key,
  access_token text not null,
  ig_user_id text not null,
  issued_at timestamptz not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);
