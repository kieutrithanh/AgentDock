# Verification Notes

## Static checks

`node tests/check-entry-management.mjs` passed. The check validates that the module script parses after import removal and that the close/edit/delete UI IDs and functions are present. `git diff --check` also passed with no whitespace errors.

## Preview check

The static preview at `http://localhost:4173` loads the AgentDock signed-out screen successfully with no visible runtime error. The existing authentication boundary prevents loading project entries and therefore prevents a real end-to-end owner/editor/viewer management test without an authenticated Supabase account.

The page contains the new close-decision and permanent-delete confirmation dialogs. They remain hidden until explicitly invoked, consistent with the app's modal pattern. A later authenticated verification must test RLS outcomes after applying `supabase/migrations/20260819_entry_management.sql`.

## Required end-to-end verification

1. As owner, open a `decision/pending` entry and close it; verify it becomes `decided` and leaves Open Items in the public Digest.
2. As owner, edit an entry; refresh and verify changed content plus `updated_at`.
3. As owner, delete a disposable entry after entering `DELETE`; verify it disappears from UI and Digest.
4. As editor, verify edit/close work but delete is rejected/hidden.
5. As viewer, verify all management controls are hidden and direct mutation is rejected by RLS.

## Modal close-decision

The close-decision modal was opened in the live static preview via a non-persistent browser-only state change. It is centered above the existing dark overlay, displays the `decided` lifecycle consequence clearly, and exposes both Cancel and Close decision actions. The modal's action labels and visual hierarchy are legible at desktop viewport size.

## Modal permanent-delete

The permanent-delete modal was also opened in the static preview. It presents an explicit Owner-only label, explains the impact on Project Memory and future AI context, suggests safer alternatives, requires the exact text `DELETE`, and keeps cancellation adjacent to the destructive action. The modal remains visually consistent with the existing interface at desktop viewport size.
