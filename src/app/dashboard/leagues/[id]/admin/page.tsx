import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Calendar, ShieldCheck } from 'lucide-react'
import { addMatchStats } from './actions'

export default async function AdminLeaguePage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id: leagueId } = await params
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

    // Fetch all members to display in the form
    const { data: members } = await supabase
        .from('league_members')
        .select(`
      user_id,
      profiles!inner ( id, full_name )
    `)
        .eq('league_id', leagueId)

    // Bind the server action with the leagueId
    const submitMatch = addMatchStats.bind(null, leagueId)

    const playerIds = (members || []).map(m => m.user_id).join(',')

    return (
        <div className="max-w-4xl mx-auto pb-12">
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
                    Inserisci i risultati e le statistiche dell'ultima partita. Seleziona chi ha giocato e inserisci i voti.
                </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                <form action={submitMatch}>
                    <input type="hidden" name="player_ids" value={playerIds} />

                    <div className="p-6 border-b border-white/10 bg-black/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 className="text-xl font-bold text-white">Nuova Partita</h2>
                        <div className="flex items-center gap-3">
                            <label htmlFor="match_date" className="text-sm text-slate-400 font-medium">Data Partita:</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    name="match_date"
                                    id="match_date"
                                    required
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-xs uppercase tracking-wider text-slate-400 font-semibold border-b border-white/10">
                                    <th className="p-4 w-12 text-center">In Campo</th>
                                    <th className="p-4">Giocatore</th>
                                    <th className="p-4 text-center w-24">Gol</th>
                                    <th className="p-4 text-center w-24">Assist</th>
                                    <th className="p-4 text-center w-28">Voto (0-10)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {members?.map((member) => {
                                    // @ts-ignore
                                    const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles

                                    return (
                                        <tr key={member.user_id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    name={`played_${member.user_id}`}
                                                    defaultChecked
                                                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                                                />
                                            </td>
                                            <td className="p-4 font-semibold text-white">
                                                {profile?.full_name}
                                            </td>
                                            <td className="p-4">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    defaultValue="0"
                                                    name={`goals_${member.user_id}`}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-center text-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    defaultValue="0"
                                                    name={`assists_${member.user_id}`}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-center text-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    min="0"
                                                    max="10"
                                                    placeholder="6.5"
                                                    name={`vote_${member.user_id}`}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-center text-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
                                                />
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 bg-black/20 border-t border-white/10 flex justify-end">
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        >
                            <Save className="h-5 w-5" />
                            Salva Partita
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
