-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. SONGS
create table public.songs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  data jsonb not null, -- The entire song JSON state
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.songs enable row level security;
create policy "Users can view own songs" on public.songs for select using (auth.uid() = user_id);
create policy "Users can insert own songs" on public.songs for insert with check (auth.uid() = user_id);
create policy "Users can update own songs" on public.songs for update using (auth.uid() = user_id);
create policy "Users can delete own songs" on public.songs for delete using (auth.uid() = user_id);

-- 3. INSTRUMENTS (Custom Kits)
create table public.instruments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  name text not null,
  type text default 'sampler', -- 'sampler' or 'synth'
  data jsonb not null, -- Configuration data (envelope, filter, etc.)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.instruments enable row level security;
create policy "Users can view own instruments" on public.instruments for select using (auth.uid() = user_id);
create policy "Users can insert own instruments" on public.instruments for insert with check (auth.uid() = user_id);
create policy "Users can update own instruments" on public.instruments for update using (auth.uid() = user_id);
create policy "Users can delete own instruments" on public.instruments for delete using (auth.uid() = user_id);

-- 4. STORAGE (Samples)
-- Requires creating a bucket named 'samples' in the dashboard first, or via API if enabled.
-- Policy below assumes the bucket exists.

-- Allow public access to read samples (so other users can potentially hear shared songs? 
-- Or strictly private? User asked for 'save songs... save instruments'. For now, let's keep private-write, public-read if we want sharing later, or private-read for now.
-- Let's go with: Authenticated users can upload. Authenticated users can read their own?)
-- Actually, if I share a song with you, you need to hear my custom instrument. So 'Read' should probably be public or at least authenticated-global.
-- For now: Users own their files.

-- STORAGE POLICIES (You must create a bucket named 'samples' in the Supabase Dashboard Storage section)
-- Policy: "Give users access to their own folder 1uhoi_0"
-- logic: bucket_id = 'samples' AND (storage.foldername(name))[1] = auth.uid()::text

-- We will instruct the user to create the bucket 'samples'.
