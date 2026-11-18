
// Arranging table and visitor bonds.
Object.assign(zh, {
  'arrange.title':'插花台', 'arrange.theme':'今日主题 · {name}', 'arrange.theme.warm':'暖阳', 'arrange.theme.rosy':'粉红', 'arrange.theme.cool':'清凉', 'arrange.theme.white':'素白',
  'arrange.check.harmony':'配色和谐', 'arrange.check.variety':'三种以上', 'arrange.check.focal':'一朵主花', 'arrange.check.theme':'贴合主题',
  'arrange.make':'完成花束 · +{n}', 'arrange.need':'选 3–7 朵花', 'arrange.count':'已插 {n} 束 · 最佳 {best}★', 'arrange.remove':'取出{flower}', 'arrange.empty':'花篮里还没有花',
  'arrange.rules':'从下面点花放进花瓶，点花瓶里的花可以取出。花束按四项各加一星：颜色相邻或互补、至少三个品种、有且只有一朵明显更珍贵的主花、半数以上贴合今日主题色。星越多，卖得比散卖越贵，五星多三成，而且不受同种花跌价影响。',
  'bond.title':'访客好感', 'bond.none':'先在花园里问候一位访客，就能和它交朋友。', 'bond.level':'好感 {n}/4', 'bond.fav':'偏爱', 'bond.next':'下一级 · {reward}', 'bond.max':'好感已满',
  'bond.gift':'送一朵花', 'bond.gifted':'{name}收下了{flower}，好感 +{n}', 'bond.noFlowers':'背包里没有花可送',
  'bond.rules':'问候一次好感 +1。送花 +2，送它偏爱的花再 +4，送杂交、奇珍或仙品再 +3。每升一级立刻得到奖励，之后每次问候的小费也多 1 金币。',
})
Object.assign(en, {
  'arrange.title':'Arranging table', 'arrange.theme':'Today’s theme · {name}', 'arrange.theme.warm':'Sunny', 'arrange.theme.rosy':'Rosy', 'arrange.theme.cool':'Cool', 'arrange.theme.white':'White',
  'arrange.check.harmony':'Colours agree', 'arrange.check.variety':'Three kinds', 'arrange.check.focal':'One star bloom', 'arrange.check.theme':'On theme',
  'arrange.make':'Finish bouquet · +{n}', 'arrange.need':'Pick 3–7 flowers', 'arrange.count':'{n} bouquets · best {best}★', 'arrange.remove':'Take out {flower}', 'arrange.empty':'No flowers in the basket yet',
  'arrange.rules':'Click flowers below to put them in the vase; click one in the vase to take it out. Each of four things adds a star: neighbouring or opposite colours, at least three species, exactly one clearly more precious bloom, and half or more in today’s theme colour. More stars sell for more than loose flowers, up to 30% more, and ignore the falling price of repeated species.',
  'bond.title':'Visitor bonds', 'bond.none':'Greet a visitor in the garden first to make a friend.', 'bond.level':'Bond {n}/4', 'bond.fav':'Favourites', 'bond.next':'Next level · {reward}', 'bond.max':'Bond complete',
  'bond.gift':'Give a flower', 'bond.gifted':'{name} accepted {flower}: bond +{n}', 'bond.noFlowers':'No flowers to give',
  'bond.rules':'A greeting adds 1. A gift adds 2, plus 4 for a favourite flower and 3 for a hybrid, curiosity or spirit bloom. Each level pays a reward at once and adds 1 coin to every later greeting.',
})

function ArrangeTable({ state, t, clock, onChange }) {
  const [picked, setPicked] = React.useState([])
  const [vaseChoice, setVase] = React.useState('classic')
  const [useDried, setUseDried] = React.useState(false)
  const dried = useDried && goodsCount(state, 'dried') > 0
  const vase = vaseOwned(state, vaseChoice) ? vaseChoice : 'classic'
  const chosen = picked.filter(item => state.basket.includes(item))
  const score = arrangeScore(chosen, clock, vase, dried)
  const theme = bouquetTheme(clock)
  const entries = bagEntries(state, t).filter(entry => entry.kind === 'bloom')
    .map(entry => ({ ...entry, free: entry.items.filter(item => !chosen.includes(item)) }))
    .map(entry => ({ ...entry, count: entry.free.length })).filter(entry => entry.count > 0)
  function add(key) {
    const entry = entries.find(candidate => candidate.key === key)
    if (entry === undefined || chosen.length >= BOUQUET_MAX) return
    setPicked([...chosen, entry.free[0]])
  }
  function finish() {
    tick()
    const current = getState()
    const indices = chosen.map(item => current.basket.indexOf(item))
    const next = indices.includes(-1) ? null : arrangeBouquet(current, indices, Date.now(), vase, dried)
    setPicked([])
    if (next !== null) onChange(next)
  }
  return h('section', { className: 'fg-section fg-arrange', id: 'fg-arrange' },
    h('div', { className: 'fg-sectionHead' },
      h('h3', { className: 'fg-sectionTitle' }, t('arrange.title')),
      h('span', { className: 'fg-questChip', 'data-tone': 'gold', 'data-theme': theme }, t('arrange.theme', { name: t(`arrange.theme.${theme}`) })),
      (state.arranged ?? 0) > 0 ? h('span', { className: 'fg-sectionMeta' }, t('arrange.count', { n: state.arranged, best: state.bouquetBest ?? 0 })) : null,
      h(InfoTip, { t, lines: [t('arrange.rules')] })),
    h(BriefChip, { state, t, clock, items: chosen, score }),
    h('div', { className: 'fg-arrangeBody' },
      h('div', { className: 'fg-vaseCard' },
        h('div', { className: 'fg-vase' },
          chosen.map((item, index) => {
            return h('button', {
              key: index, type: 'button', className: 'fg-vaseStem', 'data-rarity': rarityOf(item),
              style: { transform: stemTilt(index, chosen.length) },
              title: t('arrange.remove', { flower: bloomName(item, t) }), 'aria-label': t('arrange.remove', { flower: bloomName(item, t) }),
              onClick: () => setPicked(chosen.filter(other => other !== item)),
            }, h(FlowerArt, { speciesId: item.species, stage: 'bloom', variant: item.variant, dna: item.dna, trait: item.trait, tint: item.tint }))
          }),
          h('div', { className: 'fg-vasePot' }, h(VaseArt, { id: vase, tint: vaseTint(state, vase) }))),
        h(VaseShelf, { state, t, vase, onPick: setVase, onChange }),
        score?.match ? h('span', { className: 'fg-questChip', 'data-tone': 'gold' }, t('vase.matched')) : null,
        h('div', { className: 'fg-vaseStars', 'data-stars': score?.stars ?? 0, 'aria-label': `${score?.stars ?? 0}/5` }, '★'.repeat(score?.stars ?? 0) + '☆'.repeat(5 - (score?.stars ?? 0))),
        h('div', { className: 'fg-ecoTargets' }, ['harmony', 'variety', 'focal', 'theme'].map(id =>
          h('span', { key: id, className: 'fg-questChip', 'data-done': score?.checks[id] ? 'true' : 'false' }, score?.checks[id] ? '✓ ' : '○ ', t(`arrange.check.${id}`)))),
        goodsCount(state, 'dried') > 0 ? h('button', { type: 'button', className: 'fg-bagFilter', 'data-action': 'arrangeDried', 'aria-pressed': dried ? 'true' : 'false', onClick: () => setUseDried(!useDried) }, '🌾 ', t('goods.dried', { n: goodsCount(state, 'dried') })) : null,
        h('button', { type: 'button', className: 'fg-btn fg-btnPrimary fg-btnBlock', 'data-action': 'arrange', disabled: score === null, onClick: finish },
          score === null ? t('arrange.need') : t('arrange.make', { n: score.coins }))),
      entries.length === 0 && chosen.length === 0
        ? h('p', { className: 'fg-empty' }, t('arrange.empty'))
        : h(BagGrid, { entries, onSelect: add })))
}

function AffinityBoard({ state, t, onChange }) {
  const [selected, setSelected] = React.useState(null)
  const [notice, setNotice] = React.useState('')
  const met = VISITORS.filter(visitor => (state.visitors?.[visitor.id] ?? 0) > 0)
  if (met.length === 0) return h('p', { className: 'fg-empty fg-bondNone' }, t('bond.none'))
  const current = met.find(visitor => visitor.id === selected) ?? met[0]
  const level = affinityLevel(state, current.id)
  const points = state.affinity?.[current.id] ?? 0
  const favourites = visitorFavourites(current.id)
  const blooms = bagEntries(state, t).filter(entry => entry.kind === 'bloom')
  const hearts = n => '♥'.repeat(n) + '♡'.repeat(AFFINITY_LEVELS.length - n)
  function gift(key) {
    const entry = blooms.find(candidate => candidate.key === key)
    if (entry === undefined) return
    tick()
    const before = getState()
    const next = giftVisitor(before, current.id, before.basket.findIndex(item => itemKey(item) === entry.groupKey))
    if (next === null) return
    onChange(next)
    setNotice(t('bond.gifted', { name: t(`visitor.${current.id}`), flower: entry.name, n: (next.affinity[current.id] ?? 0) - (before.affinity?.[current.id] ?? 0) }))
  }
  return h('div', { className: 'fg-bond', id: 'fg-bond' },
    h('div', { className: 'fg-sectionHead' }, h('h3', { className: 'fg-sectionTitle' }, t('bond.title')), h(InfoTip, { t, lines: [t('bond.rules')] })),
    h('div', { className: 'fg-bondGuests', role: 'group', 'aria-label': t('bond.title') }, met.map(visitor =>
      h('button', { key: visitor.id, type: 'button', className: 'fg-bondGuest', 'data-bond': visitor.id, 'aria-pressed': visitor.id === current.id ? 'true' : 'false', title: t(`visitor.${visitor.id}`), onClick: () => { setSelected(visitor.id); setNotice('') } },
        h('span', { className: 'fg-bondArt' }, h(VisitorArt, { id: visitor.id })),
        h('span', { className: 'fg-hearts' }, hearts(affinityLevel(state, visitor.id)))))),
    h('div', { className: 'fg-bondDetail' },
      h('div', { className: 'fg-bondInfo' },
        h('strong', null, t(`visitor.${current.id}`), ' ', h('span', { className: 'fg-hearts' }, hearts(level))),
        level < AFFINITY_LEVELS.length
          ? h('progress', { max: AFFINITY_LEVELS[level], value: points, 'aria-label': t('bond.level', { n: level }) })
          : null,
        h('span', { className: 'fg-questChip', 'data-tone': 'gold' }, level < AFFINITY_LEVELS.length ? t('bond.next', { reward: rewardText(AFFINITY_REWARDS[level], t) }) : t('bond.max')),
        h('div', { className: 'fg-ecoTargets' }, h('span', { className: 'fg-note' }, t('bond.fav')),
          favourites.slice(0, 6).map(id => h('span', { key: id, className: 'fg-questChip' }, h(BloomDot, { speciesId: id }), ' ', t(`species.${id}`))))),
      h('div', { className: 'fg-bondGift' },
        goodsCount(state, 'tea') > 0 && level < AFFINITY_LEVELS.length ? h('button', { type: 'button', className: 'fg-btn fg-btnSmall fg-btnPrimary', 'data-action': 'bondTea', onClick: () => { tick(); const next = serveTea(getState(), current.id); if (next === null) return; onChange(next); setNotice(t('goods.teaServed', { name: t(`visitor.${current.id}`), n: TEA_BOND })) } }, '🍵 ', t('goods.teaServe', { n: goodsCount(state, 'tea') })) : null,
        h('span', { className: 'fg-note' }, t('bond.gift')),
        blooms.length === 0 ? h('p', { className: 'fg-empty' }, t('bond.noFlowers')) : h(BagGrid, { entries: blooms, onSelect: gift }))),
    h('p', { role: 'status', 'aria-live': 'polite', className: 'fg-sectionOk' }, notice))
}
