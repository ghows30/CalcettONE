import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Settings, Trophy, Activity, Target, User } from 'lucide-react'

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
        .select('player_id, goals, assists, vote, match_id, matches!inner(league_id)')
        .eq('matches.league_id', leagueId)

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

        const avgVote = votesCount > 0 ? (totalVotePoints / votesCount).toFixed(1) : '-'

        // Formula per il punteggio totale (Fantacalcetto) - Esempio:
        // (MediaVoto * 3) + (Gol * 3) + (Assist * 1)
        let score = 0
        if (votesCount > 0) {
            score = ((totalVotePoints / votesCount) * 3) + (totalGoals * 3) + (totalAssists * 1)
        }

        return {
            id: member.user_id,
            name: profile?.full_name || 'Utente',
            goals: totalGoals,
            assists: totalAssists,
            avgVote,
            matchesPlayed: playerStats.length,
            score: parseFloat(score.toFixed(1))
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
                        {isAdmin && (
                            <Link
                                href={`/dashboard/leagues/${leagueId}/admin`}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                            >
                                <Settings className="h-4 w-4" />
                                Gestisci Partite
                            </Link>
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

            {/* Leaderboard Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="p-6 border-b border-white/10 bg-black/20">
                    <h2 className="text-xl font-bold text-white">Classifica Generale</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-sm uppercase tracking-wider text-slate-400 font-semibold border-b border-white/10">
                                <th className="p-4 pl-6 w-16 text-center">Pos</th>
                                <th className="p-4">Giocatore</th>
                                <th className="p-4 text-center">P</th>
                                <th className="p-4 text-center">G</th>
                                <th className="p-4 text-center">A</th>
                                <th className="p-4 text-center">Voto</th>
                                <th className="p-4 pr-6 text-right text-emerald-400">Punti</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {leaderboard.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500">
                                        Nessuna statistica disponibile. Inizia a registrare le partite!
                                    </td>
                                </tr>
                            ) : (
                                leaderboard.map((player, index) => (
                                    <tr key={player.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 pl-6 text-center">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                                    index === 1 ? 'bg-slate-300/20 text-slate-300' :
                                                        index === 2 ? 'bg-orange-600/20 text-orange-500' :
                                                            'bg-slate-800 text-slate-400'
                                                }`}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="p-4 font-semibold text-white flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                                                {player.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            {player.name}
                                        </td>
                                        <td className="p-4 text-center text-slate-400">{player.matchesPlayed}</td>
                                        <td className="p-4 text-center font-medium text-slate-300">{player.goals}</td>
                                        <td className="p-4 text-center font-medium text-slate-300">{player.assists}</td>
                                        <td className="p-4 text-center font-medium text-slate-300">{player.avgVote}</td>
                                        <td className="p-4 pr-6 text-right font-bold text-emerald-400 text-lg">{player.score}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
