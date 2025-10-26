import { useState, useEffect } from 'react'

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

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
    } else {
      throw new Error(data.error || 'Login failed')
    }
  }

  const register = async (name: string, email: string, password: string, role: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
    } else {
      throw new Error(data.error || 'Registration failed')
    }
  }

  const updateDescription = async (description: string) => {
    if (!token) throw new Error('Not authenticated')
    
    const response = await fetch('/api/auth/questionnaire', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ description })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      const updatedUser = { ...user!, description }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
    } else {
      throw new Error(data.error || 'Failed to update description')
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    user,
    token,
    loading,
    login,
    register,
    updateDescription,
    logout
  }
}
