export type AuthPageProps = {
  onLogin: (email: string, password: string) => Promise<void>
  onBack: () => void
}