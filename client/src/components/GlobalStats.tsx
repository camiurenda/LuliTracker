import { useEffect, useState } from 'react'
import { Clock, Calendar, FolderOpen, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface GlobalStatsData {
    totalMinutes: number
    todayMinutes: number
    monthMinutes: number
    totalProjects: number
    totalEntries: number
    recentEntries: {
        project_name: string
        project_color: string
        action_type: string
        duration_minutes: number
        entry_date: string
    }[]
}

export default function GlobalStats() {
    const [stats, setStats] = useState<GlobalStatsData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const today = new Date().toISOString().split('T')[0]
            const currentMonth = today.substring(0, 7) // "2026-02"

            // Fetch projects count
            const { data: projects, error: projectsError } = await supabase
                .from('projects')
                .select('id, name, color')

            if (projectsError) throw projectsError

            // Fetch all time entries with project info
            const { data: entries, error: entriesError } = await supabase
                .from('time_entries')
                .select(`
                    duration_minutes,
                    entry_date,
                    action_type,
                    project_id,
                    projects (name, color)
                `)
                .order('created_at', { ascending: false })

            if (entriesError) throw entriesError

            const totalMinutes = entries?.reduce((sum, e) => sum + e.duration_minutes, 0) || 0
            const todayMinutes = entries
                ?.filter(e => e.entry_date === today)
                .reduce((sum, e) => sum + (e.duration_minutes || 0), 0) || 0
            const monthMinutes = entries
                ?.filter(e => e.entry_date && e.entry_date.startsWith(currentMonth))
                .reduce((sum, e) => sum + (e.duration_minutes || 0), 0) || 0

            // Get recent entries (last 5)
            const recentEntries = (entries || []).slice(0, 5).map(e => ({
                project_name: (e.projects as any)?.name || 'Sin proyecto',
                project_color: (e.projects as any)?.color || '#6366f1',
                action_type: e.action_type,
                duration_minutes: e.duration_minutes,
                entry_date: e.entry_date
            }))

            setStats({
                totalMinutes,
                todayMinutes,
                monthMinutes,
                totalProjects: projects?.length || 0,
                totalEntries: entries?.length || 0,
                recentEntries
            })

        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDuration = (totalMinutes: number) => {
        const h = Math.floor(totalMinutes / 60)
        const m = totalMinutes % 60
        if (h === 0) return `${m} min`
        if (m === 0) return `${h}h`
        return `${h}h ${m}m`
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T12:00:00')
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (dateStr === today.toISOString().split('T')[0]) return 'Hoy'
        if (dateStr === yesterday.toISOString().split('T')[0]) return 'Ayer'
        return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
    }

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    </div>
                ))}
            </div>
        )
    }

    if (!stats) return null

    return (
        <div className="mb-8 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. Proyectos */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <FolderOpen size={18} className="text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-600">Proyectos</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{stats.totalProjects}</h3>
                </div>

                {/* 2. Horas de hoy */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Calendar size={18} />
                        </div>
                        <span className="text-sm font-medium opacity-90">Horas de hoy</span>
                    </div>
                    <h3 className="text-2xl font-bold">{formatDuration(stats.todayMinutes)}</h3>
                </div>

                {/* 3. Horas del mes */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <Clock size={18} className="text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-600">Horas del mes</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{formatDuration(stats.monthMinutes)}</h3>
                </div>

                {/* 4. Registros */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <TrendingUp size={18} className="text-orange-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-600">Registros</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{stats.totalEntries}</h3>
                </div>
            </div>

            {/* Recent Activity */}
            {stats.recentEntries.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800">Actividad Reciente</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {stats.recentEntries.map((entry, idx) => (
                            <div key={idx} className="px-5 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: entry.project_color }}
                                    />
                                    <div>
                                        <span className="text-sm font-medium text-gray-800">{entry.action_type}</span>
                                        <span className="text-gray-400 mx-2">•</span>
                                        <span className="text-sm text-gray-500">{entry.project_name}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-medium text-indigo-600">{formatDuration(entry.duration_minutes)}</span>
                                    <span className="text-xs text-gray-400">{formatDate(entry.entry_date)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
