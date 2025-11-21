import { type ReactNode } from 'react'

interface SimpleLayoutProps {
  title: string
  children: ReactNode
}

/**
 * Simple layout without navigation - for single-page apps
 */
const SimpleLayout: React.FC<SimpleLayoutProps> = ({ title, children }) => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 flex h-16 items-center border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500 font-semibold text-white shadow-md">
            AA
          </span>
          <span className="text-xl font-semibold text-slate-900">{title}</span>
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-slate-50 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <div className="space-y-10" style={{ scrollBehavior: 'auto' }}>{children}</div>
      </main>
    </div>
  )
}

export default SimpleLayout

