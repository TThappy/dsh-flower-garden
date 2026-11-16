/**
 * Static render checks for the Garden view. Renders with `react-dom/server`
 * against the workspace's React and the shipped English dictionary, so a typo,
 * a missing translation key, or a bad element shape fails here instead of in the
 * page. Effects do not run, so timers and storage writes stay out of this test.
 */
const fs = require('node:fs')
const path = require('node:path')
const { createRequire } = require('node:module')

const ROOT = path.join(__dirname, '..')
const BUNDLE = process.env.FG_BUNDLE ?? path.join(ROOT, 'client.js')
// Resolve React from this project so the check never borrows another checkout.
const projectRequire = createRequire(path.join(ROOT, 'package.json'))
let React
let renderToStaticMarkup
try {
  React = projectRequire('react')
  ;({ renderToStaticMarkup } = projectRequire('react-dom/server'))
} catch (error) {
  console.error('The render check needs the dev dependencies.\n  npm install\nthen run: npm run test:render')
  process.exit(1)
}

const store = new Map()
global.window = {
  __ModuleLoader__: {
    load(definition) {
      global.__captured = definition
    },
  },
  localStorage: {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
  },
  setInterval: () => 0,
  clearInterval: () => {},
  setTimeout: () => 0,
  clearTimeout: () => {},
}
global.document = { addEventListener() {}, removeEventListener() {} }

// eslint-disable-next-line no-eval
eval(fs.readFileSync(BUNDLE, 'utf8'))
const definition = global.__captured
if (definition === undefined) throw new Error('the bundle did not register a module')

const plugin = definition.factory(name => {
  if (name !== 'react') throw new Error(`unexpected require(${name})`)
  return React
})
const game = plugin.__game
const { GardenView, FlowerArt, BloomPreview } = plugin.__components
const DICT = plugin.__dicts.en

const t = (key, params) => {
  const template = DICT[key] ?? key
  if (params === undefined) return template
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match))
}

function stripStyle(text) {
  return text.replace(/<style>[\s\S]*?<\/style>/u, '')
}

let failures = 0
function check(label, condition, detail) {
  if (condition) {
    console.log(`  ok   ${label}`)
    return
  }
  failures += 1
  console.log(`  FAIL ${label}${detail === undefined ? '' : ` — ${detail}`}`)
}

/** Rebuild the module closure so a render reads the saved snapshot. */
function renderWith(state) {
  store.set('dsh.flower-garden.v3', JSON.stringify({ ...state, lastTick: Date.now() }))
  const fresh = definition.factory(name => React)
  return renderToStaticMarkup(React.createElement(fresh.__components.GardenView, { t }))
}

const UNRESOLVED = /(?:^|>)((?:view|plot|stage|seed|species|latin|codex|time|reward|error|basket|order|hint|action|stat|weather|scene|variant)\.[a-zA-Z.]+)</u
const byId = id => game.SPECIES.find(species => species.id === id)

console.log('empty garden')
let html = renderToStaticMarkup(React.createElement(GardenView, { t }))
let body = stripStyle(html)
check('renders the view shell', html.includes('class="fg-view"'))
check('renders the title', body.includes('My garden'))
check('shows four scenes', (body.match(/class="fg-sceneChip"/g) ?? []).length === 4)
check('opens on the meadow', body.includes('data-active="true"'))
check('three scenes are still locked', (body.match(/data-locked="true"/g) ?? []).length === 3)
check('a locked scene shows its price', body.includes('Unlock · 150 coins'))
check('renders six plot cards', (body.match(/class="fg-plot"/g) ?? []).length === 6)
check('three plots accept a seed', (body.match(/\+ Plant/g) ?? []).length === 3)
check('three plots are locked', (body.match(/data-state="locked"/g) ?? []).length === 3)
check('shows the starting coins', body.includes('>25<'))
check('shows the scene weather', /Clear|Overcast|Rain/u.test(body))
check('lists two bouquet orders', (body.match(/class="fg-order"/g) ?? []).length === 2)
check('the basket starts empty', body.includes('The basket is empty'))
check('the flower book is collapsed', body.includes('aria-expanded="false"'))
check('the flower book counts every entry', body.includes(`0/${game.CODEX_ENTRIES.length}`))
check('ships its stylesheet', html.includes('.fg-view{'))
check('explains the reset', body.includes('Reset garden'))
check('lists the shop while empty', (body.match(/class="fg-item"/g) ?? []).length === 4)
check('every translation key resolves', !UNRESOLVED.test(body), (UNRESOLVED.exec(body) ?? [])[1])

console.log('stocked garden with every scene open')
const base = game.freshState(Date.now())
const stocked = {
  ...base,
  coins: 640,
  xp: 130,
  harvested: 9,
  unlocked: 4,
  basket: [
    { species: 'daisy', variant: 'base' },
    { species: 'daisy', variant: 'base' },
    { species: 'tulip', variant: 'alt' },
    { species: 'hydrangea', variant: 'hidden' },
  ],
  bag: { fertilizer: 2, sprinkler: 1, charm: 0 },
  basketLevel: 1,
  charm: false,
  seen: { 'daisy:base': 4, 'tulip:alt': 1, 'hydrangea:hidden': 1, 'snowdrop:base': 2 },
  scenes: {
    meadow: {
      unlocked: 4,
      plots: [
        { species: 'rose', growthMs: game.growMsOf(byId('rose')), moisture: 30, dried: false },
        { species: 'daisy', growthMs: 15000, moisture: 100, dried: false },
        { species: 'tulip', growthMs: 75000, moisture: 20, dried: false },
        { species: 'daisy', growthMs: 20000, moisture: 0, dried: true },
        null,
        null,
      ],
    },
    snow: { unlocked: 3, plots: [null, null, null, null, null, null] },
    volcano: { unlocked: 0, plots: [null, null, null, null, null, null] },
    lake: { unlocked: 0, plots: [null, null, null, null, null, null] },
  },
}
html = renderWith(stocked)
body = stripStyle(html)
check('renders the rose art', body.includes('>Rose<'))
check('shows a harvest action for a bloom', body.includes('>Harvest<'))
check('reports a bloom progress bar', body.includes('aria-valuenow="100"'))
check('shows the level from experience', body.includes('Lv.3'))
check('renders the young daisy', body.includes('>Daisy<'))
// Rain keeps the meadow wet, so the drying warning only appears in dry weather.
const currentWeather = (body.match(/data-weather="([a-z]+)"/u) ?? [])[1]
check('dries before it blooms', currentWeather === 'rain' || body.includes('Dries in about'))
check('two scenes are open now', (body.match(/data-locked="true"/g) ?? []).length === 2)
check('groups the basket by bloom', (body.match(/class="fg-bloom"/g) ?? []).length === 3)
check('marks the gold bloom', body.includes('data-variant="hidden"'))
check('the gold bloom sells for triple', body.includes('+336'))
check('offers to sell everything', body.includes('Sell all'))
check('basket chips open a bloom', (body.match(/data-basket="/g) ?? []).length === 3)
check('basket chips start collapsed', (body.match(/aria-expanded="false"/g) ?? []).length >= 3)
check('basket chips name the view action', body.includes('View Daisy'))
check('shows the upgraded basket size', body.includes('/18'))
check('lists four shop items', (body.match(/class="fg-item"/g) ?? []).length === 4)
check('offers to buy each item', (body.match(/Buy · /g) ?? []).length === 4)
check('offers the sprinkler for this ground', body.includes('Use here'))
check('offers to feed a growing plot', (body.match(/>Feed</g) ?? []).length >= 1)
check('names the ground', body.includes('Meadow'))
check('keeps every key resolvable', !UNRESOLVED.test(body), (UNRESOLVED.exec(body) ?? [])[1])

console.log('an empty basket on a full garden')
const full = {
  ...stocked,
  basket: new Array(game.basketCapacity(stocked)).fill({ species: 'daisy', variant: 'base' }),
  scenes: {
    ...stocked.scenes,
    meadow: {
      unlocked: 4,
      sprinklerUntil: Date.now() + 12 * 60 * 1000,
      plots: [
        { species: 'daisy', growthMs: game.growMsOf(byId('daisy')), moisture: 60, dried: false },
        null, null, null, null, null,
      ],
    },
  },
}
const fullBody = stripStyle(renderWith(full))
check('the basket section warns', fullBody.includes('Basket full'))
check('a bloomed plot explains the full basket', fullBody.includes('sell some flowers before harvesting'))
check('harvest is disabled while full', /data-action="harvest"[^>]*disabled/u.test(fullBody))
check('reports the running sprinkler', fullBody.includes('Auto-water'))
check('a sprinkled plot is not paused', !/data-paused="true"/u.test(fullBody))

console.log('the basket detail panel')
const preview = renderToStaticMarkup(React.createElement(BloomPreview, {
  id: 'fg-basket-preview',
  speciesId: 'hydrangea', variant: 'hidden', t, armed: false, worth: 672,
  meta: ['×2', t('basket.each', { n: 336 }), t('basket.total', { n: 672 })],
  onSell() {}, onClose() {},
}))
check('shows the bloom itself', preview.includes('url(#fg-hid-hydrangea-petal)') && preview.includes('fg-sparkle'))
check('names the flower and the variant', preview.includes('Hydrangea') && preview.includes('Spirit'))
check('gives the latin name', preview.includes('Hydrangea macrophylla'))
check('gives the meaning', preview.includes('Hope, and coming together'))
check('counts the blooms', preview.includes('×2'))
check('prices one bloom', preview.includes('336 each'))
check('prices the group', preview.includes('672 total'))
check('offers to sell and to close', preview.includes('Sell all · +672') && preview.includes('Close'))
const armedPreview = renderToStaticMarkup(React.createElement(BloomPreview, {
  id: 'fg-basket-preview',
  speciesId: 'daisy', variant: 'base', t, armed: true, worth: 10,
  meta: ['×1'], onSell() {}, onClose() {},
}))
check('selling asks for a second click', armedPreview.includes('Confirm sell · +10'))
const codexCard = renderToStaticMarkup(React.createElement(BloomPreview, {
  id: 'fg-codex-preview',
  speciesId: 'daisy', variant: 'alt', t, meta: ['Other colour', t('codex.harvests', { n: 3 })],
  onClose() {},
}))
check('the flower book card shows the bloom', codexCard.includes('#f7c6d4'))
check('the flower book card has no sell button', !codexCard.includes('Sell all'))
check('the flower book card reports the harvests', codexCard.includes('Harvested 3×'))
check('the flower book card can be closed', codexCard.includes('Close'))

console.log('species artwork')
const sizes = new Set()
for (const species of game.SPECIES) {
  const art = renderToStaticMarkup(React.createElement(FlowerArt, { speciesId: species.id, stage: 'bloom', variant: 'base' }))
  sizes.add(art.length)
  check(`${species.id} draws its palette`, art.includes(`"${species.pal.petal}"`) || art.includes(`"${species.pal.petalDeep}"`))
  check(`${species.id} renders a head`, art.includes('<g'))
}
check('the heads are not all one drawing', sizes.size >= 18)
const altArt = renderToStaticMarkup(React.createElement(FlowerArt, { speciesId: 'daisy', stage: 'bloom', variant: 'alt' }))
check('the second colour changes the drawing', altArt.includes('#f7c6d4'))
const spiritArt = renderToStaticMarkup(React.createElement(FlowerArt, { speciesId: 'daisy', stage: 'bloom', variant: 'hidden' }))
check('the spirit bloom paints a pearl gradient', spiritArt.includes('url(#fg-hid-daisy-petal)') && spiritArt.includes('#fffdf6'))
check('the spirit bloom carries an aura', spiritArt.includes('url(#fg-hid-daisy-aura)') && spiritArt.includes('fg-haloRing'))
check('the spirit bloom sparkles', (spiritArt.match(/fg-sparkle/g) ?? []).length === 5)
check('the spirit bloom drifts', (spiritArt.match(/fg-mote/g) ?? []).length === 3)
const plainArt = renderToStaticMarkup(React.createElement(FlowerArt, { speciesId: 'daisy', stage: 'bloom', variant: 'base' }))
check('a plain bloom has no aura', !plainArt.includes('fg-haloRing') && !plainArt.includes('fg-sparkle'))
for (const stage of ['seed', 'sprout', 'bud']) {
  check(`grows through the ${stage} stage`, renderToStaticMarkup(React.createElement(FlowerArt, { speciesId: 'lotus', stage, variant: 'base' })).length > 80)
}

console.log(failures === 0 ? '\nrender checks passed' : `\n${failures} render check(s) failed`)
process.exit(failures === 0 ? 0 : 1)
