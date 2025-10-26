import React, { useState, useEffect } from 'react'
import AuthScreen from './components/AuthScreen'
import Questionnaire from './components/Questionnaire'
import ChatbotInterface from './components/ChatbotInterface'
import AdminConsole from './components/AdminConsole'
import { useAuth } from './hooks/useAuth'
import { useNotification } from './hooks/useNotification'

function App() {
  const { user, token, login, register, logout, updateDescription } = useAuth()
  const { showSuccess, showError, NotificationContainer } = useNotification()
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [showAdminConsole, setShowAdminConsole] = useState(false)

  useEffect(() => {
    if (user && !user.description) {
      setShowQuestionnaire(true)
    }
  }, [user])

  const handleQuestionnaireSubmit = async (description: string) => {
    try {
      await updateDescription(description)
      showSuccess('Questionnaire submitted successfully!')
      setShowQuestionnaire(false)
    } catch (error) {
      showError('Failed to submit questionnaire. Please try again.')
    }
  }

  if (!user) {
    return (
      <AuthScreen 
        onLogin={login}
        onRegister={register}
        showError={showError}
      />
    )
  }

  if (showQuestionnaire) {
    return (
      <Questionnaire 
        onSubmit={handleQuestionnaireSubmit}
        showError={showError}
      />
    )
  }

  if (!token) return null

  return (
    <>
      <ChatbotInterface 
        user={user}
        token={token}
        onLogout={logout}
        onShowAdminConsole={() => setShowAdminConsole(true)}
      />
      
      {showAdminConsole && (
        <AdminConsole 
          onClose={() => setShowAdminConsole(false)}
          token={token}
          showSuccess={showSuccess}
          showError={showError}
        />
      )}
      
      <NotificationContainer />
    </>
  )
}

export default App
