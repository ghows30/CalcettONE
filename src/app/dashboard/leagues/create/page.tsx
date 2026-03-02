'use client'

import { createLeague } from '@/app/dashboard/actions'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trophy } from 'lucide-react'

export default function CreateLeaguePage() {
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsPending(true)
        setError(null)
        const result = await createLeague(formData)

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
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Crea una nuova Lega</h1>
                <p className="text-slate-400 mt-2">
                    Dai un nome alla tua competizione. Una volta creata, riceverai un codice invito da condividere con i tuoi amici.
                </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <form action={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-slate-300 mb-2">
                            Nome della Lega
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Trophy className="h-5 w-5 text-slate-500" />
                            </div>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                required
                                className="block w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 py-3.5 text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 transition-all font-medium"
                                placeholder="Es: Fantacalcetto del Giovedì"
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
                            {isPending ? 'Creazione in corso...' : 'Crea Lega'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
