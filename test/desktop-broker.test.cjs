const { test } = require('node:test')
const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const { EventEmitter } = require('node:events')

// Exercise the same single-owner IPC lifecycle as the desktop window, on CI without a display.
test('opening twice shares one child and desktop clicks return once to their owner', async t => {
  const { createDesktopBroker } = await import('../index.js')
  const child = new EventEmitter()
  child.connected = true
  child.send = () => true
  child.kill = () => { child.connected = false; child.emit('exit', 0); return true }
  let launches = 0
  const broker = createDesktopBroker({ launch() {
    launches++
    setImmediate(() => child.emit('message', { type: 'ready' }))
    return child
  } })
  t.after(() => broker.dispose())
  const owner = randomUUID()
  const request = (op, extra) => broker.request({ op, owner, ...extra })
  await request('open')
  await request('open')
  assert.equal(launches, 1)
  const other = await broker.request({ op: 'close', owner: randomUUID() })
  assert.equal(other.error, 'busy')
  const action = { id: '1' }
  child.emit('message', { type: 'action', action })
  const result = await request('sync', { snapshot: {} })
  assert.deepEqual(result.actions, [action])
  assert.deepEqual((await request('sync', { snapshot: {} })).actions, [])
})
