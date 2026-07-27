-- Run this in the Supabase SQL Editor
-- Fixes Google OAuth / OTP signup failures caused by duplicate usernames in public.profiles.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  city text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  username_candidate text;
  suffix text;
  counter int := 0;
begin
  base_username := lower(
    regexp_replace(
      coalesce(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'user'),
      '[^a-zA-Z0-9._-]+',
      '_',
      'g'
    )
  );

  if base_username = '' then
    base_username := 'user';
  end if;

  suffix := substr(replace(new.id::text, '-', ''), 1, 8);
  username_candidate := base_username || '_' || suffix;

  while exists (select 1 from public.profiles where username = username_candidate) loop
    counter := counter + 1;
    username_candidate := base_username || '_' || suffix || '_' || counter;
  end loop;

  insert into public.profiles (id, email, username, full_name, avatar_url)
  values (
    new.id,
    new.email,
    username_candidate,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Clean up orphaned profile rows created from earlier failed signups.
delete from public.profiles p
where not exists (
  select 1 from auth.users u where u.id = p.id
);

drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read"
on public.profiles
for select
using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
using (auth.uid() = id);
