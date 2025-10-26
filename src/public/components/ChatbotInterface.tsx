import React, { useState, useEffect, useRef } from 'react'
import { useNotification } from '../hooks/useNotification'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'employee'
  description?: string
  memoryBlockId?: string
  createdAt: Date
  updatedAt: Date
}

interface ChatbotInterfaceProps {
  user: User
  token: string
  onLogout: () => void
  onShowAdminConsole: () => void
}

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

interface ProjectMember {
  id: string
  name: string
  email?: string
}

const ChatbotInterface: React.FC<ChatbotInterfaceProps> = ({ 
  user, 
  token, 
  onLogout, 
  onShowAdminConsole 
}) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [userAgent, setUserAgent] = useState<any>(null)
  const [userProjects, setUserProjects] = useState<any[]>([])
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set())
  const [chatMovedToBottom, setChatMovedToBottom] = useState(false)
  const { showError, NotificationContainer } = useNotification()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [projectMembersMap, setProjectMembersMap] = useState<Record<string, ProjectMember[]>>({})

  useEffect(() => {
    loadUserAgent()
    loadUserProjects()
  }, [])

  // Reload agent when user description changes (after questionnaire submission)
  useEffect(() => {
    if (user?.description) {
      loadUserAgent()
    }
  }, [user?.description])

  useEffect(() => {
    if (userAgent && userProjects.length > 0) {
      loadAgentMemoryBlocks()
    }
  }, [userAgent, userProjects])

  const loadAgentMemoryBlocks = async () => {
    if (!userAgent?.lettaAgentId) return

    try {
      const response = await fetch('/api/projects/agent-memory-blocks', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const memoryBlocks = data.memoryBlocks || []
        
        // Find which projects correspond to the agent's memory blocks
        const selectedProjectIds = new Set<string>()
        
        for (const memoryBlockId of memoryBlocks) {
          // Find project that has this memory block ID
          const project = userProjects.find(p => p.memoryBlockId === memoryBlockId)
          if (project) {
            selectedProjectIds.add(project.id)
          }
        }
        
        setSelectedProjects(selectedProjectIds)
      }
    } catch (error) {
      console.error('Error loading agent memory blocks:', error)
    }
  }

  useEffect(() => {
    // Only scroll to bottom when new messages are added, not on initial load
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [messages])

    const loadUserAgent = async () => {
    try {
      const response = await fetch('/api/agents/my-agent', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserAgent(data.agent)
      } else {
        showError('No AI agent found. Please complete the questionnaire first.')
      }
    } catch (error) {
      console.error('Error loading user agent:', error)
      showError('Failed to load AI agent')
    }
  }

  const loadUserProjects = async () => {
    try {
      const response = await fetch('/api/projects/my-projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserProjects(data.projects)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const getAIResponse = async (message: string): Promise<string> => {
    if (!userAgent) {
      return "I don't have an AI agent available yet. Please contact an administrator."
    }

    try {
      const response = await fetch(`/api/agents/${userAgent.id}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: message })
      })

      const data = await response.json()

      if (response.ok) {
        return data.response || "I received your message but couldn't generate a response."
      } else {
        console.error('Agent query error:', data)
        return "I encountered an error while processing your request. Please try again."
      }
    } catch (error) {
      console.error('Error calling AI agent:', error)
      return "I'm having trouble connecting to my AI agents right now. Please try again in a moment."
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setLoading(true)

    // Move chat to bottom on first message
    if (!chatMovedToBottom) {
      setChatMovedToBottom(true)
    }

    try {
      const aiResponse = await getAIResponse(userMessage.content)
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        isUser: false,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error getting AI response:', error)
      showError('Failed to get AI response')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleProjectSelection = async (projectId: string) => {
    const newSelected = new Set(selectedProjects)
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId)
    } else {
      newSelected.add(projectId)
    }
    setSelectedProjects(newSelected)

    // Update agent memory blocks with selected projects
    try {
      const response = await fetch('/api/projects/update-agent-memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ projectIds: Array.from(newSelected) })
      })

      if (!response.ok) {
        console.error('Failed to update agent memory blocks')
        showError('Failed to update project context')
      }
    } catch (error) {
      console.error('Error updating agent memory blocks:', error)
      showError('Failed to update project context')
    }
  }

  // Toggle expanded state for project and load members lazily
  const handleProjectClick = async (projectId: string) => {
    // toggle selection as before
    toggleProjectSelection(projectId)

    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
      setExpandedProjects(newExpanded)
      return
    }

    newExpanded.add(projectId)
    setExpandedProjects(newExpanded)

    // Load members if not already loaded
    if (!projectMembersMap[projectId]) {
      try {
        const resp = await fetch(`/api/projects/${projectId}/members`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (resp.ok) {
          const data = await resp.json()
          // Expecting data.members as array
          setProjectMembersMap(prev => ({ ...prev, [projectId]: data.members || [] }))
        } else {
          console.error('Failed to load project members for', projectId)
          setProjectMembersMap(prev => ({ ...prev, [projectId]: [] }))
        }
      } catch (err) {
        console.error('Error loading project members:', err)
        setProjectMembersMap(prev => ({ ...prev, [projectId]: [] }))
      }
    }
  }

  return (
    <div className="min-h-screen honeycomb-bg honeycomb-pattern flex flex-col">
      {/* Floating Honeycombs Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top Row */}
        <div className="hexagon honeycomb-float absolute top-[5%] left-[5%] honeycomb-pulse" style={{animationDelay: '0s'}}></div>
        <div className="hexagon honeycomb-float absolute top-[5%] left-[25%] honeycomb-pulse" style={{animationDelay: '0.3s'}}></div>
        <div className="hexagon honeycomb-float absolute top-[5%] left-[45%] honeycomb-pulse" style={{animationDelay: '0.6s'}}></div>
        <div className="hexagon honeycomb-float absolute top-[5%] left-[65%] honeycomb-pulse" style={{animationDelay: '0.9s'}}></div>
        <div className="hexagon honeycomb-float absolute top-[5%] left-[85%] honeycomb-pulse" style={{animationDelay: '1.2s'}}></div>
        
        {/* Middle Section */}
        <div className="hexagon honeycomb-float absolute top-[25%] left-[15%] honeycomb-pulse" style={{animationDelay: '1.5s'}}></div>
        <div className="hexagon honeycomb-float absolute top-[25%] left-[35%] honeycomb-pulse" style={{animationDelay: '1.8s'}}></div>
        <div className="hexagon honeycomb-float absolute top-[25%] left-[55%] honeycomb-pulse" style={{animationDelay: '2.1s'}}></div>
        <div className="hexagon honeycomb-float absolute top-[25%] left-[75%] honeycomb-pulse" style={{animationDelay: '2.4s'}}></div>
        
        {/* Center */}
        <div className="hexagon honeycomb-float absolute top-[45%] left-[10%] honeycomb-pulse" style={{animationDelay: '2.7s'}}></div>
        <div className="hexagon honeycomb-float absolute top-[45%] left-[30%] honeycomb-pulse" style={{animationDelay: '3.0s'}}></div>
        <div className="hexagon honeycomb-float absolute top-[45%] left-[50%] honeycomb-pulse" style={{animationDelay: '3.3s'}}></div>
        <div className="hexagon honeycomb-float absolute top-[45%] left-[70%] honeycomb-pulse" style={{animationDelay: '3.6s'}}></div>
        <div className="hexagon honeycomb-float absolute top-[45%] left-[90%] honeycomb-pulse" style={{animationDelay: '3.9s'}}></div>
        
        {/* Bottom Section */}
        <div className="hexagon honeycomb-float absolute top-[65%] left-[20%] honeycomb-pulse" style={{animationDelay: '4.2s'}}></div>
        <div className="hexagon honeycomb-float absolute top-[65%] left-[40%] honeycomb-pulse" style={{animationDelay: '4.5s'}}></div>
        <div className="hexagon honeycomb-float absolute top-[65%] left-[60%] honeycomb-pulse" style={{animationDelay: '4.8s'}}></div>
        <div className="hexagon honeycomb-float absolute top-[65%] left-[80%] honeycomb-pulse" style={{animationDelay: '5.1s'}}></div>
        
        {/* Bottom Row */}
        <div className="hexagon honeycomb-float absolute top-[85%] left-[15%] honeycomb-pulse" style={{animationDelay: '5.4s'}}></div>
        <div className="hexagon honeycomb-float absolute top-[85%] left-[35%] honeycomb-pulse" style={{animationDelay: '5.7s'}}></div>
        <div className="hexagon honeycomb-float absolute top-[85%] left-[55%] honeycomb-pulse" style={{animationDelay: '6.0s'}}></div>
        <div className="hexagon honeycomb-float absolute top-[85%] left-[75%] honeycomb-pulse" style={{animationDelay: '6.3s'}}></div>
      </div>

      <div className="flex h-screen overflow-hidden relative">
        {/* Gray Sidebar - Full Height */}
        <aside 
          className="w-80 min-w-80 max-w-80 border-r border-gray-700 flex flex-col relative z-10"
          style={{ backgroundColor: '#374151' }}
        >
          {/* Logo Section - Top */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="hexagon">
                <i className="fas fa-bee absolute inset-0 flex items-center justify-center text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Hive AI</h1>
                    <p className="text-gray-200 text-base">Welcome, {user.name}</p>
              </div>
            </div>
          </div>

          {/* Projects Section - Middle */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h2 className="text-lg font-semibold text-white mb-4">
              <i className="fas fa-project-diagram mr-2"></i>Projects
            </h2>
            
            <div className="space-y-3 mb-6">
              {userProjects.map(project => (
                <div key={project.id} className="w-full">
                  <button
                    onClick={() => handleProjectClick(project.id)}
                    className={`w-full p-4 text-left rounded-lg transition-all duration-300 hover:bg-gray-600 ${
                      selectedProjects.has(project.id) 
                        ? 'bg-yellow-400/10 border border-yellow-400/30' 
                        : 'bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white mb-1 truncate">{project.name}</div>
                        <div className="text-sm text-gray-300 line-clamp-2 h-10 overflow-hidden">
                          {project.description}
                        </div>
                      </div>
                      <div className={`mt-1 transform transition-transform ${
                        expandedProjects.has(project.id) ? 'rotate-45' : ''
                      }`}>
                        <i className="fas fa-chevron-down text-yellow-400"></i>
                      </div>
                    </div>
                  </button>

                  {/* Expanded members dropdown */}
                  {expandedProjects.has(project.id) && (
                    <div className="mt-2 ml-2 mr-2 p-2 bg-gray-800/60 rounded-md text-sm text-gray-200">
                      {projectMembersMap[project.id] === undefined && !project.members && (
                        <div className="py-2">Loading members...</div>
                      )}

                      {(projectMembersMap[project.id] || project.members) && (
                        <ul className="space-y-2 max-h-32 overflow-y-auto">
                          {(projectMembersMap[project.id] || project.members).map((m: any) => (
                            <li key={m.id} className="flex items-center justify-between">
                              <div className="min-w-0">
                                <div className="font-medium truncate">{m.name}</div>
                                <div className="text-xs text-gray-400 truncate">{m.email}</div>
                              </div>
                              <div className="ml-3 text-xs text-gray-300">{m.role ? m.role : ''}</div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Admin Console Button */}
            {user.role === 'admin' && (
              <button
                onClick={onShowAdminConsole}
                    className="w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-full transition-all duration-300 transform hover:scale-105 mb-4"
              >
                <i className="fas fa-cog mr-2"></i>Admin Console
              </button>
            )}
          </div>

          {/* Logout Button - Bottom */}
          <div className="p-4 border-t border-gray-700">
            <button 
              onClick={onLogout}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-full transition-all duration-300"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>Logout
            </button>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col min-w-0 relative">
          {/* Chat Messages */}
          <div 
            id="chat-messages" 
            className="flex-1 overflow-y-auto px-8 py-6 space-y-4 max-h-[calc(100vh-120px)]" // 120px for input and padding
            ref={chatContainerRef}
          >
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white/70">
                  <div className="hexagon mx-auto mb-4">
                    <i className="fas fa-comments absolute inset-0 flex items-center justify-center text-white text-2xl"></i>
                  </div>
                  <p className="text-5xl font-bold text-yellow-400 drop-shadow-lg">Talk to the Hive</p>
                </div>
              </div>
            )}
            
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mx-8`}
              >
                <div
                  className={`max-w-2xl lg:max-w-4xl px-6 py-4 rounded-2xl chat-bubble mx-4 ${
                    message.isUser 
                      ? 'bg-yellow-400 text-gray-800' 
                      : 'bg-white/90 text-gray-800'
                  }`}
                >
                  <p className="text-lg leading-relaxed">{message.content}</p>
                  <p className="text-sm opacity-60 mt-3">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start mx-8">
                <div className="bg-white/90 text-gray-800 px-6 py-4 rounded-2xl max-w-2xl lg:max-w-4xl mx-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-lg">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className={`${chatMovedToBottom ? 'chat-input-bottom' : 'chat-input-centered'} p-4`}>
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex items-center space-x-4"
            >
              <div className="flex-1">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  className="w-full px-4 py-3 rounded-3xl border-2 border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white/90 text-gray-800 resize-none"
                  rows={1}
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="bg-yellow-400 hover:bg-yellow-500 text-white px-6 py-3 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </form>
          </div>
        </main>
      </div>

      <NotificationContainer />
    </div>
  )
}

export default ChatbotInterface
