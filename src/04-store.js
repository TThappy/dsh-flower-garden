    // ---------------------------------------------------------------------
    // §4 Store: one module-level garden shared by every mount, persisted at
    //    most once every few seconds plus immediately after a user action.
    // ---------------------------------------------------------------------
    let garden = null
    const listeners = new Set()
    let saveTimer = null
    let lastSaveAt = 0

    /** Keeps the original text of a save this build cannot use, so starting fresh never destroys it. */
    function keepBackup(reason, text) {
      try {
        window.localStorage.setItem(`${STORAGE_KEY}.backup-${reason}`, text)
      } catch (error) {
        console.warn('[flower-garden] could not back up the unusable save', error)
      }
    }

    function readStored() {
      for (const key of [STORAGE_KEY, ...LEGACY_KEYS]) {
        let text = null
        try {
          text = window.localStorage.getItem(key)
        } catch (error) {
          console.warn('[flower-garden] storage is unavailable; starting fresh', error)
          return null
        }
        if (text === null) continue
        let parsed
        try {
          parsed = JSON.parse(text)
        } catch (error) {
          console.warn('[flower-garden] saved garden is unreadable; kept a backup and starting fresh', error)
          keepBackup('corrupt', text)
          return null
        }
        // A save from a newer build would be reset by sanitize; keep its text first.
        if (parsed !== null && typeof parsed === 'object' && typeof parsed.v === 'number' && parsed.v > STATE_VERSION) {
          console.warn('[flower-garden] saved garden comes from a newer version; kept a backup and starting fresh')
          keepBackup('newer', text)
          return null
        }
        return parsed
      }
      return null
    }

    function persist() {
      if (saveTimer !== null) {
        window.clearTimeout(saveTimer)
        saveTimer = null
      }
      if (garden === null) return
      lastSaveAt = Date.now()
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(garden))
      } catch (error) {
        console.warn('[flower-garden] could not save the garden', error)
      }
    }

    function schedulePersist() {
      if (saveTimer !== null) return
      const wait = Math.max(0, 4000 - (Date.now() - lastSaveAt))
      saveTimer = window.setTimeout(() => {
        saveTimer = null
        persist()
      }, wait)
    }

    /** What grew while the page was closed; shown once, then dismissed. */
    let awayReport = null
    function getAway() { return awayReport }
    function clearAway() { awayReport = null }

    function initStore() {
      if (garden !== null) return garden
      const stored = sanitize(readStored(), Date.now())
      garden = advanceState(stored, Date.now())
      awayReport = awaySummary(stored, garden, Date.now())
      persist() // Initial bloom identifications must survive an immediate reload.
      return garden
    }

    function getState() {
      return garden === null ? initStore() : garden
    }

    function commit(next, immediate) {
      if (next === null || next === garden) return
      const previous = garden
      garden = revealGarden(next, Date.now())
      const revealed = SCENES.some(scene => (garden.scenes[scene.id]?.plots??[]).some((plot,index)=>{
        if(!plot?.identified)return false
        const old=previous?.scenes?.[scene.id]?.plots?.[index]
        return !old?.identified || old.variant!==plot.variant || old.trait!==plot.trait || (old.traitChecks??[]).join()!==(plot.traitChecks??[]).join()
      }))
      for (const listener of listeners) listener()
      if (immediate || revealed) persist()
      else schedulePersist()
    }

    /** Another window saved: take its garden, keep this window's own tab and ground. */
    function adoptStored(text) {
      if (typeof text !== 'string' || garden === null) return
      let parsed
      try {
        parsed = JSON.parse(text)
      } catch (error) {
        return
      }
      if (parsed === null || typeof parsed !== 'object' || parsed.v !== STATE_VERSION) return
      const now = Date.now()
      garden = { ...advanceState(sanitize(parsed, now), now), ui: garden.ui, scene: garden.scene }
      for (const listener of listeners) listener()
    }

    function subscribeGarden(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    }

    function tick() {
      commit(advanceState(getState(), Date.now()), false)
    }

    function flushPersist() {
      if (saveTimer !== null) persist()
    }

    const useSyncExternalStore = React.useSyncExternalStore
      ?? function fallbackStore(subscribe, snapshot) {
        const [value, setValue] = React.useState(snapshot)
        React.useEffect(() => subscribe(() => setValue(snapshot())), [subscribe, snapshot])
        return value
      }

    /** Captured plugin context and translator, set by `apply`. */
    let pluginCtx = null
    let boundT = key => key

