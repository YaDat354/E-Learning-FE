import { useState } from 'react'
import Login from './auth/Login.tsx'
import Register from './auth/Register.tsx'
import type { AuthPageProps } from './auth/types.ts'

type AuthMode = 'login' | 'register'

function AuthPage({ onLogin, onBack }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login')

  if (mode === 'login') {
    return <Login onLogin={onLogin} onBack={onBack} onSwitchToRegister={() => setMode('register')} />
  }

  return <Register onLogin={onLogin} onBack={onBack} onSwitchToLogin={() => setMode('login')} />
}

export default AuthPage
