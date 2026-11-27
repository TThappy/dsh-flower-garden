// Capture the finished album drawing on click. Mounted album cards can disappear
// when navigating, so window ownership and the immutable snapshot live separately.
Object.assign(zh, {'desktop.working':'处理中…','desktop.route':'桌面窗口服务未连接，请重新载入花园插件。','desktop.artMissing':'无法读取这张花束卡的插花图。','desktop.launchFailed':'桌面花瓶启动失败，请关闭旧桌面小窗后重试。','desktop.tooLarge':'这束插花的绘图超过桌面窗口大小限制。','desktop.pinBouquet':'钉到桌面', 'desktop.unpinBouquet':'从桌面收回', 'desktop.unpinFailed':'未能收回花瓶，请再试一次。'})
Object.assign(en, {'desktop.working':'Working…','desktop.route':'The desktop service is unavailable. Reload the garden plugin.','desktop.artMissing':'The artwork on this bouquet card could not be read.','desktop.launchFailed':'The vase could not open. Close any previous desktop garden windows and try again.','desktop.tooLarge':'This arrangement exceeds the desktop drawing size limit.','desktop.pinBouquet':'Pin vase to desktop', 'desktop.unpinBouquet':'Remove vase from desktop', 'desktop.unpinFailed':'Could not close the vase. Try again.'})
const bouquetSvgTags = new Set('svg g defs path circle ellipse rect polygon polyline line stop linearGradient radialGradient clipPath mask pattern'.split(' '))
const bouquetSvgAttrs = new Set('viewBox preserveAspectRatio id d x y x1 y1 x2 y2 cx cy r rx ry width height fill fill-rule fill-opacity stroke stroke-width stroke-linecap stroke-linejoin stroke-dasharray stroke-opacity transform opacity points offset stop-color stop-opacity gradientUnits gradientTransform clip-path clip-rule mask vector-effect'.split(' '))
const bouquetStyles = new Map([
  ['animation-delay', /^-?[\d.]+m?s$/], ['transform-origin', /^-?[\d.]+px -?[\d.]+px$/],
  ['fill', /^(?:#[\da-f]{3,8}|none)$/i], ['stroke', /^(?:#[\da-f]{3,8}|none)$/i],
  ['stroke-width', /^[\d.]+(?:px)?$/], ['stroke-linecap', /^(?:round|butt|square)$/], ['stroke-dasharray', /^[\d., px]+$/],
])
function encodeDesktopArtwork(root, stems = []) {
  function encode(node) {
    const tag = node.localName
    const isSvg = node.namespaceURI === 'http://www.w3.org/2000/svg'
    if (isSvg ? !bouquetSvgTags.has(tag) : tag !== 'div' && tag !== 'span') return null
    const attrs = {}
    for (const attr of node.attributes) {
      if (attr.name === 'class') {
        attrs.class = attr.value.split(/\s+/).filter(name => /^fg-[\w-]+$/.test(name)).join(' ')
      } else if (isSvg && bouquetSvgAttrs.has(attr.name)) {
        if (/url\s*\(/i.test(attr.value) && !/^url\(#[\w:.-]+\)(?:\s+#[\da-f]+)?$/i.test(attr.value)) continue
        attrs[attr.name] = attr.value
      }
    }
    for (const [property, rule] of bouquetStyles) {
      const value = node.style?.getPropertyValue(property)
      if (value && rule.test(value)) attrs[`$${property}`] = value
    }
    const index = stems.indexOf(node)
    if (index !== -1) attrs.$transform = stemTilt(index, stems.length)
    return [tag, attrs, Array.from(node.children, encode).filter(Boolean)]
  }
  return encode(root)
}

function snapshotBouquet(container, title) {
  const root = container?.querySelector('.fg-cardVase > .fg-vaseStill')
  if (!root) throw new Error('Bouquet artwork missing')
  const stems = Array.from(root.children).filter(node => node.classList.contains('fg-vaseStem'))
  if (!stems.length || stems.length > BOUQUET_MAX) throw new Error('Invalid bouquet drawing')
  return {mode:'bouquet', tree:encodeDesktopArtwork(root, stems), title, lang:document.documentElement.lang || 'en'}
}

const bouquetPins = new Map()
const bouquetPinListeners = new Set()
const noBouquetPin = Object.freeze({phase:'idle'})
function subscribeBouquetPins(listener) {
  bouquetPinListeners.add(listener)
  return () => bouquetPinListeners.delete(listener)
}
function updateBouquetPin(id, entry) {
  if (entry) bouquetPins.set(id, entry)
  else bouquetPins.delete(id)
  for (const listener of bouquetPinListeners) listener()
}
const pinStoragePrefix = 'flower-garden.desktop-pin.v1.'
function artWindowKey(id) { return typeof id === 'string' ? id : `bouquet:${id}` }
function artIdFromWindowKey(key) {
  if (key === 'pet:xiaohei') return key
  if (/^bloom:[\w:.~-]{1,122}$/.test(key)) return key
  if (/^bouquet:\d{1,16}$/.test(key)) {
    const id = Number(key.slice(8))
    if (Number.isSafeInteger(id) && artWindowKey(id) === key) return id
  }
  return null
}
function rememberArtPin(id, pinned) {
  const key = pinStoragePrefix + artWindowKey(id)
  try {
    if (pinned) window.localStorage.setItem(key, '1')
    else window.localStorage.removeItem(key)
  } catch { /* A window remains usable when browser storage is unavailable. */ }
}
function bouquetRequest(id, op, snapshot) {
  const sizing = op === 'close' ? {} : {petSize:currentPetSize()}
  return desktopGardenRequest({op, owner:desktopOwner(), windowKey:artWindowKey(id), snapshot, ...sizing})
}
function watchBouquet(id, entry) {
  entry.timer = window.setTimeout(() => reconcileArtPin(id, entry, false), 15000)
}
async function reconcileArtPin(id, entry, restore) {
  if (bouquetPins.get(id) !== entry) return
  try {
    let result = await bouquetRequest(id, restore ? 'restore' : 'sync')
    if (bouquetPins.get(id) !== entry) return
    // A restarted broker has no live windows. Restore replays its saved artwork.
    // A user-dismissed window has no saved record and returns closed here.
    if (!restore && result.ok && !result.open) result = await bouquetRequest(id, 'restore')
    if (bouquetPins.get(id) !== entry) return
    if (result.ok && !result.open) {
      rememberArtPin(id, false)
      updateBouquetPin(id, null)
      return
    }
    if (!result.ok) throw new Error(result.error)
    if (entry.error) {
      entry = {phase:'open'}
      updateBouquetPin(id, entry)
    }
  } catch (error) {
    if (bouquetPins.get(id) !== entry) return
    const message = error.message === 'busy' ? 'desktop.busy' : 'desktop.error'
    if (entry.error !== message) {
      entry = {phase:'open', error:message}
      updateBouquetPin(id, entry)
    }
  }
  watchBouquet(id, entry)
}
// Keep one small hint per confirmed pin. The host owns its artwork and geometry.
function trackDesktopArtPins() {
  if (typeof window === 'undefined' || !window.addEventListener) return
  function hydrate(key) {
    if (!key?.startsWith(pinStoragePrefix)) return
    const id = artIdFromWindowKey(key.slice(pinStoragePrefix.length))
    if (id === null || bouquetPins.has(id)) return
    const entry = {phase:'open'}
    updateBouquetPin(id, entry)
    reconcileArtPin(id, entry, true)
  }
  function onStorage(event) {
    if (event.key === petSizeKey || event.key === null) setPetSize(event.newValue, false)
    if (!event.key?.startsWith(pinStoragePrefix)) return
    if (event.newValue === '1') hydrate(event.key)
    else if (event.newValue === null) {
      const id = artIdFromWindowKey(event.key.slice(pinStoragePrefix.length))
      const entry = bouquetPins.get(id)
      if (entry?.phase === 'open') { window.clearTimeout(entry.timer); updateBouquetPin(id, null) }
    }
  }
  window.addEventListener('storage', onStorage)
  try {
    const storage = window.localStorage
    for (let i = 0; i < storage.length; i++) hydrate(storage.key(i))
  } catch { /* Storage can be disabled in the browser. */ }
  return () => {
    window.removeEventListener('storage', onStorage)
    for (const entry of bouquetPins.values()) { window.clearTimeout(entry.timer); entry.controller?.abort() }
    bouquetPins.clear()
  }
}
function toggleBouquetPin(card, container, t) {
  return toggleArtPin(card.id, () => snapshotBouquet(container, card.title || t(`vase.${card.vase}`)))
}

function toggleBloomPin(id, svg, title) {
  return toggleArtPin(id, () => {
    if (svg?.localName !== 'svg') throw new Error('Bloom artwork missing')
    const tree = ['div', {class:'fg-desktopBloom'}, [encodeDesktopArtwork(svg)]]
    return {mode:'bloom', tree, title, lang:document.documentElement.lang || 'en'}
  })
}

function cancelArtOpen(id) {
  const entry = bouquetPins.get(id)
  if (!entry?.controller) return
  entry.controller.abort()
  updateBouquetPin(id, null)
  bouquetRequest(id, 'close').catch(() => {})
}

async function toggleArtPin(id, capture) {
  const previous = bouquetPins.get(id)
  if (previous?.phase === 'pending') return
  if (previous?.phase === 'preparing') { cancelArtOpen(id); return }
  const closing = previous?.phase === 'open'
  window.clearTimeout(previous?.timer)
  const controller = closing ? null : new AbortController()
  updateBouquetPin(id, {phase:'pending', controller})
  try {
    const snapshot = closing ? undefined : capture()
    const result = closing ? await bouquetRequest(id, 'close') : await waitForDesktopOpen(
      () => bouquetRequest(id, 'open', snapshot), controller.signal,
      () => updateBouquetPin(id, {phase:'preparing', controller, status:'desktop.downloading'}),
    )
    if (controller?.signal.aborted) return
    if (!result.ok || closing === !!result.open) throw new Error(result.error || 'unavailable')
    rememberArtPin(id, !closing)
    if (closing) updateBouquetPin(id, null)
    else {
      const entry = {phase:'open'}
      updateBouquetPin(id, entry)
      watchBouquet(id, entry)
    }
  } catch (error) {
    if (controller?.signal.aborted) return
    if (controller && (error.message === 'runtime-wait-expired' || error.name === 'TimeoutError')) bouquetRequest(id, 'close').catch(() => {})
    const message = closing ? 'desktop.unpinFailed' : desktopSetupError(error.message) ?? ({'Bloom artwork missing':'desktop.artMissing','render-failed':'desktop.artMissing','Bouquet artwork missing':'desktop.artMissing','Invalid bouquet drawing':'desktop.artMissing','launch-failed':'desktop.launchFailed','invalid-snapshot':'desktop.tooLarge','too-large':'desktop.tooLarge','route-unavailable':'desktop.route',busy:'desktop.busy','runtime-unavailable':'desktop.unavailable'}[error.message] || 'desktop.error')
    const bloomErrors = {'desktop.artMissing':'bag.pinArtError','desktop.launchFailed':'bag.pinLaunchError','desktop.unpinFailed':'bag.unpinError','desktop.tooLarge':'bag.pinSizeError'}
    const pinError = typeof id === 'string' ? bloomErrors[message] ?? message : message
    const failed = {phase:closing ? 'open' : 'idle', error:pinError}
    updateBouquetPin(id, failed)
    if (closing) watchBouquet(id, failed)
  }
}
