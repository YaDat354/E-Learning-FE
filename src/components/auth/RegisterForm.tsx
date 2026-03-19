import { useState } from "react"
import "./RegisterForm.css"

type RegisterFormProps = {
  onSwitchToLogin: () => void
  onLogin: (name: string, email: string) => void
}

function RegisterForm({ onSwitchToLogin, onLogin }: RegisterFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin(name || "Học viên", email || "user@example.com")
  }

  return (
    <form className="register-form" onSubmit={handleSubmit}>
      <label htmlFor="register-name" className="register-label">Họ và tên</label>
      <input
        id="register-name"
        type="text"
        className="register-input"
        placeholder="Nhập họ và tên"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <label htmlFor="register-email" className="register-label">Email</label>
      <input
        id="register-email"
        type="email"
        className="register-input"
        placeholder="Nhập email của bạn"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <label htmlFor="register-password" className="register-label">Mật khẩu</label>
      <input
        id="register-password"
        type="password"
        className="register-input"
        placeholder="Tạo mật khẩu"
      />
      <button type="submit" className="register-submit-button">Đăng ký</button>
      <p className="register-inline-note">
        {"Bạn đã có tài khoản? "}
        <button type="button" className="register-inline-link" onClick={onSwitchToLogin}>
          Đăng nhập
        </button>
      </p>
    </form>
  )
}

export default RegisterForm