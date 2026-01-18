import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Editor from '@monaco-editor/react'
import { Play, Trophy, Clock, Code2, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { problemApi, executionApi, Problem, ExecutionRequest } from '../services/api'
import toast from 'react-hot-toast'

export default function ProblemDetail() {
  const { id } = useParams<{ id: string }>()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('JAVA')
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [solveStartTime] = useState(Date.now())
  const [tabSwitches, setTabSwitches] = useState(0)
  const [copyEvents, setCopyEvents] = useState(0)

  useEffect(() => {
    if (id) {
      loadProblem()
      return setupAntiCheat()
    }
  }, [id])

  const setupAntiCheat = () => {
    const handleTabSwitch = () => setTabSwitches(prev => prev + 1)
    const handleCopy = () => setCopyEvents(prev => prev + 1)
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
      // Set default code template
      if (!code) {
        setCode(getDefaultCode())
      }
    } catch (error: any) {
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
    if (!problem || !id) return

    setExecuting(true)
    setResult(null)

    try {
      const solveTimeMs = Date.now() - solveStartTime
      
      const request: ExecutionRequest = {
        language,
        problemId: id,
        code,
        testCases: problem.testCases.map(tc => ({
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
      setResult({ status: 'ERROR', message: error.response?.data || 'Execution failed' })
    } finally {
      setExecuting(false)
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

  if (!problem) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-400">Problem not found</p>
      </div>
    )
  }

  const difficultyColors = {
    EASY: 'text-green-400',
    MEDIUM: 'text-yellow-400',
    HARD: 'text-red-400',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Problem Description */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="glass rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold text-white">{problem.title}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${difficultyColors[problem.difficulty as keyof typeof difficultyColors]}`}>
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

            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {problem.description}
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <Link
                to={`/leaderboard/${problem.id}`}
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Trophy className="w-5 h-5" />
                View Leaderboard
              </Link>
            </div>
          </div>

          {/* Test Cases Preview */}
          {problem.testCases && problem.testCases.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Test Cases</h3>
              <div className="space-y-4">
                {problem.testCases.slice(0, 2).map((tc, idx) => (
                  <div key={idx} className="bg-black/20 rounded-lg p-4">
                    <div className="mb-2">
                      <span className="text-sm text-gray-400">Input:</span>
                      <pre className="text-white mt-1 text-sm">{tc.input}</pre>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Expected Output:</span>
                      <pre className="text-white mt-1 text-sm">{tc.expectedOutput}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Code Editor */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-4">
                <Code2 className="w-5 h-5 text-purple-400" />
                <span className="text-white font-semibold">Code Editor</span>
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
                onChange={(value) => setCode(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                }}
              />
            </div>
          </div>

          <motion.button
            onClick={handleSubmit}
            disabled={executing || !code.trim()}
            whileHover={{ scale: executing ? 1 : 1.02 }}
            whileTap={{ scale: executing ? 1 : 0.98 }}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {executing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Run & Submit
              </>
            )}
          </motion.button>

          {/* Execution Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass rounded-2xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-4">Execution Result</h3>
                <div className="space-y-3">
                  {result.status === 'QUEUED' && (
                    <div className="flex items-center gap-2 text-blue-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Your code has been queued for execution</span>
                    </div>
                  )}
                  {result.jobId && (
                    <div className="text-sm text-gray-400">
                      Job ID: <span className="text-white font-mono">{result.jobId}</span>
                    </div>
                  )}
                  {result.message && (
                    <div className={`flex items-center gap-2 ${result.status === 'ERROR' ? 'text-red-400' : 'text-green-400'}`}>
                      {result.status === 'ERROR' ? (
                        <XCircle className="w-5 h-5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                      <span>{result.message}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

