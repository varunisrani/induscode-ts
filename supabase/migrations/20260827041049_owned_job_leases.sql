alter table public.indusagi_review_jobs
  add column if not exists lease_token uuid,
  add column if not exists lease_expires_at timestamptz;

create index if not exists indusagi_review_jobs_lease_expiry_idx
  on public.indusagi_review_jobs (lease_expires_at)
  where status = 'running';

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
      lease_token = gen_random_uuid(),
      claimed_at = now(),
      lease_expires_at = now() + interval '5 minutes',
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
      lease_token = null,
      claimed_at = null,
      lease_expires_at = null,
      error = coalesce(error, 'worker lease expired'),
      completed_at = case when attempts >= max_attempts then now() else completed_at end,
      updated_at = now()
  where status = 'running'
    and coalesce(
      lease_expires_at,
      claimed_at + make_interval(mins => greatest(1, p_stale_minutes))
    ) < now();
  get diagnostics recovered = row_count;
  return recovered;
end;
$$;

revoke all on function public.claim_indusagi_review_job(text) from public, anon, authenticated;
revoke all on function public.recover_stale_indusagi_review_jobs(integer) from public, anon, authenticated;
grant execute on function public.claim_indusagi_review_job(text) to service_role;
grant execute on function public.recover_stale_indusagi_review_jobs(integer) to service_role;
