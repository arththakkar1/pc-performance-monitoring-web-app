"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, SearchCode } from "lucide-react"
import { cn } from "@/lib/utils"

export default function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex items-center gap-1 bg-muted/30 p-1 rounded-full border border-border/50 shadow-inner">
      <Link 
        href="/" 
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all hover:bg-background hover:shadow-sm hover:text-foreground",
          pathname === "/" ? "bg-background shadow-sm text-foreground" : "text-foreground/70"
        )}
      >
         <LayoutDashboard className="w-4 h-4" />
        Home
      </Link>
      <Link 
        href="/analytics" 
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all hover:bg-background hover:shadow-sm hover:text-foreground",
          pathname === "/analytics" ? "bg-background shadow-sm text-foreground" : "text-foreground/70"
        )}
      >
         <LayoutDashboard className="w-4 h-4" />
        {isAdmin ? 'Global Analytics' : 'Analytics'}
      </Link>
      <Link 
        href="/history" 
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all hover:bg-background hover:shadow-sm hover:text-foreground",
          pathname === "/history" ? "bg-background shadow-sm text-foreground" : "text-foreground/70"
        )}
      >
         <LayoutDashboard className="w-4 h-4" />
        History
      </Link>
      {isAdmin && (
        <Link 
          href="/results" 
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all hover:bg-background hover:shadow-sm hover:text-foreground",
            pathname === "/results" ? "bg-background shadow-sm text-foreground" : "text-foreground/70"
          )}
        >
          <SearchCode className="w-4 h-4" />
          Live Results
        </Link>
      )}
    </nav>
  )
}
