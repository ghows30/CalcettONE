import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Home, Settings, LogOut, PlusSquare } from 'lucide-react'
import { logout } from '@/app/auth/actions'

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
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single()

    const displayName = profile?.full_name || user.email?.split('@')[0] || 'Utente'
    const initials = displayName.substring(0, 2).toUpperCase()

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300">
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-white">
                        <Trophy className="h-6 w-6 text-emerald-400" />
                        Calcett<span className="text-emerald-400">⚽NE</span>
                    </Link>
                </div>

                <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-medium"
                    >
                        <Home className="h-5 w-5" />
                        Dashboard
                    </Link>

                    <div className="pt-6 pb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Le tue Leghe
                    </div>
                    {/* We will map dynamic leagues here later */}
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors font-medium border border-dashed border-slate-700/50"
                    >
                        <PlusSquare className="h-5 w-5" />
                        Nuova Lega
                    </Link>
                </div>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-2 py-2 mb-2">
                        <div className="h-9 w-9 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{displayName}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                    </div>
                    <form>
                        <button
                            formAction={logout}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            Esci
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 relative overflow-auto">
                {/* Ambient background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none"></div>

                <div className="relative z-10 w-full h-full p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
