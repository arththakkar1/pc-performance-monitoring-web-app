import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from './ui/button'
import { redirect } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'
import NavLinks from './NavLinks'
import { ActivitySquare, ShieldCheck, LogOut } from 'lucide-react'

interface TopNavProps {
  isAdmin?: boolean
}

export default async function TopNav({ isAdmin = false }: TopNavProps) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  const signOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 dark:border-white/5 bg-background/60 backdrop-blur-xl supports-backdrop-filter:bg-background/40 shadow-sm">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
        
        {/* Left Side - Brand & Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <div className="w-9 h-9 bg-black dark:bg-white rounded-lg flex items-center justify-center shrink-0 p-2 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white dark:text-black">
                  <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M7 7h2v6H7zM11 9h2v4h-2zM15 6h2v7h-2z" fill="currentColor"/>
                </svg>
              </div>
            </div>
            <span className="font-bold text-lg tracking-tight bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              PC Monitor
            </span>
          </Link>

          <NavLinks isAdmin={isAdmin} />
        </div>

        {/* Right Side - Actions & Profile */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          <div className="w-px h-6 bg-border/50 hidden sm:block" />

          {data.user && (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-foreground/90">{data.user.email}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  {isAdmin ? (
                    <span className="flex items-center text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-sm uppercase tracking-widest border border-emerald-500/20">
                      <ShieldCheck className="w-3 h-3 mr-0.5" /> Admin
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                      Standard User
                    </span>
                  )}
                </div>
              </div>
              
              <form action={signOut}>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="w-9 h-9 rounded-full bg-muted/30 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="sr-only">Sign out</span>
                </Button>
              </form>
            </div>
          )}
        </div>
        
      </div>
    </header>
  )
}
