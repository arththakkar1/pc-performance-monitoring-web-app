"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Ensure hydration match
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-[84px] h-8 rounded-full bg-muted/20" />
  }

  return (
    <div className="relative inline-flex items-center rounded-full bg-muted/40 p-1 border border-border/40 shadow-inner">
      {/* Dynamic pill slider */}
      <div 
        className={cn(
          "absolute h-6 w-8 rounded-full bg-background shadow-md transition-all duration-300 ease-out",
          theme === "light" ? "translate-x-0" : theme === "dark" ? "translate-x-8" : "translate-x-16"
        )}
      />
      
      {/* Light Button */}
      <button
        onClick={() => setTheme("light")}
        className={cn(
          "relative z-10 flex w-8 h-6 items-center justify-center transition-colors duration-200",
          theme === "light" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"
        )}
        aria-label="Light theme"
      >
        <Sun className="h-3.5 w-3.5" />
      </button>
      
      {/* Dark Button */}
      <button
        onClick={() => setTheme("dark")}
        className={cn(
          "relative z-10 flex w-8 h-6 items-center justify-center transition-colors duration-200",
          theme === "dark" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"
        )}
        aria-label="Dark theme"
      >
        <Moon className="h-3.5 w-3.5" />
      </button>

      {/* System Button */}
      <button
        onClick={() => setTheme("system")}
        className={cn(
          "relative z-10 flex w-8 h-6 items-center justify-center transition-colors duration-200",
          theme === "system" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"
        )}
        aria-label="System theme"
      >
        <Monitor className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
