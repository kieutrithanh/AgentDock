-- AgentDock: entry lifecycle and owner-controlled entry management
-- Apply in the Supabase SQL Editor or through the project's migration pipeline.
-- Assumes public.entries, public.project_members, auth.uid() and role values
-- owner/editor/viewer already exist as used by the AgentDock client.

begin;

-- The existing schema represents a resolved decision with result = 'decided'.
-- Do not introduce a second lifecycle column until a future migration centralizes
-- lifecycle semantics across all entry types.

-- Replace these policy names only. Existing SELECT/INSERT policies remain intact.
drop policy if exists "entries_update_owner_or_editor" on public.entries;
drop policy if exists "entries_delete_owner_only" on public.entries;

create policy "entries_update_owner_or_editor"
on public.entries
for update
to authenticated
using (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = entries.project_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = entries.project_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner', 'editor')
  )
);

create policy "entries_delete_owner_only"
on public.entries
for delete
to authenticated
using (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = entries.project_id
      and pm.user_id = auth.uid()
      and pm.role = 'owner'
  )
);

commit;

-- Verification after applying (run as an authenticated owner/editor/viewer in the app):
-- 1. Owner: edit any entry, close a pending decision, and delete one disposable entry.
-- 2. Editor: edit/close succeeds; delete is rejected by RLS.
-- 3. Viewer: edit, close and delete are all rejected by RLS.
-- 4. Confirm the public Digest excludes results `decided` from Open Items.
