'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addMatchStats(leagueId: string, formData: FormData) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // 1. Verify admin rights
    const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('admin_id')
        .eq('id', leagueId)
        .single()

    if (leagueError || league?.admin_id !== user.id) {
        return { error: 'Non hai i permessi per eseguire questa azione.' }
    }

    // 2. Create the Match
    const matchDate = formData.get('match_date') as string || new Date().toISOString()

    const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
            league_id: leagueId,
            match_date: matchDate,
        })
        .select()
        .single()

    if (matchError || !match) {
        return { error: 'Errore durante la creazione della partita.' }
    }

    // 3. Process and insert Match Stats
    // We need to extract data dynamically from formData
    const statsToInsert = []

    // We assume the form sends a hidden input 'player_ids' containing comma-separated UUIDs
    const playerIdsString = formData.get('player_ids') as string
    if (!playerIdsString) return { error: 'Nessun giocatore trovato.' }

    const playerIds = playerIdsString.split(',')

    for (const playerId of playerIds) {
        const played = formData.get(`played_${playerId}`) === 'on'

        // Only insert stats if the player actually played this match
        if (played) {
            const goals = parseInt(formData.get(`goals_${playerId}`) as string) || 0
            const assists = parseInt(formData.get(`assists_${playerId}`) as string) || 0
            const voteStr = formData.get(`vote_${playerId}`) as string

            const vote = voteStr ? parseFloat(voteStr) : null

            statsToInsert.push({
                match_id: match.id,
                player_id: playerId,
                goals,
                assists,
                vote
            })
        }
    }

    if (statsToInsert.length > 0) {
        const { error: statsError } = await supabase
            .from('match_stats')
            .insert(statsToInsert)

        if (statsError) {
            // Rollback match might be needed in a real prod env, but for now we throw error
            return { error: 'Errore durante l\'inserimento delle statistiche: ' + statsError.message }
        }
    }

    revalidatePath(`/dashboard/leagues/${leagueId}`)
    redirect(`/dashboard/leagues/${leagueId}`)
}
