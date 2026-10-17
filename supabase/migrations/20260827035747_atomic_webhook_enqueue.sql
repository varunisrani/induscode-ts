create or replace function public.enqueue_indusagi_review_job(
  p_delivery_id text,
  p_event_name text,
  p_installation_id bigint,
  p_repository text,
  p_owner text,
  p_repo text,
  p_pr_number integer,
  p_head_sha text,
  p_title text
)
returns table(job_id uuid, duplicate boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  queued_id uuid;
  inserted_delivery integer;
begin
  if nullif(trim(p_delivery_id), '') is null
    or nullif(trim(p_event_name), '') is null
    or p_installation_id <= 0
    or nullif(trim(p_repository), '') is null
    or nullif(trim(p_owner), '') is null
    or nullif(trim(p_repo), '') is null
    or p_pr_number <= 0
    or nullif(trim(p_head_sha), '') is null
    or nullif(trim(p_title), '') is null then
    raise exception 'invalid review webhook job';
  end if;

  insert into public.indusagi_review_deliveries(delivery_id, event_name)
  values (p_delivery_id, p_event_name)
  on conflict (delivery_id) do nothing;
  get diagnostics inserted_delivery = row_count;

  if inserted_delivery = 0 then
    return query select null::uuid, true;
    return;
  end if;

  insert into public.indusagi_review_jobs(
    delivery_id,
    installation_id,
    repository,
    owner,
    repo,
    pr_number,
    head_sha,
    title
  ) values (
    p_delivery_id,
    p_installation_id,
    p_repository,
    p_owner,
    p_repo,
    p_pr_number,
    p_head_sha,
    p_title
  )
  on conflict (repository, pr_number, head_sha) do update
  set installation_id = excluded.installation_id,
      title = excluded.title,
      updated_at = now()
  returning id into queued_id;

  return query select queued_id, false;
end;
$$;

revoke all on function public.enqueue_indusagi_review_job(text, text, bigint, text, text, text, integer, text, text)
  from public, anon, authenticated;
grant execute on function public.enqueue_indusagi_review_job(text, text, bigint, text, text, text, integer, text, text)
  to service_role;
