/**
 * Flower garden — browser half.
 *
 * Registers one `conversation.view` entry, which the Conversation header renders
 * as a tab beside Chat and Trajectory, and paints the flower-growing game inside
 * the session body.
 *
 * Four scenes (meadow, snowfield, volcanic crater, lakeside) hold twenty-five
 * species, each drawn from its real morphology (see the `head` field and the
 * per-species art section). Every species has a codex entry per colour variant:
 * a plain bloom, a natural second colour on odd-numbered plots, and a rare gold
 * "hidden" bloom that only appears under the conditions listed in the flower book.
 *
 * Data path: the garden lives in this browser's `localStorage`
 * (`dsh.flower-garden.v3`) and is advanced from the wall clock, so a plot keeps
 * growing while the tab is closed. No Host call, tool call, session-log write,
 * prompt change, or network request is involved; turning the plugin off removes
 * the tab and leaves the saved garden untouched.
 */
window.__ModuleLoader__.load({
  id: 'dsh-flower-garden',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /** Locale namespace owned by this plugin. */
    const NS = 'flowerGarden'

    // ---------------------------------------------------------------------
    // §1 Dictionaries. The `zh` key set is the source of truth; `en` must match.
    // ---------------------------------------------------------------------
    const zh = {
      'view.label': '花园',
      'view.title': '我的花园',
      'header.subtitle': '草原、雪原、火山口、湖畔四块地，二十五种花；每块地的花不一样，天气也不一样。',
      'stat.coins': '金币',
      'stat.level': '等级',
      'stat.levelValue': '等级 {n}',
      'stat.harvested': '累计收获',
      'scene.meadow': '草原',
      'scene.snow': '雪原',
      'scene.volcano': '火山口',
      'scene.lake': '湖畔',
      'scene.locked': '解锁 · {n} 金币',
      'scene.short': '还差 {n} 金币',
      'scene.unlocked': '已解锁',
      'scene.confirm': '确认解锁 · {n}',
      'weather.meadow.clear': '晴',
      'weather.meadow.overcast': '阴',
      'weather.meadow.rain': '下雨',
      'weather.snow.clear': '晴雪',
      'weather.snow.overcast': '阴雪',
      'weather.snow.rain': '降雪',
      'weather.volcano.clear': '热浪',
      'weather.volcano.overcast': '硫雾',
      'weather.volcano.rain': '落灰',
      'weather.lake.clear': '晴',
      'weather.lake.overcast': '薄云',
      'weather.lake.rain': '细雨',
      'weather.growth': '生长 {n}',
      'weather.steady': '生长如常',
      'weather.soilWet': '土壤自动湿润',
      'weather.soilDry': '土壤不会自动湿润',
      'weather.left': '{n}后变',
      'plot.section': '花圃',
      'plot.empty': '空花圃',
      'plot.plant': '播种',
      'plot.cancel': '取消',
      'plot.locked': '未解锁',
      'plot.lockFirst': '先解锁前一个花圃',
      'plot.unlock': '解锁 · {n} 金币',
      'plot.short': '还差 {n} 金币',
      'plot.water': '浇水',
      'plot.watered': '土壤湿润',
      'plot.harvest': '收获',
      'plot.ready': '可以收获了',
      'plot.dry': '土壤干透，生长暂停',
      'plot.remaining': '约 {n}后开花',
      'plot.drying': '约 {n}后干透，浇水后继续',
      'plot.moisture': '湿度 {n}%',
      'plot.wetShort': '湿 {n}%',
      'plot.driedBadge': '缺水过',
      'stage.seed': '种子',
      'stage.sprout': '幼苗',
      'stage.bud': '花苞',
      'stage.bloom': '开花',
      'seed.pick': '选择种子',
      'seed.cost': '{n} 金币',
      'item.section': '道具',
      'item.fertilizer': '肥料',
      'item.fertilizer.note': '给一株花瞬间 +25% 生长',
      'item.sprinkler': '洒水器',
      'item.sprinkler.note': '当前花地 30 分钟自动浇水',
      'item.charm': '幸运符',
      'item.charm.note': '下一次收获的仙品概率 +25%',
      'item.basket': '花篮扩容',
      'item.basket.note': '花篮 +6 格，最多 3 级',
      'item.price': '{n} 金币',
      'item.buy': '购买',
      'item.owned': '×{n}',
      'item.level': 'Lv.{n}',
      'item.maxed': '已满级',
      'item.short': '还差 {n} 金币',
      'item.fertilize': '施肥',
      'item.useGround': '对本地使用',
      'item.useCharm': '启用',
      'item.charmReady': '幸运符已生效',
      'item.sprinklerLeft': '自动浇水 {n}',
      'item.fertilized': '施肥：{flower} 生长 +25%',
      'item.bought': '买到{item}',
      'item.sprinkled': '{scene}开始自动浇水',
      'plot.sprinkled': '洒水器在保湿',
      'variant.base': '原色',
      'variant.alt': '别色',
      'variant.hidden': '仙品',
      'variant.hiddenShort': '仙',
      'variant.goldTag': '仙',
      'species.dandelion': '蒲公英',
      'species.daisy': '雏菊',
      'species.cherry': '樱花',
      'species.tulip': '郁金香',
      'species.lavender': '薰衣草',
      'species.poppy': '虞美人',
      'species.sunflower': '向日葵',
      'species.lily': '百合',
      'species.rose': '玫瑰',
      'species.hydrangea': '绣球',
      'species.snowdrop': '雪滴花',
      'species.hellebore': '铁筷子',
      'species.plum': '梅花',
      'species.edelweiss': '雪绒花',
      'species.camellia': '山茶',
      'species.cactus': '仙人掌花',
      'species.lehua': '红火山花',
      'species.agave': '龙舌兰',
      'species.silversword': '银剑草',
      'species.plumeria': '鸡蛋花',
      'species.pickerel': '梭鱼草',
      'species.loosestrife': '千屈菜',
      'species.iris': '黄菖蒲',
      'species.waterlily': '睡莲',
      'species.lotus': '荷花',
      'latin.dandelion': 'Taraxacum officinale',
      'latin.daisy': 'Bellis perennis',
      'latin.cherry': 'Prunus serrulata',
      'latin.tulip': 'Tulipa gesneriana',
      'latin.lavender': 'Lavandula angustifolia',
      'latin.poppy': 'Papaver rhoeas',
      'latin.sunflower': 'Helianthus annuus',
      'latin.lily': 'Lilium candidum',
      'latin.rose': 'Rosa rugosa',
      'latin.hydrangea': 'Hydrangea macrophylla',
      'latin.snowdrop': 'Galanthus nivalis',
      'latin.hellebore': 'Helleborus niger',
      'latin.plum': 'Prunus mume',
      'latin.edelweiss': 'Leontopodium nivale',
      'latin.camellia': 'Camellia japonica',
      'latin.cactus': 'Opuntia ficus-indica',
      'latin.lehua': 'Metrosideros polymorpha',
      'latin.agave': 'Agave americana',
      'latin.silversword': 'Argyroxiphium sandwicense',
      'latin.plumeria': 'Plumeria rubra',
      'latin.pickerel': 'Pontederia cordata',
      'latin.loosestrife': 'Lythrum salicaria',
      'latin.iris': 'Iris pseudacorus',
      'latin.waterlily': 'Nymphaea alba',
      'latin.lotus': 'Nelumbo nucifera',
      'codex.dandelion': '无法停留的爱，随风自由',
      'codex.daisy': '天真，和藏在心里的爱',
      'codex.cherry': '生命的绚烂与短暂',
      'codex.tulip': '完美的爱，永恒的祝福',
      'codex.lavender': '等待爱情，安静守候',
      'codex.poppy': '安慰，与遗忘',
      'codex.sunflower': '沉默的爱，始终朝向太阳',
      'codex.lily': '纯洁，百年好合',
      'codex.rose': '热情，我爱你',
      'codex.hydrangea': '希望与团聚（花色随土壤酸碱变化）',
      'codex.snowdrop': '雪中报春的希望',
      'codex.hellebore': '逆境里的守护（冬日玫瑰）',
      'codex.plum': '坚韧与高洁，越冷越开',
      'codex.edelweiss': '珍贵的回忆与勇气',
      'codex.camellia': '谦让，和理想的爱',
      'codex.cactus': '坚强，也热烈',
      'codex.lehua': '新生：熔岩上的第一丛花',
      'codex.agave': '一生只盛放一次，开完母株枯萎',
      'codex.silversword': '孤独而长寿的守望',
      'codex.plumeria': '新的开始',
      'codex.pickerel': '沉静的坚持',
      'codex.loosestrife': '孤独的美',
      'codex.iris': '信使与希望',
      'codex.waterlily': '洁净与宁静',
      'codex.lotus': '出淤泥而不染',
      'codex.title': '图鉴',
      'codex.progress': '{n}/{total}',
      'codex.speciesProgress': '{n}/{total} 种',
      'codex.undiscovered': '还没有收获过',
      'codex.harvests': '收获 {n} 次',
      'codex.meaning': '花语',
      'codex.hint': '仙品：基础 3%；从未缺水 +7%、偏爱天气 +5%、刚浇过水 +8%、夜里 22:00–05:00 收获 +7%，最高 30%。仙品自带光晕，卖价 3 倍，不用于交付花束。',
      'codex.hiddenUnknown': '？？？',
      'codex.teaser': '仙品 ×3 · 触发条件见图鉴',
      'codex.otherGround': '切换地块可以看其它花地的图鉴',
      'codex.altRule': '别色只长在 #1 / #3 / #5 号花圃',
      'codex.favoured': '本地偏爱天气：{w}',
      'time.seconds': '{n} 秒',
      'time.minutes': '{n} 分钟',
      'time.hours': '{n} 小时',
      'time.shortSeconds': '{n}秒',
      'time.shortMinutes': '{n}分',
      'reward.gain': '收获{flower}，+{xp} 经验',
      'reward.gold': '✦ 仙品{flower}！卖价 ×{n}，已放进花篮',
      'reward.sell': '卖出{flower}，金币 +{coins}',
      'reward.sellMany': '卖出 {n} 朵花，金币 +{coins}',
      'reward.order': '交付委托 #{id}，金币 +{coins}',
      'error.coins': '金币不够，先卖几朵花吧',
      'error.basketFull': '花篮满了，先卖出或交付一些花',
      'basket.title': '花篮',
      'basket.capacity': '{n}/{max}',
      'basket.empty': '花篮是空的，收获的花朵会放在这里。',
      'basket.sellAll': '全部卖出 · +{n}',
      'basket.view': '查看{flower}',
      'preview.close': '关闭',
      'preview.open': '查看{flower}的样子',
      'basket.each': '单价 {n}',
      'basket.total': '合计 {n}',
      'basket.sellOne': '卖出{flower} · +{n}',
      'basket.confirm': '确认卖出 · +{n}',
      'basket.full': '花篮已满，先卖出一些花',
      'basket.fullNote': '花篮满了，先卖出一些花再收获。',
      'order.title': '花束委托',
      'order.head': '委托 #{id}',
      'order.reward': '{coins} 金币 · {xp} 经验',
      'order.deliver': '交付',
      'order.missing': '还差材料',
      'order.item': '{flower} ×{n}',
      'order.empty': '暂时没有委托，交付一束后会出现新的。',
      'order.goldOnly': '委托只用原色/别色交付，金花留给卖出。',
      'hint.title': '小贴士',
      'hint.body': '花只在土壤湿润时生长，浇透一次大约能长到七成半；四块地同时生长，切换不会停。离开页面期间最多补算 12 小时（土壤会干，干了就停止生长）。收获进花篮：卖原色最省事，凑花束交付更划算；仙品留着卖，是 3 倍价。',
      'action.reset': '重置花园',
      'action.resetConfirm': '再点一次确认重置',
      'action.resetDone': '花园已重置',
    }

    const en = {
      'view.label': 'Garden',
      'view.title': 'My garden',
      'header.subtitle': 'Four grounds — meadow, snowfield, crater, lakeside — and twenty-five flowers, each ground with its own species and sky.',
      'stat.coins': 'Coins',
      'stat.level': 'Level',
      'stat.levelValue': 'Lv.{n}',
      'stat.harvested': 'Total harvested',
      'scene.meadow': 'Meadow',
      'scene.snow': 'Snowfield',
      'scene.volcano': 'Crater',
      'scene.lake': 'Lakeside',
      'scene.locked': 'Unlock · {n} coins',
      'scene.short': '{n} coins short',
      'scene.unlocked': 'Unlocked',
      'scene.confirm': 'Confirm unlock · {n}',
      'weather.meadow.clear': 'Clear',
      'weather.meadow.overcast': 'Overcast',
      'weather.meadow.rain': 'Rain',
      'weather.snow.clear': 'Bright snow',
      'weather.snow.overcast': 'Snow clouds',
      'weather.snow.rain': 'Snowfall',
      'weather.volcano.clear': 'Heat wave',
      'weather.volcano.overcast': 'Sulphur haze',
      'weather.volcano.rain': 'Ash fall',
      'weather.lake.clear': 'Clear',
      'weather.lake.overcast': 'Thin cloud',
      'weather.lake.rain': 'Drizzle',
      'weather.growth': 'growth {n}',
      'weather.steady': 'growth as usual',
      'weather.soilWet': 'soil stays wet',
      'weather.soilDry': 'soil does not stay wet',
      'weather.left': '{n} to change',
      'plot.section': 'Garden plots',
      'plot.empty': 'Empty plot',
      'plot.plant': 'Plant',
      'plot.cancel': 'Cancel',
      'plot.locked': 'Locked',
      'plot.lockFirst': 'Unlock the previous plot first',
      'plot.unlock': 'Unlock · {n} coins',
      'plot.short': '{n} coins short',
      'plot.water': 'Water',
      'plot.watered': 'Soil is wet',
      'plot.harvest': 'Harvest',
      'plot.ready': 'Ready to harvest',
      'plot.dry': 'Soil is dry — growth paused',
      'plot.remaining': 'Blooms in about {n}',
      'plot.drying': 'Dries in about {n} — water again to continue',
      'plot.moisture': 'Moisture {n}%',
      'plot.wetShort': '{n}% wet',
      'plot.driedBadge': 'Dried once',
      'stage.seed': 'Seed',
      'stage.sprout': 'Sprout',
      'stage.bud': 'Bud',
      'stage.bloom': 'In bloom',
      'seed.pick': 'Choose a seed',
      'seed.cost': '{n} coins',
      'item.section': 'Items',
      'item.fertilizer': 'Fertiliser',
      'item.fertilizer.note': 'Jump one flower 25% further along',
      'item.sprinkler': 'Sprinkler',
      'item.sprinkler.note': 'Waters this ground for 30 minutes',
      'item.charm': 'Lucky charm',
      'item.charm.note': '+25% spirit chance on the next harvest',
      'item.basket': 'Basket upgrade',
      'item.basket.note': '+6 basket slots, up to level 3',
      'item.price': '{n} coins',
      'item.buy': 'Buy',
      'item.owned': '×{n}',
      'item.level': 'Lv.{n}',
      'item.maxed': 'Maxed',
      'item.short': '{n} coins short',
      'item.fertilize': 'Feed',
      'item.useGround': 'Use here',
      'item.useCharm': 'Arm',
      'item.charmReady': 'Lucky charm is waiting',
      'item.sprinklerLeft': 'Auto-water {n}',
      'item.fertilized': 'Fed {flower}: growth +25%',
      'item.bought': 'Bought {item}',
      'item.sprinkled': 'Auto-watering {scene}',
      'plot.sprinkled': 'Sprinkler keeps it wet',
      'variant.base': 'Plain',
      'variant.alt': 'Other colour',
      'variant.hidden': 'Spirit',
      'variant.hiddenShort': 'Spirit',
      'variant.goldTag': 'spirit',
      'species.dandelion': 'Dandelion',
      'species.daisy': 'Daisy',
      'species.cherry': 'Cherry blossom',
      'species.tulip': 'Tulip',
      'species.lavender': 'Lavender',
      'species.poppy': 'Corn poppy',
      'species.sunflower': 'Sunflower',
      'species.lily': 'Lily',
      'species.rose': 'Rose',
      'species.hydrangea': 'Hydrangea',
      'species.snowdrop': 'Snowdrop',
      'species.hellebore': 'Hellebore',
      'species.plum': 'Plum blossom',
      'species.edelweiss': 'Edelweiss',
      'species.camellia': 'Camellia',
      'species.cactus': 'Prickly pear',
      'species.lehua': 'ʻŌhiʻa lehua',
      'species.agave': 'Agave',
      'species.silversword': 'Silversword',
      'species.plumeria': 'Plumeria',
      'species.pickerel': 'Pickerelweed',
      'species.loosestrife': 'Purple loosestrife',
      'species.iris': 'Yellow flag iris',
      'species.waterlily': 'Water lily',
      'species.lotus': 'Lotus',
      'latin.dandelion': 'Taraxacum officinale',
      'latin.daisy': 'Bellis perennis',
      'latin.cherry': 'Prunus serrulata',
      'latin.tulip': 'Tulipa gesneriana',
      'latin.lavender': 'Lavandula angustifolia',
      'latin.poppy': 'Papaver rhoeas',
      'latin.sunflower': 'Helianthus annuus',
      'latin.lily': 'Lilium candidum',
      'latin.rose': 'Rosa rugosa',
      'latin.hydrangea': 'Hydrangea macrophylla',
      'latin.snowdrop': 'Galanthus nivalis',
      'latin.hellebore': 'Helleborus niger',
      'latin.plum': 'Prunus mume',
      'latin.edelweiss': 'Leontopodium nivale',
      'latin.camellia': 'Camellia japonica',
      'latin.cactus': 'Opuntia ficus-indica',
      'latin.lehua': 'Metrosideros polymorpha',
      'latin.agave': 'Agave americana',
      'latin.silversword': 'Argyroxiphium sandwicense',
      'latin.plumeria': 'Plumeria rubra',
      'latin.pickerel': 'Pontederia cordata',
      'latin.loosestrife': 'Lythrum salicaria',
      'latin.iris': 'Iris pseudacorus',
      'latin.waterlily': 'Nymphaea alba',
      'latin.lotus': 'Nelumbo nucifera',
      'codex.dandelion': 'Love that cannot stay — carried by the wind',
      'codex.daisy': 'Innocence, and love kept hidden',
      'codex.cherry': 'Life at its brief, brilliant peak',
      'codex.tulip': 'Perfect love, a lasting blessing',
      'codex.lavender': 'Waiting for love, in quiet patience',
      'codex.poppy': 'Comfort, and forgetting',
      'codex.sunflower': 'Silent love, always facing the sun',
      'codex.lily': 'Purity, a hundred years together',
      'codex.rose': 'Passion, I love you',
      'codex.hydrangea': 'Hope, and coming together (colour follows soil pH)',
      'codex.snowdrop': 'Hope that arrives through the snow',
      'codex.hellebore': 'A guardian in hard ground (the winter rose)',
      'codex.plum': 'Resilience and grace — the colder, the better',
      'codex.edelweiss': 'Precious memory, and courage',
      'codex.camellia': 'Modesty, and an ideal love',
      'codex.cactus': 'Tough, and fiercely warm',
      'codex.lehua': 'New life: the first flower on the lava',
      'codex.agave': 'One flowering in a lifetime, then the plant dies',
      'codex.silversword': 'A long, solitary watch',
      'codex.plumeria': 'A fresh start',
      'codex.pickerel': 'Quiet persistence',
      'codex.loosestrife': 'A solitary beauty',
      'codex.iris': 'A messenger, and hope',
      'codex.waterlily': 'Clean, and still',
      'codex.lotus': 'Rising unstained out of the mud',
      'codex.title': 'Flower book',
      'codex.progress': '{n}/{total}',
      'codex.speciesProgress': '{n}/{total} species',
      'codex.undiscovered': 'Not harvested yet',
      'codex.harvests': 'Harvested {n}×',
      'codex.meaning': 'Meaning',
      'codex.hint': 'Spirit blooms: 3% base; +7% if the plant never dried, +5% in this ground’s favoured weather, +8% right after watering, +7% for a night harvest (22:00–05:00), capped at 30%. They glow, sell for 3×, and never pay for a bouquet.',
      'codex.hiddenUnknown': '???',
      'codex.teaser': 'Spirit bloom ×3 — how to find one, in the book',
      'codex.otherGround': 'Switch grounds to see their entries',
      'codex.altRule': 'Second colours only grow on plots #1, #3 and #5',
      'codex.favoured': 'Favoured weather here: {w}',
      'time.seconds': '{n}s',
      'time.minutes': '{n} min',
      'time.hours': '{n} h',
      'time.shortSeconds': '{n}s',
      'time.shortMinutes': '{n}m',
      'reward.gain': 'Harvested {flower}, +{xp} XP',
      'reward.gold': '✦ A spirit {flower}! Sells ×{n} — it is in the basket',
      'reward.sell': 'Sold {flower}, +{coins} coins',
      'reward.sellMany': 'Sold {n} flowers, +{coins} coins',
      'reward.order': 'Delivered order #{id}, +{coins} coins',
      'error.coins': 'Not enough coins — sell a few flowers first',
      'error.basketFull': 'Basket is full — sell or deliver some flowers first',
      'basket.title': 'Basket',
      'basket.capacity': '{n}/{max}',
      'basket.empty': 'The basket is empty; harvested blooms land here.',
      'basket.sellAll': 'Sell all · +{n}',
      'basket.view': 'View {flower}',
      'preview.close': 'Close',
      'preview.open': 'View {flower}',
      'basket.each': '{n} each',
      'basket.total': '{n} total',
      'basket.sellOne': 'Sell {flower} · +{n}',
      'basket.confirm': 'Confirm sell · +{n}',
      'basket.full': 'Basket full — sell some flowers first',
      'basket.fullNote': 'The basket is full — sell some flowers before harvesting.',
      'order.title': 'Bouquet orders',
      'order.head': 'Order #{id}',
      'order.reward': '{coins} coins · {xp} XP',
      'order.deliver': 'Deliver',
      'order.missing': 'Missing blooms',
      'order.item': '{flower} ×{n}',
      'order.empty': 'No order right now; a new one appears after each delivery.',
      'order.goldOnly': 'Bouquets take plain or second-colour blooms; keep the gold for selling.',
      'hint.title': 'Tip',
      'hint.body': 'Flowers grow only while the soil is wet, and one watering carries them about three quarters of the way. All four grounds grow at once, and switching between them never pauses anything. Away from the tab the garden replays up to 12 hours — the soil still dries, and growth stops when it does. Harvested blooms go to the basket: sell them, or fill a bouquet order for a better price; keep the spirit blooms, they sell for 3×.',
      'action.reset': 'Reset garden',
      'action.resetConfirm': 'Click again to confirm',
      'action.resetDone': 'Garden reset',
    }

    // ---------------------------------------------------------------------
    // §2 Scenes, species and colour variants.
    //    `head` picks the drawing, `leaf` the foliage, `alt` the second colour
    //    that odd-numbered plots grow.
    // ---------------------------------------------------------------------
    /** The hidden bloom is not yellow paint: pearl petals, a pale gold aura, drifting light. */
    const HIDDEN_PAL = {
      petal: '#fff8e2', petalDeep: '#f4dfae', center: '#fffdf2', centerDeep: '#f3d79a',
      stem: '#cfe4c9', leaf: '#deecd7',
    }
    const HIDDEN_GOLD = { tip: '#f3d9f0', light: '#fffdf6', aura: '#fff6d6', auraEdge: '#ffedb8', spark: '#fff8dc' }

    const SCENES = [
      {
        id: 'meadow', cost: 0, tint: 'rgba(122,168,106,0.10)', edge: 'rgba(122,168,106,0.32)',
        weather: { clear: 1.15, overcast: 1, rain: 1 }, rainWets: true,
        species: ['dandelion', 'daisy', 'cherry', 'tulip', 'lavender', 'poppy', 'sunflower', 'lily', 'rose', 'hydrangea'],
      },
      {
        id: 'snow', cost: 150, tint: 'rgba(122,164,222,0.12)', edge: 'rgba(122,164,222,0.38)',
        weather: { clear: 1.05, overcast: 0.95, rain: 0.9 }, rainWets: true,
        species: ['snowdrop', 'hellebore', 'plum', 'edelweiss', 'camellia'],
      },
      {
        id: 'volcano', cost: 450, tint: 'rgba(196,96,72,0.12)', edge: 'rgba(196,96,72,0.38)',
        weather: { clear: 1.25, overcast: 0.9, rain: 0.85 }, rainWets: false,
        species: ['cactus', 'lehua', 'agave', 'silversword', 'plumeria'],
      },
      {
        id: 'lake', cost: 1200, tint: 'rgba(84,158,166,0.12)', edge: 'rgba(84,158,166,0.38)',
        weather: { clear: 1.1, overcast: 1.05, rain: 1.2 }, rainWets: true,
        species: ['pickerel', 'loosestrife', 'iris', 'waterlily', 'lotus'],
      },
    ]
    const SCENE_BY_ID = new Map(SCENES.map(scene => [scene.id, scene]))

    const SPECIES = [
      // ── meadow ──────────────────────────────────────────────────────────
      {
        id: 'dandelion', cost: 3, growSec: 45, sell: 6, xp: 1, head: 'dandelion', leaf: 'round',
        pal: { petal: '#f8cd4b', petalDeep: '#e0a923', center: '#f2b62f', centerDeep: '#c98a14', stem: '#8ab06a', leaf: '#95bf72' },
      },
      {
        id: 'daisy', cost: 5, growSec: 60, sell: 10, xp: 2, head: 'daisy', leaf: 'round',
        pal: { petal: '#fbfaf1', petalDeep: '#e4dcc4', center: '#f5c542', centerDeep: '#d99d20', stem: '#7aa86a', leaf: '#8bbf74' },
        alt: { petal: '#f7c6d4', petalDeep: '#e2a5b9' },
      },
      {
        id: 'cherry', cost: 10, growSec: 120, sell: 21, xp: 4, head: 'cherry', leaf: 'round',
        pal: { petal: '#f9d5e0', petalDeep: '#eeb0c5', center: '#f3b3c6', centerDeep: '#d98ba0', stem: '#8a6d57', leaf: '#7fae72' },
        alt: { petal: '#fdfdfd', petalDeep: '#e6e2df', center: '#f3d7b8', centerDeep: '#dcc09c' },
      },
      {
        id: 'tulip', cost: 14, growSec: 150, sell: 29, xp: 5, head: 'tulip', leaf: 'strap',
        pal: { petal: '#f0718f', petalDeep: '#cf4d70', center: '#ffd9e4', centerDeep: '#e9a4b8', stem: '#6fa85f', leaf: '#82b872' },
        alt: { petal: '#f6d15c', petalDeep: '#d9ae33' },
      },
      {
        id: 'lavender', cost: 18, growSec: 180, sell: 38, xp: 7, head: 'spike', leaf: 'narrow',
        pal: { petal: '#9b86d8', petalDeep: '#7c68bd', center: '#b6a5e6', centerDeep: '#8d7cc9', stem: '#8fa87a', leaf: '#9db98a' },
        headOpts: { rows: 6 },
      },
      {
        id: 'poppy', cost: 22, growSec: 210, sell: 47, xp: 9, head: 'poppy', leaf: 'lobed',
        pal: { petal: '#e6483f', petalDeep: '#bb2f29', center: '#2f2b28', centerDeep: '#1c1a18', stem: '#7fa05f', leaf: '#88ab66' },
        alt: { petal: '#fbf6ef', petalDeep: '#e2d9cc' },
      },
      {
        id: 'sunflower', cost: 26, growSec: 240, sell: 56, xp: 11, head: 'sunflower', leaf: 'broad',
        pal: { petal: '#f7b733', petalDeep: '#dd9a1a', center: '#6b4226', centerDeep: '#4d2d18', stem: '#6f9c4f', leaf: '#7fae5c' },
      },
      {
        id: 'lily', cost: 32, growSec: 290, sell: 70, xp: 13, head: 'lily', leaf: 'narrow',
        pal: { petal: '#fbf6ec', petalDeep: '#e9c6cd', center: '#e8a63a', centerDeep: '#c8862a', stem: '#6fa05f', leaf: '#7fb46e' },
        alt: { petal: '#f6c9d6', petalDeep: '#dfa6ba' },
      },
      {
        id: 'rose', cost: 40, growSec: 340, sell: 88, xp: 17, head: 'rose', leaf: 'lobed',
        pal: { petal: '#e2466c', petalDeep: '#b62f52', center: '#8e2242', centerDeep: '#6f1832', stem: '#5f8f52', leaf: '#6fa860' },
        alt: { petal: '#fbf5ec', petalDeep: '#e0d2c0', center: '#e8d8b8', centerDeep: '#c9b48c' },
      },
      {
        id: 'hydrangea', cost: 50, growSec: 400, sell: 112, xp: 22, head: 'mophead', leaf: 'broad',
        pal: { petal: '#8f9bf0', petalDeep: '#6d78d8', center: '#b9c0f8', centerDeep: '#8a93e2', stem: '#7fa76a', leaf: '#8bb877' },
        alt: { petal: '#f2a8c6', petalDeep: '#d97fa6', center: '#f7c6d9', centerDeep: '#e5a0be' },
      },
      // ── snowfield ───────────────────────────────────────────────────────
      {
        id: 'snowdrop', cost: 8, growSec: 90, sell: 17, xp: 3, head: 'droop', leaf: 'narrow',
        pal: { petal: '#fbfdff', petalDeep: '#dbe4ee', center: '#8fbf7a', centerDeep: '#5f8f4f', stem: '#7fa07a', leaf: '#8fae8a' },
      },
      {
        id: 'hellebore', cost: 16, growSec: 170, sell: 35, xp: 6, head: 'bloom5', leaf: 'lobed',
        pal: { petal: '#f6f1ea', petalDeep: '#ddcfc0', center: '#a8c47f', centerDeep: '#7d9a58', stem: '#6f8a5c', leaf: '#7d9a68' },
        alt: { petal: '#e7b9cd', petalDeep: '#c992ab' },
      },
      {
        id: 'plum', cost: 24, growSec: 230, sell: 52, xp: 10, head: 'bloom5', leaf: 'round',
        pal: { petal: '#f7b9cd', petalDeep: '#dd8fa9', center: '#f7d76a', centerDeep: '#d8b23c', stem: '#6b5548', leaf: '#7c9a6a' },
        alt: { petal: '#fdfbf7', petalDeep: '#e5dccd' },
      },
      {
        id: 'edelweiss', cost: 34, growSec: 300, sell: 75, xp: 14, head: 'star', leaf: 'narrow',
        pal: { petal: '#faf7ef', petalDeep: '#dfd8c6', center: '#e8c65a', centerDeep: '#c9a633', stem: '#8a9a72', leaf: '#9aa885' },
      },
      {
        id: 'camellia', cost: 46, growSec: 370, sell: 104, xp: 20, head: 'rose', leaf: 'round',
        pal: { petal: '#e3588c', petalDeep: '#b8465f', center: '#8c2740', centerDeep: '#6b1930', stem: '#5f7f52', leaf: '#6f9a60' },
        alt: { petal: '#fdfbf6', petalDeep: '#e6ded1', center: '#e8ddc7', centerDeep: '#cbb999' },
      },
      // ── volcanic crater ─────────────────────────────────────────────────
      {
        id: 'cactus', cost: 12, growSec: 130, sell: 26, xp: 4, head: 'cup', leaf: 'pad',
        pal: { petal: '#f6c34a', petalDeep: '#d9a02a', center: '#c9603f', centerDeep: '#9c4529', stem: '#6f9a5e', leaf: '#7fae6a' },
        alt: { petal: '#f08a4b', petalDeep: '#c96a30' },
      },
      {
        id: 'lehua', cost: 22, growSec: 200, sell: 46, xp: 8, head: 'pompom', leaf: 'round',
        pal: { petal: '#e34b3f', petalDeep: '#b93129', center: '#f6b23c', centerDeep: '#d18c1f', stem: '#6f7f52', leaf: '#7f9460' },
      },
      {
        id: 'agave', cost: 36, growSec: 310, sell: 80, xp: 15, head: 'spike', leaf: 'rosette',
        pal: { petal: '#e8d98a', petalDeep: '#c9b85c', center: '#b8a24a', centerDeep: '#8f7c2e', stem: '#7f9a6a', leaf: '#9aa885' },
        headOpts: { rows: 4, wide: true },
      },
      {
        id: 'silversword', cost: 52, growSec: 420, sell: 120, xp: 23, head: 'spike', leaf: 'rosette',
        pal: { petal: '#b48ad6', petalDeep: '#8f68b8', center: '#d3bde8', centerDeep: '#a98cc9', stem: '#9aa8a0', leaf: '#b6c2bb' },
        headOpts: { rows: 5 },
      },
      {
        id: 'plumeria', cost: 64, growSec: 500, sell: 152, xp: 29, head: 'bloom5', leaf: 'broad',
        pal: { petal: '#fdf4f6', petalDeep: '#efd3dc', center: '#f7cf5a', centerDeep: '#d9ab2c', stem: '#7f8f62', leaf: '#8fa870' },
        alt: { petal: '#f3a8bf', petalDeep: '#dc7f9c' },
      },
      // ── lakeside ────────────────────────────────────────────────────────
      {
        id: 'pickerel', cost: 14, growSec: 140, sell: 30, xp: 4, head: 'spike', leaf: 'broad',
        pal: { petal: '#7d8ee0', petalDeep: '#5f6fc4', center: '#a9b6ef', centerDeep: '#818fce', stem: '#6f9a72', leaf: '#7fae80' },
        headOpts: { rows: 5 },
      },
      {
        id: 'loosestrife', cost: 26, growSec: 220, sell: 55, xp: 10, head: 'spike', leaf: 'narrow',
        pal: { petal: '#c95a9c', petalDeep: '#a53e7c', center: '#e3a0c4', centerDeep: '#c478a2', stem: '#6f9a62', leaf: '#82ae6c' },
        headOpts: { rows: 7 },
      },
      {
        id: 'iris', cost: 38, growSec: 300, sell: 82, xp: 15, head: 'iris', leaf: 'strap',
        pal: { petal: '#f2c53d', petalDeep: '#d3a521', center: '#c98a2a', centerDeep: '#9c671a', stem: '#6f9a5c', leaf: '#82ae6a' },
        alt: { petal: '#f7f2e6', petalDeep: '#ded4c0' },
      },
      {
        id: 'waterlily', cost: 54, growSec: 400, sell: 120, xp: 22, head: 'waterlily', leaf: 'pad',
        pal: { petal: '#fdf3f7', petalDeep: '#efc9da', center: '#f2c33c', centerDeep: '#d09d1f', stem: '#5f8f7a', leaf: '#6f9a78' },
        alt: { petal: '#f3b7cf', petalDeep: '#dd8fae' },
      },
      {
        id: 'lotus', cost: 70, growSec: 520, sell: 165, xp: 30, head: 'lotus', leaf: 'pad',
        pal: { petal: '#f29ac0', petalDeep: '#d974a0', center: '#f8d96a', centerDeep: '#d8b53a', stem: '#6f9a6a', leaf: '#7fae74' },
        alt: { petal: '#fdfbf7', petalDeep: '#e8e0d2' },
      },
    ]
    const SPECIES_BY_ID = new Map(SPECIES.map(species => [species.id, species]))

    /** Every codex entry: species × variant, including the gold hidden bloom. */
    const CODEX_ENTRIES = []
    for (const species of SPECIES) {
      CODEX_ENTRIES.push({ species: species.id, variant: 'base' })
      if (species.alt !== undefined) CODEX_ENTRIES.push({ species: species.id, variant: 'alt' })
      CODEX_ENTRIES.push({ species: species.id, variant: 'hidden' })
    }

    const STORAGE_KEY = 'dsh.flower-garden.v4'
    const LEGACY_KEYS = ['dsh.flower-garden.v3', 'dsh.flower-garden.v2', 'dsh.flower-garden.v1']
    const STATE_VERSION = 4
    const PLOT_COUNT = 6
    const START_COINS = 25
    const START_PLOTS = 3
    const UNLOCK_COSTS = [null, null, null, 40, 90, 160]
    const XP_PER_LEVEL = 60
    const BASKET_CAPACITY = 12
    const SPRINKLER_MS = 30 * 60 * 1000
    const CHARM_BONUS = 0.25

    /** Shop goods: consumables sit in the bag, the basket upgrade has levels. */
    const ITEMS = [
      { id: 'fertilizer', price: 35, kind: 'consumable' },
      { id: 'sprinkler', price: 90, kind: 'consumable' },
      { id: 'charm', price: 120, kind: 'consumable' },
      { id: 'basket', price: 150, kind: 'upgrade', maxLevel: 2 },
    ]
    const ITEM_BY_ID = new Map(ITEMS.map(item => [item.id, item]))

    function basketCapacity(state) {
      return BASKET_CAPACITY + 6 * (state.basketLevel ?? 0)
    }
    const ORDER_SLOTS = 2
    const MAX_OFFLINE_MS = 12 * 60 * 60 * 1000
    const DRY_SHARE = 0.75

    /** Weather turns over on this period; each scene reads it differently. */
    const WEATHER_MS = 5 * 60 * 1000
    const WEATHER_KINDS = ['clear', 'overcast', 'rain']

    function growMsOf(species) {
      return species.growSec * 1000
    }

    function decayPerMs(species) {
      return 100 / (growMsOf(species) * DRY_SHARE)
    }

    function sceneOf(sceneId) {
      return SCENE_BY_ID.get(sceneId) ?? SCENES[0]
    }

    /** Deterministic weather bucket, so the same clock always gives the same sky. */
    function weatherAt(ms) {
      const bucket = Math.floor(ms / WEATHER_MS)
      let x = (bucket ^ 0x9e3779b9) | 0
      x = Math.imul(x ^ (x >>> 15), 0x85ebca6b)
      x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35)
      x ^= x >>> 16
      return WEATHER_KINDS[Math.abs(x) % WEATHER_KINDS.length]
    }

    function weatherEndsAt(ms) {
      return (Math.floor(ms / WEATHER_MS) + 1) * WEATHER_MS
    }

    /** The palette a plot or a codex entry draws with. */
    function paletteOf(species, variant) {
      if (variant === 'hidden') return { ...species.pal, ...HIDDEN_PAL }
      if (variant === 'alt' && species.alt !== undefined) return { ...species.pal, ...species.alt }
      return species.pal
    }

    /** Plots #1, #3 and #5 (even indexes) grow the species' second colour. */
    function plotVariant(species, index) {
      return index % 2 === 0 && species.alt !== undefined ? 'alt' : 'base'
    }

    function variantMultiplier(variant) {
      return variant === 'hidden' ? 3 : variant === 'alt' ? 1.3 : 1
    }

    function bloomPrice(species, variant) {
      return Math.round(species.sell * variantMultiplier(variant))
    }

    /** Chance that a harvest turns up the gold bloom; the flower book lists these. */
    function hiddenChance(plot, weather, now, scene) {
      let chance = 0.03
      if (plot.dried !== true) chance += 0.07
      const favoured = scene.rainWets ? weather === 'rain' : weather === 'clear'
      if (favoured) chance += 0.05
      const hour = new Date(now).getHours()
      if (hour >= 22 || hour < 5) chance += 0.07
      if (plot.moisture >= 80) chance += 0.08
      return Math.min(0.3, chance)
    }

    // ---------------------------------------------------------------------
    // §3 State model: plain JSON, pure transitions, exact time integration.
    // ---------------------------------------------------------------------
    function emptyScene(unlocked) {
      return { unlocked, plots: new Array(PLOT_COUNT).fill(null), sprinklerUntil: 0 }
    }

    function emptyBag() {
      return { fertilizer: 0, sprinkler: 0, charm: 0 }
    }

    function freshState(now) {
      const scenes = {}
      for (const scene of SCENES) scenes[scene.id] = emptyScene(scene.cost === 0 ? START_PLOTS : 0)
      return fillOrders({
        v: STATE_VERSION,
        coins: START_COINS,
        xp: 0,
        harvested: 0,
        scene: 'meadow',
        scenes,
        basket: [],
        bag: emptyBag(),
        basketLevel: 0,
        charm: false,
        orders: [],
        seen: {},
        seed: 20261116,
        orderSeq: 1,
        lastTick: now,
      })
    }

    function finiteOr(value, fallback) {
      return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback
    }

    function readPlots(raw, legacyPlots) {
      const source = Array.isArray(raw) ? raw : Array.isArray(legacyPlots) ? legacyPlots : []
      const plots = new Array(PLOT_COUNT).fill(null)
      for (let index = 0; index < PLOT_COUNT && index < source.length; index += 1) {
        const plot = source[index]
        if (plot === null || typeof plot !== 'object') continue
        const species = SPECIES_BY_ID.get(plot.species)
        if (species === undefined) continue
        plots[index] = {
          species: species.id,
          growthMs: Math.min(finiteOr(plot.growthMs, 0), growMsOf(species)),
          moisture: Math.min(finiteOr(plot.moisture, 0), 100),
          dried: plot.dried === true,
        }
      }
      return plots
    }

    function sanitizeBag(raw) {
      const bag = emptyBag()
      if (raw === null || typeof raw !== 'object') return bag
      for (const id of Object.keys(bag)) bag[id] = Math.floor(finiteOr(raw[id], 0))
      return bag
    }

    function sanitizeSeen(raw) {
      const seen = {}
      if (raw === null || typeof raw !== 'object') return seen
      for (const [key, count] of Object.entries(raw)) {
        const [speciesId, rawVariant] = key.split(':')
        // v2 stored a bare species id; those harvests were plain blooms.
        const variant = rawVariant === undefined ? 'base' : rawVariant
        if (!SPECIES_BY_ID.has(speciesId)) continue
        if (variant !== 'base' && variant !== 'alt' && variant !== 'hidden') continue
        seen[`${speciesId}:${variant}`] = Math.floor(finiteOr(count, 0))
      }
      return seen
    }

    /** Coerce a parsed snapshot into a usable garden, migrating v1/v2 on the way. */
    function sanitize(raw, now) {
      if (raw === null || typeof raw !== 'object') return freshState(now)
      const version = raw.v
      if (version !== 1 && version !== 2 && version !== 3 && version !== STATE_VERSION) return freshState(now)
      const legacy = version < STATE_VERSION
      const scenes = {}
      for (const scene of SCENES) {
        // v3 and v4 keep per-scene state; v1/v2 kept one flat garden.
        const stored = raw.scenes !== null && typeof raw.scenes === 'object' ? raw.scenes[scene.id] : undefined
        const source = stored !== undefined ? stored : version <= 2 && scene.cost === 0 ? raw : undefined
        if (source === undefined) {
          scenes[scene.id] = emptyScene(0)
          continue
        }
        // The free starting ground is always open; the others start closed.
        const open = Math.min(PLOT_COUNT, scene.cost === 0
          ? Math.max(START_PLOTS, finiteOr(source.unlocked, START_PLOTS))
          : finiteOr(source.unlocked, 0))
        scenes[scene.id] = {
          unlocked: open === 0 ? 0 : Math.max(START_PLOTS, open),
          plots: open === 0 ? emptyScene(0).plots : readPlots(source.plots),
          sprinklerUntil: finiteOr(source.sprinklerUntil, 0),
        }
      }
      // An upgraded basket holds more, so the cap depends on the saved level.
      const basketLevel = Math.max(0, Math.min(2, Math.floor(finiteOr(raw.basketLevel, 0))))
      const basket = []
      if (Array.isArray(raw.basket)) {
        for (const item of raw.basket.slice(0, BASKET_CAPACITY + 6 * basketLevel)) {
          const species = item === null || typeof item !== 'object' ? undefined : SPECIES_BY_ID.get(item.species)
          if (species === undefined) continue
          const variant = item.variant === 'alt' || item.variant === 'hidden' ? item.variant : 'base'
          basket.push({ species: species.id, variant })
        }
      }
      return fillOrders({
        v: STATE_VERSION,
        coins: finiteOr(raw.coins, START_COINS),
        xp: finiteOr(raw.xp, 0),
        harvested: finiteOr(raw.harvested, 0),
        scene: SCENE_BY_ID.has(raw.scene) ? raw.scene : 'meadow',
        scenes,
        basket,
        bag: sanitizeBag(raw.bag),
        basketLevel,
        charm: raw.charm === true,
        orders: Array.isArray(raw.orders) ? raw.orders.filter(validOrder).slice(0, ORDER_SLOTS) : [],
        seen: sanitizeSeen(raw.seen),
        seed: Math.floor(finiteOr(raw.seed, 20261116)) || 20261116,
        orderSeq: Math.max(1, Math.floor(finiteOr(raw.orderSeq, 1))),
        lastTick: Math.min(finiteOr(raw.lastTick, now), now),
      })
    }

    function validOrder(order) {
      if (order === null || typeof order !== 'object') return false
      if (!Array.isArray(order.items) || order.items.length === 0) return false
      if (typeof order.coins !== 'number' || typeof order.xp !== 'number') return false
      return order.items.every(item => item !== null && typeof item === 'object'
        && SPECIES_BY_ID.has(item.species) && Number.isFinite(item.count) && item.count > 0)
    }

    /**
     * Advance one planted plot by `ms` under one scene and weather segment.
     * @returns the same plot when nothing changes.
     */
    function advancePlot(plot, ms, weather, scene, sprinkled) {
      const species = SPECIES_BY_ID.get(plot.species)
      if (species === undefined || ms <= 0) return plot
      const growMs = growMsOf(species)
      const factor = scene !== undefined ? (scene.weather[weather] ?? 1) : weather === 'clear' ? 1.15 : 1
      const wet = sprinkled === true || (scene !== undefined && scene.rainWets && weather === 'rain')
      const moisture = wet ? 100 : Math.max(0, plot.moisture - ms * decayPerMs(species))
      const wetMs = wet ? ms : Math.min(ms, (plot.moisture / 100) * growMs * DRY_SHARE)
      const growthMs = Math.min(growMs, plot.growthMs + wetMs * factor)
      const dried = plot.dried === true || (moisture <= 0 && growthMs < growMs)
      if (growthMs === plot.growthMs && moisture === plot.moisture && dried === plot.dried) return plot
      return { ...plot, growthMs, moisture, dried }
    }

    /** Advance every plot in every scene, one weather segment at a time. */
    function advanceState(state, now) {
      let cursor = Math.max(state.lastTick, now - MAX_OFFLINE_MS)
      if (now <= cursor) return state
      const nextScenes = { ...state.scenes }
      let scenesChanged = false
      while (cursor < now) {
        let segmentEnd = Math.min(now, weatherEndsAt(cursor))
        for (const scene of SCENES) {
          const until = nextScenes[scene.id]?.sprinklerUntil ?? 0
          if (until > cursor && until < segmentEnd) segmentEnd = until
        }
        const weather = weatherAt(cursor)
        const dt = segmentEnd - cursor
        for (const scene of SCENES) {
          const slot = nextScenes[scene.id]
          if (slot === undefined) continue
          const sprinkled = (slot.sprinklerUntil ?? 0) > cursor
          let plots = slot.plots
          let changed = false
          for (let index = 0; index < plots.length; index += 1) {
            const plot = plots[index]
            if (plot === null) continue
            const advanced = advancePlot(plot, dt, weather, scene, sprinkled)
            if (advanced === plot) continue
            if (!changed) plots = plots.slice()
            changed = true
            plots[index] = advanced
          }
          if (!changed) continue
          nextScenes[scene.id] = { ...slot, plots }
          scenesChanged = true
        }
        cursor = segmentEnd
      }
      return scenesChanged ? { ...state, scenes: nextScenes, lastTick: now } : { ...state, lastTick: now }
    }

    function plantAt(state, sceneId, index, speciesId) {
      const slot = state.scenes[sceneId]
      const scene = SCENE_BY_ID.get(sceneId)
      if (slot === undefined || scene === undefined) return null
      if (index < 0 || index >= slot.unlocked || slot.plots[index] !== null) return null
      if (!scene.species.includes(speciesId)) return null
      const species = SPECIES_BY_ID.get(speciesId)
      if (species === undefined || state.coins < species.cost) return null
      const plots = slot.plots.slice()
      plots[index] = { species: species.id, growthMs: 0, moisture: 100, dried: false }
      return {
        ...state,
        coins: state.coins - species.cost,
        scenes: { ...state.scenes, [sceneId]: { ...slot, plots } },
      }
    }

    function waterAt(state, sceneId, index) {
      const slot = state.scenes[sceneId]
      const plot = slot === undefined ? undefined : slot.plots[index]
      if (plot === undefined || plot === null || plot.moisture >= 99.5) return null
      const plots = slot.plots.slice()
      plots[index] = { ...plot, moisture: 100 }
      return { ...state, scenes: { ...state.scenes, [sceneId]: { ...slot, plots } } }
    }

    function unlockAt(state, sceneId, index) {
      const slot = state.scenes[sceneId]
      if (slot === undefined || index !== slot.unlocked || index >= PLOT_COUNT) return null
      const cost = UNLOCK_COSTS[index]
      if (cost === null || state.coins < cost) return null
      return {
        ...state,
        coins: state.coins - cost,
        scenes: { ...state.scenes, [sceneId]: { ...slot, unlocked: slot.unlocked + 1 } },
      }
    }

    function unlockScene(state, sceneId) {
      const scene = SCENE_BY_ID.get(sceneId)
      if (scene === undefined || scene.cost === 0) return null
      const slot = state.scenes[sceneId]
      if (slot === undefined || slot.unlocked > 0) return null
      if (state.coins < scene.cost) return null
      return {
        ...state,
        coins: state.coins - scene.cost,
        scene: sceneId,
        scenes: { ...state.scenes, [sceneId]: emptyScene(START_PLOTS) },
      }
    }

    function harvestAt(state, sceneId, index, now, weather) {
      const scene = SCENE_BY_ID.get(sceneId)
      const slot = state.scenes[sceneId]
      const plot = slot === undefined ? undefined : slot.plots[index]
      if (scene === undefined || plot === undefined || plot === null) return null
      const species = SPECIES_BY_ID.get(plot.species)
      if (species === undefined || plot.growthMs < growMsOf(species)) return null
      if (state.basket.length >= basketCapacity(state)) return null
      const bonus = state.charm === true ? CHARM_BONUS : 0
      const chance = Math.min(state.charm === true ? 0.55 : 0.3, hiddenChance(plot, weather, now, scene) + bonus)
      const roll = nextRandom(state.seed)
      const hidden = roll.value < chance
      const variant = hidden ? 'hidden' : plotVariant(species, index)
      const plots = slot.plots.slice()
      plots[index] = null
      const key = `${species.id}:${variant}`
      return {
        ...state,
        seed: roll.seed,
        charm: false,
        xp: state.xp + species.xp,
        harvested: state.harvested + 1,
        scenes: { ...state.scenes, [sceneId]: { ...slot, plots } },
        basket: [...state.basket, { species: species.id, variant }],
        seen: { ...state.seen, [key]: (state.seen[key] ?? 0) + 1 },
      }
    }

    /** Sell the blooms of one species (and variant), or the whole basket. */
    function sellBasket(state, speciesId, variant) {
      const match = item => speciesId === undefined
        || (item.species === speciesId && (variant === undefined || item.variant === variant))
      const selling = state.basket.filter(match)
      if (selling.length === 0) return null
      const coins = selling.reduce((sum, item) => sum + bloomPrice(SPECIES_BY_ID.get(item.species), item.variant), 0)
      return { ...state, coins: state.coins + coins, basket: state.basket.filter(item => !match(item)) }
    }

    function basketValue(state) {
      return state.basket.reduce((sum, item) => sum + bloomPrice(SPECIES_BY_ID.get(item.species), item.variant), 0)
    }

    function basketCount(state, speciesId) {
      return state.basket.filter(item => item.species === speciesId).length
    }

    /** Blooms a bouquet may use: gold ones are kept for selling. */
    function basketPlainCount(state, speciesId) {
      return state.basket.filter(item => item.species === speciesId && item.variant !== 'hidden').length
    }

    function nextRandom(seed) {
      const next = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return { seed: next, value: next / 4294967296 }
    }

    /** Species the player can plant right now: every flower of an opened ground. */
    function availableSpecies(state) {
          const open = new Set()
          for (const scene of SCENES) {
            const slot = state.scenes[scene.id]
            if (slot !== undefined && slot.unlocked > 0) for (const id of scene.species) open.add(id)
          }
          return SPECIES.filter(species => open.has(species.id))
    }

    /** Build one bouquet order for the current level, threading the RNG seed. */
    function makeOrder(seed, level, seq, allowed) {
      let cursor = seed
      const draw = () => {
        const step = nextRandom(cursor)
        cursor = step.seed
        return step.value
      }
      const budget = 4 + level * 10
      const source = allowed !== undefined && allowed.length > 0 ? allowed : SPECIES
      const cheap = source.filter(species => species.cost <= budget)
      const pool = cheap.length > 0 ? cheap : source
      const kinds = pool.length > 1 && draw() > 0.45 ? 2 : 1
      const items = []
      for (let index = 0; index < kinds; index += 1) {
        const species = pool[Math.floor(draw() * pool.length) % pool.length]
        if (items.some(item => item.species === species.id)) continue
        items.push({ species: species.id, count: 1 + Math.floor(draw() * 2) })
      }
      const total = items.reduce((sum, item) => sum + item.count * SPECIES_BY_ID.get(item.species).sell, 0)
      const blooms = items.reduce((sum, item) => sum + item.count, 0)
      return {
        seed: cursor,
        order: { id: seq, items, coins: Math.round(total * 1.75) + 3, xp: blooms * 2 + 2 },
      }
    }

    function fillOrders(state) {
      let seed = state.seed
      let seq = state.orderSeq
      const orders = state.orders.slice()
      const allowed = availableSpecies(state)
      while (orders.length < ORDER_SLOTS) {
        const built = makeOrder(seed, levelOf(state.xp), seq, allowed)
        seed = built.seed
        orders.push(built.order)
        seq += 1
      }
      return { ...state, orders, seed, orderSeq: seq }
    }

    function orderReady(state, order) {
      return order.items.every(item => basketPlainCount(state, item.species) >= item.count)
    }

    /** True when only gold blooms would satisfy the order — worth telling the player. */
    function orderNeedsGold(state, order) {
      if (orderReady(state, order)) return false
      return order.items.every(item => basketCount(state, item.species) >= item.count)
    }

    function deliverOrder(state, orderId) {
      const index = state.orders.findIndex(order => order.id === orderId)
      if (index === -1) return null
      const order = state.orders[index]
      if (!orderReady(state, order)) return null
      const basket = state.basket.slice()
      // Gold blooms never pay for a bouquet; they are worth triple at the counter.
      for (const item of order.items) {
        let remaining = item.count
        for (let cursor = basket.length - 1; cursor >= 0 && remaining > 0; cursor -= 1) {
          if (basket[cursor].species !== item.species || basket[cursor].variant === 'hidden') continue
          basket.splice(cursor, 1)
          remaining -= 1
        }
      }
      const next = {
        ...state,
        coins: state.coins + order.coins,
        xp: state.xp + order.xp,
        basket,
        orders: state.orders.filter(entry => entry.id !== orderId),
      }
      return fillOrders(next)
    }

    /** Buy one shop good: consumables stack in the bag, the basket upgrade levels up. */
    function buyItem(state, itemId) {
      const item = ITEM_BY_ID.get(itemId)
      if (item === undefined || state.coins < item.price) return null
      if (item.kind === 'upgrade') {
        const level = state.basketLevel ?? 0
        if (level >= item.maxLevel) return null
        return { ...state, coins: state.coins - item.price, basketLevel: level + 1 }
      }
      return {
        ...state,
        coins: state.coins - item.price,
        bag: { ...state.bag, [itemId]: (state.bag[itemId] ?? 0) + 1 },
      }
    }

    /** Spend one sprinkler on a ground: it waters every plot there for half an hour. */
    function useSprinkler(state, sceneId, now) {
      const slot = state.scenes[sceneId]
      if (slot === undefined || slot.unlocked <= 0) return null
      if ((state.bag.sprinkler ?? 0) <= 0) return null
      const until = Math.max(now, slot.sprinklerUntil ?? 0) + SPRINKLER_MS
      return {
        ...state,
        bag: { ...state.bag, sprinkler: state.bag.sprinkler - 1 },
        scenes: { ...state.scenes, [sceneId]: { ...slot, sprinklerUntil: until } },
      }
    }

    /** Arm one charm for the next harvest. */
    function useCharm(state) {
      if ((state.bag.charm ?? 0) <= 0 || state.charm === true) return null
      return { ...state, bag: { ...state.bag, charm: state.bag.charm - 1 }, charm: true }
    }

    /** Feed one plant: a quarter of its growth time, instantly. */
    function fertilizeAt(state, sceneId, index) {
      const slot = state.scenes[sceneId]
      const plot = slot === undefined ? undefined : slot.plots[index]
      if (plot === undefined || plot === null) return null
      if ((state.bag.fertilizer ?? 0) <= 0) return null
      const species = SPECIES_BY_ID.get(plot.species)
      if (species === undefined) return null
      const growMs = growMsOf(species)
      if (plot.growthMs >= growMs) return null
      const plots = slot.plots.slice()
      plots[index] = { ...plot, growthMs: Math.min(growMs, plot.growthMs + growMs * 0.25) }
      return {
        ...state,
        bag: { ...state.bag, fertilizer: state.bag.fertilizer - 1 },
        scenes: { ...state.scenes, [sceneId]: { ...slot, plots } },
      }
    }

    function levelOf(xp) {
      return Math.floor(xp / XP_PER_LEVEL) + 1
    }

    function stageOf(plot) {
      const species = SPECIES_BY_ID.get(plot.species)
      if (species === undefined) return 'seed'
      const ratio = plot.growthMs / growMsOf(species)
      if (ratio >= 1) return 'bloom'
      if (ratio >= 0.55) return 'bud'
      if (ratio >= 0.25) return 'sprout'
      return 'seed'
    }

    /** Short form for dense rows: "45s", "3m". */
    function shortDuration(ms, t) {
      const seconds = Math.round(ms / 1000)
      return seconds < 60
        ? t('time.shortSeconds', { n: seconds })
        : t('time.shortMinutes', { n: Math.round(seconds / 60) })
    }

    function formatDuration(ms, t) {
      const seconds = Math.max(0, Math.ceil(ms / 1000))
      if (seconds < 60) return t('time.seconds', { n: seconds })
      const minutes = Math.ceil(seconds / 60)
      if (minutes < 60) return t('time.minutes', { n: minutes })
      return t('time.hours', { n: Math.round(minutes / 6) / 10 })
    }

    // ---------------------------------------------------------------------
    // §4 Store: one module-level garden shared by every mount, persisted at
    //    most once every few seconds plus immediately after a user action.
    // ---------------------------------------------------------------------
    let garden = null
    const listeners = new Set()
    let saveTimer = null
    let lastSaveAt = 0

    function readStored() {
      try {
        const text = window.localStorage.getItem(STORAGE_KEY)
        if (text !== null) return JSON.parse(text)
        for (const key of LEGACY_KEYS) {
          const legacy = window.localStorage.getItem(key)
          if (legacy !== null) return JSON.parse(legacy)
        }
        return null
      } catch (error) {
        console.warn('[flower-garden] saved garden is unreadable; starting fresh', error)
        return null
      }
    }

    function persist() {
      if (saveTimer !== null) {
        window.clearTimeout(saveTimer)
        saveTimer = null
      }
      if (garden === null) return
      lastSaveAt = Date.now()
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(garden))
      } catch (error) {
        console.warn('[flower-garden] could not save the garden', error)
      }
    }

    function schedulePersist() {
      if (saveTimer !== null) return
      const wait = Math.max(0, 4000 - (Date.now() - lastSaveAt))
      saveTimer = window.setTimeout(() => {
        saveTimer = null
        persist()
      }, wait)
    }

    function initStore() {
      if (garden !== null) return garden
      garden = advanceState(sanitize(readStored(), Date.now()), Date.now())
      return garden
    }

    function getState() {
      return garden === null ? initStore() : garden
    }

    function commit(next, immediate) {
      if (next === null || next === garden) return
      garden = next
      for (const listener of listeners) listener()
      if (immediate) persist()
      else schedulePersist()
    }

    function subscribeGarden(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    }

    function tick() {
      commit(advanceState(getState(), Date.now()), false)
    }

    function flushPersist() {
      if (saveTimer !== null) persist()
    }

    const useSyncExternalStore = React.useSyncExternalStore
      ?? function fallbackStore(subscribe, snapshot) {
        const [value, setValue] = React.useState(snapshot)
        React.useEffect(() => subscribe(() => setValue(snapshot())), [subscribe, snapshot])
        return value
      }

    /** Captured plugin context and translator, set by `apply`. */
    let pluginCtx = null
    let boundT = key => key

    // ---------------------------------------------------------------------
    // §5 Artwork. Every head follows the real flower; `leaf` picks the foliage.
    // ---------------------------------------------------------------------
    const SVG_PROPS = { viewBox: '0 0 100 100', 'aria-hidden': 'true', focusable: 'false' }
    const HEAD_X = 50
    const HEAD_Y = 36
    const STEM_BASE = 88

    function soil() {
      return h('g', { key: 'soil' },
        h('ellipse', { cx: 50, cy: 89, rx: 21, ry: 5.5, fill: '#6f4a30' }),
        h('ellipse', { cx: 50, cy: 87, rx: 21, ry: 5, fill: '#8a5e3d' }),
      )
    }

    /** Asteraceae head: radiating ray florets around a disc of disc florets. */
    function headDaisy(pal) {
      const parts = []
      const tips = []
      for (let index = 0; index < 13; index += 1) {
        const angle = (360 / 13) * index - 90
        const rad = (angle * Math.PI) / 180
        const x = HEAD_X + 10 * Math.cos(rad)
        const y = HEAD_Y + 10 * Math.sin(rad)
        parts.push(h('ellipse', {
          key: `p${index}`, cx: x, cy: y, rx: 3.4, ry: 8.4,
          fill: pal.petal, stroke: pal.petalDeep, strokeWidth: 0.8,
          transform: `rotate(${angle + 90} ${x} ${y})`,
        }))
        tips.push(h('circle', {
          key: `t${index}`,
          cx: HEAD_X + 16.6 * Math.cos(rad),
          cy: HEAD_Y + 16.6 * Math.sin(rad),
          r: 1.5,
          fill: '#f0aec0',
          opacity: 0.5,
        }))
      }
      return [...parts, ...tips,
        h('circle', { key: 'disc', cx: HEAD_X, cy: HEAD_Y, r: 6.2, fill: pal.center, stroke: pal.centerDeep, strokeWidth: 1 }),
        h('circle', { key: 'discIn', cx: HEAD_X, cy: HEAD_Y, r: 3.4, fill: pal.centerDeep, opacity: 0.35 }),
      ]
    }

    function headDandelion(pal) {
      const rays = []
      for (let index = 0; index < 16; index += 1) {
        const angle = (360 / 16) * index
        const rad = (angle * Math.PI) / 180
        const x = HEAD_X + 5.5 * Math.cos(rad)
        const y = HEAD_Y + 5.5 * Math.sin(rad)
        rays.push(h('ellipse', {
          key: `r${index}`, cx: x, cy: y, rx: 1.5, ry: 7,
          fill: pal.petal, stroke: pal.petalDeep, strokeWidth: 0.5,
          transform: `rotate(${angle + 90} ${x} ${y})`,
        }))
      }
      return [...rays,
        h('circle', { key: 'core', cx: HEAD_X, cy: HEAD_Y, r: 4.6, fill: pal.center, stroke: pal.centerDeep, strokeWidth: 0.9 }),
      ]
    }

    function headSunflower(pal) {
      const rays = []
      for (let index = 0; index < 18; index += 1) {
        const angle = (360 / 18) * index
        const rad = (angle * Math.PI) / 180
        const x = HEAD_X + 12 * Math.cos(rad)
        const y = HEAD_Y + 12 * Math.sin(rad)
        rays.push(h('ellipse', {
          key: `ray${index}`, cx: x, cy: y, rx: 3, ry: 8.2,
          fill: pal.petal, stroke: pal.petalDeep, strokeWidth: 0.7,
          transform: `rotate(${angle + 90} ${x} ${y})`,
        }))
      }
      const seeds = []
      for (let ring = 0; ring < 3; ring += 1) {
        const radius = 2.4 + ring * 2.6
        const count = 5 + ring * 3
        for (let index = 0; index < count; index += 1) {
          const angle = (360 / count) * index + ring * 14
          seeds.push(h('circle', {
            key: `s${ring}-${index}`,
            cx: HEAD_X + radius * Math.cos((angle * Math.PI) / 180),
            cy: HEAD_Y + radius * Math.sin((angle * Math.PI) / 180),
            r: 0.95,
            fill: '#a9743f',
            opacity: 0.85,
          }))
        }
      }
      return [...rays,
        h('circle', { key: 'disc', cx: HEAD_X, cy: HEAD_Y, r: 8.6, fill: pal.center, stroke: pal.centerDeep, strokeWidth: 1.2 }),
        ...seeds,
      ]
    }

    /** Tulip: a cup of three visible tepals with the darker basal blotch. */
    function headTulip(pal) {
      return [
        h('path', {
          key: 'cup',
          d: `M${HEAD_X - 9},${HEAD_Y + 8} C${HEAD_X - 10.5},${HEAD_Y - 4} ${HEAD_X - 7},${HEAD_Y - 13} ${HEAD_X - 4},${HEAD_Y - 16}`
            + ` C${HEAD_X - 2},${HEAD_Y - 10} ${HEAD_X - 1},${HEAD_Y - 4} ${HEAD_X},${HEAD_Y - 2}`
            + ` C${HEAD_X + 1},${HEAD_Y - 4} ${HEAD_X + 2},${HEAD_Y - 10} ${HEAD_X + 4},${HEAD_Y - 16}`
            + ` C${HEAD_X + 7},${HEAD_Y - 13} ${HEAD_X + 10.5},${HEAD_Y - 4} ${HEAD_X + 9},${HEAD_Y + 8}`
            + ` C${HEAD_X + 6},${HEAD_Y + 11} ${HEAD_X - 6},${HEAD_Y + 11} ${HEAD_X - 9},${HEAD_Y + 8} Z`,
          fill: pal.petal, stroke: pal.petalDeep, strokeWidth: 1.1,
        }),
        h('path', {
          key: 'blotch',
          d: `M${HEAD_X - 5},${HEAD_Y + 8} C${HEAD_X - 3},${HEAD_Y + 3} ${HEAD_X + 3},${HEAD_Y + 3} ${HEAD_X + 5},${HEAD_Y + 8}`
            + ` C${HEAD_X + 3},${HEAD_Y + 10} ${HEAD_X - 3},${HEAD_Y + 10} ${HEAD_X - 5},${HEAD_Y + 8} Z`,
          fill: pal.petalDeep, opacity: 0.55,
        }),
      ]
    }

    /** Cherry blossom: five notched petals and a fan of stamens. */
    function headCherry(pal) {
      const parts = []
      const petal = 'M0,3 C-4,1 -8,-5 -8,-9.5 C-8,-12 -6,-13.5 -4,-13 L0,-10.5 L4,-13 C6,-13.5 8,-12 8,-9.5 C8,-5 4,1 0,3 Z'
      for (let index = 0; index < 5; index += 1) {
        parts.push(h('path', {
          key: `p${index}`, d: petal, fill: pal.petal, stroke: pal.petalDeep, strokeWidth: 0.7,
          transform: `translate(${HEAD_X} ${HEAD_Y}) rotate(${index * 72})`,
        }))
      }
      for (let index = 0; index < 9; index += 1) {
        const rad = (((360 / 9) * index + 12) * Math.PI) / 180
        parts.push(h('line', {
          key: `st${index}`, x1: HEAD_X, y1: HEAD_Y,
          x2: HEAD_X + 6.5 * Math.cos(rad), y2: HEAD_Y + 6.5 * Math.sin(rad),
          stroke: pal.centerDeep, strokeWidth: 0.6,
        }))
        parts.push(h('circle', {
          key: `an${index}`, cx: HEAD_X + 7.4 * Math.cos(rad), cy: HEAD_Y + 7.4 * Math.sin(rad),
          r: 0.9, fill: pal.centerDeep,
        }))
      }
      parts.push(h('circle', { key: 'core', cx: HEAD_X, cy: HEAD_Y, r: 2.2, fill: pal.center }))
      return parts
    }

    /** Lavender-type spike: whorls of small florets packed along the stem top. */
    function headSpike(pal, opts) {
      const rows = opts?.rows ?? 6
      const wide = opts?.wide === true ? 1.5 : 1
      const parts = []
      for (let row = 0; row < rows; row += 1) {
        const y = HEAD_Y + 10 - row * 3.8
        const scale = 1 - row * 0.07
        const offset = (row % 2 === 0 ? 3.1 : -3.1) * wide
        parts.push(h('ellipse', {
          key: `l${row}`, cx: HEAD_X + offset, cy: y,
          rx: 2.7 * scale * wide, ry: 3.2 * scale,
          fill: row % 2 === 0 ? pal.petal : pal.petalDeep,
          stroke: pal.centerDeep, strokeWidth: 0.4,
        }))
        parts.push(h('ellipse', {
          key: `r${row}`, cx: HEAD_X - offset * 0.72, cy: y - 1.4,
          rx: 2.3 * scale * wide, ry: 2.9 * scale,
          fill: pal.center, stroke: pal.centerDeep, strokeWidth: 0.4,
        }))
      }
      parts.push(h('ellipse', {
        key: 'tip', cx: HEAD_X, cy: HEAD_Y + 11.6, rx: 2.1 * wide, ry: 2.6,
        fill: pal.petal, stroke: pal.centerDeep, strokeWidth: 0.4,
      }))
      return parts
    }

    /** Corn poppy: four broad, slightly translucent petals over a dark centre. */
    function headPoppy(pal) {
      const parts = []
      for (let index = 0; index < 4; index += 1) {
        const angle = index * 90 + 45
        parts.push(h('ellipse', {
          key: `p${index}`, cx: HEAD_X, cy: HEAD_Y, rx: 9.4, ry: 8.4,
          fill: pal.petal, opacity: 0.93, stroke: pal.petalDeep, strokeWidth: 0.6,
          transform: `rotate(${angle} ${HEAD_X} ${HEAD_Y}) translate(0 -4.2)`,
        }))
        parts.push(h('circle', {
          key: `b${index}`, cx: HEAD_X, cy: HEAD_Y - 2.6, r: 2.2,
          fill: pal.centerDeep, opacity: 0.35,
          transform: `rotate(${angle} ${HEAD_X} ${HEAD_Y})`,
        }))
      }
      parts.push(h('circle', { key: 'core', cx: HEAD_X, cy: HEAD_Y, r: 2.9, fill: pal.center }))
      for (let index = 0; index < 10; index += 1) {
        const rad = (((360 / 10) * index) * Math.PI) / 180
        parts.push(h('circle', {
          key: `d${index}`, cx: HEAD_X + 4.1 * Math.cos(rad), cy: HEAD_Y + 4.1 * Math.sin(rad),
          r: 0.8, fill: pal.center, opacity: 0.9,
        }))
      }
      return parts
    }

    /** Lily: six pointed tepals in a star, with the long stamens showing. */
    function headLily(pal) {
      const parts = []
      const shape = 'M0,-14 C3.4,-9 4.8,-3 0,3.2 C-4.8,-3 -3.4,-9 0,-14 Z'
      for (let index = 0; index < 3; index += 1) {
        parts.push(h('path', {
          key: `outer${index}`, d: shape, fill: pal.petal, stroke: pal.petalDeep, strokeWidth: 0.7, opacity: 0.85,
          transform: `translate(${HEAD_X} ${HEAD_Y}) rotate(${index * 120 + 60}) scale(1.06)`,
        }))
      }
      for (let index = 0; index < 3; index += 1) {
        parts.push(h('path', {
          key: `inner${index}`, d: shape, fill: pal.petal, stroke: pal.petalDeep, strokeWidth: 0.7,
          transform: `translate(${HEAD_X} ${HEAD_Y}) rotate(${index * 120})`,
        }))
      }
      for (let index = 0; index < 6; index += 1) {
        const rad = (((360 / 6) * index) * Math.PI) / 180
        parts.push(h('line', {
          key: `st${index}`,
          x1: HEAD_X + 1.2 * Math.cos(rad), y1: HEAD_Y + 1.2 * Math.sin(rad),
          x2: HEAD_X + 6.4 * Math.cos(rad), y2: HEAD_Y + 6.4 * Math.sin(rad),
          stroke: pal.center, strokeWidth: 0.8,
        }))
        parts.push(h('ellipse', {
          key: `an${index}`, cx: HEAD_X + 6.9 * Math.cos(rad), cy: HEAD_Y + 6.9 * Math.sin(rad),
          rx: 1.1, ry: 0.7, fill: pal.centerDeep,
        }))
      }
      parts.push(h('circle', { key: 'core', cx: HEAD_X, cy: HEAD_Y, r: 1.3, fill: pal.center }))
      return parts
    }

    /** Rose: overlapping petals in shrinking rings around a rolled centre. */
    function headRose(pal) {
      const parts = []
      const rings = [
        { count: 6, ring: 7.2, rx: 7.4, ry: 9, fill: pal.petal, stroke: pal.petalDeep },
        { count: 5, ring: 4.6, rx: 5.8, ry: 7, fill: pal.petal, stroke: pal.petalDeep },
        { count: 4, ring: 2.4, rx: 4.2, ry: 5, fill: pal.petalDeep, stroke: pal.center },
      ]
      for (let layer = 0; layer < rings.length; layer += 1) {
        const spec = rings[layer]
        for (let index = 0; index < spec.count; index += 1) {
          const angle = (360 / spec.count) * index + layer * 26
          const rad = (angle * Math.PI) / 180
          const x = HEAD_X + spec.ring * Math.cos(rad)
          const y = HEAD_Y + spec.ring * Math.sin(rad)
          parts.push(h('ellipse', {
            key: `p${layer}-${index}`, cx: x, cy: y, rx: spec.rx, ry: spec.ry,
            fill: spec.fill, stroke: spec.stroke, strokeWidth: 0.7,
            transform: `rotate(${angle + 90} ${x} ${y})`,
          }))
        }
      }
      parts.push(h('path', {
        key: 'heart',
        d: `M${HEAD_X - 2.4},${HEAD_Y + 1.6} C${HEAD_X - 3.4},${HEAD_Y - 1.4} ${HEAD_X - 1},${HEAD_Y - 3} ${HEAD_X},${HEAD_Y - 1.4}`
          + ` C${HEAD_X + 1},${HEAD_Y - 3} ${HEAD_X + 3.4},${HEAD_Y - 1.4} ${HEAD_X + 2.4},${HEAD_Y + 1.6}`
          + ` C${HEAD_X + 1.4},${HEAD_Y + 3} ${HEAD_X - 1.4},${HEAD_Y + 3} ${HEAD_X - 2.4},${HEAD_Y + 1.6} Z`,
        fill: pal.center, opacity: 0.9,
      }))
      return parts
    }

    /** Hydrangea mophead: a rounded cluster of four-sepal showy florets. */
    function headMophead(pal) {
      const parts = []
      const spots = []
      for (let ring = 0; ring < 3; ring += 1) {
        const radius = ring === 0 ? 0 : ring * 5.4
        const count = ring === 0 ? 1 : ring === 1 ? 5 : 8
        for (let index = 0; index < count; index += 1) {
          const angle = (360 / count) * index + ring * 20
          spots.push({
            x: HEAD_X + radius * Math.cos((angle * Math.PI) / 180),
            y: HEAD_Y + radius * Math.sin((angle * Math.PI) / 180),
            scale: ring === 0 ? 1.05 : ring === 1 ? 0.98 : 0.86,
          })
        }
      }
      for (const [spotIndex, spot] of spots.entries()) {
        for (let petal = 0; petal < 4; petal += 1) {
          const rad = ((petal * 90 + 45) * Math.PI) / 180
          const cx = spot.x + 2.4 * spot.scale * Math.cos(rad)
          const cy = spot.y + 2.4 * spot.scale * Math.sin(rad)
          parts.push(h('ellipse', {
            key: `f${spotIndex}-${petal}`, cx, cy,
            rx: 2.1 * spot.scale, ry: 2.7 * spot.scale,
            fill: petal % 2 === 0 ? pal.petal : pal.center,
            stroke: pal.petalDeep, strokeWidth: 0.4,
            transform: `rotate(${petal * 90} ${cx} ${cy})`,
          }))
        }
        parts.push(h('circle', {
          key: `fc${spotIndex}`, cx: spot.x, cy: spot.y, r: 0.9 * spot.scale, fill: pal.centerDeep,
        }))
      }
      return parts
    }

    /** Snowdrop: three drooping white tepals with the green inner mark. */
    function headDroop(pal) {
      const top = HEAD_Y + 2
      return [
        h('path', {
          key: 'outer',
          d: `M${HEAD_X},${top - 12} C${HEAD_X + 7},${top - 8} ${HEAD_X + 8},${top + 4} ${HEAD_X + 3},${top + 9}`
            + ` C${HEAD_X},${top + 11} ${HEAD_X - 3},${top + 11} ${HEAD_X - 6},${top + 8}`
            + ` C${HEAD_X - 11},${top + 3} ${HEAD_X - 7},${top - 9} ${HEAD_X},${top - 12} Z`,
          fill: pal.petal, stroke: pal.petalDeep, strokeWidth: 0.9,
        }),
        h('path', {
          key: 'inner',
          d: `M${HEAD_X - 1},${top - 3} C${HEAD_X + 3},${top} ${HEAD_X + 3},${top + 5} ${HEAD_X},${top + 7}`
            + ` C${HEAD_X - 3},${top + 5} ${HEAD_X - 3},${top} ${HEAD_X - 1},${top - 3} Z`,
          fill: pal.center, opacity: 0.9,
        }),
        h('path', {
          key: 'cap',
          d: `M${HEAD_X - 2},${top - 13} q2 -3 4 0`,
          fill: 'none', stroke: pal.centerDeep, strokeWidth: 1.2, strokeLinecap: 'round',
        }),
      ]
    }

    /** Five round petals (plum, hellebore, plumeria) with a ring of stamens. */
    function headBloom5(pal, opts) {
      const radius = opts?.radius ?? 8
      const width = opts?.width ?? 6.4
      const parts = []
      for (let index = 0; index < 5; index += 1) {
        const angle = index * 72 + (opts?.spin ?? 0)
        const rad = (angle * Math.PI) / 180
        const x = HEAD_X + radius * 0.55 * Math.cos(rad)
        const y = HEAD_Y + radius * 0.55 * Math.sin(rad)
        parts.push(h('ellipse', {
          key: `p${index}`, cx: x, cy: y, rx: width * 0.62, ry: width,
          fill: pal.petal, stroke: pal.petalDeep, strokeWidth: 0.7,
          transform: `rotate(${angle + 90} ${x} ${y})`,
        }))
      }
      for (let index = 0; index < 8; index += 1) {
        const rad = (((360 / 8) * index + 10) * Math.PI) / 180
        parts.push(h('line', {
          key: `st${index}`,
          x1: HEAD_X, y1: HEAD_Y,
          x2: HEAD_X + 5.4 * Math.cos(rad), y2: HEAD_Y + 5.4 * Math.sin(rad),
          stroke: pal.centerDeep, strokeWidth: 0.6,
        }))
        parts.push(h('circle', {
          key: `an${index}`, cx: HEAD_X + 5.9 * Math.cos(rad), cy: HEAD_Y + 5.9 * Math.sin(rad),
          r: 0.85, fill: pal.center,
        }))
      }
      parts.push(h('circle', { key: 'core', cx: HEAD_X, cy: HEAD_Y, r: 2, fill: pal.center }))
      return parts
    }

    /** Edelweiss: a felted star of narrow bracts around a cluster of discs. */
    function headStar(pal) {
      const parts = [h('circle', { key: 'felt', cx: HEAD_X, cy: HEAD_Y, r: 9.5, fill: pal.petalDeep, opacity: 0.45 })]
      for (let index = 0; index < 10; index += 1) {
        const angle = (360 / 10) * index
        const rad = (angle * Math.PI) / 180
        const x = HEAD_X + 8 * Math.cos(rad)
        const y = HEAD_Y + 8 * Math.sin(rad)
        parts.push(h('ellipse', {
          key: `b${index}`, cx: x, cy: y, rx: 2.6, ry: 7.4,
          fill: pal.petal, stroke: pal.petalDeep, strokeWidth: 0.6,
          transform: `rotate(${angle + 90} ${x} ${y})`,
        }))
      }
      for (let index = 0; index < 5; index += 1) {
        const rad = (((360 / 5) * index + 18) * Math.PI) / 180
        parts.push(h('circle', {
          key: `d${index}`, cx: HEAD_X + 3.2 * Math.cos(rad), cy: HEAD_Y + 3.2 * Math.sin(rad),
          r: 1.9, fill: pal.center, stroke: pal.centerDeep, strokeWidth: 0.4,
        }))
      }
      return parts
    }

    /** Cup-shaped cactus flower: many narrow petals fanning out of a tube. */
    function headCup(pal) {
      const parts = []
      for (let index = 0; index < 12; index += 1) {
        const angle = -150 + index * 27
        const rad = (angle * Math.PI) / 180
        const x = HEAD_X + 4 * Math.cos(rad)
        const y = HEAD_Y + 6 + 4 * Math.sin(rad)
        parts.push(h('ellipse', {
          key: `p${index}`, cx: x, cy: y, rx: 2.4, ry: 7.6,
          fill: index % 3 === 0 ? pal.petalDeep : pal.petal,
          stroke: pal.petalDeep, strokeWidth: 0.5,
          transform: `rotate(${angle + 90} ${x} ${y})`,
        }))
      }
      parts.push(h('circle', { key: 'throat', cx: HEAD_X, cy: HEAD_Y + 8, r: 3.4, fill: pal.center, stroke: pal.centerDeep, strokeWidth: 0.6 }))
      for (let index = 0; index < 6; index += 1) {
        const rad = (((360 / 6) * index) * Math.PI) / 180
        parts.push(h('circle', {
          key: `s${index}`, cx: HEAD_X + 1.9 * Math.cos(rad), cy: HEAD_Y + 8 + 1.9 * Math.sin(rad),
          r: 0.7, fill: pal.centerDeep,
        }))
      }
      return parts
    }

    /** ʻŌhiʻa lehua: a pompom of long stamens around a small core. */
    function headPompom(pal) {
      const parts = [h('circle', { key: 'base', cx: HEAD_X, cy: HEAD_Y, r: 4.4, fill: pal.centerDeep })]
      for (let index = 0; index < 26; index += 1) {
        const angle = (360 / 26) * index + (index % 2 === 0 ? 0 : 7)
        const rad = (angle * Math.PI) / 180
        const length = index % 3 === 0 ? 11 : 9.2
        parts.push(h('line', {
          key: `f${index}`,
          x1: HEAD_X, y1: HEAD_Y,
          x2: HEAD_X + length * Math.cos(rad), y2: HEAD_Y + length * Math.sin(rad),
          stroke: index % 4 === 0 ? pal.petal : pal.petalDeep,
          strokeWidth: 1.9,
          strokeLinecap: 'round',
        }))
        parts.push(h('circle', {
          key: `a${index}`,
          cx: HEAD_X + length * Math.cos(rad), cy: HEAD_Y + length * Math.sin(rad),
          r: 1.15, fill: pal.center,
        }))
      }
      return parts
    }

    /** Iris: three upright standards over three drooping falls. */
    function headIris(pal) {
      const parts = []
      for (let index = 0; index < 3; index += 1) {
        const angle = index * 120
        parts.push(h('path', {
          key: `fall${index}`,
          d: `M0,1 C-6,4 -9,10 -6,14 C-2,15 1,10 0,4 Z`,
          fill: pal.petalDeep, stroke: pal.centerDeep, strokeWidth: 0.5, opacity: 0.95,
          transform: `translate(${HEAD_X} ${HEAD_Y}) rotate(${angle + 60})`,
        }))
      }
      for (let index = 0; index < 3; index += 1) {
        const angle = index * 120
        parts.push(h('path', {
          key: `std${index}`,
          d: `M0,2 C-5,-3 -5,-11 0,-14 C5,-11 5,-3 0,2 Z`,
          fill: pal.petal, stroke: pal.petalDeep, strokeWidth: 0.6,
          transform: `translate(${HEAD_X} ${HEAD_Y}) rotate(${angle})`,
        }))
      }
      parts.push(h('circle', { key: 'core', cx: HEAD_X, cy: HEAD_Y, r: 2.4, fill: pal.center, stroke: pal.centerDeep, strokeWidth: 0.5 }))
      for (let index = 0; index < 5; index += 1) {
        const rad = (((360 / 5) * index + 20) * Math.PI) / 180
        parts.push(h('circle', {
          key: `dot${index}`, cx: HEAD_X + 3.6 * Math.cos(rad), cy: HEAD_Y + 3.6 * Math.sin(rad),
          r: 0.75, fill: pal.centerDeep,
        }))
      }
      return parts
    }

    /** Water lily: a flat star of pointed petals on a lily pad. */
    function headWaterlily(pal) {
      const parts = [h('ellipse', { key: 'pad', cx: HEAD_X, cy: HEAD_Y + 12, rx: 22, ry: 7, fill: pal.leaf, opacity: 0.85 })]
      for (let index = 0; index < 12; index += 1) {
        const angle = (360 / 12) * index
        const rad = (angle * Math.PI) / 180
        const x = HEAD_X + 6.5 * Math.cos(rad)
        const y = HEAD_Y + 1.5 * Math.sin(rad) + 6
        parts.push(h('ellipse', {
          key: `p${index}`, cx: x, cy: y, rx: 2.8, ry: 7.4,
          fill: index % 2 === 0 ? pal.petal : pal.petalDeep,
          stroke: pal.petalDeep, strokeWidth: 0.4,
          transform: `rotate(${angle + 90} ${x} ${y})`,
        }))
      }
      parts.push(h('circle', { key: 'core', cx: HEAD_X, cy: HEAD_Y + 6, r: 3.2, fill: pal.center, stroke: pal.centerDeep, strokeWidth: 0.6 }))
      return parts
    }

    /** Lotus: layered pointed petals opening around a seed pod. */
    function headLotus(pal) {
      const parts = []
      const shape = 'M0,-13 C4,-8 5,-2 0,3 C-5,-2 -4,-8 0,-13 Z'
      for (let layer = 0; layer < 3; layer += 1) {
        const count = layer === 0 ? 8 : layer === 1 ? 6 : 4
        const scale = 1 - layer * 0.22
        for (let index = 0; index < count; index += 1) {
          parts.push(h('path', {
            key: `p${layer}-${index}`, d: shape,
            fill: layer === 0 ? pal.petalDeep : pal.petal,
            stroke: pal.petalDeep, strokeWidth: 0.5,
            opacity: layer === 0 ? 0.95 : 1,
            transform: `translate(${HEAD_X} ${HEAD_Y}) rotate(${(360 / count) * index + layer * 18}) scale(${scale})`,
          }))
        }
      }
      parts.push(h('circle', { key: 'pod', cx: HEAD_X, cy: HEAD_Y, r: 2.6, fill: pal.center, stroke: pal.centerDeep, strokeWidth: 0.6 }))
      for (let index = 0; index < 5; index += 1) {
        const rad = (((360 / 5) * index) * Math.PI) / 180
        parts.push(h('circle', {
          key: `dot${index}`, cx: HEAD_X + 1.3 * Math.cos(rad), cy: HEAD_Y + 1.3 * Math.sin(rad),
          r: 0.55, fill: pal.centerDeep,
        }))
      }
      return parts
    }

    const HEADS = {
      daisy: headDaisy,
      dandelion: headDandelion,
      sunflower: headSunflower,
      tulip: headTulip,
      cherry: headCherry,
      spike: headSpike,
      poppy: headPoppy,
      lily: headLily,
      rose: headRose,
      mophead: headMophead,
      droop: headDroop,
      bloom5: headBloom5,
      star: headStar,
      cup: headCup,
      pompom: headPompom,
      iris: headIris,
      waterlily: headWaterlily,
      lotus: headLotus,
    }

    /** Foliage shapes: strap, narrow, broad, lobed, rosette (agave), pad (cactus, water lily). */
    function foliage(kind, pal, stemTop) {
      const y = stemTop + 6
      switch (kind) {
        case 'strap':
          return h('g', { key: 'leaf' },
            h('path', { d: `M50 ${y + 26} C40 ${y + 22} 34 ${y + 8} 36 ${y - 6} C42 ${y + 2} 48 ${y + 14} 50 ${y + 26} Z`, fill: pal.leaf }),
            h('path', { d: `M50 ${y + 30} C60 ${y + 26} 66 ${y + 12} 64 ${y - 2} C58 ${y + 6} 52 ${y + 18} 50 ${y + 30} Z`, fill: pal.stem }),
          )
        case 'narrow':
          return h('g', { key: 'leaf' },
            h('path', { d: `M50 ${y + 20} C44 ${y + 12} 43 ${y - 2} 46 ${y - 10} C49 ${y - 2} 50 ${y + 8} 50 ${y + 20} Z`, fill: pal.leaf }),
            h('path', { d: `M50 ${y + 24} C56 ${y + 16} 57 ${y + 2} 54 ${y - 6} C51 ${y + 2} 50 ${y + 12} 50 ${y + 24} Z`, fill: pal.stem }),
          )
        case 'broad':
          return h('g', { key: 'leaf' },
            h('path', { d: `M50 ${y + 18} C38 ${y + 18} 30 ${y + 8} 31 ${y - 4} C40 ${y - 8} 48 ${y + 2} 50 ${y + 18} Z`, fill: pal.leaf }),
            h('path', { d: `M50 ${y + 24} C62 ${y + 24} 70 ${y + 14} 69 ${y + 2} C60 ${y - 2} 52 ${y + 8} 50 ${y + 24} Z`, fill: pal.stem }),
          )
        case 'lobed':
          return h('g', { key: 'leaf' },
            h('path', {
              d: `M50 ${y + 16} C42 ${y + 18} 36 ${y + 12} 34 ${y + 4} C31 ${y + 6} 29 ${y + 2} 28 ${y - 2}`
                + ` C34 ${y - 6} 40 ${y - 2} 43 ${y - 2} C42 ${y - 8} 45 ${y - 12} 49 ${y - 13}`
                + ` C49 ${y - 6} 50 ${y + 4} 50 ${y + 16} Z`,
              fill: pal.leaf,
            }),
            h('path', {
              d: `M50 ${y + 22} C58 ${y + 24} 64 ${y + 18} 66 ${y + 10} C69 ${y + 12} 71 ${y + 8} 72 ${y + 4}`
                + ` C66 ${y} 60 ${y + 4} 57 ${y + 4} C58 ${y - 2} 55 ${y - 6} 51 ${y - 7}`
                + ` C51 ${y} 50 ${y + 10} 50 ${y + 22} Z`,
              fill: pal.stem,
            }),
          )
        case 'rosette':
          return h('g', { key: 'leaf' },
            h('path', { d: `M50 ${y + 16} C40 ${y + 20} 30 ${y + 16} 26 ${y + 6} C34 ${y + 2} 44 ${y + 6} 50 ${y + 16} Z`, fill: pal.leaf }),
            h('path', { d: `M50 ${y + 16} C60 ${y + 20} 70 ${y + 16} 74 ${y + 6} C66 ${y + 2} 56 ${y + 6} 50 ${y + 16} Z`, fill: pal.stem }),
            h('path', { d: `M50 ${y + 14} C45 ${y + 6} 44 ${y - 6} 47 ${y - 14} C50 ${y - 6} 52 ${y + 2} 50 ${y + 14} Z`, fill: pal.leaf, opacity: 0.9 }),
          )
        case 'pad':
          return h('g', { key: 'leaf' },
            h('ellipse', { cx: 50, cy: y + 14, rx: 20, ry: 7, fill: pal.leaf }),
            h('path', { d: `M50 ${y + 14} L62 ${y + 10}`, stroke: pal.stem, strokeWidth: 1.2, opacity: 0.6 }),
            h('ellipse', { cx: 50, cy: y + 6, rx: 11, ry: 5, fill: pal.leaf, opacity: 0.75 }),
          )
        default:
          return h('g', { key: 'leaf' },
            h('path', { d: `M50 ${y + 14} C42 ${y + 14} 36 ${y + 6} 36 ${y - 1} C44 ${y - 4} 49 ${y + 4} 50 ${y + 14} Z`, fill: pal.leaf }),
            h('path', { d: `M50 ${y + 20} C58 ${y + 20} 64 ${y + 12} 64 ${y + 5} C56 ${y + 2} 51 ${y + 10} 50 ${y + 20} Z`, fill: pal.stem }),
          )
      }
    }

    function FlowerArt({ speciesId, stage, variant }) {
      const species = SPECIES_BY_ID.get(speciesId) ?? SPECIES[0]
      const hidden = (variant ?? 'base') === 'hidden'
      const flat = paletteOf(species, variant ?? 'base')
      // The hidden bloom paints its petals with a pearl-to-petal gradient.
      const pal = hidden ? { ...flat, petal: `url(#fg-hid-${species.id}-petal)` } : flat
      const parts = []
      if (hidden) {
        parts.push(hiddenDefs(species.id))
        parts.push(...hiddenAura(species.id))
      }
      parts.push(soil())
      if (stage === 'seed') {
        parts.push(h('ellipse', { key: 'seed', cx: 50, cy: 85.5, rx: 4, ry: 3.2, fill: '#4a3423' }))
        parts.push(h('path', {
          key: 'crack', d: 'M50 82.5c2.6.4 4.4-.8 4.8-2.6', fill: 'none', stroke: pal.leaf, strokeWidth: 1.6, strokeLinecap: 'round',
        }))
      } else if (stage === 'sprout') {
        parts.push(h('path', { key: 'stem', d: `M50 ${STEM_BASE}V${STEM_BASE - 22}`, fill: 'none', stroke: pal.stem, strokeWidth: 3, strokeLinecap: 'round' }))
        parts.push(foliage(species.leaf === 'pad' ? 'round' : species.leaf, pal, STEM_BASE - 22))
      } else if (stage === 'bud') {
        parts.push(h('path', { key: 'stem', d: `M50 ${STEM_BASE}V${HEAD_Y + 20}`, fill: 'none', stroke: pal.stem, strokeWidth: 3.4, strokeLinecap: 'round' }))
        parts.push(foliage(species.leaf === 'pad' ? 'round' : species.leaf, pal, HEAD_Y + 20))
        parts.push(h('ellipse', { key: 'bud', cx: HEAD_X, cy: HEAD_Y + 12, rx: 6, ry: 9.5, fill: pal.petal, stroke: pal.petalDeep, strokeWidth: 1.2 }))
        parts.push(h('path', { key: 'sepal', d: `M${HEAD_X} ${HEAD_Y + 21}l-7 7 7-3 7 3z`, fill: pal.leaf }))
      } else {
        const shortHead = species.head === 'waterlily'
        parts.push(h('path', {
          key: 'stem',
          d: `M50 ${STEM_BASE}V${HEAD_Y + (species.head === 'spike' ? 12 : shortHead ? 16 : 8)}`,
          fill: 'none',
          stroke: pal.stem,
          strokeWidth: species.head === 'tulip' ? 3.8 : 3.4,
          strokeLinecap: 'round',
        }))
        parts.push(foliage(species.leaf, pal, HEAD_Y + 14))
        parts.push(h('g', { key: 'head' }, HEADS[species.head](pal, species.headOpts)))
      }
      if (hidden && stage === 'bloom') parts.push(...hiddenLights())
      return h('svg', SVG_PROPS, h('g', { className: stage === 'seed' ? undefined : 'fg-plant' }, parts))
    }

    /** Gradient ids in one drawing are unique per species; identical copies across cards are harmless. */
    function hiddenDefs(speciesId) {
      const key = `fg-hid-${speciesId}`
      return h('defs', { key: 'defs' },
        h('linearGradient', { id: `${key}-petal`, x1: '0', y1: '0', x2: '0.35', y2: '1' },
          h('stop', { offset: '0%', stopColor: HIDDEN_GOLD.light }),
          h('stop', { offset: '55%', stopColor: HIDDEN_PAL.petal }),
          h('stop', { offset: '100%', stopColor: HIDDEN_GOLD.tip }),
        ),
        h('radialGradient', { id: `${key}-aura` },
          h('stop', { offset: '0%', stopColor: HIDDEN_GOLD.aura, stopOpacity: '0.9' }),
          h('stop', { offset: '52%', stopColor: HIDDEN_GOLD.auraEdge, stopOpacity: '0.34' }),
          h('stop', { offset: '100%', stopColor: HIDDEN_GOLD.auraEdge, stopOpacity: '0' }),
        ),
      )
    }

    function hiddenAura(speciesId) {
      const key = `fg-hid-${speciesId}`
      return [
        h('circle', { key: 'aura', cx: HEAD_X, cy: HEAD_Y, r: 30, fill: `url(#${key}-aura)` }),
        h('circle', {
          key: 'ring', cx: HEAD_X, cy: HEAD_Y, r: 18.5,
          fill: 'none', stroke: HIDDEN_GOLD.spark, strokeWidth: 0.8,
          strokeDasharray: '3 5', opacity: 0.75, className: 'fg-haloRing',
        }),
      ]
    }

    /** Four-point stars around the bloom, plus a few motes drifting upward. */
    function hiddenLights() {
      const stars = [[25, 17, 3.4], [75, 21, 2.8], [71, 53, 3.2], [29, 52, 2.3], [50, 8, 2.6]]
      const parts = stars.map(([x, y, r], index) => h('path', {
        key: `star${index}`,
        className: 'fg-sparkle',
        d: `M${x},${y - r} L${x + r * 0.26},${y - r * 0.26} L${x + r},${y} L${x + r * 0.26},${y + r * 0.26}`
          + ` L${x},${y + r} L${x - r * 0.26},${y + r * 0.26} L${x - r},${y} L${x - r * 0.26},${y - r * 0.26} Z`,
        fill: HIDDEN_GOLD.spark,
        style: { animationDelay: `${index * 0.42}s` },
      }))
      const motes = [[38, 62, 1.5], [61, 66, 1.2], [47, 72, 1.0]]
      for (const [index, [x, y, r]] of motes.entries()) {
        parts.push(h('circle', {
          key: `mote${index}`,
          className: 'fg-mote',
          cx: x, cy: y, r,
          fill: HIDDEN_GOLD.light,
          style: { animationDelay: `${0.6 + index * 0.9}s` },
        }))
      }
      return parts
    }

    function EmptyArt() {
      return h('svg', SVG_PROPS,
        h('rect', {
          x: 28, y: 28, width: 44, height: 48, rx: 12,
          style: { fill: 'none', stroke: 'var(--dsw-alias-border-l2)', strokeWidth: 2, strokeDasharray: '6 5' },
        }),
        h('path', {
          d: 'M50 42v20M40 52h20',
          style: { fill: 'none', stroke: 'var(--dsw-alias-label-secondary)', strokeWidth: 2.4, strokeLinecap: 'round' },
        }),
      )
    }

    function LockArt() {
      return h('svg', SVG_PROPS,
        h('rect', {
          x: 33, y: 48, width: 34, height: 26, rx: 7,
          style: { fill: 'none', stroke: 'var(--dsw-alias-border-l2)', strokeWidth: 2.4 },
        }),
        h('path', {
          d: 'M41 48v-7a9 9 0 0 1 18 0v7',
          style: { fill: 'none', stroke: 'var(--dsw-alias-border-l2)', strokeWidth: 2.4, strokeLinecap: 'round' },
        }),
        h('circle', { cx: 50, cy: 60, r: 3.2, style: { fill: 'var(--dsw-alias-label-secondary)' } }),
      )
    }

    function CoinGlyph() {
      return h('svg', { viewBox: '0 0 12 12', width: 12, height: 12, 'aria-hidden': 'true', focusable: 'false' },
        h('circle', { cx: 6, cy: 6, r: 5, fill: '#f2b53a' }),
        h('circle', { cx: 6, cy: 6, r: 3.1, fill: 'none', stroke: '#c98a14', strokeWidth: 1 }),
      )
    }

    function WeatherGlyph({ kind }) {
      const sun = h('circle', { key: 'sun', cx: 8, cy: 8, r: 3.4, fill: '#f2b53a' })
      const rays = [0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
        const rad = (angle * Math.PI) / 180
        return h('line', {
          key: angle,
          x1: 8 + 5 * Math.cos(rad), y1: 8 + 5 * Math.sin(rad),
          x2: 8 + 6.6 * Math.cos(rad), y2: 8 + 6.6 * Math.sin(rad),
          stroke: '#f2b53a', strokeWidth: 1.1, strokeLinecap: 'round',
        })
      })
      const cloud = h('path', {
        key: 'cloud',
        d: 'M4 11.5h8.2a2.3 2.3 0 0 0 0-4.6 3.1 3.1 0 0 0-5.9-.8A2.7 2.7 0 0 0 4 11.5Z',
        fill: kind === 'rain' ? '#8a9bb5' : '#9aa7b8',
      })
      const drops = [-4, 0, 4].map(dx => h('line', {
        key: dx, x1: 8 + dx, y1: 12.4, x2: 7.2 + dx, y2: 14.4,
        stroke: '#5b9bd5', strokeWidth: 1.1, strokeLinecap: 'round',
      }))
      return h('svg', { viewBox: '0 0 16 16', width: 13, height: 13, 'aria-hidden': 'true', focusable: 'false' },
        kind === 'clear' ? [sun, ...rays] : kind === 'rain' ? [cloud, ...drops] : [cloud],
      )
    }

    function ItemIcon({ id }) {
      const common = { viewBox: '0 0 24 24', width: 20, height: 20, 'aria-hidden': 'true', focusable: 'false' }
      if (id === 'fertilizer') {
        return h('svg', common,
          h('path', { d: 'M7 8h10l-1.4 10.3a2 2 0 0 1-2 1.7h-3.2a2 2 0 0 1-2-1.7Z', fill: '#c9a227' }),
          h('path', { d: 'M8.6 8c0-2.3 1.6-4.2 3.4-4.2S15.4 5.7 15.4 8', fill: 'none', stroke: '#8a6a1a', strokeWidth: 1.5 }),
          h('path', { d: 'M10 12.6h4M10 15.8h4', stroke: '#6b520e', strokeWidth: 1.3, strokeLinecap: 'round' }),
        )
      }
      if (id === 'sprinkler') {
        return h('svg', common,
          h('path', { d: 'M12 4.4c2.7 3.1 4.1 5.2 4.1 7.2a4.1 4.1 0 0 1-8.2 0c0-2 1.4-4.1 4.1-7.2Z', fill: '#7fb2e8' }),
          h('path', { d: 'M3.6 15.6h3.2M17.2 15.6h3.2M12 19.2v2', stroke: '#7fb2e8', strokeWidth: 1.5, strokeLinecap: 'round' }),
        )
      }
      if (id === 'charm') {
        return h('svg', common,
          h('circle', { cx: 12, cy: 12, r: 8.3, fill: 'none', stroke: '#e0b83c', strokeWidth: 1.5 }),
          h('path', { d: 'M12 6.4l1.5 3.7 3.9.4-2.9 2.6.8 3.8-3.3-2-3.3 2 .8-3.8-2.9-2.6 3.9-.4Z', fill: '#f2c94c' }),
        )
      }
      return h('svg', common,
        h('path', { d: 'M5 10.2h14l-1.6 8.2a2 2 0 0 1-2 1.6H8.6a2 2 0 0 1-2-1.6Z', fill: 'none', stroke: '#a1793f', strokeWidth: 1.5 }),
        h('path', { d: 'M8.5 10.2c0-3 1.6-5 3.5-5s3.5 2 3.5 5', fill: 'none', stroke: '#a1793f', strokeWidth: 1.5 }),
        h('path', { d: 'M8 14h8M8.6 17h6.8', stroke: '#c9a227', strokeWidth: 1.2, strokeLinecap: 'round' }),
      )
    }

    /** Small colour swatch standing in for one species/variant in dense rows. */
    function BloomDot({ speciesId, variant }) {
      const species = SPECIES_BY_ID.get(speciesId) ?? SPECIES[0]
      const pal = paletteOf(species, variant ?? 'base')
      return h('span', {
        className: 'fg-dot',
        style: { background: pal.petal, borderColor: pal.petalDeep },
        'aria-hidden': 'true',
      })
    }

    /** One flower detail card: drawing, name, variant, Latin, meaning, figures, actions. */
    function BloomPreview({ id, speciesId, variant, t, meta, worth, armed, onSell, onClose }) {
      const species = SPECIES_BY_ID.get(speciesId) ?? SPECIES[0]
      return h('div', { className: 'fg-preview', id, tabIndex: -1, role: 'group', 'aria-label': t(`species.${species.id}`) },
        h('div', { className: 'fg-previewArt' },
          h(FlowerArt, { speciesId: species.id, stage: 'bloom', variant }),
        ),
        h('div', { className: 'fg-previewBody' },
          h('div', { className: 'fg-previewHead' },
            h('span', { className: 'fg-previewName' }, t(`species.${species.id}`)),
            h('span', { className: 'fg-previewVariant', 'data-variant': variant }, t(`variant.${variant}`)),
          ),
          h('div', { className: 'fg-previewLatin' }, t(`latin.${species.id}`)),
          h('div', { className: 'fg-previewMeaning' }, t(`codex.${species.id}`)),
          h('div', { className: 'fg-previewStats' },
            meta.map((line, index) => h('span', { key: index }, line)),
          ),
        ),
        h('div', { className: 'fg-previewActions' },
          onSell === undefined
            ? null
            : h('button', {
              type: 'button',
              className: armed ? 'fg-btn fg-btnDanger' : 'fg-btn fg-btnPrimary',
              onClick: onSell,
            }, armed ? t('basket.confirm', { n: worth }) : t('basket.sellAll', { n: worth })),
          h('button', { type: 'button', className: 'fg-btn fg-btnGhost', onClick: onClose }, t('preview.close')),
        ),
      )
    }

    // ---------------------------------------------------------------------
    // §6 View.
    // ---------------------------------------------------------------------
    function GardenView(props) {
      const t = (props !== null && props !== undefined && typeof props.t === 'function') ? props.t : boundT
      const state = useSyncExternalStore(subscribeGarden, getState, getState)
      const [picker, setPicker] = React.useState(null)
      const [confirmReset, setConfirmReset] = React.useState(false)
      const [codexOpen, setCodexOpen] = React.useState(false)
      const [armed, setArmed] = React.useState(null)
      // Which basket bloom the player opened to look at.
      const [preview, setPreview] = React.useState(null)
      // Which flower-book entry the player opened to look at.
      const [codexPreview, setCodexPreview] = React.useState(null)
      const [toast, setToast] = React.useState({ text: '', key: 0, tone: 'ok', species: null })
      const [clock, setClock] = React.useState(() => Date.now())
      const rootRef = React.useRef(null)

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
        }, 2800)
        return () => {
          window.clearTimeout(id)
        }
      }, [toastKey])

      function announce(text, tone, species) {
        setToast({ text, key: Date.now(), tone: tone ?? 'ok', species: species ?? null })
      }

      function focusTarget(selector) {
        window.setTimeout(() => {
          const root = rootRef.current
          if (root === null) return
          const target = root.querySelector(selector)
          if (target !== null && typeof target.focus === 'function') target.focus()
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
      function showBloom(speciesId, variant) {
        const key = `${speciesId}:${variant}`
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
      const basketValueNow = basketValue(state)
      const capacity = basketCapacity(state)
      const basketFull = state.basket.length >= capacity
      const sprinklerLeftMs = Math.max(0, (slot.sprinklerUntil ?? 0) - clock)
      const discovered = Object.keys(state.seen).length
      const totalEntries = CODEX_ENTRIES.length
      const grownCount = SPECIES.filter(species => state.seen[`${species.id}:base`] !== undefined
        || state.seen[`${species.id}:alt`] !== undefined
        || state.seen[`${species.id}:hidden`] !== undefined).length
      const sceneSpecies = scene.species.map(id => SPECIES_BY_ID.get(id))
      const weatherNote = [
        growth === 1 ? t('weather.steady') : t('weather.growth', { n: `${growth > 1 ? '+' : ''}${Math.round((growth - 1) * 100)}%` }),
        rainy ? (scene.rainWets ? t('weather.soilWet') : t('weather.soilDry')) : null,
      ].filter(Boolean).join(' · ')

      function plant(index, speciesId) {
        const species = SPECIES_BY_ID.get(speciesId)
        if (species === undefined) return
        if (getState().coins < species.cost) {
          announce(t('error.coins'), 'warn')
          return
        }
        const next = plantAt(getState(), state.scene, index, speciesId)
        if (next === null) return
        commit(next, true)
        setPicker(null)
        focusPlot(index, 'card')
      }

      function water(index) {
        commit(waterAt(getState(), state.scene, index), true)
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
        commit(next, true)
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

      function harvest(index) {
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
        const next = harvestAt(before, before.scene, index, Date.now(), weatherAt(Date.now()))
        if (next === null) return
        commit(next, true)
        const bloom = next.basket[next.basket.length - 1]
        if (bloom !== undefined && bloom.variant === 'hidden') {
          announce(t('reward.gold', { flower: t(`species.${species.id}`), n: 3 }), 'gold', species.id)
        } else {
          announce(t('reward.gain', { flower: t(`species.${species.id}`), xp: species.xp }), 'ok')
        }
        focusPlot(index, 'plant')
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

      function sell(speciesId, variant) {
        const key = `${speciesId ?? 'all'}:${variant ?? 'all'}`
        if (armed !== key) {
          setArmed(key)
          return
        }
        const before = getState()
        const next = sellBasket(before, speciesId, variant)
        setArmed(null)
        setPreview(null)
        if (next === null) return
        const gain = next.coins - before.coins
        commit(next, true)
        if (speciesId !== undefined) {
          announce(t('reward.sell', { flower: t(`species.${speciesId}`), coins: gain }), 'ok')
        } else {
          announce(t('reward.sellMany', { n: before.basket.length, coins: gain }), 'ok')
        }
        focusSection('basket')
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

      function onKeyDown(event) {
        if (event.key !== 'Escape' || picker === null) return
        const index = picker
        setPicker(null)
        focusPlot(index, 'plant')
      }

      // Basket grouped by species + variant for a stable, honest layout.
      const basketGroups = []
      for (const species of SPECIES) {
        for (const variant of ['base', 'alt', 'hidden']) {
          const count = state.basket.filter(item => item.species === species.id && item.variant === variant).length
          if (count > 0) basketGroups.push({ species, variant, count, worth: bloomPrice(species, variant) * count })
        }
      }

      const previewGroup = basketGroups.find(group => `${group.species.id}:${group.variant}` === preview)
      const codexPreviewEntry = (() => {
        if (codexPreview === null) return undefined
        const [speciesId, variant] = codexPreview.split(':')
        const species = SPECIES_BY_ID.get(speciesId)
        const count = state.seen[`${speciesId}:${variant}`] ?? 0
        return species === undefined || count === 0 ? undefined : { species, variant, count }
      })()

      function renderSeedPicker(index) {
        const cheapest = sceneSpecies.reduce((min, species) => Math.min(min, species.cost), Infinity)
        const short = state.coins < cheapest
        return h('div', { className: 'fg-seeds' },
          h('div', { className: 'fg-seedsHead' }, t('seed.pick')),
          short ? h('div', { className: 'fg-seedHint' }, t('error.coins')) : null,
          h('div', { className: 'fg-seedGrid' },
            sceneSpecies.map(species => h('button', {
              key: species.id,
              type: 'button',
              className: 'fg-seed',
              'data-action': 'seed',
              disabled: state.coins < species.cost,
              title: `${t(`species.${species.id}`)} · ${formatDuration(growMsOf(species), t)}`,
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
            'data-plot': index,
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
            'data-plot': index,
            role: 'group',
            tabIndex: -1,
            'aria-label': `${t('plot.empty')} #${position}`,
          },
          h('div', { className: 'fg-art' }, EmptyArt()),
          h('div', { className: 'fg-plotHead' },
            h('span', { className: 'fg-species' }, t('plot.empty')),
            h('span', { className: 'fg-stage' }, `#${position}`),
          ),
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
        const dryInMs = (plot.moisture / 100) * growMs * DRY_SHARE
        const growLeftMs = (growMs - plot.growthMs) / growth
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

        return h('div', {
          key: index,
          className: 'fg-plot',
          'data-state': stage,
          'data-plot': index,
          'data-paused': wet ? 'false' : 'true',
          role: 'group',
          tabIndex: -1,
          'aria-label': `${t(`species.${species.id}`)} ${t(`stage.${stage}`)}`,
        },
        h('div', { className: 'fg-art' }, h(FlowerArt, {
          speciesId: plot.species,
          stage,
          variant: plotVariant(species, index),
        })),
        h('div', { className: 'fg-plotHead' },
          h('span', { className: 'fg-species' }, t(`species.${species.id}`)),
          h('span', { className: 'fg-stage' }, t(`stage.${stage}`)),
        ),
        plot.dried === true && !bloomed
          ? h('span', { className: 'fg-badgeWarn fg-badge' }, t('plot.driedBadge'))
          : null,
        h('div', {
          className: 'fg-meter',
          role: 'progressbar',
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': percent,
          'aria-label': `${t(`species.${species.id}`)} ${t(`stage.${stage}`)}`,
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
                harvest(index)
              },
            }, t('plot.harvest'))
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
        return h('div', {
          key: species.id,
          className: 'fg-codexCard',
          'data-seen': known ? 'true' : 'false',
          'data-spirit': showcase === 'hidden' ? 'true' : 'false',
        },
          known
            ? h('button', {
              type: 'button',
              className: 'fg-codexArt fg-codexArtBtn',
              'data-codex': `${species.id}:${showcase}`,
              'aria-expanded': codexPreview === `${species.id}:${showcase}` ? 'true' : 'false',
              'aria-controls': codexPreview === `${species.id}:${showcase}` ? 'fg-codex-preview' : undefined,
              'aria-label': t('preview.open', { flower: `${t(`species.${species.id}`)} · ${t(`variant.${showcase}`)}` }),
              onClick: () => {
                showCodexEntry(species.id, showcase)
              },
            },
            h(FlowerArt, { speciesId: species.id, stage: 'bloom', variant: showcase }),
            )
            : h('div', { className: 'fg-codexArt', style: { filter: 'grayscale(1)', opacity: 0.35 } },
              h(FlowerArt, { speciesId: species.id, stage: 'bloom', variant: showcase }),
            ),
          h('div', { className: 'fg-codexBody' },
            h('div', { className: 'fg-codexName' }, t(`species.${species.id}`)),
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

      const sceneOrder = ['meadow', 'snow', 'volcano', 'lake']
      const sceneFound = new Map(sceneOrder.map(id => {
        const found = sceneOf(id).species.filter(speciesId => ['base', 'alt', 'hidden']
          .some(variant => (state.seen[`${speciesId}:${variant}`] ?? 0) > 0)).length
        return [id, found]
      }))

      return h('div', { className: 'fg-view', ref: rootRef, onKeyDown: onKeyDown },
        h('style', { key: 'fg-style' }, CSS),
        h('div', { className: 'fg-scroll' },
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
              h('span', { className: 'fg-chip', 'data-weather': weather },
                h(WeatherGlyph, { kind: weather }),
                h('span', { className: 'fg-chipValue' }, t(`weather.${scene.id}.${weather}`)),
                h('span', { className: 'fg-chipKey' }, t('weather.left', { n: weatherLeft })),
              ),
            ),
          ),

          h('div', { className: 'fg-scenes', role: 'group', 'aria-label': t('plot.section') },
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

          h('p', { className: 'fg-hint' },
            h('span', { className: 'fg-tipsTitle' }, t('hint.title')),
            ' ',
            t('hint.body'),
            h('span', { className: 'fg-hintWeather' }, `· ${weatherNote}`),
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

          h('section', {
            className: 'fg-section fg-ground',
            style: { background: scene.tint, borderColor: scene.edge },
          },
          h('div', { className: 'fg-sectionHead' },
            h('h3', { className: 'fg-sectionTitle' }, `${t('plot.section')} · ${t(`scene.${scene.id}`)}`),
            sprinklerLeftMs > 0
              ? h('span', { className: 'fg-sectionOk' }, t('item.sprinklerLeft', { n: formatDuration(sprinklerLeftMs, t) }))
              : null,
          ),
          h('div', { className: 'fg-grid' }, slot.plots.map(renderPlot)),
          ),

          h('section', { className: 'fg-section' },
            h('div', { className: 'fg-sectionHead' },
              h('h3', { className: 'fg-sectionTitle', 'data-focus': 'orders', tabIndex: -1 }, t('order.title')),
            ),
            state.orders.length === 0
              ? h('p', { className: 'fg-empty' }, t('order.empty'))
              : h('div', { className: 'fg-orders' }, state.orders.map(renderOrder)),
          ),

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
                    sell(undefined, undefined)
                  },
                }, armed === 'all:all' ? t('basket.confirm', { n: basketValueNow }) : t('basket.sellAll', { n: basketValueNow }))
                : null,
            ),
            basketGroups.length === 0
              ? h('p', { className: 'fg-empty' }, t('basket.empty'))
              : [
                h('div', { className: 'fg-basket', key: 'chips' },
                  basketGroups.map(group => {
                    const key = `${group.species.id}:${group.variant}`
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
                        flower: `${t(`species.${group.species.id}`)} · ${t(`variant.${group.variant}`)}`,
                      }),
                      onClick: () => {
                        showBloom(group.species.id, group.variant)
                      },
                    },
                    group.variant === 'hidden'
                      ? h('span', { className: 'fg-bloomArt' },
                        h(FlowerArt, { speciesId: group.species.id, stage: 'bloom', variant: 'hidden' }),
                        )
                      : h(BloomDot, { speciesId: group.species.id, variant: group.variant }),
                    h('span', { className: 'fg-bloomName' }, t(`species.${group.species.id}`)),
                    group.variant === 'hidden' ? h('span', { className: 'fg-goldTag' }, t('variant.goldTag')) : null,
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
                  t,
                  meta: [
                    `×${previewGroup.count}`,
                    t('basket.each', { n: bloomPrice(previewGroup.species, previewGroup.variant) }),
                    t('basket.total', { n: previewGroup.worth }),
                  ],
                  worth: previewGroup.worth,
                  armed: armed === `${previewGroup.species.id}:${previewGroup.variant}`,
                  onSell: () => {
                    sell(previewGroup.species.id, previewGroup.variant)
                  },
                  onClose: () => {
                    const key = `${previewGroup.species.id}:${previewGroup.variant}`
                    setPreview(null)
                    setArmed(null)
                    focusTarget(`[data-basket="${key}"]`)
                  },
                }),
              ],
          ),

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
          ),

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
            h('span', { className: 'fg-sectionTitle' }, `${t('codex.title')} · ${t(`scene.${scene.id}`)}`),
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
                    w: t(`weather.${scene.id}.${scene.rainWets ? 'rain' : 'clear'}`),
                  }), ' · ', t('codex.otherGround')),
                ),
                sceneSpecies.map(renderCodexCard),
                codexPreviewEntry === undefined ? null : h(BloomPreview, {
                  key: 'codex-preview',
                  id: 'fg-codex-preview',
                  speciesId: codexPreviewEntry.species.id,
                  variant: codexPreviewEntry.variant,
                  t,
                  meta: [
                    t(`variant.${codexPreviewEntry.variant}`),
                    t('codex.harvests', { n: codexPreviewEntry.count }),
                  ],
                  onClose: () => {
                    const key = `${codexPreviewEntry.species.id}:${codexPreviewEntry.variant}`
                    setCodexPreview(null)
                    focusTarget(`[data-codex="${key}"]`)
                  },
                }),
              )
              : null,
          ),

          h('footer', { className: 'fg-footer' },
            h('button', {
              type: 'button',
              className: confirmReset ? 'fg-btn fg-btnDanger' : 'fg-btn fg-btnGhost',
              onClick: reset,
            }, confirmReset ? t('action.resetConfirm') : t('action.reset')),
          ),
        ),
      )
    }

    // ---------------------------------------------------------------------
    // §7 Stylesheet. Rendered as a React element so unmounting the view
    //    removes it; only `--dsw-alias-*` tokens carry furniture colors.
    // ---------------------------------------------------------------------
    const CSS = `
.fg-view{box-sizing:border-box;width:100%;height:100%;flex:1 1 auto;min-height:0;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px}
.fg-scroll{box-sizing:border-box;flex:1 1 auto;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:16px;padding:18px 24px 176px}
.fg-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;padding-bottom:14px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.fg-titleBlock{min-width:0;max-width:520px}
.fg-title{margin:0;font-size:16px;line-height:24px;font-weight:600}
.fg-sub{margin:2px 0 0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.fg-stats{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.fg-chip{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;background:var(--dsw-alias-bg-layer-1)}
.fg-chipValue{font-size:13px;font-weight:600;font-variant-numeric:tabular-nums}
.fg-chipKey{font-size:11px;color:var(--dsw-alias-label-secondary)}
.fg-xpBar{display:inline-block;width:44px;height:4px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);overflow:hidden}
.fg-xpFill{display:block;height:100%;border-radius:999px;background:var(--dsw-alias-state-success-primary)}
.fg-scenes{display:flex;gap:8px;flex-wrap:wrap}
.fg-sceneChip{appearance:none;display:inline-flex;align-items:center;gap:8px;height:30px;padding:0 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;background:transparent;color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;transition:border-color .15s ease}
.fg-sceneChip:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-sceneChip[data-active="true"]{box-shadow:inset 0 0 0 1px var(--dsw-alias-label-primary)}
.fg-sceneChipArmed{border-color:var(--dsw-alias-state-error-primary)!important}
.fg-sceneChipArmed .fg-sceneMeta{color:var(--dsw-alias-state-error-primary)}
.fg-sceneChip[data-locked="true"]{opacity:.62;font-weight:500}
.fg-sceneName{white-space:nowrap}
.fg-sceneMeta{font-size:10px;font-weight:500;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;white-space:nowrap}
.fg-hint{margin:0;font-size:11px;line-height:17px;color:var(--dsw-alias-label-secondary)}
.fg-hintWeather{display:inline-block;margin-left:8px;color:var(--dsw-alias-label-primary)}
.fg-toast{position:sticky;top:0;z-index:1;min-height:18px;margin:0 -24px;padding:2px 24px 2px;font-size:12px;line-height:18px;color:var(--dsw-alias-state-success-primary)}
.fg-toast[data-show="true"]{background:var(--dsw-alias-bg-base)}
.fg-toast[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary)}
.fg-toast[data-tone="info"]{color:var(--dsw-alias-label-secondary)}
.fg-toast[data-tone="gold"]{color:var(--dsw-alias-state-warn-primary);font-weight:600;display:flex;align-items:center;gap:8px}
.fg-toastArt{display:inline-flex;width:26px;height:26px;flex:none}
.fg-toastArt svg{width:26px;height:26px;overflow:visible}
.fg-section{display:flex;flex-direction:column;gap:10px}
.fg-ground{padding:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:16px}
.fg-sectionHead{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.fg-sectionTitle{margin:0;font-size:12px;line-height:18px;font-weight:600;letter-spacing:.02em}
.fg-sectionMeta{font-size:11px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.fg-sectionWarn{font-size:11px;color:var(--dsw-alias-state-warn-primary)}
.fg-sectionOk{font-size:11px;color:var(--dsw-alias-state-success-primary)}
.fg-items{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px}
.fg-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);min-width:0}
.fg-itemIcon{flex:none;display:inline-flex;width:20px;height:20px}
.fg-itemBody{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px}
.fg-itemName{display:flex;align-items:baseline;gap:6px;font-size:12px;font-weight:600}
.fg-itemOwn{font-size:10px;font-weight:500;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.fg-itemNote{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fg-itemActions{flex:none;display:flex;gap:6px}
.fg-itemMax{font-size:11px;color:var(--dsw-alias-label-secondary)}
.fg-empty{margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.fg-orders{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}
.fg-order{display:flex;flex-direction:column;gap:8px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1)}
.fg-order[data-ready="true"]{border-color:var(--dsw-alias-state-success-primary)}
.fg-orderHead{display:flex;align-items:baseline;justify-content:space-between;gap:8px;flex-wrap:wrap}
.fg-orderId{font-size:12px;font-weight:600}
.fg-orderReward{font-size:11px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.fg-orderItems{display:flex;flex-direction:column;gap:3px}
.fg-orderItem{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.fg-orderItem[data-have="true"]{color:var(--dsw-alias-label-primary)}
.fg-orderHave{margin-left:auto;font-size:11px;font-variant-numeric:tabular-nums}
.fg-orderNote{margin:0;font-size:11px;line-height:16px;color:var(--dsw-alias-state-warn-primary)}
.fg-dot{flex:none;display:inline-block;width:11px;height:11px;border-radius:50%;border:1px solid transparent;box-sizing:border-box}
.fg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(186px,1fr));gap:12px}
.fg-plot{box-sizing:border-box;display:flex;flex-direction:column;gap:8px;min-height:198px;padding:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-layer-1)}
.fg-plot[data-state="bloom"]{border-color:var(--dsw-alias-state-success-primary)}
.fg-plot[data-state="locked"]{background:transparent;border-style:dashed}
.fg-plot[data-paused="true"] .fg-meter:not(.fg-meterWet) .fg-meterFill{background:var(--dsw-alias-state-idle-primary)}
.fg-plot:focus{outline:none}
.fg-plot:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-art{display:flex;align-items:flex-end;justify-content:center;height:96px}
.fg-art svg{display:block;width:96px;height:96px;overflow:visible}
.fg-plant{transform-box:view-box;transform-origin:50px 90px;animation:fg-sway 5.5s ease-in-out infinite alternate}
.fg-sparkle{transform-box:view-box;transform-origin:center;animation:fg-twinkle 2.9s ease-in-out infinite}
.fg-mote{transform-box:view-box;animation:fg-drift 4.8s ease-in-out infinite}
.fg-haloRing{transform-box:view-box;transform-origin:50px 36px;animation:fg-turn 26s linear infinite}
@keyframes fg-twinkle{0%,100%{opacity:.3;transform:scale(.75)}50%{opacity:1;transform:scale(1.2)}}
@keyframes fg-drift{0%{opacity:0;transform:translateY(3px)}28%{opacity:.9}100%{opacity:0;transform:translateY(-11px)}}
@keyframes fg-turn{to{transform:rotate(360deg)}}
@keyframes fg-sway{from{transform:rotate(-1.6deg)}to{transform:rotate(1.6deg)}}
.fg-plotHead{display:flex;align-items:baseline;justify-content:space-between;gap:8px;min-width:0}
.fg-species{min-width:0;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fg-stage{flex:none;font-size:11px;color:var(--dsw-alias-label-secondary)}
.fg-meter{position:relative;height:4px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);overflow:hidden}
.fg-meterFill{display:block;height:100%;border-radius:999px;background:var(--dsw-alias-state-success-primary);transition:width .4s linear}
.fg-meterWet .fg-meterFill{background:var(--dsw-alias-label-secondary);opacity:.55}
.fg-meterWet[data-low="true"] .fg-meterFill{background:var(--dsw-alias-state-error-primary);opacity:1}
.fg-row{display:flex;align-items:baseline;justify-content:space-between;gap:8px;min-width:0}
.fg-note{min-width:0;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fg-noteWarn{color:var(--dsw-alias-state-warn-primary)}
.fg-noteWet{flex:none;font-variant-numeric:tabular-nums}
.fg-actions{margin-top:auto;display:flex;gap:8px}
.fg-btn{appearance:none;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:28px;padding:0 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12px;font-weight:500;line-height:1;cursor:pointer;transition:background .15s ease,border-color .15s ease}
.fg-btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2)}
.fg-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-btn:disabled{opacity:.45;cursor:not-allowed}
.fg-btnBlock{width:100%}
.fg-btnGrow{flex:1 1 0;min-width:0;padding:0 8px}
.fg-btnSmall{height:24px;padding:0 10px;font-size:11px}
.fg-btnPrimary{border-color:var(--dsw-alias-state-success-primary);color:var(--dsw-alias-state-success-primary)}
.fg-btnPrimary:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2)}
.fg-btnGhost{border-color:transparent;background:transparent;color:var(--dsw-alias-label-secondary)}
.fg-btnGhost:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.fg-btnDanger{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary);background:transparent}
.fg-seeds{display:flex;flex-direction:column;gap:6px}
.fg-seedsHead{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary)}
.fg-seedHint{font-size:11px;line-height:16px;color:var(--dsw-alias-state-warn-primary)}
.fg-seedGrid{display:flex;flex-direction:column;gap:4px;max-height:150px;overflow:auto;padding-right:2px}
.fg-seed{display:flex;align-items:center;gap:5px;height:28px;padding:0 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:11px;cursor:pointer;text-align:left;min-width:0}
.fg-seed:hover:not(:disabled){border-color:var(--dsw-alias-border-l2)}
.fg-seed:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-seed:disabled{opacity:.45;cursor:not-allowed}
.fg-seedName{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fg-seedMeta{margin-left:auto;flex:none;font-size:10px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.fg-seedCancel{align-self:flex-start;margin-top:2px}
.fg-basket{display:flex;flex-wrap:wrap;gap:6px}
.fg-bloom{display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:11px;cursor:pointer}
.fg-bloom:hover{border-color:var(--dsw-alias-state-success-primary);background:var(--dsw-alias-bg-layer-2)}
.fg-bloom:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-bloom[data-variant="hidden"]{border-color:#c99a1f;background:rgba(242,201,76,0.16)}
.fg-bloomArmed{border-color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-bg-layer-2)}
.fg-bloomOpen{border-color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}
.fg-preview{display:flex;align-items:flex-start;gap:14px;padding:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-layer-1);flex-wrap:wrap}
.fg-preview:focus{outline:none}
.fg-preview:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-previewArt{flex:none;width:104px;height:104px;display:flex;align-items:center;justify-content:center}
.fg-previewArt svg{width:104px;height:104px;overflow:visible}
.fg-previewBody{flex:1 1 200px;min-width:0;display:flex;flex-direction:column;gap:3px}
.fg-previewHead{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.fg-previewName{font-size:14px;font-weight:600}
.fg-previewVariant{align-self:center;padding:0 6px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);font-size:10px;line-height:16px;color:var(--dsw-alias-label-secondary)}
.fg-previewVariant[data-variant="hidden"]{border-color:#c99a1f;color:var(--dsw-alias-state-warn-primary)}
.fg-previewLatin{font-size:11px;font-style:italic;color:var(--dsw-alias-label-secondary)}
.fg-previewMeaning{font-size:12px;line-height:18px;color:var(--dsw-alias-label-primary)}
.fg-previewStats{display:flex;gap:12px;flex-wrap:wrap;font-size:11px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.fg-previewActions{flex:none;display:flex;flex-direction:column;gap:6px;margin-left:auto}
.fg-bloomArmed .fg-bloomPrice{color:var(--dsw-alias-state-error-primary)}
.fg-bloomArt{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;flex:none}
.fg-bloomArt svg{width:22px;height:22px;overflow:visible}
.fg-bloomCount{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.fg-bloomPrice{color:var(--dsw-alias-state-success-primary);font-variant-numeric:tabular-nums}
.fg-codexToggle{appearance:none;display:flex;align-items:center;gap:10px;width:100%;padding:0;border:0;background:transparent;color:var(--dsw-alias-label-primary);font-family:inherit;cursor:pointer;text-align:left}
.fg-codexToggle:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:4px;border-radius:6px}
.fg-caret{font-size:10px;color:var(--dsw-alias-label-secondary);transition:transform .15s ease}
.fg-caret[data-open="true"]{transform:rotate(180deg)}
.fg-codexNotes{grid-column:1/-1;display:flex;flex-direction:column;gap:2px;margin-bottom:2px}
.fg-codexHint{margin:0;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary)}
.fg-codexTeaser{font-size:10px;color:var(--dsw-alias-state-warn-primary)}
.fg-goldTag{display:inline-block;padding:0 4px;border-radius:4px;background:rgba(242,201,76,0.35);color:var(--dsw-alias-label-primary);font-size:9px;line-height:13px}
.fg-badge{display:inline-block;width:fit-content;padding:0 6px;border-radius:999px;border:1px solid currentColor;font-size:10px;line-height:14px}
.fg-codex{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px}
.fg-codexCard{display:flex;align-items:flex-start;gap:10px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);min-width:0}
.fg-codexCard[data-seen="false"]{background:transparent;border-style:dashed}
.fg-codexCard[data-spirit="true"]{border-color:var(--dsw-alias-state-warn-primary)}
.fg-codexArt{flex:none;width:44px;height:44px;display:flex;align-items:center;justify-content:center}
.fg-codexArtBtn{appearance:none;padding:0;border:0;background:transparent;cursor:pointer;border-radius:10px}
.fg-codexArtBtn:hover{background:var(--dsw-alias-bg-layer-2)}
.fg-codexArtBtn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-variantBtn{appearance:none;background:transparent;font-family:inherit;cursor:pointer}
.fg-variantBtn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.fg-variantBtn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-codexArt svg{width:44px;height:44px;overflow:visible}
.fg-codexBody{min-width:0;display:flex;flex-direction:column;gap:2px}
.fg-codexName{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fg-codexLatin{font-size:10px;font-style:italic;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fg-codexMeaning{font-size:11px;line-height:16px;color:var(--dsw-alias-label-primary)}
.fg-codexVariants{display:flex;flex-wrap:wrap;gap:4px;margin-top:2px}
.fg-variant{display:inline-flex;align-items:center;gap:4px;height:18px;padding:0 6px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;font-size:10px;color:var(--dsw-alias-label-secondary)}
.fg-variant[data-found="true"]{color:var(--dsw-alias-label-primary)}
.fg-variant[data-variant="hidden"][data-found="true"]{border-color:#c99a1f;color:var(--dsw-alias-state-warn-primary)}
.fg-variantCount{font-variant-numeric:tabular-nums}
.fg-variantArt{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;flex:none}
.fg-variantArt svg{width:16px;height:16px;overflow:visible}
.fg-footer{display:flex;align-items:flex-start;justify-content:flex-end;gap:16px;flex-wrap:wrap;padding-top:12px;border-top:1px solid var(--dsw-alias-border-l1)}
@media (prefers-reduced-motion:reduce){.fg-plant,.fg-sparkle,.fg-mote,.fg-haloRing{animation:none}.fg-sparkle{opacity:.85}.fg-meterFill{transition:none}.fg-caret{transition:none}}
`

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
          window.addEventListener('pagehide', onHide)
          document.addEventListener('visibilitychange', onHide)
          return () => {
            window.removeEventListener('pagehide', onHide)
            document.removeEventListener('visibilitychange', onHide)
            flushPersist()
          }
        }, 'flower-garden: saved garden')

        ctx.slots.inject('conversation.view', () => ctx.slots.register({
          name: 'conversation.view',
          id: 'garden',
          order: 30,
          label: () => boundT('view.label'),
          locale: NS,
        }, GardenView))
      },
      /** Static pieces exported for layout tests only; the runtime never reads them. */
      __components: { GardenView, FlowerArt, BloomPreview },
      /** Dictionaries exported so tests render with the shipped copy. */
      __dicts: { zh, en },
      /** Pure game transitions and tuning, exported for unit tests only. */
      __game: {
        SCENES, SPECIES, CODEX_ENTRIES, HIDDEN_PAL, UNLOCK_COSTS, XP_PER_LEVEL, PLOT_COUNT,
        START_COINS, DRY_SHARE, BASKET_CAPACITY, ORDER_SLOTS, WEATHER_MS, ITEMS, SPRINKLER_MS, CHARM_BONUS,
        freshState, sanitize, advancePlot, advanceState, plantAt, waterAt, harvestAt, unlockAt,
        unlockScene, sellBasket, basketValue, basketCount, basketPlainCount, orderReady, orderNeedsGold,
        deliverOrder, fillOrders,
        makeOrder, stageOf, levelOf, growMsOf, weatherAt, weatherEndsAt, paletteOf, plotVariant,
        variantMultiplier, bloomPrice, hiddenChance, sceneOf, emptyScene, basketCapacity,
        buyItem, useSprinkler, useCharm, fertilizeAt,
      },
      __css: CSS,
    }
  },
})
