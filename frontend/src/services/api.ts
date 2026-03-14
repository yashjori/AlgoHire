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
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname
      if (path !== '/login' && path !== '/register') {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ─── Types ────────────────────────────────────────────────────────────────────

export type Language = 'JAVA' | 'PYTHON' | 'CPP' | 'JAVASCRIPT' | 'TYPESCRIPT' | 'GO' | 'RUST'

export const LANGUAGES: { value: Language; label: string; monacoLang: string }[] = [
  { value: 'JAVA',       label: 'Java 21',         monacoLang: 'java'       },
  { value: 'PYTHON',     label: 'Python 3.11',      monacoLang: 'python'     },
  { value: 'CPP',        label: 'C++ 17',           monacoLang: 'cpp'        },
  { value: 'JAVASCRIPT', label: 'JavaScript (Node)', monacoLang: 'javascript' },
  { value: 'TYPESCRIPT', label: 'TypeScript',        monacoLang: 'typescript' },
  { value: 'GO',         label: 'Go 1.22',           monacoLang: 'go'         },
  { value: 'RUST',       label: 'Rust',              monacoLang: 'rust'       },
]

export const DEFAULT_CODE: Record<Language, string> = {
  JAVA: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Read input and write output
    }
}`,
  PYTHON: `import sys
input = sys.stdin.readline

def solve():
    # Read input and write output
    pass

solve()`,
  CPP: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    // Read input and write output
    return 0;
}`,
  JAVASCRIPT: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
    // Process lines[] and console.log output
});`,
  TYPESCRIPT: `import * as readline from 'readline';
const rl = readline.createInterface({ input: process.stdin });
const lines: string[] = [];
rl.on('line', (l: string) => lines.push(l.trim()));
rl.on('close', () => {
    // Process lines[] and console.log output
});`,
  GO: `package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    reader := bufio.NewReader(os.Stdin)
    _ = reader
    // Read input and write output with fmt.Println
}`,
  RUST: `use std::io::{self, BufRead};

fn main() {
    let stdin = io::stdin();
    for line in stdin.lock().lines() {
        let _line = line.unwrap();
        // Process input and println! output
    }
}`,
}

export interface Problem {
  id: string
  title: string
  description: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  tags: string[]
  testCases: TestCase[]
  sampleTestCases: TestCase[]
  timeLimitMs: number
  memoryLimitMb: number
  createdBy?: string
  hints?: string[]
  constraints?: string
  inputFormat?: string
  outputFormat?: string
}

export interface TestCase {
  input: string
  expectedOutput: string
}

export interface ExecutionRequest {
  language: Language
  problemId: string
  code: string
  testCases: Array<{ input: string; expectedOutput: string }>
  timeLimitMs: number
  solveTimeMs: number
  tabSwitches: number
  copyEvents: number
}

export interface ExecutionResult {
  jobId?: string
  status?: string
  verdict?: string
  message?: string
  executionTimeMs?: number
  error?: string
  // polling support
  testsPassed?: number
  testsTotal?: number
}

export interface Submission {
  id: string
  problemId: string
  problemTitle?: string
  candidateEmail: string
  code: string
  language: Language
  verdict: string
  score?: number
  executionTimeMs?: number
  submittedAt?: string
  suspicious?: boolean
}

export interface LeaderboardEntry {
  rank: number
  email: string
  executionTimeMs: number
  language?: string
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: async (data: { name: string; email: string; password: string; role: string }) => {
    const response = await api.post('/auth/register', data)
    return response.data
  },
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },
}

// ─── Problems ─────────────────────────────────────────────────────────────────

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
  update: async (id: string, problem: Partial<Problem>): Promise<Problem> => {
    const response = await api.put(`/problems/${id}`, problem)
    return response.data
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/problems/${id}`)
  },
}

// ─── Execution ────────────────────────────────────────────────────────────────

export const executionApi = {
  submit: async (request: ExecutionRequest): Promise<ExecutionResult> => {
    const response = await api.post('/execute', request)
    return response.data
  },
  // Poll job result (for async execution queue)
  pollResult: async (jobId: string): Promise<ExecutionResult> => {
    const response = await api.get(`/execute/result/${jobId}`)
    return response.data
  },
  // Run code against custom (sample) test cases without saving submission
  run: async (request: ExecutionRequest): Promise<ExecutionResult> => {
    const response = await api.post('/execute/run', request)
    return response.data
  },
}

// ─── Submissions ──────────────────────────────────────────────────────────────

export const submissionApi = {
  getMySubmissions: async (): Promise<Submission[]> => {
    const response = await api.get('/submissions/me')
    return response.data
  },
  getByProblem: async (problemId: string): Promise<Submission[]> => {
    const response = await api.get(`/submissions/problem/${problemId}`)
    return response.data
  },
  // Recruiter: get all submissions for review
  getAll: async (): Promise<Submission[]> => {
    const response = await api.get('/submissions')
    return response.data
  },
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export const leaderboardApi = {
  getByProblemId: async (problemId: string): Promise<LeaderboardEntry[]> => {
    const response = await api.get(`/leaderboard/${problemId}`)
    return response.data
  },
}

// ─── User ─────────────────────────────────────────────────────────────────────

export const userApi = {
  getCurrentUser: async () => {
    const response = await api.get('/me')
    return response.data
  },
}

export default api
