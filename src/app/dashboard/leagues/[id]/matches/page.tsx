import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, User, Activity, CheckCircle2, Play, Trophy, Trash2 } from 'lucide-react'
import { joinMatch, updateMatchStatus, finalizeMatch, deleteMatch } from '../admin/actions'
import StatRow from './StatRow'
import DeleteMatchButton from './DeleteMatchButton'

export default async function MatchesPage({
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
    const { data: league } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', leagueId)
        .single()

    if (!league) {
        return redirect('/dashboard')
    }

    const isAdmin = league.admin_id === user.id

    // Fetch matches with stats and votes
    const { data: matches } = await supabase
        .from('matches')
        .select(`
            *,
            match_stats (*),
            match_votes (candidate_id, rating)
        `)
        .eq('league_id', leagueId)
        .order('match_date', { ascending: false })

    // Fetch member profiles for display names
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')

    const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]))

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="mb-8">
                <Link href={`/dashboard/leagues/${leagueId}`} className="inline-flex items-center text-slate-400 hover:text-emerald-400 transition-colors mb-4 text-sm font-medium">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Torna alla Lega
                </Link>
                <div className="flex items-center gap-3">
                    <Activity className="h-8 w-8 text-emerald-400" />
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Storico Partite</h1>
                </div>
                <p className="text-slate-400 mt-2 italic text-sm">
                    Unisciti alle prossime partite, inserisci i tuoi dati e vota i compagni.
                </p>
            </div>

            <div className="space-y-8">
                {(!matches || matches.length === 0) ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-slate-500 font-medium">
                        Nessuna partita registrata in questa lega.
                    </div>
                ) : (
                    matches.map((match) => {
                        const isJoined = match.match_stats.some((s: any) => s.player_id === user.id)
                        const joinMatchWithId = joinMatch.bind(null, leagueId, match.id)
                        const openVoting = updateMatchStatus.bind(null, leagueId, match.id, 'voting')
                        const finalize = finalizeMatch.bind(null, leagueId, match.id)

                        return (
                            <div key={match.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
                                <div className="p-5 bg-black/30 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 text-slate-200">
                                        <div className="flex items-center gap-2 font-bold text-lg">
                                            <Calendar className="h-5 w-5 text-emerald-400" />
                                            {new Date(match.match_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${match.status === 'scheduled' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            match.status === 'voting' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            }`}>
                                            {match.status}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        {/* User Join Action */}
                                        {((match.status === 'scheduled' || match.status === 'voting') && !isJoined) && (
                                            <form action={joinMatchWithId}>
                                                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-sm font-bold hover:bg-emerald-400 transition-all border border-emerald-500/10">
                                                    <User className="h-4 w-4" />
                                                    Parteciperò
                                                </button>
                                            </form>
                                        )}
                                        {isJoined && (
                                            <span className="text-emerald-400 flex items-center gap-2 font-bold text-sm bg-emerald-400/5 px-3 py-1.5 rounded-lg border border-emerald-400/10">
                                                <CheckCircle2 className="h-4 w-4" />
                                                Sei iscritto
                                            </span>
                                        )}

                                        {/* Admin Actions */}
                                        {isAdmin && (
                                            <div className="flex items-center gap-2">
                                                <DeleteMatchButton leagueId={leagueId} matchId={match.id} />
                                                {match.status === 'scheduled' && (
                                                    <form action={openVoting}>
                                                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-slate-950 text-sm font-bold hover:bg-orange-400 transition-all shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                                                            <Play className="h-4 w-4" />
                                                            Apri Votazioni
                                                        </button>
                                                    </form>
                                                )}
                                                {match.status === 'voting' && (
                                                    <form action={finalize}>
                                                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-sm font-bold hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                                            <Trophy className="h-4 w-4" />
                                                            Chiudi Votazioni
                                                        </button>
                                                    </form>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Desktop View (Table) */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white/5 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-white/10">
                                                <th className="p-4 pl-8">Giocatore</th>
                                                <th className="p-4 text-center">G</th>
                                                <th className="p-4 text-center">A</th>
                                                <th className="p-4 text-center">Voto</th>
                                                <th className="p-4 pr-8 text-right">Azioni</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {match.match_stats.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">
                                                        Nessun partecipante ancora.
                                                    </td>
                                                </tr>
                                            ) : (
                                                (() => {
                                                    const starCounts = new Map<string, number>()
                                                    match.match_votes.forEach((v: any) => {
                                                        starCounts.set(v.candidate_id, (starCounts.get(v.candidate_id) || 0) + 1)
                                                    })

                                                    const maxStars = Math.max(0, ...Array.from(starCounts.values()))
                                                    const momIds = maxStars > 0
                                                        ? Array.from(starCounts.entries())
                                                            .filter(([_, count]) => count === maxStars)
                                                            .map(([id]) => id)
                                                        : []

                                                    const currentUserStat = match.match_stats.find((s: any) => s.player_id === user.id)
                                                    const isCurrentUserLocked = currentUserStat?.is_confirmed || false

                                                    return match.match_stats.map((stat: any) => {
                                                        const liveStars = starCounts.get(stat.player_id) || 0
                                                        const hasVoted = match.match_votes.some((v: any) => v.voter_id === user.id && v.candidate_id === stat.player_id)
                                                        const isMOM = match.status === 'finalized'
                                                            ? stat.vote === Math.max(...match.match_stats.map((s: any) => s.vote || 0)) && stat.vote > 0
                                                            : momIds.includes(stat.player_id)

                                                        return (
                                                            <StatRow
                                                                key={stat.id}
                                                                stat={stat}
                                                                liveAvg={liveStars.toString()}
                                                                playerName={profileMap.get(stat.player_id) || 'Utente'}
                                                                isCurrentUser={stat.player_id === user.id}
                                                                matchStatus={match.status}
                                                                leagueId={leagueId}
                                                                matchId={match.id}
                                                                hasVotedForThisPlayer={hasVoted}
                                                                isMOM={isMOM}
                                                                currentUserLocked={isCurrentUserLocked}
                                                            />
                                                        )
                                                    })
                                                })()
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile View (Cards) */}
                                <div className="md:hidden divide-y divide-white/5">
                                    {match.match_stats.length === 0 ? (
                                        <div className="p-8 text-center text-slate-500 text-sm">
                                            Nessun partecipante ancora.
                                        </div>
                                    ) : (
                                        (() => {
                                            const starCounts = new Map<string, number>()
                                            match.match_votes.forEach((v: any) => {
                                                starCounts.set(v.candidate_id, (starCounts.get(v.candidate_id) || 0) + 1)
                                            })

                                            const maxStars = Math.max(0, ...Array.from(starCounts.values()))
                                            const momIds = maxStars > 0
                                                ? Array.from(starCounts.entries())
                                                    .filter(([_, count]) => count === maxStars)
                                                    .map(([id]) => id)
                                                : []

                                            const currentUserStat = match.match_stats.find((s: any) => s.player_id === user.id)
                                            const isCurrentUserLocked = currentUserStat?.is_confirmed || false

                                            return match.match_stats.map((stat: any) => {
                                                const liveStars = starCounts.get(stat.player_id) || 0
                                                const hasVoted = match.match_votes.some((v: any) => v.voter_id === user.id && v.candidate_id === stat.player_id)
                                                const isMOM = match.status === 'finalized'
                                                    ? stat.vote === Math.max(...match.match_stats.map((s: any) => s.vote || 0)) && stat.vote > 0
                                                    : momIds.includes(stat.player_id)

                                                return (
                                                    <div key={stat.id} className="p-5 flex flex-col gap-5">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-emerald-400 text-xs border border-white/5 uppercase">
                                                                    {profileMap.get(stat.player_id)?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '??'}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-white uppercase text-sm tracking-tight">{profileMap.get(stat.player_id) || 'Utente'}</span>
                                                                    {isMOM && (
                                                                        <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest flex items-center gap-1">
                                                                            <Trophy className="h-2.5 w-2.5" /> MOM
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex flex-col items-center bg-white/5 rounded-lg px-2.5 py-1.5 min-w-[36px] border border-white/5">
                                                                    <span className="text-xs font-black text-white">{stat.goals || 0}</span>
                                                                    <span className="text-[8px] font-black uppercase text-slate-500">G</span>
                                                                </div>
                                                                <div className="flex flex-col items-center bg-white/5 rounded-lg px-2.5 py-1.5 min-w-[36px] border border-white/5">
                                                                    <span className="text-xs font-black text-white">{stat.assists || 0}</span>
                                                                    <span className="text-[8px] font-black uppercase text-slate-500">A</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Actions Area */}
                                                        <div className="pt-4 border-t border-white/5">
                                                            <StatRow
                                                                stat={stat}
                                                                liveAvg={liveStars.toString()}
                                                                playerName={profileMap.get(stat.player_id) || 'Utente'}
                                                                isCurrentUser={stat.player_id === user.id}
                                                                matchStatus={match.status}
                                                                leagueId={leagueId}
                                                                matchId={match.id}
                                                                hasVotedForThisPlayer={hasVoted}
                                                                isMOM={isMOM}
                                                                currentUserLocked={isCurrentUserLocked}
                                                                isMobileCompact={true}
                                                            />
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        })()
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
