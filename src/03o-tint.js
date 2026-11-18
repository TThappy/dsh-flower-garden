
    // ---------------------------------------------------------------------
    // §3o Vase colours: every owned vase can be repainted, and a bouquet card
    //     remembers the colour its vase had.
    // ---------------------------------------------------------------------
    const VASE_SWATCHES = ['#a9cdb8', '#8fc0d6', '#f1f4f7', '#7a5aa8', '#e2b93b', '#d9706a', '#2f3a4a', '#e8a0b8']

    function cleanTint(value) {
      return typeof value === 'string' && /^#[0-9a-f]{6}$/iu.test(value) ? value.toLowerCase() : null
    }

    function vaseTint(state, id) {
      return cleanTint(state.vaseTints?.[id])
    }

    /** Paint an owned vase; `null` puts its own glaze back. */
    function setVaseTint(state, id, color) {
      if (!VASE_BY_ID.has(id) || !vaseOwned(state, id)) return null
      const tints = { ...state.vaseTints }
      if (color === null) delete tints[id]
      else if (cleanTint(color) === null) return null
      else tints[id] = cleanTint(color)
      return { ...state, vaseTints: tints }
    }

    function sanitizeTints(raw) {
      const vaseTints = {}
      for (const vase of VASES) { const tint = cleanTint(raw.vaseTints?.[vase.id]); if (tint !== null) vaseTints[vase.id] = tint }
      return { vaseTints }
    }

    const TINT_API = { VASE_SWATCHES, cleanTint, vaseTint, setVaseTint, sanitizeTints }
