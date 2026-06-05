import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { ROLE_LABELS } from '../../domain/index.ts'
import type { User } from '../../domain/index.ts'
import { getMe, updateMe } from '../../services/userService.ts'

type Props = {
  user: User
  onUserUpdated?: (user: User) => void
  onBackToDashboard: () => void
  onLogout: () => void
}

function TeacherProfile({ user, onUserUpdated, onBackToDashboard, onLogout }: Props) {
  const [fullName, setFullName] = useState(user.name)
  const [avatar, setAvatar] = useState('')
  const [email, setEmail] = useState(user.email)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let mounted = true

    const loadProfile = async () => {
      setIsLoading(true)
      setError('')

      try {
        const profile = await getMe()
        if (!mounted) {
          return
        }

        setFullName(profile.name)
        setEmail(profile.email)
        setAvatar(profile.avatar ?? '')
        onUserUpdated?.({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
        })
      } catch (loadError) {
        if (!mounted) {
          return
        }

        if (axios.isAxiosError(loadError) && loadError.response?.status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        } else {
          setError('Không thể tải hồ sơ giảng viên từ backend.')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      mounted = false
    }
  }, [onUserUpdated])

  const initials = useMemo(
    () => fullName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    [fullName],
  )

  const avatarPreview = useMemo(() => {
    const value = avatar.trim()
    return value.length > 0 ? value : ''
  }, [avatar])

  const handleSave = async () => {
    const trimmedName = fullName.trim()
    const trimmedAvatar = avatar.trim()

    if (!trimmedName) {
      setError('Họ tên không được để trống.')
      setSuccess('')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const updated = await updateMe({
        fullName: trimmedName,
        avatar: trimmedAvatar || undefined,
      })

      setFullName(updated.name)
      setEmail(updated.email)
      setAvatar(updated.avatar ?? '')
      onUserUpdated?.({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
      })
      setSuccess('Cập nhật hồ sơ thành công.')
    } catch (saveError) {
      if (axios.isAxiosError(saveError) && saveError.response?.status === 400) {
        setError('Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại.')
      } else {
        setError('Không thể cập nhật hồ sơ. Vui lòng thử lại.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="teacher-page">
      <div className="teacher-shell">
        <header className="teacher-header">
          <div>
            <h1 className="teacher-title">Hồ sơ giảng viên</h1>
            <p className="teacher-subtitle">Quản lý thông tin tài khoản và nhận diện giảng viên</p>
          </div>
          <div className="teacher-toolbar">
            <button className="teacher-btn ghost" onClick={onBackToDashboard}>Về Dashboard</button>
            <button className="teacher-btn danger" onClick={onLogout}>Đăng xuất</button>
          </div>
        </header>

        <section className="teacher-panel">
          {isLoading && <div className="teacher-list-meta" style={{ marginBottom: 12 }}>Đang tải hồ sơ...</div>}
          {error && <div className="teacher-list-meta" style={{ marginBottom: 12, color: '#dc2626' }}>{error}</div>}
          {success && <div className="teacher-list-meta" style={{ marginBottom: 12, color: '#059669' }}>{success}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, alignItems: 'start', marginBottom: 16 }}>
            <div>
              {avatarPreview ? (
                <img src={avatarPreview} alt={fullName} style={{ width: 96, height: 96, borderRadius: 999, objectFit: 'cover', border: '1px solid #dbe3f0' }} />
              ) : (
                <div style={{ width: 96, height: 96, borderRadius: 999, background: '#0f766e', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 28 }}>
                  {initials || 'GV'}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <div className="teacher-list-title">{fullName || 'Giảng viên'}</div>
              <div className="teacher-list-meta">{email}</div>
              <div className="teacher-list-meta">Vai trò: {ROLE_LABELS[user.role]}</div>
            </div>
          </div>

          <div className="teacher-form-grid" style={{ maxWidth: 720 }}>
            <div>
              <label className="teacher-form-label" htmlFor="teacher-full-name">Họ tên</label>
              <input
                id="teacher-full-name"
                className="teacher-input teacher-input-full"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                disabled={isLoading || isSaving}
              />
            </div>
            <div>
              <label className="teacher-form-label" htmlFor="teacher-avatar-url">Avatar URL</label>
              <input
                id="teacher-avatar-url"
                className="teacher-input teacher-input-full"
                value={avatar}
                onChange={(event) => setAvatar(event.target.value)}
                placeholder="https://..."
                disabled={isLoading || isSaving}
              />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label className="teacher-form-label" htmlFor="teacher-email">Email</label>
            <input id="teacher-email" className="teacher-input teacher-input-full" value={email} disabled readOnly style={{ maxWidth: 360 }} />
          </div>

          <div className="teacher-actions" style={{ marginTop: 16 }}>
            <button className="teacher-btn" onClick={() => void handleSave()} disabled={isLoading || isSaving}>
              {isSaving ? 'Đang lưu...' : 'Lưu hồ sơ'}
            </button>
          </div>
        </section>
      </div>
    </section>
  )
}

export default TeacherProfile
