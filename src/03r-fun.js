
    // ---------------------------------------------------------------------
    // §3r Companions that live in the garden, short-lived garden events and
    //     the daily bouquet brief.
    // ---------------------------------------------------------------------
    const COMPANION_MAX = 3
    const COMPANION_COST = 1000
    const EVENT_MS = 30 * 60 * 1000
    const EVENT_WINDOW_MS = 8 * 60 * 1000
    const EVENT_CHANCE = 0.35
    const BOOST_MS = 10 * 60 * 1000
    const BOOST_SPIRIT = 0.1
    const BRIEF_REWARD = { coins: 60, ribbons: 1 }

    function companionRole(id) {
      return VISITOR_INFO[id]?.role
    }

    /** A visitor whose bond is complete can be invited to stay, for a fee. */
    function inviteCompanion(state, id) {
      const list = state.companions ?? []
      if (!VISITOR_BY_ID.has(id) || list.includes(id) || list.length >= COMPANION_MAX) return null
      if (affinityLevel(state, id) < AFFINITY_LEVELS.length || state.coins < COMPANION_COST) return null
      return { ...state, coins: state.coins - COMPANION_COST, companions: [...list, id] }
    }

    function dismissCompanion(state, id) {
      if (!(state.companions ?? []).includes(id)) return null
      return { ...state, companions: state.companions.filter(other => other !== id) }
    }

    /** One good turn: pollinate a plant, water the driest one, or feed the poorest soil. */
    function companionHelp(state, role) {
      let best = null
      for (const scene of SCENES) {
        const slot = state.scenes[scene.id]
        if (slot === undefined) continue
        slot.plots.forEach((plot, index) => {
          if (plot === null || plot === undefined || index >= slot.unlocked) return
          const score = role === 'pollinator' ? (plot.pollinated === true ? 0 : 1) : role === 'waterside' ? 100 - plot.moisture : 100 - soilOf(slot, index)
          if (score > 0 && (best === null || score > best.score)) best = { sceneId: scene.id, index, score }
        })
      }
      if (best === null) return state
      const slot = state.scenes[best.sceneId]
      const plots = slot.plots.slice()
      if (role === 'pollinator') plots[best.index] = { ...plots[best.index], pollinated: true }
      else if (role === 'waterside') plots[best.index] = { ...plots[best.index], moisture: 100 }
      const soil = role === 'guardian' ? withSoil(slot, best.index, soilOf(slot, best.index) + 15) : {}
      return { ...state, scenes: { ...state.scenes, [best.sceneId]: { ...slot, plots, ...soil } } }
    }

    /** Each companion helps once per clock hour; an idle tick returns the same state. */
    function companionTick(state, now) {
      const list = state.companions ?? []
      if (list.length === 0) return state
      const hour = Math.floor(now / HOUR_MS)
      if (state.companionHour === undefined) return { ...state, companionHour: hour }
      if (hour <= state.companionHour) return state
      let next = { ...state, companionHour: hour }
      for (const id of list) next = companionHelp(next, companionRole(id))
      return next
    }

    /** A passing wonder: there for eight minutes in some half-hours, gone once joined. */
    function eventAt(state, now) {
      const bucket = Math.floor(now / EVENT_MS)
      if ((state.eventBucket ?? -1) >= bucket || now - bucket * EVENT_MS >= EVENT_WINDOW_MS) return null
      if (hashUnit(bucket, 20261119, 53) >= EVENT_CHANCE) return null
      const kinds = isNight(now) ? ['meteor', 'dew'] : ['rainbow', 'swarm', 'dew']
      return { bucket, type: kinds[Math.floor(hashUnit(bucket, 20261119, 59) * kinds.length)], until: bucket * EVENT_MS + EVENT_WINDOW_MS }
    }

    function joinEvent(state, now) {
      const event = eventAt(state, now)
      if (event === null) return null
      const next = { ...state, eventBucket: event.bucket, events: (state.events ?? 0) + 1 }
      if (event.type === 'rainbow') return { ...next, boost: { type: 'rainbow', until: now + BOOST_MS } }
      if (event.type === 'meteor') return { ...next, charm: true }
      const scenes = { ...state.scenes }
      for (const scene of SCENES) {
        const slot = scenes[scene.id]
        if (slot === undefined || (event.type === 'swarm' && scene.id !== state.scene)) continue
        scenes[scene.id] = { ...slot, plots: slot.plots.map(plot => (plot === null || plot === undefined ? plot : event.type === 'swarm' ? { ...plot, pollinated: true } : { ...plot, moisture: 100 })) }
      }
      return { ...next, scenes }
    }

    function boostBonus(state, now) {
      return state.boost?.type === 'rainbow' && state.boost.until > now ? BOOST_SPIRIT : 0
    }

    /** Today's bouquet brief: enough stars, enough flowers, and on the day's theme. */
    function briefAt(now) {
      const day = localDay(now)
      return { day, stars: 3 + Math.floor(hashUnit(day, 3, 97) * 2), count: 3 + Math.floor(hashUnit(day, 4, 97) * 3), theme: bouquetTheme(now) }
    }

    function briefMet(brief, items, score) {
      return score !== null && score.stars >= brief.stars && items.length >= brief.count && score.checks.theme === true
    }

    /** Paid once a day, on top of the bouquet itself; {} when the brief is not met. */
    function briefPatch(state, items, score, now) {
      const brief = briefAt(now)
      if ((state.briefDay ?? -1) >= brief.day || !briefMet(brief, items, score)) return {}
      return {
        briefDay: brief.day, briefs: (state.briefs ?? 0) + 1, coins: state.coins + score.coins + BRIEF_REWARD.coins,
        ribbons: (state.ribbons ?? 0) + BRIEF_REWARD.ribbons, ribbonsEarned: (state.ribbonsEarned ?? 0) + BRIEF_REWARD.ribbons,
      }
    }

    function sanitizeFun(raw, now) {
      const companions = Array.isArray(raw.companions) ? [...new Set(raw.companions.filter(id => VISITOR_BY_ID.has(id)))].slice(0, COMPANION_MAX) : []
      const out = {
        companions, events: Math.floor(finiteOr(raw.events, 0)), briefs: Math.floor(finiteOr(raw.briefs, 0)),
        eventBucket: Number.isFinite(raw.eventBucket) ? Math.floor(raw.eventBucket) : -1,
        briefDay: Number.isFinite(raw.briefDay) ? Math.min(localDay(now), Math.floor(raw.briefDay)) : -1,
        boost: raw.boost?.type === 'rainbow' && Number.isFinite(raw.boost.until) ? { type: 'rainbow', until: Math.min(raw.boost.until, now + BOOST_MS) } : null,
      }
      if (Number.isFinite(raw.companionHour)) out.companionHour = Math.min(Math.floor(now / HOUR_MS), Math.floor(raw.companionHour))
      return out
    }

    const FUN_API = {
      COMPANION_MAX, COMPANION_COST, EVENT_MS, EVENT_WINDOW_MS, BOOST_MS, BOOST_SPIRIT, BRIEF_REWARD,
      companionRole, inviteCompanion, dismissCompanion, companionHelp, companionTick, eventAt, joinEvent, boostBonus,
      briefAt, briefMet, briefPatch, sanitizeFun,
    }
