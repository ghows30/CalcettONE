import { createClient } from '@/utils/supabase/server'

export interface LeagueRanking {
    id: string
    name: string
    rank: number
    score: number
}

export async function getUserLeaguesRankings(): Promise<LeagueRanking[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Fetch leagues first
    const { data: membership } = await supabase
        .from('league_members')
        .select(`
            league_id,
            leagues (
                id,
                name
            )
        `)
        .eq('user_id', user.id)

    if (!membership || membership.length === 0) return []

    const leagues = membership.map(m => m.leagues) as any[]
    const results: LeagueRanking[] = []

    for (const league of leagues) {
        // Fetch matches for this league
        const { data: matchStats } = await supabase
            .from('match_stats')
            .select('player_id, goals, assists, vote, matches!inner(league_id, status)')
            .eq('matches.league_id', league.id)
            .eq('matches.status', 'finalized')

        // Fetch all members to calculate rank
        const { data: allMembers } = await supabase
            .from('league_members')
            .select('user_id')
            .eq('league_id', league.id)

        if (!allMembers) continue

        // Calculate scores for everyone in this league
        const playerScores = new Map<string, number>()

        // Initialize scores for all members to 0
        allMembers.forEach(m => playerScores.set(m.user_id, 0))

        // Aggregate stats
        matchStats?.forEach(stat => {
            const current = playerScores.get(stat.player_id) || 0
            const points = (stat.goals || 0) + (stat.assists || 0) + (Number(stat.vote) || 0)
            playerScores.set(stat.player_id, current + points)
        })

        // Sort to get rank
        const sortedScores = Array.from(playerScores.entries())
            .map(([uid, score]) => ({ uid, score }))
            .sort((a, b) => b.score - a.score)

        const userRankIndex = sortedScores.findIndex(s => s.uid === user.id)
        const userScore = playerScores.get(user.id) || 0

        results.push({
            id: league.id,
            name: league.name,
            rank: userRankIndex + 1,
            score: userScore
        })
    }

    return results
}
