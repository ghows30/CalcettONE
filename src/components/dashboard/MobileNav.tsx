'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trophy, Home, PlusSquare, Menu, X, LogOut, User } from 'lucide-react'
import { logout } from '@/app/auth/actions'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface MobileNavProps {
    displayName: string
    email: string
    initials: string
}

export default function MobileNav({ displayName, email, initials }: MobileNavProps) {
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
            <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-900/80">
                <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-white">
                    <Trophy className="h-6 w-6 text-emerald-400" />
                    Calcett<span className="text-emerald-400">⚽NE</span>
                </Link>
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    aria-label="Apri menu"
                >
                    <Menu className="h-6 w-6" />
                </button>
            </header>

            {/* Mobile Sidebar overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 transition-opacity duration-300 md:hidden",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsOpen(false)}
            />

            {/* Mobile Sidebar drawer */}
            <aside
                className={cn(
                    "fixed top-0 left-0 bottom-0 w-[280px] bg-slate-900 border-r border-slate-800 z-[60] flex flex-col transition-transform duration-300 ease-in-out md:hidden",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-xl font-bold text-white">
                        <Trophy className="h-6 w-6 text-emerald-400" />
                        Calcett<span className="text-emerald-400">⚽NE</span>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        aria-label="Chiudi menu"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1 py-8 px-4 space-y-1 overflow-y-auto">
                    <Link
                        href="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 font-semibold mb-6"
                    >
                        <Home className="h-5 w-5" />
                        Dashboard
                    </Link>

                    <div className="pt-2 pb-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                        Le tue Leghe
                    </div>

                    <Link
                        href="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors font-medium border border-dashed border-slate-700/50"
                    >
                        <PlusSquare className="h-5 w-5" />
                        Nuova Lega
                    </Link>

                    <Link
                        href="/dashboard/profile"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors font-medium"
                    >
                        <User className="h-5 w-5" />
                        Mio Profilo
                    </Link>
                </div>

                <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-4 px-2 py-2 mb-6">
                        <div className="h-11 w-11 rounded-2xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 shadow-inner">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-base font-bold text-white truncate">{displayName}</p>
                            <p className="text-xs text-slate-500 truncate">{email}</p>
                        </div>
                    </div>
                    <form>
                        <button
                            formAction={logout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
                        >
                            <LogOut className="h-4 w-4" />
                            Esci dalla sessione
                        </button>
                    </form>
                </div>
            </aside>
        </>
    )
}
