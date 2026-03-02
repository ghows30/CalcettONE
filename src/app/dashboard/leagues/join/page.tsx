'use client'

import { joinLeague } from '@/app/dashboard/actions'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Key } from 'lucide-react'

export default function JoinLeaguePage() {
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsPending(true)
        setError(null)
        const result = await joinLeague(formData)

        if (result?.error) {
            setError(result.error)
            setIsPending(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-emerald-400 transition-colors mb-4 text-sm font-medium">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Torna alla Dashboard
                </Link>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Unisciti a una Lega</h1>
                <p className="text-slate-400 mt-2">
                    Inserisci il codice di invito fornito dall'amministratore per entrare a far parte della squadra.
                </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <form action={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="join_code" className="block text-sm font-semibold text-slate-300 mb-2">
                            Codice Invito
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Key className="h-5 w-5 text-slate-500" />
                            </div>
                            <input
                                type="text"
                                name="join_code"
                                id="join_code"
                                required
                                className="block w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 py-3.5 text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 transition-all font-medium uppercase tracking-widest text-center"
                                placeholder="ES: AB12CD"
                                maxLength={6}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
                            {error}
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        >
                            {isPending ? 'Verifica in corso...' : 'Entra in campo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
