import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from './ui/button'
import { redirect } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'

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
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-4">
        <div className="mr-4 flex space-x-6 shrink-0">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold">PC Monitor</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground">
              {isAdmin ? 'Dashboard' : 'My Device'}
            </Link>
            {isAdmin && (
              <Link href="/results" className="transition-colors hover:text-foreground/80 text-foreground/60">
                Test Results
              </Link>
            )}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <ThemeToggle />
          {data.user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{data.user.email}</span>
                {isAdmin && (
                  <span className="text-[10px] font-bold bg-foreground text-background px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                    Admin
                  </span>
                )}
              </div>
              <form action={signOut}>
                <Button variant="ghost" size="sm">Sign out</Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
