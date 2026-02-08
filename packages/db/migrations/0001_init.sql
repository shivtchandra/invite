-- Invite Platform - PostgreSQL schema (production baseline)
-- Safe to run in a fresh database.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'invite_visibility') then
    create type invite_visibility as enum ('PUBLIC', 'PRIVATE');
  end if;
  if not exists (select 1 from pg_type where typname = 'invite_status') then
    create type invite_status as enum ('DRAFT', 'ACTIVE', 'ARCHIVED', 'CANCELLED');
  end if;
  if not exists (select 1 from pg_type where typname = 'enrichment_status') then
    create type enrichment_status as enum ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
  end if;
  if not exists (select 1 from pg_type where typname = 'participant_response') then
    create type participant_response as enum ('IN', 'MAYBE', 'OUT');
  end if;
end $$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  avatar_url text,
  auth_provider text not null default 'authjs',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  source text not null,                             -- swiggy, google_places, manual
  external_id text,                                 -- swiggy restaurant id / place id
  name text not null,
  location_text text,
  cuisine text,
  rating numeric(2,1),
  image_url text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, external_id)
);

create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references users(id) on delete cascade,
  restaurant_id uuid references restaurants(id) on delete set null,
  slug text not null unique,
  visibility invite_visibility not null default 'PUBLIC',
  status invite_status not null default 'ACTIVE',
  enrichment_status enrichment_status not null default 'PENDING',
  restaurant_name text not null,
  location_text text,
  cuisine text,
  rating numeric(2,1),
  event_time timestamptz,
  people_going integer not null default 0,
  offer_text text,
  note text,
  swiggy_url text,
  image_url text,
  booking_text text,
  source_payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists invite_participants (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null references invites(id) on delete cascade,
  name text not null,
  phone text,
  response participant_response not null,
  message text,
  responded_at timestamptz not null default now(),
  unique (invite_id, phone)
);

create table if not exists invite_events (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null references invites(id) on delete cascade,
  event_name text not null,                         -- invite_opened, invite_shared, responded, etc
  actor_type text not null,                         -- creator, recipient, system
  actor_id text,
  request_id text,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists idempotency_keys (
  key text primary key,
  route text not null,
  request_hash text not null,
  response_status integer not null,
  response_body jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists api_rate_limits (
  id uuid primary key default gen_random_uuid(),
  scope text not null,                              -- ip or user
  identifier text not null,                         -- actual ip/user-id
  route text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (scope, identifier, route, window_start)
);

create index if not exists idx_invites_creator_id on invites (creator_id);
create index if not exists idx_invites_status on invites (status);
create index if not exists idx_invites_event_time on invites (event_time);
create index if not exists idx_invite_participants_invite_id on invite_participants (invite_id);
create index if not exists idx_invite_events_invite_id on invite_events (invite_id);
create index if not exists idx_restaurants_source_external_id on restaurants (source, external_id);
create index if not exists idx_idempotency_expires_at on idempotency_keys (expires_at);

