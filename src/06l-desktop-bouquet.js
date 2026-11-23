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
function bouquetRequest(id, op, snapshot) {
  return desktopGardenRequest({op, owner:desktopOwner(), windowKey:typeof id === 'string' ? id : `bouquet:${id}`, snapshot})
}
function watchBouquet(id, entry) {
  entry.timer = window.setTimeout(async () => {
    try {
      const result = await bouquetRequest(id, 'sync')
      if (bouquetPins.get(id) !== entry) return
      if (result.ok && result.open) watchBouquet(id, entry)
      else updateBouquetPin(id, null)
    } catch {
      if (bouquetPins.get(id) === entry) {
        // Keep the close action available while the connection is interrupted.
        const failed = {phase:'open', error:'desktop.error'}
        updateBouquetPin(id, failed)
        watchBouquet(id, failed)
      }
    }
  }, 15000)
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

async function toggleArtPin(id, capture) {
  const previous = bouquetPins.get(id)
  if (previous?.phase === 'pending') return
  const closing = previous?.phase === 'open'
  window.clearTimeout(previous?.timer)
  updateBouquetPin(id, {phase:'pending'})
  try {
    const result = await bouquetRequest(id, closing ? 'close' : 'open', closing ? undefined : capture())
    if (!result.ok || closing === !!result.open) throw new Error(result.error || 'unavailable')
    if (closing) updateBouquetPin(id, null)
    else {
      const entry = {phase:'open'}
      updateBouquetPin(id, entry)
      watchBouquet(id, entry)
    }
  } catch (error) {
    const message = closing ? 'desktop.unpinFailed' : ({'Bloom artwork missing':'desktop.artMissing','render-failed':'desktop.artMissing','Bouquet artwork missing':'desktop.artMissing','Invalid bouquet drawing':'desktop.artMissing','launch-failed':'desktop.launchFailed','invalid-snapshot':'desktop.tooLarge','too-large':'desktop.tooLarge','route-unavailable':'desktop.route',busy:'desktop.busy','runtime-unavailable':'desktop.unavailable'}[error.message] || 'desktop.error')
    const bloomErrors = {'desktop.artMissing':'bag.pinArtError','desktop.launchFailed':'bag.pinLaunchError','desktop.unpinFailed':'bag.unpinError','desktop.tooLarge':'bag.pinSizeError'}
    const pinError = typeof id === 'string' ? bloomErrors[message] ?? message : message
    const failed = {phase:closing ? 'open' : 'idle', error:pinError}
    updateBouquetPin(id, failed)
    if (closing) watchBouquet(id, failed)
  }
}
