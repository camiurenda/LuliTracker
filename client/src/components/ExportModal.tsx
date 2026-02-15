import { useState } from 'react'
import { X, FileSpreadsheet, Calendar, Loader2 } from 'lucide-react'
import { exportService } from '../services/exportService'
import type { Project } from '../types'

interface ExportModalProps {
    project: Project
    onClose: () => void
}

type QuickRange = 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'last_3_months' | 'custom'

const QUICK_RANGES: { key: QuickRange; label: string }[] = [
    { key: 'this_week', label: 'Semana actual' },
    { key: 'last_week', label: 'Semana pasada' },
    { key: 'this_month', label: 'Mes actual' },
    { key: 'last_month', label: 'Mes pasado' },
    { key: 'last_3_months', label: 'Últimos 3 meses' },
    { key: 'custom', label: 'Personalizado' },
]

function getDateRange(range: QuickRange): { from: string; to: string } {
    const today = new Date()
    const toISO = (d: Date) => d.toISOString().split('T')[0]

    switch (range) {
        case 'this_week': {
            const day = today.getDay()
            const diff = day === 0 ? 6 : day - 1 // Monday as start
            const monday = new Date(today)
            monday.setDate(today.getDate() - diff)
            return { from: toISO(monday), to: toISO(today) }
        }
        case 'last_week': {
            const day = today.getDay()
            const diff = day === 0 ? 6 : day - 1
            const thisMonday = new Date(today)
            thisMonday.setDate(today.getDate() - diff)
            const lastMonday = new Date(thisMonday)
            lastMonday.setDate(thisMonday.getDate() - 7)
            const lastSunday = new Date(thisMonday)
            lastSunday.setDate(thisMonday.getDate() - 1)
            return { from: toISO(lastMonday), to: toISO(lastSunday) }
        }
        case 'this_month': {
            const first = new Date(today.getFullYear(), today.getMonth(), 1)
            return { from: toISO(first), to: toISO(today) }
        }
        case 'last_month': {
            const first = new Date(today.getFullYear(), today.getMonth() - 1, 1)
            const last = new Date(today.getFullYear(), today.getMonth(), 0)
            return { from: toISO(first), to: toISO(last) }
        }
        case 'last_3_months': {
            const first = new Date(today.getFullYear(), today.getMonth() - 3, 1)
            return { from: toISO(first), to: toISO(today) }
        }
        default:
            return { from: '', to: '' }
    }
}

export default function ExportModal({ project, onClose }: ExportModalProps) {
    const [selectedRange, setSelectedRange] = useState<QuickRange>('this_month')
    const [customFrom, setCustomFrom] = useState('')
    const [customTo, setCustomTo] = useState('')
    const [exporting, setExporting] = useState(false)
    const [error, setError] = useState('')

    const handleExport = async () => {
        setError('')

        let dateFrom: string
        let dateTo: string

        if (selectedRange === 'custom') {
            if (!customFrom || !customTo) {
                setError('Seleccioná ambas fechas')
                return
            }
            if (customFrom > customTo) {
                setError('La fecha "desde" debe ser anterior a "hasta"')
                return
            }
            dateFrom = customFrom
            dateTo = customTo
        } else {
            const range = getDateRange(selectedRange)
            dateFrom = range.from
            dateTo = range.to
        }

        setExporting(true)
        try {
            await exportService.exportProjectToXlsx({
                project,
                dateFrom,
                dateTo,
            })
            onClose()
        } catch (err: any) {
            setError(err.message || 'Error al exportar')
        } finally {
            setExporting(false)
        }
    }

    const previewRange = selectedRange === 'custom'
        ? (customFrom && customTo ? `${customFrom} → ${customTo}` : '')
        : (() => {
            const r = getDateRange(selectedRange)
            return `${r.from} → ${r.to}`
        })()

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <FileSpreadsheet size={20} className="text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Exportar Informe</h3>
                                <p className="text-sm text-gray-500">{project.name}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Quick Range Selector */}
                    <div className="mb-5">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Rango de fechas
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {QUICK_RANGES.map(({ key, label }) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setSelectedRange(key)}
                                    className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                                        selectedRange === key
                                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Date Inputs */}
                    {selectedRange === 'custom' && (
                        <div className="mb-5 flex gap-3">
                            <div className="flex-1">
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Desde</label>
                                <input
                                    type="date"
                                    value={customFrom}
                                    onChange={(e) => setCustomFrom(e.target.value)}
                                    max={customTo || new Date().toISOString().split('T')[0]}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Hasta</label>
                                <input
                                    type="date"
                                    value={customTo}
                                    onChange={(e) => setCustomTo(e.target.value)}
                                    min={customFrom}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* Date Preview */}
                    {previewRange && (
                        <div className="mb-5 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                            <Calendar size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-500">{previewRange}</span>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {exporting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Exportando...
                                </>
                            ) : (
                                <>
                                    <FileSpreadsheet size={18} />
                                    Descargar XLSX
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
