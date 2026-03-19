import { useState } from "react"
import "./LoginForm.css"

type LoginFormProps = {
  onSwitchToRegister: () => void
  onLogin: (name: string, email: string) => void
}

function LoginForm({ onSwitchToRegister, onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = email.split("@")[0] || "Học viên"
    onLogin(name, email || "user@example.com")
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
      />
      <button type="button" className="auth-forgot-link">Quên mật khẩu?</button>
      <button type="submit" className="auth-submit-button">Đăng nhập</button>
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