export type AuthPageProps = {
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (fullName: string, email: string, password: string) => Promise<void>
  onBack: () => void
}