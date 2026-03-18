import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
}

function Input({ id, label, hint, className = '', ...props }: InputProps) {
  return (
    <div className="ui-input-wrap">
      {label ? <label htmlFor={id}>{label}</label> : null}
      <input id={id} className={`ui-input ${className}`.trim()} {...props} />
      {hint ? <small>{hint}</small> : null}
    </div>
  )
}

export default Input
