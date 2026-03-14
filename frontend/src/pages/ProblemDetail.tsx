import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Editor from '@monaco-editor/react'
import {
  Play,
  Send,
  Trophy,
  Clock,
  Code2,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertCircle,
  Eye,
  RotateCcw,
  Cpu,
} from 'lucide-react'
import {
  problemApi,
  executionApi,
  Problem,
  ExecutionRequest,
  ExecutionResult,
  Language,
  LANGUAGES,
  DEFAULT_CODE,
} from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const VERDICT_CONFIG: Record<string, { color: string; icon: JSX.Element; label: string }> = {
  ACCEPTED:          { color: 'text-green-400',  icon: <CheckCircle2 />, label: 'Accepted ✓' },
  WRONG_ANSWER:      { color: 'text-red-400',    icon: <XCircle />,      label: 'Wrong Answer' },
  TIME_LIMIT_EXCEEDED: { color: 'text-yellow-400', icon: <Clock />,      label: 'Time Limit Exceeded' },
  TLE:               { color: 'text-yellow-400', icon: <Clock />,        label: 'Time Limit Exceeded' },
  COMPILATION_ERROR: { color: 'text-orange-400', icon: <AlertCircle />,  label: 'Compilation Error' },
  RUNTIME_ERROR:     { color: 'text-red-400',    icon: <AlertCircle />,  label: 'Runtime Error' },
  PENDING:           { color: 'text-blue-400',   icon: <Loader2 className="animate-spin" />, label: 'Pending…' },
  QUEUED:            { color: 'text-blue-400',   icon: <Loader2 className="animate-spin" />, label: 'Queued…' },
  ERROR:             { color: 'text-red-400',    icon: <XCircle />,      label: 'Error' },
}

export default function ProblemDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()

  const isCandidate = user?.role === 'CANDIDATE'
  const isRecruiter = user?.role === 'RECRUITER'

  const [problem, setProblem] = useState<Problem | null>(null)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState<Language>('PYTHON')
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)  // "Run" against sample cases
  const [submitting, setSubmitting] = useState(false)
  const [runResult, setRunResult] = useState<ExecutionResult | null>(null)
  const [submitResult, setSubmitResult] = useState<ExecutionResult | null>(null)
  const [showHints, setShowHints] = useState(false)
  const [showConstraints, setShowConstraints] = useState(true)
  const [customInput, setCustomInput] = useState('')
  const [customOutput, setCustomOutput] = useState('')
  const [activeTab, setActiveTab] = useState<'sample' | 'custom'>('sample')

  // Anti-cheat (candidate only)
  const solveStartTime = useRef(Date.now())
  const [tabSwitches, setTabSwitches] = useState(0)
  const [copyEvents, setCopyEvents] = useState(0)

  // Polling for async result
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!id) return
    loadProblem()
    if (isCandidate) return setupAntiCheat()
  }, [id, isCandidate])

  // Reset code when language changes
  useEffect(() => {
    setCode(DEFAULT_CODE[language])
  }, [language])

  const setupAntiCheat = () => {
    const handleTabSwitch = () => setTabSwitches(p => p + 1)
    const handlePaste = () => setCopyEvents(p => p + 1)
    window.addEventListener('blur', handleTabSwitch)
    window.addEventListener('paste', handlePaste)
    return () => {
      window.removeEventListener('blur', handleTabSwitch)
      window.removeEventListener('paste', handlePaste)
    }
  }

  const loadProblem = async () => {
    try {
      if (!id) return
      const data = await problemApi.getById(id)
      setProblem(data)
      setCode(DEFAULT_CODE[language])
    } catch {
      toast.error('Failed to load problem')
    } finally {
      setLoading(false)
    }
  }

  const buildRequest = (useAllTestCases: boolean): ExecutionRequest => ({
    language,
    problemId: id!,
    code,
    testCases: useAllTestCases
      ? (problem?.testCases ?? []).map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput }))
      : (problem?.sampleTestCases ?? problem?.testCases ?? []).map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput })),
    timeLimitMs: problem?.timeLimitMs ?? 2000,
    solveTimeMs: Date.now() - solveStartTime.current,
    tabSwitches,
    copyEvents,
  })

  // Run against sample test cases (no submission saved)
  const handleRun = async () => {
    if (!problem || !id) return
    setRunning(true)
    setRunResult(null)
    try {
      const result = await executionApi.run(buildRequest(false))
      setRunResult(result)
    } catch (error: any) {
      const msg = error.response?.data || 'Execution failed'
      toast.error(msg)
      setRunResult({ verdict: 'ERROR', message: msg })
    } finally {
      setRunning(false)
    }
  }

  // Run custom input
  const handleRunCustom = async () => {
    if (!problem || !id || !customInput.trim()) {
      toast.error('Please enter input')
      return
    }
    setRunning(true)
    setCustomOutput('')
    try {
      const result = await executionApi.run({
        language,
        problemId: id!,
        code,
        testCases: [{ input: customInput, expectedOutput: '' }],
        timeLimitMs: problem?.timeLimitMs ?? 2000,
        solveTimeMs: Date.now() - solveStartTime.current,
        tabSwitches,
        copyEvents,
      })
      setCustomOutput(result.message || result.error || 'No output')
    } catch (error: any) {
      setCustomOutput(error.response?.data || 'Execution failed')
    } finally {
      setRunning(false)
    }
  }

  // Submit against all hidden test cases
  const handleSubmit = async () => {
    if (isRecruiter) { toast.error('Recruiters cannot submit solutions'); return }
    if (!problem || !id) return
    setSubmitting(true)
    setSubmitResult(null)
    try {
      const response = await executionApi.submit(buildRequest(true))
      // If async queue, poll for result
      if (response.jobId) {
        setSubmitResult({ verdict: 'QUEUED', message: 'Judging your solution…' })
        pollForResult(response.jobId)
      } else {
        setSubmitResult(response)
        if (response.verdict === 'ACCEPTED') toast.success('🎉 Accepted!')
        else toast.error(response.verdict ?? 'Submission failed')
      }
    } catch (error: any) {
      const msg = error.response?.data || 'Execution failed'
      toast.error(msg)
      setSubmitResult({ verdict: 'ERROR', message: msg })
    } finally {
      setSubmitting(false)
    }
  }

  const pollForResult = (jobId: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const result = await executionApi.pollResult(jobId)
        if (result.verdict && result.verdict !== 'PENDING' && result.verdict !== 'QUEUED') {
          clearInterval(pollRef.current!)
          setSubmitResult(result)
          if (result.verdict === 'ACCEPTED') toast.success('🎉 Accepted!')
          else toast.error(result.verdict ?? 'Wrong')
        }
      } catch {
        clearInterval(pollRef.current!)
      }
    }, 1500)
  }

  const monacoLang = LANGUAGES.find(l => l.value === language)?.monacoLang ?? 'python'

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full" />
    </div>
  )

  if (!problem) return <div className="text-center py-20 text-gray-400">Problem not found</div>

  const difficultyColors = { EASY: 'text-green-400 border-green-500/40 bg-green-500/10', MEDIUM: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10', HARD: 'text-red-400 border-red-500/40 bg-red-500/10' }

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── Left Panel: Problem Description ─────────────────────────── */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 overflow-auto max-h-[calc(100vh-100px)] pr-1">

          {/* Header */}
          <div className="glass rounded-2xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <h1 className="text-2xl font-bold text-white">{problem.title}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${difficultyColors[problem.difficulty]}`}>
                {problem.difficulty}
              </span>
            </div>

            {/* Tags */}
            {problem.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {problem.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-300">{tag}</span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-5 text-sm text-gray-400 mb-5">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{problem.timeLimitMs}ms</span>
              <span className="flex items-center gap-1"><Cpu className="w-4 h-4" />{problem.memoryLimitMb}MB</span>
            </div>

            <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
              {problem.description}
            </div>
          </div>

          {/* Input / Output Format */}
          {(problem.inputFormat || problem.outputFormat) && (
            <div className="glass rounded-2xl p-5 space-y-3">
              {problem.inputFormat && (
                <div>
                  <h3 className="text-sm font-semibold text-purple-300 mb-1">Input Format</h3>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{problem.inputFormat}</p>
                </div>
              )}
              {problem.outputFormat && (
                <div>
                  <h3 className="text-sm font-semibold text-purple-300 mb-1">Output Format</h3>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{problem.outputFormat}</p>
                </div>
              )}
            </div>
          )}

          {/* Constraints */}
          {problem.constraints && (
            <div className="glass rounded-2xl overflow-hidden">
              <button onClick={() => setShowConstraints(v => !v)} className="w-full flex items-center justify-between p-4 text-sm font-semibold text-gray-300 hover:bg-white/5">
                <span>Constraints</span>
                {showConstraints ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showConstraints && (
                <div className="px-4 pb-4 text-gray-300 text-sm font-mono whitespace-pre-wrap">{problem.constraints}</div>
              )}
            </div>
          )}

          {/* Sample test cases */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-200 mb-3">Examples</h3>
            <div className="space-y-3">
              {(problem.sampleTestCases ?? problem.testCases.slice(0, 2)).map((tc, i) => (
                <div key={i} className="bg-black/30 rounded-xl p-3 text-sm font-mono">
                  <div className="mb-2">
                    <span className="text-purple-400 text-xs uppercase tracking-wide">Input</span>
                    <pre className="text-gray-200 mt-1 whitespace-pre-wrap">{tc.input}</pre>
                  </div>
                  <div>
                    <span className="text-green-400 text-xs uppercase tracking-wide">Output</span>
                    <pre className="text-gray-200 mt-1 whitespace-pre-wrap">{tc.expectedOutput}</pre>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hints */}
          {problem.hints && problem.hints.length > 0 && (
            <div className="glass rounded-2xl overflow-hidden">
              <button onClick={() => setShowHints(v => !v)} className="w-full flex items-center gap-2 p-4 text-sm font-semibold text-yellow-400 hover:bg-white/5">
                <Lightbulb className="w-4 h-4" />
                <span>{showHints ? 'Hide' : 'Show'} Hints ({problem.hints.length})</span>
              </button>
              {showHints && (
                <div className="px-4 pb-4 space-y-2">
                  {problem.hints.map((hint, i) => (
                    <div key={i} className="flex gap-2 text-sm text-gray-300">
                      <span className="text-yellow-400 font-bold shrink-0">#{i + 1}</span>
                      <span>{hint}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Link to={`/leaderboard/${problem.id}`} className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm">
            <Trophy className="w-4 h-4" /> View Leaderboard
          </Link>
        </motion.div>

        {/* ── Right Panel: Code Editor + Results ──────────────────────── */}
        {isCandidate && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4">

            {/* Editor Header */}
            <div className="glass rounded-2xl overflow-hidden flex-1">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-semibold text-sm">Code Editor</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCode(DEFAULT_CODE[language])} title="Reset code" className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <select value={language} onChange={e => setLanguage(e.target.value as Language)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-black text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="h-[450px]">
                <Editor
                  height="100%"
                  language={monacoLang}
                  theme="vs-dark"
                  value={code}
                  onChange={v => setCode(v || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    tabSize: 4,
                    automaticLayout: true,
                    lineNumbers: 'on',
                    formatOnPaste: true,
                    suggestOnTriggerCharacters: true,
                  }}
                />
              </div>
            </div>

            {/* Test Input Tabs */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="flex border-b border-white/10">
                <button onClick={() => setActiveTab('sample')}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === 'sample' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}>
                  Sample Test Cases
                </button>
                <button onClick={() => setActiveTab('custom')}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === 'custom' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}>
                  Custom Input
                </button>
              </div>

              {activeTab === 'custom' && (
                <div className="p-4 space-y-3">
                  <textarea value={customInput} onChange={e => setCustomInput(e.target.value)}
                    rows={3} placeholder="Enter custom input…"
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  {customOutput && (
                    <div className="bg-black/30 rounded-lg p-3">
                      <span className="text-xs text-gray-400">Output:</span>
                      <pre className="text-gray-200 text-sm font-mono mt-1 whitespace-pre-wrap">{customOutput}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <motion.button onClick={activeTab === 'custom' ? handleRunCustom : handleRun}
                disabled={running || submitting || !code.trim()}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold flex justify-center items-center gap-2 disabled:opacity-50 transition-colors border border-white/10">
                {running ? <><Loader2 className="animate-spin w-5 h-5" /> Running…</> : <><Play className="w-5 h-5" /> Run</>}
              </motion.button>

              <motion.button onClick={handleSubmit}
                disabled={running || submitting || !code.trim()}
                className="flex-[2] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-3 rounded-xl font-semibold flex justify-center items-center gap-2 disabled:opacity-50 transition-all">
                {submitting ? <><Loader2 className="animate-spin w-5 h-5" /> Submitting…</> : <><Send className="w-5 h-5" /> Submit</>}
              </motion.button>
            </div>

            {/* Run Result */}
            <AnimatePresence>
              {runResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="glass rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-300">Run Result</span>
                    {runResult.executionTimeMs != null && (
                      <span className="text-xs text-gray-500">{runResult.executionTimeMs}ms</span>
                    )}
                  </div>
                  {(() => {
                    const v = runResult.verdict ?? 'ERROR'
                    const cfg = VERDICT_CONFIG[v] ?? VERDICT_CONFIG.ERROR
                    return (
                      <div className={`flex items-center gap-2 ${cfg.color}`}>
                        {cfg.icon}<span className="font-semibold">{cfg.label}</span>
                      </div>
                    )
                  })()}
                  {runResult.error && <pre className="mt-2 text-xs text-red-300 bg-red-900/20 p-2 rounded-lg overflow-x-auto">{runResult.error}</pre>}
                  {runResult.message && !runResult.error && <p className="mt-1 text-sm text-gray-400">{runResult.message}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Result */}
            <AnimatePresence>
              {submitResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={`rounded-2xl p-5 border ${submitResult.verdict === 'ACCEPTED' ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {(() => {
                      const v = submitResult.verdict ?? 'ERROR'
                      const cfg = VERDICT_CONFIG[v] ?? VERDICT_CONFIG.ERROR
                      return (
                        <>
                          <span className={`${cfg.color} text-xl`}>{cfg.icon}</span>
                          <span className={`font-bold text-lg ${cfg.color}`}>{cfg.label}</span>
                        </>
                      )
                    })()}
                  </div>
                  {submitResult.testsPassed != null && (
                    <p className="text-sm text-gray-400">Passed {submitResult.testsPassed}/{submitResult.testsTotal} test cases</p>
                  )}
                  {submitResult.executionTimeMs != null && (
                    <p className="text-sm text-gray-400">Execution time: {submitResult.executionTimeMs}ms</p>
                  )}
                  {submitResult.error && <pre className="mt-2 text-xs text-red-300 bg-red-900/20 p-2 rounded-lg overflow-x-auto">{submitResult.error}</pre>}
                  {submitResult.message && !submitResult.error && <p className="mt-1 text-sm text-gray-400">{submitResult.message}</p>}
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}

        {/* Recruiter: read-only view message */}
        {isRecruiter && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4">
            <Eye className="w-16 h-16 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Recruiter View</h2>
            <p className="text-gray-400">You are viewing this problem as a recruiter. Candidates will submit solutions here.</p>
            <Link to={`/leaderboard/${problem.id}`} className="btn-primary flex items-center gap-2">
              <Trophy className="w-5 h-5" /> View Submissions & Leaderboard
            </Link>
          </motion.div>
        )}

      </div>
    </div>
  )
}
