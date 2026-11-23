import { spawn } from 'node:child_process'
import { accessSync, constants, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { clearTimeout, setTimeout } from 'node:timers'

const require = createRequire(import.meta.url)
const binaryNames = {darwin: 'Electron.app/Contents/MacOS/Electron', win32: 'electron.exe', linux: 'electron'}

// Importing the electron entry point can synchronously run its installer. Its
// package manifest and completion markers can be inspected without doing so.
export function locateElectron() {
  const binary = binaryNames[process.platform]
  if (!binary) throw new Error('runtime-unavailable')
  const manifest = require.resolve('electron/package.json')
  const pkg = require('../package.json')
  const version = pkg.dependencies?.electron ?? pkg.optionalDependencies?.electron
  if (require(manifest).version !== version) throw new Error('runtime-unavailable')
  const packageDir = dirname(manifest)
  const executable = join(packageDir, 'dist', binary)
  let installed = false
  try {
    accessSync(executable, constants.X_OK)
    installed = readFileSync(join(packageDir, 'path.txt'), 'utf8').trim() === binary &&
      readFileSync(join(packageDir, 'dist', 'version'), 'utf8').trim().replace(/^v/, '') === version
  } catch { /* The installer writes path.txt after extraction completes. */ }
  return {packageDir, executable, installed}
}

export function startElectronInstaller({packageDir}) {
  const env = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (/^(HOME|USERPROFILE|APPDATA|LOCALAPPDATA|SYSTEMROOT|WINDIR|TEMP|TMP|TMPDIR|PATH|XDG_CACHE_HOME|HTTP_PROXY|HTTPS_PROXY|NO_PROXY|GLOBAL_AGENT_HTTP_PROXY|GLOBAL_AGENT_HTTPS_PROXY|GLOBAL_AGENT_NO_PROXY|ELECTRON_GET_USE_PROXY|NODE_EXTRA_CA_CERTS|electron_config_cache)$/i.test(key)) env[key] = value
  }
  // Desktop launches the Host through Electron. Its executable must act as Node
  // for the package's install.js, and as a GUI binary only when launching a pet.
  if (process.versions.electron) env.ELECTRON_RUN_AS_NODE = '1'
  return spawn(process.execPath, [join(packageDir, 'install.js')], {
    cwd: packageDir, env, windowsHide: true, stdio: 'ignore', shell: false,
  })
}

export function createRuntimeSetup({locate = locateElectron, startInstaller = startElectronInstaller, timeoutMs = 600000} = {}) {
  let job, disposed = false
  // A failed attempt is reported once to every window that was polling it.
  const failures = new Set()
  const preparing = 'runtime-preparing'
  const failed = 'runtime-install-failed'
  function terminate(active) {
    clearTimeout(active.timer)
    active.terminating = true
    active.child.kill('SIGKILL')
  }
  return {
    check(owner, key) {
      if (disposed) return 'unavailable'
      const waiter = `${owner}/${key}`
      if (failures.delete(waiter)) return failed
      if (job) {
        job.waiters.add(waiter)
        return preparing
      }
      let info
      try { info = locate() } catch { return 'runtime-unavailable' }
      if (info.installed) return null
      let child
      try { child = startInstaller(info) } catch { return failed }
      const active = {child, waiters: new Set([waiter]), terminating: false}
      job = active
      function finish(code) {
        if (job !== active) return
        job = undefined
        clearTimeout(active.timer)
        let ready = false
        if (code === 0 && !active.terminating) {
          try { ready = locate().installed } catch { /* Report the failed verification to the caller. */ }
        }
        if (!ready && !disposed) for (const id of active.waiters) failures.add(id)
      }
      child.once('error', () => finish(1))
      child.once('close', finish)
      active.timer = setTimeout(() => terminate(active), timeoutMs)
      active.timer.unref?.()
      return preparing
    },
    cancel(owner, key) {
      const waiter = `${owner}/${key}`
      failures.delete(waiter)
      if (job?.waiters.delete(waiter) && job.waiters.size === 0 && !job.terminating) terminate(job)
    },
    dispose() {
      disposed = true
      failures.clear()
      if (job && !job.terminating) terminate(job)
    },
  }
}
