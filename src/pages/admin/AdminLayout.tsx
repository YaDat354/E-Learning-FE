import type { ReactNode } from 'react'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import type { User } from '../../data/mockData.ts'
import './AdminLayout.css'

export type AdminActiveView = 'dashboard' | 'courses' | 'users' | 'create-course' | 'edit-course'

type Props = {
  user: User
  activeView: AdminActiveView
  onGoDashboard: () => void
  onGoCourses: () => void
  onGoUsers: () => void
  onLogout: () => void
  children: ReactNode
}

const NAV_ITEMS = [
  { key: 'dashboard' as const, icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { key: 'courses' as const, icon: <BookOpen size={18} />, label: 'Khóa học' },
  { key: 'users' as const, icon: <Users size={18} />, label: 'Người dùng' },
]

function AdminLayout({ user, activeView, onGoDashboard, onGoCourses, onGoUsers, onLogout, children }: Props) {
  const handlers: Record<string, () => void> = {
    dashboard: onGoDashboard,
    courses: onGoCourses,
    users: onGoUsers,
  }

  // create-course and edit-course both highlight 'courses'
  const highlight = activeView === 'create-course' || activeView === 'edit-course' ? 'courses' : activeView

  return (
    <div className="al-root">
      {/* ── Sidebar ── */}
      <aside className="al-sidebar">
        {/* Brand */}
        <div className="al-brand">
          <div className="al-logo">EL</div>
          <div>
            <div className="al-app-name">EnglishLearn</div>
            <div className="al-app-role">Quản trị viên</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="al-nav">
          <div className="al-nav-label">Menu</div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`al-nav-btn${highlight === item.key ? ' al-nav-btn--active' : ''}`}
              onClick={handlers[item.key]}
            >
              <span className="al-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        <div className="al-sidebar-divider" />

        {/* User info */}
        <div className="al-user">
          <div className="al-user-avatar">{user.name.slice(0, 2).toUpperCase()}</div>
          <div className="al-user-info">
            <div className="al-user-name">{user.name}</div>
            <div className="al-user-email">{user.email}</div>
          </div>
        </div>

        {/* Role badge */}
        <div className="al-role-badge">
          <ShieldCheck size={13} />
          <span>Admin</span>
        </div>

        {/* Logout */}
        <button className="al-logout-btn" onClick={onLogout}>
          <LogOut size={15} />
          <span>Đăng xuất</span>
        </button>
      </aside>

      {/* ── Main ── */}
      <main className="al-main">
        {children}
      </main>
    </div>
  )
}

export default AdminLayout
