import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Users, Search, Plus } from 'lucide-react'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // Fetch leagues the user belongs to
    const { data: userLeagues } = await supabase
        .from('league_members')
        .select(`
      league_id,
      leagues (
        id,
        name,
        join_code,
        admin_id
      )
    `)
        .eq('user_id', user.id)

    const leagues = userLeagues?.map(l => l.leagues) || []

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Panoramica</h1>
                    <p className="text-slate-400 mt-1">Gestisci le tue leghe o unisciti a una nuova per sfidare i tuoi amici.</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/dashboard/leagues/join"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
                    >
                        <Search className="h-4 w-4" />
                        Voglio Unirmi
                    </Link>
                    <Link
                        href="/dashboard/leagues/create"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                    >
                        <Plus className="h-4 w-4" />
                        Gestisci Lega
                    </Link>
                </div>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-4">Le Tue Squadre</h2>

                {leagues.length === 0 ? (
                    <div className="border border-dashed border-slate-700/50 rounded-2xl p-12 text-center bg-white/5">
                        <Trophy className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">Nessuna lega attiva</h3>
                        <p className="text-slate-400 max-w-sm mx-auto mb-6">
                            Non fai ancora parte di nessuna lega. Creane una nuova o usa un codice di invito per unirti a quella dei tuoi amici.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <Link
                                href="/dashboard/leagues/create"
                                className="px-5 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 font-semibold hover:bg-emerald-500/20 transition-colors"
                            >
                                Crea Lega
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {leagues.map((league: any) => (
                            <Link href={`/dashboard/leagues/${league.id}`} key={league.id} className="group">
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden h-full flex flex-col">
                                    {/* Card accent */}
                                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-800 group-hover:bg-emerald-500 transition-colors"></div>

                                    <div className="flex justify-between items-start mb-4">
                                        <div className="h-12 w-12 rounded-xl bg-slate-800 group-hover:bg-emerald-500/10 flex items-center justify-center transition-colors">
                                            <Trophy className="h-6 w-6 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                                        </div>
                                        {league.admin_id === user.id && (
                                            <span className="text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/20">
                                                Admin
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors truncate">
                                        {league.name}
                                    </h3>

                                    <div className="mt-auto pt-4 flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <Users className="h-4 w-4" />
                                            <span>{/* Count members here later if needed */}Squadra attiva</span>
                                        </div>
                                        <div className="text-slate-500 cursor-copy" title="Codice Invito (solo per l'admin o da mostrare)">
                                            {league.join_code}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
