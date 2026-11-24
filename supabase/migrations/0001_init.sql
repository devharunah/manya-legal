-- MANYA: cases, evidence and referrals (PRD section 9).
-- Every row belongs to one trader (auth.uid()). Row-level security is the
-- isolation boundary: the app only ever talks to Postgres with the trader's
-- own session, never with the service-role key.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text not null,
  preferred_language text not null default 'lug' check (preferred_language in ('en', 'lug')),
  business_name text not null default '',
  business_type text not null default '',
  location text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  case_reference text not null,
  dispute_category text check (dispute_category in ('supplier_non_delivery', 'other')),
  status text not null default 'draft' check (
    status in ('draft', 'collecting_information', 'awaiting_user_confirmation',
               'report_generated', 'completed', 'paused')
  ),
  language text not null default 'lug' check (language in ('en', 'lug')),
  intake jsonb not null,
  -- Denormalised from intake for listing (PRD 9.3).
  transaction_amount numeric,
  currency text,
  respondent_name text,
  requested_resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, case_reference)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  sender text not null check (sender in ('trader', 'manya')),
  original_text text not null,
  processed_text text,
  language text not null check (language in ('en', 'lug')),
  input_type text not null check (input_type in ('text', 'voice', 'system')),
  field text,
  created_at timestamptz not null default now()
);

create table public.case_reports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  version int not null,
  structured_data jsonb not null,
  pdf_storage_path text not null,
  confirmation_status text not null default 'confirmed',
  confirmed_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (case_id, version)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  case_id uuid references public.cases (id) on delete cascade,
  repository_type text not null check (repository_type in ('business_vault', 'case_workspace')),
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  size_bytes int not null,
  file_hash text not null,
  document_category text not null,
  -- PRD 9.8 keeps extractions in their own table; one extraction per
  -- document is all the prototype needs, so it lives on the row.
  extracted_metadata jsonb,
  extraction_confidence real,
  verification jsonb not null,
  user_confirmed boolean not null default false,
  notes text not null default '',
  uploaded_at timestamptz not null default now(),
  check ((repository_type = 'case_workspace') = (case_id is not null))
);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  provider_id text not null,
  recommended_pathway text not null,
  consent_status text not null check (consent_status = 'given'),
  consent_text text not null,
  shared_information jsonb not null,
  package_storage_path text not null,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  case_id uuid references public.cases (id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text not null,
  created_at timestamptz not null default now()
);

create index on public.cases (owner_id, updated_at desc);
create index on public.messages (case_id, created_at);
create index on public.documents (owner_id, case_id);

-- Row-level security: each trader sees and changes only their own rows.
alter table public.profiles enable row level security;
alter table public.cases enable row level security;
alter table public.messages enable row level security;
alter table public.case_reports enable row level security;
alter table public.documents enable row level security;
alter table public.referrals enable row level security;
alter table public.audit_logs enable row level security;

create policy "own profile" on public.profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "own cases" on public.cases
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own messages" on public.messages
  for all to authenticated using (owner_id = auth.uid())
  with check (owner_id = auth.uid()
    and exists (select 1 from public.cases c where c.id = case_id and c.owner_id = auth.uid()));

create policy "own reports" on public.case_reports
  for all to authenticated using (owner_id = auth.uid())
  with check (owner_id = auth.uid()
    and exists (select 1 from public.cases c where c.id = case_id and c.owner_id = auth.uid()));

create policy "own documents" on public.documents
  for all to authenticated using (owner_id = auth.uid())
  with check (owner_id = auth.uid()
    and (case_id is null
      or exists (select 1 from public.cases c where c.id = case_id and c.owner_id = auth.uid())));

create policy "own referrals" on public.referrals
  for all to authenticated using (owner_id = auth.uid())
  with check (owner_id = auth.uid()
    and exists (select 1 from public.cases c where c.id = case_id and c.owner_id = auth.uid()));

-- Audit entries can be written and read by their owner, never changed or deleted.
create policy "read own audit" on public.audit_logs
  for select to authenticated using (owner_id = auth.uid());
create policy "write own audit" on public.audit_logs
  for insert to authenticated with check (owner_id = auth.uid());

-- Private bucket for originals, reports and referral packages: <uid>/...
insert into storage.buckets (id, name, public, file_size_limit)
values ('evidence', 'evidence', false, 10485760)
on conflict (id) do nothing;

create policy "own evidence read" on storage.objects
  for select to authenticated
  using (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);

-- Insert only: originals are never overwritten or deleted by the app (PRD 5.9).
create policy "own evidence write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);
