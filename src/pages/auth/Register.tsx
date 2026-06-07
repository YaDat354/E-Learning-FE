import RegisterForm from '../../components/auth/RegisterForm.tsx'
import AuthShell from './AuthShell.tsx'
import type { AuthPageProps } from './types.ts'

type RegisterProps = AuthPageProps & {
  onSwitchToLogin: () => void
}

function Register({ onBack, onSwitchToLogin, onRegister }: RegisterProps) {
  return (
    <AuthShell
      title="Tạo tài khoản"
      subtitle="Tạo tài khoản để bắt đầu học và trải nghiệm bài học demo"
      onBack={onBack}
    >
      <RegisterForm onSwitchToLogin={onSwitchToLogin} onRegister={onRegister} />
    </AuthShell>
  )
}

export default Register