import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Code2,
  ExternalLink,
} from 'lucide-react'
import { submissionApi, Submission } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const verdictColors = {
  ACCEPTED: 'text-green-400 bg-green-500/20 border-green-500/30',
  WRONG_ANSWER: 'text-red-400 bg-red-500/20 border-red-500/30',
  TIME_LIMIT_EXCEEDED: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
  RUNTIME_ERROR: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
  PENDING: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
}

const verdictIcons = {
  ACCEPTED: CheckCircle2,
  WRONG_ANSWER: XCircle,
  TIME_LIMIT_EXCEEDED: Clock,
  RUNTIME_ERROR: XCircle,
  PENDING: Clock,
}

export default function Submissions() {
  const { user } = useAuthStore()

  const isCandidate = user?.role === 'CANDIDATE'
  const isRecruiter = user?.role === 'RECRUITER'

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isCandidate) return
    loadSubmissions()
  }, [isCandidate])

  const loadSubmissions = async () => {
    try {
      const data = await submissionApi.getMySubmissions()
      setSubmissions(data)
    } catch {
      toast.error('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }

  // 🚫 Recruiters must never access this page
  if (isRecruiter) {
    return <Navigate to="/" replace />
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-8 h-8 text-purple-400" />
          <h1 className="text-4xl font-bold text-white">
            My Submissions
          </h1>
        </div>
        <p className="text-gray-400">
          View all your code submissions and their results
        </p>
      </motion.div>

      {submissions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-12 text-center"
        >
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-400 text-lg mb-2">
            No submissions yet
          </p>
          <p className="text-gray-500 text-sm">
            Start solving problems to see your submissions here
          </p>
          <Link
            to="/"
            className="inline-block mt-6 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
          >
            Browse Problems
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission, index) => {
            const VerdictIcon =
              verdictIcons[
                submission.verdict as keyof typeof verdictIcons
              ] || Clock

            const verdictClass =
              verdictColors[
                submission.verdict as keyof typeof verdictColors
              ] || verdictColors.PENDING

            const hasProblem = Boolean(submission.problemId)

            return (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01, x: 5 }}
                className="glass rounded-xl p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  {hasProblem ? (
                    <Link
                      to={`/problem/${submission.problemId}`}
                      className="flex items-center gap-2 text-white hover:text-purple-400 transition-colors"
                    >
                      <Code2 className="w-5 h-5" />
                      <span className="font-semibold">
                        Problem {submission.problemId?.slice(0, 8)}
                      </span>
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  ) : (
                    <span className="text-gray-400 italic">
                      Problem unavailable
                    </span>
                  )}

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${verdictClass}`}
                  >
                    <VerdictIcon className="w-3 h-3" />
                    {submission.verdict}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Language:</span>
                    <p className="text-white">{submission.language}</p>
                  </div>

                  <div>
                    <span className="text-gray-400">Score:</span>
                    <p className="text-white">{submission.score}</p>
                  </div>

                  {submission.executionTimeMs && (
                    <div>
                      <span className="text-gray-400">Time:</span>
                      <p className="text-white">
                        {submission.executionTimeMs}ms
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-gray-400">Submitted:</span>
                    <p className="text-white">
                      {formatDate(submission.submittedAt)}
                    </p>
                  </div>
                </div>

                {submission.code && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-purple-400 hover:text-purple-300 text-sm font-semibold">
                      View Code
                    </summary>
                    <pre className="mt-2 p-4 bg-black/30 rounded-lg overflow-x-auto text-xs text-gray-300">
                      {submission.code.slice(0, 200)}
                      {submission.code.length > 200 ? '...' : ''}
                    </pre>
                  </details>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
