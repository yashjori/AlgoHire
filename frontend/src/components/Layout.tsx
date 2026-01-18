import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { Code2, Home, FileText, Plus, LogOut, User } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/submissions', icon: FileText, label: 'My Submissions' },
    ...(user?.role === 'RECRUITER' ? [{ path: '/create-problem', icon: Plus, label: 'Create Problem' }] : []),
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="glass-strong border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <Code2 className="w-8 h-8 text-purple-400" />
              <span className="text-xl font-bold text-gradient">AlgoHire</span>
            </Link>

            <div className="flex items-center gap-6">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                )
              })}

              <div className="flex items-center gap-3 border-l border-white/10 pl-6">
                <div className="flex items-center gap-2 text-gray-300">
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline">{user?.name}</span>
                  <span className="text-xs bg-purple-600/30 px-2 py-1 rounded">
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

