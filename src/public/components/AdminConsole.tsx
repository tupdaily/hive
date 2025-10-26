import React, { useState, useEffect } from 'react'

interface AdminConsoleProps {
  onClose: () => void
  token: string
  showSuccess: (message: string) => void
  showError: (message: string) => void
}

interface Project {
  id: string
  name: string
  description: string
  status: string
  created_at: string
}

interface User {
  id: string
  email: string
  name: string
  role: string
}

const AdminConsole: React.FC<AdminConsoleProps> = ({ onClose, token, showSuccess, showError }) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [newProjectStatus, setNewProjectStatus] = useState('')
  const [newProjectTasks, setNewProjectTasks] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedProject, setSelectedProject] = useState('')

  useEffect(() => {
    loadProjects()
    loadUsers()
  }, [])

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
      showError('Failed to load projects')
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error loading users:', error)
      showError('Failed to load users')
    }
  }

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription,
          status: newProjectStatus,
          tasks: newProjectTasks
        })
      })

      if (response.ok) {
        showSuccess('Project created successfully!')
        setNewProjectName('')
        setNewProjectDescription('')
        setNewProjectStatus('')
        setNewProjectTasks('')
        loadProjects()
      } else {
        const errorData = await response.json()
        showError(`Failed to create project: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error creating project:', error)
      showError('Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  const assignUserToProject = async () => {
    if (!selectedUser || !selectedProject) return

    try {
      const response = await fetch('/api/projects/assign-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUser,
          projectId: selectedProject
        })
      })

      if (response.ok) {
        showSuccess('User assigned to project successfully!')
        setSelectedUser('')
        setSelectedProject('')
      } else {
        const errorData = await response.json()
        showError(`Failed to assign user: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error assigning user:', error)
      showError('Failed to assign user to project')
    }
  }

  const removeUserFromProject = async () => {
    if (!selectedUser || !selectedProject) return

    try {
      const response = await fetch('/api/projects/remove-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUser,
          projectId: selectedProject
        })
      })

      if (response.ok) {
        showSuccess('User removed from project successfully!')
        setSelectedUser('')
        setSelectedProject('')
      } else {
        const errorData = await response.json()
        showError(`Failed to remove user: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error removing user:', error)
      showError('Failed to remove user from project')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-6xl w-full shadow-2xl border-2 border-gray-600 relative">
        {/* Close Button - Top Right */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-full transition-all duration-300"
        >
          <i className="fas fa-times"></i>
        </button>
        
        <div className="text-center mb-6">
          <div className="hexagon mx-auto mb-4 relative">
            <i className="fas fa-cog absolute inset-0 flex items-center justify-center text-white text-2xl"></i>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Admin Console</h3>
          <p className="text-gray-300">Manage projects and user assignments</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Existing Projects */}
          <div className="bg-gray-700 rounded-xl p-8 min-h-96">
            <h4 className="text-lg font-semibold text-white mb-6">
              <i className="fas fa-list mr-2"></i>Existing Projects
            </h4>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {projects.map(project => (
                <div key={project.id} className="bg-gray-600 p-4 rounded-lg">
                  <div className="font-semibold text-white">{project.name}</div>
                  <div className="text-sm text-gray-300 mt-1">{project.description}</div>
                  <div className="text-xs text-gray-400 mt-2">Status: {project.status}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Create New Project */}
          <div className="bg-gray-700 rounded-xl p-8 min-h-96">
            <h4 className="text-lg font-semibold text-white mb-6">
              <i className="fas fa-plus-circle mr-2"></i>Create Project
            </h4>
            
            <form onSubmit={createProject} className="space-y-4">
              <input
                type="text"
                placeholder="Project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-600 text-white border border-gray-500 focus:outline-none focus:border-purple-400"
                required
              />
              <textarea
                placeholder="Project description/goals"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-600 text-white border border-gray-500 focus:outline-none focus:border-purple-400 resize-none"
                rows={3}
                required
              />
              <textarea
                placeholder="Current progress and timeline"
                value={newProjectStatus}
                onChange={(e) => setNewProjectStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-600 text-white border border-gray-500 focus:outline-none focus:border-purple-400 resize-none"
                rows={3}
                required
              />
              <textarea
                placeholder="List of Tasks"
                value={newProjectTasks}
                onChange={(e) => setNewProjectTasks(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-600 text-white border border-gray-500 focus:outline-none focus:border-purple-400 resize-none"
                rows={3}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-full transition-all duration-300 disabled:opacity-50"
              >
                <i className="fas fa-plus mr-2"></i>
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </form>
          </div>
          
          {/* User Assignments */}
          <div className="bg-gray-700 rounded-xl p-8 min-h-96">
            <h4 className="text-lg font-semibold text-white mb-6">
              <i className="fas fa-users mr-2"></i>User Assignments
            </h4>
            
            <div className="space-y-6">
              <div>
                <label className="block text-white text-sm font-semibold mb-3">Select User</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-600 text-white border border-gray-500 focus:outline-none focus:border-purple-400"
                >
                  <option value="">Choose a user</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email}) - {user.role}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-white text-sm font-semibold mb-3">Select Project</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-600 text-white border border-gray-500 focus:outline-none focus:border-purple-400"
                >
                  <option value="">Choose a project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={assignUserToProject}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-full transition-all duration-300"
                >
                  <i className="fas fa-user-plus mr-2"></i>Assign
                </button>
                <button
                  onClick={removeUserFromProject}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-full transition-all duration-300"
                >
                  <i className="fas fa-user-minus mr-2"></i>Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminConsole