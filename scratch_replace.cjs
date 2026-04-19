const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, 'src')

const walk = (d) => {
  let results = []
  const list = fs.readdirSync(d)
  list.forEach(file => {
    file = path.join(d, file)
    const stat = fs.statSync(file)
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file))
    } else {
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        results.push(file)
      }
    }
  })
  return results
}

const files = walk(dir)

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8')
  
  // Backwards compatible replacements mapping to new theme variables
  content = content.replace(/bg-orange-500/g, 'bg-theme-primary')
  content = content.replace(/bg-orange-50/g, 'bg-theme-primary/10')
  content = content.replace(/bg-orange-100/g, 'bg-theme-primary/20')
  content = content.replace(/text-orange-500/g, 'text-theme-primary')
  content = content.replace(/text-orange-600/g, 'text-theme-primary-hover')
  content = content.replace(/border-orange-500/g, 'border-theme-primary')
  content = content.replace(/border-orange-400/g, 'border-theme-primary/50')
  content = content.replace(/border-orange-200/g, 'border-theme-primary/30')
  content = content.replace(/hover:text-orange-500/g, 'hover:text-theme-primary')
  content = content.replace(/hover:bg-orange-500/g, 'hover:bg-theme-primary')
  
  content = content.replace(/bg-gray-50 dark:bg-gray-950/g, 'bg-theme-bg')
  content = content.replace(/bg-gray-50/g, 'bg-theme-bg')
  content = content.replace(/dark:bg-gray-950/g, 'bg-theme-bg')
  
  content = content.replace(/bg-white dark:bg-gray-900/g, 'bg-theme-card')
  content = content.replace(/bg-white dark:bg-gray-950/g, 'bg-theme-card')
  content = content.replace(/dark:bg-gray-900/g, 'bg-theme-card')
  
  content = content.replace(/text-gray-900 dark:text-white/g, 'text-theme-text')
  content = content.replace(/text-gray-900 dark:text-gray-100/g, 'text-theme-text')
  content = content.replace(/text-gray-800 dark:text-gray-200/g, 'text-theme-text')
  content = content.replace(/text-gray-900/g, 'text-theme-text')
  
  content = content.replace(/text-gray-500 dark:text-gray-400/g, 'text-theme-muted')
  content = content.replace(/text-gray-600 dark:text-gray-400/g, 'text-theme-muted')
  content = content.replace(/text-gray-400/g, 'text-theme-muted')
  content = content.replace(/text-gray-500/g, 'text-theme-muted')
  
  content = content.replace(/border-gray-200 dark:border-gray-800/g, 'border-theme-border')
  content = content.replace(/border-gray-100 dark:border-gray-800/g, 'border-theme-border')
  content = content.replace(/border-gray-200 dark:border-gray-700/g, 'border-theme-border')
  content = content.replace(/border-gray-100 dark:border-gray-700/g, 'border-theme-border')
  content = content.replace(/border-gray-200/g, 'border-theme-border')
  content = content.replace(/border-gray-100/g, 'border-theme-border')
  
  // A few cleanups for edge cases from the simple string replacements
  content = content.replace(/dark:bg-theme-card/g, '') // Remove redundant dark prefix
  content = content.replace(/dark:bg-theme-bg/g, '')
  content = content.replace(/dark:text-theme-text/g, '')
  content = content.replace(/dark:text-theme-muted/g, '')
  content = content.replace(/dark:border-theme-border/g, '')
  content = content.replace(/  /g, ' ') // Cleanup double spaces

  fs.writeFileSync(file, content, 'utf8')
  console.log(`Updated ${file}`)
})
