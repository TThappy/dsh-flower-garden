// The desktop pet size is one device-wide preference: clamp it, turn it into
// window dimensions, and let the broker broadcast it to live windows.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const { EventEmitter } = require('node:events')
const { randomUUID } = require('node:crypto')
const root = path.resolve(__dirname, '..')
const { normalizePetSize, petDimensions } = require(path.join(root, 'runtime/pet-size.cjs'))

test('the size clamps to 50..150 and defaults to 100', () => {
  assert.equal(normalizePetSize(undefined), 100)
  assert.equal(normalizePetSize(null), 100)
  assert.equal(normalizePetSize(''), 100)
  assert.equal(normalizePetSize('abc'), 100)
  assert.equal(normalizePetSize(Number.NaN), 100)
  assert.equal(normalizePetSize(49), 50)
  assert.equal(normalizePetSize(151), 150)
  assert.equal(normalizePetSize(80.6), 81)
  assert.equal(normalizePetSize('120'), 120)
})

test('dimensions scale from the 280x300 default', () => {
  assert.deepEqual(petDimensions(100), { width: 280, height: 300 })
  assert.deepEqual(petDimensions(50), { width: 140, height: 150 })
  assert.deepEqual(petDimensions(150), { width: 420, height: 450 })
  assert.deepEqual(petDimensions(999), { width: 420, height: 450 })
})

async function brokerWithChild() {
  const { createDesktopBroker } = await import('../index.js')
  const child = new EventEmitter()
  const messages = []
  child.connected = true
  child.send = message => {
    messages.push(message)
    if (message.type === 'snapshot') setImmediate(() => child.emit('message', { type: 'rendered', id: message.id, windowKey: message.windowKey, ok: true }))
    if (message.type === 'open-window' || message.type === 'restore-window') setImmediate(() => child.emit('message', { type: 'ready', windowKey: message.windowKey }))
    return true
  }
  child.kill = () => { child.connected = false; child.emit('exit', 0); return true }
  const broker = createDesktopBroker({ launch: () => child })
  return { broker, child, messages }
}

test('a pet-size request is refused without a finite size', async t => {
  const { broker } = await brokerWithChild()
  t.after(() => broker.dispose())
  const owner = randomUUID()
  assert.equal((await broker.request({ op: 'pet-size', owner })).error, 'invalid-size')
  assert.equal((await broker.request({ op: 'pet-size', owner, petSize: Number.NaN })).error, 'invalid-size')
})

test('a pet-size request reaches every open window and is clamped', async t => {
  const { broker, messages } = await brokerWithChild()
  t.after(() => broker.dispose())
  const owner = randomUUID()
  await broker.request({ op: 'open', owner, windowKey: 'bloom:daisy:base:x1' })
  messages.length = 0
  assert.deepEqual(await broker.request({ op: 'pet-size', owner, petSize: 500 }), { ok: true })
  const sized = messages.filter(message => message.type === 'pet-size')
  assert.equal(sized.length, 1)
  assert.equal(sized[0].petSize, 150)
})

test('opening a window passes the requested size along', async t => {
  const { broker, messages } = await brokerWithChild()
  t.after(() => broker.dispose())
  const owner = randomUUID()
  await broker.request({ op: 'open', owner, windowKey: 'bloom:daisy:base:x1', petSize: 60 })
  const open = messages.find(message => message.type === 'open-window')
  assert.equal(open.petSize, 60)
})
