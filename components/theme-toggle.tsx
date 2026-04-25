"use client"
import { useTheme } from "@/components/theme-provider"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-colors duration-150"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Moon className="h-[14px] w-[14px]" />
      ) : (
        <Sun className="h-[14px] w-[14px]" />
      )}
    </button>
  )
}
