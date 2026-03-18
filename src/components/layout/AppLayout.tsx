import type { ReactNode } from 'react'
import Navbar from './Navbar.tsx'
import Sidebar from './Sidebar.tsx'
import Footer from './Footer.tsx'

type AppLayoutProps = {
  children: ReactNode
}

function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-main">
        <Sidebar />
        <main className="content-area">{children}</main>
      </div>
      <Footer />
    </div>
  )
}

export default AppLayout
