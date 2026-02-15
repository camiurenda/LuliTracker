import { useEffect, useState } from 'react'
import { Plus, FolderOpen, Trash2, Edit3, X, Check } from 'lucide-react'
import { projectService } from '../services/projectService'
import GlobalStats from './GlobalStats'
import type { Project } from '../types'

interface ProjectListProps {
    onSelectProject: (project: Project) => void
}

const PROJECT_COLORS = [
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#f43f5e', // rose
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#0ea5e9', // sky
]

export default function ProjectList({ onSelectProject }: ProjectListProps) {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    // Form state
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [color, setColor] = useState(PROJECT_COLORS[0])

    useEffect(() => {
        loadProjects()
    }, [])

    const loadProjects = async () => {
        try {
            const data = await projectService.fetchProjects()
            setProjects(data)
        } catch (error) {
            console.error('Error loading projects:', error)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setName('')
        setDescription('')
        setColor(PROJECT_COLORS[0])
        setShowForm(false)
        setEditingId(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        try {
            if (editingId) {
                const updated = await projectService.updateProject(editingId, { name, description, color })
                setProjects(projects.map(p => p.id === editingId ? updated : p))
            } else {
                const project = await projectService.createProject(name, description, color)
                setProjects([project, ...projects])
            }
            resetForm()
        } catch (error) {
            console.error('Error saving project:', error)
        }
    }

    const handleEdit = (project: Project) => {
        setEditingId(project.id)
        setName(project.name)
        setDescription(project.description || '')
        setColor(project.color)
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este proyecto? Se borrarán todos los registros de tiempo asociados.')) return
        try {
            await projectService.deleteProject(id)
            setProjects(projects.filter(p => p.id !== id))
        } catch (error) {
            console.error('Error deleting project:', error)
        }
    }

    return (
        <div className="w-full">
            {/* Dashboard Stats */}
            <GlobalStats />

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Mis Proyectos</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg transform transition-all hover:-translate-y-0.5 flex items-center gap-2"
                >
                    <Plus size={20} />
                    <span>Nuevo Proyecto</span>
                </button>
            </div>

            {/* Create/Edit Form */}
            {showForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                            {editingId ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                        </h3>
                        <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre *</label>
                            <input
                                type="text"
                                placeholder="Nombre del proyecto"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                required
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Descripción</label>
                            <input
                                type="text"
                                placeholder="Descripción opcional"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Color</label>
                            <div className="flex gap-2 flex-wrap">
                                {PROJECT_COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Check size={18} />
                                {editingId ? 'Guardar Cambios' : 'Crear Proyecto'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Project List */}
            {loading ? (
                <div className="text-center py-10 text-gray-400">Cargando proyectos...</div>
            ) : projects.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                    <FolderOpen size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-2">No tienes proyectos todavía</p>
                    <p className="text-gray-400 text-sm">Crea tu primer proyecto para empezar a registrar tiempo</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all group"
                        >
                            <div
                                className="h-2"
                                style={{ backgroundColor: project.color }}
                            />
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <h3
                                        onClick={() => onSelectProject(project)}
                                        className="font-semibold text-gray-800 text-lg cursor-pointer hover:text-indigo-600 transition-colors"
                                    >
                                        {project.name}
                                    </h3>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(project)}
                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                            title="Editar"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(project.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                {project.description && (
                                    <p className="text-gray-500 text-sm mb-3">{project.description}</p>
                                )}
                                <button
                                    onClick={() => onSelectProject(project)}
                                    className="w-full mt-2 px-4 py-2.5 bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 font-medium rounded-lg transition-colors text-sm"
                                >
                                    Abrir Proyecto →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
