import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, CheckCircle2, XCircle, Clock, Code2,
  ExternalLink, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react'
import { submissionApi, Submission } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const VERDICT_MAP: Record<string, { label: string; color: string; bg: string; icon: JSX.Element }> = {
  ACCEPTED:            { label: 'Accepted',               color: 'text-green-400',  bg: 'bg-green-500/20 border-green-500/30',  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  WRONG_ANSWER:        { label: 'Wrong Answer',           color: 'text-red-400',    bg: 'bg-red-500/20 border-red-500/30',      icon: <XCircle className="w-3.5 h-3.5" /> },
  TIME_LIMIT_EXCEEDED: { label: 'Time Limit Exceeded',   color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30',icon: <Clock className="w-3.5 h-3.5" /> },
  TLE:                 { label: 'Time Limit Exceeded',   color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30',icon: <Clock className="w-3.5 h-3.5" /> },
  RUNTIME_ERROR:       { label: 'Runtime Error',         color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/30',icon: <AlertCircle className="w-3.5 h-3.5" /> },
  COMPILATION_ERROR:   { label: 'Compilation Error',     color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/30',icon: <AlertCircle className="w-3.5 h-3.5" /> },
  PENDING:             { label: 'Pending',               color: 'text-blue-400',   bg: 'bg-blue-500/20 border-blue-500/30',    icon: <Clock className="w-3.5 h-3.5" /> },
  DISQUALIFIED:        { label: 'Disqualified',          color: 'text-red-400',    bg: 'bg-red-500/20 border-red-500/30',      icon: <XCircle className="w-3.5 h-3.5" /> },
}

const LANG_COLORS: Record<string, string> = {
  JAVA: 'text-orange-300', PYTHON: 'text-blue-300', CPP: 'text-purple-300',
  JAVASCRIPT: 'text-yellow-300', TYPESCRIPT: 'text-cyan-300', GO: 'text-teal-300', RUST: 'text-red-300',
}

export default function Submissions() {
  const { user } = useAuthStore()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('ALL')

   useEffect(() => {
    submissionApi.getMySubmissions()
      .then(data => setSubmissions(data.sort((a, b) =>
        new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime()
      )))
      .catch(() => toast.error('Failed to load submissions'))
      .finally(() => setLoading(false))
  }, [])
  if (user?.role === 'RECRUITER') return <Navigate to="/" replace />

 

  const verdicts = ['ALL', ...Array.from(new Set(submissions.map(s => s.verdict)))]
  const filtered = filter === 'ALL' ? submissions : submissions.filter(s => s.verdict === filter)

  const acceptedCount = submissions.filter(s => s.verdict === 'ACCEPTED').length

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-7 h-7 text-purple-400" />
          <h1 className="text-3xl font-bold text-white">My Submissions</h1>
        </div>
        <p className="text-gray-400 text-sm">
          {submissions.length} total · <span className="text-green-400">{acceptedCount} accepted</span>
        </p>
      </motion.div>

      {/* Verdict filter */}
      {submissions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {verdicts.map(v => {
            const cfg = VERDICT_MAP[v]
            return (
              <button key={v} onClick={() => setFilter(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                  filter === v ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
                {cfg?.label ?? v}
              </button>
            )
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-12 text-center">
          <FileText className="w-14 h-14 mx-auto text-gray-500 mb-4" />
          <p className="text-gray-400 text-lg mb-2">{submissions.length === 0 ? 'No submissions yet' : 'No submissions match this filter'}</p>
          {submissions.length === 0 && (
            <Link to="/" className="inline-block mt-4 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Browse Problems
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s, i) => {
            const cfg = VERDICT_MAP[s.verdict] ?? { label: s.verdict, color: 'text-gray-400', bg: 'bg-gray-500/20 border-gray-500/30', icon: <Clock className="w-3.5 h-3.5" /> }
            const isExpanded = expandedId === s.id
            const langColor = LANG_COLORS[(s.language ?? '').toUpperCase()] ?? 'text-gray-400'

            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className={`glass rounded-xl overflow-hidden border ${s.verdict === 'ACCEPTED' ? 'border-green-500/20' : 'border-white/5'}`}>

                <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : s.id)}>

                  {/* Verdict badge */}
                  <span className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
                    {cfg.icon}{cfg.label}
                  </span>

                  {/* Problem link */}
                  <Link to={`/problem/${s.problemId}`} onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-gray-300 hover:text-purple-300 transition-colors text-sm font-medium flex-1 min-w-0">
                    <Code2 className="w-4 h-4 shrink-0" />
                    <span className="truncate">{s.problemTitle ?? `Problem ${s.problemId?.slice(0, 8)}`}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </Link>

                  <div className="flex items-center gap-3 shrink-0 text-xs text-gray-500">
                    <span className={`font-medium ${langColor}`}>{s.language}</span>
                    {s.executionTimeMs != null && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.executionTimeMs}ms</span>}
                    <span>{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : ''}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && s.code && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/10 overflow-hidden">
                      <pre className="p-4 text-xs text-gray-300 bg-black/30 overflow-x-auto max-h-64 font-mono leading-relaxed">
                        {s.code}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
