import { useState } from 'react'
import AuthCard from '../components/auth/AuthCard.tsx'
import LoginForm from '../components/auth/LoginForm.tsx'
import RegisterForm from '../components/auth/RegisterForm.tsx'
import './AuthPage.css'

type AuthMode = 'login' | 'register'

type AuthPageProps = {
  onLogin: (name: string, email: string) => void
  onBack: () => void
}

function AuthPage({ onLogin, onBack }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login')

  const title = mode === 'login' ? 'Chào mừng bạn quay lại' : 'Tạo tài khoản'
  const subtitle =
    mode === 'login'
      ? 'Đăng nhập để tiếp tục lộ trình học tiếng Anh của bạn'
      : 'Tạo tài khoản để bắt đầu học và trải nghiệm bài học demo'

  return (
    <main className="auth-page">
      <button
        onClick={onBack}
        style={{
          position: 'fixed', top: 16, left: 20, background: '#fff',
          border: '1px solid #d5dee9', borderRadius: 9, padding: '7px 14px',
          fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#1f2b3a',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)', zIndex: 100,
        }}
      >
        Về trang chủ
      </button>
      <AuthCard title={title} subtitle={subtitle}>
        {mode === 'login' ? (
          <LoginForm
            onSwitchToRegister={() => setMode('register')}
            onLogin={onLogin}
          />
        ) : (
          <RegisterForm
            onSwitchToLogin={() => setMode('login')}
            onLogin={onLogin}
          />
        )}
      </AuthCard>
    </main>
  )
}

export default AuthPage
