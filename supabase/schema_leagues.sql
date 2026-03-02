-- Create leagues table
create table public.leagues (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  join_code text not null unique,
  admin_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create league_members table (junction table)
create table public.league_members (
  league_id uuid references public.leagues(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (league_id, user_id)
);

-- Create matches table
create table public.matches (
  id uuid default gen_random_uuid() primary key,
  league_id uuid references public.leagues(id) on delete cascade not null,
  match_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create match_stats table
create table public.match_stats (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  player_id uuid references public.profiles(id) on delete cascade not null,
  goals integer default 0 not null,
  assists integer default 0 not null,
  vote numeric(3,1) check (vote >= 0 and vote <= 10), -- e.g. 7.5
  unique (match_id, player_id)
);

-- Set up Row Level Security (RLS) policies

-- Helper function to avoid infinite recursion
create or replace function public.is_league_member(league_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.league_members
    where league_id = league_uuid and user_id = auth.uid()
  );
$$;

-- LEAGUES
alter table public.leagues enable row level security;
-- Everyone can view leagues they are a member of
create policy "Users can view their leagues" on public.leagues
  for select using (
    admin_id = auth.uid() or public.is_league_member(id)
  );
-- Users can insert leagues (as admin)
create policy "Users can create leagues" on public.leagues
  for insert with check (admin_id = auth.uid());
-- Only admin can update or delete their leagues
create policy "Admins can update their leagues" on public.leagues
  for update using (admin_id = auth.uid());
create policy "Admins can delete their leagues" on public.leagues
  for delete using (admin_id = auth.uid());


-- LEAGUE MEMBERS
alter table public.league_members enable row level security;
-- Users can view members of their leagues
create policy "Users can view members of their leagues" on public.league_members
  for select using (
    public.is_league_member(league_id)
  );
-- Users can insert themselves with a valid code (this logic needs to bypass RLS to check the code, so we might need a function, or we let them insert if they know the league ID, but real check happens server side)
create policy "Users can join a league" on public.league_members
  for insert with check (user_id = auth.uid());
-- Only admin can remove members
create policy "Admins can remove members" on public.league_members
  for delete using (
    league_id in (select id from public.leagues where admin_id = auth.uid())
    or user_id = auth.uid() -- Users can leave the league
  );


-- MATCHES
alter table public.matches enable row level security;
-- Users can view matches of their leagues
create policy "Users can view matches in their leagues" on public.matches
  for select using (
    public.is_league_member(league_id)
  );
-- Only admin can insert, update, or delete matches
create policy "Admins can insert matches" on public.matches
  for insert with check (
    league_id in (select id from public.leagues where admin_id = auth.uid())
  );
create policy "Admins can delete matches" on public.matches
  for delete using (
    league_id in (select id from public.leagues where admin_id = auth.uid())
  );


-- MATCH STATS
alter table public.match_stats enable row level security;
-- Users can view stats for matches in their leagues
create policy "Users can view stats of their leagues" on public.match_stats
  for select using (
    match_id in (
      select id from public.matches where public.is_league_member(league_id)
    )
  );
-- Only admin can insert, update, delete stats
create policy "Admins can insert stats" on public.match_stats
  for insert with check (
    match_id in (select id from public.matches where league_id in (
      select id from public.leagues where admin_id = auth.uid()
    ))
  );
create policy "Admins can update stats" on public.match_stats
  for update using (
    match_id in (select id from public.matches where league_id in (
      select id from public.leagues where admin_id = auth.uid()
    ))
  );
create policy "Admins can delete stats" on public.match_stats
  for delete using (
    match_id in (select id from public.matches where league_id in (
      select id from public.leagues where admin_id = auth.uid()
    ))
  );

-- Function to handle league creation and enforce the creator as a member
create or replace function public.handle_league_creation()
returns trigger as $$
begin
  insert into public.league_members (league_id, user_id)
  values (new.id, new.admin_id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_league_created
  after insert on public.leagues
  for each row execute procedure public.handle_league_creation();
