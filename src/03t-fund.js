
    // ---------------------------------------------------------------------
    // §3t The garden fund: an open-ended place for coins to go. Every level
    //     costs more than the last and pays in ribbons and standing, not coins.
    // ---------------------------------------------------------------------
    const FUND_BASE = 2000
    const FUND_GROWTH = 1.15
    const FUND_RANKS = 6

    function fundLevel(state) {
      return Math.max(0, Math.floor(state.fund ?? 0))
    }

    function fundCost(level) {
      return Math.round((FUND_BASE * Math.pow(FUND_GROWTH, level)) / 100) * 100
    }

    /** Standing shown beside the fund: a new rank every five levels. */
    function fundRank(level) {
      return Math.min(FUND_RANKS - 1, Math.floor(level / 5))
    }

    /** One ribbon a level, and a lucky charm on every fifth. */
    function donateFund(state) {
      const level = fundLevel(state)
      const cost = fundCost(level)
      if (state.coins < cost) return null
      const paid = applyReward({ ...state, coins: state.coins - cost }, (level + 1) % 5 === 0 ? { bag: { charm: 1 } } : {})
      return { ...paid, fund: level + 1, ribbons: (state.ribbons ?? 0) + 1, ribbonsEarned: (state.ribbonsEarned ?? 0) + 1 }
    }

    function sanitizeFund(raw) {
      return { fund: Math.floor(finiteOr(raw.fund, 0)) }
    }

    const FUND_API = { FUND_BASE, FUND_GROWTH, fundLevel, fundCost, fundRank, donateFund, sanitizeFund }
