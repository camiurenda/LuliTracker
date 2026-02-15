import { useEffect, useState } from 'react'
import { ArrowLeft, Phone, Users, MapPin, Plus, Clock, Trash2, X } from 'lucide-react'
import { timeEntryService } from '../services/timeEntryService'
import type { Project, TimeEntry, ActionType } from '../types'

interface ProjectDetailProps {
    project: Project
    onBack: () => void
}

const QUICK_ACTIONS: { type: ActionType; label: string; icon: React.ReactNode; color: string }[] = [
    { type: 'LLAMADO', label: 'Llamado', icon: <Phone size={20} />, color: 'bg-blue-500 hover:bg-blue-600' },
    { type: 'REUNION', label: 'Reunión', icon: <Users size={20} />, color: 'bg-purple-500 hover:bg-purple-600' },
    { type: 'VISITA', label: 'Visita', icon: <MapPin size={20} />, color: 'bg-green-500 hover:bg-green-600' },
]

export default function ProjectDetail({ project, onBack }: ProjectDetailProps) {
    const [entries, setEntries] = useState<TimeEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<{ totalMinutes: number; byAction: Record<string, number>; entryCount: number } | null>(null)

    // Form state
    const [showForm, setShowForm] = useState(false)
    const [selectedAction, setSelectedAction] = useState<ActionType | null>(null)
    const [customAction, setCustomAction] = useState('')
    const [hours, setHours] = useState('')
    const [minutes, setMinutes] = useState('')
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        loadData()
    }, [project.id])

    const loadData = async () => {
        try {
            const [entriesData, statsData] = await Promise.all([
                timeEntryService.getProjectEntries(project.id),
                timeEntryService.getProjectStats(project.id)
            ])
            setEntries(entriesData)
            setStats(statsData)
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const openForm = (action: ActionType | null) => {
        setSelectedAction(action)
        setCustomAction('')
        setHours('')
        setMinutes('')
        setNotes('')
        setShowForm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        const actionType = selectedAction || customAction.trim().toUpperCase()
        if (!actionType) return

        const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0)
        if (totalMinutes <= 0) {
            alert('Ingresa un tiempo válido')
            return
        }

        setSubmitting(true)
        try {
            const entry = await timeEntryService.logEntry(
                project.id,
                actionType,
                totalMinutes,
                notes || undefined
            )
            setEntries([entry, ...entries])
            setShowForm(false)
            loadData() // Refresh stats
        } catch (error) {
            console.error('Error logging time:', error)
            alert('Error al registrar tiempo')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este registro?')) return
        try {
            await timeEntryService.deleteEntry(id)
            setEntries(entries.filter(e => e.id !== id))
            loadData() // Refresh stats
        } catch (error) {
            console.error('Error deleting entry:', error)
        }
    }

    const formatDuration = (totalMinutes: number) => {
        const h = Math.floor(totalMinutes / 60)
        const m = totalMinutes % 60
        if (h === 0) return `${m}min`
        if (m === 0) return `${h}h`
        return `${h}h ${m}min`
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T12:00:00')
        return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
    }

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Volver a Proyectos</span>
                </button>
                <div className="flex items-center gap-3">
                    <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: project.color }}
                    />
                    <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
                </div>
                {project.description && (
                    <p className="text-gray-500 mt-1 ml-7">{project.description}</p>
                )}
            </div>

            {/* Stats */}
            {stats && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Tiempo Total</p>
                            <p className="text-2xl font-bold text-gray-800">{formatDuration(stats.totalMinutes)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Registros</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.entryCount}</p>
                        </div>
                    </div>
                    {Object.keys(stats.byAction).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                            {Object.entries(stats.byAction).map(([action, mins]) => (
                                <span key={action} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                                    {action}: {formatDuration(mins)}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Registrar Tiempo</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {QUICK_ACTIONS.map((action) => (
                        <button
                            key={action.type}
                            onClick={() => openForm(action.type)}
                            className={`${action.color} text-white font-medium py-4 px-4 rounded-xl transition-all hover:-translate-y-0.5 shadow-md flex flex-col items-center gap-2`}
                        >
                            {action.icon}
                            <span>{action.label}</span>
                        </button>
                    ))}
                    <button
                        onClick={() => openForm(null)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-4 px-4 rounded-xl transition-all hover:-translate-y-0.5 flex flex-col items-center gap-2"
                    >
                        <Plus size={20} />
                        <span>Otro</span>
                    </button>
                </div>
            </div>

            {/* Time Entry Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    {selectedAction ? `Registrar ${selectedAction}` : 'Registrar Tiempo'}
                                </h3>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Custom Action Input */}
                                {!selectedAction && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                                            Tipo de Actividad *
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: CAPACITACION, SOPORTE..."
                                            value={customAction}
                                            onChange={(e) => setCustomAction(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all uppercase"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                )}

                                {/* Duration */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Duración *
                                    </label>
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    min="0"
                                                    value={hours}
                                                    onChange={(e) => setHours(e.target.value)}
                                                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                                    autoFocus={!!selectedAction}
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                                    horas
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    min="0"
                                                    max="59"
                                                    value={minutes}
                                                    onChange={(e) => setMinutes(e.target.value)}
                                                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                                    min
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Comentario <span className="text-gray-400 font-normal">(opcional)</span>
                                    </label>
                                    <textarea
                                        placeholder="Detalles de la actividad..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
                                    />
                                </div>

                                {/* Submit */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Clock size={18} />
                                        Guardar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Entries */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Historial</h2>
                {loading ? (
                    <div className="text-center py-8 text-gray-400">Cargando...</div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <Clock size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No hay registros todavía</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {entries.map((entry) => (
                            <div
                                key={entry.id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-medium text-sm">
                                        {entry.action_type.slice(0, 2)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-800">{entry.action_type}</span>
                                            <span className="text-gray-400">•</span>
                                            <span className="text-indigo-600 font-medium">{formatDuration(entry.duration_minutes)}</span>
                                        </div>
                                        {entry.notes && (
                                            <p className="text-sm text-gray-500 mt-0.5">{entry.notes}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-400">{formatDate(entry.entry_date)}</span>
                                    <button
                                        onClick={() => handleDelete(entry.id)}
                                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
