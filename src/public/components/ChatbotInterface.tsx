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
  const { showSuccess, showError, NotificationContainer } = useNotification()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadUserAgent()
    loadUserProjects()
  }, [])

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
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

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

  return (
    <div className="min-h-screen honeycomb-bg honeycomb-pattern relative overflow-hidden">
      {/* Floating Honeycombs Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="hexagon honeycomb-float absolute top-20 left-10 honeycomb-pulse" style={{animationDelay: '0s'}}></div>
        <div className="hexagon honeycomb-float absolute top-40 right-20 honeycomb-pulse" style={{animationDelay: '1s'}}></div>
        <div className="hexagon honeycomb-float absolute bottom-40 left-20 honeycomb-pulse" style={{animationDelay: '2s'}}></div>
        <div className="hexagon honeycomb-float absolute bottom-20 right-10 honeycomb-pulse" style={{animationDelay: '3s'}}></div>
        <div className="hexagon honeycomb-float absolute top-60 left-1/2 honeycomb-pulse" style={{animationDelay: '4s'}}></div>
        <div className="hexagon honeycomb-float absolute bottom-60 right-1/3 honeycomb-pulse" style={{animationDelay: '5s'}}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-black/20 backdrop-blur-sm border-b border-yellow-400/30">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <div className="hexagon">
              <i className="fas fa-bee absolute inset-0 flex items-center justify-center text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Hive AI</h1>
              <p className="text-yellow-100">Welcome back, {user.name}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full transition-all duration-300"
          >
            <i className="fas fa-sign-out-alt mr-2"></i>Logout
          </button>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-amber-900/80 backdrop-blur-sm border-r border-amber-600/50 p-4 shadow-lg">
          <div className="flex items-center mb-6">
            <div className="hexagon-small mr-3">
              <i className="fas fa-project-diagram text-amber-200"></i>
            </div>
            <h2 className="text-lg font-semibold text-white">Projects</h2>
          </div>
          
          <div className="space-y-3 mb-6">
            {userProjects.map(project => (
              <button
                key={project.id}
                onClick={() => toggleProjectSelection(project.id)}
                className={`w-full p-4 text-left rounded-xl transition-all duration-300 border-2 ${
                  selectedProjects.has(project.id) 
                    ? 'bg-amber-600 border-amber-400 text-white shadow-lg transform scale-105' 
                    : 'bg-amber-800/50 border-amber-700/50 text-amber-100 hover:bg-amber-800/70 hover:border-amber-600/70'
                }`}
              >
                <div className="font-semibold text-sm mb-1">{project.name}</div>
                <div className="text-xs opacity-80 leading-relaxed">{project.description}</div>
              </button>
            ))}
          </div>

          {/* Admin Console Button */}
          {user.role === 'admin' && (
            <button
              onClick={onShowAdminConsole}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg border-2 border-purple-500/50"
            >
              <i className="fas fa-cog mr-2"></i>Admin Console
            </button>
          )}
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Messages */}
          <div 
            id="chat-messages" 
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.length === 0 && (
              <div className="text-center text-white/70 mt-20">
                <div className="hexagon mx-auto mb-4">
                  <i className="fas fa-comments absolute inset-0 flex items-center justify-center text-white text-2xl"></i>
                </div>
                <p className="text-xl">Start a conversation with your AI assistant!</p>
              </div>
            )}
            
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl chat-bubble ${
                    message.isUser 
                      ? 'bg-yellow-400 text-gray-800' 
                      : 'bg-white/90 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/90 text-gray-800 px-4 py-3 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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
        </div>
      </div>

      <NotificationContainer />
    </div>
  )
}

export default ChatbotInterface
