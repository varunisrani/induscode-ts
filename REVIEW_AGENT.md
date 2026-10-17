# Indusagi GitHub Review Agent

A Supabase-backed GitHub pull-request reviewer powered by the same Indusagi framework Agent and `SessionConductor` as the terminal coding agent.

## What it does

1. Receives signed GitHub `pull_request` webhooks.
2. Atomically deduplicates deliveries and persists durable jobs in Supabase.
3. Claims work with PostgreSQL `FOR UPDATE SKIP LOCKED`.
4. Exchanges GitHub App credentials for a short-lived installation token.
5. Reads PR metadata, every changed-file page, and the unified diff.
6. Runs the Indusagi conductor with read-only `github_read_file` and `github_search_code` tools.
7. Validates structured findings against actual changed diff lines.
8. Posts a formal GitHub review with inline comments; falls back to one sticky timeline comment if GitHub rejects line coordinates.
9. Publishes a GitHub check run, stores the result in Supabase, and reconciles failed check updates.

The service never checks out or executes pull-request code.

## Supabase

This repository is configured to default to the requested project:

- Project: `sdsdsd`
- Project ref: `bnaadeovgcqgbrnrfcef`
- URL: `https://bnaadeovgcqgbrnrfcef.supabase.co`

Migrations:

```text
supabase/migrations/20260827031803_indusagi_review_agent.sql
supabase/migrations/20260827035747_atomic_webhook_enqueue.sql
supabase/migrations/20260827040104_check_run_reconciliation.sql
supabase/migrations/20260827041049_owned_job_leases.sql
supabase/migrations/20260827042500_static_token_webhooks.sql
```

They create RLS-enabled `indusagi_review_deliveries` and `indusagi_review_jobs`
tables plus atomic webhook-enqueue, ownership-safe renewable job leases,
periodic stale-recovery, and check-run reconciliation support. No anonymous or authenticated policies are created;
the backend must use the service-role/secret key.

Never commit the service-role key. The publishable/anon key is intentionally not used because the webhook worker requires privileged server-side writes.

## GitHub App setup

Create a GitHub App with:

### Repository permissions

- Contents: Read
- Metadata: Read
- Pull requests: Read and write
- Issues: Read and write (sticky fallback)
- Checks: Read and write

### Events

Subscribe to `Pull request`. Point the webhook URL to:

```text
https://YOUR_HOST/webhooks/github
```

Set a strong webhook secret and configure the same value as `GITHUB_WEBHOOK_SECRET`.

The service processes `opened`, `reopened`, `synchronize`, and `ready_for_review`. Drafts are ignored until ready.

## Configuration

Copy `.env.review.example` into your deployment secret manager. Required production values:

```text
SUPABASE_SERVICE_ROLE_KEY
GITHUB_WEBHOOK_SECRET
GITHUB_APP_ID
GITHUB_APP_PRIVATE_KEY
ANTHROPIC_API_KEY
```

`GITHUB_TOKEN` is a development-only alternative to GitHub App credentials.
In this mode, ordinary repository webhooks without an `installation` field are
accepted and stored with installation ID `0`; the static token provider ignores
that sentinel value.

The private key may contain literal newlines or escaped `\n` sequences.

## Build and run

```bash
npm install
npm test
npm run typecheck
npm run build
npm run review:server
```

The server exposes:

- `GET /healthz`
- `POST /webhooks/github`

Default port: `8787`.

## Model

Default:

```text
anthropic/claude-sonnet-4-6
```

Override with `INDUSAGI_REVIEW_MODEL=provider/model`. Configure the matching provider API key. The review is executed through `createSessionConductor`, with high thinking and only two read-only GitHub tools.

## Security properties

- Webhook signatures are mandatory and compared in constant time.
- GitHub delivery IDs are deduplicated in Supabase.
- Pull-request content is explicitly marked untrusted in the system and user prompts.
- No bash, write, edit, process, or local repository tools are exposed.
- Findings below 0.80 confidence are discarded.
- Findings not mapped to changed diff lines are discarded.
- The current PR head SHA is checked immediately before review generation.
- GitHub App installation tokens are short-lived.
- GitHub reviews and checks use deterministic markers/external IDs so retries
  reuse already-visible side effects instead of posting duplicates.
- GitHub and Supabase requests have 30-second deadlines; model reviews have a
  10-minute deadline and abort the Indusagi conductor when exceeded.
- Supabase tables have RLS enabled and no client policies.

## Production notes

Run at least one always-on worker process. Multiple instances are safe: the
database claim function serializes each claim with `SKIP LOCKED`, issues a
unique five-minute lease token, and every running-job mutation verifies that
token. Workers renew leases every minute. Expired leases are recovered every
minute without requiring a restart. Failed jobs use bounded exponential
backoff and stop after three attempts.
