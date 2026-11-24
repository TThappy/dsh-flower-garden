// The desktop window mirrors this mounted MiniGarden. All commands resolve against
// current, connected controls here, where React and the garden store live.
Object.assign(zh, {
  'desktop.downloading':'正在下载桌面组件。完成后会自动打开。', 'desktop.cancelWait':'取消等待',
  'desktop.installFailed':'桌面组件安装失败。请检查网络连接和可用磁盘空间，然后点按钮重试。',
  'desktop.waitExpired':'等待桌面组件超时，请点按钮再试一次。',
  'desktop.pin':'放到桌面', 'desktop.unpin':'收回桌面小窗', 'desktop.opening':'正在打开…',
  'desktop.error':'桌面小窗未连接。请确认桌面运行环境可用后重试。',
  'desktop.busy':'另一扇窗口正在控制桌面花园。请先在那里收回小窗。', 'desktop.close':'关闭桌面小窗',
  'desktop.unavailable':'当前环境无法启动桌面窗口。你可以继续使用随身花园。',
})
Object.assign(en, {
  'desktop.downloading':'Downloading the desktop runtime. Your window will open when it is ready.', 'desktop.cancelWait':'Cancel wait',
  'desktop.installFailed':'Desktop setup failed. Check your connection and free disk space, then try the button again.',
  'desktop.waitExpired':'Timed out waiting for desktop setup. Try the button again.',
  'desktop.pin':'Pin to desktop', 'desktop.unpin':'Bring garden back', 'desktop.opening':'Opening…',
  'desktop.error':'Desktop garden disconnected. Check the desktop runtime and try again.',
  'desktop.unavailable':'This environment cannot open a desktop window. Your pocket garden is still available.',
  'desktop.busy':'Another window controls the desktop garden. Close its desktop garden first.', 'desktop.close':'Close desktop garden',
})

function createDesktopMirror(root, t) {
  const identities = new WeakMap()
  let nextId = 0, controls = new Map()
  const meaning = node => {
    const plot = node.closest('[data-mini-plot]')
    const state = getState()
    const flower = plot && state.scenes[state.scene]?.plots[Number(plot.dataset.miniPlot)]
    return [state.scene, plot?.dataset.miniPlot, flower?.species, flower?.dna, node.textContent, node.value, node.title].join('|')
  }
  const colorKeys = 'bg-base bg-layer-1 bg-layer-2 label-primary label-secondary border-l1 border-l2 brand-primary state-success-primary state-error-primary state-warn-primary state-idle-primary'.split(' ')
  // Resolve host theme colors here, including modern CSS color functions, then
  // normalize to sRGB pixels. The companion receives colors rather than CSS.
  const colorCanvas = document.createElement('canvas')
  colorCanvas.width = colorCanvas.height = 1
  const paint = colorCanvas.getContext('2d', {willReadFrequently:true})
  const colors = new Map()
  function palette(live) {
    const theme = {}
    if (!paint) return theme
    const style = window.getComputedStyle(live)
    for (const key of colorKeys) {
      const value = style.getPropertyValue(`--dsw-alias-${key}`).trim()
      if (!value || !window.CSS.supports('color',value)) continue
      if (!colors.has(value)) {
        paint.clearRect(0,0,1,1)
        paint.fillStyle = value
        paint.fillRect(0,0,1,1)
        colors.set(value,'#'+Array.from(paint.getImageData(0,0,1,1).data, n=>n.toString(16).padStart(2,'0')).join(''))
      }
      theme[key] = colors.get(value)
    }
    return theme
  }
  function snapshot() {
    const live = root.current?.firstElementChild
    if (!live) return undefined
    const fresh = new Map()
    function encode(node) {
      if (node.nodeType === 3) return node.nodeValue
      if (node.nodeType !== 1) return ''
      const attrs = Object.fromEntries(Array.from(node.attributes).filter(attr => attr.name !== 'style').map(attr => [attr.name, attr.value]))
      for (const property of ['animation-delay','transform-origin','fill','stroke','stroke-width','stroke-linecap','stroke-dasharray','background-color']) {
        const value = node.style?.getPropertyValue(property)
        if (value) attrs[`$${property}`] = value
      }
      if (node.matches('button,select')) {
        const signature = meaning(node)
        let identity = identities.get(node)
        if (identity?.signature !== signature) {
          identity = { id: String(++nextId), signature }
          identities.set(node, identity)
        }
        fresh.set(identity.id, { node, signature })
        attrs['data-command'] = identity.id
        if (node.localName === 'select') attrs['data-selection'] = node.value
      }
      return [node.localName, attrs, Array.from(node.childNodes, encode)]
    }
    const tree = encode(live)
    controls = fresh
    return { tree, theme:palette(live), title:t('mini.title'), close:t('desktop.close'), lang:document.documentElement.lang || 'en' }
  }
  function act(action) {
    const target = controls.get(action?.id)
    if (!target) return
    const {node, signature} = target
    if (!root.current?.contains(node) || node.disabled || meaning(node) !== signature) return
    if (node.localName === 'button' && action.value === undefined) node.click()
    if (node.localName === 'select' && Array.from(node.options).some(option => option.value === action.value)) {
      node.value = action.value
      node.dispatchEvent(new Event('change', {bubbles:true}))
    }
  }
  return {snapshot, act}
}

async function desktopGardenRequest(payload) {
  const path = '/api/flower-garden/desktop'
  const options = {method:'POST',credentials:'same-origin',signal:AbortSignal.timeout(22000),headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}
  const response = await globalThis.fetch(path, options)
  if ([401,403,404,405].includes(response.status)) throw new Error('route-unavailable')
  if (response.status === 413) throw new Error('too-large')
  const result = await response.json()
  if (!response.ok && !result?.error) throw new Error('Desktop garden request failed')
  return result
}

let desktopOwnerId
function desktopOwner() {
  if (desktopOwnerId) return desktopOwnerId
  const key = 'flower-garden.desktop-owner.v1'
  try {
    const saved = window.sessionStorage.getItem(key)
    if (/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(saved ?? '')) return (desktopOwnerId = saved)
    desktopOwnerId = crypto.randomUUID()
    window.sessionStorage.setItem(key, desktopOwnerId)
  } catch { desktopOwnerId ??= crypto.randomUUID() }
  return desktopOwnerId
}

// The host prepares one shared runtime. Re-submit an open only while its original
// control is active, using the same owner, key and artwork on every request.
async function waitForDesktopOpen(open, signal, preparing) {
  const deadline = Date.now() + 600000
  for (let attempt = 0; attempt < 150 && Date.now() < deadline; attempt++) {
    if (signal.aborted) throw new Error('cancelled')
    const result = await open()
    if (signal.aborted) throw new Error('cancelled')
    if (result?.error !== 'runtime-preparing') return result
    if (attempt === 0) preparing()
    await new Promise(resolve => {
      function resume() {
        window.clearTimeout(timer)
        signal.removeEventListener('abort', resume)
        resolve()
      }
      const timer = window.setTimeout(resume, 4000)
      signal.addEventListener('abort', resume, {once:true})
      if (signal.aborted) resume()
    })
  }
  return {ok:false, open:false, error:'runtime-wait-expired'}
}

function desktopSetupError(error) {
  if (error === 'runtime-install-failed') return 'desktop.installFailed'
  if (error === 'runtime-wait-expired') return 'desktop.waitExpired'
}

function useDesktopGarden(body, t) {
  const [phase, setPhase] = React.useState('idle')
  const [message, setMessage] = React.useState('')
  const session = React.useRef(null)
  function stop() {
    const active = session.current
    if (!active) return
    session.current = null
    active.controller.abort()
    window.clearTimeout(active.timer)
    window.removeEventListener('pagehide',active.cleanup)
    desktopGardenRequest({op:'close',owner:active.owner}).catch(()=>{})
  }
  React.useEffect(()=>()=>stop(),[])
  async function toggle() {
    if (session.current) { stop(); setPhase('idle'); setMessage(''); return }
    const active = {owner:desktopOwner(), controller:new AbortController(), timer:0, cleanup:stop, previous:null}
    const mirror = createDesktopMirror(body,t)
    session.current = active
    window.addEventListener('pagehide',stop)
    setPhase('opening'); setMessage('')
    async function sync(op) {
      if (session.current !== active) return
      try {
        const snapshot = mirror.snapshot()
        const encoded = JSON.stringify(snapshot)
        const payload = {op,owner:active.owner,snapshot:encoded===active.previous ? undefined : snapshot}
        const result = op === 'open'
          ? await waitForDesktopOpen(() => desktopGardenRequest(payload), active.controller.signal, () => { setPhase('preparing'); setMessage('desktop.downloading') })
          : await desktopGardenRequest(payload)
        active.previous = encoded
        if (session.current !== active) return
        if (!result?.ok || !result.open) {
          stop()
          setPhase('idle')
          const errors = {busy:'desktop.busy', 'runtime-unavailable':'desktop.unavailable'}
          setMessage(result?.ok ? '' : desktopSetupError(result?.error) ?? errors[result?.error] ?? 'desktop.error')
          return
        }
        setPhase('open'); setMessage('')
        for (const action of result.actions ?? []) mirror.act(action)
        active.timer = window.setTimeout(()=>sync('sync'), 450)
      } catch {
        if (session.current === active) { stop(); setPhase('idle'); setMessage('desktop.error') }
      }
    }
    await sync('open')
  }
  return {phase,message,toggle,stop}
}
