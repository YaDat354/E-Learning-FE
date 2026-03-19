import type { ReactNode } from 'react'
import AuthCard from '../../components/auth/AuthCard.tsx'
import '../AuthPage.css'

type Props = {
  title: string
  subtitle: string
  onBack: () => void
  children: ReactNode
}

function AuthShell({ title, subtitle, onBack, children }: Props) {
  return (
    <main className="auth-page">
      <button className="auth-back-button" onClick={onBack}>
        Về trang chủ
      </button>
      <AuthCard title={title} subtitle={subtitle}>
        {children}
      </AuthCard>
    </main>
  )
}

export default AuthShell