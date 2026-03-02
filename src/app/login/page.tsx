import { login } from '@/app/auth/actions'
import Link from 'next/link'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string; error: string }>
}) {
    const { message, error } = await searchParams

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 text-slate-200 overflow-hidden relative">
            {/* Ambient glow effect background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="relative w-full max-w-md rounded-3xl bg-white/5 p-8 shadow-2xl backdrop-blur-xl border border-white/10">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Calcett<span className="text-emerald-400">⚽NE</span></h1>
                    <p className="text-slate-400 font-medium">Bentornato sul campo. Accedi per giocare.</p>
                </div>

                <form action={login} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 transition-all font-medium"
                            placeholder="tu@esempio.com"
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold text-slate-300" htmlFor="password">
                                Password
                            </label>
                            <a href="#" className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors">Password dimenticata?</a>
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            minLength={6}
                            className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 transition-all font-medium"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-4 font-bold text-slate-950 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                        >
                            Scendi in campo
                        </button>
                    </div>

                    {message && (
                        <div className="mt-6 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-400 border border-emerald-500/20 flex items-start gap-3">
                            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="font-medium leading-relaxed">{message}</span>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 rounded-xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20 flex items-start gap-3">
                            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="font-medium leading-relaxed">{error}</span>
                        </div>
                    )}
                </form>

                <div className="mt-8 text-center text-sm text-slate-400">
                    Non sei ancora in squadra?{' '}
                    <Link href="/signup" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                        Registrati ora
                    </Link>
                </div>
            </div>
        </div>
    )
}
