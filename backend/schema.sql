-- Run once in the Supabase SQL editor. No secrets belong in the website.
create table if not exists public.study_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  document jsonb not null,
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  constraint workspace_document_valid check (coalesce((
    jsonb_typeof(document) = 'object'
    and document->>'version' = '1'
    and jsonb_typeof(document->'profiles') = 'array'
    and octet_length(document::text) <= 4194304
  ),false))
);
alter table public.study_workspaces enable row level security;
revoke all on public.study_workspaces from anon;
grant select, insert, update on public.study_workspaces to authenticated;
drop policy if exists "Read own workspace" on public.study_workspaces;
create policy "Read own workspace" on public.study_workspaces for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Create own workspace" on public.study_workspaces;
create policy "Create own workspace" on public.study_workspaces for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Update own workspace" on public.study_workspaces;
create policy "Update own workspace" on public.study_workspaces for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.save_study_workspace(p_document jsonb,p_expected_revision integer)
returns integer language plpgsql security invoker set search_path = '' as $$
declare new_revision integer;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_expected_revision < 0 then raise exception 'Invalid revision'; end if;
  if p_expected_revision = 0 then
    insert into public.study_workspaces(user_id,document,revision) values(auth.uid(),p_document,1)
      on conflict (user_id) do nothing returning revision into new_revision;
    if found then return new_revision; end if;
  end if;
  update public.study_workspaces set document=p_document,revision=revision+1,updated_at=now()
    where user_id=auth.uid() and revision=p_expected_revision returning revision into new_revision;
  if not found then raise exception 'STUDY_CONFLICT: another session saved newer data' using errcode='40001'; end if;
  return new_revision;
end $$;
revoke all on function public.save_study_workspace(jsonb,integer) from public,anon;
grant execute on function public.save_study_workspace(jsonb,integer) to authenticated;
