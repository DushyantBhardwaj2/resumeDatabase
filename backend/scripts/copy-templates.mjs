import { cpSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const src = join(__dirname, '..', 'src', 'infrastructure', 'latex', 'templates')
const dst = join(__dirname, '..', 'dist', 'infrastructure', 'latex', 'templates')

if (!existsSync(src)) {
  console.error('Template source not found:', src)
  process.exit(1)
}

cpSync(src, dst, { recursive: true, force: true })
console.log(`Templates copied to ${dst}`)
