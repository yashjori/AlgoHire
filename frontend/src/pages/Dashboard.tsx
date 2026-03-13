import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Code2, Clock, TrendingUp, Trophy, ArrowRight, Zap, Target,
  Search, Filter, SlidersHorizontal, CheckCircle2
} from 'lucide-react'
import { problemApi, Problem } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const difficultyBadges = {
  EASY:   'bg-green-500/20 text-green-400 border-green-500/30',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  HARD:   'bg-red-500/20 text-red-400 border-red-500/30',
}

type Difficulty = 'ALL' | 'EASY' | 'MEDIUM' | 'HARD'

export default function Dashboard() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [diffFilter, setDiffFilter] = useState<Difficulty>('ALL')
  const [tagFilter, setTagFilter] = useState<string>('ALL')
  const { user } = useAuthStore()

  const isRecruiter = user?.role === 'RECRUITER'

  useEffect(() => { loadProblems() }, [])

  const loadProblems = async () => {
    try {
      setProblems(await problemApi.getAll())
    } catch {
      toast.error('Failed to load problems')
    } finally {
      setLoading(false)
    }
  }

  // Collect all unique tags
  const allTags = Array.from(new Set(problems.flatMap(p => p.tags ?? [])))

  const filtered = problems.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase())
    const matchDiff = diffFilter === 'ALL' || p.difficulty === diffFilter
    const matchTag = tagFilter === 'ALL' || (p.tags ?? []).includes(tagFilter)
    return matchSearch && matchDiff && matchTag
  })

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <h1 className="text-5xl font-bold text-gradient mb-3">
          {isRecruiter ? 'Problem Management' : 'Master Algorithms'}
        </h1>
        <p className="text-lg text-gray-300">
          {isRecruiter ? 'Create, manage, and track candidate performance' : 'Solve challenges, climb the leaderboard, get hired'}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total', value: problems.length, icon: <Code2 className="w-6 h-6 text-purple-400" />, color: 'text-purple-400' },
          { label: 'Easy', value: problems.filter(p => p.difficulty === 'EASY').length, icon: <CheckCircle2 className="w-6 h-6 text-green-400" />, color: 'text-green-400' },
          { label: 'Medium', value: problems.filter(p => p.difficulty === 'MEDIUM').length, icon: <TrendingUp className="w-6 h-6 text-yellow-400" />, color: 'text-yellow-400' },
          { label: 'Hard', value: problems.filter(p => p.difficulty === 'HARD').length, icon: <Target className="w-6 h-6 text-red-400" />, color: 'text-red-400' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass rounded-2xl p-5 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">{stat.icon}<Zap className="w-4 h-4 text-gray-600" /></div>
            <h3 className={`text-3xl font-bold mb-1 ${stat.color}`}>{stat.value}</h3>
            <p className="text-gray-400 text-sm">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search problems…"
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map(d => (
            <button key={d} onClick={() => setDiffFilter(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                diffFilter === d ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              {d}
            </button>
          ))}
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
            <select value={tagFilter} onChange={e => setTagFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none">
              <option value="ALL">All Tags</option>
              {allTags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Problem Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Code2 className="w-6 h-6 text-purple-400" /> Problems
            <span className="text-sm text-gray-500 font-normal">({filtered.length})</span>
          </h2>
          {isRecruiter && (
            <Link to="/create-problem" className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-semibold transition-colors">
              + New Problem
            </Link>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Code2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-400 text-lg">{problems.length === 0 ? 'No problems yet' : 'No problems match your filters'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((problem, index) => (
              <motion.div key={problem.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.05, 0.5) }}
                whileHover={{ y: -6, scale: 1.01 }} className="glass rounded-2xl p-5 hover:shadow-2xl transition-all group flex flex-col">

                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors pr-2 line-clamp-2">
                    {problem.title}
                  </h3>
                  <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${difficultyBadges[problem.difficulty]}`}>
                    {problem.difficulty}
                  </span>
                </div>

                <p className="text-gray-400 text-sm mb-3 line-clamp-2 flex-1">{problem.description}</p>

                {/* Tags */}
                {problem.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {problem.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-purple-600/15 border border-purple-500/20 rounded-full text-purple-300">{tag}</span>
                    ))}
                    {problem.tags.length > 3 && <span className="text-xs text-gray-500">+{problem.tags.length - 3}</span>}
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{problem.timeLimitMs}ms</span>
                  <span>{problem.memoryLimitMb}MB</span>
                </div>

                <div className="pt-3 border-t border-white/10">
                  {isRecruiter ? (
                    <Link to={`/leaderboard/${problem.id}`}
                      className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 font-semibold text-sm transition-colors">
                      <Trophy className="w-4 h-4" /> View Leaderboard <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <Link to={`/problem/${problem.id}`}
                      className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-semibold text-sm transition-colors">
                      Solve Challenge <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
