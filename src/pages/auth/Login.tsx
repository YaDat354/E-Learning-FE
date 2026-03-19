import LoginForm from '../../components/auth/LoginForm.tsx'
import AuthShell from './AuthShell.tsx'
import type { AuthPageProps } from './types.ts'

type LoginProps = AuthPageProps & {
  onSwitchToRegister: () => void
}

function Login({ onLogin, onBack, onSwitchToRegister }: LoginProps) {
  return (
    <AuthShell
      title="Chào mừng bạn quay lại"
      subtitle="Đăng nhập để tiếp tục lộ trình học tiếng Anh của bạn"
      onBack={onBack}
    >
      <LoginForm onSwitchToRegister={onSwitchToRegister} onLogin={onLogin} />
    </AuthShell>
  )
}

export default Login