import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Home, LogOut, PlusSquare, User, Settings, Medal, Star } from 'lucide-react'
import { logout } from '@/app/auth/actions'
import MobileNav from '@/components/dashboard/MobileNav'
import { getUserLeaguesRankings } from '@/utils/leagues'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, first_name, last_name, avatar_url')
        .eq('id', user.id)
        .single()

    const leagueRankings = await getUserLeaguesRankings()

    const displayName = profile?.full_name || user.email?.split('@')[0] || 'Utente'
    const initials = profile?.first_name && profile?.last_name
        ? (profile.first_name[0] + profile.last_name[0]).toUpperCase()
        : displayName.substring(0, 2).toUpperCase()

    return (
        <div className="flex flex-col md:flex-row h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans selection:bg-emerald-500/30">
            {/* Mobile Navigation */}
            <MobileNav
                displayName={displayName}
                email={user.email || ''}
                initials={initials}
                leagues={leagueRankings}
            />

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-72 bg-slate-900/40 border-r border-white/5 flex-col transition-all duration-300 shrink-0 backdrop-blur-xl">
                <div className="h-20 flex items-center px-8 border-b border-white/5">
                    <Link href="/dashboard" className="flex items-center gap-2.5 text-2xl font-black text-white group">
                        <Trophy className="h-7 w-7 text-emerald-400 group-hover:rotate-12 transition-transform duration-300" />
                        <span className="tracking-tighter">Calcett<span className="text-emerald-400">⚽NE</span></span>
                    </Link>
                </div>

                <div className="flex-1 py-8 px-4 space-y-8 overflow-y-auto custom-scrollbar">
                    <div className="space-y-1">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold transition-all border border-emerald-500/10 hover:border-emerald-500/20"
                        >
                            <Home className="h-5 w-5" />
                            Dashboard
                        </Link>
                    </div>

                    <div className="space-y-4">
                        <div className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center justify-between">
                            <span>Le tue Leghe</span>
                            <Link href="/dashboard/leagues/create" className="text-emerald-500 hover:text-emerald-400 transition-colors">
                                <PlusSquare className="h-4 w-4" />
                            </Link>
                        </div>

                        <div className="space-y-2">
                            {leagueRankings.length === 0 ? (
                                <div className="px-4 py-8 rounded-xl border border-dashed border-white/5 text-center bg-white/2">
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        Non sei ancora in una lega. Unisciti a una!
                                    </p>
                                </div>
                            ) : (
                                leagueRankings.map((league) => (
                                    <Link
                                        key={league.id}
                                        href={`/dashboard/leagues/${league.id}`}
                                        className="group flex flex-col gap-1.5 px-4 py-4 rounded-2xl bg-white/2 hover:bg-white/5 border border-white/5 hover:border-emerald-500/20 transition-all active:scale-[0.98]"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-300 group-hover:text-emerald-400 transition-colors truncate pr-2">
                                                {league.name}
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] font-black bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-500/20 shadow-sm shrink-0">
                                                <Medal className="h-2.5 w-2.5" />
                                                #{league.rank}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-white/5">
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <Star className="h-3 w-3 text-emerald-400/30" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Punteggio</span>
                                            </div>
                                            <span className="text-[10px] font-black text-emerald-400">{league.score}</span>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-slate-900/50">
                    <div className="flex items-center gap-4 px-2 py-3 mb-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-400 font-black flex items-center justify-center shrink-0 shadow-inner text-base">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate leading-tight">{displayName}</p>
                            <p className="text-[10px] text-slate-500 truncate font-medium">{user.email}</p>
                        </div>
                        <Link
                            href="/dashboard/profile"
                            className="p-2 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-all hover:rotate-90 duration-300"
                        >
                            <Settings className="h-5 w-5" />
                        </Link>
                    </div>
                    <form>
                        <button
                            formAction={logout}
                            className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-tighter text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                        >
                            <LogOut className="h-4 w-4" />
                            Esci dalla sessione
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 relative overflow-auto custom-scrollbar bg-[#020617]">
                {/* Ambient background glows */}
                <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10 w-full min-h-full p-6 md:p-12 lg:p-16">
                    {children}
                </div>
            </main>
        </div>
    )
}
