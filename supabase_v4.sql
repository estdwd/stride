-- Stride v4: 7-day free trial + real push notifications every 2 hours.
-- Run in the Supabase SQL editor. Safe to re-run.

-- 1) Free trial = 7 days (admin can still change it in the console)
insert into public.app_settings (key, value) values ('trial_days', '7')
on conflict (key) do update set value = '7';

-- 2) Your live site address (no trailing slash). Used for the push icon and for opening the app on tap.
insert into public.app_settings (key, value) values ('site_url', 'https://YOUR-SITE-ADDRESS-HERE')
on conflict (key) do nothing;

-- 3) Save your OneSignal REST API key privately (OneSignal > Settings > Keys & IDs). Run this ONCE with your real key:
--    select vault.create_secret('PASTE_ONESIGNAL_REST_API_KEY', 'onesignal_rest_key');

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- 4) Sends a push to every student who has NOT studied today (Lagos time).
--    Students whose streak is alive but at risk get the urgent message.
create or replace function public.send_study_push()
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  v_key  text;
  v_app  constant text := '666ab3cc-b164-41b0-9d2e-7cc81d77c1b9';
  v_site text;
  v_today date := (now() at time zone 'Africa/Lagos')::date;
  g record; ids text[];
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'onesignal_rest_key';
  if v_key is null then raise exception 'Save the OneSignal REST key with vault.create_secret first'; end if;
  select value into v_site from public.app_settings where key = 'site_url';
  if v_site is null or v_site like '%YOUR-SITE%' then v_site := null; end if;

  for g in select * from (values
      (true,  'Your streak is on the line', 'Take a quick test now to keep your streak alive.'),
      (false, 'Time to practice',           'A short Stride test today keeps you sharp for JAMB.')
    ) as t(risk, title, body)
  loop
    select array_agg(id::text) into ids from public.profiles
    where (last_login_date is null or last_login_date::date < v_today)
      and ((coalesce(streak_count, 0) > 0 and last_login_date::date = v_today - 1) = g.risk);

    while ids is not null and array_length(ids, 1) > 0 loop
      perform net.http_post(
        url     := 'https://api.onesignal.com/notifications?c=push',
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Key ' || v_key),
        body    := jsonb_strip_nulls(jsonb_build_object(
          'app_id', v_app,
          'target_channel', 'push',
          'include_aliases', jsonb_build_object('external_id', to_jsonb(ids[1:1500])),
          'headings', jsonb_build_object('en', g.title),
          'contents', jsonb_build_object('en', g.body),
          'url', case when v_site is null then null else v_site || '/app.html' end,
          'chrome_web_icon',  case when v_site is null then null else v_site || '/icons/icon-192.png' end,
          'chrome_web_badge', case when v_site is null then null else v_site || '/icons/badge-96.png' end,
          'ttl', 5400))
      );
      ids := ids[1501:];
    end loop;
  end loop;
end $$;
revoke all on function public.send_study_push() from public, anon, authenticated;

-- 5) Every 2 hours from 7am to 9pm Lagos time (cron runs in UTC, Lagos = UTC+1)
select cron.unschedule('stride-study-push') where exists (select 1 from cron.job where jobname = 'stride-study-push');
select cron.schedule('stride-study-push', '0 6-20/2 * * *', $$select public.send_study_push()$$);

-- Test it once by hand:  select public.send_study_push();
-- See what OneSignal answered: select status_code, content from net._http_response order by created desc limit 5;
