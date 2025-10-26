import React, { useState } from 'react'

interface Notification {
  id: string
  message: string
  type: 'success' | 'error'
}

export const useNotification = (): {
  showSuccess: (message: string) => void
  showError: (message: string) => void
  NotificationContainer: React.FC
} => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const showNotification = (message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).substr(2, 9)
    const notification = { id, message, type }
    
    setNotifications(prev => [...prev, notification])
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 3000)
  }

  const showSuccess = (message: string) => showNotification(message, 'success')
  const showError = (message: string) => showNotification(message, 'error')

  const NotificationContainer: React.FC = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full animate-slide-in ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}
        >
          <div className="flex items-center">
            <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
            <span>{notification.message}</span>
          </div>
        </div>
      ))}
    </div>
  )

  return {
    showSuccess,
    showError,
    NotificationContainer
  }
}