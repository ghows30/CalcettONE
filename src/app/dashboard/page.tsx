import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Users, Search, Plus, ArrowRight, Medal, Star } from 'lucide-react'
import { getUserLeaguesRankings } from '@/utils/leagues'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }
    const [leagues, { data: profile }] = await Promise.all([
        getUserLeaguesRankings(),
        supabase
            .from('profiles')
            .select('first_name, full_name')
            .eq('id', user.id)
            .single()
    ])

    const firstName = profile?.first_name || profile?.full_name?.split(' ')[0] || 'Utente'

    return (
        <div className="max-w-6xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-white/5">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                        Ciao, {firstName}
                    </h1>
                    <p className="text-slate-400 font-medium text-lg">
                        Bentornato in campo. Ecco la situazione delle tue leghe.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <Link
                        href="/dashboard/leagues/join"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl border border-white/10 bg-white/5 text-white font-bold hover:bg-white/10 transition-all active:scale-[0.98]"
                    >
                        <Search className="h-5 w-5" />
                        Unisciti a una Lega
                    </Link>
                    <Link
                        href="/dashboard/leagues/create"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-emerald-500 text-slate-950 font-black uppercase tracking-tighter hover:bg-emerald-400 transition-all active:scale-[0.98] shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
                    >
                        <Plus className="h-5 w-5" />
                        Nuova Lega
                    </Link>
                </div>
            </div>

            <div className="space-y-8">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Le Tue Competizioni</h2>
                </div>

                {leagues.length === 0 ? (
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative border border-dashed border-white/10 rounded-[2rem] p-12 md:p-20 text-center bg-slate-900/50 backdrop-blur-xl">
                            <Trophy className="h-16 w-16 text-slate-700 mx-auto mb-6" />
                            <h3 className="text-2xl font-bold text-white mb-3">Ancora nessuna lega?</h3>
                            <p className="text-slate-400 max-w-sm mx-auto mb-10 font-medium leading-relaxed">
                                Il fischio d&apos;inizio è vicino. Crea la tua lega o usa un codice di invito per non restare in panchina.
                            </p>
                            <Link
                                href="/dashboard/leagues/create"
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-500 text-slate-950 font-black uppercase tracking-tighter hover:bg-emerald-400 transition-all shadow-xl"
                            >
                                Inizia ora
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {leagues.map((league) => (
                            <Link href={`/dashboard/leagues/${league.id}`} key={league.id} className="group relative">
                                <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                <div className="relative h-full bg-slate-900/60 border border-white/5 rounded-3xl p-6 md:p-8 hover:bg-slate-900/40 hover:border-emerald-500/30 transition-all duration-300 backdrop-blur-sm flex flex-col min-h-[220px]">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="h-14 w-14 rounded-2xl bg-slate-800 group-hover:bg-emerald-500/10 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                                            <Trophy className="h-7 w-7 text-slate-500 group-hover:text-emerald-400" />
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/20 shadow-inner">
                                                <Medal className="h-3.5 w-3.5" />
                                                #{league.rank}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-black text-white mb-2 group-hover:text-emerald-400 transition-colors truncate">
                                        {league.name}
                                    </h3>

                                    <div className="text-emerald-400/40 font-mono text-xs mb-6 tracking-widest uppercase">
                                        Codice: {league.id.substring(0, 8)}
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Star className="h-4 w-4" />
                                            <span className="text-xs font-bold uppercase tracking-tighter">Punteggio Totale</span>
                                        </div>
                                        <div className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors">
                                            {league.score}
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
