import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
}

function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const buttonClass = `ui-button ui-button-${variant} ${className}`.trim()
  return <button className={buttonClass} {...props} />
}

export default Button
