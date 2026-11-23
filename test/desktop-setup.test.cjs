// Exercise the lazy Electron runtime setup without touching the network or disk.
// Run via `node --test test/desktop-setup.test.cjs` from a source checkout.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const { pathToFileURL } = require('node:url')
const path = require('node:path')
const root = path.resolve(__dirname, '..')

function fakeChild() {
  const child = new EventEmitter()
  child.kill = signal => { child.killed = signal }
  return child
}

test('the setup module loads without an Electron install', async () => {
  const module = await import(pathToFileURL(path.join(root, 'runtime/setup.js')).href)
  assert.equal(typeof module.createRuntimeSetup, 'function')
  assert.equal(typeof module.locateElectron, 'function')
})

test('a ready runtime needs no installer', async () => {
  const { createRuntimeSetup } = await import(pathToFileURL(path.join(root, 'runtime/setup.js')).href)
  let spawned = 0
  const setup = createRuntimeSetup({
    locate: () => ({ packageDir: '/tmp/electron', executable: '/tmp/electron/bin', installed: true }),
    startInstaller: () => { spawned += 1; return fakeChild() },
  })
  assert.equal(setup.check('owner', 'garden'), null)
  assert.equal(spawned, 0)
  setup.dispose()
})

test('a missing runtime reports preparing, then fails after a failed install', async () => {
  const { createRuntimeSetup } = await import(pathToFileURL(path.join(root, 'runtime/setup.js')).href)
  let installed = false
  const child = fakeChild()
  const setup = createRuntimeSetup({
    locate: () => ({ packageDir: '/tmp/electron', executable: '/tmp/electron/bin', installed }),
    startInstaller: () => child,
  })
  assert.equal(setup.check('owner', 'garden'), 'runtime-preparing')
  assert.equal(setup.check('owner', 'bloom:1'), 'runtime-preparing')
  child.emit('close', 1)
  assert.equal(setup.check('owner', 'garden'), 'runtime-install-failed')
  assert.equal(setup.check('owner', 'bloom:1'), 'runtime-install-failed')
  setup.dispose()
})

test('a successful install makes the next check pass', async () => {
  const { createRuntimeSetup } = await import(pathToFileURL(path.join(root, 'runtime/setup.js')).href)
  let installed = false
  const child = fakeChild()
  const setup = createRuntimeSetup({
    locate: () => ({ packageDir: '/tmp/electron', executable: '/tmp/electron/bin', installed }),
    startInstaller: () => child,
  })
  assert.equal(setup.check('owner', 'garden'), 'runtime-preparing')
  installed = true
  child.emit('close', 0)
  assert.equal(setup.check('owner', 'garden'), null)
  setup.dispose()
})

test('cancelling the last waiter stops the installer', async () => {
  const { createRuntimeSetup } = await import(pathToFileURL(path.join(root, 'runtime/setup.js')).href)
  const child = fakeChild()
  const setup = createRuntimeSetup({
    locate: () => ({ packageDir: '/tmp/electron', executable: '/tmp/electron/bin', installed: false }),
    startInstaller: () => child,
  })
  setup.check('owner', 'garden')
  setup.check('owner', 'bloom:1')
  setup.cancel('owner', 'garden')
  assert.equal(child.killed, undefined)
  setup.cancel('owner', 'bloom:1')
  assert.equal(child.killed, 'SIGKILL')
  setup.dispose()
})

test('an unsupported platform is reported as unavailable', async () => {
  const { createRuntimeSetup } = await import(pathToFileURL(path.join(root, 'runtime/setup.js')).href)
  const setup = createRuntimeSetup({
    locate: () => { throw new Error('runtime-unavailable') },
    startInstaller: () => { throw new Error('should not run') },
  })
  assert.equal(setup.check('owner', 'garden'), 'runtime-unavailable')
  setup.dispose()
})

test('a spawned installer that never exits is killed after the timeout', async () => {
  const { createRuntimeSetup } = await import(pathToFileURL(path.join(root, 'runtime/setup.js')).href)
  const child = fakeChild()
  const setup = createRuntimeSetup({
    locate: () => ({ packageDir: '/tmp/electron', executable: '/tmp/electron/bin', installed: false }),
    startInstaller: () => child,
    timeoutMs: 5,
  })
  assert.equal(setup.check('owner', 'garden'), 'runtime-preparing')
  await new Promise(resolve => setTimeout(resolve, 30))
  assert.equal(child.killed, 'SIGKILL')
  setup.dispose()
})
