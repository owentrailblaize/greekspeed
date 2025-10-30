# Custom Exec Titles and Role Update Plan

### Scope

- Add a “custom” option for chapter executive titles with free-text `chapter_role_custom`.
- Allow admin to update a user’s system role (admin/active_member/alumni) and chapter role (+ custom title) from the UI.
- Keep permissions semantics: system admin is determined by `Profile.role === 'admin'`; custom titles do not grant extra privileges by themselves.

### Data Model

- Update `types/profile.d.ts`:
- Add `'custom'` to `ChapterRole`.
- Add optional `chapter_role_custom?: string | null` to `Profile` and `ImportMemberRow` as needed.
- DB migration (Supabase SQL):
- `alter table profiles add column if not exists chapter_role_custom text null;`

### Permissions Helper

- Update `lib/permissions.ts`:
- Replace `getRoleDisplayName(role)` with `getRoleDisplayName(role, custom?)` that returns `custom` when `role === 'custom'`.
- No change to `canManage*` functions (admin remains via system role).

### API Changes

- Create user (service): `app/api/developer/create-user/route.ts`
- Accept `chapter_role_custom` in request body.
- Persist `chapter_role_custom` when `chapter_role === 'custom'`, else store `null`.
- Update user (new): `app/api/developer/users/route.ts`
- Add `PUT` handler using service role key.
- Accept whitelist: `role`, `chapter_role`, `chapter_role_custom`, `member_status`, `chapter_id`.
- Normalize: if `chapter_role !== 'custom'`, set `chapter_role_custom = null`.

### UI Changes

- Create User: `components/user-management/CreateUserForm.tsx`
- Add “Custom…” option in Chapter Role select.
- When selected, render `Input` for `chapter_role_custom` and include in POST body.
- Expand options to include all existing roles (`secretary`, etc.).
- View User: `components/user-management/ViewUserModal.tsx`
- Display custom title when `chapter_role === 'custom'` using `(user as any).chapter_role_custom`.
- Users Table: `components/user-management/UsersTab.tsx`
- Display custom title in the Role & Status cell similarly.
- Enable Edit button and open an Edit modal.
- New Edit Modal: `components/user-management/EditUserModal.tsx`
- Fields: System Role, Chapter Role, Custom Title.
- On Save: `PUT /api/developer/users?userId=...` with normalized payload.

### Integration Points

- Import `EditUserModal` into `UsersTab` and wire `onSaved` to refresh list.
- Optional: Use `getRoleDisplayName` where chapter roles are shown elsewhere.

### Testing

- Unit smoke tests (manual):
- Create user with custom title; verify DB `profiles` row persists both fields.
- Edit existing user: change system role and chapter role to/from custom; verify persistence and UI updates.
- Verify permissions flows unaffected (paywall, access checks) since system role logic unchanged.

### Rollback

- Safe to roll back UI/API; DB column is additive and nullable.

### Final Implementation Outcome

- Admins can:
- Create execs with a free-text custom title.
- Update any user to admin/active_member/alumni.
- Assign built-in or custom chapter titles.
- UI consistently displays custom titles where chapter role is shown.
- Existing permission checks remain stable and predictable.