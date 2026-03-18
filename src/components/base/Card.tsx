import type { ReactNode } from 'react'

type CardProps = {
  title?: string
  subtitle?: string
  children?: ReactNode
}

function Card({ title, subtitle, children }: CardProps) {
  return (
    <article className="ui-card">
      {title ? <h2>{title}</h2> : null}
      {subtitle ? <p className="ui-card-subtitle">{subtitle}</p> : null}
      <div className="ui-card-content">{children}</div>
    </article>
  )
}

export default Card
