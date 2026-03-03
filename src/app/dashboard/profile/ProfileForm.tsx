'use client'

import { useState } from 'react'
import { updateProfile } from '../actions'
import { User, Save, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface ProfileFormProps {
    initialProfile: {
        first_name: string | null
        last_name: string | null
        full_name: string | null
    }
}

export default function ProfileForm({ initialProfile }: ProfileFormProps) {
    const [isPending, setIsPending] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Fallback split if first/last name are not set yet
    const defaultFirstName = initialProfile.first_name || initialProfile.full_name?.split(' ')[0] || ''
    const defaultLastName = initialProfile.last_name || initialProfile.full_name?.split(' ').slice(1).join(' ') || ''

    async function handleSubmit(formData: FormData) {
        setIsPending(true)
        setMessage(null)

        const result = await updateProfile(formData)

        setIsPending(false)
        if (result?.error) {
            setMessage({ type: 'error', text: result.error })
        } else if (result?.success) {
            setMessage({ type: 'success', text: 'Profilo aggiornato con successo!' })
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-emerald-400 transition-colors mb-4 text-sm font-medium">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Torna alla Dashboard
                </Link>
                <div className="flex items-center gap-3">
                    <User className="h-8 w-8 text-emerald-400" />
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Il Mio Profilo</h1>
                </div>
                <p className="text-slate-400 mt-2 italic text-sm">
                    Aggiorna le tue informazioni personali visualizzate nelle leghe e nelle partite.
                </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>

                <form action={handleSubmit} className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 uppercase tracking-wider ml-1" htmlFor="first_name">
                                Nome
                            </label>
                            <input
                                id="first_name"
                                name="first_name"
                                type="text"
                                defaultValue={defaultFirstName}
                                required
                                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-medium placeholder-slate-600"
                                placeholder="Zinedine"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 uppercase tracking-wider ml-1" htmlFor="last_name">
                                Cognome
                            </label>
                            <input
                                id="last_name"
                                name="last_name"
                                type="text"
                                defaultValue={defaultLastName}
                                required
                                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-medium placeholder-slate-600"
                                placeholder="Zidane"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black uppercase tracking-tighter py-4 px-6 rounded-2xl transition-all shadow-[0_10px_30px_rgba(16,185,129,0.2)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.3)] active:scale-[0.98]"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Salvataggio...
                                </>
                            ) : (
                                <>
                                    <Save className="h-5 w-5" />
                                    Salva Modifiche
                                </>
                            )}
                        </button>
                    </div>

                    {message && (
                        <div className={`mt-6 p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}>
                            {message.type === 'success' ? (
                                <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
                            ) : (
                                <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                            )}
                            <p className="font-bold text-sm tracking-tight">{message.text}</p>
                        </div>
                    )}
                </form>
            </div>

            <div className="mt-8 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 flex gap-4 items-center">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <AlertCircle className="h-5 w-5 text-emerald-500" />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    <span className="text-emerald-400 font-bold block mb-0.5">Nota bene:</span>
                    Cambiando il tuo nome, questo verrà aggiornato in tutte le leghe a cui partecipi, nelle classifiche e nei referti delle partite passate e future.
                </p>
            </div>
        </div>
    )
}
