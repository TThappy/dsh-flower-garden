
// Season chip, vases, keepsake album and seed expeditions.
Object.assign(zh, {
  'season.now':'{season} · 当季花 {n} 种 · 仙品率 +5%', 'season.night':'夜花 {n} 种 +8%',
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
  'season.now':'{season} · {n} flowers in season · spirit chance +5%', 'season.night':'{n} night flowers +8%',
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

function VaseArt({ id }) {
  const svg = (...kids) => h('svg', { viewBox: '0 0 80 76', width: 80, height: 76, 'aria-hidden': 'true', focusable: 'false', className: 'fg-vaseArt' }, ...kids)
  const shine = h('path', { key: 'shine', d: 'M25 24c-3 10-3 22 1 34', fill: 'none', stroke: '#ffffff88', strokeWidth: 3, strokeLinecap: 'round' })
  if (id === 'round') return svg(
    h('path', { key: 'body', d: 'M30 6h20v9c14 6 22 17 22 31 0 16-14 28-32 28S8 62 8 46c0-14 8-25 22-31Z', fill: '#7fbf8f', stroke: '#4f8f63', strokeWidth: 2 }),
    h('rect', { key: 'rim', x: 26, y: 2, width: 28, height: 7, rx: 3.5, fill: '#4f8f63' }), shine)
  if (id === 'tall') return svg(
    h('path', { key: 'body', d: 'M30 4h20l-2 18c9 10 10 32 4 52H28c-6-20-5-42 4-52Z', fill: '#a78bdc', stroke: '#7658b5', strokeWidth: 2 }),
    h('rect', { key: 'rim', x: 27, y: 2, width: 26, height: 6, rx: 3, fill: '#7658b5' }),
    h('path', { key: 'shine', d: 'M33 30c-3 12-3 26 0 38', fill: 'none', stroke: '#ffffff88', strokeWidth: 3, strokeLinecap: 'round' }))
  if (id === 'basket') return svg(
    h('path', { key: 'body', d: 'M9 14h62l-7 54a8 8 0 0 1-8 6H24a8 8 0 0 1-8-6Z', fill: '#c79a5b', stroke: '#8a6230', strokeWidth: 2 }),
    h('path', { key: 'weave', d: 'M12 30h56M14 45h52M17 60h46M25 14l4 60M40 14v60M55 14l-4 60', fill: 'none', stroke: '#8a6230', strokeWidth: 1.6 }),
    h('rect', { key: 'rim', x: 6, y: 10, width: 68, height: 8, rx: 4, fill: '#a87a3e' }))
  if (id === 'moon') return svg(
    h('path', { key: 'body', d: 'M30 6h20c2 7 22 15 22 37 0 19-14 31-32 31S8 62 8 43C8 21 28 13 30 6Z', fill: '#f6f3ea', stroke: '#cfc8b4', strokeWidth: 2 }),
    h('rect', { key: 'rim', x: 27, y: 2, width: 26, height: 6, rx: 3, fill: '#cfc8b4' }),
    h('path', { key: 'motif', d: 'M40 34c5 4 8 9 8 14a8 8 0 0 1-16 0c0-5 3-10 8-14Z', fill: '#7d9fd6', opacity: 0.75 }))
  const gold = id === 'gold'
  return svg(
    h('path', { key: 'body', d: 'M14 6h52c2 0 3 2 3 4l-6 54c-1 6-5 10-11 10H28c-6 0-10-4-11-10L11 10c0-2 1-4 3-4Z', fill: gold ? '#e2b93b' : '#8fc0d6', stroke: gold ? '#a67c12' : '#5d94ad', strokeWidth: 2 }),
    gold ? h('path', { key: 'star', d: 'M40 26l4 9 10 1-7.500 6.500 2.300 9.500L40 47l-8.800 5 2.300-9.500L26 36l10-1Z', fill: '#fff3c4' }) : null,
    shine)
}

function stemTilt(index, count) {
  const angle = count === 1 ? 0 : -34 + (68 * index) / (count - 1)
  return `rotate(${angle}deg) translateY(${Math.round(Math.abs(angle) * 0.3)}px)`
}

/** A finished bouquet, drawn the way the arranging table shows it. */
function BouquetArt({ items, vase }) {
  return h('div', { className: 'fg-vase fg-vaseStill' },
    items.map((item, index) => h('span', { key: index, className: 'fg-vaseStem', style: { transform: stemTilt(index, items.length) } },
      h(FlowerArt, { speciesId: item.species, stage: 'bloom', variant: item.variant, dna: item.dna, trait: item.trait, tint: item.tint }))),
    h('div', { className: 'fg-vasePot' }, h(VaseArt, { id: vase })))
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
    if (armed !== key) { setArmed(key); return }
    setArmed(null)
    tick()
    const next = removeCard(getState(), kind, id)
    if (next !== null) onChange(next)
  }
  const del = (kind, id) => {
    const on = armed === `${kind}:${id}`
    return h('button', { type: 'button', className: 'fg-cardDel', 'data-armed': on ? 'true' : 'false', title: t(on ? 'album.removeConfirm' : 'album.remove'), 'aria-label': t(on ? 'album.removeConfirm' : 'album.remove'), onClick: () => remove(kind, id) }, on ? '?' : '×')
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
        h('div', { className: 'fg-cardVase' }, h(BouquetArt, { items: card.items, vase: card.vase })),
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
