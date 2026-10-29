-- Bettenvest workspace, underwriting prompts, deals, investors, landing pages, and campaigns.
-- Run this in the Supabase SQL editor or via the Supabase CLI.

create extension if not exists pgcrypto;

create table if not exists workspaces (
  id uuid primary key,
  name text not null,
  owner_initials text not null default 'SB',
  created_at timestamptz not null default now()
);

create table if not exists underwriting_prompts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  key text not null check (key in ('arv', 'repairs_mao')),
  title text not null,
  body text not null,
  updated_at timestamptz not null default now(),
  unique (workspace_id, key)
);

create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  status text not null default 'follow_up' check (status in ('go', 'no_go', 'follow_up', 'no_answer', 'deal_desk')),
  uploaded_at timestamptz not null default now(),
  listing_id text not null default '',
  street text not null default '',
  city text not null default '',
  state text not null default '',
  zip text not null default '',
  county text not null default '',
  list_price numeric,
  beds numeric,
  baths numeric,
  living_sqft numeric,
  lot_sqft numeric,
  stories numeric,
  year_built int,
  garage text not null default '',
  days_on_market int,
  cdom int,
  condition text not null default '',
  property_type text not null default '',
  agent_name text not null default '',
  agent_phone text not null default '',
  agent_office text not null default '',
  agent_email text not null default '',
  agent_notes text not null default '',
  source_pdf_path text,
  photos jsonb not null default '[]'::jsonb,
  extracted jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists investors (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  priority text not null default 'warm' check (priority in ('hot', 'warm', 'cold')),
  added_at timestamptz not null default now(),
  full_name text not null,
  phone text not null default '',
  email text not null default '',
  investor_type text not null default '',
  preferred_counties text[] not null default '{}',
  preferred_cities text[] not null default '{}',
  price_min numeric,
  price_max numeric,
  funding text not null default '',
  crm_link text not null default '',
  notes text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists landing_pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  deal_id uuid not null references deals(id) on delete cascade,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'draft')),
  arv_min numeric,
  arv_max numeric,
  rehab_category text check (rehab_category in ('light', 'average', 'heavy')),
  rehab_reason text not null default '',
  repair_estimate numeric,
  mao_min numeric,
  mao_max numeric,
  rent_min numeric,
  rent_max numeric,
  narrative text not null default '',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists comps (
  id uuid primary key default gen_random_uuid(),
  landing_page_id uuid not null references landing_pages(id) on delete cascade,
  address text not null default '',
  city text not null default '',
  state text not null default '',
  zip text not null default '',
  sale_price numeric,
  sqft numeric,
  beds numeric,
  baths numeric,
  sold_date date,
  dom int,
  condition text not null default '',
  stories numeric,
  source_pdf_path text,
  position int not null default 0
);

create table if not exists pipeline_cards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  landing_page_id uuid not null unique references landing_pages(id) on delete cascade,
  stage text not null default 'underwriting' check (stage in ('underwriting', 'marketing', 'assigned', 'inspections', 'closed')),
  position int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  landing_page_id uuid not null references landing_pages(id) on delete cascade,
  investor_id uuid references investors(id) on delete set null,
  investor_name text not null default '',
  amount numeric,
  terms text not null default '',
  phone text not null default '',
  email text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists page_views (
  id uuid primary key default gen_random_uuid(),
  landing_page_id uuid not null references landing_pages(id) on delete cascade,
  investor_id uuid references investors(id) on delete set null,
  visitor_key text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  subject text not null default '',
  body text not null default '',
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sent')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  delivery_note text,
  created_at timestamptz not null default now()
);

create table if not exists campaign_pages (
  campaign_id uuid not null references campaigns(id) on delete cascade,
  landing_page_id uuid not null references landing_pages(id) on delete cascade,
  primary key (campaign_id, landing_page_id)
);

create table if not exists campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  investor_id uuid not null references investors(id) on delete cascade,
  token text not null unique,
  matched_landing_page_ids uuid[] not null default '{}',
  sent_at timestamptz,
  unique (campaign_id, investor_id)
);

create table if not exists activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  ref_type text not null default '',
  ref_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists deals_workspace_idx on deals (workspace_id, uploaded_at desc);
create index if not exists investors_workspace_idx on investors (workspace_id, added_at desc);
create index if not exists landing_pages_workspace_idx on landing_pages (workspace_id, created_at desc);
create index if not exists pipeline_stage_idx on pipeline_cards (workspace_id, stage, position);
create index if not exists page_views_page_idx on page_views (landing_page_id, created_at desc);
create index if not exists offers_page_idx on offers (landing_page_id, created_at desc);

alter table workspaces enable row level security;
alter table underwriting_prompts enable row level security;
alter table deals enable row level security;
alter table investors enable row level security;
alter table landing_pages enable row level security;
alter table comps enable row level security;
alter table pipeline_cards enable row level security;
alter table offers enable row level security;
alter table page_views enable row level security;
alter table campaigns enable row level security;
alter table campaign_pages enable row level security;
alter table campaign_recipients enable row level security;
alter table activity_events enable row level security;

insert into workspaces (id, name, owner_initials)
values ('00000000-0000-4000-8000-000000000001', 'Bettenvest', 'SB')
on conflict (id) do nothing;

insert into underwriting_prompts (workspace_id, key, title, body)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'arv',
    'ARV Analysis & Comparable Property Evaluation',
    $arv$I want you to create a ARV for a subject property.   Take the comparable properties that gets uploaded into the landing page tab of properties that have just sold.
Make sure when making your comparisons, evaluations , you are looking at things like listing price, days on market, bed/bath, condition, square footage, living space, stories, area is pretty much same across the board.
With that, I want to give us a ARV range of what appears buyers are willing to pay for properties like theirs in their market$arv$
  ),
  (
    '00000000-0000-4000-8000-000000000001',
    'repairs_mao',
    'Repair Estimates and MAO calculation',
    $mao$based off this comp and the following investment strategy (80% arv-repairs: MAO) what is the min arv and max arv, what is my mao.
During this calculation review the subject property photos and run my Repairs calculation
Step 1- Categorize it as either light, medium, or heavy remodel.
* Light rehab-$30 per SQFT: Carpet, paint, and minor cosmetic things.
* Average Rehab-$40 per SQFT: (Cosmetic/Surface Rehab)- Carpet, paint, bathrooms, and kitchen (cabinets and countertops); including electrical and plumbing fixtures.
* Heavy rehab-$50 per SQFT:, which can be a complete gut job, including roof, siding, windows, or it could be changing the floor plan, or doing an addition.
Step 2- Take price per sqft of the home and calculate the Per-square-foot price based off of the remodel category, then add 20%$mao$
  )
on conflict (workspace_id, key) do nothing;

insert into storage.buckets (id, name, public)
values
  ('mls-pdfs', 'mls-pdfs', false),
  ('comp-pdfs', 'comp-pdfs', false),
  ('property-photos', 'property-photos', true)
on conflict (id) do nothing;
