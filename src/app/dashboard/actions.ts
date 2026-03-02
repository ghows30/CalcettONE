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
    const join_code = generateJoinCode()

    // Create the league. The trigger in SQL will automatically add the admin as a member.
    const { data, error } = await supabase
        .from('leagues')
        .insert({
            name,
            join_code,
            admin_id: user.id,
        })
        .select()
        .single()

    if (error) {
        return { error: 'Si è verificato un errore durante la creazione della lega.' }
    }

    revalidatePath('/dashboard', 'layout')
    redirect(`/dashboard/leagues/${data.id}`)
}

export async function joinLeague(formData: FormData) {
    let redirectPath = null

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Sessione scaduta o non loggato' }
        }

        const join_code = (formData.get('join_code') as string)?.trim().toUpperCase()

        const { data: leagueId, error: joinError } = await supabase
            .rpc('join_league_by_code', { code_to_join: join_code })

        if (joinError) {
            return { error: joinError.message }
        }

        revalidatePath('/dashboard', 'layout')
        redirectPath = `/dashboard/leagues/${leagueId}`
    } catch (e: any) {
        return { error: 'Si è verificato un errore: ' + e.message }
    }

    if (redirectPath) {
        redirect(redirectPath)
    }
}
