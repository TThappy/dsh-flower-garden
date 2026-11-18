
    // ---------------------------------------------------------------------
    // §3n Bulk actions: harvest every ripe plant, sow every empty plot at random.
    // ---------------------------------------------------------------------
    /** Harvest every ripe, non-resident plant of one ground, until the basket is full. Null when nothing was picked. */
    function harvestAll(state, sceneId, now) {
      let next = state
      const count = state.scenes[sceneId]?.unlocked ?? 0
      for (let index = 0; index < count; index += 1) {
        const plot = next.scenes[sceneId].plots[index]
        if (plot === null || plot === undefined || plot.resident) continue
        const done = harvestAt(next, sceneId, index, now, weatherAt(now), false)
        if (done !== null) next = done
      }
      return next === state ? null : next
    }

    /** Fill every empty plot of one ground with a random seed the purse can pay for. Null when nothing was sown. */
    function sowRandom(state, sceneId) {
      const scene = SCENE_BY_ID.get(sceneId)
      if (scene === undefined || state.scenes[sceneId] === undefined) return null
      let next = state
      for (let index = 0; index < next.scenes[sceneId].unlocked; index += 1) {
        if (next.scenes[sceneId].plots[index] !== null) continue
        const pool = scene.species.filter(id => SPECIES_BY_ID.get(id).cost <= next.coins)
        if (pool.length === 0) break
        const pick = pool[Math.floor(hashUnit(next.seed, next.planted ?? 0, index + 97) * pool.length)]
        const done = plantAt(next, sceneId, index, pick)
        if (done !== null) next = done
      }
      return next === state ? null : next
    }

    function ripeCount(slot) {
      return slot.plots.slice(0, slot.unlocked).filter(plot => plot && !plot.resident && stageOf(plot) === 'bloom').length
    }

    function emptyCount(slot) {
      return slot.plots.slice(0, slot.unlocked).filter(plot => plot === null).length
    }

    /** How many visitors are waiting on one ground right now. */
    function visitorCount(state, sceneId, now) {
      const slot = state.scenes[sceneId]
      if (slot === undefined) return 0
      const weather = weatherAt(now), hive = facilityLevel(state, 'hive'), bonus = gardenEcology(state, now).visitorBonus
      return slot.plots.slice(0, slot.unlocked).filter((plot, index) => visitorAt(sceneId, index, plot, now, weather, hive, bonus, state) !== null).length
    }

    /** Greet every visitor waiting on one ground. Null when nobody is there. */
    function greetAll(state, sceneId, now) {
      let next = state
      const count = state.scenes[sceneId]?.unlocked ?? 0
      for (let index = 0; index < count; index += 1) {
        const done = greetVisitor(next, sceneId, index, now, weatherAt(now))
        if (done !== null) next = done
      }
      return next === state ? null : next
    }

    const BULK_API = { harvestAll, sowRandom, ripeCount, emptyCount, visitorCount, greetAll }
