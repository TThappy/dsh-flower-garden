    // Gardeners are unique recruits. Additional copies become upgrade shards.
    const GARDENER_DRAW_COST = 1000
    const GARDENER_RECYCLE_COINS = 100
    const GARDENER_DRAW_RIBBONS = 1
    const GARDENER_TEN_RIBBONS = 10 * GARDENER_DRAW_RIBBONS
    const GARDENER_TEN_COST = 10 * GARDENER_DRAW_COST
    const GARDENER_STORAGE_CAP = 60
    const GARDENER_STORAGE_MAX_LEVEL = 30
    const GARDENER_MAX_STARS = 5
    const GARDENER_MAX_RANK = 5
    const GARDENERS = [
      {id:'sprout', perk:'fertilizer', chance:15, amount:1, baseSeconds:120, rarity:'common', role:'harvest', weight:30},
      {id:'finch', perk:'coins', chance:20, amount:2, baseSeconds:120, rarity:'common', role:'greet', weight:30},
      {id:'clover', perk:'storedBloom', chance:15, amount:1, baseSeconds:90, rarity:'rare', role:'harvest', weight:15},
      {id:'robin', perk:'affinity', chance:15, amount:1, baseSeconds:90, rarity:'rare', role:'greet', weight:15},
      {id:'amber', perk:'ribbon', chance:12, amount:1, baseSeconds:60, rarity:'epic', role:'harvest', weight:4},
      {id:'luna', perk:'charm', chance:10, amount:1, baseSeconds:60, rarity:'epic', role:'greet', weight:4},
      {id:'xiaohei', perk:'compost', chance:15, amount:1, baseSeconds:60, rarity:'epic', role:'greet', weight:1.5},
      {id:'aurum', perk:'hybridSeed', chance:8, amount:1, baseSeconds:45, rarity:'legendary', role:'harvest', weight:0.5},
    ]
    const GARDENER_BY_ID = new Map(GARDENERS.map(entry => [entry.id, entry]))

    const GARDENER_BONUS_POOL = GARDENERS.filter(person => person.rarity === 'epic' || person.rarity === 'legendary')

    function gardenerStorageLevel(gardeners) {
      return Math.min(GARDENER_STORAGE_MAX_LEVEL, Math.max(1, Math.floor(finiteOr(gardeners?.storageLevel, 1))))
    }

    function gardenerStorageCapacity(state) {
      return GARDENER_STORAGE_CAP + (gardenerStorageLevel(state.gardeners) - 1) * 30
    }

    function gardenerStorageUpgradeCost(state) {
      const level = gardenerStorageLevel(state.gardeners)
      return level < GARDENER_STORAGE_MAX_LEVEL ? level * 500 : null
    }

    function upgradeGardenerStorage(state) {
      const cost = gardenerStorageUpgradeCost(state)
      if (cost === null || state.coins < cost) return null
      return {...state, coins:state.coins - cost, gardeners:{...state.gardeners, storageLevel:gardenerStorageLevel(state.gardeners) + 1}}
    }

    function sanitizeGardeners(raw, scenes, now) {
      const roster = {}, assignments = {}, workedAt = {}, lastWork = {}
      const level = (value, max) => Math.min(max, Math.max(1, Math.floor(finiteOr(value, 1))))
      for (const {id} of GARDENERS) {
        const worker = raw?.roster?.[id]
        if (!worker || Array.isArray(worker) || typeof worker !== 'object') continue
        roster[id] = {stars:level(worker.stars, GARDENER_MAX_STARS), rank:level(worker.rank, GARDENER_MAX_RANK),
          shards:Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(finiteOr(worker.shards, 0))))}
      }
      const employed = new Set()
      for (const {id: ground} of SCENES) {
        const id = raw?.assignments?.[ground]
        if (!GARDENER_BY_ID.has(id) || !roster[id] || !scenes[ground]?.unlocked || employed.has(id)) continue
        assignments[ground] = id
        employed.add(id)
        workedAt[ground] = Math.min(now, Math.max(0, finiteOr(raw?.workedAt?.[ground], now)))
      }
      for (const {id: ground} of SCENES) {
        const log = raw?.lastWork?.[ground]
        if (scenes[ground]?.unlocked && log && GARDENER_BY_ID.has(log.id) && ['greet','harvest','sow'].includes(log.action) && Number.isInteger(log.index) && log.index >= 0 && log.index < scenes[ground].unlocked && Number.isFinite(log.at) && log.at >= 0) {
          lastWork[ground] = {id:log.id, action:log.action, at:Math.min(now,log.at), index:log.index}
        }
      }
      const storage = Array.isArray(raw?.storage) ? raw.storage.slice(0, gardenerStorageCapacity({gardeners:raw})).map(cleanBloom).filter(Boolean) : []
      return {roster, assignments, workedAt, lastWork, storageLevel:gardenerStorageLevel(raw), autoSow:raw?.autoSow === true, storage, lastDraw:GARDENER_BY_ID.has(raw?.lastDraw) && roster[raw.lastDraw] ? raw.lastDraw : null}
    }

    function recruitFromPool(state, pool) {
      const roll = nextRandom(state.seed)
      let ticket = roll.value * pool.reduce((sum, person) => sum + person.weight, 0)
      const {id} = pool.find(worker => (ticket -= worker.weight) < 0)
      const team = state.gardeners, worker = team.roster[id]
      const recruited = worker ? {...worker, shards:worker.shards + 1} : {stars:1, rank:1, shards:0}
      return {...state, coins:state.coins - GARDENER_DRAW_COST, ribbons:state.ribbons - GARDENER_DRAW_RIBBONS, seed:roll.seed,
        gardeners:{...team, roster:{...team.roster, [id]:recruited}, lastDraw:id}}
    }

    function canRecruitGardeners(state, count = 1) {
      return (count === 1 || count === 10) && state.coins >= count * GARDENER_DRAW_COST && state.ribbons >= count * GARDENER_DRAW_RIBBONS
    }

    function drawGardener(state) {
      return canRecruitGardeners(state) ? recruitFromPool(state, GARDENERS) : null
    }

    function drawGardenerTen(state) {
      if (!canRecruitGardeners(state, 10)) return null
      const results = []
      let next = state
      for (let i = 0; i < 10; i++) {
        const before = next
        next = recruitFromPool(before, i === 9 ? GARDENER_BONUS_POOL : GARDENERS)
        const id = next.gardeners.lastDraw
        const isNew = !before.gardeners.roster[id]
        results.push({id, isNew, shards:isNew ? 0 : 1})
      }
      return {state:next, results}
    }

    function gardenerUpgradeCost(state, id, kind) {
      if (!GARDENER_BY_ID.has(id) || !['stars', 'rank'].includes(kind)) return null
      const worker = state.gardeners.roster[id]
      if (!worker || worker[kind] >= (kind === 'stars' ? GARDENER_MAX_STARS : GARDENER_MAX_RANK)) return null
      return kind === 'stars' ? {coins:50 * worker.stars, shards:worker.stars} : {coins:125 * worker.rank, shards:0}
    }

    function upgradeGardener(state, id, kind) {
      const cost = gardenerUpgradeCost(state, id, kind)
      if (!cost) return null
      const team = state.gardeners, worker = team.roster[id]
      if (state.coins < cost.coins || worker.shards < cost.shards) return null
      const upgraded = {...worker, [kind]:worker[kind] + 1, shards:worker.shards - cost.shards}
      return {...state, coins:state.coins - cost.coins, gardeners:{...team, roster:{...team.roster, [id]:upgraded}}}
    }

    function dismantleGardener(state, id) {
      const team = state.gardeners
      const worker = team.roster[id]
      if (!GARDENER_BY_ID.has(id) || !worker || Object.values(team.assignments).includes(id)) return null
      const roster = {...team.roster}
      delete roster[id]
      const lastDraw = team.lastDraw === id ? null : team.lastDraw
      return {...state, coins:state.coins + GARDENER_RECYCLE_COINS, gardeners:{...team, roster, lastDraw}}
    }
    function dismantleGardenerShard(state, id) {
      const team = state.gardeners, worker = team.roster[id]
      if (!GARDENER_BY_ID.has(id) || !worker || worker.shards <= 0) return null
      return {...state, coins:state.coins + GARDENER_RECYCLE_COINS, gardeners:{...team, roster:{...team.roster, [id]:{...worker, shards:worker.shards - 1}}}}
    }

    function assignGardener(state, id, sceneId, now = state.lastTick) {
      const team = state.gardeners
      if (!GARDENER_BY_ID.has(id) || !team.roster[id] || !Number.isFinite(now)) return null
      if (sceneId !== null && (!SCENE_BY_ID.has(sceneId) || !state.scenes[sceneId]?.unlocked)) return null
      const previous = Object.keys(team.assignments).find(ground => team.assignments[ground] === id) ?? null
      if (previous === sceneId) return null
      const assignments = {...team.assignments}, workedAt = {...team.workedAt}
      if (previous) { delete assignments[previous]; delete workedAt[previous] }
      if (sceneId !== null) { assignments[sceneId] = id; workedAt[sceneId] = now }
      return {...state, gardeners:{...team, assignments, workedAt}}
    }

    function gardenerInterval(state, id) {
      const entry = GARDENER_BY_ID.get(id), worker = state.gardeners?.roster[id] ?? {stars:1, rank:1}
      if (!entry) return Infinity
      return Math.round(entry.baseSeconds * 1000 / (1 + (worker.stars - 1) * .20 + (worker.rank - 1) * .10))
    }

    function gardenerTraitChance(state, id) {
      return (GARDENER_BY_ID.get(id)?.chance ?? 0) / 100
    }

    function applyGardenerTrait(before, after, id, sceneId, index) {
      const roll = nextRandom(after.seed)
      const next = {...after, seed:roll.seed}
      if (roll.value >= gardenerTraitChance(before, id)) return next
      const {perk, amount} = GARDENER_BY_ID.get(id)
      switch (perk) {
        case 'fertilizer':
        case 'compost': return applyReward(next, {bag:{[perk]:amount}})
        case 'coins': return {...next, coins:next.coins + amount}
        case 'storedBloom': {
          const {storage} = next.gardeners
          const copies = Math.min(amount, gardenerStorageCapacity(next) - storage.length)
          if (!copies) return next
          const bloom = storage[before.gardeners.storage.length]
          return {...next, gardeners:{...next.gardeners, storage:[...storage, ...Array.from({length:copies}, () => ({...bloom}))]}}
        }
        case 'affinity': {
          const visitor = VISITORS.find(({id}) => (next.visitors[id] ?? 0) > (before.visitors[id] ?? 0))
          return visitor ? addAffinity(next, visitor.id, amount) : next
        }
        case 'ribbon': return {...next, ribbons:next.ribbons + amount, ribbonsEarned:next.ribbonsEarned + amount}
        case 'charm': return applyReward(next, {bag:{charm:amount}})
        case 'hybridSeed': {
          const species = before.scenes[sceneId].plots[index].species
          const donors = SCENE_BY_ID.get(sceneId).species.filter(id => id !== species)
          const draw = nextRandom(next.seed)
          const seedKey = `${species}~${donors[Math.floor(draw.value * donors.length)]}`
          return {...next, seed:draw.seed, seeds:{...next.seeds, [seedKey]:(next.seeds[seedKey] ?? 0) + amount}}
        }
        default: return next
      }
    }

    function claimGardenerFlowers(state) {
      const team = state.gardeners
      const count = Math.min(team.storage.length, basketCapacity(state) - state.basket.length)
      if (count <= 0) return null
      return {...state, basket:[...state.basket, ...team.storage.slice(0, count)], gardeners:{...team, storage:team.storage.slice(count)}}
    }

    function setGardenerAutoSow(state, enabled) {
      if (typeof enabled !== 'boolean' || enabled === state.gardeners.autoSow) return null
      return {...state, gardeners:{...state.gardeners, autoSow:enabled}}
    }

    function workGardenerDuty(state, sceneId, id, now) {
      const slot = state.scenes[sceneId]
      const primary = GARDENER_BY_ID.get(id).role
      const duties = primary === 'harvest' ? ['harvest','greet'] : ['greet','harvest']
      const weather = weatherAt(now)
      function record(next, action, index) {
        const lastWork = {...next.gardeners.lastWork, [sceneId]:{id,action,at:now,index}}
        return {...next, gardeners:{...next.gardeners,lastWork}}
      }
      for (const action of duties) {
        if (action === 'harvest' && state.gardeners.storage.length >= gardenerStorageCapacity(state)) continue
        for (let index = 0; index < slot.unlocked; index++) {
          if (!slot.plots[index]) continue
          const changed = action === 'harvest'
            ? harvestAt(state,sceneId,index,now,weather,false,'storage')
            : greetVisitor(state,sceneId,index,now,weather)
          if (changed) return record(action === primary ? applyGardenerTrait(state,changed,id,sceneId,index) : changed, action, index)
        }
      }
      if (!state.gardeners.autoSow) return state
      const index = slot.plots.findIndex((plot, i) => i < slot.unlocked && plot === null)
      if (index < 0) return state
      const cheapest = SCENE_BY_ID.get(sceneId).species.map(key => SPECIES_BY_ID.get(key)).reduce((best, seed) => seed.cost < best.cost ? seed : best)
      const planted = plantAt(state,sceneId,index,cheapest.id)
      return planted ? record(planted,'sow',index) : state
    }

    // A returning worker performs one current duty; historical visitors never replay.
    function gardenerTick(state, now) {
      let next = state
      for (const [sceneId, id] of Object.entries(state.gardeners.assignments)) {
        if (now - next.gardeners.workedAt[sceneId] < gardenerInterval(next, id)) continue
        const team = next.gardeners
        next = {...next, gardeners:{...team, workedAt:{...team.workedAt, [sceneId]:now}}}
        next = workGardenerDuty(next,sceneId,id,now)
      }
      return next
    }

    const GARDENER_API = {GARDENER_DRAW_RIBBONS, GARDENER_TEN_RIBBONS, canRecruitGardeners, GARDENERS, GARDENER_DRAW_COST, GARDENER_TEN_COST, GARDENER_BONUS_POOL, GARDENER_STORAGE_CAP, GARDENER_STORAGE_MAX_LEVEL, gardenerStorageCapacity, gardenerStorageUpgradeCost, upgradeGardenerStorage, GARDENER_MAX_STARS, GARDENER_MAX_RANK,
      drawGardener, drawGardenerTen, dismantleGardener, dismantleGardenerShard, gardenerUpgradeCost, upgradeGardener, assignGardener, gardenerInterval, gardenerTraitChance, claimGardenerFlowers, setGardenerAutoSow, gardenerTick}
