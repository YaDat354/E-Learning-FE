import './LoginForm.css'

type LoginFormProps = {
  onSwitchToRegister: () => void
}

function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  return (
    <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="login-email" className="auth-label">
        Email
      </label>
      <input
        id="login-email"
        type="email"
        className="auth-input"
        placeholder="Enter your email"
      />

      <label htmlFor="login-password" className="auth-label">
        Password
      </label>
      <input
        id="login-password"
        type="password"
        className="auth-input"
        placeholder="Enter your password"
      />

      <button type="button" className="auth-forgot-link">
        Forgot password?
      </button>

      <button type="submit" className="auth-submit-button">
        Sign In
      </button>

      <p className="auth-inline-note">
        Don't have an account?{' '}
        <button type="button" className="auth-inline-link" onClick={onSwitchToRegister}>
          Sign up
        </button>
      </p>
    </form>
  )
}

export default LoginForm
