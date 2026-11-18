
    // ---------------------------------------------------------------------
    // §3x Genes, lineage and breeding goals. A plant's genes are read from the
    //     same DNA hashes the drawing uses, so what the bars say is what you see.
    // ---------------------------------------------------------------------
    const GENES = [{ id: 'light', slot: 1 }, { id: 'warm', slot: 2 }, { id: 'height', slot: 5 }, { id: 'width', slot: 6 }]
    const BREED_CANDIDATES = 1500
    const PEDIGREE_CAP = 400
    const BREED_GOALS = [
      { id: 'tall', need: { height: [5, 5] }, reward: { coins: 80 } },
      { id: 'petite', need: { height: [1, 1], width: [1, 1] }, reward: { coins: 120 } },
      { id: 'lush', need: { height: [4, 5], width: [5, 5] }, reward: { coins: 150 } },
      { id: 'moon', need: { light: [5, 5], warm: [1, 2] }, reward: { coins: 150 } },
      { id: 'sunset', need: { light: [1, 2], warm: [5, 5] }, reward: { coins: 150 } },
      { id: 'dynasty', gen: 3, need: {}, reward: { coins: 200, bag: { fertilizer: 2 } } },
      { id: 'champion', need: { light: [4, 5], warm: [4, 5], height: [4, 5], width: [4, 5] }, reward: { coins: 400, bag: { charm: 1 } } },
    ]

    function geneValues(dna) {
      return GENES.map(gene => hashUnit(dna, gene.slot, 9))
    }

    function gradeOf(value) {
      return Math.min(5, Math.floor(value * 5) + 1)
    }

    /** Four visible genes, each graded 1–5. */
    function genesOf(dna) {
      const values = geneValues(dna)
      return Object.fromEntries(GENES.map((gene, index) => [gene.id, gradeOf(values[index])]))
    }

    /**
     * DNA for the child of two plants. Each gene aims somewhere between the
     * parents, plus a small mutation; the DNA whose genes land closest wins.
     */
    function breedDna(motherDna, fatherDna, salt) {
      const a = geneValues(motherDna), b = geneValues(fatherDna)
      const target = a.map((value, index) => {
        const blend = value + (b[index] - value) * hashUnit(motherDna, fatherDna, salt * 8 + index)
        const drift = (hashUnit(fatherDna, motherDna, salt * 8 + index + 4) - 0.5) * 0.16
        return Math.max(0, Math.min(0.999, blend + drift))
      })
      let best = 1
      let bestGap = Infinity
      for (let k = 0; k < BREED_CANDIDATES; k += 1) {
        const dna = 1 + Math.floor(hashUnit(motherDna ^ Math.imul(k + 1, 0x9e3779b1), fatherDna, salt + k) * 2147483646)
        const values = geneValues(dna)
        let gap = 0
        for (let index = 0; index < values.length; index += 1) gap += (values[index] - target[index]) ** 2
        if (gap < bestGap) { best = dna; bestGap = gap }
      }
      return best
    }

    /** The grades a cross is likely to give: between the two parents. */
    function predictGenes(motherDna, fatherDna) {
      const a = genesOf(motherDna), b = genesOf(fatherDna)
      return Object.fromEntries(GENES.map(gene => [gene.id, [Math.min(a[gene.id], b[gene.id]), Math.max(a[gene.id], b[gene.id])]]))
    }

    /** The open flower next door that a pollinated plant would cross with. */
    function partnerPlot(slot, index) {
      const own = slot?.plots?.[index]
      if (own === null || own === undefined) return null
      for (const at of [index - 1, index + 1]) {
        if (at < 0 || at >= slot.unlocked) continue
        const other = slot.plots[at]
        if (other === null || other === undefined || other.species === own.species) continue
        const species = SPECIES_BY_ID.get(other.species)
        if (species !== undefined && other.growthMs >= growMsOf(species)) return other
      }
      return null
    }

    function capPedigree(pedigree) {
      const keys = Object.keys(pedigree)
      if (keys.length <= PEDIGREE_CAP) return pedigree
      const keep = keys.sort((x, y) => (pedigree[y].at ?? 0) - (pedigree[x].at ?? 0)).slice(0, PEDIGREE_CAP)
      return Object.fromEntries(keep.map(key => [key, pedigree[key]]))
    }

    function kinEntry(state, plot) {
      const known = state.pedigree?.[plot.dna]
      if (known !== undefined) return known
      const entry = { s: plot.species, g: 0, at: state.planted ?? 0 }
      if (plot.tint !== undefined) entry.t = plot.tint
      return entry
    }

    /** A hybrid seed was set: remember which two plants made it. */
    function recordCross(state, seedKey, mother, father) {
      if (!(mother?.dna > 0) || !(father?.dna > 0)) return {}
      return {
        pedigree: capPedigree({ ...state.pedigree, [mother.dna]: kinEntry(state, mother), [father.dna]: kinEntry(state, father) }),
        lineage: { ...state.lineage, [seedKey]: [...(state.lineage?.[seedKey] ?? []), [mother.dna, father.dna]].slice(-20) },
      }
    }

    /** A recorded seed was sown: use up its record and enter the child in the family tree. */
    function plantCross(state, seedKey, cross, dna, speciesId, tintId) {
      if (!cross) return {}
      const lineage = { ...state.lineage }
      const rest = (lineage[seedKey] ?? []).slice(1)
      if (rest.length > 0) lineage[seedKey] = rest
      else delete lineage[seedKey]
      const g = 1 + Math.max(state.pedigree?.[cross[0]]?.g ?? 0, state.pedigree?.[cross[1]]?.g ?? 0)
      return { lineage, pedigree: capPedigree({ ...state.pedigree, [dna]: { s: speciesId, t: tintId, m: cross[0], f: cross[1], g, at: state.planted ?? 0 } }) }
    }

    function goalMet(state, goal, dna) {
      const entry = state.pedigree?.[dna]
      if (entry === undefined || !(entry.g >= 1) || entry.g < (goal.gen ?? 1)) return false
      const genes = genesOf(dna)
      return Object.entries(goal.need).every(([id, [lo, hi]]) => genes[id] >= lo && genes[id] <= hi)
    }

    /** Breeding goals a harvested bloom finishes, paid on the spot; {} when there are none. */
    function goalPatch(state, bloom) {
      if (!(bloom?.dna > 0)) return {}
      const won = BREED_GOALS.filter(goal => state.goalsDone?.[goal.id] !== true && goalMet(state, goal, bloom.dna))
      if (won.length === 0) return {}
      let paid = state
      for (const goal of won) paid = applyReward(paid, goal.reward)
      return { coins: paid.coins, bag: paid.bag, goalsDone: { ...state.goalsDone, ...Object.fromEntries(won.map(goal => [goal.id, true])) } }
    }

    function sanitizeKin(raw) {
      const whole = value => Number.isFinite(value) && value > 0
      const pedigree = {}
      if (raw.pedigree !== null && typeof raw.pedigree === 'object') {
        for (const [key, entry] of Object.entries(raw.pedigree)) {
          const dna = Number(key)
          if (!whole(dna) || entry === null || typeof entry !== 'object' || !SPECIES_BY_ID.has(entry.s)) continue
          const clean = { s: entry.s, g: Math.min(99, Math.floor(finiteOr(entry.g, 0))), at: Math.floor(finiteOr(entry.at, 0)) }
          if (SPECIES_BY_ID.has(entry.t) && entry.t !== entry.s) clean.t = entry.t
          if (whole(entry.m) && whole(entry.f)) { clean.m = Math.floor(entry.m); clean.f = Math.floor(entry.f) }
          pedigree[Math.floor(dna)] = clean
        }
      }
      const lineage = {}
      if (raw.lineage !== null && typeof raw.lineage === 'object') {
        for (const [key, list] of Object.entries(raw.lineage)) {
          const [form, tint] = key.split('~')
          if (!SPECIES_BY_ID.has(form) || !SPECIES_BY_ID.has(tint) || !Array.isArray(list)) continue
          const pairs = list.filter(pair => Array.isArray(pair) && whole(pair[0]) && whole(pair[1])).map(pair => [Math.floor(pair[0]), Math.floor(pair[1])]).slice(-20)
          if (pairs.length > 0) lineage[key] = pairs
        }
      }
      const goalsDone = {}
      for (const goal of BREED_GOALS) if (raw.goalsDone?.[goal.id] === true) goalsDone[goal.id] = true
      return { pedigree: capPedigree(pedigree), lineage, goalsDone }
    }

    const GENE_API = {
      GENES, BREED_GOALS, geneValues, gradeOf, genesOf, breedDna, predictGenes, partnerPlot,
      recordCross, plantCross, goalMet, goalPatch, sanitizeKin,
    }
