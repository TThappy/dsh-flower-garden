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
check('four scenes', game.SCENES.length === 4)
check('twenty-five species', game.SPECIES.length === 25)
check('every species belongs to exactly one scene', game.SPECIES.every(species => game.SCENES.filter(scene => scene.species.includes(species.id)).length === 1))
check('every scene starts with at least four species', game.SCENES.every(scene => scene.species.length >= 5))
check('ids are unique', new Set(game.SPECIES.map(species => species.id)).size === 25)
check('each species names a drawing and a foliage', game.SPECIES.every(species => typeof species.head === 'string' && typeof species.leaf === 'string'))
check('each species has a palette', game.SPECIES.every(species => typeof species.pal.petal === 'string'))
check('every species pays back its seed', game.SPECIES.every(species => species.sell > species.cost))
check('prices rise with grow time', game.SCENES.every(scene => scene.species.every((id, index) => {
  if (index === 0) return true
  const current = byId(id)
  const previous = byId(scene.species[index - 1])
  return current.growSec > previous.growSec && current.sell > previous.sell
})))
check('codex covers base, second colour and hidden', game.CODEX_ENTRIES.length === 25 + game.SPECIES.filter(species => species.alt !== undefined).length + 25)
check('scenes cost more as they go', game.SCENES[0].cost === 0
  && game.SCENES[1].cost < game.SCENES[2].cost
  && game.SCENES[2].cost < game.SCENES[3].cost)

console.log('fresh state')
const start = game.freshState(1000)
check('starts with 25 coins', start.coins === 25)
check('opens on the meadow', start.scene === 'meadow')
check('every scene exists', Object.keys(start.scenes).length === 4)
check('only the meadow is open', start.scenes.meadow.unlocked === 3
  && start.scenes.snow.unlocked === 0
  && start.scenes.volcano.unlocked === 0
  && start.scenes.lake.unlocked === 0)
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
const shop = { ...game.freshState(0), coins: 400 }
const bought = game.buyItem(shop, 'fertilizer')
check('a fertiliser leaves the bag with one', bought.bag.fertilizer === 1)
check('buying spends the price', bought.coins === shop.coins - 35)
check('an unaffordable item is refused', game.buyItem({ ...shop, coins: 10 }, 'sprinkler') === null)
check('an unknown item is refused', game.buyItem(shop, 'rocket') === null)
const lv1 = game.buyItem(shop, 'basket')
check('the basket upgrade levels up', lv1.basketLevel === 1)
check('the upgraded basket holds more', game.basketCapacity(lv1) === 18)
const lv2 = game.buyItem(lv1, 'basket')
check('the upgrade caps at level 2', lv2.basketLevel === 2 && game.basketCapacity(lv2) === 24)
check('a maxed upgrade is refused', game.buyItem(lv2, 'basket') === null)

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

console.log(failures === 0 ? '\nall checks passed' : `\n${failures} check(s) failed`)
process.exit(failures === 0 ? 0 : 1)
