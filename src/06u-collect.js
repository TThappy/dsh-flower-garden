
// Buying vases, the display shelf, naming bouquet cards and saving a card as a picture.
Object.assign(zh, {
  'vase.buy':'{name} · {n} 金币', 'vase.buyConfirm':'确认购买 · {n} 金币', 'vase.bought':'买下了{name}', 'vase.matched':'花瓶相配 · +5%',
  'vase.like.wide':'偏爱花幅宽的花', 'vase.like.high':'偏爱高株', 'vase.like.mixed':'偏爱四种以上混搭', 'vase.like.white':'偏爱素白的花', 'vase.like.rare':'偏爱杂交、奇珍和仙品',
  'shelf.title':'展示架', 'shelf.buy':'加一格 · {n} 金币', 'shelf.full':'展示架已满格', 'shelf.put':'摆上展示架', 'shelf.take':'从展示架取下', 'shelf.empty':'空位',
  'shelf.fx.sale':'卖价 +{n}%', 'shelf.fx.spirit':'仙品率 +{n}%', 'shelf.fx.hybrid':'杂交率 +{n}%', 'shelf.fx.visitor':'访客率 +{n}%',
  'shelf.rules':'花金币添置格子，最多五格。把收藏册里的卡摆上来才有加成：花束卡每星卖价 +1%，仙品花卡仙品率 +1%，杂交或奇珍花卡杂交率 +2%，其他花卡访客率 +1%。取下卡片加成就消失。',
  'keep.save':'存成图片', 'keep.name':'起名题字', 'keep.titlePh':'花束的名字', 'keep.notePh':'写一句话', 'keep.done':'写好了', 'keep.saved':'图片已保存',
})
Object.assign(en, {
  'vase.buy':'{name} · {n} coins', 'vase.buyConfirm':'Confirm · {n} coins', 'vase.bought':'Bought the {name}', 'vase.matched':'Vase suits the flowers · +5%',
  'vase.like.wide':'Likes wide blooms', 'vase.like.high':'Likes tall plants', 'vase.like.mixed':'Likes four or more kinds', 'vase.like.white':'Likes white flowers', 'vase.like.rare':'Likes hybrids, curiosities and spirit blooms',
  'shelf.title':'Display shelf', 'shelf.buy':'Add a slot · {n} coins', 'shelf.full':'The shelf is complete', 'shelf.put':'Put on the shelf', 'shelf.take':'Take off the shelf', 'shelf.empty':'Empty',
  'shelf.fx.sale':'Sale price +{n}%', 'shelf.fx.spirit':'Spirit chance +{n}%', 'shelf.fx.hybrid':'Hybrid chance +{n}%', 'shelf.fx.visitor':'Visitor chance +{n}%',
  'shelf.rules':'Buy slots with coins, up to five. Only cards placed here give a bonus: a bouquet card adds 1% sale price per star, a spirit flower card 1% spirit chance, a hybrid or curiosity card 2% hybrid chance, any other flower card 1% visitor chance. Take a card down and its bonus goes.',
  'keep.save':'Save as a picture', 'keep.name':'Name and inscribe', 'keep.titlePh':'Name of the bouquet', 'keep.notePh':'Write a line', 'keep.done':'Done', 'keep.saved':'Picture saved',
})

function fxText(effect, t) {
  return t(`shelf.fx.${effect.type}`, { n: Math.round(effect.amount * 100) })
}

/** Vases: owned ones are chosen, earned ones are bought with a second click, the rest wait. */
function VaseShelf({ state, t, vase, onPick, onChange }) {
  const [armed, setArmed] = React.useState(null)
  return h('div', { className: 'fg-vasePicker', role: 'group', 'aria-label': t('vase.pick') }, VASES.map(entry => {
    const owned = vaseOwned(state, entry.id), earned = vaseUnlocked(state, entry.id), price = VASE_PRICE[entry.id]
    const need = entry.stars !== undefined ? t('vase.needStars') : t('vase.need', { n: Math.max(0, entry.need - (state.arranged ?? 0)) })
    const like = VASE_LIKES[entry.id] ? ` · ${t(`vase.like.${VASE_LIKES[entry.id]}`)}` : ''
    const label = owned ? t(`vase.${entry.id}`) + like
      : earned ? t(armed === entry.id ? 'vase.buyConfirm' : 'vase.buy', { name: t(`vase.${entry.id}`), n: price }) + like : `${t(`vase.${entry.id}`)} · ${need}`
    return h('button', {
      key: entry.id, type: 'button', className: 'fg-vaseChoice', 'data-vase': entry.id, 'data-earned': earned ? 'true' : 'false', 'data-owned': owned ? 'true' : 'false',
      'data-armed': armed === entry.id ? 'true' : undefined, 'aria-pressed': vase === entry.id ? 'true' : 'false',
      disabled: !earned || (!owned && state.coins < price), title: label, 'aria-label': label,
      onClick: () => {
        if (owned) { onPick(entry.id); return }
        if (armed !== entry.id) { setArmed(entry.id); return }
        setArmed(null); tick()
        const next = buyVase(getState(), entry.id)
        if (next !== null) { onChange(next); onPick(entry.id) }
      },
    }, h(VaseArt, { id: entry.id }), owned ? null : h('span', { className: 'fg-vasePrice' }, earned ? String(price) : '🔒'))
  }))
}

function Shelf({ state, t, onChange, compact = false }) {
  const shown = shelfCards(state), slots = shelfSlots(state)
  if (compact && shown.length === 0) return null
  const thumbs = shown.map(ref => h('span', { key: `${ref.kind}-${ref.id}`, className: 'fg-shelfCard', 'data-shelf': `${ref.kind}-${ref.id}`, title: fxText(shelfEffect(ref), t) },
    ref.kind === 'bouquets'
      ? h('span', { className: 'fg-shelfStars' }, '★'.repeat(ref.card.stars))
      : h(FlowerArt, { speciesId: ref.card.item.species, stage: 'bloom', variant: ref.card.item.variant, dna: ref.card.item.dna, trait: ref.card.item.trait, tint: ref.card.item.tint }),
    h('span', { className: 'fg-shelfFx' }, fxText(shelfEffect(ref), t))))
  if (compact) return h('div', { className: 'fg-shelf fg-shelfCompact', 'aria-label': t('shelf.title') }, thumbs)
  return h('div', { className: 'fg-shelf', id: 'fg-shelf' },
    h('strong', null, t('shelf.title')),
    thumbs,
    Array.from({ length: slots - shown.length }, (_, index) => h('span', { key: `e${index}`, className: 'fg-shelfCard fg-shelfEmpty' }, t('shelf.empty'))),
    slots < SHELF_PRICES.length
      ? h('button', { type: 'button', className: 'fg-btn fg-btnSmall', 'data-action': 'shelfBuy', disabled: state.coins < SHELF_PRICES[slots], onClick: () => { tick(); const next = buyShelfSlot(getState()); if (next !== null) onChange(next) } }, t('shelf.buy', { n: SHELF_PRICES[slots] }))
      : h('span', { className: 'fg-note' }, t('shelf.full')),
    h(InfoTip, { t, lines: [t('shelf.rules')] }))
}

function xmlText(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** A standalone SVG picture of one album card, built from the drawings already on the page. */
function cardSvg(node, lines) {
  const serial = new XMLSerializer()
  const place = (svg, x, y, w, hgt) => {
    const copy = svg.cloneNode(true)
    copy.removeAttribute('class'); copy.removeAttribute('style')
    for (const [name, value] of [['x', x], ['y', y], ['width', w], ['height', hgt]]) copy.setAttribute(name, String(value))
    return serial.serializeToString(copy)
  }
  const flowers = [...node.querySelectorAll('svg.fg-flowerLiving')]
  const vase = node.querySelector('svg.fg-vaseArt')
  const parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="600" height="760" viewBox="0 0 600 760">',
    '<rect width="600" height="760" rx="36" fill="#fffdf6"/><rect x="14" y="14" width="572" height="732" rx="26" fill="none" stroke="#d4af37" stroke-width="4"/>']
  if (vase) {
    flowers.forEach((svg, index) => {
      const angle = flowers.length === 1 ? 0 : -34 + (68 * index) / (flowers.length - 1)
      parts.push(`<g transform="rotate(${angle} 300 440)">${place(svg, 180, 130 + Math.round(Math.abs(angle) * 0.8), 240, 310)}</g>`)
    })
    parts.push(place(vase, 196, 392, 208, 198))
  } else if (flowers[0]) parts.push(place(flowers[0], 90, 70, 420, 420))
  lines.filter(Boolean).slice(0, 3).forEach((line, index) => parts.push(
    `<text x="300" y="${index === 0 ? 650 : 650 + index * 38}" text-anchor="middle" font-family="Georgia, 'Songti SC', serif" font-size="${index === 0 ? 36 : 22}" fill="${index === 0 ? '#2a2a22' : '#6b6a5c'}">${xmlText(line)}</text>`))
  parts.push('</svg>')
  return parts.join('')
}

/** Download the card as a PNG, or as the SVG itself where the browser cannot rasterise it. */
function saveCard(node, lines, name) {
  const svg = cardSvg(node, lines)
  const download = (blob, ext) => {
    const url = URL.createObjectURL(blob), anchor = document.createElement('a')
    anchor.href = url; anchor.download = `${name}.${ext}`
    document.body.appendChild(anchor); anchor.click(); anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const plain = () => download(new Blob([svg], { type: 'image/svg+xml' }), 'svg')
  try {
    const image = new Image()
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 1200; canvas.height = 1520
        canvas.getContext('2d').drawImage(image, 0, 0, 1200, 1520)
        canvas.toBlob(blob => (blob ? download(blob, 'png') : plain()), 'image/png')
      } catch (error) { plain() }
    }
    image.onerror = plain
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  } catch (error) { plain() }
}

/** The little buttons on an album card: save picture, shelf, and for bouquets a name and a line. */
function CardTools({ state, t, kind, card, onChange }) {
  const [editing, setEditing] = React.useState(false)
  const [greeting, setGreeting] = React.useState(false)
  const [title, setTitle] = React.useState(card.title ?? ''), [note, setNote] = React.useState(card.note ?? '')
  const onShelf = shelfCards(state).some(ref => ref.kind === kind && ref.id === card.id)
  const room = shelfCards(state).length < shelfSlots(state)
  const apply = transition => { tick(); const next = transition(getState()); if (next !== null) onChange(next) }
  const lines = kind === 'bouquets'
    ? [card.title || t('arrange.title'), card.note || `${'★'.repeat(card.stars)} · ${t(`vase.${card.vase}`)}`, new Date(card.at).toLocaleDateString()]
    : [bloomName(card.item, t), t(`bag.rarity.${rarityOf(card.item)}`), new Date(card.at).toLocaleDateString()]
  return h('div', { className: 'fg-cardTools' },
    h('div', { className: 'fg-cardToolRow' },
      h('button', { type: 'button', className: 'fg-cardTool', 'data-action': 'cardSave', title: t('keep.save'), 'aria-label': t('keep.save'), onClick: event => saveCard(event.currentTarget.closest('.fg-keepCard'), lines, `flower-garden-card-${card.id}`) }, '⬇'),
      onShelf || room ? h('button', { type: 'button', className: 'fg-cardTool', 'data-action': 'cardShelf', 'aria-pressed': onShelf ? 'true' : 'false', title: t(onShelf ? 'shelf.take' : 'shelf.put'), 'aria-label': t(onShelf ? 'shelf.take' : 'shelf.put'), onClick: () => apply(current => toggleShelf(current, kind, card.id)) }, '📌') : null,
      kind === 'bouquets' ? h('button', { type: 'button', className: 'fg-cardTool', 'data-action': 'cardGreet', 'aria-pressed': greeting ? 'true' : 'false', title: t('greet.open'), 'aria-label': t('greet.open'), onClick: () => setGreeting(!greeting) }, '💌') : null,
      kind === 'bouquets' ? h('button', { type: 'button', className: 'fg-cardTool', 'data-action': 'cardName', 'aria-pressed': editing ? 'true' : 'false', title: t('keep.name'), 'aria-label': t('keep.name'), onClick: () => setEditing(!editing) }, '✎') : null),
    greeting ? h(GreetingEditor, { t, card }) : null,
    editing ? h('div', { className: 'fg-cardEdit' },
      h('input', { type: 'text', maxLength: 20, value: title, placeholder: t('keep.titlePh'), 'aria-label': t('keep.titlePh'), onChange: event => setTitle(event.target.value) }),
      h('input', { type: 'text', maxLength: 60, value: note, placeholder: t('keep.notePh'), 'aria-label': t('keep.notePh'), onChange: event => setNote(event.target.value) }),
      h('button', { type: 'button', className: 'fg-btn fg-btnSmall fg-btnPrimary', 'data-action': 'cardNameSave', onClick: () => { apply(current => nameBouquet(current, card.id, title, note)); setEditing(false) } }, t('keep.done')))
      : kind === 'bouquets' && (card.title || card.note) ? h('div', { className: 'fg-cardInscription' }, card.title ? h('strong', null, card.title) : null, card.note ? h('span', null, card.note) : null) : null)
}
