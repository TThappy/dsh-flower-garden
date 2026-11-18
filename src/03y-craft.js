
    // ---------------------------------------------------------------------
    // §3a More to do with a flower than sell it: bouquets and visitor bonds.
    // ---------------------------------------------------------------------
    const BOUQUET_MIN = 3
    const BOUQUET_MAX = 7
    const BOUQUET_STAR_BONUS = 0.06
    const BOUQUET_THEMES = ['warm', 'rosy', 'cool', 'white']
    const AFFINITY_LEVELS = [5, 15, 30, 60]
    const AFFINITY_REWARDS = [{ coins: 30 }, { bag: { fertilizer: 2 } }, { coins: 120 }, { bag: { sprinkler: 1, charm: 1 } }]
    const AFFINITY_GREET = 1
    const EXTRA_FAVOURITES = { swallowtail: ['zinnia', 'cosmos', 'lavender'], hoverfly: ['daisy', 'calendula', 'dandelion'] }

    /** Colour family and hue of one bloom's petals; pale petals count as white and go with anything. */
    function bloomTone(item) {
      const species = SPECIES_BY_ID.get(item.species)
      const hex = species === undefined ? '' : String(paletteOf(species, item.variant ?? 'base', item.tint).petal ?? '')
      const match = /^#([0-9a-f]{6})$/iu.exec(hex)
      if (match === null) return { family: 'white', hue: null }
      const n = parseInt(match[1], 16)
      const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255
      const max = Math.max(r, g, b), d = max - Math.min(r, g, b)
      if (max === 0 || d / max < 0.18) return { family: 'white', hue: null }
      const raw = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
      const hue = (raw * 60 + 360) % 360
      return { family: hue >= 300 || hue < 15 ? 'rosy' : hue < 150 ? 'warm' : 'cool', hue }
    }

    /** Neighbouring hues, or two groups facing each other across the colour wheel. */
    function huesHarmonise(hues) {
      if (hues.length <= 1) return true
      const sorted = [...hues].sort((a, b) => a - b)
      let gap = 360 - sorted[sorted.length - 1] + sorted[0]
      for (let i = 1; i < sorted.length; i += 1) gap = Math.max(gap, sorted[i] - sorted[i - 1])
      if (360 - gap <= 70) return true
      const apart = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d }
      return hues.some(anchor => hues.every(hue => apart(hue, anchor) <= 40 || apart(hue, anchor + 180) <= 40)
        && hues.some(hue => apart(hue, anchor + 180) <= 40))
    }

    function bouquetTheme(now) {
      return BOUQUET_THEMES[Math.floor(hashUnit(localDay(now), 5, 233) * BOUQUET_THEMES.length)]
    }

    /** One to five stars for three to seven blooms; a bouquet pays more than the same flowers sold loose. */
    function arrangeScore(items, now, vase) {
      if (!Array.isArray(items) || items.length < BOUQUET_MIN || items.length > BOUQUET_MAX) return null
      const tones = items.map(bloomTone)
      const values = items.map(itemValue).sort((a, b) => b - a)
      const special = items.filter(item => !isPlainBloom(item)).length
      const theme = bouquetTheme(now)
      const checks = {
        harmony: huesHarmonise(tones.filter(tone => tone.hue !== null).map(tone => tone.hue)),
        variety: new Set(items.map(item => item.species)).size >= 3,
        focal: special === 1 || (special === 0 && values[0] >= values[1] * 1.4),
        theme: tones.filter(tone => tone.family === theme).length * 2 >= items.length,
      }
      const stars = 1 + Object.values(checks).filter(Boolean).length
      const match = vaseMatch(vase, items)
      const value = values.reduce((sum, n) => sum + n, 0)
      return { stars, checks, theme, value: Math.round(value), match, coins: Math.round(value * (1 + BOUQUET_STAR_BONUS * stars + (match ? VASE_MATCH_BONUS : 0))), xp: stars * 2 }
    }

    function arrangeBouquet(state, indices, now, vase = 'classic') {
      if (!Array.isArray(indices) || new Set(indices).size !== indices.length) return null
      if (indices.some(index => !Number.isInteger(index) || index < 0 || index >= state.basket.length)) return null
      const items = indices.map(index => state.basket[index])
      const pot = vaseOwned(state, vase) ? vase : 'classic'
      const score = arrangeScore(items, now, pot)
      if (score === null) return null
      const used = new Set(indices)
      return {
        ...state,
        coins: state.coins + score.coins,
        xp: state.xp + score.xp,
        basket: state.basket.filter((_, index) => !used.has(index)),
        arranged: (state.arranged ?? 0) + 1,
        bouquetBest: Math.max(state.bouquetBest ?? 0, score.stars),
        ...bouquetCardPatch(state, items, score, pot, now),
        ...briefPatch(state, items, score, now),
      }
    }

    function visitorFavourites(visitorId) {
      const listed = SPECIES.filter(species => ECO_PROFILES[species.id]?.visitor === visitorId).map(species => species.id)
      return listed.length > 0 ? listed : (EXTRA_FAVOURITES[visitorId] ?? [])
    }

    function affinityLevel(state, visitorId) {
      const points = state.affinity?.[visitorId] ?? 0
      return AFFINITY_LEVELS.filter(need => points >= need).length
    }

    /** Add bond points; every level crossed pays its reward straight away. */
    function addAffinity(state, visitorId, points) {
      const before = affinityLevel(state, visitorId)
      let next = { ...state, affinity: { ...state.affinity, [visitorId]: (state.affinity?.[visitorId] ?? 0) + points } }
      const after = affinityLevel(next, visitorId)
      for (let level = before; level < after; level += 1) next = applyReward(next, AFFINITY_REWARDS[level])
      return next
    }

    function giftPoints(visitorId, item) {
      return 2 + (visitorFavourites(visitorId).includes(item.species) ? 4 : 0) + (isPlainBloom(item) ? 0 : 3)
    }

    /** Give one basket bloom to a visitor the player has already met. */
    function giftVisitor(state, visitorId, basketIndex) {
      if (!VISITOR_BY_ID.has(visitorId) || !((state.visitors?.[visitorId] ?? 0) > 0)) return null
      const item = state.basket[basketIndex]
      if (item === undefined) return null
      const basket = state.basket.filter((_, index) => index !== basketIndex)
      return addAffinity({ ...state, basket }, visitorId, giftPoints(visitorId, item))
    }

    function sanitizeCraft(raw) {
      const affinity = {}
      if (raw.affinity !== null && typeof raw.affinity === 'object') {
        for (const visitor of VISITORS) {
          const points = Math.floor(finiteOr(raw.affinity[visitor.id], 0))
          if (points > 0) affinity[visitor.id] = points
        }
      }
      return { affinity, arranged: Math.floor(finiteOr(raw.arranged, 0)), bouquetBest: Math.min(5, Math.floor(finiteOr(raw.bouquetBest, 0))) }
    }

    const CRAFT_API = {
      BOUQUET_MIN, BOUQUET_MAX, BOUQUET_STAR_BONUS, BOUQUET_THEMES, AFFINITY_LEVELS, AFFINITY_REWARDS, AFFINITY_GREET,
      bloomTone, huesHarmonise, bouquetTheme, arrangeScore, arrangeBouquet,
      visitorFavourites, affinityLevel, addAffinity, giftPoints, giftVisitor, sanitizeCraft,
    }
