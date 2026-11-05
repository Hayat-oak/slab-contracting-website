-- Contact form: allow "Other" (أخرى) as a requested service. Safe to re-run.
-- Run once in Supabase → SQL Editor. (supabase/staff_v2.sql also removes this limit, so either file is enough.)
-- Replaces the original check that only allowed the four main services.
do $$
declare c record;
begin
  for c in select conname from pg_constraint
           where conrelid = 'public.project_enquiries'::regclass and contype = 'c'
             and pg_get_constraintdef(oid) ~ 'fit-out-execution'
  loop
    execute format('alter table public.project_enquiries drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.project_enquiries drop constraint if exists enquiry_services;
alter table public.project_enquiries add constraint enquiry_services check (
  cardinality(services) <= 5
  and services <@ array['fit-out-execution', 'design', 'interior-fit-out', 'project-contract-management', 'other']::text[]);
