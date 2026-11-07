-- Stride v3: run once in the Supabase SQL editor (safe to re-run).

-- 1) Each student's own 4 subjects
alter table public.profiles add column if not exists subjects text[];

-- 2) Explanations for the review screen (same as v2, re-run in case it never ran)
create or replace function public.question_explanations(p_ids text[])
returns table(id text, explanation text) language sql security definer set search_path = public stable as $$
  select q.id::text, q.explanation from public.questions q
  where q.id::text = any(p_ids) and q.explanation is not null and q.explanation <> '';
$$;
grant execute on function public.question_explanations(text[]) to authenticated;

-- 3) Helper: is the caller an admin?
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
grant execute on function public.is_admin() to authenticated;

-- 4) SECURITY: a student must not be able to edit their own role / suspension / premium
--    from the browser console. Direct client writes keep the old values for these columns;
--    admin RPCs (security definer) and real admins are not affected.
create or replace function public.protect_profile_columns()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  j jsonb; o jsonb; k text;
  protected text[] := array['role','status','suspended_until','premium_until','is_premium','premium','plan','subscription','trial_ends'];
begin
  if current_user not in ('authenticated','anon') then return new; end if;  -- inside admin RPCs / service role
  if public.is_admin() then return new; end if;
  j := to_jsonb(new);
  if tg_op = 'UPDATE' then
    o := to_jsonb(old);
    foreach k in array protected loop
      if o ? k then j := jsonb_set(j, array[k], o -> k); end if;
    end loop;
  else
    if j ? 'role' then j := jsonb_set(j, '{role}', '"user"'); end if;
    foreach k in array protected loop
      if k <> 'role' and j ? k then j := jsonb_set(j, array[k], 'null'::jsonb); end if;
    end loop;
  end if;
  return jsonb_populate_record(new, j);
end $$;
drop trigger if exists trg_protect_profile_columns on public.profiles;
create trigger trg_protect_profile_columns before insert or update on public.profiles
  for each row execute function public.protect_profile_columns();

-- 5) SECURITY: admin_* functions are callable only by signed-in users (each must still check is_admin inside)
do $$ declare r record; begin
  for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'admin\_%' loop
    execute format('revoke execute on function %s from public, anon', r.sig);
    execute format('grant execute on function %s to authenticated', r.sig);
  end loop;
end $$;

-- 6) SECURITY: receipts bucket is private; students touch only their own folder (<uid>/file.jpg); admins see all
update storage.buckets set public = false where id = 'receipts';
drop policy if exists "receipts_own_insert" on storage.objects;
drop policy if exists "receipts_own_select" on storage.objects;
create policy "receipts_own_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "receipts_own_select" on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- 7) SPEED: indexes for the queries the app runs most (keeps the free plan comfortable)
create index if not exists tests_user_date_idx on public.tests (user_id, date desc);
create index if not exists questions_subject_year_idx on public.questions (subject, year);

-- ===== AUDIT (run these ONE AT A TIME and check the result) =====
-- A) Which tables have RLS switched on? Every table with student data should show true.
--   select relname, relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
--   where n.nspname='public' and c.relkind='r';
-- B) Every policy that exists today (look for "using (true)" on profiles, tests, payments, questions):
--   select tablename, policyname, cmd, qual, with_check from pg_policies where schemaname='public' order by 1,2;
-- C) Admin functions that never check for admin (these are holes):
--   select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
--   where n.nspname='public' and proname like 'admin\_%' and prosrc not ilike '%is_admin%' and prosrc not ilike '%admin%';
-- D) Is the owner claim safe? It must compare the caller's JWT email on the server:
--   select pg_get_functiondef('public.claim_owner'::regproc);
-- E) QUESTION COVERAGE per subject (find subjects with few questions or no explanations):
--   select subject, count(*) as questions, count(distinct year) as years,
--          count(*) filter (where coalesce(explanation,'')<>'') as with_explanation
--   from public.questions group by subject order by subject;
