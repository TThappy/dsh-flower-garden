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

test('pinning a saved arrangement first opens only its own window', async t => {
  const { createDesktopBroker } = await import('../index.js')
  const child = new EventEmitter()
  const messages = []
  child.send = message => {
    messages.push(message)
    if (message.type === 'snapshot') setImmediate(() => child.emit('message', {type:'rendered', id:message.id, windowKey:message.windowKey, ok:true}))
    if (message.type === 'open-window') setImmediate(() => child.emit('message', { type: 'ready', windowKey: message.windowKey }))
    return true
  }
  child.kill = () => child.emit('exit', 0)
  const broker = createDesktopBroker({ launch: () => child })
  t.after(() => broker.dispose())
  const owner = randomUUID()
  const windowKey = 'bouquet:42'
  const snapshot = { mode: 'bouquet', tree: ['div', {class:'fg-vase fg-vaseStill'}, []] }
  const result = await broker.request({ op: 'open', owner, windowKey, snapshot })
  assert.equal(result.open, true)
  assert.deepEqual(messages.filter(message => message.type === 'open-window').map(message => message.windowKey), [windowKey])
  assert.ok(messages.some(message => message.snapshot === snapshot && message.windowKey === windowKey))
})

for (const outcome of ['rejected', 'timeout', 'closed']) {
  test(`a bouquet whose rendering is ${outcome} reports render-failed`, async t => {
    const { createDesktopBroker } = await import('../index.js')
    const child = new EventEmitter()
    child.send = ({type, windowKey, id}) => {
      if (type === 'open-window') setImmediate(() => child.emit('message', {type:'ready', windowKey}))
      if (type === 'snapshot' && outcome !== 'timeout') setImmediate(() => child.emit('message', {
        type: outcome === 'closed' ? 'closed' : 'rendered', windowKey, id, ok:false,
      }))
    }
    child.kill = () => child.emit('exit', 0)
    const broker = createDesktopBroker({launch: () => child, renderTimeoutMs: 50})
    t.after(() => broker.dispose())
    const result = await broker.request({op:'open', owner:randomUUID(), windowKey:'bouquet:3', snapshot:{tree:[]}})
    assert.deepEqual(result, {ok:false, open:false, error:'render-failed'})
  })
}
