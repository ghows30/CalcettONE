-- Create profiles table if not exists (handled by initial common setup usually, but here for completeness if needed)
-- (Assuming profiles already exists as it's a core table)

-- 1. Create leagues table
create table if not exists public.leagues (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  join_code text not null unique,
  admin_id uuid not null references public.profiles(id) on delete cascade,
  allow_member_stats_edit boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure allow_member_stats_edit exists
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name='leagues' and column_name='allow_member_stats_edit') then
        alter table public.leagues add column allow_member_stats_edit boolean default false not null;
    end if;
end$$;

-- 2. Create league_members table
create table if not exists public.league_members (
  league_id uuid references public.leagues(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (league_id, user_id)
);

-- 3. Create match_status enum
do $$
begin
    if not exists (select 1 from pg_type where typname = 'match_status') then
        create type public.match_status as enum ('scheduled', 'voting', 'finalized');
    end if;
end$$;

-- 4. Create matches table
create table if not exists public.matches (
  id uuid default gen_random_uuid() primary key,
  league_id uuid references public.leagues(id) on delete cascade not null,
  match_date date not null,
  status public.match_status default 'scheduled' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4.1 Ensure matches has status column (if table existed without it)
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name='matches' and column_name='status') then
        alter table public.matches add column status public.match_status default 'scheduled' not null;
    end if;
end$$;

-- 5. Create match_stats table
create table if not exists public.match_stats (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  player_id uuid references public.profiles(id) on delete cascade not null,
  goals integer default 0 not null,
  assists integer default 0 not null,
  vote numeric(3,1) check (vote >= 0 and vote <= 10),
  is_confirmed boolean default false not null,
  unique (match_id, player_id)
);

-- Ensure is_confirmed exists
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name='match_stats' and column_name='is_confirmed') then
        alter table public.match_stats add column is_confirmed boolean default false not null;
    end if;
end$$;

-- 6. Create match_votes table
create table if not exists public.match_votes (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  voter_id uuid references public.profiles(id) on delete cascade not null,
  candidate_id uuid references public.profiles(id) on delete cascade not null,
  rating numeric(3,1) check (rating >= 0 and rating <= 10) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (match_id, voter_id, candidate_id)
);

-- 7. RLS SETUP
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.matches enable row level security;
alter table public.match_stats enable row level security;
alter table public.match_votes enable row level security;

-- Helper function
create or replace function public.is_league_member(league_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.league_members
    where league_id = league_uuid and user_id = auth.uid()
  ) or exists(
    select 1 from public.leagues
    where id = league_uuid and admin_id = auth.uid()
  );
$$;

-- Policies (using drop/create to ensure they are updated)
drop policy if exists "Users can view their leagues" on public.leagues;
create policy "Users can view their leagues" on public.leagues
  for select using (admin_id = auth.uid() or public.is_league_member(id));

drop policy if exists "Users can create leagues" on public.leagues;
create policy "Users can create leagues" on public.leagues
  for insert with check (admin_id = auth.uid());

drop policy if exists "Admins can update their leagues" on public.leagues;
create policy "Admins can update their leagues" on public.leagues
  for update using (admin_id = auth.uid());

drop policy if exists "Users can view members of their leagues" on public.league_members;
create policy "Users can view members of their leagues" on public.league_members
  for select using (public.is_league_member(league_id));

drop policy if exists "Users can join a league" on public.league_members;
create policy "Users can join a league" on public.league_members
  for insert with check (user_id = auth.uid());

drop policy if exists "Users can view matches in their leagues" on public.matches;
create policy "Users can view matches in their leagues" on public.matches
  for select using (public.is_league_member(league_id));

drop policy if exists "Admins can insert matches" on public.matches;
create policy "Admins can insert matches" on public.matches
  for insert with check (league_id in (select id from public.leagues where admin_id = auth.uid()));

drop policy if exists "Admins can update matches" on public.matches;
create policy "Admins can update matches" on public.matches
  for update using (league_id in (select id from public.leagues where admin_id = auth.uid()));

drop policy if exists "Admins can delete matches" on public.matches;
create policy "Admins can delete matches" on public.matches
  for delete using (league_id in (select id from public.leagues where admin_id = auth.uid()));

drop policy if exists "Users can join matches" on public.match_stats;
create policy "Users can join matches" on public.match_stats
  for insert with check (
    player_id = auth.uid() and
    match_id in (select id from public.matches where status in ('scheduled', 'voting'))
  );

drop policy if exists "Users can update stats during voting" on public.match_stats;
create policy "Users can update stats during voting" on public.match_stats
  for update using (
    (player_id = auth.uid() and match_id in (select id from public.matches where status = 'voting'))
    or
    (match_id in (select id from public.matches where league_id in (select id from public.leagues where admin_id = auth.uid())))
  );

drop policy if exists "Users can view votes of their matches" on public.match_votes;
create policy "Users can view votes of their matches" on public.match_votes
  for select using (match_id in (select id from public.matches where public.is_league_member(league_id)));

drop policy if exists "Users can vote during voting phase" on public.match_votes;
create policy "Users can vote during voting phase" on public.match_votes
  for insert with check (
    voter_id = auth.uid() and 
    voter_id != candidate_id and
    match_id in (select id from public.matches where status = 'voting')
  );

drop policy if exists "Users can remove their votes" on public.match_votes;
create policy "Users can remove their votes" on public.match_votes
  for delete using (voter_id = auth.uid());

-- Trigger for league creation
create or replace function public.handle_league_creation()
returns trigger as $$
begin
  insert into public.league_members (league_id, user_id)
  values (new.id, new.admin_id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_league_created on public.leagues;
create trigger on_league_created
  after insert on public.leagues
  for each row execute procedure public.handle_league_creation();

-- Final reload
notify pgrst, 'reload schema';
