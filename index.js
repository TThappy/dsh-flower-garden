import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'
import { setTimeout, clearTimeout } from 'node:timers'
/* global Response, URL */
import { Buffer } from 'node:buffer'
import process from 'node:process'

const require = createRequire(import.meta.url)
const OWNER = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i
const LIMIT = 1024 * 1024
const failure = error => ({ok: false, open: false, error})
const closed = () => ({ok: true, open: false, actions: []})

function launchElectron() {
  let executable
  // Electron's npm entry performs a blocking download on require when dist is absent.
  // Resolve the installed distribution without running its installer in the Host.
  try {
    const dist = join(dirname(require.resolve('electron/package.json')), 'dist')
    const binary = {darwin: 'Electron.app/Contents/MacOS/Electron', win32: 'electron.exe', linux: 'electron'}[process.platform]
    if (!binary) throw new Error()
    executable = join(dist, binary)
    if (!existsSync(executable)) throw new Error()
  } catch { throw new Error('runtime-unavailable') }
  // Only forward OS/desktop integration settings. The companion needs no DSH credentials.
  const env = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (/^(HOME|USERPROFILE|APPDATA|LOCALAPPDATA|SYSTEMROOT|WINDIR|TEMP|TMP|TMPDIR|PATH|DISPLAY|WAYLAND_DISPLAY|XAUTHORITY|XDG_RUNTIME_DIR|DBUS_SESSION_BUS_ADDRESS|LANG|LC_[A-Z_]+)$/i.test(key)) env[key] = value
  }
  return spawn(executable, [fileURLToPath(new URL('./runtime/main.cjs', import.meta.url))], {
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'], env, windowsHide: true,
  })
}

export function createDesktopBroker({launch = launchElectron, renderTimeoutMs = 5000} = {}) {
  let current = null, disposed = false, renderSequence = 0
  function end(session, terminate) {
    if (current !== session) return
    current = null
    clearTimeout(session.leaseTimer)
    for (const window of session.windows.values()) { clearTimeout(window.startTimer); window.render?.finish(false); window.resolve(false) }
    if (terminate) session.child.kill()
  }
  function refresh(session) {
    clearTimeout(session.leaseTimer)
    session.leaseTimer = setTimeout(() => end(session, true), 120000)
    session.leaseTimer.unref?.()
  }
  function send(session, payload) {
    try { session.child.send(payload, error => { if (error) end(session, true) }) } catch { end(session, true) }
  }
  function start(owner) {
    const child = launch(), session = {owner, child, windows:new Map(), started:false}
    current = session
    child.on('error', () => end(session, true)); child.once('exit', () => end(session, false)); child.once('disconnect', () => end(session, true))
    child.on('message', message => {
      if (current !== session) return
      const key = typeof message?.windowKey === 'string' ? message.windowKey : 'garden'
      const window = session.windows.get(key)
      if (!window) return
      if (message?.type === 'ready') { clearTimeout(window.startTimer); window.started = true; window.resolve(true) }
      else if (message?.type === 'closed') { clearTimeout(window.startTimer); window.render?.finish(false); window.resolve(false); session.windows.delete(key) }
      else if (message?.type === 'rendered' && window.render?.id === message.id) window.render.finish(message.ok === true)
      else if (message?.type === 'action' && window.started && window.actions.length < 64) {
        const action = message.action
        if (typeof action?.id !== 'string' || !/^\d{1,16}$/.test(action.id)) return
        if (action.value !== undefined && (typeof action.value !== 'string' || action.value.length > 256)) return
        window.actions.push(action.value === undefined ? {id:action.id} : {id:action.id,value:action.value})
      }
    })
    return session
  }
  function getWindow(session, key, create) {
    let window = session.windows.get(key)
    if (!window && create) {
      let resolve
      window = {key, ready:new Promise(done => { resolve = done }), resolve, actions:[], started:false}
      window.startTimer = setTimeout(() => {
        window.resolve(false)
        session.windows.delete(key)
        send(session, {type: 'close-window', windowKey: key})
        if (!session.windows.size) end(session, true)
      }, 15000)
      session.windows.set(key, window)
    }
    return window
  }
  return {
    async request(input) {
      if (disposed) return failure('unavailable')
      if (!input || typeof input.owner !== 'string' || !OWNER.test(input.owner) || !['open','sync','close'].includes(input.op)) return failure('invalid-request')
      const key = input.windowKey === undefined ? 'garden' : String(input.windowKey)
      if (!/^[\w:.~-]{1,128}$/u.test(key)) return failure('invalid-window')
      if (input.snapshot !== undefined && (!input.snapshot || typeof input.snapshot !== 'object' || Array.isArray(input.snapshot) || Buffer.byteLength(JSON.stringify(input.snapshot)) > LIMIT)) return failure('invalid-snapshot')
      if (current && current.owner !== input.owner) return failure('busy')
      let session = current
      if (input.op === 'close') {
        if (session) { const window = session.windows.get(key); if (window) { clearTimeout(window.startTimer); window.render?.finish(false); window.resolve(false); send(session,{type:'close-window',windowKey:key}); session.windows.delete(key) } if (!session.windows.size) end(session,true) }
        return closed()
      }
      if (!session) {
        if (input.op !== 'open') return closed()
        try { session = start(input.owner) } catch (error) { return failure(error.message === 'runtime-unavailable' ? error.message : 'launch-failed') }
      }
      const window = getWindow(session,key,input.op === 'open')
      if (!window) return closed()
      if (input.op === 'open' && window.started) send(session,{type:'focus',windowKey:key})
      else if (input.op === 'open' && !window.requested) {
        window.requested = true
        const mode = key.startsWith('bloom:') ? 'bloom' : key === 'garden' ? 'garden' : 'bouquet'
        send(session, {type:'open-window', windowKey:key, mode})
      }
      refresh(session)
      if (!await window.ready || session !== current) return failure('launch-failed')
      if (key !== 'garden' && input.op === 'open') {
        if (!window.render) {
          const id = ++renderSequence
          let finish
          const ready = new Promise(resolve => { finish = resolve })
          window.render = { id, ready, finish }
          const timer = setTimeout(() => finish(false), renderTimeoutMs)
          ready.then(() => clearTimeout(timer))
          send(session, {type:'snapshot', windowKey:key, snapshot:input.snapshot, id})
        }
        if (!await window.render.ready || session !== current || session.windows.get(key) !== window) {
          if (session === current && session.windows.get(key) === window) {
            session.windows.delete(key)
            send(session, {type:'close-window', windowKey:key})
            if (!session.windows.size) end(session,true)
          }
          return failure('render-failed')
        }
      } else if (input.snapshot !== undefined) send(session,{type:'snapshot',windowKey:key,snapshot:input.snapshot})
      return {ok:true,open:true,actions:window.actions.splice(0)}
    },
    dispose() { disposed=true; if(current) end(current,true) },
  }
}

export const inject = ['connection']
export function apply(ctx) {
  const broker = createDesktopBroker()
  ctx.effect(() => () => broker.dispose())
  ctx.connection.fetch.register({
    path: '/api/flower-garden/desktop', methods: ['POST'], requestBody: 'streaming',
    async fetch(request) {
      const reply = (data, status = 200) => Response.json(data, {status, headers: {'cache-control': 'no-store'}})
      if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return reply(failure('invalid-request'), 415)
      const reader = request.body?.getReader()
      if (!reader) return reply(failure('invalid-request'), 400)
      const chunks = []
      let length = 0
      try {
        for (;;) {
          const {done, value} = await reader.read()
          if (done) break
          length += value.byteLength
          if (length > LIMIT + 1024) { await reader.cancel(); return reply(failure('too-large'), 413) }
          chunks.push(value)
        }
        return reply(await broker.request(JSON.parse(Buffer.concat(chunks).toString('utf8'))))
      } catch { return reply(failure('invalid-request'), 400) }
      finally { reader.releaseLock() }
    },
  })
}
