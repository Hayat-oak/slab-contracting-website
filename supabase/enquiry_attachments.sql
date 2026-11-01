-- Photos attached to project enquiries. Run once in Supabase → SQL Editor, after admin_setup.sql. Safe to re-run.
-- Private bucket: website visitors may upload (images only, 10 MB each, under enquiries/), only admins can view or delete.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('enquiry-files', 'enquiry-files', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists enquiry_files_upload on storage.objects;
drop policy if exists enquiry_files_admin_read on storage.objects;
drop policy if exists enquiry_files_admin_delete on storage.objects;
create policy enquiry_files_upload on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'enquiry-files' and name like 'enquiries/%');
create policy enquiry_files_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'enquiry-files' and public.is_site_admin());
create policy enquiry_files_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'enquiry-files' and public.is_site_admin());

alter table public.project_enquiries add column if not exists attachments text[] not null default '{}';
alter table public.project_enquiries drop constraint if exists project_enquiries_attachments_check;
alter table public.project_enquiries add constraint project_enquiries_attachments_check check (cardinality(attachments) <= 6);

notify pgrst, 'reload schema';
