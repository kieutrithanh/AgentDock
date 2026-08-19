-- AgentDock: entry lifecycle and owner-controlled entry management
-- The AgentDock production project already enforces these permissions through
-- private.can_write_project(project_id) and private.is_project_owner(project_id).
-- This migration is intentionally idempotent: it adds only missing policies
-- and never creates a duplicate permissive RLS policy.

begin;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'entries'
      and policyname = 'entries_update_writer'
  ) then
    execute $policy$
      create policy "entries_update_writer"
      on public.entries
      for update
      to authenticated
      using (private.can_write_project(project_id))
      with check (private.can_write_project(project_id))
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'entries'
      and policyname = 'entries_delete_owner'
  ) then
    execute $policy$
      create policy "entries_delete_owner"
      on public.entries
      for delete
      to authenticated
      using (private.is_project_owner(project_id))
    $policy$;
  end if;
end
$$;

commit;

-- Expected access model:
-- - Owner: edit, close decisions, and permanently delete entries.
-- - Editor: edit and close decisions, but cannot delete.
-- - Viewer: read only.
-- - `result = decided` denotes a closed decision, preserving the original
--   entry and keeping it out of Open Items while retaining timeline context.
