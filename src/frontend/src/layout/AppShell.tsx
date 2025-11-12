import { type LucideIcon, Menu } from 'lucide-react'
import { useState, useEffect } from 'react'
import clsx from 'clsx'

export type AppSection = 'analyze' | 'admin'

interface NavItem {
  id: AppSection
  label: string
  icon: LucideIcon
}

interface AppShellProps {
  title: string
  subtitle?: string
  activeSection: AppSection
  onChangeSection: (section: AppSection) => void
  navItems: NavItem[]
  children: React.ReactNode
}

const AppShell: React.FC<AppShellProps> = ({
  title,
  subtitle,
  activeSection,
  onChangeSection,
  navItems,
  children,
}) => {
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : true))
  const [isExpanded, setIsExpanded] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024
      setIsDesktop(desktop)
      if (!desktop) {
        setIsExpanded(true)
        setIsMobileOpen(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isCollapsed = isDesktop && !isExpanded

  const navLabelClass = (collapsed: boolean) => clsx('truncate text-left', collapsed && 'lg:hidden')

  const navButtonClass = (active: boolean, collapsed: boolean) =>
    clsx(
      'group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ease-in-out',
      active ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
      collapsed && 'lg:justify-center lg:gap-0 lg:px-0 lg:py-2'
    )

  const iconWrapperClass = (active: boolean, collapsed: boolean) =>
    clsx(
      'flex h-9 w-9 flex-shrink-0 items-center justify-center text-slate-500 transition',
      active ? 'text-indigo-600' : 'group-hover:text-indigo-600',
      collapsed && 'lg:h-10 lg:w-10'
    )

  const toggleSidebar = () => {
    if (isDesktop) {
      setIsExpanded((prev) => !prev)
    } else {
      setIsMobileOpen((prev) => !prev)
    }
  }

  const handleNavigate = (section: AppSection) => {
    onChangeSection(section)
    if (!isDesktop) {
      setIsMobileOpen(false)
    }
  }

  const hasSubtitle = Boolean(subtitle && subtitle.trim().length > 0)

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {!isDesktop && isMobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/25"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-slate-200 bg-white shadow-lg transition-transform duration-300 ease-in-out lg:static',
          isDesktop
            ? isExpanded
              ? 'lg:w-72 lg:translate-x-0'
              : 'lg:w-20 lg:translate-x-0'
            : isMobileOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        )}
      >
        <div className={clsx('flex items-center py-6', isCollapsed ? 'justify-center px-3' : 'justify-start px-6')}>
          <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500 font-semibold text-white shadow-md">
            AA
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-6">
          <ul className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = item.id === activeSection
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={navButtonClass(active, isCollapsed)}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className={iconWrapperClass(active, isCollapsed)}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className={navLabelClass(isCollapsed)}>
                      {item.label}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col transition-all duration-300 ease-in-out">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={toggleSidebar}
            className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 shadow-sm transition hover:border-indigo-200 hover:text-indigo-500"
            aria-label={
              isDesktop
                ? isCollapsed
                  ? 'Expand navigation'
                  : 'Collapse navigation'
                : isMobileOpen
                ? 'Close navigation'
                : 'Open navigation'
            }
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className={clsx('flex flex-col', hasSubtitle && 'gap-0.5')}>
            <span className="text-xl font-semibold text-slate-900">{title}</span>
            {hasSubtitle && <span className="sr-only">{subtitle}</span>}
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-slate-50 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
          <div className="space-y-10" style={{ scrollBehavior: 'auto' }}>{children}</div>
        </main>
      </div>
    </div>
  )
}

export default AppShell
