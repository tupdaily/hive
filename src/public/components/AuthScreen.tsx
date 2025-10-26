import React, { useState } from 'react'

interface AuthScreenProps {
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (name: string, email: string, password: string, role: string) => Promise<void>
  showError: (message: string) => void
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onRegister, showError }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    try {
      await onLogin(email, password)
    } catch (error) {
      showError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const role = formData.get('role') as string
    
    try {
      await onRegister(name, email, password, role)
    } catch (error) {
      showError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen honeycomb-bg honeycomb-pattern flex items-center justify-center p-4">
      {/* Floating Honeycombs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="hexagon honeycomb-float absolute top-20 left-20 honeycomb-pulse" style={{animationDelay: '0s'}}></div>
        <div className="hexagon honeycomb-float absolute top-40 right-32 honeycomb-pulse" style={{animationDelay: '1s'}}></div>
        <div className="hexagon honeycomb-float absolute bottom-40 left-32 honeycomb-pulse" style={{animationDelay: '2s'}}></div>
        <div className="hexagon honeycomb-float absolute bottom-20 right-20 honeycomb-pulse" style={{animationDelay: '3s'}}></div>
        <div className="hexagon honeycomb-float absolute top-60 left-1/2 honeycomb-pulse" style={{animationDelay: '4s'}}></div>
        <div className="hexagon honeycomb-float absolute bottom-60 right-1/3 honeycomb-pulse" style={{animationDelay: '5s'}}></div>
        <div className="hexagon honeycomb-float absolute top-80 right-1/4 honeycomb-pulse" style={{animationDelay: '6s'}}></div>
        <div className="hexagon honeycomb-float absolute bottom-80 left-1/4 honeycomb-pulse" style={{animationDelay: '7s'}}></div>
      </div>

      {/* Auth Container */}
      <div className="glass-effect rounded-3xl p-8 max-w-md w-full shadow-2xl border-2 border-yellow-400 relative z-10">
        {/* Bee Logo */}
        <div className="text-center mb-8">
          <div className="hexagon mx-auto mb-4 relative">
            <i className="fas fa-bee absolute inset-0 flex items-center justify-center text-white text-4xl drop-shadow-lg"></i>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">Welcome to Hive</h1>
          <p className="text-yellow-100 drop-shadow-md">Your AI-powered workspace</p>
        </div>

        {/* Login Form */}
        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <h2 className="text-2xl font-bold text-center text-white mb-6 drop-shadow-lg">Welcome Back</h2>
            
            <div>
              <label className="block text-yellow-100 text-sm font-semibold mb-2 drop-shadow-md" htmlFor="login-email">
                <i className="fas fa-envelope mr-2"></i>Email
              </label>
              <input 
                className="w-full px-4 py-3 rounded-xl border-2 border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white/90 text-gray-800" 
                id="login-email" 
                name="email"
                type="email" 
                required 
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label className="block text-yellow-100 text-sm font-semibold mb-2 drop-shadow-md" htmlFor="login-password">
                <i className="fas fa-lock mr-2"></i>Password
              </label>
              <input 
                className="w-full px-4 py-3 rounded-xl border-2 border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white/90 text-gray-800" 
                id="login-password" 
                name="password"
                type="password" 
                required 
                placeholder="Enter your password"
              />
            </div>
            
            <div className="flex items-center justify-between pt-4">
              <button 
                className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50" 
                type="submit"
                disabled={loading}
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
              
              <button 
                type="button"
                className="text-yellow-200 hover:text-white font-semibold transition-colors duration-300 drop-shadow-md" 
                onClick={() => setIsLogin(false)}
              >
                Create Account
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <h2 className="text-2xl font-bold text-center text-white mb-6 drop-shadow-lg">Join the Hive</h2>
            
            <div>
              <label className="block text-yellow-100 text-sm font-semibold mb-2 drop-shadow-md" htmlFor="reg-name">
                <i className="fas fa-user mr-2"></i>Name
              </label>
              <input 
                className="w-full px-4 py-3 rounded-xl border-2 border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white/90 text-gray-800" 
                id="reg-name" 
                name="name"
                type="text" 
                required 
                placeholder="Enter your name"
              />
            </div>
            
            <div>
              <label className="block text-yellow-100 text-sm font-semibold mb-2 drop-shadow-md" htmlFor="reg-email">
                <i className="fas fa-envelope mr-2"></i>Email
              </label>
              <input 
                className="w-full px-4 py-3 rounded-xl border-2 border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white/90 text-gray-800" 
                id="reg-email" 
                name="email"
                type="email" 
                required 
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label className="block text-yellow-100 text-sm font-semibold mb-2 drop-shadow-md" htmlFor="reg-password">
                <i className="fas fa-lock mr-2"></i>Password
              </label>
              <input 
                className="w-full px-4 py-3 rounded-xl border-2 border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white/90 text-gray-800" 
                id="reg-password" 
                name="password"
                type="password" 
                required 
                placeholder="Create a password"
              />
            </div>
            
            <div>
              <label className="block text-yellow-100 text-sm font-semibold mb-2 drop-shadow-md" htmlFor="reg-role">
                <i className="fas fa-briefcase mr-2"></i>Role
              </label>
              <select 
                className="w-full px-4 py-3 rounded-xl border-2 border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white/90 text-gray-800" 
                id="reg-role" 
                name="role"
                required
              >
                <option value="">Select your role</option>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between pt-4">
              <button 
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50" 
                type="submit"
                disabled={loading}
              >
                <i className="fas fa-user-plus mr-2"></i>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
              
              <button 
                type="button"
                className="text-yellow-200 hover:text-white font-semibold transition-colors duration-300 drop-shadow-md" 
                onClick={() => setIsLogin(true)}
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default AuthScreen
