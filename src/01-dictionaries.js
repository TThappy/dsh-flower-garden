/**
 * Flower garden — browser half.
 *
 * Registers one `conversation.view` entry, which the Conversation header renders
 * as a tab beside Chat and Trajectory, and paints the flower-growing game inside
 * the session body.
 *
 * Ten scenes (meadow, snowfield, crater, lakeside, woodland, desert, alpine, rainforest, coast, eastern garden) hold one hundred and five
 * species, each drawn from its real morphology (see the `head` field and the
 * per-species art section). Every species has a codex entry per colour variant:
 * a plain bloom, a natural second colour on odd-numbered plots, and a rare gold
 * "hidden" bloom that only appears under the conditions listed in the flower book.
 * Open flowers attract visitors that pollinate them, the market favours one
 * flower a day, and achievements pay out long-term goals.
 *
 * Data path: the garden lives in this browser's `localStorage`
 * (`dsh.flower-garden.v4`) and is advanced from the wall clock, so a plot keeps
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
      'header.subtitle': '十块花地，一百零五种花，各有各的天气和访客。',
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
      'item.charm.note': '全花园下一株开花鉴定的仙品概率 +25%；已鉴定植株不重抽',
      'item.basket': '花篮扩容',
      'item.basket.note': '容量依次提升至 30 / 50 / 75 / 100 格，最高 100 格',
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
      'hint.body': '所有花地同时生长，离线最多补算 12 小时。花开以后，可以留园长养，观察同一株的变化、搭配生态角色、完成周期考察；也可以收获、育种或送展。种植指南和访客图鉴都能点击查看，每一株都可以有自己的位置。',
      'market.title': '今日花市',
      'market.bonus': '卖价 +{n}%',
      'market.note': '今日花市：{flower}卖价 +{n}%。每天零点换一种，只在已解锁花地的花里选；花束委托的报酬不受影响。',
      'market.tag': '行情',
      'plot.waterAll': '全部浇水 · {n}',
      'plot.pollinated': '已授粉 · 收获 ×2',
      'visitor.section': '访客',
      'visitor.hint': '开花引来访客：传粉者授粉、护园者恢复地力、水岸访客补湿度；所有遇见都留下生态足迹。点击卡片查看图鉴。',
      'visitor.greet': '和{name}打招呼',
      'visitor.met': '{name}来过了：金币 +{coins}，{flower}已授粉，收获时多得一朵',
      'visitor.again': '{name}也来了：金币 +{coins}',
      'visitor.new': '（新访客，已记入名册）',
      'visitor.unknown': '还没见过',
      'visitor.when.day': '白天',
      'visitor.when.night': '夜里 19:00–06:00',
      'visitor.when.any': '全天',
      'visitor.dry': '不下雨时',
      'visitor.bee': '蜜蜂',
      'visitor.butterfly': '菜粉蝶',
      'visitor.ladybug': '七星瓢虫',
      'visitor.dragonfly': '蜻蜓',
      'visitor.firefly': '萤火虫',
      'visitor.moth': '蜂鸟鹰蛾',
      'visitor.robin': '知更鸟',
      'visitor.honeycreeper': '镰嘴管舌雀',
      'visitor.kingfisher': '翠鸟',
      'reward.double': '收获{flower} ×2（授粉加成），+{xp} 经验',
      'ach.title': '成就',
      'ach.ready': '{n} 个可领取',
      'ach.count': '{n}/{total}',
      'ach.claim': '领取 · +{n}',
      'ach.claimed': '已领取',
      'ach.reward': '奖励 {n} 金币',
      'ach.done': '完成「{name}」，金币 +{n}',
      'ach.firstBloom.name': '第一朵花',
      'ach.firstBloom.desc': '收获 1 朵花',
      'ach.harvest30.name': '勤劳的园丁',
      'ach.harvest30.desc': '累计收获 30 朵花',
      'ach.harvest150.name': '花开满园',
      'ach.harvest150.desc': '累计收获 150 朵花',
      'ach.firstGuest.name': '有客来访',
      'ach.firstGuest.desc': '和 1 种访客打过招呼',
      'ach.pollinator.name': '授粉能手',
      'ach.pollinator.desc': '收获 12 朵授粉过的花',
      'ach.naturalist.name': '博物学家',
      'ach.naturalist.desc': '见过全部 9 种访客',
      'ach.florist5.name': '花店学徒',
      'ach.florist5.desc': '交付 5 束花束委托',
      'ach.florist25.name': '金牌花艺师',
      'ach.florist25.desc': '交付 25 束花束委托',
      'ach.firstSpirit.name': '初见仙品',
      'ach.firstSpirit.desc': '收获 1 种仙品',
      'ach.spirit8.name': '仙品收藏家',
      'ach.spirit8.desc': '收获 8 种不同的仙品',
      'ach.meadowBook.name': '草原通',
      'ach.meadowBook.desc': '草原的 10 种花全部种过',
      'ach.allGrounds.name': '四方花地',
      'ach.allGrounds.desc': '解锁全部 4 块花地',
      'ach.fullBook.name': '图鉴大成',
      'ach.fullBook.desc': '收齐图鉴里的每一款',
      'item.compost': '堆肥',
      'item.compost.note': '给一个花圃 +60 地力',
      'item.composted': '堆肥下地：#{n} 号花圃地力回到 {soil}%',
      'soil.label': '地力 {n}%',
      'soil.compost': '地力 {n}% · 施堆肥',
      'soil.low': '地力不足，长得慢',
      'soil.tip': '地力：每次收获 −14；同一个花圃接着种同一种花再 −10（连作），换一种 +8（轮作）；空着每分钟 +1；地力越低长得越慢，最慢到 55%。',
      'glut.tag': '跌 {n}%',
      'glut.note': '卖得太多，这种花跌价 {n}%；每 2 分钟回升 5%',
      'ribbon.label': '绶带',
      'trait.named': '{trait}{flower}',
      'hybrid.name': '{tint}色{form}',
      'hybrid.tag': '杂交',
      'hybrid.hint': '可能结杂交种子',
      'hybrid.seed': '还结出一粒杂交种子：{name}',
      'hybrid.seeds': '杂交种子',
      'hybrid.free': '×{n} · 自育',
      'hybrid.how': '杂交：授粉过的花，隔壁花圃开着另一种花时，收获有机会结出杂交种子——这种花的形，隔壁花的色。',
      'reward.trait': '✦ 奇珍！收获{name}，卖价 ×{n}',
      'trait.twin': '并蒂',
      'trait.giant': '巨株',
      'trait.rainbow': '虹彩',
      'trait.frost': '霜晶',
      'trait.ember': '熔火',
      'trait.pearl': '珠光',
      'trait.ink': '墨玉',
      'trait.variegated': '斑锦',
      'trait.twin.cause': '收获前被访客光顾过两次以上',
      'trait.giant.cause': '同一株施过两次以上肥料',
      'trait.rainbow.cause': '草原下雨时收获',
      'trait.frost.cause': '雪原降雪时收获',
      'trait.ember.cause': '火山口热浪时收获',
      'trait.pearl.cause': '湖畔细雨时收获',
      'trait.ink.cause': '深夜 22:00–05:00 收获',
      'trait.variegated.cause': '缺过一次水，又活了下来',
      'trait.twin.clue': '据说很招客人喜欢的花才会这样',
      'trait.giant.clue': '吃得特别好的那一株',
      'trait.rainbow.clue': '草原上，雨里的事',
      'trait.frost.clue': '雪原上，雪落下来的时候',
      'trait.ember.clue': '火山口最热的时候',
      'trait.pearl.clue': '湖畔，雨丝很细的时候',
      'trait.ink.clue': '夜深了才看得到',
      'trait.variegated.clue': '吃过苦的花',
      'trait.title': '奇珍册',
      'trait.count': '{n} 种花',
      'trait.unknown': '？？？',
      'trait.note': '奇珍是花经历了特别的事才长成的样子，卖价 ×2，花展加 3 分；满足条件后也只是有机会。温室每级让机会 +10%。',
      'show.confirm': '确认送展 · 消耗 1 朵 · +{n} 分',
      'basket.first': '下一朵 {n} 金币',
      'basket.individual': '查看个体',
      'basket.individualNo': '第 {n}/{max} 株',
      'basket.sellOne': '卖出这一株 · {n} 金币',
      'basket.confirmOne': '确认卖出这一株 · {n} 金币',
      'basket.pricing': '同种花逐朵卖出会降价；每组报价按单独卖出计算，全部卖出以总报价为准。',
      'show.title': '花展',
      'show.season.spring': '春',
      'show.season.summer': '夏',
      'show.season.autumn': '秋',
      'show.season.winter': '冬',
      'show.name': '{season}季花展 ·「{theme}」',
      'show.left': '还剩 {n}',
      'show.theme.ground': '{scene}之花',
      'show.theme.warm': '暖色',
      'show.theme.cool': '冷色与素色',
      'show.theme.rare': '珍品',
      'show.desc.ground': '只收{scene}的花。',
      'show.desc.warm': '只收红、粉、橙、黄色的花。',
      'show.desc.cool': '只收白、蓝、紫色的花。',
      'show.desc.rare': '只收仙品、奇珍和杂交花。',
      'show.rules': '送展的花不换金币，换评分：每朵 1 分，别色 +1、杂交 +2、奇珍 +3、仙品 +4，本届没送过的花种再 +2。每届最多送 {slots} 朵；{a} / {b} / {c} 分各得 1 / 2 / 3 条绶带。',
      'show.points': '{n} 分',
      'show.entered': '已送展 {n}/{max}',
      'show.next': '距下一条绶带还差 {n} 分',
      'show.done': '本届绶带已拿满',
      'show.enter': '送展 · +{n} 分',
      'show.none': '花篮里没有符合本届主题的花。',
      'show.full': '本届名额已满，下一届再来。',
      'show.sent': '{name}送去花展：+{n} 分',
      'show.won': '，赢得 {n} 条绶带！',
      'facility.title': '花园设施',
      'facility.level': 'Lv.{n}/{max}',
      'facility.cost': '{coins} 金币',
      'facility.costRibbon': '{coins} 金币 + {ribbons} 绶带',
      'facility.upgrade': '升级',
      'facility.max': '已满级',
      'facility.short': '还差 {n} 金币',
      'facility.shortRibbon': '还差 {n} 条绶带',
      'facility.done': '{name}升到 Lv.{n}',
      'facility.hive': '蜂箱',
      'facility.hive.note': '访客出现的机会 +{n}%',
      'facility.greenhouse': '温室',
      'facility.greenhouse.note': '长出奇珍的机会 +{n}%',
      'facility.bench': '育种台',
      'facility.bench.note': '结出杂交种子的机会 +{n}%',
      'facility.note': '设施一级比一级贵（每级 ×1.8），第二级起还要花展的绶带。',
      'card.example': '外观示例（非收藏标本）',
      'card.specimen': '收藏标本',
      'card.recorded': '该组合已记录 {n} 次',
      'card.traitHistory': '该奇珍历史累计 {n} 次',
      'card.hybridHistory': '该杂交历史累计 {n} 次',
      'show.choose': '选择送展花朵',
      'show.exception': '仙品可参加所有主题。',
      'card.close': '关闭',
      'card.prev': '上一种',
      'card.next': '下一种',
      'card.another': '换一株看看',
      'card.textbook': '标准株',
      'card.individual': '每一株都不一样：高矮、朝向、花色深浅都由它自己的基因决定。',
      'card.no': 'No. {n}',
      'card.ground': '花地',
      'card.grow': '生长',
      'card.seed': '种子',
      'card.price': '卖价',
      'card.count': '收获',
      'card.times': '{n} 次',
      'card.variants': '花色',
      'card.traits': '奇珍',
      'card.hybrids': '杂交',
      'card.noHybrid': '还没有育出杂交种。',
      'card.locked': '未发现',
      'ach.breeder.name': '育种家',
      'ach.breeder.desc': '育出 5 种杂交花',
      'ach.curio.name': '奇珍猎人',
      'ach.curio.desc': '见过 4 种不同的奇珍',
      'ach.ribbons.name': '花展常客',
      'ach.ribbons.desc': '在花展赢得 10 条绶带',
      'fact.dandelion': '一朵「花」其实是上百朵舌状小花；种子靠冠毛随风飞走。',
      'fact.daisy': '夜里和阴雨天会把花瓣合拢，英文名 daisy 来自「白昼之眼」。',
      'fact.cherry': '花瓣顶端有个小缺口，这是它和梅花最容易的区分。',
      'fact.tulip': '剪下来以后茎还会继续长，并朝着光弯过去。',
      'fact.lavender': '香气主要来自花萼上的油腺，而不是花瓣。',
      'fact.poppy': '一朵花只开一天左右；花苞一直垂着头，开放前才抬起来。',
      'fact.sunflower': '花盘里的小花按黄金角排成螺旋；只有幼嫩的花盘会追着太阳转。',
      'fact.lily': '花药的花粉极易染色，花店常在花开时把它摘掉。',
      'fact.rose': '茎上的「刺」是表皮长出的皮刺，一掰就掉。',
      'fact.hydrangea': '好看的「花瓣」其实是萼片；土壤偏酸开蓝花，偏碱开粉花。',
      'fact.snowdrop': '能顶开积雪：叶尖硬化，体内还有防冻蛋白。',
      'fact.hellebore': '花后「花瓣」不落，慢慢变绿，像叶子一样继续光合作用。',
      'fact.plum': '先开花后长叶，花梗极短，所以贴着枝条开。',
      'fact.edelweiss': '白色的「花瓣」是长满绒毛的苞片，绒毛能挡紫外线和干冷的风。',
      'fact.camellia': '凋谢时常常整朵落下，而不是一瓣一瓣地掉。',
      'fact.cactus': '扁平的「掌」是茎，真正的叶子退化成了刺。',
      'fact.lehua': '常是熔岩凝固后最早长出来的树之一。',
      'fact.agave': '攒上十几年养分，一生只抽一次花葶，开完整株枯死。',
      'fact.silversword': '只长在夏威夷的高山火山上，银色绒毛用来反射强烈的阳光。',
      'fact.plumeria': '花香很浓却没有花蜜，天蛾被香味骗来白白替它传粉。',
      'fact.pickerel': '每朵小花只开一天，整串花从下往上陆续开放。',
      'fact.loosestrife': '同一种植物有三种长短不同的花柱，达尔文专门研究过它。',
      'fact.iris': '垂瓣上的褐色脉纹是给昆虫看的「跑道」，指向花蜜。',
      'fact.waterlily': '白天开、傍晚合，每朵通常只开三四天。',
      'fact.lotus': '叶面的微小突起让水珠滚落并带走灰尘；莲子休眠上千年仍能发芽。',
      'action.reset': '重置花园',
      'action.resetConfirm': '再点一次确认重置',
      'action.resetDone': '花园已重置',
      'action.export': '导出存档',
      'action.import': '导入存档',
      'action.exported': '存档已下载',
      'action.exportFailed': '无法导出存档',
      'action.importBad': '这不是可用的花园存档（可能来自更新版本）',
      'action.importReview': '导入会覆盖当前花园，确定？',
      'action.importYes': '确定导入',
      'action.importNo': '取消',
      'action.imported': '存档已导入',
    }

    const en = {
      'view.label': 'Garden',
      'view.title': 'My garden',
      'header.subtitle': 'Ten grounds and 105 flowers, each with its own sky and visitors.',
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
      'item.charm.note': '+25% spirit chance on the next bloom identification across all grounds; existing blooms do not reroll',
      'item.basket': 'Basket upgrade',
      'item.basket.note': 'Expand to 30 / 50 / 75 / 100 slots; maximum 100',
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
      'hint.body': 'All the grounds grow together, with up to 12 hours of offline progress. Keep a bloomed plant alive, observe its changes, build a diverse border and complete recurring field studies; or harvest, breed and exhibit it. Open the flower and visitor guides to find a place for every plant.',
      'market.title': 'Market today',
      'market.bonus': 'sells +{n}%',
      'market.note': 'Market today: {flower} sells for +{n}%. It changes at midnight and is always a flower from a ground you have opened; bouquet rewards are not affected.',
      'market.tag': 'in demand',
      'plot.waterAll': 'Water all · {n}',
      'plot.pollinated': 'Pollinated · harvest ×2',
      'visitor.section': 'Visitors',
      'visitor.hint': 'Open flowers attract pollinators, garden guardians and waterside visitors with different game effects. Every encounter makes an ecological record. Click a card to open its field guide.',
      'visitor.greet': 'Greet the {name}',
      'visitor.met': 'A {name} came by: +{coins} coins, and the {flower} is pollinated — one more bloom at harvest',
      'visitor.again': 'A {name} dropped in too: +{coins} coins',
      'visitor.new': '(a new visitor for the list)',
      'visitor.unknown': 'Not seen yet',
      'visitor.when.day': 'by day',
      'visitor.when.night': 'at night, 19:00–06:00',
      'visitor.when.any': 'any time',
      'visitor.dry': 'when it is not raining',
      'visitor.bee': 'honey bee',
      'visitor.butterfly': 'cabbage white',
      'visitor.ladybug': 'ladybird',
      'visitor.dragonfly': 'dragonfly',
      'visitor.firefly': 'firefly',
      'visitor.moth': 'hummingbird hawk-moth',
      'visitor.robin': 'robin',
      'visitor.honeycreeper': 'ʻiʻiwi honeycreeper',
      'visitor.kingfisher': 'kingfisher',
      'reward.double': 'Harvested {flower} ×2 (pollinated), +{xp} XP',
      'ach.title': 'Achievements',
      'ach.ready': '{n} to collect',
      'ach.count': '{n}/{total}',
      'ach.claim': 'Collect · +{n}',
      'ach.claimed': 'Collected',
      'ach.reward': 'Reward: {n} coins',
      'ach.done': 'Finished “{name}”, +{n} coins',
      'ach.firstBloom.name': 'First bloom',
      'ach.firstBloom.desc': 'Harvest 1 flower',
      'ach.harvest30.name': 'Steady gardener',
      'ach.harvest30.desc': 'Harvest 30 flowers in total',
      'ach.harvest150.name': 'A garden in full bloom',
      'ach.harvest150.desc': 'Harvest 150 flowers in total',
      'ach.firstGuest.name': 'Company',
      'ach.firstGuest.desc': 'Greet 1 kind of visitor',
      'ach.pollinator.name': 'Good with bees',
      'ach.pollinator.desc': 'Harvest 12 pollinated flowers',
      'ach.naturalist.name': 'Naturalist',
      'ach.naturalist.desc': 'Meet all 9 kinds of visitor',
      'ach.florist5.name': 'Apprentice florist',
      'ach.florist5.desc': 'Deliver 5 bouquet orders',
      'ach.florist25.name': 'Master florist',
      'ach.florist25.desc': 'Deliver 25 bouquet orders',
      'ach.firstSpirit.name': 'A first spirit',
      'ach.firstSpirit.desc': 'Harvest 1 kind of spirit bloom',
      'ach.spirit8.name': 'Spirit collector',
      'ach.spirit8.desc': 'Harvest 8 different spirit blooms',
      'ach.meadowBook.name': 'Meadow hand',
      'ach.meadowBook.desc': 'Grow all 10 meadow flowers',
      'ach.allGrounds.name': 'Four grounds',
      'ach.allGrounds.desc': 'Open all 4 grounds',
      'ach.fullBook.name': 'The whole book',
      'ach.fullBook.desc': 'Collect every entry in the flower book',
      'item.compost': 'Compost',
      'item.compost.note': '+60 soil for one plot',
      'item.composted': 'Composted plot #{n}: soil back to {soil}%',
      'soil.label': 'Soil {n}%',
      'soil.compost': 'Soil {n}% · add compost',
      'soil.low': 'Poor soil — slow growth',
      'soil.tip': 'Soil: every harvest costs 14; the same flower again in the same plot costs 10 more, a different one gives 8 back; an empty plot regains 1 a minute. Poorer soil grows slower, down to 55% of the pace.',
      'glut.tag': '−{n}%',
      'glut.note': 'Too many sold: this flower is down {n}%; it climbs back 5% every 2 minutes',
      'ribbon.label': 'Ribbons',
      'trait.named': '{trait} {flower}',
      'hybrid.name': '{tint}-coloured {form}',
      'hybrid.tag': 'hybrid',
      'hybrid.hint': 'May set a hybrid seed',
      'hybrid.seed': 'It also set a hybrid seed: {name}',
      'hybrid.seeds': 'Hybrid seeds',
      'hybrid.free': '×{n} · bred',
      'hybrid.how': 'Hybrids: a pollinated flower with a different flower open in the next plot may set a hybrid seed at harvest — its own form in the neighbour’s colour.',
      'reward.trait': '✦ A curiosity! Harvested {name}, sells ×{n}',
      'trait.twin': 'Twin',
      'trait.giant': 'Giant',
      'trait.rainbow': 'Rainbow',
      'trait.frost': 'Frost',
      'trait.ember': 'Ember',
      'trait.pearl': 'Pearl',
      'trait.ink': 'Ink',
      'trait.variegated': 'Variegated',
      'trait.twin.cause': 'Visited at least twice before harvest',
      'trait.giant.cause': 'Fed at least twice',
      'trait.rainbow.cause': 'Harvested in meadow rain',
      'trait.frost.cause': 'Harvested in snowfall on the snowfield',
      'trait.ember.cause': 'Harvested in a crater heat wave',
      'trait.pearl.cause': 'Harvested in lakeside drizzle',
      'trait.ink.cause': 'Harvested late at night, 22:00–05:00',
      'trait.variegated.cause': 'Dried out once, and lived',
      'trait.twin.clue': 'Only a flower the visitors love',
      'trait.giant.clue': 'The best-fed plant of all',
      'trait.rainbow.clue': 'On the meadow, in the rain',
      'trait.frost.clue': 'On the snowfield, while it falls',
      'trait.ember.clue': 'When the crater is at its hottest',
      'trait.pearl.clue': 'By the lake, in the finest rain',
      'trait.ink.clue': 'Only seen in the small hours',
      'trait.variegated.clue': 'A flower that had it hard',
      'trait.title': 'Curiosities',
      'trait.count': '{n} flowers',
      'trait.unknown': '???',
      'trait.note': 'A curiosity is what a flower becomes after an unusual life. It sells for ×2 and scores 3 more at the show; meeting the cause only gives a chance. Each greenhouse level raises that chance by 10%.',
      'show.confirm': 'Confirm entry · use 1 bloom · +{n} pts',
      'basket.first': 'Next bloom: {n} coins',
      'basket.individual': 'View individual',
      'basket.individualNo': 'Plant {n}/{max}',
      'basket.sellOne': 'Sell this plant · {n} coins',
      'basket.confirmOne': 'Confirm this plant · {n} coins',
      'basket.pricing': 'Each sale lowers this species’ price. Groups are quoted separately; selling everything uses the total quote.',
      'show.title': 'Flower show',
      'show.season.spring': 'Spring',
      'show.season.summer': 'Summer',
      'show.season.autumn': 'Autumn',
      'show.season.winter': 'Winter',
      'show.name': '{season} show · “{theme}”',
      'show.left': '{n} left',
      'show.theme.ground': 'Flowers of the {scene}',
      'show.theme.warm': 'Warm colours',
      'show.theme.cool': 'Cool and pale',
      'show.theme.rare': 'Rarities',
      'show.desc.ground': 'Only flowers of the {scene}.',
      'show.desc.warm': 'Only red, pink, orange and yellow flowers.',
      'show.desc.cool': 'Only white, blue and purple flowers.',
      'show.desc.rare': 'Only spirit blooms, curiosities and hybrids.',
      'show.rules': 'A flower given to the show earns points, not coins: 1 each, +1 second colour, +2 hybrid, +3 curiosity, +4 spirit, and +2 for a species new to this show. Up to {slots} flowers a show; {a} / {b} / {c} points win 1 / 2 / 3 ribbons.',
      'show.points': '{n} pts',
      'show.entered': '{n}/{max} shown',
      'show.next': '{n} pts to the next ribbon',
      'show.done': 'Every ribbon of this show is won',
      'show.enter': 'Show it · +{n} pts',
      'show.none': 'Nothing in the basket fits this show.',
      'show.full': 'This show is full — come back for the next one.',
      'show.sent': '{name} goes to the show: +{n} pts',
      'show.won': ' — {n} ribbon(s) won!',
      'facility.title': 'Garden works',
      'facility.level': 'Lv.{n}/{max}',
      'facility.cost': '{coins} coins',
      'facility.costRibbon': '{coins} coins + {ribbons} ribbons',
      'facility.upgrade': 'Upgrade',
      'facility.max': 'Maxed',
      'facility.short': '{n} coins short',
      'facility.shortRibbon': '{n} ribbons short',
      'facility.done': '{name} is now Lv.{n}',
      'facility.hive': 'Beehive',
      'facility.hive.note': 'Visitors are +{n}% more likely',
      'facility.greenhouse': 'Greenhouse',
      'facility.greenhouse.note': 'Curiosities are +{n}% more likely',
      'facility.bench': 'Breeding bench',
      'facility.bench.note': 'Hybrid seeds are +{n}% more likely',
      'facility.note': 'Each level costs 1.8× the last, and from the second on, ribbons from the flower show.',
      'card.example': 'Appearance example (not a collected specimen)',
      'card.specimen': 'Collected specimen',
      'card.recorded': 'Recorded combination: {n}',
      'card.traitHistory': 'Lifetime harvests of this curiosity: {n}',
      'card.hybridHistory': 'Lifetime harvests of this hybrid: {n}',
      'show.choose': 'Choose a flower to exhibit',
      'show.exception': 'Spirit blooms may enter any theme.',
      'card.close': 'Close',
      'card.prev': 'Previous',
      'card.next': 'Next',
      'card.another': 'Show another plant',
      'card.textbook': 'Textbook plant',
      'card.individual': 'No two plants are alike: height, lean, facing and shade come from each one’s own genes.',
      'card.no': 'No. {n}',
      'card.ground': 'Ground',
      'card.grow': 'Grows in',
      'card.seed': 'Seed',
      'card.price': 'Sells for',
      'card.count': 'Harvested',
      'card.times': '{n}×',
      'card.variants': 'Colours',
      'card.traits': 'Curiosities',
      'card.hybrids': 'Hybrids',
      'card.noHybrid': 'No hybrid bred yet.',
      'card.locked': 'Not found',
      'ach.breeder.name': 'Plant breeder',
      'ach.breeder.desc': 'Breed 5 different hybrids',
      'ach.curio.name': 'Curio hunter',
      'ach.curio.desc': 'Find 4 different curiosities',
      'ach.ribbons.name': 'Show regular',
      'ach.ribbons.desc': 'Win 10 ribbons at the flower show',
      'fact.dandelion': 'One “flower” is a hundred or more strap florets; the seeds leave on their own parachutes.',
      'fact.daisy': 'It closes at night and in rain — the name comes from “day’s eye”.',
      'fact.cherry': 'Each petal has a small notch at the tip, the easy way to tell it from plum blossom.',
      'fact.tulip': 'A cut tulip keeps growing in the vase and bends toward the light.',
      'fact.lavender': 'The scent comes mostly from oil glands on the calyx, not from the petals.',
      'fact.poppy': 'A flower lasts about a day; the bud hangs its head and lifts it only to open.',
      'fact.sunflower': 'The disc florets spiral at the golden angle; only young heads follow the sun.',
      'fact.lily': 'The pollen stains badly, so florists often remove the anthers as the flower opens.',
      'fact.rose': 'The “thorns” are prickles grown from the skin of the stem, and snap off cleanly.',
      'fact.hydrangea': 'The showy “petals” are sepals; acid soil turns them blue, alkaline soil pink.',
      'fact.snowdrop': 'It pushes up through snow: hardened leaf tips, and antifreeze proteins inside.',
      'fact.hellebore': 'After flowering the “petals” stay on, turn green and photosynthesise like leaves.',
      'fact.plum': 'It flowers before the leaves, on stalks so short the blossom sits on the branch.',
      'fact.edelweiss': 'The white “petals” are woolly bracts; the felt screens ultraviolet light and drying wind.',
      'fact.camellia': 'A spent flower usually drops whole rather than petal by petal.',
      'fact.cactus': 'The flat pads are stems; the true leaves have become the spines.',
      'fact.lehua': 'It is often among the first trees to grow on new lava.',
      'fact.agave': 'It saves for a decade or more, flowers once on a single mast, and dies.',
      'fact.silversword': 'It grows only on high Hawaiian volcanoes; the silver hairs reflect the fierce sun.',
      'fact.plumeria': 'Strongly scented but nectarless: hawk-moths are fooled into pollinating it for nothing.',
      'fact.pickerel': 'Each small flower lasts a day, and the spike opens from the bottom up.',
      'fact.loosestrife': 'One species, three different style lengths — Darwin wrote a study of it.',
      'fact.iris': 'The brown veins on the falls are a runway that points insects to the nectar.',
      'fact.waterlily': 'It opens by day and closes at dusk, and each flower lasts three or four days.',
      'fact.lotus': 'Tiny bumps on the leaf make water roll off and carry the dirt away; seeds can sprout after a thousand years.',
      'action.reset': 'Reset garden',
      'action.resetConfirm': 'Click again to confirm',
      'action.resetDone': 'Garden reset',
      'action.export': 'Export save',
      'action.import': 'Import save',
      'action.exported': 'Save downloaded',
      'action.exportFailed': 'Could not export the save',
      'action.importBad': 'That file is not a usable garden save (it may come from a newer version)',
      'action.importReview': 'Importing replaces this garden. Continue?',
      'action.importYes': 'Import',
      'action.importNo': 'Cancel',
      'action.imported': 'Save imported',
    }

    // ---------------------------------------------------------------------
Object.assign(zh, {
  'species.cosmos': '波斯菊', 'latin.cosmos': 'Cosmos bipinnatus', 'codex.cosmos': '轻盈、和谐与自在', 'fact.cosmos': '细裂的叶片像羽毛；花盘外缘的舌状花常有缺刻。',
  'species.zinnia': '百日草', 'latin.zinnia': 'Zinnia elegans', 'codex.zinnia': '长久的陪伴与热情', 'fact.zinnia': '叶片对生，花序顶部的小管状花围绕花心逐次开放。',
  'species.cornflower': '矢车菊', 'latin.cornflower': 'Centaurea cyanus', 'codex.cornflower': '清澈与温柔的相遇', 'fact.cornflower': '花序外围有扩大的漏斗状小花，花序下方有层叠的总苞片。',
  'species.calendula': '金盏花', 'latin.calendula': 'Calendula officinalis', 'codex.calendula': '温暖、守候与日光', 'fact.calendula': '金黄至橙色的舌状花围着中央小花，叶片较宽而略带绒毛。',
  'species.snapdragon': '金鱼草', 'latin.snapdragon': 'Antirrhinum majus', 'codex.snapdragon': '活力与好奇心', 'fact.snapdragon': '两唇形的花冠组成直立花序，花口闭合，形似张嘴的小鱼。',
  'species.crocus': '春番红花', 'latin.crocus': 'Crocus vernus', 'codex.crocus': '春天的第一声问候', 'fact.crocus': '花从地下球茎抽出，细长叶片有白色中线；并非采收香料藏红花的物种。',
  'species.daffodil': '黄水仙', 'latin.daffodil': 'Narcissus pseudonarcissus', 'codex.daffodil': '新生与明亮的希望', 'fact.daffodil': '六枚花被片围着喇叭状副花冠，叶片细长呈带状。',
  'species.primrose': '欧洲报春', 'latin.primrose': 'Primula vulgaris', 'codex.primrose': '初春与新的开始', 'fact.primrose': '起皱的叶片形成基生莲座，花瓣末端常有浅缺刻。',
  'species.pansy': '三色堇', 'latin.pansy': 'Viola tricolor', 'codex.pansy': '思念与细小的心意', 'fact.pansy': '五枚花瓣大小不同，花瓣上深色脉纹朝向花心。',
  'species.bleedingheart': '荷包牡丹', 'latin.bleedingheart': 'Lamprocapnos spectabilis', 'codex.bleedingheart': '珍惜与柔软的牵挂', 'fact.bleedingheart': '拱形花梗上悬垂着心形花，内侧浅色花瓣伸出如小水滴。',
  'species.hibiscus': '朱槿', 'latin.hibiscus': 'Hibiscus rosa-sinensis', 'codex.hibiscus': '热烈与当下的美好', 'fact.hibiscus': '五枚宽花瓣围绕突出花外的雄蕊柱，柱顶可见分枝的柱头。',
  'species.birdofparadise': '鹤望兰', 'latin.birdofparadise': 'Strelitzia reginae', 'codex.birdofparadise': '自由与远方', 'fact.birdofparadise': '舟状佛焰苞托着橙色萼片和蓝色花瓣，叶片宽大而长柄。',
  'species.gazania': '勋章菊', 'latin.gazania': 'Gazania rigens', 'codex.gazania': '勇气与阳光', 'fact.gazania': '舌状花基部常有深色斑，花序在充足日照下展开。',
  'species.redhotpoker': '火炬花', 'latin.redhotpoker': 'Kniphofia uvaria', 'codex.redhotpoker': '向上的热情', 'fact.redhotpoker': '密集管状小花形成火炬形花序，下部开放小花与上部花苞常呈不同色调。',
  'species.desertrose': '沙漠玫瑰', 'latin.desertrose': 'Adenium obesum', 'codex.desertrose': '坚韧与积蓄的生命力', 'fact.desertrose': '膨大的茎基能够储水，枝端开漏斗状花；它不是蔷薇属的玫瑰。',
  'species.marshmarigold': '驴蹄草', 'latin.marshmarigold': 'Caltha palustris', 'codex.marshmarigold': '湿地里的明亮问候', 'fact.marshmarigold': '常生于湿地，亮黄色的花被是萼片，叶片呈心形至肾形。',
  'species.forgetmenot': '沼生勿忘草', 'latin.forgetmenot': 'Myosotis scorpioides', 'codex.forgetmenot': '记得与长久的牵念', 'fact.forgetmenot': '浅蓝色五裂小花有黄色花眼，弯卷的花序随开花逐渐伸展。',
  'species.astilbe': '落新妇', 'latin.astilbe': 'Astilbe chinensis', 'codex.astilbe': '温柔的陪伴', 'fact.astilbe': '许多细小花聚成羽毛状圆锥花序，复叶的边缘带锯齿。',
  'species.cardinalflower': '鲜红半边莲', 'latin.cardinalflower': 'Lobelia cardinalis', 'codex.cardinalflower': '鲜明的热情', 'fact.cardinalflower': '管状红花具有两枚上裂片和三枚较显眼的下裂片，常见于湿润生境。',
  'species.arrowhead': '欧洲慈姑', 'latin.arrowhead': 'Sagittaria sagittifolia', 'codex.arrowhead': '清净与向上的生长', 'fact.arrowhead': '挺水叶呈箭头状，白花有三枚花瓣，花序上的花常轮生排列。',
})
Object.assign(en, {
  'species.cosmos': 'Garden cosmos', 'latin.cosmos': 'Cosmos bipinnatus', 'codex.cosmos': 'Lightness, harmony and freedom', 'fact.cosmos': 'Finely divided leaves look feathery; the outer ray florets often have notched tips.',
  'species.zinnia': 'Common zinnia', 'latin.zinnia': 'Zinnia elegans', 'codex.zinnia': 'Lasting companionship and warmth', 'fact.zinnia': 'Opposite leaves sit below a flower head whose small disk florets open in succession.',
  'species.cornflower': 'Cornflower', 'latin.cornflower': 'Centaurea cyanus', 'codex.cornflower': 'Clarity and a gentle meeting', 'fact.cornflower': 'Enlarged funnel-shaped outer florets surround the disk above overlapping involucral bracts.',
  'species.calendula': 'Pot marigold', 'latin.calendula': 'Calendula officinalis', 'codex.calendula': 'Warmth, patience and sunlight', 'fact.calendula': 'Yellow to orange ray florets surround the disk; its broad leaves are slightly hairy.',
  'species.snapdragon': 'Snapdragon', 'latin.snapdragon': 'Antirrhinum majus', 'codex.snapdragon': 'Energy and curiosity', 'fact.snapdragon': 'Closed, two-lipped corollas form an upright raceme, each resembling a small mouth.',
  'species.crocus': 'Spring crocus', 'latin.crocus': 'Crocus vernus', 'codex.crocus': 'The first greeting of spring', 'fact.crocus': 'Flowers arise from a corm and narrow leaves have a white midline. This is not the saffron-producing species.',
  'species.daffodil': 'Wild daffodil', 'latin.daffodil': 'Narcissus pseudonarcissus', 'codex.daffodil': 'Renewal and bright hope', 'fact.daffodil': 'Six tepals surround a trumpet-shaped corona above long, strap-like leaves.',
  'species.primrose': 'Common primrose', 'latin.primrose': 'Primula vulgaris', 'codex.primrose': 'Early spring and beginnings', 'fact.primrose': 'Wrinkled leaves form a basal rosette; the pale petals often have a shallow notch.',
  'species.pansy': 'Wild pansy', 'latin.pansy': 'Viola tricolor', 'codex.pansy': 'Remembrance and small kindnesses', 'fact.pansy': 'Five unequal petals carry dark veins that guide toward the flower centre.',
  'species.bleedingheart': 'Bleeding heart', 'latin.bleedingheart': 'Lamprocapnos spectabilis', 'codex.bleedingheart': 'Tenderness and affection', 'fact.bleedingheart': 'Heart-shaped flowers hang from arching stems, with pale inner petals projecting like drops.',
  'species.hibiscus': 'Chinese hibiscus', 'latin.hibiscus': 'Hibiscus rosa-sinensis', 'codex.hibiscus': 'Warmth and beauty in the moment', 'fact.hibiscus': 'Five broad petals surround a projecting staminal column topped by branching stigmas.',
  'species.birdofparadise': 'Bird of paradise', 'latin.birdofparadise': 'Strelitzia reginae', 'codex.birdofparadise': 'Freedom and distant horizons', 'fact.birdofparadise': 'A boat-shaped spathe supports orange sepals and blue petals above broad, long-stalked leaves.',
  'species.gazania': 'Treasure flower', 'latin.gazania': 'Gazania rigens', 'codex.gazania': 'Courage and sunshine', 'fact.gazania': 'Dark basal marks often ring the ray florets, and the heads open in strong sunlight.',
  'species.redhotpoker': 'Red-hot poker', 'latin.redhotpoker': 'Kniphofia uvaria', 'codex.redhotpoker': 'An upward flame of energy', 'fact.redhotpoker': 'Dense tubular flowers make a torch-shaped raceme; lower open florets often differ in colour from upper buds.',
  'species.desertrose': 'Desert rose', 'latin.desertrose': 'Adenium obesum', 'codex.desertrose': 'Resilience and stored strength', 'fact.desertrose': 'Its swollen stem base stores water, with funnel-shaped flowers near branch tips. It is not a true rose.',
  'species.marshmarigold': 'Marsh marigold', 'latin.marshmarigold': 'Caltha palustris', 'codex.marshmarigold': 'A bright wetland greeting', 'fact.marshmarigold': 'A wetland plant with heart- to kidney-shaped leaves; its bright yellow floral parts are sepals.',
  'species.forgetmenot': 'Water forget-me-not', 'latin.forgetmenot': 'Myosotis scorpioides', 'codex.forgetmenot': 'Remembrance and lasting affection', 'fact.forgetmenot': 'Five-lobed pale blue flowers have yellow eyes; curled flower clusters gradually uncoil as they bloom.',
  'species.astilbe': 'Chinese astilbe', 'latin.astilbe': 'Astilbe chinensis', 'codex.astilbe': 'Gentle companionship', 'fact.astilbe': 'Many tiny flowers form feathery panicles above compound leaves with toothed margins.',
  'species.cardinalflower': 'Cardinal flower', 'latin.cardinalflower': 'Lobelia cardinalis', 'codex.cardinalflower': 'Vivid enthusiasm', 'fact.cardinalflower': 'Red tubular flowers have two upper lobes and three prominent lower lobes; it favours moist habitats.',
  'species.arrowhead': 'Arrowhead', 'latin.arrowhead': 'Sagittaria sagittifolia', 'codex.arrowhead': 'Clarity and upward growth', 'fact.arrowhead': 'Emergent leaves are arrow-shaped; its white flowers have three petals and occur in whorls.',
})
// Research-backed visitor copy. Game roles are abstractions, not claims of guaranteed effects.
const VISITOR_INFO = {
  bee: {
    latin: 'Apis spp.', role: 'pollinator',
    source: 'https://www.xerces.org/pollinator-conservation/about-pollinators',
    zh: { diet: '花蜜与花粉。', habitat: '有花源和适宜巢址的环境；图中为蜜蜂属的概括形象。', relationship: '采食时可在花朵间携带花粉，是花园的传粉访客。', fact: '蜂类身体上的毛有助于收集和转移花粉；蜜蜂只是蜂类的一部分。' },
    en: { diet: 'Nectar and pollen.', habitat: 'Flower-rich habitats with suitable nesting resources; the drawing represents honey bees generally.', relationship: 'Carries pollen between flowers while foraging, contributing to pollination.', fact: 'Hairs help bees collect and transfer pollen. Honey bees are only one part of bee diversity.' },
  },
  butterfly: {
    latin: 'Pieris rapae', role: 'pollinator',
    source: 'https://butterfly-conservation.org/butterflies/small-white',
    zh: { diet: '成虫吸食花蜜；幼虫取食十字花科及旱金莲等寄主植物。', habitat: '花园、菜地及其他开放环境，白天访花。', relationship: '成虫是访花传粉者；保留幼虫寄主同样有助于完成它的生命周期。', fact: '菜粉蝶的白色前翅有较小的黑色翅尖与斑点，不要与体型较大的大菜粉蝶混淆。' },
    en: { diet: 'Adults take nectar; caterpillars feed on brassicas, nasturtiums and other host plants.', habitat: 'Gardens, allotments and other open habitats; visits flowers by day.', relationship: 'Adults can transfer pollen. Suitable caterpillar host plants also support its life cycle.', fact: 'The Small White has small dark forewing tips and spots. It is distinct from the larger Large White.' },
  },
  ladybug: {
    latin: 'Coccinella septempunctata', role: 'guardian',
    source: 'https://www.rhs.org.uk/biodiversity/ladybirds',
    zh: { diet: '主要捕食蚜虫。', habitat: '常见于有猎物的花园枝叶间。', relationship: '主要生态角色是捕食者，帮助维持食物网；游戏将它作为守护访客，不作为专职传粉者。', fact: '七星瓢虫成虫通常为红色鞘翅、七枚黑斑，体长约 5–8 毫米。不是所有瓢虫都具有同样食性。' },
    en: { diet: 'Primarily aphids.', habitat: 'Often found on garden foliage where prey is available.', relationship: 'Primarily a predator in the food web; represented as a garden guardian rather than a dedicated pollinator.', fact: 'Seven-spot ladybirds are usually red with seven black spots and measure about 5–8 mm. Not all ladybirds share the same diet.' },
  },
  dragonfly: {
    latin: 'Anisoptera', role: 'waterside',
    source: 'https://british-dragonflies.org.uk/odonata/life-cycle-and-biology/',
    zh: { diet: '幼虫捕食水中小动物；成虫捕捉飞行昆虫。', habitat: '池塘、河流、湿地及周边环境；晴好天气更容易观察成虫。', relationship: '不是传粉者。水边植物可供幼虫攀爬羽化，保留水陆交界栖地能支持它的生活。', fact: '蜻蜓没有蛹期，直接从水生幼虫羽化为成虫；水边茎叶上可能留下空的幼虫蜕皮。' },
    en: { diet: 'Larvae hunt aquatic animals; adults catch flying insects.', habitat: 'Ponds, rivers, wetlands and surrounding habitats; adults are easier to observe in fine weather.', relationship: 'Not a pollinator. Waterside plants provide supports for emergence, linking aquatic and terrestrial habitat.', fact: 'Dragonflies have no pupal stage. An empty larval skin may remain on a waterside stem after emergence.' },
  },
  firefly: {
    latin: 'Lampyridae', role: 'guardian',
    source: 'https://www.xerces.org/endangered-species/fireflies/about',
    zh: { diet: '许多幼虫捕食软体无脊椎动物；成虫食性随种类变化。', habitat: '许多种依赖湿润土壤、落叶或湿地；图中采用暮夜闪光型。', relationship: '本游戏不把萤火虫作为传粉者。保留湿润微生境、减少夜间光干扰，可作为暗夜生态观察目标。', fact: '萤火虫其实是甲虫。所有萤火虫幼虫都能发光，但并非所有种类的成虫都会发光或在夜间活动。' },
    en: { diet: 'Many larvae prey on soft-bodied invertebrates; adult diets vary by species.', habitat: 'Many use moist soil, leaf litter or wetlands; this drawing represents a dusk- or night-flashing type.', relationship: 'Not treated as a pollinator here. Moist microhabitats and reduced light disturbance support dark-sky wildlife observation.', fact: 'Fireflies are beetles. Their larvae produce light, but not every species has glowing or night-active adults.' },
  },
  moth: {
    latin: 'Sphingidae', role: 'pollinator',
    source: 'https://www.xerces.org/pollinator-conservation/about-pollinators',
    zh: { diet: '本图采用有长喙、吸食花蜜的天蛾类型；不同种幼虫需要不同寄主植物。', habitat: '有合适蜜源与幼虫寄主的环境；游戏采用夜间访花型。', relationship: '部分天蛾访花时参与传粉。为夜间访花者保留蜜源，可成为夜花种植与观察的目标。', fact: '这是天蛾科的概括形象，不代表一种具体天蛾；并非所有天蛾都在夜间活动，蜂鸟鹰蛾就是白天访花的例子。' },
    en: { diet: 'This depiction represents a long-tongued nectar-feeding hawk-moth; caterpillar host plants vary by species.', habitat: 'Habitats with suitable nectar plants and larval hosts; the game represents a nocturnal flower-visiting type.', relationship: 'Some hawk-moths contribute to pollination while feeding. Nectar for night visitors gives night-flowering plants a role in the garden.', fact: 'This is a family-level hawk-moth depiction, not a named species. Not all hawk-moths fly at night: the hummingbird hawk-moth visits flowers by day.' },
  },
  robin: {
    latin: 'Erithacus rubecula', role: 'guardian',
    source: 'https://www.bto.org/learn/about-birds/birdfacts/robin',
    zh: { diet: '以地面小型无脊椎动物等为食；不是以花蜜为主的访花鸟。', habitat: '林地、灌丛、乡村及城镇；雪原是游戏场景，不代表它专栖高山雪地。', relationship: '不是通常的花卉传粉者。可作为鸟类观察和栖地营造的访客，鼓励保留遮蔽与多样植被。', fact: '这里的知更鸟指欧亚鸲，橙红色胸前很醒目；它与英文也叫 robin 的美洲旅鸫不是同一种鸟。' },
    en: { diet: 'Small ground-dwelling invertebrates and other foods; not primarily a nectar-feeding bird.', habitat: 'Woodland, scrub, villages and towns; the snowfield is a game setting, not a claim of alpine specialization.', relationship: 'Not a typical flower pollinator. A visitor for bird observation and habitat care, supported by shelter and varied vegetation.', fact: 'This is the European robin, recognized by its orange-red breast, not the American robin that shares its English common name.' },
  },
  honeycreeper: {
    latin: 'Drepanis coccinea', role: 'pollinator',
    source: 'https://dlnr.hawaii.gov/wildlife/birds/iiwi/',
    zh: { diet: '主要花蜜，也取食小型节肢动物。', habitat: '夏威夷的中湿、湿润森林，常与 ʻōhiʻa 和 koa 林相关；不是裸露熔岩或硫雾环境。', relationship: 'ʻIʻiwi 是 ʻōhiʻa（红火山花）的重要传粉鸟，能把这种花与火山岛森林的生态关系连接起来。', fact: '朱红色身体、黑色翅尾和粉红色弯长喙是它的特征。它会寻找开花的 ʻōhiʻa 树，有时飞行很远。' },
    en: { diet: 'Mostly nectar, supplemented with small arthropods.', habitat: 'Mesic and wet Hawaiian forests associated with ʻōhiʻa and koa, not bare lava or sulfur fumes.', relationship: 'The ʻiʻiwi is an important ʻōhiʻa pollinator, linking this flower to the ecology of Hawaiian island forests.', fact: 'Vermilion plumage, black wings and tail, and a long pink downcurved bill identify this bird. It may travel far to find flowering ʻōhiʻa.' },
  },
  kingfisher: {
    latin: 'Alcedo atthis', role: 'waterside',
    source: 'https://www.bto.org/learn/about-birds/birdfacts/kingfisher',
    zh: { diet: '捕食水中猎物，以捕鱼著称。', habitat: '低地河流及静水水域，常停在水边枝条上。', relationship: '不是传粉者。适合作为水岸观察与栖地任务的访客；它的出现不能单独证明水质合格。', fact: '普通翠鸟颜色鲜艳，却不容易在栖枝上被发现；尖细叫声常比蓝绿色身影先被注意到。' },
    en: { diet: 'Aquatic prey; well known for fishing.', habitat: 'Lowland rivers and still waters, often using waterside perches.', relationship: 'Not a pollinator. A visitor for waterside observation and habitat goals; one sighting is not a water-quality test.', fact: 'Despite its bright plumage, a perched Common kingfisher can be hard to spot. Its piping call often reveals it first.' },
  },
}

    Object.assign(VISITOR_INFO, {
      bumblebee: {latin:'Bombus terrestris',role:'pollinator',source:'https://en.wikipedia.org/wiki/Bombus_terrestris',
        zh:{diet:'成虫取食花蜜、采集花粉。',habitat:'欧洲及邻近地区的草地、花园等；常在地下筑巢。',relationship:'重要的访花传粉昆虫；多毛身体有助携带花粉。',fact:'粗壮黑黄条带是辨识线索；蜂后与工蜂尾端颜色可有差异，图中采用浅色尾端工蜂形象。'},
        en:{diet:'Adults feed on nectar and collect pollen.',habitat:'Grasslands and gardens in Europe and nearby regions; nests are often underground.',relationship:'A flower-visiting pollinator with a hairy body that carries pollen.',fact:'Stout black-and-yellow markings are distinctive; queen and worker tail colours differ. This drawing uses a pale-tailed worker.'}},
      swallowtail: {latin:'Papilio machaon',role:'pollinator',source:'https://en.wikipedia.org/wiki/Papilio_machaon',
        zh:{diet:'成虫吸蜜；幼虫常用伞形科寄主，随地区种群而异。',habitat:'分布广泛，常见于开放草地等环境。',relationship:'成虫访花，幼虫另需合适的寄主植物。游戏蜜源角色不能代替真实寄主要求。',fact:'黄色底翅、黑纹、后翅尾突和红眼斑构成它的辨识特征。'},
        en:{diet:'Adults drink nectar; caterpillars often use umbellifer hosts, varying by population.',habitat:'Widely distributed, often in open habitats.',relationship:'Adults visit flowers; caterpillars need suitable hosts. Game nectar roles do not replace real host requirements.',fact:'Yellow wings, black patterning, hindwing tails and red eyespots distinguish it.'}},
      hawkmoth: {latin:'Macroglossum stellatarum',role:'pollinator',source:'https://en.wikipedia.org/wiki/Macroglossum_stellatarum',
        zh:{diet:'成虫用长喙吸蜜；幼虫常取食拉拉藤等寄主。',habitat:'有适合花源的花园、草地等环境。',relationship:'悬停访花并参与传粉，活动方式看起来像小蜂鸟。',fact:'它主要昼行，有褐色前翅和橙色后翅；与图鉴中的夜行型天蛾不同。'},
        en:{diet:'Adults take nectar with a long proboscis; caterpillars often feed on bedstraws.',habitat:'Gardens and other habitats with suitable flowers.',relationship:'Hovers to feed and contributes to pollination, resembling a tiny hummingbird.',fact:'Primarily day-flying with brown forewings and orange hindwings, distinct from the nocturnal hawk-moth entry.'}},
      hoverfly: {latin:'Episyrphus balteatus',role:'pollinator',source:'https://en.wikipedia.org/wiki/Episyrphus_balteatus',
        zh:{diet:'成虫取食花蜜与花粉；幼虫捕食蚜虫。',habitat:'花园、草地和林缘等有花植物的环境。',relationship:'成虫是传粉访客；幼虫在食物网中是捕食者，两阶段角色不同。',fact:'腹部橙黑相间、外形拟蜂，但属于双翅目，只有一对功能性翅。'},
        en:{diet:'Adults eat nectar and pollen; larvae prey on aphids.',habitat:'Flower-rich gardens, grasslands and woodland edges.',relationship:'Adults pollinate, while larvae are predators: different life stages play different roles.',fact:'Orange-and-black abdominal bands mimic a bee, but it is a fly with one pair of functional wings.'}},
    })
    for (const [id, info] of Object.entries(VISITOR_INFO)) {
      for (const field of ['diet','habitat','relationship','fact']) {
        zh[`guest.${id}.${field}`] = info.zh[field]
        en[`guest.${id}.${field}`] = info.en[field]
      }
    }
// Special commissions: optional, period-stable requests with explicit consumption.
const COMMISSION_KINDS = ['bouquet','loan','breeding','watch']
function commissionState(state,now) {
  const period=ecologyPeriod(now)
  return state.commissions?.period===period ? state.commissions : {period,accepted:{},completed:[]}
}
function specialCommissions(state,now) {
  const period=ecologyPeriod(now), grounds=ecologyState(state,now).grounds
  const species=SPECIES.filter(item=>grounds.includes(SCENE_ID_OF.get(item.id))).slice().sort((a,b)=>hashUnit(period,SPECIES.indexOf(a),807)-hashUnit(period,SPECIES.indexOf(b),807))
  const hours=Array.from({length:6},(_,i)=>period*ECO_PERIOD_MS+i*3600000)
  const day=hours.some(time=>!isNight(time))
  const visitors=VISITORS.filter(visitor=>visitor.scenes.some(id=>grounds.includes(id))&&(day?visitor.special:visitor.when==='night'))
  const visitor=visitors[Math.floor(hashUnit(period,81,2)*visitors.length)]
  return COMMISSION_KINDS.map(kind=>({id:`special:${period}:${kind}`,kind,period,endsAt:(period+1)*ECO_PERIOD_MS,
    warm:period%2===0, species:kind==='loan'?species.slice(0,2).map(item=>item.id):[], visitor:kind==='watch'?visitor?.id:undefined}))
}
function acceptCommission(state,id,now) {
  const offer=specialCommissions(state,now).find(item=>item.id===id), current=commissionState(state,now)
  if(!offer||current.accepted[id]||current.completed.includes(id))return null
  const baseline={at:now,study:Object.fromEntries(Object.entries(state.study??{}).map(([key,value])=>[key,value.observations])),visitors:{...state.visitors}}
  return {...state,commissions:{...current,accepted:{...current.accepted,[id]:baseline}}}
}
function commissionProgress(state,offer,now,indices=[]) {
  const current=commissionState(state,now), accepted=current.accepted[offer.id]
  const active=accepted!==undefined&&offer.period===current.period&&!current.completed.includes(offer.id)
  const residents=[]
  for(const slot of Object.values(state.scenes))for(const plot of slot.plots)if(plot?.resident&&plot.growthMs>=growMsOf(SPECIES_BY_ID.get(plot.species)))residents.push(plot)
  let ready=false,have=0,total=1,seedKey=null
  let reward={coins:0,xp:8,ribbons:0,seals:0,trust:1}
  if(offer.kind==='bouquet') {
    total=3
    const unique=Array.isArray(indices)&&indices.length===new Set(indices).size&&indices.every(index=>Number.isInteger(index)&&index>=0&&index<state.basket.length)
    const items=unique?indices.map(index=>state.basket[index]):[]
    const eligible=items.every(item=>isPlainBloom(item)&&isWarm(paletteOf(SPECIES_BY_ID.get(item.species),item.variant).petal)===offer.warm)
    have=eligible?new Set(items.map(item=>item.species)).size:0
    ready=active&&unique&&eligible&&items.length===3&&have===3
    reward={...reward,coins:ready?Math.round(items.reduce((sum,item)=>sum+itemValue(item),0)*1.8)+25:0,xp:12,trust:2}
  } else if(offer.kind==='loan') {
    total=offer.species.length
    have=offer.species.filter(id=>residents.some(plot=>plot.species===id)&&(state.study?.[id]?.observations??0)>(accepted?.study[id]??0)).length
    ready=active&&total===2&&have===total
    reward={...reward,ribbons:2,trust:2}
  } else if(offer.kind==='breeding') {
    const plot=residents.find(plot=>plot.tint&&plot.observedAt>accepted?.at&&(state.study?.[plot.species]?.observations??0)>(accepted?.study[plot.species]??0))
    if(plot)seedKey=`${plot.species}~${plot.tint}`
    have=plot?1:0;ready=active&&!!plot;reward={...reward,seals:1,trust:3,fertilizer:1}
  } else if(offer.kind==='watch') {
    have=offer.visitor&&((state.visitors?.[offer.visitor]??0)>(accepted?.visitors[offer.visitor]??0))?1:0
    ready=active&&have===1;reward={...reward,seals:2,trust:2,compost:1}
  }
  return {active,ready,have,total,reward,seedKey}
}
function completeCommission(state,id,now,indices=[]) {
  const offer=specialCommissions(state,now).find(item=>item.id===id)
  if(!offer)return null
  const progress=commissionProgress(state,offer,now,indices)
  if(!progress.ready)return null
  const current=commissionState(state,now), reward=progress.reward
  const consumed=offer.kind==='bouquet'?new Set(indices):new Set()
  const seeds={...state.seeds}
  if(progress.seedKey)seeds[progress.seedKey]=(seeds[progress.seedKey]??0)+1
  return {...state,coins:state.coins+reward.coins,xp:state.xp+reward.xp,ribbons:(state.ribbons??0)+reward.ribbons,
    researchSeals:(state.researchSeals??0)+reward.seals,patronage:(state.patronage??0)+reward.trust,
    basket:consumed.size?state.basket.filter((_,index)=>!consumed.has(index)):state.basket,seeds,
    bag:{...state.bag,fertilizer:(state.bag.fertilizer??0)+(reward.fertilizer??0),compost:(state.bag.compost??0)+(reward.compost??0)},
    commissions:{...current,completed:[...current.completed,id]},
    commissionLog:[...(state.commissionLog??[]),{id,kind:offer.kind,at:now,trust:reward.trust}].slice(-60)}
}
function sanitizeCommissions(raw,now) {
  const period=ecologyPeriod(now), empty={period,accepted:{},completed:[]}
  if(!raw||raw.period!==period)return empty
  const valid=id=>COMMISSION_KINDS.some(kind=>id===`special:${period}:${kind}`)
  const accepted={}
  for(const [id,value] of Object.entries(raw.accepted&&typeof raw.accepted==='object'?raw.accepted:{})) {
    if(!valid(id)||!value||typeof value!=='object')continue
    accepted[id]={at:finiteOr(value.at,now),study:Object.fromEntries(Object.entries(value.study&&typeof value.study==='object'?value.study:{}).filter(([key])=>SPECIES_BY_ID.has(key)).map(([key,n])=>[key,Math.floor(finiteOr(n,0))])),visitors:sanitizeVisitors(value.visitors)}
  }
  return {period,accepted,completed:Array.isArray(raw.completed)?[...new Set(raw.completed.filter(valid))]:[]}
}
function sanitizeCommissionLog(raw) {
  return Array.isArray(raw)?raw.filter(item=>item&&typeof item.id==='string'&&COMMISSION_KINDS.includes(item.kind)&&Number.isFinite(item.at)).slice(-60).map(item=>({id:item.id.slice(0,90),kind:item.kind,at:Math.max(0,item.at),trust:Math.min(3,Math.floor(finiteOr(item.trust,0)))})):[]
}
function specialVisitorEligible(visitor,plot,state,weather) {
  if(!visitor.special)return true
  if(!plot||plot.moisture<50)return false
  const profile=ecoProfile(plot.species), ecology=state?gardenEcology(state,state.lastTick):{species:0,roleCoverage:0}
  if(visitor.id==='bumblebee')return ['nectar','pollen'].includes(profile?.role)||['snapdragon','cardinalflower','pansy'].includes(plot.species)
  if(!plot.resident)return false
  if(visitor.id==='swallowtail')return profile?.role==='nectar'&&ecology.species>=3&&weather==='clear'
  if(visitor.id==='hawkmoth')return ['snapdragon','plumeria','lily','redhotpoker','cardinalflower'].includes(plot.species)
  if(visitor.id==='hoverfly')return ecology.roleCoverage>=2
  return false
}

Object.assign(zh,{
 'commission.title':'特别来信','commission.intro':'每 6 小时换一批委托。先接受来信，再完成新观察；过期没有惩罚。仅定制花束消耗你亲自选中的普通花，其他委托保留活株。',
 'commission.bouquet':'花艺师 · 定制花束','commission.loan':'植物园 · 活株借展','commission.breeding':'育种师 · 种苗交流','commission.watch':'自然学家 · 特别观察',
 'commission.desc.bouquet':'挑选 3 个不同品种、符合主题色的普通花各 1 朵。奇珍、仙品和杂交花不会被误选。',
 'commission.desc.loan':'接受后各观察一次指定品种，并让两种留园株保持盛开。只登记借展档案，不移走植株。',
 'commission.desc.breeding':'接受后观察一株盛开的杂交留园株。交流后保留母株，并获得同类型的杂交种子。',
 'commission.desc.watch':'接受后遇见这位访客。点击名字可查阅出现线索；仅本次来信之后的遇见有效。',
 'commission.accept':'接受来信','commission.active':'进行中','commission.done':'已完成','commission.expired':'来信或选花已变化，请重新查看。','commission.submit':'完成委托','commission.confirm':'确认交付选中的 3 朵花','commission.confirmKeep':'确认记录 · 保留所有植株',
 'commission.pick':'选花清单 · {n}/3','commission.empty':'花篮暂无符合主题的普通花。','commission.progress':'进度 {n}/{total}','commission.theme':'本期主题：{name}',
 'commission.reward.bouquet':'报酬：所选花基础价值 ×1.8 +25 金币、12 经验、2 声望','commission.reward.loan':'报酬：2 绶带、8 经验、2 声望','commission.reward.breeding':'报酬：同类型杂交种子 ×1、肥料 ×1、研究印记 ×1、8 经验、3 声望','commission.reward.watch':'报酬：研究印记 ×2、堆肥 ×1、8 经验、2 声望',
 'commission.trust':'委托声望 {n}','commission.completed':'来信已完成，花园的故事又多了一页。','commission.journal':'往来信笺（最近 {n} 封）','commission.record':'{date} · 声望 +{n}',
 'visitor.special':'特殊访客','visitor.bumblebee':'欧洲熊蜂','visitor.swallowtail':'金凤蝶','visitor.hawkmoth':'蜂鸟鹰蛾','visitor.hoverfly':'细扁食蚜蝇',
 'visitor.clue':'游戏出现线索','visitor.clue.bumblebee':'白天 · 草原、雪原或湖畔 · 盛开的蜜源/花粉花或三色堇 · 湿度至少 50%；普通成熟花也可吸引。',
 'visitor.clue.swallowtail':'晴天白昼 · 草原或湖畔 · 至少 3 种湿润盛开的留园株 · 当前花为蜜源角色。',
 'visitor.clue.hawkmoth':'白天 · 草原、火山口或湖畔 · 留园的金鱼草、鸡蛋花、百合、火炬花或鲜红半边莲 · 湿度至少 50%。',
 'visitor.clue.hoverfly':'白天不下雨 · 草原或湖畔 · 湿润盛开的留园株覆盖至少 2 种生态角色 · 当前株湿度至少 50%。',
 'visitor.chanceNote':'满足条件后会进入低权重候选池，不保证立即出现。',
 'trait.fasciated':'缀化','trait.radial':'辐射花冠','trait.double':'重瓣','trait.leafy':'花叶化',
 'trait.fasciated.cause':'游戏条件：鉴定前有至少 3 次访客和 2 次施肥。','trait.radial.cause':'游戏条件：金鱼草、鲜红半边莲或三色堇在鉴定前被特殊熊蜂访过。',
 'trait.double.cause':'游戏条件：鉴定前已授粉，并施肥至少一次。','trait.leafy.cause':'游戏条件：鉴定前有至少 2 次护园访客，在雨天鉴定。',
 'trait.fasciated.clue':'常受照料、访客很多的那一株','trait.radial.clue':'两侧对称的小花，遇上特殊熊蜂','trait.double.clue':'一次施肥，一次授粉','trait.leafy.clue':'雨中，护园访客再次来过',
 'trait.fasciated.fact':'缀化是生长点异常形成扁带、脊状等形态的现象；真实成因多样，不能由照料次数推断。',
 'trait.radial.fact':'辐射对称化（peloria）指原本两侧对称的花变成辐射对称；并非任何花变大或变圆都属于它。',
 'trait.double.fact':'重瓣花具有额外花瓣，有些来自雄蕊花瓣化。部分重瓣品种可供访客的花粉、花蜜较少。',
 'trait.leafy.fact':'花叶化指花器官发育成叶状结构，与只变绿的绿变不同；真实情况下可能涉及发育、环境或病原影响。',
 'trait.boundary':'奇珍获取条件属于游戏创作，不表示浇水、施肥或动物访问会在现实中造成这些变异。霜晶、熔火等为幻想款。',
 'trait.guide':'奇珍观察指南','trait.source':'形态资料（Wiki）',
})
Object.assign(en,{
 'commission.title':'Special letters','commission.intro':'New requests arrive every six hours. Accept first, then make new observations; expiry has no penalty. Only bespoke bouquets consume the ordinary blooms you explicitly select. Other requests keep living plants.',
 'commission.bouquet':'Florist · Bespoke bouquet','commission.loan':'Botanic garden · Living exhibit','commission.breeding':'Breeder · Seed exchange','commission.watch':'Naturalist · Special sighting',
 'commission.desc.bouquet':'Select one ordinary bloom from each of three different species in the requested colour theme. Curiosities, spirit blooms and hybrids are excluded.',
 'commission.desc.loan':'After accepting, observe each requested species and keep both resident species in bloom. The exhibit is recorded without moving your plants.',
 'commission.desc.breeding':'After accepting, observe a blooming hybrid resident. Keep the parent and receive one matching hybrid seed.',
 'commission.desc.watch':'Meet this visitor after accepting. Open its name for appearance clues; earlier lifetime sightings do not count.',
 'commission.accept':'Accept letter','commission.active':'In progress','commission.done':'Completed','commission.expired':'The letter or flower selection changed. Please review it again.','commission.submit':'Complete request','commission.confirm':'Confirm delivery of these 3 blooms','commission.confirmKeep':'Confirm record · keep every plant',
 'commission.pick':'Selected blooms · {n}/3','commission.empty':'No eligible ordinary blooms in the basket.','commission.progress':'Progress {n}/{total}','commission.theme':'Theme: {name}',
 'commission.reward.bouquet':'Reward: selected base value ×1.8 +25 coins, 12 XP, 2 reputation','commission.reward.loan':'Reward: 2 ribbons, 8 XP, 2 reputation','commission.reward.breeding':'Reward: 1 matching hybrid seed, 1 fertiliser, 1 research seal, 8 XP, 3 reputation','commission.reward.watch':'Reward: 2 research seals, 1 compost, 8 XP, 2 reputation',
 'commission.trust':'Patron reputation {n}','commission.completed':'Letter completed: another page in your garden story.','commission.journal':'Correspondence (latest {n})','commission.record':'{date} · reputation +{n}',
 'visitor.special':'Special visitor','visitor.bumblebee':'Buff-tailed bumblebee','visitor.swallowtail':'Old World swallowtail','visitor.hawkmoth':'Hummingbird hawk-moth','visitor.hoverfly':'Marmalade hoverfly',
 'visitor.clue':'Game appearance clues','visitor.clue.bumblebee':'Daytime · meadow, snowfield or lake · blooming nectar/pollen-role flower or pansy · at least 50% moisture; residency is not required.',
 'visitor.clue.swallowtail':'Sunny daytime · meadow or lake · at least three moist blooming resident species · a nectar-role host flower.',
 'visitor.clue.hawkmoth':'Daytime · meadow, crater or lake · resident snapdragon, plumeria, lily, red-hot poker or cardinal flower · at least 50% moisture.',
 'visitor.clue.hoverfly':'Dry daytime · meadow or lake · at least two ecological roles among moist blooming residents · host moisture at least 50%.',
 'visitor.chanceNote':'Meeting the conditions adds it to the low-weight visitor pool; an immediate visit is not guaranteed.',
 'trait.fasciated':'Crested','trait.radial':'Radial corolla','trait.double':'Double-flowered','trait.leafy':'Leafy flower',
 'trait.fasciated.cause':'Game condition: at least three visits and two feeds before identification.','trait.radial.cause':'Game condition: a special bumblebee visited a snapdragon, cardinal flower or pansy before identification.',
 'trait.double.cause':'Game condition: pollinated and fed at least once before identification.','trait.leafy.cause':'Game condition: at least two guardian visits, identified in rain.',
 'trait.fasciated.clue':'Well tended, often visited','trait.radial.clue':'A bilateral flower meets a special bumblebee','trait.double.clue':'One feed and a pollen visit','trait.leafy.clue':'Two guardian visits, then rain',
 'trait.fasciated.fact':'Fasciation changes a growing point into flattened or crested forms. It has varied real causes; care counts cannot diagnose them.',
 'trait.radial.fact':'Peloria is radial symmetry developing in a normally bilaterally symmetrical flower; it does not mean any flower simply getting larger or rounder.',
 'trait.double.fact':'Double flowers have extra petals, sometimes through conversion of stamens. Some double varieties offer less accessible pollen or nectar.',
 'trait.leafy.fact':'Phyllody transforms floral organs into leaf-like structures, unlike greening alone. Real cases can involve developmental, environmental or pathogen factors.',
 'trait.boundary':'Discovery conditions are fictional game rules, not claims that watering, feeding or visitors cause these changes in real plants. Frost and ember forms are fantasy varieties.',
 'trait.guide':'Curiosity field guide','trait.source':'Morphology source (Wiki)',
})

function SpecialCommissionBoard({state,t,clock,onChange,onSpecies,onVisitor}) {
 const offers=specialCommissions(state,clock),current=commissionState(state,clock)
 const [selected,setSelected]=React.useState([]),[armed,setArmed]=React.useState(null),[notice,setNotice]=React.useState('')
 React.useEffect(()=>{setSelected(items=>items.filter(item=>state.basket.includes(item)));setArmed(null)},[state.basket])
 React.useEffect(()=>{setSelected([]);setArmed(null)},[current.period])
 function accept(id){const next=acceptCommission(getState(),id,Date.now());if(next){onChange(next);setArmed(null);setSelected([])}}
 function finish(offer){
  const before=getState(),now=Date.now(),indices=selected.map(item=>before.basket.indexOf(item))
  const live=specialCommissions(before,now).find(item=>item.id===offer.id)
  if(!live||!commissionProgress(before,live,now,indices).ready){setArmed(null);setNotice(t('commission.expired'));return}
  const signature=offer.kind==='bouquet'?JSON.stringify(selected.map(item=>[itemKey(item),item.dna])):offer.id
  if(armed?.id!==offer.id||armed.signature!==signature||armed.until<now){setArmed({id:offer.id,signature,until:now+5000});return}
  const next=completeCommission(before,offer.id,now,indices);setArmed(null)
  if(next){onChange(next);setSelected([]);setNotice(t('commission.completed'))}
 }
 return h('section',{className:'fg-section',id:'fg-special-commissions',tabIndex:-1},
  h('div',{className:'fg-sectionHead'},h('h2',{className:'fg-sectionTitle'},t('commission.title')),h('span',{className:'fg-chip'},t('commission.trust',{n:state.patronage??0}))),
  h('p',{className:'fg-hint'},t('commission.intro')),
  h('div',{className:'fg-ecoProjects'},offers.map(offer=>{
   const indices=selected.map(item=>state.basket.indexOf(item)),progress=commissionProgress(state,offer,clock,indices),done=current.completed.includes(offer.id)
   const eligible=state.basket.filter(item=>isPlainBloom(item)&&isWarm(paletteOf(SPECIES_BY_ID.get(item.species),item.variant).petal)===offer.warm)
   return h('article',{key:offer.id,className:'fg-ecoProject','data-commission':offer.kind},
    h('h3',null,t(`commission.${offer.kind}`)),h('p',{className:'fg-hint'},t(`commission.desc.${offer.kind}`)),
    h('p',{className:'fg-hint'},t('show.left',{n:formatDuration(offer.endsAt-clock,t)})),
    offer.kind==='bouquet'?h('p',{className:'fg-note'},t('commission.theme',{name:t(offer.warm?'show.theme.warm':'show.theme.cool')})):null,
    offer.kind==='loan'?h('div',{className:'fg-ecoTargets'},offer.species.map(id=>h('button',{type:'button',key:id,className:'fg-btn fg-btnSmall',onClick:()=>onSpecies(id)},t(`species.${id}`)))):null,
    offer.kind==='watch'&&offer.visitor?h('button',{type:'button',className:'fg-btn fg-btnSmall',onClick:()=>onVisitor(offer.visitor)},t(`visitor.${offer.visitor}`)):null,
    h('p',{className:'fg-hint'},t(`commission.reward.${offer.kind}`)),
    progress.active&&offer.kind==='bouquet'?h('details',{className:'fg-ecoDetails'},h('summary',null,t('commission.pick',{n:selected.length})),
      eligible.length===0?h('p',{className:'fg-hint'},t('commission.empty')):eligible.map((item,index)=>h('button',{type:'button',key:index,className:'fg-btn fg-btnSmall','aria-pressed':selected.includes(item),disabled:!selected.includes(item)&&(selected.length>=3||selected.some(other=>other.species===item.species)),onClick:()=>{setArmed(null);setSelected(items=>items.includes(item)?items.filter(other=>other!==item):[...items,item])}},selected.includes(item)?'✓ ':'○ ',bloomName(item,t),' · ',t(`variant.${item.variant}`),' #',index+1))):null,
    progress.active?h('span',{className:'fg-note'},t('commission.progress',{n:progress.have,total:progress.total})):null,
    offer.kind==='bouquet'&&progress.ready?h('strong',null,t('order.reward',{coins:progress.reward.coins,xp:progress.reward.xp})):null,
    h('button',{type:'button',className:armed?.id===offer.id&&armed.until>=clock?'fg-btn fg-btnDanger':'fg-btn',disabled:done||(progress.active&&!progress.ready),onClick:()=>progress.active?finish(offer):accept(offer.id)},done?t('commission.done'):!progress.active?t('commission.accept'):armed?.id===offer.id&&armed.until>=clock?t(offer.kind==='bouquet'?'commission.confirm':'commission.confirmKeep'):t('commission.submit')))
  })),
  (state.commissionLog??[]).length?h('details',{className:'fg-ecoDetails'},h('summary',null,t('commission.journal',{n:state.commissionLog.length})),h('div',{className:'fg-journal'},state.commissionLog.slice(-8).reverse().map(entry=>h('div',{key:entry.id,className:'fg-journalEntry'},t(`commission.${entry.kind}`),h('span',null,t('commission.record',{date:new Date(entry.at).toLocaleDateString(),n:entry.trust})))))):null,
  h('p',{role:'status',className:'fg-sectionOk'},notice))
}

// Long-lived garden UI; integrated into the client factory.
const ECO_PROFILES = Object.fromEntries([
  ['dandelion','pollen',0,'bee'],['daisy','nectar',0,'butterfly'],['cherry','shelter',0,'ladybug'],['tulip','pollen',0,'bee'],['lavender','nectar',1,'bee'],['poppy','pollen',1,'bee'],['sunflower','seed',2,'ladybug'],['lily','night',1,'moth'],['rose','shelter',1,'ladybug'],['hydrangea','shelter',1,'butterfly'],
  ['snowdrop','pollen',3,'robin'],['hellebore','nectar',3,'robin'],['plum','shelter',3,'robin'],['edelweiss','pollen',1,'robin'],['camellia','shelter',3,'robin'],
  ['cactus','pollen',1,'bee'],['lehua','nectar',1,'honeycreeper'],['agave','nectar',2,'moth'],['silversword','seed',1,'bee'],['plumeria','night',1,'moth'],
  ['pickerel','nectar',1,'bee'],['loosestrife','nectar',2,'butterfly'],['iris','water',0,'dragonfly'],['waterlily','water',1,'kingfisher'],['lotus','seed',1,'dragonfly'],
  ['cosmos','nectar',2,'butterfly'],['zinnia','nectar',2,'butterfly'],['cornflower','seed',1,'ladybug'],['calendula','pollen',0,'bee'],['snapdragon','nectar',0,'bee'],
  ['crocus','pollen',0,'robin'],['daffodil','pollen',0,'robin'],['primrose','nectar',0,'robin'],['pansy','shelter',0,'robin'],['bleedingheart','shelter',0,'robin'],
  ['hibiscus','nectar',1,'honeycreeper'],['birdofparadise','nectar',0,'honeycreeper'],['gazania','pollen',1,'bee'],['redhotpoker','nectar',2,'honeycreeper'],['desertrose','shelter',1,'moth'],
  ['marshmarigold','water',0,'dragonfly'],['forgetmenot','water',0,'butterfly'],['astilbe','shelter',1,'firefly'],['cardinalflower','nectar',2,'butterfly'],['arrowhead','water',1,'kingfisher'],
].map(([id,role,season,visitor]) => [id,{role,season,visitor}]))

Object.assign(zh, {
  'eco.title':'活着的花园', 'eco.guide':'留一株花，慢慢认识它',
  'eco.intro':'开花后可「留园」：花不会被消耗，保留自己的外观与经历。浇水、付费观察、修剪复花，逐步写出每个品种的研究笔记。留园株约 45 分钟才会干透，缺水只暂停观察，不会死亡。',
  'eco.role.nectar':'蜜源花境','eco.role.pollen':'花粉花境','eco.role.seed':'种实观察','eco.role.shelter':'庇护花境','eco.role.water':'水岸花境','eco.role.night':'夜访花境',
  'eco.roles':'生态角色 {n}/6','eco.diversity':'留园 {n} 株 · {species} 个品种','eco.bonus':'访客出现率 +{n}%','eco.season':'本期花季：{season}',
  'eco.rules':'生态角色、访客偏好、6 小时花季和复花速度是游戏设计，并非真实植物的生长日历或地域共生关系。花境搭配最多增加 12 个百分点访客出现率；湿度低于 30% 的留园株暂不计入。永久生态研究可额外增加最多 4 个百分点，合计显示在上方。',
  'eco.purpose':'花园里的位置','eco.affinity':'游戏访客偏好：{name}','eco.flowerSeason':'主题花季：{name}',
  'eco.retain':'留园养成','eco.resident':'留园活株','eco.retained':'{name}留在花园了。它的外观与第一次鉴定结果将一直保留。',
  'eco.observe':'观察养护 · {n} 金币','eco.observed':'记录{name}：研究累计 {n} 次','eco.cooldown':'下次观察：{n}','eco.needWater':'湿度至少 30% 才能观察',
  'eco.rebloom':'修剪复花 · {n} 金币','eco.rebloomed':'{name}开始新一轮生长，下一次观察额外 +1 研究记录。','eco.rebloomNote':'复花保留同一株的 DNA 和奇珍形态；新花期首次观察 +2 研究记录，其后每 10 分钟可观察 +1。',
  'eco.history':'养护 {n} 次 · 复花 {cycles} 轮','eco.retire':'结束留园并收获','eco.retireConfirm':'确认结束留园？','eco.error':'暂时无法进行：请检查湿度、成熟状态、冷却和金币。',
  'eco.study':'品种研究','eco.notes':'已研究 {n}/{total} 种','eco.observations':'研究记录 {n} 次','eco.level.0':'尚未观察','eco.level.1':'初识','eco.level.2':'熟悉','eco.level.3':'共生',
  'eco.milestones':'每种花各自积累：1 次初识、3 次熟悉、6 次共生。达标后仍可继续记录；研究与个体留园经历永久保留。',
  'eco.projects':'生态考察','eco.project.1':'花与访客初访','eco.project.2':'多样花境巡礼','eco.project.3':'共生花园档案',
  'eco.projectNote':'每 6 小时更换目标。观察指定品种的留园活株，并在本期遇见指定访客；提交只收考察费用，不消耗花朵。印记与档案永久积累，金币和绶带每期都有新的用途。',
  'eco.targets':'本期观察目标','eco.guests':'本期访客记录','eco.fee':'考察费用：{coins} 金币 + {ribbons} 绶带','eco.reward':'永久收藏：{n} 枚研究印记','eco.submit':'提交考察','eco.confirm':'确认支付并归档','eco.done':'本期已归档','eco.missing':'还需完成目标或准备费用','eco.submitted':'考察已归档，获得 {n} 枚研究印记。',
  'eco.seals':'研究印记 {n}','eco.journal':'花园档案 · 最近 {n} 期记录','eco.journalEntry':'{date} · {season}季 · {n} 枚印记','eco.left':'本期还剩 {n}','eco.source':'植物资料来源',
  'guest.book':'访客图鉴','guest.diet':'食性','guest.habitat':'生境','guest.relationship':'在花园中的角色','guest.fact':'观察笔记','guest.met':'遇见 {n} 次','guest.unmet':'尚未遇见 · 可先阅读观察线索','guest.source':'资料来源',
  'guest.pollinator':'传粉访客','guest.guardian':'护园访客','guest.waterside':'水岸访客',
  'guest.effect.pollinator':'游戏效果：授粉，收获时可多一朵，并提供杂交机会。','guest.effect.guardian':'游戏效果：本花圃地力 +6；记录生态足迹，不授粉。','guest.effect.waterside':'游戏效果：本花圃湿度 +20%；记录生态足迹，不授粉。',
  'guest.boundary':'资料介绍真实生态；金币、地力与湿度奖励属于游戏设定。','guest.greeted':'遇见{name}：{effect}，获得 {coins} 金币。',
  'visitor.moth':'天蛾（夜行型）','visitor.robin':'欧亚鸲（知更鸟）','visitor.kingfisher':'普通翠鸟',
})
Object.assign(en, {
  'eco.title':'A living garden','eco.guide':'Keep a plant, learn its story',
  'eco.intro':'Choose “Keep growing” after bloom. The plant stays alive with its individual appearance. Water it, fund observations and prune for another flowering cycle to build a notebook for each species. Resident soil takes about 45 minutes to dry; dryness pauses study without killing the plant.',
  'eco.role.nectar':'Nectar border','eco.role.pollen':'Pollen border','eco.role.seed':'Seed study','eco.role.shelter':'Shelter border','eco.role.water':'Waterside border','eco.role.night':'Night visitor border',
  'eco.roles':'Ecological roles {n}/6','eco.diversity':'{n} residents · {species} species','eco.bonus':'Visitor chance +{n}%','eco.season':'Theme season: {season}',
  'eco.rules':'Roles, visitor preferences, six-hour seasons and repeat blooms are game rules, not real growing calendars or geographic communities. Borders raise visitor chance by up to 12 percentage points; residents below 30% moisture do not count. Permanent ecology research adds up to 4 more points; the combined bonus is shown above.',
  'eco.purpose':'A place in the garden','eco.affinity':'Game visitor preference: {name}','eco.flowerSeason':'Theme season: {name}',
  'eco.retain':'Keep growing','eco.resident':'Resident plant','eco.retained':'{name} stays in the garden. Its appearance and first identification are preserved.',
  'eco.observe':'Observe & tend · {n} coins','eco.observed':'{name}: {n} research records','eco.cooldown':'Next observation: {n}','eco.needWater':'At least 30% moisture is needed',
  'eco.rebloom':'Prune for rebloom · {n} coins','eco.rebloomed':'{name} begins another cycle. The next observation earns one extra record.','eco.rebloomNote':'Reblooming keeps DNA and curiosity traits. The first study of a new cycle earns 2 records; later observations earn 1 with a ten-minute cooldown.',
  'eco.history':'Tended {n} times · {cycles} reblooms','eco.retire':'End residency & harvest','eco.retireConfirm':'Confirm ending residency?','eco.error':'Not ready: check moisture, maturity, cooldown and coins.',
  'eco.study':'Species notebooks','eco.notes':'Studied {n}/{total} species','eco.observations':'Research records: {n}','eco.level.0':'Not yet studied','eco.level.1':'Acquainted','eco.level.2':'Familiar','eco.level.3':'Companion',
  'eco.milestones':'Each species has its own milestones: 1, 3 and 6 observations. Keep recording beyond them; research and each resident’s care history persist.',
  'eco.projects':'Ecological field studies','eco.project.1':'Flowers & visitors','eco.project.2':'Diverse borders','eco.project.3':'A garden community',
  'eco.projectNote':'Targets change every six hours. Observe the specified resident species and meet the listed visitors this period. Submission pays a study fee without consuming flowers. Permanent seals and journal entries give coins and ribbons a recurring purpose.',
  'eco.targets':'Observe this period','eco.guests':'Visitors this period','eco.fee':'Study fee: {coins} coins + {ribbons} ribbons','eco.reward':'Permanent collection: {n} research seals','eco.submit':'Submit study','eco.confirm':'Confirm fee & archive','eco.done':'Archived this period','eco.missing':'Complete the targets and prepare the fee','eco.submitted':'Study archived: {n} research seals earned.',
  'eco.seals':'Research seals: {n}','eco.journal':'Garden journal · latest {n} entries','eco.journalEntry':'{date} · {season} · {n} seals','eco.left':'This period ends in {n}','eco.source':'Botanical source',
  'guest.book':'Visitor field guide','guest.diet':'Diet','guest.habitat':'Habitat','guest.relationship':'Garden relationship','guest.fact':'Field notes','guest.met':'Met {n} times','guest.unmet':'Not yet met · read the field clues','guest.source':'Source',
  'guest.pollinator':'Pollinator','guest.guardian':'Garden guardian','guest.waterside':'Waterside visitor',
  'guest.effect.pollinator':'Game effect: pollination can yield another bloom and enable hybrid seeds.','guest.effect.guardian':'Game effect: +6 fertility in this plot; an ecological record, no pollination.','guest.effect.waterside':'Game effect: +20% moisture in this plot; an ecological record, no pollination.',
  'guest.boundary':'The notes describe real ecology; coin, soil and moisture rewards are game rules.','guest.greeted':'Met {name}: {effect} Earned {coins} coins.',
  'visitor.moth':'Nocturnal hawk-moth','visitor.robin':'European robin','visitor.kingfisher':'Common kingfisher',
})

function studyLevel(n) { return n >= 6 ? 3 : n >= 3 ? 2 : n >= 1 ? 1 : 0 }
function SpeciesPurpose({ speciesId, t, observations = 0 }) {
  const profile = ecoProfile(speciesId)
  if (!profile) return null
  return h('div', { className:'fg-purpose' },
    h('strong', null, t('eco.purpose')),
    h('span', null, t(`eco.role.${profile.role}`)),
    h('span', null, t('eco.flowerSeason', { name: t(`show.season.${SEASONS[profile.season]}`) })),
    h('span', null, t('eco.affinity', { name: t(`visitor.${profile.visitor}`) })),
    h('span', null, `${t(`eco.level.${studyLevel(observations)}`)} · ${t('eco.observations', { n: observations })}`))
}

// Entering the top layer makes Chromium scroll the nearest scrollable ancestor to
// "reveal" the dialog. In the session view that ancestor is the pane hosting this
// tab, so a visitor click used to yank the whole garden back to the top. Pin every
// scrollable ancestor across showModal() and the two frames that follow it.
function scrollAncestorsOf(node) {
  const found = []
  const measurable = typeof window !== 'undefined' && typeof window.getComputedStyle === 'function'
  if (!measurable) {
    const known = typeof node.closest === 'function' ? node.closest('.fg-scroll') : null
    return known === null ? found : [known]
  }
  let element = node.parentElement ?? null
  while (element !== null && element !== document.body && element !== document.documentElement) {
    const style = window.getComputedStyle(element)
    if (/(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 1) found.push(element)
    element = element.parentElement
  }
  return found
}

function showModalPinned(dialog) {
  if (dialog === null || dialog === undefined || dialog.open === true) return
  const scrollers = scrollAncestorsOf(dialog)
  const tops = scrollers.map(element => element.scrollTop)
  const restore = () => {
    for (let i = 0; i < scrollers.length; i += 1) {
      if (scrollers[i].scrollTop !== tops[i]) scrollers[i].scrollTop = tops[i]
    }
  }
  dialog.showModal()
  restore()
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => { restore(); window.requestAnimationFrame(restore) })
  }
}

function VisitorPreview({ visitorId, state, t, onClose }) {
  const ref = React.useRef(null)
  React.useEffect(() => { const dialog=ref.current; showModalPinned(dialog); return () => { if(dialog?.open) dialog.close() } }, [])
  const visitor=VISITOR_BY_ID.get(visitorId), info=VISITOR_INFO[visitorId]
  if(!visitor || !info) return null
  return h('dialog', { ref, className:'fg-dialog', 'aria-label':t(`visitor.${visitorId}`), onCancel:event=>{event.preventDefault();onClose()}, onClick:event=>{if(event.target===event.currentTarget)onClose()} },
    h('div',{className:'fg-preview'},
      h('div',{className:'fg-previewArt fg-visitorPortrait'}, h(VisitorArt,{id:visitorId})),
      h('div',{className:'fg-previewBody'},
        h('h2',{className:'fg-previewName'},t(`visitor.${visitorId}`)),
        h('div',{className:'fg-previewLatin'},info.latin),
        h('span',{className:'fg-badge'},t(`guest.${info.role}`)),
        h('p',{className:'fg-hint'},(state.visitors[visitorId]??0)>0?t('guest.met',{n:state.visitors[visitorId]}):t('guest.unmet')),
        ['diet','habitat','relationship','fact'].map(field=>h('div',{key:field,className:'fg-guestNote'},h('strong',null,t(`guest.${field}`)),h('p',null,t(`guest.${visitorId}.${field}`)))),
        h('p',{className:'fg-hint'},visitor.scenes.map(id=>t(`scene.${id}`)).join(' / '),' · ',t(`visitor.when.${visitor.when}`),visitor.dry?' · '+t('visitor.dry'):null),
        visitor.special ? h('div',{className:'fg-purpose'},h('strong',null,t('visitor.clue')),h('span',null,t(`visitor.clue.${visitorId}`)),h('span',null,t('visitor.chanceNote'))) : null,
        h('p',{className:'fg-hint'},t(`guest.effect.${info.role}`)),
        h('p',{className:'fg-hint'},t('guest.boundary')),
        h('a',{href:info.source,target:'_blank',rel:'noopener noreferrer',className:'fg-source'},t('guest.source'))),
      h('div',{className:'fg-previewActions'},h('button',{type:'button',className:'fg-btn',onClick:onClose},t('card.close')))))
}

// Research currency, permanent branches and deterministic supply exchanges.
const RESEARCH_BRANCHES = ['care', 'ecology', 'breeding']
const RESEARCH_OFFERS = [
  { id: 'fertilizer', cost: 1, quantity: 2 },
  { id: 'compost', cost: 1, quantity: 3 },
  { id: 'sprinkler', cost: 2, quantity: 1 },
  { id: 'charm', cost: 3, quantity: 1 },
]
function sanitizeResearch(raw) {
  return Object.fromEntries(RESEARCH_BRANCHES.map(id => [id, Math.max(0, Math.min(2, Math.floor(finiteOr(raw?.[id], 0))))]))
}
function researchLevel(state, branch) { return sanitizeResearch(state.research)[branch] ?? 0 }
function researchFee(state, species, rebloom = false) {
  const base = rebloom ? 10 + Math.ceil(species.cost * 0.4) : 8 + Math.ceil(species.cost * 0.25)
  return Math.max(1, Math.ceil(base * (1 - researchLevel(state, 'care') * 0.2)))
}
function researchCost(state, branch) { return researchLevel(state, branch) === 0 ? 3 : 6 }
function spendResearch(state, cost) {
  return { ...state, researchSeals: state.researchSeals - cost, researchSpent: (state.researchSpent ?? 0) + cost }
}
function upgradeResearch(state, branch) {
  if (!RESEARCH_BRANCHES.includes(branch) || researchLevel(state, branch) >= 2) return null
  const cost = researchCost(state, branch)
  if ((state.researchSeals ?? 0) < cost) return null
  return { ...spendResearch(state, cost), research: { ...sanitizeResearch(state.research), [branch]: researchLevel(state, branch) + 1 } }
}
function exchangeResearch(state, id) {
  const offer = RESEARCH_OFFERS.find(entry => entry.id === id)
  if (!offer || (state.researchSeals ?? 0) < offer.cost) return null
  return { ...spendResearch(state, offer.cost), bag: { ...state.bag, [id]: (state.bag?.[id] ?? 0) + offer.quantity } }
}
function hybridChance(state) {
  return Math.min(0.9, HYBRID_CHANCE + FACILITY_BY_ID.get('bench').step * facilityLevel(state, 'bench') + researchLevel(state, 'breeding') * 0.05 + shelfBonus(state).hybrid)
}
Object.assign(zh, {
  'research.title':'永久研究技能树', 'research.intro':'每条分支独立升级，先解锁 I 再解锁 II；每级分别消耗 3、6 枚印记。效果永久生效，II 的数值为该分支总加成。',
  'research.balance':'可用 {n} 枚 · 累计获得 {total} 枚',
  'research.care':'养护研究', 'research.ecology':'生态研究', 'research.breeding':'育种研究',
  'research.care.effect':'观察与修剪复花的金币费用减少 {n}%（向上取整）。',
  'research.ecology.effect':'所有花地的访客出现率额外 +{n} 个百分点，与花境和蜂箱叠加；总出现率最高 85%。',
  'research.breeding.effect':'已授粉花收获时的杂交结种概率额外 +{n} 个百分点，与育种台叠加，最高 90%；仍需邻株盛开。',
  'research.current':'当前效果：{n}', 'research.level':'{name} · {level}/2', 'research.buy':'解锁 {level} · {n} 枚印记',
  'research.max':'已全部解锁', 'research.insufficient':'印记不足，还需 {n} 枚', 'research.confirm':'确认花费 {n} 枚印记？',
  'research.upgraded':'{name}已升级至 {level}/2，永久效果已生效。', 'research.failed':'未完成：印记不足或研究已满级，请重试。',
  'research.shop':'印记兑换商店', 'research.shopNote':'兑换会消耗可用印记，道具放入背包；可重复兑换。永久研究也使用同一余额，请按需要选择。',
  'research.offer':'{name} ×{n}', 'research.stock':'背包已有 {n}', 'research.exchange':'兑换 · {n} 枚印记', 'research.exchanged':'已兑换{name} ×{n}，已放入背包。',
  'eco.reward':'考察奖励：{n} 枚可用研究印记',
  'eco.projectNote':'每 6 小时更换目标。观察指定留园品种并遇见本期访客；提交收取费用，不消耗花。印记可用于永久研究与道具兑换，档案保留。',
})
Object.assign(en, {
  'research.title':'Permanent research tree', 'research.intro':'Upgrade each branch independently: I before II, costing 3 then 6 seals. Effects are permanent; tier II shows the total branch bonus.',
  'research.balance':'{n} available · {total} earned in total',
  'research.care':'Plant care', 'research.ecology':'Visitor ecology', 'research.breeding':'Hybrid breeding',
  'research.care.effect':'Observation and rebloom coin fees reduced by {n}% (rounded up).',
  'research.ecology.effect':'Visitor chance +{n} percentage points in every ground, stacking with borders and hives; total chance capped at 85%.',
  'research.breeding.effect':'Hybrid seed chance +{n} percentage points on pollinated harvests, stacking with the breeding bench up to 90%; still requires a blooming neighbour.',
  'research.current':'Current effect: {n}', 'research.level':'{name} · {level}/2', 'research.buy':'Unlock {level} · {n} seals',
  'research.max':'Fully researched', 'research.insufficient':'Need {n} more seals', 'research.confirm':'Confirm spending {n} seals?',
  'research.upgraded':'{name} upgraded to {level}/2. Permanent effect is active.', 'research.failed':'Could not complete: insufficient seals or maximum research level. Try again.',
  'research.shop':'Seal exchange', 'research.shopNote':'Spend available seals to put supplies in your bag. Exchanges are repeatable and share the same balance as permanent research.',
  'research.offer':'{name} ×{n}', 'research.stock':'In bag: {n}', 'research.exchange':'Exchange · {n} seals', 'research.exchanged':'Received {name} ×{n} in your bag.',
  'eco.reward':'Study reward: {n} spendable research seals',
  'eco.projectNote':'Targets change every six hours. Observe resident species and meet this period’s visitors. Submission pays a fee without consuming flowers. Spend seals on permanent research or supplies; journal entries persist.',
})
function ResearchWorkshop({ state, t, clock, onChange }) {
  const [armed, setArmed] = React.useState(null), [notice, setNotice] = React.useState('')
  function purchase(kind, id, cost) {
    const key = `${kind}:${id}`, now = Date.now(), current = getState()
    const level = researchLevel(current, id)
    if (!armed || armed.key !== key || now > armed.until || armed.cost !== cost || (kind === 'upgrade' && armed.level !== level)) {
      setArmed({key, cost, level, until: now + 5000}); return
    }
    setArmed(null)
    const next = kind === 'upgrade' ? upgradeResearch(current, id) : exchangeResearch(current, id)
    if (!next) { setNotice(t('research.failed')); return }
    onChange(next)
    const offer = RESEARCH_OFFERS.find(entry => entry.id === id)
    setNotice(kind === 'upgrade' ? t('research.upgraded', {name:t(`research.${id}`),level:researchLevel(next,id)}) : t('research.exchanged', {name:t(`item.${id}`),n:offer.quantity}))
  }
  function button(kind, id, cost, disabled, label) {
    const confirming = armed?.key === `${kind}:${id}` && armed.until >= clock
    return h('button', {type:'button',className:confirming?'fg-btn fg-btnDanger':'fg-btn',disabled,onClick:()=>purchase(kind,id,cost)}, confirming?t('research.confirm',{n:cost}):label)
  }
  const balance = state.researchSeals ?? 0
  return h('div', {className:'fg-researchWorkshop'},
    h('h3',{title:t('research.intro')},t('research.title')),
    h('p',{className:'fg-hint'},t('research.balance',{n:balance,total:balance+(state.researchSpent??0)})),
    h('div',{className:'fg-skillTree'},RESEARCH_BRANCHES.map(id=>{
      const level=researchLevel(state,id), cost=researchCost(state,id), step=id==='care'?20:id==='ecology'?2:5
      const confirming=armed?.key===`upgrade:${id}`&&armed.until>=clock
      return h('div',{className:'fg-skillBranch',key:id,'data-branch':id},
        h('strong',{className:'fg-skillName'},t('research.level',{name:t(`research.${id}`),level})),
        h('div',{className:'fg-skillNodes'},[1,2].map(tier=>{
          const done=tier<=level, next=tier===level+1, mark=tier===1?'I':'II'
          return h('button',{key:tier,type:'button',className:'fg-skillNode','data-state':done?'done':next?(confirming?'confirm':'next'):'closed',
            disabled:!next||balance<cost,title:`${mark} · ${t(`research.${id}.effect`,{n:tier*step})}`,
            'aria-label':done?`${mark} ✓`:next?(confirming?t('research.confirm',{n:cost}):t('research.buy',{level:mark,n:cost})):mark,
            onClick:()=>purchase('upgrade',id,cost)},
            h('span',{className:'fg-skillMark'},done?'✓':mark),
            next?h('span',{className:'fg-skillCost'},confirming?'?':String(cost)):null)
        })),
        h('span',{className:'fg-note'},level>=2?t('research.max'):level>0?t('research.current',{n:t(`research.${id}.effect`,{n:level*step})}):t('research.buy',{level:'I',n:cost})),
        level<2&&balance<cost?h('span',{className:'fg-note fg-noteWarn'},t('research.insufficient',{n:cost-balance})):null)
    })),
    h('h3',{title:t('research.shopNote')},t('research.shop')),
    h('div',{className:'fg-ecoProjects'},RESEARCH_OFFERS.map(offer=>h('article',{className:'fg-ecoProject',key:offer.id},
      h('h4',null,t('research.offer',{name:t(`item.${offer.id}`),n:offer.quantity})),
      h('p',{className:'fg-hint'},t(`item.${offer.id}.note`)),
      h('p',{className:'fg-note'},t('research.stock',{n:state.bag?.[offer.id]??0})),
      button('exchange',offer.id,offer.cost,balance<offer.cost,t('research.exchange',{n:offer.cost})),
      balance<offer.cost?h('span',{className:'fg-note'},t('research.insufficient',{n:offer.cost-balance})):null))),
    h('p',{role:'status','aria-live':'polite',className:'fg-sectionOk'},notice))
}

function GardenEcology({state,t,clock,onChange,onSpecies}) {
  const ecology=ecologyState(state,clock), stats=gardenEcology(state,clock), projects=ecoProjects(state,clock)
  const [armed,setArmed]=React.useState(null), [notice,setNotice]=React.useState('')
  function submit(project) {
    const now=Date.now(), current=getState(), live=ecoProjects(current,now).find(item=>item.id===project.id)
    if(!live || live.species.join()!==project.species.join()) {setArmed(null);return}
    if(armed?.id!==project.id || now>armed.until){setArmed({id:project.id,until:now+5000});return}
    const next=submitStudy(current,project.id,now);setArmed(null)
    if(!next){setNotice(t('eco.missing'));return}
    onChange(next);setNotice(t('eco.submitted',{n:project.seals}))
  }
  return h('section',{className:'fg-section fg-ecology',id:'fg-ecology',tabIndex:-1},
    h('div',{className:'fg-sectionHead'},h('h2',{className:'fg-sectionTitle'},t('eco.title')),h('span',{className:'fg-chip'},t('eco.seals',{n:state.researchSeals??0}))),
    h(InfoTip,{t,lines:[t('eco.guide'),t('eco.intro'),t('eco.rules'),t('eco.projectNote')]}),
    h('div',{className:'fg-sectionHead'},
      h('span',{className:'fg-badge'},t('eco.diversity',{n:stats.residents,species:stats.species})),
      h('span',{className:'fg-badge'},t('eco.roles',{n:stats.roleCoverage})),
      h('span',{className:'fg-badge'},t('eco.bonus',{n:Math.round(stats.visitorBonus*100)})),
      h('span',{className:'fg-badge'},t('eco.season',{season:t(`show.season.${SEASONS[ecology.period%4]}`)}))),
    h(ResearchWorkshop,{state,t,clock,onChange}),
    h('details',{className:'fg-ecoDetails',open:true},h('summary',null,t('eco.projects'),' · ',t('eco.left',{n:formatDuration((ecology.period+1)*ECO_PERIOD_MS-clock,t)})),
      h('div',{className:'fg-ecoProjects'},projects.map((project,index)=>{
        const done=ecology.claimed.includes(project.id)
        const ready=project.species.every(id=>ecology.observed.includes(id))&&project.visitors.every(id=>ecology.visitors.includes(id))&&state.coins>=project.coins&&(state.ribbons??0)>=project.ribbons
        return h('article',{className:'fg-ecoProject',key:project.id},
          h('h3',null,t(`eco.project.${index+1}`)),
          h('progress',{max:project.species.length+project.visitors.length,value:project.species.filter(id=>ecology.observed.includes(id)).length+project.visitors.filter(id=>ecology.visitors.includes(id)).length,'aria-label':t(`eco.project.${index+1}`)}),
          h('span',{className:'fg-note'},t('eco.targets')),
          h('div',{className:'fg-ecoTargets'},project.species.map(id=>h('button',{type:'button',className:'fg-btn fg-btnSmall',key:id,onClick:()=>onSpecies(id)},ecology.observed.includes(id)?'✓ ':'○ ',t(`species.${id}`)))),
          h('span',{className:'fg-note'},t('eco.guests')),
          h('div',{className:'fg-ecoTargets'},project.visitors.map(id=>h('span',{key:id,className:'fg-questChip','data-done':ecology.visitors.includes(id)?'true':'false'},ecology.visitors.includes(id)?'✓ ':'○ ',t(`visitor.${id}`)))),
          h('div',{className:'fg-ecoTargets'},h('span',{className:'fg-questChip'},t('eco.fee',project)),h('span',{className:'fg-questChip','data-tone':'gold'},t('eco.reward',{n:project.seals}))),
          h('button',{type:'button',className:armed?.id===project.id&&armed.until>=clock?'fg-btn fg-btnDanger':'fg-btn',disabled:done||!ready,onClick:()=>submit(project)},done?t('eco.done'):armed?.id===project.id&&armed.until>=clock?t('eco.confirm'):t('eco.submit')),
          !done&&!ready?h('span',{className:'fg-note'},t('eco.missing')):null)
      }))),
    h('details',{className:'fg-ecoDetails'},h('summary',null,t('eco.study'),' · ',t('eco.notes',{n:Object.values(state.study??{}).filter(entry=>entry.observations>0).length,total:SPECIES.length})),
      h('p',{className:'fg-hint'},t('eco.milestones')),h('p',{className:'fg-hint'},t('eco.rebloomNote')),
      h('div',{className:'fg-notebooks'},SPECIES.map(species=>{
        const n=state.study?.[species.id]?.observations??0
        return h('button',{type:'button',key:species.id,className:'fg-notebook',onClick:()=>onSpecies(species.id)},
          h('span',null,t(`species.${species.id}`)),h('span',{className:'fg-note'},`${t(`eco.level.${studyLevel(n)}`)} · ${n}`),
          h('progress',{max:6,value:Math.min(6,n),'aria-label':t(`species.${species.id}`)}))
      }))),
    (state.journal??[]).length>0?h('details',{className:'fg-ecoDetails'},h('summary',null,t('eco.journal',{n:state.journal.length})),
      h('div',{className:'fg-journal'},state.journal.slice(-12).reverse().map(entry=>h('div',{className:'fg-journalEntry',key:entry.id},h('strong',null,t('eco.journalEntry',{date:new Date(entry.at).toLocaleDateString(),season:t(`show.season.${SEASONS[entry.period%4]}`),n:entry.seals})),h('span',null,entry.species.map(id=>t(`species.${id}`)).join(' · ')))))):null,
    h('p',{role:'status','aria-live':'polite',className:'fg-sectionOk'},notice))
}

Object.assign(zh, {
 'species.foxglove':'毛地黄','latin.foxglove':'Digitalis purpurea','codex.foxglove':'林间的铃声与谨慎','fact.foxglove':'第一年形成毛茸茸的叶莲座；第二年抽出高花葶，悬挂紫色斑点管花。',
 'species.bluebell':'蓝铃花','latin.bluebell':'Hyacinthoides non-scripta','codex.bluebell':'林下的蓝色地毯','fact.bluebell':'细长基生叶上方是一侧下垂的蓝紫色花序，花被片向外反卷。',
 'species.cyclamen':'常春叶仙客来','latin.cyclamen':'Cyclamen hederifolium','codex.cyclamen':'秋日的倒影','fact.cyclamen':'银纹心形叶与反卷花瓣从扁圆块茎上生长，花后花梗会盘旋。',
 'species.woodanemone':'林银莲花','latin.woodanemone':'Anemone nemorosa','codex.woodanemone':'春林的微风','fact.woodanemone':'低矮根茎多年生，三裂叶托起一朵白色或淡紫色的多雄蕊小花。',
 'species.californiapoppy':'花菱草','latin.californiapoppy':'Eschscholzia californica','codex.californiapoppy':'金色的旷野','fact.californiapoppy':'灰绿裂叶上伸出四瓣丝绸般花瓣；夜晚或寒冷时花瓣闭合。',
 'species.desertmarigold':'沙漠金盏菊','latin.desertmarigold':'Baileya multiradiata','codex.desertmarigold':'沙地的太阳','fact.desertmarigold':'银绿色丛生叶片上抽出多条裸花葶，每条顶着明亮黄色的菊状花头。',
 'species.penstemon':'钓钟柳','latin.penstemon':'Penstemon barbatus','codex.penstemon':'峡谷里的红色长笛','fact.penstemon':'直立花茎上成串排列狭长猩红管花，下唇内有金色绒毛。',
 'species.eveningprimrose':'月见草','latin.eveningprimrose':'Oenothera biennis','codex.eveningprimrose':'夜色中的金色开启','fact.eveningprimrose':'两年生植株先长莲座，第二年高茎开四瓣黄花，花朵在傍晚迅速开放。',
})
Object.assign(en, {
 'species.foxglove':'Foxglove','latin.foxglove':'Digitalis purpurea','codex.foxglove':'A woodland bell with a warning','fact.foxglove':'A woolly leaf rosette forms first; the second-year spike carries hanging purple, spotted tubular flowers.',
 'species.bluebell':'Common bluebell','latin.bluebell':'Hyacinthoides non-scripta','codex.bluebell':'A blue carpet beneath trees','fact.bluebell':'Linear basal leaves frame a one-sided, nodding raceme of violet-blue flowers with recurved tepals.',
 'species.cyclamen':'Ivy-leaved cyclamen','latin.cyclamen':'Cyclamen hederifolium','codex.cyclamen':'An autumn reflection','fact.cyclamen':'Silver-patterned ivy-like leaves and reflexed petals rise from a flattened tuber; spent stalks coil.',
 'species.woodanemone':'Wood anemone','latin.woodanemone':'Anemone nemorosa','codex.woodanemone':'A breeze in the spring wood','fact.woodanemone':'A low rhizomatous perennial with divided leaves and a solitary pale flower surrounded by stamens.',
 'species.californiapoppy':'California poppy','latin.californiapoppy':'Eschscholzia californica','codex.californiapoppy':'Gold across open country','fact.californiapoppy':'Grey-green divided foliage supports four silky petals that close at night or in cold weather.',
 'species.desertmarigold':'Desert marigold','latin.desertmarigold':'Baileya multiradiata','codex.desertmarigold':'A desert sun','fact.desertmarigold':'Silvery clumps send up many naked stems, each ending in a bright yellow daisy-like head.',
 'species.penstemon':'Beardlip penstemon','latin.penstemon':'Penstemon barbatus','codex.penstemon':'A red flute in the canyon','fact.penstemon':'Tall spikes carry clustered scarlet tubes with golden hairs along the lower lip.',
 'species.eveningprimrose':'Common evening-primrose','latin.eveningprimrose':'Oenothera biennis','codex.eveningprimrose':'Gold opening after dusk','fact.eveningprimrose':'A biennial rosette becomes a tall flowering stem; four yellow petals open quickly each evening.',
})
