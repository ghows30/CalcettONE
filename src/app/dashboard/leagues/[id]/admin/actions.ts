'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function scheduleMatch(leagueId: string, formData: FormData) {
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
        redirect(`/dashboard/leagues/${leagueId}/admin?error=` + encodeURIComponent('Non hai i permessi per eseguire questa azione.'))
    }

    // 2. Create the Match shell
    let matchDate = formData.get('match_date') as string
    if (!matchDate) {
        matchDate = new Date().toISOString().split('T')[0]
    }

    const { error: matchError } = await supabase
        .from('matches')
        .insert({
            league_id: leagueId,
            match_date: matchDate,
            status: 'scheduled'
        })

    if (matchError) {
        console.error('Match creation error:', matchError)
        redirect(`/dashboard/leagues/${leagueId}/admin?error=` + encodeURIComponent(`Errore: ${matchError.message}`))
    }

    revalidatePath(`/dashboard/leagues/${leagueId}`)
    revalidatePath(`/dashboard/leagues/${leagueId}/admin`)
    revalidatePath(`/dashboard/leagues/${leagueId}/matches`)
    redirect(`/dashboard/leagues/${leagueId}/admin?success=` + encodeURIComponent('Partita schedulata con successo!'))
}


// updateLeagueSettings follows...

export async function updateLeagueSettings(leagueId: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify admin rights
    const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('admin_id')
        .eq('id', leagueId)
        .single()

    if (leagueError || league?.admin_id !== user.id) {
        redirect(`/dashboard/leagues/${leagueId}/admin?error=` + encodeURIComponent('Non hai i permessi.'))
    }

    const allow_member_stats_edit = formData.get('allow_member_stats_edit') === 'on'

    const { error } = await supabase
        .from('leagues')
        .update({ allow_member_stats_edit })
        .eq('id', leagueId)

    if (error) {
        redirect(`/dashboard/leagues/${leagueId}/admin?error=` + encodeURIComponent('Errore durante l\'aggiornamento delle impostazioni.'))
    }

    revalidatePath(`/dashboard/leagues/${leagueId}/admin`)
    revalidatePath(`/dashboard/leagues/${leagueId}`)
}

export async function updateMatchStatus(leagueId: string, matchId: string, newStatus: 'scheduled' | 'voting' | 'finalized') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Verify admin
    const { data: league } = await supabase
        .from('leagues')
        .select('admin_id')
        .eq('id', leagueId)
        .single()

    if (league?.admin_id !== user.id) throw new Error('Non autorizzato')

    const { error } = await supabase
        .from('matches')
        .update({ status: newStatus })
        .eq('id', matchId)

    if (error) throw new Error('Errore: ' + error.message)

    revalidatePath(`/dashboard/leagues/${leagueId}/matches`)
    revalidatePath(`/dashboard/leagues/${leagueId}/admin`)
    revalidatePath(`/dashboard/leagues/${leagueId}`)

    redirect(`/dashboard/leagues/${leagueId}/matches`)
}

export async function joinMatch(leagueId: string, matchId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { error } = await supabase
        .from('match_stats')
        .upsert({
            match_id: matchId,
            player_id: user.id
        }, { onConflict: 'match_id,player_id' })

    if (error) {
        console.error('Join match error:', error)
        throw new Error('Errore durante l\'adesione: ' + error.message)
    }

    revalidatePath(`/dashboard/leagues/${leagueId}/matches`)
}

export async function submitVote(leagueId: string, matchId: string, candidateId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Check if voter has already confirmed their choices
    const { data: voterStat } = await supabase
        .from('match_stats')
        .select('is_confirmed')
        .eq('match_id', matchId)
        .eq('player_id', user.id)
        .single()

    if (voterStat?.is_confirmed) throw new Error('Hai già confermato le tue scelte per questa partita.')

    // Check if a vote ALREADY exists for this candidate from this voter
    const { data: existing } = await supabase
        .from('match_votes')
        .select('*')
        .eq('match_id', matchId)
        .eq('voter_id', user.id)
        .eq('candidate_id', candidateId)
        .single()

    if (existing) {
        // Toggle OFF: Remove this specific vote
        await supabase
            .from('match_votes')
            .delete()
            .eq('id', existing.id)
    } else {
        // Toggle ON: Remove ANY existing vote for this match (1-vote limit) and add this one
        await supabase
            .from('match_votes')
            .delete()
            .eq('match_id', matchId)
            .eq('voter_id', user.id)

        await supabase
            .from('match_votes')
            .insert({
                match_id: matchId,
                voter_id: user.id,
                candidate_id: candidateId,
                rating: 1
            })
    }

    revalidatePath(`/dashboard/leagues/${leagueId}/matches`)
}

export async function finalizeMatch(leagueId: string, matchId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Verify admin
    const { data: league } = await supabase
        .from('leagues')
        .select('admin_id')
        .eq('id', leagueId)
        .single()

    if (league?.admin_id !== user.id) throw new Error('Non autorizzato')

    // 1. Calculate star count for each player
    const { data: votes, error: votesError } = await supabase
        .from('match_votes')
        .select('candidate_id')
        .eq('match_id', matchId)

    if (votesError) throw new Error('Errore nel recupero voti')

    const starCounts: Record<string, number> = {}
    votes?.forEach(v => {
        starCounts[v.candidate_id] = (starCounts[v.candidate_id] || 0) + 1
    })

    // 2. Update match_stats with results (storing total stars in 'vote' column)
    const { data: participants } = await supabase
        .from('match_stats')
        .select('player_id')
        .eq('match_id', matchId)

    for (const p of participants || []) {
        const count = starCounts[p.player_id] || 0
        await supabase
            .from('match_stats')
            .update({ vote: count })
            .eq('match_id', matchId)
            .eq('player_id', p.player_id)
    }

    // 3. Mark match as finalized
    const { error: matchError } = await supabase
        .from('matches')
        .update({ status: 'finalized' })
        .eq('id', matchId)

    if (matchError) throw new Error('Errore finalizzazione')

    revalidatePath(`/dashboard/leagues/${leagueId}/matches`)
    revalidatePath(`/dashboard/leagues/${leagueId}`)
    redirect(`/dashboard/leagues/${leagueId}`)
}

export async function updateSelfStats(leagueId: string, matchId: string, goals: number, assists: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Verify match status is voting
    const { data: match } = await supabase
        .from('matches')
        .select('status')
        .eq('id', matchId)
        .single()

    if (match?.status !== 'voting') throw new Error('Le votazioni non sono aperte.')

    // Check if already confirmed
    const { data: currentStat } = await supabase
        .from('match_stats')
        .select('is_confirmed')
        .eq('match_id', matchId)
        .eq('player_id', user.id)
        .single()

    if (currentStat?.is_confirmed) throw new Error('Hai già confermato i tuoi dati.')

    const { error } = await supabase
        .from('match_stats')
        .update({ goals, assists, is_confirmed: true })
        .eq('match_id', matchId)
        .eq('player_id', user.id)

    if (error) throw new Error('Errore: ' + error.message)

    revalidatePath(`/dashboard/leagues/${leagueId}/matches`)
}

export async function deleteMatch(leagueId: string, matchId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Verify admin
    const { data: league } = await supabase
        .from('leagues')
        .select('admin_id')
        .eq('id', leagueId)
        .single()

    if (league?.admin_id !== user.id) throw new Error('Non autorizzato')

    const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId)

    if (error) throw new Error('Errore durante l\'eliminazione: ' + error.message)

    revalidatePath(`/dashboard/leagues/${leagueId}/matches`)
    revalidatePath(`/dashboard/leagues/${leagueId}`)
}
