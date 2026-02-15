import { useEffect, useState, useRef } from 'react'
import { Plus, Trash2, CheckCircle, Circle, Clock } from 'lucide-react'
import { taskService } from '../services/taskService'
import { timeLogService } from '../services/timeLogService'
import StatsCard, { type StatsCardRef } from './StatsCard'
import type { Task } from '../types'

export default function Dashboard() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [newTaskClient, setNewTaskClient] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const statsRef = useRef<StatsCardRef>(null)

    // Time Logging State
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
    const [duration, setDuration] = useState('')
    const [notes, setNotes] = useState('')

    useEffect(() => {
        loadTasks()
    }, [])

    const loadTasks = async () => {
        try {
            const data = await taskService.fetchTasks()
            setTasks(data)
        } catch (error) {
            console.error('Error loading tasks:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTaskTitle.trim()) return

        setSubmitting(true)
        try {
            const task = await taskService.createTask(newTaskTitle, newTaskClient)
            setTasks([task, ...tasks])
            setNewTaskTitle('')
            setNewTaskClient('')
        } catch (error) {
            console.error('Error creating task:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleLogTime = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!activeTaskId || !duration) return

        try {
            const minutes = parseInt(duration)
            const today = new Date().toISOString().split('T')[0]
            await timeLogService.logTime(activeTaskId, minutes, today, notes)
            statsRef.current?.refresh()

            alert('¡Tiempo registrado exitosamente!')
            setActiveTaskId(null)
            setDuration('')
            setNotes('')
        } catch (error) {
            console.error('Error logging time:', error)
            alert('Error al registrar tiempo')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás segura de eliminar esta tarea?')) return
        try {
            await taskService.deleteTask(id)
            setTasks(tasks.filter(t => t.id !== id))
        } catch (error) {
            console.error('Error deleting task:', error)
        }
    }

    const toggleStatus = async (task: Task) => {
        const newStatus = task.status === 'completed' ? 'active' : 'completed'
        try {
            await taskService.updateStatus(task.id, newStatus)
            setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
        } catch (error) {
            console.error('Error updating status:', error)
        }
    }

    return (
        <div className="w-full">
            <StatsCard ref={statsRef} />
            {/* Create Task Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 transition-all hover:shadow-md">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Nueva Tarea</h2>
                <form onSubmit={handleCreateTask} className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="¿En qué vas a trabajar?"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Cliente / Proyecto (Opcional)"
                        value={newTaskClient}
                        onChange={(e) => setNewTaskClient(e.target.value)}
                        className="md:w-1/3 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    />
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg transform transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Plus size={20} />
                        <span>Agregar</span>
                    </button>
                </form>
            </div>

            {/* Task List */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 px-1">Tus Tareas</h2>
                {loading ? (
                    <div className="text-center py-10 text-gray-400">Cargando tareas...</div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No tienes tareas activas. ¡Agrega una arriba!</p>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <div key={task.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className={`p-4 flex items-center justify-between ${task.status === 'completed' ? 'bg-gray-50' : ''
                                }`}>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => toggleStatus(task)}
                                        className={`text-gray-400 hover:text-indigo-600 transition-colors ${task.status === 'completed' ? 'text-green-500' : ''
                                            }`}
                                    >
                                        {task.status === 'completed' ? <CheckCircle size={24} /> : <Circle size={24} />}
                                    </button>
                                    <div>
                                        <h3 className={`font-medium text-gray-800 ${task.status === 'completed' ? 'line-through text-gray-500' : ''
                                            }`}>
                                            {task.title}
                                        </h3>
                                        {task.client && (
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 mt-1 inline-block">
                                                {task.client}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setActiveTaskId(activeTaskId === task.id ? null : task.id)}
                                        className={`p-2 rounded-lg transition-all ${activeTaskId === task.id ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:bg-gray-100 hover:text-indigo-600'
                                            }`}
                                        title="Registrar Tiempo"
                                    >
                                        <Clock size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(task.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Time Log Form - Expandable */}
                            {activeTaskId === task.id && (
                                <div className="p-4 bg-indigo-50 border-t border-indigo-100 animate-in slide-in-from-top-2">
                                    <form onSubmit={handleLogTime} className="flex flex-col sm:flex-row gap-3 items-end">
                                        <div className="flex-1 w-full">
                                            <label className="text-xs font-medium text-indigo-800 mb-1 block">Minutos</label>
                                            <input
                                                type="number"
                                                placeholder="ej. 60"
                                                value={duration}
                                                onChange={(e) => setDuration(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-300"
                                                autoFocus
                                                required
                                            />
                                        </div>
                                        <div className="flex-[2] w-full">
                                            <label className="text-xs font-medium text-indigo-800 mb-1 block">Notas (Opcional)</label>
                                            <input
                                                type="text"
                                                placeholder="¿Qué hiciste?"
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-300"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                                        >
                                            Guardar
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
