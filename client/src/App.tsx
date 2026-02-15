import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import Auth from './components/Auth'
import ProjectList from './components/ProjectList'
import ProjectDetail from './components/ProjectDetail'
import type { Project } from './types'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!session) {
    return <Auth />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">LuliTracker</h1>
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-gray-600 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>

        <div className="bg-transparent">
          {selectedProject ? (
            <ProjectDetail 
              project={selectedProject} 
              onBack={() => setSelectedProject(null)} 
            />
          ) : (
            <ProjectList onSelectProject={setSelectedProject} />
          )}
        </div>
      </div>
    </div>
  )
}

export default App

