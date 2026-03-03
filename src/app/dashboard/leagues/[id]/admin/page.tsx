import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, ShieldCheck, Settings, Play, CheckCircle2, Trophy } from 'lucide-react'
import { scheduleMatch, updateLeagueSettings, updateMatchStatus, finalizeMatch } from './actions'

export default async function AdminLeaguePage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ error?: string, success?: string }>
}) {
    const { id: leagueId } = await params
    const { error: errorMsg, success: successMsg } = await searchParams
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // Fetch league details & verify admin
    const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', leagueId)
        .single()

    if (leagueError || !league || league.admin_id !== user.id) {
        return redirect(`/dashboard/leagues/${leagueId}`)
    }

    // Fetch existing matches
    const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('league_id', leagueId)
        .order('match_date', { ascending: false })

    console.log('--- DEBUG ADMIN PAGE ---')
    console.log('League ID:', leagueId)
    console.log('User ID:', user.id)
    console.log('Matches Count:', matches?.length || 0)
    if (matchesError) console.error('Matches Error:', matchesError)
    console.log('------------------------')

    return (
        <div className="max-w-4xl mx-auto pb-12">
            {errorMsg && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
                    {errorMsg}
                </div>
            )}
            {successMsg && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-medium">
                    {successMsg}
                </div>
            )}
            <div className="mb-6">
                <Link href={`/dashboard/leagues/${leagueId}`} className="inline-flex items-center text-slate-400 hover:text-emerald-400 transition-colors mb-4 text-sm font-medium">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Torna alla Lega
                </Link>
                <div className="flex items-center gap-3">
                    <ShieldCheck className="h-8 w-8 text-emerald-400" />
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Pannello Amministratore</h1>
                </div>
                <p className="text-slate-400 mt-2">
                    Gestisci la lega, schedula nuove partite e controlla le fasi di votazione.
                </p>
            </div>

            {/* League Settings */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <Settings className="h-5 w-5 text-emerald-400" />
                    <h2 className="text-xl font-bold text-white">Impostazioni Lega</h2>
                </div>

                <form action={updateLeagueSettings.bind(null, leagueId)} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                        <label className="block text-sm font-bold text-white mb-1">
                            Modifica Statistiche Partecipanti
                        </label>
                        <p className="text-sm text-slate-500">
                            (Legacy) Questa impostazione è ora gestita dal flusso della partita.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="allow_member_stats_edit"
                                id="allow_member_stats_edit_admin"
                                defaultChecked={league.allow_member_stats_edit}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-bold border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                        >
                            Salva
                        </button>
                    </div>
                </form>
            </div>

            {/* Schedule New Match */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm mb-8">
                <h2 className="text-xl font-bold text-white mb-4">Schedula Prossima Partita</h2>
                <form action={scheduleMatch.bind(null, leagueId)} className="flex items-end gap-4">
                    <div className="flex-1">
                        <label htmlFor="match_date" className="block text-sm font-medium text-slate-400 mb-2">Data Partita</label>
                        <input
                            type="date"
                            name="match_date"
                            id="match_date"
                            required
                            defaultValue={new Date().toISOString().split('T')[0]}
                            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-all"
                    >
                        Schedula
                    </button>
                </form>
            </div>

            {/* Matches Management */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="p-6 border-b border-white/10 bg-black/20">
                    <h2 className="text-xl font-bold text-white">Gestione Partite</h2>
                </div>

                <div className="divide-y divide-white/5">
                    {(!matches || matches.length === 0) ? (
                        <div className="p-12 text-center text-slate-500">
                            Nessuna partita in programma.
                        </div>
                    ) : (
                        matches.map((match) => {
                            const openVoting = updateMatchStatus.bind(null, leagueId, match.id, 'voting')
                            const finalize = finalizeMatch.bind(null, leagueId, match.id)

                            return (
                                <div key={match.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${match.status === 'scheduled' ? 'bg-blue-500/10 text-blue-400' :
                                            match.status === 'voting' ? 'bg-orange-500/10 text-orange-400' :
                                                'bg-emerald-500/10 text-emerald-400'
                                            }`}>
                                            <Calendar className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">
                                                {new Date(match.match_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                            <p className="text-xs uppercase tracking-wider font-semibold opacity-60">
                                                Stato: {
                                                    match.status === 'scheduled' ? 'In programma' :
                                                        match.status === 'voting' ? 'Fase Votazioni' :
                                                            'Finalizzata'
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {match.status === 'scheduled' && (
                                            <form action={openVoting}>
                                                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 text-orange-400 text-xs font-bold border border-orange-500/20 hover:bg-orange-500/20 transition-all">
                                                    <Play className="h-3.5 w-3.5" />
                                                    Apri Votazioni
                                                </button>
                                            </form>
                                        )}
                                        {match.status === 'voting' && (
                                            <form action={finalize}>
                                                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-all">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Finalizza Partita
                                                </button>
                                            </form>
                                        )}
                                        {match.status === 'finalized' && (
                                            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-slate-400 text-xs font-bold">
                                                <Trophy className="h-3.5 w-3.5" />
                                                Archiviata
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
