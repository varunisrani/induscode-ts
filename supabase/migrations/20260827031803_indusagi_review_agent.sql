create extension if not exists pgcrypto;

create table if not exists public.indusagi_review_deliveries (
  delivery_id text primary key,
  event_name text not null,
  received_at timestamptz not null default now()
);

create table if not exists public.indusagi_review_jobs (
  id uuid primary key default gen_random_uuid(),
  delivery_id text references public.indusagi_review_deliveries(delivery_id) on delete set null,
  installation_id bigint not null,
  repository text not null,
  owner text not null,
  repo text not null,
  pr_number integer not null check (pr_number > 0),
  head_sha text not null,
  title text not null,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  available_at timestamptz not null default now(),
  worker_id text,
  claimed_at timestamptz,
  completed_at timestamptz,
  review jsonb,
  github_review_id bigint,
  github_comment_id bigint,
  check_run_id bigint,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (repository, pr_number, head_sha)
);

create index if not exists indusagi_review_jobs_claim_idx
  on public.indusagi_review_jobs (status, available_at, created_at)
  where status = 'pending';
create index if not exists indusagi_review_jobs_pr_idx
  on public.indusagi_review_jobs (repository, pr_number, created_at desc);

alter table public.indusagi_review_deliveries enable row level security;
alter table public.indusagi_review_jobs enable row level security;

create or replace function public.claim_indusagi_review_job(p_worker_id text)
returns setof public.indusagi_review_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed public.indusagi_review_jobs;
begin
  if nullif(trim(p_worker_id), '') is null then
    raise exception 'worker id is required';
  end if;

  select * into claimed
  from public.indusagi_review_jobs
  where status = 'pending' and available_at <= now()
  order by created_at
  for update skip locked
  limit 1;

  if claimed.id is null then
    return;
  end if;

  update public.indusagi_review_jobs
  set status = 'running',
      attempts = attempts + 1,
      worker_id = p_worker_id,
      claimed_at = now(),
      updated_at = now()
  where id = claimed.id
  returning * into claimed;

  return next claimed;
end;
$$;

create or replace function public.recover_stale_indusagi_review_jobs(p_stale_minutes integer default 15)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  recovered integer;
begin
  update public.indusagi_review_jobs
  set status = case when attempts < max_attempts then 'pending' else 'failed' end,
      available_at = now(),
      worker_id = null,
      claimed_at = null,
      error = coalesce(error, 'worker lease expired'),
      completed_at = case when attempts >= max_attempts then now() else completed_at end,
      updated_at = now()
  where status = 'running'
    and claimed_at < now() - make_interval(mins => greatest(1, p_stale_minutes));
  get diagnostics recovered = row_count;
  return recovered;
end;
$$;

revoke all on function public.claim_indusagi_review_job(text) from public, anon, authenticated;
revoke all on function public.recover_stale_indusagi_review_jobs(integer) from public, anon, authenticated;
grant execute on function public.claim_indusagi_review_job(text) to service_role;
grant execute on function public.recover_stale_indusagi_review_jobs(integer) to service_role;
