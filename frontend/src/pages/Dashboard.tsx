import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Code2, Clock, TrendingUp, Trophy, ArrowRight, Zap, Target } from 'lucide-react'
import { problemApi, Problem } from '../services/api'
import toast from 'react-hot-toast'


const difficultyBadges = {
  EASY: 'bg-green-500/20 text-green-400 border-green-500/30',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  HARD: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export default function Dashboard() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProblems()
  }, [])

  const loadProblems = async () => {
    try {
      const data = await problemApi.getAll()
      setProblems(data)
    } catch (error: any) {
      toast.error('Failed to load problems')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <motion.h1
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-6xl font-bold text-gradient mb-4"
        >
          Master Algorithms
        </motion.h1>
        <p className="text-xl text-gray-300 mb-8">
          Solve coding challenges and compete with the best
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6 hover:scale-105 transition-transform"
        >
          <div className="flex items-center justify-between mb-4">
            <Code2 className="w-8 h-8 text-purple-400" />
            <Zap className="w-6 h-6 text-yellow-400" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-2">{problems.length}</h3>
          <p className="text-gray-400">Total Problems</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6 hover:scale-105 transition-transform"
        >
          <div className="flex items-center justify-between mb-4">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-2">
            {problems.filter(p => p.difficulty === 'EASY').length}
          </h3>
          <p className="text-gray-400">Easy Challenges</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-6 hover:scale-105 transition-transform"
        >
          <div className="flex items-center justify-between mb-4">
            <Target className="w-8 h-8 text-red-400" />
            <Clock className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-2">
            {problems.filter(p => p.difficulty === 'HARD').length}
          </h3>
          <p className="text-gray-400">Hard Challenges</p>
        </motion.div>
      </div>

      {/* Problems Grid */}
      <div>
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Code2 className="w-8 h-8 text-purple-400" />
          Problems
        </h2>

        {problems.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Code2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-400 text-lg">No problems available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problems.map((problem, index) => (
              <motion.div
                key={problem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="glass rounded-2xl p-6 hover:shadow-2xl transition-all cursor-pointer group"
              >
                <Link to={`/problem/${problem.id}`}>
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                      {problem.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${difficultyBadges[problem.difficulty as keyof typeof difficultyBadges]}`}
                    >
                      {problem.difficulty}
                    </span>
                  </div>

                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {problem.description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {problem.timeLimitMs}ms
                      </span>
                      <span>{problem.memoryLimitMb}MB</span>
                    </div>
                    <motion.div
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-1 text-purple-400 font-semibold"
                    >
                      Solve <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

