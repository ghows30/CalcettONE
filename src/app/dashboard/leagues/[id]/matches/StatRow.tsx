'use client'

import { useState } from 'react'
import { Save, Star, Loader2, Check, Plus, Minus, Lock, Send } from 'lucide-react'
import { updateSelfStats, submitVote } from '../admin/actions'

interface StatRowProps {
    stat: any
    liveAvg: string | null // This will now represent live star count
    playerName: string
    isCurrentUser: boolean
    matchStatus: 'scheduled' | 'voting' | 'finalized'
    leagueId: string
    matchId: string
    hasVotedForThisPlayer: boolean
    isMOM: boolean
    currentUserLocked: boolean
    isMobileCompact?: boolean
}

export default function StatRow({
    stat,
    liveAvg,
    playerName,
    isCurrentUser,
    matchStatus,
    leagueId,
    matchId,
    hasVotedForThisPlayer,
    isMOM,
    currentUserLocked,
    isMobileCompact = false
}: StatRowProps) {
    const [isPending, setIsPending] = useState(false)
    const [goals, setGoals] = useState(stat.goals)
    const [assists, setAssists] = useState(stat.assists)

    async function handleConfirmFinal() {
        if (!confirm('ATTENZIONE: Una volta confermate le tue scelte non potrai più cambiarle (inclusi i voti ai compagni). Confermi?')) {
            return
        }
        setIsPending(true)
        try {
            await updateSelfStats(leagueId, matchId, goals, assists)
        } catch (error) {
            alert('Errore: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'))
        } finally {
            setIsPending(false)
        }
    }

    async function handleVote() {
        if (isCurrentUser || currentUserLocked || matchStatus !== 'voting') return
        setIsPending(true)
        try {
            await submitVote(leagueId, matchId, stat.player_id)
        } catch (error) {
            alert('Errore: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'))
        } finally {
            setIsPending(false)
        }
    }

    const currentStars = matchStatus === 'finalized' ? stat.vote : (liveAvg || 0)
    const isEditingEnabled = matchStatus === 'voting' && isCurrentUser && !stat.is_confirmed

    if (isMobileCompact) {
        return (
            <div className="space-y-6">
                {isEditingEnabled && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col items-center gap-3">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Gol Segnati</span>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setGoals(Math.max(0, goals - 1))}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 active:scale-90 transition-transform"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <span className="text-xl font-black text-white w-6 text-center">{goals}</span>
                                <button
                                    onClick={() => setGoals(goals + 1)}
                                    className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 active:scale-90 transition-transform"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col items-center gap-3">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Assist Serviti</span>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setAssists(Math.max(0, assists - 1))}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 active:scale-90 transition-transform"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <span className="text-xl font-black text-white w-6 text-center">{assists}</span>
                                <button
                                    onClick={() => setAssists(assists + 1)}
                                    className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 active:scale-90 transition-transform"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                            {matchStatus === 'finalized' ? 'Voto Finale' : 'Stelle Ricevute'}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className={`text-lg font-black ${currentStars > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>{currentStars}</span>
                            <Star className={`h-4 w-4 ${currentStars > 0 ? 'text-emerald-400 fill-current' : 'text-slate-600'}`} />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isEditingEnabled && (
                            <button
                                onClick={handleConfirmFinal}
                                disabled={isPending}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all disabled:opacity-50 text-[11px] font-black uppercase tracking-tight shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                            >
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                Salva e Invia
                            </button>
                        )}

                        {matchStatus === 'voting' && !isCurrentUser && (
                            <button
                                onClick={handleVote}
                                disabled={isPending || currentUserLocked}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all disabled:opacity-50 text-[10px] font-black uppercase tracking-tight ${hasVotedForThisPlayer
                                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                    : currentUserLocked
                                        ? 'bg-white/5 text-slate-600'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                {isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Star className={`h-4 w-4 ${hasVotedForThisPlayer ? 'fill-current' : ''}`} />
                                )}
                                {hasVotedForThisPlayer ? 'Votato' : 'Vota'}
                            </button>
                        )}

                        {matchStatus === 'finalized' && (
                            <div className="flex items-center gap-2 text-emerald-500/50 bg-emerald-500/5 px-3 py-1.5 rounded-lg border border-emerald-500/10 uppercase text-[10px] font-black">
                                <Check className="h-4 w-4" /> Finalizzato
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <tr className={`border-b border-white/5 transition-colors ${isCurrentUser ? 'bg-white/5' : ''} ${isMOM && matchStatus === 'finalized' ? 'bg-emerald-500/5' : ''}`}>
            <td className="p-4 pl-8">
                <div className="font-bold text-white flex items-center gap-2">
                    {playerName}
                    {isCurrentUser && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase">Tu</span>}
                    {stat.is_confirmed && matchStatus === 'voting' && (
                        <div className="flex items-center gap-1 bg-white/5 text-slate-500 px-1.5 py-0.5 rounded text-[9px] font-black uppercase border border-white/10" title="Scelte confermate e bloccate">
                            <Lock className="h-2.5 w-2.5" />
                            Inviato
                        </div>
                    )}
                    {isMOM && matchStatus === 'finalized' && (
                        <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-[10px] font-black tracking-tighter uppercase border border-yellow-500/20">
                            <Star className="h-3 w-3 fill-current" />
                            MOM
                        </div>
                    )}
                </div>
            </td>

            <td className="p-4 text-center">
                {isEditingEnabled ? (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => setGoals(Math.max(0, goals - 1))}
                            className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-400"
                        >
                            <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-white font-bold">{goals}</span>
                        <button
                            onClick={() => setGoals(goals + 1)}
                            className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                        >
                            <Plus className="h-3 w-3" />
                        </button>
                    </div>
                ) : (
                    <span className="text-slate-300 font-medium">{stat.goals}</span>
                )}
            </td>

            <td className="p-4 text-center">
                {isEditingEnabled ? (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => setAssists(Math.max(0, assists - 1))}
                            className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-400"
                        >
                            <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-white font-bold">{assists}</span>
                        <button
                            onClick={() => setAssists(assists + 1)}
                            className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                        >
                            <Plus className="h-3 w-3" />
                        </button>
                    </div>
                ) : (
                    <span className="text-slate-300 font-medium">{stat.assists}</span>
                )}
            </td>

            <td
                className={`p-4 text-center transition-all ${!isCurrentUser && !currentUserLocked && matchStatus === 'voting'
                    ? 'cursor-pointer hover:bg-white/10 group'
                    : ''
                    }`}
                onClick={handleVote}
                title={!isCurrentUser && !currentUserLocked && matchStatus === 'voting' ? (hasVotedForThisPlayer ? "Rimuovi stella" : "Dai una stella") : ""}
            >
                <div className="flex items-center justify-center gap-1">
                    <span className={`font-black transition-colors ${currentStars > 0 ? 'text-emerald-400' : 'text-slate-500'
                        } ${!isCurrentUser && !currentUserLocked && matchStatus === 'voting' ? 'group-hover:text-emerald-300' : ''}`}>
                        {currentStars}
                    </span>
                    <Star className={`h-3 w-3 transition-all ${currentStars > 0 ? 'text-emerald-400 fill-current' : 'text-slate-500'
                        } ${!isCurrentUser && !currentUserLocked && matchStatus === 'voting' ? 'group-hover:scale-125 group-hover:text-emerald-300' : ''}`} />
                </div>
            </td>

            <td className="p-4 text-right pr-8">
                <div className="flex items-center justify-end gap-2">
                    {isEditingEnabled && (
                        <button
                            onClick={handleConfirmFinal}
                            disabled={isPending}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all disabled:opacity-50 text-[11px] font-black uppercase tracking-tight shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:scale-105 active:scale-95"
                            title="Conferma definitivamente"
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Invia Risultati
                        </button>
                    )}

                    {matchStatus === 'voting' && !isCurrentUser && (
                        <button
                            onClick={handleVote}
                            disabled={isPending || currentUserLocked}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 text-[10px] font-black uppercase tracking-tight ${hasVotedForThisPlayer
                                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                : currentUserLocked
                                    ? 'bg-white/5 text-slate-600'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            {isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Star className={`h-3.5 w-3.5 ${hasVotedForThisPlayer ? 'fill-current' : ''}`} />
                            )}
                            {hasVotedForThisPlayer ? 'Votato' : 'Vota'}
                        </button>
                    )}

                    {matchStatus === 'finalized' && (
                        <Check className="h-4 w-4 text-emerald-500/50 mr-2" />
                    )}
                </div>
            </td>
        </tr>
    )
}
