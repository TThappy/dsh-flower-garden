
    // ---------------------------------------------------------------------
    // §3w Real seasons, night blooms, seed expeditions, vases and keepsake cards.
    // ---------------------------------------------------------------------
    const SEASON_BONUS = 0.05
    const NIGHT_BONUS = 0.08
    const VASES = [
      { id: 'classic', need: 0 }, { id: 'round', need: 2 }, { id: 'tall', need: 5 },
      { id: 'basket', need: 10 }, { id: 'moon', need: 20 }, { id: 'gold', stars: 5 },
    ]
    const VASE_BY_ID = new Map(VASES.map(vase => [vase.id, vase]))
    const BOUQUET_CARD_CAP = 30
    const FLOWER_CARD_CAP = 60
    const HOUR_MS = 60 * 60 * 1000
    const EXPEDITIONS = [
      { id: 'short', ms: HOUR_MS, cost: 20, rolls: 1 },
      { id: 'day', ms: 4 * HOUR_MS, cost: 60, rolls: 3 },
      { id: 'long', ms: 8 * HOUR_MS, cost: 120, rolls: 6 },
    ]
    const EXPEDITION_BY_ID = new Map(EXPEDITIONS.map(entry => [entry.id, entry]))

    /** Season of the player's own calendar: 0 spring (Mar–May) … 3 winter. */
    function realSeason(now) {
      const month = new Date(now).getMonth()
      return month >= 2 && month <= 4 ? 0 : month >= 5 && month <= 7 ? 1 : month >= 8 && month <= 10 ? 2 : 3
    }

    function inSeason(speciesId, now) {
      return ECO_PROFILES[speciesId] !== undefined && ECO_PROFILES[speciesId].season === realSeason(now)
    }

    function nightBloom(speciesId, now) {
      return ECO_PROFILES[speciesId]?.role === 'night' && isNight(now)
    }

    /** Extra spirit chance: a flower in its own season, a night flower after dark. Never a penalty. */
    function seasonalBonus(speciesId, now) {
      return (inSeason(speciesId, now) ? SEASON_BONUS : 0) + (nightBloom(speciesId, now) ? NIGHT_BONUS : 0)
    }

    function vaseUnlocked(state, id) {
      const vase = VASE_BY_ID.get(id)
      if (vase === undefined) return false
      return vase.stars !== undefined ? (state.bouquetBest ?? 0) >= vase.stars : (state.arranged ?? 0) >= vase.need
    }

    function cleanBloom(item) {
      if (item === null || typeof item !== 'object' || !SPECIES_BY_ID.has(item.species)) return null
      const bloom = { species: item.species, variant: item.variant === 'alt' || item.variant === 'hidden' ? item.variant : 'base' }
      if (Number.isFinite(item.dna) && item.dna > 0) bloom.dna = Math.floor(item.dna)
      if (bloom.variant !== 'hidden' && TRAIT_BY_ID.has(item.trait)) bloom.trait = item.trait
      if (typeof item.tint === 'string' && SPECIES_BY_ID.has(item.tint) && item.tint !== item.species) bloom.tint = item.tint
      return bloom
    }

    /** Every finished bouquet leaves a card behind; the oldest cards make room. */
    function bouquetCardPatch(state, items, score, vase, now) {
      const id = (state.cardSeq ?? 0) + 1
      const card = { id, at: now, stars: score.stars, theme: score.theme, coins: score.coins, vase: vaseOwned(state, vase) ? vase : 'classic', match: score.match === true, items: items.map(cleanBloom).filter(Boolean) }
      return { cardSeq: id, bouquets: [...(state.bouquets ?? []), card].slice(-BOUQUET_CARD_CAP) }
    }

    /** Keep one basket bloom as a card instead of selling it. */
    function pressCard(state, basketIndex, now) {
      const item = state.basket[basketIndex]
      if (item === undefined || (state.cards ?? []).length >= FLOWER_CARD_CAP) return null
      const id = (state.cardSeq ?? 0) + 1
      return { ...state, cardSeq: id, basket: state.basket.filter((_, index) => index !== basketIndex), cards: [...(state.cards ?? []), { id, at: now, item: cleanBloom(item) }] }
    }

    function removeCard(state, kind, id) {
      if (kind !== 'bouquets' && kind !== 'cards') return null
      const list = state[kind] ?? []
      if (!list.some(card => card.id === id)) return null
      return { ...state, [kind]: list.filter(card => card.id !== id) }
    }

    function startExpedition(state, sceneId, kind, now) {
      const trip = EXPEDITION_BY_ID.get(kind)
      if (trip === undefined || state.expedition || !((state.scenes[sceneId]?.unlocked ?? 0) > 0) || state.coins < trip.cost) return null
      return { ...state, coins: state.coins - trip.cost, expedition: { scene: sceneId, kind, start: now, end: now + trip.ms, bonus: patronBonus(state) } }
    }

    /** What a party brings back; fixed when it sets out, so waiting cannot reroll it. */
    function expeditionLoot(expedition) {
      const trip = EXPEDITION_BY_ID.get(expedition.kind)
      const scene = SCENE_BY_ID.get(expedition.scene)
      const loot = { coins: 0, bag: {}, seeds: {}, ribbons: 0 }
      const salt = Math.floor(expedition.start / 1000)
      for (let roll = 0; roll < trip.rolls + (expedition.bonus ?? 0); roll += 1) {
        const u = hashUnit(salt, roll, 41)
        const v = hashUnit(salt, roll, 43)
        if (u < 0.4) loot.coins += 15 + Math.floor(v * 40)
        else if (u < 0.65) {
          const form = scene.species[Math.floor(v * scene.species.length)]
          const others = scene.species.filter(id => id !== form)
          const key = `${form}~${others[Math.floor(hashUnit(salt, roll, 47) * others.length)]}`
          loot.seeds[key] = (loot.seeds[key] ?? 0) + 1
        } else if (u < 0.8) loot.bag.fertilizer = (loot.bag.fertilizer ?? 0) + 1
        else if (u < 0.9) loot.bag.compost = (loot.bag.compost ?? 0) + 1
        else if (u < 0.97) loot.ribbons += 1
        else loot.bag.charm = (loot.bag.charm ?? 0) + 1
      }
      return loot
    }

    function claimExpedition(state, now) {
      const trip = state.expedition
      if (!trip || now < trip.end) return null
      const loot = expeditionLoot(trip)
      const seeds = { ...state.seeds }
      for (const [key, n] of Object.entries(loot.seeds)) seeds[key] = (seeds[key] ?? 0) + n
      return {
        ...applyReward(state, loot), seeds, expedition: null, trips: (state.trips ?? 0) + 1,
        ribbons: (state.ribbons ?? 0) + loot.ribbons, ribbonsEarned: (state.ribbonsEarned ?? 0) + loot.ribbons,
      }
    }

    function sanitizeAlbum(raw, now) {
      const stamp = value => (Number.isFinite(value) && value >= 0 ? Math.min(value, now) : now)
      const bouquets = (Array.isArray(raw.bouquets) ? raw.bouquets : []).filter(card => card && Number.isFinite(card.id) && Array.isArray(card.items)).map(card => ({
        id: Math.floor(card.id), at: stamp(card.at), stars: Math.max(1, Math.min(5, Math.floor(finiteOr(card.stars, 1)))),
        theme: BOUQUET_THEMES.includes(card.theme) ? card.theme : BOUQUET_THEMES[0], coins: Math.floor(finiteOr(card.coins, 0)),
        vase: VASE_BY_ID.has(card.vase) ? card.vase : 'classic', match: card.match === true, title: cleanText(card.title, 20), note: cleanText(card.note, 60), items: card.items.slice(0, BOUQUET_MAX).map(cleanBloom).filter(Boolean),
      })).filter(card => card.items.length > 0).slice(-BOUQUET_CARD_CAP)
      const cards = (Array.isArray(raw.cards) ? raw.cards : []).filter(card => card && Number.isFinite(card.id) && cleanBloom(card.item) !== null)
        .map(card => ({ id: Math.floor(card.id), at: stamp(card.at), item: cleanBloom(card.item) })).slice(-FLOWER_CARD_CAP)
      let expedition = null
      const trip = raw.expedition
      if (trip && typeof trip === 'object' && SCENE_BY_ID.has(trip.scene) && EXPEDITION_BY_ID.has(trip.kind) && Number.isFinite(trip.start) && trip.start >= 0) {
        const start = Math.min(trip.start, now)
        const full = start + EXPEDITION_BY_ID.get(trip.kind).ms
        expedition = { scene: trip.scene, kind: trip.kind, start, end: Number.isFinite(trip.end) && trip.end >= start ? Math.min(full, trip.end) : full, bonus: Math.max(0, Math.min(PATRON_MAX, Math.floor(finiteOr(trip.bonus, 0)))) }
      }
      const cardSeq = Math.max(Math.floor(finiteOr(raw.cardSeq, 0)), ...bouquets.map(card => card.id), ...cards.map(card => card.id), 0)
      return { bouquets, cards, cardSeq, expedition, trips: Math.floor(finiteOr(raw.trips, 0)) }
    }

    const ALBUM_API = {
      SEASON_BONUS, NIGHT_BONUS, VASES, BOUQUET_CARD_CAP, FLOWER_CARD_CAP, EXPEDITIONS,
      realSeason, inSeason, nightBloom, seasonalBonus, vaseUnlocked, pressCard, removeCard,
      startExpedition, expeditionLoot, claimExpedition, sanitizeAlbum,
    }
