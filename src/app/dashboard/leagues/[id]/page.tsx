import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Settings, Trophy, Activity, Target, User, LogOut, Medal, Star } from 'lucide-react'
import { leaveLeague } from '@/app/dashboard/actions'

export default async function LeaguePage({
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

    // Fetch league details
    const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', leagueId)
        .single()

    if (leagueError || !league) {
        return redirect('/dashboard')
    }

    const isAdmin = league.admin_id === user.id

    const leaveLeagueWithId = leaveLeague.bind(null, leagueId)

    // Fetch all members with their aggregate stats
    const { data: members, error: membersError } = await supabase
        .from('league_members')
        .select(`
      user_id,
      profiles!inner ( id, full_name, avatar_url )
    `)
        .eq('league_id', leagueId)

    // We need to fetch stats separately and aggregate them since Supabase JS client doesn't directly do complex GROUP BY out-of-the-box easily without a Database View
    const { data: stats } = await supabase
        .from('match_stats')
        .select('player_id, goals, assists, vote, match_id, matches!inner(league_id, status)')
        .eq('matches.league_id', leagueId)
        .eq('matches.status', 'finalized')

    // Aggregate stats in JS
    const leaderboard = (members || []).map(member => {
        // @ts-ignore - profiles is an object due to single joined row per member
        const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles

        const playerStats = (stats || []).filter(s => s.player_id === member.user_id)

        let totalGoals = 0
        let totalAssists = 0
        let totalVotePoints = 0
        let votesCount = 0

        playerStats.forEach(s => {
            totalGoals += s.goals || 0
            totalAssists += s.assists || 0
            if (s.vote) {
                totalVotePoints += Number(s.vote)
                votesCount += 1
            }
        })

        const totalStars = totalVotePoints

        // Formula: Punti = Goal + Assist + Stelle
        const score = totalGoals + totalAssists + totalStars

        return {
            id: member.user_id,
            name: profile?.full_name || 'Utente',
            goals: totalGoals,
            assists: totalAssists,
            stars: totalStars,
            matchesPlayed: playerStats.length,
            score: score
        }
    })

    // Sort by score descending
    leaderboard.sort((a, b) => b.score - a.score)

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-6">
                <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-emerald-400 transition-colors mb-4 text-sm font-medium">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Dashboard
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-extrabold text-white tracking-tight">{league.name}</h1>
                            {isAdmin && (
                                <span className="text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/20">
                                    Amministratore
                                </span>
                            )}
                        </div>
                        <p className="text-slate-400 mt-2 flex items-center gap-2">
                            <span className="bg-white/10 px-2 py-1 rounded text-white text-sm tracking-widest uppercase font-mono border border-white/5">
                                {league.join_code}
                            </span>
                            <span className="text-xs">Codice Invito</span>
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href={`/dashboard/leagues/${leagueId}/matches`}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white font-bold hover:bg-white/10 transition-colors"
                        >
                            <Activity className="h-4 w-4" />
                            Partite
                        </Link>
                        {isAdmin ? (
                            <Link
                                href={`/dashboard/leagues/${leagueId}/admin`}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                            >
                                <Settings className="h-4 w-4" />
                                Gestisci
                            </Link>
                        ) : (
                            <form action={leaveLeagueWithId}>
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 font-bold hover:bg-red-500/10 transition-colors"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Abbandona
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <Trophy className="h-6 w-6 text-orange-400" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400 font-medium">Giocatori</p>
                        <p className="text-2xl font-bold text-white">{members?.length || 0}</p>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Activity className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400 font-medium">Partite Giocate</p>
                        {/* Find unique matches from stats */}
                        <p className="text-2xl font-bold text-white">
                            {new Set((stats || []).map(s => s.match_id)).size}
                        </p>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Target className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400 font-medium">Totale Gol</p>
                        <p className="text-2xl font-bold text-white">
                            {(stats || []).reduce((acc, curr) => acc + (curr.goals || 0), 0)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Leaderboard Table (Desktop) / Cards (Mobile) */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-sm">
                <div className="p-8 border-b border-white/10 bg-black/20 flex items-center justify-between">
                    <h2 className="text-sm md:text-2xl font-black text-white tracking-tight uppercase">Classifica Generale</h2>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{leaderboard.length} Giocatori</span>
                </div>

                {/* Desktop view */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black border-b border-white/10">
                                <th className="p-6 pl-8 w-20 text-center">Pos</th>
                                <th className="p-6">Giocatore</th>
                                <th className="p-6 text-center">Partite</th>
                                <th className="p-6 text-center">G</th>
                                <th className="p-6 text-center">A</th>
                                <th className="p-6 text-center">Stelle</th>
                                <th className="p-6 pr-10 text-right text-emerald-400">Punti</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {leaderboard.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                                        Nessuna statistica disponibile.
                                    </td>
                                </tr>
                            ) : (
                                leaderboard.map((player, index) => {
                                    const playerInitials = player.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()

                                    return (
                                        <tr key={player.id} className="hover:bg-white/5 transition-all duration-300 group">
                                            <td className="p-6 pl-8 text-center">
                                                <div className="relative flex justify-center">
                                                    <span className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl font-black text-lg transition-transform group-hover:scale-110 ${index === 0 ? 'bg-yellow-500/20 text-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.2)]' :
                                                            index === 1 ? 'bg-slate-300/20 text-slate-300' :
                                                                index === 2 ? 'bg-orange-600/20 text-orange-500' :
                                                                    'bg-slate-800/50 text-slate-500 border border-white/5'
                                                        }`}>
                                                        {index + 1}
                                                    </span>
                                                    {index < 3 && (
                                                        <div className="absolute -top-1.5 -right-1.5 shadow-xl">
                                                            <Medal className={`h-5 w-5 ${index === 0 ? 'text-yellow-500' :
                                                                    index === 1 ? 'text-slate-300' :
                                                                        'text-orange-500'
                                                                }`} />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="h-14 w-14 rounded-[1.25rem] bg-slate-800 border border-white/5 text-emerald-400 font-black flex items-center justify-center shrink-0 text-base shadow-inner group-hover:border-emerald-400/30 transition-colors">
                                                        {playerInitials}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-white group-hover:text-emerald-400 transition-colors text-xl tracking-tighter uppercase whitespace-nowrap">
                                                            {player.name}
                                                        </span>
                                                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                                                            {player.matchesPlayed} Partite Giocate
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <span className="text-xl font-black text-slate-400 tabular-nums">{player.matchesPlayed}</span>
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xl font-black text-white tabular-nums group-hover:text-emerald-400 transition-colors">{player.goals}</span>
                                                    <span className="text-[9px] font-black uppercase text-slate-600 tracking-tighter">Gol</span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xl font-black text-white tabular-nums group-hover:text-emerald-400 transition-colors">{player.assists}</span>
                                                    <span className="text-[9px] font-black uppercase text-slate-600 tracking-tighter">Assist</span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xl font-black text-white tabular-nums group-hover:text-emerald-400 transition-colors">{player.stars.toFixed(0)}</span>
                                                    <span className="text-[9px] font-black uppercase text-slate-600 tracking-tighter">Stelle</span>
                                                </div>
                                            </td>
                                            <td className="p-6 pr-10 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] tabular-nums">{player.score.toFixed(0)}</span>
                                                    <span className="text-[9px] font-black uppercase text-emerald-500/40 tracking-[0.2em]">Totale Punteggio</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile view (Card-based) */}
                <div className="md:hidden divide-y divide-white/5">
                    {leaderboard.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                            Nessuna statistica disponibile.
                        </div>
                    ) : (
                        leaderboard.map((player, index) => {
                            const playerInitials = player.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()

                            return (
                                <div key={player.id} className="p-6 space-y-6 active:bg-white/5 transition-colors">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className={`flex items-center justify-center w-12 h-12 rounded-2xl font-black text-lg ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                                        index === 1 ? 'bg-slate-300/20 text-slate-300' :
                                                            index === 2 ? 'bg-orange-600/20 text-orange-500' :
                                                                'bg-slate-800/50 text-slate-500 border border-white/5'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                {index < 3 && (
                                                    <div className="absolute -top-1 -right-1">
                                                        <Medal className={`h-4 w-4 ${index === 0 ? 'text-yellow-500' :
                                                                index === 1 ? 'text-slate-300' :
                                                                    'text-orange-500'
                                                            }`} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <h3 className="text-lg font-black text-white uppercase tracking-tighter">{player.name}</h3>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mt-1">
                                                    {player.matchesPlayed} Partite
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-2xl font-black text-emerald-400 tabular-nums">{player.score.toFixed(0)}</span>
                                            <span className="text-[9px] font-black uppercase text-emerald-500/50 tracking-widest">Punti</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-white/2 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center">
                                            <span className="text-sm font-black text-white">{player.goals}</span>
                                            <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Gol</span>
                                        </div>
                                        <div className="bg-white/2 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center">
                                            <span className="text-sm font-black text-white">{player.assists}</span>
                                            <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Assist</span>
                                        </div>
                                        <div className="bg-white/2 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center">
                                            <span className="text-sm font-black text-white">{player.stars.toFixed(0)}</span>
                                            <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Bonus</span>
                                        </div>
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
