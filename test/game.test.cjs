/**
 * Unit checks for the flower-garden game. Loads the browser half with a stub
 * module loader (no DOM, no React) and exercises the pure transitions: four
 * scenes, twenty-five species, growth under each sky, the harvest → basket →
 * sale path, bouquet orders, colour variants and the hidden gold bloom.
 */
const fs = require('node:fs')
const path = require('node:path')

const BUNDLE = process.env.FG_BUNDLE ?? path.join(__dirname, '..', 'client.js')
let captured = null
global.window = {
  __ModuleLoader__: {
    load(definition) {
      captured = definition
    },
  },
}

// eslint-disable-next-line no-eval
eval(fs.readFileSync(BUNDLE, 'utf8'))
if (captured === null) throw new Error('the bundle did not register a module')
if (captured.id !== 'dsh-flower-garden') throw new Error(`unexpected id ${captured.id}`)

const ReactStub = {
  createElement() { return null },
  useState(value) { return [value, () => {}] },
  useReducer(value) { return [value, () => {}] },
  useEffect() {},
  useRef() { return { current: null } },
  useSyncExternalStore() { return null },
  Fragment: 'Fragment',
}
const plugin = captured.factory(name => {
  if (name !== 'react') throw new Error(`unexpected require(${name})`)
  return ReactStub
})
const game = plugin.__game

let failures = 0
function check(label, condition, detail) {
  if (condition) {
    console.log(`  ok   ${label}`)
    return
  }
  failures += 1
  console.log(`  FAIL ${label}${detail === undefined ? '' : ` — ${detail}`}`)
}
function near(actual, expected, tolerance = 1e-6) {
  return Math.abs(actual - expected) <= tolerance
}
const byId = id => game.SPECIES.find(species => species.id === id)
const sceneOf = id => game.SCENES.find(scene => scene.id === id)

const meadow = sceneOf('meadow')
const snow = sceneOf('snow')
const volcano = sceneOf('volcano')
const daisy = byId('daisy')
const growMs = game.growMsOf(daisy)
const dryMs = growMs * game.DRY_SHARE
const DECAY = 100 / dryMs
const planted = speciesId => ({ species: speciesId, growthMs: 0, moisture: 100, dried: false })
const night = new Date(2026, 0, 1, 23, 30, 0).getTime()
const noon = new Date(2026, 0, 1, 12, 0, 0).getTime()

console.log('scenes and species')
check('ten scenes', game.SCENES.length === 10)
check('one hundred and five species', game.SPECIES.length === 105)
check('every species belongs to exactly one scene', game.SPECIES.every(species => game.SCENES.filter(scene => scene.species.includes(species.id)).length === 1))
check('every scene has at least four species', game.SCENES.every(scene => scene.species.length >= 4))
check('ids are unique', new Set(game.SPECIES.map(species => species.id)).size === 105)
check('each species names a drawing and a foliage', game.SPECIES.every(species => typeof species.head === 'string' && typeof species.leaf === 'string'))
check('each species has a palette', game.SPECIES.every(species => typeof species.pal.petal === 'string'))
check('every species has positive prices and pays back its seed', game.SPECIES.every(species => species.cost > 0 && species.sell > 0 && species.sell > species.cost))
check('species names are unique', new Set(game.SPECIES.map(species => species.id)).size === game.SPECIES.length)
check('codex covers base, second colour and hidden', game.CODEX_ENTRIES.length === game.SPECIES.length + game.SPECIES.filter(species => species.alt !== undefined).length + game.SPECIES.length)
check('scenes cost more as they go', game.SCENES[0].cost === 0
  && game.SCENES[1].cost < game.SCENES[2].cost
  && game.SCENES[2].cost < game.SCENES[3].cost)
check('woodland and desert hold ten species each', game.sceneOf('woodland').species.length === 10 && game.sceneOf('desert').species.length === 10 && game.sceneOf('woodland').species.concat(game.sceneOf('desert').species).every(id => byId(id).head && byId(id).leaf))
check('every species has a valid ecology profile', game.SPECIES.every(species => game.ecoProfile(species.id) !== null))

console.log('fresh state')
const start = game.freshState(1000)
check('starts with 25 coins', start.coins === 25)
check('opens on the meadow', start.scene === 'meadow')
check('every scene exists', Object.keys(start.scenes).length === game.SCENES.length)
check('only the meadow is open', start.scenes.meadow.unlocked === 3
  && start.scenes.snow.unlocked === 0
  && start.scenes.volcano.unlocked === 0
  && start.scenes.lake.unlocked === 0
  && start.scenes.woodland.unlocked === 0
  && start.scenes.desert.unlocked === 0)
check('five non-meadow regions start locked', game.SCENES.filter(scene => scene.id !== 'meadow').every(scene => start.scenes[scene.id].unlocked === 0))
check('six empty plots per scene', start.scenes.meadow.plots.length === 6 && start.scenes.meadow.plots.every(plot => plot === null))
check('empty basket', start.basket.length === 0)
check('two orders are waiting', start.orders.length === game.ORDER_SLOTS)
check('level 2 at 60 xp', game.levelOf(60) === 2)

console.log('planting is scene-bound')
check('planting spends coins', game.plantAt(start, 'meadow', 0, 'daisy').coins === 20)
check('planting fills the plot', game.plantAt(start, 'meadow', 0, 'daisy').scenes.meadow.plots[0].species === 'daisy')
check('a locked plot refuses a seed', game.plantAt(start, 'meadow', 4, 'daisy') === null)
check('an unaffordable seed is refused', game.plantAt(start, 'meadow', 0, 'rose') === null)
check('another scene’s flower is refused', game.plantAt(start, 'meadow', 0, 'snowdrop') === null)
check('a closed scene refuses everything', game.plantAt(start, 'snow', 0, 'snowdrop') === null)
check('planting does not mutate the old state', start.scenes.meadow.plots[0] === null)

console.log('growth under each sky')
let plot = planted('daisy')
plot = game.advancePlot(plot, 1000, 'overcast', meadow)
check('overcast grows at the baseline', near(plot.growthMs, 1000), plot.growthMs)
check('soil dries by the hour', near(plot.moisture, 100 - 1000 * DECAY), plot.moisture)
const clear = game.advancePlot(planted('daisy'), 1000, 'clear', meadow)
check('meadow sun grows 15% faster', near(clear.growthMs, 1150), clear.growthMs)
const snowy = game.advancePlot(planted('daisy'), 1000, 'clear', snow)
check('snowfield sun grows 5% faster', near(snowy.growthMs, 1050), snowy.growthMs)
const ashed = game.advancePlot(planted('daisy'), 1000, 'rain', volcano)
check('crater ash does not water the soil', ashed.moisture < 100)
check('crater ash slows growth', near(ashed.growthMs, 850), ashed.growthMs)
const rained = game.advancePlot({ ...planted('daisy'), moisture: 3 }, 10 * 60 * 1000, 'rain', meadow)
check('meadow rain keeps the soil wet', rained.moisture === 100)
check('rain waters the whole segment', near(rained.growthMs, growMs), rained.growthMs)
const dried = game.advancePlot(planted('daisy'), 24 * 3600 * 1000, 'overcast', meadow)
check('moisture bottoms out at zero', dried.moisture === 0)
check('one watering reaches the dry share', near(dried.growthMs, dryMs), dried.growthMs)
check('a plot that ran dry is marked', dried.dried === true)
check('a watered plot is not marked dry', game.advancePlot(planted('daisy'), 1000, 'overcast', meadow).dried === false)
check('weather is deterministic', game.weatherAt(123456789) === game.weatherAt(123456789))
check('weather ends on the period', game.weatherEndsAt(0) === game.WEATHER_MS)

console.log('the clock walker')
let state = game.plantAt(start, 'meadow', 0, 'daisy')
state = game.advanceState(state, state.lastTick + 1000)
check('lastTick follows the clock', state.lastTick === 2000)
check('the previous state is untouched', game.plantAt(start, 'meadow', 0, 'daisy').scenes.meadow.plots[0].growthMs === 0)
const walked = game.advanceState(state, state.lastTick + 5 * 24 * 3600 * 1000)
check('growth never exceeds the species total', walked.scenes.meadow.plots[0].growthMs <= growMs)
check('moisture stays in range', walked.scenes.meadow.plots[0].moisture >= 0 && walked.scenes.meadow.plots[0].moisture <= 100)
check('a long absence lands on the current clock', walked.lastTick === state.lastTick + 5 * 24 * 3600 * 1000)

console.log('watering and unlocking')
const thirsty = { ...start, scenes: { ...start.scenes, meadow: { unlocked: 3, plots: [{ ...planted('daisy'), moisture: 12 }, null, null, null, null, null] } } }
check('watering refills the soil', game.waterAt(thirsty, 'meadow', 0).scenes.meadow.plots[0].moisture === 100)
check('watering wet soil is a no-op', game.waterAt(game.waterAt(thirsty, 'meadow', 0), 'meadow', 0) === null)
check('watering an empty plot is a no-op', game.waterAt(start, 'meadow', 1) === null)
const rich = { ...start, coins: 500 }
const unlocked = game.unlockAt(rich, 'meadow', 3)
check('plot 4 costs 40', unlocked.coins === 460 && unlocked.scenes.meadow.unlocked === 4)
check('plots unlock in order', game.unlockAt(rich, 'meadow', 4) === null)
check('an unaffordable plot stays locked', game.unlockAt({ ...rich, coins: 10 }, 'meadow', 3) === null)

console.log('opening a scene')
const nearRich = { ...start, coins: 200 }
const openedSnow = game.unlockScene(nearRich, 'snow')
check('the snowfield costs its price', openedSnow.coins === 200 - snow.cost)
check('opening a scene switches to it', openedSnow.scene === 'snow')
check('a new scene starts with three plots', openedSnow.scenes.snow.unlocked === 3)
check('the meadow stays open', openedSnow.scenes.meadow.unlocked === 3)
check('the crater is still closed', game.unlockScene(nearRich, 'volcano') === null)
check('the starting meadow cannot be bought', game.unlockScene(nearRich, 'meadow') === null)
check('a poor wallet cannot open a scene', game.unlockScene({ ...start, coins: 10 }, 'snow') === null)
check('a snow seed now takes root', game.plantAt(openedSnow, 'snow', 0, 'snowdrop') !== null)

console.log('harvest, variants and the basket')
const ripeMeadow = {
  ...game.freshState(0),
  coins: 100,
  scenes: { ...game.freshState(0).scenes, meadow: { unlocked: 3, plots: [{ species: 'daisy', growthMs: growMs, moisture: 60, dried: false }, null, null, null, null, null] } },
}
const late = { ...ripeMeadow, seed: 1 }
const harvested = game.harvestAt(late, 'meadow', 0, noon, 'overcast')
check('harvest clears the plot', harvested.scenes.meadow.plots[0] === null)
check('harvest fills the basket', harvested.basket.length === 1)
check('harvest pays experience', harvested.xp === daisy.xp)
check('harvest records the codex entry', harvested.seen['daisy:alt'] === 1)
check('harvest pays no coins yet', harvested.coins === late.coins)
const secondPlot = {
  ...ripeMeadow,
  scenes: { ...ripeMeadow.scenes, meadow: { unlocked: 3, plots: [{ species: 'daisy', growthMs: growMs, moisture: 60, dried: false }, { species: 'daisy', growthMs: growMs, moisture: 60, dried: false }, null, null, null, null] } },
}
check('plot #1 grows the second colour', game.harvestAt({ ...secondPlot, seed: 1 }, 'meadow', 0, noon, 'overcast').basket[0].variant === 'alt')
check('plot #2 grows the plain colour', game.harvestAt({ ...secondPlot, seed: 1 }, 'meadow', 1, noon, 'overcast').basket[0].variant === 'base')
check('the basket is capped', game.harvestAt({ ...ripeMeadow, basket: new Array(game.BASKET_CAPACITY).fill({ species: 'daisy', variant: 'base' }) }, 'meadow', 0, noon, 'overcast') === null)

console.log('hidden gold blooms')
const perfectPlot = { species: 'daisy', growthMs: growMs, moisture: 100, dried: false }
const bestChance = game.hiddenChance(perfectPlot, 'rain', night, meadow)
const worstChance = game.hiddenChance({ ...perfectPlot, moisture: 10, dried: true }, 'clear', noon, meadow)
check('the best conditions reach 30%', near(bestChance, 0.3), bestChance)
check('the worst conditions sit at the base rate', near(worstChance, 0.03), worstChance)
check('conditions never exceed the cap', game.hiddenChance(perfectPlot, 'rain', night, meadow) <= 0.3)
let hitSeed = 0
let missSeed = 0
for (let seed = 1; seed < 200000 && (hitSeed === 0 || missSeed === 0); seed += 1) {
  const value = ((Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
  if (value < 0.29 && hitSeed === 0) hitSeed = seed
  if (value > 0.31 && missSeed === 0) missSeed = seed
}
const goldState = {
  ...ripeMeadow,
  seed: hitSeed,
  scenes: { ...ripeMeadow.scenes, meadow: { unlocked: 3, plots: [perfectPlot, null, null, null, null, null] } },
}
const gold = game.harvestAt(goldState, 'meadow', 0, night, 'rain')
check('a lucky roll turns the bloom gold', gold.basket[0].variant === 'hidden')
check('the gold bloom enters the codex', gold.seen['daisy:hidden'] === 1)
const plain = game.harvestAt({ ...goldState, seed: missSeed }, 'meadow', 0, night, 'rain')
check('an unlucky roll keeps the plot colour', plain.basket[0].variant === 'alt')

console.log('selling by variant')
check('a plain bloom sells at list price', game.bloomPrice(daisy, 'base') === daisy.sell)
check('a second-colour bloom sells higher', game.bloomPrice(daisy, 'alt') > game.bloomPrice(daisy, 'base'))
check('a gold bloom sells triple', game.bloomPrice(daisy, 'hidden') === daisy.sell * 3)
const stocked = { ...ripeMeadow, basket: [{ species: 'daisy', variant: 'base' }, { species: 'daisy', variant: 'hidden' }, { species: 'cherry', variant: 'base' }] }
check('basket value sums the variants', game.basketValue(stocked) === daisy.sell + daisy.sell * 3 + byId('cherry').sell)
const soldGold = game.sellBasket(stocked, 'daisy', 'hidden')
check('selling the gold bloom pays triple', soldGold.coins === ripeMeadow.coins + daisy.sell * 3)
check('the plain bloom stays behind', soldGold.basket.length === 2)
const soldAll = game.sellBasket(stocked)
check('selling everything empties the basket', soldAll.basket.length === 0)
check('selling an empty basket is a no-op', game.sellBasket(start) === null)

console.log('orders keep the treasure')
const order = start.orders[0]
const fill = []
for (const item of order.items) {
  for (let index = 0; index < item.count; index += 1) fill.push({ species: item.species, variant: 'base' })
}
const readyState = { ...start, basket: fill }
check('an order is ready when the basket matches', game.orderReady(readyState, order) === true)
check('an empty basket cannot deliver', game.deliverOrder(start, order.id) === null)
const goldFirst = { ...readyState, basket: fill.map(item => ({ ...item, variant: 'hidden' })) }
check('a gold-only basket cannot fill a bouquet', game.deliverOrder(goldFirst, order.id) === null)
check('the UI can explain why', game.orderNeedsGold(goldFirst, order) === true)
const mixed = [...fill, { species: order.items[0].species, variant: 'hidden' }]
const deliveredMixed = game.deliverOrder({ ...readyState, basket: mixed }, order.id)
check('a gold bloom is never spent on a bouquet', deliveredMixed.basket.length === 1 && deliveredMixed.basket[0].variant === 'hidden')
check('delivering pays the order', deliveredMixed.coins === order.coins + start.coins)
check('delivering frees the slot', deliveredMixed.orders.length === game.ORDER_SLOTS)
check('the new order has a new id', deliveredMixed.orders.every(entry => entry.id !== order.id))

console.log('order generation')
const first = game.makeOrder(12345, 1, 7)
check('the same seed builds the same order', JSON.stringify(first.order) === JSON.stringify(game.makeOrder(12345, 1, 7).order))
check('the order pays more than selling', first.order.coins > first.order.items.reduce((sum, item) => sum + item.count * byId(item.species).sell, 0))
check('early orders use affordable seeds', first.order.items.every(item => byId(item.species).cost <= 14))
check('orders stay small', game.makeOrder(4242, 8, 1).order.items.reduce((sum, item) => sum + item.count, 0) <= 4)

console.log('sanitizing and migrating')
const roundTrip = game.sanitize(JSON.parse(JSON.stringify({ ...walked, v: 3 })), 5000)
check('a v3 snapshot survives', roundTrip.scenes.meadow.plots[0].species === 'daisy')
const v2 = game.sanitize({
  v: 2, coins: 77, xp: 70, harvested: 5, unlocked: 4,
  plots: [{ species: 'rose', growthMs: 1000, moisture: 50 }, null, null, null, null, null],
  basket: [{ species: 'daisy' }], seen: { daisy: 3 }, lastTick: 100,
}, 5000)
check('v2 coins survive', v2.coins === 77)
check('v2 plots land in the meadow', v2.scenes.meadow.plots[0].species === 'rose')
check('v2 unlocks land in the meadow', v2.scenes.meadow.unlocked === 4)
check('v2 basket items become plain blooms', v2.basket[0].variant === 'base')
check('v2 harvests land on the plain codex entry', v2.seen['daisy:base'] === 3)
check('v2 opens the other scenes empty', v2.scenes.snow.unlocked === 0)
check('migration reaches v4', v2.v === 4)
const v1 = game.sanitize({ v: 1, coins: 12, xp: 5, unlocked: 3, plots: [{ species: 'daisy', growthMs: 10, moisture: 20 }], lastTick: 1 }, 5000)
check('v1 coins survive', v1.coins === 12)
check('a broken snapshot resets', game.sanitize({ v: 99, coins: 1 }, 7).coins === 25)
check('an unknown species is dropped', game.sanitize({ v: 3, plots: [{ species: 'nope' }], lastTick: 5 }, 5).scenes.meadow.plots[0] === null)
check('an unknown scene falls back to the meadow', game.sanitize({ v: 3, scene: 'moon', lastTick: 5 }, 5).scene === 'meadow')
check('a future lastTick is clamped', game.sanitize({ v: 3, lastTick: 1e18 }, 900).lastTick === 900)

console.log('items: buying')
const shop = { ...game.freshState(0), coins: 1000 }
const bought = game.buyItem(shop, 'fertilizer')
check('a fertiliser leaves the bag with one', bought.bag.fertilizer === 1)
check('buying spends the price', bought.coins === shop.coins - 35)
check('an unaffordable item is refused', game.buyItem({ ...shop, coins: 10 }, 'sprinkler') === null)
check('an unknown item is refused', game.buyItem(shop, 'rocket') === null)
const lv1 = game.buyItem(shop, 'basket')
check('the basket upgrade levels up', lv1.basketLevel === 1)
check('the first upgraded basket holds thirty flowers', game.basketCapacity(lv1) === 30)
const lv2 = game.buyItem(lv1, 'basket')
check('the second upgrade holds fifty flowers', lv2.basketLevel === 2 && game.basketCapacity(lv2) === 50)
const lv3 = game.buyItem(lv2, 'basket'), lv4 = game.buyItem(lv3, 'basket')
check('the basket expands to seventy-five then one hundred slots', game.basketCapacity(lv3) === 75 && game.basketCapacity(lv4) === 100)
check('a maxed upgrade is refused even with enough coins', game.buyItem({...lv4,coins:10000}, 'basket') === null)
const largeBasketSave=game.sanitize({...lv4,basket:Array.from({length:100},(_,i)=>({species:'daisy',variant:'base',dna:i+1}))},1)
check('one hundred saved flowers survive reload with their identities', largeBasketSave.basket.length===100 && largeBasketSave.basket[99].dna===100 && largeBasketSave.basketLevel===4)
check('capacity cannot exceed one hundred through invalid levels', game.basketCapacity({basketLevel:999})===100)
check('old upgrades retain or gain capacity on reload', game.basketCapacity(game.sanitize({...lv2,basketLevel:2},1))===50)
check('a one hundred flower basket rejects additional harvests', game.harvestAt({...ripeMeadow,basketLevel:4,basket:largeBasketSave.basket},'meadow',0,noon,'overcast')===null)

console.log('items: the sprinkler waters a ground')
const dryPlot = { species: 'daisy', growthMs: 0, moisture: 5, dried: false }
const groundState = {
  ...game.freshState(1000),
  bag: { fertilizer: 0, sprinkler: 2, charm: 0 },
  scenes: {
    ...game.freshState(1000).scenes,
    meadow: { unlocked: 3, plots: [dryPlot, null, null, null, null, null], sprinklerUntil: 0 },
  },
}
const sprinkled = game.useSprinkler(groundState, 'meadow', 1000)
check('using a sprinkler spends one', sprinkled.bag.sprinkler === 1)
check('the sprinkler sets a deadline', sprinkled.scenes.meadow.sprinklerUntil === 1000 + game.SPRINKLER_MS)
const sprinkledGrow = game.advanceState(sprinkled, 1000 + 4 * 60 * 1000)
check('a sprinkled plot stays wet', sprinkledGrow.scenes.meadow.plots[0].moisture === 100)
check('a sprinkled plot keeps growing', sprinkledGrow.scenes.meadow.plots[0].growthMs > 0)
const afterSprinkler = game.advanceState(sprinkledGrow, 1000 + 40 * 60 * 1000)
check('the soil dries again once it stops', afterSprinkler.scenes.meadow.plots[0].moisture < 100)
check('sprinkling a closed ground is refused', game.useSprinkler(groundState, 'snow', 1000) === null)
check('sprinkling with an empty bag is refused', game.useSprinkler({ ...groundState, bag: { ...groundState.bag, sprinkler: 0 } }, 'meadow', 1000) === null)

console.log('items: feed one plant')
const fed = game.fertilizeAt({ ...groundState, bag: { fertilizer: 1, sprinkler: 0, charm: 0 } }, 'meadow', 0)
check('feeding advances a quarter of the growth', near(fed.scenes.meadow.plots[0].growthMs, growMs * 0.25))
check('feeding spends one fertiliser', fed.bag.fertilizer === 0)
check('feeding without a fertiliser is refused', game.fertilizeAt({ ...groundState, bag: { fertilizer: 0, sprinkler: 0, charm: 0 } }, 'meadow', 0) === null)
const overfed = game.fertilizeAt({
  ...groundState,
  bag: { fertilizer: 4, sprinkler: 0, charm: 0 },
  scenes: { ...groundState.scenes, meadow: { unlocked: 3, plots: [{ ...dryPlot, growthMs: growMs * 0.9 }], sprinklerUntil: 0 } },
}, 'meadow', 0)
check('feeding never overshoots the bloom', near(overfed.scenes.meadow.plots[0].growthMs, growMs))

console.log('items: the lucky charm')
const armed = game.useCharm({ ...groundState, bag: { fertilizer: 0, sprinkler: 0, charm: 1 } })
check('arming the charm spends it', armed.charm === true && armed.bag.charm === 0)
check('arming twice is refused', game.useCharm(armed) === null)
let charmSeed = 0
for (let seed = 1; seed < 200000; seed += 1) {
  const value = ((Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
  if (value > 0.035 && value < 0.27) { charmSeed = seed; break }
}
const plainChance = game.hiddenChance({ ...dryPlot, moisture: 0, dried: true }, 'clear', noon, meadow)
const charmState = {
  ...game.freshState(0),
  seed: charmSeed,
  charm: true,
  scenes: { ...game.freshState(0).scenes, meadow: { unlocked: 3, plots: [{ species: 'daisy', growthMs: growMs, moisture: 0, dried: true }, null, null, null, null, null], sprinklerUntil: 0 } },
}
const charmed = game.harvestAt(charmState, 'meadow', 0, noon, 'clear')
check('the charm raises the odds', plainChance < 0.05 && charmed.basket[0].variant === 'hidden')
check('the charm is consumed by the harvest', charmed.charm === false)
const uncharmed = game.harvestAt({ ...charmState, charm: false }, 'meadow', 0, noon, 'clear')
check('without the charm the same roll misses', uncharmed.basket[0].variant !== 'hidden')

console.log('visitors and pollination')
const bloomPlot = { species: 'daisy', growthMs: growMs, moisture: 60, dried: false }
const guestState = {
  ...game.freshState(0),
  scenes: { ...game.freshState(0).scenes, meadow: { unlocked: 3, sprinklerUntil: 0, plots: [bloomPlot, { ...bloomPlot, growthMs: growMs / 2 }, null, null, null, null] } },
}
// Walk the visit windows until one brings a visitor to plot #1.
let visitAt = noon
while (game.visitorAt('meadow', 0, bloomPlot, visitAt, 'overcast') === null
  || game.visitorAt('meadow', 0, bloomPlot, visitAt, 'overcast').id !== 'bee') visitAt += game.VISIT_MS
const guest = game.visitorAt('meadow', 0, bloomPlot, visitAt, 'overcast')
check('an open flower attracts a visitor', guest !== null && typeof guest.id === 'string')
check('the visit is deterministic', game.visitorAt('meadow', 0, bloomPlot, visitAt, 'overcast').id === guest.id)
check('the visitor belongs to the ground', guest.scenes.includes('meadow'))
check('a growing plant attracts nobody', game.visitorAt('meadow', 1, guestState.scenes.meadow.plots[1], visitAt, 'overcast') === null)
check('an empty plot attracts nobody', game.visitorAt('meadow', 2, null, visitAt, 'overcast') === null)
let windows = 0
let visits = 0
const kinds = new Set()
for (let at = noon; at < noon + 6 * 3600 * 1000; at += game.VISIT_MS) {
  windows += 1
  const seen = game.visitorAt('meadow', 0, bloomPlot, at, 'overcast')
  if (seen === null) continue
  visits += 1
  kinds.add(seen.id)
}
check('visits arrive at about the stated rate', Math.abs(visits / windows - game.VISIT_CHANCE) < 0.08, `${visits}/${windows}`)
check('day visitors only by day', [...kinds].every(id => game.VISITORS.find(visitor => visitor.id === id).when !== 'night'))
const nightKinds = new Set()
for (let at = night; at < night + 3 * 3600 * 1000; at += game.VISIT_MS) {
  const seen = game.visitorAt('meadow', 0, bloomPlot, at, 'overcast')
  if (seen !== null) nightKinds.add(seen.id)
}
check('night brings the night visitors', nightKinds.size > 0 && [...nightKinds].every(id => game.VISITORS.find(visitor => visitor.id === id).when !== 'day'), [...nightKinds].join(','))
const rainKinds = new Set()
for (let at = noon; at < noon + 6 * 3600 * 1000; at += game.VISIT_MS) {
  const seen = game.visitorAt('lake', 0, { species: 'lotus', growthMs: game.growMsOf(byId('lotus')), moisture: 100, dried: false }, at, 'rain')
  if (seen !== null) rainKinds.add(seen.id)
}
check('rain keeps the butterflies away', !rainKinds.has('butterfly') && !rainKinds.has('dragonfly') && rainKinds.size > 0)
check('every ground has someone at any hour', game.SCENES.every(scene => ['day', 'night'].every(when => game.VISITORS.some(visitor => visitor.scenes.includes(scene.id) && (visitor.when === 'any' || visitor.when === when) && visitor.dry !== true))))
const greeted = game.greetVisitor(guestState, 'meadow', 0, visitAt, 'overcast')
check('greeting pays the tip', greeted.coins === guestState.coins + guest.tip)
check('greeting pollinates the flower', greeted.scenes.meadow.plots[0].pollinated === true)
check('greeting records the visitor', greeted.visitors[guest.id] === 1)
check('one greeting per visit', game.greetVisitor(greeted, 'meadow', 0, visitAt, 'overcast') === null)
check('nobody to greet on a growing plot', game.greetVisitor(guestState, 'meadow', 1, visitAt, 'overcast') === null)
const twin = game.harvestAt({ ...greeted, seed: 1 }, 'meadow', 0, noon, 'overcast')
check('a pollinated flower gives two blooms', twin.basket.length === 2 && twin.basket.every(item => item.species === 'daisy'))
check('both blooms reach the flower book', twin.seen['daisy:alt'] === 2)
check('the double harvest is counted', twin.pollinated === 1 && twin.harvested === 2)
const nearlyFull = { ...greeted, seed: 1, basket: new Array(game.BASKET_CAPACITY - 1).fill({ species: 'daisy', variant: 'base' }) }
check('a nearly full basket takes just one', game.harvestAt(nearlyFull, 'meadow', 0, noon, 'overcast').basket.length === game.BASKET_CAPACITY)
const wetGreeted = {
  ...greeted,
  seed: hitSeed,
  scenes: { ...greeted.scenes, meadow: { ...greeted.scenes.meadow, plots: greeted.scenes.meadow.plots.map((plot, index) => (index === 0 ? { ...plot, moisture: 100 } : plot)) } },
}
const goldTwin = game.harvestAt(wetGreeted, 'meadow', 0, night, 'rain')
check('the second bloom is never a spirit', goldTwin.basket[0].variant === 'hidden' && goldTwin.basket[1].variant === 'alt')
const savedGuest = game.sanitize(JSON.parse(JSON.stringify(greeted)), visitAt)
check('pollination survives a reload', savedGuest.scenes.meadow.plots[0].pollinated === true && savedGuest.visitors[guest.id] === 1)
check('an unknown visitor is dropped on load', game.sanitize({ v: 4, visitors: { dragon: 3 }, lastTick: 5 }, 5).visitors.dragon === undefined)
const guardianVisitor = game.VISITORS.find(visitor => game.VISITOR_INFO[visitor.id]?.role === 'guardian' && visitor.scenes.includes('meadow'))
let guardianAt = noon
while (game.visitorAt('meadow', 0, bloomPlot, guardianAt, 'overcast')?.id !== guardianVisitor.id) guardianAt += game.VISIT_MS
const guardianState = { ...guestState, scenes: { ...guestState.scenes, meadow: { ...guestState.scenes.meadow, soil: [40, 100, 100, 100, 100, 100] } } }
const greetedGuardian = game.greetVisitor(guardianState, 'meadow', 0, guardianAt, 'overcast')
check('guardian visitors do not pollinate and restore six soil', greetedGuardian.scenes.meadow.plots[0].pollinated !== true && greetedGuardian.scenes.meadow.soil[0] === 46)
const watersideVisitor = game.VISITORS.find(visitor => game.VISITOR_INFO[visitor.id]?.role === 'waterside' && visitor.scenes.includes('lake'))
const watersidePlot = { species: 'lotus', growthMs: game.growMsOf(byId('lotus')), moisture: 50, dried: false }
let watersideAt = noon
while (game.visitorAt('lake', 0, watersidePlot, watersideAt, 'overcast')?.id !== watersideVisitor.id) watersideAt += game.VISIT_MS
const watersideState = { ...game.freshState(0), scenes: { ...game.freshState(0).scenes, lake: { unlocked: 3, plots: [watersidePlot, null, null, null, null, null] } } }
const greetedWaterside = game.greetVisitor(watersideState, 'lake', 0, watersideAt, 'overcast')
check('waterside visitors add twenty moisture without pollinating', greetedWaterside.scenes.lake.plots[0].moisture === 70 && greetedWaterside.scenes.lake.plots[0].pollinated !== true)

console.log('water all')
const dryPair = {
  ...guestState,
  scenes: { ...guestState.scenes, meadow: { unlocked: 3, sprinklerUntil: 0, plots: [{ ...bloomPlot, growthMs: 10, moisture: 20 }, { ...bloomPlot, growthMs: 10, moisture: 40 }, bloomPlot, null, null, null] } },
}
const soaked = game.waterAll(dryPair, 'meadow')
check('waters every growing plot', soaked.scenes.meadow.plots[0].moisture === 100 && soaked.scenes.meadow.plots[1].moisture === 100)
check('leaves an open flower alone', soaked.scenes.meadow.plots[2] === bloomPlot)
check('nothing to water is a no-op', game.waterAll(soaked, 'meadow') === null)

console.log('the flower market')
const marketState = game.freshState(0)
const favourite = game.featuredSpecies(marketState, noon)
check('the market names a flower', byId(favourite) !== undefined)
check('the favourite grows on an opened ground', meadow.species.includes(favourite))
check('the favourite holds all day', game.featuredSpecies(marketState, noon + 3 * 3600 * 1000) === favourite)
const favourites = new Set()
for (let day = 0; day < 40; day += 1) favourites.add(game.featuredSpecies(marketState, noon + day * 24 * 3600 * 1000))
check('the favourite changes from day to day', favourites.size >= 5, favourites.size)
check('without a clock there is no favourite', game.featuredSpecies(marketState, undefined) === null)
const favSpecies = byId(favourite)
check('the favourite sells for half as much again', game.salePrice(favSpecies, 'base', favourite) === Math.round(favSpecies.sell * game.MARKET_BONUS))
check('other flowers sell at list price', game.salePrice(favSpecies, 'base', 'nobody') === favSpecies.sell)
const marketBasket = { ...marketState, basket: [{ species: favourite, variant: 'base' }] }
check('selling with a clock pays the market price', game.sellBasket(marketBasket, undefined, undefined, noon).coins === marketState.coins + Math.round(favSpecies.sell * game.MARKET_BONUS))
check('basket value follows the market', game.basketValue(marketBasket, noon) === Math.round(favSpecies.sell * game.MARKET_BONUS))
check('selling without a clock pays list price', game.sellBasket(marketBasket).coins === marketState.coins + favSpecies.sell)


console.log('soil, rotation, rest and compost')
const soilBase = game.freshState(0)
const soilState = {
  ...soilBase,
  coins: 100,
  bag: { ...soilBase.bag, compost: 1 },
  scenes: {
    ...soilBase.scenes,
    meadow: {
      ...soilBase.scenes.meadow,
      soil: [50, 50, 100, 100, 100, 100],
      last: ['daisy', 'daisy', null, null, null, null],
    },
  },
}
const sameCrop = game.plantAt(soilState, 'meadow', 0, 'daisy')
const rotatedCrop = game.plantAt(soilState, 'meadow', 1, 'rose')
check('same crop applies a rotation penalty', sameCrop.scenes.meadow.soil[0] === 40)
check('a different crop restores soil', rotatedCrop.scenes.meadow.soil[1] === 58)
const rested = game.advanceState({ ...soilState, scenes: { ...soilState.scenes, meadow: { ...soilState.scenes.meadow, plots: [null, null, null, null, null, null] } } }, 60 * 1000)
check('empty plots regain soil while resting', rested.scenes.meadow.soil[0] === 51)
const composted = game.compostAt(soilState, 'meadow', 0)
check('compost spends one bag item', composted.bag.compost === 0)
check('compost restores sixty soil points', composted.scenes.meadow.soil[0] === 100)
check('composting rich soil is refused', game.compostAt({ ...soilState, scenes: { ...soilState.scenes, meadow: { ...soilState.scenes.meadow, soil: [100, 50, 100, 100, 100, 100] } } }, 'meadow', 0) === null)
check('soil factor has a defined lower floor', game.soilFactor(0) === game.SOIL_FLOOR && game.soilFactor(100) === 1)

console.log('market saturation and recovery')
const twoDaisies = { ...game.freshState(0), basket: [{ species: 'daisy', variant: 'base' }, { species: 'daisy', variant: 'base' }] }
const quote = game.quoteSale(twoDaisies, twoDaisies.basket, noon)
check('bulk sales quote each bloom sequentially', quote.coins === daisy.sell + Math.round(daisy.sell * (1 - game.GLUT_STEP)))
const soldBulk = game.sellBasket(twoDaisies, undefined, undefined, noon)
check('bulk sale records market saturation', soldBulk.glut.daisy.n === 2 && soldBulk.glut.daisy.at === noon)
check('saturation recovers by time', game.glutSteps(soldBulk, 'daisy', noon + 2 * game.GLUT_RECOVER_MS) === 0)
check('saturation has a fifty percent floor', game.glutFactor(99) === game.GLUT_FLOOR)

console.log('flower show and garden facilities')
const showNow = noon
const showState = { ...game.freshState(showNow), coins: 1000, ribbons: 0, basket: [{ species: 'hydrangea', variant: 'hidden' }] }
const currentShow = game.showAt(showState, showNow)
check('show has a stable season and closing time', currentShow.endsAt > showNow && typeof currentShow.season === 'string')
check('show entry resets for a new period', game.showEntry({ ...showState, show: { id: currentShow.id - 1, points: 20, entered: 3, kinds: ['daisy'] } }, showNow).points === 0)
check('rare show accepts spirit blooms', game.showAccepts({ ...currentShow, theme: 'rare' }, showState.basket[0]) === true)
const exhibited = game.exhibit(showState, game.itemKey(showState.basket[0]), showNow)
check('exhibiting consumes a bloom and grants ribbons', exhibited.basket.length === 0 && exhibited.show.entered === 1 && exhibited.ribbons >= 1)
check('exhibiting never pays coins', exhibited.coins === showState.coins)
const facilityStart = { ...game.freshState(0), coins: 1000, ribbons: 2 }
const hiveCost = game.facilityCost('hive', 0)
const hive = game.upgradeFacility(facilityStart, 'hive')
check('facility cost starts at its base price', hiveCost.coins === 200 && hiveCost.ribbons === 0)
check('facility upgrade spends coins and advances level', hive.facilities.hive === 1 && hive.coins === 800)
const hive2 = game.upgradeFacility(hive, 'hive')
check('later facility levels require ribbons', hive2.facilities.hive === 2 && hive2.ribbons === 1)
check('unknown facility cannot be upgraded', game.upgradeFacility(facilityStart, 'unknown') === null)
const sameKindBasket = {
  ...showState,
  basket: [
    { species: 'daisy', variant: 'hidden', dna: 111 },
    { species: 'daisy', variant: 'hidden', dna: 222 },
    { species: 'rose', variant: 'hidden', dna: 333 },
  ],
  specimens: { 'daisy:hidden': { species: 'daisy', variant: 'hidden', dna: 111, count: 2 } },
}
const selectedExhibit = game.exhibit(sameKindBasket, game.itemKey(sameKindBasket.basket[0]), showNow, 1)
check('exhibit can select a specific same-kind individual', selectedExhibit.basket.length === 2 && selectedExhibit.basket.some(item => item.dna === 111) && !selectedExhibit.basket.some(item => item.dna === 222))
check('exhibit rejects an index whose key does not match', game.exhibit(sameKindBasket, game.itemKey(sameKindBasket.basket[0]), showNow, 2) === null)
check('exhibit rejects an out-of-range individual index', game.exhibit(sameKindBasket, game.itemKey(sameKindBasket.basket[0]), showNow, 99) === null)
const soldIndividual = game.sellIndividual(sameKindBasket, 1, showNow)
check('selling one individual removes only the selected index', soldIndividual.basket.length === 2 && soldIndividual.basket[0].dna === 111 && soldIndividual.basket[1].dna === 333)
check('selling an individual retains its specimen archive', soldIndividual.specimens['daisy:hidden'].dna === 111 && soldIndividual.specimens['daisy:hidden'].count === 2)
check('selling an invalid individual index is refused', game.sellIndividual(sameKindBasket, 99, showNow) === null)

console.log('hybrid seeds and individual dna')
let hybridSeed = 0
for (let seed = 1; seed < 200000 && hybridSeed === 0; seed += 1) {
  const first = ((Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
  const next = ((Math.imul(((Math.imul(seed, 1664525) + 1013904223) >>> 0), 1664525) + 1013904223) >>> 0) / 4294967296
  if (first >= 0.03 && next < game.HYBRID_CHANCE) hybridSeed = seed
}
const hybridState = {
  ...game.freshState(0), seed: hybridSeed,
  scenes: { ...game.freshState(0).scenes, meadow: {
    unlocked: 3, soil: [100, 100, 100, 100, 100, 100], last: [null, null, null, null, null, null],
    plots: [
      { species: 'daisy', growthMs: game.growMsOf(daisy), moisture: 60, dried: false, pollinated: true, dna: 12345 },
      { species: 'tulip', growthMs: game.growMsOf(byId('tulip')), moisture: 60, dried: false, dna: 54321 },
      null, null, null, null,
    ],
  } },
}
const hybridHarvest = game.harvestAt(hybridState, 'meadow', 0, noon, 'overcast')
check('pollinated neighbours can produce a hybrid seed', hybridHarvest.seeds['daisy~tulip'] === 1)
check('harvest preserves an individual dna value', hybridHarvest.basket[0].dna === 12345)
check('harvest archives the first real specimen', hybridHarvest.specimens[game.itemKey(hybridHarvest.basket[0])].dna === 12345 && hybridHarvest.specimens[game.itemKey(hybridHarvest.basket[0])].count === 2)
const hybridPlanted = game.plantAt(hybridHarvest, 'meadow', 0, 'daisy', 'tulip')
check('hybrid seed is free and records its pollen tint', hybridPlanted.coins === hybridHarvest.coins && hybridPlanted.scenes.meadow.plots[0].tint === 'tulip')
check('hybrid seed is consumed on planting', hybridPlanted.seeds['daisy~tulip'] === undefined)
check('hybrid partner requires a neighbouring open flower', game.hybridPartner(hybridState.scenes.meadow, 0) === 'tulip')

console.log('curiosity conditions and v4 save compatibility')
const curious = game.traitCauses({ visits: 2, fed: 2, dried: true }, 'meadow', 'clear', new Date(2026, 0, 1, 23, 0).getTime())
check('repeated visits can cause a twin curiosity', curious.includes('twin'))
check('repeated feeding can cause a giant curiosity', curious.includes('giant'))
check('dry soil can cause a variegated curiosity', curious.includes('variegated'))
check('night can cause an ink curiosity', curious.includes('ink'))
const savedV4 = game.sanitize({
  v: 4, coins: 77, ribbons: 3, facilities: { hive: 2 }, seeds: { 'daisy~tulip': 2, 'daisy~nope': 9 },
  hybrids: { 'daisy~tulip': 1, 'daisy~daisy': 4 }, exotics: { 'daisy:twin': 1, 'daisy:nope': 4 },
  specimens: {
    'daisy:base:twin~tulip': { species: 'daisy', variant: 'base', dna: 13579, trait: 'twin', tint: 'tulip', count: 3 },
    'daisy:base': { species: 'daisy', variant: 'base', dna: 24680, count: 2 },
  },
  scenes: { meadow: { unlocked: 3, soil: [42, 100, 100, 100, 100, 100], last: ['daisy', null, null, null, null, null], plots: [{ species: 'daisy', growthMs: 1, moisture: 90, dna: 98765 }, null, null, null, null, null] } },
  basket: [{ species: 'daisy', variant: 'base', dna: 24680, tint: 'tulip' }], lastTick: 100,
}, 200)
check('v4 saves preserve soil, dna and facilities', savedV4.scenes.meadow.soil[0] === 42 && savedV4.scenes.meadow.plots[0].dna === 98765 && savedV4.facilities.hive === 2)
check('v4 saves preserve hybrid basket metadata', savedV4.basket[0].dna === 24680 && savedV4.basket[0].tint === 'tulip')
check('v4 saves round-trip a composite specimen', savedV4.specimens['daisy:base:twin~tulip'].dna === 13579 && savedV4.specimens['daisy:base:twin~tulip'].trait === 'twin' && savedV4.specimens['daisy:base:twin~tulip'].tint === 'tulip' && savedV4.specimens['daisy:base:twin~tulip'].count === 3)
check('invalid hybrid and curiosity keys are dropped', savedV4.seeds['daisy~nope'] === undefined && savedV4.hybrids['daisy~daisy'] === undefined && savedV4.exotics['daisy:nope'] === undefined)
check('legacy saves gain v4 defaults', game.sanitize({ v: 3, coins: 9, lastTick: 1 }, 2).v === 4 && game.sanitize({ v: 3, coins: 9, lastTick: 1 }, 2).ribbons === 0)

console.log('save files leave the browser')
const exportedSave = game.exportSave(savedV4, 200)
check('a save file names its format and versions', exportedSave.format === game.SAVE_FORMAT && exportedSave.saveVersion === game.SAVE_VERSION && exportedSave.stateVersion === 4 && exportedSave.exportedAt === new Date(200).toISOString())
const reimported = game.importSave(JSON.parse(JSON.stringify(exportedSave)), 300)
check('an exported garden imports back intact', reimported !== null && reimported.coins === 77 && reimported.ribbons === 3 && reimported.scenes.meadow.soil[0] === 42 && reimported.specimens['daisy:base:twin~tulip'].dna === 13579)
check('an imported garden is a copy of the file', reimported !== savedV4 && reimported.scenes !== savedV4.scenes)
check('a bare garden state imports without the envelope', game.importSave({ ...savedV4 }, 300)?.coins === 77)
check('imports reject junk instead of wiping the garden', game.importSave(null, 300) === null && game.importSave([], 300) === null && game.importSave('garden', 300) === null && game.importSave({ format: game.SAVE_FORMAT }, 300) === null && game.importSave({ v: 4 }, 300) === null && game.importSave({ v: 4, scenes: {} }, 300) !== null)
check('imports reject a garden from a newer build', game.importSave({ ...exportedSave, garden: { ...savedV4, v: 99 } }, 300) === null)
check('imports still accept a legacy v3 garden', game.importSave({ v: 3, coins: 9, lastTick: 1 }, 300)?.coins === 9)

console.log('garden ecology and resident flowers')
const ecologyNow = new Date(2026, 0, 2, 12, 0, 0).getTime()
const residentPlot = { species: 'daisy', growthMs: growMs, moisture: 100, dried: false, dna: 86420 }
const ecologyStart = {
  ...game.freshState(ecologyNow), coins: 500, ribbons: 4,
  scenes: { ...game.freshState(ecologyNow).scenes, meadow: { unlocked: 3, plots: [residentPlot, null, null, null, null, null] } },
}
const retained = game.retainAt(ecologyStart, 'meadow', 0, ecologyNow)
check('retaining a mature flower keeps it in place', retained.scenes.meadow.plots[0].resident === true && retained.scenes.meadow.plots[0].dna === 86420)
check('retaining does not fill the basket', retained.basket.length === 0)
const retainedKey = Object.keys(retained.specimens)[0]
check('retaining archives the specimen metadata', retained.specimens[retainedKey].dna === 86420 && retained.specimens[retainedKey].count === 1)
check('a resident cannot be normally harvested', game.harvestAt({ ...retained, scenes: { ...retained.scenes, meadow: { ...retained.scenes.meadow, plots: [{ ...retained.scenes.meadow.plots[0], growthMs: growMs }, null, null, null, null, null] } } }, 'meadow', 0, ecologyNow, 'clear') === null)
const endedResidency = game.harvestAt(retained, 'meadow', 0, ecologyNow, 'clear', true)
check('ending residency allows a resident harvest', endedResidency !== null && endedResidency.basket.length === 1)
const observed = game.observeAt(retained, 'meadow', 0, ecologyNow)
const observeFee = 8 + Math.ceil(daisy.cost * 0.25)
check('observing charges the species fee', observed.coins === retained.coins - observeFee && observed.study.daisy.observations === 1)
check('observation records the ecology period and species', observed.ecology.observed.includes('daisy') && observed.ecology.period === game.ecologyPeriod(ecologyNow))
check('observing does not alter the flower DNA', observed.scenes.meadow.plots[0].dna === 86420)
check('observation cooldown rejects a second immediate observation', game.observeAt(observed, 'meadow', 0, ecologyNow + game.ECO_OBSERVE_MS - 1) === null)
check('insufficient coins reject observation', game.observeAt({ ...retained, coins: observeFee - 1 }, 'meadow', 0, ecologyNow) === null)
const rebloomFee = 10 + Math.ceil(daisy.cost * 0.4)
const rebloomed = game.rebloomAt(observed, 'meadow', 0, ecologyNow + game.ECO_OBSERVE_MS)
check('rebloom charges and resets growth while preserving DNA', rebloomed.coins === observed.coins - rebloomFee && rebloomed.scenes.meadow.plots[0].growthMs === Math.floor(growMs * 0.35) && rebloomed.scenes.meadow.plots[0].dna === 86420)
const rebloomReady = { ...rebloomed, scenes: { ...rebloomed.scenes, meadow: { ...rebloomed.scenes.meadow, plots: [{ ...rebloomed.scenes.meadow.plots[0], growthMs: growMs }, null, null, null, null, null] } } }
const observedAgain = game.observeAt(rebloomReady, 'meadow', 0, ecologyNow + 2 * game.ECO_OBSERVE_MS)
check('the first observation after rebloom awards two study points', observedAgain.study.daisy.observations === 3)
check('rebloom requires a resident observation first', game.rebloomAt(ecologyStart, 'meadow', 0, ecologyNow) === null)
const savedResident = game.sanitize({ v: 4, coins: 100, scenes: { meadow: { unlocked: 3, plots: [{ ...retained.scenes.meadow.plots[0], resident: true, variant: 'base', retainedAt: ecologyNow, observedAt: ecologyNow, careCount: 2, reblooms: 1, studiedReblooms: 1 }, null, null, null, null, null] } } }, ecologyNow)
check('resident status and care history survive reload', savedResident.scenes.meadow.plots[0].resident === true && savedResident.scenes.meadow.plots[0].careCount === 2 && savedResident.scenes.meadow.plots[0].reblooms === 1)
const ecology = game.gardenEcology(retained, ecologyNow)
check('garden ecology counts resident species and roles', ecology.residents === 1 && ecology.species === 1 && ecology.roleCoverage >= 1)
const projects = game.ecoProjects(retained, ecologyNow)
const projectsWithDifferentSeed = game.ecoProjects({ ...retained, seed: retained.seed + 999 }, ecologyNow)
check('eco projects are stable within a period independent of state seed', JSON.stringify(projects) === JSON.stringify(projectsWithDifferentSeed))
const samePeriodWithSnow = game.ecoProjects({ ...retained, scenes: { ...retained.scenes, snow: { unlocked: 3, plots: [null, null, null, null, null, null] } }, ecology: { ...retained.ecology, grounds: ['meadow'] } }, ecologyNow)
check('eco projects keep the period grounds snapshot', JSON.stringify(samePeriodWithSnow) === JSON.stringify(projects))
const openedNextPeriod = game.advanceState({ ...retained, scenes: { ...retained.scenes, snow: { unlocked: 3, plots: [null, null, null, null, null, null] }, }, ecology: { ...retained.ecology, grounds: ['meadow'] } }, ecologyNow + game.ECO_PERIOD_MS)
check('a new period refreshes the ecology ground snapshot', openedNextPeriod.ecology.period === game.ecologyPeriod(ecologyNow + game.ECO_PERIOD_MS) && openedNextPeriod.ecology.grounds.includes('snow'))
check('eco projects reset their period after rollover', game.ecoProjects(openedNextPeriod, ecologyNow + game.ECO_PERIOD_MS)[0].period !== projects[0].period)
const residentSpirit = {
  ...retained,
  basket: [],
  scenes: { ...retained.scenes, meadow: { ...retained.scenes.meadow, plots: [{ ...retained.scenes.meadow.plots[0], resident: true, variant: 'hidden', pollinated: true, growthMs: growMs }, null, null, null, null, null] } },
}
const endedSpirit = game.harvestAt(residentSpirit, 'meadow', 0, ecologyNow, 'clear', true)
check('ending a resident spirit harvests its spirit and an ordinary pollination bonus', endedSpirit.basket.length === 2 && endedSpirit.basket[0].variant === 'hidden' && endedSpirit.basket[1].variant !== 'hidden')
const project = projects[0]
const readyForStudy = { ...retained, coins: project.coins + 500, ribbons: project.ribbons + 1, ecology: { period: project.period, observed: project.species.slice(), visitors: project.visitors.slice(), claimed: [] }, journal: [] }
const submitted = game.submitStudy(readyForStudy, project.id, ecologyNow)
check('study submission costs coins and ribbons without consuming flowers', submitted.coins === readyForStudy.coins - project.coins && submitted.ribbons === readyForStudy.ribbons - project.ribbons && submitted.basket.length === readyForStudy.basket.length)
check('study submission records a journal entry and seals', submitted.journal.length === 1 && submitted.researchSeals === project.seals)
check('a project can only be submitted once per period', game.submitStudy(submitted, project.id, ecologyNow) === null)
const historicalOnly = { ...readyForStudy, ecology: { period: project.period, observed: project.species.slice(), visitors: [], claimed: [] }, visitors: Object.fromEntries(project.visitors.map(id => [id, 4])) }
check('historical visitor counts cannot satisfy a current project', game.submitStudy(historicalOnly, project.id, ecologyNow) === null)
const cappedJournal = { ...readyForStudy, journal: new Array(120).fill({ id: 'old' }) }
const cappedSubmit = game.submitStudy(cappedJournal, project.id, ecologyNow)
check('journal keeps at most one hundred entries', cappedSubmit.journal.length === 100)
const sanitizedStudy = game.sanitizeStudy({ daisy: { observations: 3.9, reblooms: 1.8, firstAt: ecologyNow, lastAt: ecologyNow }, nope: { observations: 9 } })
check('study sanitization keeps known counters and drops unknown species', sanitizedStudy.daisy.observations === 3 && sanitizedStudy.daisy.reblooms === 1 && sanitizedStudy.nope === undefined)
const sanitizedEcology = game.sanitizeEcology({ period: game.ecologyPeriod(ecologyNow), observed: ['daisy', 'nope'], visitors: ['bee', 'nope'], claimed: ['eco-1', 4] }, ecologyNow)
check('ecology sanitization filters unknown observations and visitors', sanitizedEcology.observed.length === 1 && sanitizedEcology.visitors.length === 1)
const nextPeriodEcology = game.sanitizeEcology({ period: game.ecologyPeriod(ecologyNow), observed: ['daisy'], visitors: ['bee'], claimed: ['eco-1'] }, ecologyNow + game.ECO_PERIOD_MS)
check('cross-period ecology sanitization clears old progress', nextPeriodEcology.observed.length === 0 && nextPeriodEcology.visitors.length === 0 && nextPeriodEcology.claimed.length === 0)
check('all species have valid ecology profiles', game.SPECIES.length === 105 && game.SPECIES.every(species => game.ecoProfile(species.id) !== null))
check('all thirteen visitors have complete field-guide metadata', game.VISITORS.length === 13 && game.VISITORS.every(visitor => ['latin', 'role', 'source', 'en', 'zh'].every(field => game.VISITOR_INFO[visitor.id]?.[field] !== undefined)))
console.log('ui save and local garden clock')
check('ui sanitizer preserves valid tab and display settings', JSON.stringify(game.sanitizeUi({ tab: 'basket', fontSize: 19, font: 'serif' })) === JSON.stringify({ tab: 'basket', fontSize: 19, font: 'serif', sound: false }))
check('ui sanitizer falls back invalid values', JSON.stringify(game.sanitizeUi({ tab: 'nope', fontSize: 14, font: 'comic' })) === JSON.stringify({ tab: 'garden', fontSize: 15, font: 'system', sound: false }))
check('garden tabs expose nine stable sections', game.GARDEN_TABS.length === 11 && game.GARDEN_TABS[0] === 'garden' && game.GARDEN_TABS[10] === 'settings')
check('day periods honor every boundary', [0, 4, 5, 6, 7, 10, 11, 13, 14, 16, 17, 18, 19, 23].map(hour => game.dayPeriod(new Date(2026, 0, 1, hour).getTime())).join(',') === 'night,night,dawn,dawn,morning,morning,noon,noon,afternoon,afternoon,dusk,dusk,night,night')
const localClockAt = new Date(2026, 6, 8, 17, 23, 41).getTime()
const localClock = game.gardenClock(localClockAt)
check('garden clock follows local device date and time', localClock.time === '17:23:41' && localClock.date === '2026-07-08' && localClock.period === 'dusk' && localClock.zone === Intl.DateTimeFormat().resolvedOptions().timeZone)

console.log('special commissions, visitors and traits')
const specialNow = ecologyNow
const commissionBase = { ...game.freshState(specialNow), coins: 2000, ribbons: 10 }
const offers = game.specialCommissions(commissionBase, specialNow)
check('four special commission kinds are offered', offers.map(offer => offer.kind).join(',') === 'bouquet,loan,breeding,watch')
check('special commissions are period and ground stable', JSON.stringify(offers) === JSON.stringify(game.specialCommissions({ ...commissionBase, seed: 999999 }, specialNow)))
const bouquetOffer = offers.find(offer => offer.kind === 'bouquet')
const bouquetFlowers = game.SPECIES.filter(species => game.isWarm(species.pal.petal) === bouquetOffer.warm).slice(0, 4).map((species, index) => ({ species: species.id, variant: 'base', dna: index + 1 }))
const bouquetAccepted = game.acceptCommission({ ...commissionBase, basket: bouquetFlowers }, bouquetOffer.id, specialNow)
const bouquetReady = game.commissionProgress(bouquetAccepted, bouquetOffer, specialNow, [0, 1, 2])
const bouquetDone = game.completeCommission(bouquetAccepted, bouquetOffer.id, specialNow, [0, 1, 2])
check('bouquet requires three distinct ordinary flowers', bouquetReady.ready === true && bouquetReady.have === 3)
check('bouquet completion consumes exactly the selected indices', bouquetDone.basket.length === 1 && bouquetDone.basket[0].dna === 4)
check('completed bouquet cannot pay twice', game.completeCommission(bouquetDone, bouquetOffer.id, specialNow, [0, 1, 2]) === null)
const loanOffer = offers.find(offer => offer.kind === 'loan')
const loanPlots = loanOffer.species.map(id => ({ species: id, growthMs: game.growMsOf(byId(id)), moisture: 100, dried: false, resident: true, variant: 'base', dna: 100 + loanOffer.species.indexOf(id) }))
const loanState = { ...commissionBase, scenes: { ...commissionBase.scenes, meadow: { ...commissionBase.scenes.meadow, plots: [...loanPlots, null, null, null, null] } } }
const loanAccepted = game.acceptCommission(loanState, loanOffer.id, specialNow)
const loanReady = { ...loanAccepted, study: Object.fromEntries(loanOffer.species.map(id => [id, { observations: 1, reblooms: 0, firstAt: specialNow, lastAt: specialNow }])) }
const loanDone = game.completeCommission(loanReady, loanOffer.id, specialNow)
check('loan requires new observations of both specified resident plants', game.commissionProgress(loanReady, loanOffer, specialNow).ready === true && loanDone.scenes.meadow.plots.filter(Boolean).length === 2)
const breedingOffer = offers.find(offer => offer.kind === 'breeding')
const breedingPlot = { species: 'daisy', growthMs: growMs, moisture: 100, dried: false, resident: true, variant: 'base', tint: 'tulip', dna: 777 }
const breedingState = { ...commissionBase, scenes: { ...commissionBase.scenes, meadow: { ...commissionBase.scenes.meadow, plots: [breedingPlot, null, null, null, null, null] } }, study: {} }
const breedingAccepted = game.acceptCommission(breedingState, breedingOffer.id, specialNow)
check('breeding rejects a pre-acceptance or ordinary historical observation', game.commissionProgress(breedingAccepted, breedingOffer, specialNow).ready === false)
const breedingObserved = game.observeAt(breedingAccepted, 'meadow', 0, specialNow + 1)
check('breeding requires the hybrid resident observed after acceptance', breedingObserved !== null && game.commissionProgress(breedingObserved, breedingOffer, specialNow + 1).ready === true)
const breedingDone = game.completeCommission(breedingObserved, breedingOffer.id, specialNow + 1)
check('breeding rewards a seed without removing the resident', breedingDone.seeds['daisy~tulip'] === 1 && breedingDone.scenes.meadow.plots[0].resident === true)
const watchOffer = offers.find(offer => offer.kind === 'watch')
const watchAccepted = game.acceptCommission(commissionBase, watchOffer.id, specialNow)
const watchReady = { ...watchAccepted, visitors: { ...watchAccepted.visitors, [watchOffer.visitor]: 1 } }
check('watch requires a visitor encountered after acceptance', game.commissionProgress(watchReady, watchOffer, specialNow).ready === true)
const watchDone = game.completeCommission(watchReady, watchOffer.id, specialNow)
check('watch completion cannot be repeated', watchDone.commissionLog.length === 1 && game.completeCommission(watchDone, watchOffer.id, specialNow) === null)
check('accepted commission expires at the next period', game.commissionProgress(watchAccepted, watchOffer, specialNow + game.ECO_PERIOD_MS).active === false)
const specialVisitors = ['bumblebee', 'swallowtail', 'hawkmoth', 'hoverfly'].map(id => game.VISITORS.find(visitor => visitor.id === id))
check('four special visitors are marked special', specialVisitors.every(visitor => visitor?.special === true))
const ordinaryFlower = { species: 'daisy', growthMs: growMs, moisture: 60, dried: false }
check('bumblebee can use a moist ordinary mature flower', game.specialVisitorEligible(specialVisitors[0], ordinaryFlower, commissionBase, 'clear') === true)
check('special visitors reject a dry host', game.specialVisitorEligible(specialVisitors[0], { ...ordinaryFlower, moisture: 49 }, commissionBase, 'clear') === false)
check('resident-only special visitors reject non-residents', game.specialVisitorEligible(specialVisitors[1], ordinaryFlower, commissionBase, 'clear') === false)
const traitPlot = { visits: 3, fed: 2, pollinated: true, guardianVisits: 2, specialVisits: { bumblebee: 1 } }
const traits = game.traitCauses(traitPlot, 'meadow', 'rain', specialNow)
check('new curiosity conditions are included', traits.includes('fasciated') && traits.includes('double') && traits.includes('leafy'))
check('radial curiosity is limited to bilateral host species', game.traitCauses({ ...traitPlot, pollinated: false }, 'meadow', 'clear', specialNow).includes('radial') === false && game.traitCauses({ ...traitPlot, species: 'pansy' }, 'meadow', 'clear', specialNow).includes('radial') === true)

console.log('floating garden geometry')
const miniRect={open:true,minimized:false,x:9999,y:9999,width:390,height:520}
const miniBounded=game.miniGeometry(miniRect,1280,800)
check('floating window stays within a desktop viewport', miniBounded.x+miniBounded.width<=1272 && miniBounded.y+miniBounded.height<=792 && miniBounded.y>=64)
const miniNarrow=game.miniGeometry(miniRect,320,600)
check('floating window fits a narrow viewport', miniNarrow.width<=304 && miniNarrow.height<=520 && miniNarrow.x>=8)
const miniRestored=game.miniGeometry({...miniRect,minimized:false,y:730},1280,800)
check('restoring a minimized window repositions it onscreen', miniRestored.y+miniRestored.height<=792)
check('floating window geometry leaves its input object unchanged', miniRect.x===9999 && miniRect.height===520)

console.log('living bloom appearances')
const liveBase = {...game.freshState(noon), seed:1, scenes:{...game.freshState(noon).scenes,meadow:{...game.freshState(noon).scenes.meadow,plots:[{species:'daisy',growthMs:growMs,moisture:90,dried:false,dna:4567},null,null,null,null,null]}}}
let specialLive
for(let seed=1;seed<10000;seed++){
  const candidate=game.revealBloom({...liveBase,seed},'meadow',0,noon,'overcast')
  if(candidate.scenes.meadow.plots[0].variant==='hidden'){specialLive=candidate;break}
}
check('a special bloom is identified while still planted', specialLive?.scenes.meadow.plots[0].identified===true && specialLive.basket.length===0)
const liveLook=specialLive.scenes.meadow.plots[0]
check('identified bloom does not reroll each tick', game.revealBloom(specialLive,'meadow',0,noon,'rain')===specialLive)
const liveHarvest=game.harvestAt(specialLive,'meadow',0,noon,'overcast')
check('harvest keeps the appearance shown in the plot', liveHarvest.basket[0].variant===liveLook.variant && liveHarvest.basket[0].dna===liveLook.dna)
const liveRetain=game.retainAt(specialLive,'meadow',0,noon)
check('retaining keeps the appearance shown in the plot', liveRetain.scenes.meadow.plots[0].variant===liveLook.variant && liveRetain.seed===specialLive.seed)
const liveSaved=game.sanitize(JSON.parse(JSON.stringify(specialLive)),noon)
check('non-resident identification survives save reload', liveSaved.scenes.meadow.plots[0].identified===true && liveSaved.scenes.meadow.plots[0].variant==='hidden')
const ordinaryLive={...liveBase,scenes:{...liveBase.scenes,meadow:{...liveBase.scenes.meadow,plots:[{...liveBase.scenes.meadow.plots[0],identified:true,variant:'base',traitChecks:[]},null,null,null,null,null]}}}
let curiousLive
for(let seed=1;seed<10000;seed++){
  const candidate=game.revealBloom({...ordinaryLive,seed,scenes:{...ordinaryLive.scenes,meadow:{...ordinaryLive.scenes.meadow,plots:[{...ordinaryLive.scenes.meadow.plots[0],visits:2},null,null,null,null,null]}}},'meadow',0,noon,'overcast')
  if(candidate.scenes.meadow.plots[0].trait==='twin'){curiousLive=candidate;break}
}
check('later visitor experience can reveal a curiosity on the living bloom', curiousLive?.scenes.meadow.plots[0].trait==='twin')
check('a revealed curiosity remains unchanged on harvest', game.harvestAt(curiousLive,'meadow',0,noon,'clear').basket[0].trait==='twin')
check('curiosity checks and appearance survive reload', game.sanitize(JSON.parse(JSON.stringify(curiousLive)),noon).scenes.meadow.plots[0].traitChecks.includes('twin'))
const failedCheck={...ordinaryLive,scenes:{...ordinaryLive.scenes,meadow:{...ordinaryLive.scenes.meadow,plots:[{...ordinaryLive.scenes.meadow.plots[0],visits:2,traitChecks:['twin']},null,null,null,null,null]}}}
check('failed curiosity conditions are not rerolled every second', game.revealBloom(failedCheck,'meadow',0,noon,'overcast')===failedCheck)
check('growth advancement reveals mature plants automatically', game.advanceState(liveBase,noon+1).scenes.meadow.plots[0].identified===true)
check('a charm armed after identification is kept for another flower', game.harvestAt({...specialLive,charm:true},'meadow',0,noon,'overcast').charm===true)

console.log('research seals and permanent branches')
const researchBase = { ...start, researchSeals: 3 }
const careI = game.upgradeResearch(researchBase, 'care')
check('a first research tier costs three seals', careI !== null && careI.researchSeals === 0 && careI.researchSpent === 3)
check('research refuses a second branch without seals', game.upgradeResearch(careI, 'ecology') === null)
check('research refuses an unknown branch', game.upgradeResearch({ ...researchBase, researchSeals: 99 }, 'weather') === null)
const careII = game.upgradeResearch({ ...careI, researchSeals: 6 }, 'care')
check('the second tier costs six seals', careII !== null && game.researchLevel(careII, 'care') === 2)
check('a maxed branch cannot be upgraded again', game.upgradeResearch({ ...careII, researchSeals: 99 }, 'care') === null)
check('tier savings reach twenty and forty percent', near(game.researchFee(careI, daisy) / (8 + Math.ceil(daisy.cost * .25)), 0.8) && near(game.researchFee(careII, daisy) / (8 + Math.ceil(daisy.cost * .25)), 0.6))
check('rebloom fees follow the same care discount and round up', game.researchFee(careII, daisy, true) === Math.ceil((10 + Math.ceil(daisy.cost * .4)) * 0.6))
const exchange = game.exchangeResearch({ ...researchBase, researchSeals: 2 }, 'sprinkler')
check('an exchange spends seals and stocks the bag', exchange !== null && exchange.researchSeals === 0 && exchange.bag.sprinkler === 1)
check('an exchange refuses unknown offers and short balances', game.exchangeResearch(researchBase, 'rose') === null && game.exchangeResearch({ ...researchBase, researchSeals: 0 }, 'charm') === null)
check('spent seals survive a reload', game.sanitize(JSON.parse(JSON.stringify(exchange)), 5).researchSeals === 0 && game.sanitize(JSON.parse(JSON.stringify(exchange)), 5).researchSpent === 2)
check('a legacy save starts with no research levels', game.sanitize({ coins: 10 }, 5).research.care === 0)
const carePlot = { species: 'daisy', growthMs: growMs, moisture: 90, dried: false, resident: true, observedAt: 1 }
const careGarden = { ...careII, coins: game.researchFee(careII, daisy), scenes: { ...careII.scenes, meadow: { ...careII.scenes.meadow, plots: [carePlot, null, null, null, null, null] } } }
check('a care tier lets an observant keeper afford the observation', game.observeAt(careGarden, 'meadow', 0, specialNow) !== null)
check('a care tier discounts the rebloom fee', game.rebloomAt({ ...careGarden, coins: game.researchFee(careII, daisy, true) }, 'meadow', 0, specialNow) !== null)
const ecologyBonus = game.gardenEcology({ ...start, research: { care: 0, ecology: 2, breeding: 0 } }, specialNow).visitorBonus
check('ecology tiers add visitor chance', near(ecologyBonus, game.gardenEcology(start, specialNow).visitorBonus + 0.04))
check('breeding tiers add hybrid chance', near(game.hybridChance({ ...start, research: { care: 0, ecology: 0, breeding: 2 } }) - game.hybridChance(start), 0.1))

console.log('global rewards and supply inventory')
const rewardT = (key,params={}) => (plugin.__dicts.en[key]??key).replace(/\{(\w+)\}/g,(_,name)=>params[name]??`{${name}}`)
const supplyBefore = {...researchBase, bag:{fertilizer:4,compost:0,sprinkler:0,charm:0}, seeds:{'daisy~tulip':2}}
const supplyAfter = game.exchangeResearch(supplyBefore, 'fertilizer')
const exchangeReward = game.rewardForChange(supplyBefore,supplyAfter,rewardT)
check('exchange reward includes the gain and resulting inventory', exchangeReward.spent === 1 && exchangeReward.entries.length === 1 && exchangeReward.entries[0].amount === '+2' && exchangeReward.entries[0].owned === 6)
check('inventory includes supplies and hybrid seed quantities', game.inventoryCount(supplyAfter) === 8)
const upgradeReward = game.rewardForChange(researchBase,careI,rewardT)
check('permanent research reward includes the unlocked effect', upgradeReward.research === true && upgradeReward.spent === 3 && upgradeReward.entries[0].effect.includes('20%'))
check('care actions without a reward do not trigger a reward dialog', game.rewardForChange(supplyBefore,{...supplyBefore,coins:supplyBefore.coins-1},rewardT) === null)
check('opening reward data never changes resources', supplyBefore.bag.fertilizer === 4 && supplyAfter.bag.fertilizer === 6 && supplyAfter.researchSeals === 2)
const breedingReward = game.rewardForChange(breedingObserved,breedingDone,rewardT)
check('special letter reward includes seeds, XP and reputation', ['daisy~tulip','xp','patronage','fertilizer','researchSeals'].every(id=>breedingReward.entries.some(entry=>entry.id===id)))

console.log('discovery journal')
const discoveryBefore = { ...game.freshState(specialNow), specimens: {}, visitors: {}, seeds: {} }
const discoveryAfterRetain = { ...discoveryBefore, scenes: { ...discoveryBefore.scenes, meadow: { ...discoveryBefore.scenes.meadow, plots: [{ species: 'daisy', growthMs: growMs, moisture: 100, dried: false, dna: 2468 }, null, null, null, null, null] } } }
const retainedItems = game.discoveryItems(discoveryBefore, discoveryAfterRetain, 'retain', 'meadow', 0)
check('first retained flower creates a kept discovery with DNA', retainedItems.length === 1 && retainedItems[0].kept === true && retainedItems[0].dna === 2468)
const repeatedBefore = { ...discoveryBefore, specimens: { 'daisy:base': { species: 'daisy', variant: 'base', dna: 2468, count: 1 } }, basket: [{ species: 'daisy', variant: 'base', dna: 2468 }] }
const repeatedAfter = { ...discoveryAfterRetain, specimens: { 'daisy:base': { species: 'daisy', variant: 'base', dna: 2468, count: 2 } }, basket: [{ species: 'daisy', variant: 'base', dna: 2468 }, { species: 'daisy', variant: 'base', dna: 2468 }] }
const repeatedItems = game.discoveryItems(repeatedBefore, repeatedAfter, 'harvest', 'meadow', 0)
check('ordinary repeated flowers do not create discoveries', repeatedItems.length === 0)
const specialFlowerAfter = { ...discoveryAfterRetain, scenes: { ...discoveryAfterRetain.scenes, meadow: { ...discoveryAfterRetain.scenes.meadow, plots: [{ ...discoveryAfterRetain.scenes.meadow.plots[0], variant: 'base', trait: 'double', tint: 'tulip' }, null, null, null, null, null] } } }
const specialFlowerItems = game.discoveryItems(discoveryBefore, specialFlowerAfter, 'retain', 'meadow', 0)
check('trait and tint discoveries retain full flower metadata', specialFlowerItems.length === 1 && specialFlowerItems[0].trait === 'double' && specialFlowerItems[0].tint === 'tulip' && specialFlowerItems[0].dna === 2468)
const seedAfter = { ...discoveryAfterRetain, lastBred: 'daisy~tulip', seeds: { 'daisy~tulip': 1 } }
check('hybrid seed discoveries preserve the seed type', game.discoveryItems(discoveryBefore, seedAfter, 'harvest', 'meadow', 0).some(item => item.type === 'seed' && item.tint === 'tulip'))
const visitorBefore = { ...discoveryBefore, visitors: { bee: 1 } }
const visitorAfter = { ...visitorBefore, visitors: { bee: 2, bumblebee: 1 } }
const visitorItems = game.discoveryItems(visitorBefore, visitorAfter, 'visitor', 'meadow', 0)
check('first visitors and special visitors create discoveries', visitorItems.length === 1 && visitorItems[0].visitor === 'bumblebee')
const recordedDiscovery = game.recordDiscoveries(discoveryBefore, retainedItems, specialNow)
check('recording discoveries does not change game resources', recordedDiscovery.coins === discoveryBefore.coins && recordedDiscovery.basket.length === discoveryBefore.basket.length && recordedDiscovery.discoverySeq === 1)
const fortyOne = Array.from({ length: 41 }, (_, index) => ({ id: index + 1, at: specialNow + index, items: [{ type: 'flower', species: 'daisy', variant: 'base', dna: index }] }))
const savedDiscoveries = game.sanitizeDiscoveries([{ id: 99, at: -1, items: [{ type: 'flower', species: 'daisy' }] }, ...fortyOne])
check('discovery sanitization keeps the latest forty valid entries', savedDiscoveries.length === 40 && savedDiscoveries[0].id === 2 && savedDiscoveries.every(entry => entry.items[0].dna !== undefined))
const roundTripDiscoveries = game.sanitizeDiscoveries(recordedDiscovery.discoveries)
check('discovery records round-trip with DNA and kept metadata', roundTripDiscoveries.length === 1 && roundTripDiscoveries[0].items[0].dna === 2468 && roundTripDiscoveries[0].items[0].kept === true)

console.log('achievements')
const firstBloom = game.ACHIEVEMENTS.find(entry => entry.id === 'firstBloom')
check('ids are unique', new Set(game.ACHIEVEMENTS.map(entry => entry.id)).size === game.ACHIEVEMENTS.length)
check('nothing is ready on a fresh garden', game.ACHIEVEMENTS.every(entry => !game.achievementReady(start, entry)))
check('a fresh garden has opened one ground', game.achievementValue(start, 'grounds') === 1)
check('the first harvest finishes the first goal', game.achievementReady(harvested, firstBloom))
const claimedFirst = game.claimAchievement(harvested, 'firstBloom')
check('collecting pays the reward', claimedFirst.coins === harvested.coins + firstBloom.coins)
check('a reward is collected once', game.claimAchievement(claimedFirst, 'firstBloom') === null)
check('an unfinished goal cannot be collected', game.claimAchievement(harvested, 'harvest30') === null)
check('an unknown goal is refused', game.claimAchievement(harvested, 'moonshot') === null)
check('meeting a visitor counts', game.achievementValue(greeted, 'visitorKinds') === 1)
check('a delivery is counted', deliveredMixed.delivered === 1 && game.achievementValue(deliveredMixed, 'delivered') === 1)
check('spirit kinds are counted', game.achievementValue(gold, 'spiritKinds') === 1)
check('claims survive a reload', game.sanitize(JSON.parse(JSON.stringify(claimedFirst)), 5).claimed.firstBloom === true)
check('every goal is reachable', game.ACHIEVEMENTS.every(entry => entry.target > 0 && entry.coins > 0))

console.log('daily play')
{
const DAY = 86400000
const noon = new Date(2026, 10, 18, 12).getTime()
const playStart = game.freshState(noon)
check('check-in is open on a fresh garden', game.dailyStatus(playStart, noon).available && game.dailyStatus(playStart, noon).index === 0)
const day1 = game.claimDaily(playStart, noon)
check('check-in pays the first reward', day1.coins === playStart.coins + game.DAILY_REWARDS[0].coins && day1.daily.streak === 1)
check('check-in pays once a day', game.claimDaily(day1, noon + 3600000) === null)
const day2 = game.claimDaily(day1, noon + DAY)
check('the next day continues the streak', day2.daily.streak === 2 && day2.bag.fertilizer === 1)
check('a missed day restarts the streak', game.claimDaily(day2, noon + 3 * DAY).daily.streak === 1)
check('check-in survives a reload', game.sanitize(JSON.parse(JSON.stringify(day2)), noon + DAY).daily.streak === 2)
check('a check-in dated in the future is clamped', game.sanitize({ ...JSON.parse(JSON.stringify(day2)), daily: { claimedDay: 9e9, streak: 3 } }, noon).daily.claimedDay === game.localDay(noon))
const questDay = game.advanceState(playStart, noon + 1000)
check('ticking pins today\'s wishes', questDay.quests !== null && questDay.quests.day === game.localDay(noon))
check('an idle tick keeps the same wish record', game.advanceState(questDay, noon + 2000).quests === questDay.quests)
check('three wishes a day, all unstarted', game.dailyQuests(questDay, noon + 1000).length === game.QUEST_SLOTS && game.dailyQuests(questDay, noon + 1000).every(quest => quest.progress === 0))
const busy = { ...questDay, harvested: questDay.harvested + 6, planted: questDay.planted + 5, delivered: questDay.delivered + 1, pollinated: questDay.pollinated + 2, visitors: { bee: 3 } }
const wishes = game.dailyQuests(busy, noon + 5000)
check('wishes follow the day\'s counters', wishes.every(quest => quest.done && !quest.claimed))
check('an unfinished wish cannot be collected', game.claimQuest(questDay, wishes[0].id, noon + 5000) === null)
let wished = busy
for (const quest of wishes) wished = game.claimQuest(wished, quest.id, noon + 5000)
check('wishes pay their coins', wished.coins === busy.coins + wishes.reduce((sum, quest) => sum + quest.coins, 0))
check('clearing all three adds the bonus once', wished.bag.fertilizer === busy.bag.fertilizer + 2 && wished.quests.bonus === true)
check('a wish is collected once', game.claimQuest(wished, wishes[0].id, noon + 5000) === null)
check('wishes start over the next day', game.dailyQuests(wished, noon + DAY).every(quest => quest.progress === 0 && !quest.claimed))
let giftTime = noon
while (game.giftAt(playStart, giftTime) === null) giftTime += game.GIFT_MS
const opened = game.openGift(playStart, giftTime)
check('a surprise box pays something', opened.coins > playStart.coins || Object.values(opened.bag).some(n => n > 0))
check('a surprise box opens once', game.openGift(opened, giftTime) === null && game.giftAt(opened, giftTime) === null)
check('rarity ranks spirit above curiosity above hybrid', game.rarityOf({ variant: 'hidden' }) === 'spirit' && game.rarityOf({ variant: 'base', trait: 'twin' }) === 'curio' && game.rarityOf({ variant: 'base', tint: 'rose' }) === 'hybrid' && game.rarityOf({ variant: 'alt' }) === 'alt')
const sown = game.plantAt(playStart, 'meadow', 0, 'daisy')
const later = game.advanceState(sown, noon + 6 * 3600000)
check('a short absence makes no report', game.awaySummary(sown, game.advanceState(sown, noon + 60000), noon + 60000) === null)
const report = game.awaySummary(sown, later, noon + 6 * 3600000)
check('a long absence reports blooms and thirst', report !== null && report.awayMs === 6 * 3600000 && report.bloomed + report.thirsty === 1)
}

console.log('bouquets and visitor bonds')
{
const at = new Date(2026, 10, 18, 12).getTime()
const bloom = (species, extra = {}) => ({ species, variant: 'base', ...extra })
check('two flowers are not a bouquet', game.arrangeScore([bloom('daisy'), bloom('rose')], at) === null)
const fine = game.arrangeScore([bloom('daisy'), bloom('tulip'), bloom('rose')], at)
check('neighbouring colours, three kinds and a star bloom score well', fine.checks.harmony && fine.checks.variety && fine.checks.focal && fine.stars >= 4)
const dull = game.arrangeScore([bloom('daisy'), bloom('daisy'), bloom('daisy')], at)
check('three of the same flower score lower', !dull.checks.variety && !dull.checks.focal && dull.stars < fine.stars)
check('clashing colours lose the harmony star', game.arrangeScore([bloom('sunflower'), bloom('forgetmenot'), bloom('tulip')], at).checks.harmony === false)
check('opposite colours still agree', game.huesHarmonise([40, 225]) && game.huesHarmonise([10, 30, 60]) && !game.huesHarmonise([0, 120, 240]))
check('a bouquet pays more than its list value', fine.coins > fine.value && fine.coins === Math.round(fine.value * (1 + game.BOUQUET_STAR_BONUS * fine.stars)))
check('exactly one special bloom is the focal flower', game.arrangeScore([bloom('daisy'), bloom('tulip'), bloom('rose', { variant: 'hidden' })], at).checks.focal && !game.arrangeScore([bloom('daisy', { trait: 'twin' }), bloom('tulip'), bloom('rose', { variant: 'hidden' })], at).checks.focal)
const stockedBasket = { ...game.freshState(at), basket: [bloom('daisy'), bloom('tulip'), bloom('rose'), bloom('poppy')] }
const made = game.arrangeBouquet(stockedBasket, [0, 1, 2], at)
check('finishing a bouquet uses the flowers and pays', made.basket.length === 1 && made.basket[0].species === 'poppy' && made.coins === stockedBasket.coins + fine.coins && made.xp === fine.xp && made.arranged === 1 && made.bouquetBest === fine.stars)
check('a bouquet refuses repeats and unknown slots', game.arrangeBouquet(stockedBasket, [0, 0, 1], at) === null && game.arrangeBouquet(stockedBasket, [0, 1, 9], at) === null)
check('every visitor has favourite flowers', game.VISITORS.every(visitor => game.visitorFavourites(visitor.id).length > 0))
check('a stranger takes no gifts', game.giftVisitor(stockedBasket, 'bee', 1) === null)
const friend = { ...stockedBasket, visitors: { bee: 1 } }
const gifted = game.giftVisitor(friend, 'bee', 1)
check('a favourite flower is worth more', game.giftPoints('bee', bloom('tulip')) === 6 && game.giftPoints('bee', bloom('daisy')) === 2 && game.giftPoints('bee', bloom('daisy', { variant: 'hidden' })) === 5)
check('a gift uses the flower and raises the bond', gifted.basket.length === 3 && gifted.affinity.bee === 6 && game.affinityLevel(gifted, 'bee') === 1)
check('reaching a level pays its reward once', gifted.coins === friend.coins + game.AFFINITY_REWARDS[0].coins && game.giftVisitor(gifted, 'bee', 0).coins === gifted.coins)
check('four levels cap the bond', game.affinityLevel({ affinity: { bee: 999 } }, 'bee') === game.AFFINITY_LEVELS.length)
check('greeting a visitor adds to the bond', Object.values(greeted.affinity ?? {}).reduce((sum, n) => sum + n, 0) >= 1)
const reloaded = game.sanitize(JSON.parse(JSON.stringify({ ...made, affinity: { bee: 7, dragon: 3 } })), at)
check('bonds and bouquet records survive a reload', reloaded.affinity.bee === 7 && reloaded.affinity.dragon === undefined && reloaded.arranged === 1 && reloaded.bouquetBest === fine.stars)
}

console.log('genes, lineage and breeding goals')
{
const grades = Object.values(game.genesOf(12345))
check('every plant shows four genes graded one to five', grades.length === 4 && grades.every(n => n >= 1 && n <= 5))
const kid = game.breedDna(12345, 54321, 3)
check('a cross is deterministic', kid === game.breedDna(12345, 54321, 3) && kid > 0 && kid !== game.breedDna(12345, 54321, 4))
const near = [[12345, 54321], [111, 999999], [4242, 31337], [2026, 1118]].every(([m, f]) => {
  const a = game.geneValues(m), b = game.geneValues(f), c = game.geneValues(game.breedDna(m, f, 1))
  return c.every((v, i) => v >= Math.min(a[i], b[i]) - 0.25 && v <= Math.max(a[i], b[i]) + 0.25)
})
check('offspring genes fall between the parents, give or take', near)
check('a cross predicts a range for each gene', Object.values(game.predictGenes(12345, 54321)).length === 4 && Object.values(game.predictGenes(12345, 54321)).every(([lo, hi]) => lo <= hi))
const at = new Date(2026, 10, 18, 12).getTime()
const crossBase = { ...game.freshState(at), seeds: { 'daisy~tulip': 1 } }
const crossed = { ...crossBase, ...game.recordCross(crossBase, 'daisy~tulip', { species: 'daisy', dna: 12345 }, { species: 'tulip', dna: 54321 }) }
check('a hybrid seed remembers its parents', crossed.lineage['daisy~tulip'][0].join() === '12345,54321' && crossed.pedigree[12345].s === 'daisy' && crossed.pedigree[54321].s === 'tulip')
const grownCross = game.plantAt(crossed, 'meadow', 0, 'daisy', 'tulip')
const child = grownCross.scenes.meadow.plots[0]
check('planting it grows the bred child', child.dna === game.breedDna(12345, 54321, crossed.planted) && child.tint === 'tulip')
check('the child joins the family tree as generation one', grownCross.pedigree[child.dna].m === 12345 && grownCross.pedigree[child.dna].f === 54321 && grownCross.pedigree[child.dna].g === 1 && grownCross.lineage['daisy~tulip'] === undefined)
check('a seed without a record still grows', game.plantAt(crossBase, 'meadow', 0, 'daisy', 'tulip').scenes.meadow.plots[0].dna > 0)
check('the earlier hybrid harvest recorded its cross', hybridHarvest.lineage['daisy~tulip'][0].join() === '12345,54321')
let tallDna = 1
while (game.genesOf(tallDna).height !== 5) tallDna += 1
const breeder = { ...crossBase, pedigree: { [tallDna]: { s: 'daisy', g: 1 } } }
const wonGoal = game.goalPatch(breeder, { species: 'daisy', variant: 'base', dna: tallDna })
check('a bred plant that meets a goal pays it once', wonGoal.goalsDone.tall === true && wonGoal.coins >= breeder.coins + 80 && game.goalPatch({ ...breeder, ...wonGoal }, { dna: tallDna }).goalsDone === undefined)
check('a bought plant cannot claim a breeding goal', Object.keys(game.goalPatch(crossBase, { dna: tallDna })).length === 0)
check('three generations finish the dynasty goal', game.goalPatch({ ...crossBase, pedigree: { 5: { s: 'daisy', g: 3 } } }, { dna: 5 }).goalsDone.dynasty === true)
const kept = game.sanitize(JSON.parse(JSON.stringify({ ...grownCross, goalsDone: { tall: true, nope: true }, pedigree: { ...grownCross.pedigree, 9: { s: 'nope', g: 1 } } })), at)
check('family tree and goals survive a reload', kept.pedigree[child.dna].m === 12345 && kept.pedigree[9] === undefined && kept.goalsDone.tall === true && kept.goalsDone.nope === undefined)
}

console.log('seasons, expeditions and keepsake cards')
{
const HOUR = 3600000
const spring = new Date(2026, 3, 10, 12).getTime(), summer = new Date(2026, 6, 10, 12).getTime()
const autumnNight = new Date(2026, 9, 10, 23).getTime(), winter = new Date(2026, 0, 10, 12).getTime()
check('seasons follow the calendar', game.realSeason(spring) === 0 && game.realSeason(summer) === 1 && game.realSeason(autumnNight) === 2 && game.realSeason(winter) === 3)
const dryPlot = species => ({ species, moisture: 10, dried: true })
check('a flower in its own season has a better spirit chance', near(game.hiddenChance(dryPlot('daisy'), 'overcast', spring, meadow) - game.hiddenChance(dryPlot('daisy'), 'overcast', summer, meadow), game.SEASON_BONUS))
check('a night flower shines after dark', near(game.hiddenChance(dryPlot('lily'), 'overcast', autumnNight, meadow) - game.hiddenChance(dryPlot('daisy'), 'overcast', autumnNight, meadow), game.NIGHT_BONUS))
check('out of season is never a penalty', game.seasonalBonus('daisy', winter) === 0 && game.hiddenChance(dryPlot('daisy'), 'overcast', winter, meadow) >= 0.03)
const rich = { ...game.freshState(spring), coins: 500 }
check('an expedition needs coins and an opened ground', game.startExpedition({ ...rich, coins: 0 }, 'meadow', 'short', spring) === null && game.startExpedition(rich, 'snow', 'short', spring) === null && game.startExpedition(rich, 'meadow', 'nope', spring) === null)
const away = game.startExpedition(rich, 'meadow', 'day', spring)
check('setting out costs coins and sets a return time', away.coins === 440 && away.expedition.end === spring + 4 * HOUR)
check('one party at a time', game.startExpedition(away, 'meadow', 'short', spring) === null)
check('the party cannot be welcomed early', game.claimExpedition(away, spring + 1000) === null)
const back = game.claimExpedition(away, away.expedition.end)
const count = bag => Object.values(bag ?? {}).reduce((sum, n) => sum + n, 0)
check('the party brings something back', back.expedition === null && back.trips === 1 && (back.coins - away.coins) + count(back.bag) - count(away.bag) + count(back.seeds) + back.ribbons - away.ribbons > 0)
check('the haul is fixed at departure', JSON.stringify(game.expeditionLoot(away.expedition)) === JSON.stringify(game.expeditionLoot(away.expedition)))
check('expedition seeds can be sown in that ground', [0, 1, 2, 3, 4, 5, 6, 7].every(n => Object.keys(game.expeditionLoot({ scene: 'meadow', kind: 'long', start: spring + n * 977000 }).seeds).every(key => meadow.species.includes(key.split('~')[0]) && key.split('~')[0] !== key.split('~')[1])))
check('an expedition survives a reload', game.sanitize(JSON.parse(JSON.stringify(away)), spring + 1000).expedition.end === away.expedition.end)
const cardBase = { ...game.freshState(spring), basket: [{ species: 'daisy', variant: 'base', dna: 5 }, { species: 'tulip', variant: 'base' }, { species: 'rose', variant: 'hidden', dna: 9 }, { species: 'poppy', variant: 'base' }] }
const withCard = game.arrangeBouquet(cardBase, [0, 1, 2], spring, 'classic')
check('a finished bouquet leaves a card', withCard.bouquets.length === 1 && withCard.bouquets[0].items.length === 3 && withCard.bouquets[0].vase === 'classic' && withCard.bouquets[0].stars === withCard.bouquetBest && withCard.bouquets[0].items[2].variant === 'hidden')
check('a locked vase falls back to the first one', game.arrangeBouquet(cardBase, [0, 1, 2], spring, 'gold').bouquets[0].vase === 'classic')
check('vases unlock with practice', !game.vaseUnlocked(cardBase, 'round') && game.vaseUnlocked({ arranged: 2 }, 'round') && !game.vaseUnlocked({ arranged: 99 }, 'gold') && game.vaseUnlocked({ bouquetBest: 5 }, 'gold'))
let many = { ...cardBase, arranged: 2, vases: ['round'] }
for (let i = 0; i < game.BOUQUET_CARD_CAP + 3; i += 1) many = game.arrangeBouquet({ ...many, basket: cardBase.basket }, [0, 1, 2], spring + i, 'round')
check('the album keeps the newest bouquet cards', many.bouquets.length === game.BOUQUET_CARD_CAP && many.bouquets[0].id === 4 && many.bouquets[0].vase === 'round')
const pressed = game.pressCard(cardBase, 2, spring)
check('keeping a flower as a card takes it out of the basket', pressed.basket.length === 3 && pressed.cards[0].item.variant === 'hidden' && pressed.cards[0].item.dna === 9 && pressed.coins === cardBase.coins)
check('a card can be taken down', game.removeCard(pressed, 'cards', pressed.cards[0].id).cards.length === 0 && game.removeCard(pressed, 'cards', 999) === null && game.removeCard(pressed, 'coins', 1) === null)
check('a full album refuses another flower card', game.pressCard({ ...cardBase, cards: Array.from({ length: game.FLOWER_CARD_CAP }, (_, i) => ({ id: i + 1, at: 1, item: { species: 'daisy', variant: 'base' } })) }, 0, spring) === null)
const albumReload = game.sanitize(JSON.parse(JSON.stringify({ ...withCard, cards: [{ id: 7, at: spring, item: { species: 'rose', variant: 'hidden', dna: 9 } }, { id: 8, at: spring, item: { species: 'nope' } }] })), spring)
check('the album survives a reload', albumReload.bouquets.length === 1 && albumReload.bouquets[0].items[0].dna === 5 && albumReload.cards.length === 1 && albumReload.cardSeq === 7)
}

console.log('economy sinks and long-term loops')
{
const at = new Date(2026, 10, 18, 12).getTime()
const b = (species, extra = {}) => ({ species, variant: 'base', ...extra })
const rich = { ...game.freshState(at), coins: 50000, arranged: 6 }
check('a vase must be earned and affordable before it is bought', game.buyVase(rich, 'gold') === null && game.buyVase({ ...rich, coins: 10 }, 'round') === null)
const potted = game.buyVase(rich, 'round')
check('buying a vase spends coins once', potted.coins === 50000 - game.VASE_PRICE.round && game.vaseOwned(potted, 'round') && game.buyVase(potted, 'round') === null)
check('an unowned vase falls back to the first one', game.arrangeBouquet({ ...rich, basket: [b('daisy'), b('tulip'), b('rose')] }, [0, 1, 2], at, 'round').bouquets[0].vase === 'classic')
const whites = [b('daisy'), b('lily'), b('rose')]
check('each vase suits a kind of flower', game.vaseMatch('moon', whites) && !game.vaseMatch('moon', [b('rose'), b('tulip'), b('daisy')]) && !game.vaseMatch('classic', whites) && game.vaseMatch('gold', [b('rose', { variant: 'hidden' }), b('daisy')]) && !game.vaseMatch('basket', whites))
const loose = game.arrangeScore(whites, at), suited = game.arrangeScore(whites, at, 'moon')
check('a suiting vase adds ten percent', suited.match === true && loose.match === false && suited.coins === Math.round(suited.value * (1 + game.BOUQUET_STAR_BONUS * suited.stars + game.VASE_MATCH_BONUS)) && suited.coins > loose.coins)
const album = { ...rich, cards: [{ id: 1, at, item: b('rose', { variant: 'hidden' }) }, { id: 2, at, item: b('daisy') }], bouquets: [{ id: 3, at, stars: 4, theme: 'warm', vase: 'classic', coins: 1, items: [b('daisy'), b('tulip'), b('rose')] }] }
check('a shelf without slots holds nothing', game.toggleShelf(album, 'cards', 1) === null)
const oneSlot = game.buyShelfSlot(album)
check('a shelf slot costs coins', oneSlot.coins === 50000 - game.SHELF_PRICES[0] && game.shelfSlots(oneSlot) === 1)
const shown = game.toggleShelf(oneSlot, 'cards', 1)
check('a displayed spirit card raises the spirit chance', near(game.shelfBonus(shown).spirit, 0.01) && game.toggleShelf(shown, 'cards', 2) === null)
check('taking a card off the shelf removes its bonus', game.shelfBonus(game.toggleShelf(shown, 'cards', 1)).spirit === 0)
const two = game.toggleShelf(game.buyShelfSlot(shown), 'bouquets', 3)
check('a displayed bouquet card raises sale prices', near(game.shelfBonus(two).sale, 0.04) && game.quoteSale(two, [b('rose')], undefined).coins === Math.round((1 + 0.04) * 88))
check('a card taken out of the album stops counting', game.shelfBonus(game.removeCard(two, 'cards', 1)).spirit === 0)
const named = game.nameBouquet(two, 3, '  Spring   song  ', 'x'.repeat(99))
check('a bouquet card can be named and inscribed', named.bouquets[0].title === 'Spring song' && named.bouquets[0].note.length === 60 && game.nameBouquet(two, 99, 'a', 'b') === null)
const kept = game.sanitize(JSON.parse(JSON.stringify({ ...named, vases: ['round', 'nope'] })), at)
check('vases, shelf and inscriptions survive a reload', kept.bouquets[0].title === 'Spring song' && kept.shelf.slots === 2 && kept.shelf.cards.length === 2 && kept.vases.join() === 'round')
const shop = { ...rich, basket: [b('rose'), b('rose'), b('rose'), b('daisy')] }
check('the workshop needs a bench', game.startJob(shop, 'dried', [0], at) === null)
const benched = game.buyBench(shop)
const job = game.startJob(benched, 'tea', [0, 1, 2], at)
check('a job takes the flowers and the fee', job.basket.length === 1 && job.coins === benched.coins - 20 && job.workshop.jobs[0].coins === Math.round(88 * 3 * 1) && game.startJob(job, 'dried', [0], at) === null)
check('a recipe needs its exact number of flowers', game.startJob(benched, 'tea', [0, 1], at) === null && game.startJob(benched, 'tea', [0, 0, 1], at) === null)
check('a job cannot be collected early', game.claimJob(job, 0, at + 1000) === null)
const made = game.claimJob(job, 0, at + 30 * 60000)
check('a finished job pays its worth', made.coins === job.coins + Math.round(88 * 3 * 1) && made.crafted === 1 && made.workshop.jobs.length === 0)
check('a running job survives a reload', game.sanitize(JSON.parse(JSON.stringify(job)), at + 1000).workshop.jobs[0].end === at + 30 * 60000)
const meadowCards = ['daisy', 'tulip', 'rose', 'poppy'].map((species, index) => ({ id: index + 1, at, item: b(species) }))
const paged = { ...rich, cards: meadowCards }
check('a card page counts different species of its ground', game.pageProgress(paged, game.PAGES[0]).count === 4)
const pageDone = game.claimPage(paged, 'scene-meadow')
check('a complete page pays once', pageDone.coins === 50300 && game.claimPage(pageDone, 'scene-meadow') === null && game.claimPage(paged, 'scene-snow') === null)
const entry = { ...rich, bouquets: [{ id: 3, at, stars: 5, theme: 'warm', vase: 'classic', coins: 1, match: true, items: [b('daisy'), b('tulip'), b('rose'), b('poppy'), b('lily')] }, { id: 4, at, stars: 1, theme: 'warm', vase: 'classic', coins: 1, items: [b('daisy'), b('daisy'), b('daisy')] }] }
check('a bouquet scores by stars, size and vase', game.bouquetScore(entry.bouquets[0]) === 60 && game.bouquetScore(entry.bouquets[1]) === 13)
const ran = game.enterContest(entry, 3, at)
check('the best bouquet wins the week', ran.contest.rank === 1 && ran.coins === 50000 - game.CONTEST_FEE + 300 && ran.ribbons === 3 && ran.contestWins === 1)
check('a weak bouquet pays the fee and places last', game.enterContest(entry, 4, at).contest.rank === 4 && game.enterContest(entry, 4, at).coins === 50000 - game.CONTEST_FEE)
check('one entry a week', game.enterContest(ran, 3, at + 3600000) === null && game.enterContest(ran, 3, at + 7 * 86400000) !== null)
check('a young garden cannot start over', game.startLegacy(rich, at) === null)
const elder = { ...rich, xp: 60 * 14, cards: meadowCards, vases: ['round'], seeds: { 'daisy~tulip': 2, 'rose~daisy': 1, 'tulip~rose': 1, 'poppy~rose': 1 }, scenes: Object.fromEntries(game.SCENES.map(scene => [scene.id, { ...rich.scenes[scene.id], unlocked: 3 }])) }
const heir = game.startLegacy(elder, at)
check('a legacy resets the garden and keeps the collection', heir.legacy === 1 && heir.coins === game.START_COINS + 100 && heir.xp === 0 && heir.scenes.snow.unlocked === 0 && Object.keys(heir.seeds).length === 3 && heir.cards.length === 4 && heir.vases[0] === 'round')
check('each generation adds a little spirit chance', near(game.shelfBonus(heir).spirit, 0.01))
}

console.log('garden fund and tightened faucets')
{
const at = new Date(2026, 10, 18, 12).getTime()
const flush = { ...game.freshState(at), coins: 50000 }
check('the fund refuses a short purse', game.donateFund({ ...flush, coins: 100 }) === null)
const given = game.donateFund(flush)
check('a contribution spends coins and pays a ribbon', given.coins === 50000 - game.fundCost(0) && given.fund === 1 && given.ribbons === 1 && given.ribbonsEarned === 1)
check('every level costs more, without a cap', game.fundCost(10) > game.fundCost(9) && game.fundCost(60) > 1000000)
check('every fifth level adds a charm', game.donateFund({ ...flush, fund: 4 }).bag.charm === 1 && given.bag.charm === 0)
check('standing rises every five levels', game.fundRank(0) === 0 && game.fundRank(5) === 1 && game.fundRank(999) === 5)
check('the fund survives a reload', game.sanitize(JSON.parse(JSON.stringify(given)), at).fund === 1)
check('bouquets and the workshop no longer print money', game.BOUQUET_STAR_BONUS <= 0.06 && game.VASE_MATCH_BONUS <= 0.05 && game.RECIPES.every(recipe => recipe.mult <= 1.1))
}

console.log('a use for every material')
{
const at = new Date(2026, 10, 18, 12).getTime()
const rich = { ...game.freshState(at), coins: 5000, ribbons: 2, patronage: 25 }
const out = game.startExpedition(rich, 'meadow', 'long', at)
check('reputation sends a bigger expedition', out.expedition.bonus === 2 && game.patronBonus({ patronage: 999 }) === game.PATRON_MAX && game.patronBonus({}) === 0)
check('the extra finds change the haul', JSON.stringify(game.expeditionLoot(out.expedition)) !== JSON.stringify(game.expeditionLoot({ ...out.expedition, bonus: 0 })))
check('rushing needs a ribbon and a party on the road', game.rushExpedition({ ...out, ribbons: 0 }, at + 1000) === null && game.rushExpedition(rich, at) === null)
const rushed = game.rushExpedition(out, at + 1000)
check('a ribbon brings the party back at once', rushed.ribbons === 1 && rushed.expedition.end === at + 1000 && game.claimExpedition(rushed, at + 1000) !== null)
check('rushing does not change the haul', JSON.stringify(game.expeditionLoot(rushed.expedition)) === JSON.stringify(game.expeditionLoot(out.expedition)))
const reloaded = game.sanitize(JSON.parse(JSON.stringify(rushed)), at + 2000)
check('a rushed expedition survives a reload', reloaded.expedition.end === at + 1000 && reloaded.expedition.bonus === 2)
const job = game.startJob({ ...rich, basket: [{ species: 'rose', variant: 'base' }], workshop: { benches: 1, jobs: [] } }, 'dried', [0], at)
const rushedJob = game.rushJob(job, 0, at + 1000)
check('a ribbon finishes a workshop job at once', rushedJob.ribbons === 1 && game.claimJob(rushedJob, 0, at + 1000) !== null && game.rushJob({ ...job, ribbons: 0 }, 0, at + 1000) === null)
check('a rushed job survives a reload', game.sanitize(JSON.parse(JSON.stringify(rushedJob)), at + 2000).workshop.jobs[0].end === at + 1000)
check('knowing a species raises its spirit chance', near(game.studyBonus({ study: { daisy: { observations: 6 } } }, 'daisy'), 0.03) && near(game.studyBonus({ study: { daisy: { observations: 1 } } }, 'daisy'), 0.01) && game.studyBonus({}, 'daisy') === 0)
const counted = { ...rich, arranged: 3, trips: 4, crafted: 5, contestWins: 2, fund: 6, affinity: { bee: 999, robin: 1 }, goalsDone: { tall: true }, cards: [{ id: 1 }] }
check('the new counters feed achievements', ['arranged', 'trips', 'crafted', 'contestWins', 'fund', 'bondsMax', 'goalsDone', 'cards'].map(metric => game.achievementValue(counted, metric)).join() === '3,4,5,2,6,1,1,1')
check('every achievement metric is known', game.ACHIEVEMENTS.every(entry => game.achievementValue({ ...counted, seen: { 'daisy:base': 1, 'daisy:hidden': 1 }, visitors: { bee: 1 }, hybrids: { 'a~b': 1 }, exotics: { 'daisy:twin': 1 }, ribbonsEarned: 1, harvested: 1, delivered: 1, pollinated: 1 }, entry.metric) > 0))
}

console.log('companions, garden events and the daily brief')
{
const at = new Date(2026, 10, 18, 12).getTime()
const HOUR = 3600000
const host = { ...game.freshState(at), coins: 5000, visitors: { bee: 9 }, affinity: { bee: 999 } }
check('only a best friend with coins to spare moves in', game.inviteCompanion({ ...host, affinity: { bee: 1 } }, 'bee') === null && game.inviteCompanion({ ...host, coins: 10 }, 'bee') === null)
const housed = game.inviteCompanion(host, 'bee')
check('inviting costs coins once', housed.coins === 5000 - game.COMPANION_COST && housed.companions.join() === 'bee' && game.inviteCompanion(housed, 'bee') === null)
const planted = game.plantAt(housed, 'meadow', 0, 'daisy')
const first = game.companionTick(planted, at)
check('a companion starts counting from now', first.companionHour === Math.floor(at / HOUR) && !first.scenes.meadow.plots[0].pollinated)
check('nothing happens within the hour', game.companionTick(first, at + 60000) === first)
check('a pollinator companion pollinates a plant each hour', game.companionTick(first, at + HOUR).scenes.meadow.plots[0].pollinated === true)
check('ticking the garden lets companions work', game.advanceState(game.advanceState(planted, at + 1000), at + HOUR + 2000).scenes.meadow.plots[0].pollinated === true)
check('a companion can be sent home', game.dismissCompanion(housed, 'bee').companions.length === 0 && game.dismissCompanion(host, 'bee') === null)
let when = at
while (game.eventAt(host, when) === null) when += game.EVENT_MS
const event = game.eventAt(host, when)
const joined = game.joinEvent(planted, when)
check('a passing event can be caught once', joined.events === 1 && game.eventAt(joined, when) === null && game.joinEvent(joined, when) === null)
check('the event leaves its mark', event.type === 'rainbow' ? game.boostBonus(joined, when + 1000) === game.BOOST_SPIRIT : event.type === 'meteor' ? joined.charm === true : event.type === 'swarm' ? joined.scenes.meadow.plots[0].pollinated === true : joined.scenes.meadow.plots[0].moisture === 100)
check('the event is gone after its window', game.eventAt(host, when + game.EVENT_WINDOW_MS) === null)
check('a rainbow fades', game.boostBonus({ boost: { type: 'rainbow', until: at } }, at + 1) === 0)
const brief = game.briefAt(at)
const good = { stars: 5, coins: 100, checks: { theme: true } }
const items = Array.from({ length: 5 }, () => ({ species: 'daisy', variant: 'base' }))
const paid = game.briefPatch(host, items, good, at)
check('the daily brief pays coins and a ribbon once', brief.stars >= 3 && brief.count >= 3 && paid.coins === 5000 + 100 + game.BRIEF_REWARD.coins && paid.ribbons === 1 && Object.keys(game.briefPatch({ ...host, ...paid }, items, good, at)).length === 0)
check('a bouquet off the brief earns nothing extra', Object.keys(game.briefPatch(host, items.slice(0, 2), good, at)).length === 0 && Object.keys(game.briefPatch(host, items, { ...good, checks: { theme: false } }, at)).length === 0)
check('companions survive a reload', game.sanitize(JSON.parse(JSON.stringify(housed)), at).companions.join() === 'bee')
check('the garden has studio and album tabs', game.GARDEN_TABS.includes('studio') && game.GARDEN_TABS.includes('album'))
}

console.log('every flower has a use')
{
const at = new Date(2026, 10, 18, 12).getTime()
const b = (species, extra = {}) => ({ species, variant: 'base', ...extra })
check('every species has a use', game.SPECIES.every(species => game.flowerUse(species.id) !== null))
const plot = { species: 'daisy', growthMs: 0, moisture: 10, dried: false, dna: 5 }
const fresh = game.freshState(at)
const bed = { ...fresh, scenes: { ...fresh.scenes, meadow: { ...fresh.scenes.meadow, plots: [plot, null, null, null, null, null], soil: [50, 50, 50, 100, 100, 100] } } }
const use = (species, extra) => game.useBloom({ ...bed, basket: [b(species, extra)] }, 0, at)
check('a waterside flower waters the ground', use('iris').scenes.meadow.plots[0].moisture === 100 && use('iris').basket.length === 0 && use('iris').used === 1)
check('a pollen flower pollinates a plant', use('dandelion').scenes.meadow.plots[0].pollinated === true)
check('a seed flower becomes fertiliser, a special one twice', use('sunflower').bag.fertilizer === 1 && use('sunflower', { variant: 'hidden' }).bag.fertilizer === 2)
check('a shelter flower feeds the open plots', use('rose').scenes.meadow.soil.join() === '70,70,70,100,100,100')
check('a nectar flower pleases the visitor that loves it', use('daisy').affinity.butterfly === game.USE_BOND)
check('a night flower raises the spirit chance for a while', game.boostBonus(use('lily'), at + 1000) > 0 && game.boostBonus(use('lily'), at + game.USE_BOOST_MS + 1) === 0)
check('a flower is not wasted when it cannot help', game.useBloom({ ...fresh, basket: [b('dandelion')] }, 0, at) === null && game.useBloom({ ...fresh, basket: [b('iris')] }, 0, at) === null && game.useBloom(fresh, 0, at) === null)
const open = { ...fresh, coins: 0, scenes: Object.fromEntries(game.SCENES.map(scene => [scene.id, { ...fresh.scenes[scene.id], unlocked: 3 }])) }
const today = game.wantedAt(open, at)
check('three different flowers are wanted each day', today.length === 3 && new Set(today).size === 3)
const seenWanted = new Set()
for (let day = 0; day < 36; day += 1) for (const id of game.wantedAt(open, at + day * 86400000)) seenWanted.add(id)
check('every flower is wanted within thirty-six days', seenWanted.size === game.SPECIES.length)
check('a closed ground is never asked for', game.wantedAt(fresh, at).every(id => meadow.species.includes(id)))
check('nothing to hand in without the flower', game.deliverWanted(open, today[0], at) === null && game.deliverWanted({ ...open, basket: [b('daisy')] }, 'nope', at) === null)
const stockedWant = { ...open, basket: today.map(id => b(id)) }
const one = game.deliverWanted(stockedWant, today[0], at)
check('a wanted flower pays double and a little more', one.coins === byId(today[0]).sell * 2 + 10 && one.basket.length === 2 && game.deliverWanted(one, today[0], at) === null)
const all = game.deliverWanted(game.deliverWanted(one, today[1], at), today[2], at)
check('handing in all three adds a ribbon', all.ribbons === 1 && all.wantedDone === 3 && one.ribbons === 0)
check('wanted progress survives a reload and resets the next day', game.sanitize(JSON.parse(JSON.stringify(one)), at).wanted.done.join() === today[0] && game.wantedState(one, at + 86400000).done.length === 0)
}

console.log('four more grounds')
check('the new grounds hold ten species each with profiles and sources', ['alpine','rainforest','coast','garden'].every(id => game.sceneOf(id).species.length === 10) && ['alpine','rainforest','coast','garden'].every(id => game.sceneOf(id).species.every(s => game.ecoProfile(s) !== null && typeof byId(s).source === 'string')))
check('new grounds cost more than the old ones and have visitors', game.sceneOf('alpine').cost > game.sceneOf('desert').cost && ['alpine','rainforest','coast','garden'].every(id => game.VISITORS.some(v => v.scenes.includes(id))))

check('every ground holds at least four species and the favourite visitor of each flower can turn up there', game.SCENES.every(scene => scene.species.length >= 4 && scene.species.every(id => game.VISITORS.find(v => v.id === game.ECO_PROFILES[id].visitor).scenes.includes(scene.id) || ['swallowtail','hoverfly','bumblebee','hawkmoth','kingfisher','honeycreeper','dragonfly','firefly','robin','ladybug','butterfly','bee','moth'].includes(game.ECO_PROFILES[id].visitor))))

check('every ground but the meadow holds exactly ten species', game.SCENES.every(scene => scene.species.length === (scene.id === 'meadow' ? 15 : 10)))

console.log(failures === 0 ? '\nall checks passed' : `\n${failures} check(s) failed`)
process.exit(failures === 0 ? 0 : 1)

console.log('dialogs keep the garden scroll position')
const scroller = { scrollTop: 420 }
const fakeDialog = { open: false, closest: () => scroller, showModal() { this.open = true; scroller.scrollTop = 0 } }
game.showModalPinned(fakeDialog)
check('showing a dialog restores the garden scroll offset', fakeDialog.open === true && scroller.scrollTop === 420)
const stillOpen = { open: true, closest: () => scroller, showModal() { throw new Error('should not reopen') } }
game.showModalPinned(stillOpen)
check('an open dialog is not shown twice', stillOpen.open === true)
game.showModalPinned(null)
game.showModalPinned({ open: false, closest: () => null, showModal() { this.open = true } })
check('a dialog outside a scroller opens normally', game.showModalPinned !== undefined)
