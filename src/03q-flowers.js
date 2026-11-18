
    // ---------------------------------------------------------------------
    // §3q Every flower is good for something: a bloom can be used up for an
    //     effect set by its ecological role, and three species a day are wanted.
    // ---------------------------------------------------------------------
    const USE_BOND = 2
    const USE_SOIL = 20
    const USE_BOOST_MS = 5 * 60 * 1000
    const WANTED_SLOTS = 3

    function flowerUse(speciesId) {
      return ECO_PROFILES[speciesId]?.role ?? null
    }

    /** Use up one basket bloom on the current ground; a special bloom works twice as well. Null when it would be wasted. */
    function useBloom(state, basketIndex, now) {
      const item = state.basket[basketIndex]
      const role = item === undefined ? null : flowerUse(item.species)
      const slot = state.scenes[state.scene]
      if (role === null || slot === undefined) return null
      const power = isPlainBloom(item) ? 1 : 2
      const base = { ...state, basket: state.basket.filter((_, index) => index !== basketIndex), used: (state.used ?? 0) + 1 }
      const withSlot = patch => ({ ...base, scenes: { ...state.scenes, [state.scene]: { ...slot, ...patch } } })
      const planted = slot.plots.filter(plot => plot !== null && plot !== undefined)
      if (role === 'nectar') {
        const friend = ECO_PROFILES[item.species].visitor
        return VISITOR_BY_ID.has(friend) ? addAffinity(base, friend, USE_BOND * power) : null
      }
      if (role === 'seed') return applyReward(base, { bag: { fertilizer: power } })
      if (role === 'night') return { ...base, boost: { type: 'rainbow', until: now + USE_BOOST_MS * power } }
      if (role === 'pollen') {
        let left = power
        const plots = slot.plots.map(plot => {
          if (plot === null || plot === undefined || plot.pollinated === true || left === 0) return plot
          left -= 1
          return { ...plot, pollinated: true }
        })
        return left === power ? null : withSlot({ plots })
      }
      if (role === 'water') {
        if (!planted.some(plot => plot.moisture < 99.5)) return null
        return withSlot({ plots: slot.plots.map(plot => (plot === null || plot === undefined ? plot : { ...plot, moisture: 100 })) })
      }
      const soil = new Array(PLOT_COUNT).fill(100).map((_, at) => (at < slot.unlocked ? Math.min(100, soilOf(slot, at) + USE_SOIL * power) : soilOf(slot, at)))
      if (soil.every((value, at) => value === soilOf(slot, at))) return null
      return withSlot({ soil })
    }

    /** Three wanted species a day, walking through every flower of the opened grounds in turn. */
    function wantedAt(state, now) {
      const day = localDay(now)
      const pool = SPECIES.filter(species => (state.scenes[SCENE_ID_OF.get(species.id)]?.unlocked ?? 0) > 0)
      return Array.from({ length: Math.min(WANTED_SLOTS, pool.length) }, (_, index) => pool[(day * WANTED_SLOTS + index) % pool.length].id)
    }

    function wantedState(state, now) {
      const day = localDay(now)
      return state.wanted && state.wanted.day === day ? state.wanted : { day, done: [] }
    }

    function wantedPay(speciesId) {
      return SPECIES_BY_ID.get(speciesId).sell * 2 + 10
    }

    /** Hand in one bloom of a wanted species for twice its price; all three in a day add a ribbon. */
    function deliverWanted(state, speciesId, now) {
      const list = wantedAt(state, now)
      const wanted = wantedState(state, now)
      if (!list.includes(speciesId) || wanted.done.includes(speciesId)) return null
      let at = state.basket.findIndex(item => item.species === speciesId && isPlainBloom(item))
      if (at === -1) at = state.basket.findIndex(item => item.species === speciesId)
      if (at === -1) return null
      const done = [...wanted.done, speciesId]
      const all = list.every(id => done.includes(id))
      return {
        ...state, coins: state.coins + wantedPay(speciesId), basket: state.basket.filter((_, index) => index !== at),
        wanted: { day: wanted.day, done }, wantedDone: (state.wantedDone ?? 0) + 1,
        ribbons: (state.ribbons ?? 0) + (all ? 1 : 0), ribbonsEarned: (state.ribbonsEarned ?? 0) + (all ? 1 : 0),
      }
    }

    function sanitizeFlowers(raw, now) {
      const w = raw.wanted
      const wanted = w && Number.isFinite(w.day) && Array.isArray(w.done)
        ? { day: Math.min(localDay(now), Math.floor(w.day)), done: [...new Set(w.done.filter(id => SPECIES_BY_ID.has(id)))] } : null
      return { used: Math.floor(finiteOr(raw.used, 0)), wantedDone: Math.floor(finiteOr(raw.wantedDone, 0)), wanted }
    }

    const FLOWER_API = { USE_BOND, USE_SOIL, USE_BOOST_MS, WANTED_SLOTS, flowerUse, useBloom, wantedAt, wantedState, wantedPay, deliverWanted, sanitizeFlowers }
