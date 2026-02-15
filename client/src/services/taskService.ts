import { supabase } from '../lib/supabase'
import type { Task } from '../types'

export const taskService = {
    async fetchTasks() {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as Task[]
    },

    async createTask(title: string, client?: string) {
        const { data, error } = await supabase
            .from('tasks')
            .insert([{
                title,
                client,
                user_id: (await supabase.auth.getUser()).data.user?.id
            }])
            .select()
            .single()

        if (error) throw error
        return data as Task
    },

    async updateStatus(id: string, status: Task['status']) {
        const { error } = await supabase
            .from('tasks')
            .update({ status })
            .eq('id', id)

        if (error) throw error
    },

    async deleteTask(id: string) {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id)

        if (error) throw error
    }
}
