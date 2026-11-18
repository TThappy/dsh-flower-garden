    // ---------------------------------------------------------------------
    // §8 Module registration.
    // ---------------------------------------------------------------------
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
        ...ECOLOGY_API, ...PLAY_API, ...CRAFT_API, ...GENE_API, ...ALBUM_API, ...ECONOMY_API, ...LONGTERM_API, ...FUND_API, ...USES_API, ...FUN_API, ...FLOWER_API, ...GOODS_API, ...TINT_API, ...BULK_API, ...TRAIT_API, HIDDEN_CAP, CHARM_CAP, bagEntries, getAway, adoptStored, getState, playSound, miniGeometry, revealBloom, revealGarden, inventoryCount, rewardForChange, RESEARCH_BRANCHES, RESEARCH_OFFERS, sanitizeResearch, researchLevel, researchFee, researchCost, upgradeResearch, exchangeResearch, hybridChance, ECO_PROFILES, VISITOR_INFO, studyLevel, GARDEN_TABS, sanitizeUi, dayPeriod, gardenClock,
        discoveryItems, recordDiscoveries, sanitizeDiscoveries, specialCommissions, commissionState, acceptCommission, commissionProgress, completeCommission, sanitizeCommissions, specialVisitorEligible,
        SCENES, SPECIES, CODEX_ENTRIES, HIDDEN_PAL, UNLOCK_COSTS, XP_PER_LEVEL, PLOT_COUNT,
        START_COINS, DRY_SHARE, BASKET_CAPACITY, ORDER_SLOTS, WEATHER_MS, ITEMS, SPRINKLER_MS, CHARM_BONUS,
        freshState, sanitize, advancePlot, advanceState, plantAt, waterAt, harvestAt, unlockAt,
        unlockScene, sellBasket, basketValue, basketCount, basketPlainCount, orderReady, orderNeedsGold,
        deliverOrder, fillOrders,
        makeOrder, stageOf, levelOf, growMsOf, weatherAt, weatherEndsAt, paletteOf, plotVariant,
        variantMultiplier, bloomPrice, hiddenChance, sceneOf, emptyScene, basketCapacity,
        buyItem, useSprinkler, useCharm, fertilizeAt,
        VISITORS, VISIT_MS, VISIT_CHANCE, ACHIEVEMENTS, MARKET_BONUS,
        TRAITS, SCENE_TRAIT, FACILITIES, FACILITY_MAX, SHOW_MS, SHOW_SLOTS, SHOW_TIERS,
        SOIL_HARVEST, SOIL_REPEAT, SOIL_ROTATE, SOIL_REST_MS, SOIL_FLOOR, COMPOST_GAIN,
        GLUT_STEP, GLUT_FLOOR, GLUT_RECOVER_MS, TRAIT_PRICE, HYBRID_PRICE, HYBRID_CHANCE,
        soilOf, soilFactor, compostAt, facilityLevel, facilityCost, upgradeFacility,
        traitCauses, hybridPartner, itemKey, itemValue, glutSteps, glutFactor, quoteSale, sellKind, sellIndividual,
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
