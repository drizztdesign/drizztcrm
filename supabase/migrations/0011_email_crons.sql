-- Schedule email polling + drain via pg_cron, since Vercel Hobby plan only
-- allows daily crons. We use the pg_net extension (enabled by default on
-- Supabase) to make HTTP calls from inside Postgres directly to our Vercel
-- API endpoints with the CRON_SECRET in the query string.

create extension if not exists pg_net;

-- Drain email queue every 2 minutes: any sendEmail action enqueued by an
-- automation gets actually sent.
do $$ begin
  perform cron.unschedule('drizzt-email-drain-2min');
exception when others then null; end $$;
select cron.schedule(
  'drizzt-email-drain-2min',
  '*/2 * * * *',
  $$ select net.http_get(
       'https://drizztcrm.vercel.app/api/email/drain-queue?secret=drizzt-cron-2026-9b3f7c1e2a8d4',
       timeout_milliseconds := 30000
     ); $$
);

-- Poll Gmail inbox every 5 minutes for replies.
do $$ begin
  perform cron.unschedule('drizzt-email-poll-5min');
exception when others then null; end $$;
select cron.schedule(
  'drizzt-email-poll-5min',
  '*/5 * * * *',
  $$ select net.http_get(
       'https://drizztcrm.vercel.app/api/email/poll?secret=drizzt-cron-2026-9b3f7c1e2a8d4',
       timeout_milliseconds := 60000
     ); $$
);
