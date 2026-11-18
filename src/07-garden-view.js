    function GardenView(props) {
      const t = (props !== null && props !== undefined && typeof props.t === 'function') ? props.t : boundT
      const state = useSyncExternalStore(subscribeGarden, getState, getState)
      const [picker, setPicker] = React.useState(null)
      const [confirmReset, setConfirmReset] = React.useState(false)
      const [codexOpen, setCodexOpen] = React.useState(() => sanitizeUi(state.ui).tab === 'flowers')
      const [achOpen, setAchOpen] = React.useState(false)
      const [armed, setArmed] = React.useState(null)
      // Which basket bloom the player opened to look at.
      const [preview, setPreview] = React.useState(null)
      // Which flower-book entry the player opened to look at.
      const [codexPreview, setCodexPreview] = React.useState(null)
      const [guestPreview, setGuestPreview] = React.useState(null)
      const [guideRegion,setGuideRegion]=React.useState(state.scene)
      const [discovery, setDiscovery] = React.useState(null)
      const [reward, setReward] = React.useState(null)
      const [inventoryOpen, setInventoryOpen] = React.useState(false)
      const [away, setAway] = React.useState(getAway)
      const found = React.useRef(false)
      const [tool, setTool] = React.useState(null)
      const dragging = React.useRef(null)
      React.useEffect(() => {
        if (!away) return undefined
        const id = window.setTimeout(() => { clearAway(); setAway(null) }, 12000)
        return () => window.clearTimeout(id)
      }, [away])
      // A parsed save file waiting for the player to confirm the overwrite.
      const [pendingImport, setPendingImport] = React.useState(null)
      const saveInput = React.useRef(null)
      const [toast, setToast] = React.useState({ text: '', key: 0, tone: 'ok', species: null })
      const [clock, setClock] = React.useState(() => Date.now())
      const rootRef = React.useRef(null)
      const scrollRef = React.useRef(null)
      // The element a dialog took focus from, so closing it can hand focus back
      // without scrolling the session pane to the top.
      const modalOpener = React.useRef(null)
      function rememberOpener() { modalOpener.current = typeof document === 'undefined' ? null : document.activeElement }
      function restoreOpener() {
        const previous = modalOpener.current
        modalOpener.current = null
        window.setTimeout(() => {
          const target = previous?.isConnected && !previous.closest('[hidden]')
            ? previous
            : rootRef.current?.querySelector('[role="tab"][aria-selected="true"]')
          if (target !== null && target !== undefined && typeof target.focus === 'function') target.focus({ preventScroll: true })
        }, 0)
      }
      function openGuide(id) { rememberOpener(); setGuideRegion(SCENE_ID_OF.get(id)); setCodexOpen(true); setCodexPreview(`${id}:base`) }
      function openGuest(id) { rememberOpener(); setGuestPreview(id) }
      const scrollPositions = React.useRef({})
      const ui = sanitizeUi(state.ui)
      const activeTab = ui.tab
      const clockInfo = gardenClock(clock)
      const fontFamilies = {system:'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',serif:'"Songti SC", "Noto Serif CJK SC", "SimSun", Georgia, serif',rounded:'"SF Pro Rounded", "Arial Rounded MT Bold", "PingFang SC", sans-serif'}
      function updateUi(patch) { commit({...getState(),ui:sanitizeUi({...getState().ui,...patch})},true) }
      function selectTab(id, keyboard = false) {
        if (!GARDEN_TABS.includes(id)) return
        if (scrollRef.current) scrollPositions.current[activeTab] = scrollRef.current.scrollTop
        updateUi({tab:id})
        setArmed(null);setPicker(null);setConfirmReset(false)
        if(id==='flowers')setCodexOpen(true)
        window.setTimeout(()=>{if(scrollRef.current)scrollRef.current.scrollTop=scrollPositions.current[id]??0;if(keyboard)rootRef.current?.querySelector(`#fg-tab-${id}`)?.focus({preventScroll:true})},0)
      }
      function tabKeys(event,id) {
        const index=GARDEN_TABS.indexOf(id)
        const next=event.key==='ArrowRight'?(index+1)%GARDEN_TABS.length:event.key==='ArrowLeft'?(index+GARDEN_TABS.length-1)%GARDEN_TABS.length:event.key==='Home'?0:event.key==='End'?GARDEN_TABS.length-1:null
        if(next===null)return
        event.preventDefault();selectTab(GARDEN_TABS[next],true)
      }
      function panel(id,...children) {
        return h('div',{key:id,id:`fg-panel-${id}`,role:'tabpanel','aria-labelledby':`fg-tab-${id}`,hidden:activeTab!==id,tabIndex:0,className:'fg-tabPanel'},...children)
      }


      const [, forceRender] = React.useReducer(count => count + 1, 0)
      React.useEffect(() => {
        const locale = pluginCtx === null ? undefined : pluginCtx.locale
        if (t !== boundT || locale === undefined || typeof locale.subscribe !== 'function') return undefined
        return locale.subscribe(() => forceRender())
      }, [t])

      React.useEffect(() => {
        const id = window.setInterval(() => {
          setClock(Date.now())
          tick()
        }, 1000)
        return () => {
          window.clearInterval(id)
        }
      }, [])

      React.useEffect(() => {
        if (confirmReset === false) return undefined
        const id = window.setTimeout(() => setConfirmReset(false), 4000)
        return () => {
          window.clearTimeout(id)
        }
      }, [confirmReset])

      React.useEffect(() => {
        if (armed === null) return undefined
        const id = window.setTimeout(() => setArmed(null), 4000)
        return () => {
          window.clearTimeout(id)
        }
      }, [armed])

      const toastKey = toast.key
      React.useEffect(() => {
        if (toastKey === 0) return undefined
        const id = window.setTimeout(() => {
          setToast(current => (current.key === toastKey ? { text: '', key: 0, tone: 'ok' } : current))
        }, 6500)
        return () => {
          window.clearTimeout(id)
        }
      }, [toastKey])

      function commitDiscovered(before,next,kind,index) {
        const items=discoveryItems(before,next,kind,before.scene,index)
        const recorded=recordDiscoveries(next,items,Date.now())
        commit(recorded,true)
        found.current=items.length>0
        return false
      }
      function openDiscovered(item) {
        setDiscovery(null)
        if(item.type==='visitor'){selectTab('visitors');setGuestPreview(item.visitor)}
        else{selectTab('flowers');setGuideRegion(SCENE_ID_OF.get(item.species));setCodexOpen(true);setCodexPreview(item.type==='seed'?`${item.species}:base`:itemKey(item))}
        modalOpener.current=null
      }
      function commitReward(next) {
        const result=rewardForChange(getState(),next,t)
        commit(next,true)
        if(result){playSound('coin');flyTo(typeof document==='undefined'?null:document.activeElement,rootRef.current?.querySelector('.fg-stats .fg-chip'),'🪙');announce(result.entries.map(entry=>`${entry.label} ${entry.amount}`).join(' · '),'gold')}
      }
      function announce(text, tone, species) {
        if (tone === 'warn') playSound('error')
        setToast({ text, key: Date.now(), tone: tone ?? 'ok', species: species ?? null })
      }

      function focusTarget(selector) {
        window.setTimeout(() => {
          const root = rootRef.current
          if (root === null) return
          const candidate = root.querySelector(selector) ?? (selector.startsWith('[data-codex=') ? root.querySelector('#fg-codex-toggle') : null)
          const target = candidate && !candidate.closest('[hidden]') ? candidate : null
          // Falling back to the tab bar used to scroll the whole view to the top when
          // the wanted control had just disappeared. Leave focus where it is instead.
          if (target === null || typeof target.focus !== 'function') return
          target.focus({ preventScroll: true })
          if (typeof target.scrollIntoView === 'function') target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
        }, 0)
      }

      function focusPlot(index, action) {
        focusTarget(action === 'card'
          ? `[data-plot="${index}"]`
          : `[data-plot="${index}"] [data-action="${action}"]`)
      }

      function focusSection(name) {
        focusTarget(`[data-focus="${name}"]`)
      }

      /** Open one flower-book entry; clicking the same entry again closes it. */
      function showCodexEntry(speciesId, variant) {
        rememberOpener()
        const key = `${speciesId}:${variant}`
        if (codexPreview === key) {
          setCodexPreview(null)
          focusTarget(`[data-codex="${key}"]`)
          return
        }
        setCodexPreview(key)
        focusTarget('#fg-codex-preview')
      }

      /** Open the bloom detail under the basket; clicking the same chip closes it. */
      function showBloom(key) {
        setArmed(null)
        if (preview === key) {
          setPreview(null)
          focusTarget(`[data-basket="${key}"]`)
          return
        }
        setPreview(key)
        focusTarget('.fg-preview')
      }

      const scene = sceneOf(state.scene)
      const slot = state.scenes[state.scene] ?? emptyScene(START_PLOTS)
      const weather = weatherAt(clock)
      const growth = scene.weather[weather] ?? 1
      const rainy = weather === 'rain'
      const rainWets = rainy && scene.rainWets
      const weatherLeft = formatDuration(weatherEndsAt(clock) - clock, t)
      const level = levelOf(state.xp)
      const xpInLevel = state.xp % XP_PER_LEVEL
      const featured = featuredSpecies(state, clock)
      const basketValueNow = basketValue(state, clock)
      const marketPercent = Math.round((MARKET_BONUS - 1) * 100)
      const readyAchievements = ACHIEVEMENTS.filter(entry => achievementReady(state, entry))
      const metKinds = Object.keys(state.visitors ?? {}).length
      const capacity = basketCapacity(state)
      const basketFull = state.basket.length >= capacity
      const sprinklerLeftMs = Math.max(0, (slot.sprinklerUntil ?? 0) - clock)
      const discovered = Object.keys(state.seen).length
      const totalEntries = CODEX_ENTRIES.length
      const grownCount = SPECIES.filter(species => state.seen[`${species.id}:base`] !== undefined
        || state.seen[`${species.id}:alt`] !== undefined
        || state.seen[`${species.id}:hidden`] !== undefined).length
      const sceneSpecies = scene.species.map(id => SPECIES_BY_ID.get(id))
      const guideScene=sceneOf(guideRegion)
      const weatherNote = [
        growth === 1 ? t('weather.steady') : t('weather.growth', { n: `${growth > 1 ? '+' : ''}${Math.round((growth - 1) * 100)}%` }),
        rainy ? (scene.rainWets ? t('weather.soilWet') : t('weather.soilDry')) : null,
      ].filter(Boolean).join(' · ')

      function plant(index, speciesId, tintId) {
        const species = SPECIES_BY_ID.get(speciesId)
        if (species === undefined) return
        if (tintId === undefined && getState().coins < species.cost) {
          announce(t('error.coins'), 'warn')
          return
        }
        const next = plantAt(getState(), state.scene, index, speciesId, tintId)
        if (next === null) return
        playSound('plant')
        commit(next, true)
        setPicker(null)
        focusPlot(index, 'card')
      }

      function water(index) {
        playSound('water')
        commit(waterAt(getState(), state.scene, index), true)
      }

      function waterEvery() {
        commit(waterAll(getState(), state.scene), true)
      }

      function greet(index) {
        const now = Date.now()
        const before = getState()
        const currentSlot = before.scenes[before.scene]
        const plot = currentSlot === undefined ? null : currentSlot.plots[index]
        const visitor = visitorAt(before.scene, index, plot, now, weatherAt(now), facilityLevel(before, 'hive'), gardenEcology(before, now).visitorBonus, before)
        const next = greetVisitor(before, before.scene, index, now, weatherAt(now))
        if (visitor === null || next === null) return
        const hasDiscovery = commitDiscovered(before,next,'visitor',index)
        const words = {
          name: t(`visitor.${visitor.id}`),
          coins: next.coins - before.coins,
          flower: t(`species.${plot.species}`),
        }
        const fresh = (before.visitors[visitor.id] ?? 0) === 0 ? ` ${t('visitor.new')}` : ''
        announce(t('guest.greeted', { name: words.name, coins: words.coins, effect: t(`guest.effect.${VISITOR_INFO[visitor.id].role}`) }) + fresh, 'ok')
        if (!hasDiscovery) focusPlot(index, 'harvest')
      }

      function claim(achievementId) {
        const entry = ACHIEVEMENT_BY_ID.get(achievementId)
        const next = claimAchievement(getState(), achievementId)
        if (entry === undefined || next === null) return
        commitReward(next)
        announce(t('ach.done', { name: t(`ach.${entry.id}.name`), n: entry.coins }), 'ok')
      }

      function feed(index, speciesId) {
        const next = fertilizeAt(getState(), state.scene, index)
        if (next === null) return
        commit(next, true)
        announce(t('item.fertilized', { flower: t(`species.${speciesId}`) }), 'ok')
        focusPlot(index, 'card')
      }

      function buy(itemId) {
        const before = getState()
        const item = ITEM_BY_ID.get(itemId)
        if (item === undefined) return
        if (before.coins < item.price) {
          announce(t('item.short', { n: item.price - before.coins }), 'warn')
          return
        }
        const next = buyItem(before, itemId)
        if (next === null) return
        commitReward(next)
        announce(t('item.bought', { item: t(`item.${itemId}`) }), 'ok')
      }

      function sprinkle() {
        const next = useSprinkler(getState(), state.scene, Date.now())
        if (next === null) return
        commit(next, true)
        announce(t('item.sprinkled', { scene: t(`scene.${scene.id}`) }), 'ok')
      }

      function armCharm() {
        const next = useCharm(getState())
        if (next === null) return
        commit(next, true)
        announce(t('item.charmReady'), 'ok')
      }

      function harvest(index, endResidency = false) {
        if (endResidency && armed !== `retire:${state.scene}:${index}`) { setArmed(`retire:${state.scene}:${index}`); return }
        setArmed(null)
        const before = getState()
        const currentSlot = before.scenes[before.scene]
        const plot = currentSlot === undefined ? null : currentSlot.plots[index]
        if (plot === undefined || plot === null) return
        const species = SPECIES_BY_ID.get(plot.species)
        if (species === undefined) return
        if (before.basket.length >= basketCapacity(before)) {
          announce(t('error.basketFull'), 'warn')
          return
        }
        const next = harvestAt(before, before.scene, index, Date.now(), weatherAt(Date.now()), endResidency)
        if (next === null) return
        flyTo(rootRef.current?.querySelector(`[data-plot="${index}"] .fg-art`),rootRef.current?.querySelector('.fg-bagButton'),'🌸')
        const hasDiscovery = commitDiscovered(before,next,'harvest',index)
        const first = next.basket[before.basket.length]
        const spirit = first?.variant === 'hidden'
        let text = spirit ? t('reward.gold', { flower: bloomName(first, t), n: 3 })
          : first?.trait ? t('reward.trait', { name: bloomName(first, t), n: TRAIT_PRICE })
            : t(next.basket.length - before.basket.length > 1 ? 'reward.double' : 'reward.gain', { flower: bloomName(first, t), xp: species.xp })
        if (next.lastBred) {
          const [form, tint] = next.lastBred.split('~')
          text += ` · ${t('hybrid.seed', { name: t('hybrid.name', { form: t(`species.${form}`), tint: t(`species.${tint}`) }) })}`
        }
        const won = BREED_GOALS.filter(goal => next.goalsDone?.[goal.id] === true && before.goalsDone?.[goal.id] !== true)
        if (won.length > 0) text += ` · ${t('goal.achieved', { name: won.map(goal => t(`goal.${goal.id}`)).join(' / ') })}`
        const special = spirit || found.current || won.length > 0
        playSound(special ? 'gold' : 'harvest')
        announce(text + (found.current ? ` · ${t('discovery.noted')}` : ''), special ? 'gold' : 'ok', spirit ? species.id : null)
        if (!hasDiscovery) focusPlot(index, 'plant')
      }

      function unlock(index) {
        const next = unlockAt(getState(), state.scene, index)
        if (next === null) return
        commit(next, true)
        focusPlot(index, 'plant')
      }

      function openScene(sceneId) {
        const before = getState()
        const target = sceneOf(sceneId)
        const targetSlot = before.scenes[sceneId]
        if (targetSlot === undefined) return
        if (targetSlot.unlocked > 0) {
          commit({ ...before, scene: sceneId }, true)
          return
        }
        if (before.coins < target.cost) {
          announce(t('scene.short', { n: target.cost - before.coins }), 'warn')
          return
        }
        const key = `scene:${sceneId}`
        if (armed !== key) {
          setArmed(key)
          return
        }
        setArmed(null)
        commit(unlockScene(before, sceneId), true)
        announce(t('scene.unlocked'), 'ok')
      }

      function sell(kind) {
        const key = kind ?? 'all:all'
        if (armed !== key) {
          setArmed(key)
          return
        }
        const before = getState()
        const next = kind === undefined ? sellBasket(before, undefined, undefined, Date.now()) : sellKind(before, kind, Date.now())
        setArmed(null)
        setPreview(null)
        if (next === null) return
        const gain = next.coins - before.coins
        commit(next, true)
        playSound('coin')
        flyTo(rootRef.current?.querySelector('.fg-basket'),rootRef.current?.querySelector('.fg-stats .fg-chip'),'🪙')
        announce(t('reward.sellMany', { n: before.basket.length - next.basket.length, coins: gain }), 'ok')
        focusSection('basket')
      }

      function sellOne(item) {
        const before = getState()
        const index = before.basket.indexOf(item)
        const next = sellIndividual(before, index, Date.now())
        if (next === null) return
        commit(next, true)
        setArmed(null)
        if (!next.basket.some(bloom => itemKey(bloom) === itemKey(item))) {
          setPreview(null)
          focusSection('basket')
        }
        announce(t('reward.sell', { flower: bloomName(item, t), coins: next.coins - before.coins }))
      }

      function deliver(orderId) {
        const before = getState()
        const order = before.orders.find(entry => entry.id === orderId)
        const next = deliverOrder(before, orderId)
        if (order === undefined || next === null) return
        commit(next, true)
        announce(t('reward.order', { id: orderId, coins: order.coins }), 'ok')
        focusSection('orders')
      }

      function reset() {
        if (confirmReset === false) {
          setConfirmReset(true)
          return
        }
        commit(freshState(Date.now()), true)
        setConfirmReset(false)
        setPicker(null)
        announce(t('action.resetDone'), 'info')
      }

      // A save file is the only copy that leaves this browser, so the export is a
      // plain JSON download and the import never replaces a garden before the
      // player confirms it.
      function exportFile() {
        const text = JSON.stringify(exportSave(getState(), Date.now()), null, 2)
        const stamp = new Date().toISOString().slice(0, 10)
        try {
          const blob = new Blob([text], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const anchor = document.createElement('a')
          anchor.href = url
          anchor.download = `flower-garden-${stamp}.json`
          anchor.rel = 'noopener'
          document.body.appendChild(anchor)
          anchor.click()
          anchor.remove()
          window.setTimeout(() => URL.revokeObjectURL(url), 1000)
          announce(t('action.exported'), 'ok')
        } catch (error) {
          announce(t('action.exportFailed'), 'warn')
        }
      }

      function pickSaveFile() {
        const input = saveInput.current
        if (input === null || input === undefined) return
        input.value = ''
        input.click()
      }

      function readSaveFile(event) {
        const file = event.target.files?.[0]
        if (file === undefined) return
        const reader = new FileReader()
        reader.onload = () => {
          let parsed = null
          try {
            parsed = JSON.parse(String(reader.result))
          } catch (error) {
            parsed = null
          }
          const restored = parsed === null ? null : importSave(parsed, Date.now())
          if (restored === null) {
            announce(t('action.importBad'), 'warn')
            return
          }
          setConfirmReset(false)
          setPendingImport(restored)
        }
        reader.onerror = () => announce(t('action.importBad'), 'warn')
        reader.readAsText(file)
        event.target.value = ''
      }

      function confirmImport() {
        if (pendingImport === null) return
        commit(pendingImport, true)
        setPendingImport(null)
        setPicker(null)
        announce(t('action.imported'), 'ok')
      }

      function onKeyDown(event) {
        if (event.key !== 'Escape' || picker === null) return
        const index = picker
        setPicker(null)
        focusPlot(index, 'plant')
      }

      // Keep curiosities and hybrids separate, using the same quote as the sale.
      const groups = new Map()
      for (const item of state.basket) {
        const key = itemKey(item)
        if (!groups.has(key)) groups.set(key, { ...item, key, speciesId: item.species, items: [] })
        groups.get(key).items.push(item)
      }
      const basketGroups = [...groups.values()].map(group => ({ ...group, species: SPECIES_BY_ID.get(group.speciesId), count: group.items.length, worth: quoteSale(state, group.items, clock).coins }))

      const previewGroup = basketGroups.find(group => group.key === preview)
      const archive = Object.entries(state.specimens ?? {}).map(([key, item]) => ({
        ...item, key, recorded: true, species: SPECIES_BY_ID.get(item.species),
        count: !item.trait && !item.tint ? Math.max(item.count, state.seen[key] ?? 0) : item.count,
      }))
      for (const [key, count] of Object.entries(state.seen)) {
        const [speciesId, variant] = key.split(':')
        if (count > 0 && !archive.some(entry => entry.key === key)) archive.push({ key, species: SPECIES_BY_ID.get(speciesId), variant, count })
      }
      for (const [key, count] of Object.entries(state.exotics ?? {})) {
        const [speciesId, trait] = key.split(':')
        if (count > 0 && !archive.some(entry => entry.species.id === speciesId && entry.trait === trait)) archive.push({ key: `trait:${key}`, species: SPECIES_BY_ID.get(speciesId), variant: 'base', trait, count })
      }
      for (const [key, count] of Object.entries(state.hybrids ?? {})) {
        const [speciesId, tint] = key.split('~')
        if (count > 0 && !archive.some(entry => entry.species.id === speciesId && entry.tint === tint)) archive.push({ key: `hybrid:${key}`, species: SPECIES_BY_ID.get(speciesId), variant: 'base', tint, count })
      }
      const codexPreviewEntry = archive.find(entry => entry.key === codexPreview) ?? (() => {
        const [speciesId, variant] = (codexPreview ?? '').split(':')
        const species = SPECIES_BY_ID.get(speciesId)
        return species && variant === 'base' ? { key: codexPreview, species, variant: 'base', count: 0 } : undefined
      })()
      function stepCodex(delta) {
        const guide = SPECIES.map(species => `${species.id}:base`)
        const at = Math.max(0, guide.indexOf(`${codexPreviewEntry.species.id}:base`))
        setCodexPreview(guide[(at + delta + guide.length) % guide.length])
      }
      function renderArchive() {
        return h('div', { className: 'fg-archive' },
          h('h3', { className: 'fg-sectionTitle' }, t('trait.title')),
          h('p', { className: 'fg-hint' }, t('trait.note')),
          h('p', { className: 'fg-hint' }, t('trait.boundary')),
          h('details', { className: 'fg-ecoDetails' }, h('summary', null, t('trait.guide')),
            h('div', { className: 'fg-archiveGrid' }, TRAITS.filter(trait=>trait.source).map(trait=>h('article',{key:trait.id,className:'fg-ecoProject'},
              h(FlowerArt,{speciesId:trait.specimen,stage:'bloom',variant:'base',trait:trait.id}),
              h('strong',null,t(`trait.${trait.id}`)),h('p',{className:'fg-hint'},t(`trait.${trait.id}.fact`)),h('p',{className:'fg-hint'},t(`trait.${trait.id}.cause`)),
              h('a',{href:trait.source,target:'_blank',rel:'noopener noreferrer',className:'fg-source'},t('trait.source')))))),
          h('div', { className: 'fg-basket' }, TRAITS.map(trait => h('span', { key: trait.id, className: 'fg-badge', title: t(`trait.${trait.id}.cause`) }, t(`trait.${trait.id}`), ' · ', t(`trait.${trait.id}.clue`)))),
          h('p', { className: 'fg-hint' }, t('hybrid.how')),
          h('div', { className: 'fg-archiveGrid' }, archive.filter(entry => (entry.trait || entry.tint) && guideScene.species.includes(entry.species.id)).map(entry =>
            h('button', { key: entry.key, type: 'button', className: 'fg-archiveEntry', 'data-codex': entry.key, onClick: () => { rememberOpener(); setCodexPreview(entry.key) } },
              h(FlowerArt, { speciesId: entry.species.id, stage: 'bloom', variant: entry.variant, trait: entry.trait, tint: entry.tint, dna: entry.dna }),
              h('span', null, bloomName({ species: entry.species.id, trait: entry.trait, tint: entry.tint }, t)),
              h('span', { className: 'fg-note' }, t(entry.recorded ? 'card.recorded' : 'codex.harvests', { n: entry.count }))))))
      }

      function tend(action, index) {
        tick()
        const before = getState(), now = Date.now()
        const transition = action === 'retain' ? retainAt : action === 'observe' ? observeAt : rebloomAt
        const next = transition(before, state.scene, index, now)
        if (!next) { announce(t('eco.error'), 'warn'); return }
        if(action==='retain')commitDiscovered(before,next,'retain',index);else commit(next,true)
        const plot = next.scenes[state.scene].plots[index]
        announce(t(action === 'retain' ? 'eco.retained' : action === 'observe' ? 'eco.observed' : 'eco.rebloomed', { name: t(`species.${plot.species}`), n: next.study?.[plot.species]?.observations ?? 0 }))
      }

      function renderResidentActions(plot, index, species) {
        const mature = plot.growthMs >= growMsOf(species)
        const wait = plot.observedAt === undefined ? 0 : Math.max(0, plot.observedAt + ECO_OBSERVE_MS - clock)
        const fee = researchFee(state, species), prune = researchFee(state, species, true)
        return h('div', { className: 'fg-residentActions' },
          h('button', { type: 'button', className: 'fg-btn fg-btnSmall', disabled: plot.moisture >= 99.5, onClick: () => water(index) }, t('plot.water')),
          h('button', { type: 'button', className: 'fg-btn fg-btnSmall fg-btnPrimary', disabled: !mature || plot.moisture < 30 || wait > 0 || state.coins < fee, onClick: () => tend('observe',index) }, t('eco.observe',{n:fee})),
          mature && plot.observedAt !== undefined ? h('button', { type: 'button', className: 'fg-btn fg-btnSmall', disabled: state.coins < prune, title: t('eco.rebloomNote'), onClick: () => tend('rebloom',index) }, t('eco.rebloom',{n:prune})) : null,
          h('span', { className: 'fg-hint' }, t('eco.observations',{n:state.study?.[species.id]?.observations??0})),
          wait > 0 ? h('span',{className:'fg-hint'},t('eco.cooldown',{n:formatDuration(wait,t)})) : null,
          plot.moisture < 30 ? h('span',{className:'fg-noteWarn'},t('eco.needWater')) : null)
      }

      /** Use a supply from the hotbar on one plot (drag-and-drop, or click the slot and then the plot). */
      function applyItem(id, index) {
        setTool(null)
        if (id === 'sprinkler') { sprinkle(); return }
        if (id === 'charm') { armCharm(); return }
        tick()
        const before = getState()
        const plot = before.scenes[before.scene]?.plots[index]
        const next = id === 'fertilizer' ? fertilizeAt(before, before.scene, index) : compostAt(before, before.scene, index)
        if (next === null) { announce(t('bar.cannot', { item: t(`item.${id}`) }), 'warn'); return }
        commit(next, true)
        playSound('plant')
        announce(id === 'fertilizer'
          ? t('item.fertilized', { flower: t(`species.${plot.species}`) })
          : t('item.composted', { n: index + 1, soil: Math.round(soilOf(next.scenes[before.scene], index)) }), 'ok')
      }
      function plotDrop(index) {
        return {
          'data-target': tool ? 'true' : undefined,
          onDragOver: event => { if (dragging.current) event.preventDefault() },
          onDrop: event => { const id = dragging.current; dragging.current = null; if (!id) return; event.preventDefault(); applyItem(id, index) },
          onClick: tool ? event => { if (!event.target.closest('button,select,a')) applyItem(tool, index) } : undefined,
        }
      }

      function renderSoil(index) {
        const soil = Math.round(soilOf(slot, index))
        return h('div', { className: 'fg-row', title: t('soil.tip') },
          h('span', { className: soil < 40 ? 'fg-note fg-noteWarn' : 'fg-note' }, t('soil.label', { n: soil })),
          (state.bag.compost ?? 0) > 0 && soil < 100 ? h('button', {
            type: 'button', className: 'fg-btn fg-btnSmall', 'data-action': 'compost',
            onClick: () => {
              tick()
              const next = compostAt(getState(), state.scene, index)
              if (next === null) return
              commit(next, true)
              announce(t('item.composted', { n: index + 1, soil: Math.round(soilOf(next.scenes[state.scene], index)) }))
            },
          }, t('item.compost')) : null,
        )
      }

      function renderSeedPicker(index) {
        const cheapest = sceneSpecies.reduce((min, species) => Math.min(min, species.cost), Infinity)
        const short = state.coins < cheapest
        return h('div', { className: 'fg-seeds' },
          h('div', { className: 'fg-seedsHead' }, t('seed.pick')),
          short ? h('div', { className: 'fg-seedHint' }, t('error.coins')) : null,
          h('div', { className: 'fg-seedGrid' },
            Object.entries(state.seeds ?? {}).filter(([key, count]) => count > 0 && scene.species.includes(key.split('~')[0])).map(([key, count]) => {
              const [form, tint] = key.split('~')
              return h('button', { key, type: 'button', className: 'fg-seed', 'data-action': 'seed', onClick: () => plant(index, form, tint) },
                h('span', { className: 'fg-seedName' }, t('hybrid.name', { form: t(`species.${form}`), tint: t(`species.${tint}`) })),
                h('span', { className: 'fg-seedMeta' }, t('hybrid.free', { n: count })))
            }),
            sceneSpecies.map(species => h('button', {
              key: species.id,
              type: 'button',
              className: 'fg-seed',
              'data-action': 'seed',
              disabled: state.coins < species.cost,
              title: `${t(`species.${species.id}`)} · ${t(`eco.role.${ecoProfile(species.id).role}`)} · ${t('eco.affinity',{name:t(`visitor.${ecoProfile(species.id).visitor}`)})} · ${formatDuration(growMsOf(species), t)}`,
              onClick: () => {
                plant(index, species.id)
              },
            },
            h(BloomDot, { speciesId: species.id, variant: 'base' }),
            h('span', { className: 'fg-seedName' }, t(`species.${species.id}`)),
            h('span', { className: 'fg-seedMeta' }, `${species.cost} · ${shortDuration(growMsOf(species), t)}`),
            )),
          ),
          h('button', {
            type: 'button',
            className: 'fg-btn fg-btnGhost fg-seedCancel',
            'data-action': 'cancel',
            onClick: () => {
              setPicker(null)
              focusPlot(index, 'plant')
            },
          }, t('plot.cancel')),
        )
      }

      function renderPlot(plot, index) {
        const position = index + 1
        if (index >= slot.unlocked) {
          const cost = UNLOCK_COSTS[index] ?? 0
          const next = index === slot.unlocked
          return h('div', {
            key: index,
            className: 'fg-plot',
            'data-state': 'locked',
            'data-plot': index, ...plotDrop(index),
            role: 'group',
            tabIndex: -1,
            'aria-label': `${t('plot.locked')} #${position}`,
          },
          h('div', { className: 'fg-art' }, LockArt()),
          h('div', { className: 'fg-plotHead' },
            h('span', { className: 'fg-species' }, t('plot.locked')),
            h('span', { className: 'fg-stage' }, `#${position}`),
          ),
          h('button', {
            type: 'button',
            className: 'fg-btn fg-btnBlock',
            'data-action': next ? 'unlock' : 'blocked',
            disabled: !next || state.coins < cost,
            onClick: () => {
              unlock(index)
            },
          }, next ? t('plot.unlock', { n: cost }) : t('plot.lockFirst')),
          next && state.coins < cost
            ? h('span', { className: 'fg-note fg-noteWarn' }, t('plot.short', { n: cost - state.coins }))
            : null,
          )
        }

        if (plot === null || plot === undefined) {
          return h('div', {
            key: index,
            className: 'fg-plot',
            'data-state': 'empty',
            'data-plot': index, ...plotDrop(index),
            role: 'group',
            tabIndex: -1,
            'aria-label': `${t('plot.empty')} #${position}`,
          },
          h('div', { className: 'fg-art' }, EmptyArt()),
          h('div', { className: 'fg-plotHead' },
            h('span', { className: 'fg-species' }, t('plot.empty')),
            h('span', { className: 'fg-stage' }, `#${position}`),
          ),
          renderSoil(index),
          picker === index
            ? renderSeedPicker(index)
            : h('button', {
              type: 'button',
              className: 'fg-btn fg-btnBlock',
              'data-action': 'plant',
              onClick: () => {
                setPicker(index)
                focusPlot(index, 'seed')
              },
            }, `+ ${t('plot.plant')}`),
          )
        }

        const species = SPECIES_BY_ID.get(plot.species) ?? SPECIES[0]
        const growMs = growMsOf(species)
        const ratio = Math.min(1, plot.growthMs / growMs)
        const stage = stageOf(plot)
        const bloomed = stage === 'bloom'
        const sprinkled = (slot.sprinklerUntil ?? 0) > clock
        const wet = sprinkled || rainWets || plot.moisture > 0.5
        const percent = Math.round(ratio * 100)
        const moisture = sprinkled || rainWets ? 100 : Math.max(0, Math.round(plot.moisture))
        const dryInMs = (plot.moisture / 100) * (plot.resident ? 45 * 60 * 1000 : growMs * DRY_SHARE)
        const growLeftMs = (growMs - plot.growthMs) / (growth * soilFactor(soilOf(slot, index)))
        const driesFirst = !sprinkled && !rainWets && wet && !bloomed && dryInMs < growLeftMs
        const note = bloomed
          ? (basketFull ? t('basket.fullNote') : t('plot.ready'))
          : !wet
            ? t('plot.dry')
            : driesFirst
              ? t('plot.drying', { n: formatDuration(dryInMs, t) })
              : t('plot.remaining', { n: formatDuration(growLeftMs, t) })
        const worried = !bloomed && (!wet || driesFirst)
        const wetSoil = sprinkled || rainWets || plot.moisture >= 99.5
        const canFeed = !bloomed && (state.bag.fertilizer ?? 0) > 0
        const visitor = visitorAt(state.scene, index, plot, clock, weather, facilityLevel(state, 'hive'), gardenEcology(state, clock).visitorBonus, state)

        return h('div', {
          key: index,
          className: 'fg-plot',
          'data-state': stage,
          'data-variant':plot.variant,
          'data-trait':plot.trait,
          'data-plot': index, ...plotDrop(index),
          'data-paused': wet ? 'false' : 'true',
          role: 'group',
          tabIndex: -1,
          'aria-label': `${bloomName({...plot,variant:plot.variant??'base'},t)} ${t(`stage.${stage}`)}`,
        },
        h('div', { className: 'fg-art' },
          h(FlowerArt, { speciesId: plot.species, stage, variant: (plot.resident || plot.identified) ? plot.variant : plot.tint ? 'base' : plotVariant(species, index), dna: plot.dna, trait: plot.trait, tint: plot.tint }),
          visitor === null ? null : h('button', {
            type: 'button',
            className: 'fg-visitor',
            'data-action': 'greet',
            'data-visitor': visitor.id,
            title: t('visitor.greet', { name: t(`visitor.${visitor.id}`) }),
            'aria-label': t('visitor.greet', { name: t(`visitor.${visitor.id}`) }),
            onClick: () => {
              greet(index)
            },
          }, h(VisitorArt, { id: visitor.id })),
        ),
        h('div', { className: 'fg-plotHead' },
          h('span', { className: 'fg-species' }, t(`species.${species.id}`)),
          h('span', { className: 'fg-stage' }, t(`stage.${stage}`)),
        ),
        plot.trait ? h('span',{className:'fg-badge fg-badgeWarn'},'✦ ',t(`trait.${plot.trait}`)) : plot.variant==='hidden' ? h('span',{className:'fg-badge fg-badgeWarn'},'✦ ',t('variant.hidden')) : null,
        renderSoil(index),
        plot.resident ? h('span', { className: 'fg-badge fg-badgeOk' }, t('eco.resident'), ' · ', t('eco.history', { n: plot.careCount ?? 0, cycles: plot.reblooms ?? 0 })) : null,
        plot.resident ? renderResidentActions(plot, index, species) : bloomed ? h('button', { type: 'button', className: 'fg-btn fg-btnPrimary', onClick: () => tend('retain', index) }, t('eco.retain')) : null,
        plot.tint ? h('span', { className: 'fg-badge' }, t('hybrid.name', { form: t(`species.${plot.species}`), tint: t(`species.${plot.tint}`) })) : null,
        h(CrossHint, { slot, index, t }),
        plot.dried === true && !bloomed
          ? h('span', { className: 'fg-badgeWarn fg-badge' }, t('plot.driedBadge'))
          : null,
        plot.pollinated === true
          ? h('span', { className: 'fg-badgeOk fg-badge' }, t('plot.pollinated'))
          : null,
        h('div', {
          className: 'fg-meter',
          role: 'progressbar',
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': percent,
          'aria-label': `${bloomName({...plot,variant:plot.variant??'base'},t)} ${t(`stage.${stage}`)}`,
        }, h('div', { className: 'fg-meterFill', style: { width: `${percent}%` } })),
        h('div', { className: 'fg-row' },
          h('span', { className: worried ? 'fg-note fg-noteWarn' : 'fg-note', title: note }, note),
          h('span', { className: 'fg-note fg-noteWet' }, t('plot.wetShort', { n: moisture })),
        ),
        h('div', {
          className: 'fg-meter fg-meterWet',
          'data-low': moisture < 25 ? 'true' : 'false',
          role: 'progressbar',
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': moisture,
          'aria-label': t('plot.moisture', { n: moisture }),
        }, h('div', { className: 'fg-meterFill', style: { width: `${moisture}%` } })),
        h('div', { className: 'fg-actions' },
          bloomed
            ? h('button', {
              type: 'button',
              className: 'fg-btn fg-btnPrimary fg-btnGrow',
              'data-action': 'harvest',
              disabled: basketFull,
              title: basketFull ? t('basket.full') : undefined,
              onClick: () => {
                harvest(index, plot.resident === true)
              },
            }, plot.resident ? t(armed === `retire:${state.scene}:${index}` ? 'eco.retireConfirm' : 'eco.retire') : t('plot.harvest'))
            : [
              h('button', {
                key: 'water',
                type: 'button',
                className: 'fg-btn fg-btnGrow',
                'data-action': 'water',
                disabled: wetSoil,
                title: wetSoil ? t('plot.watered') : undefined,
                onClick: () => {
                  water(index)
                },
              }, t('plot.water')),
              canFeed
                ? h('button', {
                  key: 'feed',
                  type: 'button',
                  className: 'fg-btn fg-btnGrow',
                  'data-action': 'feed',
                  title: t('item.fertilizer.note'),
                  onClick: () => {
                    feed(index, species.id)
                  },
                }, t('item.fertilize'))
                : null,
            ],
        ),
        )
      }

      function renderOrder(order) {
        const ready = orderReady(state, order)
        const goldOnly = orderNeedsGold(state, order)
        return h('div', { key: order.id, className: 'fg-order', 'data-ready': ready ? 'true' : 'false' },
          h('div', { className: 'fg-orderHead' },
            h('span', { className: 'fg-orderId' }, t('order.head', { id: order.id })),
            h('span', { className: 'fg-orderReward' }, t('order.reward', { coins: order.coins, xp: order.xp })),
          ),
          goldOnly ? h('p', { className: 'fg-orderNote' }, t('order.goldOnly')) : null,
          h('div', { className: 'fg-orderItems' },
            order.items.map((item, itemIndex) => {
              const have = basketPlainCount(state, item.species)
              return h('span', {
                key: itemIndex,
                className: 'fg-orderItem',
                'data-have': have >= item.count ? 'true' : 'false',
              },
              h(BloomDot, { speciesId: item.species }),
              t('order.item', { flower: t(`species.${item.species}`), n: item.count }),
              h('span', { className: 'fg-orderHave' }, `${Math.min(have, item.count)}/${item.count}`),
              )
            }),
          ),
          h('button', {
            type: 'button',
            className: ready ? 'fg-btn fg-btnPrimary' : 'fg-btn',
            disabled: !ready,
            onClick: () => {
              deliver(order.id)
            },
          }, ready ? t('order.deliver') : t('order.missing')),
        )
      }

      function renderCodexCard(species) {
        const variants = ['base', 'alt', 'hidden'].filter(variant => variant !== 'alt' || species.alt !== undefined)
        const discoveredVariants = variants.filter(variant => (state.seen[`${species.id}:${variant}`] ?? 0) > 0)
        const showcase = discoveredVariants.includes('hidden')
          ? 'hidden'
          : discoveredVariants[0] ?? 'base'
        const known = discoveredVariants.length > 0
        const representative=state.specimens?.[`${species.id}:${showcase}`]
        return h('div', {
          key: species.id,
          className: 'fg-codexCard',
          'data-seen': known ? 'true' : 'false',
          'data-spirit': showcase === 'hidden' ? 'true' : 'false',
        },
          h('button', {
              type: 'button',
              className: 'fg-codexArt fg-codexArtBtn',
              style: known ? undefined : { filter: 'grayscale(1)', opacity: 0.55 },
              'data-codex': `${species.id}:${showcase}`,
              'aria-expanded': codexPreview === `${species.id}:${showcase}` ? 'true' : 'false',
              'aria-controls': codexPreview === `${species.id}:${showcase}` ? 'fg-codex-preview' : undefined,
              'aria-label': t('preview.open', { flower: `${t(`species.${species.id}`)} · ${t(`variant.${showcase}`)}` }),
              onClick: () => {
                showCodexEntry(species.id, showcase)
              },
            },
            h(FlowerArt, { speciesId: species.id, stage: 'bloom', variant: showcase, dna:representative?.dna, trait:representative?.trait, tint:representative?.tint }),
            ),
          h('div', { className: 'fg-codexBody' },
            h('div', { className: 'fg-codexName' }, t(`species.${species.id}`)),
            h('div', { className: 'fg-note' }, t(`eco.role.${ecoProfile(species.id).role}`)),
            known ? h('div', { className: 'fg-codexLatin' }, t(`latin.${species.id}`)) : null,
            h('div', { className: 'fg-codexMeaning' }, known ? t(`codex.${species.id}`) : t('codex.undiscovered')),
            h('div', { className: 'fg-codexVariants' },
              variants.map(variant => {
                const count = state.seen[`${species.id}:${variant}`] ?? 0
                const found = count > 0
                return h(found ? 'button' : 'span', {
                  key: variant,
                  type: found ? 'button' : undefined,
                  className: found ? 'fg-variant fg-variantBtn' : 'fg-variant',
                  'data-found': found ? 'true' : 'false',
                  'data-variant': variant,
                  'data-codex': found ? `${species.id}:${variant}` : undefined,
                  'aria-expanded': found ? (codexPreview === `${species.id}:${variant}` ? 'true' : 'false') : undefined,
                  'aria-controls': found && codexPreview === `${species.id}:${variant}` ? 'fg-codex-preview' : undefined,
                  'aria-label': found ? t('preview.open', { flower: `${t(`species.${species.id}`)} · ${t(`variant.${variant}`)}` }) : undefined,
                  onClick: found ? () => { showCodexEntry(species.id, variant) } : undefined,
                },
                variant === 'hidden'
                  ? h('span', { className: 'fg-variantArt', style: found ? undefined : { opacity: 0.6 } },
                    h(FlowerArt, { speciesId: species.id, stage: 'bloom', variant: 'hidden' }),
                    )
                  : h(BloomDot, { speciesId: species.id, variant }),
                h('span', { className: 'fg-variantName' },
                  found ? t(`variant.${variant}`) : (variant === 'hidden' ? t('codex.hiddenUnknown') : t(`variant.${variant}`))),
                found ? h('span', { className: 'fg-variantCount' }, `×${count}`) : null,
                )
              }),
            ),
          ),
        )
      }

      const sceneOrder = SCENES.map(ground=>ground.id)
      // Plots the water-all button would actually change.
      const thirsty = sprinklerLeftMs > 0 || rainWets ? 0 : slot.plots.filter(plot => {
        if (plot === null || plot === undefined || plot.moisture >= 99.5) return false
        const species = SPECIES_BY_ID.get(plot.species)
        return species !== undefined && (plot.resident || plot.growthMs < growMsOf(species))
      }).length

      function renderGuest(visitor) {
        const count = state.visitors[visitor.id] ?? 0
        const met = count > 0
        const where = [
          visitor.scenes.map(id => t(`scene.${id}`)).join(' / '),
          t(`visitor.when.${visitor.when}`),
          visitor.dry === true ? t('visitor.dry') : null,
        ].filter(Boolean).join(' · ')
        return h('button', { type: 'button', key: visitor.id, className: 'fg-guest', 'data-guest': visitor.id, 'data-met': met ? 'true' : 'false', 'aria-label': t('guest.book') + ' · ' + t(`visitor.${visitor.id}`), onClick: () => openGuest(visitor.id) },
          h('span', { className: 'fg-guestArt' }, h(VisitorArt, { id: visitor.id })),
          h('div', { className: 'fg-guestBody' },
            h('div', { className: 'fg-guestName' },
              met ? t(`visitor.${visitor.id}`) : t('visitor.unknown'),
              met ? h('span', { className: 'fg-itemOwn' }, `×${count}`) : null,
              met ? h('span', { className: 'fg-hearts' }, '♥'.repeat(affinityLevel(state, visitor.id)) + '♡'.repeat(AFFINITY_LEVELS.length - affinityLevel(state, visitor.id))) : null,
              visitor.special ? h('span', { className: 'fg-badge' }, t('visitor.special')) : null,
            ),
            h('div', { className: 'fg-guestWhere', title: where }, where),
          ),
        )
      }

      function renderAchievement(entry) {
        const value = Math.min(entry.target, achievementValue(state, entry.metric))
        const claimed = state.claimed[entry.id] === true
        const ready = !claimed && value >= entry.target
        return h('div', {
          key: entry.id,
          className: 'fg-ach',
          'data-state': claimed ? 'claimed' : ready ? 'ready' : 'open',
        },
        h('div', { className: 'fg-achBody' },
          h('div', { className: 'fg-achName' }, t(`ach.${entry.id}.name`)),
          h('div', { className: 'fg-achDesc' }, t(`ach.${entry.id}.desc`)),
          h('div', { className: 'fg-row' },
            h('div', {
              className: 'fg-meter fg-achMeter',
              role: 'progressbar',
              'aria-valuemin': 0,
              'aria-valuemax': entry.target,
              'aria-valuenow': value,
              'aria-label': t(`ach.${entry.id}.name`),
            }, h('div', { className: 'fg-meterFill', style: { width: `${(value / entry.target) * 100}%` } })),
            h('span', { className: 'fg-note fg-noteWet' }, t('ach.count', { n: value, total: entry.target })),
          ),
        ),
        claimed
          ? h('span', { className: 'fg-itemMax' }, t('ach.claimed'))
          : ready
            ? h('button', {
              type: 'button',
              className: 'fg-btn fg-btnSmall fg-btnPrimary',
              'data-action': 'claim',
              onClick: () => {
                claim(entry.id)
              },
            }, t('ach.claim', { n: entry.coins }))
            : h('span', { className: 'fg-itemMax' }, t('ach.reward', { n: entry.coins })),
        )
      }
      const sceneFound = new Map(sceneOrder.map(id => {
        const found = sceneOf(id).species.filter(speciesId => ['base', 'alt', 'hidden']
          .some(variant => (state.seen[`${speciesId}:${variant}`] ?? 0) > 0)).length
        return [id, found]
      }))

      return h('div', { className: 'fg-view', ref: rootRef, onKeyDown: onKeyDown, style: {'--fg-font-size':`${ui.fontSize}px`,'--fg-font-family':fontFamilies[ui.font]}, 'data-tab':activeTab, 'data-scene':state.scene },
        h('style', { key: 'fg-style' }, CSS),
        h('div', { className: 'fg-topbar' },
          h('header', { className: 'fg-header' },
            h('div', { className: 'fg-titleBlock' },
              h('h2', { className: 'fg-title' }, t('view.title')),
              h('p', { className: 'fg-sub' }, t('header.subtitle')),
            ),
            h('div', { className: 'fg-stats' },
              h('span', { className: 'fg-chip' },
                CoinGlyph(),
                h('span', { className: 'fg-chipValue' }, String(state.coins)),
                h('span', { className: 'fg-chipKey' }, t('stat.coins')),
              ),
              h('span', { className: 'fg-chip', title: `${t('stat.level')} ${level} · ${xpInLevel}/${XP_PER_LEVEL}` },
                h('span', { className: 'fg-chipValue' }, t('stat.levelValue', { n: level })),
                h('span', {
                  className: 'fg-xpBar',
                  role: 'progressbar',
                  'aria-valuemin': 0,
                  'aria-valuemax': XP_PER_LEVEL,
                  'aria-valuenow': xpInLevel,
                  'aria-label': `${t('stat.level')} ${level}`,
                },
                h('span', { className: 'fg-xpFill', style: { width: `${(xpInLevel / XP_PER_LEVEL) * 100}%` } }),
                ),
              ),
              h('span', { className: 'fg-chip', title: t('stat.harvested') },
                h('span', { className: 'fg-chipValue' }, String(state.harvested)),
                h('span', { className: 'fg-chipKey' }, t('stat.harvested')),
              ),
              featured === null ? null : h('span', {
                className: 'fg-chip fg-chipMarket',
                title: t('market.note', { flower: t(`species.${featured}`), n: marketPercent }),
              },
              h(BloomDot, { speciesId: featured }),
              h('span', { className: 'fg-chipKey' }, t('market.title')),
              h('span', { className: 'fg-chipValue' }, t(`species.${featured}`)),
              h('span', { className: 'fg-chipKey' }, t('market.bonus', { n: marketPercent })),
              ),
              h('time',{className:'fg-liveClock',dateTime:new Date(clock).toISOString(),title:t('clock.note')},
                h('strong',null,clockInfo.time),h('span',null,t(`clock.${clockInfo.period}`)),h('small',null,clockInfo.date,' · ',clockInfo.zone)),
              h('span', { className: 'fg-chip', 'data-weather': weather },
                h(WeatherGlyph, { kind: weather }),
                h('span', { className: 'fg-chipValue' }, t(`weather.${scene.id}.${weather}`)),
                h('span', { className: 'fg-chipKey' }, t('weather.left', { n: weatherLeft })),
              ),
            ),
          ),

          h('div',{className:'fg-toolbar'},
            h('div',{className:'fg-tabs',role:'tablist','aria-label':t('tabs.label')},GARDEN_TABS.map(id=>h('button',{
              key:id,id:`fg-tab-${id}`,type:'button',role:'tab','aria-selected':activeTab===id,'aria-controls':`fg-panel-${id}`,tabIndex:activeTab===id?0:-1,
              className:'fg-tab',onClick:()=>selectTab(id),onKeyDown:event=>tabKeys(event,id)},h('span',{className:'fg-tabIcon','aria-hidden':true},TAB_ICONS[id]),t(`tabs.${id}`),id==='basket'?` ${state.basket.length}/${capacity}`:id==='orders'&&state.orders.some(order=>orderReady(state,order))?' •':null))),
            h('button',{type:'button',className:'fg-btn fg-btnSmall',title:t('mini.note'),onClick:openMini},t('mini.open')),
            h('button',{type:'button',className:'fg-btn fg-btnSmall fg-bagButton',onClick:()=>{rememberOpener();setInventoryOpen(true)}},t('inventory.open',{n:inventoryCount(state)+state.basket.length})),
            (state.discoveries??[]).length?h('button',{type:'button',className:'fg-btn fg-btnSmall fg-latestDiscovery',onClick:()=>{rememberOpener();setDiscovery(state.discoveries[state.discoveries.length-1])}},t('discovery.return')):null,
            h('label',{className:'fg-quickSize'},t('settings.size'),h('select',{'aria-label':t('settings.size'),value:ui.fontSize,onChange:event=>updateUi({fontSize:Number(event.target.value)})},[13,15,17,19].map(size=>h('option',{key:size,value:size},`${size}px`)))))),
        h('div',{className:'fg-scroll',ref:scrollRef},
          away && activeTab === 'garden' ? h(AwayCard, { report: away, t, onClose: () => { clearAway(); setAway(null) } }) : null,
          activeTab === 'garden' ? h(Shelf, { state, t, compact: true }) : null,
          h(EventBanner, { state, t, clock, hidden: activeTab !== 'garden', onJoin: (next, text) => { commit(next, true); playSound('gold'); announce(text, 'gold') } }),
          h(PlayStrip, { state, t, clock, hidden: activeTab !== 'garden', onChange: commitReward }),
          h('div', { className: 'fg-scenes', hidden: activeTab !== 'garden', role: 'group', 'aria-label': t('plot.section') },
            sceneOrder.map(id => {
              const target = sceneOf(id)
              const targetSlot = state.scenes[id]
              const isOpen = targetSlot !== undefined && targetSlot.unlocked > 0
              const activeScene = id === state.scene
              const confirming = armed === `scene:${id}`
              return h('button', {
                key: id,
                type: 'button',
                'aria-pressed': activeScene ? 'true' : 'false',
                'aria-label': isOpen
                  ? `${t(`scene.${id}`)} · ${t('codex.progress', { n: sceneFound.get(id) ?? 0, total: CODEX_ENTRIES.length })}`
                  : `${t(`scene.${id}`)} · ${t('scene.locked', { n: target.cost })}`,
                'data-scene': id,
                'data-active': activeScene ? 'true' : 'false',
                'data-locked': isOpen ? 'false' : 'true',
                className: confirming ? 'fg-sceneChip fg-sceneChipArmed' : 'fg-sceneChip',
                style: { borderColor: target.edge, background: target.tint },
                onClick: () => {
                  openScene(id)
                },
              },
              h('span', { className: 'fg-sceneName' }, t(`scene.${id}`)),
              isOpen
                ? h('span', { className: 'fg-sceneMeta' }, `${sceneFound.get(id) ?? 0}/${target.species.length}`)
                : h('span', { className: 'fg-sceneMeta' }, confirming
                  ? t('scene.confirm', { n: target.cost })
                  : t('scene.locked', { n: target.cost })),
              )
            }),
          ),

          h('div', { className: 'fg-tipRow', hidden: activeTab !== 'garden' },
            h('span', { className: 'fg-hintWeather' }, weatherNote),
            h(SeasonChip, { t, clock, sceneId: state.scene }),
            h(InfoTip, { t, lines: [t('hint.body'), t('soil.tip'), t('hybrid.how')] }),
          ),
          h('div', {
            className: 'fg-toast',
            role: 'status',
            'aria-live': 'polite',
            'data-tone': toast.tone,
            'data-show': toast.text === '' ? 'false' : 'true',
          },
          toast.tone === 'gold' && toast.species !== null
            ? h('span', { className: 'fg-toastArt' },
              h(FlowerArt, { speciesId: toast.species, stage: 'bloom', variant: 'hidden' }),
              )
            : null,
          toast.text,
          ),

          panel('garden',
 h('section', {className:'fg-section fg-ground fg-landscape','data-period':clockInfo.period,'data-scene':scene.id,style:{borderColor:scene.edge}},
           h('div',{className:'fg-gardenBackdrop',style:{backgroundColor:PANORAMA_GROUND[scene.id],backgroundImage:clockInfo.period==='night'?'linear-gradient(#08101dcc,#08101dcc)':'linear-gradient(#20363e45,#20363e45)'}},h(ScenePanorama,{sceneId:scene.id,period:clockInfo.period,weather,garden:true})),
           h('div',{className:'fg-gardenContent'},
           h('header',{className:'fg-gardenHeading'},
             h('div',{className:'fg-landscapeCaption'},h('span',null,t(`scene.${scene.id}`)),h('strong',null,t(`clock.${clockInfo.period}`)),h('span',null,t(`weather.${scene.id}.${weather}`))),
             h('div',{className:'fg-landscapeTime'},h('strong',null,clockInfo.time),h('span',null,clockInfo.date,' · ',clockInfo.zone))),
           h('div',{className:'fg-gardenBar'},
             h(QuickBar, { state, t, tool, onPick: id => setTool(current => (current === id ? null : id)), onUse: id => applyItem(id, 0), onDragItem: id => { dragging.current = id } }),
             sprinklerLeftMs > 0 ? h('span', { className: 'fg-sectionOk' }, t('item.sprinklerLeft', { n: formatDuration(sprinklerLeftMs, t) })) : null,
             thirsty > 1 ? h('button', { type: 'button', className: 'fg-btn fg-btnSmall fg-headAction', 'data-action': 'waterAll', onClick: waterEvery }, t('plot.waterAll', { n: thirsty })) : null),
           h('div', { className: 'fg-grid' }, slot.plots.map(renderPlot)),
           ))
          ),
          panel('basket',
h(WantedBoard, { state, t, clock, onChange: commitReward }),
h('section', { className: 'fg-section' },
            h('div', { className: 'fg-sectionHead' },
              h('h3', { className: 'fg-sectionTitle', 'data-focus': 'basket', tabIndex: -1 }, t('basket.title')),
              h('span', { className: 'fg-sectionMeta' }, t('basket.capacity', { n: state.basket.length, max: capacity })),
              basketFull ? h('span', { className: 'fg-sectionWarn' }, t('basket.full')) : null,
              basketGroups.length > 0
                ? h('button', {
                  type: 'button',
                  className: armed === 'all:all' ? 'fg-btn fg-btnDanger fg-btnSmall' : 'fg-btn fg-btnGhost fg-btnSmall',
                  'aria-label': t('basket.sellAll', { n: basketValueNow }),
                  onClick: () => {
                    sell()
                  },
                }, armed === 'all:all' ? t('basket.confirm', { n: basketValueNow }) : t('basket.sellAll', { n: basketValueNow }))
                : null,
            ),
            basketGroups.length > 0 ? h(InfoTip, { t, lines: [t('basket.pricing')] }) : null,
            basketGroups.length === 0
              ? h('p', { className: 'fg-empty' }, t('basket.empty'))
              : [
                h('div', { className: 'fg-basket', key: 'chips' },
                  basketGroups.map(group => {
                    const key = group.key
                    const open = preview === key
                    return h('button', {
                      key,
                      type: 'button',
                      className: open ? 'fg-bloom fg-bloomOpen' : 'fg-bloom',
                      'data-variant': group.variant,
                      'data-basket': key,
                      'aria-expanded': open ? 'true' : 'false',
                      'aria-controls': open ? 'fg-basket-preview' : undefined,
                      'aria-label': t('basket.view', {
                        flower: `${bloomName(group.items[0], t)} · ${t(`variant.${group.variant}`)}`,
                      }),
                      onClick: () => {
                        showBloom(group.key)
                      },
                    },
                    (group.variant === 'hidden' || group.trait || group.tint)
                      ? h('span', { className: 'fg-bloomArt' },
                        h(FlowerArt, { speciesId: group.species.id, stage: 'bloom', variant: group.variant, dna: group.dna, trait: group.trait, tint: group.tint }),
                        )
                      : h(BloomDot, { speciesId: group.species.id, variant: group.variant }),
                    h('span', { className: 'fg-bloomName' }, bloomName(group.items[0], t)),
                    group.variant === 'hidden' ? h('span', { className: 'fg-goldTag' }, t('variant.goldTag')) : null,
                    group.species.id === featured ? h('span', { className: 'fg-marketTag' }, t('market.tag')) : null,
                    glutSteps(state, group.species.id, clock) > 0 ? h('span', {
                      className: 'fg-noteWarn',
                      title: t('glut.note', { n: Math.round((1 - glutFactor(glutSteps(state, group.species.id, clock))) * 100) }),
                    }, t('glut.tag', { n: Math.round((1 - glutFactor(glutSteps(state, group.species.id, clock))) * 100) })) : null,
                    h('span', { className: 'fg-bloomCount' }, `×${group.count}`),
                    h('span', { className: 'fg-bloomPrice' }, `+${group.worth}`),
                    )
                  }),
                ),
                previewGroup === undefined ? null : h(BloomPreview, {
                  key: 'preview',
                  id: 'fg-basket-preview',
                  speciesId: previewGroup.species.id,
                  variant: previewGroup.variant,
                  dna: previewGroup.dna, trait: previewGroup.trait, tint: previewGroup.tint,
                  individuals: previewGroup.items, onSellOne: sellOne, quoteOne: item => quoteSale(state, [item], clock).coins,
                  t,
                  meta: [
                    `×${previewGroup.count}`,
                    t('basket.first', { n: quoteSale(state, [previewGroup.items[0]], clock).coins }),
                    previewGroup.species.id === featured ? `${t('market.title')} · ${t('market.bonus', { n: marketPercent })}` : null,
                    t('basket.total', { n: previewGroup.worth }),
                  ],
                  worth: previewGroup.worth,
                  armed: armed === previewGroup.key,
                  onSell: () => {
                    sell(previewGroup.key)
                  },
                  onClose: () => {
                    const key = previewGroup.key
                    setPreview(null)
                    setArmed(null)
                    focusTarget(`[data-basket="${key}"]`)
                  },
                }),
              ],
          ),
          ),
          panel('studio',
          h(ArrangeTable, { state, t, clock, onChange: commitReward }),
          h(Workshop, { state, t, clock, onChange: commitReward })
          ),
          panel('album',
          h(Album, { state, t, onChange: commitReward })
          ),
          panel('orders',
h('section', { className: 'fg-section' },
            h('div', { className: 'fg-sectionHead' },
              h('h3', { className: 'fg-sectionTitle', 'data-focus': 'orders', tabIndex: -1 }, t('order.title')),
            ),
            state.orders.length === 0
              ? h('p', { className: 'fg-empty' }, t('order.empty'))
              : h('div', { className: 'fg-orders' }, state.orders.map(renderOrder)),
          ),
h(ExpeditionBoard, { state, t, clock, onChange: commitReward }),
h(SpecialCommissionBoard, { state, t, clock, onChange: commitReward, onSpecies: openGuide, onVisitor: openGuest })
          ),
          panel('ecology',
h(GardenEcology, { state, t, clock, onChange: commitReward, onSpecies: openGuide })
          ),
          panel('show',
h(GardenActivities, { state, t, clock, onChange: commitReward }),
h(Contest, { state, t, clock, onChange: commitReward })
          ),
          panel('shop',
h(FundBoard, { state, t, onChange: commitReward }),
h('section',{className:'fg-section fg-inventorySection'},h('h2',{className:'fg-sectionTitle'},t('inventory.title')),h(InventoryContents,{state,t})),
h('section', { className: 'fg-section' },
            h('div', { className: 'fg-sectionHead' },
              h('h3', { className: 'fg-sectionTitle' }, t('item.section')),
              state.charm ? h('span', { className: 'fg-sectionOk' }, t('item.charmReady')) : null,
            ),
            h('div', { className: 'fg-items' }, ITEMS.map(item => {
              const own = item.kind === 'upgrade' ? (state.basketLevel ?? 0) : (state.bag[item.id] ?? 0)
              const maxed = item.kind === 'upgrade' && own >= item.maxLevel
              const affordable = state.coins >= item.price
              return h('div', { key: item.id, className: 'fg-item' },
                h('span', { className: 'fg-itemIcon' }, h(ItemIcon, { id: item.id })),
                h('div', { className: 'fg-itemBody' },
                  h('div', { className: 'fg-itemName' },
                    t(`item.${item.id}`),
                    item.kind === 'upgrade'
                      ? h('span', { className: 'fg-itemOwn' }, t('item.level', { n: own }))
                      : own > 0 ? h('span', { className: 'fg-itemOwn' }, t('item.owned', { n: own })) : null,
                  ),
                  h('div', { className: 'fg-itemNote', title: t(`item.${item.id}.note`) }, t(`item.${item.id}.note`)),
                ),
                h('div', { className: 'fg-itemActions' },
                  maxed
                    ? h('span', { className: 'fg-itemMax' }, t('item.maxed'))
                    : h('button', {
                      type: 'button',
                      className: 'fg-btn fg-btnSmall',
                      disabled: !affordable,
                      title: affordable ? undefined : t('item.short', { n: item.price - state.coins }),
                      onClick: () => {
                        buy(item.id)
                      },
                    }, `${t('item.buy')} · ${item.price}`),
                  item.id === 'sprinkler' && own > 0
                    ? h('button', {
                      type: 'button',
                      className: 'fg-btn fg-btnSmall fg-btnPrimary',
                      onClick: sprinkle,
                    }, t('item.useGround'))
                    : null,
                  item.id === 'charm' && own > 0 && state.charm !== true
                    ? h('button', {
                      type: 'button',
                      className: 'fg-btn fg-btnSmall fg-btnPrimary',
                      onClick: armCharm,
                    }, t('item.useCharm'))
                    : null,
                ),
              )
            })),
          )
          ),
          panel('flowers',
 h(BreedingGoals, { state, t }),
 h('section',{className:'fg-section'},h('h2',{className:'fg-sectionTitle'},t('regions.title')),h('p',{className:'fg-hint'},t('regions.note')),
 h('div',{className:'fg-regionCards'},SCENES.map(region=>h('article',{key:region.id,className:'fg-regionCard','data-current':guideRegion===region.id},
   h(ScenePanorama,{sceneId:region.id,period:clockInfo.period,weather:'clear'}),h('h3',null,t(`scene.${region.id}`)),
   (state.scenes[region.id]?.unlocked??0)===0?h('span',{className:'fg-note'},t('regions.locked',{n:region.cost})):null,
   h('button',{type:'button',className:'fg-btn',onClick:()=>{setGuideRegion(region.id);setCodexOpen(true)}},t('regions.flowers',{n:region.species.length})),
   h('button',{type:'button',className:'fg-btn fg-btnGhost',onClick:()=>{selectTab('garden',true);if(state.scenes[region.id].unlocked>0)openScene(region.id);else setArmed(`scene:${region.id}`)}},t('regions.grow')))))),
h('section', { className: 'fg-section' },
            h('button', {
              type: 'button',
              className: 'fg-codexToggle',
              id: 'fg-codex-toggle',
              'aria-expanded': codexOpen ? 'true' : 'false',
              'aria-controls': 'fg-codex',
              onClick: () => {
                setCodexOpen(value => !value)
              },
            },
            h('span', { className: 'fg-sectionTitle' }, `${t('codex.title')} · ${t(`scene.${guideScene.id}`)}`),
            h('span', { className: 'fg-sectionMeta' }, `${t('codex.progress', { n: discovered, total: totalEntries })} · ${t('codex.speciesProgress', { n: grownCount, total: SPECIES.length })}`),
            h('span', { className: 'fg-codexTeaser' }, t('codex.teaser')),
            h('span', { className: 'fg-caret', 'data-open': codexOpen ? 'true' : 'false' }, '▾'),
            ),
            codexOpen
              ? h('div', { className: 'fg-codex', id: 'fg-codex', role: 'region', 'aria-labelledby': 'fg-codex-toggle' },
                h('div', { className: 'fg-codexNotes' },
                  h('p', { className: 'fg-codexHint' }, t('codex.hint')),
                  h('p', { className: 'fg-codexHint' }, t('codex.altRule')),
                  h('p', { className: 'fg-codexHint' }, t('codex.favoured', {
                    w: t(`weather.${guideScene.id}.${guideScene.rainWets ? 'rain' : 'clear'}`),
                  }), ' · ', t('codex.otherGround')),
                ),
                guideScene.species.map(id=>renderCodexCard(SPECIES_BY_ID.get(id))),
                renderArchive(),

              )
              : null,
          )
          ),
          panel('visitors',
h('section', { className: 'fg-section' },
            h('div', { className: 'fg-sectionHead' },
              h('h3', { className: 'fg-sectionTitle' }, t('guest.book')),
              h('span', { className: 'fg-sectionMeta' }, t('ach.count', { n: metKinds, total: VISITORS.length })),
            ),
            h(AffinityBoard, { state, t, onChange: commitReward }),
            h(CompanionBoard, { state, t, onChange: commitReward }),
            h('p', { className: 'fg-empty' }, t('guest.boundary')),
            h('div', { className: 'fg-guests' }, VISITORS.map(renderGuest)),
          )
          ),
          panel('settings',
h('section',{className:'fg-section'},h('h2',{className:'fg-sectionTitle'},t('discovery.history')),h('p',{className:'fg-hint'},t('discovery.historyNote')),
 (state.discoveries??[]).length?h('div',{className:'fg-discoveryHistory'},state.discoveries.slice().reverse().map(entry=>h('button',{type:'button',key:entry.id,className:'fg-btn',onClick:()=>{rememberOpener();setDiscovery(entry)}},new Date(entry.at).toLocaleString(),' · ',entry.items.map(item=>item.type==='visitor'?t(`visitor.${item.visitor}`):bloomName(item,t)).join(' / ')))):h('p',{className:'fg-hint'},t('discovery.empty'))),
h(LegacyBoard, { state, t, onStart: () => { const next = startLegacy(getState(), Date.now()); if (next === null) return; commit(next, true); playSound('gold'); announce(t('legacy.done'), 'gold') } }),
h('section',{className:'fg-section fg-settings'},
 h('h2',{className:'fg-sectionTitle'},t('settings.title')),
 h('label',{className:'fg-settingRow'},t('settings.size'),h('select',{value:ui.fontSize,onChange:event=>updateUi({fontSize:Number(event.target.value)}),className:'fg-btn'},[13,15,17,19].map(size=>h('option',{key:size,value:size},`${size}px`)))),
 h('label',{className:'fg-settingRow'},t('settings.font'),h('select',{value:ui.font,onChange:event=>updateUi({font:event.target.value}),className:'fg-btn'},['system','serif','rounded'].map(font=>h('option',{key:font,value:font},t(`settings.${font}`))))),
 h('label',{className:'fg-settingRow'},t('settings.sound'),h('input',{type:'checkbox',checked:ui.sound,onChange:event=>updateUi({sound:event.target.checked})})),
 h('p',{className:'fg-fontPreview'},t('settings.preview')),h('p',{className:'fg-hint'},t('settings.note'))),
h('section', { className: 'fg-section' },
            h('button', {
              type: 'button',
              className: 'fg-codexToggle',
              id: 'fg-ach-toggle',
              'aria-expanded': achOpen ? 'true' : 'false',
              'aria-controls': 'fg-ach',
              onClick: () => {
                setAchOpen(value => !value)
              },
            },
            h('span', { className: 'fg-sectionTitle' }, t('ach.title')),
            h('span', { className: 'fg-sectionMeta' }, t('ach.count', {
              n: ACHIEVEMENTS.filter(entry => state.claimed[entry.id] === true).length,
              total: ACHIEVEMENTS.length,
            })),
            readyAchievements.length > 0
              ? h('span', { className: 'fg-sectionOk' }, t('ach.ready', { n: readyAchievements.length }))
              : null,
            h('span', { className: 'fg-caret', 'data-open': achOpen ? 'true' : 'false' }, '▾'),
            ),
            // Collapsed, the list still surfaces whatever is waiting to be collected.
            achOpen || readyAchievements.length > 0
              ? h('div', { className: 'fg-achs', id: 'fg-ach', role: 'region', 'aria-labelledby': 'fg-ach-toggle' },
                (achOpen ? ACHIEVEMENTS : readyAchievements).map(renderAchievement))
              : null,
          ),
h('footer', { className: 'fg-footer' },
            h('div', { className: 'fg-save' },
              h('button', { type: 'button', className: 'fg-btn fg-btnGhost', id: 'fg-export', onClick: exportFile }, t('action.export')),
              h('button', { type: 'button', className: 'fg-btn fg-btnGhost', id: 'fg-import', onClick: pickSaveFile }, t('action.import')),
              h('input', {
                ref: saveInput,
                type: 'file',
                accept: 'application/json,.json',
                className: 'fg-fileInput',
                tabIndex: -1,
                'aria-hidden': 'true',
                onChange: readSaveFile,
              }),
            ),
            pendingImport === null
              ? null
              : h('div', { className: 'fg-savePending', id: 'fg-import-confirm', role: 'alertdialog', 'aria-label': t('action.importReview') },
                h('span', { className: 'fg-saveAsking' }, t('action.importReview')),
                h('button', { type: 'button', className: 'fg-btn fg-btnDanger', id: 'fg-import-confirm-yes', onClick: confirmImport }, t('action.importYes')),
                h('button', { type: 'button', className: 'fg-btn fg-btnGhost', id: 'fg-import-cancel', onClick: () => setPendingImport(null) }, t('action.importNo')),
              ),
            h('button', {
              type: 'button',
              className: confirmReset ? 'fg-btn fg-btnDanger' : 'fg-btn fg-btnGhost',
              id: 'fg-reset',
              onClick: reset,
            }, confirmReset ? t('action.resetConfirm') : t('action.reset')),
          )
          ),
          codexPreviewEntry === undefined ? null : h(BloomPreview, {
                  key: 'codex-preview',
                  id: 'fg-codex-preview',
                  speciesId: codexPreviewEntry.species.id,
                  variant: codexPreviewEntry.variant,
                  trait: codexPreviewEntry.trait, tint: codexPreviewEntry.tint, dna: codexPreviewEntry.dna,
                  observations: state.study?.[codexPreviewEntry.species.id]?.observations ?? 0,
                  modal: true, allowSpecimen:true, onPrev: () => stepCodex(-1), onNext: () => stepCodex(1),
                  t,
                  meta: [
                    t(`variant.${codexPreviewEntry.variant}`),
                    t(codexPreviewEntry.recorded && (codexPreviewEntry.trait || codexPreviewEntry.tint) ? 'card.recorded' : 'codex.harvests', { n: codexPreviewEntry.count }),
                    codexPreviewEntry.trait ? t('card.traitHistory', { n: state.exotics[`${codexPreviewEntry.species.id}:${codexPreviewEntry.trait}`] ?? 0 }) : null,
                    codexPreviewEntry.tint ? t('card.hybridHistory', { n: state.hybrids[`${codexPreviewEntry.species.id}~${codexPreviewEntry.tint}`] ?? 0 }) : null,
                  ],
                  onClose: () => {
                    const key = codexPreviewEntry.key
                    setCodexPreview(null)
                    restoreOpener()
                  },
                }),

          reward ? h(RewardDialog,{reward,state,t,onClose:()=>{setReward(null);restoreOpener()},onBag:()=>{setReward(null);setInventoryOpen(true)}}) : null,
          inventoryOpen ? h(InventoryDialog,{state,t,clock,onClose:()=>{setInventoryOpen(false);restoreOpener()},onGarden:()=>{setInventoryOpen(false);selectTab('garden',true)},onShop:()=>{setInventoryOpen(false);selectTab('shop',true)},
            onSell:key=>{const before=getState(),next=sellKind(before,key,Date.now());if(next===null)return;commit(next,true);playSound('coin');announce(t('reward.sellMany',{n:before.basket.length-next.basket.length,coins:next.coins-before.coins}),'ok')},
            onUse:id=>{if(id==='sprinkler')sprinkle();else armCharm()},
            onUseBloom:key=>{tick();const before=getState(),at=before.basket.findIndex(item=>itemKey(item)===key),item=before.basket[at];if(!item)return;const next=useBloom(before,at,Date.now());if(next===null){announce(t('use.cannot',{flower:bloomName(item,t)}),'warn');return}commit(next,true);playSound('plant');announce(t('use.done',{flower:bloomName(item,t),effect:t('use.'+flowerUse(item.species)+'.note').replace(/^[^：:]*[：:]\s*/u,'')}),'ok')},
            onKeep:key=>{const before=getState(),next=pressCard(before,before.basket.findIndex(item=>itemKey(item)===key),Date.now());if(next===null){announce(t('album.full'),'warn');return}commit(next,true);playSound('plant');announce(t('album.kept'),'ok')},
            onOpenBloom:key=>{setInventoryOpen(false);selectTab('basket');setPreview(key)}}) : null,
          discovery ? h(DiscoveryCard,{entry:discovery,t,onClose:()=>{setDiscovery(null);restoreOpener()},onOpen:openDiscovered}) : null,
          guestPreview ? h(VisitorPreview, { key: guestPreview, visitorId: guestPreview, state, t, onClose: () => { setGuestPreview(null); restoreOpener() } }) : null,

        ),
      )
    }

