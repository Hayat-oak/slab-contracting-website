-- SLAB staff page v2: run once in Supabase → SQL Editor (project oydrudnqcazzytauodup), after admin_setup.sql and
-- enquiry_attachments.sql. Safe to re-run.
-- Adds: staff names, roles and active/suspended status (enforced here, on the server); enquiry reference numbers,
-- staff-entered enquiries, notes and an activity log; project status and completion percentage.
--
-- Roles:
--   admin    مدير النظام     everything, including users, form questions and settings
--   projects إدارة مشاريع    enquiries (view, update, add, notes), projects, project photos and section photos
--   finance  مالية           view enquiries, export to Excel and add notes; cannot change anything else

-- 1) Staff: name, role, active ------------------------------------------------
alter table public.site_admins add column if not exists name text not null default '' check (char_length(name) <= 80);
alter table public.site_admins add column if not exists role text not null default 'admin' check (role in ('admin', 'projects', 'finance'));
alter table public.site_admins add column if not exists active boolean not null default true;

-- The signed-in user's role, or null when they are not active staff.
create or replace function public.staff_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.site_admins where email = lower(coalesce(auth.jwt() ->> 'email', '')) and active;
$$;
create or replace function public.has_staff_role(variadic roles text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.staff_role() = any(roles), false);
$$;
-- Any active staff member (all roles).
create or replace function public.is_site_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.staff_role() is not null;
$$;
create or replace function public.is_admin_email(p_email text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.site_admins where email = lower(trim(p_email)) and active);
$$;
grant execute on function public.staff_role() to authenticated;
grant execute on function public.has_staff_role(text[]) to authenticated;

grant select, insert, update, delete on table public.site_admins to authenticated;
drop policy if exists admins_read on public.site_admins;
drop policy if exists admins_write on public.site_admins;
drop policy if exists admins_update on public.site_admins;
drop policy if exists admins_delete on public.site_admins;
create policy admins_read on public.site_admins for select to authenticated using (public.is_site_admin());
create policy admins_write on public.site_admins for insert to authenticated with check (public.has_staff_role('admin'));
-- A system manager cannot demote, suspend or remove themselves (avoids locking everyone out).
create policy admins_update on public.site_admins for update to authenticated using (public.has_staff_role('admin'))
  with check (public.has_staff_role('admin') and (email <> lower(auth.jwt() ->> 'email') or (role = 'admin' and active)));
create policy admins_delete on public.site_admins for delete to authenticated
  using (public.has_staff_role('admin') and email <> lower(auth.jwt() ->> 'email'));

-- 2) Who may change site content -------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['site_settings', 'form_questions'] loop
    execute format('drop policy if exists admin_write on public.%I', t);
    execute format($p$create policy admin_write on public.%I for all to authenticated using (public.has_staff_role('admin')) with check (public.has_staff_role('admin'))$p$, t);
  end loop;
  foreach t in array array['cms_projects', 'project_photos', 'image_overrides'] loop
    execute format('drop policy if exists admin_write on public.%I', t);
    execute format($p$create policy admin_write on public.%I for all to authenticated using (public.has_staff_role('admin', 'projects')) with check (public.has_staff_role('admin', 'projects'))$p$, t);
  end loop;
end $$;

drop policy if exists admin_upload on storage.objects;
drop policy if exists admin_update_upload on storage.objects;
drop policy if exists admin_delete_upload on storage.objects;
create policy admin_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'site-assets' and name like 'uploads/%' and public.has_staff_role('admin', 'projects'));
create policy admin_update_upload on storage.objects for update to authenticated
  using (bucket_id = 'site-assets' and name like 'uploads/%' and public.has_staff_role('admin', 'projects'));
create policy admin_delete_upload on storage.objects for delete to authenticated
  using (bucket_id = 'site-assets' and name like 'uploads/%' and public.has_staff_role('admin', 'projects'));
drop policy if exists enquiry_files_admin_delete on storage.objects;
create policy enquiry_files_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'enquiry-files' and public.has_staff_role('admin'));

-- 3) Project status and completion (shown on the website when set) ----------------
alter table public.cms_projects add column if not exists status text check (status is null or status in ('active', 'finished', 'promo'));
alter table public.cms_projects add column if not exists progress int check (progress is null or progress between 0 and 100);

-- 4) Enquiries: reference number, source, staff permissions -------------------------
alter table public.project_enquiries add column if not exists source text not null default 'website' check (source in ('website', 'staff'));
alter table public.project_enquiries add column if not exists ref int;
create sequence if not exists public.project_enquiries_ref_seq;
update public.project_enquiries e set ref = n.rn
  from (select id, row_number() over (order by created_at) + coalesce((select max(ref) from public.project_enquiries), 0) as rn
        from public.project_enquiries where ref is null) n
  where e.id = n.id;
select setval('public.project_enquiries_ref_seq', coalesce(max(ref), 1), max(ref) is not null) from public.project_enquiries;
alter table public.project_enquiries alter column ref set default nextval('public.project_enquiries_ref_seq');
grant usage on sequence public.project_enquiries_ref_seq to anon, authenticated;

grant select, insert, update, delete on table public.project_enquiries to authenticated;
drop policy if exists admin_update_enquiries on public.project_enquiries;
drop policy if exists admin_delete_enquiries on public.project_enquiries;
drop policy if exists staff_insert_enquiries on public.project_enquiries;
create policy admin_update_enquiries on public.project_enquiries for update to authenticated
  using (public.has_staff_role('admin', 'projects')) with check (public.has_staff_role('admin', 'projects'));
create policy admin_delete_enquiries on public.project_enquiries for delete to authenticated using (public.has_staff_role('admin'));
create policy staff_insert_enquiries on public.project_enquiries for insert to authenticated
  with check (public.has_staff_role('admin', 'projects') and source = 'staff');

-- 5) Notes and activity log (staff only; never shown on the website) ---------------
create table if not exists public.enquiry_activity (
  id bigint generated always as identity primary key,
  enquiry_id uuid not null references public.project_enquiries(id) on delete cascade,
  kind text not null check (kind in ('created', 'status', 'note')),
  body text not null default '' check (char_length(body) <= 2000),
  actor text default lower(auth.jwt() ->> 'email'),
  created_at timestamptz not null default now()
);
create index if not exists enquiry_activity_enquiry on public.enquiry_activity (enquiry_id, created_at);
alter table public.enquiry_activity enable row level security;
revoke all on table public.enquiry_activity from anon, authenticated;
grant select, insert on table public.enquiry_activity to authenticated;
drop policy if exists staff_read_activity on public.enquiry_activity;
drop policy if exists staff_add_note on public.enquiry_activity;
create policy staff_read_activity on public.enquiry_activity for select to authenticated using (public.is_site_admin());
create policy staff_add_note on public.enquiry_activity for insert to authenticated
  with check (public.is_site_admin() and kind = 'note' and actor = lower(auth.jwt() ->> 'email') and char_length(trim(body)) > 0);

-- New enquiries and status changes are logged automatically.
create or replace function public.log_enquiry_activity() returns trigger
language plpgsql security definer set search_path = public as $$
declare who text := nullif(lower(coalesce(auth.jwt() ->> 'email', '')), '');
begin
  if tg_op = 'INSERT' then
    insert into public.enquiry_activity (enquiry_id, kind, body, actor) values (new.id, 'created', new.source, who);
  elsif new.status is distinct from old.status then
    insert into public.enquiry_activity (enquiry_id, kind, body, actor) values (new.id, 'status', old.status || '>' || new.status, who);
  end if;
  return new;
end $$;
drop trigger if exists enquiry_activity_log on public.project_enquiries;
create trigger enquiry_activity_log after insert or update of status on public.project_enquiries
  for each row execute function public.log_enquiry_activity();
insert into public.enquiry_activity (enquiry_id, kind, body, actor, created_at)
  select e.id, 'created', coalesce(e.source, 'website'), null, e.created_at from public.project_enquiries e
  where not exists (select 1 from public.enquiry_activity a where a.enquiry_id = e.id and a.kind = 'created');

notify pgrst, 'reload schema';
