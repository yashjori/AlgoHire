import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Save, Tag, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import { problemApi, TestCase } from '../services/api'
import toast from 'react-hot-toast'

const AVAILABLE_TAGS = [
  'Array', 'String', 'Hash Map', 'Two Pointers', 'Sliding Window',
  'Binary Search', 'Stack', 'Queue', 'Linked List', 'Tree',
  'Graph', 'Dynamic Programming', 'Greedy', 'Backtracking',
  'Sorting', 'Math', 'Bit Manipulation', 'Recursion',
]

export default function CreateProblem() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [inputFormat, setInputFormat] = useState('')
  const [outputFormat, setOutputFormat] = useState('')
  const [constraints, setConstraints] = useState('')
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY')
  const [timeLimitMs, setTimeLimitMs] = useState(2000)
  const [memoryLimitMb, setMemoryLimitMb] = useState(256)
  const [tags, setTags] = useState<string[]>([])
  const [hints, setHints] = useState<string[]>([''])
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: '', expectedOutput: '' },
    { input: '', expectedOutput: '' },
  ])
  const [sampleTestCases, setSampleTestCases] = useState<TestCase[]>([
    { input: '', expectedOutput: '' },
  ])
  const [loading, setLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const addTestCase = () => setTestCases([...testCases, { input: '', expectedOutput: '' }])
  const removeTestCase = (i: number) => setTestCases(testCases.filter((_, idx) => idx !== i))
  const updateTestCase = (i: number, field: 'input' | 'expectedOutput', value: string) => {
    const updated = [...testCases]
    updated[i] = { ...updated[i], [field]: value }
    setTestCases(updated)
  }

  const addSampleCase = () => setSampleTestCases([...sampleTestCases, { input: '', expectedOutput: '' }])
  const removeSampleCase = (i: number) => setSampleTestCases(sampleTestCases.filter((_, idx) => idx !== i))
  const updateSampleCase = (i: number, field: 'input' | 'expectedOutput', value: string) => {
    const updated = [...sampleTestCases]
    updated[i] = { ...updated[i], [field]: value }
    setSampleTestCases(updated)
  }

  const addHint = () => setHints([...hints, ''])
  const removeHint = (i: number) => setHints(hints.filter((_, idx) => idx !== i))
  const updateHint = (i: number, value: string) => {
    const updated = [...hints]
    updated[i] = value
    setHints(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (testCases.length < 2) { toast.error('Add at least 2 test cases'); return }
    if (testCases.some(tc => !tc.input.trim() || !tc.expectedOutput.trim())) {
      toast.error('Fill in all hidden test cases'); return
    }
    if (sampleTestCases.some(tc => !tc.input.trim() || !tc.expectedOutput.trim())) {
      toast.error('Fill in all sample test cases'); return
    }
    if (!description.trim()) { toast.error('Description is required'); return }

    setLoading(true)
    try {
      const problem = await problemApi.create({
        title, description, inputFormat, outputFormat, constraints,
        difficulty, timeLimitMs, memoryLimitMb, tags,
        hints: hints.filter(h => h.trim()),
        testCases,
        sampleTestCases,
      })
      toast.success('Problem created successfully!')
      navigate(`/problem/${problem.id}`)
    } catch (error: any) {
      toast.error(error.response?.data || 'Failed to create problem')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white text-sm placeholder-gray-500"

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Plus className="w-8 h-8 text-purple-400" />
          <h1 className="text-4xl font-bold text-white">Create Problem</h1>
        </div>
        <p className="text-gray-400">Design a coding challenge for candidates. Hidden test cases are used for judging.</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Basic Info */}
        <div className="glass rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-white">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Problem Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
              className={inputClass} placeholder="e.g., Two Sum" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)}
                className={inputClass}>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Time Limit (ms)</label>
              <input type="number" value={timeLimitMs} onChange={e => setTimeLimitMs(parseInt(e.target.value))}
                required min={100} max={10000} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Memory Limit (MB)</label>
              <input type="number" value={memoryLimitMb} onChange={e => setMemoryLimitMb(parseInt(e.target.value))}
                required min={64} max={1024} className={inputClass} />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-1">
              <Tag className="w-4 h-4" /> Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map(tag => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    tags.includes(tag)
                      ? 'bg-purple-600/40 border-purple-500 text-purple-200'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-purple-500/50'}`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="glass rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-white">Problem Statement</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={8}
              className={`${inputClass} resize-y`}
              placeholder="Describe the problem clearly. Include what the function should do, any constraints, and examples within the text." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Input Format</label>
              <textarea value={inputFormat} onChange={e => setInputFormat(e.target.value)} rows={3}
                className={`${inputClass} resize-none`} placeholder="Describe the input format" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Output Format</label>
              <textarea value={outputFormat} onChange={e => setOutputFormat(e.target.value)} rows={3}
                className={`${inputClass} resize-none`} placeholder="Describe the output format" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Constraints</label>
            <textarea value={constraints} onChange={e => setConstraints(e.target.value)} rows={3}
              className={`${inputClass} font-mono resize-none`}
              placeholder={"1 ≤ n ≤ 10^5\n-10^9 ≤ nums[i] ≤ 10^9"} />
          </div>
        </div>

        {/* Sample Test Cases */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Sample Test Cases</h2>
              <p className="text-xs text-gray-400 mt-0.5">Shown to candidates as examples</p>
            </div>
            <button type="button" onClick={addSampleCase}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 rounded-lg text-sm transition-colors">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          <div className="space-y-3">
            {sampleTestCases.map((tc, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="bg-black/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-300">Example {i + 1}</span>
                  {sampleTestCases.length > 1 && (
                    <button type="button" onClick={() => removeSampleCase(i)} className="p-1 text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Input</label>
                    <textarea value={tc.input} onChange={e => updateSampleCase(i, 'input', e.target.value)}
                      rows={3} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Expected Output</label>
                    <textarea value={tc.expectedOutput} onChange={e => updateSampleCase(i, 'expectedOutput', e.target.value)}
                      rows={3} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-purple-500" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Hidden Test Cases */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Hidden Test Cases *</h2>
              <p className="text-xs text-gray-400 mt-0.5">Used for judging — NOT shown to candidates. Include edge cases.</p>
            </div>
            <button type="button" onClick={addTestCase}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 rounded-lg text-sm transition-colors">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          <div className="space-y-3">
            {testCases.map((tc, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="bg-black/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-300">Test Case {i + 1}</span>
                  {testCases.length > 1 && (
                    <button type="button" onClick={() => removeTestCase(i)} className="p-1 text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Input</label>
                    <textarea value={tc.input} onChange={e => updateTestCase(i, 'input', e.target.value)} required
                      rows={3} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Expected Output</label>
                    <textarea value={tc.expectedOutput} onChange={e => updateTestCase(i, 'expectedOutput', e.target.value)} required
                      rows={3} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-purple-500" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Hints (optional) */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <h2 className="text-lg font-semibold text-white">Hints <span className="text-gray-500 text-sm font-normal">(optional)</span></h2>
            </div>
            <button type="button" onClick={addHint}
              className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 text-yellow-300 rounded-lg text-sm transition-colors">
              <Plus className="w-4 h-4" /> Add Hint
            </button>
          </div>
          <div className="space-y-2">
            {hints.map((hint, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" value={hint} onChange={e => updateHint(i, e.target.value)}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500"
                  placeholder={`Hint ${i + 1}…`} />
                <button type="button" onClick={() => removeHint(i)} className="p-2 text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <motion.button type="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: 0.99 }}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg">
          {loading
            ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            : <><Save className="w-5 h-5" /> Create Problem</>
          }
        </motion.button>
      </form>
    </div>
  )
}
