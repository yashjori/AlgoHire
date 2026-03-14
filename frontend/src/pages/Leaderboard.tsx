import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Trophy, Medal, Award, ArrowLeft, Clock, User
} from 'lucide-react'
import { leaderboardApi, problemApi, LeaderboardEntry, Problem } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const RANK_ICONS: Record<number, typeof Trophy> = { 1: Trophy, 2: Medal, 3: Award }
const RANK_COLORS: Record<number, string> = {
  1: 'from-yellow-400 to-yellow-600',
  2: 'from-gray-300 to-gray-500',
  3: 'from-orange-400 to-orange-600',
}

const LANG_COLORS: Record<string, string> = {
  JAVA:       'bg-orange-500/20 text-orange-300',
  PYTHON:     'bg-blue-500/20 text-blue-300',
  CPP:        'bg-purple-500/20 text-purple-300',
  JAVASCRIPT: 'bg-yellow-500/20 text-yellow-300',
  TYPESCRIPT: 'bg-cyan-500/20 text-cyan-300',
  GO:         'bg-teal-500/20 text-teal-300',
  RUST:       'bg-red-500/20 text-red-300',
}

export default function Leaderboard() {
  const { problemId } = useParams<{ problemId: string }>()
  const { user } = useAuthStore()
  const isRecruiter = user?.role === 'RECRUITER'

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!problemId) return
    Promise.all([
      leaderboardApi.getByProblemId(problemId).then(setLeaderboard).catch(() => toast.error('Failed to load leaderboard')),
      problemApi.getById(problemId).then(setProblem).catch(() => {})
    ]).finally(() => setLoading(false))
  }, [problemId])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to={problemId ? `/problem/${problemId}` : '/'} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Problem
      </Link>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
            {problem && <p className="text-gray-400 text-sm mt-0.5">{problem.title}</p>}
            {isRecruiter && <p className="text-xs text-purple-400 mt-1">Recruiter view — all accepted solutions</p>}
          </div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-14 h-14 mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400 text-lg">No submissions yet</p>
            {user?.role === 'CANDIDATE' && (
              <Link to={`/problem/${problemId}`} className="inline-block mt-4 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-semibold transition-colors">
                Be the first to solve it!
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, i) => {
              const RankIcon = RANK_ICONS[entry.rank]
              const isTop = entry.rank <= 3
              const isMe = entry.email === user?.email
              const langClass = LANG_COLORS[(entry.language ?? '').toUpperCase()] ?? 'bg-gray-500/20 text-gray-300'

              return (
                <motion.div key={`${entry.email}-${entry.rank}`}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className={`rounded-xl p-4 flex items-center gap-4 border transition-all
                    ${isMe ? 'border-purple-500/60 bg-purple-500/10' : isTop ? 'border-yellow-500/30 glass' : 'border-white/5 glass'}`}>

                  {/* Rank badge */}
                  <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold
                    ${isTop ? `bg-gradient-to-br ${RANK_COLORS[entry.rank]} text-white` : 'bg-white/10 text-gray-400'}`}>
                    {RankIcon ? <RankIcon className="w-5 h-5" /> : <span className="text-sm">{entry.rank}</span>}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-white font-semibold text-sm truncate">{entry.email}</span>
                      {isMe && <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full">You</span>}
                      {isTop && <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">Top {entry.rank}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />{entry.executionTimeMs}ms
                      </span>
                      {entry.language && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${langClass}`}>
                          {entry.language}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xl font-bold text-gray-400 shrink-0">#{entry.rank}</div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
