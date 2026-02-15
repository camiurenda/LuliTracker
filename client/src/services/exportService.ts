import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { supabase } from '../lib/supabase'
import type { Project } from '../types'

export interface ExportOptions {
    project: Project
    dateFrom: string
    dateTo: string
}

interface EntryRow {
    Fecha: string
    Actividad: string
    'Duración (min)': number
    'Duración (horas)': string
    Comentario: string
}

export const exportService = {
    async exportProjectToXlsx({ project, dateFrom, dateTo }: ExportOptions) {
        const { data: entries, error } = await supabase
            .from('time_entries')
            .select('action_type, duration_minutes, notes, entry_date')
            .eq('project_id', project.id)
            .gte('entry_date', dateFrom)
            .lte('entry_date', dateTo)
            .order('entry_date', { ascending: true })

        if (error) throw error
        if (!entries || entries.length === 0) {
            throw new Error('No hay registros en el rango seleccionado')
        }

        const rows: EntryRow[] = entries.map(e => ({
            Fecha: formatDateES(e.entry_date),
            Actividad: e.action_type,
            'Duración (min)': e.duration_minutes,
            'Duración (horas)': formatHours(e.duration_minutes),
            Comentario: e.notes || '',
        }))

        // Summary row
        const totalMinutes = entries.reduce((sum, e) => sum + e.duration_minutes, 0)
        rows.push({
            Fecha: '',
            Actividad: 'TOTAL',
            'Duración (min)': totalMinutes,
            'Duración (horas)': formatHours(totalMinutes),
            Comentario: '',
        })

        // Build workbook
        const ws = XLSX.utils.json_to_sheet(rows)

        // Column widths
        ws['!cols'] = [
            { wch: 14 },  // Fecha
            { wch: 16 },  // Actividad
            { wch: 16 },  // Duración (min)
            { wch: 16 },  // Duración (horas)
            { wch: 40 },  // Comentario
        ]

        const wb = XLSX.utils.book_new()
        const sheetName = project.name.substring(0, 31) // Excel max 31 chars
        XLSX.utils.book_append_sheet(wb, ws, sheetName)

        // Summary sheet
        const byAction: Record<string, number> = {}
        entries.forEach(e => {
            byAction[e.action_type] = (byAction[e.action_type] || 0) + e.duration_minutes
        })

        const summaryRows = Object.entries(byAction).map(([action, mins]) => ({
            Actividad: action,
            Cantidad: entries.filter(e => e.action_type === action).length,
            'Total (min)': mins,
            'Total (horas)': formatHours(mins),
        }))

        summaryRows.push({
            Actividad: 'TOTAL',
            Cantidad: entries.length,
            'Total (min)': totalMinutes,
            'Total (horas)': formatHours(totalMinutes),
        })

        const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
        wsSummary['!cols'] = [
            { wch: 16 },
            { wch: 10 },
            { wch: 14 },
            { wch: 14 },
        ]
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen')

        // Generate file
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([wbout], { type: 'application/octet-stream' })

        const fromLabel = dateFrom.replace(/-/g, '')
        const toLabel = dateTo.replace(/-/g, '')
        const fileName = `${project.name}_${fromLabel}_${toLabel}.xlsx`

        saveAs(blob, fileName)
    },
}

function formatHours(minutes: number): string {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h === 0) return `${m}min`
    if (m === 0) return `${h}h`
    return `${h}h ${m}min`
}

function formatDateES(dateStr: string): string {
    const date = new Date(dateStr + 'T12:00:00')
    return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}
