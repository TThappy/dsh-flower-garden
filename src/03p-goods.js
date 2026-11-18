
    // ---------------------------------------------------------------------
    // §3p Workshop goods: a finished job can be kept as an item with a use of
    //     its own, instead of being sold for coins.
    // ---------------------------------------------------------------------
    const GOODS = ['dried', 'tea', 'perfume']
    const TEA_BOND = 8
    const SCENT_MS = 30 * 60 * 1000
    const SCENT_BONUS = 0.15

    function goodsCount(state, id) {
      return Math.max(0, Math.floor(state.goods?.[id] ?? 0))
    }

    function spendGood(state, id) {
      return { ...state, goods: { ...state.goods, [id]: goodsCount(state, id) - 1 }, goodsUsed: (state.goodsUsed ?? 0) + 1 }
    }

    /** A cup of flower tea for a visitor the player has met; refused when the bond is already complete. */
    function serveTea(state, visitorId) {
      if (!VISITOR_BY_ID.has(visitorId) || !((state.visitors?.[visitorId] ?? 0) > 0) || goodsCount(state, 'tea') <= 0) return null
      if (affinityLevel(state, visitorId) >= AFFINITY_LEVELS.length) return null
      return addAffinity(spendGood(state, 'tea'), visitorId, TEA_BOND)
    }

    function scentBonus(state, now) {
      return state.scent && state.scent.until > now ? SCENT_BONUS : 0
    }

    /** Perfume over the whole garden: more visitors for half an hour. It does not stack. */
    function sprayPerfume(state, now) {
      if (goodsCount(state, 'perfume') <= 0 || scentBonus(state, now) > 0) return null
      return { ...spendGood(state, 'perfume'), scent: { until: now + SCENT_MS } }
    }

    function sanitizeGoods(raw, now) {
      return {
        goods: Object.fromEntries(GOODS.map(id => [id, Math.floor(finiteOr(raw.goods?.[id], 0))])),
        goodsUsed: Math.floor(finiteOr(raw.goodsUsed, 0)),
        scent: Number.isFinite(raw.scent?.until) ? { until: Math.min(raw.scent.until, now + SCENT_MS) } : null,
      }
    }

    const GOODS_API = { GOODS, TEA_BOND, SCENT_MS, SCENT_BONUS, goodsCount, serveTea, scentBonus, sprayPerfume, sanitizeGoods }
