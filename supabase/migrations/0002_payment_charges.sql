create table if not exists public.payment_charges (
  id text primary key,
  uid uuid not null,
  created_at timestamptz not null default now()
);
alter table public.payment_charges enable row level security;
