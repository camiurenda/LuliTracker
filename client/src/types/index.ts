export type TaskStatus = 'active' | 'completed' | 'archived';

export interface Task {
    id: string;
    user_id: string;
    title: string;
    client?: string | null;
    status: TaskStatus;
    created_at: string;
}

export interface TimeLog {
    id: string;
    task_id: string;
    user_id: string;
    duration: number; // in minutes
    date: string;
    notes?: string | null;
    created_at: string;
}

// =============================================
// V2 - Project-Centric Types
// =============================================

export interface Project {
    id: string;
    user_id: string;
    name: string;
    description?: string | null;
    color: string;
    created_at: string;
    updated_at: string;
}

export type ActionType = 'LLAMADO' | 'REUNION' | 'VISITA' | string;

export const DEFAULT_ACTIONS: ActionType[] = ['LLAMADO', 'REUNION', 'VISITA'];

export interface TimeEntry {
    id: string;
    project_id: string;
    user_id: string;
    action_type: ActionType;
    duration_minutes: number;
    notes?: string | null;
    entry_date: string;
    created_at: string;
}
