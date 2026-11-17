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
const { GardenView, FlowerArt, BloomPreview, VisitorArt, GardenActivities, VisitorPreview, GardenEcology, SpeciesPurpose, SpecialCommissionBoard, ScenePanorama, DiscoveryCard } = plugin.__components
const DICT = plugin.__dicts.en
const ZH_DICT = plugin.__dicts.zh

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
  for (const key of ['dsh.flower-garden.v4', 'dsh.flower-garden.v3', 'dsh.flower-garden.v2', 'dsh.flower-garden.v1']) store.delete(key)
  store.set('dsh.flower-garden.v4', JSON.stringify({ ...state, v: 4, lastTick: Date.now() }))
  const fresh = definition.factory(name => React)
  return renderToStaticMarkup(React.createElement(fresh.__components.GardenView, { t }))
}

const UNRESOLVED = /(?:^|>)((?:view|plot|stage|seed|species|latin|codex|time|reward|error|basket|order|hint|action|stat|weather|scene|variant|visitor|market|ach|item)\.[a-zA-Z.]+)</u
const byId = id => game.SPECIES.find(species => species.id === id)

console.log('empty garden')
let html = renderToStaticMarkup(React.createElement(GardenView, { t }))
let body = stripStyle(html)
check('renders the view shell', html.includes('class="fg-view"'))
check('renders the title', body.includes('My garden'))
check('shows every scene', (body.match(/class="fg-sceneChip"/g) ?? []).length === game.SCENES.length)
check('opens on the meadow', body.includes('data-active="true"'))
check('all but the starting scene are locked', (body.match(/data-locked="true"/g) ?? []).length === game.SCENES.length - 1)
check('a locked scene shows its price', body.includes('Unlock · 150 coins'))
check('renders six plot cards', (body.match(/class="fg-plot"/g) ?? []).length === 6)
check('three plots accept a seed', (body.match(/\+ Plant/g) ?? []).length === 3)
check('three plots are locked', (body.match(/data-state="locked"/g) ?? []).length === 3)
check('shows the starting coins', body.includes('>25<'))
check('shows the scene weather', /Clear|Overcast|Rain/u.test(body))
const orderSection = body.slice(body.indexOf('>Bouquet orders</h3>')).split('</section>')[0]
check('lists two bouquet orders', (orderSection.match(/class="fg-order"/g) ?? []).length === 2)
check('the basket starts empty', body.includes('The basket is empty'))
check('the flower book is collapsed', body.includes('aria-expanded="false"'))
check('the flower book counts every entry', body.includes(`0/${game.CODEX_ENTRIES.length}`))
check('ships its stylesheet', html.includes('.fg-view{'))
check('explains the reset', body.includes('Reset garden'))
check('offers save export and import', body.includes('id="fg-export"') && body.includes('id="fg-import"') && body.includes('id="fg-reset"'))
check('the save file input is hidden and json-only', body.includes('class="fg-fileInput"') && body.includes('accept="application/json,.json"') && !body.includes('id="fg-import-confirm"'))
check('lists the shop while empty', (body.match(/class="fg-item"/g) ?? []).length === 5)
check('names the market favourite', body.includes('Market today') && body.includes('sells +50%'))
check('lists every visitor as unseen', (body.match(/class="fg-guest"[^>]*data-met="false"/g) ?? []).length === game.VISITORS.length)
check('explains the visitors', body.includes('Visitor field guide') && (body.match(/class="fg-guest"/g) ?? []).length === game.VISITORS.length)
check('the achievements start collapsed', body.includes('id="fg-ach-toggle"') && !body.includes('class="fg-ach"'))
check('counts the achievements', body.includes(`0/${game.ACHIEVEMENTS.length}`))
check('renders a nine-tab tablist', (body.match(/role="tab"/g) ?? []).length === 9 && (body.match(/role="tablist"/g) ?? []).length === 1)
check('each tab controls a matching panel', game.GARDEN_TABS.every(id => body.includes(`id="fg-tab-${id}"`) && body.includes(`aria-controls="fg-panel-${id}"`) && body.includes(`id="fg-panel-${id}"`)))
check('garden is the only selected and visible default tab', (body.match(/aria-selected="true"/g) ?? []).length === 1 && body.includes('id="fg-tab-garden"') && body.includes('data-tab="garden"'))
check('all inactive panels are hidden by default', (body.match(/id="fg-panel-[^"]+"[^>]*hidden/g) ?? []).length === 8)
check('default font variable is persisted in the view style', body.includes('--fg-font-size:15px') && body.includes('--fg-font-family:system-ui'))
check('every translation key resolves', !UNRESOLVED.test(body), (UNRESOLVED.exec(body) ?? [])[1])
for (const key of ['basket.pricing', 'basket.first', 'show.confirm']) {
  check(`English dictionary contains ${key}`, typeof DICT[key] === 'string' && DICT[key].length > 0)
  check(`Chinese dictionary contains ${key}`, typeof ZH_DICT[key] === 'string' && ZH_DICT[key].length > 0)
}

console.log('floating garden surface')
check('main garden exposes a floating window entry', body.includes('Garden window'))
const miniRenderState=game.freshState(Date.now())
store.set('dsh.flower-garden.v4',JSON.stringify({...miniRenderState, v:4}))
const miniFactory=definition.factory(name=>React)
const miniBody=stripStyle(renderToStaticMarkup(React.createElement(miniFactory.__components.MiniGarden,{t})))
check('mini garden renders only unlocked plots and planting controls', (miniBody.match(/data-mini-plot=/g)??[]).length===3 && miniBody.includes('Choose seed') && miniBody.includes('Water all'))
check('mini garden does not duplicate full garden tabs', !miniBody.includes('role="tablist"') && !miniBody.includes('id="fg-panel-'))
check('mini window copy resolves in both languages', Object.keys(DICT).filter(key=>key.startsWith('mini.')).every(key=>typeof ZH_DICT[key]==='string'))
const miniVisitorPlot={species:'daisy',growthMs:game.growMsOf(byId('daisy')),moisture:90,dna:111,identified:true,variant:'base',traitChecks:[]}
let miniVisitorAt=new Date(2026,0,1,12,0,0).getTime()
for(let attempt=0;attempt<1000 && game.visitorAt('meadow',0,miniVisitorPlot,miniVisitorAt,game.weatherAt(miniVisitorAt))===null;attempt++)miniVisitorAt+=game.VISIT_MS
const miniVisitorState={...game.freshState(miniVisitorAt),scenes:{...game.freshState(miniVisitorAt).scenes,meadow:{...game.freshState(miniVisitorAt).scenes.meadow,plots:[miniVisitorPlot,null,null,null,null,null]}}}
const miniGuest=game.visitorAt('meadow',0,miniVisitorPlot,miniVisitorAt,game.weatherAt(miniVisitorAt))
const miniRealNow=Date.now
Date.now=()=>miniVisitorAt
store.set('dsh.flower-garden.v4',JSON.stringify(miniVisitorState))
const miniVisitorFactory=definition.factory(name=>React)
const miniVisitorBody=stripStyle(renderToStaticMarkup(React.createElement(miniVisitorFactory.__components.MiniGarden,{t})))
Date.now=miniRealNow
check('mini garden shows a visitor as a clickable illustrated button', miniGuest!==null && miniVisitorBody.includes(`data-mini-visitor="${miniGuest.id}"`) && /<button[^>]*class="fg-miniVisitor"[^>]*>[\s\S]*?<svg/u.test(miniVisitorBody))
check('mini visitor button has an accessible greeting action', miniVisitorBody.includes(`aria-label="${t('visitor.greet',{name:t(`visitor.${miniGuest.id}`)})}"`))
const miniGreeted=game.greetVisitor(miniVisitorState,'meadow',0,miniVisitorAt,game.weatherAt(miniVisitorAt))
check('mini visitor greeting records the encounter and pays its tip', miniGreeted.visitors[miniGuest.id]===1 && miniGreeted.coins===miniVisitorState.coins+miniGuest.tip)
const miniRegistrations=[]
plugin.apply({locale:{bind:()=>t,register:()=>()=>{}},effect:callback=>callback(),slots:{inject:(name,callback)=>callback(),register:(options,component)=>{miniRegistrations.push({options,component});return()=>{}}}})
check('mini garden belongs to the global shell overlay', miniRegistrations.some(entry=>entry.options.name==='shell.overlay' && entry.options.id==='flower-garden-mini' && entry.component===plugin.__components.FloatingGarden))

console.log('visible living variants')
const livingRenderBase=game.freshState(Date.now())
const livingRenderState={...livingRenderBase,scenes:{...livingRenderBase.scenes,meadow:{...livingRenderBase.scenes.meadow,plots:[{species:'daisy',growthMs:game.growMsOf(byId('daisy')),moisture:90,dna:123,identified:true,variant:'hidden',traitChecks:[]},{species:'daisy',growthMs:game.growMsOf(byId('daisy')),moisture:90,dna:456,identified:true,variant:'base',trait:'twin',traitChecks:['twin']},null,null,null,null]}}}
const livingBody=stripStyle(renderWith(livingRenderState))
const livingGarden=livingBody.slice(livingBody.indexOf('id="fg-panel-garden"'),livingBody.indexOf('id="fg-panel-basket"'))
check('a living spirit renders its actual special art before harvest', livingGarden.includes('data-variant="hidden"') && livingGarden.includes('fg-hid-daisy-') && livingGarden.includes('Spirit'))
check('a living curiosity has its actual trait and visible label', livingGarden.includes('data-trait="twin"') && livingGarden.includes('Twin'))

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
const basketSavedBody = stripStyle(renderWith({ ...stocked, ui: { tab: 'basket', fontSize: 17, font: 'serif' } }))
check('saved basket tab selects only the basket panel', basketSavedBody.includes('data-tab="basket"') && basketSavedBody.includes('id="fg-tab-basket"') && basketSavedBody.includes('aria-selected="true"') && basketSavedBody.includes('id="fg-panel-basket"'))
check('saved basket tab hides the garden panel', /id="fg-panel-garden"[^>]*hidden/u.test(basketSavedBody))
check('saved font settings reach the view variables', basketSavedBody.includes('--fg-font-size:17px') && basketSavedBody.includes('Songti SC') && basketSavedBody.includes('Georgia'))
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
check('two scenes are open now', (body.match(/data-locked="true"/g) ?? []).length === game.SCENES.length - 2)
check('groups the basket by bloom', (body.match(/class="fg-bloom"/g) ?? []).length === 3)
check('marks the gold bloom', body.includes('data-variant="hidden"'))
const favourite = game.featuredSpecies(game.sanitize(stocked, Date.now()), Date.now())
check('the gold bloom sells for triple', body.includes(`+${game.salePrice(byId('hydrangea'), 'hidden', favourite)}`))
// Nine harvests and one spirit bloom finish two goals; they show even while collapsed.
check('finished achievements are offered while collapsed', (body.match(/data-action="claim"/g) ?? []).length === 2 && body.includes('First bloom') && body.includes('A first spirit'))
check('the achievements header counts what is waiting', body.includes('2 to collect'))
check('offers to sell everything', body.includes('Sell all'))
check('basket chips open a bloom', (body.match(/data-basket="/g) ?? []).length === 3)
check('basket chips start collapsed', (body.match(/aria-expanded="false"/g) ?? []).length >= 3)
check('basket chips name the view action', body.includes('View Daisy'))
check('shows the upgraded basket size', body.includes('/30'))
check('lists five shop items', (body.match(/class="fg-item"/g) ?? []).length === 5)
check('offers to buy each shop item', (body.match(/Buy · /g) ?? []).length === 5)
check('offers the sprinkler for this ground', body.includes('Use here'))
check('offers to feed a growing plot', (body.match(/>Feed</g) ?? []).length >= 1)
check('names the ground', body.includes('Meadow'))
check('keeps every key resolvable', !UNRESOLVED.test(body), (UNRESOLVED.exec(body) ?? [])[1])
const activities = renderToStaticMarkup(React.createElement(GardenActivities, {
  state: game.sanitize(stocked, Date.now()), t, clock: Date.now(), onChange() {},
}))
check('renders the flower show activity panel', activities.includes('aria-label="Flower show"') && activities.includes('Flower show'))
check('renders the garden works activity panel', activities.includes('aria-label="Garden works"') && activities.includes('Garden works'))
check('activity cards carry stable order semantics', (activities.match(/class="fg-order"/g) ?? []).length >= 3)
const specialBoard = renderToStaticMarkup(React.createElement(SpecialCommissionBoard, {
  state: game.sanitize(stocked, Date.now()), t, clock: Date.now(), onChange() {}, onSpecies() {}, onVisitor() {},
}))
check('renders four special commission offers', specialBoard.includes('id="fg-special-commissions"') && (specialBoard.match(/data-commission="/g) ?? []).length === 4)
check('special board exposes period-stable offer controls', specialBoard.includes('commission.accept') || specialBoard.includes('Accept'))
const ecologyPanel = renderToStaticMarkup(React.createElement(GardenEcology, {
  state: game.sanitize(stocked, Date.now()), t, clock: Date.now(), onChange() {}, onSpecies() {},
}))
check('renders the ecology panel and projects', ecologyPanel.includes('id="fg-ecology"') && ecologyPanel.includes('ecoProjects'))
check('ecology makes permanent research and seal exchange discoverable', ecologyPanel.includes('Permanent research tree') && ecologyPanel.includes('Seal exchange'))
check('research displays branch tiers, costs and insufficient balances', ecologyPanel.includes('Unlock I · 3 seals') && ecologyPanel.includes('Need 3 more seals') && ecologyPanel.includes('Plant care · 0/2'))
check('research shop displays supplies and bag counts', ecologyPanel.includes('Fertiliser ×2') && ecologyPanel.includes('Exchange · 1 seals') && ecologyPanel.includes('In bag:'))
const researchedPanel = renderToStaticMarkup(React.createElement(GardenEcology, {
  state: {...game.sanitize(stocked, Date.now()), researchSeals: 5, researchSpent: 9, research: {care: 2, ecology: 0, breeding: 0}}, t, clock: Date.now(), onChange() {}, onSpecies() {},
}))
check('researched panel shows permanent tier and lifetime total', researchedPanel.includes('Fully researched') && researchedPanel.includes('5 available · 14 earned in total') && researchedPanel.includes('40%'))
check('research keys resolve in both languages', Object.keys(DICT).filter(key=>key.startsWith('research.')).every(key=>typeof ZH_DICT[key] === 'string') && !/>research\.[^<]+</u.test(ecologyPanel))
const modalBagState = {...game.freshState(Date.now()), researchSeals:2, bag:{fertilizer:6,compost:0,sprinkler:1,charm:0}, seeds:{'daisy~tulip':2}}
const bagDialog = renderToStaticMarkup(React.createElement(plugin.__components.InventoryDialog,{state:modalBagState,t,onClose(){},onGarden(){},onShop(){}}))
check('supply bag is a native dialog with four supply types', bagDialog.startsWith('<dialog') && (bagDialog.match(/data-supply=/g)??[]).length === 4)
check('supply bag displays actual quantities, seeds and usage guidance', bagDialog.includes('Owned ×6') && bagDialog.includes('Owned ×2') && bagDialog.includes('Hybrid seeds') && bagDialog.includes('Choose a growing plant'))
check('the global toolbar exposes the supply bag', body.includes('Supply bag ·'))
const globalReward = renderToStaticMarkup(React.createElement(plugin.__components.RewardDialog,{state:modalBagState,t,reward:{spent:1,research:false,entries:[{id:'fertilizer',label:'Fertiliser',amount:'+2',owned:6}]},onClose(){},onBag(){}}))
check('reward uses a global native golden dialog', globalReward.startsWith('<dialog') && globalReward.includes('fg-rewardDialog') && globalReward.includes('Rewards received'))
check('reward shows actual gain, resulting stock and remaining seals', globalReward.includes('+2') && globalReward.includes('Now in bag ×6') && globalReward.includes('Research seals remaining: 2'))
check('reward stays actionable with close and bag controls', globalReward.includes('View supply bag') && globalReward.includes('Keep rewards'))
check('inventory and reward copy resolve in both locales', Object.keys(DICT).filter(key=>key.startsWith('inventory.')||key.startsWith('reward.')).every(key=>typeof ZH_DICT[key] === 'string'))
const visitorPreview = renderToStaticMarkup(React.createElement(VisitorPreview, { visitorId: 'bee', state: stocked, t, onClose() {} }))
check('visitor preview uses a native dialog and source link', visitorPreview.startsWith('<dialog') && visitorPreview.includes('fg-source') && visitorPreview.includes('Apis spp.'))
const purpose = renderToStaticMarkup(React.createElement(SpeciesPurpose, { speciesId: 'daisy', observations: 3, t }))
check('species purpose shows role and study level', purpose.includes('fg-purpose') && purpose.includes('Research records: 3'))
check('every species has an ecology profile', game.SPECIES.every(species => game.ecoProfile(species.id) !== null))
check('visitor info covers every visitor', game.VISITORS.every(visitor => game.VISITOR_INFO[visitor.id] && typeof game.VISITOR_INFO[visitor.id].role === 'string'))

console.log('visitors, pollination and the water-all button')
// Find a moment when a visitor is on plot #1, then render at exactly that moment.
const roseBloom = { species: 'rose', growthMs: game.growMsOf(byId('rose')), moisture: 30, dried: false, pollinated: true }
let visitAt = new Date(2026, 5, 1, 12, 0, 0).getTime()
while (game.visitorAt('meadow', 0, roseBloom, visitAt, game.weatherAt(visitAt)) === null
  || game.weatherAt(visitAt) === 'rain') visitAt += game.VISIT_MS
const realNow = Date.now
Date.now = () => visitAt
const visited = {
  ...stocked,
  visitors: { bee: 2 },
  scenes: { ...stocked.scenes, meadow: { ...stocked.scenes.meadow, plots: [roseBloom, ...stocked.scenes.meadow.plots.slice(1)] } },
}
const visitedBody = stripStyle(renderWith(visited))
Date.now = realNow
const guestId = game.visitorAt('meadow', 0, roseBloom, visitAt, game.weatherAt(visitAt)).id
check('a visitor waits on the open flower', visitedBody.includes(`data-visitor="${guestId}"`) && visitedBody.includes('data-action="greet"'))
check('the visitor button is labelled', visitedBody.includes(`Greet the ${t(`visitor.${guestId}`)}`))
check('the pollinated flower says so', visitedBody.includes('Pollinated · harvest ×2'))
check('a met visitor is named in the list', visitedBody.includes('honey bee') && visitedBody.includes('data-met="true"'))
check('offers to water the dry plots at once', /data-action="waterAll"[^>]*>Water all · [23]</u.test(visitedBody))
check('visitor keys resolve', !UNRESOLVED.test(visitedBody), (UNRESOLVED.exec(visitedBody) ?? [])[1])
for (const visitor of game.VISITORS) {
  check(`${visitor.id} has a drawing`, renderToStaticMarkup(React.createElement(VisitorArt, { id: visitor.id })).length > 300)
}

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
check('shows the bloom itself', /url\(#fg-hid-hydrangea-[^)]*-petal\)/u.test(preview) && preview.includes('fg-sparkle'))
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
const modalPreview = renderToStaticMarkup(React.createElement(BloomPreview, {
  id: 'fg-modal-preview', speciesId: 'daisy', variant: 'base', dna: 12345,
  trait: 'twin', tint: 'tulip', t, modal: true, meta: ['×1'], onClose() {},
}))
check('flower detail uses a native modal dialog', modalPreview.startsWith('<dialog') && modalPreview.includes('class="fg-dialog"'))
check('modal detail exposes an accessible flower label', modalPreview.includes('aria-label="Twin Tulip-coloured Daisy"'))
check('modal detail includes species fact and individual controls', modalPreview.includes('It closes at night and in rain') && modalPreview.includes('Show another plant'))
check('modal detail explains curiosity and hybrid provenance', modalPreview.includes('Visited at least twice before harvest') && modalPreview.includes('Hybrids:'))
check('flower details default to living presentation and hide specimen controls outside the guide', modalPreview.includes('data-presentation="living"') && modalPreview.includes('Living plant') && !modalPreview.includes('View specimen'))
const guideLivingPreview=renderToStaticMarkup(React.createElement(BloomPreview,{id:'fg-guide-living',speciesId:'daisy',variant:'base',dna:12345,trait:'twin',t,modal:true,allowSpecimen:true,onClose(){}}))
check('guide offers an explicit specimen action without making it the default', guideLivingPreview.includes('View specimen') && guideLivingPreview.includes('aria-pressed="false"') && !guideLivingPreview.includes('data-presentation="specimen"'))
const explicitSpecimen=renderToStaticMarkup(React.createElement(FlowerArt,{speciesId:'daisy',stage:'bloom',variant:'base',dna:12345,trait:'twin',presentation:'specimen'}))
check('explicit specimen rendering has a separate presentation', explicitSpecimen.includes('data-presentation="specimen"') && explicitSpecimen.includes('fg-flowerSpecimen'))
const dnaArtA = renderToStaticMarkup(React.createElement(FlowerArt, { speciesId: 'daisy', stage: 'bloom', variant: 'base', dna: 12345, trait: 'twin', tint: 'tulip' }))
const dnaArtB = renderToStaticMarkup(React.createElement(FlowerArt, { speciesId: 'daisy', stage: 'bloom', variant: 'base', dna: 54321, trait: 'twin', tint: 'tulip' }))
const plainDaisyArt = renderToStaticMarkup(React.createElement(FlowerArt, { speciesId: 'daisy', stage: 'bloom', variant: 'base' }))
check('DNA changes the rendered individual', dnaArtA !== plainDaisyArt)
const tintOnlyArt = renderToStaticMarkup(React.createElement(FlowerArt, { speciesId: 'daisy', stage: 'bloom', variant: 'base', dna: 12345, tint: 'tulip' }))
check('tint changes the flower rendering', tintOnlyArt !== plainDaisyArt)

const discoveryCard = renderToStaticMarkup(React.createElement(DiscoveryCard, {
  entry: { id: 1, at: Date.now(), items: [{ type: 'flower', species: 'daisy', variant: 'base', dna: 2468, kept: true }, { type: 'seed', species: 'daisy', tint: 'tulip', variant: 'base' }] },
  t, onClose() {}, onOpen() {},
}))
check('discovery card is a readable native dialog', discoveryCard.startsWith('<dialog') && discoveryCard.includes('fg-discoveryDialog') && discoveryCard.includes('Daisy') && discoveryCard.includes('Keep this discovery'))
check('discovery card exposes a timestamp and open action', discoveryCard.includes('<time') && discoveryCard.includes('Open field guide'))

console.log('scene panorama')
const panoramaPeriods = ['dawn', 'morning', 'noon', 'afternoon', 'dusk', 'night']
const panoramaWeather = ['clear', 'overcast', 'rain']
let panoramaCount = 0
let panoramaValid = true
for (const scene of game.SCENES) for (const period of panoramaPeriods) for (const weather of panoramaWeather) {
  const panorama = renderToStaticMarkup(React.createElement(ScenePanorama, { sceneId: scene.id, period, weather }))
  panoramaCount += 1
  const defined = new Set([...panorama.matchAll(/ id="([^"]+)"/gu)].map(match => match[1]))
  panoramaValid = panoramaValid && !panorama.includes('NaN') && [...panorama.matchAll(/url\(#([^)]+)\)/gu)].every(match => defined.has(match[1]))
}
check('renders every scene six-period three-weather panorama', panoramaCount === game.SCENES.length * panoramaPeriods.length * panoramaWeather.length && panoramaValid)
check('panorama distinguishes daytime and night lighting', renderToStaticMarkup(React.createElement(ScenePanorama, { sceneId: 'meadow', period: 'noon', weather: 'clear' })) !== renderToStaticMarkup(React.createElement(ScenePanorama, { sceneId: 'meadow', period: 'night', weather: 'clear' })))

console.log('flower paint isolation')
const repeatedPaintArt=renderToStaticMarkup(React.createElement('div',null,
  React.createElement(FlowerArt,{speciesId:'snapdragon',stage:'bloom',variant:'base',trait:'twin',dna:777}),
  React.createElement(FlowerArt,{speciesId:'snapdragon',stage:'bloom',variant:'base',trait:'twin',dna:777}),
  React.createElement(FlowerArt,{speciesId:'snapdragon',stage:'bloom',variant:'base',trait:'rainbow',dna:888}),
  React.createElement(FlowerArt,{speciesId:'snapdragon',stage:'bloom',variant:'hidden',dna:999}),
  React.createElement(FlowerArt,{speciesId:'snapdragon',stage:'bloom',variant:'hidden',dna:999})))
const repeatedPaintIds=[...repeatedPaintArt.matchAll(/ id="([^"]+)"/gu)].map(match=>match[1])
check('repeated flowers have independent paint definitions',new Set(repeatedPaintIds).size===repeatedPaintIds.length)
check('each repeated flower resolves paint within its own SVG', repeatedPaintArt.split('<svg').slice(1).every(svg=>{const own=new Set([...svg.matchAll(/ id="([^"]+)"/gu)].map(match=>match[1]));return [...svg.matchAll(/url\(#([^)]+)\)/gu)].every(match=>own.has(match[1]))}))
check('flower fills retain a color fallback when gradient paint is unavailable', /fill="url\(#[^)]+\) #[0-9a-fA-F]{6}"/u.test(repeatedPaintArt))
check('rainbow snapdragons retain their full petal colors', ['#7d6be0','#4fb8e8','#6fd49a','#f6d95a','#f58ab0'].every(color=>repeatedPaintArt.includes(color)))

console.log('species artwork')
const sizes = new Set()
for (const species of game.SPECIES) {
  const art = renderToStaticMarkup(React.createElement(FlowerArt, { speciesId: species.id, stage: 'bloom', variant: 'base' }))
  sizes.add(art.length)
  check(`${species.id} draws its palette`, art.includes(`"${species.pal.petal}"`) || art.includes(`"${species.pal.petalDeep}"`))
  check(`${species.id} renders a head`, art.includes('<g'))
}
check('every species has its own drawing', sizes.size === game.SPECIES.length, sizes.size)
const altArt = renderToStaticMarkup(React.createElement(FlowerArt, { speciesId: 'daisy', stage: 'bloom', variant: 'alt' }))
check('the second colour changes the drawing', altArt.includes('#f7c6d4'))
const spiritArt = renderToStaticMarkup(React.createElement(FlowerArt, { speciesId: 'daisy', stage: 'bloom', variant: 'hidden' }))
check('the spirit bloom paints a pearl gradient', /url\(#fg-hid-daisy-[^)]*-petal\)/u.test(spiritArt) && spiritArt.includes('#fffdf6'))
check('the spirit bloom carries an aura', /url\(#fg-hid-daisy-[^)]*-aura\)/u.test(spiritArt) && spiritArt.includes('fg-haloRing'))
check('the spirit bloom sparkles', (spiritArt.match(/fg-sparkle/g) ?? []).length === 5)
check('the spirit bloom drifts', (spiritArt.match(/fg-mote/g) ?? []).length === 3)
const plainArt = renderToStaticMarkup(React.createElement(FlowerArt, { speciesId: 'daisy', stage: 'bloom', variant: 'base' }))
check('a plain bloom has no aura', !plainArt.includes('fg-haloRing') && !plainArt.includes('fg-sparkle'))
for (const stage of ['seed', 'sprout', 'bud']) {
  check(`grows through the ${stage} stage`, renderToStaticMarkup(React.createElement(FlowerArt, { speciesId: 'lotus', stage, variant: 'base' })).length > 80)
}
check('petals are shaded base to tip', plainArt.includes('<linearGradient') && plainArt.includes('url(#fg-daisy-base-'))
check('every gradient a drawing uses is defined', game.SPECIES.every(species => ['base', 'alt', 'hidden'].every(variant => ['bud', 'bloom'].every(stage => {
  const art = renderToStaticMarkup(React.createElement(FlowerArt, { speciesId: species.id, stage, variant }))
  const defined = new Set([...art.matchAll(/ id="([^"]+)"/gu)].map(match => match[1]))
  return [...art.matchAll(/url\(#([^)]+)\)/gu)].every(match => defined.has(match[1]))
}))))
check('each ground has its own footing', new Set(['daisy', 'snowdrop', 'lehua', 'lotus'].map(id => {
  const art = renderToStaticMarkup(React.createElement(FlowerArt, { speciesId: id, stage: 'seed', variant: 'base' }))
  return art.slice(0, art.indexOf('</g>'))
})).size === 4)
const stageArt = new Set(game.SPECIES.flatMap(species => ['sprout', 'bud', 'bloom'].map(stage => renderToStaticMarkup(React.createElement(FlowerArt, { speciesId: species.id, stage, variant: 'base' })))))
check('every species looks different at bud and bloom', stageArt.size >= game.SPECIES.length * 2 + 8, stageArt.size)

console.log(failures === 0 ? '\nrender checks passed' : `\n${failures} render check(s) failed`)
process.exit(failures === 0 ? 0 : 1)
