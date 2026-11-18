/**
 * Builds client.js from the ordered fragments in src/.
 *
 * The DSH loader takes one classic script that calls window.__ModuleLoader__.load,
 * and every fragment shares the factory's closure, so the build is a plain
 * ordered concatenation: no bundler, no transform, no dependency.
 *   node tools/build.cjs          write client.js
 *   node tools/build.cjs --check  fail when client.js is stale
 */
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.join(__dirname, '..')
const SRC = path.join(ROOT, 'src')
const OUT = path.join(ROOT, 'client.js')

const parts = fs.readdirSync(SRC).filter(name => /^\d\d[a-z]?-.+\.js$/u.test(name)).sort()
if (parts.length === 0) throw new Error('no fragments found in src/')
const text = parts.map(name => fs.readFileSync(path.join(SRC, name), 'utf8')).join('')

try {
  // Compile only; the factory needs a browser to run.
  new (require('node:vm').Script)(text, { filename: 'client.js' })
} catch (error) {
  console.error(`client.js would not parse: ${error.message}`)
  process.exit(1)
}

if (process.argv.includes('--check')) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : ''
  if (current !== text) {
    console.error('client.js is stale: run `npm run build`')
    process.exit(1)
  }
  console.log(`client.js is up to date (${parts.length} fragments)`)
} else {
  fs.writeFileSync(OUT, text)
  console.log(`wrote client.js from ${parts.length} fragments, ${(text.length / 1024).toFixed(0)} KB`)
}
