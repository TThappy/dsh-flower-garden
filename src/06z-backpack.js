
// Slot backpack, daily play strip, away card and the collapsible rule tip.
Object.assign(zh, {
  'inventory.title':'背包', 'inventory.open':'背包 · {n}',
  'bag.filters':'背包分类', 'bag.all':'全部', 'bag.bloom':'花', 'bag.seed':'种子', 'bag.item':'道具',
  'bag.flowers':'花 {n}/{max}', 'bag.empty':'这里还空着', 'bag.pick':'点一格看看',
  'bag.worth':'估价 {n}', 'bag.sell':'卖出 · +{n}', 'bag.sellConfirm':'确认卖出 · +{n}', 'bag.view':'查看详情', 'bag.plant':'去花园种下',
  'bag.rarity.base':'原色', 'bag.rarity.alt':'别色', 'bag.rarity.hybrid':'杂交', 'bag.rarity.curio':'奇珍', 'bag.rarity.spirit':'仙品',
  'tip.rules':'玩法说明',
  'play.title':'今日', 'play.daily':'每日签到', 'play.streak':'连续 {n} 天', 'play.claim':'领取', 'play.claimed':'今日已领', 'play.day':'第 {n} 天',
  'play.quests':'今日心愿', 'play.quest.harvested':'收获 {n} 朵花', 'play.quest.planted':'种下 {n} 株', 'play.quest.greeted':'问候 {n} 位访客',
  'play.quest.delivered':'交付 {n} 份花束订单', 'play.quest.pollinated':'完成 {n} 次授粉', 'play.questClaim':'领取 +{n}', 'play.questDone':'已领',
  'play.bonus':'三项全清再送肥料 ×2', 'play.gift':'惊喜礼盒', 'play.giftLeft':'{n}后消失',
  'play.away':'你离开了 {time}', 'play.awayBloomed':'{n} 株新开花', 'play.awayThirsty':'{n} 株等水喝', 'play.awayOk':'花园一切安好', 'play.dismiss':'知道了',
})
Object.assign(en, {
  'inventory.title':'Backpack', 'inventory.open':'Backpack · {n}',
  'bag.filters':'Backpack filters', 'bag.all':'All', 'bag.bloom':'Flowers', 'bag.seed':'Seeds', 'bag.item':'Supplies',
  'bag.flowers':'Flowers {n}/{max}', 'bag.empty':'Nothing here yet', 'bag.pick':'Pick a slot to inspect',
  'bag.worth':'Worth {n}', 'bag.sell':'Sell · +{n}', 'bag.sellConfirm':'Confirm sell · +{n}', 'bag.view':'View details', 'bag.plant':'Plant in the garden',
  'bag.rarity.base':'Plain', 'bag.rarity.alt':'Second colour', 'bag.rarity.hybrid':'Hybrid', 'bag.rarity.curio':'Curiosity', 'bag.rarity.spirit':'Spirit',
  'tip.rules':'How it works',
  'play.title':'Today', 'play.daily':'Daily check-in', 'play.streak':'{n}-day streak', 'play.claim':'Collect', 'play.claimed':'Collected today', 'play.day':'Day {n}',
  'play.quests':'Today’s wishes', 'play.quest.harvested':'Harvest {n} flowers', 'play.quest.planted':'Plant {n} seeds', 'play.quest.greeted':'Greet {n} visitors',
  'play.quest.delivered':'Deliver {n} bouquet order', 'play.quest.pollinated':'Get {n} pollinations', 'play.questClaim':'Collect +{n}', 'play.questDone':'Collected',
  'play.bonus':'Clear all three for Fertiliser ×2', 'play.gift':'Surprise box', 'play.giftLeft':'gone in {n}',
  'play.away':'You were away for {time}', 'play.awayBloomed':'{n} new blooms', 'play.awayThirsty':'{n} plants need water', 'play.awayOk':'The garden is doing fine', 'play.dismiss':'Got it',
})

/** Rules live behind a native disclosure instead of standing paragraphs. */
function InfoTip({ t, label, lines }) {
  return h('details', { className: 'fg-tip' },
    h('summary', { className: 'fg-tipToggle' }, h('span', { className: 'fg-tipMark', 'aria-hidden': true }, '?'), h('span', null, label ?? t('tip.rules'))),
    h('div', { className: 'fg-tipBody' }, lines.filter(Boolean).map((line, index) => h('p', { key: index }, line))))
}

function SeedGlyph({ species, tint }) {
  const pal = paletteOf(SPECIES_BY_ID.get(tint ?? species) ?? SPECIES[0], 'base')
  return h('svg', { viewBox: '0 0 24 24', width: 24, height: 24, 'aria-hidden': 'true', focusable: 'false' },
    h('path', { d: 'M12 21c-3.6 0-6-2.3-6-5.6C6 11.6 9 8.6 12 5c3 3.6 6 6.6 6 10.4 0 3.3-2.4 5.6-6 5.6Z', fill: pal.petal, stroke: pal.petalDeep, strokeWidth: 1.2 }),
    h('path', { d: 'M12 9c0-2.6 1.4-4.4 3.8-5-.2 2.6-1.4 4.3-3.8 5Z', fill: '#7fbf6a' }),
    h('path', { d: 'M9.6 15.4c.5 1.5 1.4 2.3 2.8 2.6', fill: 'none', stroke: '#ffffffaa', strokeWidth: 1.1, strokeLinecap: 'round' }))
}

/** Everything the player carries as one list of stacks: blooms, hybrid seeds, supplies. */
function bagEntries(state, t) {
  const entries = []
  const groups = new Map()
  for (const item of state.basket ?? []) {
    const key = itemKey(item)
    if (!groups.has(key)) groups.set(key, { kind: 'bloom', key: `bloom:${key}`, groupKey: key, item, items: [] })
    groups.get(key).items.push(item)
  }
  const blooms = [...groups.values()].map(group => ({ ...group, count: group.items.length, name: bloomName(group.item, t), rarity: rarityOf(group.item) }))
  blooms.sort((a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity] || itemValue(b.item) - itemValue(a.item))
  entries.push(...blooms)
  for (const [key, count] of Object.entries(state.seeds ?? {})) {
    const [species, tint] = key.split('~')
    if (count <= 0 || !SPECIES_BY_ID.has(species)) continue
    entries.push({ kind: 'seed', key: `seed:${key}`, species, tint, count, name: bloomName({ species, tint }, t), rarity: 'hybrid' })
  }
  for (const item of ITEMS) {
    const count = state.bag?.[item.id] ?? 0
    if (item.kind !== 'consumable' || count <= 0) continue
    entries.push({ kind: 'item', key: `item:${item.id}`, id: item.id, count, name: t(`item.${item.id}`), rarity: 'base' })
  }
  for (const id of GOODS) if (goodsCount(state, id) > 0) entries.push({ kind: 'item', key: `item:${id}`, id, count: goodsCount(state, id), name: t(`item.${id}`), rarity: 'base' })
  return entries
}

function bagArt(entry) {
  if (entry.kind === 'bloom') return h(FlowerArt, { speciesId: entry.item.species, stage: 'bloom', variant: entry.item.variant, dna: entry.item.dna, trait: entry.item.trait, tint: entry.item.tint })
  if (entry.kind === 'seed') return h(SeedGlyph, { species: entry.species, tint: entry.tint })
  return GOODS.includes(entry.id) ? h('span', { className: 'fg-goodsIcon', 'aria-hidden': true }, GOODS_ICON[entry.id]) : h(ItemIcon, { id: entry.id })
}

function BagSlot({ entry, selected, onSelect }) {
  const interactive = typeof onSelect === 'function'
  return h(interactive ? 'button' : 'div', {
    ...(interactive ? { type: 'button', 'aria-pressed': selected ? 'true' : 'false', onClick: () => onSelect(entry.key) } : { role: 'img' }),
    className: 'fg-slot', 'data-kind': entry.kind, 'data-rarity': entry.rarity, 'data-slot': entry.key,
    'data-supply': entry.kind === 'item' ? entry.id : undefined,
    title: entry.name, 'aria-label': `${entry.name} ×${entry.count}`,
  },
  h('span', { className: 'fg-slotArt' }, bagArt(entry)),
  h('span', { className: 'fg-slotName' }, entry.name),
  h('span', { className: 'fg-slotCount' }, `×${entry.count}`))
}

function BagGrid({ entries, picked, onSelect, min = 0 }) {
  const empty = Math.max(0, min - entries.length)
  return h('div', { className: 'fg-slotGrid' },
    entries.map(entry => h(BagSlot, { key: entry.key, entry, selected: entry.key === picked, onSelect })),
    Array.from({ length: empty }, (_, index) => h('span', { key: `empty-${index}`, className: 'fg-slot fg-slotEmpty', 'aria-hidden': true })))
}

/** Supplies and seeds as slots; the shop shows this beside its counter. */
function InventoryContents({ state, t }) {
  const entries = bagEntries(state, t).filter(entry => entry.kind !== 'bloom')
  return h('div', { className: 'fg-inventoryContents' },
    state.charm ? h('p', { className: 'fg-badge fg-badgeWarn' }, t('item.charmReady')) : null,
    entries.length === 0 ? h('p', { className: 'fg-empty' }, t('bag.empty')) : h(BagGrid, { entries }))
}

Object.assign(zh, {
  'bag.pinBloom':'钉住这朵花', 'bag.unpinBloom':'从桌面收回', 'bag.pinArtError':'无法读取这朵花的绘图。',
  'bag.pinLaunchError':'桌面花朵启动失败，请再试一次。', 'bag.unpinError':'未能收回这朵花，请再试一次。', 'bag.pinSizeError':'这朵花的绘图超过窗口大小限制。',
})
Object.assign(en, {
  'bag.pinBloom':'Pin this flower', 'bag.unpinBloom':'Remove from desktop', 'bag.pinArtError':'Could not read this flower’s artwork.',
  'bag.pinLaunchError':'Could not open the desktop flower. Try again.', 'bag.unpinError':'Could not close this flower. Try again.', 'bag.pinSizeError':'This flower exceeds the desktop drawing size limit.',
})

function individualBloomPins(stack) {
  const duplicates = new Map()
  return stack.items.map(item => {
    const signature = `${itemKey(item).replaceAll('+','.')}:${item.dna ?? 'legacy'}`
    const ordinal = duplicates.get(signature) ?? 0
    duplicates.set(signature, ordinal + 1)
    return {item, key:`bloom:${signature}:${ordinal}`}
  })
}

function InventoryDialog({ state, t, clock = Date.now(), onClose, onGarden, onShop, onSell, onUse, onOpenBloom, onKeep, onUseBloom }) {
  const ref = React.useRef(null); useGardenDialog(ref)
  const [filter, setFilter] = React.useState('all')
  const [picked, setPicked] = React.useState(null)
  const [armed, setArmed] = React.useState(null)
  const [pickedBloom, setPickedBloom] = React.useState(null)
  const artRef = React.useRef(null)
  const all = bagEntries(state, t)
  const shown = all.filter(entry => filter === 'all' || entry.kind === filter)
  const current = shown.find(entry => entry.key === picked) ?? shown[0] ?? null
  const individuals = current?.kind === 'bloom' ? individualBloomPins(current) : []
  const individual = individuals.find(bloom => bloom.key === pickedBloom) ?? individuals[0]
  const displayed = individual ? {...current,item:individual.item} : current
  const pin = useSyncExternalStore(subscribeBouquetPins, () => bouquetPins.get(individual?.key) ?? noBouquetPin, () => noBouquetPin)
  const worth = current?.kind === 'bloom' ? quoteSale(state, current.items, clock).coins : 0
  function pick(key) { setPicked(key); setArmed(null) }
  function sell() {
    if (armed !== current.key) { setArmed(current.key); return }
    setArmed(null); onSell?.(current.groupKey)
  }
  const actions = current === null ? [] : current.kind === 'bloom' ? [
    h('button', { key: 'sell', type: 'button', className: armed === current.key ? 'fg-btn fg-btnDanger' : 'fg-btn fg-btnPrimary', 'data-action': 'bagSell', onClick: sell }, t(armed === current.key ? 'bag.sellConfirm' : 'bag.sell', { n: worth })),
    h('button', { key:'pin', type:'button', className:'fg-btn', 'data-action':'bagPinDesktop', disabled:pin.phase==='pending', 'aria-pressed':pin.phase==='open', onClick:()=>toggleBloomPin(individual.key, artRef.current?.querySelector('svg'), current.name) }, t(pin.phase==='pending' ? 'desktop.working' : pin.phase==='open' ? 'bag.unpinBloom' : 'bag.pinBloom')),
    h('button', { key: 'view', type: 'button', className: 'fg-btn', onClick: () => onOpenBloom?.(current.groupKey) }, t('bag.view')),
    h('button', { key: 'use', type: 'button', className: 'fg-btn', 'data-action': 'bagUse', onClick: () => onUseBloom?.(current.groupKey) }, t('use.' + flowerUse(current.item.species))),
    h('button', { key: 'keep', type: 'button', className: 'fg-btn', 'data-action': 'bagKeep', onClick: () => onKeep?.(current.groupKey) }, t('album.keep')),
  ] : current.kind === 'seed' ? [
    h('button', { key: 'plant', type: 'button', className: 'fg-btn fg-btnPrimary', onClick: onGarden }, t('bag.plant')),
  ] : GOODS.includes(current.id) ? (current.id === 'perfume' ? [h('button', { key: 'use', type: 'button', className: 'fg-btn fg-btnPrimary', onClick: () => onUse?.('perfume') }, t('goods.spray'))] : []) : current.id === 'sprinkler' ? [
    h('button', { key: 'use', type: 'button', className: 'fg-btn fg-btnPrimary', onClick: () => onUse?.('sprinkler') }, t('item.useGround')),
  ] : current.id === 'charm' ? [
    state.charm ? h('span', { key: 'on', className: 'fg-badge fg-badgeWarn' }, t('item.charmReady'))
      : h('button', { key: 'use', type: 'button', className: 'fg-btn fg-btnPrimary', onClick: () => onUse?.('charm') }, t('item.useCharm')),
  ] : [
    h('button', { key: 'go', type: 'button', className: 'fg-btn fg-btnPrimary', onClick: onGarden }, t('inventory.grow')),
  ]
  return h('dialog', { ref, className: 'fg-dialog fg-inventoryDialog fg-bagDialog', 'aria-label': t('inventory.title'), onCancel: event => { event.preventDefault(); onClose() } },
    h('header', { className: 'fg-inventoryHead' },
      h('h2', null, t('inventory.title')),
      h('span', { className: 'fg-chip' }, t('bag.flowers', { n: (state.basket ?? []).length, max: basketCapacity(state) })),
      h('span', { className: 'fg-chip' }, CoinGlyph(), h('span', { className: 'fg-chipValue' }, String(state.coins))),
      h('button', { type: 'button', className: 'fg-btn fg-bagClose', onClick: onClose, 'aria-label': t('inventory.close') }, '×')),
    h('div', { className: 'fg-bagFilters', role: 'group', 'aria-label': t('bag.filters') },
      ['all', 'bloom', 'seed', 'item'].map(id => h('button', { key: id, type: 'button', className: 'fg-bagFilter', 'aria-pressed': filter === id ? 'true' : 'false', onClick: () => { setFilter(id); setArmed(null) } },
        t(`bag.${id}`), ' ', h('span', { className: 'fg-bagFilterCount' }, String(all.filter(entry => id === 'all' || entry.kind === id).length))))),
    h('div', { className: 'fg-bagBody' },
      h(BagGrid, { entries: shown, picked: current?.key, onSelect: pick, min: 12 }),
      h('aside', { className: 'fg-bagDetail', 'data-rarity': current?.rarity, 'aria-live': 'polite' },
        current === null ? h('p', { className: 'fg-empty' }, t('bag.empty')) : [
          h('div', { key: 'art', ref:artRef, className: 'fg-bagDetailArt' }, bagArt(displayed)),
          h('h3', { key: 'name' }, current.name),
          individuals.length > 1 ? h('label', {key:'individual', className:'fg-note'}, t('basket.individual'),
            h('select', {className:'fg-btn', value:individual.key, onChange:event=>setPickedBloom(event.target.value)},
              individuals.map((bloom,index)=>h('option',{key:bloom.key,value:bloom.key},t('basket.individualNo',{n:index+1,max:individuals.length}))))) : null,
          h('div', { key: 'tags', className: 'fg-bagTags' },
            h('span', { className: 'fg-rarityTag', 'data-rarity': current.rarity }, current.kind === 'item' ? t('bag.item') : current.kind === 'seed' ? t('bag.seed') : t(`bag.rarity.${current.rarity}`)),
            h('span', { className: 'fg-note' }, `×${current.count}`),
            current.kind === 'bloom' ? h('span', { className: 'fg-note' }, t('bag.worth', { n: worth })) : null),
          current.kind === 'bloom' ? h('span', { key: 'use', className: 'fg-questChip' }, t('use.' + flowerUse(current.item.species) + '.note')) : null,
          individual && Number.isFinite(individual.item.dna) ? h(GeneBars, { key: 'genes', dna: individual.item.dna, t }) : null,
          current.kind === 'item' ? h('p', { key: 'note', className: 'fg-note' }, t(`item.${current.id}.note`)) : null,
          h('div', { key: 'actions', className: 'fg-bagActions' }, actions),
           individual && pin.error ? h('p', {key:'pinError',className:'fg-note',role:'status'}, t(pin.error)) : null,
        ])),
    h('footer', { className: 'fg-rewardActions' },
      h('button', { type: 'button', className: 'fg-btn', onClick: onShop }, t('tabs.shop')),
      h('button', { type: 'button', className: 'fg-btn fg-btnPrimary', onClick: onClose, autoFocus: true }, t('inventory.close'))))
}

function rewardText(reward, t) {
  return [reward.coins ? `${reward.coins} ${t('stat.coins')}` : null,
    ...Object.entries(reward.bag ?? {}).map(([id, n]) => `${t(`item.${id}`)} ×${n}`)].filter(Boolean).join(' + ')
}

/** The strip above the garden: check-in dots, three wishes, and the surprise box when one is around. */
function PlayStrip({ state, t, clock, hidden, onChange }) {
  const daily = dailyStatus(state, clock)
  const quests = dailyQuests(state, clock)
  const gift = giftAt(state, clock)
  function run(transition) {
    tick()
    const next = transition(getState(), Date.now())
    if (next !== null) onChange(next)
  }
  return h('section', { className: 'fg-play', hidden, 'aria-label': t('play.title') },
    h('div', { className: 'fg-playCard fg-daily' },
      h('div', { className: 'fg-playHead' }, h('strong', null, t('play.daily')), h('span', { className: 'fg-note' }, t('play.streak', { n: daily.streak }))),
      h('ol', { className: 'fg-dailyDots' }, DAILY_REWARDS.map((reward, index) => h('li', {
        key: index, className: 'fg-dailyDot', title: `${t('play.day', { n: index + 1 })} · ${rewardText(reward, t)}`,
        'data-state': index < daily.index || (index === daily.index && !daily.available) ? 'done' : index === daily.index ? 'today' : 'todo',
      }, reward.bag ? h(ItemIcon, { id: Object.keys(reward.bag)[0] }) : CoinGlyph(), h('span', null, String(index + 1))))),
      daily.available
        ? h('button', { type: 'button', className: 'fg-btn fg-btnPrimary fg-playClaim', 'data-action': 'daily', onClick: () => run(claimDaily) }, `${t('play.claim')} · ${rewardText(daily.reward, t)}`)
        : h('span', { className: 'fg-note' }, t('play.claimed'))),
    h('div', { className: 'fg-playCard fg-quests', title: t('play.bonus') },
      h('div', { className: 'fg-playHead' }, h('strong', null, t('play.quests')), h('span', { className: 'fg-note' }, `${quests.filter(quest => quest.claimed).length}/${quests.length}`)),
      quests.map(quest => h('div', { key: quest.id, className: 'fg-quest', 'data-quest': quest.id, 'data-done': quest.done ? 'true' : 'false' },
        h('span', { className: 'fg-questName' }, t(`play.quest.${quest.id}`, { n: quest.target })),
        h('progress', { max: quest.target, value: quest.progress, 'aria-label': t(`play.quest.${quest.id}`, { n: quest.target }) }),
        quest.claimed ? h('span', { className: 'fg-note' }, t('play.questDone'))
          : quest.done ? h('button', { type: 'button', className: 'fg-btn fg-btnSmall fg-btnPrimary', 'data-action': 'quest', onClick: () => run((current, now) => claimQuest(current, quest.id, now)) }, t('play.questClaim', { n: quest.coins }))
            : h('span', { className: 'fg-note' }, `${quest.progress}/${quest.target}`)))),
    gift === null ? null : h('button', { type: 'button', className: 'fg-gift', 'data-action': 'gift', onClick: () => run(openGift) },
      h('span', { className: 'fg-giftBox', 'aria-hidden': true }, '🎁'), h('strong', null, t('play.gift')),
      h('span', { className: 'fg-note' }, t('play.giftLeft', { n: formatDuration(Math.max(0, gift.until - clock), t) }))))
}

function AwayCard({ report, t, onClose }) {
  return h('div', { className: 'fg-away', role: 'status' },
    h('strong', null, t('play.away', { time: formatDuration(report.awayMs, t) })),
    report.bloomed > 0 ? h('span', { className: 'fg-badge fg-badgeOk' }, t('play.awayBloomed', { n: report.bloomed })) : null,
    report.thirsty > 0 ? h('span', { className: 'fg-badge fg-badgeWarn' }, t('play.awayThirsty', { n: report.thirsty })) : null,
    report.bloomed === 0 && report.thirsty === 0 ? h('span', { className: 'fg-note' }, t('play.awayOk')) : null,
    h('button', { type: 'button', className: 'fg-btn fg-btnSmall fg-btnGhost', 'aria-label': t('play.dismiss'), onClick: onClose }, '×'))
}
