import type { User } from '../domain/index.ts'

export function inferRoleFromEmail(email: string): User['role'] {
  const normalizedEmail = email.toLowerCase()

  if (normalizedEmail.startsWith('admin@') || normalizedEmail.includes('.admin@')) {
    return 'admin'
  }

  if (normalizedEmail.startsWith('gv@') || normalizedEmail.startsWith('teacher@') || normalizedEmail.includes('.teacher@')) {
    return 'teacher'
  }

  return 'student'
}