'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'

interface LoginFormProps {
  errorMsg?: string
  login: (formData: FormData) => Promise<void>
}

export function LoginForm({ errorMsg, login }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => login(formData))
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-black px-4 py-12 transition-colors">
      <div className="w-full max-w-sm flex flex-col gap-6">

        {/* Brand */}
        <div className="flex items-center gap-2.5 justify-center">
          <div className="w-9 h-9 bg-black dark:bg-white rounded-lg flex items-center justify-center shrink-0 p-2 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white dark:text-black">
              <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M7 7h2v6H7zM11 9h2v4h-2zM15 6h2v7h-2z" fill="currentColor"/>
            </svg>
          </div>
          <span className="text-black dark:text-white font-bold text-lg tracking-tight transition-colors">PC Monitor</span>
        </div>

        {/* Card */}
        <div className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-7 transition-colors">

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-black dark:text-white font-bold text-2xl tracking-tight">Welcome back</h1>
            <p className="text-neutral-500 dark:text-neutral-500 text-sm mt-1">Sign in to your monitoring dashboard</p>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-3 py-2.5 rounded-lg mb-5">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 7v5M12 16v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold uppercase tracking-widest">
                Email
              </label>
              <div className="relative">
                <svg viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-600 pointer-events-none">
                  <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="m2 7 9.293 6.293a1 1 0 0 0 1.414 0L22 7" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  required
                  className="w-full h-10 bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-lg pl-10 pr-3 text-sm text-black dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 outline-none focus:border-black dark:focus:border-white transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <svg viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-600 pointer-events-none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
                </svg>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full h-10 bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-lg pl-10 pr-10 text-sm text-black dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 outline-none focus:border-black dark:focus:border-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={isPending}
              className="mt-1 h-10 w-full bg-black dark:bg-white text-white dark:text-black text-sm font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 dark:border-black/20 border-t-white dark:border-t-black rounded-full animate-spin" />
                  Signing in…
                </>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-5 pt-5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-center gap-1.5">
            <span className="text-neutral-500 text-sm">Don&apos;t have an account?</span>
            <Link id="go-to-register" href="/register" className="text-black dark:text-white text-sm font-semibold hover:text-neutral-500 dark:hover:text-neutral-400 transition-colors">
              Sign up →
            </Link>
          </div>
        </div>

        <p className="text-center text-neutral-400 dark:text-neutral-700 text-xs">
          PC Performance Monitoring System
        </p>
      </div>
    </div>
  )
}
