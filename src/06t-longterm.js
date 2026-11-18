
// Workshop, collection pages, weekly bouquet contest and legacy restart.
Object.assign(zh, {
  'work.title':'花坊', 'work.bench':'加一个工位 · {n} 金币', 'work.benches':'工位 {n}/{max}', 'work.none':'先添置一个工位，才能加工花材。',
  'work.dried':'干花', 'work.tea':'花茶', 'work.perfume':'香水', 'work.recipe':'{name} · {count} 朵 · {time} · 工费 {fee}', 'work.pick':'再选 {n} 朵花', 'work.start':'开工 · 成品值 {n}',
  'work.busy':'{name} · 还要 {time}', 'work.claim':'取走{name} · +{n}', 'work.count':'已加工 {n} 件',
  'work.rules':'工位要花金币添置，最多三个。干花用 1 朵、花茶 3 朵、香水 5 朵，按花的原价计算，不受同种花跌价影响，成品分别值原价的 90%、100%、110%，另收工费并需要等待。跌价的花拿来加工最划算。',
  'page.title':'卡册', 'page.scene':'{scene}花卡', 'page.rarity':'五种稀有度', 'page.traits':'四种奇珍', 'page.claim':'领取 · {reward}', 'page.done':'已集齐',
  'page.rules':'卡册看的是收藏册里的花卡。每块花地集齐四个不同品种、五种稀有度各一张、四种不同奇珍，各有一次奖励。花卡取下后进度会掉，但已领的奖励不收回。',
  'contest.title':'每周花束赛', 'contest.enter':'送这张参赛 · {n} 金币', 'contest.score':'{n} 分', 'contest.rank':'本周第 {n} 名 · {score} 分', 'contest.need':'先插一束花，才有花束卡可以参赛。', 'contest.wins':'夺冠 {n} 次',
  'contest.rival.iris':'鸢尾夫人', 'contest.rival.moss':'苔先生', 'contest.rival.wren':'鹪鹩小姐', 'contest.you':'你',
  'contest.rules':'每周可以送一张花束卡参赛，报名费 100 金币。得分 = 星级 ×10 + 花朵数，花瓶相配再 +5。和三位对手比：第一名得 300 金币和 3 条绶带，第二名 2 条，第三名 1 条。对手每周换一次状态。',
  'legacy.title':'花园传承', 'legacy.need':'等级达到 {n} 并解锁全部花地后开启', 'legacy.go':'开启新一代花园', 'legacy.confirm':'再点一次确认：金币、等级、花圃都会重置', 'legacy.count':'第 {n} 代', 'legacy.done':'新一代花园开始了',
  'legacy.rules':'重新开始：金币、等级、花圃、花篮、道具和已解锁的花地都会重置。留下的有：收藏册、花瓶、展示架、图鉴、访客好感、育种记录，以及最多三粒杂交种子。每传一代，起始金币多 100，仙品率永久 +1%，最多 +5%。',
})
Object.assign(en, {
  'work.title':'Workshop', 'work.bench':'Add a bench · {n} coins', 'work.benches':'Benches {n}/{max}', 'work.none':'Add a bench first to process flowers.',
  'work.dried':'Dried flowers', 'work.tea':'Flower tea', 'work.perfume':'Perfume', 'work.recipe':'{name} · {count} blooms · {time} · fee {fee}', 'work.pick':'Pick {n} more', 'work.start':'Start · worth {n}',
  'work.busy':'{name} · {time} to go', 'work.claim':'Collect {name} · +{n}', 'work.count':'{n} made so far',
  'work.rules':'Benches cost coins, up to three. Dried flowers take 1 bloom, tea 3, perfume 5, priced at list value whatever the market slump, and come out worth 90%, 100% and 110% of it, for a fee and a wait. Slumped flowers are the best ones to process.',
  'page.title':'Card pages', 'page.scene':'{scene} cards', 'page.rarity':'Five rarities', 'page.traits':'Four curiosities', 'page.claim':'Collect · {reward}', 'page.done':'Complete',
  'page.rules':'Pages count the flower cards in your album. Four different species from one ground, one card of each of the five rarities, and four different curiosities each pay once. Taking a card down lowers the progress but never takes a reward back.',
  'contest.title':'Weekly bouquet contest', 'contest.enter':'Enter this card · {n} coins', 'contest.score':'{n} pts', 'contest.rank':'Rank {n} this week · {score} pts', 'contest.need':'Arrange a bouquet first to have a card to enter.', 'contest.wins':'{n} wins',
  'contest.rival.iris':'Lady Iris', 'contest.rival.moss':'Mr Moss', 'contest.rival.wren':'Miss Wren', 'contest.you':'You',
  'contest.rules':'Enter one bouquet card a week for 100 coins. Score = stars ×10 + number of flowers, plus 5 when the vase suits them. Against three rivals: first place wins 300 coins and 3 ribbons, second 2 ribbons, third 1. The rivals change form every week.',
  'legacy.title':'Garden legacy', 'legacy.need':'Opens at level {n} with every ground unlocked', 'legacy.go':'Begin a new generation', 'legacy.confirm':'Click again to confirm: coins, level and plots all reset', 'legacy.count':'Generation {n}', 'legacy.done':'A new generation of the garden begins',
  'legacy.rules':'Start over: coins, level, plots, basket, supplies and opened grounds reset. You keep the album, vases, shelf, flower book, visitor bonds, breeding records and up to three hybrid seeds. Each generation adds 100 starting coins and 1% spirit chance for good, up to 5%.',
})

function Workshop({ state, t, clock, onChange }) {
  const [recipeId, setRecipe] = React.useState('dried')
  const [picked, setPicked] = React.useState([])
  const recipe = RECIPES.find(entry => entry.id === recipeId)
  const benches = benchCount(state), jobs = state.workshop?.jobs ?? []
  const chosen = picked.filter(item => state.basket.includes(item)).slice(0, recipe.count)
  const entries = bagEntries(state, t).filter(entry => entry.kind === 'bloom')
    .map(entry => ({ ...entry, free: entry.items.filter(item => !chosen.includes(item)) }))
    .map(entry => ({ ...entry, count: entry.free.length })).filter(entry => entry.count > 0)
  const apply = transition => { tick(); const next = transition(getState(), Date.now()); if (next !== null) onChange(next) }
  const worth = Math.round(chosen.reduce((sum, item) => sum + itemValue(item), 0) * recipe.mult)
  return h('section', { className: 'fg-section fg-work', id: 'fg-work' },
    h('div', { className: 'fg-sectionHead' },
      h('h3', { className: 'fg-sectionTitle' }, t('work.title')),
      h('span', { className: 'fg-sectionMeta' }, t('work.benches', { n: benches, max: BENCH_PRICES.length })),
      (state.crafted ?? 0) > 0 ? h('span', { className: 'fg-sectionMeta' }, t('work.count', { n: state.crafted })) : null,
      benches < BENCH_PRICES.length ? h('button', { type: 'button', className: 'fg-btn fg-btnSmall', 'data-action': 'benchBuy', disabled: state.coins < BENCH_PRICES[benches], onClick: () => apply(buyBench) }, t('work.bench', { n: BENCH_PRICES[benches] })) : null,
      h(InfoTip, { t, lines: [t('work.rules')] })),
    benches === 0 ? h('p', { className: 'fg-empty' }, t('work.none')) : null,
    jobs.map((job, index) => h('div', { key: index, className: 'fg-tripRow', 'data-job': job.recipe },
      h('progress', { max: job.end - job.start, value: Math.max(0, Math.min(job.end - job.start, clock - job.start)), 'aria-label': t(`work.${job.recipe}`) }),
      clock >= job.end
        ? h('button', { type: 'button', className: 'fg-btn fg-btnPrimary', 'data-action': 'jobClaim', onClick: () => apply((current, now) => claimJob(current, index, now)) }, t('work.claim', { name: t(`work.${job.recipe}`), n: job.coins }))
        : h('span', { className: 'fg-note' }, t('work.busy', { name: t(`work.${job.recipe}`), time: formatDuration(job.end - clock, t) })),
      clock < job.end ? h('button', { type: 'button', className: 'fg-btn fg-btnSmall', 'data-action': 'jobRush', disabled: (state.ribbons ?? 0) < RUSH_RIBBONS, onClick: () => apply((current, now) => rushJob(current, index, now)) }, t('rush.go')) : null)),
    jobs.length < benches ? h('div', { className: 'fg-workNew' },
      h('div', { className: 'fg-bagFilters', role: 'group', 'aria-label': t('work.title') }, RECIPES.map(entry =>
        h('button', { key: entry.id, type: 'button', className: 'fg-bagFilter', 'data-recipe': entry.id, 'aria-pressed': entry.id === recipeId ? 'true' : 'false', onClick: () => { setRecipe(entry.id); setPicked([]) } },
          t('work.recipe', { name: t(`work.${entry.id}`), count: entry.count, time: formatDuration(entry.ms, t), fee: entry.fee })))),
      h(BagGrid, { entries, onSelect: key => { const entry = entries.find(candidate => candidate.key === key); if (entry && chosen.length < recipe.count) setPicked([...chosen, entry.free[0]]) } }),
      h('button', { type: 'button', className: 'fg-btn fg-btnPrimary', 'data-action': 'jobStart', disabled: chosen.length < recipe.count || state.coins < recipe.fee,
        onClick: () => { apply((current, now) => { const indices = chosen.map(item => current.basket.indexOf(item)); return indices.includes(-1) ? null : startJob(current, recipe.id, indices, now) }); setPicked([]) } },
      chosen.length < recipe.count ? t('work.pick', { n: recipe.count - chosen.length }) : t('work.start', { n: worth }))) : null)
}

function CardPages({ state, t, onChange }) {
  return h('div', { className: 'fg-pages', id: 'fg-pages' },
    h('div', { className: 'fg-sectionHead' }, h('strong', null, t('page.title')), h(InfoTip, { t, lines: [t('page.rules')] })),
    h('div', { className: 'fg-goalGrid' }, PAGES.map(page => {
      const progress = pageProgress(state, page)
      const name = page.kind === 'scene' ? t('page.scene', { scene: t(`scene.${page.scene}`) }) : t(`page.${page.kind}`)
      return h('article', { key: page.id, className: 'fg-goal', 'data-page': page.id, 'data-done': progress.done ? 'true' : 'false' },
        h('strong', null, progress.done ? '✓ ' : '', name),
        h('progress', { max: page.need, value: progress.count, 'aria-label': name }),
        progress.done ? h('span', { className: 'fg-questChip', 'data-tone': 'gold' }, t('page.done'))
          : progress.count >= page.need
            ? h('button', { type: 'button', className: 'fg-btn fg-btnSmall fg-btnPrimary', 'data-action': 'pageClaim', onClick: () => { tick(); const next = claimPage(getState(), page.id); if (next !== null) onChange(next) } }, t('page.claim', { reward: rewardText(page.reward, t) }))
            : h('span', { className: 'fg-note' }, `${progress.count}/${page.need} · ${rewardText(page.reward, t)}`))
    })))
}

function Contest({ state, t, clock, onChange }) {
  const week = contestWeek(clock)
  const entered = state.contest?.week === week ? state.contest : null
  const cards = (state.bouquets ?? []).slice().reverse()
  const [pick, setPick] = React.useState(null)
  const card = cards.find(entry => entry.id === pick) ?? cards[0]
  const board = [...contestRivals(week).map(rival => ({ name: t(`contest.rival.${rival.id}`), score: rival.score })),
    ...(entered ? [{ name: t('contest.you'), score: entered.score, you: true }] : [])].sort((a, b) => b.score - a.score || (b.you ? 1 : 0) - (a.you ? 1 : 0))
  return h('section', { className: 'fg-section fg-contest', id: 'fg-contest' },
    h('div', { className: 'fg-sectionHead' },
      h('h3', { className: 'fg-sectionTitle' }, t('contest.title')),
      (state.contestWins ?? 0) > 0 ? h('span', { className: 'fg-sectionMeta' }, t('contest.wins', { n: state.contestWins })) : null,
      h(InfoTip, { t, lines: [t('contest.rules')] })),
    h('div', { className: 'fg-ecoTargets' }, board.map((row, index) =>
      h('span', { key: index, className: 'fg-questChip', 'data-tone': row.you ? 'gold' : undefined }, `${index + 1}. ${row.name} · ${t('contest.score', { n: row.score })}`))),
    entered ? h('p', { className: 'fg-sectionOk' }, t('contest.rank', { n: entered.rank, score: entered.score }))
      : cards.length === 0 ? h('p', { className: 'fg-empty' }, t('contest.need'))
        : h('div', { className: 'fg-tripRow' },
          h('select', { className: 'fg-btn', value: card.id, 'aria-label': t('contest.title'), onChange: event => setPick(Number(event.target.value)) },
            cards.map(entry => h('option', { key: entry.id, value: entry.id }, `${entry.title || '#' + entry.id} · ${'★'.repeat(entry.stars)} · ${t('contest.score', { n: bouquetScore(entry) })}`))),
          h('button', { type: 'button', className: 'fg-btn fg-btnPrimary', 'data-action': 'contestEnter', disabled: state.coins < CONTEST_FEE,
            onClick: () => { tick(); const next = enterContest(getState(), card.id, Date.now()); if (next !== null) onChange(next) } }, t('contest.enter', { n: CONTEST_FEE }))))
}

function LegacyBoard({ state, t, onStart }) {
  const [armed, setArmed] = React.useState(false)
  const ready = legacyReady(state)
  return h('section', { className: 'fg-section fg-legacy', id: 'fg-legacy' },
    h('div', { className: 'fg-sectionHead' },
      h('h2', { className: 'fg-sectionTitle' }, t('legacy.title')),
      (state.legacy ?? 0) > 0 ? h('span', { className: 'fg-questChip', 'data-tone': 'gold' }, t('legacy.count', { n: state.legacy + 1 })) : null,
      h(InfoTip, { t, lines: [t('legacy.rules')] })),
    ready
      ? h('button', { type: 'button', className: armed ? 'fg-btn fg-btnDanger' : 'fg-btn', 'data-action': 'legacy', onClick: () => { if (!armed) { setArmed(true); return } setArmed(false); onStart() } }, t(armed ? 'legacy.confirm' : 'legacy.go'))
      : h('p', { className: 'fg-note' }, t('legacy.need', { n: LEGACY_LEVEL })))
}
