import React, { useState } from 'react'

interface QuestionnaireProps {
  onSubmit: (description: string) => Promise<void>
  showError: (message: string) => void
}

const Questionnaire: React.FC<QuestionnaireProps> = ({ onSubmit, showError }) => {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!description.trim() || description.length < 10) {
      showError('Please provide a description of at least 10 characters.')
      return
    }
    
    setLoading(true)
    
    try {
      await onSubmit(description.trim())
    } catch (error) {
      showError('Failed to submit questionnaire. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-2xl w-full shadow-2xl border-2 border-yellow-400">
        <div className="text-center mb-6">
          <div className="hexagon mx-auto mb-4 relative">
            <i className="fas fa-bee absolute inset-0 flex items-center justify-center text-white text-2xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Tell Us About Your Role</h2>
          <p className="text-yellow-100">
            Help us understand your role in the company and how you use AI so we can create better AI agents for you.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-yellow-100 text-sm font-semibold mb-2" htmlFor="user-description">
              <i className="fas fa-briefcase mr-2"></i>Your Role in the Company & How You Use AI
            </label>
            <textarea 
              id="user-description" 
              className="w-full px-4 py-3 rounded-xl border-2 border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white/90 text-gray-800 resize-none" 
              rows={4} 
              placeholder="Please describe your role in the company, what you tend to work on, and how you currently use or would like to use AI. For example: 'I'm a software engineer working on the frontend of our e-commerce platform. I tend to work on user experience improvements and payment integrations. I currently use AI for code reviews and debugging, and I'd like help with staying updated with the latest frontend technologies and generating test cases.'"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-sm text-yellow-200 mt-1">Minimum 10 characters required</p>
          </div>
          
          <div className="flex justify-center">
            <button 
              className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50" 
              type="submit"
              disabled={loading}
            >
              <i className="fas fa-check mr-2"></i>
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Questionnaire
