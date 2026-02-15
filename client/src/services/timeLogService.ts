import { supabase } from '../lib/supabase'
import type { TimeLog } from '../types'

export const timeLogService = {
    async logTime(taskId: string, duration: number, date: string, notes?: string) {
        const { data, error } = await supabase
            .from('time_logs')
            .insert([{
                task_id: taskId,
                duration,
                date,
                notes,
                user_id: (await supabase.auth.getUser()).data.user?.id
            }])
            .select()
            .single()

        if (error) throw error
        return data as TimeLog
    },

    async getTaskLogs(taskId: string) {
        const { data, error } = await supabase
            .from('time_logs')
            .select('*')
            .eq('task_id', taskId)
            .order('date', { ascending: false })

        if (error) throw error
        return data as TimeLog[]
    }
}
