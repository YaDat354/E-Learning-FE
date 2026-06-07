import { useState } from "react"
import "./RegisterForm.css"

type RegisterFormProps = {
  onSwitchToLogin: () => void
  onRegister: (fullName: string, email: string, password: string) => Promise<void>
}

function RegisterForm({ onSwitchToLogin, onRegister }: RegisterFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ thông tin đăng ký.')
      return
    }

    if (password.length < 6) {
      setError('Mật khẩu cần tối thiểu 6 ký tự.')
      return
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    setError("")
    setIsSubmitting(true)

    try {
      await onRegister(name.trim(), email.trim().toLowerCase(), password)
    } catch {
      setError('Đăng ký thất bại. Email có thể đã tồn tại hoặc dữ liệu chưa hợp lệ.')
      return
    } finally {
      setIsSubmitting(false)
    }

    onSwitchToLogin()
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
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <label htmlFor="register-confirm-password" className="register-label">Xác nhận mật khẩu</label>
      <input
        id="register-confirm-password"
        type="password"
        className="register-input"
        placeholder="Nhập lại mật khẩu"
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
      />
      {error && <p className="register-inline-note" style={{ color: '#dc2626', marginTop: 8 }}>{error}</p>}
      <button type="submit" className="register-submit-button" disabled={isSubmitting}>
        {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
      </button>
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