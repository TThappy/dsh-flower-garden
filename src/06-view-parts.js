    // ---------------------------------------------------------------------
    // §6 View.
    // ---------------------------------------------------------------------
const GARDEN_TABS = ['garden','basket','studio','album','orders','ecology','show','shop','flowers','visitors','settings']
function sanitizeUi(raw) {
  return { tab: GARDEN_TABS.includes(raw?.tab) ? raw.tab : 'garden', fontSize: [13,15,17,19].includes(raw?.fontSize) ? raw.fontSize : 15,
    font: ['system','serif','rounded'].includes(raw?.font) ? raw.font : 'system', sound: raw?.sound === true }
}
function dayPeriod(now) {
  const hour=new Date(now).getHours()
  return hour<5||hour>=19?'night':hour<7?'dawn':hour<11?'morning':hour<14?'noon':hour<17?'afternoon':'dusk'
}
function gardenClock(now) {
  const date=new Date(now),pad=n=>String(n).padStart(2,'0')
  return {time:`${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,date:`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`,
    zone:Intl.DateTimeFormat().resolvedOptions().timeZone,period:dayPeriod(now)}
}
Object.assign(zh,{
 'tabs.garden':'花园','tabs.basket':'花篮','tabs.orders':'委托','tabs.ecology':'生态研究','tabs.show':'花展与设施','tabs.shop':'道具商店','tabs.flowers':'花卉图鉴','tabs.visitors':'访客图鉴','tabs.settings':'设置与成就',
 'tabs.label':'花园功能','settings.title':'阅读与显示','settings.size':'文字大小','settings.font':'字体风格','settings.system':'系统字体','settings.serif':'宋体 / 衬线','settings.rounded':'圆润 / 无衬线','settings.preview':'一株花，一段慢慢生长的故事。','settings.note':'字号、字体与当前标签会保存在本浏览器的花园存档中。字体使用本机已安装字体，不下载外部资源。','settings.reset':'花园存档',
 'clock.dawn':'清晨','clock.morning':'上午','clock.noon':'中午','clock.afternoon':'下午','clock.dusk':'傍晚','clock.night':'夜晚','clock.local':'本地时间','clock.note':'跟随设备本地时间与时区，场景光照随时段变化；天气是游戏模拟。','clock.scene':'{scene} · {period}',
})
Object.assign(en,{
 'tabs.garden':'Garden','tabs.basket':'Basket','tabs.orders':'Requests','tabs.ecology':'Ecology','tabs.show':'Shows & facilities','tabs.shop':'Shop','tabs.flowers':'Flowers','tabs.visitors':'Visitors','tabs.settings':'Settings & goals',
 'tabs.label':'Garden sections','settings.title':'Reading & display','settings.size':'Text size','settings.font':'Font style','settings.system':'System','settings.serif':'Serif','settings.rounded':'Rounded / sans-serif','settings.preview':'A flower, and a story that grows slowly.','settings.note':'Text size, font and current tab are saved with this browser’s garden. Fonts use installed local families; nothing is downloaded.','settings.reset':'Garden save',
 'clock.dawn':'Dawn','clock.morning':'Morning','clock.noon':'Noon','clock.afternoon':'Afternoon','clock.dusk':'Dusk','clock.night':'Night','clock.local':'Local time','clock.note':'Uses your device’s local clock and time zone. Scene lighting follows the time of day; weather is simulated.','clock.scene':'{scene} · {period}',
})

// scene-panorama.fragment.js
// Insert inside the client factory. Depends only on React's h helper.
// Static, self-contained panorama art: no images, network, timers or DOM access.
const PANORAMA_GROUND = {meadow:'#3f624b',snow:'#b8d2da',volcano:'#754b46',lake:'#6da6ae',woodland:'#365d48',desert:'#ac8058'}
function ScenePanorama({ sceneId, period = 'noon', weather = 'clear', garden = false }) {
  const night = period === 'night'
  const dawn = period === 'dawn'
  const dusk = period === 'dusk'
  weather = weather === 'rain' && sceneId === 'snow' ? 'snow' : weather === 'rain' && ['volcano','desert'].includes(sceneId) ? 'ash' : weather
  const prefix = `fg-pan-${sceneId}-${period}-${weather}${garden?'-garden':''}`
   const height = garden ? 900 : 300
   const foreground = PANORAMA_GROUND[sceneId] ?? PANORAMA_GROUND.meadow
  const sky = night ? '#101c35' : dawn ? '#e9b99e' : dusk ? '#d68b79' : period === 'morning' ? '#9bc7dc' : period === 'afternoon' ? '#75abc6' : '#7ab8d7'
  const haze = night ? '#293653' : dawn || dusk ? '#f0b58c' : '#cfe4e6'
  const sun = night ? null : dusk ? { cx: 930, cy: 76, r: 25, fill: '#ffc384' } : dawn ? { cx: 205, cy: 84, r: 23, fill: '#ffe0a5' } : { cx: period === 'morning' ? 350 : period === 'afternoon' ? 950 : 650, cy: period === 'noon' ? 35 : 64, r: 27, fill: '#fff1b6' }
  const star = night ? Array.from({ length: 18 }, (_, i) => h('circle', { key: `star-${i}`, cx: 50 + ((i * 173) % 1080), cy: 22 + ((i * 67) % 110), r: i % 4 ? 1.2 : 1.8, fill: '#f7f4d4', opacity: .65 })) : []
  const cloud = (x, y, scale, key, dark = false) => h('g', { key, transform: `translate(${x} ${y}) scale(${scale})`, opacity: dark ? .42 : .54 },
    h('ellipse', { cx: 0, cy: 16, rx: 74, ry: 17, fill: dark ? '#67768d' : '#e8f0ed' }),
    h('ellipse', { cx: -38, cy: 9, rx: 31, ry: 23, fill: dark ? '#728199' : '#f3f6ed' }),
    h('ellipse', { cx: 13, cy: 1, rx: 43, ry: 34, fill: dark ? '#6f7d94' : '#f6f8f2' }),
    h('ellipse', { cx: 51, cy: 12, rx: 28, ry: 20, fill: dark ? '#66758d' : '#e8f0ed' }))
  const rain = weather === 'rain' ? Array.from({ length: 34 }, (_, i) => h('path', { key: `rain-${i}`, d: `M${22 + (i * 71) % 1160},${88 + (i * 31) % 110}l-8,25`, stroke: '#b8dce5', strokeWidth: 2, opacity: .48 })) : []
  const snow = weather === 'snow' ? Array.from({ length: 42 }, (_, i) => h('circle', { key: `snow-${i}`, cx: 20 + ((i * 83) % 1160), cy: 70 + ((i * 47) % 195), r: i % 3 ? 2.2 : 3.2, fill: '#fff', opacity: .72 })) : []
  const meadow = () => h('g', { key: 'meadow' },
    h('path', { d: 'M0 170Q160 112 330 164T650 148T940 157T1200 130V300H0Z', fill: '#789c73' }),
    h('path', { d: 'M0 207Q170 160 340 207T680 188T970 199T1200 175V300H0Z', fill: '#587b59' }),
    ...Array.from({ length: 18 }, (_, i) => { const x = (i * 83) % 1190; const y = 210 + (i % 5) * 10; return h('g', { key: `grass-${i}` }, h('path', { d: `M${x},${y + 32}q-5,-20 -12,-27M${x},${y + 32}q4,-23 12,-31`, stroke: i % 2 ? '#88ae72' : '#a0bd77', strokeWidth: 2, fill: 'none' })) }),
    h('path', { d: 'M0 252Q240 222 480 251T960 244T1200 251V300H0Z', fill: '#3f624b' }))
  const snowfield = () => h('g', { key: 'snow' },
    h('path', { d: 'M0 166L190 86L380 162L610 71L830 163L1040 92L1200 153V300H0Z', fill: '#718aa0' }),
    h('path', { d: 'M0 180L190 98L380 174L610 84L830 174L1040 105L1200 164V300H0Z', fill: '#e9f3f4', opacity: .86 }),
    h('path', { d: 'M0 212Q270 185 510 222T1200 210V300H0Z', fill: '#d7e7ea' }),
    h('path', { d: 'M0 264Q180 243 360 268T720 260T1200 266V300H0Z', fill: '#b8d2da' }),
    ...Array.from({ length: 9 }, (_, i) => { const x = 90 + i * 130; return h('path', { key: `pine-${i}`, d: `M${x},260L${x + 22},175L${x + 44},260M${x + 8},235L${x + 22},205L${x + 37},235`, fill: 'none', stroke: '#456775', strokeWidth: 5, strokeLinecap: 'round' }) }))
  const volcano = () => h('g', { key: 'volcano' },
    h('path', { d: 'M0 222L160 183L300 195L470 126L610 172L760 102L910 180L1030 142L1200 201V300H0Z', fill: '#574c4d' }),
    h('path', { d: 'M0 250L200 218L350 235L510 162L650 218L805 143L950 224L1080 181L1200 226V300H0Z', fill: '#754b46' }),
    h('path', { d: 'M455 132Q520 85 586 130L557 160Q520 146 482 164Z', fill: '#2d272b' }),
    weather === 'ash' ? h('path', { d: 'M450 80Q600 45 780 100', fill: 'none', stroke: '#a89b91', strokeWidth: 21, opacity: .35 }) : null,
    ...Array.from({ length: 10 }, (_, i) => { const x = 40 + i * 125; return h('path', { key: `rock-${i}`, d: `M${x},280l18,-45 24,45Z`, fill: i % 2 ? '#413b40' : '#8a5b4e' }) }))
  const lake = () => h('g', { key: 'lake' },
    h('path', { d: 'M0 174Q230 130 450 175T850 158T1200 167V300H0Z', fill: '#5f8796' }),
    h('path', { d: 'M0 196Q240 168 480 200T900 185T1200 193V300H0Z', fill: '#6da6ae' }),
    ...Array.from({ length: 12 }, (_, i) => { const x = 30 + i * 105; return h('path', { key: `reed-${i}`, d: `M${x},278Q${x - 8},225 ${x + 4},190M${x + 4},226Q${x + 25},207 ${x + 30},184`, fill: 'none', stroke: i % 2 ? '#668d67' : '#86a86f', strokeWidth: 4 }) }),
    h('path', { d: 'M0 260Q200 244 400 264T800 257T1200 265', fill: 'none', stroke: '#b6d9d7', strokeWidth: 3, opacity: .7 }),
    h('path', { d: 'M0 290Q240 271 470 291T930 285T1200 292', fill: 'none', stroke: '#9bc7c7', strokeWidth: 2, opacity: .6 }))
  const woodland=()=>h('g',null,h('path',{d:'M0 175Q300 130 650 180T1200 155V300H0Z',fill:'#365d48'}),...Array.from({length:16},(_,i)=>{const x=i*83;return h('g',{key:i},h('path',{d:`M${x} 290l${i%2?8:-8} -145`,stroke:'#514b3e',strokeWidth:10+i%3*3}),h('ellipse',{cx:x,cy:140+i%3*17,rx:63,ry:67,fill:i%2?'#476f4d':'#294c3c'}))}),h('path',{d:'M440 300Q530 220 690 195Q610 240 600 300Z',fill:'#9a9272',opacity:.65}))
  const desert=()=>h('g',null,h('path',{d:'M0 190Q190 100 420 180T820 165T1200 180V300H0Z',fill:'#c6a278'}),h('path',{d:'M0 250Q220 170 480 230T960 210T1200 240V300H0Z',fill:'#d5b281'}),h('path',{d:'M0 275Q390 215 800 275T1200 260V300H0Z',fill:'#ac8058'}),...Array.from({length:12},(_,i)=>h('path',{key:i,d:`M${70+i*97} 285l-8 -20m8 20l9 -27m-9 27l0 -32`,stroke:'#737253',strokeWidth:3,fill:'none'})))
  const body = MORE_PANORAMA[sceneId] ? MORE_PANORAMA[sceneId]() : sceneId === 'woodland' ? woodland() : sceneId === 'desert' ? desert() : sceneId === 'snow' ? snowfield() : sceneId === 'volcano' ? volcano() : sceneId === 'lake' ? lake() : meadow()
  return h('svg', { viewBox: `0 0 1200 ${height}`, preserveAspectRatio: garden ? 'xMidYMin slice' : 'xMidYMid slice', className: 'fg-panorama', 'aria-hidden': 'true' },
    h('defs', null, h('linearGradient', { id: `${prefix}-sky`, x1: 0, y1: 0, x2: 0, y2: 1 }, h('stop', { offset: '0%', stopColor: sky }), h('stop', { offset: '100%', stopColor: haze })), h('linearGradient', { id: `${prefix}-veil`, x1: 0, y1: 0, x2: 0, y2: 1 }, h('stop', { offset: '0%', stopColor: '#fff', stopOpacity: .08 }), h('stop', { offset: '100%', stopColor: '#20363e', stopOpacity: .18 }))),
    h('defs',null,
      h('filter',{id:`${prefix}-grain`,x:0,y:0,width:'100%',height:'100%'},h('feTurbulence',{type:'fractalNoise',baseFrequency:'.018 .16',numOctaves:3,seed:8,stitchTiles:'stitch'}),h('feColorMatrix',{type:'saturate',values:0})),
      h('linearGradient',{id:`${prefix}-land`,x1:0,y1:0,x2:0,y2:1},h('stop',{offset:'0%',stopColor:night?'#0d192b':'#ecedcf',stopOpacity:night?.65:0}),h('stop',{offset:'100%',stopColor:night?'#08101d':'#182c24',stopOpacity:night?.8:.3})),
      h('radialGradient',{id:`${prefix}-glow`},h('stop',{offset:0,stopColor:'#ffe5a6',stopOpacity:.5}),h('stop',{offset:1,stopColor:'#ffe5a6',stopOpacity:0}))),
    h('rect', { width: 1200, height: 300, fill: `url(#${prefix}-sky)` }),
    sun?h('ellipse',{cx:sun.cx,cy:sun.cy,rx:190,ry:130,fill:`url(#${prefix}-glow)`}):h('g',null,h('circle',{cx:925,cy:55,r:19,fill:'#ecedcf'}),h('circle',{cx:934,cy:49,r:17,fill:sky})),
    ...star, sun ? h('circle', { ...sun, opacity: .9 }) : null,
    weather === 'overcast' || weather === 'rain' || weather === 'snow' ? [cloud(195, 58, 1.15, 'cloud-a', weather === 'rain' || weather === 'snow'), cloud(760, 92, .82, 'cloud-b', weather === 'rain' || weather === 'snow')] : null,
    h('path',{d:'M0 158L90 123 180 150 280 108 390 144 510 96 630 149 780 101 900 149 1060 115 1200 146V240H0Z',fill:night?'#344158':'#8da5a6',opacity:.45}),
    garden ? h('rect',{y:230,width:1200,height:height-230,fill:foreground}) : null,
    body,
    sceneId==='lake'?h('g',{opacity:.35},...Array.from({length:20},(_,i)=>h('path',{key:i,d:`M${200+i*20},${195+i*4}h${230-i*7}`,stroke:night?'#bacbd5':'#e6e5c4',strokeWidth:1.2}))):null,
    h('rect',{y:145,width:1200,height:height-145,filter:`url(#${prefix}-grain)`,opacity:night?.05:.13,style:{mixBlendMode:'soft-light'}}),
    h('rect',{width:1200,height,fill:`url(#${prefix}-land)`}),
    rain, snow, h('rect', { width: 1200, height, fill: `url(#${prefix}-veil)` }))
}

function discoveryItems(before,after,kind,sceneId,index) {
 const items=[]
 const blooms=kind==='retain'?[after.scenes[sceneId].plots[index]]:kind==='harvest'?after.basket.slice(before.basket.length):[]
 for(const bloom of blooms){
  if(!bloom)continue
  const key=itemKey(bloom), first=!before.specimens?.[key]
  if(first||bloom.variant==='hidden'||bloom.trait||bloom.tint)items.push({type:'flower',species:bloom.species,variant:bloom.variant??'base',dna:bloom.dna,trait:bloom.trait,tint:bloom.tint,first,kept:kind==='retain'})
 }
 if(kind==='harvest'&&after.lastBred){const [species,tint]=after.lastBred.split('~');items.push({type:'seed',species,tint,variant:'base',first:!before.seeds?.[after.lastBred]})}
 if(kind==='visitor')for(const visitor of VISITORS)if((after.visitors[visitor.id]??0)>(before.visitors[visitor.id]??0)&&(!(before.visitors[visitor.id]>0)||visitor.special))items.push({type:'visitor',visitor:visitor.id,first:!(before.visitors[visitor.id]>0)})
 return items
}
function recordDiscoveries(state,items,now) {
 if(!items.length)return state
 const seq=(state.discoverySeq??0)+1
 return {...state,discoverySeq:seq,discoveries:[...(state.discoveries??[]),{id:seq,at:now,items}].slice(-40)}
}
function sanitizeDiscoveries(raw) {
 if(!Array.isArray(raw))return []
 return raw.filter(entry=>entry&&Number.isFinite(entry.id)&&Number.isFinite(entry.at)&&entry.at>=0&&entry.at<=8640000000000000&&Array.isArray(entry.items)).map(entry=>({id:Math.floor(entry.id),at:entry.at,items:entry.items.slice(0,4).filter(item=>item&&(['flower','seed'].includes(item.type)?SPECIES_BY_ID.has(item.species):item.type==='visitor'&&VISITOR_BY_ID.has(item.visitor))).map(item=>{
  if(item.type==='visitor')return {type:'visitor',visitor:item.visitor,first:item.first===true}
  return {type:item.type,species:item.species,variant:['base','alt','hidden'].includes(item.variant)?item.variant:'base',dna:Number.isFinite(item.dna)?item.dna:undefined,trait:TRAIT_BY_ID.has(item.trait)?item.trait:undefined,tint:SPECIES_BY_ID.has(item.tint)?item.tint:undefined,first:item.first===true,kept:item.kept===true}
 })})).filter(entry=>entry.items.length).slice(-40)
}
Object.assign(zh,{
 'discovery.title':'花园有新发现','discovery.first':'首次发现','discovery.special':'特殊收获','discovery.seed':'育出杂交种子','discovery.visitor':'特别的相遇','discovery.kept':'已留在花圃，也记入图鉴。','discovery.basket':'已收入花篮，外观已保存。','discovery.seedWhere':'种子已保存，空花圃的播种列表可选。','discovery.visitorWhere':'遇见记录已保存到访客图鉴。','discovery.dismiss':'收好这份发现','discovery.open':'查看图鉴','discovery.history':'发现记录','discovery.empty':'第一次遇见花卉、奇珍、杂交种子或访客时，会在这里留下记录。','discovery.historyNote':'最近 40 次发现保存在本浏览器。新发现不再弹窗，点一条记录可以打开发现卡。','discovery.return':'回看最新发现','discovery.count':'本次 {n} 项发现',
 'scene.woodland':'林地','scene.desert':'荒漠','weather.woodland.clear':'林间晴光','weather.woodland.overcast':'薄雾','weather.woodland.rain':'林雨','weather.desert.clear':'烈日','weather.desert.overcast':'浮云','weather.desert.rain':'沙尘',
 'regions.title':'地区与花卉','regions.note':'每个地区都有自己的花与访客。未解锁地区也可先查阅花卉指南；解锁后才能播种。','regions.flowers':'查看本区 {n} 种花','regions.grow':'前往花园','regions.locked':'待解锁 · {n} 金币','regions.current':'正在浏览：{name}','regions.filter':'选择图鉴地区',
})
Object.assign(en,{
 'discovery.title':'A discovery in your garden','discovery.first':'First discovery','discovery.special':'Special harvest','discovery.seed':'A hybrid seed','discovery.visitor':'A special encounter','discovery.kept':'Still growing in its plot, and recorded in the guide.','discovery.basket':'Stored in the basket with its appearance preserved.','discovery.seedWhere':'Seed saved. Choose it in an empty plot’s planting list.','discovery.visitorWhere':'Encounter saved in the visitor field guide.','discovery.dismiss':'Keep this discovery','discovery.open':'Open field guide','discovery.history':'Discovery journal','discovery.empty':'First flowers, curiosities, hybrid seeds and visitor encounters will appear here.','discovery.historyNote':'The latest 40 discoveries are saved in this browser. New discoveries no longer pop up; click an entry to open its card.','discovery.return':'Revisit latest discovery','discovery.count':'{n} discoveries this time',
 'scene.woodland':'Woodland','scene.desert':'Desert','weather.woodland.clear':'Dappled sun','weather.woodland.overcast':'Mist','weather.woodland.rain':'Forest rain','weather.desert.clear':'Bright sun','weather.desert.overcast':'Drifting cloud','weather.desert.rain':'Dust',
 'regions.title':'Regions & flowers','regions.note':'Each region has its own flowers and visitors. Browse guides before unlocking; planting requires the region to be open.','regions.flowers':'Explore {n} flowers','regions.grow':'Go to garden','regions.locked':'Locked · {n} coins','regions.current':'Browsing: {name}','regions.filter':'Flower guide region',
})
function DiscoveryCard({entry,t,onClose,onOpen}) {
 const ref=React.useRef(null)
 React.useEffect(()=>{const dialog=ref.current;showModalPinned(dialog);return()=>{if(dialog?.open)dialog.close()}},[])
 return h('dialog',{ref,className:'fg-dialog fg-discoveryDialog','aria-label':t('discovery.title'),onCancel:event=>{event.preventDefault();onClose()}},
  h('header',{className:'fg-discoveryHead'},h('span',{className:'fg-badge'},t('discovery.count',{n:entry.items.length})),h('h2',null,t('discovery.title')),h('time',{dateTime:new Date(entry.at).toISOString()},new Date(entry.at).toLocaleString())),
  h('div',{className:'fg-discoveryList'},entry.items.map((item,index)=>h('article',{key:index,className:'fg-discoveryItem'},
   h('div',{className:'fg-discoveryArt'},item.type==='visitor'?h(VisitorArt,{id:item.visitor}):h(FlowerArt,{speciesId:item.species,stage:'bloom',variant:item.variant,dna:item.dna,trait:item.trait,tint:item.tint})),
   h('div',{className:'fg-discoveryCopy'},h('span',{className:'fg-badge'},t(item.type==='seed'?'discovery.seed':item.type==='visitor'?'discovery.visitor':item.first?'discovery.first':'discovery.special')),
    h('h3',null,item.type==='visitor'?t(`visitor.${item.visitor}`):bloomName(item,t)),
    item.type==='flower'?h('p',null,t(`variant.${item.variant}`),item.trait?' · '+t(`trait.${item.trait}`):'',item.tint?' · '+t('hybrid.tag'):''):null,
    h('p',{className:'fg-hint'},t(item.type==='seed'?'discovery.seedWhere':item.type==='visitor'?'discovery.visitorWhere':item.kept?'discovery.kept':'discovery.basket')),
    h('button',{type:'button',className:'fg-btn',onClick:()=>onOpen(item)},t('discovery.open')))))),
  h('footer',{className:'fg-discoveryFooter'},h('button',{type:'button',className:'fg-btn fg-btnPrimary',autoFocus:true,onClick:onClose},t('discovery.dismiss'))))
}

Object.assign(zh, {
  'inventory.title':'道具背包', 'inventory.open':'道具背包 · {n}', 'inventory.note':'这里展示现有道具，兑换或购买后立即更新。花朵保存在花篮，杂交种子在下方单独展示。',
  'inventory.count':'持有 ×{n}', 'inventory.seeds':'杂交种子', 'inventory.noSeeds':'暂无杂交种子；授粉花收获或育种委托可获得。', 'inventory.grow':'前往花园使用', 'inventory.close':'收起背包',
  'inventory.fertilizer':'在花园选择未开花植株，点击施肥。', 'inventory.compost':'在花园的低地力花圃点击堆肥。', 'inventory.sprinkler':'在道具商店使用，为当前花地自动浇水。', 'inventory.charm':'在道具商店启用，为下一株开花鉴定增加仙品机会；已鉴定植株不会重抽。',
  'reward.xp':'经验', 'reward.reputation':'委托声望', 'reward.seals':'研究印记', 'reward.title':'收获已到账', 'reward.research':'永久研究已解锁', 'reward.bag':'查看道具背包', 'reward.close':'收好奖励', 'reward.balance':'剩余研究印记 {n} 枚', 'reward.spent':'本次花费 {n} 枚研究印记', 'reward.owned':'入包后持有 ×{n}', 'reward.permanent':'永久生效 · {level}/2', 'reward.saved':'进度已保存，关闭后可继续养花。',
})
Object.assign(en, {
  'inventory.title':'Supply bag', 'inventory.open':'Supply bag · {n}', 'inventory.note':'Your current supplies update immediately after purchases and exchanges. Flowers stay in the flower basket; hybrid seeds are listed separately below.',
  'inventory.count':'Owned ×{n}', 'inventory.seeds':'Hybrid seeds', 'inventory.noSeeds':'No hybrid seeds yet. Find them through pollinated harvests or breeding letters.', 'inventory.grow':'Go to garden to use', 'inventory.close':'Close bag',
  'inventory.fertilizer':'Choose a growing plant in the garden and feed it.', 'inventory.compost':'Apply compost to a garden plot with low fertility.', 'inventory.sprinkler':'Use from the shop to automatically water the current ground.', 'inventory.charm':'Activate from the shop to boost the next bloom identification; identified plants keep their appearance.',
  'reward.xp':'Experience', 'reward.reputation':'Patron reputation', 'reward.seals':'Research seals', 'reward.title':'Rewards received', 'reward.research':'Permanent research unlocked', 'reward.bag':'View supply bag', 'reward.close':'Keep rewards', 'reward.balance':'Research seals remaining: {n}', 'reward.spent':'Spent {n} research seals', 'reward.owned':'Now in bag ×{n}', 'reward.permanent':'Permanent effect · {level}/2', 'reward.saved':'Progress saved. Close to continue gardening.',
})
function inventoryCount(state) {
  return ITEMS.filter(item=>item.kind==='consumable').reduce((n,item)=>n+(state.bag?.[item.id]??0),0)+Object.values(state.seeds??{}).reduce((n,count)=>n+count,0)
}
function rewardForChange(before, next, t) {
  const entries=[]
  for(const item of ITEMS.filter(item=>item.kind==='consumable')) {
    const gain=(next.bag?.[item.id]??0)-(before.bag?.[item.id]??0)
    if(gain>0) entries.push({id:item.id,label:t(`item.${item.id}`),amount:`+${gain}`,owned:next.bag[item.id]})
  }
  for(const [id,key] of [['researchSeals','reward.seals'],['coins','stat.coins'],['ribbons','ribbon.label'],['xp','reward.xp'],['patronage','reward.reputation']]) {
    const gain=(next[id]??0)-(before[id]??0)
    if(gain>0)entries.push({id,label:t(key),amount:`+${gain}`})
  }
  for(const [key,count] of Object.entries(next.seeds??{})) {
    const gain=count-(before.seeds?.[key]??0)
    if(gain>0){const [species,tint]=key.split('~');entries.push({id:key,label:t('inventory.seeds')+' · '+bloomName({species,tint},t),amount:`+${gain}`,owned:count})}
  }
  for(const branch of RESEARCH_BRANCHES) {
    const level=researchLevel(next,branch)
    if(level>researchLevel(before,branch))entries.push({id:branch,label:t(`research.${branch}`),amount:t('reward.permanent',{level}),effect:t(`research.${branch}.effect`,{n:level*(branch==='care'?20:branch==='ecology'?2:5)})})
  }
  return entries.length?{entries,research:entries.some(entry=>RESEARCH_BRANCHES.includes(entry.id)),spent:Math.max(0,(before.researchSeals??0)-(next.researchSeals??0))}:null
}
function useGardenDialog(ref) {
  React.useEffect(()=>{const dialog=ref.current;showModalPinned(dialog);return()=>{if(dialog?.open)dialog.close()}},[])
}
function RewardDialog({reward,state,t,onClose,onBag}) {
  const ref=React.useRef(null);useGardenDialog(ref)
  return h('dialog',{ref,className:'fg-dialog fg-rewardDialog','aria-label':t(reward.research?'reward.research':'reward.title'),onCancel:event=>{event.preventDefault();onClose()}},
    h('header',{className:'fg-rewardHead'},h('span',{className:'fg-rewardStar','aria-hidden':true},'✦'),h('h2',null,t(reward.research?'reward.research':'reward.title')),h('p',null,t('reward.saved'))),
    h('div',{className:'fg-rewardList'},reward.entries.map(entry=>h('article',{key:entry.id,className:'fg-rewardItem'},
      h('span',{className:'fg-inventoryIcon','aria-hidden':true},ITEM_BY_ID.has(entry.id)?h(ItemIcon,{id:entry.id}):'✦'),
      h('div',null,h('h3',null,entry.label),entry.effect?h('p',null,entry.effect):null,entry.owned!==undefined?h('p',{className:'fg-hint'},t('reward.owned',{n:entry.owned})):null),h('strong',{className:'fg-rewardAmount'},entry.amount)))),
    h('p',{className:'fg-rewardBalance'},reward.spent?t('reward.spent',{n:reward.spent})+' · ':'',t('reward.balance',{n:state.researchSeals??0})),
    h('footer',{className:'fg-rewardActions'},h('button',{type:'button',className:'fg-btn',onClick:onBag},t('reward.bag')),h('button',{type:'button',className:'fg-btn fg-rewardConfirm',autoFocus:true,onClick:onClose},t('reward.close'))))
}

Object.assign(zh, {
  'card.living':'活株外观', 'card.specimenTitle':'收藏标本', 'card.returnLiving':'返回活株', 'card.specimen':'查看标本',
  'mini.open':'花园小窗', 'mini.title':'随身花园', 'mini.note':'小窗会留在对话上方；拖动标题栏移动，右下角调整大小。',
  'mini.close':'关闭花园小窗', 'mini.minimize':'收起花园小窗', 'mini.restore':'展开花园小窗', 'mini.move':'移动花园小窗（方向键）', 'mini.resize':'调整小窗大小（方向键）',
  'mini.water':'全部浇水', 'mini.empty':'空花圃', 'mini.seed':'选择种子', 'mini.plant':'播种', 'mini.moisture':'湿度 {n}%', 'mini.saved':'已保存，主花园会同步更新。', 'mini.error':'暂时无法操作，请检查金币、背包空间和花卉状态。', 'mini.basket':'花篮 {n}/{max}',
})
Object.assign(en, {
  'card.living':'Living plant', 'card.specimenTitle':'Collected specimen', 'card.returnLiving':'Return to living plant', 'card.specimen':'View specimen',
  'mini.open':'Garden window', 'mini.title':'Pocket garden', 'mini.note':'Stays above your conversation. Drag the title bar to move; resize from the lower-right corner.',
  'mini.close':'Close garden window', 'mini.minimize':'Minimize garden window', 'mini.restore':'Expand garden window', 'mini.move':'Move garden window (arrow keys)', 'mini.resize':'Resize garden window (arrow keys)',
  'mini.water':'Water all', 'mini.empty':'Empty plot', 'mini.seed':'Choose seed', 'mini.plant':'Plant', 'mini.moisture':'Moisture {n}%', 'mini.saved':'Saved and synchronized with the main garden.', 'mini.error':'Not ready: check coins, basket space and flower status.', 'mini.basket':'Basket {n}/{max}',
})
let miniWindow = { open:false, minimized:false, x:0, y:64, width:390, height:520 }
const miniListeners = new Set()
function subscribeMini(listener) { miniListeners.add(listener); return ()=>miniListeners.delete(listener) }
function getMini() { return miniWindow }
function miniGeometry(rect, viewportWidth, viewportHeight) {
  const top=Math.min(64,Math.max(0,viewportHeight-1))
  const width=Math.min(Math.max(280,rect.width),Math.max(1,viewportWidth-16))
  const height=Math.min(Math.max(300,rect.height),Math.max(1,viewportHeight-top-16))
  return {...rect,width,height,x:Math.max(Math.min(8,Math.max(0,viewportWidth-width)),Math.min(rect.x,viewportWidth-width-8)),y:Math.max(top,Math.min(rect.y,viewportHeight-(rect.minimized?52:height)-8))}
}
function updateMini(patch) {
  const width=typeof window==='undefined'?1000:window.innerWidth??1000, height=typeof window==='undefined'?800:window.innerHeight??800
  miniWindow=miniGeometry({...miniWindow,...patch},width,height)
  for(const listener of miniListeners)listener()
}
function openMini() {
  updateMini({open:true,minimized:false,x:Math.max(8,(window.innerWidth??1000)-miniWindow.width-24),y:Math.max(64,(window.innerHeight??800)-miniWindow.height-130)})
}
function MiniGarden({t}) {
  const state=useSyncExternalStore(subscribeGarden,getState,getState)
  const [clock,setClock]=React.useState(()=>Date.now()), [notice,setNotice]=React.useState(''), [discovery,setDiscovery]=React.useState(null)
  const [selection,setSelection]=React.useState({}), [preview,setPreview]=React.useState(null)
  const miniRoot=React.useRef(null), opener=React.useRef(null)
  function restoreMiniFocus(){window.setTimeout(()=>{const target=opener.current?.isConnected?opener.current:miniRoot.current?.querySelector('select,button');target?.focus()},0)}
  React.useEffect(()=>{const id=window.setInterval(()=>{tick();setClock(Date.now())},1000);return()=>window.clearInterval(id)},[])
  const scene=sceneOf(state.scene), slot=state.scenes[state.scene], weather=weatherAt(clock), period=gardenClock(clock).period
  React.useEffect(()=>{setSelection({})},[scene.id])
  const ripeCount=slot.plots.slice(0,slot.unlocked).filter(plot=>plot&&!plot.resident&&stageOf(plot)==='bloom').length
  function act(transition,kind,index) {
    const actionOpener=typeof document==='undefined'?null:document.activeElement
    tick()
    const before=getState(), next=transition(before)
    if(!next){setNotice(t('mini.error'));return}
    const items=kind?discoveryItems(before,next,kind,before.scene,index):[]
    const recorded=recordDiscoveries(next,items,Date.now())
    commit(recorded,true);const gained=rewardForChange(before,recorded,t);setNotice(gained?gained.entries.map(entry=>`${entry.label} ${entry.amount}`).join(' · '):t('mini.saved'))
    if(items.length)setNotice(t('discovery.noted'))
  }
  return h('div',{ref:miniRoot,className:'fg-view fg-miniView','data-scene':scene.id},
    h('div',{className:'fg-miniTools'},
      h('select',{'aria-label':t('plot.section'),value:scene.id,onChange:event=>{commit({...getState(),scene:event.target.value},true);setSelection({})}},SCENES.filter(entry=>(state.scenes[entry.id]?.unlocked??0)>0).map(entry=>h('option',{key:entry.id,value:entry.id},t(`scene.${entry.id}`)))),
      h('button',{type:'button',className:'fg-btn',onClick:()=>act(before=>waterAll(before,before.scene))},t('mini.water')),
      ripeCount>0?h('button',{type:'button',className:'fg-btn fg-btnPrimary','data-mini':'harvestAll',onClick:()=>act(before=>{let next=before;const live=before.scenes[before.scene];for(let i=0;i<live.unlocked;i++){const plot=next.scenes[before.scene].plots[i];if(!plot||plot.resident)continue;const done=harvestAt(next,before.scene,i,Date.now(),weatherAt(Date.now()),false);if(done)next=done}return next===before?null:next},'harvest',0)},t('mini.harvestAll',{n:ripeCount})):null,
      (state.bag.sprinkler??0)>0&&!((slot.sprinklerUntil??0)>clock)?h('button',{type:'button',className:'fg-btn','data-mini':'sprinkle',onClick:()=>act(before=>useSprinkler(before,before.scene,Date.now()))},t('mini.sprinkle',{n:state.bag.sprinkler})):null),
    h('p',{className:'fg-miniSummary'},t('mini.basket',{n:state.basket.length,max:basketCapacity(state)}),' · ',state.coins,' ',t('stat.coins')),
    h(MiniToday,{state,t,clock,run:act}),
    h('div',{className:'fg-miniLandscape',style:{backgroundColor:PANORAMA_GROUND[scene.id]}},
      h('div',{className:'fg-miniBackdrop'},h(ScenePanorama,{sceneId:scene.id,period,weather,garden:true})),
      h('div',{className:'fg-miniPlots'},slot.plots.slice(0,slot.unlocked).map((plot,index)=>{
        const species=plot?SPECIES_BY_ID.get(plot.species):null, stage=plot?stageOf(plot):null
        const seed=scene.species.includes(selection[index])?selection[index]:scene.species[0]
        const seedSpecies=SPECIES_BY_ID.get(seed)
        const visitor=plot?visitorAt(scene.id,index,plot,clock,weather,facilityLevel(state,'hive'),gardenEcology(state,clock).visitorBonus,state):null
        return h('article',{key:index,className:'fg-miniPlot','data-mini-plot':index},
          h('div',{className:'fg-miniPlant'},plot?h(FlowerArt,{speciesId:plot.species,stage,variant:plot.variant??(plot.tint?'base':plotVariant(species,index)),trait:plot.trait,tint:plot.tint,dna:plot.dna}):EmptyArt(),
            visitor?h('button',{type:'button',className:'fg-miniVisitor','data-mini-visitor':visitor.id,title:t('visitor.greet',{name:t(`visitor.${visitor.id}`)}),'aria-label':t('visitor.greet',{name:t(`visitor.${visitor.id}`)}),onClick:()=>act(before=>greetVisitor(before,scene.id,index,Date.now(),weatherAt(Date.now())),'visitor',index)},h(VisitorArt,{id:visitor.id})):null),
          h('strong',null,plot?bloomName({...plot,variant:plot.variant??'base'},t):t('mini.empty')),
          plot?h('span',{className:'fg-note'},t(`stage.${stage}`),' · ',t('mini.moisture',{n:Math.round(plot.moisture)})):null,
          plot?.trait?h('span',{className:'fg-badge fg-badgeWarn'},t(`trait.${plot.trait}`)):null,
          plot?h('div',{className:'fg-miniActions'},
            h('button',{type:'button',className:'fg-btn',disabled:plot.moisture>=99.5,onClick:()=>act(before=>waterAt(before,scene.id,index))},t('plot.water')),
            stage==='bloom'?h('button',{type:'button',className:'fg-btn',disabled:state.basket.length>=basketCapacity(state),onClick:()=>{
              if(plot.resident&&selection.retire!==`${scene.id}:${index}`){setSelection(current=>({...current,retire:`${scene.id}:${index}`}));return}
              setSelection(current=>({...current,retire:undefined}))
              act(before=>harvestAt(before,scene.id,index,Date.now(),weatherAt(Date.now()),plot.resident===true),'harvest',index)
            }},plot.resident?t(selection.retire===`${scene.id}:${index}`?'eco.retireConfirm':'eco.retire'):t('plot.harvest')):
              h('button',{type:'button',className:'fg-btn',disabled:(state.bag.fertilizer??0)<=0,onClick:()=>act(before=>fertilizeAt(before,scene.id,index))},t('item.fertilizer')),
            stage==='bloom'&&!plot.resident?h('button',{type:'button',className:'fg-btn',onClick:()=>act(before=>retainAt(before,scene.id,index,Date.now()),'retain',index)},t('eco.retain')):null,
            visitor?h('span',{className:'fg-note'},t(`visitor.${visitor.id}`)):null):
          h('div',{className:'fg-miniActions'},
            h('select',{'aria-label':`${t('mini.seed')} ${index+1}`,value:seed,onChange:event=>{const value=event.target.value;setSelection(current=>({...current,[index]:value}))}},scene.species.map(id=>h('option',{key:id,value:id},`${t(`species.${id}`)} · ${SPECIES_BY_ID.get(id).cost}`))),
            h('button',{type:'button',className:'fg-btn',disabled:state.coins<seedSpecies.cost,onClick:()=>act(before=>plantAt(before,scene.id,index,seed))},t('mini.plant'))))
      }))),
    h('p',{className:'fg-miniNotice',role:'status','aria-live':'polite'},notice),
    discovery?h(DiscoveryCard,{entry:discovery,t,onClose:()=>{setDiscovery(null);restoreMiniFocus()},onOpen:item=>{setDiscovery(null);setPreview(item)}}):null,
    preview?(preview.type==='visitor'?h(VisitorPreview,{visitorId:preview.visitor,state,t,onClose:()=>{setPreview(null);restoreMiniFocus()}}):h(BloomPreview,{id:'fg-mini-preview',speciesId:preview.species,variant:preview.variant??'base',trait:preview.trait,tint:preview.tint,dna:preview.dna,t,modal:true,onClose:()=>{setPreview(null);restoreMiniFocus()}})):null)
}
function FloatingGarden() {
  const mini=useSyncExternalStore(subscribeMini,getMini,getMini), drag=React.useRef(null)
  const t=boundT
  const [,refreshLocale]=React.useReducer(n=>n+1,0)
  React.useEffect(()=>{const locale=pluginCtx?.locale;return typeof locale?.subscribe==='function'?locale.subscribe(()=>refreshLocale()):undefined},[])
  React.useEffect(()=>{const resize=()=>updateMini({});window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize)},[])
  if(!mini.open)return null
  function start(event,resize=false){
    if(event.button!==0 || (!resize && event.target.closest('button,select,input')))return
    event.preventDefault();drag.current={pointer:event.pointerId,x:event.clientX,y:event.clientY,rect:mini,resize};event.currentTarget.setPointerCapture(event.pointerId)
  }
  function move(event){const action=drag.current;if(!action||action.pointer!==event.pointerId)return
    const dx=event.clientX-action.x,dy=event.clientY-action.y
    updateMini(action.resize?{width:action.rect.width+dx,height:action.rect.height+dy}:{x:action.rect.x+dx,y:action.rect.y+dy})
  }
  function end(){drag.current=null}
  function keys(event,resize=false){const steps={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]};const step=steps[event.key];if(!step)return;event.preventDefault();event.stopPropagation();updateMini(resize?{width:mini.width+step[0],height:mini.height+step[1]}:{x:mini.x+step[0],y:mini.y+step[1]})}
  return h('aside',{className:'fg-floating',role:'region','aria-label':t('mini.title'),style:{left:mini.x,top:mini.y,width:mini.width,height:mini.minimized?'auto':mini.height},'data-minimized':mini.minimized},
    h('style',null,CSS,MINI_CSS),
    h('header',{className:'fg-floatingBar',onPointerDown:start,onPointerMove:move,onPointerUp:end,onPointerCancel:end,onLostPointerCapture:end},
      h('span',{className:'fg-floatingMove',tabIndex:0,role:'button','aria-label':t('mini.move'),onKeyDown:event=>keys(event)},'✿ ',t('mini.title')),
      h('button',{type:'button',title:t(mini.minimized?'mini.restore':'mini.minimize'),'aria-label':t(mini.minimized?'mini.restore':'mini.minimize'),onClick:()=>updateMini({minimized:!mini.minimized})},mini.minimized?'▢':'−'),
      h('button',{type:'button',title:t('mini.close'),'aria-label':t('mini.close'),onClick:()=>updateMini({open:false})},'×')),
    !mini.minimized?h('div',{className:'fg-floatingBody'},h(MiniGarden,{t})):null,
    !mini.minimized?h('span',{className:'fg-floatingResize',tabIndex:0,role:'button','aria-label':t('mini.resize'),onKeyDown:event=>keys(event,true),onPointerDown:event=>start(event,true),onPointerMove:move,onPointerUp:end,onPointerCancel:end,onLostPointerCapture:end},'◢'):null)
}
const MINI_CSS=`
.fg-floating{position:absolute;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--dsw-alias-border-l2);border-radius:18px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);box-shadow:0 12px 40px #0003;font:14px/1.5 system-ui;pointer-events:auto}
.fg-floatingBar{display:flex;align-items:center;gap:8px;min-height:46px;padding:0 12px;border-bottom:1px solid var(--dsw-alias-border-l1);cursor:grab;touch-action:none;user-select:none;background:var(--dsw-alias-bg-layer-2)}
.fg-floatingBar:active{cursor:grabbing}.fg-floatingMove{flex:1;font-weight:650}.fg-floatingBar button{border:0;background:transparent;color:inherit;cursor:pointer;font:inherit;min-width:30px;height:30px;border-radius:8px}.fg-floatingBar button:hover{background:var(--dsw-alias-bg-layer-1)}
.fg-floatingBody{min-height:0;flex:1;overflow:auto}.fg-floatingResize{position:absolute;bottom:0;right:0;width:26px;height:26px;text-align:right;cursor:nwse-resize;touch-action:none;color:var(--dsw-alias-label-secondary)}
.fg-floating button:focus-visible,.fg-floatingMove:focus-visible,.fg-floatingResize:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
.fg-miniView{height:auto;min-height:100%;font-size:13px;--fg-font-size:13px}.fg-miniTools{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px}.fg-miniView select{max-width:100%;min-width:0;padding:5px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:inherit;font:inherit}
.fg-miniSummary{margin:0;padding:0 12px 10px;color:var(--dsw-alias-label-secondary)}
.fg-miniLandscape{position:relative;isolation:isolate;padding:14px 10px 24px}.fg-miniBackdrop{position:absolute;inset:0;z-index:-1;pointer-events:none;overflow:hidden}.fg-miniBackdrop .fg-panorama{height:480px;mask-image:linear-gradient(#000 80%,transparent)}
.fg-miniPlots{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.fg-miniPlot{min-width:0;display:flex;flex-direction:column;gap:6px;padding:9px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 88%,transparent)}
.fg-miniPlant{position:relative;height:96px;display:flex;align-items:center;justify-content:center}
.fg-miniVisitor{position:absolute;top:0;right:0;width:38px;height:38px;padding:3px;border:1px solid var(--dsw-alias-state-success-primary);border-radius:50%;background:var(--dsw-alias-bg-layer-1);cursor:pointer;box-shadow:0 2px 8px #0002;animation:fg-bob 1.7s ease-in-out infinite alternate}.fg-miniPlant .fg-miniVisitor svg{width:30px;height:30px}.fg-miniVisitor:hover{background:var(--dsw-alias-bg-layer-2)}.fg-miniPlant svg{height:96px;width:96px}.fg-miniPlot strong{font-size:13px;overflow-wrap:anywhere;line-height:1.5}.fg-miniPlot .fg-note{white-space:normal}.fg-miniActions{display:flex;flex-wrap:wrap;gap:4px}.fg-miniActions select{width:100%}.fg-miniView .fg-btn{font-size:12px;min-height:28px;padding:4px 7px}.fg-miniNotice{margin:0;padding:8px 14px 22px;color:var(--dsw-alias-label-secondary)}
`

