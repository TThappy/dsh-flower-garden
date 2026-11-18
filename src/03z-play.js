
    // ---------------------------------------------------------------------
    // §3b Daily play: check-in streak, daily wishes, surprise gifts and the
    //     report shown after time away. Pure transitions, like the rest of §3.
    // ---------------------------------------------------------------------
    const DAILY_REWARDS = [
      { coins: 20 }, { bag: { fertilizer: 1 } }, { coins: 40 }, { bag: { compost: 2 } },
      { coins: 60 }, { bag: { sprinkler: 1 } }, { coins: 100, bag: { charm: 1 } },
    ]
    const QUEST_POOL = [
      { id: 'harvested', target: 6, coins: 30 },
      { id: 'planted', target: 5, coins: 20 },
      { id: 'greeted', target: 3, coins: 35 },
      { id: 'delivered', target: 1, coins: 40 },
      { id: 'pollinated', target: 2, coins: 35 },
    ]
    const QUEST_SLOTS = 3
    const QUEST_BONUS = { bag: { fertilizer: 2 } }
    const GIFT_MS = 20 * 60 * 1000
    const GIFT_CHANCE = 0.65
    const AWAY_MIN_MS = 5 * 60 * 1000
    const RARITY_RANK = { base: 0, alt: 1, hybrid: 2, curio: 3, spirit: 4 }

    /** How special one bloom is; drives slot borders and backpack order. */
    function rarityOf(item) {
      if (item.variant === 'hidden') return 'spirit'
      if (item.trait) return 'curio'
      if (item.tint) return 'hybrid'
      return item.variant === 'alt' ? 'alt' : 'base'
    }

    function applyReward(state, reward) {
      const bag = { ...state.bag }
      for (const [id, n] of Object.entries(reward.bag ?? {})) bag[id] = (bag[id] ?? 0) + n
      return { ...state, coins: state.coins + (reward.coins ?? 0), bag }
    }

    /** Check-in: one reward per local day, seven-day cycle, a missed day restarts the streak. */
    function dailyStatus(state, now) {
      const day = localDay(now)
      const last = state.daily?.claimedDay ?? -1
      const streak = state.daily?.streak ?? 0
      const available = last < day
      const nextStreak = last === day - 1 ? streak + 1 : 1
      const shown = available ? nextStreak : Math.max(1, streak)
      const index = (shown - 1) % DAILY_REWARDS.length
      return { day, available, streak: available ? (last === day - 1 ? streak : 0) : streak, nextStreak, index, reward: DAILY_REWARDS[index] }
    }

    function claimDaily(state, now) {
      const status = dailyStatus(state, now)
      if (!status.available) return null
      return { ...applyReward(state, status.reward), daily: { claimedDay: status.day, streak: status.nextStreak } }
    }

    function questMetric(state, id) {
      if (id === 'greeted') return Object.values(state.visitors ?? {}).reduce((sum, n) => sum + n, 0)
      return state[id] ?? 0
    }

    /** Today's baseline counters; the same object comes back until the local day turns. */
    function questState(state, now) {
      const day = localDay(now)
      if (state.quests && state.quests.day === day) return state.quests
      return { day, base: Object.fromEntries(QUEST_POOL.map(entry => [entry.id, questMetric(state, entry.id)])), claimed: [], bonus: false }
    }

    function dailyQuests(state, now) {
      const quests = questState(state, now)
      return QUEST_POOL
        .map((entry, index) => ({ entry, rank: hashUnit(quests.day, index, 311) }))
        .sort((a, b) => b.rank - a.rank).slice(0, QUEST_SLOTS)
        .map(({ entry }) => {
          const progress = Math.min(entry.target, Math.max(0, questMetric(state, entry.id) - (quests.base[entry.id] ?? 0)))
          return { ...entry, progress, done: progress >= entry.target, claimed: quests.claimed.includes(entry.id) }
        })
    }

    function claimQuest(state, id, now) {
      const list = dailyQuests(state, now)
      const quest = list.find(entry => entry.id === id)
      if (quest === undefined || !quest.done || quest.claimed) return null
      const quests = questState(state, now)
      const claimed = [...quests.claimed, id]
      let next = applyReward(state, { coins: quest.coins })
      const cleared = list.every(entry => claimed.includes(entry.id))
      if (cleared && !quests.bonus) next = applyReward(next, QUEST_BONUS)
      return { ...next, quests: { ...quests, claimed, bonus: quests.bonus || cleared } }
    }

    /** A surprise box that shows up in some twenty-minute windows; the same for everyone, like the weather. */
    function giftAt(state, now) {
      const bucket = Math.floor(now / GIFT_MS)
      if ((state.giftBucket ?? -1) >= bucket) return null
      if (hashUnit(bucket, 20261118, 91) >= GIFT_CHANCE) return null
      const roll = hashUnit(bucket, 20261118, 17)
      const reward = roll < 0.5 ? { coins: 8 + Math.floor(roll * 50) }
        : roll < 0.75 ? { bag: { fertilizer: 1 } }
          : roll < 0.92 ? { bag: { compost: 1 } } : { bag: { sprinkler: 1 } }
      return { bucket, reward, until: (bucket + 1) * GIFT_MS }
    }

    function openGift(state, now) {
      const gift = giftAt(state, now)
      if (gift === null) return null
      return { ...applyReward(state, gift.reward), giftBucket: gift.bucket }
    }

    /** What changed while nobody was looking, or null after a short absence. */
    function awaySummary(before, after, now) {
      const awayMs = now - (before.lastTick ?? now)
      if (!(awayMs >= AWAY_MIN_MS)) return null
      let bloomed = 0
      let thirsty = 0
      for (const scene of SCENES) {
        const plots = after.scenes?.[scene.id]?.plots ?? []
        const old = before.scenes?.[scene.id]?.plots ?? []
        plots.forEach((plot, index) => {
          if (plot === null || plot === undefined) return
          const open = stageOf(plot) === 'bloom'
          if (open && old[index] && stageOf(old[index]) !== 'bloom') bloomed += 1
          if (!open && plot.moisture <= 0.5) thirsty += 1
        })
      }
      return { awayMs, bloomed, thirsty }
    }

    function sanitizePlay(raw, now) {
      const today = localDay(now)
      const daily = raw.daily !== null && typeof raw.daily === 'object' ? raw.daily : {}
      const claimedDay = Number.isFinite(daily.claimedDay) ? Math.max(-1, Math.min(today, Math.floor(daily.claimedDay))) : -1
      const known = new Set(QUEST_POOL.map(entry => entry.id))
      const q = raw.quests
      const quests = q !== null && typeof q === 'object' && Number.isFinite(q.day) ? {
        day: Math.floor(q.day),
        base: Object.fromEntries(QUEST_POOL.map(entry => [entry.id, Math.floor(finiteOr(q.base?.[entry.id], 0))])),
        claimed: Array.isArray(q.claimed) ? [...new Set(q.claimed.filter(id => known.has(id)))] : [],
        bonus: q.bonus === true,
      } : null
      return {
        daily: { claimedDay, streak: claimedDay < 0 ? 0 : Math.floor(finiteOr(daily.streak, 0)) },
        quests,
        giftBucket: Number.isFinite(raw.giftBucket) ? Math.floor(raw.giftBucket) : -1,
      }
    }

    const PLAY_API = {
      DAILY_REWARDS, QUEST_POOL, QUEST_SLOTS, QUEST_BONUS, GIFT_MS, AWAY_MIN_MS, RARITY_RANK,
      rarityOf, applyReward, dailyStatus, claimDaily, questMetric, questState, dailyQuests, claimQuest,
      giftAt, openGift, awaySummary, sanitizePlay, localDay,
    }
