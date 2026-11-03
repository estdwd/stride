-- Stride v2: run once in the Supabase SQL editor.

-- 1) Target course / university on profiles (used by the course prompt)
alter table public.profiles add column if not exists target_course text;
alter table public.profiles add column if not exists target_uni text;

-- 2) Dashboard settings for students (exam countdown, target, weekly goal, reminder, leaderboard).
--    Admin saves rows with keys starting "cfg_" in app_settings; students read them through this function.
create or replace function public.stride_config()
returns jsonb language sql security definer set search_path = public stable as $$
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
  from public.app_settings where key like 'cfg\_%';
$$;
grant execute on function public.stride_config() to authenticated;

-- 3) Explanations for the review screen (called by the app only after a test is graded).
create or replace function public.question_explanations(p_ids text[])
returns table(id text, explanation text) language sql security definer set search_path = public stable as $$
  select q.id::text, q.explanation from public.questions q
  where q.id::text = any(p_ids) and q.explanation is not null and q.explanation <> '';
$$;
grant execute on function public.question_explanations(text[]) to authenticated;

-- 4) Configurable leaderboard: period, subject, same-course group.
--    Assumes tests(user_id, subject, score, total, date) and profiles(id, name, course).
create or replace function public.leaderboard_v2(p_days int default 7, p_subject text default null, p_course text default null)
returns table(id uuid, name text, score bigint) language sql security definer set search_path = public stable as $$
  select p.id, p.name, sum(t.score)::bigint as score
  from public.tests t join public.profiles p on p.id = t.user_id
  where (coalesce(p_days,0) <= 0 or t.date >= now() - make_interval(days => p_days))
    and (p_subject is null or t.subject = p_subject)
    and (p_course is null or lower(p.course) like p_course || '%')
  group by p.id, p.name
  order by score desc
  limit 10;
$$;
grant execute on function public.leaderboard_v2(int, text, text) to authenticated;

-- 5) Admin console: set a student's profile. Streak > 0 also marks today as done,
--    otherwise the app hides a streak whose last day is older than yesterday.
create or replace function public.admin_set_profile(p_user uuid, p_streak int, p_name text, p_course text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'not allowed';
  end if;
  update public.profiles set
    streak_count = coalesce(p_streak, streak_count),
    last_login_date = case when coalesce(p_streak, 0) > 0 then current_date else last_login_date end,
    name = coalesce(nullif(p_name, ''), name),
    course = coalesce(nullif(p_course, ''), course)
  where id = p_user;
end $$;
grant execute on function public.admin_set_profile(uuid, int, text, text) to authenticated;
