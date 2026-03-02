-- Drop the old problematic policies that caused infinite recursion
drop policy if exists "Users can view their leagues" on public.leagues;
drop policy if exists "Users can view members of their leagues" on public.league_members;
drop policy if exists "Users can view matches in their leagues" on public.matches;
drop policy if exists "Users can view stats of their leagues" on public.match_stats;

-- Create a security definer function to check membership without triggering RLS recursively
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

-- Fix LEAGUES: Users can view leagues if they are admin or a member
create policy "Users can view their leagues" on public.leagues
  for select using (
    admin_id = auth.uid() or public.is_league_member(id)
  );

-- Fix LEAGUE MEMBERS: Users can view members of leagues they are a member of
create policy "Users can view members of their leagues" on public.league_members
  for select using (
    public.is_league_member(league_id)
  );

-- Fix MATCHES: Users can view matches of their leagues
create policy "Users can view matches in their leagues" on public.matches
  for select using (
    public.is_league_member(league_id)
  );

-- Fix MATCH STATS: Users can view stats for matches in their leagues
create policy "Users can view stats of their leagues" on public.match_stats
  for select using (
    match_id in (
      select id from public.matches where public.is_league_member(league_id)
    )
  );
