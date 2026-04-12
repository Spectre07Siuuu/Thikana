import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serverDir = join(__dirname, 'server')
execSync('npm.cmd install multer', { cwd: serverDir, stdio: 'inherit' })
console.log('Done!')
