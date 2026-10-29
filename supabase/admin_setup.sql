-- SLAB website admin panel: run once in Supabase → SQL Editor (project oydrudnqcazzytauodup).
-- Safe to re-run. Creates the admin allowlist, editable site content, extra form questions,
-- admin-only access to enquiries, and upload rights in the site-assets bucket.

-- 1) Admin allowlist ---------------------------------------------------------
create table if not exists public.site_admins (
  email text primary key check (email = lower(email) and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
  added_by text,
  created_at timestamptz not null default now()
);
insert into public.site_admins (email, added_by) values ('hayat@oaktree.sa', 'setup') on conflict do nothing;

-- True when the signed-in user's email is on the allowlist.
create or replace function public.is_site_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.site_admins where email = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
-- Lets the login screen check an address before sending a code (returns only true/false).
create or replace function public.is_admin_email(p_email text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.site_admins where email = lower(trim(p_email)));
$$;
grant execute on function public.is_site_admin() to anon, authenticated;
grant execute on function public.is_admin_email(text) to anon, authenticated;

alter table public.site_admins enable row level security;
revoke all on table public.site_admins from anon, authenticated;
grant select, insert, delete on table public.site_admins to authenticated;
drop policy if exists admins_read on public.site_admins;
drop policy if exists admins_write on public.site_admins;
drop policy if exists admins_delete on public.site_admins;
create policy admins_read on public.site_admins for select to authenticated using (public.is_site_admin());
create policy admins_write on public.site_admins for insert to authenticated with check (public.is_site_admin());
-- An admin cannot remove themselves (avoids locking everyone out).
create policy admins_delete on public.site_admins for delete to authenticated
  using (public.is_site_admin() and email <> lower(auth.jwt() ->> 'email'));

-- 2) Editable settings (numbers, contact details) ---------------------------
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into public.site_settings (key, value) values
  ('stats', '[{"n":125,"suffix":"+"},{"n":3,"suffix":""},{"n":4,"suffix":""},{"n":7,"suffix":""}]'),
  ('contact', '{"phone":"920066197","phone_display":"9200 66197","email":"info@slab.sa","instagram":"https://www.instagram.com/slab.saudi/","linkedin":"https://www.linkedin.com/company/slab-saudi/"}')
on conflict (key) do nothing;

-- 3) Extra questions shown in the enquiry form ------------------------------
create table if not exists public.form_questions (
  id bigint generated always as identity primary key,
  label_en text not null check (char_length(label_en) between 1 and 200),
  label_ar text not null check (char_length(label_ar) between 1 and 200),
  kind text not null default 'text' check (kind in ('text', 'textarea', 'select', 'number')),
  options jsonb not null default '[]',            -- for 'select': [{"en": "...", "ar": "..."}]
  required boolean not null default false,
  active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- 4) Projects added from the admin panel, and extra photos for any project ----
create table if not exists public.cms_projects (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  name text not null, name_ar text not null,
  client text not null default '', client_ar text not null default '',
  city text not null default 'Riyadh', city_ar text not null default 'الرياض',
  type text not null default 'residential' check (type in ('residential', 'hospitality', 'commercial', 'institutional')),
  units int check (units is null or units >= 0),
  sizes text[] not null default '{}',
  published boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.project_photos (
  id bigint generated always as identity primary key,
  project_id text not null,                       -- a built-in project id (e.g. 'soulhittin') or a cms_projects id
  url text not null check (url like 'https://oydrudnqcazzytauodup.supabase.co/storage/v1/object/public/site-assets/%'),
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- 5) Replacement photos for named page sections -----------------------------
create table if not exists public.image_overrides (
  slot text primary key check (slot ~ '^[a-z0-9-]{2,60}$'),
  url text not null check (url like 'https://oydrudnqcazzytauodup.supabase.co/storage/v1/object/public/site-assets/%'),
  updated_at timestamptz not null default now()
);

-- Public site reads these; only admins write them.
do $$
declare t text;
begin
  foreach t in array array['site_settings', 'form_questions', 'cms_projects', 'project_photos', 'image_overrides'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select on table public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on table public.%I to authenticated', t);
    execute format('drop policy if exists public_read on public.%I', t);
    execute format('drop policy if exists admin_write on public.%I', t);
    execute format('create policy public_read on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy admin_write on public.%I for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin())', t);
  end loop;
end $$;
grant usage on all sequences in schema public to authenticated;

-- 6) Enquiries: budget, answers to extra questions, follow-up status; admins can read/update/delete
alter table public.project_enquiries add column if not exists budget text check (budget is null or budget in ('lt500k', '500k1m', '1m3m', 'gt3m', 'tbd'));
alter table public.project_enquiries add column if not exists answers jsonb not null default '{}';
alter table public.project_enquiries add column if not exists status text not null default 'new' check (status in ('new', 'contacted', 'closed'));
grant select, update, delete on table public.project_enquiries to authenticated;
drop policy if exists admin_read_enquiries on public.project_enquiries;
drop policy if exists admin_update_enquiries on public.project_enquiries;
drop policy if exists admin_delete_enquiries on public.project_enquiries;
create policy admin_read_enquiries on public.project_enquiries for select to authenticated using (public.is_site_admin());
create policy admin_update_enquiries on public.project_enquiries for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
create policy admin_delete_enquiries on public.project_enquiries for delete to authenticated using (public.is_site_admin());

-- 7) Storage: admins may upload/replace/delete files under site-assets/uploads/
drop policy if exists admin_upload on storage.objects;
drop policy if exists admin_update_upload on storage.objects;
drop policy if exists admin_delete_upload on storage.objects;
create policy admin_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'site-assets' and name like 'uploads/%' and public.is_site_admin());
create policy admin_update_upload on storage.objects for update to authenticated
  using (bucket_id = 'site-assets' and name like 'uploads/%' and public.is_site_admin());
create policy admin_delete_upload on storage.objects for delete to authenticated
  using (bucket_id = 'site-assets' and name like 'uploads/%' and public.is_site_admin());
