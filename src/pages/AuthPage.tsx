import { useState } from 'react'
import AuthCard from '../components/auth/AuthCard.tsx'
import LoginForm from '../components/auth/LoginForm.tsx'
import RegisterForm from '../components/auth/RegisterForm.tsx'
import './AuthPage.css'

type AuthMode = 'login' | 'register'

function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login')

  const title = mode === 'login' ? 'Welcome Back' : 'Create Account'
  const subtitle =
    mode === 'login'
      ? 'Sign in to your account to continue learning'
      : 'Join today and start your learning journey'

  return (
    <main className="auth-page">
      <AuthCard title={title} subtitle={subtitle}>
        {mode === 'login' ? (
          <LoginForm onSwitchToRegister={() => setMode('register')} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setMode('login')} />
        )}
      </AuthCard>
    </main>
  )
}

export default AuthPage
