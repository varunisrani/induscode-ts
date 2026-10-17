alter table public.indusagi_review_jobs
  add column if not exists check_completed_at timestamptz;

create index if not exists indusagi_review_jobs_check_reconcile_idx
  on public.indusagi_review_jobs (completed_at)
  where status = 'completed'
    and check_run_id is not null
    and check_completed_at is null;
