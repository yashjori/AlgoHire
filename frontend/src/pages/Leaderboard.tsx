import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Trophy,
  Medal,
  Award,
  ArrowLeft,
  Clock,
  User,
} from 'lucide-react'
import {
  leaderboardApi,
  problemApi,
  LeaderboardEntry,
  Problem,
} from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const rankIcons = {
  1: Trophy,
  2: Medal,
  3: Award,
}

const rankColors = {
  1: 'from-yellow-400 to-yellow-600',
  2: 'from-gray-300 to-gray-500',
  3: 'from-orange-400 to-orange-600',
}

export default function Leaderboard() {
  const { problemId } = useParams<{ problemId: string }>()
  const { user } = useAuthStore()

  const isRecruiter = user?.role === 'RECRUITER'
  const isCandidate = user?.role === 'CANDIDATE'

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!problemId) return
    loadAll()
  }, [problemId])

  const loadAll = async () => {
    try {
      setLoading(true)
      await Promise.all([loadLeaderboard(), loadProblem()])
    } finally {
      setLoading(false)
    }
  }

  const loadLeaderboard = async () => {
    try {
      if (!problemId) return
      const data = await leaderboardApi.getByProblemId(problemId)
      setLeaderboard(data)
    } catch {
      toast.error('Failed to load leaderboard')
    }
  }

  const loadProblem = async () => {
    try {
      if (!problemId) return
      const data = await problemApi.getById(problemId)
      setProblem(data)
    } catch {
      // Non-blocking
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to={problemId ? `/problem/${problemId}` : '/'}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Problem
      </Link>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Leaderboard
            </h1>
            {problem && (
              <p className="text-gray-400 mt-1">
                {problem.title}
              </p>
            )}
            {isRecruiter && (
              <p className="text-xs text-purple-400 mt-1">
                Recruiter view (read-only)
              </p>
            )}
          </div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-400 text-lg">
              No submissions yet
            </p>
            {isCandidate && (
              <p className="text-gray-500 text-sm mt-2">
                Be the first to solve this problem!
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((entry, index) => {
              const RankIcon =
                rankIcons[entry.rank as keyof typeof rankIcons]
              const isTopThree = entry.rank <= 3

              return (
                <motion.div
                  key={`${entry.email}-${entry.rank}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className={`glass rounded-xl p-6 flex items-center justify-between ${
                    isTopThree
                      ? 'border-2 border-yellow-500/40'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        isTopThree
                          ? `bg-gradient-to-br ${
                              rankColors[
                                entry.rank as keyof typeof rankColors
                              ]
                            } text-white`
                          : 'bg-white/10 text-gray-300'
                      }`}
                    >
                      {RankIcon ? (
                        <RankIcon className="w-6 h-6" />
                      ) : (
                        entry.rank
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-white font-semibold">
                          {entry.email}
                        </span>
                        {isTopThree && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                            Top {entry.rank}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {entry.executionTimeMs}ms
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      #{entry.rank}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
