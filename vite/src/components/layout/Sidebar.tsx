import { NavLink } from 'react-router-dom'
import { useI18n } from '../../providers/I18nProvider'
import {
  LayoutDashboard,
  FolderKanban,
  Images,
  Tags,
  Bookmark,
  FileText,
  File,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../providers/AuthProvider'

const navItems = [
  { to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/projects', icon: FolderKanban, labelKey: 'nav.projects' },
  { to: '/media', icon: Images, labelKey: 'nav.media' },
  { to: '/categories', icon: Bookmark, labelKey: 'nav.categories' },
  { to: '/tags', icon: Tags, labelKey: 'nav.tags' },
  { to: '/posts', icon: FileText, labelKey: 'nav.posts' },
  { to: '/pages', icon: File, labelKey: 'nav.pages' },
]

export function Sidebar() {
  const { t } = useI18n()
  const { logout } = useAuth()

  return (
    <aside className="w-64 border-r bg-card h-screen flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold">{t('app.name')}</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm w-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          {t('nav.logout')}
        </button>
      </div>
    </aside>
  )
}
