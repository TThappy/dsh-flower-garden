
// Season chip, vases, keepsake album and seed expeditions.
Object.assign(zh, {
  'season.now':'{season} · 当季花 {n} 种 · 仙品率 +1%', 'season.night':'夜花 {n} 种 +1%',
  'vase.pick':'选花瓶', 'vase.classic':'青瓷瓶', 'vase.round':'圆肚瓶', 'vase.tall':'长颈瓶', 'vase.basket':'藤编篮', 'vase.moon':'月亮罐', 'vase.gold':'鎏金瓶',
  'vase.need':'再插 {n} 束解锁', 'vase.needStars':'插出一束五星解锁',
  'album.title':'收藏册', 'album.bouquets':'花束卡 {n}/{max}', 'album.cards':'花卡 {n}/{max}', 'album.empty':'完成的花束会自动留下一张卡；在背包里选一朵花，可以做成花卡留念。',
  'album.keep':'做成花卡', 'album.kept':'已做成花卡，收进收藏册', 'album.full':'花卡册满了，先取下几张', 'album.remove':'取下这张卡', 'album.removeConfirm':'再点一次取下',
  'album.rules':'每完成一束花，收藏册里就多一张花束卡，记下花、花瓶、星级和日期，最多留 30 张，满了会挤掉最早的。花卡是把一朵花留下来而不是卖掉，保留它的花色、奇珍和基因，最多 60 张。花瓶靠插花数量解锁，鎏金瓶要插出一束五星。',
  'trip.title':'采种远行', 'trip.short':'1 小时', 'trip.day':'4 小时', 'trip.long':'8 小时', 'trip.go':'{time} · {n} 金币', 'trip.where':'去哪块花地',
  'trip.out':'小队在{scene}采种', 'trip.left':'还要 {n}', 'trip.claim':'迎接小队回来', 'trip.count':'已远行 {n} 次',
  'trip.rules':'派一支小队去已解锁的花地，关掉页面也照常走。时间越长带回的东西越多：金币、那块地的杂交种子、肥料、堆肥，偶尔有绶带或幸运符。带回什么在出发时就定了。一次只能派一支。',
})
Object.assign(en, {
  'season.now':'{season} · {n} flowers in season · spirit chance +1%', 'season.night':'{n} night flowers +1%',
  'vase.pick':'Choose a vase', 'vase.classic':'Celadon vase', 'vase.round':'Round vase', 'vase.tall':'Tall vase', 'vase.basket':'Wicker basket', 'vase.moon':'Moon jar', 'vase.gold':'Gilded vase',
  'vase.need':'{n} more bouquets to unlock', 'vase.needStars':'Make one five-star bouquet to unlock',
  'album.title':'Keepsake album', 'album.bouquets':'Bouquet cards {n}/{max}', 'album.cards':'Flower cards {n}/{max}', 'album.empty':'Every finished bouquet leaves a card here. Pick a flower in the backpack to keep it as a flower card.',
  'album.keep':'Keep as a card', 'album.kept':'Kept as a flower card in the album', 'album.full':'The flower cards are full; take a few down first', 'album.remove':'Take this card down', 'album.removeConfirm':'Click again to take it down',
  'album.rules':'Each finished bouquet adds a bouquet card with its flowers, vase, stars and date; the album keeps 30 and drops the oldest. A flower card keeps one bloom instead of selling it, with its colour, curiosity and genes; up to 60. Vases unlock as you arrange more bouquets, and the gilded vase needs one five-star bouquet.',
  'trip.title':'Seed expedition', 'trip.short':'1 hour', 'trip.day':'4 hours', 'trip.long':'8 hours', 'trip.go':'{time} · {n} coins', 'trip.where':'Which ground',
  'trip.out':'A party is collecting in the {scene}', 'trip.left':'{n} to go', 'trip.claim':'Welcome the party back', 'trip.count':'{n} expeditions so far',
  'trip.rules':'Send a party to an opened ground; it keeps going with the page closed. Longer trips bring back more: coins, hybrid seeds of that ground, fertiliser, compost, and now and then a ribbon or a charm. The haul is fixed when the party sets out. One party at a time.',
})

function SeasonChip({ t, clock, sceneId }) {
  const season = SEASONS[realSeason(clock)]
  const scene = SCENE_BY_ID.get(sceneId)
  const fresh = scene.species.filter(id => inSeason(id, clock))
  const night = scene.species.filter(id => nightBloom(id, clock))
  return h('span', { className: 'fg-seasonChip', 'data-season': season, title: [...fresh, ...night].map(id => t(`species.${id}`)).join(' / ') },
    { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' }[season], ' ',
    t('season.now', { season: t(`show.season.${season}`), n: fresh.length }),
    night.length > 0 ? ` · 🌙 ${t('season.night', { n: night.length })}` : null)
}

const VASE_LOOKS = {
  classic: { d: 'M30,8C30,14 14,20 14,36C14,54 24,66 28,70L52,70C56,66 66,54 66,36C66,20 50,14 50,8Z', ry0: 8, rx: 10, rr: 3, foot: 12, base: '#a9cdb8', light: '#e4f3ea', dark: '#6f9a84', line: '#5c8672', rim: '#c9e2d3', inside: '#4f6f60', shine: 'M22,28C19,38 21,50 27,60',
    deco: V => [h('path', { key: 'crackle', d: 'M22,30l6,8l-4,9M34,22l5,10l8,4l-3,10M50,26l-4,9M56,40l-6,8l4,9M30,52l8,4l6,-5', fill: 'none', stroke: V.dark, strokeWidth: .5, opacity: .4 }), h('path', { key: 'band', d: 'M29,14Q40,18 51,14', fill: 'none', stroke: V.dark, strokeWidth: .8, opacity: .6 })] },
  round: { d: 'M33,7C33,13 10,18 10,42C10,60 24,71 40,71C56,71 70,60 70,42C70,18 47,13 47,7Z', ry0: 7, rx: 7, rr: 2.4, foot: 10, base: '#f1f4f7', light: '#ffffff', dark: '#b9c4d0', line: '#8f9db0', rim: '#ffffff', inside: '#5a6678', shine: 'M19,30C15,40 17,54 25,63',
    deco: () => { const blue = '#2f55a8'; return [
      h('path', { key: 'bands', d: 'M10,28Q40,35 70,28M10,56Q40,64 70,56M30,13Q40,16 50,13', fill: 'none', stroke: blue, strokeWidth: 1.2 }),
      ...[0, 72, 144, 216, 288].map(a => h('ellipse', { key: `p${a}`, cx: 40, cy: 37.5, rx: 2.4, ry: 4.6, fill: blue, opacity: .85, transform: `rotate(${a} 40 43)` })),
      h('circle', { key: 'eye', cx: 40, cy: 43, r: 1.8, fill: '#f1f4f7', stroke: blue, strokeWidth: .8 }),
      h('path', { key: 'scroll', d: 'M18,46q6,-9 13,-2M62,46q-6,-9 -13,-2M22,40q4,7 10,4M58,40q-4,7 -10,4M16,38q3,-4 6,-1M64,38q-3,-4 -6,-1', fill: 'none', stroke: blue, strokeWidth: 1, strokeLinecap: 'round' })] } },
  tall: { d: 'M35,4L35,30C35,38 22,44 22,56C22,66 30,71 40,71C50,71 58,66 58,56C58,44 45,38 45,30L45,4Z', ry0: 4, rx: 5, rr: 1.8, foot: 9, base: '#7a5aa8', light: '#b9a0dc', dark: '#4a3470', line: '#3f2c60', rim: '#a48ad0', inside: '#2c1f44', shine: 'M38,8L38,28M28,50C27,58 31,65 35,67', shineW: 2,
    deco: V => [h('path', { key: 'rings', d: 'M34,11Q40,13 46,11M34,27Q40,29 46,27', fill: 'none', stroke: V.light, strokeWidth: .8, opacity: .7 }), h('ellipse', { key: 'pool', cx: 40, cy: 68, rx: 20, ry: 6, fill: '#000', opacity: .16 })] },
  basket: { d: 'M13,22L67,22L60,67Q40,73 20,67Z', ry0: 22, rx: 27, rr: 5, foot: 18, base: '#c79a5b', light: '#e6c48c', dark: '#8f6632', line: '#7a5526', rim: '#a87a3e', inside: '#5c3f1c',
    deco: V => { const out = []; for (let row = 0; row < 8; row += 1) for (let col = 0; col < 9; col += 1) { const x = 8 + col * 8 + (row % 2) * 4, y = 30 + row * 5.6; out.push(h('path', { key: `w${row}-${col}`, d: `M${x},${y}q3,-2.6 6,0`, fill: 'none', stroke: row % 2 ? V.dark : V.light, strokeWidth: 2.2, strokeLinecap: 'round', opacity: .8 })) } out.push(h('path', { key: 'ribs', d: 'M24,24L28,69M40,24L40,71M56,24L52,69', fill: 'none', stroke: V.line, strokeWidth: .7, opacity: .5 })); return out } },
  moon: { d: 'M32,8C14,12 8,26 8,40C8,58 22,71 40,71C58,71 72,58 72,40C72,26 66,12 48,8Z', ry0: 8, rx: 8, rr: 2.6, foot: 13, base: '#f4f1e8', light: '#ffffff', dark: '#cbc5b4', line: '#aaa390', rim: '#fffdf6', inside: '#6a6456', shine: 'M20,24C14,36 15,52 23,62', shineW: 4,
    deco: () => [h('path', { key: 'seam', d: 'M8,40Q40,45 72,40', fill: 'none', stroke: '#8a8472', strokeWidth: .6, opacity: .25 }), h('ellipse', { key: 'shade', cx: 44, cy: 64, rx: 30, ry: 11, fill: '#8f9db0', opacity: .14 })] },
  gold: { d: 'M33,6C33,12 26,14 22,22C16,34 20,52 30,62L28,70L52,70L50,62C60,52 64,34 58,22C54,14 47,12 47,6Z', ry0: 6, rx: 7, rr: 2.4, foot: 12, base: '#e2b93b', light: '#fff0b0', dark: '#9a7210', line: '#7a580a', rim: '#f6da7a', inside: '#5a4208', shine: 'M27,22C23,34 26,50 32,58', handles: 'M23,21C9,19 9,39 21,41M57,21C71,19 71,39 59,41',
    deco: V => [h('path', { key: 'bands', d: 'M18,27Q40,32 62,27M18,47Q40,53 62,47', fill: 'none', stroke: V.line, strokeWidth: 1 }),
      ...[0, 1, 2, 3, 4, 5, 6].map(i => i === 3 ? null : h('path', { key: `d${i}`, d: `M${21 + i * 6.3},38l2.4,-3.4l2.4,3.4l-2.4,3.4Z`, fill: V.light, stroke: V.line, strokeWidth: .5 })),
      h('ellipse', { key: 'gem', cx: 40, cy: 38, rx: 3.6, ry: 4.6, fill: '#b8243a', stroke: V.line, strokeWidth: .8 }), h('ellipse', { key: 'glint', cx: 38.8, cy: 36.4, rx: 1, ry: 1.4, fill: '#fff', opacity: .7 })] },
}

/** A vase with a rounded body: glaze gradient, an open mouth you can see into, a highlight and a cast shadow. */
function VaseArt({ id, tint }) {
  const raw = typeof React.useId === 'function' ? React.useId() : 'v'
  const own = VASE_LOOKS[id] ?? VASE_LOOKS.classic
  const paint = cleanTint(tint)
  const V = paint === null ? own : { ...own, base: paint, light: lighten(paint, 0.45), dark: darken(paint, 0.35), line: darken(paint, 0.55), rim: lighten(paint, 0.25), inside: darken(paint, 0.65) }
  const u = `fgv-${VASE_LOOKS[id] ? id : 'classic'}-${String(raw).replace(/[^a-zA-Z0-9_-]/g, '')}`
  return h('svg', { viewBox: '0 0 80 76', width: 80, height: 76, 'aria-hidden': 'true', focusable: 'false', className: 'fg-vaseArt' },
    h('defs', null,
      h('linearGradient', { id: `${u}-g`, x1: 0, y1: 0, x2: 1, y2: 0 },
        h('stop', { offset: '0%', stopColor: V.dark }), h('stop', { offset: '28%', stopColor: V.light }), h('stop', { offset: '58%', stopColor: V.base }), h('stop', { offset: '100%', stopColor: V.dark })),
      h('clipPath', { id: `${u}-c` }, h('path', { d: V.d }))),
    h('ellipse', { cx: 42, cy: 72.6, rx: V.foot + 8, ry: 2.6, fill: '#000', opacity: .16 }),
    V.handles ? h('path', { d: V.handles, fill: 'none', stroke: V.dark, strokeWidth: 2.6, strokeLinecap: 'round' }) : null,
    h('path', { d: V.d, fill: `url(#${u}-g)`, stroke: V.line, strokeWidth: 1.1, strokeLinejoin: 'round' }),
    h('g', { clipPath: `url(#${u}-c)` }, ...V.deco(V)),
    V.shine ? h('path', { d: V.shine, fill: 'none', stroke: '#fff', strokeWidth: V.shineW ?? 3, strokeLinecap: 'round', opacity: .5 }) : null,
    h('ellipse', { cx: 40, cy: V.ry0, rx: V.rx, ry: V.rr, fill: V.inside, stroke: V.rim, strokeWidth: 1.6 }),
    h('path', { d: `M${40 - V.foot},70.6H${40 + V.foot}`, stroke: V.line, strokeWidth: 1.8, strokeLinecap: 'round' }))
}

function stemTilt(index, count) {
  const angle = count === 1 ? 0 : -34 + (68 * index) / (count - 1)
  return `rotate(${angle}deg) translateY(${Math.round(Math.abs(angle) * 0.3)}px)`
}

/** A finished bouquet, drawn the way the arranging table shows it. */
function BouquetArt({ items, vase, tint }) {
  return h('div', { className: 'fg-vase fg-vaseStill' },
    items.map((item, index) => h('span', { key: index, className: 'fg-vaseStem', style: { transform: stemTilt(index, items.length) } },
      h(FlowerArt, { speciesId: item.species, stage: 'bloom', variant: item.variant, dna: item.dna, trait: item.trait, tint: item.tint }))),
    h('div', { className: 'fg-vasePot' }, h(VaseArt, { id: vase, tint })))
}

function VasePicker({ state, t, vase, onPick }) {
  return h('div', { className: 'fg-vasePicker', role: 'group', 'aria-label': t('vase.pick') }, VASES.map(entry => {
    const open = vaseUnlocked(state, entry.id)
    const need = entry.stars !== undefined ? t('vase.needStars') : t('vase.need', { n: Math.max(0, entry.need - (state.arranged ?? 0)) })
    return h('button', {
      key: entry.id, type: 'button', className: 'fg-vaseChoice', 'data-vase': entry.id, 'data-earned': open ? 'true' : 'false',
      'aria-pressed': vase === entry.id ? 'true' : 'false', disabled: !open,
      title: open ? t(`vase.${entry.id}`) : `${t(`vase.${entry.id}`)} · ${need}`, 'aria-label': open ? t(`vase.${entry.id}`) : `${t(`vase.${entry.id}`)} · ${need}`,
      onClick: () => onPick(entry.id),
    }, h(VaseArt, { id: entry.id }))
  }))
}

function Album({ state, t, onChange }) {
  const [armed, setArmed] = React.useState(null)
  const bouquets = (state.bouquets ?? []).slice().reverse()
  const cards = (state.cards ?? []).slice().reverse()
  function remove(kind, id) {
    const key = `${kind}:${id}`
    if (armed !== key) return
    setArmed(null)
    tick()
    const next = removeCard(getState(), kind, id)
    if (next !== null) onChange(next)
  }
  React.useEffect(() => {
    if (armed === null) return undefined
    const id = window.setTimeout(() => setArmed(null), 6000)
    return () => window.clearTimeout(id)
  }, [armed])
  const del = (kind, id) => {
    const on = armed === `${kind}:${id}`
    return h(React.Fragment, null,
      h('button', { type: 'button', className: 'fg-cardDel', 'data-armed': on ? 'true' : 'false', title: t('album.remove'), 'aria-label': t('album.remove'), onClick: () => setArmed(on ? null : `${kind}:${id}`) }, '×'),
      on ? h('div', { className: 'fg-cardWarn', role: 'alert' },
        h('strong', null, t('album.warnTitle')),
        h('span', null, t(kind === 'cards' ? 'album.warnFlower' : 'album.warnBouquet')),
        h('div', { className: 'fg-cardWarnActions' },
          h('button', { type: 'button', className: 'fg-btn fg-btnSmall', 'data-action': 'cardKeep', autoFocus: true, onClick: () => setArmed(null) }, t('album.keepIt')),
          h('button', { type: 'button', className: 'fg-btn fg-btnSmall fg-btnDanger', 'data-action': 'cardDelete', onClick: () => remove(kind, id) }, t('album.delete')))) : null)
  }
  const day = at => new Date(at).toLocaleDateString()
  return h('section', { className: 'fg-section fg-album', id: 'fg-album' },
    h('div', { className: 'fg-sectionHead' },
      h('h3', { className: 'fg-sectionTitle' }, t('album.title')),
      h('span', { className: 'fg-sectionMeta' }, t('album.bouquets', { n: bouquets.length, max: BOUQUET_CARD_CAP })),
      h('span', { className: 'fg-sectionMeta' }, t('album.cards', { n: cards.length, max: FLOWER_CARD_CAP })),
      h(InfoTip, { t, lines: [t('album.rules')] })),
    h(Shelf, { state, t, onChange }),
    h(CardPages, { state, t, onChange }),
    bouquets.length === 0 && cards.length === 0 ? h('p', { className: 'fg-empty' }, t('album.empty')) : null,
    bouquets.length > 0 ? h('div', { className: 'fg-cardGrid' }, bouquets.map(card =>
      h('article', { key: card.id, className: 'fg-keepCard', 'data-card': `bouquet-${card.id}`, 'data-stars': card.stars },
        del('bouquets', card.id),
        h('div', { className: 'fg-cardVase' }, h(BouquetArt, { items: card.items, vase: card.vase, tint: card.tint })),
        h('span', { className: 'fg-vaseStars', 'data-stars': card.stars }, '★'.repeat(card.stars) + '☆'.repeat(5 - card.stars)),
        h('span', { className: 'fg-note' }, t(`vase.${card.vase}`), ' · ', t(`arrange.theme.${card.theme}`)),
        h('time', { className: 'fg-note', dateTime: new Date(card.at).toISOString() }, day(card.at)),
        h(CardTools, { state, t, kind: 'bouquets', card, onChange })))) : null,
    cards.length > 0 ? h('div', { className: 'fg-cardGrid' }, cards.map(card =>
      h('article', { key: card.id, className: 'fg-keepCard fg-flowerCard', 'data-card': `flower-${card.id}`, 'data-rarity': rarityOf(card.item) },
        del('cards', card.id),
        h('div', { className: 'fg-cardFlower' }, h(FlowerArt, { speciesId: card.item.species, stage: 'bloom', variant: card.item.variant, dna: card.item.dna, trait: card.item.trait, tint: card.item.tint })),
        h('strong', null, bloomName(card.item, t)),
        h('span', { className: 'fg-rarityTag', 'data-rarity': rarityOf(card.item) }, t(`bag.rarity.${rarityOf(card.item)}`)),
        card.item.dna ? h(GeneBars, { dna: card.item.dna, t }) : null,
        h('time', { className: 'fg-note', dateTime: new Date(card.at).toISOString() }, day(card.at)),
        h(CardTools, { state, t, kind: 'cards', card, onChange })))) : null)
}

function ExpeditionBoard({ state, t, clock, onChange }) {
  const open = SCENES.filter(scene => (state.scenes[scene.id]?.unlocked ?? 0) > 0)
  const [choice, setChoice] = React.useState(state.scene)
  const sceneId = open.some(scene => scene.id === choice) ? choice : open[0].id
  const trip = state.expedition
  function run(transition) {
    tick()
    const next = transition(getState(), Date.now())
    if (next !== null) onChange(next)
  }
  return h('section', { className: 'fg-section fg-trip', id: 'fg-trip' },
    h('div', { className: 'fg-sectionHead' },
      h('h3', { className: 'fg-sectionTitle' }, t('trip.title')),
      (state.trips ?? 0) > 0 ? h('span', { className: 'fg-sectionMeta' }, t('trip.count', { n: state.trips })) : null,
      patronBonus(state) > 0 ? h('span', { className: 'fg-questChip' }, t('trip.patron', { n: state.patronage, bonus: patronBonus(state) })) : null,
      h(InfoTip, { t, lines: [t('trip.rules')] })),
    trip ? h('div', { className: 'fg-tripRow' },
      h('strong', null, '🧺 ', t('trip.out', { scene: t(`scene.${trip.scene}`) })),
      h('progress', { max: trip.end - trip.start, value: Math.max(0, Math.min(trip.end - trip.start, clock - trip.start)), 'aria-label': t('trip.title') }),
      clock >= trip.end
        ? h('button', { type: 'button', className: 'fg-btn fg-btnPrimary', 'data-action': 'tripClaim', onClick: () => run(claimExpedition) }, t('trip.claim'))
        : h('span', { className: 'fg-note' }, t('trip.left', { n: formatDuration(trip.end - clock, t) })),
      clock < trip.end ? h('button', { type: 'button', className: 'fg-btn fg-btnSmall', 'data-action': 'tripRush', disabled: (state.ribbons ?? 0) < RUSH_RIBBONS, onClick: () => run(rushExpedition) }, t('rush.go')) : null)
      : h('div', { className: 'fg-tripRow' },
        h('label', { className: 'fg-note' }, t('trip.where'), ' ',
          h('select', { className: 'fg-btn', value: sceneId, onChange: event => setChoice(event.target.value) }, open.map(scene => h('option', { key: scene.id, value: scene.id }, t(`scene.${scene.id}`))))),
        EXPEDITIONS.map(entry => h('button', {
          key: entry.id, type: 'button', className: 'fg-btn', 'data-expedition': entry.id, disabled: state.coins < entry.cost,
          onClick: () => run((current, now) => startExpedition(current, sceneId, entry.id, now)),
        }, t('trip.go', { time: t(`trip.${entry.id}`), n: entry.cost })))))
}

Object.assign(zh, {
  'album.remove':'删除这张卡', 'album.warnTitle':'永久删除这张卡？', 'album.warnFlower':'花不会回到花篮，展示架加成和卡册进度也会跟着掉。', 'album.warnBouquet':'花束卡删掉就找不回来，展示架加成也会消失。', 'album.keepIt':'留着', 'album.delete':'删除',
})
Object.assign(en, {
  'album.remove':'Delete this card', 'album.warnTitle':'Delete this card for good?', 'album.warnFlower':'The flower does not go back to the basket, and its shelf bonus and page progress go with it.', 'album.warnBouquet':'A deleted bouquet card cannot be recovered, and its shelf bonus goes with it.', 'album.keepIt':'Keep it', 'album.delete':'Delete',
})
