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
        console.error('Supabase error creating league:', error)
        return { error: 'Si è verificato un errore durante la creazione della lega.' }
    }

    revalidatePath('/dashboard', 'layout')
    redirect(`/dashboard/leagues/${data.id}`)
}

export async function joinLeague(formData: FormData) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const join_code = formData.get('join_code') as string

    // Find the league by code
    const { data: league, error: findError } = await supabase
        .from('leagues')
        .select('id')
        .eq('join_code', join_code)
        .single()

    if (findError || !league) {
        return { error: 'Codice invito non valido o lega non trovata.' }
    }

    // Join the league
    const { error: joinError } = await supabase
        .from('league_members')
        .insert({
            league_id: league.id,
            user_id: user.id,
        })

    if (joinError) {
        if (joinError.code === '23505') { // Unique violation
            return { error: 'Fai già parte di questa lega.' }
        }
        return { error: 'Errore durante l\'unione alla lega.' }
    }

    revalidatePath('/dashboard', 'layout')
    redirect(`/dashboard/leagues/${league.id}`)
}
