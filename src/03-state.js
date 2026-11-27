    // ---------------------------------------------------------------------
    // §3 State model: plain JSON, pure transitions, exact time integration.
    // ---------------------------------------------------------------------
    function emptyScene(unlocked) {
      return {
        unlocked,
        plots: new Array(PLOT_COUNT).fill(null),
        sprinklerUntil: 0,
        soil: new Array(PLOT_COUNT).fill(100),
        last: new Array(PLOT_COUNT).fill(null),
      }
    }

    function emptyBag() {
      return { fertilizer: 0, compost: 0, sprinkler: 0, charm: 0 }
    }

    /** Soil fertility of one plot, 0–100; snapshots from before soil existed read as rich. */
    function soilOf(slot, index) {
      const value = slot === undefined || !Array.isArray(slot.soil) ? undefined : slot.soil[index]
      return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 100
    }

    function withSoil(slot, index, value, lastSpecies) {
      const soil = new Array(PLOT_COUNT).fill(100).map((_, at) => soilOf(slot, at))
      soil[index] = Math.max(0, Math.min(100, value))
      const last = new Array(PLOT_COUNT).fill(null).map((_, at) => (Array.isArray(slot.last) ? slot.last[at] ?? null : null))
      if (lastSpecies !== undefined) last[index] = lastSpecies
      return { soil, last }
    }

    /** Tired soil slows growth, down to `SOIL_FLOOR` of the normal pace. */
    function soilFactor(soil) {
      return SOIL_FLOOR + (1 - SOIL_FLOOR) * ((soil ?? 100) / 100)
    }

    function facilityLevel(state, id) {
      return Math.max(0, Math.min(FACILITY_MAX, Math.floor(state.facilities?.[id] ?? 0)))
    }

    function freshState(now) {
      const scenes = {}
      for (const scene of SCENES) scenes[scene.id] = emptyScene(scene.cost === 0 ? START_PLOTS : 0)
      return fillOrders({
        v: STATE_VERSION,
        coins: START_COINS,
        gardeners: sanitizeGardeners(null, scenes, now),
        ui: sanitizeUi(null),
        discoveries: [], discoverySeq: 0,
        xp: 0,
        harvested: 0,
        scene: 'meadow',
        scenes,
        basket: [],
        bag: emptyBag(),
        basketLevel: 0,
        charm: false,
        orders: [],
        seen: {},
        visitors: {},
        claimed: {},
        delivered: 0,
        pollinated: 0,
        planted: 0,
        ribbons: 0,
        ribbonsEarned: 0,
        facilities: {},
        glut: {},
        show: null,
        seeds: {},
        hybrids: {},
        exotics: {},
        specimens: {},
        commissions: { period: ecologyPeriod(now), accepted: {}, completed: [] }, patronage: 0, commissionLog: [],
        study: {}, ecology: { period: ecologyPeriod(now), grounds: ['meadow'], observed: [], visitors: [], claimed: [] }, researchSeals: 0, researchSpent: 0, research: sanitizeResearch(null), journal: [],
        daily: { claimedDay: -1, streak: 0 }, quests: null, giftBucket: -1, affinity: {}, arranged: 0, bouquetBest: 0, pedigree: {}, lineage: {}, goalsDone: {}, bouquets: [], cards: [], cardSeq: 0, expedition: null, trips: 0, vases: [], vaseTints: {}, shelf: { slots: 0, cards: [] }, workshop: { benches: 0, jobs: [] }, pagesDone: {}, contest: null, contestWins: 0, crafted: 0, legacy: 0, fund: 0, goods: { dried: 0, tea: 0, perfume: 0 }, goodsUsed: 0, scent: null, used: 0, wanted: null, wantedDone: 0, companions: [], events: 0, briefs: 0, eventBucket: -1, briefDay: -1, boost: null,
        seed: 20261116,
        orderSeq: 1,
        lastTick: now,
      })
    }

    function finiteOr(value, fallback) {
      return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback
    }

    function readPlots(raw, legacyPlots) {
      const source = Array.isArray(raw) ? raw : Array.isArray(legacyPlots) ? legacyPlots : []
      const plots = new Array(PLOT_COUNT).fill(null)
      for (let index = 0; index < PLOT_COUNT && index < source.length; index += 1) {
        const plot = source[index]
        if (plot === null || typeof plot !== 'object') continue
        const species = SPECIES_BY_ID.get(plot.species)
        if (species === undefined) continue
        plots[index] = {
          species: species.id,
          growthMs: Math.min(finiteOr(plot.growthMs, 0), growMsOf(species)),
          moisture: Math.min(finiteOr(plot.moisture, 0), 100),
          dried: plot.dried === true,
        }
        if (typeof plot.dna === 'number' && plot.dna > 0) plots[index].dna = Math.floor(plot.dna)
        if (typeof plot.tint === 'string' && SPECIES_BY_ID.has(plot.tint) && plot.tint !== species.id) plots[index].tint = plot.tint
        if (finiteOr(plot.fed, 0) > 0) plots[index].fed = Math.floor(plot.fed)
        if (finiteOr(plot.visits, 0) > 0) plots[index].visits = Math.floor(plot.visits)
        if (finiteOr(plot.guardianVisits,0)>0) plots[index].guardianVisits=Math.floor(plot.guardianVisits)
        plots[index].specialVisits = Object.fromEntries(Object.entries(sanitizeVisitors(plot.specialVisits)).filter(([id])=>VISITOR_BY_ID.get(id)?.special))
        if(plot.identified===true && ['base','alt','hidden'].includes(plot.variant)){
          plots[index].identified=true;plots[index].variant=plot.variant
          if(plot.variant!=='hidden' && TRAIT_BY_ID.has(plot.trait))plots[index].trait=plot.trait
          plots[index].traitChecks=Array.isArray(plot.traitChecks)?[...new Set(plot.traitChecks.filter(id=>TRAIT_BY_ID.has(id)))]:[]
        }
        if (plot.resident === true) {
          plots[index].resident = true
          plots[index].variant = ['base','alt','hidden'].includes(plot.variant) ? plot.variant : 'base'
          if (plots[index].variant !== 'hidden' && TRAIT_BY_ID.has(plot.trait)) plots[index].trait = plot.trait
          for (const field of ['retainedAt','observedAt','careCount','reblooms','studiedReblooms']) {
            if (Number.isFinite(plot[field]) && plot[field] >= 0) plots[index][field] = plot[field]
          }
        }
        if (plot.pollinated === true) plots[index].pollinated = true
        if (typeof plot.greeted === 'number' && Number.isFinite(plot.greeted)) plots[index].greeted = plot.greeted
      }
      return plots
    }

    function sanitizeBag(raw) {
      const bag = emptyBag()
      if (raw === null || typeof raw !== 'object') return bag
      for (const id of Object.keys(bag)) bag[id] = Math.floor(finiteOr(raw[id], 0))
      return bag
    }

    function sanitizeSeen(raw) {
      const seen = {}
      if (raw === null || typeof raw !== 'object') return seen
      for (const [key, count] of Object.entries(raw)) {
        const [speciesId, rawVariant] = key.split(':')
        // v2 stored a bare species id; those harvests were plain blooms.
        const variant = rawVariant === undefined ? 'base' : rawVariant
        if (!SPECIES_BY_ID.has(speciesId)) continue
        if (variant !== 'base' && variant !== 'alt' && variant !== 'hidden') continue
        seen[`${speciesId}:${variant}`] = Math.floor(finiteOr(count, 0))
      }
      return seen
    }

    function sanitizeVisitors(raw) {
      const visitors = {}
      if (raw === null || typeof raw !== 'object') return visitors
      for (const visitor of VISITORS) {
        const count = Math.floor(finiteOr(raw[visitor.id], 0))
        if (count > 0) visitors[visitor.id] = count
      }
      return visitors
    }

    /** Counters keyed by `a~b` or `a:b` where both halves must be known ids. */
    function sanitizeCounts(raw, separator, rightKnown) {
      const out = {}
      if (raw === null || typeof raw !== 'object') return out
      for (const [key, count] of Object.entries(raw)) {
        const [left, right] = key.split(separator)
        const value = Math.floor(finiteOr(count, 0))
        if (value > 0 && SPECIES_BY_ID.has(left) && rightKnown(right) && left !== right) out[key] = value
      }
      return out
    }

    /** Keep one real representative of each complete flower kind after it leaves the basket. */
    function sanitizeSpecimens(raw) {
      const result = {}
      if (raw === null || typeof raw !== 'object') return result
      for (const item of Object.values(raw)) {
        if (!item || !SPECIES_BY_ID.has(item.species) || !['base', 'alt', 'hidden'].includes(item.variant)) continue
        if (item.trait !== undefined && (!TRAIT_BY_ID.has(item.trait) || item.variant === 'hidden')) continue
        if (item.tint !== undefined && (!SPECIES_BY_ID.has(item.tint) || item.tint === item.species)) continue
        const bloom = { species: item.species, variant: item.variant, count: Math.max(1, Math.floor(finiteOr(item.count, 1))) }
        if (Number.isFinite(item.dna) && item.dna > 0) bloom.dna = Math.floor(item.dna)
        if (item.trait !== undefined) bloom.trait = item.trait
        if (item.tint !== undefined) bloom.tint = item.tint
        result[itemKey(bloom)] = bloom
      }
      return result
    }

    function sanitizeShow(raw) {
      if (raw === null || typeof raw !== 'object' || !Number.isFinite(raw.id)) return null
      return {
        id: raw.id,
        points: Math.floor(finiteOr(raw.points, 0)),
        entered: Math.floor(finiteOr(raw.entered, 0)),
        kinds: Array.isArray(raw.kinds) ? raw.kinds.filter(id => SPECIES_BY_ID.has(id)) : [],
      }
    }

    function sanitizeClaimed(raw) {
      const claimed = {}
      if (raw === null || typeof raw !== 'object') return claimed
      for (const entry of ACHIEVEMENTS) if (raw[entry.id] === true) claimed[entry.id] = true
      return claimed
    }

    /** Coerce a parsed snapshot into a usable garden, migrating v1/v2 on the way. */
    function sanitize(raw, now) {
      if (raw === null || typeof raw !== 'object') return freshState(now)
      const version = raw.v
      if (version !== 1 && version !== 2 && version !== 3 && version !== STATE_VERSION) return freshState(now)
      const legacy = version < STATE_VERSION
      const scenes = {}
      for (const scene of SCENES) {
        // v3 and v4 keep per-scene state; v1/v2 kept one flat garden.
        const stored = raw.scenes !== null && typeof raw.scenes === 'object' ? raw.scenes[scene.id] : undefined
        const source = stored !== undefined ? stored : version <= 2 && scene.cost === 0 ? raw : undefined
        if (source === undefined) {
          scenes[scene.id] = emptyScene(0)
          continue
        }
        // The free starting ground is always open; the others start closed.
        const open = Math.min(PLOT_COUNT, scene.cost === 0
          ? Math.max(START_PLOTS, finiteOr(source.unlocked, START_PLOTS))
          : finiteOr(source.unlocked, 0))
        scenes[scene.id] = {
          unlocked: open === 0 ? 0 : Math.max(START_PLOTS, open),
          plots: open === 0 ? emptyScene(0).plots : readPlots(source.plots),
          sprinklerUntil: finiteOr(source.sprinklerUntil, 0),
          soil: new Array(PLOT_COUNT).fill(100).map((_, index) => soilOf(source, index)),
          last: new Array(PLOT_COUNT).fill(null).map((_, index) => (Array.isArray(source.last) && scene.species.includes(source.last[index]) ? source.last[index] : null)),
        }
      }
      // An upgraded basket holds more, so the cap depends on the saved level.
      const basketLevel = basketUpgradeLevel(raw)
      const basket = []
      if (Array.isArray(raw.basket)) {
        for (const item of raw.basket.slice(0, basketCapacity({basketLevel}))) {
          const species = item === null || typeof item !== 'object' ? undefined : SPECIES_BY_ID.get(item.species)
          if (species === undefined) continue
          const variant = item.variant === 'alt' || item.variant === 'hidden' ? item.variant : 'base'
          const bloom = { species: species.id, variant }
          if (typeof item.dna === 'number' && item.dna > 0) bloom.dna = Math.floor(item.dna)
          if (variant !== 'hidden' && TRAIT_BY_ID.has(item.trait)) bloom.trait = item.trait
          if (typeof item.tint === 'string' && SPECIES_BY_ID.has(item.tint) && item.tint !== species.id) bloom.tint = item.tint
          basket.push(bloom)
        }
      }
      return fillOrders({
        v: STATE_VERSION,
        coins: finiteOr(raw.coins, START_COINS),
        gardeners: sanitizeGardeners(raw.gardeners, scenes, now),
        ui: sanitizeUi(raw.ui),
        discoveries: sanitizeDiscoveries(raw.discoveries), discoverySeq: Math.max(Math.floor(finiteOr(raw.discoverySeq,0)),...sanitizeDiscoveries(raw.discoveries).map(entry=>entry.id),0),
        xp: finiteOr(raw.xp, 0),
        harvested: finiteOr(raw.harvested, 0),
        scene: SCENE_BY_ID.has(raw.scene) ? raw.scene : 'meadow',
        scenes,
        basket,
        bag: sanitizeBag(raw.bag),
        basketLevel,
        charm: raw.charm === true,
        orders: Array.isArray(raw.orders) ? raw.orders.filter(validOrder).slice(0, ORDER_SLOTS) : [],
        seen: sanitizeSeen(raw.seen),
        visitors: sanitizeVisitors(raw.visitors),
        claimed: sanitizeClaimed(raw.claimed),
        delivered: Math.floor(finiteOr(raw.delivered, 0)),
        pollinated: Math.floor(finiteOr(raw.pollinated, 0)),
        planted: Math.floor(finiteOr(raw.planted, 0)),
        ribbons: Math.floor(finiteOr(raw.ribbons, 0)),
        ribbonsEarned: Math.floor(finiteOr(raw.ribbonsEarned, 0)),
        facilities: Object.fromEntries(FACILITIES.map(entry => [entry.id, Math.min(FACILITY_MAX, Math.floor(finiteOr(raw.facilities?.[entry.id], 0)))])),
        glut: Object.fromEntries(Object.entries(raw.glut !== null && typeof raw.glut === 'object' ? raw.glut : {})
          .filter(([id, entry]) => SPECIES_BY_ID.has(id) && entry !== null && typeof entry === 'object' && Number.isFinite(entry.n) && Number.isFinite(entry.at))
          .map(([id, entry]) => [id, { n: Math.max(0, Math.floor(entry.n)), at: Math.min(entry.at, now) }])),
        show: sanitizeShow(raw.show),
        seeds: sanitizeCounts(raw.seeds, '~', id => SPECIES_BY_ID.has(id)),
        hybrids: sanitizeCounts(raw.hybrids, '~', id => SPECIES_BY_ID.has(id)),
        exotics: sanitizeCounts(raw.exotics, ':', id => TRAIT_BY_ID.has(id)),
        specimens: sanitizeSpecimens(raw.specimens),
        commissions: sanitizeCommissions(raw.commissions,now), patronage: Math.floor(finiteOr(raw.patronage,0)), commissionLog: sanitizeCommissionLog(raw.commissionLog),
        study: sanitizeStudy(raw.study), ecology: sanitizeEcology(raw.ecology, now, scenes), researchSeals: Math.max(0, Math.floor(finiteOr(raw.researchSeals, 0))), researchSpent: Math.max(0, Math.floor(finiteOr(raw.researchSpent, 0))), research: sanitizeResearch(raw.research), journal: sanitizeJournal(raw.journal),
        ...sanitizePlay(raw, now), ...sanitizeCraft(raw), ...sanitizeKin(raw), ...sanitizeAlbum(raw, now), ...sanitizeEconomy(raw), ...sanitizeLongterm(raw, now), ...sanitizeFund(raw), ...sanitizeFun(raw, now), ...sanitizeFlowers(raw, now), ...sanitizeGoods(raw, now), ...sanitizeTints(raw),
        seed: Math.floor(finiteOr(raw.seed, 20261116)) || 20261116,
        orderSeq: Math.max(1, Math.floor(finiteOr(raw.orderSeq, 1))),
        lastTick: Math.min(finiteOr(raw.lastTick, now), now),
      })
    }

    /* ── save files ──────────────────────────────────────────────
     * The garden normally lives in this browser, which ties it to one origin and
     * one profile. A save file is a portable copy of that state so a player can
     * back it up or move to another browser; the envelope carries the versions
     * needed to refuse a file this build cannot read. Both helpers are pure so
     * the tests can exercise them without a DOM.
     */
    const SAVE_FORMAT = 'dsh-flower-garden'
    const SAVE_VERSION = 1
    const READABLE_STATE_VERSIONS = [1, 2, 3, STATE_VERSION]

    function exportSave(state, now) {
      return {
        format: SAVE_FORMAT,
        saveVersion: SAVE_VERSION,
        stateVersion: STATE_VERSION,
        exportedAt: new Date(now).toISOString(),
        garden: state,
      }
    }

    /** Returns a sanitized garden, or null when the payload is not a usable save. */
    function importSave(payload, now) {
      if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) return null
      const raw = payload.format === SAVE_FORMAT && payload.garden !== undefined ? payload.garden : payload.garden ?? payload
      if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null
      // Refuse anything sanitize would silently replace with a fresh garden, so a
      // bad file never wipes the save it was meant to restore.
      if (!READABLE_STATE_VERSIONS.includes(raw.v)) return null
      if (raw.v < STATE_VERSION) {
        // v1-v3 kept a flat garden, so only demand that the file looks like one.
        const recognisable = ['coins', 'lastTick', 'plots', 'scenes', 'basket'].some(field => raw[field] !== undefined)
        if (!recognisable) return null
      } else if (raw.scenes === null || typeof raw.scenes !== 'object') {
        return null
      }
      try {
        return sanitize(raw, now)
      } catch (error) {
        return null
      }
    }

/* ecology-engine.fragment.js
 * Paste inside the flower-garden factory after the existing pure game helpers.
 * It deliberately does not render or mutate the UI: the host owns commit(), copy,
 * and translation. The functions below return a new state or null for invalid input.
 */

// The host supplies ECO_PROFILES from its botany data. A missing profile is harmless.
const ECO_PERIOD_MS = 6 * 60 * 60 * 1000
const ECO_OBSERVE_MS = 10 * 60 * 1000
const ECO_ROLE_SET = new Set(['nectar', 'pollen', 'seed', 'shelter', 'water', 'night'])
const ECO_VISITOR_CAP = 0.12

function ecologyPlot(state, sceneId, index) {
  const slot = state?.scenes?.[sceneId]
  return slot === undefined ? null : slot.plots?.[index] ?? null
}

function ecologyMature(species, plot) {
  return species !== undefined && plot !== null && plot !== undefined
    && plot.growthMs >= growMsOf(species)
}

function ecologyEntry(state, speciesId) {
  const current = state.study?.[speciesId]
  return current && typeof current === 'object'
    ? current
    : { observations: 0, firstAt: 0, lastAt: 0 }
}

function ecologyPeriod(now) {
  return Math.floor(Math.max(0, now) / ECO_PERIOD_MS)
}

function ecologyState(state, now) {
  const period = ecologyPeriod(now)
  const old = state.ecology && state.ecology.period === period ? state.ecology : null
  const grounds = SCENES.filter(scene => (state.scenes?.[scene.id]?.unlocked ?? 0) > 0).map(scene => scene.id)
  return old ? { ...old, grounds: old.grounds ?? grounds } : { period, grounds, observed: [], visitors: [], claimed: [] }
}

// A living bloom keeps its identification; each new curiosity cause is tried once.
function revealBloom(state, sceneId, index, now, weather = weatherAt(now)) {
  const plot=state.scenes?.[sceneId]?.plots?.[index], species=SPECIES_BY_ID.get(plot?.species)
  if(!species || plot.resident || plot.growthMs<growMsOf(species))return state
  let cursor=state.seed, charm=state.charm, nextPlot={...plot}, changed=false
  const draw=()=>{const step=nextRandom(cursor);cursor=step.seed;return step.value}
  if(plot.identified!==true){
    const chance=Math.min(charm===true?CHARM_CAP:HIDDEN_CAP,hiddenChance(plot,weather,now,SCENE_BY_ID.get(sceneId))+(charm===true?CHARM_BONUS:0)+shelfBonus(state).spirit + studyBonus(state, plot.species) + boostBonus(state, now))
    nextPlot.variant=draw()<chance?'hidden':plot.tint?'base':plotVariant(species,index)
    nextPlot.identified=true;nextPlot.traitChecks=[];charm=false;changed=true
  }
  if(nextPlot.variant!=='hidden' && traitParts(nextPlot.trait).length<TRAIT_MAX){
    const checked=new Set(nextPlot.traitChecks??[])
    const boost=1+FACILITY_BY_ID.get('greenhouse').step*facilityLevel(state,'greenhouse')
    for(const id of traitCauses(nextPlot,sceneId,weather,now)){
      if(checked.has(id))continue
      checked.add(id);changed=true
      const have=traitParts(nextPlot.trait);if(have.length>=TRAIT_MAX)break;if(draw()<Math.min(0.9,TRAIT_BASE.get(id).chance*boost*TRAIT_EXTRA[have.length]))nextPlot.trait=joinTraits([...have,id])
    }
    nextPlot.traitChecks=[...checked]
  }
  if(!changed)return state
  const slot=state.scenes[sceneId],plots=slot.plots.slice();plots[index]=nextPlot
  return {...state,seed:cursor,charm,scenes:{...state.scenes,[sceneId]:{...slot,plots}}}
}
function revealGarden(state, now) {
  let next=state
  for(const scene of SCENES){const slot=next.scenes?.[scene.id];if(!slot)continue
    for(let index=0;index<slot.unlocked;index++)next=revealBloom(next,scene.id,index,now)
  }
  return next
}
function retainAt(state, sceneId, index, now) {
  const slot = state.scenes?.[sceneId]
  const plot = slot?.plots?.[index]
  const species = plot === null || plot === undefined ? undefined : SPECIES_BY_ID.get(plot.species)
  if (slot === undefined || index < 0 || index >= slot.unlocked || species === undefined || plot.resident === true || !ecologyMature(species, plot)) return null
  const scene = SCENE_BY_ID.get(sceneId)
  if (scene === undefined) return null
  const plain = plot.tint === undefined ? plotVariant(species, index) : 'base'
  const roll = nextRandom(state.seed)
  const hiddenBase = hiddenChance(plot, weatherAt(now), now, scene)
  const charmBonus = state.charm === true ? CHARM_BONUS : 0
  const chance = Math.min(state.charm === true ? CHARM_CAP : HIDDEN_CAP, hiddenBase + charmBonus + shelfBonus(state).spirit + studyBonus(state, plot.species) + boostBonus(state, now))
  const hidden = plot.identified ? plot.variant === 'hidden' : roll.value < chance
  let cursor = plot.identified ? state.seed : roll.seed
  const dna = Number.isFinite(plot.dna) && plot.dna > 0 ? plot.dna : 1 + Math.floor(hashUnit(state.seed, index, 12345) * 2147483646)
  const first = { species: species.id, variant: plot.identified ? plot.variant : hidden ? 'hidden' : plain, dna }
  if (plot.tint !== undefined) first.tint = plot.tint
  let trait = plot.identified ? plot.trait : undefined
  if (!hidden && !plot.identified) {
    const causes = traitCauses(plot, sceneId, weatherAt(now), now)
    for (const id of causes) {
      const step = nextRandom(cursor)
      cursor = step.seed
      const greenhouse = typeof facilityLevel === 'function' ? facilityLevel(state, 'greenhouse') : 0
      const boost = 1 + greenhouse * 0.1
      const have = traitParts(trait); if (step.value < Math.min(0.9, (TRAIT_BASE.get(id)?.chance ?? 0) * boost * TRAIT_EXTRA[have.length])) { trait = joinTraits([...have, id]); if (have.length + 1 >= TRAIT_MAX) break }
    }
  }
  if (trait !== undefined) first.trait = trait
  const key = itemKey(first)
  const seen = { ...(state.seen ?? {}) }
  if (!first.tint) seen[`${species.id}:${first.variant}`] = (seen[`${species.id}:${first.variant}`] ?? 0) + 1
  const specimens = { ...(state.specimens ?? {}) }
  const prior = specimens[key]
  specimens[key] = { ...(prior ?? first), count: (prior?.count ?? 0) + 1 }
  const plots = slot.plots.slice()
  plots[index] = { ...plot, dna, resident: true, variant: first.variant, trait, retainedAt: now }
  const hybrids = { ...(state.hybrids ?? {}) }
  if (first.tint !== undefined) hybrids[`${species.id}~${first.tint}`] = (hybrids[`${species.id}~${first.tint}`] ?? 0) + 1
  const exotics = { ...(state.exotics ?? {}) }
  for (const part of traitCountKeys(trait)) exotics[`${species.id}:${part}`] = (exotics[`${species.id}:${part}`] ?? 0) + 1
  return {
    ...state,
    seed: cursor,
    charm: plot.identified ? state.charm : false,
    seen,
    specimens,
    hybrids,
    exotics,
    scenes: { ...state.scenes, [sceneId]: { ...slot, plots } },
  }
}

function observeAt(state, sceneId, index, now) {
  const slot = state.scenes?.[sceneId]
  const plot = slot?.plots?.[index]
  const species = plot === null || plot === undefined ? undefined : SPECIES_BY_ID.get(plot.species)
  if (slot === undefined || index < 0 || index >= slot.unlocked || species === undefined || plot.resident !== true || plot.growthMs < growMsOf(species)
    || plot.moisture < 30 || (plot.observedAt !== undefined && now - plot.observedAt < ECO_OBSERVE_MS)) return null
  const study = { ...(state.study ?? {}) }
  const old = ecologyEntry(state, species.id)
  const reblooms = plot.reblooms ?? 0
  const extra = reblooms > (plot.studiedReblooms ?? 0) ? 2 : 1
  study[species.id] = { ...old, observations: old.observations + extra, firstAt: old.firstAt || now, lastAt: now }
  const ecology = ecologyState(state, now)
  const observed = ecology.observed.includes(species.id) ? ecology.observed : [...ecology.observed, species.id]
  const plots = slot.plots.slice()
  plots[index] = { ...plot, observedAt: now, studiedReblooms: reblooms, careCount: (plot.careCount ?? 0) + 1 }
  const fee = researchFee(state, species)
  if (state.coins < fee) return null
  return {
    ...state,
    coins: state.coins - fee,
    study,
    ecology: { ...ecology, observed },
    scenes: { ...state.scenes, [sceneId]: { ...slot, plots } },
  }
}

function rebloomAt(state, sceneId, index, now) {
  const slot = state.scenes?.[sceneId]
  const plot = slot?.plots?.[index]
  const species = plot === null || plot === undefined ? undefined : SPECIES_BY_ID.get(plot.species)
  if (slot === undefined || index < 0 || index >= slot.unlocked || species === undefined || plot.resident !== true || plot.growthMs < growMsOf(species)
    || plot.observedAt === undefined) return null
  const fee = researchFee(state, species, true)
  if (state.coins < fee) return null
  const plots = slot.plots.slice()
  plots[index] = {
    ...plot,
    growthMs: Math.floor(growMsOf(species) * 0.35), moisture: 100,
    pollinated: false, greeted: 0, visits: 0, fed: 0,
    reblooms: (plot.reblooms ?? 0) + 1,
  }
  const study = { ...(state.study ?? {}) }
  const entry = ecologyEntry(state, species.id)
  study[species.id] = { ...entry, reblooms: (entry.reblooms ?? 0) + 1 }
  return {
    ...state,
    coins: state.coins - fee,
    study,
    scenes: { ...state.scenes, [sceneId]: { ...slot, plots } },
  }
}

function ecoProfile(speciesId) {
  const profile = typeof ECO_PROFILES === 'undefined' ? undefined : ECO_PROFILES?.[speciesId]
  if (profile === undefined || !ECO_ROLE_SET.has(profile.role) || profile.season < 0 || profile.season > 3) return null
  return profile
}

function gardenEcology(state, now) {
  const residents = []
  for (const [sceneId, slot] of Object.entries(state.scenes ?? {})) {
    for (const plot of slot.plots ?? []) {
      if (plot?.resident === true && plot.moisture >= 30) {
        const species = SPECIES_BY_ID.get(plot.species)
        if (ecologyMature(species, plot)) residents.push({ sceneId, plot })
      }
    }
  }
  const roles = new Set(), species = new Set(), seasonal = new Set()
  const season = ecologyPeriod(now) % 4
  for (const resident of residents) {
    species.add(resident.plot.species)
    const profile = ecoProfile(resident.plot.species)
    if (profile === null) continue
    roles.add(profile.role)
    if (profile.season === season) seasonal.add(resident.plot.species)
  }
  return {
    residents: residents.length,
    species: species.size,
    roles: [...roles],
    roleCoverage: roles.size,
    seasonal: seasonal.size,
    visitorBonus: Math.min(ECO_VISITOR_CAP, roles.size * 0.02 + Math.min(0.04, seasonal.size * 0.005)) + researchLevel(state, 'ecology') * 0.02 + shelfBonus(state).visitor + scentBonus(state, now),
  }
}

function ecoProjects(state, now) {
  const period = ecologyPeriod(now)
  const unlocked = []
  for (const scene of SCENES) {
    if (!ecologyState(state, now).grounds.includes(scene.id)) continue
    for (const speciesId of scene.species) if (!unlocked.includes(speciesId)) unlocked.push(speciesId)
  }
  const projects = []
  for (let i = 0; i < 3; i += 1) {
    const count = 3 + i
    const needed = []
    let cursor = 0xEC0123 + period * 31 + i * 997
    while (needed.length < Math.min(count, unlocked.length)) {
      const draw = nextRandom(cursor); cursor = draw.seed
      const id = unlocked[Math.floor(draw.value * unlocked.length)]
      if (!needed.includes(id)) needed.push(id)
    }
    const hours = Array.from({length:6}, (_, hour) => period * ECO_PERIOD_MS + hour * 3600000)
    const visitorPool = VISITORS.filter(visitor => !visitor.special && visitor.scenes.some(id => ecologyState(state, now).grounds.includes(id))
      && hours.some(time => visitor.when === 'any' || (visitor.when === 'night') === isNight(time)))
      .map((visitor,index) => ({visitor,rank:hashUnit(period,index,i+901)})).sort((a,b) => a.rank-b.rank)
    const visitors = visitorPool.slice(0, Math.min(i + 1, visitorPool.length)).map(entry => entry.visitor.id)
    projects.push({ id: `eco-${period}-${i + 1}`, period, species: needed, visitors, coins: [100, 180, 260][i], ribbons: i, seals: i + 1 })
  }
  return projects
}

function submitStudy(state, projectId, now) {
  const project = ecoProjects(state, now).find(entry => entry.id === projectId)
  const ecology = ecologyState(state, now)
  if (project === undefined || ecology.claimed.includes(projectId) || project.species.some(id => !ecology.observed.includes(id))
    || project.visitors.some(id => !ecology.visitors.includes(id)) || state.coins < project.coins || (state.ribbons ?? 0) < project.ribbons) return null
  const claimed = [...ecology.claimed, projectId]
  const journal = Array.isArray(state.journal) ? state.journal.slice(-99) : []
  journal.push({ id: projectId, period: ecology.period, at: now, species: project.species.slice(), visitors: project.visitors.slice(), seals: project.seals })
  return { ...state, coins: state.coins - project.coins, ribbons: (state.ribbons ?? 0) - project.ribbons,
    researchSeals: (state.researchSeals ?? 0) + project.seals, journal, ecology: { ...ecology, claimed } }
}

function sanitizeEcology(raw, now, scenes) {
  const period = ecologyPeriod(now)
  const available = scenes ? SCENES.filter(scene => (scenes[scene.id]?.unlocked ?? 0) > 0).map(scene => scene.id) : ['meadow']
  const grounds = raw?.period === period && Array.isArray(raw.grounds) ? raw.grounds.filter(id => available.includes(id)) : available
  if (raw === null || typeof raw !== 'object' || raw.period !== period) return { period, grounds, observed: [], visitors: [], claimed: [] }
  return { period, grounds,
    observed: Array.isArray(raw.observed) ? raw.observed.filter(id => SPECIES_BY_ID.has(id)) : [],
    visitors: Array.isArray(raw.visitors) ? raw.visitors.filter(id => VISITOR_BY_ID.has(id)) : [],
    claimed: Array.isArray(raw.claimed) ? raw.claimed.filter(id => typeof id === 'string').slice(0, 3) : [] }
}

function sanitizeStudy(raw) {
  const study = {}
  if (raw === null || typeof raw !== 'object') return study
  for (const [id, entry] of Object.entries(raw)) if (SPECIES_BY_ID.has(id) && entry && typeof entry === 'object') {
    study[id] = { observations: Math.max(0, Math.floor(finiteOr(entry.observations, 0))), reblooms: Math.max(0, Math.floor(finiteOr(entry.reblooms, 0))), firstAt: finiteOr(entry.firstAt, 0), lastAt: finiteOr(entry.lastAt, 0) }
  }
  return study
}

function sanitizeJournal(raw) {
  if (!Array.isArray(raw)) return []
  return raw.filter(entry => entry && typeof entry === 'object' && typeof entry.id === 'string'
    && Number.isFinite(entry.period) && Number.isFinite(entry.at)
    && Array.isArray(entry.species) && Array.isArray(entry.visitors))
    .map(entry => ({ id: entry.id.slice(0, 80), period: Math.max(0, Math.floor(entry.period)), at: Math.max(0, entry.at),
      species: entry.species.filter(id => SPECIES_BY_ID.has(id)).slice(0, 10), visitors: entry.visitors.filter(id => VISITOR_BY_ID.has(id)).slice(0, 10), seals: Math.max(0, Math.floor(finiteOr(entry.seals, 0))) }))
    .slice(-100)
}

// Integration exports for the host's __game object.
const ECOLOGY_API = { ECO_PERIOD_MS, ECO_OBSERVE_MS, ecologyPeriod, ecologyState, retainAt, observeAt, rebloomAt, ecoProfile, gardenEcology, ecoProjects, submitStudy, sanitizeStudy, sanitizeEcology, sanitizeJournal }

    function validOrder(order) {
      if (order === null || typeof order !== 'object') return false
      if (!Array.isArray(order.items) || order.items.length === 0) return false
      if (typeof order.coins !== 'number' || typeof order.xp !== 'number') return false
      return order.items.every(item => item !== null && typeof item === 'object'
        && SPECIES_BY_ID.has(item.species) && Number.isFinite(item.count) && item.count > 0)
    }

    /**
     * Advance one planted plot by `ms` under one scene and weather segment.
     * @returns the same plot when nothing changes.
     */
    function advancePlot(plot, ms, weather, scene, sprinkled, soil) {
      const species = SPECIES_BY_ID.get(plot.species)
      if (species === undefined || ms <= 0) return plot
      const growMs = growMsOf(species)
      const factor = (scene !== undefined ? (scene.weather[weather] ?? 1) : weather === 'clear' ? 1.15 : 1) * soilFactor(soil)
      const wet = sprinkled === true || (scene !== undefined && scene.rainWets && weather === 'rain')
      const dryDuration = plot.resident ? 45 * 60 * 1000 : growMs * DRY_SHARE
      const moisture = wet ? 100 : Math.max(0, plot.moisture - ms * 100 / dryDuration)
      const wetMs = wet ? ms : Math.min(ms, (plot.moisture / 100) * dryDuration)
      const growthMs = Math.min(growMs, plot.growthMs + wetMs * factor)
      const dried = plot.dried === true || (moisture <= 0 && growthMs < growMs)
      if (growthMs === plot.growthMs && moisture === plot.moisture && dried === plot.dried) return plot
      return { ...plot, growthMs, moisture, dried }
    }

    /** Advance every plot in every scene, one weather segment at a time. */
    function advanceState(state, now) {
      let cursor = Math.max(state.lastTick, now - MAX_OFFLINE_MS)
      if (now <= cursor) return revealGarden(state, now)
      const nextScenes = { ...state.scenes }
      let scenesChanged = false
      while (cursor < now) {
        let segmentEnd = Math.min(now, weatherEndsAt(cursor))
        for (const scene of SCENES) {
          const until = nextScenes[scene.id]?.sprinklerUntil ?? 0
          if (until > cursor && until < segmentEnd) segmentEnd = until
        }
        const weather = weatherAt(cursor)
        const dt = segmentEnd - cursor
        for (const scene of SCENES) {
          const slot = nextScenes[scene.id]
          if (slot === undefined) continue
          const sprinkled = (slot.sprinklerUntil ?? 0) > cursor
          let plots = slot.plots
          let soil = slot.soil
          let changed = false
          for (let index = 0; index < plots.length; index += 1) {
            const plot = plots[index]
            if (plot === null) {
              // An empty, opened plot lies fallow and slowly recovers.
              const rich = soilOf(slot, index)
              if (index < slot.unlocked && rich < 100) {
                if (soil === slot.soil) soil = new Array(PLOT_COUNT).fill(100).map((_, at) => soilOf(slot, at))
                soil[index] = Math.min(100, rich + dt / SOIL_REST_MS)
                changed = true
              }
              continue
            }
            const advanced = advancePlot(plot, dt, weather, scene, sprinkled, soilOf(slot, index))
            if (advanced === plot) continue
            if (plots === slot.plots) plots = plots.slice()
            changed = true
            plots[index] = advanced
          }
          if (!changed) continue
          nextScenes[scene.id] = { ...slot, plots, soil }
          scenesChanged = true
        }
        cursor = segmentEnd
      }
      return gardenerTick(revealGarden(companionTick({ ...state, ...(scenesChanged ? { scenes: nextScenes } : {}), lastTick: now, ecology: ecologyState(state, now), quests: questState(state, now) }, now), now), now)
    }

    /**
     * Sow one plot. With `tintId` it sows a hybrid seed from the bag (free, it was
     * bred); otherwise a bought seed. Every plant draws its own genes, and the soil
     * answers the choice: the same crop again tires it, a different one rests it.
     */
    function plantAt(state, sceneId, index, speciesId, tintId) {
      const slot = state.scenes[sceneId]
      const scene = SCENE_BY_ID.get(sceneId)
      if (slot === undefined || scene === undefined) return null
      if (index < 0 || index >= slot.unlocked || slot.plots[index] !== null) return null
      if (!scene.species.includes(speciesId)) return null
      const species = SPECIES_BY_ID.get(speciesId)
      if (species === undefined) return null
      const seedKey = `${speciesId}~${tintId}`
      if (tintId !== undefined) {
        if (!SPECIES_BY_ID.has(tintId) || tintId === speciesId || (state.seeds?.[seedKey] ?? 0) <= 0) return null
      } else if (state.coins < species.cost) {
        return null
      }
      const planted = state.planted ?? 0
      const cross = tintId !== undefined ? state.lineage?.[seedKey]?.[0] : undefined
      const dna = cross ? breedDna(cross[0], cross[1], planted) : 1 + Math.floor(hashUnit(state.seed, planted, SCENES.indexOf(scene) * 8 + index) * 2147483646)
      const plots = slot.plots.slice()
      plots[index] = { species: species.id, growthMs: 0, moisture: 100, dried: false, dna }
      if (tintId !== undefined) plots[index].tint = tintId
      const before = Array.isArray(slot.last) ? slot.last[index] ?? null : null
      const shift = before === null ? 0 : before === species.id ? -SOIL_REPEAT : SOIL_ROTATE
      const next = {
        ...state,
        planted: planted + 1,
        coins: tintId !== undefined ? state.coins : state.coins - species.cost,
        scenes: { ...state.scenes, [sceneId]: { ...slot, plots, ...withSoil(slot, index, soilOf(slot, index) + shift) } },
      }
      if (tintId !== undefined) {
        const seeds = { ...state.seeds }
        if (seeds[seedKey] > 1) seeds[seedKey] -= 1
        else delete seeds[seedKey]
        next.seeds = seeds
        Object.assign(next, plantCross(state, seedKey, cross, dna, species.id, tintId))
      }
      return next
    }

    function waterAt(state, sceneId, index) {
      const slot = state.scenes[sceneId]
      const plot = slot === undefined ? undefined : slot.plots[index]
      if (plot === undefined || plot === null || plot.moisture >= 99.5) return null
      const plots = slot.plots.slice()
      plots[index] = { ...plot, moisture: 100 }
      return { ...state, scenes: { ...state.scenes, [sceneId]: { ...slot, plots } } }
    }

    /** Water every thirsty plot of one ground. */
    function waterAll(state, sceneId) {
      const slot = state.scenes[sceneId]
      if (slot === undefined) return null
      let changed = false
      const plots = slot.plots.map(plot => {
        if (plot === null || plot.moisture >= 99.5) return plot
        const species = SPECIES_BY_ID.get(plot.species)
        if (species === undefined || (plot.growthMs >= growMsOf(species) && !plot.resident)) return plot
        changed = true
        return { ...plot, moisture: 100 }
      })
      return changed ? { ...state, scenes: { ...state.scenes, [sceneId]: { ...slot, plots } } } : null
    }

    /**
     * Greet the visitor on an open flower: it leaves a tip and pollinates the
     * bloom, which then yields a second flower at harvest.
     */
    function greetVisitor(state, sceneId, index, now, weather) {
      const slot = state.scenes[sceneId]
      const plot = slot === undefined ? undefined : slot.plots[index]
      const visitor = visitorAt(sceneId, index, plot, now, weather, facilityLevel(state, 'hive'), gardenEcology(state, now).visitorBonus, state)
      if (visitor === null) return null
      const plots = slot.plots.slice()
      const role = VISITOR_INFO[visitor.id].role
      plots[index] = { ...plot, greeted: visitBucket(now), pollinated: plot.pollinated === true || role === 'pollinator',
        moisture: role === 'waterside' ? Math.min(100, plot.moisture + 20) : plot.moisture, visits: (plot.visits ?? 0) + 1,
        guardianVisits: (plot.guardianVisits ?? 0) + (role === 'guardian' ? 1 : 0),
        specialVisits: visitor.special ? { ...plot.specialVisits, [visitor.id]: (plot.specialVisits?.[visitor.id] ?? 0) + 1 } : (plot.specialVisits ?? {}) }
      const ecology = ecologyState(state, now)
      const visitors = ecology.visitors.includes(visitor.id) ? ecology.visitors : [...ecology.visitors, visitor.id]
      return addAffinity({
        ...state,
        coins: state.coins + visitor.tip + affinityLevel(state, visitor.id),
        visitors: { ...state.visitors, [visitor.id]: (state.visitors[visitor.id] ?? 0) + 1 },
        scenes: { ...state.scenes, [sceneId]: { ...slot, plots, ...(role === 'guardian' ? withSoil(slot, index, soilOf(slot,index)+6) : {}) } },
        ecology: { ...ecology, visitors },
      }, visitor.id, AFFINITY_GREET)
    }

    function unlockAt(state, sceneId, index) {
      const slot = state.scenes[sceneId]
      if (slot === undefined || index !== slot.unlocked || index >= PLOT_COUNT) return null
      const cost = UNLOCK_COSTS[index]
      if (cost === null || state.coins < cost) return null
      return {
        ...state,
        coins: state.coins - cost,
        scenes: { ...state.scenes, [sceneId]: { ...slot, unlocked: slot.unlocked + 1 } },
      }
    }

    function unlockScene(state, sceneId) {
      const scene = SCENE_BY_ID.get(sceneId)
      if (scene === undefined || scene.cost === 0) return null
      const slot = state.scenes[sceneId]
      if (slot === undefined || slot.unlocked > 0) return null
      if (state.coins < scene.cost) return null
      return {
        ...state,
        coins: state.coins - scene.cost,
        scene: sceneId,
        scenes: { ...state.scenes, [sceneId]: emptyScene(START_PLOTS) },
      }
    }

    function harvestAt(state, sceneId, index, now, weather, endResidency = false, destination = 'basket') {
      const scene = SCENE_BY_ID.get(sceneId)
      const slot = state.scenes[sceneId]
      const plot = slot === undefined ? undefined : slot.plots[index]
      if (scene === undefined || plot === undefined || plot === null || (plot.resident && !endResidency)) return null
      const species = SPECIES_BY_ID.get(plot.species)
      if (species === undefined || plot.growthMs < growMsOf(species)) return null
      const store = destination === 'storage'
      const room = store ? gardenerStorageCapacity(state) - state.gardeners.storage.length : basketCapacity(state) - state.basket.length
      if (room <= 0) return null
      const bonus = state.charm === true ? CHARM_BONUS : 0
      const chance = Math.min(state.charm === true ? CHARM_CAP : HIDDEN_CAP, hiddenChance(plot, weather, now, scene) + bonus + shelfBonus(state).spirit + studyBonus(state, plot.species) + boostBonus(state, now))
      const roll = nextRandom(state.seed)
      const hidden = (plot.resident || plot.identified) ? plot.variant === 'hidden' : roll.value < chance
      let cursor = (plot.resident || plot.identified) ? state.seed : roll.seed
      const draw = () => {
        const step = nextRandom(cursor)
        cursor = step.seed
        return step.value
      }
      const plain = plot.tint !== undefined ? 'base' : plotVariant(species, index)
      const variant = (plot.resident || plot.identified) ? plot.variant : hidden ? 'hidden' : plain
      // A curiosity needs a cause in the plant's life, and then some luck.
      let trait = (plot.resident || plot.identified) ? plot.trait : undefined
      if (!hidden && !plot.resident && !plot.identified) {
        const boost = 1 + FACILITY_BY_ID.get('greenhouse').step * facilityLevel(state, 'greenhouse')
        for (const id of traitCauses(plot, sceneId, weather, now)) {
          const have = traitParts(trait)
          if (draw() < Math.min(0.9, TRAIT_BASE.get(id).chance * boost * TRAIT_EXTRA[have.length])) {
            trait = joinTraits([...have, id])
            if (have.length + 1 >= TRAIT_MAX) break
          }
        }
      }
      const first = { species: species.id, variant }
      if (plot.dna !== undefined) first.dna = plot.dna
      if (trait !== undefined) first.trait = trait
      if (plot.tint !== undefined) first.tint = plot.tint
      const blooms = [first]
      // A pollinated flower sets a second bloom in the plot's own colour, room permitting.
      const doubled = plot.pollinated === true && room >= 2
      if (doubled) {
        const second = { species: species.id, variant: plain }
        if (plot.dna !== undefined) second.dna = 1 + ((plot.dna * 7919) % 2147483646)
        if (plot.tint !== undefined) second.tint = plot.tint
        blooms.push(second)
      }
      // Pollen from a different flower next door may set a hybrid seed.
      let seeds = state.seeds ?? {}
      const partner = plot.pollinated === true ? hybridPartner(slot, index) : null
      let bred = false
      let kin = {}
      if (partner !== null) {
        const chance = hybridChance(state)
        if (draw() < chance) {
          const key = `${species.id}~${partner}`
          seeds = { ...seeds, [key]: (seeds[key] ?? 0) + 1 }
          bred = true
          kin = recordCross(state, key, plot, partnerPlot(slot, index))
        }
      }
      const seen = { ...state.seen }
      const hybrids = { ...state.hybrids }
      const exotics = { ...state.exotics }
      const specimens = { ...state.specimens }
      for (const bloom of blooms) {
        const key = itemKey(bloom)
        const representative = specimens[key]
        specimens[key] = { ...(representative ?? bloom), count: (representative?.count ?? 0) + 1 }
        if (bloom.tint !== undefined) {
          const key = `${bloom.species}~${bloom.tint}`
          hybrids[key] = (hybrids[key] ?? 0) + 1
        } else {
          const key = `${bloom.species}:${bloom.variant}`
          seen[key] = (seen[key] ?? 0) + 1
        }
        for (const part of traitCountKeys(bloom.trait)) {
          const key = `${bloom.species}:${part}`
          exotics[key] = (exotics[key] ?? 0) + 1
        }
      }
      const plots = slot.plots.slice()
      plots[index] = null
      return {
        ...state,
        ...goalPatch(state, first),
        seed: cursor,
        charm: (plot.resident || plot.identified) ? state.charm : false,
        xp: state.xp + species.xp,
        harvested: state.harvested + blooms.length,
        pollinated: (state.pollinated ?? 0) + (doubled ? 1 : 0),
        scenes: { ...state.scenes, [sceneId]: { ...slot, plots, ...withSoil(slot, index, soilOf(slot, index) - SOIL_HARVEST, species.id) } },
        ...(store ? {gardeners:{...state.gardeners, storage:[...state.gardeners.storage, ...blooms]}} : {basket:[...state.basket, ...blooms]}),
        seen,
        hybrids,
        exotics,
        specimens,
        seeds,
        ...kin,
        lastBred: bred ? `${species.id}~${partner}` : null,
      }
    }

    /** What in this plant's life could have made it a curiosity, most demanding first. */
    function traitCauses(plot, sceneId, weather, now) {
      const causes = []
      if ((plot.visits ?? 0) >= 3 && (plot.fed ?? 0) >= 2) causes.push('fasciated')
      if (['snapdragon','cardinalflower','pansy'].includes(plot.species) && (plot.specialVisits?.bumblebee ?? 0) > 0) causes.push('radial')
      if (plot.pollinated && (plot.fed ?? 0) >= 1) causes.push('double')
      if ((plot.guardianVisits ?? 0) >= 2 && weather === 'rain') causes.push('leafy')
      if ((plot.visits ?? 0) >= 2) causes.push('twin')
      if ((plot.fed ?? 0) >= 2) causes.push('giant')
      const local = SCENE_TRAIT[sceneId]
      if (local !== undefined && local.weather === weather) causes.push(local.trait)
      const hour = new Date(now).getHours()
      if (hour >= 22 || hour < 5) causes.push('ink')
      if (plot.dried === true) causes.push('variegated')
      return causes
    }

    /** The species flowering next door, if it differs: the pollen parent of a hybrid. */
    function hybridPartner(slot, index) {
      const own = slot.plots[index]
      if (own === null || own === undefined) return null
      for (const at of [index - 1, index + 1]) {
        if (at < 0 || at >= slot.unlocked) continue
        const other = slot.plots[at]
        if (other === null || other === undefined || other.species === own.species) continue
        const species = SPECIES_BY_ID.get(other.species)
        if (species !== undefined && other.growthMs >= growMsOf(species)) return other.species
      }
      return null
    }

    /** One basket group: species, colour, curiosity and hybrid parent. */
    function itemKey(item) {
      return `${item.species}:${item.variant}${item.trait !== undefined ? `:${item.trait}` : ''}${item.tint !== undefined ? `~${item.tint}` : ''}`
    }

    /** List price of one bloom before the market has its say. */
    function itemValue(item) {
      const species = SPECIES_BY_ID.get(item.species)
      const tint = item.tint === undefined ? undefined : SPECIES_BY_ID.get(item.tint)
      const base = tint === undefined ? species.sell : ((species.sell + tint.sell) / 2) * HYBRID_PRICE
      return base * variantMultiplier(item.variant) * traitPrice(item.trait)
    }

    /** How many price steps a species is down right now; it climbs back one step at a time. */
    function glutSteps(state, speciesId, now) {
      const entry = state.glut?.[speciesId]
      if (entry === undefined || now === undefined) return 0
      return Math.max(0, entry.n - Math.floor(Math.max(0, now - entry.at) / GLUT_RECOVER_MS))
    }

    function glutFactor(steps) {
      return Math.max(GLUT_FLOOR, 1 - GLUT_STEP * steps)
    }

    /**
     * Price a batch sold one bloom after another. With a clock the market
     * favourite pays its bonus and every sale pushes that species' price down a step.
     */
    function quoteSale(state, items, now) {
      const featured = featuredSpecies(state, now)
      const steps = new Map()
      const saleBonus = shelfBonus(state).sale
      let coins = 0
      for (const item of items) {
        const down = steps.get(item.species) ?? glutSteps(state, item.species, now)
        coins += Math.round((1 + saleBonus) * itemValue(item) * (item.species === featured ? MARKET_BONUS : 1) * glutFactor(down))
        steps.set(item.species, now === undefined ? 0 : down + 1)
      }
      return { coins, steps }
    }

    // Settle the quoted inventory and glut together, preserving the other container.
    function settleFlowerSale(state, source, remaining, quote, now) {
      const next = {...state, coins:state.coins + quote.coins}
      if (source === 'storage') next.gardeners = {...state.gardeners, storage:remaining}
      else next.basket = remaining
      if (now !== undefined) {
        next.glut = {...state.glut}
        for (const [id, down] of quote.steps) next.glut[id] = {n:Math.min(down, 14), at:now}
      }
      return next
    }

    function sellWhere(state, match, now) {
      const selling = state.basket.filter(match)
      if (!selling.length) return null
      return settleFlowerSale(state, 'basket', state.basket.filter((flower,index) => !match(flower,index)), quoteSale(state,selling,now), now)
    }

    function sellIndividual(state, index, now) {
      if (!Number.isInteger(index) || index < 0 || index >= state.basket.length) return null
      return sellWhere(state, (_, at) => at === index, now)
    }

    // Keep the order of the source inventory: successive blooms share a species' market glut.
    function quoteFlowerBatch(state, source, keys, now) {
      const inventory = source === 'basket' ? state.basket : source === 'storage' ? state.gardeners?.storage : null
      if (!Array.isArray(inventory) || !Array.isArray(keys) || !keys.length || keys.length > inventory.length || !Number.isFinite(now)) return null
      const selected = new Set(keys)
      if (selected.size !== keys.length) return null
      const selling = inventory.filter(item => selected.has(itemKey(item)))
      if (new Set(selling.map(itemKey)).size !== selected.size) return null
      const quote = quoteSale(state, selling, now)
      // Use the full ordered list of selected identities, independent of object references after reload.
      const fingerprint = JSON.stringify([source, selling.map(item => [itemKey(item), item.dna ?? null]), quote.coins])
      return {source, keys:[...selected], count:selling.length, coins:quote.coins, fingerprint}
    }

    function sellFlowerBatch(state, offer, now) {
      if (!offer) return null
      const current = quoteFlowerBatch(state, offer.source, offer.keys, now)
      if (!current || current.fingerprint !== offer.fingerprint || current.coins !== offer.coins || current.count !== offer.count) return null
      const inventory = offer.source === 'basket' ? state.basket : state.gardeners.storage
      const selected = new Set(current.keys)
      const remaining = [], selling = []
      for (const item of inventory) (selected.has(itemKey(item)) ? selling : remaining).push(item)
      return settleFlowerSale(state, offer.source, remaining, quoteSale(state,selling,now), now)
    }

    function sellKind(state, key, now) {
      return sellWhere(state, item => itemKey(item) === key, now)
    }

    /**
     * Sell the blooms of one species (and variant), or the whole basket. With a
     * clock, today's market favourite sells at the market bonus.
     */
    function sellBasket(state, speciesId, variant, now) {
      return sellWhere(state, item => speciesId === undefined
        || (item.species === speciesId && (variant === undefined || item.variant === variant)), now)
    }

    function basketValue(state, now) {
      return quoteSale(state, state.basket, now).coins
    }

    function basketCount(state, speciesId) {
      return state.basket.filter(item => item.species === speciesId).length
    }

    /** Blooms a bouquet may use: gold ones are kept for selling. */
    function basketPlainCount(state, speciesId) {
      return state.basket.filter(item => item.species === speciesId && isPlainBloom(item)).length
    }

    /** Bouquets take ordinary blooms; spirits, curiosities and hybrids are for the counter and the show. */
    function isPlainBloom(item) {
      return item.variant !== 'hidden' && item.trait === undefined && item.tint === undefined
    }

    function nextRandom(seed) {
      const next = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return { seed: next, value: next / 4294967296 }
    }

    /** Species the player can plant right now: every flower of an opened ground. */
    function availableSpecies(state) {
          const open = new Set()
          for (const scene of SCENES) {
            const slot = state.scenes[scene.id]
            if (slot !== undefined && slot.unlocked > 0) for (const id of scene.species) open.add(id)
          }
          return SPECIES.filter(species => open.has(species.id))
    }

    /** Build one bouquet order for the current level, threading the RNG seed. */
    function makeOrder(seed, level, seq, allowed) {
      let cursor = seed
      const draw = () => {
        const step = nextRandom(cursor)
        cursor = step.seed
        return step.value
      }
      const budget = 4 + level * 10
      const source = allowed !== undefined && allowed.length > 0 ? allowed : SPECIES
      const cheap = source.filter(species => species.cost <= budget)
      const pool = cheap.length > 0 ? cheap : source
      const kinds = pool.length > 1 && draw() > 0.45 ? 2 : 1
      const items = []
      for (let index = 0; index < kinds; index += 1) {
        const species = pool[Math.floor(draw() * pool.length) % pool.length]
        if (items.some(item => item.species === species.id)) continue
        items.push({ species: species.id, count: 1 + Math.floor(draw() * 2) })
      }
      const total = items.reduce((sum, item) => sum + item.count * SPECIES_BY_ID.get(item.species).sell, 0)
      const blooms = items.reduce((sum, item) => sum + item.count, 0)
      return {
        seed: cursor,
        order: { id: seq, items, coins: Math.round(total * 1.75) + 3, xp: blooms * 2 + 2 },
      }
    }

    function fillOrders(state) {
      let seed = state.seed
      let seq = state.orderSeq
      const orders = state.orders.slice()
      const allowed = availableSpecies(state)
      while (orders.length < ORDER_SLOTS) {
        const built = makeOrder(seed, levelOf(state.xp), seq, allowed)
        seed = built.seed
        orders.push(built.order)
        seq += 1
      }
      return { ...state, orders, seed, orderSeq: seq }
    }

    function orderReady(state, order) {
      return order.items.every(item => basketPlainCount(state, item.species) >= item.count)
    }

    /** True when only gold blooms would satisfy the order — worth telling the player. */
    function orderNeedsGold(state, order) {
      if (orderReady(state, order)) return false
      return order.items.every(item => basketCount(state, item.species) >= item.count)
    }

    function deliverOrder(state, orderId) {
      const index = state.orders.findIndex(order => order.id === orderId)
      if (index === -1) return null
      const order = state.orders[index]
      if (!orderReady(state, order)) return null
      const basket = state.basket.slice()
      // Gold blooms never pay for a bouquet; they are worth triple at the counter.
      for (const item of order.items) {
        let remaining = item.count
        for (let cursor = basket.length - 1; cursor >= 0 && remaining > 0; cursor -= 1) {
          if (basket[cursor].species !== item.species || !isPlainBloom(basket[cursor])) continue
          basket.splice(cursor, 1)
          remaining -= 1
        }
      }
      const next = {
        ...state,
        coins: state.coins + order.coins,
        xp: state.xp + order.xp,
        delivered: (state.delivered ?? 0) + 1,
        basket,
        orders: state.orders.filter(entry => entry.id !== orderId),
      }
      return fillOrders(next)
    }

    /** The counter an achievement watches. */
    function achievementValue(state, metric) {
      const grown = speciesId => ['base', 'alt', 'hidden'].some(variant => (state.seen[`${speciesId}:${variant}`] ?? 0) > 0)
      switch (metric) {
        case 'harvested': return state.harvested
        case 'delivered': return state.delivered ?? 0
        case 'pollinated': return state.pollinated ?? 0
        case 'visitorKinds': return Object.keys(state.visitors ?? {}).length
        case 'spiritKinds': return SPECIES.filter(species => (state.seen[`${species.id}:hidden`] ?? 0) > 0).length
        case 'meadowKinds': return SCENES[0].species.filter(grown).length
        case 'grounds': return SCENES.filter(scene => (state.scenes[scene.id]?.unlocked ?? 0) > 0).length
        case 'hybridKinds': return Object.keys(state.hybrids ?? {}).length
        case 'traitKinds': return new Set(Object.keys(state.exotics ?? {}).flatMap(key => traitParts(key.split(':')[1]))).size
        case 'ribbonsEarned': return state.ribbonsEarned ?? 0
        case 'entries': return CODEX_ENTRIES.filter(entry => (state.seen[`${entry.species}:${entry.variant}`] ?? 0) > 0).length
        case 'arranged': case 'trips': case 'crafted': case 'contestWins': case 'fund': return state[metric] ?? 0
        case 'bondsMax': return VISITORS.filter(visitor => affinityLevel(state, visitor.id) >= AFFINITY_LEVELS.length).length
        case 'goalsDone': return Object.keys(state.goalsDone ?? {}).length
        case 'cards': return (state.cards ?? []).length
        default: return 0
      }
    }

    function achievementReady(state, entry) {
      return state.claimed?.[entry.id] !== true && achievementValue(state, entry.metric) >= entry.target
    }

    /** Collect the coins of a finished achievement, once. */
    function claimAchievement(state, achievementId) {
      const entry = ACHIEVEMENT_BY_ID.get(achievementId)
      if (entry === undefined || !achievementReady(state, entry)) return null
      return { ...state, coins: state.coins + entry.coins, claimed: { ...state.claimed, [entry.id]: true } }
    }

    /** Buy one shop good: consumables stack in the bag, the basket upgrade levels up. */
    function buyItem(state, itemId) {
      const item = ITEM_BY_ID.get(itemId)
      if (item === undefined || state.coins < item.price) return null
      if (item.kind === 'upgrade') {
        const cost = basketUpgradeCost(state)
        if (cost === null) return null
        return { ...state, coins: state.coins - cost, basketLevel: basketUpgradeLevel(state) + 1 }
      }
      return {
        ...state,
        coins: state.coins - item.price,
        bag: { ...state.bag, [itemId]: (state.bag[itemId] ?? 0) + 1 },
      }
    }

    /** Spend one sprinkler on a ground: it waters every plot there for half an hour. */
    function useSprinkler(state, sceneId, now) {
      const slot = state.scenes[sceneId]
      if (slot === undefined || slot.unlocked <= 0) return null
      if ((state.bag.sprinkler ?? 0) <= 0) return null
      const until = Math.max(now, slot.sprinklerUntil ?? 0) + SPRINKLER_MS
      return {
        ...state,
        bag: { ...state.bag, sprinkler: state.bag.sprinkler - 1 },
        scenes: { ...state.scenes, [sceneId]: { ...slot, sprinklerUntil: until } },
      }
    }

    /** Dig one compost into a plot, planted or not. */
    function compostAt(state, sceneId, index) {
      const slot = state.scenes[sceneId]
      if (slot === undefined || index < 0 || index >= slot.unlocked) return null
      if ((state.bag.compost ?? 0) <= 0 || soilOf(slot, index) >= 99.5) return null
      return {
        ...state,
        bag: { ...state.bag, compost: state.bag.compost - 1 },
        scenes: { ...state.scenes, [sceneId]: { ...slot, ...withSoil(slot, index, soilOf(slot, index) + COMPOST_GAIN) } },
      }
    }

    /** What the next level of a facility costs: coins grow geometrically, ribbons by one a level. */
    function facilityCost(id, level) {
      const entry = FACILITY_BY_ID.get(id)
      if (entry === undefined || level >= FACILITY_MAX) return null
      return { coins: Math.round((entry.base * Math.pow(FACILITY_GROWTH, level)) / 10) * 10, ribbons: level }
    }

    function upgradeFacility(state, id) {
      const level = facilityLevel(state, id)
      const cost = facilityCost(id, level)
      if (cost === null || state.coins < cost.coins || (state.ribbons ?? 0) < cost.ribbons) return null
      return {
        ...state,
        coins: state.coins - cost.coins,
        ribbons: (state.ribbons ?? 0) - cost.ribbons,
        facilities: { ...state.facilities, [id]: level + 1 },
      }
    }

    /** True for reds, pinks, oranges and yellows; whites, blues and purples are cool. */
    function isWarm(color) {
      const value = parseInt(color.slice(1), 16)
      const r = (value >> 16) & 255
      const g = (value >> 8) & 255
      const b = value & 255
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      if (max - min < 26) return false
      const hue = max === r ? ((g - b) / (max - min) + 6) % 6 : max === g ? (b - r) / (max - min) + 2 : (r - g) / (max - min) + 4
      return hue < 1.2 || hue > 5.4
    }

    /** The show running at `now`: a season, a theme, and a closing time. */
    function showAt(state, now) {
      const id = Math.floor(now / SHOW_MS)
      const season = SEASONS[((id % 4) + 4) % 4]
      const sceneId = SEASON_SCENE[season]
      let theme = SHOW_THEMES[Math.floor(hashUnit(id, 5, 11) * SHOW_THEMES.length)]
      // A ground the player has not opened cannot be the theme.
      if (theme === 'ground' && (state.scenes[sceneId]?.unlocked ?? 0) <= 0) theme = hashUnit(id, 6, 11) < 0.5 ? 'warm' : 'cool'
      return { id, season, theme, sceneId, endsAt: (id + 1) * SHOW_MS }
    }

    /** This show's entry sheet; a sheet from an earlier show is void. */
    function showEntry(state, now) {
      const id = Math.floor(now / SHOW_MS)
      return state.show !== null && state.show !== undefined && state.show.id === id
        ? state.show
        : { id, points: 0, entered: 0, kinds: [] }
    }

    function showAccepts(show, item) {
      const rare = item.variant === 'hidden' || item.trait !== undefined || item.tint !== undefined
      if (show.theme === 'rare') return rare
      if (item.variant === 'hidden') return true
      if (show.theme === 'ground') return SCENE_ID_OF.get(item.species) === show.sceneId
      const species = SPECIES_BY_ID.get(item.species)
      const warm = isWarm(paletteOf(species, item.variant, item.tint).petal)
      return show.theme === 'warm' ? warm : !warm
    }

    /** Judges reward rarity and variety: a species new to this show scores two more. */
    function showPoints(item, entry) {
      return 1
        + (item.variant === 'alt' ? 1 : 0)
        + (item.tint !== undefined ? 2 : 0)
        + (item.trait !== undefined ? 2 + traitParts(item.trait).length : 0)
        + (item.variant === 'hidden' ? 4 : 0)
        + (entry.kinds.includes(item.species) ? 0 : 2)
    }

    /** Give one bloom of a basket group to the show. It earns points, never coins. */
    function exhibit(state, key, now, individualIndex) {
      const show = showAt(state, now)
      const entry = showEntry(state, now)
      if (entry.entered >= SHOW_SLOTS) return null
      let at = -1
      if (individualIndex !== undefined) {
        if (!Number.isInteger(individualIndex) || !state.basket[individualIndex] || itemKey(state.basket[individualIndex]) !== key) return null
        at = individualIndex
      } else {
        for (let index = state.basket.length - 1; index >= 0; index -= 1) {
          if (itemKey(state.basket[index]) === key) { at = index; break }
        }
      }
      if (at === -1 || !showAccepts(show, state.basket[at])) return null
      const item = state.basket[at]
      const points = entry.points + showPoints(item, entry)
      const won = SHOW_TIERS.filter(tier => entry.points < tier.points && points >= tier.points)
        .reduce((sum, tier) => sum + tier.ribbons, 0)
      return {
        ...state,
        basket: state.basket.filter((_, index) => index !== at),
        ribbons: (state.ribbons ?? 0) + won,
        ribbonsEarned: (state.ribbonsEarned ?? 0) + won,
        show: {
          id: show.id,
          points,
          entered: entry.entered + 1,
          kinds: entry.kinds.includes(item.species) ? entry.kinds : [...entry.kinds, item.species],
        },
      }
    }

    /** Arm one charm for the next harvest. */
    function useCharm(state) {
      if ((state.bag.charm ?? 0) <= 0 || state.charm === true) return null
      return { ...state, bag: { ...state.bag, charm: state.bag.charm - 1 }, charm: true }
    }

    /** Feed one plant: a quarter of its growth time, instantly. */
    function fertilizeAt(state, sceneId, index) {
      const slot = state.scenes[sceneId]
      const plot = slot === undefined ? undefined : slot.plots[index]
      if (plot === undefined || plot === null) return null
      if ((state.bag.fertilizer ?? 0) <= 0) return null
      const species = SPECIES_BY_ID.get(plot.species)
      if (species === undefined) return null
      const growMs = growMsOf(species)
      if (plot.growthMs >= growMs) return null
      const plots = slot.plots.slice()
      plots[index] = { ...plot, growthMs: Math.min(growMs, plot.growthMs + growMs * 0.25), fed: (plot.fed ?? 0) + 1 }
      return {
        ...state,
        bag: { ...state.bag, fertilizer: state.bag.fertilizer - 1 },
        scenes: { ...state.scenes, [sceneId]: { ...slot, plots } },
      }
    }

    function levelOf(xp) {
      return Math.floor(xp / XP_PER_LEVEL) + 1
    }

    function stageOf(plot) {
      const species = SPECIES_BY_ID.get(plot.species)
      if (species === undefined) return 'seed'
      const ratio = plot.growthMs / growMsOf(species)
      if (ratio >= 1) return 'bloom'
      if (ratio >= 0.55) return 'bud'
      if (ratio >= 0.25) return 'sprout'
      return 'seed'
    }

    /** Short form for dense rows: "45s", "3m". */
    function shortDuration(ms, t) {
      const seconds = Math.round(ms / 1000)
      return seconds < 60
        ? t('time.shortSeconds', { n: seconds })
        : t('time.shortMinutes', { n: Math.round(seconds / 60) })
    }

    function formatDuration(ms, t) {
      const seconds = Math.max(0, Math.ceil(ms / 1000))
      if (seconds < 60) return t('time.seconds', { n: seconds })
      const minutes = Math.ceil(seconds / 60)
      if (minutes < 60) return t('time.minutes', { n: minutes })
      return t('time.hours', { n: Math.round(minutes / 6) / 10 })
    }

