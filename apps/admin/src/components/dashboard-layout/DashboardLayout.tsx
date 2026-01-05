import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { clearAuthTokens } from '../../utils/auth'
import './dashboard-layout.css'

type DashboardLayoutProps = {
  children: React.ReactNode
}

const menuItems = [
  {
    key: 'home',
    label: '首页',
    description: '概览关键指标',
    path: '/home',
  },
  {
    key: 'posts',
    label: '帖子管理',
    description: '管理文章与发布节奏',
    path: '/posts',
  },
  {
    key: 'tags',
    label: '标签管理',
    description: '整理标签与分类关系',
    path: '/tags',
  },
]

const profile = {
  name: 'Guolei Gao',
  email: 'guolei@example.com',
}

function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  const activeKey = useMemo(() => {
    const activeItem = menuItems.find((item) =>
      location.pathname.startsWith(item.path)
    )

    return activeItem?.key ?? 'home'
  }, [location.pathname])

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isProfileMenuOpen])

  const handleLogout = () => {
    clearAuthTokens()
    navigate('/login', { replace: true })
  }

  const handleNavigate = (path: string) => {
    if (location.pathname !== path) {
      navigate(path)
    }
  }

  return (
    <div className="dashboard">
      <div className="dashboard-background" aria-hidden="true" />
      <div className="dashboard-shell">
        <header className="dashboard-header">
          <div className="dashboard-brand">
            <div className="dashboard-mark" aria-hidden="true">
              GL
            </div>
            <div>
              <div className="dashboard-title">GL Blog 后台</div>
              <div className="dashboard-subtitle">内容管理中心</div>
            </div>
          </div>
          <div className="dashboard-actions">
            <div className="profile-chip" ref={menuRef}>
              <div className="profile-avatar" aria-hidden="true">
                {profile.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="profile-chip-info">
                <div className="profile-chip-name">{profile.name}</div>
                <div className="profile-chip-email">{profile.email}</div>
              </div>
              <button
                className="profile-menu-toggle"
                type="button"
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
                aria-controls="profile-menu"
                onClick={() =>
                  setIsProfileMenuOpen((current) => !current)
                }
              >
                ⋯
              </button>
              {isProfileMenuOpen && (
                <div className="profile-menu" id="profile-menu" role="menu">
                  <button
                    type="button"
                    className="profile-menu-item"
                    role="menuitem"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    修改资料
                  </button>
                </div>
              )}
              <button
                className="dashboard-logout"
                type="button"
                onClick={handleLogout}
              >
                退出登录
              </button>
            </div>
          </div>
        </header>

        <div className="dashboard-body">
          <nav className="dashboard-nav" aria-label="Main menu">
            <div className="dashboard-nav-title">管理菜单</div>
            {menuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`dashboard-nav-item ${activeKey === item.key ? 'active' : ''}`}
                onClick={() => handleNavigate(item.path)}
              >
                <span className="nav-label">{item.label}</span>
                <span className="nav-description">{item.description}</span>
              </button>
            ))}
          </nav>

          <main className="dashboard-main">{children}</main>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
