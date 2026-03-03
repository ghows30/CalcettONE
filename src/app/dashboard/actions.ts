'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Helper function to generate a random 6-character code
function generateJoinCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

export async function createLeague(formData: FormData) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const name = formData.get('name') as string
    const allow_member_stats_edit = formData.get('allow_member_stats_edit') === 'on'
    const join_code = generateJoinCode()

    // Create the league. The trigger in SQL will automatically add the admin as a member.
    const { data, error } = await supabase
        .from('leagues')
        .insert({
            name,
            join_code,
            admin_id: user.id,
            allow_member_stats_edit,
        })
        .select()
        .single()

    if (error) {
        return { error: 'Si è verificato un errore durante la creazione della lega: ' + error.message }
    }

    revalidatePath('/dashboard', 'layout')
    redirect(`/dashboard/leagues/${data.id}`)
}

export async function joinLeague(formData: FormData) {
    let leagueId: string | null = null;
    let errorMsg: string | null = null;

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Sessione scaduta o non loggato' }
        }

        const join_code = (formData.get('join_code') as string)?.trim().toUpperCase()

        const { data, error: joinError } = await supabase
            .rpc('join_league_by_code', { code_to_join: join_code })

        if (joinError) {
            return { error: joinError.message }
        }

        leagueId = data;
        revalidatePath('/dashboard', 'layout')
    } catch (e: any) {
        // Next.js redirect throws a special error, but since we handle it outside,
        // we only catch real errors here.
        if (e.message?.includes('NEXT_REDIRECT')) throw e;
        return { error: 'Si è verificato un errore: ' + e.message }
    }

    if (leagueId) {
        redirect(`/dashboard/leagues/${leagueId}`)
    }
}

export async function leaveLeague(leagueId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { error } = await supabase
        .from('league_members')
        .delete()
        .eq('league_id', leagueId)
        .eq('user_id', user.id)

    if (error) {
        // In a real app we might want to redirect with an error param
        redirect('/dashboard?error=leave_failed')
    }

    revalidatePath('/dashboard', 'layout')
    redirect('/dashboard')
}

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Sessione scaduta' }
    }

    const first_name = formData.get('first_name') as string
    const last_name = formData.get('last_name') as string
    const full_name = `${first_name} ${last_name}`.trim()

    if (!first_name || !last_name) {
        return { error: 'Nome e Cognome sono obbligatori' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            first_name,
            last_name,
            full_name,
            updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

    if (error) {
        return { error: 'Riprova: ' + error.message }
    }

    revalidatePath('/dashboard', 'layout')
    return { success: true }
}
