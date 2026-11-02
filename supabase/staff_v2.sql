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
alter table public.site_admins add column if not exists name_ar text not null default '' check (char_length(name_ar) <= 80);
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

-- 6) Every form question can be optional or hidden (staff page → Form questions) ---------------------------
-- Replace the original per-field checks with ones that allow unanswered questions. Kept: consent, an email or a
-- phone number (so SLAB can reply), valid formats and lengths when an answer is given.
do $$
declare c record;
begin
  for c in select conname from pg_constraint
           where conrelid = 'public.project_enquiries'::regclass and contype = 'c'
             and conname <> 'project_enquiries_attachments_check'
             and pg_get_constraintdef(oid) !~ '\m(status|budget|source)\M'
  loop
    execute format('alter table public.project_enquiries drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.project_enquiries alter column full_name drop not null;
alter table public.project_enquiries alter column email drop not null;
alter table public.project_enquiries alter column phone drop not null;
alter table public.project_enquiries alter column project_type drop not null;
alter table public.project_enquiries alter column project_location drop not null;
alter table public.project_enquiries alter column message drop not null;
alter table public.project_enquiries add constraint enquiry_consent check (consent);
alter table public.project_enquiries add constraint enquiry_reachable check (coalesce(email, '') <> '' or coalesce(phone, '') <> '');
alter table public.project_enquiries add constraint enquiry_email check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
alter table public.project_enquiries add constraint enquiry_type check (project_type is null or project_type in ('residential', 'hospitality', 'commercial', 'institutional'));
alter table public.project_enquiries add constraint enquiry_lengths check (
  char_length(coalesce(full_name, '')) <= 120 and char_length(coalesce(email, '')) <= 160 and char_length(coalesce(phone, '')) <= 20
  and char_length(coalesce(project_location, '')) <= 120 and char_length(coalesce(message, '')) <= 3000);
-- Website visitors may only add an enquiry (consented, new, from the website); staff use staff_insert_enquiries.
do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'project_enquiries' and cmd = 'INSERT' and policyname <> 'staff_insert_enquiries'
  loop
    execute format('drop policy %I on public.project_enquiries', p.policyname);
  end loop;
end $$;
create policy public_insert_enquiries on public.project_enquiries for insert to anon, authenticated
  with check (consent and source = 'website' and status = 'new');
grant insert on table public.project_enquiries to anon;

-- 7) Completion 100% for the 13 projects from the company profile (confirmed by SLAB, 2026-11-02) -----------------
-- A cms_projects row with a built-in id only overrides that project; names, clients, units and sizes are the website's own.
insert into public.cms_projects (id, name, name_ar, client, client_ar, units, sizes, published, progress) values
  ('soulhittin', 'SOUL Hittin', 'سول حطين', 'OHG', 'OHG', 9, '{132.26}', true, 100),
  ('almughrizat', 'Almughrizat Building', 'مبنى المغرزات', 'Aliyah Homes', 'عالية هوم', 25, '{50,107}', true, 100),
  ('masharef', 'Masharef Building', 'مبنى مشارف', 'Aliyah Homes', 'عالية هوم', 14, '{117,121,160}', true, 100),
  ('mkin30', 'Makeen 30', 'مكين 30', 'Aliyah Homes', 'عالية هوم', 1, '{245}', true, 100),
  ('nirvana12', 'Nirvana 12', 'نيرفانا 12', 'Aliyah Homes', 'عالية هوم', 2, '{50,145}', true, 100),
  ('ajlan11', 'Al Ajlan Riviera 12', 'العجلان ريفيرا 12', 'Aliyah Homes', 'عالية هوم', 1, '{92,169}', true, 100),
  ('almajidiya116', 'Almajidiya 116', 'المجيدية 116', 'Aliyah Homes', 'عالية هوم', 4, '{77,101,128,130}', true, 100),
  ('almajidiya111', 'Al Majidiya Residence 111', 'المجيدية ريزيدنس 111', 'Aliyah Homes', 'عالية هوم', 1, '{120}', true, 100),
  ('jawhara8', 'Jawhara Al Narjis 8', 'جوهرة النرجس 8', 'Aliyah Homes', 'عالية هوم', 1, '{50,145}', true, 100),
  ('ajlan19', 'Al Ajlan Riviera 21', 'العجلان ريفيرا 21', 'Aliyah Homes', 'عالية هوم', 1, '{137}', true, 100),
  ('almajidiya70', 'Almajidiya 70', 'المجيدية 70', 'Aliyah Homes', 'عالية هوم', 1, '{90}', true, 100),
  ('almajidiya130', 'Almajidiya 130', 'المجيدية 130', 'Aliyah Homes', 'عالية هوم', 1, '{128}', true, 100),
  ('ajlan37', 'Al Ajlan Riviera 37', 'العجلان ريفيرا 37', 'Aliyah Homes', 'عالية هوم', 2, '{77,101,128,130}', true, 100)
on conflict (id) do update set progress = 100;

notify pgrst, 'reload schema';
