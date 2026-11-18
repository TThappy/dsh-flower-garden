
    // ---------------------------------------------------------------------
    // §3u Long-term loops: the workshop, collection pages, the weekly bouquet
    //     contest and starting the garden over with heirlooms.
    // ---------------------------------------------------------------------
    const BENCH_PRICES = [500, 2000, 6000]
    const RECIPES = [
      { id: 'dried', count: 1, ms: 10 * 60 * 1000, mult: 0.9, fee: 5 },
      { id: 'tea', count: 3, ms: 30 * 60 * 1000, mult: 1, fee: 20 },
      { id: 'perfume', count: 5, ms: 2 * 60 * 60 * 1000, mult: 1.1, fee: 60 },
    ]
    const RECIPE_BY_ID = new Map(RECIPES.map(recipe => [recipe.id, recipe]))
    const CONTEST_FEE = 100
    const CONTEST_RIVALS = ['iris', 'moss', 'wren']
    const CONTEST_PRIZES = [{ coins: 300, ribbons: 3 }, { ribbons: 2 }, { ribbons: 1 }, {}]
    const LEGACY_LEVEL = 15
    const HEIRLOOM_SEEDS = 3
    const PAGES = [
      ...SCENES.map(scene => ({ id: `scene-${scene.id}`, kind: 'scene', scene: scene.id, need: 4, reward: { coins: 300 } })),
      { id: 'rarity', kind: 'rarity', need: 5, reward: { coins: 800, bag: { charm: 1 } } },
      { id: 'traits', kind: 'traits', need: 4, reward: { coins: 600 } },
    ]

    function benchCount(state) {
      return Math.max(0, Math.min(BENCH_PRICES.length, Math.floor(state.workshop?.benches ?? 0)))
    }

    function buyBench(state) {
      const benches = benchCount(state)
      if (benches >= BENCH_PRICES.length || state.coins < BENCH_PRICES[benches]) return null
      return { ...state, coins: state.coins - BENCH_PRICES[benches], workshop: { benches: benches + 1, jobs: state.workshop?.jobs ?? [] } }
    }

    /** Process basket blooms at list price (the market slump does not apply), for a fee and some waiting. */
    function startJob(state, recipeId, indices, now) {
      const recipe = RECIPE_BY_ID.get(recipeId)
      const jobs = state.workshop?.jobs ?? []
      if (recipe === undefined || jobs.length >= benchCount(state) || state.coins < recipe.fee) return null
      if (!Array.isArray(indices) || indices.length !== recipe.count || new Set(indices).size !== indices.length) return null
      if (indices.some(index => !Number.isInteger(index) || index < 0 || index >= state.basket.length)) return null
      const used = new Set(indices)
      const value = indices.reduce((sum, index) => sum + itemValue(state.basket[index]), 0)
      const job = { recipe: recipe.id, coins: Math.round(value * recipe.mult), start: now, end: now + recipe.ms }
      return { ...state, coins: state.coins - recipe.fee, basket: state.basket.filter((_, index) => !used.has(index)), workshop: { benches: benchCount(state), jobs: [...jobs, job] } }
    }

    function claimJob(state, index, now) {
      const jobs = state.workshop?.jobs ?? []
      const job = jobs[index]
      if (job === undefined || now < job.end) return null
      return { ...state, coins: state.coins + job.coins, crafted: (state.crafted ?? 0) + 1, workshop: { benches: benchCount(state), jobs: jobs.filter((_, at) => at !== index) } }
    }

    /** What the flower cards cover on one collection page. */
    function pageProgress(state, page) {
      const items = (state.cards ?? []).map(card => card.item)
      const have = page.kind === 'scene' ? new Set(items.filter(item => SCENE_ID_OF.get(item.species) === page.scene).map(item => item.species))
        : page.kind === 'rarity' ? new Set(items.map(rarityOf)) : new Set(items.filter(item => item.trait).map(item => item.trait))
      return { have: [...have], count: Math.min(page.need, have.size), need: page.need, done: state.pagesDone?.[page.id] === true }
    }

    function claimPage(state, id) {
      const page = PAGES.find(entry => entry.id === id)
      if (page === undefined) return null
      const progress = pageProgress(state, page)
      if (progress.done || progress.count < page.need) return null
      return { ...applyReward(state, page.reward), pagesDone: { ...state.pagesDone, [id]: true } }
    }

    function contestWeek(now) {
      return Math.floor(localDay(now) / 7)
    }

    function contestRivals(week) {
      return CONTEST_RIVALS.map((id, index) => ({ id, score: 20 + Math.floor(hashUnit(week, index, 71) * 35) }))
    }

    function bouquetScore(card) {
      return card.stars * 10 + card.items.length + (card.match === true ? 5 : 0)
    }

    /** Enter one bouquet card a week against three rivals; the fee is paid whatever the result. */
    function enterContest(state, cardId, now) {
      const week = contestWeek(now)
      const card = (state.bouquets ?? []).find(entry => entry.id === cardId)
      if (card === undefined || state.contest?.week === week || state.coins < CONTEST_FEE) return null
      const score = bouquetScore(card)
      const rank = 1 + contestRivals(week).filter(rival => rival.score > score).length
      const prize = CONTEST_PRIZES[rank - 1]
      const paid = applyReward({ ...state, coins: state.coins - CONTEST_FEE }, prize)
      return {
        ...paid, contest: { week, card: cardId, score, rank }, contestWins: (state.contestWins ?? 0) + (rank === 1 ? 1 : 0),
        ribbons: (state.ribbons ?? 0) + (prize.ribbons ?? 0), ribbonsEarned: (state.ribbonsEarned ?? 0) + (prize.ribbons ?? 0),
      }
    }

    function legacyReady(state) {
      return levelOf(state.xp) >= LEGACY_LEVEL && SCENES.every(scene => (state.scenes[scene.id]?.unlocked ?? 0) > 0)
    }

    /** Start over: plots, coins and level reset; the album, vases, shelf, records and a few seeds stay. */
    function startLegacy(state, now) {
      if (!legacyReady(state)) return null
      const keys = Object.keys(state.seeds ?? {}).slice(0, HEIRLOOM_SEEDS)
      const legacy = (state.legacy ?? 0) + 1
      const keep = {}
      for (const field of ['ui', 'discoveries', 'discoverySeq', 'seen', 'specimens', 'hybrids', 'exotics', 'visitors', 'affinity', 'study', 'claimed',
        'daily', 'goalsDone', 'pagesDone', 'pedigree', 'bouquets', 'cards', 'cardSeq', 'vases', 'shelf', 'arranged', 'bouquetBest', 'trips', 'contest', 'contestWins', 'crafted', 'fund', 'companions', 'events', 'briefs', 'used', 'wantedDone']) {
        if (state[field] !== undefined) keep[field] = state[field]
      }
      return {
        ...freshState(now), ...keep, legacy, coins: START_COINS + 100 * legacy,
        seeds: Object.fromEntries(keys.map(key => [key, 1])),
        lineage: Object.fromEntries(keys.filter(key => state.lineage?.[key]?.length > 0).map(key => [key, [state.lineage[key][0]]])),
      }
    }

    function sanitizeLongterm(raw, now) {
      const benches = Math.max(0, Math.min(BENCH_PRICES.length, Math.floor(finiteOr(raw.workshop?.benches, 0))))
      const jobs = (Array.isArray(raw.workshop?.jobs) ? raw.workshop.jobs : [])
        .filter(job => job && RECIPE_BY_ID.has(job.recipe) && Number.isFinite(job.start) && job.start >= 0)
        .map(job => { const start = Math.min(job.start, now); return { recipe: job.recipe, coins: Math.floor(finiteOr(job.coins, 0)), start, end: Number.isFinite(job.end) && job.end >= start ? Math.min(start + RECIPE_BY_ID.get(job.recipe).ms, job.end) : start + RECIPE_BY_ID.get(job.recipe).ms } })
        .slice(0, benches)
      const pagesDone = {}
      for (const page of PAGES) if (raw.pagesDone?.[page.id] === true) pagesDone[page.id] = true
      const c = raw.contest
      const contest = c && Number.isFinite(c.week) && Number.isFinite(c.rank)
        ? { week: Math.floor(c.week), card: Math.floor(finiteOr(c.card, 0)), score: Math.floor(finiteOr(c.score, 0)), rank: Math.max(1, Math.min(4, Math.floor(c.rank))) } : null
      return {
        workshop: { benches, jobs }, pagesDone, contest,
        contestWins: Math.floor(finiteOr(raw.contestWins, 0)), crafted: Math.floor(finiteOr(raw.crafted, 0)), legacy: Math.floor(finiteOr(raw.legacy, 0)),
      }
    }

    const LONGTERM_API = {
      BENCH_PRICES, RECIPES, CONTEST_FEE, CONTEST_PRIZES, LEGACY_LEVEL, HEIRLOOM_SEEDS, PAGES,
      benchCount, buyBench, startJob, claimJob, pageProgress, claimPage, contestWeek, contestRivals, bouquetScore, enterContest,
      legacyReady, startLegacy, sanitizeLongterm,
    }
