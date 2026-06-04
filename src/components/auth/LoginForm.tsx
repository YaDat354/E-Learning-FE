import { useState } from "react"
import "./LoginForm.css"

type LoginFormProps = {
  onSwitchToRegister: () => void
  onLogin: (email: string, password: string) => Promise<void>
}

function LoginForm({ onSwitchToRegister, onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu")
      return
    }

    setError("")
    setIsSubmitting(true)

    try {
      await onLogin(email, password)
    } catch {
      setError("Đăng nhập thất bại. Vui lòng kiểm tra tài khoản hoặc mật khẩu.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label htmlFor="login-email" className="auth-label">Email</label>
      <input
        id="login-email"
        type="email"
        className="auth-input"
        placeholder="Nhập email của bạn"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <label htmlFor="login-password" className="auth-label">Mật khẩu</label>
      <input
        id="login-password"
        type="password"
        className="auth-input"
        placeholder="Nhập mật khẩu"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      {error && <p className="auth-inline-note" style={{ color: '#dc2626', marginTop: 8 }}>{error}</p>}
      <button type="button" className="auth-forgot-link">Quên mật khẩu?</button>
      <button type="submit" className="auth-submit-button" disabled={isSubmitting}>
        {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
      <p className="auth-inline-note">
        {"Bạn chưa có tài khoản? "}
        <button type="button" className="auth-inline-link" onClick={onSwitchToRegister}>
          Đăng ký
        </button>
      </p>
    </form>
  )
}

export default LoginForm