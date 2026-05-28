'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

const THEME_KEY = 'lista-precios-theme'

export function ThemeToggle() {
  const [isLight, setIsLight] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY)
    setIsLight(stored === 'light')
    setMounted(true)
  }, [])

  const toggle = () => {
    const next = !isLight
    setIsLight(next)
    if (next) {
      document.documentElement.classList.add('light')
      localStorage.setItem(THEME_KEY, 'light')
    } else {
      document.documentElement.classList.remove('light')
      localStorage.setItem(THEME_KEY, 'dark')
    }
  }

  if (!mounted) {
    return <div className="h-10 w-10" />
  }

  return (
    <button
      onClick={toggle}
      className="h-10 w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-300"
      aria-label={isLight ? 'Ativar modo escuro' : 'Ativar modo claro'}
      title={isLight ? 'Modo escuro' : 'Modo claro'}
    >
      {isLight ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  )
}
