import React, { useState, useEffect } from 'react'

interface AdminConsoleProps {
  onClose: () => void
  token: string
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

const AdminConsole: React.FC<AdminConsoleProps> = ({ onClose, token }) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
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
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/projects/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return

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
          description: newProjectDescription
        })
      })

      if (response.ok) {
        setNewProjectName('')
        setNewProjectDescription('')
        loadProjects()
      } else {
        const errorData = await response.json()
        alert(`Failed to create project: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project')
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
        alert('User assigned to project successfully!')
        setSelectedUser('')
        setSelectedProject('')
      } else {
        const errorData = await response.json()
        alert(`Failed to assign user: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error assigning user:', error)
      alert('Failed to assign user to project')
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
        alert('User removed from project successfully!')
        setSelectedUser('')
        setSelectedProject('')
      } else {
        const errorData = await response.json()
        alert(`Failed to remove user: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error removing user:', error)
      alert('Failed to remove user from project')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-4xl w-full shadow-2xl border-2 border-purple-400">
        <div className="text-center mb-6">
          <div className="hexagon mx-auto mb-4 relative">
            <i className="fas fa-cog absolute inset-0 flex items-center justify-center text-white text-2xl"></i>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Admin Console</h3>
          <p className="text-purple-100">Manage projects and user assignments</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Projects Management */}
          <div className="bg-gray-700 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-white mb-4">
              <i className="fas fa-project-diagram mr-2"></i>Projects
            </h4>
            
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {projects.map(project => (
                <div key={project.id} className="bg-gray-600 p-3 rounded-lg">
                  <div className="font-semibold text-white">{project.name}</div>
                  <div className="text-sm text-gray-300">{project.description}</div>
                  <div className="text-xs text-gray-400">Status: {project.status}</div>
                </div>
              ))}
            </div>
            
            <form onSubmit={createProject} className="space-y-3">
              <input
                type="text"
                placeholder="Project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-600 text-white border border-gray-500 focus:outline-none focus:border-purple-400"
                required
              />
              <textarea
                placeholder="Project description"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-600 text-white border border-gray-500 focus:outline-none focus:border-purple-400 resize-none"
                rows={2}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-full transition-all duration-300 disabled:opacity-50"
              >
                <i className="fas fa-plus mr-2"></i>
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </form>
          </div>
          
          {/* User Management */}
          <div className="bg-gray-700 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-white mb-4">
              <i className="fas fa-users mr-2"></i>User Assignments
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-semibold mb-2">Select User</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-600 text-white border border-gray-500 focus:outline-none focus:border-purple-400"
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
                <label className="block text-white text-sm font-semibold mb-2">Select Project</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-600 text-white border border-gray-500 focus:outline-none focus:border-purple-400"
                >
                  <option value="">Choose a project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={assignUserToProject}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full transition-all duration-300"
                >
                  <i className="fas fa-user-plus mr-2"></i>Assign
                </button>
                <button
                  onClick={removeUserFromProject}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-full transition-all duration-300"
                >
                  <i className="fas fa-user-minus mr-2"></i>Remove
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <button 
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300"
          >
            <i className="fas fa-times mr-2"></i>Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminConsole
