'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react'

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if already authenticated
    const authToken = localStorage.getItem('adminAuth')
    if (authToken) {
      setIsAuthenticated(true)
      loadStats()
    }
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoading(true)

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (response.ok) {
        localStorage.setItem('adminAuth', 'true')
        setIsAuthenticated(true)
        loadStats()
      } else {
        setLoginError('Invalid username or password')
      }
    } catch (error) {
      setLoginError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminAuth')
    setIsAuthenticated(false)
    setUsername('')
    setPassword('')
  }

  const handleReset = async (resetMovies = false) => {
    const message = resetMovies 
      ? '⚠️ WARNING: This will delete ALL data including:\n\n• All movies\n• All votes\n• All voting sessions\n\nThis action CANNOT be undone. Are you sure?'
      : '⚠️ WARNING: This will:\n\n• Reset all votes\n• Allow everyone to vote again\n• Keep current movies\n\nAre you sure?'
    
    if (!confirm(message)) {
      return
    }

    if (resetMovies && !confirm('Are you REALLY sure? This will delete all movies and reset everything to a blank state.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetMovies })
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message + '\n\nThe voting system has been reset.')
        loadStats()
      } else {
        const error = await response.json()
        alert(`Error resetting database: ${error.error}`)
      }
    } catch (error) {
      alert('Failed to reset database. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="bg-white dark:bg-neutral-900 p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">Admin Login</h1>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                required
              />
            </div>

            {loginError && (
              <p className="text-danger-600 dark:text-danger-400 text-sm">{loginError}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Total Movies</h3>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{stats.totalMovies}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Total Votes</h3>
              <p className="text-3xl font-bold text-success-600 dark:text-success-400">{stats.totalVotes}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Voting Sessions</h3>
              <p className="text-3xl font-bold text-neutral-600 dark:text-neutral-400">{stats.totalSessions}</p>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-neutral-900 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-warning-600" />
            Reset Options
          </h2>
          
          <div className="space-y-6">
            {/* Reset Votes Only */}
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
                Reset Votes Only (Recommended)
              </h3>
              <div className="mb-4 text-neutral-700 dark:text-neutral-300 text-sm">
                <p className="mb-2">This will:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Clear all existing votes</li>
                  <li>Allow everyone to vote again</li>
                  <li>Keep the current movie list</li>
                  <li>Start a fresh voting round</li>
                </ul>
              </div>
              <button
                onClick={() => handleReset(false)}
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {loading ? 'Resetting...' : 'Reset Votes & Start New Round'}
              </button>
            </div>

            {/* Full Reset */}
            <div className="border border-danger-200 dark:border-danger-800 rounded-lg p-6 bg-danger-50 dark:bg-danger-950">
              <h3 className="text-lg font-semibold mb-3 text-danger-900 dark:text-danger-100">
                Full System Reset
              </h3>
              <div className="mb-4 text-danger-700 dark:text-danger-300 text-sm">
                <p className="mb-2">This will:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Delete ALL movies from the database</li>
                  <li>Delete all votes and voting history</li>
                  <li>Delete all voting sessions</li>
                  <li>Reset to a completely blank state</li>
                </ul>
                <p className="mt-3 font-semibold">
                  ⚠️ This action cannot be undone!
                </p>
              </div>
              <button
                onClick={() => handleReset(true)}
                disabled={loading}
                className="w-full bg-danger-600 hover:bg-danger-700 disabled:bg-neutral-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                {loading ? 'Resetting...' : 'Delete Everything & Start Fresh'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/vote')}
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            ← Back to Voting App
          </button>
        </div>
      </div>
    </div>
  )
}