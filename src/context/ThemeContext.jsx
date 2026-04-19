import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
 const [dark, setDark] = useState(() => {
  // Check local storage or default to false
  if (typeof window !== 'undefined') {
   return localStorage.getItem('thikana_theme') === 'dark'
  }
  return false
 })

 // Apply theme to DOM and save to localStorage
 useEffect(() => {
  const root = document.documentElement
  if (dark) {
   root.classList.add('dark')
   root.setAttribute('data-theme', 'dark')
   localStorage.setItem('thikana_theme', 'dark')
  } else {
   root.classList.remove('dark')
   root.setAttribute('data-theme', 'light')
   localStorage.setItem('thikana_theme', 'light')
  }
 }, [dark])

 const toggleTheme = () => setDark(v => !v)

 return (
  <ThemeContext.Provider value={{ dark, toggleTheme }}>
   {children}
  </ThemeContext.Provider>
 )
}

export function useTheme() {
 const ctx = useContext(ThemeContext)
 if (!ctx) throw new Error('useTheme must be inside <ThemeProvider>')
 return ctx
}
