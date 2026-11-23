// Verify that an npm installation receives the local desktop UI and its resources.
// Run via `node --test test/desktop-package.test.cjs` from a source checkout.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { execFileSync } = require('node:child_process')
const root = path.resolve(__dirname, '..')
// npm insists on a writable cache; the developer's ~/.npm may not be, and CI should
// not depend on whichever machine runs this.
const cache = fs.mkdtempSync(path.join(os.tmpdir(), 'fg-pack-'))

test('desktop entry and local assets ship with the plugin', () => {
  const [pack] = JSON.parse(execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['pack', '--dry-run', '--json', '--ignore-scripts', '--cache', cache], { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' }))
  const files = new Set(pack.files.map(file => file.path))
  assert.ok(files.has('runtime/garden.html'))
  assert.ok(files.has('runtime/bouquet.html'))
  for (const page of Array.from(files).filter(file => /^runtime\/[^/]+\.html$/u.test(file))) {
    const html = fs.readFileSync(path.join(root, page), 'utf8')
    for (const [, url] of html.matchAll(/(?:src|href)=["']([^"']+)["']/gu)) {
      assert.ok(!/^[a-z]+:|^\/\//iu.test(url), `Desktop UI must load offline: ${url}`)
      const asset = path.posix.join(path.posix.dirname(page), url)
      assert.ok(files.has(asset), `Missing desktop resource: ${asset}`)
    }
  }
})

test.after(() => fs.rmSync(cache, { recursive: true, force: true }))
