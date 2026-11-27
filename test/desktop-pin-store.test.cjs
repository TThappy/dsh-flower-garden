// Validate the pinned-artwork store: it writes a DOM snapshot to disk and the
// desktop window replays it later, so both the whitelist and the file handling
// need to hold. Run via `node --test test/desktop-pin-store.test.cjs`.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const { createPinStore, validSnapshot, pinMode } = require(path.join(root, 'runtime/pin-store.cjs'))

const bloomTree = ['div', { class: 'fg-desktopBloom' }, [
  ['svg', { viewBox: '0 0 100 100', fill: 'url(#g)' }, [
    ['g', {}, [['path', { d: 'M0 0L1 1', fill: '#abc' }, []]]],
  ]],
]]
const bloom = { mode: 'bloom', title: 'Daisy', lang: 'en', tree: bloomTree }
const bouquet = { mode: 'bouquet', title: 'Bouquet', lang: 'zh', tree: ['div', { class: 'fg-vase fg-vaseStill' }, []] }

function tempStore() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fg-pins-'))
  return { store: createPinStore(directory), directory }
}

test('pinMode accepts artwork keys and precisely the supported Xiaohei key', () => {
  assert.equal(pinMode('pet:xiaohei'), 'pet')
  assert.equal(pinMode('pet:unowned'), null)
  assert.equal(pinMode('bloom:daisy:base:x1'), 'bloom')
  assert.equal(pinMode('bouquet:vase-3'), 'bouquet')
  assert.equal(pinMode('garden'), null)
  assert.equal(pinMode('bloom:'), null)
  assert.equal(pinMode('bloom:' + 'x'.repeat(200)), null)
  assert.equal(pinMode(undefined), null)
})

test('validSnapshot keeps the whitelisted tree', () => {
  assert.equal(validSnapshot('bloom:daisy', bloom), true)
  assert.equal(validSnapshot('bouquet:vase-1', bouquet), true)
})

test('validSnapshot rejects a key that does not match its mode', () => {
  assert.equal(validSnapshot('bouquet:vase-1', bloom), false)
  assert.equal(validSnapshot('garden', bloom), false)
})

test('validSnapshot rejects the wrong root class', () => {
  assert.equal(validSnapshot('bloom:daisy', { ...bloom, tree: ['div', { class: 'something-else' }, []] }), false)
})

test('validSnapshot rejects tags and attributes outside the whitelist', () => {
  const script = { ...bloom, tree: ['div', { class: 'fg-desktopBloom' }, [['script', {}, []]]] }
  const onclick = { ...bloom, tree: ['div', { class: 'fg-desktopBloom' }, [['g', { onclick: 'x' }, []]]] }
  assert.equal(validSnapshot('bloom:daisy', script), false)
  assert.equal(validSnapshot('bloom:daisy', onclick), false)
})

test('validSnapshot only allows same-document url() references', () => {
  const ok = { ...bloom, tree: ['div', { class: 'fg-desktopBloom' }, [['path', { fill: 'url(#grad-1)' }, []]]] }
  const external = { ...bloom, tree: ['div', { class: 'fg-desktopBloom' }, [['path', { fill: 'url(https://example.com/a.svg)' }, []]]] }
  const scriptUrl = { ...bloom, tree: ['div', { class: 'fg-desktopBloom' }, [['path', { fill: 'url(javascript:alert(1))' }, []]]] }
  assert.equal(validSnapshot('bloom:daisy', ok), true)
  assert.equal(validSnapshot('bloom:daisy', external), false)
  assert.equal(validSnapshot('bloom:daisy', scriptUrl), false)
})

test('validSnapshot rejects malformed nodes', () => {
  assert.equal(validSnapshot('bloom:daisy', { ...bloom, tree: ['div', { class: 'fg-desktopBloom' }] }), false)
  assert.equal(validSnapshot('bloom:daisy', { ...bloom, tree: ['div', { class: 'fg-desktopBloom' }, [['g', {}, []]], {}] }), false)
  assert.equal(validSnapshot('bloom:daisy', { ...bloom, title: undefined }), false)
})

test('a saved snapshot loads back with its geometry', () => {
  const { store } = tempStore()
  store.save('bloom:daisy', bloom)
  store.move('bloom:daisy', { bounds: { x: 10, y: 20, width: 300, height: 400 }, compact: null })
  const loaded = store.load('bloom:daisy')
  assert.equal(loaded.mode, 'bloom')
  assert.equal(loaded.snapshot.title, 'Daisy')
  assert.deepEqual(loaded.snapshot.tree, bloomTree)
  assert.deepEqual(loaded.geometry.bounds, { x: 10, y: 20, width: 300, height: 400 })
})

test('geometry is optional and invalid geometry is dropped', () => {
  const { store } = tempStore()
  store.save('bouquet:vase-1', bouquet)
  assert.equal(store.load('bouquet:vase-1').geometry, null)
  store.move('bouquet:vase-1', { bounds: { x: 0, y: 0, width: 0, height: 10 }, compact: null })
  assert.equal(store.load('bouquet:vase-1').geometry, null)
})

test('removing a pin deletes both files', () => {
  const { store } = tempStore()
  store.save('bloom:daisy', bloom)
  store.move('bloom:daisy', { bounds: { x: 1, y: 1, width: 100, height: 100 }, compact: null })
  store.remove('bloom:daisy')
  assert.equal(store.load('bloom:daisy'), null)
})

test('an invalid snapshot is refused instead of written', () => {
  const { store } = tempStore()
  assert.throws(() => store.save('bloom:daisy', { ...bloom, mode: 'bouquet' }), /Invalid pin snapshot/u)
  assert.equal(store.load('bloom:daisy'), null)
})

test('one key cannot read another key record', () => {
  const { store } = tempStore()
  store.save('bloom:daisy', bloom)
  assert.equal(store.load('bloom:tulip'), null)
})

test('invalid keys are refused by the store', () => {
  const { directory, store } = tempStore()
  assert.throws(() => store.load('garden'), /Invalid pinned window key/u)
  assert.throws(() => store.load('../../etc/passwd'), /Invalid pinned window key/u)
  // save() validates the snapshot first, so a bad key never reaches the filesystem.
  assert.throws(() => store.save('../../etc/passwd', bloom), /Invalid pin snapshot/u)
  assert.deepEqual(fs.readdirSync(path.join(directory, 'pins-v1')), [])
})
