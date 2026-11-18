
    // ---------------------------------------------------------------------
    // §3v Coin sinks with a purpose: vases to buy, a display shelf whose cards
    //     give small bonuses, and names for bouquet cards.
    // ---------------------------------------------------------------------
    const VASE_PRICE = { classic: 0, round: 300, tall: 800, basket: 1500, moon: 3000, gold: 6000 }
    const VASE_LIKES = { round: 'wide', tall: 'high', basket: 'mixed', moon: 'white', gold: 'rare' }
    const VASE_MATCH_BONUS = 0.05
    const SHELF_PRICES = [400, 1200, 3000, 7000, 15000]

    function cleanText(value, max) {
      return typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim().slice(0, max) : ''
    }

    function vaseOwned(state, id) {
      return id === 'classic' || (Array.isArray(state.vases) && state.vases.includes(id))
    }

    /** A vase must be earned by practice first, then bought. */
    function buyVase(state, id) {
      if (!VASE_BY_ID.has(id) || vaseOwned(state, id) || !vaseUnlocked(state, id) || state.coins < VASE_PRICE[id]) return null
      return { ...state, coins: state.coins - VASE_PRICE[id], vases: [...(state.vases ?? []), id] }
    }

    /** Each vase suits a kind of flower; half the bouquet or more must fit. */
    function vaseMatch(vase, items) {
      const like = VASE_LIKES[vase]
      if (like === undefined || items.length === 0) return false
      if (like === 'mixed') return new Set(items.map(item => item.species)).size >= 4
      const fits = item => (like === 'wide' ? item.dna > 0 && genesOf(item.dna).width >= 4
        : like === 'high' ? item.dna > 0 && genesOf(item.dna).height >= 4
          : like === 'white' ? bloomTone(item).family === 'white' : !isPlainBloom(item))
      return items.filter(fits).length * 2 >= items.length
    }

    function shelfSlots(state) {
      return Math.max(0, Math.min(SHELF_PRICES.length, Math.floor(state.shelf?.slots ?? 0)))
    }

    function buyShelfSlot(state) {
      const slots = shelfSlots(state)
      if (slots >= SHELF_PRICES.length || state.coins < SHELF_PRICES[slots]) return null
      return { ...state, coins: state.coins - SHELF_PRICES[slots], shelf: { slots: slots + 1, cards: state.shelf?.cards ?? [] } }
    }

    /** Cards on the shelf that still exist in the album, at most one per slot. */
    function shelfCards(state) {
      return (state.shelf?.cards ?? [])
        .map(ref => ({ ...ref, card: (state[ref.kind] ?? []).find(card => card.id === ref.id) }))
        .filter(ref => ref.card !== undefined).slice(0, shelfSlots(state))
    }

    function shelfEffect(ref) {
      if (ref.kind === 'bouquets') return { type: 'sale', amount: ref.card.stars * 0.01 }
      const rarity = rarityOf(ref.card.item)
      return rarity === 'spirit' ? { type: 'spirit', amount: 0.01 }
        : rarity === 'curio' || rarity === 'hybrid' ? { type: 'hybrid', amount: 0.02 } : { type: 'visitor', amount: 0.01 }
    }

    /** Small permanent bonuses from the displayed cards, plus one point of spirit chance per legacy. */
    function shelfBonus(state) {
      const bonus = { sale: 0, spirit: Math.min(5, Math.floor(state.legacy ?? 0)) * 0.01, hybrid: 0, visitor: 0 }
      for (const ref of shelfCards(state)) { const effect = shelfEffect(ref); bonus[effect.type] += effect.amount }
      return bonus
    }

    /** Put a card on the shelf, or take it off when it is already there. */
    function toggleShelf(state, kind, id) {
      if ((kind !== 'bouquets' && kind !== 'cards') || !(state[kind] ?? []).some(card => card.id === id)) return null
      const shown = shelfCards(state).map(({ kind: k, id: n }) => ({ kind: k, id: n }))
      const at = shown.findIndex(ref => ref.kind === kind && ref.id === id)
      if (at === -1 && shown.length >= shelfSlots(state)) return null
      const cards = at === -1 ? [...shown, { kind, id }] : shown.filter((_, index) => index !== at)
      return { ...state, shelf: { slots: shelfSlots(state), cards } }
    }

    function nameBouquet(state, id, title, note) {
      if (!(state.bouquets ?? []).some(card => card.id === id)) return null
      return { ...state, bouquets: state.bouquets.map(card => (card.id === id ? { ...card, title: cleanText(title, 20), note: cleanText(note, 60) } : card)) }
    }

    function sanitizeEconomy(raw) {
      const vases = Array.isArray(raw.vases) ? [...new Set(raw.vases.filter(id => VASE_BY_ID.has(id) && id !== 'classic'))] : []
      const slots = Math.max(0, Math.min(SHELF_PRICES.length, Math.floor(finiteOr(raw.shelf?.slots, 0))))
      const cards = (Array.isArray(raw.shelf?.cards) ? raw.shelf.cards : [])
        .filter(ref => ref && (ref.kind === 'bouquets' || ref.kind === 'cards') && Number.isFinite(ref.id))
        .map(ref => ({ kind: ref.kind, id: Math.floor(ref.id) })).slice(0, slots)
      return { vases, shelf: { slots, cards } }
    }

    const ECONOMY_API = {
      VASE_PRICE, VASE_LIKES, VASE_MATCH_BONUS, SHELF_PRICES, cleanText, vaseOwned, buyVase, vaseMatch,
      shelfSlots, buyShelfSlot, shelfCards, shelfEffect, shelfBonus, toggleShelf, nameBouquet, sanitizeEconomy,
    }
