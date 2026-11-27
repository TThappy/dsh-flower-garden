    // ---------------------------------------------------------------------
    // §8 Module registration.
    // ---------------------------------------------------------------------
    // A page owns one simulation interval, regardless of how many garden views mount.
    // On secure origins the active renderer also holds a cross-tab clock lock.
    let clockOwners = 0, disposeClock = null
    function startGardenClock() {
      if (typeof window === 'undefined' || !window.setInterval) return () => {}
      if (++clockOwners === 1) {
        let stopped = false, timer = null, releaseLock
        function start() {
          if (stopped || timer !== null) return
          timer = window.setInterval(tick, 1000)
          tick()
        }
        const locks = window.navigator?.locks
        const controller = locks && typeof AbortController === 'function' ? new AbortController() : null
        if (controller) {
          locks.request(`${STORAGE_KEY}:clock`, {signal:controller.signal}, async () => {
            if (stopped) return
            start()
            await new Promise(resolve => { releaseLock = resolve })
          }).catch(() => { if (!stopped) start() })
        } else start()
        disposeClock = () => {
          stopped = true
          controller?.abort()
          releaseLock?.()
          if (timer !== null) window.clearInterval(timer)
        }
      }
      return () => { if (--clockOwners === 0) { disposeClock?.(); disposeClock = null } }
    }
    return {
      name: 'dsh-flower-garden',
      inject: ['slots', 'locale'],
      apply(ctx) {
        pluginCtx = ctx
        boundT = ctx.locale.bind(NS)

        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'flower-garden: dictionaries')

        ctx.effect(() => {
          initStore()
          const onHide = () => {
            flushPersist()
          }
          if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return () => {}
          const onStorage = event => { if (event.key === STORAGE_KEY) adoptStored(event.newValue) }
          window.addEventListener('storage', onStorage)
          window.addEventListener('pagehide', onHide)
          document.addEventListener('visibilitychange', onHide)
          return () => {
            window.removeEventListener('storage', onStorage)
            window.removeEventListener('pagehide', onHide)
            document.removeEventListener('visibilitychange', onHide)
            flushPersist()
          }
        }, 'flower-garden: saved garden')

        ctx.effect(startGardenClock, 'flower-garden: simulation clock')
        ctx.effect(trackDesktopArtPins, 'flower-garden: restore pinned artwork')

        ctx.slots.inject('shell.overlay', () => ctx.slots.register({name:'shell.overlay',id:'flower-garden-mini',order:30},FloatingGarden))

        ctx.slots.inject('conversation.view', () => ctx.slots.register({
          name: 'conversation.view',
          id: 'garden',
          order: 30,
          label: () => boundT('view.label'),
          locale: NS,
        }, GardenView))
      },
      /** Static pieces exported for layout tests only; the runtime never reads them. */
      __components: { GoodsShelf, MiniToday, WantedBoard, CompanionBoard, EventBanner, BriefChip, GreetingEditor, FundBoard, VaseShelf, Shelf, CardTools, Workshop, CardPages, Contest, LegacyBoard, SeasonChip, VaseArt, BouquetArt, VasePicker, Album, ExpeditionBoard, GeneBars, GeneCard, Pedigree, CrossHint, BreedingGoals, ArrangeTable, AffinityBoard, QuickBar, PlayStrip, AwayCard, InfoTip, BagGrid, FloatingGarden, MiniGarden, RewardDialog, InventoryDialog, InventoryContents, GardenView, FlowerArt, BloomPreview, VisitorArt, GardenActivities, VisitorPreview, GardenEcology, SpeciesPurpose, SpecialCommissionBoard, SpecialVisitorArt, ScenePanorama, DiscoveryCard },
      __traits: TRAITS,
      /** Dictionaries exported so tests render with the shipped copy. */
      __dicts: { zh, en },
      /** Pure game transitions and tuning, exported for unit tests only. */
      __game: {
        ...ECOLOGY_API, ...PLAY_API, ...CRAFT_API, ...GENE_API, ...ALBUM_API, ...ECONOMY_API, ...LONGTERM_API, ...FUND_API, ...USES_API, ...FUN_API, ...FLOWER_API, ...GOODS_API, ...TINT_API, ...GARDENER_API, ...BULK_API, ...TRAIT_API, HIDDEN_CAP, CHARM_CAP, bagEntries, getAway, adoptStored, getState, playSound, miniGeometry, revealBloom, revealGarden, inventoryCount, rewardForChange, RESEARCH_BRANCHES, RESEARCH_OFFERS, sanitizeResearch, researchLevel, researchFee, researchCost, upgradeResearch, exchangeResearch, hybridChance, ECO_PROFILES, VISITOR_INFO, studyLevel, GARDEN_TABS, TAB_GROUPS, TAB_GROUP_IDS, todayTasks, tabGroupOf, sanitizeUi, dayPeriod, gardenClock,
        discoveryItems, recordDiscoveries, sanitizeDiscoveries, specialCommissions, commissionState, acceptCommission, commissionProgress, completeCommission, sanitizeCommissions, specialVisitorEligible,
        SCENES, SPECIES, CODEX_ENTRIES, HIDDEN_PAL, UNLOCK_COSTS, XP_PER_LEVEL, PLOT_COUNT,
        START_COINS, DRY_SHARE, BASKET_CAPACITY, ORDER_SLOTS, WEATHER_MS, ITEMS, SPRINKLER_MS, CHARM_BONUS,
        freshState, sanitize, advancePlot, advanceState, plantAt, waterAt, harvestAt, unlockAt,
        unlockScene, sellBasket, basketValue, basketCount, basketPlainCount, orderReady, orderNeedsGold,
        deliverOrder, fillOrders,
        makeOrder, stageOf, levelOf, growMsOf, weatherAt, weatherEndsAt, paletteOf, plotVariant,
        variantMultiplier, bloomPrice, hiddenChance, sceneOf, emptyScene, basketCapacity, basketUpgradeCost, BASKET_MAX_LEVEL,
        buyItem, useSprinkler, useCharm, fertilizeAt,
        VISITORS, VISIT_MS, VISIT_CHANCE, ACHIEVEMENTS, MARKET_BONUS,
        TRAITS, SCENE_TRAIT, FACILITIES, FACILITY_MAX, SHOW_MS, SHOW_SLOTS, SHOW_TIERS,
        SOIL_HARVEST, SOIL_REPEAT, SOIL_ROTATE, SOIL_REST_MS, SOIL_FLOOR, COMPOST_GAIN,
        GLUT_STEP, GLUT_FLOOR, GLUT_RECOVER_MS, TRAIT_PRICE, HYBRID_PRICE, HYBRID_CHANCE,
        soilOf, soilFactor, compostAt, facilityLevel, facilityCost, upgradeFacility,
        traitCauses, hybridPartner, itemKey, itemValue, glutSteps, glutFactor, quoteSale, quoteFlowerBatch, sellFlowerBatch, sellKind, sellIndividual,
        isPlainBloom, isWarm, showAt, showEntry, showAccepts, showPoints, exhibit,
        visitorAt, greetVisitor, visitBucket, isNight, waterAll, featuredSpecies, salePrice,
        achievementValue, achievementReady, claimAchievement,
        exportSave, importSave, SAVE_FORMAT, SAVE_VERSION,
        showModalPinned,
      },
      __css: CSS,
    }
  },
})
