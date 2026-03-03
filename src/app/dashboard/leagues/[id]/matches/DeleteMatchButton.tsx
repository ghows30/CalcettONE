'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteMatch } from '../admin/actions'

interface DeleteMatchButtonProps {
    leagueId: string
    matchId: string
}

export default function DeleteMatchButton({ leagueId, matchId }: DeleteMatchButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    async function handleDelete() {
        if (!confirm('Sei sicuro di voler eliminare questa partita? Tutti i dati (goal, assist, voti) andranno persi permanentemente.')) {
            return
        }

        setIsDeleting(true)
        try {
            await deleteMatch(leagueId, matchId)
        } catch (error) {
            alert('Errore: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'))
            setIsDeleting(false)
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
            title="Elimina partita"
        >
            {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Trash2 className="h-4 w-4" />
            )}
        </button>
    )
}
