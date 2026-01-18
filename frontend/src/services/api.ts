import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if we're already on login/register page
      const path = window.location.pathname
      if (path !== '/login' && path !== '/register') {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export interface Problem {
  id: string
  title: string
  description: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  testCases: TestCase[]
  timeLimitMs: number
  memoryLimitMb: number
  createdBy?: string
}

export interface TestCase {
  input: string
  expectedOutput: string
}

export interface ExecutionRequest {
  language: string
  problemId: string
  code: string
  testCases: Array<{ input: string; expectedOutput: string }>
  timeLimitMs: number
  solveTimeMs: number
  tabSwitches: number
  copyEvents: number
}

export interface Submission {
  id: string
  problemId: string
  candidateEmail: string
  code: string
  language: string
  verdict: string
  score: number
  executionTimeMs?: number
  submittedAt?: string
}

export interface LeaderboardEntry {
  rank: number
  email: string
  executionTimeMs: number
}

export const authApi = {
  register: async (data: { name: string; email: string; password: string; role: string }) => {
    const response = await api.post('/auth/register', data)
    return response.data
  },
  
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    // Backend returns token as plain string, ensure we handle it correctly
    const token = typeof response.data === 'string' ? response.data : response.data.token || response.data
    return token
  },
}

export const problemApi = {
  getAll: async (): Promise<Problem[]> => {
    const response = await api.get('/problems')
    return response.data
  },
  
  getById: async (id: string): Promise<Problem> => {
    const response = await api.get(`/problems/${id}`)
    return response.data
  },
  
  create: async (problem: Omit<Problem, 'id'>): Promise<Problem> => {
    const response = await api.post('/problems', problem)
    return response.data
  },
}

export const executionApi = {
  submit: async (request: ExecutionRequest) => {
    const response = await api.post('/execute', request)
    return response.data
  },
}

export const submissionApi = {
  getMySubmissions: async (): Promise<Submission[]> => {
    const response = await api.get('/submissions/me')
    return response.data
  },
}

export const leaderboardApi = {
  getByProblemId: async (problemId: string): Promise<LeaderboardEntry[]> => {
    const response = await api.get(`/leaderboard/${problemId}`)
    return response.data
  },
}

export const userApi = {
  getCurrentUser: async () => {
    const response = await api.get('/me')
    return response.data
  },
}

export default api

