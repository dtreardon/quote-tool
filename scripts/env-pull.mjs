// Pull the linked Vercel project's Production env vars into .env.local, made safe
// for local use. Run with: npm run env:pull   (strip only, no pull: --strip-only)
//
// - Removes VERCEL=1 and every VERCEL_* system line. VERCEL=1 makes /api/pdf use
//   the serverless Chromium, which breaks local PDF saving on Windows.
// - The Vercel CLI appends lines to .gitignore on every pull; .gitignore already
//   ignores .env* and .vercel, so it is put back exactly as it was.
// - Never prints values. Sensitive vars in Vercel can't be pulled and arrive as
//   "[SENSITIVE]"; the script lists their names so they can be filled in by hand.
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const ENV_FILE = '.env.local'
const stripOnly = process.argv.includes('--strip-only')

if (!stripOnly) {
  const gitignore = existsSync('.gitignore') ? readFileSync('.gitignore') : null
  // One command string through the shell: vercel is a .cmd shim on Windows
  const pull = spawnSync(`vercel env pull ${ENV_FILE} --environment=production --yes`, { stdio: 'inherit', shell: true })
  if (gitignore && !readFileSync('.gitignore').equals(gitignore)) {
    writeFileSync('.gitignore', gitignore)
    console.log('Restored .gitignore (the Vercel CLI had appended to it).')
  }
  if (pull.status !== 0) {
    console.error('vercel env pull failed — is the Vercel CLI installed, logged in, and this folder linked?')
    process.exit(1)
  }
}

if (!existsSync(ENV_FILE)) {
  console.error(`${ENV_FILE} not found.`)
  process.exit(1)
}

const text = readFileSync(ENV_FILE, 'utf8')
const eol = text.includes('\r\n') ? '\r\n' : '\n'
const removed = []
const placeholders = []
const kept = text.split(/\r?\n/).filter(line => {
  const name = /^\s*(?:export\s+)?([A-Za-z0-9_]+)\s*=/.exec(line)?.[1]
  if (name && /^VERCEL(_|$)/.test(name)) { removed.push(name); return false }
  if (name && line.includes('[SENSITIVE]')) placeholders.push(name)
  return true
})
writeFileSync(ENV_FILE, kept.join(eol))

console.log(removed.length ? `Removed Vercel system lines: ${removed.join(', ')}` : 'No Vercel system lines to remove.')
if (placeholders.length) {
  console.log(`\nStill "[SENSITIVE]" placeholders — paste the real values into ${ENV_FILE}:\n  ${placeholders.join('\n  ')}`)
}
