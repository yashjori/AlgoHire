import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Editor from '@monaco-editor/react'
import {
  Play,
  Trophy,
  Clock,
  Code2,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { problemApi, executionApi, Problem, ExecutionRequest } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function ProblemDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()

  const isCandidate = user?.role === 'CANDIDATE'
  const isRecruiter = user?.role === 'RECRUITER'

  const [problem, setProblem] = useState<Problem | null>(null)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('JAVA')
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [result, setResult] = useState<any>(null)

  // Anti-cheat (candidate only)
  const [solveStartTime] = useState(Date.now())
  const [tabSwitches, setTabSwitches] = useState(0)
  const [copyEvents, setCopyEvents] = useState(0)

  useEffect(() => {
    if (!id) return

    loadProblem()

    if (isCandidate) {
      return setupAntiCheat()
    }
  }, [id, isCandidate])

  const setupAntiCheat = () => {
    const handleTabSwitch = () => setTabSwitches((p) => p + 1)
    const handleCopy = () => setCopyEvents((p) => p + 1)

    window.addEventListener('blur', handleTabSwitch)
    window.addEventListener('copy', handleCopy)

    return () => {
      window.removeEventListener('blur', handleTabSwitch)
      window.removeEventListener('copy', handleCopy)
    }
  }

  const loadProblem = async () => {
    try {
      if (!id) return
      const data = await problemApi.getById(id)
      setProblem(data)

      if (!code && isCandidate) {
        setCode(getDefaultCode())
      }
    } catch {
      toast.error('Failed to load problem')
    } finally {
      setLoading(false)
    }
  }

  const getDefaultCode = () => {
    return `public class Solution {
  public static void main(String[] args) {
    // Your solution here
  }
}`
  }

  const handleSubmit = async () => {
    if (isRecruiter) {
      toast.error('Recruiters cannot submit solutions')
      return
    }

    if (!problem || !id) return

    setExecuting(true)
    setResult(null)

    try {
      const solveTimeMs = Date.now() - solveStartTime

      const request: ExecutionRequest = {
        language,
        problemId: id,
        code,
        testCases: problem.testCases.map((tc) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
        })),
        timeLimitMs: problem.timeLimitMs,
        solveTimeMs,
        tabSwitches,
        copyEvents,
      }

      const response = await executionApi.submit(request)
      setResult(response)
      toast.success('Code submitted successfully!')
    } catch (error: any) {
      toast.error(error.response?.data || 'Execution failed')
      setResult({
        status: 'ERROR',
        message: error.response?.data || 'Execution failed',
      })
    } finally {
      setExecuting(false)
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

  if (!problem) {
    return (
      <div className="text-center py-20 text-gray-400">
        Problem not found
      </div>
    )
  }

  const difficultyColors = {
    EASY: 'text-green-400',
    MEDIUM: 'text-yellow-400',
    HARD: 'text-red-400',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Problem Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="glass rounded-2xl p-6">
            <div className="flex justify-between mb-4">
              <h1 className="text-3xl font-bold text-white">
                {problem.title}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  difficultyColors[problem.difficulty as keyof typeof difficultyColors]
                }`}
              >
                {problem.difficulty}
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-400 mb-6">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {problem.timeLimitMs}ms
              </span>
              <span>{problem.memoryLimitMb}MB</span>
            </div>

            <p className="text-gray-300 whitespace-pre-wrap">
              {problem.description}
            </p>

            <div className="mt-6 pt-6 border-t border-white/10">
              <Link
                to={`/leaderboard/${problem.id}`}
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300"
              >
                <Trophy className="w-5 h-5" />
                View Leaderboard
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Code Editor – CANDIDATE ONLY */}
        {isCandidate && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="glass rounded-2xl overflow-hidden">
              <div className="flex justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Code2 className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-semibold">
                    Code Editor
                  </span>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-white text-sm"
                >
                  <option value="JAVA">Java</option>
                </select>
              </div>

              <div className="h-[500px]">
                <Editor
                  height="100%"
                  defaultLanguage="java"
                  theme="vs-dark"
                  value={code}
                  onChange={(v) => setCode(v || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                  }}
                />
              </div>
            </div>

            <motion.button
              onClick={handleSubmit}
              disabled={executing || !code.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-semibold flex justify-center gap-2 disabled:opacity-50"
            >
              {executing ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Run & Submit
                </>
              )}
            </motion.button>

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass rounded-2xl p-6"
                >
                  <h3 className="text-lg font-bold text-white mb-2">
                    Execution Result
                  </h3>

                  <div
                    className={`flex items-center gap-2 ${
                      result.status === 'ERROR'
                        ? 'text-red-400'
                        : 'text-green-400'
                    }`}
                  >
                    {result.status === 'ERROR' ? (
                      <XCircle />
                    ) : (
                      <CheckCircle2 />
                    )}
                    <span>{result.message}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}
