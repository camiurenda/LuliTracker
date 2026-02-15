import { supabase } from '../lib/supabase'
import type { TimeEntry, ActionType } from '../types'

export const timeEntryService = {
    async logEntry(
        projectId: string,
        actionType: ActionType,
        durationMinutes: number,
        notes?: string,
        entryDate?: string
    ) {
        const { data, error } = await supabase
            .from('time_entries')
            .insert([{
                project_id: projectId,
                action_type: actionType,
                duration_minutes: durationMinutes,
                notes,
                entry_date: entryDate || new Date().toISOString().split('T')[0],
                user_id: (await supabase.auth.getUser()).data.user?.id
            }])
            .select()
            .single()

        if (error) throw error
        return data as TimeEntry
    },

    async getProjectEntries(projectId: string) {
        const { data, error } = await supabase
            .from('time_entries')
            .select('*')
            .eq('project_id', projectId)
            .order('entry_date', { ascending: false })

        if (error) throw error
        return data as TimeEntry[]
    },

    async getProjectStats(projectId: string) {
        const { data, error } = await supabase
            .from('time_entries')
            .select('action_type, duration_minutes')
            .eq('project_id', projectId)

        if (error) throw error

        const entries = data as Pick<TimeEntry, 'action_type' | 'duration_minutes'>[]
        
        const totalMinutes = entries.reduce((sum, e) => sum + e.duration_minutes, 0)
        const byAction = entries.reduce((acc, e) => {
            acc[e.action_type] = (acc[e.action_type] || 0) + e.duration_minutes
            return acc
        }, {} as Record<string, number>)

        return { totalMinutes, byAction, entryCount: entries.length }
    },

    async deleteEntry(id: string) {
        const { error } = await supabase
            .from('time_entries')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    async getAllStats() {
        const { data, error } = await supabase
            .from('time_entries')
            .select('duration_minutes, entry_date')

        if (error) throw error

        const entries = data as Pick<TimeEntry, 'duration_minutes' | 'entry_date'>[]
        const today = new Date().toISOString().split('T')[0]
        
        const totalMinutes = entries.reduce((sum, e) => sum + e.duration_minutes, 0)
        const todayMinutes = entries
            .filter(e => e.entry_date === today)
            .reduce((sum, e) => sum + e.duration_minutes, 0)

        return { totalMinutes, todayMinutes, entryCount: entries.length }
    }
}
