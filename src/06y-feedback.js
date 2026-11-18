
// Feedback layer: synthesised sounds (off by default), fly-to animations and the item hotbar.
Object.assign(zh, {
  'discovery.noted':'新发现已记入图鉴', 'settings.sound':'音效',
  'bar.title':'快捷道具栏', 'bar.drag':'拖到花圃上使用', 'bar.pick':'点一个花圃使用{item}', 'bar.cannot':'这里用不了{item}',
})
Object.assign(en, {
  'discovery.noted':'new discovery recorded', 'settings.sound':'Sound effects',
  'bar.title':'Quick supplies', 'bar.drag':'Drag onto a plot to use', 'bar.pick':'Pick a plot for {item}', 'bar.cannot':'{item} cannot be used here',
})

const SOUNDS = {
  harvest: [[660, 0, 0.09], [880, 0.08, 0.12]],
  coin: [[988, 0, 0.06], [1319, 0.06, 0.1]],
  water: [[420, 0, 0.08], [340, 0.07, 0.1]],
  plant: [[330, 0, 0.08], [392, 0.07, 0.08]],
  gold: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.2]],
  error: [[200, 0, 0.15]],
}
let audioContext = null
/** Short synthesised tones; no audio files, and silent unless the player turned sound on. */
function playSound(kind) {
  try {
    if (typeof window === 'undefined' || getState().ui?.sound !== true) return
    const Ctor = window.AudioContext ?? window.webkitAudioContext
    if (Ctor === undefined) return
    audioContext = audioContext ?? new Ctor()
    const start = audioContext.currentTime
    for (const [freq, at, len] of SOUNDS[kind] ?? []) {
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, start + at)
      gain.gain.exponentialRampToValueAtTime(0.12, start + at + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + at + len)
      osc.connect(gain)
      gain.connect(audioContext.destination)
      osc.start(start + at)
      osc.stop(start + at + len + 0.02)
    }
  } catch (error) {
    // Sound is decoration; a browser that refuses audio must not break the action.
  }
}

/** A glyph that flies from one element to another, then the target gives a small bump. */
function flyTo(source, target, glyph) {
  try {
    if (!source || !target || typeof document === 'undefined' || typeof target.getBoundingClientRect !== 'function') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const from = source.getBoundingClientRect(), to = target.getBoundingClientRect()
    const node = document.createElement('span')
    if (typeof node.animate !== 'function') return
    node.className = 'fg-fly'
    node.textContent = glyph
    node.style.left = `${from.left + from.width / 2}px`
    node.style.top = `${from.top + from.height / 2}px`
    document.body.appendChild(node)
    const dx = to.left + to.width / 2 - (from.left + from.width / 2), dy = to.top + to.height / 2 - (from.top + from.height / 2)
    const flight = node.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 50}px) scale(1.35)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) scale(.45)`, opacity: 0.25 },
    ], { duration: 650, easing: 'cubic-bezier(.3,.7,.4,1)' })
    const done = () => node.remove()
    flight.onfinish = done
    flight.oncancel = done
    window.setTimeout(done, 900) // fallback when the browser never finishes the animation
    target.animate?.([{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 320, delay: 560 })
  } catch (error) {
    // Animation is decoration as well.
  }
}

/** Supplies the player owns, as slots above the plots: drag one onto a plot, or click it and then a plot. */
function QuickBar({ state, t, tool, onPick, onUse, onDragItem }) {
  const items = ITEMS.filter(item => item.kind === 'consumable' && (state.bag?.[item.id] ?? 0) > 0)
  if (items.length === 0) return null
  return h('div', { className: 'fg-hotbar', role: 'toolbar', 'aria-label': t('bar.title') },
    items.map(item => {
      const targeted = item.id === 'fertilizer' || item.id === 'compost'
      return h('button', {
        key: item.id, type: 'button', className: 'fg-slot fg-hotSlot', draggable: true, 'data-hot': item.id,
        'aria-pressed': targeted ? (tool === item.id ? 'true' : 'false') : undefined,
        title: `${t(`item.${item.id}`)} · ${t(`item.${item.id}.note`)}`,
        'aria-label': `${t(`item.${item.id}`)} ×${state.bag[item.id]}`,
        onDragStart: event => { onDragItem(item.id); event.dataTransfer?.setData('text/plain', item.id) },
        onDragEnd: () => onDragItem(null),
        onClick: () => (targeted ? onPick(item.id) : onUse(item.id)),
      },
      h('span', { className: 'fg-slotArt' }, h(ItemIcon, { id: item.id })),
      h('span', { className: 'fg-slotCount' }, `×${state.bag[item.id]}`))
    }),
    h('span', { className: 'fg-hotHint' }, tool ? t('bar.pick', { item: t(`item.${tool}`) }) : t('bar.drag')))
}
