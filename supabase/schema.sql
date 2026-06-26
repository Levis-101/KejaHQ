-- ============================================================
-- KejaHQ — Phase 1 Database Schema
-- Run this in: Supabase → SQL Editor → New Query → Run
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────
-- 1. PROFILES
-- Extends Supabase auth.users with landlord data
-- ──────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz default now() not null
);

-- Auto-create a profile row whenever a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ──────────────────────────────────────────────
-- 2. PROPERTIES
-- A building or property owned by a landlord
-- ──────────────────────────────────────────────
create table if not exists public.properties (
  id          uuid default uuid_generate_v4() primary key,
  owner_id    uuid references public.profiles(id) on delete cascade not null,
  name        text not null,           -- e.g. "Kamau Court"
  address     text not null,           -- street address
  city        text not null default 'Nairobi',
  floors      integer,
  notes       text,
  created_at  timestamptz default now() not null
);

-- ──────────────────────────────────────────────
-- 3. UNITS
-- Individual apartment/unit within a property
-- ──────────────────────────────────────────────
create type unit_status as enum ('vacant', 'occupied', 'maintenance');

create table if not exists public.units (
  id            uuid default uuid_generate_v4() primary key,
  property_id   uuid references public.properties(id) on delete cascade not null,
  unit_number   text not null,         -- e.g. "A1", "3B", "12"
  floor         integer,
  bedrooms      integer default 1,
  rent_amount   numeric(12, 2) not null,
  status        unit_status default 'vacant' not null,
  notes         text,
  created_at    timestamptz default now() not null,

  unique (property_id, unit_number)    -- no two units with same number in same property
);

-- ──────────────────────────────────────────────
-- 4. TENANTS
-- A tenant occupying a unit
-- ──────────────────────────────────────────────
create table if not exists public.tenants (
  id            uuid default uuid_generate_v4() primary key,
  unit_id       uuid references public.units(id) on delete set null,
  full_name     text not null,
  phone         text not null,         -- Kenyan format: 07XX XXX XXX
  email         text,
  id_number     text,                  -- national ID
  lease_start   date not null,
  lease_end     date,                  -- null = month-to-month
  deposit_paid  numeric(12, 2),
  notes         text,
  created_at    timestamptz default now() not null
);

-- When a tenant is added to a unit, mark that unit as occupied
create or replace function public.update_unit_on_tenant_add()
returns trigger
language plpgsql
as $$
begin
  if new.unit_id is not null then
    update public.units
    set status = 'occupied'
    where id = new.unit_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_tenant_added on public.tenants;
create trigger on_tenant_added
  after insert on public.tenants
  for each row execute procedure public.update_unit_on_tenant_add();

-- ──────────────────────────────────────────────
-- 5. MAINTENANCE REQUESTS
-- Logged issues for units (Phase 2 feature — schema ready now)
-- ──────────────────────────────────────────────
create type maintenance_status as enum ('open', 'in_progress', 'resolved');
create type maintenance_priority as enum ('low', 'medium', 'high', 'urgent');

create table if not exists public.maintenance_requests (
  id            uuid default uuid_generate_v4() primary key,
  unit_id       uuid references public.units(id) on delete cascade not null,
  reported_by   uuid references public.profiles(id),   -- landlord or tenant
  title         text not null,
  description   text,
  priority      maintenance_priority default 'medium',
  status        maintenance_status default 'open',
  resolved_at   timestamptz,
  created_at    timestamptz default now() not null
);

-- ──────────────────────────────────────────────
-- 6. PAYMENTS
-- Rent payments made by tenants
-- ──────────────────────────────────────────────
create type payment_status as enum ('pending', 'completed', 'failed', 'refunded');
create type payment_method as enum ('cash', 'bank_transfer', 'mobile_money', 'credit_card', 'other');

create table if not exists public.payments (
  id              uuid default uuid_generate_v4() primary key,
  tenant_id       uuid references public.tenants(id) on delete set null,
  unit_id         uuid references public.units(id) on delete set null,
  amount          numeric(12, 2) not null,
  payment_date    date not null,
  payment_period  date not null,  -- The month this payment covers (e.g., 2024-01-01 for January 2024)
  payment_method  payment_method,
  status          payment_status default 'pending',
  transaction_id  text,           -- External transaction ID from payment processor
  notes           text,
  created_at      timestamptz default now() not null
);

-- ──────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- Landlords can only see their own data
-- ──────────────────────────────────────────────
alter table public.profiles             enable row level security;
alter table public.properties           enable row level security;
alter table public.units                enable row level security;
alter table public.tenants              enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.payments             enable row level security;

-- Profiles: users see only their own profile
create policy "Own profile" on public.profiles
  for all using (auth.uid() = id);

-- Properties: landlords see only their own properties
create policy "Own properties" on public.properties
  for all using (auth.uid() = owner_id);

-- Units: visible if the landlord owns the parent property
create policy "Own units" on public.units
  for all using (
    exists (
      select 1 from public.properties
      where id = units.property_id
        and owner_id = auth.uid()
    )
  );

-- Tenants: visible if the landlord owns the unit's property
create policy "Own tenants" on public.tenants
  for all using (
    exists (
      select 1 from public.units u
      join public.properties p on p.id = u.property_id
      where u.id = tenants.unit_id
        and p.owner_id = auth.uid()
    )
  );

-- Maintenance: visible to the property owner
create policy "Own maintenance requests" on public.maintenance_requests
  for all using (
    exists (
      select 1 from public.units u
      join public.properties p on p.id = u.property_id
      where u.id = maintenance_requests.unit_id
        and p.owner_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────
-- 6. PAYMENTS
-- Rent payments made by tenants
-- ──────────────────────────────────────────────
create type payment_method as enum ('cash', 'bank_transfer', 'mobile_money', 'credit_card', 'other');
create type payment_status as enum ('pending', 'completed', 'failed', 'refunded');

create table if not exists public.payments (
  id              uuid default uuid_generate_v4() primary key,
  tenant_id       uuid references public.tenants(id) on delete set null,
  unit_id         uuid references public.units(id) on delete set null,
  amount          numeric(12, 2) not null,
  payment_date    date not null,
  payment_period  text not null,       -- e.g. "2024-01" for January 2024
  payment_method  payment_method,
  status          payment_status default 'pending',
  transaction_id  text,
  notes           text,
  created_at      timestamptz default now() not null
);

-- Row Level Security for payments
alter table public.payments enable row level security;

-- Payments: visible if the landlord owns the property associated with the payment
create policy "Own payments" on public.payments
  for all using (
    exists (
      select 1 from public.tenants t
      join public.units u on u.id = t.unit_id
      join public.properties p on p.id = u.property_id
      where t.id = payments.tenant_id
        and p.owner_id = auth.uid()
    )
  );

-- Payments: visible if the landlord owns the property associated with the payment
create policy "Own payments" on public.payments
  for all using (
    exists (
      select 1 from public.tenants t
      join public.units u on u.id = t.unit_id
      join public.properties p on p.id = u.property_id
      where t.id = payments.tenant_id
        and p.owner_id = auth.uid()
    )
  );