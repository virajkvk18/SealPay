create table if not exists profiles (
  wallet_address text primary key,
  display_name text not null,
  role text not null check (role in ('Client', 'Freelancer', 'Admin/Judge')),
  skills text,
  created_at timestamptz default now()
);

alter table profiles add column if not exists skills text;
alter table profiles add column if not exists created_at timestamptz default now();

alter table profiles enable row level security;

drop policy if exists "Allow public read profiles" on profiles;
drop policy if exists "Allow public insert profiles" on profiles;
drop policy if exists "Allow public update profiles" on profiles;
drop policy if exists "Allow public upsert profiles" on profiles;

create policy "Allow public read profiles"
on profiles for select
using (true);

create policy "Allow public insert profiles"
on profiles for insert
with check (true);

create policy "Allow public update profiles"
on profiles for update
using (true)
with check (true);
