import './RegisterForm.css'

type RegisterFormProps = {
  onSwitchToLogin: () => void
}

function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  return (
    <form className="register-form" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="register-name" className="register-label">
        Full Name
      </label>
      <input
        id="register-name"
        type="text"
        className="register-input"
        placeholder="Enter your full name"
      />

      <label htmlFor="register-email" className="register-label">
        Email
      </label>
      <input
        id="register-email"
        type="email"
        className="register-input"
        placeholder="Enter your email"
      />

      <label htmlFor="register-password" className="register-label">
        Password
      </label>
      <input
        id="register-password"
        type="password"
        className="register-input"
        placeholder="Create a password"
      />

      <button type="submit" className="register-submit-button">
        Sign Up
      </button>

      <p className="register-inline-note">
        Already have an account?{' '}
        <button type="button" className="register-inline-link" onClick={onSwitchToLogin}>
          Sign in
        </button>
      </p>
    </form>
  )
}

export default RegisterForm
