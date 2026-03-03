'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trophy, Home, PlusSquare, Menu, X, LogOut, User, Settings, Medal, Star } from 'lucide-react'
import { logout } from '@/app/auth/actions'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { LeagueRanking } from '@/utils/leagues'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface MobileNavProps {
    displayName: string
    email: string
    initials: string
    leagues: LeagueRanking[]
}

export default function MobileNav({ displayName, email, initials, leagues }: MobileNavProps) {
    const [isOpen, setIsOpen] = useState(false)

    // Prevent scrolling when the menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    return (
        <>
            {/* Mobile Header */}
            <header className="md:hidden h-16 bg-[#020617]/80 border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-40 w-full backdrop-blur-2xl">
                <Link href="/dashboard" className="flex items-center gap-2.5 text-xl font-black text-white group active:scale-95 transition-transform">
                    <Trophy className="h-6 w-6 text-emerald-400 group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                    <span className="tracking-tighter uppercase text-sm">Calcett<span className="text-emerald-400">⚽NE</span></span>
                </Link>
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-white bg-white/5 active:scale-90 transition-all border border-white/5"
                    aria-label="Apri menu"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </header>

            {/* Mobile Sidebar overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 transition-all duration-500 md:hidden",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsOpen(false)}
            />

            {/* Mobile Sidebar drawer */}
            <aside
                className={cn(
                    "fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-[#020617]/95 border-r border-white/10 z-[60] flex flex-col transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) md:hidden backdrop-blur-3xl shadow-[20px_0_50px_rgba(0,0,0,0.5)]",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 bg-white/2">
                    <div className="flex items-center gap-2.5 text-xl font-black text-white">
                        <Trophy className="h-6 w-6 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                        <span className="tracking-tighter uppercase text-sm">Calcett<span className="text-emerald-400">⚽NE</span></span>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-white bg-white/5 active:scale-90 transition-all border border-white/5"
                        aria-label="Chiudi menu"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 py-10 px-4 space-y-10 overflow-y-auto custom-scrollbar">
                    <Link
                        href="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-5 py-4 rounded-[1.5rem] bg-emerald-500/10 text-emerald-400 font-black uppercase tracking-widest text-xs border border-emerald-500/20 shadow-[0_5px_15px_rgba(16,185,129,0.1)] active:scale-95 transition-transform"
                    >
                        <Home className="h-5 w-5" />
                        Dashboard
                    </Link>

                    <div className="space-y-6">
                        <div className="px-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center justify-between opacity-60">
                            <span>Le tue Competizioni</span>
                            <Link href="/dashboard/leagues/create" onClick={() => setIsOpen(false)} className="text-emerald-500 p-1">
                                <PlusSquare className="h-4 w-4" />
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {leagues.length === 0 ? (
                                <div className="px-6 py-10 rounded-[2rem] border border-dashed border-white/10 text-center bg-white/2 mx-2">
                                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                                        Nessuna lega attiva.
                                    </p>
                                </div>
                            ) : (
                                leagues.map((league) => (
                                    <Link
                                        key={league.id}
                                        href={`/dashboard/leagues/${league.id}`}
                                        onClick={() => setIsOpen(false)}
                                        className="flex flex-col gap-2 px-6 py-5 rounded-[2rem] bg-white/[0.03] border border-white/5 mx-1 active:scale-[0.96] transition-all shadow-sm active:bg-white/5"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[15px] font-black text-white truncate max-w-[140px] tracking-tight">
                                                {league.name}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[10px] font-black bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 shadow-inner">
                                                <Medal className="h-3 w-3" />
                                                #{league.rank}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-2 pt-2.5 border-t border-white/5">
                                            <div className="flex items-center gap-2 opacity-50">
                                                <Star className="h-3.5 w-3.5 text-emerald-400" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Punti totali</span>
                                            </div>
                                            <span className="text-sm font-black text-white tabular-nums">{league.score}</span>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-white/5 bg-white/2 backdrop-blur-xl">
                    <div className="flex items-center gap-4 px-3 py-3 mb-8 rounded-[2rem] bg-white/5 border border-white/5 shadow-inner">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0 shadow-inner border border-emerald-500/10 text-lg">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-black text-white truncate leading-tight tracking-tight">{displayName}</p>
                            <p className="text-[10px] text-slate-500 truncate font-bold uppercase tracking-tighter mt-0.5">{email.split('@')[0]}</p>
                        </div>
                        <Link
                            href="/dashboard/profile"
                            onClick={() => setIsOpen(false)}
                            className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-all active:scale-90 border border-white/5"
                        >
                            <Settings className="h-5 w-5" />
                        </Link>
                    </div>
                    <form>
                        <button
                            formAction={logout}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 active:text-red-400 active:bg-red-500/10 transition-all border border-transparent active:border-red-500/20"
                        >
                            <LogOut className="h-4 w-4" />
                            Esci
                        </button>
                    </form>
                </div>
            </aside>
        </>
    )
}
