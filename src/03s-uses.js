
    // ---------------------------------------------------------------------
    // §3s A use for everything: reputation sends bigger expeditions, species
    //     study raises that species' spirit chance, ribbons buy time.
    // ---------------------------------------------------------------------
    const PATRON_STEP = 10
    const PATRON_MAX = 3
    const STUDY_BONUS = 0.01
    const RUSH_RIBBONS = 1

    /** Extra finds an expedition brings back: one per ten points of commission reputation, up to three. */
    function patronBonus(state) {
      return Math.max(0, Math.min(PATRON_MAX, Math.floor((state.patronage ?? 0) / PATRON_STEP)))
    }

    /** Spirit chance from knowing a species: one point per study level. */
    function studyBonus(state, speciesId) {
      return studyLevel(state.study?.[speciesId]?.observations ?? 0) * STUDY_BONUS
    }

    function rushExpedition(state, now) {
      const trip = state.expedition
      if (!trip || now >= trip.end || (state.ribbons ?? 0) < RUSH_RIBBONS) return null
      return { ...state, ribbons: state.ribbons - RUSH_RIBBONS, expedition: { ...trip, end: now } }
    }

    function rushJob(state, index, now) {
      const jobs = state.workshop?.jobs ?? []
      const job = jobs[index]
      if (job === undefined || now >= job.end || (state.ribbons ?? 0) < RUSH_RIBBONS) return null
      return { ...state, ribbons: state.ribbons - RUSH_RIBBONS, workshop: { ...state.workshop, jobs: jobs.map((entry, at) => (at === index ? { ...entry, end: now } : entry)) } }
    }

    const USES_API = { PATRON_STEP, PATRON_MAX, STUDY_BONUS, RUSH_RIBBONS, patronBonus, studyBonus, rushExpedition, rushJob }
