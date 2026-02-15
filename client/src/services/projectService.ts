import { supabase } from '../lib/supabase'
import type { Project } from '../types'

export const projectService = {
    async fetchProjects() {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('updated_at', { ascending: false })

        if (error) throw error
        return data as Project[]
    },

    async getProject(id: string) {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data as Project
    },

    async createProject(name: string, description?: string, color?: string) {
        const { data, error } = await supabase
            .from('projects')
            .insert([{
                name,
                description,
                color: color || '#6366f1',
                user_id: (await supabase.auth.getUser()).data.user?.id
            }])
            .select()
            .single()

        if (error) throw error
        return data as Project
    },

    async updateProject(id: string, updates: Partial<Pick<Project, 'name' | 'description' | 'color'>>) {
        const { data, error } = await supabase
            .from('projects')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data as Project
    },

    async deleteProject(id: string) {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id)

        if (error) throw error
    }
}
