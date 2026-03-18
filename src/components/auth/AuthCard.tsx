import type { ReactNode } from 'react'
import './AuthCard.css'

type AuthCardProps = {
  title: string
  subtitle: string
  children: ReactNode
}

function AuthCard({
  title,
  subtitle,
  children,
}: AuthCardProps) {
  return (
    <section className="auth-card" aria-label={title}>
      <div className="auth-card-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="auth-card-icon-svg">
          <path d="M3 5.5C3 4.67 3.67 4 4.5 4h6.25c.48 0 .94.13 1.34.36.4-.23.86-.36 1.34-.36H20c.55 0 1 .45 1 1v13c0 .55-.45 1-1 1h-6.57c-.53 0-1.03.2-1.43.56A2.15 2.15 0 0 0 10.57 19H4.5A1.5 1.5 0 0 1 3 17.5v-12zM11 18V6.1a1.2 1.2 0 0 0-.75-.1H4.8a.3.3 0 0 0-.3.3v11.2c0 .28.22.5.5.5H11zm2 0h6V6h-5.45a1.2 1.2 0 0 0-.55.14V18z" />
        </svg>
      </div>

      <h1>{title}</h1>
      <p className="auth-card-subtitle">{subtitle}</p>

      {children}
    </section>
  )
}

export default AuthCard
