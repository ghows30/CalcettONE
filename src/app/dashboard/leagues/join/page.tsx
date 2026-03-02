'use client'

import { joinLeague } from '@/app/dashboard/actions'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Key } from 'lucide-react'

export default function JoinLeaguePage() {
    const [joinCode, setJoinCode] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    async function handleJoin() {
        if (!joinCode.trim()) return

        setIsPending(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('join_code', joinCode)

            const res = await joinLeague(formData)

            if (res?.error) {
                setError(res.error)
            }
        } catch (e: any) {
            console.error('CLIENT: Errore connessione:', e)
            setError('Errore di connessione. Riprova.')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8 p-4">
                <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-emerald-400 transition-colors mb-4 text-sm font-medium">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Torna alla Dashboard
                </Link>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Unisciti a una Lega</h1>
                <p className="text-slate-400 mt-2">
                    Inserisci il codice di invito fornito dall'amministratore per entrare a far parte della squadra.
                </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                {/* Decorative element */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>

                <div className="relative space-y-8">
                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="h-20 w-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                            <Key className="h-10 w-10 text-emerald-400" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label htmlFor="join_code" className="block text-sm font-semibold text-slate-300 mb-3 text-center uppercase tracking-widest">
                                Codice Invito
                            </label>
                            <input
                                type="text"
                                name="join_code"
                                id="join_code"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                className="block w-full rounded-2xl border-2 border-white/5 bg-white/5 px-4 py-5 text-white placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-black uppercase tracking-[0.3em] text-center text-3xl sm:text-4xl shadow-inner"
                                placeholder="AB12CD"
                                maxLength={6}
                                autoFocus
                            />
                        </div>

                        {error && (
                            <div className="rounded-2xl bg-red-500/10 p-5 text-sm text-red-400 border border-red-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                    <span className="font-bold uppercase tracking-tight">Errore:</span>
                                </div>
                                <p className="mt-1 ml-4 text-slate-300">{error}</p>
                            </div>
                        )}

                        <div className="pt-4">
                            <button
                                onClick={handleJoin}
                                disabled={isPending || !joinCode}
                                className="w-full flex justify-center py-5 px-4 rounded-2xl text-lg font-black text-slate-950 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(16,185,129,0.4)]"
                            >
                                {isPending ? (
                                    <span className="flex items-center gap-2">
                                        <div className="h-5 w-5 border-3 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                                        ENTRANDO...
                                    </span>
                                ) : 'UNISCITI ALLA LEGA'}
                            </button>
                        </div>
                    </div>

                    <p className="text-center text-slate-500 text-xs font-medium uppercase tracking-widest opacity-60">
                        Assicurati di avere il codice corretto dal tuo amministratore
                    </p>
                </div>
            </div>
        </div>
    )
}
