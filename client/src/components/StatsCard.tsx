import { useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { Clock, CheckSquare, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Stats {
    totalHours: number
    totalTasks: number
    completedTasks: number
}

export interface StatsCardRef {
    refresh: () => void
}

const StatsCard = forwardRef<StatsCardRef, object>(function StatsCard(_, ref) {
    const [stats, setStats] = useState<Stats>({ totalHours: 0, totalTasks: 0, completedTasks: 0 })
    const [loading, setLoading] = useState(true)

    useImperativeHandle(ref, () => ({
        refresh: fetchStats
    }))

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            // Fetch Tasks Stats
            const { data: tasks, error: taskError } = await supabase
                .from('tasks')
                .select('status')

            if (taskError) throw taskError

            // Fetch Time Stats
            const { data: logs, error: logError } = await supabase
                .from('time_logs')
                .select('duration')

            if (logError) throw logError

            const totalMinutes = logs?.reduce((acc, log) => acc + log.duration, 0) || 0
            const totalHours = Math.round((totalMinutes / 60) * 10) / 10

            setStats({
                totalHours,
                totalTasks: tasks?.length || 0,
                completedTasks: tasks?.filter(t => t.status === 'completed').length || 0
            })

        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const getMotivationalMessage = (productivity: number): string => {
        if (productivity === 0) return '¡Empezá con una tarea hoy!'
        if (productivity <= 25) return '¡Buen comienzo, seguí así!'
        if (productivity <= 50) return '¡Vas por buen camino!'
        if (productivity <= 75) return '¡Estás on fire!'
        if (productivity < 100) return '¡Casi llegando a la meta!'
        return '¡Sos una máquina de productividad!'
    }

    const productivity = stats.totalTasks > 0
        ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
        : 0

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Hours Card */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Clock size={24} className="text-white" />
                    </div>
                    <span className="font-medium opacity-90">Total Horas</span>
                </div>
                <h3 className="text-4xl font-bold">{loading ? '-' : stats.totalHours}</h3>
                <p className="text-xs mt-2 opacity-75">Tiempo invertido en todos los proyectos</p>
            </div>

            {/* Tasks Progress Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-green-50 rounded-xl">
                        <CheckSquare size={24} className="text-green-600" />
                    </div>
                    <span className="font-medium text-gray-600">Tareas Completadas</span>
                </div>
                <h3 className="text-4xl font-bold text-gray-800">
                    {loading ? '-' : stats.completedTasks}
                    <span className="text-lg text-gray-400 font-normal ml-2">/ {stats.totalTasks}</span>
                </h3>
                <p className="text-xs mt-2 text-gray-400">Progreso general</p>
            </div>

            {/* Productivity Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-orange-50 rounded-xl">
                        <TrendingUp size={24} className="text-orange-600" />
                    </div>
                    <span className="font-medium text-gray-600">Productividad</span>
                </div>
                <h3 className="text-4xl font-bold text-gray-800">
                    {loading ? '-' : `${productivity}%`}
                </h3>
                <p className="text-xs mt-2 text-gray-400">
                    {loading ? '-' : getMotivationalMessage(productivity)}
                </p>
            </div>
        </div>
    )
})

export default StatsCard
