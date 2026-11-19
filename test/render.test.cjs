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
check('garden shows the today card', body.includes('class="fg-today"') && body.includes('data-today="daily"') && body.includes('data-today="brief"'))
check('renders a five-group tablist', (body.match(/id="fg-group-/g) ?? []).length === 5 && game.TAB_GROUP_IDS.length === 5)
check('each section panel exists and grouped sections have sub-tabs', game.GARDEN_TABS.every(id => body.includes(`id="fg-panel-${id}"`)) && game.GARDEN_TABS.filter(id => game.TAB_GROUPS[game.tabGroupOf(id)]?.length > 1).every(id => body.includes(`id="fg-tab-${id}"`) && body.includes(`aria-controls="fg-panel-${id}"`)))
check('garden group is selected by default and settings moved to the gear', body.includes('id="fg-group-garden"') && /id="fg-group-garden"[^>]*aria-selected="true"/.test(body) && body.includes('id="fg-tab-settings"') && body.includes('data-tab="garden"'))
check('all inactive panels are hidden by default', (body.match(/id="fg-panel-[^"]+"[^>]*hidden/g) ?? []).length === 10)
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
const livingMini = stripStyle(renderToStaticMarkup(React.createElement(definition.factory(() => React).__components.MiniGarden, { t })))
check('pocket garden keeps spirit artwork and rarity', livingMini.includes('data-rarity="spirit"') && livingMini.includes('fg-hid-daisy-'))
check('pocket garden labels the curiosity and its trait', livingMini.includes('data-rarity="curio"') && livingMini.includes('Twin') && livingMini.includes('Curiosity'))
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
check('backpack is a native dialog of slots and hides empty stacks', bagDialog.startsWith('<dialog') && (bagDialog.match(/data-supply=/g)??[]).length === 2 && bagDialog.includes('data-kind="seed"') && bagDialog.includes('fg-slotEmpty'))
check('backpack shows stack counts and a detail pane', bagDialog.includes('×6') && bagDialog.includes('×2') && bagDialog.includes('Backpack') && bagDialog.includes('fg-bagDetail'))
check('the global toolbar exposes the backpack', body.includes('Backpack ·'))
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

console.log('backpack, daily play and save safety')
const bloomBag = renderToStaticMarkup(React.createElement(plugin.__components.InventoryDialog,{state:game.sanitize(stocked, Date.now()),t,onClose(){},onGarden(){},onShop(){}}))
check('backpack holds blooms with rarity borders, rarest first', (bloomBag.match(/data-kind="bloom"/g)??[]).length === 3 && bloomBag.indexOf('data-rarity="spirit"') < bloomBag.indexOf('data-rarity="alt"') && bloomBag.includes('Sell · +'))
const playBody = stripStyle(renderToStaticMarkup(React.createElement(GardenView, { t })))
check('the garden shows check-in and wishes in the today card only', playBody.includes('data-today="daily"') && playBody.includes('data-today="wish"') && !playBody.includes('class="fg-play"'))
check('rules sit behind tips, not standing paragraphs', playBody.includes('class="fg-tip"') && !/<p class="fg-hint">Soil:/u.test(playBody))
check('copy states ten grounds', playBody.includes('Ten grounds') && !playBody.includes('Six grounds') && !playBody.includes('Four grounds'))
check('both dictionaries hold exactly the same keys', Object.keys(DICT).length === Object.keys(ZH_DICT).length && Object.keys(DICT).every(key => typeof ZH_DICT[key] === 'string'))
function bootWith(text) { for (const key of [...store.keys()]) store.delete(key); store.set('dsh.flower-garden.v4', text); renderToStaticMarkup(React.createElement(definition.factory(name => React).__components.GardenView, { t })) }
const savedWarn = console.warn; console.warn = () => {}
bootWith('{"v":4,"coins":5000,')
check('a corrupt save is backed up before a fresh start', store.get('dsh.flower-garden.v4.backup-corrupt') === '{"v":4,"coins":5000,')
const newerText = JSON.stringify({ v: 9, coins: 4321, scenes: {} })
bootWith(newerText)
check('a newer-version save is backed up before a fresh start', store.get('dsh.flower-garden.v4.backup-newer') === newerText)
console.warn = savedWarn

console.log('feedback, hotbar, themes and sync')
const hotBody = stripStyle(renderWith(stocked))
check('the garden shows a hotbar of owned supplies only', hotBody.includes('data-hot="fertilizer"') && hotBody.includes('data-hot="sprinkler"') && !hotBody.includes('data-hot="charm"') && hotBody.includes('draggable="true"'))
check('the view carries the region theme', hotBody.includes('data-scene="meadow"') && plugin.__css.includes('.fg-view[data-scene="desert"]'))
check('primary buttons keep a filled background on hover', plugin.__css.includes('.fg-view .fg-btnPrimary:hover:not(:disabled),') && plugin.__css.includes('{background:var(--fg-accent);color:#fff'))
check('research is a skill tree of nodes', (ecologyPanel.match(/class="fg-skillNode"/g) ?? []).length === 6 && ecologyPanel.includes('data-state="next"'))
check('field studies are task cards with progress', ecologyPanel.includes('fg-questChip') && ecologyPanel.includes('<progress'))
check('sound is off unless turned on', game.sanitizeUi({}).sound === false && game.sanitizeUi({ sound: true }).sound === true)
for (const key of [...store.keys()]) store.delete(key)
store.set('dsh.flower-garden.v4', JSON.stringify({ ...game.freshState(Date.now()), coins: 111 }))
const syncGame = definition.factory(name => React).__game
const syncBefore = syncGame.getState().coins
syncGame.adoptStored(JSON.stringify({ ...syncGame.getState(), coins: 999, scene: 'snow' }))
check('another window\'s save is adopted, keeping this window\'s ground', syncBefore === 111 && syncGame.getState().coins === 999 && syncGame.getState().scene === 'meadow')
syncGame.adoptStored('{broken')
check('a broken save from another window is ignored', syncGame.getState().coins === 999)

console.log('arranging table, bonds and the leaner garden head')
const leanBody = stripStyle(renderWith(game.freshState(Date.now())))
check('the garden no longer repeats a plots heading row', !leanBody.includes('Garden plots · Meadow') && !leanBody.includes('fg-gardenControls') && leanBody.includes('class="fg-gardenBar"'))
const craftState = game.sanitize(stocked, Date.now())
const arrangeHtml = renderToStaticMarkup(React.createElement(plugin.__components.ArrangeTable, { state: craftState, t, clock: Date.now(), onChange() {} }))
check('the arranging table shows a vase, four checks and the basket blooms', arrangeHtml.includes('class="fg-vase"') && (arrangeHtml.match(/class="fg-questChip" data-done=/g) ?? []).length === 4 && (arrangeHtml.match(/data-kind="bloom"/g) ?? []).length === 3 && arrangeHtml.includes('Pick 3–7 flowers'))
check('the basket tab carries the arranging table', stripStyle(renderWith(stocked)).includes('id="fg-arrange"'))
const lonely = renderToStaticMarkup(React.createElement(plugin.__components.AffinityBoard, { state: craftState, t, onChange() {} }))
check('bonds ask for a first greeting', lonely.includes('Greet a visitor'))
const bondHtml = renderToStaticMarkup(React.createElement(plugin.__components.AffinityBoard, { state: { ...craftState, visitors: { bee: 2 }, affinity: { bee: 6 } }, t, onChange() {} }))
check('bonds show hearts, favourites, the next reward and giftable blooms', bondHtml.includes('data-bond="bee"') && bondHtml.includes('♥♡♡♡') && bondHtml.includes('Favourites') && bondHtml.includes('Next level') && (bondHtml.match(/data-kind="bloom"/g) ?? []).length === 3)

console.log('genes, family tree and breeding goals')
const geneCard = renderToStaticMarkup(React.createElement(plugin.__components.GeneCard, { dna: 12345, t }))
check('a flower card shows four gene bars', (geneCard.match(/class="fg-genePips"/g) ?? []).length === 4 && (geneCard.match(/<i /g) ?? []).length === 20 && geneCard.includes('Wild type'))
const kinState = { pedigree: { 30: { s: 'daisy', t: 'tulip', m: 10, f: 20, g: 1 }, 10: { s: 'daisy', g: 0 }, 20: { s: 'tulip', g: 0 } } }
const kinTree = renderToStaticMarkup(React.createElement(plugin.__components.Pedigree, { dna: 30, state: kinState, t }))
check('the family tree draws a child and both parents', (kinTree.match(/class="fg-kin"/g) ?? []).length === 3 && kinTree.includes('Mother') && kinTree.includes('Father'))
const goalsHtml = renderToStaticMarkup(React.createElement(plugin.__components.BreedingGoals, { state: { ...game.freshState(Date.now()), goalsDone: { tall: true } }, t }))
check('breeding goals list every target and mark finished ones', (goalsHtml.match(/class="fg-goal"/g) ?? []).length === game.BREED_GOALS.length && (goalsHtml.match(/data-done="true"/g) ?? []).length === 1)
check('the flower guide tab carries the breeding goals', stripStyle(renderWith(game.freshState(Date.now()))).includes('id="fg-goals"'))
check('the bloom detail card carries genes', renderToStaticMarkup(React.createElement(BloomPreview, { id: 'x', speciesId: 'daisy', variant: 'base', dna: 4567, t, onClose() {} })).includes('fg-geneCard'))

console.log('season chip, vases, album and expeditions')
const albumState = { ...craftState, arranged: 6, bouquetBest: 4, bouquets: [{ id: 1, at: Date.now(), stars: 4, theme: 'warm', vase: 'round', coins: 120, items: [{ species: 'daisy', variant: 'base' }, { species: 'tulip', variant: 'base' }, { species: 'rose', variant: 'base' }] }], cards: [{ id: 2, at: Date.now(), item: { species: 'hydrangea', variant: 'hidden', dna: 7 } }] }
const albumHtml = renderToStaticMarkup(React.createElement(plugin.__components.Album, { state: albumState, t, onChange() {} }))
check('the album shows bouquet cards and flower cards', albumHtml.includes('data-card="bouquet-1"') && albumHtml.includes('data-card="flower-2"') && albumHtml.includes('★★★★☆') && albumHtml.includes('Round vase') && albumHtml.includes('data-rarity="spirit"'))
check('an empty album explains itself', renderToStaticMarkup(React.createElement(plugin.__components.Album, { state: craftState, t, onChange() {} })).includes('Every finished bouquet leaves a card'))
const vaseTable = renderToStaticMarkup(React.createElement(plugin.__components.ArrangeTable, { state: albumState, t, clock: Date.now(), onChange() {} }))
check('the arranging table offers six vases and locks the unearned ones', (vaseTable.match(/data-vase="/g) ?? []).length === 6 && (vaseTable.match(/data-earned="false"/g) ?? []).length === 3)
const tripIdle = renderToStaticMarkup(React.createElement(plugin.__components.ExpeditionBoard, { state: craftState, t, clock: Date.now(), onChange() {} }))
check('an idle expedition board offers three trips', (tripIdle.match(/data-expedition="/g) ?? []).length === 3)
const tripOut = renderToStaticMarkup(React.createElement(plugin.__components.ExpeditionBoard, { state: { ...craftState, expedition: { scene: 'meadow', kind: 'short', start: Date.now() - 1000, end: Date.now() + 3599000 } }, t, clock: Date.now(), onChange() {} }))
check('a party on its way shows progress, then a welcome button', tripOut.includes('<progress') && !tripOut.includes('data-action="tripClaim"') && renderToStaticMarkup(React.createElement(plugin.__components.ExpeditionBoard, { state: { ...craftState, expedition: { scene: 'meadow', kind: 'short', start: 1, end: 2 } }, t, clock: Date.now(), onChange() {} })).includes('data-action="tripClaim"'))
check('the garden shows the season chip', leanBody.includes('class="fg-seasonChip"'))
const keepBody = stripStyle(renderWith(stocked))
check('the basket tab carries the album and the requests tab the expedition', keepBody.includes('id="fg-album"') && keepBody.includes('id="fg-trip"'))
check('the backpack can keep a flower as a card', bloomBag.includes('Keep as a card'))

console.log('shelf, card tools, workshop, contest and legacy')
const econState = { ...albumState, coins: 9000, vases: ['round'], shelf: { slots: 2, cards: [{ kind: 'cards', id: 2 }] }, workshop: { benches: 1, jobs: [] } }
const econAlbum = renderToStaticMarkup(React.createElement(plugin.__components.Album, { state: econState, t, onChange() {} }))
check('album cards carry save, shelf and naming tools', (econAlbum.match(/data-action="cardSave"/g) ?? []).length === 2 && econAlbum.includes('data-action="cardName"') && (econAlbum.match(/data-action="cardShelf"/g) ?? []).length === 2)
check('the shelf shows its card, its bonus and the next slot price', econAlbum.includes('data-shelf="cards-2"') && econAlbum.includes('Spirit chance +1%') && econAlbum.includes('Add a slot · 3000 coins') && econAlbum.includes('id="fg-pages"'))
const econTable = renderToStaticMarkup(React.createElement(plugin.__components.ArrangeTable, { state: econState, t, clock: Date.now(), onChange() {} }))
check('vases are owned, for sale or still to be earned', (econTable.match(/data-owned="true"/g) ?? []).length === 2 && econTable.includes('>800<') && econTable.includes('Likes tall plants'))
check('the workshop offers recipes once it has a bench', renderToStaticMarkup(React.createElement(plugin.__components.Workshop, { state: econState, t, clock: Date.now(), onChange() {} })).includes('data-recipe="perfume"') && renderToStaticMarkup(React.createElement(plugin.__components.Workshop, { state: craftState, t, clock: Date.now(), onChange() {} })).includes('Add a bench first'))
const contestHtml = renderToStaticMarkup(React.createElement(plugin.__components.Contest, { state: econState, t, clock: Date.now(), onChange() {} }))
check('the contest lists rivals and takes a bouquet card', contestHtml.includes('Lady Iris') && contestHtml.includes('data-action="contestEnter"') && renderToStaticMarkup(React.createElement(plugin.__components.Contest, { state: craftState, t, clock: Date.now(), onChange() {} })).includes('Arrange a bouquet first'))
check('the legacy board states its condition', renderToStaticMarkup(React.createElement(plugin.__components.LegacyBoard, { state: craftState, t, onStart() {} })).includes('Opens at level 15'))
const econBody = stripStyle(renderWith(stocked))
check('the view mounts the workshop, contest and legacy', econBody.includes('id="fg-work"') && econBody.includes('id="fg-contest"') && econBody.includes('id="fg-legacy"') && econBody.includes('id="fg-shelf"'))

console.log('garden fund board')
const fundHtml = renderToStaticMarkup(React.createElement(plugin.__components.FundBoard, { state: { ...craftState, coins: 9000, fund: 6 }, t, onChange() {} }))
check('the fund board shows standing, level and the next price', fundHtml.includes('Seasoned gardener · level 6') && fundHtml.includes('data-action="fund"') && fundHtml.includes(`Contribute · ${game.fundCost(6)} coins`))
check('the shop tab carries the garden fund', stripStyle(renderWith(stocked)).includes('id="fg-fund"'))

console.log('rush buttons and achievement copy')
check('a party on the road can be rushed with a ribbon', renderToStaticMarkup(React.createElement(plugin.__components.ExpeditionBoard, { state: { ...craftState, ribbons: 1, patronage: 20, expedition: { scene: 'meadow', kind: 'short', start: Date.now() - 1000, end: Date.now() + 3599000 } }, t, clock: Date.now(), onChange() {} })).includes('data-action="tripRush"'))
check('the expedition board shows what reputation adds', renderToStaticMarkup(React.createElement(plugin.__components.ExpeditionBoard, { state: { ...craftState, patronage: 20 }, t, clock: Date.now(), onChange() {} })).includes('Reputation 20 · 2 extra finds'))
check('a running job can be rushed with a ribbon', renderToStaticMarkup(React.createElement(plugin.__components.Workshop, { state: { ...craftState, ribbons: 1, workshop: { benches: 1, jobs: [{ recipe: 'tea', coins: 10, start: Date.now() - 1000, end: Date.now() + 999999 }] } }, t, clock: Date.now(), onChange() {} })).includes('data-action="jobRush"'))
check('every achievement has a name and description in both languages', game.ACHIEVEMENTS.every(entry => ['name', 'desc'].every(part => typeof DICT[`ach.${entry.id}.${part}`] === 'string' && typeof ZH_DICT[`ach.${entry.id}.${part}`] === 'string')))

console.log('new tabs, companions, events, brief and greeting cards')
check('the tab bar has studio and album tabs with icons', leanBody.includes('id="fg-tab-studio"') && leanBody.includes('id="fg-tab-album"') && leanBody.includes('class="fg-tabIcon"'))
const funBody = stripStyle(renderWith(stocked))
const panelOf = id => { const from = funBody.indexOf(`id="fg-panel-${id}"`); const to = funBody.indexOf('id="fg-panel-', from + 10); return funBody.slice(from, to === -1 ? undefined : to) }
check('the studio holds the arranging table and workshop, the album has its own tab', panelOf('studio').includes('id="fg-arrange"') && panelOf('studio').includes('id="fg-work"') && panelOf('album').includes('id="fg-album"') && !panelOf('basket').includes('id="fg-arrange"'))
const palHtml = renderToStaticMarkup(React.createElement(plugin.__components.CompanionBoard, { state: { ...craftState, coins: 5000, visitors: { bee: 3 }, affinity: { bee: 999 } }, t, onChange() {} }))
check('a best friend can be invited to stay', palHtml.includes('data-companion="bee"') && palHtml.includes('data-action="palInvite"') && palHtml.includes('Pollinates one plant an hour'))
check('the companion board explains itself when empty', renderToStaticMarkup(React.createElement(plugin.__components.CompanionBoard, { state: craftState, t, onChange() {} })).includes('Complete the bond'))
let eventTime = Date.now() - (Date.now() % game.EVENT_MS)
while (game.eventAt(craftState, eventTime) === null) eventTime += game.EVENT_MS
check('a passing event shows a button to catch it', renderToStaticMarkup(React.createElement(plugin.__components.EventBanner, { state: craftState, t, clock: eventTime, onJoin() {} })).includes('data-action="event"'))
check('the arranging table shows the daily brief', arrangeHtml.includes('data-brief="open"'))
check('bouquet cards can become greeting cards', econAlbum.includes('data-action="cardGreet"'))

console.log('wanted flowers and using a bloom')
const wantHtml = renderToStaticMarkup(React.createElement(plugin.__components.WantedBoard, { state: craftState, t, clock: Date.now(), onChange() {} }))
check('the wanted board shows three flowers to hand in', (wantHtml.match(/data-wanted="/g) ?? []).length === 3 && wantHtml.includes('Wanted today'))
check('the basket tab carries the wanted board', stripStyle(renderWith(stocked)).includes('id="fg-wanted"'))
check('a bloom in the backpack shows its use and can be used up', bloomBag.includes('data-action="bagUse"') && bloomBag.includes('Use: '))

console.log('pocket garden today strip')
{
const wantToday = game.wantedAt(game.freshState(Date.now()), Date.now())
const ripe = { species: 'daisy', growthMs: game.growMsOf(byId('daisy')), moisture: 60, dried: false, dna: 5, identified: true, variant: 'base', traitChecks: [] }
const pocketBase = game.freshState(Date.now())
store.set('dsh.flower-garden.v4', JSON.stringify({ ...pocketBase, basket: [{ species: wantToday[0], variant: 'base' }], bag: { ...pocketBase.bag, sprinkler: 1 }, scenes: { ...pocketBase.scenes, meadow: { ...pocketBase.scenes.meadow, plots: [ripe, ripe, null, null, null, null] } } }))
const pocket = stripStyle(renderToStaticMarkup(React.createElement(definition.factory(name => React).__components.MiniGarden, { t })))
check('the pocket garden offers check-in and shows wishes', pocket.includes('data-mini="daily"') && pocket.includes('Wishes 0/3'))
check('the pocket garden delivers a wanted flower in one click', pocket.includes(`data-mini="want-${wantToday[0]}"`) && pocket.includes('Wanted 0/3'))
check('the pocket garden harvests everything ripe and runs the sprinkler', pocket.includes('Harvest all · 2') && pocket.includes('Sprinkler ×1'))
check('the pocket garden follows the region theme', pocket.includes('data-scene="meadow"'))
}

check('deleting a card is spelled out in both languages', ['album.warnTitle','album.warnFlower','album.warnBouquet','album.keepIt','album.delete'].every(key => typeof DICT[key] === 'string' && typeof ZH_DICT[key] === 'string') && econAlbum.includes('aria-label="Delete this card"') && !econAlbum.includes('fg-cardWarn'))

check('each vase card names itself and says how to get it', econTable.includes('Round vase') && econTable.includes('In use') && econTable.includes('more bouquets to unlock') && econTable.includes('five-star bouquet') && econTable.includes('fg-vaseHint'))
check('vase paints resolve inside their own drawing', [...econTable.matchAll(/url\(#(fgv-[^)]+)\)/g)].length >= 12 && [...econTable.matchAll(/url\(#(fgv-[^)]+)\)/g)].every(m => econTable.split(`id="${m[1]}"`).length === 2))

console.log('workshop goods on the shelf')
const goodsState = { ...craftState, goods: { dried: 2, tea: 1, perfume: 1 }, visitors: { bee: 2 }, workshop: { benches: 1, jobs: [{ recipe: 'tea', coins: 10, start: 1, end: 2 }] } }
const goodsWork = renderToStaticMarkup(React.createElement(plugin.__components.Workshop, { state: goodsState, t, clock: Date.now(), onChange() {} }))
check('a finished job offers keeping or selling', goodsWork.includes('data-action="jobKeep"') && goodsWork.includes('data-action="jobClaim"') && goodsWork.includes('Keep the Flower tea'))
check('the goods shelf lists three products and a spray button', (goodsWork.match(/data-good="/g) ?? []).length === 3 && goodsWork.includes('data-action="goodsSpray"') && goodsWork.includes('Dried flowers ×2'))
check('the arranging table offers a dried sprig', renderToStaticMarkup(React.createElement(plugin.__components.ArrangeTable, { state: goodsState, t, clock: Date.now(), onChange() {} })).includes('data-action="arrangeDried"') && !arrangeHtml.includes('data-action="arrangeDried"'))
check('a visitor can be served tea', renderToStaticMarkup(React.createElement(plugin.__components.AffinityBoard, { state: goodsState, t, onChange() {} })).includes('data-action="bondTea"'))
check('goods sit in the backpack', renderToStaticMarkup(React.createElement(plugin.__components.InventoryDialog, { state: goodsState, t, onClose() {}, onGarden() {}, onShop() {} })).includes('data-supply="perfume"'))

console.log('vase colour picker')
const tintTable = renderToStaticMarkup(React.createElement(plugin.__components.ArrangeTable, { state: { ...econState, vaseTints: { round: '#aa3355' } }, t, clock: Date.now(), onChange() {} }))
check('the vase shelf offers swatches and a free colour picker', (tintTable.match(/data-tint="/g) ?? []).length === game.VASE_SWATCHES.length && tintTable.includes('type="color"') && tintTable.includes('#aa3355'))
check('a painted vase is drawn in its colour', renderToStaticMarkup(React.createElement(plugin.__components.VaseArt, { id: 'moon', tint: '#336699' })).includes('#336699') && !renderToStaticMarkup(React.createElement(plugin.__components.VaseArt, { id: 'moon' })).includes('#336699'))

console.log('bulk buttons')
check('an empty garden offers random sowing', leanBody.includes('data-action="sowAll"') && leanBody.includes('Random sow · 3') && !leanBody.includes('data-action="harvestAll"'))
check('a ripe plant brings the harvest-all button', stripStyle(renderWith(stocked)).includes('data-action="harvestAll"'))

console.log('several curiosities drawn and named together')
const multiArt = renderToStaticMarkup(React.createElement(FlowerArt, { speciesId: 'daisy', stage: 'bloom', variant: 'base', dna: 4321, trait: 'twin+frost+ember' }))
const twinOnly = renderToStaticMarkup(React.createElement(FlowerArt, { speciesId: 'daisy', stage: 'bloom', variant: 'base', dna: 4321, trait: 'twin' }))
check('a flower shows all of its curiosities at once', multiArt.includes('#8fc4ea') && multiArt.includes('#ff8a2b') && multiArt.length > twinOnly.length && !multiArt.includes('NaN'))
check('combined curiosity paints resolve inside the drawing', [...multiArt.matchAll(/url\(#([^)]+)\)/g)].every(m => multiArt.includes(`id="${m[1]}"`)))
const multiCard = renderToStaticMarkup(React.createElement(BloomPreview, { id: 'm', speciesId: 'daisy', variant: 'base', dna: 4321, trait: 'twin+frost', t, modal: true, onClose() {} }))
check('combined curiosities are named and explained part by part', multiCard.includes('Twin·Frost') && multiCard.includes('Visited at least twice before harvest') && !/>trait\.[^<]*</u.test(multiCard))

console.log('blended curiosity paint in the drawing')
const blendArt = renderToStaticMarkup(React.createElement(FlowerArt, { speciesId: 'daisy', stage: 'bloom', variant: 'base', dna: 4321, trait: 'frost+ember' }))
check('a frost and ember flower carries both colours on its petals', blendArt.includes('#8fbfe6') && blendArt.includes('#e4361e') && !blendArt.includes('NaN') && [...blendArt.matchAll(/url\(#([^)]+)\)/g)].every(m => blendArt.includes(`id="${m[1]}"`)))
const stripedOne = renderToStaticMarkup(React.createElement(FlowerArt, { speciesId: 'rose', stage: 'bloom', variant: 'base', dna: 4321, trait: 'variegated' }))
const stripedCombo = renderToStaticMarkup(React.createElement(FlowerArt, { speciesId: 'rose', stage: 'bloom', variant: 'base', dna: 4321, trait: 'twin+variegated' }))
check('variegated leaves show in a combination too', stripedOne.includes('#f6efc8') === stripedCombo.includes('#f6efc8') && (stripedOne.includes('#f6efc8') || stripedOne.includes('#e6dcae')))

console.log(failures === 0 ? '\nrender checks passed' : `\n${failures} render check(s) failed`)
process.exit(failures === 0 ? 0 : 1)
