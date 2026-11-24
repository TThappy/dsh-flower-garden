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
      'item.charm.note': '全花园下一株开花鉴定的仙品概率 +3%；已鉴定植株不重抽',
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
      'codex.hint': '仙品：基础 1%；从未缺水、偏爱天气、刚浇过水、夜里 22:00–05:00 收获各 +1%，最高 10%。仙品自带光晕，卖价 3 倍，不用于交付花束。',
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
      'hint.body': '花开后可以留园观察，也可以收进花篮。所有花地都会继续生长，离线最多计入 12 小时。',
      'market.title': '今日花市',
      'market.bonus': '卖价 +{n}%',
      'market.note': '今日出售{flower}可多得 {n}% 金币。每天零点从已解锁花地中换一种花。花束委托按原报酬结算。',
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
      'item.charm.note': '+3% spirit chance on the next bloom identification across all grounds; existing blooms do not reroll',
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
      'codex.hint': 'Spirit blooms: 1% base; +1% each if the plant never dried, in this ground\'s favoured weather, right after watering, and for a night harvest (22:00–05:00), capped at 10%. They glow, sell for 3×, and never pay for a bouquet.',
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
      'hint.body': 'Once a flower blooms, leave it in the garden to observe it or harvest it for your basket. All grounds keep growing, with up to 12 hours of offline progress.',
      'market.title': 'Market today',
      'market.bonus': 'sells +{n}%',
      'market.note': 'Sell {flower} today for {n}% more coins. At midnight the market picks a flower from an unlocked ground. Bouquet orders pay their usual rewards.',
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

// Four more grounds and seventeen more species. Morphology follows the Wikipedia page named in `source`;
// growth times, prices and weather multipliers are game settings.
const MORE_SCENES = [
  {id:'alpine',cost:3200,tint:'rgba(96,140,196,.12)',edge:'rgba(96,140,196,.4)',weather:{clear:1.15,overcast:1,rain:.95},rainWets:true,species:[]},
  {id:'rainforest',cost:3800,tint:'rgba(38,128,92,.12)',edge:'rgba(38,128,92,.4)',weather:{clear:1,overcast:1.1,rain:1.25},rainWets:true,species:[]},
  {id:'coast',cost:4500,tint:'rgba(70,150,190,.12)',edge:'rgba(70,150,190,.4)',weather:{clear:1.2,overcast:1.05,rain:.9},rainWets:true,species:[]},
  {id:'garden',cost:5200,tint:'rgba(190,96,120,.12)',edge:'rgba(190,96,120,.4)',weather:{clear:1.1,overcast:1.1,rain:1.05},rainWets:true,species:[]},
]
const G = '#6f9460', L = '#8aad72'
const MORE_SPECIES = [
  {id:'alpineaster',scene:'alpine',cost:16,growSec:140,sell:34,xp:6,head:'alpineaster',leaf:'strap',pal:{petal:'#9a86dc',petalDeep:'#6a55b0',center:'#f2c94c',centerDeep:'#b98a1e',stem:G,leaf:L},alt:{petal:'#f1a9c8',petalDeep:'#c4708f'},source:'https://en.wikipedia.org/wiki/Aster_alpinus'},
  {id:'pasqueflower',scene:'alpine',cost:26,growSec:230,sell:60,xp:11,head:'pasqueflower',leaf:'fern',pal:{petal:'#f7f4ea',petalDeep:'#d6d0bf',center:'#f0c648',centerDeep:'#a9801f',stem:'#7d9a6a',leaf:'#93b07c'},source:'https://en.wikipedia.org/wiki/Pulsatilla_alpina'},
  {id:'gentian',scene:'alpine',cost:44,growSec:360,sell:108,xp:20,head:'gentian',leaf:'lance',pal:{petal:'#2f55c8',petalDeep:'#1b327f',center:'#bfe0a8',centerDeep:'#6f9a58',stem:G,leaf:L},source:'https://en.wikipedia.org/wiki/Gentiana_acaulis'},
  {id:'alpinecolumbine',scene:'alpine',cost:66,growSec:560,sell:176,xp:32,head:'alpinecolumbine',leaf:'palmate',pal:{petal:'#6f8fe6',petalDeep:'#4560b4',center:'#f4f1e2',centerDeep:'#cfc48f',stem:G,leaf:L},source:'https://en.wikipedia.org/wiki/Aquilegia_alpina'},
  {id:'anthurium',scene:'rainforest',cost:30,growSec:250,sell:72,xp:13,head:'anthurium',leaf:'heart',pal:{petal:'#e23b3b',petalDeep:'#a01f28',center:'#f3dc8a',centerDeep:'#c9a23a',stem:'#4f8a5c',leaf:'#3f7d55'},alt:{petal:'#f6b8c4',petalDeep:'#d77f93'},source:'https://en.wikipedia.org/wiki/Anthurium_andraeanum'},
  {id:'heliconia',scene:'rainforest',cost:48,growSec:400,sell:122,xp:22,head:'heliconia',leaf:'paddle',pal:{petal:'#e5432f',petalDeep:'#a82a1c',center:'#f6d44a',centerDeep:'#7fa03c',stem:'#4f8a5c',leaf:'#4a8a58'},source:'https://en.wikipedia.org/wiki/Heliconia_rostrata'},
  {id:'passionflower',scene:'rainforest',cost:62,growSec:520,sell:160,xp:29,head:'passionflower',leaf:'palmate',pal:{petal:'#eef0fb',petalDeep:'#5a63c8',center:'#d9e6a0',centerDeep:'#7c5a9c',stem:'#5c8f5a',leaf:'#6ea163'},source:'https://en.wikipedia.org/wiki/Passiflora_caerulea'},
  {id:'moonorchid',scene:'rainforest',cost:88,growSec:680,sell:236,xp:42,head:'moonorchid',leaf:'paddle',pal:{petal:'#fbfaf6',petalDeep:'#dcd7ca',center:'#f1c93f',centerDeep:'#c2414f',stem:'#5c8f5a',leaf:'#4f8f5c'},source:'https://en.wikipedia.org/wiki/Phalaenopsis_amabilis'},
  {id:'seathrift',scene:'coast',cost:14,growSec:125,sell:30,xp:5,head:'seathrift',leaf:'grass',pal:{petal:'#f08cb4',petalDeep:'#c2587f',center:'#fbe3ec',centerDeep:'#d78aa6',stem:'#7a9a66',leaf:'#7fa06a'},alt:{petal:'#f8f4f6',petalDeep:'#d9cfd4'},source:'https://en.wikipedia.org/wiki/Armeria_maritima'},
  {id:'spanishlavender',scene:'coast',cost:24,growSec:200,sell:54,xp:10,head:'spanishlavender',leaf:'silver',pal:{petal:'#b07fdc',petalDeep:'#5d3f93',center:'#e9d9f6',centerDeep:'#8a68b8',stem:'#8a9a78',leaf:'#a9b59a'},source:'https://en.wikipedia.org/wiki/Lavandula_stoechas'},
  {id:'rockrose',scene:'coast',cost:38,growSec:310,sell:92,xp:17,head:'rockrose',leaf:'ovate',pal:{petal:'#ee86c0',petalDeep:'#bf4f8f',center:'#f6cf4a',centerDeep:'#b3861c',stem:'#7c9468',leaf:'#93a97c'},source:'https://en.wikipedia.org/wiki/Cistus_creticus'},
  {id:'oleander',scene:'coast',cost:56,growSec:450,sell:140,xp:26,head:'oleander',leaf:'lance',pal:{petal:'#f59ab0',petalDeep:'#cf5f7c',center:'#fbe8c4',centerDeep:'#d19a52',stem:'#6a8a5c',leaf:'#5f8a5a'},alt:{petal:'#fbf7f0',petalDeep:'#ddd3c2'},source:'https://en.wikipedia.org/wiki/Nerium'},
  {id:'bougainvillea',scene:'coast',cost:74,growSec:600,sell:192,xp:35,head:'bougainvillea',leaf:'ovate',pal:{petal:'#d53f9d',petalDeep:'#972268',center:'#fdf8e4',centerDeep:'#d9c66a',stem:'#7a7a58',leaf:'#5f9058'},source:'https://en.wikipedia.org/wiki/Bougainvillea_glabra'},
  {id:'azalea',scene:'garden',cost:28,growSec:240,sell:66,xp:12,head:'azalea',leaf:'ovate',pal:{petal:'#ec5a78',petalDeep:'#b02f4c',center:'#fbd9de',centerDeep:'#8f2540',stem:'#77705a',leaf:'#6c9a60'},alt:{petal:'#fbf3f4',petalDeep:'#e2c9cf'},source:'https://en.wikipedia.org/wiki/Rhododendron_simsii'},
  {id:'chrysanthemum',scene:'garden',cost:42,growSec:340,sell:102,xp:19,head:'chrysanthemum',leaf:'lobed',pal:{petal:'#f4c23a',petalDeep:'#c98a16',center:'#d79a22',centerDeep:'#8f5f10',stem:G,leaf:'#789f66'},alt:{petal:'#f6eef0',petalDeep:'#d6bfc8'},source:'https://en.wikipedia.org/wiki/Chrysanthemum_×_morifolium'},
  {id:'wisteria',scene:'garden',cost:64,growSec:540,sell:168,xp:30,head:'wisteria',leaf:'pinnate',pal:{petal:'#a78be0',petalDeep:'#6f55b4',center:'#f3ecfb',centerDeep:'#c9b4ea',stem:'#7b6a50',leaf:'#7fa868'},source:'https://en.wikipedia.org/wiki/Wisteria_sinensis'},
  {id:'treepeony',scene:'garden',cost:96,growSec:720,sell:260,xp:46,head:'treepeony',leaf:'lobed',pal:{petal:'#e76a9a',petalDeep:'#a8336a',center:'#f6d04c',centerDeep:'#b98a1e',stem:'#7b6a50',leaf:'#6f9a62'},alt:{petal:'#fbf4f2',petalDeep:'#e3cdd0'},source:'https://en.wikipedia.org/wiki/Paeonia_×_suffruticosa'},
]
for (const [id,role,season,visitor] of [
  ['alpineaster','seed',1,'butterfly'],['pasqueflower','pollen',0,'bee'],['gentian','nectar',1,'bumblebee'],['alpinecolumbine','nectar',1,'bumblebee'],
  ['anthurium','shelter',1,'firefly'],['heliconia','nectar',1,'honeycreeper'],['passionflower','pollen',1,'bee'],['moonorchid','night',0,'moth'],
  ['seathrift','pollen',0,'bee'],['spanishlavender','nectar',0,'bee'],['rockrose','pollen',0,'hoverfly'],['oleander','shelter',1,'hawkmoth'],['bougainvillea','shelter',1,'swallowtail'],
  ['azalea','nectar',0,'swallowtail'],['chrysanthemum','seed',2,'hoverfly'],['wisteria','nectar',0,'bumblebee'],['treepeony','pollen',0,'bee'],
]) ECO_PROFILES[id] = { role, season, visitor }
const MORE_VISITORS = {
  alpine:['bee','butterfly','ladybug','robin','moth','bumblebee'], rainforest:['bee','butterfly','firefly','moth','honeycreeper','hawkmoth','ladybug'],
  coast:['bee','butterfly','ladybug','moth','swallowtail','hoverfly','hawkmoth'], garden:['bee','butterfly','ladybug','firefly','moth','robin','swallowtail','bumblebee','hoverfly'],
}
Object.assign(zh, {
  'scene.alpine':'高山草甸','scene.rainforest':'雨林','scene.coast':'海岸','scene.garden':'东方庭园',
  'weather.alpine.clear':'高山晴','weather.alpine.overcast':'云海','weather.alpine.rain':'山雨',
  'weather.rainforest.clear':'林隙日光','weather.rainforest.overcast':'湿雾','weather.rainforest.rain':'热带暴雨',
  'weather.coast.clear':'海风晴','weather.coast.overcast':'海雾','weather.coast.rain':'海雨',
  'weather.garden.clear':'晴','weather.garden.overcast':'薄阴','weather.garden.rain':'梅雨',
  'species.alpineaster':'高山紫菀','latin.alpineaster':'Aster alpinus','codex.alpineaster':'山巅的问候','fact.alpineaster':'菊科多年生草本，夏季开紫、粉、白或蓝色的头状花，原生于欧洲山地。',
  'species.pasqueflower':'高山白头翁','latin.pasqueflower':'Pulsatilla alpina','codex.pasqueflower':'雪线上的第一朵','fact.pasqueflower':'毛茛科多年生草本，高 15–30 厘米，生长在海拔 1200–2700 米的欧洲山地。',
  'species.gentian':'无茎龙胆','latin.gentian':'Gentiana acaulis','codex.gentian':'高山的一抹深蓝','fact.gentian':'龙胆科，深蓝色喇叭状花几乎贴地而开，生长在阿尔卑斯和比利牛斯海拔 800–3000 米处。',
  'species.alpinecolumbine':'高山耧斗菜','latin.alpinecolumbine':'Aquilegia alpina','codex.alpinecolumbine':'带着五只小角的蓝','fact.alpinecolumbine':'毛茛科多年生草本，花浅蓝至蓝紫色，原生于阿尔卑斯西部和中部，在原产地较为少见。',
  'species.anthurium':'红掌','latin.anthurium':'Anthurium andraeanum','codex.anthurium':'热情与真诚的心','fact.anthurium':'天南星科，原生于哥伦比亚和厄瓜多尔；鲜艳的心形部分是佛焰苞，真正的小花长在中间的肉穗上。',
  'species.heliconia':'垂花蝎尾蕉','latin.heliconia':'Heliconia rostrata','codex.heliconia':'雨林里垂下的灯串','fact.heliconia':'多年生草本，生于热带雨林；与多数向上开的蝎尾蕉不同，它的花序下垂，苞片红色带黄边。',
  'species.passionflower':'西番莲','latin.passionflower':'Passiflora caerulea','codex.passionflower':'一圈细丝围成的钟面','fact.passionflower':'西番莲科藤本，原生于南美；花瓣内有一圈蓝紫色的丝状副花冠。',
  'species.moonorchid':'蝴蝶兰','latin.moonorchid':'Phalaenopsis amabilis','codex.moonorchid':'月光下停着的白蝶','fact.moonorchid':'兰科附生草本，根粗长，叶肥厚，分枝的花茎上开近乎平展、花期很长的白花。',
  'species.seathrift':'海石竹','latin.seathrift':'Armeria maritima','codex.seathrift':'海崖上的粉色绒球','fact.seathrift':'白花丹科常绿多年生草本，低矮丛生，细长花茎顶着球形的粉色花序，也有紫、白、红色。',
  'species.spanishlavender':'西班牙薰衣草','latin.spanishlavender':'Lavandula stoechas','codex.spanishlavender':'戴着兔耳朵的薰衣草','fact.spanishlavender':'原生于地中海沿岸的常绿灌木；约 2 厘米的花穗顶端有几片大得多的紫色不育苞片。',
  'species.rockrose':'岩蔷薇','latin.rockrose':'Cistus creticus','codex.rockrose':'皱纸一样的一日花','fact.rockrose':'半日花科灌木，花通常粉色，直径 4.5–5 厘米，形态变化很大。',
  'species.oleander':'夹竹桃','latin.oleander':'Nerium oleander','codex.oleander':'美丽，但只可远观','fact.oleander':'灌木或小乔木，花簇生枝顶，花冠五深裂；叶厚革质、狭披针形。全株有毒，游戏里只作观赏。',
  'species.bougainvillea':'光叶子花','latin.bougainvillea':'Bougainvillea glabra','codex.bougainvillea':'纸做的热烈','fact.bougainvillea':'真正的花很小，白色或淡黄色，约 0.4 厘米；醒目的紫红色部分是纸质的苞片。',
  'species.azalea':'杜鹃','latin.azalea':'Rhododendron simsii','codex.azalea':'满山的思念','fact.azalea':'原生于东亚，在长江以南海拔 500–2700 米处生长；花白色至深红色，叶卵形至倒披针形。',
  'species.chrysanthemum':'菊花','latin.chrysanthemum':'Chrysanthemum × morifolium','codex.chrysanthemum':'秋日里的从容','fact.chrysanthemum':'菊科多年生的杂交种，是秋季最具代表性的花之一。',
  'species.wisteria':'紫藤','latin.wisteria':'Wisteria sinensis','codex.wisteria':'春天垂下的紫色帘子','fact.wisteria':'豆科落叶藤本，原生于中国；15–20 厘米的总状花序在春季先叶开放，羽状复叶有 9–13 片小叶。',
  'species.treepeony':'牡丹','latin.treepeony':'Paeonia × suffruticosa','codex.treepeony':'花中之王，富贵与圆满','fact.treepeony':'人工杂交的栽培类群，起源于中国；花瓣紫红、粉或白色，传统品种多为重瓣。',
})
Object.assign(en, {
  'scene.alpine':'Alpine meadow','scene.rainforest':'Rainforest','scene.coast':'Coast','scene.garden':'Eastern garden',
  'weather.alpine.clear':'Mountain sun','weather.alpine.overcast':'Sea of cloud','weather.alpine.rain':'Mountain rain',
  'weather.rainforest.clear':'Canopy light','weather.rainforest.overcast':'Humid mist','weather.rainforest.rain':'Downpour',
  'weather.coast.clear':'Sea breeze','weather.coast.overcast':'Sea fog','weather.coast.rain':'Sea rain',
  'weather.garden.clear':'Clear','weather.garden.overcast':'Soft cloud','weather.garden.rain':'Plum rain',
  'species.alpineaster':'Alpine aster','latin.alpineaster':'Aster alpinus','codex.alpineaster':'A greeting from the summit','fact.alpineaster':'A perennial in the daisy family with purple, pink, white or blue flowers in summer, native to the mountains of Europe.',
  'species.pasqueflower':'Alpine pasqueflower','latin.pasqueflower':'Pulsatilla alpina','codex.pasqueflower':'First above the snowline','fact.pasqueflower':'A buttercup-family perennial 15–30 cm tall, found at 1,200–2,700 m in the mountains of central and southern Europe.',
  'species.gentian':'Stemless gentian','latin.gentian':'Gentiana acaulis','codex.gentian':'The deep blue of the heights','fact.gentian':'Deep blue trumpets open almost at ground level; it grows at 800–3,000 m in ranges such as the Alps and Pyrenees.',
  'species.alpinecolumbine':'Alpine columbine','latin.alpinecolumbine':'Aquilegia alpina','codex.alpinecolumbine':'Blue with five little horns','fact.alpinecolumbine':'A buttercup-family perennial with light blue to blue-purple flowers, native to the western and central Alps and rare in much of its range.',
  'species.anthurium':'Flamingo flower','latin.anthurium':'Anthurium andraeanum','codex.anthurium':'A warm and open heart','fact.anthurium':'An arum native to Colombia and Ecuador; the bright heart is a spathe, and the true flowers sit on the spadix.',
  'species.heliconia':'Hanging lobster claw','latin.heliconia':'Heliconia rostrata','codex.heliconia':'A string of lanterns in the forest','fact.heliconia':'A rainforest perennial; unlike most heliconias, which face up, its inflorescence hangs down, with red bracts edged in yellow.',
  'species.passionflower':'Blue passionflower','latin.passionflower':'Passiflora caerulea','codex.passionflower':'A clock face ringed with threads','fact.passionflower':'A South American vine whose petals frame a corona of blue-purple filaments.',
  'species.moonorchid':'Moon orchid','latin.moonorchid':'Phalaenopsis amabilis','codex.moonorchid':'White moths resting in moonlight','fact.moonorchid':'An epiphytic orchid with long thick roots, fleshy leaves, and nearly flat, long-lasting white flowers on a branching stem.',
  'species.seathrift':'Sea thrift','latin.seathrift':'Armeria maritima','codex.seathrift':'Pink pompoms on the cliff','fact.seathrift':'A compact evergreen perennial in low clumps, sending up long stems with globes of pink flowers; purple, white and red also occur.',
  'species.spanishlavender':'Spanish lavender','latin.spanishlavender':'Lavandula stoechas','codex.spanishlavender':'Lavender with rabbit ears','fact.spanishlavender':'An evergreen Mediterranean shrub; spikes about 2 cm long are crowned by much larger sterile purple bracts.',
  'species.rockrose':'Pink rock-rose','latin.rockrose':'Cistus creticus','codex.rockrose':'A crumpled-paper flower for a day','fact.rockrose':'A shrub in the rock-rose family, usually with pink flowers 4.5–5 cm across, and very variable.',
  'species.oleander':'Oleander','latin.oleander':'Nerium oleander','codex.oleander':'Lovely, and best admired from afar','fact.oleander':'A shrub or small tree with clustered, deeply five-lobed flowers and thick, narrow, leathery leaves. Every part is poisonous; here it is only for looking at.',
  'species.bougainvillea':'Paperflower','latin.bougainvillea':'Bougainvillea glabra','codex.bougainvillea':'Passion made of paper','fact.bougainvillea':'The true flowers are tiny and white or yellowish, about 0.4 cm; the showy magenta parts are papery bracts.',
  'species.azalea':'Azalea','latin.azalea':'Rhododendron simsii','codex.azalea':'Longing across the hillside','fact.azalea':'Native to East Asia, growing at 500–2,700 m south of the Yangtze; flowers range from white to dark red.',
  'species.chrysanthemum':'Chrysanthemum','latin.chrysanthemum':'Chrysanthemum × morifolium','codex.chrysanthemum':'Composure in autumn','fact.chrysanthemum':'A hybrid perennial in the daisy family, and one of the signature flowers of autumn.',
  'species.wisteria':'Chinese wisteria','latin.wisteria':'Wisteria sinensis','codex.wisteria':'A violet curtain let down in spring','fact.wisteria':'A deciduous vine in the pea family native to China; 15–20 cm racemes open in spring before the leaves, which have 9–13 leaflets.',
  'species.treepeony':'Tree peony','latin.treepeony':'Paeonia × suffruticosa','codex.treepeony':'King of flowers, wealth and fullness','fact.treepeony':'A man-made hybrid group originating in China; petals are reddish-purple, pink or white, often double in traditional cultivars.',
})

// Six more species each for the woodland and the desert, so both grounds hold ten.
const FILL_SPECIES = [
  {id:'woodsorrel',scene:'woodland',cost:8,growSec:80,sell:16,xp:3,head:'woodsorrel',leaf:'heart',pal:{petal:'#fbf6f4',petalDeep:'#e6cfd6',center:'#f3e08a',centerDeep:'#b9a04a',stem:'#7a9a68',leaf:'#7fb06c'},source:'https://en.wikipedia.org/wiki/Oxalis_acetosella'},
  {id:'wildgarlic',scene:'woodland',cost:15,growSec:130,sell:31,xp:5,head:'wildgarlic',leaf:'lance',pal:{petal:'#fafaf2',petalDeep:'#d9dcc8',center:'#cfe0a0',centerDeep:'#86a25a',stem:'#6f9a60',leaf:'#6fae62'},source:'https://en.wikipedia.org/wiki/Allium_ursinum'},
  {id:'sweetviolet',scene:'woodland',cost:22,growSec:185,sell:50,xp:9,head:'sweetviolet',leaf:'heart',pal:{petal:'#6a4bb8',petalDeep:'#432a85',center:'#f6e9b0',centerDeep:'#c99a2c',stem:'#6f9460',leaf:'#6fa35f'},alt:{petal:'#f7f3fa',petalDeep:'#d7cbe6'},source:'https://en.wikipedia.org/wiki/Viola_odorata'},
  {id:'lilyofthevalley',scene:'woodland',cost:34,growSec:300,sell:82,xp:15,head:'lilyofthevalley',leaf:'lance',pal:{petal:'#fdfdf8',petalDeep:'#dfe3d2',center:'#eef2d8',centerDeep:'#a9b98a',stem:'#6f9a60',leaf:'#5f9c5a'},source:'https://en.wikipedia.org/wiki/Lily_of_the_valley'},
  {id:'solomonsseal',scene:'woodland',cost:40,growSec:340,sell:96,xp:18,head:'solomonsseal',leaf:'ovate',pal:{petal:'#f6f7ea',petalDeep:'#8fb86a',center:'#dfe9c0',centerDeep:'#7fa058',stem:'#6a9058',leaf:'#74a864'},source:'https://en.wikipedia.org/wiki/Polygonatum_multiflorum'},
  {id:'trillium',scene:'woodland',cost:58,growSec:480,sell:150,xp:27,head:'trillium',leaf:'ovate',pal:{petal:'#fcfbf6',petalDeep:'#e3ddd2',center:'#f2d458',centerDeep:'#b08a22',stem:'#6f8f5c',leaf:'#5f9a58'},alt:{petal:'#f6c9d8',petalDeep:'#d68aa6'},source:'https://en.wikipedia.org/wiki/Trillium_grandiflorum'},
  {id:'sandverbena',scene:'desert',cost:16,growSec:135,sell:34,xp:6,head:'sandverbena',leaf:'ovate',pal:{petal:'#d94fa8',petalDeep:'#9c2c76',center:'#fbe6f2',centerDeep:'#e09ac4',stem:'#9a8a6a',leaf:'#8fa074'},source:'https://en.wikipedia.org/wiki/Abronia_villosa'},
  {id:'globemallow',scene:'desert',cost:28,growSec:235,sell:62,xp:11,head:'globemallow',leaf:'lobed',pal:{petal:'#f08a4a',petalDeep:'#c25a24',center:'#f6d66a',centerDeep:'#b98a2a',stem:'#8f9a78',leaf:'#a3b094'},alt:{petal:'#f9d6cc',petalDeep:'#e0a394'},source:'https://en.wikipedia.org/wiki/Sphaeralcea_ambigua'},
  {id:'brittlebush',scene:'desert',cost:40,growSec:330,sell:94,xp:17,head:'brittlebush',leaf:'silver',pal:{petal:'#f6c436',petalDeep:'#cf9216',center:'#8a5a2a',centerDeep:'#5a3516',stem:'#8a8a62',leaf:'#b9c2ae'},source:'https://en.wikipedia.org/wiki/Encelia_farinosa'},
  {id:'desertlily',scene:'desert',cost:58,growSec:470,sell:146,xp:26,head:'desertlily',leaf:'strap',pal:{petal:'#fbfbf4',petalDeep:'#b9c8bf',center:'#f3d966',centerDeep:'#b8962a',stem:'#8a9a78',leaf:'#8fa98a'},source:'https://en.wikipedia.org/wiki/Hesperocallis'},
  {id:'ocotillo',scene:'desert',cost:72,growSec:580,sell:188,xp:34,head:'ocotillo',leaf:'ovate',pal:{petal:'#e2342f',petalDeep:'#a01c1c',center:'#f6c85a',centerDeep:'#c2852a',stem:'#7f8a5c',leaf:'#7fa05c'},source:'https://en.wikipedia.org/wiki/Fouquieria_splendens'},
  {id:'saguaro',scene:'desert',cost:90,growSec:700,sell:244,xp:43,head:'saguaro',leaf:'pad',pal:{petal:'#fbfaf2',petalDeep:'#d8d6c4',center:'#f4d75a',centerDeep:'#b8922a',stem:'#5f8a5a',leaf:'#6f9c62'},source:'https://en.wikipedia.org/wiki/Saguaro'},
]
MORE_SPECIES.push(...FILL_SPECIES)
for (const [id,role,season,visitor] of [
  ['woodsorrel','shelter',0,'ladybug'],['wildgarlic','pollen',0,'hoverfly'],['sweetviolet','nectar',0,'bee'],['lilyofthevalley','nectar',0,'bumblebee'],['solomonsseal','shelter',0,'bumblebee'],['trillium','pollen',0,'bee'],
  ['sandverbena','nectar',0,'hawkmoth'],['globemallow','pollen',0,'bee'],['brittlebush','seed',0,'butterfly'],['desertlily','night',0,'hawkmoth'],['ocotillo','nectar',0,'hawkmoth'],['saguaro','night',1,'moth'],
]) ECO_PROFILES[id] = { role, season, visitor }
Object.assign(zh, {
  'species.woodsorrel':'白花酢浆草','latin.woodsorrel':'Oxalis acetosella','codex.woodsorrel':'林荫下的小小欢喜','fact.woodsorrel':'生于林下和阴湿处；五枚白花瓣带粉红色脉纹，三出复叶由三片沿中线对折的心形小叶组成。',
  'species.wildgarlic':'熊葱','latin.wildgarlic':'Allium ursinum','codex.wildgarlic':'春林里的一片星星','fact.wildgarlic':'鳞茎多年生，生于湿润的落叶林；伞形花序上开星形白花，各有六枚花被片，叶椭圆至宽披针形。',
  'species.sweetviolet':'香堇菜','latin.sweetviolet':'Viola odorata','codex.sweetviolet':'低头才闻得到的香','fact.sweetviolet':'生于林缘、林间空地和荫蔽的草地；花有香气，通常深紫或白色，肾形叶组成基生莲座。',
  'species.lilyofthevalley':'铃兰','latin.lilyofthevalley':'Convallaria majalis','codex.lilyofthevalley':'幸福归来','fact.lilyofthevalley':'欧亚林地的半阴植物，开下垂的白色钟形香花，每茎两片叶。全株有毒，游戏里只作观赏。',
  'species.solomonsseal':'多花黄精','latin.solomonsseal':'Polygonatum multiflorum','codex.solomonsseal':'拱起的一道绿桥','fact.solomonsseal':'根茎多年生，喜林下荫蔽；叶互生在拱形的茎上，茎下垂着末端带绿的白色管状花。',
  'species.trillium':'大花延龄草','latin.trillium':'Trillium grandiflorum','codex.trillium':'三片叶，三片瓣','fact.trillium':'原生于北美东部的山地混交林；三片叶状苞片轮生，上面托着一朵三瓣白花，花瓣老去时转粉。',
  'species.sandverbena':'沙马鞭','latin.sandverbena':'Abronia villosa','codex.sandverbena':'沙地上的一团晚霞','fact.sandverbena':'原生于美国西南部和墨西哥北部的沙质荒漠；洋红至紫粉色的小花聚成圆球，叶卵圆、暗绿。',
  'species.globemallow':'沙漠球葵','latin.globemallow':'Sphaeralcea ambigua','codex.globemallow':'一碗杏色的日光','fact.globemallow':'多年生灌木；五瓣的碗状花杏色至橙色，灰绿色的裂叶上有白色绒毛。',
  'species.brittlebush':'脆菊木','latin.brittlebush':'Encelia farinosa','codex.brittlebush':'银叶上的金色花海','fact.brittlebush':'荒漠灌木，生于砾石坡和沙质干沟；菊状花头宽约 3 厘米，有 8–18 枚橙黄色舌状花，叶银白多毛。',
  'species.desertlily':'沙漠百合','latin.desertlily':'Hesperocallis undulata','codex.desertlily':'沙丘里的白色号角','fact.desertlily':'生于莫哈韦和索诺拉沙漠的沙地与沙丘；漏斗形白花每枚花被片背面有一道银灰色条纹，狭长的叶缘呈波状。',
  'species.ocotillo':'蜡烛木','latin.ocotillo':'Fouquieria splendens','codex.ocotillo':'雨后点燃的火把','fact.ocotillo':'半肉质植物，丛生数十根细长带刺的茎；雨后才长出小卵形叶，鲜红的花簇生在茎顶。',
  'species.saguaro':'巨人柱','latin.saguaro':'Carnegiea gigantea','codex.saguaro':'沙漠里举着手臂的巨人','fact.saguaro':'索诺拉沙漠的柱状仙人掌，高 3–16 米，常有分枝的"手臂"；白色蜡质的花四到六月开在茎顶，入夜开放，次日午后闭合。',
})
Object.assign(en, {
  'species.woodsorrel':'Wood-sorrel','latin.woodsorrel':'Oxalis acetosella','codex.woodsorrel':'A small joy in the shade','fact.woodsorrel':'Grows in woods and shady places; five white petals veined with pink, and leaves of three heart-shaped leaflets folded along the middle.',
  'species.wildgarlic':'Wild garlic','latin.wildgarlic':'Allium ursinum','codex.wildgarlic':'A carpet of stars in the spring wood','fact.wildgarlic':'A bulbous perennial of moist deciduous woodland, with umbels of star-shaped white flowers of six tepals and elliptical to broadly lance-shaped leaves.',
  'species.sweetviolet':'Sweet violet','latin.sweetviolet':'Viola odorata','codex.sweetviolet':'A scent you must bow to find','fact.sweetviolet':'Grows at forest edges, in clearings and shaded lawns; the scented flowers are usually dark violet or white, above a rosette of kidney-shaped leaves.',
  'species.lilyofthevalley':'Lily of the valley','latin.lilyofthevalley':'Convallaria majalis','codex.lilyofthevalley':'The return of happiness','fact.lilyofthevalley':'A Eurasian woodland plant of partial shade with sweetly scented, pendulous white bells and two leaves to a stem. Highly poisonous; here it is only for looking at.',
  'species.solomonsseal':"Solomon's seal",'latin.solomonsseal':'Polygonatum multiflorum','codex.solomonsseal':'A green bridge, arching','fact.solomonsseal':'A rhizomatous perennial of shady woodland; alternate leaves sit on arching stems, with green-tipped white tubular flowers hanging beneath.',
  'species.trillium':'White trillium','latin.trillium':'Trillium grandiflorum','codex.trillium':'Three leaves, three petals','fact.trillium':'Native to rich upland forests of eastern North America; one flower of three white petals, turning pink with age, sits above a whorl of three leaf-like bracts.',
  'species.sandverbena':'Desert sand-verbena','latin.sandverbena':'Abronia villosa','codex.sandverbena':'A sunset on the sand','fact.sandverbena':'Native to sandy deserts of the southwestern United States and northern Mexico; rounded clusters of magenta to purplish-pink flowers over oval, dull green leaves.',
  'species.globemallow':'Desert globemallow','latin.globemallow':'Sphaeralcea ambigua','codex.globemallow':'A bowl of apricot light','fact.globemallow':'A perennial shrub with bowl-shaped, five-petalled apricot to orange flowers and grey-green lobed leaves fuzzy with white hairs.',
  'species.brittlebush':'Brittlebush','latin.brittlebush':'Encelia farinosa','codex.brittlebush':'Gold over silver leaves','fact.brittlebush':'A desert shrub of gravelly slopes and sandy washes; daisy-like heads about 3 cm wide carry 8–18 orange-yellow rays above silvery, hairy leaves.',
  'species.desertlily':'Desert lily','latin.desertlily':'Hesperocallis undulata','codex.desertlily':'White trumpets in the dunes','fact.desertlily':'Grows on sandy flats and dunes of the Mojave and Sonoran deserts; funnel-shaped white flowers carry a silvery stripe on the back of each tepal, and the narrow leaves have wavy margins.',
  'species.ocotillo':'Ocotillo','latin.ocotillo':'Fouquieria splendens','codex.ocotillo':'Torches lit after rain','fact.ocotillo':'A semi-succulent clump of dozens of slender, thorny stems; small ovate leaves appear after rain, and bright crimson flowers cluster at the stem tips.',
  'species.saguaro':'Saguaro','latin.saguaro':'Carnegiea gigantea','codex.saguaro':'A giant with raised arms','fact.saguaro':'A columnar cactus of the Sonoran Desert, 3–16 m tall, often with arms; white waxy flowers appear at the tips from April to June, opening at night and closing by the next afternoon.',
})

// Twenty-three more species so the alpine, rainforest, coast and eastern-garden grounds hold ten each.
const FILL2_SPECIES = [
  {id:'mosscampion',scene:'alpine',cost:10,growSec:95,sell:20,xp:4,head:'mosscampion',leaf:'grass',pal:{petal:'#ef7fb0',petalDeep:'#c04f84',center:'#fbe3ee',centerDeep:'#d98fb0',stem:G,leaf:'#6f9e62'},source:'https://en.wikipedia.org/wiki/Silene_acaulis'},
  {id:'mountainavens',scene:'alpine',cost:20,growSec:170,sell:44,xp:8,head:'mountainavens',leaf:'ovate',pal:{petal:'#fbf6e6',petalDeep:'#ddd2b4',center:'#f2cb4a',centerDeep:'#b08a22',stem:G,leaf:'#6a9a5e'},source:'https://en.wikipedia.org/wiki/Dryas_octopetala'},
  {id:'snowbell',scene:'alpine',cost:32,growSec:270,sell:76,xp:14,head:'snowbell',leaf:'ovate',pal:{petal:'#8a7ad8',petalDeep:'#5a4aa8',center:'#efeaf8',centerDeep:'#b9aee0',stem:'#7a8a6a',leaf:'#5f9460'},source:'https://en.wikipedia.org/wiki/Soldanella_alpina'},
  {id:'auricula',scene:'alpine',cost:38,growSec:320,sell:90,xp:16,head:'auricula',leaf:'silver',pal:{petal:'#f6d23c',petalDeep:'#cfa216',center:'#fbf3c6',centerDeep:'#d9c26a',stem:G,leaf:'#8fae82'},source:'https://en.wikipedia.org/wiki/Primula_auricula'},
  {id:'arnica',scene:'alpine',cost:52,growSec:430,sell:132,xp:24,head:'arnica',leaf:'ovate',pal:{petal:'#f7c62e',petalDeep:'#d7921a',center:'#e88a1e',centerDeep:'#a55a10',stem:G,leaf:L},source:'https://en.wikipedia.org/wiki/Arnica_montana'},
  {id:'alpenrose',scene:'alpine',cost:60,growSec:500,sell:154,xp:28,head:'alpenrose',leaf:'lance',pal:{petal:'#e0496e',petalDeep:'#a52848',center:'#fbd3dc',centerDeep:'#c26a82',stem:'#7a6a55',leaf:'#4f8a55'},source:'https://en.wikipedia.org/wiki/Rhododendron_ferrugineum'},
  {id:'guzmania',scene:'rainforest',cost:22,growSec:190,sell:50,xp:9,head:'guzmania',leaf:'strap',pal:{petal:'#e8402c',petalDeep:'#b02418',center:'#f6a43a',centerDeep:'#c2701a',stem:'#4f8a5c',leaf:'#4a9058'},source:'https://en.wikipedia.org/wiki/Guzmania_lingulata'},
  {id:'redginger',scene:'rainforest',cost:36,growSec:300,sell:88,xp:16,head:'redginger',leaf:'paddle',pal:{petal:'#d92a4a',petalDeep:'#9a1630',center:'#f6c6cf',centerDeep:'#c26a7c',stem:'#4f8a5c',leaf:'#4a8a58'},alt:{petal:'#f29ab4',petalDeep:'#cf6485'},source:'https://en.wikipedia.org/wiki/Alpinia_purpurata'},
  {id:'medinilla',scene:'rainforest',cost:54,growSec:450,sell:138,xp:25,head:'medinilla',leaf:'ovate',pal:{petal:'#f3a0bf',petalDeep:'#c2577f',center:'#fbe1ea',centerDeep:'#d98aa6',stem:'#5c8a5a',leaf:'#3f8250'},source:'https://en.wikipedia.org/wiki/Medinilla_magnifica'},
  {id:'torchginger',scene:'rainforest',cost:70,growSec:580,sell:184,xp:33,head:'torchginger',leaf:'paddle',pal:{petal:'#ee5f86',petalDeep:'#b82f58',center:'#fbd0dc',centerDeep:'#d0728f',stem:'#4f8a5c',leaf:'#4a8a58'},source:'https://en.wikipedia.org/wiki/Etlingera_elatior'},
  {id:'cattleya',scene:'rainforest',cost:80,growSec:640,sell:212,xp:38,head:'cattleya',leaf:'paddle',pal:{petal:'#cf9be6',petalDeep:'#8a3fb0',center:'#f6d85a',centerDeep:'#b8922a',stem:'#6a9a62',leaf:'#4f8f5c'},alt:{petal:'#fbf7fb',petalDeep:'#a85fc0'},source:'https://en.wikipedia.org/wiki/Cattleya_labiata'},
  {id:'rafflesia',scene:'rainforest',cost:110,growSec:800,sell:300,xp:52,head:'rafflesia',leaf:'ovate',pal:{petal:'#b8452f',petalDeep:'#7a2418',center:'#e9a57a',centerDeep:'#4a140e',stem:'#6a6248',leaf:'#4f7f52'},source:'https://en.wikipedia.org/wiki/Rafflesia_arnoldii'},
  {id:'seabindweed',scene:'coast',cost:10,growSec:100,sell:21,xp:4,head:'seabindweed',leaf:'heart',pal:{petal:'#f3a6cf',petalDeep:'#c868a0',center:'#fbf0c8',centerDeep:'#d9c06a',stem:'#7a9a66',leaf:'#6fa062'},source:'https://en.wikipedia.org/wiki/Calystegia_soldanella'},
  {id:'seaholly',scene:'coast',cost:30,growSec:250,sell:70,xp:13,head:'seaholly',leaf:'silver',pal:{petal:'#7fa6d6',petalDeep:'#4a70a8',center:'#eef4fb',centerDeep:'#a9c0dc',stem:'#8a9aa8',leaf:'#a9bcc4'},source:'https://en.wikipedia.org/wiki/Eryngium_maritimum'},
  {id:'hornedpoppy',scene:'coast',cost:44,growSec:360,sell:108,xp:20,head:'hornedpoppy',leaf:'silver',pal:{petal:'#f7cf3a',petalDeep:'#d79a1a',center:'#e8a82a',centerDeep:'#a56a14',stem:'#8a9a86',leaf:'#a6b8ae'},alt:{petal:'#f39a3a',petalDeep:'#c66a1c'},source:'https://en.wikipedia.org/wiki/Glaucium_flavum'},
  {id:'agapanthus',scene:'coast',cost:50,growSec:410,sell:124,xp:22,head:'agapanthus',leaf:'strap',pal:{petal:'#6f86e0',petalDeep:'#4458b0',center:'#eef0fb',centerDeep:'#a9b4e6',stem:G,leaf:'#5f9a5a'},alt:{petal:'#f8f8fb',petalDeep:'#cfd4e6'},source:'https://en.wikipedia.org/wiki/Agapanthus_praecox'},
  {id:'seadaffodil',scene:'coast',cost:64,growSec:520,sell:166,xp:30,head:'seadaffodil',leaf:'strap',pal:{petal:'#fdfdf6',petalDeep:'#dcdccc',center:'#f3d966',centerDeep:'#b8962a',stem:'#8a9a86',leaf:'#9fb4a6'},source:'https://en.wikipedia.org/wiki/Pancratium_maritimum'},
  {id:'balloonflower',scene:'garden',cost:18,growSec:160,sell:40,xp:7,head:'balloonflower',leaf:'ovate',pal:{petal:'#6a78e0',petalDeep:'#3f4aa8',center:'#f4f1e2',centerDeep:'#b9b48a',stem:G,leaf:'#4f8a55'},alt:{petal:'#f8f6fb',petalDeep:'#cfc8e0'},source:'https://en.wikipedia.org/wiki/Platycodon'},
  {id:'floweringquince',scene:'garden',cost:34,growSec:280,sell:80,xp:14,head:'floweringquince',leaf:'ovate',pal:{petal:'#e2403e',petalDeep:'#a01f24',center:'#f6d85a',centerDeep:'#b8922a',stem:'#6a5140',leaf:'#6c9a60'},alt:{petal:'#f6b8c2',petalDeep:'#d67f90'},source:'https://en.wikipedia.org/wiki/Chaenomeles_speciosa'},
  {id:'osmanthus',scene:'garden',cost:50,growSec:400,sell:124,xp:22,head:'osmanthus',leaf:'lance',pal:{petal:'#f3a52e',petalDeep:'#c9781a',center:'#fbe6a8',centerDeep:'#d9a84a',stem:'#6a5a45',leaf:'#3f7d50'},alt:{petal:'#fbf3cf',petalDeep:'#e0cf8a'},source:'https://en.wikipedia.org/wiki/Osmanthus_fragrans'},
  {id:'japaneseiris',scene:'garden',cost:56,growSec:460,sell:142,xp:26,head:'japaneseiris',leaf:'strap',pal:{petal:'#7a4fc0',petalDeep:'#4a2a88',center:'#f6d43a',centerDeep:'#c29a1a',stem:G,leaf:'#5f9a5a'},source:'https://en.wikipedia.org/wiki/Iris_ensata'},
  {id:'spiderlily',scene:'garden',cost:72,growSec:580,sell:190,xp:34,head:'spiderlily',leaf:'strap',pal:{petal:'#e03a2e',petalDeep:'#a01c1a',center:'#f6c85a',centerDeep:'#c2852a',stem:'#6f9460',leaf:'#4f8a55'},source:'https://en.wikipedia.org/wiki/Lycoris_radiata'},
  {id:'yulan',scene:'garden',cost:84,growSec:650,sell:222,xp:40,head:'yulan',leaf:'ovate',pal:{petal:'#fdfbf2',petalDeep:'#e3dcc8',center:'#f3e3a0',centerDeep:'#c9b46a',stem:'#6a5a48',leaf:'#6fa862'},source:'https://en.wikipedia.org/wiki/Magnolia_denudata'},
]
MORE_SPECIES.push(...FILL2_SPECIES)
for (const [id,role,season,visitor] of [
  ['mosscampion','pollen',1,'butterfly'],['mountainavens','pollen',1,'bee'],['snowbell','nectar',0,'bumblebee'],['auricula','nectar',0,'bee'],['arnica','seed',1,'butterfly'],['alpenrose','shelter',1,'bumblebee'],
  ['guzmania','water',1,'honeycreeper'],['redginger','nectar',1,'honeycreeper'],['medinilla','shelter',0,'butterfly'],['torchginger','nectar',1,'honeycreeper'],['cattleya','nectar',2,'bee'],['rafflesia','shelter',2,'ladybug'],
  ['seabindweed','pollen',1,'bee'],['seaholly','nectar',1,'butterfly'],['hornedpoppy','pollen',1,'hoverfly'],['agapanthus','nectar',1,'bee'],['seadaffodil','night',1,'hawkmoth'],
  ['balloonflower','pollen',1,'bee'],['floweringquince','nectar',0,'bee'],['osmanthus','nectar',2,'hoverfly'],['japaneseiris','water',1,'butterfly'],['spiderlily','nectar',2,'swallowtail'],['yulan','pollen',0,'ladybug'],
]) ECO_PROFILES[id] = { role, season, visitor }
Object.assign(zh, {
  'species.mosscampion':'无茎蝇子草','latin.mosscampion':'Silene acaulis','codex.mosscampion':'岩缝里的粉色垫子','fact.mosscampion':'贴地生长的常绿多年生植物，长成苔藓般密实的垫状，开单生的星形小花，通常粉色；生于高山和极地的碎石风脊。',
  'species.mountainavens':'仙女木','latin.mountainavens':'Dryas octopetala','codex.mountainavens':'八瓣的小太阳','fact.mountainavens':'极地与高山的常绿亚灌木，生于石灰岩露头和砾石地；花有八枚乳白色花瓣，叶背密被白色绒毛。',
  'species.snowbell':'高山雪铃花','latin.snowbell':'Soldanella alpina','codex.snowbell':'雪融处摇响的小铃','fact.snowbell':'报春花科植物，原生于阿尔卑斯和比利牛斯山。',
  'species.auricula':'耳叶报春','latin.auricula':'Primula auricula','codex.auricula':'山岩上的熊耳朵','fact.auricula':'生于中欧山地的碱性岩石上；黄花成簇开在 5–20 厘米的花葶上，倒卵形的叶组成基生莲座，常覆一层白粉。',
  'species.arnica':'山金车','latin.arnica':'Arnica montana','codex.arnica':'高山草地的金色安慰','fact.arnica':'生于贫瘠酸性的高山草甸；橙黄色的花盘外围有 10–15 枚黄色舌状花，基生叶卵形。植株有毒，游戏里只作观赏。',
  'species.alpenrose':'高山玫瑰杜鹃','latin.alpenrose':'Rhododendron ferrugineum','codex.alpenrose':'林线之上的一片红','fact.alpenrose':'常绿灌木，生于阿尔卑斯和比利牛斯林线之上的酸性土；夏季开成簇的粉红色钟形花，叶背有锈褐色斑点。',
  'species.guzmania':'果子蔓','latin.guzmania':'Guzmania lingulata','codex.guzmania':'树上的红色星星','fact.guzmania':'常绿附生凤梨，生于中南美洲的雨林；叶在基部排成星形莲座，上面托着橙红色苞片组成的花序。',
  'species.redginger':'红姜花','latin.redginger':'Alpinia purpurata','codex.redginger':'一支燃着的红烛','fact.redginger':'原生于马鲁古群岛和西南太平洋岛屿；醒目的花序由洋红至红色的长苞片组成，真正的花藏在里面。',
  'species.medinilla':'宝莲灯','latin.medinilla':'Medinilla magnifica','codex.medinilla':'一层层垂下的粉灯','fact.medinilla':'原生于菲律宾的附生植物；花序下垂可达 50 厘米，带卵形的粉色苞片，对生的叶革质、卵形，长 20–30 厘米。',
  'species.torchginger':'火炬姜','latin.torchginger':'Etlingera elatior','codex.torchginger':'雨林里举起的火炬','fact.torchginger':'多年生草本，原生于马来半岛和印度尼西亚；粉色的头状花序由 20–25 层苞片组成，宽可达 25 厘米。',
  'species.cattleya':'卡特兰','latin.cattleya':'Cattleya labiata','codex.cattleya':'兰中的华服','fact.cattleya':'原生于巴西东北部的附生兰；花大，白色或淡紫色，唇瓣上有一块深色斑，每片革质叶下有一个储水的假鳞茎。',
  'species.rafflesia':'大王花','latin.rafflesia':'Rafflesia arnoldii','codex.rafflesia':'雨林深处的庞然一朵','fact.rafflesia':'生于苏门答腊和婆罗洲的雨林，是世界上最大的单朵花，直径约 1 米；红褐色带白斑。它没有叶、茎和根，完全寄生在崖爬藤里。',
  'species.seabindweed':'肾叶打碗花','latin.seabindweed':'Calystegia soldanella','codex.seabindweed':'沙滩上的小喇叭','fact.seabindweed':'生于海滩沙地的多年生藤本；匍匐的肉质茎上长着肾形叶，开牵牛花一样的粉色至淡紫色花。',
  'species.seaholly':'海滨刺芹','latin.seaholly':'Eryngium maritimum','codex.seaholly':'沙丘上的蓝色盔甲','fact.seaholly':'伞形科多年生植物，生于海岸沙丘和砾石滩；蓝白色小花聚成 1.5–2.5 厘米的蓟状花头，下面是带刺的苞片，叶硬而多刺。',
  'species.hornedpoppy':'黄花海罂粟','latin.hornedpoppy':'Glaucium flavum','codex.hornedpoppy':'海风里的一盏黄灯','fact.hornedpoppy':'生于砾石滩和海崖；花鲜黄或橙色，约 7.5 厘米宽，叶厚、蓝灰色、深裂，果实是 15–30 厘米长的角状蒴果。全株有毒，游戏里只作观赏。',
  'species.agapanthus':'百子莲','latin.agapanthus':'Agapanthus praecox','codex.agapanthus':'爱的花球','fact.agapanthus':'原生于南非；蓝、紫或白色的花排成伞形花序，常绿的带状叶约 2 厘米宽、50 厘米长。',
  'species.seadaffodil':'海水仙','latin.seadaffodil':'Pancratium maritimum','codex.seadaffodil':'夜里盛开的沙滩百合','fact.seadaffodil':'鳞茎多年生，生于地中海和黑海的海滩与沙丘；白花 3–15 朵成伞形，副花冠约为花被片的三分之二长。',
  'species.balloonflower':'桔梗','latin.balloonflower':'Platycodon grandiflorus','codex.balloonflower':'鼓起来的小气球','fact.balloonflower':'东亚原生的多年生草本；花苞像气球一样鼓起，然后开成五裂的钟形花，通常蓝色，叶缘有齿。',
  'species.floweringquince':'贴梗海棠','latin.floweringquince':'Chaenomeles speciosa','codex.floweringquince':'枝头最早的一点红','fact.floweringquince':'原生于东亚的有刺灌木；花通常红色，也有粉、白或绿色，开得很早，有时隆冬就开。',
  'species.osmanthus':'桂花','latin.osmanthus':'Osmanthus fragrans','codex.osmanthus':'秋夜里的甜香','fact.osmanthus':'常绿灌木或小乔木；小花约 1 厘米长，花冠四裂，白色至橙黄色，香气浓郁，夏末和秋季成簇开放。',
  'species.japaneseiris':'花菖蒲','latin.japaneseiris':'Iris ensata','codex.japaneseiris':'水边的紫色衣袖','fact.japaneseiris':'原生于日本、中国、朝鲜半岛和俄罗斯；叶带状，仲夏开紫色的花，垂瓣上有一道黄色斑纹。',
  'species.spiderlily':'石蒜','latin.spiderlily':'Lycoris radiata','codex.spiderlily':'花叶永不相见','fact.spiderlily':'石蒜科鳞茎植物；夏末或秋季在无叶的花葶上开鲜红的花，花被片狭长反卷，雄蕊细长，叶在花后才长出。鳞茎有毒，游戏里只作观赏。',
  'species.yulan':'玉兰','latin.yulan':'Magnolia denudata','codex.yulan':'枝头的白瓷杯','fact.yulan':'原生于中国中部和东部；春季开白色、带柠檬香的花，直径 10–16 厘米，叶卵形，约 15 厘米长。',
})
Object.assign(en, {
  'species.mosscampion':'Moss campion','latin.mosscampion':'Silene acaulis','codex.mosscampion':'A pink cushion in the rocks','fact.mosscampion':'A ground-hugging evergreen perennial forming dense, moss-like cushions with solitary star-shaped flowers, usually pink; it grows on windswept ridges above the treeline.',
  'species.mountainavens':'Mountain avens','latin.mountainavens':'Dryas octopetala','codex.mountainavens':'A small sun of eight petals','fact.mountainavens':'An Arctic–alpine evergreen subshrub of limestone outcrops and gravel; flowers have eight creamy white petals, and the leaves are densely white-woolly beneath.',
  'species.snowbell':'Alpine snowbell','latin.snowbell':'Soldanella alpina','codex.snowbell':'A little bell where the snow melts','fact.snowbell':'A plant of the primrose family native to the Alps and Pyrenees.',
  'species.auricula':'Auricula','latin.auricula':'Primula auricula','codex.auricula':"A bear's ear on the rock",'fact.auricula':'Grows on basic rocks in central European mountains; yellow flowers cluster on stalks of 5–20 cm above a rosette of obovate leaves, often with a mealy white coating.',
  'species.arnica':'Mountain arnica','latin.arnica':'Arnica montana','codex.arnica':'Golden comfort of the high meadow','fact.arnica':'A perennial of poor, acidic alpine meadows; orange-yellow discs are ringed by 10–15 yellow rays above ovate basal leaves. It is toxic; here it is only for looking at.',
  'species.alpenrose':'Alpenrose','latin.alpenrose':'Rhododendron ferrugineum','codex.alpenrose':'Red above the tree line','fact.alpenrose':'An evergreen shrub just above the tree line on acidic soils in the Alps and Pyrenees, with clusters of pinkish-red bells in summer and rust-brown spots under the leaves.',
  'species.guzmania':'Scarlet star','latin.guzmania':'Guzmania lingulata','codex.guzmania':'A red star in the branches','fact.guzmania':'An evergreen epiphytic bromeliad of Central and South American rainforests; a star-shaped leaf rosette carries an inflorescence of orange and red bracts.',
  'species.redginger':'Red ginger','latin.redginger':'Alpinia purpurata','codex.redginger':'A red candle, burning','fact.redginger':'Native to the Maluku Islands and the southwest Pacific; the showy head is made of long magenta-to-red bracts that hide the true flowers.',
  'species.medinilla':'Rose grape','latin.medinilla':'Medinilla magnifica','codex.medinilla':'Pink lanterns, tier on tier','fact.medinilla':'An epiphyte native to the Philippines; flowers hang in panicles up to 50 cm long with egg-shaped pink bracts, and the opposite leaves are leathery, ovate and 20–30 cm long.',
  'species.torchginger':'Torch ginger','latin.torchginger':'Etlingera elatior','codex.torchginger':'A torch raised in the forest','fact.torchginger':'A herbaceous perennial native to the Malay Peninsula and Indonesia; pink, head-like inflorescences up to 25 cm across are built from 20–25 layers of bracts.',
  'species.cattleya':'Crimson cattleya','latin.cattleya':'Cattleya labiata','codex.cattleya':'An orchid in full dress','fact.cattleya':'An epiphytic orchid native to northeastern Brazil; large white or lavender blooms have a darker spot on the lip, and each leathery leaf sits on a water-storing pseudobulb.',
  'species.rafflesia':'Giant rafflesia','latin.rafflesia':'Rafflesia arnoldii','codex.rafflesia':'One enormous bloom in the deep forest','fact.rafflesia':'From the rainforests of Sumatra and Borneo, it makes the largest single flower on Earth, about 1 m across, reddish-brown with white spots. It has no leaves, stems or roots and lives inside Tetrastigma vines.',
  'species.seabindweed':'Sea bindweed','latin.seabindweed':'Calystegia soldanella','codex.seabindweed':'A small trumpet on the sand','fact.seabindweed':'A perennial vine of beach sand; trailing fleshy stems carry kidney-shaped leaves and morning-glory flowers from pink to lavender.',
  'species.seaholly':'Sea holly','latin.seaholly':'Eryngium maritimum','codex.seaholly':'Blue armour on the dunes','fact.seaholly':'A carrot-family perennial of coastal dunes and shingle; small bluish-white flowers pack into thistle-like heads of 1.5–2.5 cm above spiny bracts, with stiff, spiny, bluish-grey leaves.',
  'species.hornedpoppy':'Yellow horned poppy','latin.hornedpoppy':'Glaucium flavum','codex.hornedpoppy':'A yellow lamp in the sea wind','fact.hornedpoppy':'Grows on shingle and cliff tops; bright yellow or orange flowers about 7.5 cm across, thick bluish-grey lobed leaves, and a horn-shaped pod 15–30 cm long. Every part is toxic; here it is only for looking at.',
  'species.agapanthus':'African lily','latin.agapanthus':'Agapanthus praecox','codex.agapanthus':'A globe of love','fact.agapanthus':'From South Africa; open-faced blue, purple or white blooms are arranged in umbels above evergreen strap-like leaves about 2 cm wide and 50 cm long.',
  'species.seadaffodil':'Sea daffodil','latin.seadaffodil':'Pancratium maritimum','codex.seadaffodil':'A beach lily that opens at night','fact.seadaffodil':'A bulbous perennial of beaches and dunes around the Mediterranean and Black Sea; white flowers come in umbels of 3–15, each with a corona about two-thirds as long as the tepals.',
  'species.balloonflower':'Balloon flower','latin.balloonflower':'Platycodon grandiflorus','codex.balloonflower':'A little balloon, puffed up','fact.balloonflower':'A herbaceous perennial native to East Asia; buds puff up like balloons before opening into five-lobed bells, typically blue, above toothed leaves.',
  'species.floweringquince':'Flowering quince','latin.floweringquince':'Chaenomeles speciosa','codex.floweringquince':'The first red on the branch','fact.floweringquince':'A thorny shrub native to eastern Asia; flowers are usually red but may be pink, white or green, and appear early, occasionally even in midwinter.',
  'species.osmanthus':'Sweet osmanthus','latin.osmanthus':'Osmanthus fragrans','codex.osmanthus':'Sweetness on an autumn night','fact.osmanthus':'An evergreen shrub or small tree; small, strongly scented flowers about 1 cm long with a four-lobed corolla, white to orange-yellow, cluster in late summer and autumn.',
  'species.japaneseiris':'Japanese iris','latin.japaneseiris':'Iris ensata','codex.japaneseiris':'Purple sleeves by the water','fact.japaneseiris':'Native to Japan, China, Korea and Russia; strap-shaped leaves and purple midsummer blooms marked with a yellow flash on the falls.',
  'species.spiderlily':'Red spider lily','latin.spiderlily':'Lycoris radiata','codex.spiderlily':'Flower and leaf never meet','fact.spiderlily':'A bulb in the amaryllis family; bright red flowers with narrow, backward-curving segments and long stamens open on leafless stalks in late summer or autumn, before the leaves. The bulbs are poisonous; here it is only for looking at.',
  'species.yulan':'Yulan magnolia','latin.yulan':'Magnolia denudata','codex.yulan':'White porcelain cups on the branch','fact.yulan':'From central and eastern China; white, lemon-scented blooms 10–16 cm across open in spring, and the ovate leaves are about 15 cm long.',
})
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
    SCENES.push(
      {id:'woodland',cost:1800,tint:'rgba(69,119,83,.12)',edge:'rgba(69,119,83,.4)',weather:{clear:1.05,overcast:1.15,rain:1.1},rainWets:true,species:[]},
      {id:'desert',cost:2600,tint:'rgba(194,151,87,.12)',edge:'rgba(194,151,87,.4)',weather:{clear:1.2,overcast:1.05,rain:.85},rainWets:false,species:[]})
    SCENES.push(...MORE_SCENES)
    const SCENE_BY_ID = new Map(SCENES.map(scene => [scene.id, scene]))
    const SCENE_ID_OF = new Map()
    for (const scene of SCENES) for (const id of scene.species) SCENE_ID_OF.set(id, scene.id)

    const SPECIES = [
      // ── meadow ──────────────────────────────────────────────────────────
      {
        id: 'dandelion', cost: 3, growSec: 45, sell: 6, xp: 1, head: 'dandelion', leaf: 'runcinate',
        pal: { petal: '#f8cd4b', petalDeep: '#e0a923', center: '#f2b62f', centerDeep: '#c98a14', stem: '#8ab06a', leaf: '#95bf72' },
      },
      {
        id: 'daisy', cost: 5, growSec: 60, sell: 10, xp: 2, head: 'daisy', leaf: 'spoon',
        pal: { petal: '#fbfaf1', petalDeep: '#e4dcc4', center: '#f5c542', centerDeep: '#d99d20', stem: '#7aa86a', leaf: '#8bbf74' },
        alt: { petal: '#f7c6d4', petalDeep: '#e2a5b9' },
      },
      {
        id: 'cherry', cost: 10, growSec: 120, sell: 21, xp: 4, head: 'cherry', leaf: 'twig',
        pal: { petal: '#f9d5e0', petalDeep: '#eeb0c5', center: '#f3b3c6', centerDeep: '#d98ba0', stem: '#8a6d57', leaf: '#7fae72' },
        alt: { petal: '#fdfdfd', petalDeep: '#e6e2df', center: '#f3d7b8', centerDeep: '#dcc09c' },
      },
      {
        id: 'tulip', cost: 14, growSec: 150, sell: 29, xp: 5, head: 'tulip', leaf: 'strap',
        pal: { petal: '#f0718f', petalDeep: '#cf4d70', center: '#ffd9e4', centerDeep: '#e9a4b8', stem: '#6fa85f', leaf: '#82b872' },
        alt: { petal: '#f6d15c', petalDeep: '#d9ae33' },
      },
      {
        id: 'lavender', cost: 18, growSec: 180, sell: 38, xp: 7, head: 'lavender', leaf: 'needle',
        pal: { petal: '#9b86d8', petalDeep: '#7c68bd', center: '#b6a5e6', centerDeep: '#8d7cc9', stem: '#8fa87a', leaf: '#9db98a' },
      },
      {
        id: 'poppy', cost: 22, growSec: 210, sell: 47, xp: 9, head: 'poppy', leaf: 'pinnate',
        pal: { petal: '#e6483f', petalDeep: '#bb2f29', center: '#2f2b28', centerDeep: '#1c1a18', stem: '#7fa05f', leaf: '#88ab66' },
        alt: { petal: '#fbf6ef', petalDeep: '#e2d9cc' },
      },
      {
        id: 'sunflower', cost: 26, growSec: 240, sell: 56, xp: 11, head: 'sunflower', leaf: 'heart',
        pal: { petal: '#f7b733', petalDeep: '#dd9a1a', center: '#6b4226', centerDeep: '#4d2d18', stem: '#6f9c4f', leaf: '#7fae5c' },
      },
      {
        id: 'lily', cost: 32, growSec: 290, sell: 70, xp: 13, head: 'lily', leaf: 'whorl',
        pal: { petal: '#fbf6ec', petalDeep: '#e9c6cd', center: '#e8a63a', centerDeep: '#c8862a', stem: '#6fa05f', leaf: '#7fb46e' },
        alt: { petal: '#f6c9d6', petalDeep: '#dfa6ba' },
      },
      {
        id: 'rose', cost: 40, growSec: 340, sell: 88, xp: 17, head: 'rose', leaf: 'rose',
        pal: { petal: '#e2466c', petalDeep: '#b62f52', center: '#8e2242', centerDeep: '#6f1832', stem: '#5f8f52', leaf: '#6fa860' },
        alt: { petal: '#fbf5ec', petalDeep: '#e0d2c0', center: '#e8d8b8', centerDeep: '#c9b48c' },
      },
      {
        id: 'hydrangea', cost: 50, growSec: 400, sell: 112, xp: 22, head: 'mophead', leaf: 'serrate',
        pal: { petal: '#8f9bf0', petalDeep: '#6d78d8', center: '#b9c0f8', centerDeep: '#8a93e2', stem: '#7fa76a', leaf: '#8bb877' },
        alt: { petal: '#f2a8c6', petalDeep: '#d97fa6', center: '#f7c6d9', centerDeep: '#e5a0be' },
      },
      // ── snowfield ───────────────────────────────────────────────────────
      {
        id: 'snowdrop', cost: 8, growSec: 90, sell: 17, xp: 3, head: 'snowdrop', leaf: 'strap',
        pal: { petal: '#fbfdff', petalDeep: '#dbe4ee', center: '#8fbf7a', centerDeep: '#5f8f4f', stem: '#7fa07a', leaf: '#8fae8a' },
      },
      {
        id: 'hellebore', cost: 16, growSec: 170, sell: 35, xp: 6, head: 'hellebore', leaf: 'palmate',
        pal: { petal: '#f6f1ea', petalDeep: '#ddcfc0', center: '#a8c47f', centerDeep: '#7d9a58', stem: '#6f8a5c', leaf: '#7d9a68' },
        alt: { petal: '#e7b9cd', petalDeep: '#c992ab' },
      },
      {
        id: 'plum', cost: 24, growSec: 230, sell: 52, xp: 10, head: 'plum', leaf: 'twig',
        pal: { petal: '#f7b9cd', petalDeep: '#dd8fa9', center: '#f7d76a', centerDeep: '#d8b23c', stem: '#6b5548', leaf: '#7c9a6a' },
        alt: { petal: '#fdfbf7', petalDeep: '#e5dccd' },
      },
      {
        id: 'edelweiss', cost: 34, growSec: 300, sell: 75, xp: 14, head: 'edelweiss', leaf: 'woolly',
        pal: { petal: '#faf7ef', petalDeep: '#dfd8c6', center: '#e8c65a', centerDeep: '#c9a633', stem: '#8a9a72', leaf: '#9aa885' },
      },
      {
        id: 'camellia', cost: 46, growSec: 370, sell: 104, xp: 20, head: 'camellia', leaf: 'glossy',
        pal: { petal: '#e3588c', petalDeep: '#b8465f', center: '#8c2740', centerDeep: '#6b1930', stem: '#5f7f52', leaf: '#6f9a60' },
        alt: { petal: '#fdfbf6', petalDeep: '#e6ded1', center: '#e8ddc7', centerDeep: '#cbb999' },
      },
      // ── volcanic crater ─────────────────────────────────────────────────
      {
        id: 'cactus', cost: 12, growSec: 130, sell: 26, xp: 4, head: 'cactus', leaf: 'pad',
        pal: { petal: '#f6c34a', petalDeep: '#d9a02a', center: '#c9603f', centerDeep: '#9c4529', stem: '#6f9a5e', leaf: '#7fae6a' },
        alt: { petal: '#f08a4b', petalDeep: '#c96a30' },
      },
      {
        id: 'lehua', cost: 22, growSec: 200, sell: 46, xp: 8, head: 'pompom', leaf: 'leathery',
        pal: { petal: '#e34b3f', petalDeep: '#b93129', center: '#f6b23c', centerDeep: '#d18c1f', stem: '#6f7f52', leaf: '#7f9460' },
      },
      {
        id: 'agave', cost: 36, growSec: 310, sell: 80, xp: 15, head: 'agave', leaf: 'rosette',
        pal: { petal: '#e8d98a', petalDeep: '#c9b85c', center: '#b8a24a', centerDeep: '#8f7c2e', stem: '#7f9a6a', leaf: '#9aa885' },
      },
      {
        id: 'silversword', cost: 52, growSec: 420, sell: 120, xp: 23, head: 'silversword', leaf: 'silver',
        pal: { petal: '#b3567f', petalDeep: '#83365a', center: '#e6c47c', centerDeep: '#b08d3c', stem: '#9aa8a0', leaf: '#b6c2bb' },
      },
      {
        id: 'plumeria', cost: 64, growSec: 500, sell: 152, xp: 29, head: 'plumeria', leaf: 'paddle',
        pal: { petal: '#fdf4f6', petalDeep: '#efd3dc', center: '#f7cf5a', centerDeep: '#d9ab2c', stem: '#7f8f62', leaf: '#8fa870' },
        alt: { petal: '#f3a8bf', petalDeep: '#dc7f9c' },
      },
      // ── lakeside ────────────────────────────────────────────────────────
      {
        id: 'pickerel', cost: 14, growSec: 140, sell: 30, xp: 4, head: 'pickerel', leaf: 'arrow',
        pal: { petal: '#7d8ee0', petalDeep: '#5f6fc4', center: '#a9b6ef', centerDeep: '#818fce', stem: '#6f9a72', leaf: '#7fae80' },
      },
      {
        id: 'loosestrife', cost: 26, growSec: 220, sell: 55, xp: 10, head: 'loosestrife', leaf: 'opposite',
        pal: { petal: '#c95a9c', petalDeep: '#a53e7c', center: '#e3a0c4', centerDeep: '#c478a2', stem: '#6f9a62', leaf: '#82ae6c' },
      },
      {
        id: 'iris', cost: 38, growSec: 300, sell: 82, xp: 15, head: 'iris', leaf: 'sword',
        pal: { petal: '#f2c53d', petalDeep: '#d3a521', center: '#c98a2a', centerDeep: '#9c671a', stem: '#6f9a5c', leaf: '#82ae6a' },
        alt: { petal: '#f7f2e6', petalDeep: '#ded4c0' },
      },
      {
        id: 'waterlily', cost: 54, growSec: 400, sell: 120, xp: 22, head: 'waterlily', leaf: 'float',
        pal: { petal: '#fdf3f7', petalDeep: '#efc9da', center: '#f2c33c', centerDeep: '#d09d1f', stem: '#5f8f7a', leaf: '#6f9a78' },
        alt: { petal: '#f3b7cf', petalDeep: '#dd8fae' },
      },
      {
        id: 'lotus', cost: 70, growSec: 520, sell: 165, xp: 30, head: 'lotus', leaf: 'peltate',
        pal: { petal: '#f29ac0', petalDeep: '#d974a0', center: '#f8d96a', centerDeep: '#d8b53a', stem: '#6f9a6a', leaf: '#7fae74' },
        alt: { petal: '#fdfbf7', petalDeep: '#e8e0d2' },
      },
    ]
const NEW_SPECIES = [
  { id: 'cosmos', scene: 'meadow', cost: 8, growSec: 100, sell: 17, xp: 3, head: 'cosmos', leaf: 'pinnate', pal: { petal: '#e68bb7', petalDeep: '#b94584', center: '#f6cd45', centerDeep: '#a67818', stem: '#719958', leaf: '#82a766' }, alt: { petal: '#fff9f2', petalDeep: '#e3d8c9' } },
  { id: 'zinnia', scene: 'meadow', cost: 20, growSec: 195, sell: 42, xp: 8, head: 'zinnia', leaf: 'opposite', pal: { petal: '#e86870', petalDeep: '#b93053', center: '#e9ad32', centerDeep: '#98541b', stem: '#67874a', leaf: '#80a85c' }, alt: { petal: '#f2b546', petalDeep: '#d17f25' } },
  { id: 'cornflower', scene: 'meadow', cost: 16, growSec: 165, sell: 34, xp: 6, head: 'cornflower', leaf: 'needle', pal: { petal: '#688fe0', petalDeep: '#4053a8', center: '#655197', centerDeep: '#40335f', stem: '#6e9272', leaf: '#8ba88a' } },
  { id: 'calendula', scene: 'meadow', cost: 12, growSec: 135, sell: 26, xp: 5, head: 'calendula', leaf: 'spoon', pal: { petal: '#f6b442', petalDeep: '#dc7527', center: '#a95c23', centerDeep: '#6e391c', stem: '#739755', leaf: '#8aaf68' } },
  { id: 'snapdragon', scene: 'meadow', cost: 56, growSec: 450, sell: 128, xp: 25, head: 'snapdragon', leaf: 'opposite', pal: { petal: '#e685ae', petalDeep: '#ba4b83', center: '#f8de91', centerDeep: '#dba849', stem: '#6c8e55', leaf: '#83a76b' }, alt: { petal: '#f8e09a', petalDeep: '#ddba58' } },
  { id: 'crocus', scene: 'snow', cost: 10, growSec: 110, sell: 22, xp: 4, head: 'crocus', leaf: 'strap', pal: { petal: '#b391df', petalDeep: '#7e5ab2', center: '#efa735', centerDeep: '#bb651c', stem: '#7e9662', leaf: '#799b66' }, alt: { petal: '#f8f6ed', petalDeep: '#ded9d0' } },
  { id: 'daffodil', scene: 'snow', cost: 20, growSec: 200, sell: 44, xp: 8, head: 'daffodil', leaf: 'strap', pal: { petal: '#fae16c', petalDeep: '#d6b842', center: '#f7ae31', centerDeep: '#bb7621', stem: '#7e9c63', leaf: '#94ac76' } },
  { id: 'primrose', scene: 'snow', cost: 14, growSec: 150, sell: 31, xp: 5, head: 'primrose', leaf: 'spoon', pal: { petal: '#fbefba', petalDeep: '#ddce86', center: '#e4b337', centerDeep: '#a87a1d', stem: '#76985c', leaf: '#8aad6a' } },
  { id: 'pansy', scene: 'snow', cost: 30, growSec: 270, sell: 66, xp: 12, head: 'pansy', leaf: 'serrate', pal: { petal: '#a984d5', petalDeep: '#6b4794', center: '#f1cb51', centerDeep: '#4c305d', stem: '#729561', leaf: '#8ab075' }, alt: { petal: '#f5d25a', petalDeep: '#d9aa2b' } },
  { id: 'bleedingheart', scene: 'snow', cost: 60, growSec: 470, sell: 140, xp: 26, head: 'bleedingheart', leaf: 'pinnate', pal: { petal: '#eb85a6', petalDeep: '#bd4e7b', center: '#fff7f5', centerDeep: '#ddcbd2', stem: '#81976a', leaf: '#8da87c' } },
  { id: 'hibiscus', scene: 'volcano', cost: 28, growSec: 250, sell: 61, xp: 11, head: 'hibiscus', leaf: 'serrate', pal: { petal: '#ee7068', petalDeep: '#ba3b46', center: '#f5cc57', centerDeep: '#a76a20', stem: '#648950', leaf: '#7aa45f' }, alt: { petal: '#f5b257', petalDeep: '#d7833b' } },
  { id: 'birdofparadise', scene: 'volcano', cost: 82, growSec: 580, sell: 195, xp: 34, head: 'birdofparadise', leaf: 'paddle', pal: { petal: '#f39837', petalDeep: '#c56820', center: '#5070b4', centerDeep: '#304b8b', stem: '#658b62', leaf: '#7b9b71' } },
  { id: 'gazania', scene: 'volcano', cost: 18, growSec: 180, sell: 39, xp: 7, head: 'gazania', leaf: 'pinnate', pal: { petal: '#f8bf42', petalDeep: '#d4812d', center: '#9b6227', centerDeep: '#5b3627', stem: '#74895c', leaf: '#94a887' } },
  { id: 'redhotpoker', scene: 'volcano', cost: 44, growSec: 360, sell: 100, xp: 19, head: 'redhotpoker', leaf: 'strap', pal: { petal: '#ed813d', petalDeep: '#c14b2b', center: '#f5cf58', centerDeep: '#b49b35', stem: '#82905d', leaf: '#94a76c' } },
  { id: 'desertrose', scene: 'volcano', cost: 96, growSec: 650, sell: 232, xp: 39, head: 'desertrose', leaf: 'glossy', pal: { petal: '#ef96b8', petalDeep: '#bb527f', center: '#fff6df', centerDeep: '#d4b977', stem: '#9a9982', leaf: '#7e9f65' } },
  { id: 'marshmarigold', scene: 'lake', cost: 18, growSec: 170, sell: 39, xp: 6, head: 'marshmarigold', leaf: 'heart', pal: { petal: '#f7d143', petalDeep: '#d5a527', center: '#edb92f', centerDeep: '#a7781d', stem: '#72965e', leaf: '#82ab6c' } },
  { id: 'forgetmenot', scene: 'lake', cost: 22, growSec: 190, sell: 47, xp: 7, head: 'forgetmenot', leaf: 'opposite', pal: { petal: '#93c4ec', petalDeep: '#658fcb', center: '#f5d85b', centerDeep: '#b89b35', stem: '#739e71', leaf: '#8ab285' } },
  { id: 'astilbe', scene: 'lake', cost: 46, growSec: 350, sell: 105, xp: 19, head: 'astilbe', leaf: 'pinnate', pal: { petal: '#d79bc3', petalDeep: '#a96599', center: '#f0c6de', centerDeep: '#b47b9c', stem: '#7f9066', leaf: '#90a474' } },
  { id: 'cardinalflower', scene: 'lake', cost: 62, growSec: 460, sell: 146, xp: 27, head: 'cardinalflower', leaf: 'serrate', pal: { petal: '#e44d44', petalDeep: '#ac2f36', center: '#f79b68', centerDeep: '#c94e37', stem: '#79865a', leaf: '#8ca36b' } },
  { id: 'arrowhead', scene: 'lake', cost: 84, growSec: 590, sell: 202, xp: 35, head: 'arrowhead', leaf: 'arrow', pal: { petal: '#fffaf0', petalDeep: '#ddd8c8', center: '#e7c24d', centerDeep: '#a18b2c', stem: '#6d965f', leaf: '#80a86c' } },
]
    SPECIES.push(...NEW_SPECIES)
    for (const species of NEW_SPECIES) {
      SCENE_BY_ID.get(species.scene).species.push(species.id)
      SCENE_ID_OF.set(species.id, species.scene)
      species.source = ['crocus','astilbe','arrowhead'].includes(species.id)
        ? `https://en.wikipedia.org/wiki/${({crocus:'Crocus_vernus',astilbe:'Astilbe_chinensis',arrowhead:'Sagittaria_sagittifolia'})[species.id]}`
        : `https://plants.ces.ncsu.edu/plants/${({cosmos:'cosmos-bipinnatus',zinnia:'zinnia-elegans',cornflower:'centaurea-cyanus',calendula:'calendula-officinalis',snapdragon:'antirrhinum-majus',daffodil:'narcissus-pseudonarcissus',primrose:'primula-vulgaris',pansy:'viola-tricolor',bleedingheart:'lamprocapnos-spectabilis',hibiscus:'hibiscus-rosa-sinensis',birdofparadise:'strelitzia-reginae',gazania:'gazania-rigens',redhotpoker:'kniphofia-uvaria',desertrose:'adenium-obesum',marshmarigold:'caltha-palustris',forgetmenot:'myosotis-scorpioides',cardinalflower:'lobelia-cardinalis'})[species.id]}/`
    }
const REGION_SPECIES = [
  { id:'foxglove', scene:'woodland', cost:28, growSec:260, sell:68, xp:12, head:'foxglove', leaf:'serrate', pal:{petal:'#9d72bd',petalDeep:'#68417f',center:'#f2d9a2',centerDeep:'#ab7a4d',stem:'#66885a',leaf:'#7fa56b'}, source:'https://en.wikipedia.org/wiki/Digitalis_purpurea' },
  { id:'bluebell', scene:'woodland', cost:18, growSec:150, sell:38, xp:7, head:'bluebell', leaf:'strap', pal:{petal:'#6f83cf',petalDeep:'#46569c',center:'#f5ead0',centerDeep:'#c9b37d',stem:'#6f955e',leaf:'#8ca66b'}, source:'https://en.wikipedia.org/wiki/Hyacinthoides_non-scripta' },
  { id:'cyclamen', scene:'woodland', cost:46, growSec:380, sell:112, xp:21, head:'cyclamen', leaf:'ivy', pal:{petal:'#d97ca5',petalDeep:'#914568',center:'#f5e3df',centerDeep:'#b77e8a',stem:'#6f855e',leaf:'#8ea679'}, alt:{petal:'#f8f0e8',petalDeep:'#d8c7ba'}, source:'https://en.wikipedia.org/wiki/Cyclamen_hederifolium' },
  { id:'woodanemone', scene:'woodland', cost:12, growSec:115, sell:25, xp:4, head:'woodanemone', leaf:'palmate', pal:{petal:'#f8f5eb',petalDeep:'#d8d4c8',center:'#edc95b',centerDeep:'#a47b23',stem:'#789964',leaf:'#8eae72'}, alt:{petal:'#d9c5e8',petalDeep:'#aa8bc2'}, source:'https://en.wikipedia.org/wiki/Anemone_nemorosa' },
  { id:'californiapoppy', scene:'desert', cost:22, growSec:175, sell:44, xp:8, head:'californiapoppy', leaf:'fern', pal:{petal:'#f3a33e',petalDeep:'#c86b27',center:'#d8892c',centerDeep:'#8d4b20',stem:'#718f55',leaf:'#8da46d'}, alt:{petal:'#f3d55b',petalDeep:'#d2a62b'}, source:'https://en.wikipedia.org/wiki/Eschscholzia_californica' },
  { id:'desertmarigold', scene:'desert', cost:34, growSec:290, sell:78, xp:14, head:'desertmarigold', leaf:'silver', pal:{petal:'#f5d653',petalDeep:'#d09f28',center:'#b47729',centerDeep:'#744314',stem:'#84915e',leaf:'#b2b79b'}, source:'https://en.wikipedia.org/wiki/Baileya_multiradiata' },
  { id:'penstemon', scene:'desert', cost:52, growSec:420, sell:126, xp:23, head:'penstemon', leaf:'strap', pal:{petal:'#e74e4e',petalDeep:'#a62d35',center:'#efcf72',centerDeep:'#a98235',stem:'#6d8d5a',leaf:'#829e69'}, source:'https://en.wikipedia.org/wiki/Penstemon_barbatus' },
  { id:'eveningprimrose', scene:'desert', cost:64, growSec:610, sell:170, xp:31, head:'eveningprimrose', leaf:'lance', pal:{petal:'#f7dd67',petalDeep:'#d4ae35',center:'#f1b34b',centerDeep:'#a86b23',stem:'#72885d',leaf:'#8ca06c'}, source:'https://en.wikipedia.org/wiki/Oenothera_biennis' },
]
    SPECIES.push(...REGION_SPECIES, ...MORE_SPECIES)
    for(const species of MORE_SPECIES){SCENE_BY_ID.get(species.scene).species.push(species.id);SCENE_ID_OF.set(species.id,species.scene)}
    for(const species of REGION_SPECIES){SCENE_BY_ID.get(species.scene).species.push(species.id);SCENE_ID_OF.set(species.id,species.scene)}
    const SPECIES_BY_ID = new Map(SPECIES.map(species => [species.id, species]))
    for (const scene of SCENES) scene.species.sort((a,b) => SPECIES_BY_ID.get(a).cost - SPECIES_BY_ID.get(b).cost)


    /** Every codex entry: species × variant, including the gold hidden bloom. */
    Object.assign(ECO_PROFILES,{
      foxglove:{role:'nectar',season:1,visitor:'bumblebee'},bluebell:{role:'nectar',season:0,visitor:'bee'},cyclamen:{role:'shelter',season:2,visitor:'robin'},woodanemone:{role:'pollen',season:0,visitor:'bee'},
      californiapoppy:{role:'pollen',season:0,visitor:'bee'},desertmarigold:{role:'pollen',season:1,visitor:'butterfly'},penstemon:{role:'nectar',season:1,visitor:'hawkmoth'},eveningprimrose:{role:'night',season:2,visitor:'moth'}
    })
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
    const CHARM_BONUS = 0.03
    /** Ceiling of the spirit chance, without and with a lucky charm. */
    const HIDDEN_CAP = 0.1
    const CHARM_CAP = 0.15

    /** Shop goods: consumables sit in the bag, the basket upgrade has levels. */
    const ITEMS = [
      { id: 'fertilizer', price: 35, kind: 'consumable' },
      { id: 'compost', price: 25, kind: 'consumable' },
      { id: 'sprinkler', price: 90, kind: 'consumable' },
      { id: 'charm', price: 120, kind: 'consumable' },
      { id: 'basket', price: 150, kind: 'upgrade', maxLevel: 4 },
    ]
    const ITEM_BY_ID = new Map(ITEMS.map(item => [item.id, item]))

    function basketCapacity(state) {
      return [BASKET_CAPACITY, 30, 50, 75, 100][Math.max(0,Math.min(4,Math.floor(finiteOr(state.basketLevel,0))))]
    }
    const ORDER_SLOTS = 2

    /** The flower market favours one species a day. */
    const MARKET_BONUS = 1.5

    /**
     * Keeping the garden in balance. Soil tires with every harvest and faster
     * under the same crop; rotation, rest and compost restore it. The market
     * tires of a flower sold in bulk and recovers with time. Facilities cost
     * more at every level and, past the first, ribbons from the flower show.
     */
    const SOIL_HARVEST = 14
    const SOIL_REPEAT = 10
    const SOIL_ROTATE = 8
    const SOIL_REST_MS = 60 * 1000
    const SOIL_FLOOR = 0.55
    const COMPOST_GAIN = 60
    const GLUT_STEP = 0.05
    const GLUT_FLOOR = 0.5
    const GLUT_RECOVER_MS = 2 * 60 * 1000
    const TRAIT_PRICE = 2
    const HYBRID_PRICE = 1.5
    const HYBRID_CHANCE = 0.45
    const FACILITIES = [
      { id: 'hive', base: 200, step: 0.025 },
      { id: 'greenhouse', base: 300, step: 0.1 },
      { id: 'bench', base: 250, step: 0.05 },
    ]
    const FACILITY_BY_ID = new Map(FACILITIES.map(entry => [entry.id, entry]))
    const FACILITY_MAX = 8
    const FACILITY_GROWTH = 1.8

    /** The flower show: a themed, time-limited exhibition that pays in ribbons, not coins. */
    const SHOW_MS = 6 * 60 * 60 * 1000
    const SHOW_SLOTS = 8
    const SHOW_TIERS = [{ points: 6, ribbons: 1 }, { points: 14, ribbons: 2 }, { points: 24, ribbons: 3 }]
    const SEASONS = ['spring', 'summer', 'autumn', 'winter']
    const SEASON_SCENE = { spring: 'meadow', summer: 'volcano', autumn: 'lake', winter: 'snow' }
    const SHOW_THEMES = ['ground', 'warm', 'cool', 'rare']

    /**
     * Visitors come to open flowers. A plot's visitor is a pure function of the
     * clock, so it needs no timers and survives a reload: each `VISIT_MS` window
     * rolls once per plot. `when` is day, night or any; `dry` visitors stay away in rain.
     */
    const VISIT_MS = 45 * 1000
    const VISIT_CHANCE = 0.34
    const VISITORS = [
      { id: 'bee', scenes: ['meadow', 'volcano', 'lake'], when: 'day', weight: 5, tip: 2 },
      { id: 'butterfly', scenes: ['meadow', 'lake'], when: 'day', dry: true, weight: 3, tip: 3 },
      { id: 'ladybug', scenes: ['meadow'], when: 'any', weight: 2, tip: 3 },
      { id: 'dragonfly', scenes: ['lake'], when: 'day', dry: true, weight: 3, tip: 4 },
      { id: 'firefly', scenes: ['meadow', 'lake'], when: 'night', weight: 4, tip: 5 },
      { id: 'moth', scenes: ['meadow', 'volcano', 'lake'], when: 'night', weight: 2, tip: 6 },
      { id: 'robin', scenes: ['snow'], when: 'any', weight: 3, tip: 5 },
      { id: 'honeycreeper', scenes: ['volcano'], when: 'day', weight: 2, tip: 8 },
      { id: 'kingfisher', scenes: ['lake'], when: 'day', weight: 1, tip: 12 },
      { id: 'bumblebee', scenes: ['meadow','snow','lake'], when: 'day', weight: 0.7, tip: 10, special: true },
      { id: 'swallowtail', scenes: ['meadow','lake'], when: 'day', dry: true, weight: 0.5, tip: 14, special: true },
      { id: 'hawkmoth', scenes: ['meadow','volcano','lake'], when: 'day', weight: 0.6, tip: 12, special: true },
      { id: 'hoverfly', scenes: ['meadow','lake'], when: 'day', dry: true, weight: 0.6, tip: 10, special: true },
    ]
    for(const visitor of VISITORS){
      if(['bee','butterfly','ladybug','firefly','moth','robin','bumblebee','hoverfly'].includes(visitor.id))visitor.scenes.push('woodland')
      if(['bee','butterfly','moth','hawkmoth','bumblebee'].includes(visitor.id))visitor.scenes.push('desert')
      for(const [sceneId,ids] of Object.entries(MORE_VISITORS))if(ids.includes(visitor.id))visitor.scenes.push(sceneId)
    }
    const VISITOR_BY_ID = new Map(VISITORS.map(visitor => [visitor.id, visitor]))

    /** Long-term goals. `metric` names a counter in `achievementValue`. */
    const ACHIEVEMENTS = [
      { id: 'firstBloom', metric: 'harvested', target: 1, coins: 10 },
      { id: 'harvest30', metric: 'harvested', target: 30, coins: 60 },
      { id: 'harvest150', metric: 'harvested', target: 150, coins: 300 },
      { id: 'firstGuest', metric: 'visitorKinds', target: 1, coins: 20 },
      { id: 'pollinator', metric: 'pollinated', target: 12, coins: 120 },
      { id: 'naturalist', metric: 'visitorKinds', target: VISITORS.length, coins: 400 },
      { id: 'florist5', metric: 'delivered', target: 5, coins: 80 },
      { id: 'florist25', metric: 'delivered', target: 25, coins: 350 },
      { id: 'firstSpirit', metric: 'spiritKinds', target: 1, coins: 80 },
      { id: 'spirit8', metric: 'spiritKinds', target: 8, coins: 400 },
      { id: 'meadowBook', metric: 'meadowKinds', target: 10, coins: 150 },
      { id: 'allGrounds', metric: 'grounds', target: 4, coins: 250 },
      { id: 'breeder', metric: 'hybridKinds', target: 5, coins: 200 },
      { id: 'curio', metric: 'traitKinds', target: 4, coins: 250 },
      { id: 'ribbons', metric: 'ribbonsEarned', target: 10, coins: 300 },
      { id: 'bouquets10', metric: 'arranged', target: 10, coins: 200 },
      { id: 'trips10', metric: 'trips', target: 10, coins: 200 },
      { id: 'crafted20', metric: 'crafted', target: 20, coins: 250 },
      { id: 'contest3', metric: 'contestWins', target: 3, coins: 400 },
      { id: 'fund10', metric: 'fund', target: 10, coins: 500 },
      { id: 'bonds3', metric: 'bondsMax', target: 3, coins: 400 },
      { id: 'breeder7', metric: 'goalsDone', target: 7, coins: 600 },
      { id: 'cards30', metric: 'cards', target: 30, coins: 300 },
      { id: 'fullBook', metric: 'entries', target: CODEX_ENTRIES.length, coins: 1500 },
    ]
    const ACHIEVEMENT_BY_ID = new Map(ACHIEVEMENTS.map(entry => [entry.id, entry]))
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
    function paletteOf(species, variant, tintId) {
      if (variant === 'hidden') return { ...species.pal, ...HIDDEN_PAL }
      // A hybrid keeps its mother's form and wears the pollen parent's petal colours.
      const tint = tintId === undefined ? undefined : SPECIES_BY_ID.get(tintId)
      if (tint !== undefined) return { ...species.pal, petal: tint.pal.petal, petalDeep: tint.pal.petalDeep }
      if (variant === 'alt' && species.alt !== undefined) return { ...species.pal, ...species.alt }
      return species.pal
    }

    /**
     * Curiosities: rare forms a plant takes after an unusual life. `pal` and
     * `stops` repaint the petals; twin, giant and variegated change the plant itself.
     * `chance` is rolled at harvest once the cause in `traitCauses` holds.
     */
    const TRAITS = [
      { id: 'twin', chance: 0.4 },
      { id: 'giant', chance: 0.35 },
      { id: 'rainbow', chance: 0.12, pal: { petal: '#f7a8c8', petalDeep: '#8f7be0' }, stops: [[0, '#7d6be0'], [25, '#4fb8e8'], [50, '#6fd49a'], [72, '#f6d95a'], [100, '#f58ab0']] },
      { id: 'frost', chance: 0.12, pal: { petal: '#dff1fb', petalDeep: '#9cc7e6', center: '#f4fbff', centerDeep: '#a9cfe8' }, stops: [[0, '#8fbfe6'], [50, '#dff1fb'], [100, '#ffffff']] },
      { id: 'ember', chance: 0.12, pal: { petal: '#ff8a2b', petalDeep: '#c2261a', center: '#ffd35a', centerDeep: '#e2781c' }, stops: [[0, '#7a1410'], [40, '#e4361e'], [78, '#ff9a2e'], [100, '#ffe27a']] },
      { id: 'pearl', chance: 0.12, pal: { petal: '#f3eef8', petalDeep: '#c9bfe6', center: '#fff6d8', centerDeep: '#d9c48a' }, stops: [[0, '#c7b8ea'], [35, '#f6e6f1'], [70, '#dff3f1'], [100, '#ffffff']] },
      { id: 'ink', chance: 0.1, pal: { petal: '#3b2a4a', petalDeep: '#1c1426', center: '#c9a24a', centerDeep: '#7a5a1e' }, stops: [[0, '#120c1a'], [55, '#3b2a4a'], [100, '#7a4a8a']] },
      { id: 'variegated', chance: 0.14 },
      { id: 'fasciated', chance: 0.22, source: 'https://en.wikipedia.org/wiki/Fasciation', specimen: 'sunflower' },
      { id: 'radial', chance: 0.3, source: 'https://en.wikipedia.org/wiki/Floral_symmetry#Peloria', specimen: 'snapdragon' },
      { id: 'double', chance: 0.2, source: 'https://en.wikipedia.org/wiki/Double-flowered', specimen: 'rose' },
      { id: 'leafy', chance: 0.2, source: 'https://en.wikipedia.org/wiki/Phyllody', specimen: 'daisy' },
    ]
    const TRAIT_MAX = 4
    /** Odds of a further curiosity on a flower that already has 0, 1, 2 or 3. */
    const TRAIT_EXTRA = [1, 0.25, 0.15, 0.08]
    const TRAIT_BASE = new Map(TRAITS.map(trait => [trait.id, trait]))
    function traitParts(id) { return typeof id === 'string' && id !== '' ? id.split('+') : [] }
    /** One curiosity id for several: known ones only, no repeats, in the book's order, four at most. */
    function joinTraits(parts) {
      const order = TRAITS.map(trait => trait.id)
      return [...new Set(parts)].filter(id => TRAIT_BASE.has(id)).sort((a, b) => order.indexOf(a) - order.indexOf(b)).slice(0, TRAIT_MAX).join('+') || undefined
    }
    /** Several colour curiosities on one flower: each takes a band of the petal, and the base colours are mixed. */
    function blendPaints(painted) {
      const n = painted.length
      const stops = painted.flatMap((part, k) => part.stops.map(([offset, color]) => [Math.round(((k + offset / 100) / n) * 100), color]))
      const pal = {}
      for (const key of ['petal', 'petalDeep', 'center', 'centerDeep']) {
        const colors = painted.map(part => part.pal[key]).filter(Boolean)
        if (colors.length > 0) pal[key] = colors.reduce((acc, color, i) => mix(acc, color, 1 / (i + 1)))
      }
      return { stops, pal }
    }
    /** Looks up one curiosity or a combination such as "twin+frost". */
    const TRAIT_BY_ID = {
      has(id) { const parts = traitParts(id); return parts.length > 0 && parts.length <= TRAIT_MAX && new Set(parts).size === parts.length && parts.every(part => TRAIT_BASE.has(part)) },
      get(id) {
        if (TRAIT_BASE.has(id)) return TRAIT_BASE.get(id)
        if (!this.has(id)) return undefined
        const parts = traitParts(id).map(part => TRAIT_BASE.get(part))
        const painted = parts.filter(part => part.stops !== undefined), cited = parts.find(part => part.source !== undefined)
        const paint = painted.length > 1 ? blendPaints(painted) : painted[0]
        return { ...(paint ?? {}), id: traitParts(id).join('_'), parts: traitParts(id), chance: Math.min(...parts.map(part => part.chance)), source: cited?.source, specimen: cited?.specimen, factId: cited?.id }
      },
    }
    function traitPrice(trait) { const n = traitParts(trait).length; return n === 0 ? 1 : TRAIT_PRICE + n - 1 }
    function traitCountKeys(trait) { const parts = traitParts(trait); return parts.length > 1 ? [...parts, trait] : parts }
    function traitLabel(trait, t) { return traitParts(trait).map(part => t(`trait.${part}`)).join('·') }
    function traitCauseText(trait, t) { return traitParts(trait).map(part => t(`trait.${part}.cause`)).join(' · ') }
    function traitFactId(trait) { return TRAIT_BY_ID.get(trait)?.factId ?? trait }
    const TRAIT_API = { TRAIT_MAX, TRAIT_EXTRA, TRAIT_BY_ID, traitParts, joinTraits, traitPrice, traitLabel }
    /** The weather each ground turns into a curiosity: harvest in it for a chance. */
    const SCENE_TRAIT = {
      meadow: { trait: 'rainbow', weather: 'rain' },
      snow: { trait: 'frost', weather: 'rain' },
      volcano: { trait: 'ember', weather: 'clear' },
      lake: { trait: 'pearl', weather: 'rain' },
      woodland:{trait:'pearl',weather:'rain'},desert:{trait:'ember',weather:'clear'},
      alpine:{trait:'frost',weather:'clear'},rainforest:{trait:'rainbow',weather:'rain'},coast:{trait:'pearl',weather:'clear'},garden:{trait:'double',weather:'rain'},
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

    /** Uniform value in [0, 1) from three integers; the same inputs always agree. */
    function hashUnit(a, b, c) {
      let x = (Math.imul(a | 0, 0x9e3779b1) ^ Math.imul(b | 0, 0x85ebca6b) ^ Math.imul(c | 0, 0xc2b2ae35)) | 0
      x = Math.imul(x ^ (x >>> 16), 0x7feb352d)
      x = Math.imul(x ^ (x >>> 15), 0x846ca68b)
      x ^= x >>> 16
      return (x >>> 0) / 4294967296
    }

    /** Local calendar day, so the market turns over at the player's midnight. */
    function localDay(now) {
      return Math.floor((now - new Date(now).getTimezoneOffset() * 60000) / 86400000)
    }

    /**
     * Today's market favourite: the best-ranked species among the opened grounds.
     * Ranking by a per-day hash keeps the pick stable until a new ground opens.
     */
    function featuredSpecies(state, now) {
      if (now === undefined) return null
      const day = localDay(now)
      let best = null
      let bestRank = -1
      for (const [index, species] of SPECIES.entries()) {
        const slot = state.scenes[SCENE_ID_OF.get(species.id)]
        if (slot === undefined || slot.unlocked <= 0) continue
        const rank = hashUnit(day, index, 77)
        if (rank > bestRank) {
          best = species.id
          bestRank = rank
        }
      }
      return best
    }

    /** What one bloom sells for, market favourite included. */
    function salePrice(species, variant, featuredId) {
      const base = species.sell * variantMultiplier(variant)
      return Math.round(species.id === featuredId ? base * MARKET_BONUS : base)
    }

    /** Dusk to dawn, when the night visitors fly. */
    function isNight(now) {
      const hour = new Date(now).getHours()
      return hour >= 19 || hour < 6
    }

    function visitBucket(now) {
      return Math.floor(now / VISIT_MS)
    }

    /** The visitor at one plot right now, or null. Only open flowers attract one. */
    function visitorAt(sceneId, index, plot, now, weather, hiveLevel, ecologyBonus = 0, gardenState) {
      if (plot === null || plot === undefined) return null
      const species = SPECIES_BY_ID.get(plot.species)
      if (species === undefined || plot.growthMs < growMsOf(species)) return null
      const bucket = visitBucket(now)
      if (plot.greeted === bucket) return null
      const sceneIndex = SCENES.findIndex(scene => scene.id === sceneId)
      if (sceneIndex === -1) return null
      const spot = sceneIndex * 16 + index
      if (hashUnit(bucket, spot, 1) >= Math.min(0.85, VISIT_CHANCE + FACILITY_BY_ID.get('hive').step * (hiveLevel ?? 0) + ecologyBonus)) return null
      const night = isNight(now)
      const pool = VISITORS.filter(visitor => visitor.scenes.includes(sceneId)
        && (visitor.when === 'any' || (visitor.when === 'night') === night)
        && !(visitor.dry === true && weather === 'rain')
        && specialVisitorEligible(visitor, plot, gardenState, weather))
      const affinity = ecoProfile(species.id)?.visitor
      const weight = visitor => visitor.weight * (visitor.id === affinity ? 1.6 : 1)
      const total = pool.reduce((sum, visitor) => sum + weight(visitor), 0)
      if (total === 0) return null
      let pick = hashUnit(bucket, spot, 2) * total
      for (const visitor of pool) {
        pick -= weight(visitor)
        if (pick < 0) return visitor
      }
      return pool[pool.length - 1]
    }

    /** Chance that a harvest turns up the gold bloom; the flower book lists these. */
    function hiddenChance(plot, weather, now, scene) {
      let chance = 0.01
      if (plot.dried !== true) chance += 0.01
      const favoured = scene.rainWets ? weather === 'rain' : weather === 'clear'
      if (favoured) chance += 0.01
      const hour = new Date(now).getHours()
      if (hour >= 22 || hour < 5) chance += 0.01
      if (plot.moisture >= 80) chance += 0.01
      chance += seasonalBonus(plot.species, now)
      return Math.min(HIDDEN_CAP, chance)
    }

    // ---------------------------------------------------------------------
    // §3 State model: plain JSON, pure transitions, exact time integration.
    // ---------------------------------------------------------------------
    function emptyScene(unlocked) {
      return {
        unlocked,
        plots: new Array(PLOT_COUNT).fill(null),
        sprinklerUntil: 0,
        soil: new Array(PLOT_COUNT).fill(100),
        last: new Array(PLOT_COUNT).fill(null),
      }
    }

    function emptyBag() {
      return { fertilizer: 0, compost: 0, sprinkler: 0, charm: 0 }
    }

    /** Soil fertility of one plot, 0–100; snapshots from before soil existed read as rich. */
    function soilOf(slot, index) {
      const value = slot === undefined || !Array.isArray(slot.soil) ? undefined : slot.soil[index]
      return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 100
    }

    function withSoil(slot, index, value, lastSpecies) {
      const soil = new Array(PLOT_COUNT).fill(100).map((_, at) => soilOf(slot, at))
      soil[index] = Math.max(0, Math.min(100, value))
      const last = new Array(PLOT_COUNT).fill(null).map((_, at) => (Array.isArray(slot.last) ? slot.last[at] ?? null : null))
      if (lastSpecies !== undefined) last[index] = lastSpecies
      return { soil, last }
    }

    /** Tired soil slows growth, down to `SOIL_FLOOR` of the normal pace. */
    function soilFactor(soil) {
      return SOIL_FLOOR + (1 - SOIL_FLOOR) * ((soil ?? 100) / 100)
    }

    function facilityLevel(state, id) {
      return Math.max(0, Math.min(FACILITY_MAX, Math.floor(state.facilities?.[id] ?? 0)))
    }

    function freshState(now) {
      const scenes = {}
      for (const scene of SCENES) scenes[scene.id] = emptyScene(scene.cost === 0 ? START_PLOTS : 0)
      return fillOrders({
        v: STATE_VERSION,
        coins: START_COINS,
        ui: sanitizeUi(null),
        discoveries: [], discoverySeq: 0,
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
        visitors: {},
        claimed: {},
        delivered: 0,
        pollinated: 0,
        planted: 0,
        ribbons: 0,
        ribbonsEarned: 0,
        facilities: {},
        glut: {},
        show: null,
        seeds: {},
        hybrids: {},
        exotics: {},
        specimens: {},
        commissions: { period: ecologyPeriod(now), accepted: {}, completed: [] }, patronage: 0, commissionLog: [],
        study: {}, ecology: { period: ecologyPeriod(now), grounds: ['meadow'], observed: [], visitors: [], claimed: [] }, researchSeals: 0, researchSpent: 0, research: sanitizeResearch(null), journal: [],
        daily: { claimedDay: -1, streak: 0 }, quests: null, giftBucket: -1, affinity: {}, arranged: 0, bouquetBest: 0, pedigree: {}, lineage: {}, goalsDone: {}, bouquets: [], cards: [], cardSeq: 0, expedition: null, trips: 0, vases: [], vaseTints: {}, shelf: { slots: 0, cards: [] }, workshop: { benches: 0, jobs: [] }, pagesDone: {}, contest: null, contestWins: 0, crafted: 0, legacy: 0, fund: 0, goods: { dried: 0, tea: 0, perfume: 0 }, goodsUsed: 0, scent: null, used: 0, wanted: null, wantedDone: 0, companions: [], events: 0, briefs: 0, eventBucket: -1, briefDay: -1, boost: null,
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
        if (typeof plot.dna === 'number' && plot.dna > 0) plots[index].dna = Math.floor(plot.dna)
        if (typeof plot.tint === 'string' && SPECIES_BY_ID.has(plot.tint) && plot.tint !== species.id) plots[index].tint = plot.tint
        if (finiteOr(plot.fed, 0) > 0) plots[index].fed = Math.floor(plot.fed)
        if (finiteOr(plot.visits, 0) > 0) plots[index].visits = Math.floor(plot.visits)
        if (finiteOr(plot.guardianVisits,0)>0) plots[index].guardianVisits=Math.floor(plot.guardianVisits)
        plots[index].specialVisits = Object.fromEntries(Object.entries(sanitizeVisitors(plot.specialVisits)).filter(([id])=>VISITOR_BY_ID.get(id)?.special))
        if(plot.identified===true && ['base','alt','hidden'].includes(plot.variant)){
          plots[index].identified=true;plots[index].variant=plot.variant
          if(plot.variant!=='hidden' && TRAIT_BY_ID.has(plot.trait))plots[index].trait=plot.trait
          plots[index].traitChecks=Array.isArray(plot.traitChecks)?[...new Set(plot.traitChecks.filter(id=>TRAIT_BY_ID.has(id)))]:[]
        }
        if (plot.resident === true) {
          plots[index].resident = true
          plots[index].variant = ['base','alt','hidden'].includes(plot.variant) ? plot.variant : 'base'
          if (plots[index].variant !== 'hidden' && TRAIT_BY_ID.has(plot.trait)) plots[index].trait = plot.trait
          for (const field of ['retainedAt','observedAt','careCount','reblooms','studiedReblooms']) {
            if (Number.isFinite(plot[field]) && plot[field] >= 0) plots[index][field] = plot[field]
          }
        }
        if (plot.pollinated === true) plots[index].pollinated = true
        if (typeof plot.greeted === 'number' && Number.isFinite(plot.greeted)) plots[index].greeted = plot.greeted
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

    function sanitizeVisitors(raw) {
      const visitors = {}
      if (raw === null || typeof raw !== 'object') return visitors
      for (const visitor of VISITORS) {
        const count = Math.floor(finiteOr(raw[visitor.id], 0))
        if (count > 0) visitors[visitor.id] = count
      }
      return visitors
    }

    /** Counters keyed by `a~b` or `a:b` where both halves must be known ids. */
    function sanitizeCounts(raw, separator, rightKnown) {
      const out = {}
      if (raw === null || typeof raw !== 'object') return out
      for (const [key, count] of Object.entries(raw)) {
        const [left, right] = key.split(separator)
        const value = Math.floor(finiteOr(count, 0))
        if (value > 0 && SPECIES_BY_ID.has(left) && rightKnown(right) && left !== right) out[key] = value
      }
      return out
    }

    /** Keep one real representative of each complete flower kind after it leaves the basket. */
    function sanitizeSpecimens(raw) {
      const result = {}
      if (raw === null || typeof raw !== 'object') return result
      for (const item of Object.values(raw)) {
        if (!item || !SPECIES_BY_ID.has(item.species) || !['base', 'alt', 'hidden'].includes(item.variant)) continue
        if (item.trait !== undefined && (!TRAIT_BY_ID.has(item.trait) || item.variant === 'hidden')) continue
        if (item.tint !== undefined && (!SPECIES_BY_ID.has(item.tint) || item.tint === item.species)) continue
        const bloom = { species: item.species, variant: item.variant, count: Math.max(1, Math.floor(finiteOr(item.count, 1))) }
        if (Number.isFinite(item.dna) && item.dna > 0) bloom.dna = Math.floor(item.dna)
        if (item.trait !== undefined) bloom.trait = item.trait
        if (item.tint !== undefined) bloom.tint = item.tint
        result[itemKey(bloom)] = bloom
      }
      return result
    }

    function sanitizeShow(raw) {
      if (raw === null || typeof raw !== 'object' || !Number.isFinite(raw.id)) return null
      return {
        id: raw.id,
        points: Math.floor(finiteOr(raw.points, 0)),
        entered: Math.floor(finiteOr(raw.entered, 0)),
        kinds: Array.isArray(raw.kinds) ? raw.kinds.filter(id => SPECIES_BY_ID.has(id)) : [],
      }
    }

    function sanitizeClaimed(raw) {
      const claimed = {}
      if (raw === null || typeof raw !== 'object') return claimed
      for (const entry of ACHIEVEMENTS) if (raw[entry.id] === true) claimed[entry.id] = true
      return claimed
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
          soil: new Array(PLOT_COUNT).fill(100).map((_, index) => soilOf(source, index)),
          last: new Array(PLOT_COUNT).fill(null).map((_, index) => (Array.isArray(source.last) && scene.species.includes(source.last[index]) ? source.last[index] : null)),
        }
      }
      // An upgraded basket holds more, so the cap depends on the saved level.
      const basketLevel = Math.max(0, Math.min(4, Math.floor(finiteOr(raw.basketLevel, 0))))
      const basket = []
      if (Array.isArray(raw.basket)) {
        for (const item of raw.basket.slice(0, basketCapacity({basketLevel}))) {
          const species = item === null || typeof item !== 'object' ? undefined : SPECIES_BY_ID.get(item.species)
          if (species === undefined) continue
          const variant = item.variant === 'alt' || item.variant === 'hidden' ? item.variant : 'base'
          const bloom = { species: species.id, variant }
          if (typeof item.dna === 'number' && item.dna > 0) bloom.dna = Math.floor(item.dna)
          if (variant !== 'hidden' && TRAIT_BY_ID.has(item.trait)) bloom.trait = item.trait
          if (typeof item.tint === 'string' && SPECIES_BY_ID.has(item.tint) && item.tint !== species.id) bloom.tint = item.tint
          basket.push(bloom)
        }
      }
      return fillOrders({
        v: STATE_VERSION,
        coins: finiteOr(raw.coins, START_COINS),
        ui: sanitizeUi(raw.ui),
        discoveries: sanitizeDiscoveries(raw.discoveries), discoverySeq: Math.max(Math.floor(finiteOr(raw.discoverySeq,0)),...sanitizeDiscoveries(raw.discoveries).map(entry=>entry.id),0),
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
        visitors: sanitizeVisitors(raw.visitors),
        claimed: sanitizeClaimed(raw.claimed),
        delivered: Math.floor(finiteOr(raw.delivered, 0)),
        pollinated: Math.floor(finiteOr(raw.pollinated, 0)),
        planted: Math.floor(finiteOr(raw.planted, 0)),
        ribbons: Math.floor(finiteOr(raw.ribbons, 0)),
        ribbonsEarned: Math.floor(finiteOr(raw.ribbonsEarned, 0)),
        facilities: Object.fromEntries(FACILITIES.map(entry => [entry.id, Math.min(FACILITY_MAX, Math.floor(finiteOr(raw.facilities?.[entry.id], 0)))])),
        glut: Object.fromEntries(Object.entries(raw.glut !== null && typeof raw.glut === 'object' ? raw.glut : {})
          .filter(([id, entry]) => SPECIES_BY_ID.has(id) && entry !== null && typeof entry === 'object' && Number.isFinite(entry.n) && Number.isFinite(entry.at))
          .map(([id, entry]) => [id, { n: Math.max(0, Math.floor(entry.n)), at: Math.min(entry.at, now) }])),
        show: sanitizeShow(raw.show),
        seeds: sanitizeCounts(raw.seeds, '~', id => SPECIES_BY_ID.has(id)),
        hybrids: sanitizeCounts(raw.hybrids, '~', id => SPECIES_BY_ID.has(id)),
        exotics: sanitizeCounts(raw.exotics, ':', id => TRAIT_BY_ID.has(id)),
        specimens: sanitizeSpecimens(raw.specimens),
        commissions: sanitizeCommissions(raw.commissions,now), patronage: Math.floor(finiteOr(raw.patronage,0)), commissionLog: sanitizeCommissionLog(raw.commissionLog),
        study: sanitizeStudy(raw.study), ecology: sanitizeEcology(raw.ecology, now, scenes), researchSeals: Math.max(0, Math.floor(finiteOr(raw.researchSeals, 0))), researchSpent: Math.max(0, Math.floor(finiteOr(raw.researchSpent, 0))), research: sanitizeResearch(raw.research), journal: sanitizeJournal(raw.journal),
        ...sanitizePlay(raw, now), ...sanitizeCraft(raw), ...sanitizeKin(raw), ...sanitizeAlbum(raw, now), ...sanitizeEconomy(raw), ...sanitizeLongterm(raw, now), ...sanitizeFund(raw), ...sanitizeFun(raw, now), ...sanitizeFlowers(raw, now), ...sanitizeGoods(raw, now), ...sanitizeTints(raw),
        seed: Math.floor(finiteOr(raw.seed, 20261116)) || 20261116,
        orderSeq: Math.max(1, Math.floor(finiteOr(raw.orderSeq, 1))),
        lastTick: Math.min(finiteOr(raw.lastTick, now), now),
      })
    }

    /* ── save files ──────────────────────────────────────────────
     * The garden normally lives in this browser, which ties it to one origin and
     * one profile. A save file is a portable copy of that state so a player can
     * back it up or move to another browser; the envelope carries the versions
     * needed to refuse a file this build cannot read. Both helpers are pure so
     * the tests can exercise them without a DOM.
     */
    const SAVE_FORMAT = 'dsh-flower-garden'
    const SAVE_VERSION = 1
    const READABLE_STATE_VERSIONS = [1, 2, 3, STATE_VERSION]

    function exportSave(state, now) {
      return {
        format: SAVE_FORMAT,
        saveVersion: SAVE_VERSION,
        stateVersion: STATE_VERSION,
        exportedAt: new Date(now).toISOString(),
        garden: state,
      }
    }

    /** Returns a sanitized garden, or null when the payload is not a usable save. */
    function importSave(payload, now) {
      if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) return null
      const raw = payload.format === SAVE_FORMAT && payload.garden !== undefined ? payload.garden : payload.garden ?? payload
      if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null
      // Refuse anything sanitize would silently replace with a fresh garden, so a
      // bad file never wipes the save it was meant to restore.
      if (!READABLE_STATE_VERSIONS.includes(raw.v)) return null
      if (raw.v < STATE_VERSION) {
        // v1-v3 kept a flat garden, so only demand that the file looks like one.
        const recognisable = ['coins', 'lastTick', 'plots', 'scenes', 'basket'].some(field => raw[field] !== undefined)
        if (!recognisable) return null
      } else if (raw.scenes === null || typeof raw.scenes !== 'object') {
        return null
      }
      try {
        return sanitize(raw, now)
      } catch (error) {
        return null
      }
    }

/* ecology-engine.fragment.js
 * Paste inside the flower-garden factory after the existing pure game helpers.
 * It deliberately does not render or mutate the UI: the host owns commit(), copy,
 * and translation. The functions below return a new state or null for invalid input.
 */

// The host supplies ECO_PROFILES from its botany data. A missing profile is harmless.
const ECO_PERIOD_MS = 6 * 60 * 60 * 1000
const ECO_OBSERVE_MS = 10 * 60 * 1000
const ECO_ROLE_SET = new Set(['nectar', 'pollen', 'seed', 'shelter', 'water', 'night'])
const ECO_VISITOR_CAP = 0.12

function ecologyPlot(state, sceneId, index) {
  const slot = state?.scenes?.[sceneId]
  return slot === undefined ? null : slot.plots?.[index] ?? null
}

function ecologyMature(species, plot) {
  return species !== undefined && plot !== null && plot !== undefined
    && plot.growthMs >= growMsOf(species)
}

function ecologyEntry(state, speciesId) {
  const current = state.study?.[speciesId]
  return current && typeof current === 'object'
    ? current
    : { observations: 0, firstAt: 0, lastAt: 0 }
}

function ecologyPeriod(now) {
  return Math.floor(Math.max(0, now) / ECO_PERIOD_MS)
}

function ecologyState(state, now) {
  const period = ecologyPeriod(now)
  const old = state.ecology && state.ecology.period === period ? state.ecology : null
  const grounds = SCENES.filter(scene => (state.scenes?.[scene.id]?.unlocked ?? 0) > 0).map(scene => scene.id)
  return old ? { ...old, grounds: old.grounds ?? grounds } : { period, grounds, observed: [], visitors: [], claimed: [] }
}

// A living bloom keeps its identification; each new curiosity cause is tried once.
function revealBloom(state, sceneId, index, now, weather = weatherAt(now)) {
  const plot=state.scenes?.[sceneId]?.plots?.[index], species=SPECIES_BY_ID.get(plot?.species)
  if(!species || plot.resident || plot.growthMs<growMsOf(species))return state
  let cursor=state.seed, charm=state.charm, nextPlot={...plot}, changed=false
  const draw=()=>{const step=nextRandom(cursor);cursor=step.seed;return step.value}
  if(plot.identified!==true){
    const chance=Math.min(charm===true?CHARM_CAP:HIDDEN_CAP,hiddenChance(plot,weather,now,SCENE_BY_ID.get(sceneId))+(charm===true?CHARM_BONUS:0)+shelfBonus(state).spirit + studyBonus(state, plot.species) + boostBonus(state, now))
    nextPlot.variant=draw()<chance?'hidden':plot.tint?'base':plotVariant(species,index)
    nextPlot.identified=true;nextPlot.traitChecks=[];charm=false;changed=true
  }
  if(nextPlot.variant!=='hidden' && traitParts(nextPlot.trait).length<TRAIT_MAX){
    const checked=new Set(nextPlot.traitChecks??[])
    const boost=1+FACILITY_BY_ID.get('greenhouse').step*facilityLevel(state,'greenhouse')
    for(const id of traitCauses(nextPlot,sceneId,weather,now)){
      if(checked.has(id))continue
      checked.add(id);changed=true
      const have=traitParts(nextPlot.trait);if(have.length>=TRAIT_MAX)break;if(draw()<Math.min(0.9,TRAIT_BASE.get(id).chance*boost*TRAIT_EXTRA[have.length]))nextPlot.trait=joinTraits([...have,id])
    }
    nextPlot.traitChecks=[...checked]
  }
  if(!changed)return state
  const slot=state.scenes[sceneId],plots=slot.plots.slice();plots[index]=nextPlot
  return {...state,seed:cursor,charm,scenes:{...state.scenes,[sceneId]:{...slot,plots}}}
}
function revealGarden(state, now) {
  let next=state
  for(const scene of SCENES){const slot=next.scenes?.[scene.id];if(!slot)continue
    for(let index=0;index<slot.unlocked;index++)next=revealBloom(next,scene.id,index,now)
  }
  return next
}
function retainAt(state, sceneId, index, now) {
  const slot = state.scenes?.[sceneId]
  const plot = slot?.plots?.[index]
  const species = plot === null || plot === undefined ? undefined : SPECIES_BY_ID.get(plot.species)
  if (slot === undefined || index < 0 || index >= slot.unlocked || species === undefined || plot.resident === true || !ecologyMature(species, plot)) return null
  const scene = SCENE_BY_ID.get(sceneId)
  if (scene === undefined) return null
  const plain = plot.tint === undefined ? plotVariant(species, index) : 'base'
  const roll = nextRandom(state.seed)
  const hiddenBase = hiddenChance(plot, weatherAt(now), now, scene)
  const charmBonus = state.charm === true ? CHARM_BONUS : 0
  const chance = Math.min(state.charm === true ? CHARM_CAP : HIDDEN_CAP, hiddenBase + charmBonus + shelfBonus(state).spirit + studyBonus(state, plot.species) + boostBonus(state, now))
  const hidden = plot.identified ? plot.variant === 'hidden' : roll.value < chance
  let cursor = plot.identified ? state.seed : roll.seed
  const dna = Number.isFinite(plot.dna) && plot.dna > 0 ? plot.dna : 1 + Math.floor(hashUnit(state.seed, index, 12345) * 2147483646)
  const first = { species: species.id, variant: plot.identified ? plot.variant : hidden ? 'hidden' : plain, dna }
  if (plot.tint !== undefined) first.tint = plot.tint
  let trait = plot.identified ? plot.trait : undefined
  if (!hidden && !plot.identified) {
    const causes = traitCauses(plot, sceneId, weatherAt(now), now)
    for (const id of causes) {
      const step = nextRandom(cursor)
      cursor = step.seed
      const greenhouse = typeof facilityLevel === 'function' ? facilityLevel(state, 'greenhouse') : 0
      const boost = 1 + greenhouse * 0.1
      const have = traitParts(trait); if (step.value < Math.min(0.9, (TRAIT_BASE.get(id)?.chance ?? 0) * boost * TRAIT_EXTRA[have.length])) { trait = joinTraits([...have, id]); if (have.length + 1 >= TRAIT_MAX) break }
    }
  }
  if (trait !== undefined) first.trait = trait
  const key = itemKey(first)
  const seen = { ...(state.seen ?? {}) }
  if (!first.tint) seen[`${species.id}:${first.variant}`] = (seen[`${species.id}:${first.variant}`] ?? 0) + 1
  const specimens = { ...(state.specimens ?? {}) }
  const prior = specimens[key]
  specimens[key] = { ...(prior ?? first), count: (prior?.count ?? 0) + 1 }
  const plots = slot.plots.slice()
  plots[index] = { ...plot, dna, resident: true, variant: first.variant, trait, retainedAt: now }
  const hybrids = { ...(state.hybrids ?? {}) }
  if (first.tint !== undefined) hybrids[`${species.id}~${first.tint}`] = (hybrids[`${species.id}~${first.tint}`] ?? 0) + 1
  const exotics = { ...(state.exotics ?? {}) }
  for (const part of traitCountKeys(trait)) exotics[`${species.id}:${part}`] = (exotics[`${species.id}:${part}`] ?? 0) + 1
  return {
    ...state,
    seed: cursor,
    charm: plot.identified ? state.charm : false,
    seen,
    specimens,
    hybrids,
    exotics,
    scenes: { ...state.scenes, [sceneId]: { ...slot, plots } },
  }
}

function observeAt(state, sceneId, index, now) {
  const slot = state.scenes?.[sceneId]
  const plot = slot?.plots?.[index]
  const species = plot === null || plot === undefined ? undefined : SPECIES_BY_ID.get(plot.species)
  if (slot === undefined || index < 0 || index >= slot.unlocked || species === undefined || plot.resident !== true || plot.growthMs < growMsOf(species)
    || plot.moisture < 30 || (plot.observedAt !== undefined && now - plot.observedAt < ECO_OBSERVE_MS)) return null
  const study = { ...(state.study ?? {}) }
  const old = ecologyEntry(state, species.id)
  const reblooms = plot.reblooms ?? 0
  const extra = reblooms > (plot.studiedReblooms ?? 0) ? 2 : 1
  study[species.id] = { ...old, observations: old.observations + extra, firstAt: old.firstAt || now, lastAt: now }
  const ecology = ecologyState(state, now)
  const observed = ecology.observed.includes(species.id) ? ecology.observed : [...ecology.observed, species.id]
  const plots = slot.plots.slice()
  plots[index] = { ...plot, observedAt: now, studiedReblooms: reblooms, careCount: (plot.careCount ?? 0) + 1 }
  const fee = researchFee(state, species)
  if (state.coins < fee) return null
  return {
    ...state,
    coins: state.coins - fee,
    study,
    ecology: { ...ecology, observed },
    scenes: { ...state.scenes, [sceneId]: { ...slot, plots } },
  }
}

function rebloomAt(state, sceneId, index, now) {
  const slot = state.scenes?.[sceneId]
  const plot = slot?.plots?.[index]
  const species = plot === null || plot === undefined ? undefined : SPECIES_BY_ID.get(plot.species)
  if (slot === undefined || index < 0 || index >= slot.unlocked || species === undefined || plot.resident !== true || plot.growthMs < growMsOf(species)
    || plot.observedAt === undefined) return null
  const fee = researchFee(state, species, true)
  if (state.coins < fee) return null
  const plots = slot.plots.slice()
  plots[index] = {
    ...plot,
    growthMs: Math.floor(growMsOf(species) * 0.35), moisture: 100,
    pollinated: false, greeted: 0, visits: 0, fed: 0,
    reblooms: (plot.reblooms ?? 0) + 1,
  }
  const study = { ...(state.study ?? {}) }
  const entry = ecologyEntry(state, species.id)
  study[species.id] = { ...entry, reblooms: (entry.reblooms ?? 0) + 1 }
  return {
    ...state,
    coins: state.coins - fee,
    study,
    scenes: { ...state.scenes, [sceneId]: { ...slot, plots } },
  }
}

function ecoProfile(speciesId) {
  const profile = typeof ECO_PROFILES === 'undefined' ? undefined : ECO_PROFILES?.[speciesId]
  if (profile === undefined || !ECO_ROLE_SET.has(profile.role) || profile.season < 0 || profile.season > 3) return null
  return profile
}

function gardenEcology(state, now) {
  const residents = []
  for (const [sceneId, slot] of Object.entries(state.scenes ?? {})) {
    for (const plot of slot.plots ?? []) {
      if (plot?.resident === true && plot.moisture >= 30) {
        const species = SPECIES_BY_ID.get(plot.species)
        if (ecologyMature(species, plot)) residents.push({ sceneId, plot })
      }
    }
  }
  const roles = new Set(), species = new Set(), seasonal = new Set()
  const season = ecologyPeriod(now) % 4
  for (const resident of residents) {
    species.add(resident.plot.species)
    const profile = ecoProfile(resident.plot.species)
    if (profile === null) continue
    roles.add(profile.role)
    if (profile.season === season) seasonal.add(resident.plot.species)
  }
  return {
    residents: residents.length,
    species: species.size,
    roles: [...roles],
    roleCoverage: roles.size,
    seasonal: seasonal.size,
    visitorBonus: Math.min(ECO_VISITOR_CAP, roles.size * 0.02 + Math.min(0.04, seasonal.size * 0.005)) + researchLevel(state, 'ecology') * 0.02 + shelfBonus(state).visitor + scentBonus(state, now),
  }
}

function ecoProjects(state, now) {
  const period = ecologyPeriod(now)
  const unlocked = []
  for (const scene of SCENES) {
    if (!ecologyState(state, now).grounds.includes(scene.id)) continue
    for (const speciesId of scene.species) if (!unlocked.includes(speciesId)) unlocked.push(speciesId)
  }
  const projects = []
  for (let i = 0; i < 3; i += 1) {
    const count = 3 + i
    const needed = []
    let cursor = 0xEC0123 + period * 31 + i * 997
    while (needed.length < Math.min(count, unlocked.length)) {
      const draw = nextRandom(cursor); cursor = draw.seed
      const id = unlocked[Math.floor(draw.value * unlocked.length)]
      if (!needed.includes(id)) needed.push(id)
    }
    const hours = Array.from({length:6}, (_, hour) => period * ECO_PERIOD_MS + hour * 3600000)
    const visitorPool = VISITORS.filter(visitor => !visitor.special && visitor.scenes.some(id => ecologyState(state, now).grounds.includes(id))
      && hours.some(time => visitor.when === 'any' || (visitor.when === 'night') === isNight(time)))
      .map((visitor,index) => ({visitor,rank:hashUnit(period,index,i+901)})).sort((a,b) => a.rank-b.rank)
    const visitors = visitorPool.slice(0, Math.min(i + 1, visitorPool.length)).map(entry => entry.visitor.id)
    projects.push({ id: `eco-${period}-${i + 1}`, period, species: needed, visitors, coins: [100, 180, 260][i], ribbons: i, seals: i + 1 })
  }
  return projects
}

function submitStudy(state, projectId, now) {
  const project = ecoProjects(state, now).find(entry => entry.id === projectId)
  const ecology = ecologyState(state, now)
  if (project === undefined || ecology.claimed.includes(projectId) || project.species.some(id => !ecology.observed.includes(id))
    || project.visitors.some(id => !ecology.visitors.includes(id)) || state.coins < project.coins || (state.ribbons ?? 0) < project.ribbons) return null
  const claimed = [...ecology.claimed, projectId]
  const journal = Array.isArray(state.journal) ? state.journal.slice(-99) : []
  journal.push({ id: projectId, period: ecology.period, at: now, species: project.species.slice(), visitors: project.visitors.slice(), seals: project.seals })
  return { ...state, coins: state.coins - project.coins, ribbons: (state.ribbons ?? 0) - project.ribbons,
    researchSeals: (state.researchSeals ?? 0) + project.seals, journal, ecology: { ...ecology, claimed } }
}

function sanitizeEcology(raw, now, scenes) {
  const period = ecologyPeriod(now)
  const available = scenes ? SCENES.filter(scene => (scenes[scene.id]?.unlocked ?? 0) > 0).map(scene => scene.id) : ['meadow']
  const grounds = raw?.period === period && Array.isArray(raw.grounds) ? raw.grounds.filter(id => available.includes(id)) : available
  if (raw === null || typeof raw !== 'object' || raw.period !== period) return { period, grounds, observed: [], visitors: [], claimed: [] }
  return { period, grounds,
    observed: Array.isArray(raw.observed) ? raw.observed.filter(id => SPECIES_BY_ID.has(id)) : [],
    visitors: Array.isArray(raw.visitors) ? raw.visitors.filter(id => VISITOR_BY_ID.has(id)) : [],
    claimed: Array.isArray(raw.claimed) ? raw.claimed.filter(id => typeof id === 'string').slice(0, 3) : [] }
}

function sanitizeStudy(raw) {
  const study = {}
  if (raw === null || typeof raw !== 'object') return study
  for (const [id, entry] of Object.entries(raw)) if (SPECIES_BY_ID.has(id) && entry && typeof entry === 'object') {
    study[id] = { observations: Math.max(0, Math.floor(finiteOr(entry.observations, 0))), reblooms: Math.max(0, Math.floor(finiteOr(entry.reblooms, 0))), firstAt: finiteOr(entry.firstAt, 0), lastAt: finiteOr(entry.lastAt, 0) }
  }
  return study
}

function sanitizeJournal(raw) {
  if (!Array.isArray(raw)) return []
  return raw.filter(entry => entry && typeof entry === 'object' && typeof entry.id === 'string'
    && Number.isFinite(entry.period) && Number.isFinite(entry.at)
    && Array.isArray(entry.species) && Array.isArray(entry.visitors))
    .map(entry => ({ id: entry.id.slice(0, 80), period: Math.max(0, Math.floor(entry.period)), at: Math.max(0, entry.at),
      species: entry.species.filter(id => SPECIES_BY_ID.has(id)).slice(0, 10), visitors: entry.visitors.filter(id => VISITOR_BY_ID.has(id)).slice(0, 10), seals: Math.max(0, Math.floor(finiteOr(entry.seals, 0))) }))
    .slice(-100)
}

// Integration exports for the host's __game object.
const ECOLOGY_API = { ECO_PERIOD_MS, ECO_OBSERVE_MS, ecologyPeriod, ecologyState, retainAt, observeAt, rebloomAt, ecoProfile, gardenEcology, ecoProjects, submitStudy, sanitizeStudy, sanitizeEcology, sanitizeJournal }

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
    function advancePlot(plot, ms, weather, scene, sprinkled, soil) {
      const species = SPECIES_BY_ID.get(plot.species)
      if (species === undefined || ms <= 0) return plot
      const growMs = growMsOf(species)
      const factor = (scene !== undefined ? (scene.weather[weather] ?? 1) : weather === 'clear' ? 1.15 : 1) * soilFactor(soil)
      const wet = sprinkled === true || (scene !== undefined && scene.rainWets && weather === 'rain')
      const dryDuration = plot.resident ? 45 * 60 * 1000 : growMs * DRY_SHARE
      const moisture = wet ? 100 : Math.max(0, plot.moisture - ms * 100 / dryDuration)
      const wetMs = wet ? ms : Math.min(ms, (plot.moisture / 100) * dryDuration)
      const growthMs = Math.min(growMs, plot.growthMs + wetMs * factor)
      const dried = plot.dried === true || (moisture <= 0 && growthMs < growMs)
      if (growthMs === plot.growthMs && moisture === plot.moisture && dried === plot.dried) return plot
      return { ...plot, growthMs, moisture, dried }
    }

    /** Advance every plot in every scene, one weather segment at a time. */
    function advanceState(state, now) {
      let cursor = Math.max(state.lastTick, now - MAX_OFFLINE_MS)
      if (now <= cursor) return revealGarden(state, now)
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
          let soil = slot.soil
          let changed = false
          for (let index = 0; index < plots.length; index += 1) {
            const plot = plots[index]
            if (plot === null) {
              // An empty, opened plot lies fallow and slowly recovers.
              const rich = soilOf(slot, index)
              if (index < slot.unlocked && rich < 100) {
                if (soil === slot.soil) soil = new Array(PLOT_COUNT).fill(100).map((_, at) => soilOf(slot, at))
                soil[index] = Math.min(100, rich + dt / SOIL_REST_MS)
                changed = true
              }
              continue
            }
            const advanced = advancePlot(plot, dt, weather, scene, sprinkled, soilOf(slot, index))
            if (advanced === plot) continue
            if (plots === slot.plots) plots = plots.slice()
            changed = true
            plots[index] = advanced
          }
          if (!changed) continue
          nextScenes[scene.id] = { ...slot, plots, soil }
          scenesChanged = true
        }
        cursor = segmentEnd
      }
      return revealGarden(companionTick({ ...state, ...(scenesChanged ? { scenes: nextScenes } : {}), lastTick: now, ecology: ecologyState(state, now), quests: questState(state, now) }, now), now)
    }

    /**
     * Sow one plot. With `tintId` it sows a hybrid seed from the bag (free, it was
     * bred); otherwise a bought seed. Every plant draws its own genes, and the soil
     * answers the choice: the same crop again tires it, a different one rests it.
     */
    function plantAt(state, sceneId, index, speciesId, tintId) {
      const slot = state.scenes[sceneId]
      const scene = SCENE_BY_ID.get(sceneId)
      if (slot === undefined || scene === undefined) return null
      if (index < 0 || index >= slot.unlocked || slot.plots[index] !== null) return null
      if (!scene.species.includes(speciesId)) return null
      const species = SPECIES_BY_ID.get(speciesId)
      if (species === undefined) return null
      const seedKey = `${speciesId}~${tintId}`
      if (tintId !== undefined) {
        if (!SPECIES_BY_ID.has(tintId) || tintId === speciesId || (state.seeds?.[seedKey] ?? 0) <= 0) return null
      } else if (state.coins < species.cost) {
        return null
      }
      const planted = state.planted ?? 0
      const cross = tintId !== undefined ? state.lineage?.[seedKey]?.[0] : undefined
      const dna = cross ? breedDna(cross[0], cross[1], planted) : 1 + Math.floor(hashUnit(state.seed, planted, SCENES.indexOf(scene) * 8 + index) * 2147483646)
      const plots = slot.plots.slice()
      plots[index] = { species: species.id, growthMs: 0, moisture: 100, dried: false, dna }
      if (tintId !== undefined) plots[index].tint = tintId
      const before = Array.isArray(slot.last) ? slot.last[index] ?? null : null
      const shift = before === null ? 0 : before === species.id ? -SOIL_REPEAT : SOIL_ROTATE
      const next = {
        ...state,
        planted: planted + 1,
        coins: tintId !== undefined ? state.coins : state.coins - species.cost,
        scenes: { ...state.scenes, [sceneId]: { ...slot, plots, ...withSoil(slot, index, soilOf(slot, index) + shift) } },
      }
      if (tintId !== undefined) {
        const seeds = { ...state.seeds }
        if (seeds[seedKey] > 1) seeds[seedKey] -= 1
        else delete seeds[seedKey]
        next.seeds = seeds
        Object.assign(next, plantCross(state, seedKey, cross, dna, species.id, tintId))
      }
      return next
    }

    function waterAt(state, sceneId, index) {
      const slot = state.scenes[sceneId]
      const plot = slot === undefined ? undefined : slot.plots[index]
      if (plot === undefined || plot === null || plot.moisture >= 99.5) return null
      const plots = slot.plots.slice()
      plots[index] = { ...plot, moisture: 100 }
      return { ...state, scenes: { ...state.scenes, [sceneId]: { ...slot, plots } } }
    }

    /** Water every thirsty plot of one ground. */
    function waterAll(state, sceneId) {
      const slot = state.scenes[sceneId]
      if (slot === undefined) return null
      let changed = false
      const plots = slot.plots.map(plot => {
        if (plot === null || plot.moisture >= 99.5) return plot
        const species = SPECIES_BY_ID.get(plot.species)
        if (species === undefined || (plot.growthMs >= growMsOf(species) && !plot.resident)) return plot
        changed = true
        return { ...plot, moisture: 100 }
      })
      return changed ? { ...state, scenes: { ...state.scenes, [sceneId]: { ...slot, plots } } } : null
    }

    /**
     * Greet the visitor on an open flower: it leaves a tip and pollinates the
     * bloom, which then yields a second flower at harvest.
     */
    function greetVisitor(state, sceneId, index, now, weather) {
      const slot = state.scenes[sceneId]
      const plot = slot === undefined ? undefined : slot.plots[index]
      const visitor = visitorAt(sceneId, index, plot, now, weather, facilityLevel(state, 'hive'), gardenEcology(state, now).visitorBonus, state)
      if (visitor === null) return null
      const plots = slot.plots.slice()
      const role = VISITOR_INFO[visitor.id].role
      plots[index] = { ...plot, greeted: visitBucket(now), pollinated: plot.pollinated === true || role === 'pollinator',
        moisture: role === 'waterside' ? Math.min(100, plot.moisture + 20) : plot.moisture, visits: (plot.visits ?? 0) + 1,
        guardianVisits: (plot.guardianVisits ?? 0) + (role === 'guardian' ? 1 : 0),
        specialVisits: visitor.special ? { ...plot.specialVisits, [visitor.id]: (plot.specialVisits?.[visitor.id] ?? 0) + 1 } : (plot.specialVisits ?? {}) }
      const ecology = ecologyState(state, now)
      const visitors = ecology.visitors.includes(visitor.id) ? ecology.visitors : [...ecology.visitors, visitor.id]
      return addAffinity({
        ...state,
        coins: state.coins + visitor.tip + affinityLevel(state, visitor.id),
        visitors: { ...state.visitors, [visitor.id]: (state.visitors[visitor.id] ?? 0) + 1 },
        scenes: { ...state.scenes, [sceneId]: { ...slot, plots, ...(role === 'guardian' ? withSoil(slot, index, soilOf(slot,index)+6) : {}) } },
        ecology: { ...ecology, visitors },
      }, visitor.id, AFFINITY_GREET)
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

    function harvestAt(state, sceneId, index, now, weather, endResidency = false) {
      const scene = SCENE_BY_ID.get(sceneId)
      const slot = state.scenes[sceneId]
      const plot = slot === undefined ? undefined : slot.plots[index]
      if (scene === undefined || plot === undefined || plot === null || (plot.resident && !endResidency)) return null
      const species = SPECIES_BY_ID.get(plot.species)
      if (species === undefined || plot.growthMs < growMsOf(species)) return null
      if (state.basket.length >= basketCapacity(state)) return null
      const bonus = state.charm === true ? CHARM_BONUS : 0
      const chance = Math.min(state.charm === true ? CHARM_CAP : HIDDEN_CAP, hiddenChance(plot, weather, now, scene) + bonus + shelfBonus(state).spirit + studyBonus(state, plot.species) + boostBonus(state, now))
      const roll = nextRandom(state.seed)
      const hidden = (plot.resident || plot.identified) ? plot.variant === 'hidden' : roll.value < chance
      let cursor = (plot.resident || plot.identified) ? state.seed : roll.seed
      const draw = () => {
        const step = nextRandom(cursor)
        cursor = step.seed
        return step.value
      }
      const plain = plot.tint !== undefined ? 'base' : plotVariant(species, index)
      const variant = (plot.resident || plot.identified) ? plot.variant : hidden ? 'hidden' : plain
      // A curiosity needs a cause in the plant's life, and then some luck.
      let trait = (plot.resident || plot.identified) ? plot.trait : undefined
      if (!hidden && !plot.resident && !plot.identified) {
        const boost = 1 + FACILITY_BY_ID.get('greenhouse').step * facilityLevel(state, 'greenhouse')
        for (const id of traitCauses(plot, sceneId, weather, now)) {
          const have = traitParts(trait)
          if (draw() < Math.min(0.9, TRAIT_BASE.get(id).chance * boost * TRAIT_EXTRA[have.length])) {
            trait = joinTraits([...have, id])
            if (have.length + 1 >= TRAIT_MAX) break
          }
        }
      }
      const first = { species: species.id, variant }
      if (plot.dna !== undefined) first.dna = plot.dna
      if (trait !== undefined) first.trait = trait
      if (plot.tint !== undefined) first.tint = plot.tint
      const blooms = [first]
      // A pollinated flower sets a second bloom in the plot's own colour, room permitting.
      const doubled = plot.pollinated === true && state.basket.length + 2 <= basketCapacity(state)
      if (doubled) {
        const second = { species: species.id, variant: plain }
        if (plot.dna !== undefined) second.dna = 1 + ((plot.dna * 7919) % 2147483646)
        if (plot.tint !== undefined) second.tint = plot.tint
        blooms.push(second)
      }
      // Pollen from a different flower next door may set a hybrid seed.
      let seeds = state.seeds ?? {}
      const partner = plot.pollinated === true ? hybridPartner(slot, index) : null
      let bred = false
      let kin = {}
      if (partner !== null) {
        const chance = hybridChance(state)
        if (draw() < chance) {
          const key = `${species.id}~${partner}`
          seeds = { ...seeds, [key]: (seeds[key] ?? 0) + 1 }
          bred = true
          kin = recordCross(state, key, plot, partnerPlot(slot, index))
        }
      }
      const seen = { ...state.seen }
      const hybrids = { ...state.hybrids }
      const exotics = { ...state.exotics }
      const specimens = { ...state.specimens }
      for (const bloom of blooms) {
        const key = itemKey(bloom)
        const representative = specimens[key]
        specimens[key] = { ...(representative ?? bloom), count: (representative?.count ?? 0) + 1 }
        if (bloom.tint !== undefined) {
          const key = `${bloom.species}~${bloom.tint}`
          hybrids[key] = (hybrids[key] ?? 0) + 1
        } else {
          const key = `${bloom.species}:${bloom.variant}`
          seen[key] = (seen[key] ?? 0) + 1
        }
        for (const part of traitCountKeys(bloom.trait)) {
          const key = `${bloom.species}:${part}`
          exotics[key] = (exotics[key] ?? 0) + 1
        }
      }
      const plots = slot.plots.slice()
      plots[index] = null
      return {
        ...state,
        ...goalPatch(state, first),
        seed: cursor,
        charm: (plot.resident || plot.identified) ? state.charm : false,
        xp: state.xp + species.xp,
        harvested: state.harvested + blooms.length,
        pollinated: (state.pollinated ?? 0) + (doubled ? 1 : 0),
        scenes: { ...state.scenes, [sceneId]: { ...slot, plots, ...withSoil(slot, index, soilOf(slot, index) - SOIL_HARVEST, species.id) } },
        basket: [...state.basket, ...blooms],
        seen,
        hybrids,
        exotics,
        specimens,
        seeds,
        ...kin,
        lastBred: bred ? `${species.id}~${partner}` : null,
      }
    }

    /** What in this plant's life could have made it a curiosity, most demanding first. */
    function traitCauses(plot, sceneId, weather, now) {
      const causes = []
      if ((plot.visits ?? 0) >= 3 && (plot.fed ?? 0) >= 2) causes.push('fasciated')
      if (['snapdragon','cardinalflower','pansy'].includes(plot.species) && (plot.specialVisits?.bumblebee ?? 0) > 0) causes.push('radial')
      if (plot.pollinated && (plot.fed ?? 0) >= 1) causes.push('double')
      if ((plot.guardianVisits ?? 0) >= 2 && weather === 'rain') causes.push('leafy')
      if ((plot.visits ?? 0) >= 2) causes.push('twin')
      if ((plot.fed ?? 0) >= 2) causes.push('giant')
      const local = SCENE_TRAIT[sceneId]
      if (local !== undefined && local.weather === weather) causes.push(local.trait)
      const hour = new Date(now).getHours()
      if (hour >= 22 || hour < 5) causes.push('ink')
      if (plot.dried === true) causes.push('variegated')
      return causes
    }

    /** The species flowering next door, if it differs: the pollen parent of a hybrid. */
    function hybridPartner(slot, index) {
      const own = slot.plots[index]
      if (own === null || own === undefined) return null
      for (const at of [index - 1, index + 1]) {
        if (at < 0 || at >= slot.unlocked) continue
        const other = slot.plots[at]
        if (other === null || other === undefined || other.species === own.species) continue
        const species = SPECIES_BY_ID.get(other.species)
        if (species !== undefined && other.growthMs >= growMsOf(species)) return other.species
      }
      return null
    }

    /** One basket group: species, colour, curiosity and hybrid parent. */
    function itemKey(item) {
      return `${item.species}:${item.variant}${item.trait !== undefined ? `:${item.trait}` : ''}${item.tint !== undefined ? `~${item.tint}` : ''}`
    }

    /** List price of one bloom before the market has its say. */
    function itemValue(item) {
      const species = SPECIES_BY_ID.get(item.species)
      const tint = item.tint === undefined ? undefined : SPECIES_BY_ID.get(item.tint)
      const base = tint === undefined ? species.sell : ((species.sell + tint.sell) / 2) * HYBRID_PRICE
      return base * variantMultiplier(item.variant) * traitPrice(item.trait)
    }

    /** How many price steps a species is down right now; it climbs back one step at a time. */
    function glutSteps(state, speciesId, now) {
      const entry = state.glut?.[speciesId]
      if (entry === undefined || now === undefined) return 0
      return Math.max(0, entry.n - Math.floor(Math.max(0, now - entry.at) / GLUT_RECOVER_MS))
    }

    function glutFactor(steps) {
      return Math.max(GLUT_FLOOR, 1 - GLUT_STEP * steps)
    }

    /**
     * Price a batch sold one bloom after another. With a clock the market
     * favourite pays its bonus and every sale pushes that species' price down a step.
     */
    function quoteSale(state, items, now) {
      const featured = featuredSpecies(state, now)
      const steps = new Map()
      let coins = 0
      for (const item of items) {
        const down = steps.get(item.species) ?? glutSteps(state, item.species, now)
        coins += Math.round((1 + shelfBonus(state).sale) * itemValue(item) * (item.species === featured ? MARKET_BONUS : 1) * glutFactor(down))
        steps.set(item.species, now === undefined ? 0 : down + 1)
      }
      return { coins, steps }
    }

    function sellWhere(state, match, now) {
      const selling = state.basket.filter(match)
      if (selling.length === 0) return null
      const quote = quoteSale(state, selling, now)
      const next = { ...state, coins: state.coins + quote.coins, basket: state.basket.filter(item => !match(item)) }
      if (now !== undefined) {
        const glut = { ...state.glut }
        for (const [id, down] of quote.steps) glut[id] = { n: Math.min(down, 14), at: now }
        next.glut = glut
      }
      return next
    }

    /** Sell one basket group, addressed by `itemKey`. */
    function sellIndividual(state, index, now) {
      if (!Number.isInteger(index) || index < 0 || index >= state.basket.length) return null
      const item = state.basket[index]
      const quote = quoteSale(state, [item], now)
      const next = { ...state, coins: state.coins + quote.coins, basket: state.basket.filter((_, at) => at !== index) }
      if (now !== undefined) next.glut = { ...state.glut, [item.species]: { n: Math.min(quote.steps.get(item.species), 14), at: now } }
      return next
    }

    function sellKind(state, key, now) {
      return sellWhere(state, item => itemKey(item) === key, now)
    }

    /**
     * Sell the blooms of one species (and variant), or the whole basket. With a
     * clock, today's market favourite sells at the market bonus.
     */
    function sellBasket(state, speciesId, variant, now) {
      return sellWhere(state, item => speciesId === undefined
        || (item.species === speciesId && (variant === undefined || item.variant === variant)), now)
    }

    function basketValue(state, now) {
      return quoteSale(state, state.basket, now).coins
    }

    function basketCount(state, speciesId) {
      return state.basket.filter(item => item.species === speciesId).length
    }

    /** Blooms a bouquet may use: gold ones are kept for selling. */
    function basketPlainCount(state, speciesId) {
      return state.basket.filter(item => item.species === speciesId && isPlainBloom(item)).length
    }

    /** Bouquets take ordinary blooms; spirits, curiosities and hybrids are for the counter and the show. */
    function isPlainBloom(item) {
      return item.variant !== 'hidden' && item.trait === undefined && item.tint === undefined
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
          if (basket[cursor].species !== item.species || !isPlainBloom(basket[cursor])) continue
          basket.splice(cursor, 1)
          remaining -= 1
        }
      }
      const next = {
        ...state,
        coins: state.coins + order.coins,
        xp: state.xp + order.xp,
        delivered: (state.delivered ?? 0) + 1,
        basket,
        orders: state.orders.filter(entry => entry.id !== orderId),
      }
      return fillOrders(next)
    }

    /** The counter an achievement watches. */
    function achievementValue(state, metric) {
      const grown = speciesId => ['base', 'alt', 'hidden'].some(variant => (state.seen[`${speciesId}:${variant}`] ?? 0) > 0)
      switch (metric) {
        case 'harvested': return state.harvested
        case 'delivered': return state.delivered ?? 0
        case 'pollinated': return state.pollinated ?? 0
        case 'visitorKinds': return Object.keys(state.visitors ?? {}).length
        case 'spiritKinds': return SPECIES.filter(species => (state.seen[`${species.id}:hidden`] ?? 0) > 0).length
        case 'meadowKinds': return SCENES[0].species.filter(grown).length
        case 'grounds': return SCENES.filter(scene => (state.scenes[scene.id]?.unlocked ?? 0) > 0).length
        case 'hybridKinds': return Object.keys(state.hybrids ?? {}).length
        case 'traitKinds': return new Set(Object.keys(state.exotics ?? {}).flatMap(key => traitParts(key.split(':')[1]))).size
        case 'ribbonsEarned': return state.ribbonsEarned ?? 0
        case 'entries': return CODEX_ENTRIES.filter(entry => (state.seen[`${entry.species}:${entry.variant}`] ?? 0) > 0).length
        case 'arranged': case 'trips': case 'crafted': case 'contestWins': case 'fund': return state[metric] ?? 0
        case 'bondsMax': return VISITORS.filter(visitor => affinityLevel(state, visitor.id) >= AFFINITY_LEVELS.length).length
        case 'goalsDone': return Object.keys(state.goalsDone ?? {}).length
        case 'cards': return (state.cards ?? []).length
        default: return 0
      }
    }

    function achievementReady(state, entry) {
      return state.claimed?.[entry.id] !== true && achievementValue(state, entry.metric) >= entry.target
    }

    /** Collect the coins of a finished achievement, once. */
    function claimAchievement(state, achievementId) {
      const entry = ACHIEVEMENT_BY_ID.get(achievementId)
      if (entry === undefined || !achievementReady(state, entry)) return null
      return { ...state, coins: state.coins + entry.coins, claimed: { ...state.claimed, [entry.id]: true } }
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

    /** Dig one compost into a plot, planted or not. */
    function compostAt(state, sceneId, index) {
      const slot = state.scenes[sceneId]
      if (slot === undefined || index < 0 || index >= slot.unlocked) return null
      if ((state.bag.compost ?? 0) <= 0 || soilOf(slot, index) >= 99.5) return null
      return {
        ...state,
        bag: { ...state.bag, compost: state.bag.compost - 1 },
        scenes: { ...state.scenes, [sceneId]: { ...slot, ...withSoil(slot, index, soilOf(slot, index) + COMPOST_GAIN) } },
      }
    }

    /** What the next level of a facility costs: coins grow geometrically, ribbons by one a level. */
    function facilityCost(id, level) {
      const entry = FACILITY_BY_ID.get(id)
      if (entry === undefined || level >= FACILITY_MAX) return null
      return { coins: Math.round((entry.base * Math.pow(FACILITY_GROWTH, level)) / 10) * 10, ribbons: level }
    }

    function upgradeFacility(state, id) {
      const level = facilityLevel(state, id)
      const cost = facilityCost(id, level)
      if (cost === null || state.coins < cost.coins || (state.ribbons ?? 0) < cost.ribbons) return null
      return {
        ...state,
        coins: state.coins - cost.coins,
        ribbons: (state.ribbons ?? 0) - cost.ribbons,
        facilities: { ...state.facilities, [id]: level + 1 },
      }
    }

    /** True for reds, pinks, oranges and yellows; whites, blues and purples are cool. */
    function isWarm(color) {
      const value = parseInt(color.slice(1), 16)
      const r = (value >> 16) & 255
      const g = (value >> 8) & 255
      const b = value & 255
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      if (max - min < 26) return false
      const hue = max === r ? ((g - b) / (max - min) + 6) % 6 : max === g ? (b - r) / (max - min) + 2 : (r - g) / (max - min) + 4
      return hue < 1.2 || hue > 5.4
    }

    /** The show running at `now`: a season, a theme, and a closing time. */
    function showAt(state, now) {
      const id = Math.floor(now / SHOW_MS)
      const season = SEASONS[((id % 4) + 4) % 4]
      const sceneId = SEASON_SCENE[season]
      let theme = SHOW_THEMES[Math.floor(hashUnit(id, 5, 11) * SHOW_THEMES.length)]
      // A ground the player has not opened cannot be the theme.
      if (theme === 'ground' && (state.scenes[sceneId]?.unlocked ?? 0) <= 0) theme = hashUnit(id, 6, 11) < 0.5 ? 'warm' : 'cool'
      return { id, season, theme, sceneId, endsAt: (id + 1) * SHOW_MS }
    }

    /** This show's entry sheet; a sheet from an earlier show is void. */
    function showEntry(state, now) {
      const id = Math.floor(now / SHOW_MS)
      return state.show !== null && state.show !== undefined && state.show.id === id
        ? state.show
        : { id, points: 0, entered: 0, kinds: [] }
    }

    function showAccepts(show, item) {
      const rare = item.variant === 'hidden' || item.trait !== undefined || item.tint !== undefined
      if (show.theme === 'rare') return rare
      if (item.variant === 'hidden') return true
      if (show.theme === 'ground') return SCENE_ID_OF.get(item.species) === show.sceneId
      const species = SPECIES_BY_ID.get(item.species)
      const warm = isWarm(paletteOf(species, item.variant, item.tint).petal)
      return show.theme === 'warm' ? warm : !warm
    }

    /** Judges reward rarity and variety: a species new to this show scores two more. */
    function showPoints(item, entry) {
      return 1
        + (item.variant === 'alt' ? 1 : 0)
        + (item.tint !== undefined ? 2 : 0)
        + (item.trait !== undefined ? 2 + traitParts(item.trait).length : 0)
        + (item.variant === 'hidden' ? 4 : 0)
        + (entry.kinds.includes(item.species) ? 0 : 2)
    }

    /** Give one bloom of a basket group to the show. It earns points, never coins. */
    function exhibit(state, key, now, individualIndex) {
      const show = showAt(state, now)
      const entry = showEntry(state, now)
      if (entry.entered >= SHOW_SLOTS) return null
      let at = -1
      if (individualIndex !== undefined) {
        if (!Number.isInteger(individualIndex) || !state.basket[individualIndex] || itemKey(state.basket[individualIndex]) !== key) return null
        at = individualIndex
      } else {
        for (let index = state.basket.length - 1; index >= 0; index -= 1) {
          if (itemKey(state.basket[index]) === key) { at = index; break }
        }
      }
      if (at === -1 || !showAccepts(show, state.basket[at])) return null
      const item = state.basket[at]
      const points = entry.points + showPoints(item, entry)
      const won = SHOW_TIERS.filter(tier => entry.points < tier.points && points >= tier.points)
        .reduce((sum, tier) => sum + tier.ribbons, 0)
      return {
        ...state,
        basket: state.basket.filter((_, index) => index !== at),
        ribbons: (state.ribbons ?? 0) + won,
        ribbonsEarned: (state.ribbonsEarned ?? 0) + won,
        show: {
          id: show.id,
          points,
          entered: entry.entered + 1,
          kinds: entry.kinds.includes(item.species) ? entry.kinds : [...entry.kinds, item.species],
        },
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
      plots[index] = { ...plot, growthMs: Math.min(growMs, plot.growthMs + growMs * 0.25), fed: (plot.fed ?? 0) + 1 }
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
    // §3n Bulk actions: harvest every ripe plant, sow every empty plot at random.
    // ---------------------------------------------------------------------
    /** Harvest every ripe, non-resident plant of one ground, until the basket is full. Null when nothing was picked. */
    function harvestAll(state, sceneId, now) {
      let next = state
      const count = state.scenes[sceneId]?.unlocked ?? 0
      for (let index = 0; index < count; index += 1) {
        const plot = next.scenes[sceneId].plots[index]
        if (plot === null || plot === undefined || plot.resident) continue
        const done = harvestAt(next, sceneId, index, now, weatherAt(now), false)
        if (done !== null) next = done
      }
      return next === state ? null : next
    }

    /** Fill every empty plot of one ground with a random seed the purse can pay for. Null when nothing was sown. */
    function sowRandom(state, sceneId) {
      const scene = SCENE_BY_ID.get(sceneId)
      if (scene === undefined || state.scenes[sceneId] === undefined) return null
      let next = state
      for (let index = 0; index < next.scenes[sceneId].unlocked; index += 1) {
        if (next.scenes[sceneId].plots[index] !== null) continue
        const pool = scene.species.filter(id => SPECIES_BY_ID.get(id).cost <= next.coins)
        if (pool.length === 0) break
        const pick = pool[Math.floor(hashUnit(next.seed, next.planted ?? 0, index + 97) * pool.length)]
        const done = plantAt(next, sceneId, index, pick)
        if (done !== null) next = done
      }
      return next === state ? null : next
    }

    function ripeCount(slot) {
      return slot.plots.slice(0, slot.unlocked).filter(plot => plot && !plot.resident && stageOf(plot) === 'bloom').length
    }

    function emptyCount(slot) {
      return slot.plots.slice(0, slot.unlocked).filter(plot => plot === null).length
    }

    /** How many visitors are waiting on one ground right now. */
    function visitorCount(state, sceneId, now) {
      const slot = state.scenes[sceneId]
      if (slot === undefined) return 0
      const weather = weatherAt(now), hive = facilityLevel(state, 'hive'), bonus = gardenEcology(state, now).visitorBonus
      return slot.plots.slice(0, slot.unlocked).filter((plot, index) => visitorAt(sceneId, index, plot, now, weather, hive, bonus, state) !== null).length
    }

    /** Greet every visitor waiting on one ground. Null when nobody is there. */
    function greetAll(state, sceneId, now) {
      let next = state
      const count = state.scenes[sceneId]?.unlocked ?? 0
      for (let index = 0; index < count; index += 1) {
        const done = greetVisitor(next, sceneId, index, now, weatherAt(now))
        if (done !== null) next = done
      }
      return next === state ? null : next
    }

    const BULK_API = { harvestAll, sowRandom, ripeCount, emptyCount, visitorCount, greetAll }

    // ---------------------------------------------------------------------
    // §3o Vase colours: every owned vase can be repainted, and a bouquet card
    //     remembers the colour its vase had.
    // ---------------------------------------------------------------------
    const VASE_SWATCHES = ['#a9cdb8', '#8fc0d6', '#f1f4f7', '#7a5aa8', '#e2b93b', '#d9706a', '#2f3a4a', '#e8a0b8']

    function cleanTint(value) {
      return typeof value === 'string' && /^#[0-9a-f]{6}$/iu.test(value) ? value.toLowerCase() : null
    }

    function vaseTint(state, id) {
      return cleanTint(state.vaseTints?.[id])
    }

    /** Paint an owned vase; `null` puts its own glaze back. */
    function setVaseTint(state, id, color) {
      if (!VASE_BY_ID.has(id) || !vaseOwned(state, id)) return null
      const tints = { ...state.vaseTints }
      if (color === null) delete tints[id]
      else if (cleanTint(color) === null) return null
      else tints[id] = cleanTint(color)
      return { ...state, vaseTints: tints }
    }

    function sanitizeTints(raw) {
      const vaseTints = {}
      for (const vase of VASES) { const tint = cleanTint(raw.vaseTints?.[vase.id]); if (tint !== null) vaseTints[vase.id] = tint }
      return { vaseTints }
    }

    const TINT_API = { VASE_SWATCHES, cleanTint, vaseTint, setVaseTint, sanitizeTints }

    // ---------------------------------------------------------------------
    // §3p Workshop goods: a finished job can be kept as an item with a use of
    //     its own, instead of being sold for coins.
    // ---------------------------------------------------------------------
    const GOODS = ['dried', 'tea', 'perfume']
    const TEA_BOND = 8
    const SCENT_MS = 30 * 60 * 1000
    const SCENT_BONUS = 0.15

    function goodsCount(state, id) {
      return Math.max(0, Math.floor(state.goods?.[id] ?? 0))
    }

    function spendGood(state, id) {
      return { ...state, goods: { ...state.goods, [id]: goodsCount(state, id) - 1 }, goodsUsed: (state.goodsUsed ?? 0) + 1 }
    }

    /** A cup of flower tea for a visitor the player has met; refused when the bond is already complete. */
    function serveTea(state, visitorId) {
      if (!VISITOR_BY_ID.has(visitorId) || !((state.visitors?.[visitorId] ?? 0) > 0) || goodsCount(state, 'tea') <= 0) return null
      if (affinityLevel(state, visitorId) >= AFFINITY_LEVELS.length) return null
      return addAffinity(spendGood(state, 'tea'), visitorId, TEA_BOND)
    }

    function scentBonus(state, now) {
      return state.scent && state.scent.until > now ? SCENT_BONUS : 0
    }

    /** Perfume over the whole garden: more visitors for half an hour. It does not stack. */
    function sprayPerfume(state, now) {
      if (goodsCount(state, 'perfume') <= 0 || scentBonus(state, now) > 0) return null
      return { ...spendGood(state, 'perfume'), scent: { until: now + SCENT_MS } }
    }

    function sanitizeGoods(raw, now) {
      return {
        goods: Object.fromEntries(GOODS.map(id => [id, Math.floor(finiteOr(raw.goods?.[id], 0))])),
        goodsUsed: Math.floor(finiteOr(raw.goodsUsed, 0)),
        scent: Number.isFinite(raw.scent?.until) ? { until: Math.min(raw.scent.until, now + SCENT_MS) } : null,
      }
    }

    const GOODS_API = { GOODS, TEA_BOND, SCENT_MS, SCENT_BONUS, goodsCount, serveTea, scentBonus, sprayPerfume, sanitizeGoods }

    // ---------------------------------------------------------------------
    // §3q Every flower is good for something: a bloom can be used up for an
    //     effect set by its ecological role, and three species a day are wanted.
    // ---------------------------------------------------------------------
    const USE_BOND = 2
    const USE_SOIL = 20
    const USE_BOOST_MS = 5 * 60 * 1000
    const WANTED_SLOTS = 3

    function flowerUse(speciesId) {
      return ECO_PROFILES[speciesId]?.role ?? null
    }

    /** Use up one basket bloom on the current ground; a special bloom works twice as well. Null when it would be wasted. */
    function useBloom(state, basketIndex, now) {
      const item = state.basket[basketIndex]
      const role = item === undefined ? null : flowerUse(item.species)
      const slot = state.scenes[state.scene]
      if (role === null || slot === undefined) return null
      const power = isPlainBloom(item) ? 1 : 2
      const base = { ...state, basket: state.basket.filter((_, index) => index !== basketIndex), used: (state.used ?? 0) + 1 }
      const withSlot = patch => ({ ...base, scenes: { ...state.scenes, [state.scene]: { ...slot, ...patch } } })
      const planted = slot.plots.filter(plot => plot !== null && plot !== undefined)
      if (role === 'nectar') {
        const friend = ECO_PROFILES[item.species].visitor
        return VISITOR_BY_ID.has(friend) ? addAffinity(base, friend, USE_BOND * power) : null
      }
      if (role === 'seed') return applyReward(base, { bag: { fertilizer: power } })
      if (role === 'night') return { ...base, boost: { type: 'rainbow', until: now + USE_BOOST_MS * power } }
      if (role === 'pollen') {
        let left = power
        const plots = slot.plots.map(plot => {
          if (plot === null || plot === undefined || plot.pollinated === true || left === 0) return plot
          left -= 1
          return { ...plot, pollinated: true }
        })
        return left === power ? null : withSlot({ plots })
      }
      if (role === 'water') {
        if (!planted.some(plot => plot.moisture < 99.5)) return null
        return withSlot({ plots: slot.plots.map(plot => (plot === null || plot === undefined ? plot : { ...plot, moisture: 100 })) })
      }
      const soil = new Array(PLOT_COUNT).fill(100).map((_, at) => (at < slot.unlocked ? Math.min(100, soilOf(slot, at) + USE_SOIL * power) : soilOf(slot, at)))
      if (soil.every((value, at) => value === soilOf(slot, at))) return null
      return withSlot({ soil })
    }

    /** Three wanted species a day, walking through every flower of the opened grounds in turn. */
    function wantedAt(state, now) {
      const day = localDay(now)
      const pool = SPECIES.filter(species => (state.scenes[SCENE_ID_OF.get(species.id)]?.unlocked ?? 0) > 0)
      return Array.from({ length: Math.min(WANTED_SLOTS, pool.length) }, (_, index) => pool[(day * WANTED_SLOTS + index) % pool.length].id)
    }

    function wantedState(state, now) {
      const day = localDay(now)
      return state.wanted && state.wanted.day === day ? state.wanted : { day, done: [] }
    }

    function wantedPay(speciesId) {
      return SPECIES_BY_ID.get(speciesId).sell * 2 + 10
    }

    /** Hand in one bloom of a wanted species for twice its price; all three in a day add a ribbon. */
    function deliverWanted(state, speciesId, now) {
      const list = wantedAt(state, now)
      const wanted = wantedState(state, now)
      if (!list.includes(speciesId) || wanted.done.includes(speciesId)) return null
      let at = state.basket.findIndex(item => item.species === speciesId && isPlainBloom(item))
      if (at === -1) at = state.basket.findIndex(item => item.species === speciesId)
      if (at === -1) return null
      const done = [...wanted.done, speciesId]
      const all = list.every(id => done.includes(id))
      return {
        ...state, coins: state.coins + wantedPay(speciesId), basket: state.basket.filter((_, index) => index !== at),
        wanted: { day: wanted.day, done }, wantedDone: (state.wantedDone ?? 0) + 1,
        ribbons: (state.ribbons ?? 0) + (all ? 1 : 0), ribbonsEarned: (state.ribbonsEarned ?? 0) + (all ? 1 : 0),
      }
    }

    function sanitizeFlowers(raw, now) {
      const w = raw.wanted
      const wanted = w && Number.isFinite(w.day) && Array.isArray(w.done)
        ? { day: Math.min(localDay(now), Math.floor(w.day)), done: [...new Set(w.done.filter(id => SPECIES_BY_ID.has(id)))] } : null
      return { used: Math.floor(finiteOr(raw.used, 0)), wantedDone: Math.floor(finiteOr(raw.wantedDone, 0)), wanted }
    }

    const FLOWER_API = { USE_BOND, USE_SOIL, USE_BOOST_MS, WANTED_SLOTS, flowerUse, useBloom, wantedAt, wantedState, wantedPay, deliverWanted, sanitizeFlowers }

    // ---------------------------------------------------------------------
    // §3r Companions that live in the garden, short-lived garden events and
    //     the daily bouquet brief.
    // ---------------------------------------------------------------------
    const COMPANION_MAX = 3
    const COMPANION_COST = 1000
    const EVENT_MS = 30 * 60 * 1000
    const EVENT_WINDOW_MS = 8 * 60 * 1000
    const EVENT_CHANCE = 0.35
    const BOOST_MS = 10 * 60 * 1000
    const BOOST_SPIRIT = 0.02
    const BRIEF_REWARD = { coins: 60, ribbons: 1 }

    function companionRole(id) {
      return VISITOR_INFO[id]?.role
    }

    /** A visitor whose bond is complete can be invited to stay, for a fee. */
    function inviteCompanion(state, id) {
      const list = state.companions ?? []
      if (!VISITOR_BY_ID.has(id) || list.includes(id) || list.length >= COMPANION_MAX) return null
      if (affinityLevel(state, id) < AFFINITY_LEVELS.length || state.coins < COMPANION_COST) return null
      return { ...state, coins: state.coins - COMPANION_COST, companions: [...list, id] }
    }

    function dismissCompanion(state, id) {
      if (!(state.companions ?? []).includes(id)) return null
      return { ...state, companions: state.companions.filter(other => other !== id) }
    }

    /** One good turn: pollinate a plant, water the driest one, or feed the poorest soil. */
    function companionHelp(state, role) {
      let best = null
      for (const scene of SCENES) {
        const slot = state.scenes[scene.id]
        if (slot === undefined) continue
        slot.plots.forEach((plot, index) => {
          if (plot === null || plot === undefined || index >= slot.unlocked) return
          const score = role === 'pollinator' ? (plot.pollinated === true ? 0 : 1) : role === 'waterside' ? 100 - plot.moisture : 100 - soilOf(slot, index)
          if (score > 0 && (best === null || score > best.score)) best = { sceneId: scene.id, index, score }
        })
      }
      if (best === null) return state
      const slot = state.scenes[best.sceneId]
      const plots = slot.plots.slice()
      if (role === 'pollinator') plots[best.index] = { ...plots[best.index], pollinated: true }
      else if (role === 'waterside') plots[best.index] = { ...plots[best.index], moisture: 100 }
      const soil = role === 'guardian' ? withSoil(slot, best.index, soilOf(slot, best.index) + 15) : {}
      return { ...state, scenes: { ...state.scenes, [best.sceneId]: { ...slot, plots, ...soil } } }
    }

    /** Each companion helps once per clock hour; an idle tick returns the same state. */
    function companionTick(state, now) {
      const list = state.companions ?? []
      if (list.length === 0) return state
      const hour = Math.floor(now / HOUR_MS)
      if (state.companionHour === undefined) return { ...state, companionHour: hour }
      if (hour <= state.companionHour) return state
      let next = { ...state, companionHour: hour }
      for (const id of list) next = companionHelp(next, companionRole(id))
      return next
    }

    /** A passing wonder: there for eight minutes in some half-hours, gone once joined. */
    function eventAt(state, now) {
      const bucket = Math.floor(now / EVENT_MS)
      if ((state.eventBucket ?? -1) >= bucket || now - bucket * EVENT_MS >= EVENT_WINDOW_MS) return null
      if (hashUnit(bucket, 20261119, 53) >= EVENT_CHANCE) return null
      const kinds = isNight(now) ? ['meteor', 'dew'] : ['rainbow', 'swarm', 'dew']
      return { bucket, type: kinds[Math.floor(hashUnit(bucket, 20261119, 59) * kinds.length)], until: bucket * EVENT_MS + EVENT_WINDOW_MS }
    }

    function joinEvent(state, now) {
      const event = eventAt(state, now)
      if (event === null) return null
      const next = { ...state, eventBucket: event.bucket, events: (state.events ?? 0) + 1 }
      if (event.type === 'rainbow') return { ...next, boost: { type: 'rainbow', until: now + BOOST_MS } }
      if (event.type === 'meteor') return { ...next, charm: true }
      const scenes = { ...state.scenes }
      for (const scene of SCENES) {
        const slot = scenes[scene.id]
        if (slot === undefined || (event.type === 'swarm' && scene.id !== state.scene)) continue
        scenes[scene.id] = { ...slot, plots: slot.plots.map(plot => (plot === null || plot === undefined ? plot : event.type === 'swarm' ? { ...plot, pollinated: true } : { ...plot, moisture: 100 })) }
      }
      return { ...next, scenes }
    }

    function boostBonus(state, now) {
      return state.boost?.type === 'rainbow' && state.boost.until > now ? BOOST_SPIRIT : 0
    }

    /** Today's bouquet brief: enough stars, enough flowers, and on the day's theme. */
    function briefAt(now) {
      const day = localDay(now)
      return { day, stars: 3 + Math.floor(hashUnit(day, 3, 97) * 2), count: 3 + Math.floor(hashUnit(day, 4, 97) * 3), theme: bouquetTheme(now) }
    }

    function briefMet(brief, items, score) {
      return score !== null && score.stars >= brief.stars && items.length >= brief.count && score.checks.theme === true
    }

    /** Paid once a day, on top of the bouquet itself; {} when the brief is not met. */
    function briefPatch(state, items, score, now) {
      const brief = briefAt(now)
      if ((state.briefDay ?? -1) >= brief.day || !briefMet(brief, items, score)) return {}
      return {
        briefDay: brief.day, briefs: (state.briefs ?? 0) + 1, coins: state.coins + score.coins + BRIEF_REWARD.coins,
        ribbons: (state.ribbons ?? 0) + BRIEF_REWARD.ribbons, ribbonsEarned: (state.ribbonsEarned ?? 0) + BRIEF_REWARD.ribbons,
      }
    }

    function sanitizeFun(raw, now) {
      const companions = Array.isArray(raw.companions) ? [...new Set(raw.companions.filter(id => VISITOR_BY_ID.has(id)))].slice(0, COMPANION_MAX) : []
      const out = {
        companions, events: Math.floor(finiteOr(raw.events, 0)), briefs: Math.floor(finiteOr(raw.briefs, 0)),
        eventBucket: Number.isFinite(raw.eventBucket) ? Math.floor(raw.eventBucket) : -1,
        briefDay: Number.isFinite(raw.briefDay) ? Math.min(localDay(now), Math.floor(raw.briefDay)) : -1,
        boost: raw.boost?.type === 'rainbow' && Number.isFinite(raw.boost.until) ? { type: 'rainbow', until: Math.min(raw.boost.until, now + BOOST_MS) } : null,
      }
      if (Number.isFinite(raw.companionHour)) out.companionHour = Math.min(Math.floor(now / HOUR_MS), Math.floor(raw.companionHour))
      return out
    }

    const FUN_API = {
      COMPANION_MAX, COMPANION_COST, EVENT_MS, EVENT_WINDOW_MS, BOOST_MS, BOOST_SPIRIT, BRIEF_REWARD,
      companionRole, inviteCompanion, dismissCompanion, companionHelp, companionTick, eventAt, joinEvent, boostBonus,
      briefAt, briefMet, briefPatch, sanitizeFun,
    }

    // ---------------------------------------------------------------------
    // §3s A use for everything: reputation sends bigger expeditions, species
    //     study raises that species' spirit chance, ribbons buy time.
    // ---------------------------------------------------------------------
    const PATRON_STEP = 10
    const PATRON_MAX = 3
    const STUDY_BONUS = 0.01
    const RUSH_RIBBONS = 1

    /** Extra finds an expedition brings back: one per ten points of commission reputation, up to three. */
    function patronBonus(state) {
      return Math.max(0, Math.min(PATRON_MAX, Math.floor((state.patronage ?? 0) / PATRON_STEP)))
    }

    /** Spirit chance from knowing a species: one point per study level. */
    function studyBonus(state, speciesId) {
      return studyLevel(state.study?.[speciesId]?.observations ?? 0) * STUDY_BONUS
    }

    function rushExpedition(state, now) {
      const trip = state.expedition
      if (!trip || now >= trip.end || (state.ribbons ?? 0) < RUSH_RIBBONS) return null
      return { ...state, ribbons: state.ribbons - RUSH_RIBBONS, expedition: { ...trip, end: now } }
    }

    function rushJob(state, index, now) {
      const jobs = state.workshop?.jobs ?? []
      const job = jobs[index]
      if (job === undefined || now >= job.end || (state.ribbons ?? 0) < RUSH_RIBBONS) return null
      return { ...state, ribbons: state.ribbons - RUSH_RIBBONS, workshop: { ...state.workshop, jobs: jobs.map((entry, at) => (at === index ? { ...entry, end: now } : entry)) } }
    }

    const USES_API = { PATRON_STEP, PATRON_MAX, STUDY_BONUS, RUSH_RIBBONS, patronBonus, studyBonus, rushExpedition, rushJob }

    // ---------------------------------------------------------------------
    // §3t The garden fund: an open-ended place for coins to go. Every level
    //     costs more than the last and pays in ribbons and standing, not coins.
    // ---------------------------------------------------------------------
    const FUND_BASE = 2000
    const FUND_GROWTH = 1.15
    const FUND_RANKS = 6

    function fundLevel(state) {
      return Math.max(0, Math.floor(state.fund ?? 0))
    }

    function fundCost(level) {
      return Math.round((FUND_BASE * Math.pow(FUND_GROWTH, level)) / 100) * 100
    }

    /** Standing shown beside the fund: a new rank every five levels. */
    function fundRank(level) {
      return Math.min(FUND_RANKS - 1, Math.floor(level / 5))
    }

    /** One ribbon a level, and a lucky charm on every fifth. */
    function donateFund(state) {
      const level = fundLevel(state)
      const cost = fundCost(level)
      if (state.coins < cost) return null
      const paid = applyReward({ ...state, coins: state.coins - cost }, (level + 1) % 5 === 0 ? { bag: { charm: 1 } } : {})
      return { ...paid, fund: level + 1, ribbons: (state.ribbons ?? 0) + 1, ribbonsEarned: (state.ribbonsEarned ?? 0) + 1 }
    }

    function sanitizeFund(raw) {
      return { fund: Math.floor(finiteOr(raw.fund, 0)) }
    }

    const FUND_API = { FUND_BASE, FUND_GROWTH, fundLevel, fundCost, fundRank, donateFund, sanitizeFund }

    // ---------------------------------------------------------------------
    // §3u Long-term loops: the workshop, collection pages, the weekly bouquet
    //     contest and starting the garden over with heirlooms.
    // ---------------------------------------------------------------------
    const BENCH_PRICES = [500, 2000, 6000]
    const RECIPES = [
      { id: 'dried', count: 1, ms: 10 * 60 * 1000, mult: 0.9, fee: 5 },
      { id: 'tea', count: 3, ms: 30 * 60 * 1000, mult: 1, fee: 20 },
      { id: 'perfume', count: 5, ms: 2 * 60 * 60 * 1000, mult: 1.1, fee: 60 },
    ]
    const RECIPE_BY_ID = new Map(RECIPES.map(recipe => [recipe.id, recipe]))
    const CONTEST_FEE = 100
    const CONTEST_RIVALS = ['iris', 'moss', 'wren']
    const CONTEST_PRIZES = [{ coins: 300, ribbons: 3 }, { ribbons: 2 }, { ribbons: 1 }, {}]
    const LEGACY_LEVEL = 15
    const HEIRLOOM_SEEDS = 3
    const PAGES = [
      ...SCENES.map(scene => ({ id: `scene-${scene.id}`, kind: 'scene', scene: scene.id, need: 4, reward: { coins: 300 } })),
      { id: 'rarity', kind: 'rarity', need: 5, reward: { coins: 800, bag: { charm: 1 } } },
      { id: 'traits', kind: 'traits', need: 4, reward: { coins: 600 } },
    ]

    function benchCount(state) {
      return Math.max(0, Math.min(BENCH_PRICES.length, Math.floor(state.workshop?.benches ?? 0)))
    }

    function buyBench(state) {
      const benches = benchCount(state)
      if (benches >= BENCH_PRICES.length || state.coins < BENCH_PRICES[benches]) return null
      return { ...state, coins: state.coins - BENCH_PRICES[benches], workshop: { benches: benches + 1, jobs: state.workshop?.jobs ?? [] } }
    }

    /** Process basket blooms at list price (the market slump does not apply), for a fee and some waiting. */
    function startJob(state, recipeId, indices, now) {
      const recipe = RECIPE_BY_ID.get(recipeId)
      const jobs = state.workshop?.jobs ?? []
      if (recipe === undefined || jobs.length >= benchCount(state) || state.coins < recipe.fee) return null
      if (!Array.isArray(indices) || indices.length !== recipe.count || new Set(indices).size !== indices.length) return null
      if (indices.some(index => !Number.isInteger(index) || index < 0 || index >= state.basket.length)) return null
      const used = new Set(indices)
      const value = indices.reduce((sum, index) => sum + itemValue(state.basket[index]), 0)
      const job = { recipe: recipe.id, coins: Math.round(value * recipe.mult), start: now, end: now + recipe.ms }
      return { ...state, coins: state.coins - recipe.fee, basket: state.basket.filter((_, index) => !used.has(index)), workshop: { benches: benchCount(state), jobs: [...jobs, job] } }
    }

    function claimJob(state, index, now, keep = false) {
      const jobs = state.workshop?.jobs ?? []
      const job = jobs[index]
      if (job === undefined || now < job.end) return null
      return { ...state, ...(keep ? { goods: { ...state.goods, [job.recipe]: goodsCount(state, job.recipe) + 1 } } : { coins: state.coins + job.coins }), crafted: (state.crafted ?? 0) + 1, workshop: { benches: benchCount(state), jobs: jobs.filter((_, at) => at !== index) } }
    }

    /** What the flower cards cover on one collection page. */
    function pageProgress(state, page) {
      const items = (state.cards ?? []).map(card => card.item)
      const have = page.kind === 'scene' ? new Set(items.filter(item => SCENE_ID_OF.get(item.species) === page.scene).map(item => item.species))
        : page.kind === 'rarity' ? new Set(items.map(rarityOf)) : new Set(items.filter(item => item.trait).map(item => item.trait))
      return { have: [...have], count: Math.min(page.need, have.size), need: page.need, done: state.pagesDone?.[page.id] === true }
    }

    function claimPage(state, id) {
      const page = PAGES.find(entry => entry.id === id)
      if (page === undefined) return null
      const progress = pageProgress(state, page)
      if (progress.done || progress.count < page.need) return null
      return { ...applyReward(state, page.reward), pagesDone: { ...state.pagesDone, [id]: true } }
    }

    function contestWeek(now) {
      return Math.floor(localDay(now) / 7)
    }

    function contestRivals(week) {
      return CONTEST_RIVALS.map((id, index) => ({ id, score: 20 + Math.floor(hashUnit(week, index, 71) * 35) }))
    }

    function bouquetScore(card) {
      return card.stars * 10 + card.items.length + (card.match === true ? 5 : 0)
    }

    /** Enter one bouquet card a week against three rivals; the fee is paid whatever the result. */
    function enterContest(state, cardId, now) {
      const week = contestWeek(now)
      const card = (state.bouquets ?? []).find(entry => entry.id === cardId)
      if (card === undefined || state.contest?.week === week || state.coins < CONTEST_FEE) return null
      const score = bouquetScore(card)
      const rank = 1 + contestRivals(week).filter(rival => rival.score > score).length
      const prize = CONTEST_PRIZES[rank - 1]
      const paid = applyReward({ ...state, coins: state.coins - CONTEST_FEE }, prize)
      return {
        ...paid, contest: { week, card: cardId, score, rank }, contestWins: (state.contestWins ?? 0) + (rank === 1 ? 1 : 0),
        ribbons: (state.ribbons ?? 0) + (prize.ribbons ?? 0), ribbonsEarned: (state.ribbonsEarned ?? 0) + (prize.ribbons ?? 0),
      }
    }

    function legacyReady(state) {
      return levelOf(state.xp) >= LEGACY_LEVEL && SCENES.every(scene => (state.scenes[scene.id]?.unlocked ?? 0) > 0)
    }

    /** Start over: plots, coins and level reset; the album, vases, shelf, records and a few seeds stay. */
    function startLegacy(state, now) {
      if (!legacyReady(state)) return null
      const keys = Object.keys(state.seeds ?? {}).slice(0, HEIRLOOM_SEEDS)
      const legacy = (state.legacy ?? 0) + 1
      const keep = {}
      for (const field of ['ui', 'discoveries', 'discoverySeq', 'seen', 'specimens', 'hybrids', 'exotics', 'visitors', 'affinity', 'study', 'claimed',
        'daily', 'goalsDone', 'pagesDone', 'pedigree', 'bouquets', 'cards', 'cardSeq', 'vases', 'shelf', 'arranged', 'bouquetBest', 'trips', 'contest', 'contestWins', 'crafted', 'fund', 'companions', 'events', 'briefs', 'used', 'wantedDone', 'vaseTints']) {
        if (state[field] !== undefined) keep[field] = state[field]
      }
      return {
        ...freshState(now), ...keep, legacy, coins: START_COINS + 100 * legacy,
        seeds: Object.fromEntries(keys.map(key => [key, 1])),
        lineage: Object.fromEntries(keys.filter(key => state.lineage?.[key]?.length > 0).map(key => [key, [state.lineage[key][0]]])),
      }
    }

    function sanitizeLongterm(raw, now) {
      const benches = Math.max(0, Math.min(BENCH_PRICES.length, Math.floor(finiteOr(raw.workshop?.benches, 0))))
      const jobs = (Array.isArray(raw.workshop?.jobs) ? raw.workshop.jobs : [])
        .filter(job => job && RECIPE_BY_ID.has(job.recipe) && Number.isFinite(job.start) && job.start >= 0)
        .map(job => { const start = Math.min(job.start, now); return { recipe: job.recipe, coins: Math.floor(finiteOr(job.coins, 0)), start, end: Number.isFinite(job.end) && job.end >= start ? Math.min(start + RECIPE_BY_ID.get(job.recipe).ms, job.end) : start + RECIPE_BY_ID.get(job.recipe).ms } })
        .slice(0, benches)
      const pagesDone = {}
      for (const page of PAGES) if (raw.pagesDone?.[page.id] === true) pagesDone[page.id] = true
      const c = raw.contest
      const contest = c && Number.isFinite(c.week) && Number.isFinite(c.rank)
        ? { week: Math.floor(c.week), card: Math.floor(finiteOr(c.card, 0)), score: Math.floor(finiteOr(c.score, 0)), rank: Math.max(1, Math.min(4, Math.floor(c.rank))) } : null
      return {
        workshop: { benches, jobs }, pagesDone, contest,
        contestWins: Math.floor(finiteOr(raw.contestWins, 0)), crafted: Math.floor(finiteOr(raw.crafted, 0)), legacy: Math.floor(finiteOr(raw.legacy, 0)),
      }
    }

    const LONGTERM_API = {
      BENCH_PRICES, RECIPES, CONTEST_FEE, CONTEST_PRIZES, LEGACY_LEVEL, HEIRLOOM_SEEDS, PAGES,
      benchCount, buyBench, startJob, claimJob, pageProgress, claimPage, contestWeek, contestRivals, bouquetScore, enterContest,
      legacyReady, startLegacy, sanitizeLongterm,
    }

    // ---------------------------------------------------------------------
    // §3v Coin sinks with a purpose: vases to buy, a display shelf whose cards
    //     give small bonuses, and names for bouquet cards.
    // ---------------------------------------------------------------------
    const VASE_PRICE = { classic: 0, round: 300, tall: 800, basket: 1500, moon: 3000, gold: 6000 }
    const VASE_LIKES = { round: 'wide', tall: 'high', basket: 'mixed', moon: 'white', gold: 'rare' }
    const VASE_MATCH_BONUS = 0.05
    const SHELF_PRICES = [400, 1200, 3000, 7000, 15000]

    function cleanText(value, max) {
      return typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim().slice(0, max) : ''
    }

    function vaseOwned(state, id) {
      return id === 'classic' || (Array.isArray(state.vases) && state.vases.includes(id))
    }

    /** A vase must be earned by practice first, then bought. */
    function buyVase(state, id) {
      if (!VASE_BY_ID.has(id) || vaseOwned(state, id) || !vaseUnlocked(state, id) || state.coins < VASE_PRICE[id]) return null
      return { ...state, coins: state.coins - VASE_PRICE[id], vases: [...(state.vases ?? []), id] }
    }

    /** Each vase suits a kind of flower; half the bouquet or more must fit. */
    function vaseMatch(vase, items) {
      const like = VASE_LIKES[vase]
      if (like === undefined || items.length === 0) return false
      if (like === 'mixed') return new Set(items.map(item => item.species)).size >= 4
      const fits = item => (like === 'wide' ? item.dna > 0 && genesOf(item.dna).width >= 4
        : like === 'high' ? item.dna > 0 && genesOf(item.dna).height >= 4
          : like === 'white' ? bloomTone(item).family === 'white' : !isPlainBloom(item))
      return items.filter(fits).length * 2 >= items.length
    }

    function shelfSlots(state) {
      return Math.max(0, Math.min(SHELF_PRICES.length, Math.floor(state.shelf?.slots ?? 0)))
    }

    function buyShelfSlot(state) {
      const slots = shelfSlots(state)
      if (slots >= SHELF_PRICES.length || state.coins < SHELF_PRICES[slots]) return null
      return { ...state, coins: state.coins - SHELF_PRICES[slots], shelf: { slots: slots + 1, cards: state.shelf?.cards ?? [] } }
    }

    /** Cards on the shelf that still exist in the album, at most one per slot. */
    function shelfCards(state) {
      return (state.shelf?.cards ?? [])
        .map(ref => ({ ...ref, card: (state[ref.kind] ?? []).find(card => card.id === ref.id) }))
        .filter(ref => ref.card !== undefined).slice(0, shelfSlots(state))
    }

    function shelfEffect(ref) {
      if (ref.kind === 'bouquets') return { type: 'sale', amount: ref.card.stars * 0.01 }
      const rarity = rarityOf(ref.card.item)
      return rarity === 'spirit' ? { type: 'spirit', amount: 0.01 }
        : rarity === 'curio' || rarity === 'hybrid' ? { type: 'hybrid', amount: 0.02 } : { type: 'visitor', amount: 0.01 }
    }

    /** Small permanent bonuses from the displayed cards, plus one point of spirit chance per legacy. */
    function shelfBonus(state) {
      const bonus = { sale: 0, spirit: Math.min(5, Math.floor(state.legacy ?? 0)) * 0.01, hybrid: 0, visitor: 0 }
      for (const ref of shelfCards(state)) { const effect = shelfEffect(ref); bonus[effect.type] += effect.amount }
      return bonus
    }

    /** Put a card on the shelf, or take it off when it is already there. */
    function toggleShelf(state, kind, id) {
      if ((kind !== 'bouquets' && kind !== 'cards') || !(state[kind] ?? []).some(card => card.id === id)) return null
      const shown = shelfCards(state).map(({ kind: k, id: n }) => ({ kind: k, id: n }))
      const at = shown.findIndex(ref => ref.kind === kind && ref.id === id)
      if (at === -1 && shown.length >= shelfSlots(state)) return null
      const cards = at === -1 ? [...shown, { kind, id }] : shown.filter((_, index) => index !== at)
      return { ...state, shelf: { slots: shelfSlots(state), cards } }
    }

    function nameBouquet(state, id, title, note) {
      if (!(state.bouquets ?? []).some(card => card.id === id)) return null
      return { ...state, bouquets: state.bouquets.map(card => (card.id === id ? { ...card, title: cleanText(title, 20), note: cleanText(note, 60) } : card)) }
    }

    function sanitizeEconomy(raw) {
      const vases = Array.isArray(raw.vases) ? [...new Set(raw.vases.filter(id => VASE_BY_ID.has(id) && id !== 'classic'))] : []
      const slots = Math.max(0, Math.min(SHELF_PRICES.length, Math.floor(finiteOr(raw.shelf?.slots, 0))))
      const cards = (Array.isArray(raw.shelf?.cards) ? raw.shelf.cards : [])
        .filter(ref => ref && (ref.kind === 'bouquets' || ref.kind === 'cards') && Number.isFinite(ref.id))
        .map(ref => ({ kind: ref.kind, id: Math.floor(ref.id) })).slice(0, slots)
      return { vases, shelf: { slots, cards } }
    }

    const ECONOMY_API = {
      VASE_PRICE, VASE_LIKES, VASE_MATCH_BONUS, SHELF_PRICES, cleanText, vaseOwned, buyVase, vaseMatch,
      shelfSlots, buyShelfSlot, shelfCards, shelfEffect, shelfBonus, toggleShelf, nameBouquet, sanitizeEconomy,
    }

    // ---------------------------------------------------------------------
    // §3w Real seasons, night blooms, seed expeditions, vases and keepsake cards.
    // ---------------------------------------------------------------------
    const SEASON_BONUS = 0.01
    const NIGHT_BONUS = 0.01
    const VASES = [
      { id: 'classic', need: 0 }, { id: 'round', need: 2 }, { id: 'tall', need: 5 },
      { id: 'basket', need: 10 }, { id: 'moon', need: 20 }, { id: 'gold', stars: 5 },
    ]
    const VASE_BY_ID = new Map(VASES.map(vase => [vase.id, vase]))
    const BOUQUET_CARD_CAP = 30
    const FLOWER_CARD_CAP = 60
    const HOUR_MS = 60 * 60 * 1000
    const EXPEDITIONS = [
      { id: 'short', ms: HOUR_MS, cost: 20, rolls: 1 },
      { id: 'day', ms: 4 * HOUR_MS, cost: 60, rolls: 3 },
      { id: 'long', ms: 8 * HOUR_MS, cost: 120, rolls: 6 },
    ]
    const EXPEDITION_BY_ID = new Map(EXPEDITIONS.map(entry => [entry.id, entry]))

    /** Season of the player's own calendar: 0 spring (Mar–May) … 3 winter. */
    function realSeason(now) {
      const month = new Date(now).getMonth()
      return month >= 2 && month <= 4 ? 0 : month >= 5 && month <= 7 ? 1 : month >= 8 && month <= 10 ? 2 : 3
    }

    function inSeason(speciesId, now) {
      return ECO_PROFILES[speciesId] !== undefined && ECO_PROFILES[speciesId].season === realSeason(now)
    }

    function nightBloom(speciesId, now) {
      return ECO_PROFILES[speciesId]?.role === 'night' && isNight(now)
    }

    /** Extra spirit chance: a flower in its own season, a night flower after dark. Never a penalty. */
    function seasonalBonus(speciesId, now) {
      return (inSeason(speciesId, now) ? SEASON_BONUS : 0) + (nightBloom(speciesId, now) ? NIGHT_BONUS : 0)
    }

    function vaseUnlocked(state, id) {
      const vase = VASE_BY_ID.get(id)
      if (vase === undefined) return false
      return vase.stars !== undefined ? (state.bouquetBest ?? 0) >= vase.stars : (state.arranged ?? 0) >= vase.need
    }

    function cleanBloom(item) {
      if (item === null || typeof item !== 'object' || !SPECIES_BY_ID.has(item.species)) return null
      const bloom = { species: item.species, variant: item.variant === 'alt' || item.variant === 'hidden' ? item.variant : 'base' }
      if (Number.isFinite(item.dna) && item.dna > 0) bloom.dna = Math.floor(item.dna)
      if (bloom.variant !== 'hidden' && TRAIT_BY_ID.has(item.trait)) bloom.trait = item.trait
      if (typeof item.tint === 'string' && SPECIES_BY_ID.has(item.tint) && item.tint !== item.species) bloom.tint = item.tint
      return bloom
    }

    /** Every finished bouquet leaves a card behind; the oldest cards make room. */
    function bouquetCardPatch(state, items, score, vase, now) {
      const id = (state.cardSeq ?? 0) + 1
      const card = { id, at: now, stars: score.stars, theme: score.theme, coins: score.coins, vase: vaseOwned(state, vase) ? vase : 'classic', match: score.match === true, ...(vaseTint(state, vase) ? { tint: vaseTint(state, vase) } : {}), items: items.map(cleanBloom).filter(Boolean) }
      return { cardSeq: id, bouquets: [...(state.bouquets ?? []), card].slice(-BOUQUET_CARD_CAP) }
    }

    /** Keep one basket bloom as a card instead of selling it. */
    function pressCard(state, basketIndex, now) {
      const item = state.basket[basketIndex]
      if (item === undefined || (state.cards ?? []).length >= FLOWER_CARD_CAP) return null
      const id = (state.cardSeq ?? 0) + 1
      return { ...state, cardSeq: id, basket: state.basket.filter((_, index) => index !== basketIndex), cards: [...(state.cards ?? []), { id, at: now, item: cleanBloom(item) }] }
    }

    function removeCard(state, kind, id) {
      if (kind !== 'bouquets' && kind !== 'cards') return null
      const list = state[kind] ?? []
      if (!list.some(card => card.id === id)) return null
      return { ...state, [kind]: list.filter(card => card.id !== id) }
    }

    function startExpedition(state, sceneId, kind, now) {
      const trip = EXPEDITION_BY_ID.get(kind)
      if (trip === undefined || state.expedition || !((state.scenes[sceneId]?.unlocked ?? 0) > 0) || state.coins < trip.cost) return null
      return { ...state, coins: state.coins - trip.cost, expedition: { scene: sceneId, kind, start: now, end: now + trip.ms, bonus: patronBonus(state) } }
    }

    /** What a party brings back; fixed when it sets out, so waiting cannot reroll it. */
    function expeditionLoot(expedition) {
      const trip = EXPEDITION_BY_ID.get(expedition.kind)
      const scene = SCENE_BY_ID.get(expedition.scene)
      const loot = { coins: 0, bag: {}, seeds: {}, ribbons: 0 }
      const salt = Math.floor(expedition.start / 1000)
      for (let roll = 0; roll < trip.rolls + (expedition.bonus ?? 0); roll += 1) {
        const u = hashUnit(salt, roll, 41)
        const v = hashUnit(salt, roll, 43)
        if (u < 0.4) loot.coins += 15 + Math.floor(v * 40)
        else if (u < 0.65) {
          const form = scene.species[Math.floor(v * scene.species.length)]
          const others = scene.species.filter(id => id !== form)
          const key = `${form}~${others[Math.floor(hashUnit(salt, roll, 47) * others.length)]}`
          loot.seeds[key] = (loot.seeds[key] ?? 0) + 1
        } else if (u < 0.8) loot.bag.fertilizer = (loot.bag.fertilizer ?? 0) + 1
        else if (u < 0.9) loot.bag.compost = (loot.bag.compost ?? 0) + 1
        else if (u < 0.97) loot.ribbons += 1
        else loot.bag.charm = (loot.bag.charm ?? 0) + 1
      }
      return loot
    }

    function claimExpedition(state, now) {
      const trip = state.expedition
      if (!trip || now < trip.end) return null
      const loot = expeditionLoot(trip)
      const seeds = { ...state.seeds }
      for (const [key, n] of Object.entries(loot.seeds)) seeds[key] = (seeds[key] ?? 0) + n
      return {
        ...applyReward(state, loot), seeds, expedition: null, trips: (state.trips ?? 0) + 1,
        ribbons: (state.ribbons ?? 0) + loot.ribbons, ribbonsEarned: (state.ribbonsEarned ?? 0) + loot.ribbons,
      }
    }

    function sanitizeAlbum(raw, now) {
      const stamp = value => (Number.isFinite(value) && value >= 0 ? Math.min(value, now) : now)
      const bouquets = (Array.isArray(raw.bouquets) ? raw.bouquets : []).filter(card => card && Number.isFinite(card.id) && Array.isArray(card.items)).map(card => ({
        id: Math.floor(card.id), at: stamp(card.at), stars: Math.max(1, Math.min(5, Math.floor(finiteOr(card.stars, 1)))),
        theme: BOUQUET_THEMES.includes(card.theme) ? card.theme : BOUQUET_THEMES[0], coins: Math.floor(finiteOr(card.coins, 0)),
        vase: VASE_BY_ID.has(card.vase) ? card.vase : 'classic', match: card.match === true, ...(cleanTint(card.tint) ? { tint: cleanTint(card.tint) } : {}), title: cleanText(card.title, 20), note: cleanText(card.note, 60), items: card.items.slice(0, BOUQUET_MAX).map(cleanBloom).filter(Boolean),
      })).filter(card => card.items.length > 0).slice(-BOUQUET_CARD_CAP)
      const cards = (Array.isArray(raw.cards) ? raw.cards : []).filter(card => card && Number.isFinite(card.id) && cleanBloom(card.item) !== null)
        .map(card => ({ id: Math.floor(card.id), at: stamp(card.at), item: cleanBloom(card.item) })).slice(-FLOWER_CARD_CAP)
      let expedition = null
      const trip = raw.expedition
      if (trip && typeof trip === 'object' && SCENE_BY_ID.has(trip.scene) && EXPEDITION_BY_ID.has(trip.kind) && Number.isFinite(trip.start) && trip.start >= 0) {
        const start = Math.min(trip.start, now)
        const full = start + EXPEDITION_BY_ID.get(trip.kind).ms
        expedition = { scene: trip.scene, kind: trip.kind, start, end: Number.isFinite(trip.end) && trip.end >= start ? Math.min(full, trip.end) : full, bonus: Math.max(0, Math.min(PATRON_MAX, Math.floor(finiteOr(trip.bonus, 0)))) }
      }
      const cardSeq = Math.max(Math.floor(finiteOr(raw.cardSeq, 0)), ...bouquets.map(card => card.id), ...cards.map(card => card.id), 0)
      return { bouquets, cards, cardSeq, expedition, trips: Math.floor(finiteOr(raw.trips, 0)) }
    }

    const ALBUM_API = {
      SEASON_BONUS, NIGHT_BONUS, VASES, BOUQUET_CARD_CAP, FLOWER_CARD_CAP, EXPEDITIONS,
      realSeason, inSeason, nightBloom, seasonalBonus, vaseUnlocked, pressCard, removeCard,
      startExpedition, expeditionLoot, claimExpedition, sanitizeAlbum,
    }

    // ---------------------------------------------------------------------
    // §3x Genes, lineage and breeding goals. A plant's genes are read from the
    //     same DNA hashes the drawing uses, so what the bars say is what you see.
    // ---------------------------------------------------------------------
    const GENES = [{ id: 'light', slot: 1 }, { id: 'warm', slot: 2 }, { id: 'height', slot: 5 }, { id: 'width', slot: 6 }]
    const BREED_CANDIDATES = 1500
    const PEDIGREE_CAP = 400
    const BREED_GOALS = [
      { id: 'tall', need: { height: [5, 5] }, reward: { coins: 80 } },
      { id: 'petite', need: { height: [1, 1], width: [1, 1] }, reward: { coins: 120 } },
      { id: 'lush', need: { height: [4, 5], width: [5, 5] }, reward: { coins: 150 } },
      { id: 'moon', need: { light: [5, 5], warm: [1, 2] }, reward: { coins: 150 } },
      { id: 'sunset', need: { light: [1, 2], warm: [5, 5] }, reward: { coins: 150 } },
      { id: 'dynasty', gen: 3, need: {}, reward: { coins: 200, bag: { fertilizer: 2 } } },
      { id: 'champion', need: { light: [4, 5], warm: [4, 5], height: [4, 5], width: [4, 5] }, reward: { coins: 400, bag: { charm: 1 } } },
    ]

    function geneValues(dna) {
      return GENES.map(gene => hashUnit(dna, gene.slot, 9))
    }

    function gradeOf(value) {
      return Math.min(5, Math.floor(value * 5) + 1)
    }

    /** Four visible genes, each graded 1–5. */
    function genesOf(dna) {
      const values = geneValues(dna)
      return Object.fromEntries(GENES.map((gene, index) => [gene.id, gradeOf(values[index])]))
    }

    /**
     * DNA for the child of two plants. Each gene aims somewhere between the
     * parents, plus a small mutation; the DNA whose genes land closest wins.
     */
    function breedDna(motherDna, fatherDna, salt) {
      const a = geneValues(motherDna), b = geneValues(fatherDna)
      const target = a.map((value, index) => {
        const blend = value + (b[index] - value) * hashUnit(motherDna, fatherDna, salt * 8 + index)
        const drift = (hashUnit(fatherDna, motherDna, salt * 8 + index + 4) - 0.5) * 0.16
        return Math.max(0, Math.min(0.999, blend + drift))
      })
      let best = 1
      let bestGap = Infinity
      for (let k = 0; k < BREED_CANDIDATES; k += 1) {
        const dna = 1 + Math.floor(hashUnit(motherDna ^ Math.imul(k + 1, 0x9e3779b1), fatherDna, salt + k) * 2147483646)
        const values = geneValues(dna)
        let gap = 0
        for (let index = 0; index < values.length; index += 1) gap += (values[index] - target[index]) ** 2
        if (gap < bestGap) { best = dna; bestGap = gap }
      }
      return best
    }

    /** The grades a cross is likely to give: between the two parents. */
    function predictGenes(motherDna, fatherDna) {
      const a = genesOf(motherDna), b = genesOf(fatherDna)
      return Object.fromEntries(GENES.map(gene => [gene.id, [Math.min(a[gene.id], b[gene.id]), Math.max(a[gene.id], b[gene.id])]]))
    }

    /** The open flower next door that a pollinated plant would cross with. */
    function partnerPlot(slot, index) {
      const own = slot?.plots?.[index]
      if (own === null || own === undefined) return null
      for (const at of [index - 1, index + 1]) {
        if (at < 0 || at >= slot.unlocked) continue
        const other = slot.plots[at]
        if (other === null || other === undefined || other.species === own.species) continue
        const species = SPECIES_BY_ID.get(other.species)
        if (species !== undefined && other.growthMs >= growMsOf(species)) return other
      }
      return null
    }

    function capPedigree(pedigree) {
      const keys = Object.keys(pedigree)
      if (keys.length <= PEDIGREE_CAP) return pedigree
      const keep = keys.sort((x, y) => (pedigree[y].at ?? 0) - (pedigree[x].at ?? 0)).slice(0, PEDIGREE_CAP)
      return Object.fromEntries(keep.map(key => [key, pedigree[key]]))
    }

    function kinEntry(state, plot) {
      const known = state.pedigree?.[plot.dna]
      if (known !== undefined) return known
      const entry = { s: plot.species, g: 0, at: state.planted ?? 0 }
      if (plot.tint !== undefined) entry.t = plot.tint
      return entry
    }

    /** A hybrid seed was set: remember which two plants made it. */
    function recordCross(state, seedKey, mother, father) {
      if (!(mother?.dna > 0) || !(father?.dna > 0)) return {}
      return {
        pedigree: capPedigree({ ...state.pedigree, [mother.dna]: kinEntry(state, mother), [father.dna]: kinEntry(state, father) }),
        lineage: { ...state.lineage, [seedKey]: [...(state.lineage?.[seedKey] ?? []), [mother.dna, father.dna]].slice(-20) },
      }
    }

    /** A recorded seed was sown: use up its record and enter the child in the family tree. */
    function plantCross(state, seedKey, cross, dna, speciesId, tintId) {
      if (!cross) return {}
      const lineage = { ...state.lineage }
      const rest = (lineage[seedKey] ?? []).slice(1)
      if (rest.length > 0) lineage[seedKey] = rest
      else delete lineage[seedKey]
      const g = 1 + Math.max(state.pedigree?.[cross[0]]?.g ?? 0, state.pedigree?.[cross[1]]?.g ?? 0)
      return { lineage, pedigree: capPedigree({ ...state.pedigree, [dna]: { s: speciesId, t: tintId, m: cross[0], f: cross[1], g, at: state.planted ?? 0 } }) }
    }

    function goalMet(state, goal, dna) {
      const entry = state.pedigree?.[dna]
      if (entry === undefined || !(entry.g >= 1) || entry.g < (goal.gen ?? 1)) return false
      const genes = genesOf(dna)
      return Object.entries(goal.need).every(([id, [lo, hi]]) => genes[id] >= lo && genes[id] <= hi)
    }

    /** Breeding goals a harvested bloom finishes, paid on the spot; {} when there are none. */
    function goalPatch(state, bloom) {
      if (!(bloom?.dna > 0)) return {}
      const won = BREED_GOALS.filter(goal => state.goalsDone?.[goal.id] !== true && goalMet(state, goal, bloom.dna))
      if (won.length === 0) return {}
      let paid = state
      for (const goal of won) paid = applyReward(paid, goal.reward)
      return { coins: paid.coins, bag: paid.bag, goalsDone: { ...state.goalsDone, ...Object.fromEntries(won.map(goal => [goal.id, true])) } }
    }

    function sanitizeKin(raw) {
      const whole = value => Number.isFinite(value) && value > 0
      const pedigree = {}
      if (raw.pedigree !== null && typeof raw.pedigree === 'object') {
        for (const [key, entry] of Object.entries(raw.pedigree)) {
          const dna = Number(key)
          if (!whole(dna) || entry === null || typeof entry !== 'object' || !SPECIES_BY_ID.has(entry.s)) continue
          const clean = { s: entry.s, g: Math.min(99, Math.floor(finiteOr(entry.g, 0))), at: Math.floor(finiteOr(entry.at, 0)) }
          if (SPECIES_BY_ID.has(entry.t) && entry.t !== entry.s) clean.t = entry.t
          if (whole(entry.m) && whole(entry.f)) { clean.m = Math.floor(entry.m); clean.f = Math.floor(entry.f) }
          pedigree[Math.floor(dna)] = clean
        }
      }
      const lineage = {}
      if (raw.lineage !== null && typeof raw.lineage === 'object') {
        for (const [key, list] of Object.entries(raw.lineage)) {
          const [form, tint] = key.split('~')
          if (!SPECIES_BY_ID.has(form) || !SPECIES_BY_ID.has(tint) || !Array.isArray(list)) continue
          const pairs = list.filter(pair => Array.isArray(pair) && whole(pair[0]) && whole(pair[1])).map(pair => [Math.floor(pair[0]), Math.floor(pair[1])]).slice(-20)
          if (pairs.length > 0) lineage[key] = pairs
        }
      }
      const goalsDone = {}
      for (const goal of BREED_GOALS) if (raw.goalsDone?.[goal.id] === true) goalsDone[goal.id] = true
      return { pedigree: capPedigree(pedigree), lineage, goalsDone }
    }

    const GENE_API = {
      GENES, BREED_GOALS, geneValues, gradeOf, genesOf, breedDna, predictGenes, partnerPlot,
      recordCross, plantCross, goalMet, goalPatch, sanitizeKin,
    }

    // ---------------------------------------------------------------------
    // §3a More to do with a flower than sell it: bouquets and visitor bonds.
    // ---------------------------------------------------------------------
    const BOUQUET_MIN = 3
    const BOUQUET_MAX = 7
    const BOUQUET_STAR_BONUS = 0.06
    const BOUQUET_THEMES = ['warm', 'rosy', 'cool', 'white']
    const AFFINITY_LEVELS = [5, 15, 30, 60]
    const AFFINITY_REWARDS = [{ coins: 30 }, { bag: { fertilizer: 2 } }, { coins: 120 }, { bag: { sprinkler: 1, charm: 1 } }]
    const AFFINITY_GREET = 1
    const EXTRA_FAVOURITES = { swallowtail: ['zinnia', 'cosmos', 'lavender'], hoverfly: ['daisy', 'calendula', 'dandelion'] }

    /** Colour family and hue of one bloom's petals; pale petals count as white and go with anything. */
    function bloomTone(item) {
      const species = SPECIES_BY_ID.get(item.species)
      const hex = species === undefined ? '' : String(paletteOf(species, item.variant ?? 'base', item.tint).petal ?? '')
      const match = /^#([0-9a-f]{6})$/iu.exec(hex)
      if (match === null) return { family: 'white', hue: null }
      const n = parseInt(match[1], 16)
      const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255
      const max = Math.max(r, g, b), d = max - Math.min(r, g, b)
      if (max === 0 || d / max < 0.18) return { family: 'white', hue: null }
      const raw = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
      const hue = (raw * 60 + 360) % 360
      return { family: hue >= 300 || hue < 15 ? 'rosy' : hue < 150 ? 'warm' : 'cool', hue }
    }

    /** Neighbouring hues, or two groups facing each other across the colour wheel. */
    function huesHarmonise(hues) {
      if (hues.length <= 1) return true
      const sorted = [...hues].sort((a, b) => a - b)
      let gap = 360 - sorted[sorted.length - 1] + sorted[0]
      for (let i = 1; i < sorted.length; i += 1) gap = Math.max(gap, sorted[i] - sorted[i - 1])
      if (360 - gap <= 70) return true
      const apart = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d }
      return hues.some(anchor => hues.every(hue => apart(hue, anchor) <= 40 || apart(hue, anchor + 180) <= 40)
        && hues.some(hue => apart(hue, anchor + 180) <= 40))
    }

    function bouquetTheme(now) {
      return BOUQUET_THEMES[Math.floor(hashUnit(localDay(now), 5, 233) * BOUQUET_THEMES.length)]
    }

    /** One to five stars for three to seven blooms; a bouquet pays more than the same flowers sold loose. */
    function arrangeScore(items, now, vase, dried = false) {
      if (!Array.isArray(items) || items.length < BOUQUET_MIN || items.length > BOUQUET_MAX) return null
      const tones = items.map(bloomTone)
      const values = items.map(itemValue).sort((a, b) => b - a)
      const special = items.filter(item => !isPlainBloom(item)).length
      const theme = bouquetTheme(now)
      const checks = {
        harmony: huesHarmonise(tones.filter(tone => tone.hue !== null).map(tone => tone.hue)),
        variety: new Set(items.map(item => item.species)).size >= 3,
        focal: special === 1 || (special === 0 && values[0] >= values[1] * 1.4),
        theme: tones.filter(tone => tone.family === theme).length * 2 >= items.length,
      }
      const stars = Math.min(5, 1 + Object.values(checks).filter(Boolean).length + (dried ? 1 : 0))
      const match = vaseMatch(vase, items)
      const value = values.reduce((sum, n) => sum + n, 0)
      return { stars, checks, theme, value: Math.round(value), match, coins: Math.round(value * (1 + BOUQUET_STAR_BONUS * stars + (match ? VASE_MATCH_BONUS : 0))), xp: stars * 2 }
    }

    function arrangeBouquet(state, indices, now, vase = 'classic', useDried = false) {
      if (!Array.isArray(indices) || new Set(indices).size !== indices.length) return null
      if (indices.some(index => !Number.isInteger(index) || index < 0 || index >= state.basket.length)) return null
      const items = indices.map(index => state.basket[index])
      const pot = vaseOwned(state, vase) ? vase : 'classic'
      const dried = useDried === true && goodsCount(state, 'dried') > 0
      const score = arrangeScore(items, now, pot, dried)
      if (score === null) return null
      const used = new Set(indices)
      return {
        ...state,
        coins: state.coins + score.coins,
        xp: state.xp + score.xp,
        basket: state.basket.filter((_, index) => !used.has(index)),
        arranged: (state.arranged ?? 0) + 1,
        bouquetBest: Math.max(state.bouquetBest ?? 0, score.stars),
        ...bouquetCardPatch(state, items, score, pot, now),
        ...briefPatch(state, items, score, now),
        ...(dried ? { goods: { ...state.goods, dried: goodsCount(state, 'dried') - 1 }, goodsUsed: (state.goodsUsed ?? 0) + 1 } : {}),
      }
    }

    function visitorFavourites(visitorId) {
      const listed = SPECIES.filter(species => ECO_PROFILES[species.id]?.visitor === visitorId).map(species => species.id)
      return listed.length > 0 ? listed : (EXTRA_FAVOURITES[visitorId] ?? [])
    }

    function affinityLevel(state, visitorId) {
      const points = state.affinity?.[visitorId] ?? 0
      return AFFINITY_LEVELS.filter(need => points >= need).length
    }

    /** Add bond points; every level crossed pays its reward straight away. */
    function addAffinity(state, visitorId, points) {
      const before = affinityLevel(state, visitorId)
      let next = { ...state, affinity: { ...state.affinity, [visitorId]: (state.affinity?.[visitorId] ?? 0) + points } }
      const after = affinityLevel(next, visitorId)
      for (let level = before; level < after; level += 1) next = applyReward(next, AFFINITY_REWARDS[level])
      return next
    }

    function giftPoints(visitorId, item) {
      return 2 + (visitorFavourites(visitorId).includes(item.species) ? 4 : 0) + (isPlainBloom(item) ? 0 : 3)
    }

    /** Give one basket bloom to a visitor the player has already met. */
    function giftVisitor(state, visitorId, basketIndex) {
      if (!VISITOR_BY_ID.has(visitorId) || !((state.visitors?.[visitorId] ?? 0) > 0)) return null
      const item = state.basket[basketIndex]
      if (item === undefined) return null
      const basket = state.basket.filter((_, index) => index !== basketIndex)
      return addAffinity({ ...state, basket }, visitorId, giftPoints(visitorId, item))
    }

    function sanitizeCraft(raw) {
      const affinity = {}
      if (raw.affinity !== null && typeof raw.affinity === 'object') {
        for (const visitor of VISITORS) {
          const points = Math.floor(finiteOr(raw.affinity[visitor.id], 0))
          if (points > 0) affinity[visitor.id] = points
        }
      }
      return { affinity, arranged: Math.floor(finiteOr(raw.arranged, 0)), bouquetBest: Math.min(5, Math.floor(finiteOr(raw.bouquetBest, 0))) }
    }

    const CRAFT_API = {
      BOUQUET_MIN, BOUQUET_MAX, BOUQUET_STAR_BONUS, BOUQUET_THEMES, AFFINITY_LEVELS, AFFINITY_REWARDS, AFFINITY_GREET,
      bloomTone, huesHarmonise, bouquetTheme, arrangeScore, arrangeBouquet,
      visitorFavourites, affinityLevel, addAffinity, giftPoints, giftVisitor, sanitizeCraft,
    }

    // ---------------------------------------------------------------------
    // §3b Daily play: check-in streak, daily wishes, surprise gifts and the
    //     report shown after time away. Pure transitions, like the rest of §3.
    // ---------------------------------------------------------------------
    const DAILY_REWARDS = [
      { coins: 20 }, { bag: { fertilizer: 1 } }, { coins: 40 }, { bag: { compost: 2 } },
      { coins: 60 }, { bag: { sprinkler: 1 } }, { coins: 100, bag: { charm: 1 } },
    ]
    const QUEST_POOL = [
      { id: 'harvested', target: 6, coins: 30 },
      { id: 'planted', target: 5, coins: 20 },
      { id: 'greeted', target: 3, coins: 35 },
      { id: 'delivered', target: 1, coins: 40 },
      { id: 'pollinated', target: 2, coins: 35 },
    ]
    const QUEST_SLOTS = 3
    const QUEST_BONUS = { bag: { fertilizer: 2 } }
    const GIFT_MS = 20 * 60 * 1000
    const GIFT_CHANCE = 0.65
    const AWAY_MIN_MS = 5 * 60 * 1000
    const RARITY_RANK = { base: 0, alt: 1, hybrid: 2, curio: 3, spirit: 4 }

    /** How special one bloom is; drives slot borders and backpack order. */
    function rarityOf(item) {
      if (item.variant === 'hidden') return 'spirit'
      if (item.trait) return 'curio'
      if (item.tint) return 'hybrid'
      return item.variant === 'alt' ? 'alt' : 'base'
    }

    function applyReward(state, reward) {
      const bag = { ...state.bag }
      for (const [id, n] of Object.entries(reward.bag ?? {})) bag[id] = (bag[id] ?? 0) + n
      return { ...state, coins: state.coins + (reward.coins ?? 0), bag }
    }

    /** Check-in: one reward per local day, seven-day cycle, a missed day restarts the streak. */
    function dailyStatus(state, now) {
      const day = localDay(now)
      const last = state.daily?.claimedDay ?? -1
      const streak = state.daily?.streak ?? 0
      const available = last < day
      const nextStreak = last === day - 1 ? streak + 1 : 1
      const shown = available ? nextStreak : Math.max(1, streak)
      const index = (shown - 1) % DAILY_REWARDS.length
      return { day, available, streak: available ? (last === day - 1 ? streak : 0) : streak, nextStreak, index, reward: DAILY_REWARDS[index] }
    }

    function claimDaily(state, now) {
      const status = dailyStatus(state, now)
      if (!status.available) return null
      return { ...applyReward(state, status.reward), daily: { claimedDay: status.day, streak: status.nextStreak } }
    }

    function questMetric(state, id) {
      if (id === 'greeted') return Object.values(state.visitors ?? {}).reduce((sum, n) => sum + n, 0)
      return state[id] ?? 0
    }

    /** Today's baseline counters; the same object comes back until the local day turns. */
    function questState(state, now) {
      const day = localDay(now)
      if (state.quests && state.quests.day === day) return state.quests
      return { day, base: Object.fromEntries(QUEST_POOL.map(entry => [entry.id, questMetric(state, entry.id)])), claimed: [], bonus: false }
    }

    function dailyQuests(state, now) {
      const quests = questState(state, now)
      return QUEST_POOL
        .map((entry, index) => ({ entry, rank: hashUnit(quests.day, index, 311) }))
        .sort((a, b) => b.rank - a.rank).slice(0, QUEST_SLOTS)
        .map(({ entry }) => {
          const progress = Math.min(entry.target, Math.max(0, questMetric(state, entry.id) - (quests.base[entry.id] ?? 0)))
          return { ...entry, progress, done: progress >= entry.target, claimed: quests.claimed.includes(entry.id) }
        })
    }

    function claimQuest(state, id, now) {
      const list = dailyQuests(state, now)
      const quest = list.find(entry => entry.id === id)
      if (quest === undefined || !quest.done || quest.claimed) return null
      const quests = questState(state, now)
      const claimed = [...quests.claimed, id]
      let next = applyReward(state, { coins: quest.coins })
      const cleared = list.every(entry => claimed.includes(entry.id))
      if (cleared && !quests.bonus) next = applyReward(next, QUEST_BONUS)
      return { ...next, quests: { ...quests, claimed, bonus: quests.bonus || cleared } }
    }

    /** A surprise box that shows up in some twenty-minute windows; the same for everyone, like the weather. */
    function giftAt(state, now) {
      const bucket = Math.floor(now / GIFT_MS)
      if ((state.giftBucket ?? -1) >= bucket) return null
      if (hashUnit(bucket, 20261118, 91) >= GIFT_CHANCE) return null
      const roll = hashUnit(bucket, 20261118, 17)
      const reward = roll < 0.5 ? { coins: 8 + Math.floor(roll * 50) }
        : roll < 0.75 ? { bag: { fertilizer: 1 } }
          : roll < 0.92 ? { bag: { compost: 1 } } : { bag: { sprinkler: 1 } }
      return { bucket, reward, until: (bucket + 1) * GIFT_MS }
    }

    function openGift(state, now) {
      const gift = giftAt(state, now)
      if (gift === null) return null
      return { ...applyReward(state, gift.reward), giftBucket: gift.bucket }
    }

    /** What changed while nobody was looking, or null after a short absence. */
    function awaySummary(before, after, now) {
      const awayMs = now - (before.lastTick ?? now)
      if (!(awayMs >= AWAY_MIN_MS)) return null
      let bloomed = 0
      let thirsty = 0
      for (const scene of SCENES) {
        const plots = after.scenes?.[scene.id]?.plots ?? []
        const old = before.scenes?.[scene.id]?.plots ?? []
        plots.forEach((plot, index) => {
          if (plot === null || plot === undefined) return
          const open = stageOf(plot) === 'bloom'
          if (open && old[index] && stageOf(old[index]) !== 'bloom') bloomed += 1
          if (!open && plot.moisture <= 0.5) thirsty += 1
        })
      }
      return { awayMs, bloomed, thirsty }
    }

    function sanitizePlay(raw, now) {
      const today = localDay(now)
      const daily = raw.daily !== null && typeof raw.daily === 'object' ? raw.daily : {}
      const claimedDay = Number.isFinite(daily.claimedDay) ? Math.max(-1, Math.min(today, Math.floor(daily.claimedDay))) : -1
      const known = new Set(QUEST_POOL.map(entry => entry.id))
      const q = raw.quests
      const quests = q !== null && typeof q === 'object' && Number.isFinite(q.day) ? {
        day: Math.floor(q.day),
        base: Object.fromEntries(QUEST_POOL.map(entry => [entry.id, Math.floor(finiteOr(q.base?.[entry.id], 0))])),
        claimed: Array.isArray(q.claimed) ? [...new Set(q.claimed.filter(id => known.has(id)))] : [],
        bonus: q.bonus === true,
      } : null
      return {
        daily: { claimedDay, streak: claimedDay < 0 ? 0 : Math.floor(finiteOr(daily.streak, 0)) },
        quests,
        giftBucket: Number.isFinite(raw.giftBucket) ? Math.floor(raw.giftBucket) : -1,
      }
    }

    const PLAY_API = {
      DAILY_REWARDS, QUEST_POOL, QUEST_SLOTS, QUEST_BONUS, GIFT_MS, AWAY_MIN_MS, RARITY_RANK,
      rarityOf, applyReward, dailyStatus, claimDaily, questMetric, questState, dailyQuests, claimQuest,
      giftAt, openGift, awaySummary, sanitizePlay, localDay,
    }
    // ---------------------------------------------------------------------
    // §4 Store: one module-level garden shared by every mount, persisted at
    //    most once every few seconds plus immediately after a user action.
    // ---------------------------------------------------------------------
    let garden = null
    const listeners = new Set()
    let saveTimer = null
    let lastSaveAt = 0

    /** Keeps the original text of a save this build cannot use, so starting fresh never destroys it. */
    function keepBackup(reason, text) {
      try {
        window.localStorage.setItem(`${STORAGE_KEY}.backup-${reason}`, text)
      } catch (error) {
        console.warn('[flower-garden] could not back up the unusable save', error)
      }
    }

    function readStored() {
      for (const key of [STORAGE_KEY, ...LEGACY_KEYS]) {
        let text = null
        try {
          text = window.localStorage.getItem(key)
        } catch (error) {
          console.warn('[flower-garden] storage is unavailable; starting fresh', error)
          return null
        }
        if (text === null) continue
        let parsed
        try {
          parsed = JSON.parse(text)
        } catch (error) {
          console.warn('[flower-garden] saved garden is unreadable; kept a backup and starting fresh', error)
          keepBackup('corrupt', text)
          return null
        }
        // A save from a newer build would be reset by sanitize; keep its text first.
        if (parsed !== null && typeof parsed === 'object' && typeof parsed.v === 'number' && parsed.v > STATE_VERSION) {
          console.warn('[flower-garden] saved garden comes from a newer version; kept a backup and starting fresh')
          keepBackup('newer', text)
          return null
        }
        return parsed
      }
      return null
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

    /** What grew while the page was closed; shown once, then dismissed. */
    let awayReport = null
    function getAway() { return awayReport }
    function clearAway() { awayReport = null }

    function initStore() {
      if (garden !== null) return garden
      const stored = sanitize(readStored(), Date.now())
      garden = advanceState(stored, Date.now())
      awayReport = awaySummary(stored, garden, Date.now())
      persist() // Initial bloom identifications must survive an immediate reload.
      return garden
    }

    function getState() {
      return garden === null ? initStore() : garden
    }

    function commit(next, immediate) {
      if (next === null || next === garden) return
      const previous = garden
      garden = revealGarden(next, Date.now())
      const revealed = SCENES.some(scene => (garden.scenes[scene.id]?.plots??[]).some((plot,index)=>{
        if(!plot?.identified)return false
        const old=previous?.scenes?.[scene.id]?.plots?.[index]
        return !old?.identified || old.variant!==plot.variant || old.trait!==plot.trait || (old.traitChecks??[]).join()!==(plot.traitChecks??[]).join()
      }))
      for (const listener of listeners) listener()
      if (immediate || revealed) persist()
      else schedulePersist()
    }

    /** Another window saved: take its garden, keep this window's own tab and ground. */
    function adoptStored(text) {
      if (typeof text !== 'string' || garden === null) return
      let parsed
      try {
        parsed = JSON.parse(text)
      } catch (error) {
        return
      }
      if (parsed === null || typeof parsed !== 'object' || parsed.v !== STATE_VERSION) return
      const now = Date.now()
      garden = { ...advanceState(sanitize(parsed, now), now), ui: garden.ui, scene: garden.scene }
      for (const listener of listeners) listener()
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
    // §5 Artwork. Every plant is modelled on the real one: its habit (clump,
    //    twig, pad, rosette, floating leaf), its foliage and its flower, with
    //    base-to-tip shading and veins on the petals. `PLANTS[species.head]`
    //    draws the bud and bloom stages; the ground follows the species' scene.
    // ---------------------------------------------------------------------
    const SVG_PROPS = { viewBox: '0 0 100 100', 'aria-hidden': 'true', focusable: 'false' }
    const HEAD_X = 50
    const HEAD_Y = 36
    const GROUND_Y = 87
    const UP = { x1: '0.5', y1: '1', x2: '0.5', y2: '0' }

    function n(value) {
      return Math.round(value * 100) / 100
    }

    function mix(a, b, t) {
      const x = parseInt(a.slice(1), 16)
      const y = parseInt(b.slice(1), 16)
      let out = '#'
      for (const shift of [16, 8, 0]) {
        const from = (x >> shift) & 255
        const to = (y >> shift) & 255
        out += Math.round(from + (to - from) * t).toString(16).padStart(2, '0')
      }
      return out
    }

    function lighten(color, t) {
      return mix(color, '#ffffff', t)
    }

    function darken(color, t) {
      return mix(color, '#1d1620', t)
    }

    /** Deterministic jitter in [-0.5, 0.5): petals and leaves are never perfectly regular. */
    let artSalt = 0
    function jit(i, salt) {
      const v = Math.sin(i * 12.9898 + (salt + artSalt) * 78.233) * 43758.5453
      return v - Math.floor(v) - 0.5
    }

    /** Point at distance `r` from (x, y); 0° points up and angles run clockwise. */
    function polar(x, y, r, deg) {
      const a = (deg * Math.PI) / 180
      return [n(x + r * Math.sin(a)), n(y - r * Math.cos(a))]
    }

    /**
     * Paints for one drawing. Gradients are created on demand and collected in
     * `defs`; ids are unique per species and variant, so identical copies on
     * other cards are harmless.
     */
    /** No two plants share a shade: each individual's genes nudge its colours. */
    function individualPal(pal, dna) {
      const a = hashUnit(dna, 1, 9) - 0.5
      const b = hashUnit(dna, 2, 9) - 0.5
      const c = hashUnit(dna, 3, 9) - 0.5
      const shade = color => mix(a >= 0 ? lighten(color, a * 0.34) : darken(color, -a * 0.24), b >= 0 ? '#ffc48a' : '#a9b8ff', Math.abs(b) * 0.18)
      const green = color => (c >= 0 ? lighten(color, c * 0.22) : darken(color, -c * 0.22))
      return { ...pal, petal: shade(pal.petal), petalDeep: shade(pal.petalDeep), leaf: green(pal.leaf), stem: green(pal.stem) }
    }

    function makeInk(species, variant, look) {
      const hidden = variant === 'hidden'
      const dna = look?.dna ?? 0
      const trait = hidden ? undefined : TRAIT_BY_ID.get(look?.trait)
      const repaint = trait !== undefined && trait.stops !== undefined
      let pal = paletteOf(species, variant, look?.tint)
      if (repaint) pal = { ...pal, ...trait.pal }
      if (!hidden && dna !== 0) pal = individualPal(pal, dna)
      const prefix = (hidden ? `fg-hid-${species.id}` : `fg-${species.id}-${variant}`)
        + (look?.tint !== undefined ? `-x${look.tint}` : '')
        + (trait !== undefined ? `-${trait.id}` : '')
        + (dna !== 0 ? `-${dna.toString(36)}` : '')
        + (look?.paintId ? `-${look.paintId}` : '')
      const defs = []
      const made = new Map()
      const add = (tag, name, props, stops) => {
        if (!made.has(name)) {
          defs.push(h(tag, { key: name, id: `${prefix}-${name}`, ...props },
            ...stops.map(([offset, color, alpha], index) => h('stop', {
              key: index, offset: `${offset}%`, stopColor: color, stopOpacity: alpha,
            }))))
          made.set(name, `url(#${prefix}-${name}) ${stops[Math.floor(stops.length / 2)]?.[1] ?? pal.petal}`)
        }
        return made.get(name)
      }
      const ink = {
        pal, hidden, variant, defs,
        lin: (name, stops, dir) => add('linearGradient', name, dir ?? UP, stops),
        rad: (name, stops, props) => add('radialGradient', name, props ?? {}, stops),
        /** A species-specific petal gradient; the spirit bloom keeps its pearl paint. */
        tone: (name, stops) => (hidden || repaint ? ink.petal : ink.lin(name, stops)),
        line: hidden ? '#d8c08e' : darken(pal.petalDeep, 0.2),
        leafLine: darken(pal.leaf, 0.34),
        rib: lighten(pal.leaf, 0.38),
      }
      const lazy = (name, build) => Object.defineProperty(ink, name, { get: build })
      lazy('petal', () => ink.lin('petal', hidden
        ? [[0, HIDDEN_GOLD.tip], [55, HIDDEN_PAL.petal], [100, HIDDEN_GOLD.light]]
        : repaint
          ? trait.stops
          : [[0, pal.petalDeep], [52, pal.petal], [100, lighten(pal.petal, 0.3)]]))
      lazy('back', () => ink.lin('back', hidden
        ? [[0, '#e6c5e0'], [60, HIDDEN_PAL.petalDeep], [100, HIDDEN_PAL.petal]]
        : [[0, darken(pal.petalDeep, 0.14)], [58, mix(pal.petal, pal.petalDeep, 0.6)], [100, pal.petal]]))
      lazy('core', () => ink.rad('core',
        [[0, lighten(pal.center, 0.4)], [55, pal.center], [100, pal.centerDeep]], { cx: '40%', cy: '34%', r: '72%' }))
      // Variegated plants carry cream margins on every leaf.
      const across = { x1: '0', y1: '0.5', x2: '1', y2: '0.5' }
      const margin = (edge, heart) => [[0, edge], [20, edge], [34, heart], [66, heart], [80, edge], [100, edge]]
      const striped = !hidden && traitParts(look?.trait).includes('variegated')
      lazy('leaf', () => (striped
        ? ink.lin('leaf', margin('#f6efc8', pal.leaf), across)
        : ink.lin('leaf', [[0, darken(pal.leaf, 0.22)], [100, lighten(pal.leaf, 0.14)]])))
      lazy('leafBack', () => (striped
        ? ink.lin('leafBack', margin('#e6dcae', darken(pal.leaf, 0.16)), across)
        : ink.lin('leafBack', [[0, darken(pal.leaf, 0.36)], [100, darken(pal.leaf, 0.08)]])))
      return ink
    }

    /** Petal outline: base at the origin, tip straight up; `belly` is where it is widest. */
    function petalD(len, w, tip, belly) {
      const hw = w / 2
      const L = -len
      const B = -len * (belly ?? 0.58)
      const m = B + (L - B) * 0.62
      const rise = `M0,0C${n(-hw * 0.6)},${n(L * 0.06)} ${n(-hw)},${n(B * 0.5)} ${n(-hw)},${n(B)}`
      const fall = `C${n(hw)},${n(B * 0.5)} ${n(hw * 0.6)},${n(L * 0.06)} 0,0Z`
      if (tip === 'point') {
        return `${rise}C${n(-hw)},${n(m)} ${n(-hw * 0.28)},${n(L * 0.94)} 0,${n(L)}`
          + `C${n(hw * 0.28)},${n(L * 0.94)} ${n(hw)},${n(m)} ${n(hw)},${n(B)}${fall}`
      }
      if (tip === 'notch') {
        return `${rise}C${n(-hw)},${n(m)} ${n(-hw * 0.8)},${n(L)} ${n(-hw * 0.36)},${n(L)}`
          + `Q${n(-hw * 0.08)},${n(L)} 0,${n(L * 0.9)}Q${n(hw * 0.08)},${n(L)} ${n(hw * 0.36)},${n(L)}`
          + `C${n(hw * 0.8)},${n(L)} ${n(hw)},${n(m)} ${n(hw)},${n(B)}${fall}`
      }
      return `${rise}C${n(-hw)},${n(m)} ${n(-hw * 0.62)},${n(L)} 0,${n(L)}`
        + `C${n(hw * 0.62)},${n(L)} ${n(hw)},${n(m)} ${n(hw)},${n(B)}${fall}`
    }

    function place(o) {
      return `translate(${n(o.x ?? HEAD_X)} ${n(o.y ?? HEAD_Y)}) rotate(${n(o.rot ?? 0)})`
    }

    /** One petal with an optional midrib and a soft sheen. */
    function petal(key, o) {
      const kids = [h('path', {
        key: 'p', d: o.d ?? petalD(o.len, o.w, o.tip, o.belly),
        fill: o.fill, stroke: o.stroke, strokeWidth: o.sw ?? 0.4, strokeLinejoin: 'round',
      })]
      if (o.vein !== undefined) {
        kids.push(h('path', {
          key: 'v', d: `M0,${n(-o.len * 0.14)}L0,${n(-o.len * 0.8)}`,
          fill: 'none', stroke: o.vein, strokeWidth: 0.32, strokeLinecap: 'round', opacity: o.veinOpacity ?? 0.45,
        }))
      }
      if (o.sheen === true) {
        kids.push(h('path', {
          key: 's', d: `M${n(-o.w * 0.2)},${n(-o.len * 0.3)}Q${n(-o.w * 0.3)},${n(-o.len * 0.6)} ${n(-o.w * 0.12)},${n(-o.len * 0.84)}`,
          fill: 'none', stroke: '#ffffff', strokeWidth: n(o.w * 0.09), strokeLinecap: 'round', opacity: 0.32,
        }))
      }
      return h('g', { key, opacity: o.opacity, transform: place(o) }, ...kids)
    }

    /** Many round dots as one path. */
    function dots(key, points, r, color, opacity) {
      return h('path', {
        key, d: points.map(([x, y]) => `M${n(x)},${n(y)}h.01`).join(''),
        fill: 'none', stroke: color, strokeWidth: n(r * 2), strokeLinecap: 'round', opacity,
      })
    }

    /** Many straight hairs (stamens, veins, spines) as one path. */
    function strokes(key, segments, w, color, opacity) {
      return h('path', {
        key, d: segments.map(([x1, y1, x2, y2]) => `M${n(x1)},${n(y1)}L${n(x2)},${n(y2)}`).join(''),
        fill: 'none', stroke: color, strokeWidth: w, strokeLinecap: 'round', opacity,
      })
    }

    const LEAF_SHAPES = {
      serrate: (t, i) => (i % 2 === 0 ? 1 : 0.86),
      runcinate: (t, i) => (i % 3 === 0 ? 0.3 : i % 3 === 1 ? 1 : 0.62),
      pinnate: (t, i) => (i % 4 === 0 ? 0.26 : i % 4 === 2 ? 1 : 0.7),
    }

    /** Leaf outline from a half-width profile: one routine gives toothed and lobed blades. */
    function profileD(len, w, steps, shape, pow) {
      const left = []
      const right = []
      for (let i = 1; i < steps; i += 1) {
        const t = i / steps
        const half = (w / 2) * Math.sin(Math.PI * Math.pow(t, pow ?? 0.72)) * shape(t, i)
        left.push(`${n(-half)},${n(-len * t)}`)
        right.unshift(`${n(half)},${n(-len * t)}`)
      }
      return `M0,0L${left.join(' ')} 0,${n(-len)} ${right.join(' ')}Z`
    }

    /** A leaf growing from (x, y) toward `rot`, with a midrib and side veins. */
    function leaf(ink, key, o) {
      const { len, w } = o
      const d = o.d ?? (o.shape !== undefined
        ? profileD(len, w, o.steps ?? 16, LEAF_SHAPES[o.shape], o.pow)
        : petalD(len, w, o.tip ?? 'point', o.belly ?? 0.42))
      const rib = o.rib ?? ink.rib
      const kids = [
        h('path', { key: 'b', d, fill: o.fill ?? ink.leaf, stroke: o.stroke ?? ink.leafLine, strokeWidth: 0.38, strokeLinejoin: 'round' }),
        h('path', { key: 'm', d: `M0,0L0,${n(-len * 0.9)}`, fill: 'none', stroke: rib, strokeWidth: 0.4, strokeLinecap: 'round', opacity: 0.8 }),
      ]
      const veins = o.veins ?? 3
      if (veins > 0) {
        let vd = ''
        for (let k = 1; k <= veins; k += 1) {
          const t = k / (veins + 1.3)
          const reach = (w / 2) * 0.7 * Math.sin(Math.PI * Math.pow(Math.min(1, t + 0.12), 0.72))
          vd += `M0,${n(-len * t)}L${n(-reach)},${n(-len * (t + 0.13))}M0,${n(-len * t)}L${n(reach)},${n(-len * (t + 0.13))}`
        }
        kids.push(h('path', { key: 'v', d: vd, fill: 'none', stroke: rib, strokeWidth: 0.25, opacity: 0.6 }))
      }
      if (o.sheen === true) {
        kids.push(h('path', {
          key: 's', d: `M${n(-w * 0.2)},${n(-len * 0.25)}Q${n(-w * 0.32)},${n(-len * 0.55)} ${n(-w * 0.1)},${n(-len * 0.8)}`,
          fill: 'none', stroke: '#ffffff', strokeWidth: n(w * 0.1), strokeLinecap: 'round', opacity: 0.3,
        }))
      }
      return h('g', { key, transform: place(o) }, ...kids)
    }

    /** A strap or sword leaf whose tip leans `curve` units sideways. */
    function blade(ink, key, o) {
      const { len, w } = o
      const curve = o.curve ?? 0
      const kids = [
        h('path', {
          key: 'b',
          d: `M${n(-w * 0.3)},0C${n(-w / 2)},${n(-len * 0.35)} ${n(curve * 0.35 - w / 2)},${n(-len * 0.72)} ${n(curve)},${n(-len)}`
            + `C${n(curve * 0.5 + w / 2)},${n(-len * 0.68)} ${n(w / 2)},${n(-len * 0.3)} ${n(w * 0.3)},0Z`,
          fill: o.fill ?? ink.leaf, stroke: o.stroke ?? ink.leafLine, strokeWidth: o.sw ?? 0.38, strokeLinejoin: 'round',
        }),
      ]
      if (o.plain !== true) {
        kids.push(h('path', {
          key: 'm', d: `M0,0Q${n(curve * 0.1)},${n(-len * 0.6)} ${n(curve * 0.9)},${n(-len * 0.93)}`,
          fill: 'none', stroke: o.rib ?? ink.rib, strokeWidth: 0.35, strokeLinecap: 'round', opacity: 0.7,
        }))
      }
      if (o.spine !== undefined) {
        kids.push(h('path', {
          key: 'sp', d: `M${n(curve)},${n(-len)}l${n(curve * 0.04)},-1.7`,
          fill: 'none', stroke: o.spine, strokeWidth: 0.55, strokeLinecap: 'round',
        }))
      }
      return h('g', { key, transform: place(o) }, ...kids)
    }

    /** A rounded stalk: dark body plus a lit edge. */
    function stemPath(key, d, color, w) {
      return h('g', { key },
        h('path', { d, fill: 'none', stroke: darken(color, 0.2), strokeWidth: w, strokeLinecap: 'round' }),
        h('path', {
          d, fill: 'none', stroke: lighten(color, 0.16), strokeWidth: n(w * 0.42), strokeLinecap: 'round',
          transform: `translate(${n(-w * 0.14)} 0)`,
        }),
      )
    }

    function stem(ink, topY, o) {
      const w = o?.w ?? 2.4
      const bend = o?.bend ?? 2
      const x = o?.x ?? HEAD_X
      const bx = o?.bx ?? 50
      const by = o?.by ?? GROUND_Y
      const span = by - topY
      return stemPath(o?.key ?? 'stem',
        `M${bx},${by}C${n(bx + bend)},${n(by - span * 0.35)} ${n(x - bend)},${n(topY + span * 0.3)} ${x},${n(topY)}`,
        o?.color ?? ink.pal.stem, w)
    }

    /** A closed bud held by two sepals, growing from (x, y). */
    function bud(ink, key, x, y, o) {
      const len = o?.len ?? 12
      const w = o?.w ?? 7
      const sepal = petalD(len * 0.64, w * 0.66, 'point', 0.4)
      return h('g', { key, transform: place({ x, y, rot: o?.rot ?? 0 }) },
        h('path', { d: petalD(len, w, 'point', 0.45), fill: o?.fill ?? ink.petal, stroke: ink.line, strokeWidth: 0.4 }),
        h('path', { d: `M0,${n(-len * 0.3)}L0,${n(-len * 0.88)}`, fill: 'none', stroke: ink.line, strokeWidth: 0.3, opacity: 0.5 }),
        h('path', { d: sepal, fill: ink.leaf, stroke: ink.leafLine, strokeWidth: 0.33, transform: `translate(${n(-w * 0.16)} 0) rotate(-20)` }),
        h('path', { d: sepal, fill: ink.leaf, stroke: ink.leafLine, strokeWidth: 0.33, transform: `translate(${n(w * 0.16)} 0) rotate(20)` }),
      )
    }

    const LAKE = '#9ccfd2'

    /** What the plant stands in: meadow soil, a snow drift, cooled lava, or lake water. */
    function ground(sceneId) {
      if(MORE_GROUND[sceneId])return MORE_GROUND[sceneId]()
      if(sceneId==='desert')return h('g',{key:'ground'},h('ellipse',{cx:50,cy:90,rx:26,ry:6,fill:'#c4a16e'}),h('path',{d:'M27 89Q45 84 73 88M31 92Q54 88 70 91',fill:'none',stroke:'#ead4a5',strokeWidth:1}),h('path',{d:'M35 87l3 -2 3 2M63 89l3 -2 2 2',fill:'#8e785b'}))
      if(sceneId==='woodland')return h('g',{key:'ground'},h('ellipse',{cx:50,cy:90,rx:25,ry:6,fill:'#66533b'}),h('path',{d:'M27 88Q38 81 50 86Q63 81 75 88Q56 94 27 88Z',fill:'#6a8750'}),h('path',{d:'M33 87l5 -3 4 3 -5 2ZM59 88l5 -3 5 3 -5 2Z',fill:'#ae8d53'}))

      if (sceneId === 'snow') {
        return h('g', { key: 'ground' },
          h('ellipse', { cx: 50, cy: 90.2, rx: 23, ry: 4.6, fill: '#6f5a4b' }),
          h('path', { d: 'M26,89.5C28,83.6 40,81.6 50,82C60,81.6 72,83.6 74,89.5C66,93 34,93 26,89.5Z', fill: '#f6f9fd', stroke: '#c3d1e2', strokeWidth: 0.5 }),
          h('path', { d: 'M32,89.4C40,91.6 60,91.6 68,89.2', fill: 'none', stroke: '#cbd9ea', strokeWidth: 1.3, strokeLinecap: 'round', opacity: 0.85 }),
          h('path', { d: 'M35,85.6h.01M62,85h.01M44,84h.01M56,86.4h.01', fill: 'none', stroke: '#ffffff', strokeWidth: 1.1, strokeLinecap: 'round' }),
        )
      }
      if (sceneId === 'volcano') {
        return h('g', { key: 'ground' },
          h('ellipse', { cx: 50, cy: 90, rx: 23, ry: 5, fill: '#2b2523' }),
          h('path', { d: 'M27,89C29,84 38,82.4 50,82.6C62,82.4 71,84 73,89C66,92.4 34,92.4 27,89Z', fill: '#473d3a' }),
          h('path', { d: 'M31,87.6l5,-3 6,1.4 -3,3.4ZM58,84.4l7,.4 3,3.2 -6,.8Z', fill: '#5d524e' }),
          h('path', { d: 'M40,90.2l4,-2.2 5,1M55,90.6l5,-1.6 4,.4', fill: 'none', stroke: '#f08a3c', strokeWidth: 0.6, strokeLinecap: 'round', opacity: 0.9 }),
          h('path', { d: 'M46,85h.01M69,88.6h.01', fill: 'none', stroke: '#f6b45a', strokeWidth: 0.9, strokeLinecap: 'round' }),
        )
      }
      if (sceneId === 'lake') {
        return h('g', { key: 'ground' },
          h('ellipse', { cx: 50, cy: 88.6, rx: 26, ry: 5.8, fill: '#7fb9c2' }),
          h('ellipse', { cx: 50, cy: 88, rx: 26, ry: 5.4, fill: LAKE }),
          h('path', { d: 'M30,88.4c5,-1.6 11,-1.6 15,0M56,90.4c4,-1.2 9,-1.2 13,0M40,91.6c3,-.8 7,-.8 10,0', fill: 'none', stroke: '#e9f7f7', strokeWidth: 0.55, strokeLinecap: 'round', opacity: 0.9 }),
        )
      }
      return h('g', { key: 'ground' },
        h('ellipse', { cx: 50, cy: 90, rx: 22, ry: 5, fill: '#5f402a' }),
        h('path', { d: 'M28,89C30,84.4 40,82.8 50,83C60,82.8 70,84.4 72,89C65,92.2 35,92.2 28,89Z', fill: '#8b5f3c' }),
        h('path', { d: 'M33,87.4c6,-2.6 14,-3 20,-2.6', fill: 'none', stroke: '#a67a52', strokeWidth: 1, strokeLinecap: 'round', opacity: 0.8 }),
        h('path', { d: 'M38,89.6h.01M60,88h.01M52,90.4h.01M66,89.4h.01', fill: 'none', stroke: '#5f402a', strokeWidth: 1, strokeLinecap: 'round' }),
        h('path', { d: 'M31,88.6q-.6,-3.4 -2.4,-5M32.4,88.4q.6,-2.6 2,-3.8M68,88.6q.4,-3.2 2.2,-4.6M66.6,88.4q-.4,-2.4 -1.6,-3.4', fill: 'none', stroke: '#7fae5c', strokeWidth: 0.8, strokeLinecap: 'round' }),
      )
    }

    function seedArt(ink, sceneId) {
      return [
        h('ellipse', { key: 'seed', cx: 50, cy: 85, rx: 3.8, ry: 2.8, fill: '#4a3423', stroke: '#2f2016', strokeWidth: 0.4, transform: 'rotate(-14 50 85)' }),
        h('path', { key: 'shine', d: 'M48,84.2q1.4,-1.2 3,-.8', fill: 'none', stroke: '#8a6a4c', strokeWidth: 0.5, strokeLinecap: 'round' }),
        h('path', { key: 'crack', d: 'M51,83.2c.4,-2.4 2.2,-3.8 4.2,-3.6', fill: 'none', stroke: ink.pal.leaf, strokeWidth: 1.3, strokeLinecap: 'round' }),
        h('path', { key: 'tip', d: petalD(3.4, 2.2, 'point', 0.5), fill: lighten(ink.pal.leaf, 0.15), transform: 'translate(55.2 79.6) rotate(58)' }),
        sceneId === 'lake' ? h('path', { key: 'ring', d: 'M44,87.4c3,1.4 9,1.4 12,0', fill: 'none', stroke: '#e9f7f7', strokeWidth: 0.5 }) : null,
      ]
    }

    /** The young plant: each habit starts differently. */
    function sproutArt(ink, species) {
      const { pal } = ink
      const kind = species.leaf
      if (kind === 'pad') {
        return [
          h('path', { key: 'pad', d: padD(6.5, 8), fill: ink.leaf, stroke: ink.leafLine, strokeWidth: 0.45, transform: 'translate(50 88) rotate(3)' }),
          dots('areole', [[48, 80], [52.4, 78], [49.6, 74.6], [52, 83]], 0.5, '#efe6c0'),
        ]
      }
      if (kind === 'rosette' || kind === 'silver') {
        return [-58, 54, -30, 28, 0].map((rot, i) => blade(ink, `b${i}`, {
          x: 50, y: GROUND_Y, rot, len: 11 + (i % 2) * 2, w: kind === 'silver' ? 2 : 3.6, curve: rot * 0.03,
          fill: kind === 'silver' ? lighten(pal.leaf, 0.25) : ink.leaf,
        }))
      }
      if (kind === 'float') {
        return [
          h('ellipse', { key: 'pad', cx: 50, cy: 84, rx: 11, ry: 3.6, fill: ink.leaf, stroke: ink.leafLine, strokeWidth: 0.4 }),
          h('path', { key: 'cut', d: 'M50,84L57,87.6 60,86.2Z', fill: LAKE }),
          blade(ink, 'roll', { x: 44, y: 85, rot: -8, len: 9, w: 2.4, curve: 1 }),
        ]
      }
      if (kind === 'peltate') {
        return [
          stem(ink, 70, { w: 1.5, bend: 1 }),
          h('path', { key: 'roll', d: petalD(11, 4.4, 'point', 0.5), fill: ink.leaf, stroke: ink.leafLine, strokeWidth: 0.4, transform: 'translate(50 73) rotate(-12)' }),
          h('ellipse', { key: 'pad', cx: 61, cy: 85.4, rx: 7, ry: 2.2, fill: ink.leafBack }),
        ]
      }
      if (kind === 'strap' || kind === 'sword' || kind === 'needle') {
        const thin = kind === 'needle'
        return [-16, 13, -2].map((rot, i) => blade(ink, `b${i}`, {
          x: 50 + rot * 0.08, y: GROUND_Y, rot, len: 15 + i * 3.5, w: thin ? 1.6 : 4, curve: rot * 0.2,
          fill: i === 2 ? ink.leaf : ink.leafBack,
        }))
      }
      const woody = kind === 'twig' || kind === 'glossy' || kind === 'leathery' || kind === 'paddle'
      const parts = [stem(ink, 71, { w: woody ? 2 : 1.6, bend: 1.2 })]
      parts.push(leaf(ink, 'c1', { x: 50, y: 79, rot: -66, len: 8, w: 5.4, tip: 'round', belly: 0.6, veins: 0, fill: ink.leafBack }))
      parts.push(leaf(ink, 'c2', { x: 50, y: 79, rot: 62, len: 8, w: 5.4, tip: 'round', belly: 0.6, veins: 0 }))
      parts.push(leaf(ink, 't1', { x: 50, y: 71.4, rot: -34, len: 7.5, w: 3.8, veins: 2 }))
      parts.push(leaf(ink, 't2', { x: 50, y: 71.4, rot: 30, len: 8.5, w: 4, veins: 2 }))
      return parts
    }

    // ── meadow ────────────────────────────────────────────────────────────

    /** Dandelion: a dense head of strap florets on a hollow scape, over a toothed rosette. */
    function plantDandelion(ink, st) {
      const { pal } = ink
      const parts = []
      ;[-76, 74, -50, 48, -24, 22].forEach((rot, i) => {
        parts.push(leaf(ink, `l${i}`, {
          x: 50 + rot * 0.025, y: GROUND_Y, rot, len: (16 + (i % 3) * 3) * st.k + 4, w: 7, shape: 'runcinate', steps: 19, pow: 1.3,
          veins: 0, fill: i < 2 ? ink.leafBack : ink.leaf,
        }))
      })
      parts.push(stem(ink, st.top + 1, { w: 1.8, bend: 1.6, color: mix(pal.stem, '#dcc7b4', 0.35) }))
      if (!st.bloom) {
        parts.push(h('path', { key: 'tuft', d: petalD(9, 4.6, 'round', 0.7), fill: ink.petal, stroke: ink.line, strokeWidth: 0.4, transform: `translate(50 ${st.top + 1})` }))
        parts.push(h('path', { key: 'cup', d: petalD(8, 6.6, 'point', 0.36), fill: ink.leaf, stroke: ink.leafLine, strokeWidth: 0.4, transform: `translate(50 ${st.top + 3.4})` }))
        return parts
      }
      const rings = [[24, 15.5, 2.7, ink.back, 0], [19, 12, 2.6, ink.petal, 6], [14, 8.6, 2.4, ink.petal, 14], [9, 5.4, 2.1, ink.petal, 3]]
      rings.forEach(([count, len, w, fill, off], r) => {
        for (let i = 0; i < count; i += 1) {
          parts.push(petal(`r${r}-${i}`, {
            y: st.top, rot: (360 / count) * i + off + jit(i, r) * 5, len: len + jit(i, r + 9) * 1.4, w,
            tip: 'round', belly: 0.8, fill, stroke: ink.line, sw: 0.28,
          }))
        }
      })
      parts.push(h('circle', { key: 'eye', cx: 50, cy: st.top, r: 2.3, fill: ink.core }))
      return parts
    }

    /** Daisy: white rays flushed pink at the tip around a domed yellow disc. */
    function plantDaisy(ink, st) {
      const { pal } = ink
      const parts = []
      ;[-78, 76, -50, 46, -20, 18].forEach((rot, i) => {
        parts.push(leaf(ink, `l${i}`, {
          x: 50 + rot * 0.02, y: GROUND_Y, rot, len: 12 + (i % 2) * 2.5, w: 6.4, tip: 'round', belly: 0.68, veins: 2,
          fill: i < 2 ? ink.leafBack : ink.leaf,
        }))
      })
      parts.push(stem(ink, st.top + 1, { w: 1.6, bend: 2.2 }))
      if (!st.bloom) {
        parts.push(bud(ink, 'bud', 50, st.top + 3, { len: 9, w: 6.5 }))
        return parts
      }
      const ray = ink.tone('ray', [[0, pal.petalDeep], [40, pal.petal], [82, pal.petal], [100, mix(pal.petal, '#ee9db6', 0.42)]])
      for (let i = 0; i < 17; i += 1) {
        parts.push(petal(`b${i}`, { y: st.top, rot: (360 / 17) * i + 10.6, len: 16 + jit(i, 1) * 1.2, w: 4, tip: 'round', belly: 0.66, fill: ink.back, stroke: ink.line, sw: 0.3 }))
      }
      for (let i = 0; i < 17; i += 1) {
        parts.push(petal(`f${i}`, { y: st.top, rot: (360 / 17) * i + jit(i, 2) * 4, len: 15 + jit(i, 3) * 1.2, w: 3.8, tip: 'round', belly: 0.66, fill: ray, stroke: ink.line, sw: 0.3, vein: ink.line, veinOpacity: 0.3 }))
      }
      parts.push(h('circle', { key: 'disc', cx: 50, cy: st.top, r: 5.7, fill: ink.core, stroke: pal.centerDeep, strokeWidth: 0.5 }))
      const florets = []
      for (let i = 0; i < 34; i += 1) florets.push(polar(50, st.top, 5 * Math.sqrt((i + 0.5) / 34), i * 137.5))
      parts.push(dots('florets', florets, 0.36, darken(pal.centerDeep, 0.1), 0.55))
      parts.push(h('ellipse', { key: 'shine', cx: 48.2, cy: st.top - 2, rx: 2, ry: 1.2, fill: '#ffffff', opacity: 0.35 }))
      return parts
    }

    /** One five-petalled Prunus blossom with its fan of stamens. */
    function blossom(ink, key, x, y, r, o) {
      const { pal } = ink
      const fill = ink.tone('blossom', [[0, o.flush], [34, pal.petal], [100, lighten(pal.petal, 0.4)]])
      const parts = []
      for (let i = 0; i < 5; i += 1) {
        parts.push(petal(`p${i}`, { x, y, rot: i * 72 + o.spin, len: r, w: r * o.wide, tip: o.tip, belly: 0.64, fill, stroke: ink.line, sw: 0.32 }))
      }
      const hairs = []
      const anthers = []
      for (let i = 0; i < o.stamens; i += 1) {
        const angle = (360 / o.stamens) * i + jit(i, 5) * 16
        const reach = r * o.reach * (0.82 + jit(i, 6) * 0.4)
        const [tx, ty] = polar(x, y, reach, angle)
        hairs.push([x, y, tx, ty])
        anthers.push([tx, ty])
      }
      parts.push(strokes('hair', hairs, 0.28, o.filament))
      parts.push(dots('anther', anthers, r * 0.055 + 0.2, '#e9b23a'))
      parts.push(h('circle', { key: 'eye', cx: x, cy: y, r: r * 0.09 + 0.3, fill: '#a9bd62' }))
      return h('g', { key }, ...parts)
    }

    function roundBud(ink, key, x, y, r, calyx) {
      return h('g', { key },
        h('circle', { cx: x, cy: y, r, fill: ink.petal, stroke: ink.line, strokeWidth: 0.35 }),
        h('path', { d: `M${n(x - r)},${n(y + r * 0.1)}A${r},${r} 0 0 0 ${n(x + r)},${n(y + r * 0.1)}Q${n(x)},${n(y - r * 0.5)} ${n(x - r)},${n(y + r * 0.1)}Z`, fill: calyx }),
      )
    }

    /** Cherry and plum flower on bare wood, so the plant is a twig with spurs. */
    function plantTwig(ink, st, o) {
      const { pal } = ink
      const top = st.top
      const bark = pal.stem
      const parts = [
        stemPath('trunk', `M50,${GROUND_Y}C51.5,77 46.5,69 49,${n(top + 24)}C50.5,${n(top + 16)} 51,${n(top + 10)} 50,${n(top + 4)}`, bark, 2.8),
        stemPath('spurL', `M48.8,${n(top + 27)}C45,${n(top + 23)} 40,${n(top + 21)} 36.6,${n(top + 16.6)}`, bark, 1.5),
        stemPath('spurR', `M50.2,${n(top + 19)}C54,${n(top + 17)} 59,${n(top + 15)} 63,${n(top + 10)}`, bark, 1.4),
        strokes('lenticel', [[49.4, 80, 50.8, 80], [48.6, 72, 49.8, 71.6], [49.6, top + 30, 50.8, top + 30]], 0.4, lighten(bark, 0.35), 0.8),
      ]
      const calyx = mix(pal.centerDeep, bark, 0.45)
      if (o.leaves) {
        parts.push(leaf(ink, 'lf1', { x: 49, y: top + 34, rot: -62, len: 9, w: 4.4, shape: 'serrate', veins: 2 }))
        parts.push(leaf(ink, 'lf2', { x: 50.4, y: top + 28, rot: 58, len: 8, w: 4, shape: 'serrate', veins: 2, fill: ink.leafBack }))
      }
      if (!st.bloom) {
        parts.push(roundBud(ink, 'b0', 50, top + 2.6, 3, calyx))
        parts.push(roundBud(ink, 'b1', 36.2, top + 15.2, 2.4, calyx))
        parts.push(roundBud(ink, 'b2', 63.4, top + 8.8, 2.2, calyx))
        return parts
      }
      const look = { ...o, flush: o.flush ?? mix(pal.petalDeep, pal.centerDeep, 0.5) }
      parts.push(roundBud(ink, 'b1', 64, top + 8.4, 2.5, calyx))
      parts.push(roundBud(ink, 'b2', 57.6, top + 15.4, 1.9, calyx))
      parts.push(roundBud(ink, 'b3', 44, top + 22.4, 1.7, calyx))
      parts.push(blossom(ink, 'side', 35.6, top + 14.6, 8.2, { ...look, spin: 24 }))
      parts.push(blossom(ink, 'main', 50, top, 13.4, { ...look, spin: 0 }))
      return parts
    }

    function plantCherry(ink, st) {
      return plantTwig(ink, st, { leaves: true, tip: 'notch', wide: 1.02, stamens: 13, reach: 0.46, filament: lighten(ink.pal.centerDeep, 0.2) })
    }

    function plantPlum(ink, st) {
      return plantTwig(ink, st, { leaves: false, tip: 'round', wide: 1.08, stamens: 19, reach: 0.66, filament: '#fff6dc' })
    }

    /** Tulip: a cup of overlapping pointed tepals above broad glaucous leaves. */
    function plantTulip(ink, st) {
      const { pal } = ink
      const base = st.top + 11
      const parts = [
        blade(ink, 'l0', { x: 49, y: GROUND_Y, rot: -9, len: 37 * st.k, w: 9.5, curve: -9, fill: ink.leafBack }),
        blade(ink, 'l1', { x: 51, y: GROUND_Y, rot: 11, len: 31 * st.k, w: 9, curve: 9 }),
        stem(ink, base, { w: 2.8, bend: 1.4 }),
      ]
      if (!st.bloom) {
        const green = ink.lin('tbud', [[0, pal.leaf], [55, mix(pal.leaf, pal.petal, 0.55)], [100, pal.petal]])
        parts.push(petal('bud', { x: 50, y: base + 1, len: 16, w: 8, tip: 'point', belly: 0.46, fill: green, stroke: ink.leafLine, vein: ink.leafLine }))
        return parts
      }
      const tepal = { tip: 'point', belly: 0.5, stroke: ink.line, sw: 0.4 }
      parts.push(petal('bl', { ...tepal, x: 48.6, y: base, rot: -17, len: 22.5, w: 11.5, fill: ink.back }))
      parts.push(petal('br', { ...tepal, x: 51.4, y: base, rot: 17, len: 22.5, w: 11.5, fill: ink.back }))
      parts.push(petal('fl', { ...tepal, x: 46.6, y: base, rot: -7, len: 22, w: 11.4, fill: ink.petal, vein: ink.line }))
      parts.push(petal('fr', { ...tepal, x: 53.4, y: base, rot: 7, len: 22, w: 11.4, fill: ink.petal, vein: ink.line }))
      parts.push(petal('fc', { ...tepal, x: 50, y: base + 0.5, len: 20.5, w: 12, fill: ink.petal, vein: ink.line, sheen: true }))
      return parts
    }

    /** A lavender spike: whorls of tubular florets, the lowest whorl set apart. */
    function whorlSpike(ink, key, x, yBot, yTop, s, green) {
      const { pal } = ink
      const tones = green
        ? [mix(pal.petal, pal.leaf, 0.6), mix(pal.petalDeep, pal.leaf, 0.5), pal.leaf]
        : [pal.petal, pal.petalDeep, mix(pal.petal, pal.petalDeep, 0.5)]
      const rows = Math.max(3, Math.round((yBot - yTop) / (3 * s)))
      const parts = []
      const open = []
      for (let r = 0; r < rows; r += 1) {
        const t = r / (rows - 1)
        const y = yBot - (yBot - yTop) * t + (r === 0 ? 2.4 * s : 0)
        const size = s * (1.08 - t * 0.5)
        for (const [j, dx] of [[0, -1.9], [1, 1.9], [2, 0]]) {
          const cx = x + dx * size
          parts.push(h('ellipse', {
            key: `${r}-${j}`, cx: n(cx), cy: n(y - (j === 2 ? 0.8 : 0)), rx: n(1.5 * size), ry: n(2.2 * size),
            fill: ink.hidden ? ink.petal : tones[(r + j) % 3], stroke: darken(pal.petalDeep, 0.28), strokeWidth: 0.25,
            transform: `rotate(${dx * 13} ${n(cx)} ${n(y)})`,
          }))
          if (!green && jit(r * 3 + j, 4) > -0.1) open.push([cx + dx * 0.35, y - 1.1 * size])
        }
      }
      if (open.length > 0) parts.push(dots('open', open, 0.5 * s, lighten(pal.petal, 0.45)))
      return h('g', { key }, ...parts)
    }

    function plantLavender(ink, st) {
      const { pal } = ink
      const top = st.top
      const parts = []
      for (let i = 0; i < 9; i += 1) {
        const rot = -52 + i * 13
        parts.push(blade(ink, `n${i}`, { x: 50 + rot * 0.05, y: GROUND_Y, rot, len: 12 + (i % 3) * 4, w: 1.7, curve: rot * 0.04, plain: true, fill: i % 2 === 0 ? ink.leafBack : ink.leaf }))
      }
      parts.push(stemPath('sL', `M49,${GROUND_Y}C46,72 41,62 39.6,${n(top + 20)}`, pal.stem, 1.1))
      parts.push(stemPath('sR', `M51,${GROUND_Y}C54,74 59,64 60.6,${n(top + 17)}`, pal.stem, 1.1))
      parts.push(stemPath('sM', `M50,${GROUND_Y}C50.6,70 49.4,56 50,${n(top + 10)}`, pal.stem, 1.3))
      parts.push(whorlSpike(ink, 'kL', 39.6, top + 20, st.bloom ? top + 5 : top + 12, 0.8, !st.bloom))
      parts.push(whorlSpike(ink, 'kR', 60.6, top + 17, st.bloom ? top + 3 : top + 10, 0.8, !st.bloom))
      parts.push(whorlSpike(ink, 'kM', 50, top + 10, st.bloom ? top - 13 : top - 1, 1, !st.bloom))
      return parts
    }

    /** A fan-shaped, crinkled petal (poppy): narrow claw, wavy outer edge. */
    function fanD(len, half, seed) {
      const points = []
      for (let i = 0; i <= 14; i += 1) {
        const angle = -half + (2 * half * i) / 14
        const reach = len * (1 + 0.05 * Math.sin(i * 2.3 + seed) + 0.03 * jit(i, seed))
        points.push(polar(0, 0, reach, angle).join(','))
      }
      const [sx] = polar(0, 0, len * 0.45, -half)
      return `M0,0Q${n(sx * 1.25)},${n(-len * 0.2)} ${points.join(' ')}Q${n(-sx * 1.25)},${n(-len * 0.2)} 0,0Z`
    }

    /** Corn poppy: four silky petals with black basal blotches round a ribbed capsule. */
    function plantPoppy(ink, st) {
      const { pal } = ink
      const top = st.top
      const parts = [
        leaf(ink, 'l0', { x: 50, y: GROUND_Y - 6, rot: -64, len: 19, w: 9, shape: 'pinnate', steps: 21, veins: 0, fill: ink.leafBack }),
        leaf(ink, 'l1', { x: 50, y: GROUND_Y - 10, rot: 60, len: 18, w: 9, shape: 'pinnate', steps: 21, veins: 0 }),
        leaf(ink, 'l2', { x: 50, y: GROUND_Y - 2, rot: -32, len: 14, w: 7, shape: 'pinnate', steps: 17, veins: 0 }),
        stem(ink, top + 2, { w: 1.6, bend: 3 }),
      ]
      const hairs = []
      for (let i = 0; i < 9; i += 1) {
        const y = GROUND_Y - 6 - i * 4.6
        if (y < top + 12) break
        hairs.push([50, y, 50 + (i % 2 === 0 ? -1.5 : 1.5), y - 0.8])
      }
      parts.push(strokes('hairs', hairs, 0.25, darken(pal.stem, 0.2), 0.8))
      const podFill = ink.lin('pod', [[0, darken(pal.leaf, 0.15)], [100, lighten(pal.leaf, 0.2)]])
      if (!st.bloom) {
        parts.push(stemPath('hook', `M50,${n(top + 6)}C50,${n(top - 4)} 57,${n(top - 5)} 57.4,${n(top + 2)}`, pal.stem, 1.3))
        parts.push(h('ellipse', { key: 'pod', cx: 57.4, cy: top + 6.4, rx: 3.6, ry: 5.2, fill: podFill, stroke: ink.leafLine, strokeWidth: 0.4 }))
        parts.push(h('path', { key: 'slit', d: `M57.4,${n(top + 2.4)}v7.6`, stroke: ink.hidden ? pal.petalDeep : pal.petal, strokeWidth: 0.7, strokeLinecap: 'round' }))
        return parts
      }
      // The nodding bud beside the open flower is as characteristic as the bloom.
      parts.push(stemPath('side', `M50,${n(top + 34)}C55,${n(top + 26)} 60,${n(top + 16)} 64,${n(top + 15)}C67,${n(top + 14.6)} 68.4,${n(top + 17)} 68,${n(top + 20)}`, pal.stem, 1.1))
      parts.push(h('ellipse', { key: 'pod', cx: 67.8, cy: top + 23.4, rx: 2.7, ry: 4, fill: podFill, stroke: ink.leafLine, strokeWidth: 0.35, transform: `rotate(8 67.8 ${n(top + 23.4)})` }))
      const silk = ink.tone('silk', [[0, '#221620'], [15, '#221620'], [27, darken(pal.petalDeep, 0.1)], [62, pal.petal], [100, lighten(pal.petal, 0.14)]])
      ;[[90, 17.5, 66, 1], [270, 17.5, 66, 2], [0, 16.5, 60, 3], [180, 16, 60, 4]].forEach(([rot, len, half, seed], i) => {
        const folds = [-0.5, 0, 0.5].map(f => {
          const [x1, y1] = polar(0, 0, len * 0.36, f * half)
          const [x2, y2] = polar(0, 0, len * 0.9, f * half * 1.1)
          return [x1, y1, x2, y2]
        })
        parts.push(h('g', { key: `p${i}`, transform: place({ y: top, rot }) },
          h('path', { d: fanD(len, half, seed), fill: silk, stroke: ink.line, strokeWidth: 0.4, strokeLinejoin: 'round', opacity: 0.96 }),
          strokes('fold', folds, 0.3, darken(pal.petalDeep, 0.2), 0.3),
        ))
      })
      const stamens = []
      for (let i = 0; i < 30; i += 1) stamens.push(polar(50, top, 3.9 + (i % 3) * 0.9, i * 12 + jit(i, 2) * 8))
      parts.push(dots('stamens', stamens, 0.55, '#2c2030'))
      parts.push(h('circle', { key: 'ovary', cx: 50, cy: top, r: 3, fill: '#b9c77c', stroke: '#6c7a3a', strokeWidth: 0.4 }))
      parts.push(strokes('stigma', [0, 45, 90, 135, 180, 225, 270, 315].map(a => [50, top, ...polar(50, top, 2.5, a)]), 0.4, '#4c5528'))
      return parts
    }

    /** Sunflower: two rows of rays round a disc whose florets follow the golden angle. */
    function plantSunflower(ink, st) {
      const { pal } = ink
      const top = st.top
      const heart = (len, w) => `M0,0C${n(-w * 0.72)},${n(len * 0.14)} ${n(-w * 0.62)},${n(-len * 0.52)} 0,${n(-len)}C${n(w * 0.62)},${n(-len * 0.52)} ${n(w * 0.72)},${n(len * 0.14)} 0,0Z`
      const parts = [
        strokes('petiole', [[50, top + 30, 45, top + 27], [50, top + 39, 55, top + 36]], 1.1, darken(pal.stem, 0.1)),
        leaf(ink, 'l0', { x: 45, y: top + 27, rot: -64, len: 19 * st.k, w: 17 * st.k, d: heart(19 * st.k, 17 * st.k), veins: 3, fill: ink.leafBack }),
        leaf(ink, 'l1', { x: 55, y: top + 36, rot: 62, len: 17 * st.k, w: 15 * st.k, d: heart(17 * st.k, 15 * st.k), veins: 3 }),
        stem(ink, top + 3, { w: 3.2, bend: 1.6 }),
      ]
      if (!st.bloom) {
        for (let i = 0; i < 9; i += 1) {
          parts.push(petal(`s${i}`, { y: top + 5, rot: -64 + i * 16, len: 10 + (i % 2) * 2, w: 5, tip: 'point', belly: 0.4, fill: i % 2 === 0 ? ink.leafBack : ink.leaf, stroke: ink.leafLine }))
        }
        parts.push(petal('peek', { y: top - 1, len: 6, w: 4.6, tip: 'point', fill: ink.petal, stroke: ink.line }))
        return parts
      }
      for (let i = 0; i < 16; i += 1) {
        parts.push(petal(`b${i}`, { y: top, rot: 22.5 * i + 11.25, len: 19.5 + jit(i, 1) * 1.2, w: 5.6, tip: 'point', belly: 0.64, fill: ink.back, stroke: ink.line, sw: 0.3 }))
      }
      for (let i = 0; i < 16; i += 1) {
        parts.push(petal(`f${i}`, { y: top, rot: 22.5 * i + jit(i, 2) * 4, len: 18 + jit(i, 3) * 1.4, w: 5.2, tip: 'point', belly: 0.64, fill: ink.petal, stroke: ink.line, sw: 0.3, vein: ink.line }))
      }
      const disc = ink.rad('disc', [[0, mix(pal.centerDeep, '#7c8a3a', 0.4)], [34, pal.centerDeep], [72, pal.center], [100, mix(pal.center, '#e0a53a', 0.5)]])
      parts.push(h('circle', { key: 'disc', cx: 50, cy: top, r: 8.6, fill: disc, stroke: darken(pal.centerDeep, 0.1), strokeWidth: 0.5 }))
      const inner = []
      const outer = []
      for (let i = 0; i < 72; i += 1) {
        const point = polar(50, top, 8 * Math.sqrt((i + 0.5) / 72), i * 137.5)
        if (i < 40) inner.push(point)
        else outer.push(point)
      }
      parts.push(dots('seedIn', inner, 0.42, darken(pal.centerDeep, 0.3), 0.75))
      parts.push(dots('seedOut', outer, 0.5, '#e2b04e', 0.9))
      return parts
    }

    /** Lily: six recurved tepals, long stamens with heavy rust anthers, leaves up the stem. */
    function plantLily(ink, st) {
      const { pal } = ink
      const top = st.top
      const parts = []
      const span = GROUND_Y - 6 - (top + 15)
      for (let i = 0; i < 8; i += 1) {
        const t = i / 7
        const side = i % 2 === 0 ? -1 : 1
        parts.push(leaf(ink, `l${i}`, {
          x: 50, y: GROUND_Y - 6 - span * t, rot: side * (64 - t * 22), len: 13 - t * 4, w: 2.9, veins: 0,
          fill: side < 0 ? ink.leafBack : ink.leaf,
        }))
      }
      parts.push(stem(ink, top + 4, { w: 2.2, bend: 1.2 }))
      const pale = ink.lin('lbud', [[0, mix(pal.petal, '#a8c66c', 0.6)], [100, pal.petal]])
      if (!st.bloom) {
        parts.push(petal('bud', { y: top + 6, rot: 4, len: 17, w: 5.6, tip: 'round', belly: 0.6, fill: pale, stroke: ink.line, vein: ink.line }))
        return parts
      }
      parts.push(strokes('pedicel', [[50, top + 14, 59, top + 9]], 1, pal.stem))
      parts.push(petal('side', { x: 59, y: top + 9, rot: 42, len: 13, w: 4.4, tip: 'round', belly: 0.6, fill: pale, stroke: ink.line, vein: ink.line }))
      const throat = ink.tone('throat', [[0, mix(pal.petal, '#a8c66c', 0.5)], [26, pal.petal], [100, lighten(pal.petal, 0.35)]])
      for (let i = 0; i < 3; i += 1) {
        parts.push(petal(`o${i}`, { y: top, rot: i * 120 + 60, len: 18, w: 7.4, tip: 'point', belly: 0.52, fill: ink.back, stroke: ink.line, vein: ink.line }))
      }
      for (let i = 0; i < 3; i += 1) {
        parts.push(petal(`i${i}`, { y: top, rot: i * 120, len: 18.5, w: 9, tip: 'point', belly: 0.52, fill: throat, stroke: ink.line, vein: ink.line, sheen: i === 0 }))
      }
      if (ink.variant === 'alt') {
        const specks = []
        for (let i = 0; i < 18; i += 1) specks.push(polar(50, top, 4 + (i % 3) * 2.2, i * 20 + jit(i, 3) * 10))
        parts.push(dots('speck', specks, 0.4, darken(pal.petalDeep, 0.3), 0.7))
      }
      const filaments = []
      const anthers = []
      for (let i = 0; i < 6; i += 1) {
        const angle = i * 60 + 30
        const [x, y] = polar(50, top, 8.4, angle)
        filaments.push([50, top, x, y])
        anthers.push(h('ellipse', { key: `a${i}`, cx: x, cy: y, rx: 2, ry: 0.85, fill: '#c5651f', stroke: '#8e4313', strokeWidth: 0.3, transform: `rotate(${angle} ${x} ${y})` }))
      }
      parts.push(strokes('filament', filaments, 0.45, '#dbe6b4'), ...anthers)
      const [px, py] = polar(50, top, 10.4, 196)
      parts.push(strokes('style', [[50, top, px, py]], 0.6, '#c9dba0'))
      parts.push(h('circle', { key: 'stigma', cx: px, cy: py, r: 1.15, fill: '#8fb552', stroke: '#5f7f35', strokeWidth: 0.3 }))
      return parts
    }

    /** Rings of petals sharing one centre, widest first: roses and camellias. */
    function petalRings(key, x, y, rings, look) {
      const parts = []
      rings.forEach(([count, len, w, off, fill], r) => {
        for (let i = 0; i < count; i += 1) {
          parts.push(petal(`${r}-${i}`, {
            x, y, rot: (360 / count) * i + off + jit(i, r) * 6, len: len + jit(i, r + 4) * 0.8, w,
            tip: look.tip, belly: look.belly, fill, stroke: look.stroke, sw: 0.36,
          }))
        }
      })
      return h('g', { key }, ...parts)
    }

    /** A pinnate rose leaf: a terminal leaflet and one pair, all toothed. */
    function roseLeaf(ink, key, x, y, rot, s, back) {
      const fill = back ? ink.leafBack : ink.leaf
      return h('g', { key, transform: place({ x, y, rot }) },
        h('path', { d: `M0,0L0,${n(-9 * s)}`, stroke: darken(ink.pal.stem, 0.15), strokeWidth: 0.7, strokeLinecap: 'round' }),
        leaf(ink, 'a', { x: 0, y: -4.6 * s, rot: -62, len: 7.4 * s, w: 4.6 * s, shape: 'serrate', steps: 12, veins: 2, fill }),
        leaf(ink, 'b', { x: 0, y: -4.6 * s, rot: 62, len: 7.4 * s, w: 4.6 * s, shape: 'serrate', steps: 12, veins: 2, fill }),
        leaf(ink, 'c', { x: 0, y: -9 * s, rot: 0, len: 9.4 * s, w: 5.8 * s, shape: 'serrate', steps: 14, veins: 3, fill }),
      )
    }

    /** Rose: a spiral of cupped petals, darkest at the heart, on a thorned cane. */
    function plantRose(ink, st) {
      const { pal } = ink
      const top = st.top
      const cane = darken(pal.stem, 0.08)
      const parts = [
        roseLeaf(ink, 'l0', 50, top + 34, -58, st.k, true),
        roseLeaf(ink, 'l1', 50, top + 26, 56, st.k, false),
        stem(ink, top + 5, { w: 2.2, bend: 2, color: cane }),
        h('path', { key: 'thorns', d: `M50.6,${n(top + 42)}l2.6,-1.4 -1.8,2.4ZM49.6,${n(top + 30)}l-2.6,-1.4 1.8,2.4ZM50.4,${n(top + 19)}l2.4,-1.4 -1.6,2.2Z`, fill: mix(cane, '#a05a4a', 0.5) }),
      ]
      if (!st.bloom) {
        parts.push(bud(ink, 'bud', 50, top + 8, { len: 14, w: 8 }))
        return parts
      }
      for (let i = 0; i < 5; i += 1) {
        parts.push(petal(`s${i}`, { y: top, rot: i * 72 + 36, len: 19.5, w: 4.6, tip: 'point', belly: 0.4, fill: ink.leaf, stroke: ink.leafLine }))
      }
      const cup = ink.tone('cup', [[0, darken(pal.petalDeep, 0.34)], [46, pal.petalDeep], [80, pal.petal], [100, lighten(pal.petal, 0.3)]])
      const heart = ink.tone('heart', [[0, darken(pal.petalDeep, 0.4)], [60, darken(pal.petalDeep, 0.1)], [100, pal.petal]])
      parts.push(petalRings('rings', 50, top, [
        [5, 17.6, 19, 0, cup], [5, 14.2, 15.6, 36, cup], [4, 10.8, 12.4, 14, cup], [3, 7.4, 8.8, 52, heart],
      ], { tip: 'round', belly: 0.64, stroke: ink.line }))
      parts.push(h('path', {
        key: 'swirl',
        d: `M47.4,${n(top + 0.6)}C47.2,${n(top - 2.8)} 52.6,${n(top - 3)} 52.8,${top}C52.9,${n(top + 2.3)} 49,${n(top + 2.6)} 48.7,${n(top + 0.6)}C48.6,${n(top - 1)} 50.9,${n(top - 1.2)} 51.1,${n(top + 0.1)}`,
        fill: 'none', stroke: ink.hidden ? ink.line : darken(pal.petalDeep, 0.42), strokeWidth: 0.6, strokeLinecap: 'round',
      }))
      return parts
    }

    /** Hydrangea mophead: a dome of four-sepalled florets, lit from the upper left. */
    function plantHydrangea(ink, st) {
      const { pal } = ink
      const top = st.top
      const big = { shape: 'serrate', steps: 16, veins: 4 }
      const parts = [
        leaf(ink, 'l0', { ...big, x: 50, y: top + 36, rot: -60, len: 17 * st.k, w: 11 * st.k, fill: ink.leafBack }),
        leaf(ink, 'l1', { ...big, x: 50, y: top + 36, rot: 62, len: 17 * st.k, w: 11 * st.k }),
        leaf(ink, 'l2', { ...big, x: 50, y: top + 20, rot: -76, len: 20 * st.k, w: 13 * st.k }),
        leaf(ink, 'l3', { ...big, x: 50, y: top + 20, rot: 74, len: 20 * st.k, w: 13 * st.k, fill: ink.leafBack }),
        stem(ink, top + 8, { w: 2.5, bend: 1.4 }),
      ]
      const count = st.bloom ? 25 : 9
      const reach = st.bloom ? 13.6 : 6
      const cy = st.bloom ? top : top + 6
      const sepal = petalD(4.7, 4.5, 'round', 0.62)
      parts.push(h('circle', { key: 'under', cx: 50, cy, r: reach + 1.4, fill: st.bloom ? darken(pal.petalDeep, 0.2) : darken(pal.leaf, 0.1) }))
      for (let i = count - 1; i >= 0; i -= 1) {
        const [x, y] = polar(50, cy, reach * Math.sqrt((i + 0.5) / count), i * 137.5)
        const shade = Math.max(0, Math.min(1, 0.45 + ((x - 50) * 0.6 + (y - cy)) / 30 + jit(i, 3) * 0.3))
        const tone = st.bloom ? mix(lighten(pal.petal, 0.22), pal.petalDeep, shade) : mix(lighten(pal.leaf, 0.3), mix(pal.leaf, pal.petal, 0.5), shade)
        const size = (st.bloom ? 1.06 : 0.62) - (i / count) * 0.14
        const spin = 45 + jit(i, 7) * 50
        parts.push(h('g', { key: `f${i}`, transform: `translate(${x} ${y}) rotate(${n(spin)}) scale(${n(size)})` },
          ...[0, 90, 180, 270].map(a => h('path', {
            key: a, d: sepal, transform: `rotate(${a})`,
            fill: ink.hidden ? ink.petal : (a % 180 === 0 ? tone : mix(tone, pal.center, 0.4)),
            stroke: ink.hidden ? ink.line : darken(tone, 0.22), strokeWidth: 0.3,
          })),
          h('circle', { r: 0.75, fill: ink.hidden ? pal.centerDeep : darken(pal.centerDeep, 0.15) }),
        ))
      }
      return parts
    }

    // ── snowfield ─────────────────────────────────────────────────────────

    /** Snowdrop: one nodding flower on an arched scape; the inner cup carries the green mark. */
    function plantSnowdrop(ink, st) {
      const { pal } = ink
      const top = st.top
      const parts = [
        blade(ink, 'l0', { x: 47, y: GROUND_Y, rot: -7, len: 31 * st.k, w: 4.4, curve: -5, fill: ink.leafBack }),
        blade(ink, 'l1', { x: 52, y: GROUND_Y, rot: 9, len: 27 * st.k, w: 4.4, curve: 6 }),
        stemPath('scape', `M49.5,${GROUND_Y}C49,72 46.6,${n(top + 8)} 47,${n(top - 8)}C47.4,${n(top - 14.6)} 52.6,${n(top - 15)} 53,${n(top - 10.4)}`, pal.stem, 1.5),
        blade(ink, 'spathe', { x: 47.6, y: top - 11, rot: 22, len: 7.5, w: 1.8, curve: 2, plain: true }),
      ]
      const hx = 53
      const hy = top - 6
      parts.push(h('ellipse', { key: 'ovary', cx: hx, cy: top - 8.4, rx: 2.1, ry: 2.7, fill: pal.center, stroke: pal.centerDeep, strokeWidth: 0.4 }))
      if (!st.bloom) {
        parts.push(petal('bud', { x: hx, y: hy, rot: 176, len: 10.5, w: 4.6, tip: 'round', belly: 0.62, fill: ink.petal, stroke: ink.line, vein: ink.line }))
        return parts
      }
      parts.push(petal('back', { x: hx, y: hy, rot: 180, len: 15, w: 7, tip: 'round', belly: 0.64, fill: ink.back, stroke: ink.line }))
      parts.push(h('g', { key: 'cup', transform: place({ x: hx, y: hy, rot: 180 }) },
        h('path', { d: petalD(9.6, 6.6, 'notch', 0.7), fill: ink.hidden ? ink.petal : lighten(pal.petal, 0.5), stroke: ink.line, strokeWidth: 0.4 }),
        h('path', { d: 'M-2.4,-6.2C-2.4,-8.8 2.4,-8.8 2.4,-6.2C1.2,-7.5 -1.2,-7.5 -2.4,-6.2Z', fill: pal.center, stroke: pal.centerDeep, strokeWidth: 0.25 }),
      ))
      parts.push(petal('left', { x: hx, y: hy, rot: 212, len: 16.5, w: 7.6, tip: 'round', belly: 0.64, fill: ink.petal, stroke: ink.line, vein: ink.line, veinOpacity: 0.3 }))
      parts.push(petal('right', { x: hx, y: hy, rot: 148, len: 16.5, w: 7.6, tip: 'round', belly: 0.64, fill: ink.petal, stroke: ink.line, vein: ink.line, veinOpacity: 0.3, sheen: true }))
      return parts
    }

    /** A hellebore leaf: five toothed leaflets fanning from the petiole. */
    function palmate(ink, key, x, y, rot, s, back) {
      return h('g', { key, transform: place({ x, y, rot }) },
        h('path', { d: `M0,0L0,${n(-8 * s)}`, stroke: darken(ink.pal.stem, 0.1), strokeWidth: 0.9, strokeLinecap: 'round' }),
        ...[-70, 70, -35, 35, 0].map((a, i) => leaf(ink, `f${i}`, {
          x: 0, y: -8 * s, rot: a, len: (a === 0 ? 13 : 11.5) * s, w: 3.9 * s, shape: 'serrate', steps: 14, veins: 0,
          fill: back || i < 2 ? ink.leafBack : ink.leaf,
        })),
      )
    }

    /** Hellebore: five broad sepals, a ring of green nectaries, a boss of pale stamens. */
    function plantHellebore(ink, st) {
      const { pal } = ink
      const top = st.top
      const stalk = mix(pal.stem, '#8a5266', 0.3)
      const parts = [
        palmate(ink, 'l0', 50, GROUND_Y - 2, -50, st.k, true),
        palmate(ink, 'l1', 50, GROUND_Y - 3, 48, st.k, false),
        stem(ink, top + 4, { w: 2.2, bend: 3, color: stalk }),
        leaf(ink, 'bract', { x: 50, y: top + 15, rot: 118, len: 8, w: 4, veins: 0 }),
      ]
      if (!st.bloom) {
        parts.push(bud(ink, 'bud', 50, top + 6, { len: 11, w: 8, rot: 14 }))
        return parts
      }
      const sepal = ink.tone('sepal', [[0, mix(pal.petal, '#a9c47a', 0.6)], [34, pal.petal], [100, lighten(pal.petal, 0.3)]])
      for (let i = 0; i < 5; i += 1) {
        parts.push(petal(`p${i}`, { y: top, rot: i * 72 + 8, len: 16, w: 16, tip: 'round', belly: 0.6, fill: i < 2 ? ink.back : sepal, stroke: ink.line, vein: ink.line, veinOpacity: 0.3 }))
      }
      parts.push(h('circle', { key: 'boss', cx: 50, cy: top, r: 6, fill: '#ece5bb', opacity: 0.55 }))
      const nectary = []
      for (let i = 0; i < 11; i += 1) nectary.push(polar(50, top, 4.9, i * (360 / 11)))
      parts.push(dots('nectary', nectary, 0.7, '#9cbd58'))
      const stamens = []
      for (let i = 0; i < 30; i += 1) stamens.push(polar(50, top, 4.2 * Math.sqrt((i + 0.5) / 30), i * 137.5))
      parts.push(dots('stamenRim', stamens, 0.68, '#cdb658'))
      parts.push(dots('stamens', stamens, 0.5, '#f6e9a8'))
      parts.push(dots('carpel', [[49.3, top - 0.4], [50.8, top - 0.3], [50, top + 0.8]], 0.6, '#8fae4e'))
      return parts
    }

    /** Edelweiss: felted, uneven bracts round a cluster of small yellowish flower heads. */
    function plantEdelweiss(ink, st) {
      const { pal } = ink
      const top = st.top
      const parts = []
      ;[-70, 66, -40, 38].forEach((rot, i) => {
        parts.push(leaf(ink, `b${i}`, { x: 50, y: GROUND_Y, rot, len: 12, w: 3.6, tip: 'round', belly: 0.6, veins: 0, fill: i < 2 ? ink.leafBack : ink.leaf }))
      })
      for (let i = 0; i < 5; i += 1) {
        const side = i % 2 === 0 ? -1 : 1
        parts.push(leaf(ink, `s${i}`, { x: 50, y: GROUND_Y - 12 - i * 6.4 * st.k, rot: side * (52 - i * 4), len: 9.5 - i * 0.7, w: 2.5, veins: 0 }))
      }
      parts.push(stem(ink, top + 3, { w: 1.7, bend: 1.5, color: lighten(pal.stem, 0.12) }))
      const felt = ink.tone('felt', [[0, mix(pal.petal, '#c2c9a6', 0.6)], [44, pal.petal], [100, lighten(pal.petal, 0.3)]])
      const edge = ink.hidden ? ink.line : darken(pal.petalDeep, 0.16)
      if (!st.bloom) {
        for (let i = 0; i < 5; i += 1) {
          parts.push(petal(`p${i}`, { y: top + 5, rot: -56 + i * 28, len: 9, w: 3.6, tip: 'point', belly: 0.42, fill: felt, stroke: edge }))
        }
        return parts
      }
      const fuzz = { fill: 'none', stroke: '#ffffff', strokeWidth: 0.7, strokeDasharray: '0.5 1.1', strokeLinecap: 'round', opacity: 0.85 }
      const bract = (key, rot, len, w, fill) => h('g', { key, transform: place({ y: top, rot }) },
        h('path', { d: petalD(len, w, 'point', 0.42), fill, stroke: edge, strokeWidth: 0.4, strokeLinejoin: 'round' }),
        h('path', { d: `M0,${n(-len * 0.24)}L0,${n(-len * 0.86)}`, ...fuzz }),
      )
      for (let i = 0; i < 8; i += 1) parts.push(bract(`o${i}`, i * 45 + 12 + jit(i, 1) * 12, 16 + jit(i, 2) * 5, 5.4, ink.hidden ? ink.back : felt))
      for (let i = 0; i < 6; i += 1) parts.push(bract(`i${i}`, i * 60 + 38 + jit(i, 3) * 10, 10.5 + jit(i, 4) * 3, 4.8, felt))
      const heads = [[50, top, 2.5], ...[0, 1, 2, 3, 4, 5].map(i => [...polar(50, top, 4.3, i * 60 + 12), 1.9])]
      heads.slice(1).concat([heads[0]]).forEach(([x, y, r], i) => {
        parts.push(h('circle', { key: `h${i}`, cx: x, cy: y, r, fill: ink.core, stroke: '#fffbea', strokeWidth: 0.55 }))
        parts.push(dots(`hd${i}`, [[x - r * 0.3, y - r * 0.2], [x + r * 0.35, y + r * 0.1], [x, y + r * 0.45], [x + r * 0.1, y - r * 0.5]], 0.28, darken(pal.centerDeep, 0.2), 0.7))
      })
      return parts
    }

    /** Camellia: two tiers of rounded petals round a golden boss, glossy leaves on wood. */
    function plantCamellia(ink, st) {
      const { pal } = ink
      const top = st.top
      const wood = mix(pal.stem, '#7a6450', 0.7)
      const glossy = { tip: 'point', belly: 0.5, veins: 3, sheen: true }
      const parts = [
        leaf(ink, 'l0', { ...glossy, x: 50, y: top + 38, rot: -62, len: 15 * st.k, w: 8.4 * st.k, fill: ink.leafBack }),
        leaf(ink, 'l1', { ...glossy, x: 50, y: top + 30, rot: 60, len: 16 * st.k, w: 8.8 * st.k }),
        leaf(ink, 'l2', { ...glossy, x: 50, y: top + 19, rot: -72, len: 14 * st.k, w: 8 * st.k }),
        stem(ink, top + 5, { w: 2.4, bend: 1.6, color: wood }),
      ]
      if (!st.bloom) {
        parts.push(bud(ink, 'bud', 50, top + 8, { len: 12, w: 9 }))
        return parts
      }
      const satin = ink.tone('satin', [[0, darken(pal.petalDeep, 0.2)], [42, pal.petal], [100, lighten(pal.petal, 0.26)]])
      parts.push(petalRings('rings', 50, top, [
        [6, 17.4, 16.4, 0, ink.back], [6, 14, 14, 30, satin], [5, 10.4, 11, 8, satin],
      ], { tip: 'notch', belly: 0.66, stroke: ink.line }))
      const hairs = []
      const anthers = []
      for (let i = 0; i < 26; i += 1) {
        const [x, y] = polar(50, top, 3 + (i % 3) * 0.9, i * (360 / 26) + jit(i, 2) * 6)
        hairs.push([50, top, x, y])
        anthers.push([x, y])
      }
      parts.push(h('circle', { key: 'boss', cx: 50, cy: top, r: 5, fill: '#f3e3a2', stroke: '#d8b545', strokeWidth: 0.3 }))
      parts.push(strokes('hair', hairs, 0.3, '#fbf3cf'))
      parts.push(dots('anther', anthers, 0.6, '#e2a72a'))
      return parts
    }

    // ── volcanic crater ───────────────────────────────────────────────────

    /** Obovate cactus pad: base at the origin, `2 × ry` tall. */
    function padD(rx, ry) {
      return `M0,0C${n(-rx * 1.25)},${n(-ry * 0.5)} ${n(-rx * 1.05)},${n(-ry * 2)} 0,${n(-ry * 2)}`
        + `C${n(rx * 1.05)},${n(-ry * 2)} ${n(rx * 1.25)},${n(-ry * 0.5)} 0,0Z`
    }

    /** Prickly pear: flat pads studded with areoles; the satin flower sits on a pad's rim. */
    function plantCactus(ink, st) {
      const { pal } = ink
      const top = st.top
      const height = GROUND_Y + 1 - (top + 12)
      const rx = Math.min(13, height * 0.36)
      const skin = ink.lin('pad', [[0, darken(pal.leaf, 0.24)], [100, lighten(pal.leaf, 0.12)]], { x1: '1', y1: '0.6', x2: '0', y2: '0.4' })
      const parts = []
      const areoles = []
      const spines = []
      const stud = (x, y) => {
        areoles.push([x, y])
        spines.push([x, y, x - 1.5, y - 1.2], [x, y, x + 1.6, y - 1], [x, y, x + 0.2, y - 1.9])
      }
      if (st.bloom) {
        parts.push(h('path', { key: 'side', d: padD(7, 9), fill: skin, stroke: ink.leafLine, strokeWidth: 0.45, transform: `translate(40.6 ${n(top + 31)}) rotate(-36)` }))
        parts.push(h('ellipse', { key: 'fruit', cx: 30.4, cy: top + 15.4, rx: 2.5, ry: 3.3, fill: '#b53a5c', stroke: '#7e2440', strokeWidth: 0.35, transform: `rotate(-36 30.4 ${n(top + 15.4)})` }))
        ;[[38, top + 27], [34.6, top + 22], [39, top + 20.6], [35.6, top + 17.4]].forEach(([x, y]) => stud(x, y))
      }
      parts.push(h('path', { key: 'pad', d: padD(rx, height / 2), fill: skin, stroke: ink.leafLine, strokeWidth: 0.5, transform: `translate(50 ${GROUND_Y + 1}) rotate(3)` }))
      for (let row = 1; row <= 5; row += 1) {
        const t = 0.1 + row * 0.15
        const half = rx * 0.95 * Math.sin(Math.PI * Math.pow(t, 0.75)) * 0.8
        const y = GROUND_Y + 1 - height * t
        const lean = (GROUND_Y + 1 - y) * 0.05
        const cols = row % 2 === 0 ? [-0.62, 0, 0.62] : [-0.3, 0.3]
        for (const c of cols) stud(50 + lean + c * half, y)
      }
      parts.push(strokes('spines', spines, 0.25, '#f6efd2', 0.95))
      parts.push(dots('areoles', areoles, 0.55, '#e7dcae'))
      const bx = 52
      const by = top + 12.6
      if (!st.bloom) {
        parts.push(bud(ink, 'bud', bx - 1, by + 0.6, { len: 8, w: 5.4, rot: 4 }))
        return parts
      }
      parts.push(bud(ink, 'bud2', 60.6, top + 22, { len: 6.5, w: 4.2, rot: 38 }))
      parts.push(h('ellipse', { key: 'tube', cx: bx, cy: by + 0.4, rx: 3.6, ry: 3, fill: ink.leaf, stroke: ink.leafLine, strokeWidth: 0.4 }))
      // The open flower is seen from a little above: a face-on rosette, foreshortened.
      const satin = ink.tone('satin', [[0, mix(pal.petalDeep, '#d9641e', 0.45)], [40, pal.petal], [100, lighten(pal.petal, 0.4)]])
      const flower = []
      for (let i = 0; i < 11; i += 1) {
        flower.push(petal(`b${i}`, { x: 0, y: 0, rot: (360 / 11) * i + 8, len: 15.5 + jit(i, 1) * 1.4, w: 7.6, tip: 'point', belly: 0.66, fill: ink.back, stroke: ink.line }))
      }
      for (let i = 0; i < 9; i += 1) {
        flower.push(petal(`f${i}`, { x: 0, y: 0, rot: 40 * i + 26, len: 11.5 + jit(i, 3), w: 7, tip: 'point', belly: 0.66, fill: satin, stroke: ink.line, vein: ink.line, veinOpacity: 0.3 }))
      }
      flower.push(h('circle', { key: 'boss', r: 4.4, fill: '#f6de7c', stroke: '#d6b03c', strokeWidth: 0.4 }))
      const pollen = []
      for (let i = 0; i < 22; i += 1) pollen.push(polar(0, 0, 3.7 * Math.sqrt((i + 0.5) / 22), i * 137.5))
      flower.push(dots('pollen', pollen, 0.5, '#e0a52c'))
      flower.push(dots('stigma', [[-0.9, -0.3], [0.9, -0.3], [0, 0.9]], 0.75, '#8fb552'))
      parts.push(h('g', { key: 'flower', transform: `translate(${bx} ${n(by - 8.6)}) scale(1 0.66)` }, ...flower))
      return parts
    }

    /** ʻŌhiʻa lehua: no showy petals at all, only a pompom of long stamens. */
    function plantLehua(ink, st) {
      const { pal } = ink
      const top = st.top
      const wood = mix(pal.stem, '#7d6652', 0.65)
      const leather = { tip: 'round', belly: 0.56, veins: 0 }
      const parts = [
        leaf(ink, 'l0', { ...leather, x: 50, y: top + 40, rot: -66, len: 12 * st.k, w: 8 * st.k, fill: ink.leafBack }),
        leaf(ink, 'l1', { ...leather, x: 50, y: top + 40, rot: 68, len: 12 * st.k, w: 8 * st.k }),
        leaf(ink, 'l2', { ...leather, x: 50, y: top + 27, rot: -58, len: 11 * st.k, w: 7.4 * st.k }),
        leaf(ink, 'l3', { ...leather, x: 50, y: top + 27, rot: 60, len: 11 * st.k, w: 7.4 * st.k, fill: ink.leafBack }),
        leaf(ink, 'l4', { ...leather, x: 50, y: top + 15, rot: -48, len: 8, w: 5.4, fill: ink.lin('young', [[0, pal.leaf], [100, mix(pal.leaf, '#c98a7a', 0.5)]]) }),
        leaf(ink, 'l5', { ...leather, x: 50, y: top + 15, rot: 50, len: 8, w: 5.4 }),
        stem(ink, top + 6, { w: 2.2, bend: 1.8, color: wood }),
      ]
      if (!st.bloom) {
        const knobs = [[50, top + 3, 2.6], [46.4, top + 5.6, 2.1], [53.6, top + 5.6, 2.1]]
        knobs.forEach(([x, y, r], i) => parts.push(h('circle', { key: `k${i}`, cx: x, cy: y, r, fill: lighten(pal.leaf, 0.3), stroke: ink.leafLine, strokeWidth: 0.35 })))
        parts.push(dots('peek', knobs.map(([x, y]) => [x, y - 0.6]), 0.7, ink.hidden ? pal.petalDeep : pal.petal))
        return parts
      }
      parts.push(h('circle', { key: 'glow', cx: 50, cy: top, r: 10.5, fill: pal.petalDeep, opacity: 0.28 }))
      const passes = [[30, 14.2, 3.4, pal.petalDeep, 0.6], [24, 11.6, 3.4, pal.petal, 0.55], [18, 7.2, 3, lighten(pal.petal, 0.25), 0.5]]
      passes.forEach(([count, len, vary, color, w], pass) => {
        const hairs = []
        const tips = []
        for (let i = 0; i < count; i += 1) {
          const angle = (360 / count) * i + jit(i, pass) * 9 + pass * 5
          const [x1, y1] = polar(50, top, 1.4, angle)
          const [x2, y2] = polar(50, top, len + jit(i, pass + 5) * vary, angle + jit(i, pass + 9) * 6)
          hairs.push([x1, y1, x2, y2])
          tips.push([x2, y2])
        }
        parts.push(strokes(`hair${pass}`, hairs, w, ink.hidden ? [pal.petalDeep, HIDDEN_GOLD.tip, '#ffffff'][pass] : color))
        parts.push(dots(`tip${pass}`, tips, 0.48, pal.center))
      })
      parts.push(h('circle', { key: 'eye', cx: 50, cy: top, r: 1.9, fill: darken(pal.petalDeep, 0.3) }))
      return parts
    }

    /** A flat-topped cluster of upright agave florets with their protruding stamens. */
    function umbel(ink, key, x, y, s) {
      const { pal } = ink
      const parts = []
      const hairs = []
      const tips = []
      for (let i = 0; i < 6; i += 1) {
        const dx = (i - 2.5) * 1.15 * s
        const fy = y - Math.abs(i - 2.5) * -0.3 * s
        parts.push(h('ellipse', { key: i, cx: n(x + dx), cy: n(fy - 1.6 * s), rx: n(0.8 * s), ry: n(2 * s), fill: i % 2 === 0 ? pal.petal : pal.petalDeep, stroke: darken(pal.petalDeep, 0.25), strokeWidth: 0.22, transform: `rotate(${n(dx * 5)} ${n(x + dx)} ${n(fy)})` }))
        hairs.push([x + dx, fy - 3 * s, x + dx * 1.25, fy - 5.2 * s])
        tips.push([x + dx * 1.25, fy - 5.2 * s])
      }
      parts.push(strokes('h', hairs, 0.22, lighten(pal.petal, 0.3)))
      parts.push(dots('t', tips, 0.34 * s + 0.1, lighten(pal.petal, 0.45)))
      return h('g', { key }, ...parts)
    }

    function agaveRosette(ink) {
      const { pal } = ink
      const flesh = ink.lin('flesh', [[0, darken(pal.leaf, 0.26)], [100, lighten(pal.leaf, 0.2)]])
      return [0, -14, 14, -30, 30, -48, 48, -66, 66, -84, 84].map((rot, i) => blade(ink, `r${i}`, {
        x: 50 + rot * 0.03, y: GROUND_Y + 0.5, rot, len: 27 - Math.abs(rot) * 0.07, w: 7, curve: rot * 0.07,
        fill: flesh, stroke: lighten(pal.leaf, 0.42), sw: 0.55, rib: darken(pal.leaf, 0.2), spine: '#5a3b2a',
      }))
    }

    /** Agave: a rosette of armed leaves and, once in a lifetime, a tall branching mast. */
    function plantAgave(ink, st) {
      const { pal } = ink
      const top = st.top
      const mastColor = mix(pal.stem, '#bcc58c', 0.4)
      const parts = []
      if (!st.bloom) {
        parts.push(stemPath('mast', `M50,${GROUND_Y - 12}L50,${n(top - 4)}`, mastColor, 2.6))
        parts.push(petal('tip', { y: top - 2, len: 8, w: 3.6, tip: 'point', belly: 0.3, fill: lighten(pal.leaf, 0.2), stroke: ink.leafLine }))
        parts.push(strokes('scale', [[48.8, top + 8, 50, top + 6], [51.2, top + 14, 50, top + 12], [48.8, top + 20, 50, top + 18]], 0.5, ink.leafLine, 0.7))
        parts.push(...agaveRosette(ink))
        return parts
      }
      parts.push(stemPath('mast', `M50,${GROUND_Y - 12}L50,${n(top - 17)}`, mastColor, 2))
      const levels = [top + 17, top + 11, top + 5, top - 1, top - 7, top - 12]
      levels.forEach((y, i) => {
        const reach = 15.5 - i * 2.1
        for (const side of [-1, 1]) {
          const by = y + (side > 0 ? 2.4 : 0)
          const ex = 50 + side * reach
          parts.push(h('path', { key: `br${i}${side}`, d: `M50,${n(by)}Q${n(50 + side * reach * 0.6)},${n(by - 0.4)} ${n(ex)},${n(by - 3.4)}`, fill: 'none', stroke: darken(mastColor, 0.18), strokeWidth: 0.9, strokeLinecap: 'round' }))
          parts.push(umbel(ink, `u${i}${side}`, ex, by - 3.2, 1.06 - i * 0.07))
        }
      })
      parts.push(umbel(ink, 'crown', 50, top - 17, 0.72))
      parts.push(...agaveRosette(ink))
      return parts
    }

    /** Silversword: a silver sphere of sword leaves, then a column of nodding wine-red heads. */
    function plantSilversword(ink, st) {
      const { pal } = ink
      const top = st.top
      const silver = ink.lin('silver', [[0, darken(pal.leaf, 0.24)], [100, lighten(pal.leaf, 0.62)]])
      const parts = []
      const rosette = []
      for (let i = 0; i < 31; i += 1) {
        const rot = -88 + i * (176 / 30)
        rosette.push([Math.abs(rot), blade(ink, `r${i}`, {
          x: 50 + rot * 0.035, y: GROUND_Y + 1, rot, len: 16.5 + jit(i, 1) * 3 - Math.abs(rot) * 0.02, w: 2, curve: rot * 0.02,
          fill: silver, stroke: darken(pal.leaf, 0.3), sw: 0.25, plain: true,
        })])
      }
      rosette.sort((a, b) => a[0] - b[0])
      const apex = st.bloom ? top - 21 : top + 2
      const foot = GROUND_Y - 12
      parts.push(h('path', { key: 'column', d: `M47.2,${foot}L49,${n(apex)}Q50,${n(apex - 2)} 51,${n(apex)}L52.8,${foot}Z`, fill: mix(pal.stem, '#6f6a55', 0.5), stroke: darken(pal.stem, 0.3), strokeWidth: 0.4 }))
      const rays = []
      const stalks = []
      const discs = []
      const rows = Math.floor((foot - 2 - apex) / 4.4)
      for (let j = 0; j <= rows; j += 1) {
        const y = foot - 3 - j * 4.4
        const size = (st.bloom ? 1 : 0.6) * (1 - j * 0.036)
        const half = 6.6 - j * 0.36
        for (const [x, hy] of [[50 - half, y], [50 + half, y + 1.8], [50 + jit(j, 2) * 2, y - 2.2]]) {
          stalks.push([50, hy + 1.6, x, hy])
          for (let a = 0; a < 9; a += 1) rays.push([x, hy, ...polar(x, hy, 2.5 * size, a * 40 + j * 13)])
          discs.push([x, hy, size])
        }
      }
      parts.push(strokes('stalks', stalks, 0.5, darken(pal.stem, 0.25)))
      if (st.bloom) parts.push(strokes('rays', rays, 0.85, ink.hidden ? HIDDEN_GOLD.tip : pal.petal))
      parts.push(dots('discRim', discs, st.bloom ? 1.3 : 1.1, st.bloom ? pal.petalDeep : darken(pal.leaf, 0.2)))
      parts.push(dots('disc', discs, 0.8, st.bloom ? pal.center : lighten(pal.leaf, 0.3)))
      parts.push(...rosette.map(entry => entry[1]))
      return parts
    }

    /** One plumeria flower: five overlapping pinwheel petals, yellow at the throat. */
    function pinwheel(ink, key, x, y, r, spin) {
      const { pal } = ink
      const d = `M0,0C${n(-r * 0.22)},${n(-r * 0.3)} ${n(-r * 0.52)},${n(-r * 0.76)} ${n(-r * 0.2)},${n(-r)}`
        + `C${n(r * 0.3)},${n(-r * 1.06)} ${n(r * 0.64)},${n(-r * 0.7)} ${n(r * 0.44)},${n(-r * 0.34)}`
        + `C${n(r * 0.3)},${n(-r * 0.14)} ${n(r * 0.12)},${n(-r * 0.04)} 0,0Z`
      const wax = ink.tone('wax', [[0, pal.centerDeep], [16, pal.center], [36, mix(pal.center, pal.petal, 0.6)], [58, pal.petal], [100, lighten(pal.petal, 0.3)]])
      return h('g', { key },
        ...[0, 1, 2, 3, 4].map(i => h('path', { key: i, d, fill: wax, stroke: ink.line, strokeWidth: 0.36, strokeLinejoin: 'round', transform: place({ x, y, rot: i * 72 + spin }) })),
        h('circle', { cx: x, cy: y, r: r * 0.07, fill: pal.centerDeep }),
      )
    }

    /** Plumeria: waxy pinwheels clustered at the tip of a thick, scarred branch. */
    function plantPlumeria(ink, st) {
      const { pal } = ink
      const top = st.top
      const bark = mix(pal.stem, '#aaa293', 0.7)
      const fork = top + 22
      const parts = [
        stemPath('branch', `M50,${GROUND_Y}C50.6,78 49,70 50,${fork}`, bark, 3.6),
        strokes('scar', [[48.6, 80, 51.2, 79.4], [48.8, 73, 51.2, 72.4], [48.8, 66, 51.2, 65.4]], 0.4, darken(bark, 0.25), 0.7),
      ]
      ;[-100, 98, -66, 64, -34, 32].forEach((rot, i) => {
        parts.push(leaf(ink, `l${i}`, { x: 50, y: fork, rot, len: (20 + (i % 2) * 2) * st.k, w: 7.4 * st.k, tip: 'point', belly: 0.6, veins: 6, fill: i < 2 ? ink.leafBack : ink.leaf }))
      })
      parts.push(stemPath('stalk', `M50,${fork}L50,${n(top + 7)}`, pal.stem, 1.6))
      const blush = ink.lin('blush', [[0, mix(pal.petal, '#e58aa6', 0.55)], [100, pal.petal]])
      if (!st.bloom) {
        ;[-26, 0, 24].forEach((rot, i) => parts.push(petal(`b${i}`, { y: top + 9, rot, len: 9 + (i === 1 ? 2 : 0), w: 3, tip: 'round', belly: 0.66, fill: blush, stroke: ink.line })))
        return parts
      }
      parts.push(petal('b0', { x: 45, y: top + 4, rot: -16, len: 15, w: 3, tip: 'round', belly: 0.68, fill: blush, stroke: ink.line }))
      parts.push(petal('b1', { x: 56, y: top + 4, rot: 13, len: 16, w: 3.2, tip: 'round', belly: 0.68, fill: blush, stroke: ink.line }))
      parts.push(pinwheel(ink, 'f1', 40, top + 6.6, 9.8, 22))
      parts.push(pinwheel(ink, 'f2', 60.4, top + 7.4, 9.4, -14))
      parts.push(pinwheel(ink, 'f0', 50, top - 0.6, 13, 8))
      return parts
    }

    // ── lakeside ──────────────────────────────────────────────────────────

    /** Pickerelweed's leaf: a long heart with veins that follow the margin. */
    function arrowLeaf(ink, key, x, y, rot, s, back) {
      return h('g', { key, transform: `${place({ x, y, rot })} scale(${s})` },
        h('path', { d: 'M0,0C-3,3.2 -7.8,2 -7.2,-5C-6.6,-13 -2.6,-21 0,-25C2.6,-21 6.6,-13 7.2,-5C7.8,2 3,3.2 0,0Z', fill: back ? ink.leafBack : ink.leaf, stroke: ink.leafLine, strokeWidth: 0.4, strokeLinejoin: 'round' }),
        h('path', { d: 'M0,0L0,-23M0,-1C-4,-3 -5,-12 -1.4,-21M0,-1C4,-3 5,-12 1.4,-21M0,-1C-2,-5 -2.6,-12 -.6,-20M0,-1C2,-5 2.6,-12 .6,-20', fill: 'none', stroke: ink.rib, strokeWidth: 0.3, opacity: 0.7 }),
        h('path', { d: 'M-4.6,-5Q-4.8,-11 -2.6,-16', fill: 'none', stroke: '#ffffff', strokeWidth: 1, strokeLinecap: 'round', opacity: 0.28 }),
      )
    }

    /** Pickerelweed: a blunt spike of violet-blue flowers, each upper lip marked yellow. */
    function plantPickerel(ink, st) {
      const { pal } = ink
      const top = st.top
      const parts = [
        stemPath('petL', `M47,${GROUND_Y}C44,77 39.4,70 36.4,${n(top + 27)}`, pal.stem, 1.8),
        arrowLeaf(ink, 'leafL', 36.4, top + 27, -22, st.k, false),
        stemPath('petR', `M53,${GROUND_Y}C56,80 60,76 63,${n(top + 36)}`, pal.stem, 1.5),
        arrowLeaf(ink, 'leafR', 63, top + 36, 30, 0.66 * st.k, true),
        stem(ink, top + 12, { w: 2, bend: 1.2 }),
        blade(ink, 'sheath', { x: 50, y: top + 30, rot: 7, len: 13, w: 3.6, curve: 2.4, plain: true }),
      ]
      const rows = st.bloom ? 11 : 6
      const foot = top + 12.4
      const tip = st.bloom ? top - 13 : top + 1
      parts.push(h('path', { key: 'axis', d: `M46.4,${n(foot)}Q46,${n((foot + tip) / 2)} 50,${n(tip - 1)}Q54,${n((foot + tip) / 2)} 53.6,${n(foot)}Z`, fill: st.bloom ? darken(pal.petalDeep, 0.22) : darken(pal.leaf, 0.12) }))
      const spots = []
      for (let r = 0; r < rows; r += 1) {
        const t = r / (rows - 1)
        const y = foot - (foot - tip) * t
        const half = 4.2 * (1 - t * t * 0.78)
        const closed = !st.bloom || t > 0.72
        for (const [j, c] of [[0, -1], [1, 1], [2, 0]]) {
          const x = 50 + c * half + jit(r * 3 + j, 1) * 0.8
          const cy = y - (j === 2 ? 1.3 : 0) + jit(r * 3 + j, 2) * 0.6
          const tone = closed
            ? (st.bloom ? pal.petalDeep : mix(pal.leaf, pal.petal, 0.35))
            : [pal.petal, lighten(pal.petal, 0.22), mix(pal.petal, pal.petalDeep, 0.6)][(r + j) % 3]
          parts.push(h('ellipse', {
            key: `f${r}-${j}`, cx: n(x), cy: n(cy), rx: closed ? 1.2 : 2, ry: closed ? 1.7 : 1.6,
            fill: ink.hidden ? ink.petal : tone, stroke: darken(pal.petalDeep, 0.3), strokeWidth: 0.25,
            transform: `rotate(${n(c * 24 + jit(r + j, 3) * 30)} ${n(x)} ${n(cy)})`,
          }))
          if (!closed && (r + j) % 2 === 0) spots.push([x, cy - 0.4])
        }
      }
      if (spots.length > 0) parts.push(dots('spots', spots, 0.42, '#f4d64e'))
      return parts
    }

    /** A loosestrife spire: whorled six-petalled stars, still in bud toward the tip. */
    function starSpire(ink, key, x0, y0, x1, y1, rows, s, open) {
      const { pal } = ink
      const parts = [h('path', {
        key: 'axis', d: `M${n(x0 - 2.2 * s)},${n(y0)}L${n(x1)},${n(y1 - 2)}L${n(x0 + 2.2 * s)},${n(y0)}Z`,
        fill: mix(pal.leaf, pal.petalDeep, open ? 0.45 : 0.15),
      })]
      const light = []
      const dark = []
      const eyes = []
      const buds = []
      for (let r = 0; r < rows; r += 1) {
        const t = r / (rows - 1)
        const cx = x0 + (x1 - x0) * t
        const cy = y0 + (y1 - y0) * t
        const half = 3.6 * s * (1 - t * 0.72)
        const size = 2.2 * s * (1 - t * 0.3)
        for (const [j, c] of [[0, -1], [1, 1], [2, 0.1]]) {
          const x = cx + c * half + jit(r * 3 + j, 4) * 0.7
          const y = cy - (j === 2 ? 1.4 : 0) + jit(r * 3 + j, 5) * 0.8
          if (!open || t > 0.74) {
            buds.push([x, y])
            continue
          }
          const target = (r + j) % 2 === 0 ? light : dark
          for (let a = 0; a < 6; a += 1) target.push([x, y, ...polar(x, y, size, a * 60 + r * 17)])
          eyes.push([x, y])
        }
      }
      parts.push(strokes('dark', dark, 0.95 * s, ink.hidden ? HIDDEN_GOLD.tip : pal.petalDeep))
      parts.push(strokes('light', light, 0.95 * s, ink.hidden ? '#ffffff' : pal.petal))
      parts.push(dots('eyes', eyes, 0.5 * s, '#f3d86e'))
      parts.push(dots('buds', buds, 0.9 * s, open ? darken(pal.petalDeep, 0.1) : mix(pal.leaf, pal.petal, 0.4)))
      return h('g', { key }, ...parts)
    }

    function plantLoosestrife(ink, st) {
      const { pal } = ink
      const top = st.top
      const foot = top + 17
      const parts = []
      for (let i = 0; i < 4; i += 1) {
        const y = GROUND_Y - 5 - i * ((GROUND_Y - 9 - foot) / 3.4)
        for (const side of [-1, 1]) {
          parts.push(leaf(ink, `l${i}${side}`, { x: 50, y, rot: side * (64 - i * 5), len: 11.5 - i * 1.2, w: 3.2, veins: 0, fill: side < 0 ? ink.leafBack : ink.leaf }))
        }
      }
      parts.push(stemPath('sideStem', `M50,${n(top + 34)}C54,${n(top + 28)} 59.6,${n(top + 22)} 61,${n(top + 13)}`, pal.stem, 1.1))
      parts.push(stem(ink, foot, { w: 1.9, bend: 1 }))
      parts.push(starSpire(ink, 'sideSpire', 61, top + 13, 62.6, st.bloom ? top - 5 : top + 5, st.bloom ? 7 : 4, 0.72, st.bloom))
      parts.push(starSpire(ink, 'spire', 50, foot, 50, st.bloom ? top - 18 : top - 2, st.bloom ? 13 : 7, 1, st.bloom))
      return parts
    }

    /** Yellow flag: three broad falls marked with brown veins, three small standards. */
    function plantIris(ink, st) {
      const { pal } = ink
      const top = st.top
      const parts = [
        blade(ink, 's0', { x: 50, y: GROUND_Y, rot: 3, len: 37 * st.k, w: 4.8, curve: 2, fill: ink.leafBack }),
        blade(ink, 's1', { x: 46, y: GROUND_Y, rot: -8, len: 44 * st.k, w: 4.8, curve: -3 }),
        blade(ink, 's2', { x: 54, y: GROUND_Y, rot: 10, len: 40 * st.k, w: 4.6, curve: 4, fill: ink.leafBack }),
        blade(ink, 's3', { x: 47, y: GROUND_Y, rot: -22, len: 27 * st.k, w: 4.4, curve: -6 }),
        blade(ink, 's4', { x: 53, y: GROUND_Y, rot: 24, len: 25 * st.k, w: 4.4, curve: 7 }),
        stem(ink, top + 7, { w: 2.2, bend: 1.2 }),
      ]
      if (!st.bloom) {
        parts.push(petal('tip', { y: top + 6, len: 13, w: 4.6, tip: 'point', belly: 0.5, fill: ink.petal, stroke: ink.line }))
        parts.push(petal('spathe', { y: top + 8, rot: -6, len: 10, w: 5.4, tip: 'point', belly: 0.42, fill: ink.leaf, stroke: ink.leafLine }))
        return parts
      }
      parts.push(petal('spathe', { x: 50, y: top + 15, rot: 30, len: 10, w: 3.6, tip: 'point', belly: 0.45, fill: ink.leaf, stroke: ink.leafLine }))
      const fall = ink.tone('fall', [[0, mix(pal.petal, '#d08a1a', 0.5)], [36, pal.petal], [100, lighten(pal.petal, 0.3)]])
      const signal = ink.hidden ? '#c9a45a' : '#7a4a16'
      const drawFall = (key, rot, len, w) => h('g', { key, transform: place({ y: top + 1, rot }) },
        h('path', { d: petalD(len, w, 'round', 0.7), fill: fall, stroke: ink.line, strokeWidth: 0.4, strokeLinejoin: 'round' }),
        h('ellipse', { cx: 0, cy: n(-len * 0.4), rx: n(w * 0.26), ry: n(len * 0.2), fill: mix(pal.petal, '#d98a1e', ink.hidden ? 0.15 : 0.55), opacity: 0.8 }),
        strokes('sig', [-0.34, -0.17, 0, 0.17, 0.34].map(f => [0, -len * 0.14, f * w, -len * (0.58 - Math.abs(f) * 0.3)]), 0.3, signal, 0.75),
      )
      for (const rot of [-25, 0, 25]) {
        parts.push(petal(`std${rot}`, { y: top, rot, len: 11.5, w: 4.8, tip: 'point', belly: 0.55, fill: ink.back, stroke: ink.line, vein: ink.line }))
      }
      parts.push(drawFall('fallL', -112, 18.5, 10.5))
      parts.push(drawFall('fallR', 112, 18.5, 10.5))
      for (const rot of [-64, 64]) {
        parts.push(petal(`arm${rot}`, { y: top + 0.6, rot, len: 8, w: 4.6, tip: 'notch', belly: 0.7, fill: ink.hidden ? ink.petal : lighten(pal.petal, 0.2), stroke: ink.line }))
      }
      parts.push(drawFall('fallC', 180, 18, 14.5))
      parts.push(petal('armC', { y: top - 0.6, rot: 180, len: 6.4, w: 5, tip: 'notch', belly: 0.7, fill: ink.hidden ? ink.petal : lighten(pal.petal, 0.2), stroke: ink.line }))
      return parts
    }

    /** Water lily: a floating, notched pad and a bowl of pointed petals round golden stamens. */
    function plantWaterlily(ink, st) {
      const { pal } = ink
      const padFill = ink.lin('pad', [[0, darken(pal.leaf, 0.2)], [100, lighten(pal.leaf, 0.16)]], { x1: '1', y1: '0.5', x2: '0', y2: '0.3' })
      const parts = [
        h('ellipse', { key: 'pad2', cx: 27, cy: 76, rx: 10, ry: 3.2, fill: ink.leafBack, stroke: ink.leafLine, strokeWidth: 0.35 }),
        h('ellipse', { key: 'pad', cx: 50, cy: 81, rx: 25, ry: 7.4, fill: padFill, stroke: ink.leafLine, strokeWidth: 0.45 }),
        h('path', { key: 'cut', d: 'M50,81L65,89.4 72.6,86.2Z', fill: LAKE }),
        strokes('veins', [-150, -110, -70, -30, 10, 150].map(a => [50, 81, 50 + 22 * Math.sin((a * Math.PI) / 180), 81 - 6.4 * Math.cos((a * Math.PI) / 180)]), 0.3, ink.rib, 0.6),
        h('path', { key: 'rim', d: 'M27,79.4C32,75.4 42,74 52,74.2', fill: 'none', stroke: '#ffffff', strokeWidth: 0.7, strokeLinecap: 'round', opacity: 0.3 }),
      ]
      if (!st.bloom) {
        parts.push(bud(ink, 'bud', 50, 79, { len: 16, w: 8.4, rot: 3 }))
        return parts
      }
      const row = (key, rots, len, w, y, fill, extra) => rots.forEach((rot, i) => parts.push(petal(`${key}${i}`, {
        y, rot, len: len + jit(i, len) * 1.2, w, tip: 'point', belly: 0.5, fill, stroke: ink.line, vein: ink.line, veinOpacity: 0.28, ...extra,
      })))
      row('b', [-54, -36, -18, 0, 18, 36, 54], 23, 7.8, 75, ink.back)
      row('m', [-68, -42, -15, 15, 42, 68], 20, 7.8, 76, ink.petal)
      const hairs = []
      const tips = []
      for (let i = 0; i < 15; i += 1) {
        const [x, y] = polar(50, 73, 7 + jit(i, 2) * 2.4, -46 + i * 6.6)
        hairs.push([50, 73, x, y])
        tips.push([x, y])
      }
      parts.push(strokes('stamen', hairs, 0.9, pal.center))
      parts.push(dots('anther', tips, 0.55, pal.centerDeep))
      const lit = ink.tone('lit', [[0, pal.petalDeep], [40, lighten(pal.petal, 0.2)], [100, lighten(pal.petal, 0.55)]])
      row('s', [-90, 90], 21, 7.6, 77, ink.petal)
      row('q', [-106, 106], 16, 6.6, 77.6, ink.back)
      row('f', [-50, -25, 0, 25, 50], 10.5, 7.6, 78.4, lit, { sheen: true })
      return parts
    }

    /** A lotus leaf seen from the side: a round, wavy-rimmed shield on its own stalk. */
    function shieldLeaf(ink, key, x, y, rx, ry, tilt) {
      const rim = []
      const veins = []
      for (let i = 0; i < 36; i += 1) {
        const a = (i / 36) * Math.PI * 2
        const wave = 1 + 0.045 * Math.sin(i * 1.75)
        rim.push(`${n(rx * wave * Math.cos(a))},${n(ry * wave * Math.sin(a))}`)
        if (i % 3 === 0) veins.push([0, -ry * 0.15, rx * 0.92 * Math.cos(a), ry * 0.92 * Math.sin(a)])
      }
      const fill = ink.rad('shield', [[0, darken(ink.pal.leaf, 0.3)], [22, ink.pal.leaf], [100, lighten(ink.pal.leaf, 0.12)]], { cx: '50%', cy: '42%', r: '60%' })
      return h('g', { key, transform: `translate(${x} ${n(y)}) rotate(${tilt})` },
        h('path', { d: `M${rim.join('L')}Z`, fill, stroke: ink.leafLine, strokeWidth: 0.45, strokeLinejoin: 'round' }),
        strokes('v', veins, 0.3, ink.rib, 0.6),
        h('path', { d: `M${n(-rx * 0.8)},${n(-ry * 0.3)}Q${n(-rx * 0.3)},${n(-ry * 0.95)} ${n(rx * 0.4)},${n(-ry * 0.78)}`, fill: 'none', stroke: '#ffffff', strokeWidth: 0.7, strokeLinecap: 'round', opacity: 0.3 }),
      )
    }

    /** Lotus: held high above the water, petals pale at the base and rose at the tip. */
    function plantLotus(ink, st) {
      const { pal } = ink
      const top = st.top
      const base = top + 11
      const parts = [
        stemPath('leafStalk', `M41,${GROUND_Y}C40,79 35,72 33.4,${n(top + 25)}`, pal.stem, 1.7),
        shieldLeaf(ink, 'leaf', 33, top + 24, 15.5 * st.k, 5.6 * st.k, -7),
        stemPath('stalk', `M56,${GROUND_Y}C57,75 51,64 50,${n(base + 1)}`, pal.stem, 2),
        dots('prickle', [[55.6, 80], [54.2, 73], [52.2, 66]], 0.35, darken(pal.stem, 0.3)),
      ]
      const blush = ink.tone('blush', [[0, lighten(pal.petal, 0.8)], [44, lighten(pal.petal, 0.36)], [82, pal.petal], [100, pal.petalDeep]])
      const shade = ink.hidden ? ink.back : ink.lin('shade', [[0, lighten(pal.petal, 0.55)], [50, pal.petal], [100, darken(pal.petalDeep, 0.1)]])
      if (!st.bloom) {
        parts.push(bud(ink, 'bud', 50, base + 1, { len: 18, w: 10, fill: blush }))
        return parts
      }
      parts.push(stemPath('budStalk', `M60,${GROUND_Y}C62,77 66,68 66.6,${n(top + 24)}`, pal.stem, 1.3))
      parts.push(bud(ink, 'sideBud', 66.6, top + 24, { len: 11, w: 6, rot: 6, fill: blush }))
      const row = (key, rots, len, w, y, fill, extra) => rots.forEach((rot, i) => parts.push(petal(`${key}${i}`, {
        y, rot, len, w, tip: 'point', belly: 0.52, fill, stroke: ink.line, vein: ink.line, veinOpacity: 0.3, ...extra,
      })))
      row('d', [-114, 114], 16.5, 8.4, base, shade)
      row('b', [-38, -19, 0, 19, 38], 24, 10, base, shade)
      row('s', [-80, 80], 20.5, 9.4, base, blush)
      row('m', [-59, 59], 23, 10, base, blush)
      const hairs = []
      for (let i = 0; i < 17; i += 1) hairs.push([50, top + 6, ...polar(50, top + 6, 7 + jit(i, 3) * 2, -80 + i * 10)])
      parts.push(strokes('stamen', hairs, 0.6, '#f3d76a'))
      parts.push(h('path', { key: 'cone', d: `M45,${n(top - 1)}L48,${n(top + 7)}L52,${n(top + 7)}L55,${n(top - 1)}Z`, fill: mix(pal.center, '#a9b85a', 0.55), stroke: '#8a9a44', strokeWidth: 0.3 }))
      parts.push(h('ellipse', { key: 'pod', cx: 50, cy: top - 1, rx: 5, ry: 2.3, fill: pal.center, stroke: pal.centerDeep, strokeWidth: 0.4 }))
      parts.push(dots('seeds', [[47.4, top - 1], [50, top - 1.8], [52.6, top - 1], [48.8, top - 0.2], [51.2, top - 0.2]], 0.42, pal.centerDeep))
      row('f', [-31, 31], 12.5, 9.6, base + 1, blush, { sheen: true })
      row('c', [0], 9.6, 10, base + 1.4, blush)
      return parts
    }

    /** One drawing routine per `species.head`; each handles the bud and the open flower. */
// Common drawing vocabulary; each species below has its own habit and floral geometry.
function nfRay(ink, key, x, y, count, len, width, options = {}) {
  return Array.from({ length: count }, (_, i) => petal(`${key}${i}`, {
    x, y, rot: i * 360 / count + (options.offset ?? 0), len: len + jit(i, 4) * .9, w: width,
    fill: options.fill ?? ink.petal, stroke: ink.line, vein: ink.line, veinOpacity: .25,
    tip: options.tip ?? 'round', ...options,
  }))
}
function nfCore(ink, key, x, y, r) {
  return h('g', { key }, h('circle', { cx: x, cy: y, r, fill: ink.core, stroke: ink.pal.centerDeep, strokeWidth: .35 }),
    dots('pollen', Array.from({ length: 13 }, (_, i) => polar(x, y, r * Math.sqrt((i + .4) / 13), i * 137.5)), .38, lighten(ink.pal.center, .4)))
}
function nfFern(ink, key, x, y, len, rotation) {
  return h('g', { key, transform: place({ x, y, rot: rotation }) },
    stemPath('axis', `M0,0Q2,${-len / 2} 0,${-len}`, ink.pal.stem, .65),
    ...Array.from({ length: 7 }, (_, i) => h('g', { key: i },
      leaf(ink, 'l', { x: 1, y: -i * len / 8, len: (len - i * len / 8) * .45, w: 2.7, rot: -65, veins: 0 }),
      leaf(ink, 'r', { x: 1, y: -i * len / 8, len: (len - i * len / 8) * .45, w: 2.7, rot: 65, veins: 0 }))))
}
function nfHeartLeaf(ink, key, x, y, scale, rotation = 0) {
  return h('g', { key, transform: `${place({ x, y, rot: rotation })} scale(${scale})` },
    h('path', { d: 'M0,0C-19,-4 -23,-17 -13,-21C-6,-24 -2,-17 0,-14C2,-17 7,-24 14,-20C24,-14 15,-4 0,0Z', fill: ink.leaf, stroke: ink.leafLine, strokeWidth: .5 }),
    h('path', { d: 'M0,0L0,-14M0,-5L-12,-16M0,-7L12,-16', fill: 'none', stroke: ink.rib, strokeWidth: .55 }))
}
const NEW_PLANTS = {
  cosmos(ink, st) {
    const y = st.top, parts = [stem(ink, y, { w: 1.5, bend: 4 }), nfFern(ink, 'left', 49, 75, 24, -61), nfFern(ink, 'right', 52, 67, 22, 57)]
    if (!st.bloom) return [...parts, bud(ink, 'bud', 50, y + 3, { len: 11, w: 7 })]
    parts.push(...nfRay(ink, 'ray', 50, y, 8, 21, 12, { tip: 'notch', offset: 22.5 }), nfCore(ink, 'disk', 50, y, 4.8))
    return parts
  },
  zinnia(ink, st) {
    const y = st.top + 2, parts = [stem(ink, y + 7, { w: 3 }), leaf(ink, 'l', { x: 50, y: 73, len: 24, w: 12, rot: -58, veins: 5 }), leaf(ink, 'r', { x: 51, y: 73, len: 24, w: 12, rot: 58, veins: 5 })]
    if (!st.bloom) return [...parts, bud(ink, 'bud', 50, y + 7, { len: 13, w: 12 })]
    for (let row = 0; row < 4; row++) parts.push(...nfRay(ink, `r${row}`, 50, y - row * 1.3, 14 - row * 2, 21 - row * 4, 7.4 - row * .8, { offset: row * 13, fill: row % 2 ? ink.petal : ink.back }))
    parts.push(nfCore(ink, 'disk', 50, y - 3, 4), ...nfRay(ink, 'florets', 50, y - 3, 7, 5, 2.3, { fill: ink.core }))
    return parts
  },
  cornflower(ink, st) {
    const y = st.top, parts = [stem(ink, y + 8, { w: 1.7 }), leaf(ink, 'l', { x: 50, y: 77, len: 27, w: 5, rot: -24 }), leaf(ink, 'r', { x: 51, y: 65, len: 22, w: 4, rot: 40 })]
    parts.push(h('ellipse', { key: 'involucre', cx: 50, cy: y + 6, rx: 7, ry: 9, fill: ink.leaf, stroke: ink.leafLine, strokeWidth: .5 }))
    for (let i = 0; i < 9; i++) parts.push(h('path', { key: `scale${i}`, d: `M${45 + i % 3 * 4},${y + 1 + Math.floor(i / 3) * 4}l2,-2 2,2 -2,3Z`, fill: ink.leafBack, stroke: '#5b4f3f', strokeWidth: .4 }))
    if (!st.bloom) return [...parts, bud(ink, 'bud', 50, y + 1, { len: 10, w: 6 })]
    for (let i = 0; i < 10; i++) parts.push(h('path', { key: `funnel${i}`, transform: place({ x: 50, y: y - 1, rot: i * 36 }), d: 'M-1,0L-3,-10 -8,-16 -6,-19 -2,-15 0,-22 2,-15 6,-19 8,-16 3,-10 1,0Z', fill: ink.petal, stroke: ink.line, strokeWidth: .45 }))
    parts.push(...nfRay(ink, 'corefloret', 50, y - 1, 14, 7, 2, { fill: ink.back }), nfCore(ink, 'eye', 50, y - 1, 2.6))
    return parts
  },
  calendula(ink, st) {
    const y = st.top + 3, parts = [stem(ink, y, { w: 2.7 }), leaf(ink, 'l', { x: 49, y: 82, len: 27, w: 12, rot: -55, tip: 'round', belly: .68 }), leaf(ink, 'r', { x: 51, y: 69, len: 21, w: 10, rot: 49, tip: 'round', belly: .7 })]
    if (!st.bloom) return [...parts, bud(ink, 'bud', 50, y, { len: 12, w: 9 })]
    parts.push(...nfRay(ink, 'outer', 50, y, 25, 21, 4.4), ...nfRay(ink, 'inner', 50, y, 19, 15, 4, { offset: 7, fill: ink.back }), nfCore(ink, 'disk', 50, y, 6.7))
    return parts
  },
  snapdragon(ink, st) {
    const top = st.top - 14, parts = [stem(ink, top + 2, { w: 2.2 })]
    for (let i = 0; i < 4; i++) for (const side of [-1, 1]) parts.push(leaf(ink, `leaf${i}:${side}`, { x: 50, y: 83 - i * 7, len: 18 - i * 2, w: 5, rot: side * 65 }))
    const count = st.bloom ? 8 : 4
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? 1 : -1, x = 50 + side * (7 - i * .35), y = top + 39 - i * 5.5
      parts.push(stemPath(`pedicel${i}`, `M50,${y + 2}L${x},${y}`, ink.pal.stem, .7))
      if (!st.bloom || i > 5) parts.push(bud(ink, `bud${i}`, x, y, { len: 6, w: 4, rot: side * 30 }))
      else parts.push(h('g', { key: `mouth${i}`, transform: `translate(${x} ${y}) scale(${side} 1)` },
        h('path', { d: 'M-3,3Q-6,-2 -3,-7Q3,-12 9,-7L10,-2Q5,0 3,-2Q8,2 11,3Q11,9 5,8Q-1,9 -3,3Z', fill: ink.petal, stroke: ink.line, strokeWidth: .5 }),
        h('path', { d: 'M1,0Q5,-2 9,1', fill: 'none', stroke: ink.pal.center, strokeWidth: 2.2 })))
    }
    return parts
  },
  crocus(ink, st) {
    const y = st.top + 20, parts = []
    for (let i = 0; i < 7; i++) parts.push(blade(ink, `leaf${i}`, { x: 50, y: 90, len: 34 + i % 3 * 7, w: 2.4, curve: (i - 3) * 6, rib: '#e6e8d0' }))
    parts.push(stem(ink, y, { w: 2, by: 88 }))
    if (!st.bloom) return [...parts, bud(ink, 'bud', 50, y + 2, { len: 19, w: 7 })]
    for (const angle of [-28, 0, 28]) parts.push(petal(`back${angle}`, { x: 50, y: y + 8, rot: angle, len: 29, w: 14, fill: ink.back, stroke: ink.line, vein: ink.line }))
    parts.push(strokes('anthers', [[48, y - 1, 46, y - 9], [50, y - 1, 50, y - 12], [52, y - 1, 54, y - 9]], 1.6, ink.pal.center))
    for (const angle of [-62, 62]) parts.push(petal(`front${angle}`, { x: 50, y: y + 8, rot: angle, len: 21, w: 12, fill: ink.petal, stroke: ink.line, vein: ink.line }))
    parts.push(petal('centre', { x: 50, y: y + 8, len: 14, w: 16, fill: ink.petal, stroke: ink.line }))
    return parts
  },
  daffodil(ink, st) {
    const y = st.top + 3, parts = [stemPath('scape', `M48,90L48,${y + 6}Q48,${y - 5} 54,${y}`, ink.pal.stem, 2)]
    for (let i = 0; i < 5; i++) parts.push(blade(ink, `leaf${i}`, { x: 50, y: 90, len: 42 + i % 2 * 10, w: 4.2, curve: (i - 2) * 7 }))
    if (!st.bloom) return [...parts, bud(ink, 'bud', 54, y + 5, { rot: 55, len: 16, w: 7 })]
    parts.push(...nfRay(ink, 'tepal', 52, y, 6, 22, 13, { offset: 30, tip: 'point' }))
    parts.push(h('path', { key: 'trumpet', d: `M47,${y - 4}L41,${y + 8}Q51,${y + 17} 63,${y + 8}L57,${y - 4}Z`, fill: ink.core, stroke: ink.pal.centerDeep, strokeWidth: .6 }),
      h('ellipse', { key: 'rim', cx: 52, cy: y + 8, rx: 11, ry: 5.2, fill: ink.pal.centerDeep, stroke: ink.pal.center, strokeWidth: 2 }), dots('pollen', [[49,y+8],[52,y+7],[55,y+8]], .6, lighten(ink.pal.center,.4)))
    return parts
  },
  primrose(ink, st) {
    const parts = []
    for (let i = 0; i < 8; i++) parts.push(leaf(ink, `rosette${i}`, { x: 50, y: 88, len: 27, w: 13, rot: -85 + i * 24, shape: 'serrate', veins: 7, tip: 'round' }))
    for (const [i,x,y] of [[0,35,st.top+16],[1,53,st.top+2],[2,68,st.top+20]]) {
      parts.push(stem(ink, y, { key: `stem${i}`, x, bx: 50, w: 1.2 }))
      if (!st.bloom) parts.push(bud(ink, `bud${i}`, x, y + 3, { len: 8, w: 5 }))
      else parts.push(...nfRay(ink, `p${i}`, x, y, 5, 12, 10, { tip: 'notch', offset: i * 15 }), nfCore(ink, `eye${i}`, x, y, 2.8))
    }
    return parts
  },
  pansy(ink, st) {
    const y = st.top + 8, parts = [stem(ink, y, { w: 1.7, bend: 5 }), leaf(ink, 'left', { x: 50, y: 81, len: 22, w: 12, rot: -55, shape: 'serrate' }), leaf(ink, 'right', { x: 52, y: 70, len: 18, w: 10, rot: 52, shape: 'serrate' })]
    if (!st.bloom) return [...parts, bud(ink, 'bud', 50, y, { len: 10, w: 7, rot: -15 })]
    for (const [i,rot,len,w] of [[0,-27,24,19],[1,27,24,19],[2,-88,20,17],[3,88,20,17],[4,180,24,27]]) {
      parts.push(petal(`petal${i}`, { x: 50, y, rot, len, w, fill: i < 2 ? ink.back : ink.petal, stroke: ink.line, tip: 'round' }))
      if (i > 1) parts.push(petal(`face${i}`, { x: 50, y, rot, len: len*.6, w: w*.42, fill: ink.hidden ? ink.back : ink.pal.centerDeep, opacity: .75 }))
    }
    parts.push(h('path', { key: 'eye', d: `M46,${y}Q50,${y-4} 54,${y}Q50,${y+5} 46,${y}`, fill: ink.pal.center }))
    return parts
  },
  bleedingheart(ink, st) {
    const top = st.top, parts = [stemPath('arch', `M47,90C45,62 33,${top-7} 74,${top+6}`, ink.pal.stem, 1.7), nfFern(ink, 'l', 48, 82, 30, -58), nfFern(ink, 'r', 49, 76, 29, 64)]
    for (let i = 0; i < 5; i++) {
      const x = 35 + i * 9, y = top + 8 + (i - 1) * (i - 1) * .8
      parts.push(stemPath(`hang${i}`, `M${x},${y-7}L${x},${y+1}`, ink.pal.stem, .65))
      if (!st.bloom) parts.push(bud(ink, `bud${i}`, x, y + 8, { len: 9, w: 5, rot: 180 }))
      else parts.push(h('g', { key: `heart${i}`, transform: `translate(${x} ${y}) scale(${1-i*.07})` },
        h('path', { d: 'M0,12C-3,7 -10,3 -8,-3C-6,-8 -1,-6 0,-2C1,-6 6,-8 8,-3C10,3 3,7 0,12Z', fill: ink.petal, stroke: ink.line, strokeWidth: .5 }),
        h('path', { d: 'M0,6C-1,10 -4,13 0,17C4,13 1,10 0,6Z', fill: ink.hidden ? ink.petal : ink.pal.center, stroke: ink.line, strokeWidth: .35 })))
    }
    return parts
  },
  hibiscus(ink, st) {
    const y = st.top + 3, parts = [stem(ink, y + 7, { w: 3, color: '#82775b' }), leaf(ink, 'left', { x: 50, y: 78, len: 26, w: 17, rot: -60, shape: 'serrate', veins: 5 }), leaf(ink, 'right', { x: 51, y: 67, len: 22, w: 14, rot: 55, shape: 'serrate' })]
    if (!st.bloom) return [...parts, bud(ink, 'bud', 50, y + 3, { len: 18, w: 8 })]
    parts.push(...nfRay(ink, 'petal', 50, y, 5, 27, 25, { offset: 18, tip: 'round' }), h('circle', { key: 'throat', cx: 50, cy: y, r: 5, fill: ink.back }))
    parts.push(stemPath('column', `M50,${y}Q54,${y-8} 66,${y-18}`, ink.pal.center, 1.6))
    const pollen = Array.from({ length: 14 }, (_, i) => [54 + i * .7 + (i%2 ? 2 : -1), y - 6 - i * .7])
    parts.push(dots('anthers', pollen, .85, ink.pal.center), strokes('stigmas', [[65,y-17,65,y-22],[65,y-17,69,y-20],[65,y-17,70,y-16]], .6, ink.line), dots('tips', [[65,y-22],[69,y-20],[70,y-16]], 1, ink.pal.petalDeep))
    return parts
  },
  birdofparadise(ink, st) {
    const y = st.top + 5, parts = [stem(ink, y + 5, { w: 3 }), stemPath('leafstem1','M45,90L29,64',ink.pal.stem,1.8), stemPath('leafstem2','M52,90L71,58',ink.pal.stem,1.8), leaf(ink,'leaf1',{x:29,y:64,len:34,w:17,rot:-22,veins:8,sheen:true}), leaf(ink,'leaf2',{x:71,y:58,len:38,w:18,rot:18,veins:8,sheen:true})]
    parts.push(h('path',{key:'spathe',d:`M32,${y+7}Q48,${y+2} 78,${y+2}Q66,${y+13} 44,${y+13}Z`,fill:ink.leafBack,stroke:ink.leafLine,strokeWidth:.6}))
    if (!st.bloom) return parts
    for (const [i,x,rot,len] of [[0,47,-24,29],[1,53,-6,35],[2,60,17,28]]) parts.push(petal(`orange${i}`,{x,y:y+6,rot,len,w:7,tip:'point',fill:ink.petal,stroke:ink.line,vein:ink.line}))
    parts.push(h('path',{key:'blue',d:`M48,${y+6}Q66,${y-11} 81,${y-8}L64,${y+4}L59,${y+8}Z`,fill:ink.hidden?ink.petal:ink.pal.center,stroke:ink.hidden?ink.line:ink.pal.centerDeep,strokeWidth:.5}))
    return parts
  },
  gazania(ink, st) {
    const y = st.top + 9, parts = [stem(ink,y,{w:1.8})]
    for(let i=0;i<7;i++) parts.push(leaf(ink,`leaf${i}`,{x:50,y:89,len:30,w:7,rot:-78+i*26,shape:'pinnate',veins:2,fill:i%2?ink.leaf:ink.leafBack}))
    if(!st.bloom) return [...parts,bud(ink,'bud',50,y+2,{len:12,w:7})]
    parts.push(...nfRay(ink,'ray',50,y,16,23,6.4,{tip:'point'}))
    for(let i=0;i<16;i++) parts.push(petal(`mark${i}`,{x:50,y,rot:i*22.5,len:12,w:4,fill:ink.hidden?ink.back:ink.pal.centerDeep,opacity:.85}))
    parts.push(nfCore(ink,'disk',50,y,6.5))
    return parts
  },
  redhotpoker(ink, st) {
    const top=st.top-16, parts=[stem(ink,top+39,{w:2.5})]
    for(let i=0;i<8;i++) parts.push(blade(ink,`leaf${i}`,{x:50,y:90,len:38+i%3*7,w:3.4,curve:(i-3.5)*7}))
    const fill=ink.tone('torch',[[0,ink.pal.center],[45,ink.pal.petal],[100,ink.pal.petalDeep]])
    for(let row=0;row<(st.bloom?9:5);row++) {
      const width=3+Math.sin(row/10*Math.PI)*6, y=top+row*4
      for(let col=-1;col<=1;col++) parts.push(h('path',{key:`tube${row}:${col}`,d:`M${50+col*width-2},${y}q-1,4 0,8q2,2 4,0q1,-4 0,-8Z`,fill:st.bloom?fill:ink.back,stroke:ink.line,strokeWidth:.35}))
    }
    return parts
  },
  desertrose(ink, st) {
    const y=st.top+5, parts=[h('path',{key:'caudex',d:`M35,89Q42,78 43,65L40,${y+15}L47,${y+12}L51,64L59,${y+11}L64,${y+15}L56,67Q57,80 66,89Q52,95 35,89Z`,fill:ink.pal.stem,stroke:darken(ink.pal.stem,.3),strokeWidth:.7}),h('path',{key:'bark',d:'M44,70Q47,82 41,88M52,73Q51,85 57,90',fill:'none',stroke:lighten(ink.pal.stem,.2),strokeWidth:1.4})]
    for(const [i,x,rot] of [[0,42,-55],[1,44,10],[2,60,50],[3,59,-12]]) parts.push(leaf(ink,`leaf${i}`,{x,y:y+20,len:19,w:9,rot,tip:'round',sheen:true}))
    for(const [i,x,fy] of [[0,38,y],[1,62,y-4],[2,52,y+12]]) {
      if(!st.bloom)parts.push(bud(ink,`bud${i}`,x,fy+7,{len:10,w:5}))
      else {parts.push(...nfRay(ink,`flower${i}`,x,fy,5,12,10,{offset:i*16}),h('circle',{key:`throat${i}`,cx:x,cy:fy,r:3,fill:ink.hidden?ink.core:ink.pal.center}));parts.push(strokes(`veins${i}`,Array.from({length:5},(_,j)=>[x,fy,...polar(x,fy,7,j*72)]),.45,ink.line,.55))}
    }
    return parts
  },
  marshmarigold(ink, st) {
    const y=st.top+13, parts=[stem(ink,y,{w:2.1}),stem(ink,y+13,{key:'side',x:68,bx:50,w:1.5}),nfHeartLeaf(ink,'left',42,85,.9,-40),nfHeartLeaf(ink,'right',58,77,.78,52)]
    for(const [i,x,fy,r] of [[0,47,y,15],[1,68,y+13,10]]) {
      if(!st.bloom)parts.push(bud(ink,`bud${i}`,x,fy+2,{len:9,w:6}))
      else {parts.push(...nfRay(ink,`sepal${i}`,x,fy,5,r,r*.94,{offset:18,sheen:true}),nfCore(ink,`disk${i}`,x,fy,r*.32));parts.push(dots(`anthers${i}`,Array.from({length:18},(_,j)=>polar(x,fy,r*.39,j*20)),.6,ink.pal.center))}
    }
    return parts
  },
  forgetmenot(ink, st) {
    const y=st.top+9, parts=[stemPath('curl',`M49,90Q58,67 47,${y+15}Q35,${y+2} 49,${y-8}Q62,${y-13} 65,${y-4}Q67,${y+3} 60,${y+4}`,ink.pal.stem,1.5)]
    for(let i=0;i<4;i++)parts.push(leaf(ink,`leaf${i}`,{x:50,y:83-i*7,len:18-i*2,w:5.5,rot:i%2?58:-62}))
    for(const [i,x,fy] of [[0,41,y+12],[1,36,y+1],[2,43,y-9],[3,56,y-12],[4,65,y-4],[5,60,y+4]]) {
      if(!st.bloom||i>3)parts.push(bud(ink,`bud${i}`,x,fy,{len:4.6,w:3.5,rot:35}))
      else parts.push(...nfRay(ink,`flower${i}`,x,fy,5,6.6,5.7,{offset:i*9}),nfCore(ink,`eye${i}`,x,fy,1.6))
    }
    return parts
  },
  astilbe(ink, st) {
    const top=st.top-16, parts=[stem(ink,top,{w:1.6}),nfFern(ink,'left',50,84,28,-55),nfFern(ink,'right',51,78,26,65)]
    for(let row=0;row<8;row++) {
      const y=top+row*5, reach=3+row*2.1
      for(const side of [-1,1]) {
        parts.push(stemPath(`branch${row}:${side}`,`M50,${y+3}Q${50+side*reach*.5},${y} ${50+side*reach},${y-3}`,ink.pal.stem,.6))
        for(let k=0;k<(st.bloom?5:2);k++) {
          const x=50+side*reach*(k+1)/5, fy=y-3*(k+1)/5
          parts.push(...nfRay(ink,`f${row}:${side}:${k}`,x,fy,5,st.bloom?2.3:1.4,1.6,{offset:row*9,fill:st.bloom?ink.petal:ink.back}))
        }
      }
    }
    return parts
  },
  cardinalflower(ink, st) {
    const top=st.top-11, parts=[stem(ink,top+2,{w:1.8})]
    for(let i=0;i<5;i++)parts.push(leaf(ink,`leaf${i}`,{x:50,y:85-i*7,len:22-i*2,w:6,rot:i%2?62:-62,shape:'serrate'}))
    for(let i=0;i<7;i++){
      const side=i%2?1:-1,x=50+side*5,y=top+32-i*5
      if(!st.bloom||i>4){parts.push(bud(ink,`bud${i}`,x,y,{len:7,w:3,rot:side*28}));continue}
      parts.push(h('g',{key:`flower${i}`,transform:`translate(${x} ${y}) scale(${side} 1)`},
        h('path',{d:'M-2,4Q3,0 6,-6L9,-4Q7,4 1,8Z',fill:ink.back,stroke:ink.line,strokeWidth:.4}),
        petal('upper1',{x:7,y:-4,rot:12,len:8,w:2.7,tip:'point',fill:ink.petal,stroke:ink.line}),petal('upper2',{x:7,y:-4,rot:48,len:8,w:2.7,tip:'point',fill:ink.petal,stroke:ink.line}),
        ...[-35,0,35].map((a,j)=>petal(`lower${j}`,{x:8,y:0,rot:140+a,len:9,w:4.3,tip:'point',fill:ink.petal,stroke:ink.line}))))
    }
    return parts
  },
  arrowhead(ink, st) {
    const y=st.top+2,parts=[stem(ink,y-6,{w:1.9})]
    for(const [i,x,ly,rot] of [[0,29,69,-25],[1,69,64,20]]){
      parts.push(stemPath(`stalk${i}`,`M50,90L${x},${ly}`,ink.pal.stem,1.5),h('g',{key:`arrow${i}`,transform:place({x,y:ly,rot})},h('path',{d:'M0,-31L14,4 2,-4 0,7 -2,-4 -14,4Z',fill:ink.leaf,stroke:ink.leafLine,strokeWidth:.55}),h('path',{d:'M0,6L0,-27M0,-5L-11,1M0,-5L11,1',fill:'none',stroke:ink.rib,strokeWidth:.5})))
    }
    for(const [i,x,fy] of [[0,50,y-4],[1,34,y+13],[2,66,y+13],[3,50,y+26]]){
      parts.push(stemPath(`pedicel${i}`,`M50,${fy+5}L${x},${fy}`,ink.pal.stem,.8))
      if(!st.bloom)parts.push(bud(ink,`bud${i}`,x,fy+2,{len:6,w:4}))
      else parts.push(...nfRay(ink,`petal${i}`,x,fy,3,i===0?10:8,11,{offset:30}),nfCore(ink,`eye${i}`,x,fy,2.7))
    }
    return parts
  },
}
    const PLANTS = {
      dandelion: plantDandelion,
      daisy: plantDaisy,
      cherry: plantCherry,
      tulip: plantTulip,
      lavender: plantLavender,
      poppy: plantPoppy,
      sunflower: plantSunflower,
      lily: plantLily,
      rose: plantRose,
      mophead: plantHydrangea,
      snowdrop: plantSnowdrop,
      hellebore: plantHellebore,
      plum: plantPlum,
      edelweiss: plantEdelweiss,
      camellia: plantCamellia,
      cactus: plantCactus,
      pompom: plantLehua,
      agave: plantAgave,
      silversword: plantSilversword,
      plumeria: plantPlumeria,
      pickerel: plantPickerel,
      loosestrife: plantLoosestrife,
      iris: plantIris,
      waterlily: plantWaterlily,
      lotus: plantLotus,
    }

    /** Where the open flower sits, so the spirit aura centres on it. */
    function headYOf(species) {
      return species.head === 'waterlily' ? 62 : HEAD_Y
    }

    /** Small six-armed crystals for a frost bloom, or a heat glow for an ember one. */
    function mergeLayers(list) { return { under: list.flatMap(layer => layer.under), over: list.flatMap(layer => layer.over) } }
    function traitExtrasAll(traitId, headY) { return mergeLayers(traitParts(traitId).map(part => traitExtras(part, headY))) }
    function specialTraitArtAll(ink, traitId, headY) { return mergeLayers(traitParts(traitId).map(part => specialTraitArt(ink, part, headY))) }
    function traitExtras(traitId, headY) {
      if (traitId === 'frost') {
        const arms = [[27, headY - 14, 2.6], [73, headY - 8, 2.2], [68, headY + 16, 1.8], [30, headY + 12, 2]]
        return { under: [], over: arms.map(([x, y, r], index) => h('path', {
          key: `ice${index}`, className: 'fg-sparkle',
          d: [0, 60, 120].map(a => `M${polar(x, y, r, a).join(',')}L${polar(x, y, r, a + 180).join(',')}`).join(''),
          fill: 'none', stroke: '#8fc4ea', strokeWidth: 0.6, strokeLinecap: 'round',
          style: { animationDelay: `${index * 0.5}s` },
        })) }
      }
      if (traitId === 'ember') {
        return { under: [h('circle', { key: 'heat', cx: HEAD_X, cy: headY, r: 24, fill: '#ff8a2b', opacity: 0.16 }),
          h('circle', { key: 'heat2', cx: HEAD_X, cy: headY, r: 15, fill: '#ffc24a', opacity: 0.18 })], over: [] }
      }
      return { under: [], over: [] }
    }

    /**
     * One plant. `dna` makes it an individual (lean, height, girth, facing,
     * shade, petal lengths); `trait` a curiosity; `tint` a hybrid. Without
     * `dna` it is the textbook specimen the flower book shows.
     */
function regionRay(ink,key,x,y,count,len,width,fill) {
 return Array.from({length:count},(_,i)=>petal(`${key}${i}`,{x,y,rot:i*360/count,len,w:width,fill:fill??ink.petal,stroke:ink.line,vein:ink.line,veinOpacity:.22}))
}
function regionCore(ink,key,x,y,r) { return h('g',{key},h('circle',{cx:x,cy:y,r,fill:ink.core,stroke:ink.pal.centerDeep,strokeWidth:.4}),dots(`${key}-dots`,Array.from({length:8},(_,i)=>polar(x,y,r*.6,i*45)),.42,ink.pal.center)) }
const REGION_PLANTS = {
 foxglove(ink,st){const top=st.top-5,parts=[stem(ink,top+40,{w:2.1}),leaf(ink,'base',{x:50,y:82,len:30,w:15,rot:-50,shape:'serrate',veins:6})];for(let i=0;i<7;i++){const x=44+(i%2)*9,y=top+i*5;parts.push(stemPath(`spike${i}`,`M50,${y+4}L${x},${y}`,ink.pal.stem,.7));if(!st.bloom)parts.push(bud(ink,`b${i}`,x,y,{len:8,w:4,rot:i%2?25:-25}));else parts.push(h('g',{key:`fox${i}`,transform:`translate(${x} ${y}) rotate(${i%2?18:-18})`},h('path',{d:'M-5,0Q-8,-8 -4,-13Q2,-17 8,-12Q10,-4 5,3Q0,7 -5,0Z',fill:ink.petal,stroke:ink.line,strokeWidth:.45}),h('ellipse',{cx:1,cy:-6,rx:2.2,ry:3.6,fill:ink.back,opacity:.7}))) }return parts},
 bluebell(ink,st){const parts=[stemPath('scape','M50,90Q47,68 55,38',ink.pal.stem,1.5)];for(let i=0;i<6;i++)parts.push(leaf(ink,`leaf${i}`,{x:50,y:88,len:32-i*2,w:4,rot:-45+i*18}));for(let i=0;i<7;i++){const x=55+i*1.2,y=38+i*4;if(!st.bloom)parts.push(bud(ink,`b${i}`,x,y,{len:7,w:4,rot:70}));else parts.push(h('g',{key:`bell${i}`,transform:`translate(${x} ${y}) rotate(70)`},h('path',{d:'M0,0Q-6,4 -7,11Q0,14 7,11Q6,4 0,0Z',fill:ink.petal,stroke:ink.line,strokeWidth:.45}))) }return parts},
 cyclamen(ink,st){const cx=54,cy=st.top+28,parts=[stemPath('pedicel',`M49,90Q44,${cy+20} ${cx},${cy-11}`,ink.pal.stem,1.8),h('ellipse',{key:'tuber',cx:49,cy:87,rx:13,ry:5,fill:ink.pal.stem,opacity:.5})]
  for(let i=0;i<5;i++)parts.push(h('g',{key:`ivy${i}`,transform:`translate(49 82) rotate(${i*72})`},leaf(ink,'l',{x:0,y:0,len:21,w:13,rot:0,veins:5})))
  if(!st.bloom)return [...parts,bud(ink,'b',cx,cy-9,{len:11,w:6,rot:160})]
  parts.push(h('circle',{key:'back',cx,cy,r:8,fill:ink.back,stroke:ink.line,strokeWidth:.5}))
  parts.push(h('circle',{key:'mouth',cx,cy:cy+2,r:3.4,fill:ink.core,stroke:ink.line,strokeWidth:.4}))
  for(let i=0;i<5;i++){const ang=-160+i*35;const fill=i%2===0?ink.back:ink.petal;parts.push(petal(`unfurl${i}`,{x:cx+Math.cos(ang*Math.PI/180)*6,y:cy+6,rot:(i-2)*22,len:19,w:7.5,fill:fill,stroke:ink.line,tip:'point'}))}
  return parts},
 woodanemone(ink,st){const parts=[stem(ink,st.top+6,{w:1.5}),nfHeartLeaf(ink,'left',39,83,.7,-25),nfHeartLeaf(ink,'right',61,78,.65,35)];if(!st.bloom)return [...parts,bud(ink,'b',50,st.top+7,{len:11,w:6})];return [...parts,...regionRay(ink,'p',50,st.top,7,20,11,ink.petal),regionCore(ink,'k',50,st.top,3.8)]},
 californiapoppy(ink,st){const y=st.top+7,parts=[stem(ink,y+12,{w:1.6}),nfFern(ink,'fern',50,85,28,-55)];if(!st.bloom)return [...parts,bud(ink,'b',50,y,{len:13,w:7})];return [...parts,...regionRay(ink,'p',50,y,4,28,19,ink.petal),h('circle',{key:'cup',cx:50,cy:y,r:4,fill:ink.core})]},
 desertmarigold(ink,st){const y=st.top+4,parts=[stem(ink,y+5,{w:2})];for(let i=0;i<7;i++)parts.push(leaf(ink,`s${i}`,{x:50,y:88,len:28,w:6,rot:-70+i*23,fill:ink.leafBack}));if(!st.bloom)return [...parts,bud(ink,'b',50,y,{len:11,w:8})];return [...parts,...regionRay(ink,'p',50,y,28,20,4),regionCore(ink,'k',50,y,5.5)]},
 penstemon(ink,st){const top=st.top-13,parts=[stem(ink,top+40,{w:1.8})];for(let i=0;i<5;i++)parts.push(leaf(ink,`l${i}`,{x:50,y:85-i*8,len:24-i*2,w:4,rot:i%2?55:-55}));for(let i=0;i<8;i++){const x=50+(i%2?5:-5),y=top+30-i*5;if(!st.bloom)parts.push(bud(ink,`b${i}`,x,y,{len:7,w:3,rot:i%2?20:-20}));else parts.push(h('g',{key:`tube${i}`,transform:`translate(${x} ${y}) rotate(${i%2?20:-20})`},h('path',{d:'M-3,5Q-4,-7 0,-11Q4,-7 3,5Q0,9 -3,5Z',fill:ink.petal,stroke:ink.line,strokeWidth:.45}),h('path',{d:'M-1,-1Q1,0 2,4',stroke:ink.pal.center,strokeWidth:1,fill:'none'}))) }return parts},
 eveningprimrose(ink,st){const top=st.top-10,parts=[stemPath('tall',`M50,90Q49,55 50,${top}`,ink.pal.stem,2),leaf(ink,'base',{x:48,y:83,len:27,w:9,rot:-48})];for(let i=0;i<6;i++){const x=47+(i%2)*6,y=top+8+i*4;if(!st.bloom)parts.push(bud(ink,`b${i}`,x,y,{len:8,w:4,rot:i%2?25:-25}));else parts.push(...regionRay(ink,`p${i}`,x,y,4,13,9,ink.petal),regionCore(ink,`k${i}`,x,y,2.2))}return parts},
}
    Object.assign(PLANTS, NEW_PLANTS)
    Object.assign(PLANTS, REGION_PLANTS)

    function FlowerArt({ speciesId, stage, variant, dna, trait, tint, presentation = 'living' }) {
      // Every mounted SVG owns its paint: hidden tabs, dialogs and the mini window
      // must never resolve their gradients through another copy of this plant.
      const paintId = typeof React.useId === 'function' ? `svg${React.useId().replace(/[^a-zA-Z0-9_-]/g, '_')}` : 'svg-static'
      const species = SPECIES_BY_ID.get(speciesId) ?? SPECIES[0]
      const look = variant ?? 'base'
      const hidden = look === 'hidden'
      const recordedGenes = typeof dna === 'number' && dna > 0 ? Math.floor(dna) : 0
      // Old count-only entries get a stable live posture without inventing saved DNA.
      const displayGenes = 1 + [...species.id].reduce((seed,char)=>(seed*31+char.charCodeAt(0))%2147483646,17)
      const genes = recordedGenes || (presentation==='living'?displayGenes:0)
      const traitId = hidden || stage !== 'bloom' ? undefined : trait
      const ink = makeInk(species, look, { dna: recordedGenes, trait: traitId, tint, paintId })
      const sceneId = SCENE_ID_OF.get(species.id) ?? 'meadow'
      const headY = headYOf(species)
      const floating = species.leaf === 'float'
      const drawBase = () => (stage === 'seed'
        ? seedArt(ink, sceneId)
        : stage === 'sprout'
          ? sproutArt(ink, species)
          : PLANTS[species.head](ink, { bloom: stage === 'bloom', top: stage === 'bloom' ? HEAD_Y : 54, k: stage === 'bloom' ? 1 : 0.74 }))
      const draw = () => { const layers = specialTraitArtAll(ink, traitId, headY); return [...layers.under, ...drawBase(), ...layers.over] }
      artSalt = genes === 0 ? 0 : (genes % 9973) / 97
      // Floating and pad plants do not sway on a stem.
      const sway = stage === 'seed' || floating ? undefined : 'fg-plant'
      const about = (lean, sx, sy) => `translate(50 ${GROUND_Y}) rotate(${n(lean)}) scale(${n(sx)} ${n(sy)}) translate(-50 ${-GROUND_Y})`
      let bodies
      try {
        const grown = stage !== 'seed' && genes !== 0
        const lean = grown && !floating ? (hashUnit(genes, 4, 9) - 0.5) * 12 : 0
        const big = traitParts(traitId).includes('giant') ? 1.2 : 1
        const sy = (grown ? 0.84 + hashUnit(genes, 5, 9) * 0.25 : 1) * big
        const sx = (grown ? 0.9 + hashUnit(genes, 6, 9) * 0.2 : 1) * big
        const flip = grown && hashUnit(genes, 7, 9) < 0.5 ? -1 : 1
        if (traitParts(traitId).includes('twin')) {
          // Two flowers on one root: the second is the first one's mirror, a little smaller.
          const spread = floating ? 0 : 11
          bodies = [
            h('g', { key: 'twinB', transform: `${floating ? 'translate(13 -5) ' : ''}${about(lean + spread, -flip * sx * 0.8, sy * 0.8)}` }, ...draw()),
            h('g', { key: 'twinA', transform: `${floating ? 'translate(-9 0) ' : ''}${about(lean - spread, flip * sx * 0.92, sy * 0.92)}` }, ...draw()),
          ]
        } else if (lean !== 0 || sx !== 1 || sy !== 1 || flip !== 1) {
          bodies = [h('g', { key: 'self', transform: about(lean, flip * sx, sy) }, ...draw())]
        } else {
          bodies = draw()
        }
      } finally {
        artSalt = 0
      }
      const extras = traitExtrasAll(traitId, headY)
      return h('svg', {...SVG_PROPS,className:presentation==='specimen'?'fg-flowerSpecimen':'fg-flowerLiving','data-presentation':presentation},
        h('defs', null, ...ink.defs, hidden ? hiddenAuraDef(`${species.id}-${paintId}`) : null),
        ...(hidden ? hiddenAura(`${species.id}-${paintId}`, headY) : []),
        ...extras.under,
        ground(sceneId),
        h('g', { className: sway }, ...bodies),
        ...extras.over,
        ...(hidden && stage === 'bloom' ? hiddenLights(headY) : []),
      )
    }

    function hiddenAuraDef(speciesId) {
      return h('radialGradient', { key: 'aura', id: `fg-hid-${speciesId}-aura` },
        h('stop', { offset: '0%', stopColor: HIDDEN_GOLD.aura, stopOpacity: '0.9' }),
        h('stop', { offset: '52%', stopColor: HIDDEN_GOLD.auraEdge, stopOpacity: '0.34' }),
        h('stop', { offset: '100%', stopColor: HIDDEN_GOLD.auraEdge, stopOpacity: '0' }),
      )
    }

    function hiddenAura(speciesId, headY) {
      return [
        h('circle', { key: 'aura', cx: HEAD_X, cy: headY, r: 32, fill: `url(#fg-hid-${speciesId}-aura)` }),
        h('circle', {
          key: 'ring', cx: HEAD_X, cy: headY, r: 21,
          fill: 'none', stroke: HIDDEN_GOLD.spark, strokeWidth: 0.8,
          strokeDasharray: '3 5', opacity: 0.75, className: 'fg-haloRing',
          style: { transformOrigin: `${HEAD_X}px ${headY}px` },
        }),
      ]
    }

    /** Four-point stars around the bloom, plus a few motes drifting upward. */
    function hiddenLights(headY) {
      const dy = headY - HEAD_Y
      const stars = [[22, 15, 3.4], [78, 20, 2.8], [74, 55, 3.2], [26, 54, 2.3], [50, 6, 2.6]]
      const parts = stars.map(([x, rawY, r], index) => {
        const y = Math.max(5, rawY + dy)
        return h('path', {
          key: `star${index}`,
          className: 'fg-sparkle',
          d: `M${x},${y - r} L${x + r * 0.26},${y - r * 0.26} L${x + r},${y} L${x + r * 0.26},${y + r * 0.26}`
            + ` L${x},${y + r} L${x - r * 0.26},${y + r * 0.26} L${x - r},${y} L${x - r * 0.26},${y - r * 0.26} Z`,
          fill: HIDDEN_GOLD.spark,
          stroke: '#e9c96a',
          strokeWidth: 0.3,
          style: { animationDelay: `${index * 0.42}s` },
        })
      })
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

    /** The small creatures that visit open flowers, drawn on a 24 × 24 field. */
// Insert inside the client factory. Depends only on h and the existing ink object.
// SpecialVisitorArt uses the same 24x24 coordinate system as VisitorArt.
function SpecialVisitorArt({ id }) {
  const props = { viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false', 'data-special-visitor': id }
  const dark = '#29272b'
  const wing = { fill: '#e8f1ee', fillOpacity: .82, stroke: '#81979e', strokeWidth: .45 }
  if (id === 'bumblebee') {
    return h('svg', props,
      h('ellipse', { cx: 10, cy: 7, rx: 5, ry: 2.7, transform: 'rotate(-35 10 7)', ...wing }),
      h('ellipse', { cx: 16, cy: 7.8, rx: 4.6, ry: 2.8, transform: 'rotate(26 16 7.8)', ...wing }),
      h('path', { d: 'M10,7L6,5M16,8L19,7', fill: 'none', stroke: '#b2c7ca', strokeWidth: .45 }),
      h('path', { d: 'M10,16L7,20M13,17L12,21M16,16L18,19', fill: 'none', stroke: dark, strokeWidth: .7, strokeLinecap: 'round' }),
      h('ellipse', { cx: 13.5, cy: 13.5, rx: 7.5, ry: 5.5, fill: dark, stroke: '#524232', strokeWidth: .9, strokeDasharray: '.4 .55' }),
      h('path', { d: 'M8.5,9.1Q10.2,7.8 11.5,8.2L11.5,18.5Q9.6,18.1 8.5,17Z', fill: '#e6b938' }),
      h('path', { d: 'M14.4,8.2Q16.1,8.6 17.1,9.4L17.1,17.8Q16,18.4 14.4,18.8Z', fill: '#f0c747' }),
      h('path', { d: 'M18,10.2Q23,13.5 18,17.2Q19.1,13.6 18,10.2Z', fill: '#f4f0dd', stroke: '#d6d6c9', strokeWidth: .3 }),
      ...Array.from({ length: 12 }, (_, i) => {
        const a = i * Math.PI / 6
        return h('path', { key: `fur${i}`, d: `M${13.5 + Math.cos(a) * 7.1},${13.5 + Math.sin(a) * 5.1}l${Math.cos(a) * .8},${Math.sin(a) * .8}`, stroke: i % 3 ? '#ad9863' : '#f1d56e', strokeWidth: .4, strokeLinecap: 'round' })
      }),
      h('circle', { cx: 5.8, cy: 12.7, r: 3.1, fill: dark }),
      h('circle', { cx: 4.7, cy: 11.9, r: .65, fill: '#f9f6e9' }),
      h('path', { d: 'M4.7,10.1Q3.8,7.8 2.3,8M6.5,9.8Q7.1,7.7 8.2,7.4', fill: 'none', stroke: dark, strokeWidth: .65, strokeLinecap: 'round' }))
  }
  if (id === 'swallowtail') {
    return h('svg', props,
      h('path', { d: 'M11.9,11.9C9.4,5 4.8,1.1 1.5,2.4L3.1,12.2Q5.6,14.3 11.9,13ZM12.1,11.9C14.6,5 19.2,1.1 22.5,2.4L20.9,12.2Q18.4,14.3 12.1,13Z', fill: '#f6d770', stroke: dark, strokeWidth: .7, strokeLinejoin: 'round' }),
      h('path', { d: 'M11.7,12.8Q5.2,11.2 3.7,16.2L5.3,18.4L4.6,22L7,19.2Q10.7,20.4 11.9,14ZM12.3,12.8Q18.8,11.2 20.3,16.2L18.7,18.4L19.4,22L17,19.2Q13.3,20.4 12.1,14Z', fill: '#edc65f', stroke: dark, strokeWidth: .8, strokeLinejoin: 'round' }),
      h('path', { d: 'M2.2,3.1L10.4,11M4.3,3.9L4.8,9.4M7,6.2L7.5,11.3M3,11.2L10.4,12.6M21.8,3.1L13.6,11M19.7,3.9L19.2,9.4M17,6.2L16.5,11.3M21,11.2L13.6,12.6', fill: 'none', stroke: dark, strokeWidth: 1.1 }),
      h('path', { d: 'M4.4,16.3Q8,18.7 10.2,15.8M19.6,16.3Q16,18.7 13.8,15.8', fill: 'none', stroke: dark, strokeWidth: 2.1 }),
      ...[[5.6,16.9],[7.5,17.4],[9.3,16.7],[18.4,16.9],[16.5,17.4],[14.7,16.7]].map(([cx,cy], i) => h('circle', { key: `blue${i}`, cx, cy, r: .48, fill: '#7eafd0' })),
      h('circle', { cx: 10.2, cy: 15.3, r: .9, fill: '#c76545', stroke: dark, strokeWidth: .3 }),
      h('circle', { cx: 13.8, cy: 15.3, r: .9, fill: '#c76545', stroke: dark, strokeWidth: .3 }),
      h('path', { d: 'M12,8.8L12,18.2', stroke: dark, strokeWidth: 1.35, strokeLinecap: 'round' }),
      h('circle', { cx: 12, cy: 8.5, r: 1.1, fill: dark }),
      h('path', { d: 'M11.7,7.8Q9.7,5.4 9.3,4.6M12.3,7.8Q14.3,5.4 14.7,4.6', fill: 'none', stroke: dark, strokeWidth: .5, strokeLinecap: 'round' }))
  }
  if (id === 'hawkmoth') {
    return h('svg', props,
      h('path', { d: 'M10,11.8L14.9,18.8Q18.6,20 19.2,16.9L13.6,10.5Z', fill: '#d18b3c', stroke: '#765035', strokeWidth: .5 }),
      h('path', { d: 'M9.5,11Q5,5.4 7.4,2.3Q13.2,1.2 17.2,7.5L12.3,13.3Z', fill: '#9d8e7d', stroke: '#665d54', strokeWidth: .6 }),
      h('path', { d: 'M8,3.6L12.5,11M9.5,3.5L15,7.7M7.4,6.4L13,10.7', fill: 'none', stroke: '#7e7062', strokeWidth: .55 }),
      h('path', { d: 'M6.1,3.2Q4,6.2 6.1,9.5M17.9,6.5L20,8.4', fill: 'none', stroke: '#b8c3bb', strokeWidth: .55, strokeLinecap: 'round' }),
      h('ellipse', { cx: 13.2, cy: 13, rx: 6.2, ry: 2.6, transform: 'rotate(18 13.2 13)', fill: '#7a6c5a', stroke: '#4e453f', strokeWidth: .6 }),
      h('path', { d: 'M14.4,10.8L13.4,15.3M16.3,11.6L15.5,15.6', stroke: '#f1e9d8', strokeWidth: .95 }),
      h('path', { d: 'M17.6,12.5L21,12.9L20.4,14.5L21.4,15.5L17.5,15.4Z', fill: '#44413d' }),
      h('circle', { cx: 7.1, cy: 11, r: 2.6, fill: '#827969', stroke: '#4c443c', strokeWidth: .5 }),
      h('circle', { cx: 6, cy: 10.4, r: .85, fill: '#242326' }),
      h('circle', { cx: 5.8, cy: 10.2, r: .25, fill: '#f7f7ee' }),
      h('path', { d: 'M5.2,11.6Q3.4,13.6 1.2,15.2M7,8.7L6.2,6.5M8.3,8.8L9.8,7.2M9.2,13.1L7.2,16.1M11.2,14.3L10.3,17', fill: 'none', stroke: '#4d4540', strokeWidth: .6, strokeLinecap: 'round' }))
  }
  if (id === 'hoverfly') {
    return h('svg', props,
      h('path', { d: 'M11,10.5Q7.1,4.7 3.3,5.3Q1.9,10.5 10.7,13.2ZM13,10.5Q16.9,4.7 20.7,5.3Q22.1,10.5 13.3,13.2Z', ...wing }),
      h('path', { d: 'M10.5,11.7L4.1,6.5M8.3,9.4L5.1,10M13.5,11.7L19.9,6.5M15.7,9.4L18.9,10', fill: 'none', stroke: '#afc2c2', strokeWidth: .4 }),
      h('path', { d: 'M10.2,12L7.6,15M10.3,14L7.2,18M13.8,12L16.4,15M13.7,14L16.8,18', fill: 'none', stroke: dark, strokeWidth: .55, strokeLinecap: 'round' }),
      h('path', { d: 'M9.8,12.1Q9.2,17.8 12,21.6Q14.8,17.8 14.2,12.1Z', fill: '#e8bb3d', stroke: dark, strokeWidth: .6 }),
      h('path', { d: 'M9.8,14.4L14.2,14.4M10.1,17.3L13.9,17.3M11,19.6L13,19.6', stroke: dark, strokeWidth: 1 }),
      h('ellipse', { cx: 12, cy: 10.9, rx: 2.8, ry: 3.4, fill: '#504c35', stroke: dark, strokeWidth: .5 }),
      h('path', { d: 'M11.3,8.6L11.3,12.5M12.7,8.6L12.7,12.5', stroke: '#d7bd61', strokeWidth: .45 }),
      h('ellipse', { cx: 10.5, cy: 6.8, rx: 1.9, ry: 2.2, fill: '#9e5844', stroke: dark, strokeWidth: .4 }),
      h('ellipse', { cx: 13.5, cy: 6.8, rx: 1.9, ry: 2.2, fill: '#9e5844', stroke: dark, strokeWidth: .4 }),
      h('path', { d: 'M11.7,5.9L11.1,4.3M12.3,5.9L12.9,4.3', fill: 'none', stroke: dark, strokeWidth: .45, strokeLinecap: 'round' }),
      h('circle', { cx: 10.1, cy: 6.2, r: .4, fill: '#e7b69b' }),
      h('circle', { cx: 13.9, cy: 6.2, r: .4, fill: '#e7b69b' }))
  }
  return null
}

// Returns layers at flower coordinates. Put them inside the same DNA-transformed
// plant group as the original drawing. Optional headY supports floating flowers.
// These are stylized visual identifiers, not species-specific anatomical diagrams.
function specialTraitArt(ink, traitId, headY = HEAD_Y) {
  const under = [], over = []
  const cx = 50, cy = headY
  if (traitId === 'fasciated') {
    const fill = ink.lin('fasciated-stem', [[0, ink.pal.stem], [45, ink.rib], [100, ink.pal.leaf]], { x1: '0', y1: '0', x2: '1', y2: '0' })
    over.push(h('path', { key: 'fasciated-ribbon', d: `M43,89C44,73 40,${cy + 22} 36,${cy + 11}Q48,${cy + 4} 64,${cy + 11}C60,${cy + 25} 57,72 57,89Z`, fill, stroke: ink.leafLine, strokeWidth: .8 }))
    for (let i = 0; i < 5; i++) over.push(h('path', { key: `fasciated-rib${i}`, d: `M${45 + i * 2.2},87Q${43 + i * 3.5},${cy + 36} ${39 + i * 5.4},${cy + 12}`, fill: 'none', stroke: i % 2 ? ink.rib : ink.leafLine, strokeWidth: .65, opacity: .7 }))
    over.push(h('path', { key: 'fasciated-tip', d: `M36,${cy + 11}Q40,${cy + 5} 45,${cy + 10}Q50,${cy + 3} 55,${cy + 9}Q60,${cy + 4} 64,${cy + 11}`, fill: 'none', stroke: ink.pal.stem, strokeWidth: 2.2, strokeLinecap: 'round' }))
  } else if (traitId === 'radial') {
    for (let i = 0; i < 6; i++) {
      const angle = i * 60
      over.push(h('g', { key: `radial-lobe${i}`, transform: `translate(${cx} ${cy}) rotate(${angle})` },
        h('path', { d: 'M-2,1C-7,-5 -13,-14 -8,-20Q0,-28 8,-20C13,-14 7,-5 2,1Z', fill: i % 2 ? ink.back : ink.petal, stroke: ink.line, strokeWidth: .55 }),
        h('path', { d: 'M0,-2L0,-18M0,-8L-4,-14M0,-8L4,-14', fill: 'none', stroke: ink.line, strokeWidth: .45, opacity: .5 })))
    }
    over.push(h('circle', { key: 'radial-throat', cx, cy, r: 4.4, fill: ink.core, stroke: ink.line, strokeWidth: .5 }))
    for (let i = 0; i < 6; i++) over.push(h('circle', { key: `radial-stamen${i}`, cx: cx + Math.cos(i * Math.PI / 3) * 3, cy: cy + Math.sin(i * Math.PI / 3) * 3, r: .65, fill: ink.pal.centerDeep }))
  } else if (traitId === 'double') {
    for (let row = 0; row < 3; row++) {
      const count = 14 - row * 3, len = 22 - row * 5.5, width = 8 - row * 1.2
      for (let i = 0; i < count; i++) over.push(h('path', { key: `double-${row}-${i}`, transform: `translate(${cx} ${cy}) rotate(${i * 360 / count + row * 13})`, d: `M-1,1C${-width},${-len * .35} ${-width},${-len * .9} -2,${-len}Q0,${-len - 2} 2,${-len}C${width},${-len * .9} ${width},${-len * .35} 1,1Z`, fill: row % 2 ? ink.back : ink.petal, stroke: ink.line, strokeWidth: .45 }))
    }
    over.push(h('ellipse', { key: 'double-heart', cx, cy, rx: 3.1, ry: 2.5, fill: ink.back, stroke: ink.line, strokeWidth: .5 }))
  } else if (traitId === 'leafy') {
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 5; i++) {
        const len = row ? 15 : 25, width = row ? 5 : 8
        over.push(h('g', { key: `leafy-${row}-${i}`, transform: `translate(${cx} ${cy}) rotate(${i * 72 + row * 36})` },
          h('path', { d: `M0,2Q${-width},${-len * .2} ${-width},${-len * .6}Q-2,${-len * .85} 0,${-len}Q2,${-len * .85} ${width},${-len * .6}Q${width},${-len * .2} 0,2Z`, fill: row ? ink.leafBack : ink.leaf, stroke: ink.leafLine, strokeWidth: .6 }),
          h('path', { d: `M0,0L0,${-len + 3}M0,${-len * .3}L${-width * .7},${-len * .48}M0,${-len * .3}L${width * .7},${-len * .48}M0,${-len * .55}L${-width * .52},${-len * .73}M0,${-len * .55}L${width * .52},${-len * .73}`, fill: 'none', stroke: ink.rib, strokeWidth: .65 })))
      }
    }
    over.push(h('circle', { key: 'leafy-bud', cx, cy, r: 2.5, fill: ink.pal.stem, stroke: ink.leafLine, strokeWidth: .5 }))
  }
  return { under, over }
}

    function VisitorArt({ id }) {
      if (VISITOR_BY_ID.get(id)?.special) return h(SpecialVisitorArt, { id })
      const props = { viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' }
      const wing = { fill: '#eaf4fb', stroke: '#8fa9bd', strokeWidth: 0.5, opacity: 0.88 }
      const ink = '#32261c'
      switch (id) {
        case 'bee':
          return h('svg', props,
            h('ellipse', { cx: 10, cy: 7.8, rx: 4.6, ry: 2.6, transform: 'rotate(-30 10 7.8)', ...wing }),
            h('ellipse', { cx: 15, cy: 7.6, rx: 4.2, ry: 2.4, transform: 'rotate(22 15 7.6)', ...wing }),
            h('ellipse', { cx: 12.6, cy: 14, rx: 6.2, ry: 4.5, fill: '#f6c443', stroke: ink, strokeWidth: 0.7 }),
            h('path', { d: 'M11.2,10.2v7.6M14.6,10v8', stroke: ink, strokeWidth: 1.7 }),
            h('circle', { cx: 6.6, cy: 13.6, r: 2.7, fill: ink }),
            h('circle', { cx: 5.7, cy: 13, r: 0.65, fill: '#ffffff' }),
            h('path', { d: 'M5.6,11.3q-1.2,-2.4 -2.8,-2.2M7.2,11q.2,-2.4 1.4,-3M18.6,14.4l2,.5', fill: 'none', stroke: ink, strokeWidth: 0.6, strokeLinecap: 'round' }),
          )
        case 'butterfly':
          return h('svg', props,
            h('path', { d: 'M12,12.4C8.4,4.4 2,3.6 2.4,8.8C2.8,12.6 8,13.2 12,12.4ZM12,12.4C15.6,4.4 22,3.6 21.6,8.8C21.2,12.6 16,13.2 12,12.4Z', fill: '#fffbe4', stroke: '#8a7d55', strokeWidth: 0.5 }),
            h('path', { d: 'M12,12.8C8,13 4.8,15.2 6.2,18.6C8.2,20.8 11.2,17.4 12,13.8ZM12,12.8C16,13 19.2,15.2 17.8,18.6C15.8,20.8 12.8,17.4 12,13.8Z', fill: '#f6efc4', stroke: '#8a7d55', strokeWidth: 0.5 }),
            h('path', { d: 'M2.4,8.8C2.2,5.6 4.4,4.8 6.6,5.6C4.8,6.2 3.4,7.4 2.4,8.8ZM21.6,8.8C21.8,5.6 19.6,4.8 17.4,5.6C19.2,6.2 20.6,7.4 21.6,8.8Z', fill: '#4a4034' }),
            h('path', { d: 'M6.4,9.2h.01M17.6,9.2h.01', stroke: '#4a4034', strokeWidth: 1.7, strokeLinecap: 'round' }),
            h('path', { d: 'M12,8.8v8.4', stroke: ink, strokeWidth: 1.4, strokeLinecap: 'round' }),
            h('path', { d: 'M12,8.8q-1.4,-3 -3,-3.4M12,8.8q1.4,-3 3,-3.4', fill: 'none', stroke: ink, strokeWidth: 0.5, strokeLinecap: 'round' }),
          )
        case 'ladybug':
          return h('svg', props,
            h('path', { d: 'M8.6,8.4q-1.6,-2.6 -3.4,-2.4M15.4,8.4q1.6,-2.6 3.4,-2.4', fill: 'none', stroke: ink, strokeWidth: 0.6, strokeLinecap: 'round' }),
            h('circle', { cx: 12, cy: 8.6, r: 3.6, fill: '#241a1a' }),
            h('path', { d: 'M9.8,7.4h.01M14.2,7.4h.01', stroke: '#ffffff', strokeWidth: 1.5, strokeLinecap: 'round' }),
            h('ellipse', { cx: 12, cy: 14.2, rx: 7, ry: 6.6, fill: '#d93a30', stroke: '#241a1a', strokeWidth: 0.7 }),
            h('path', { d: 'M12,7.8v13', stroke: '#241a1a', strokeWidth: 0.8 }),
            h('path', { d: 'M8.4,11.6h.01M15.6,11.6h.01M7.6,15.6h.01M16.4,15.6h.01M10,18.4h.01M14,18.4h.01M12,10.4h.01', stroke: '#241a1a', strokeWidth: 2.2, strokeLinecap: 'round' }),
            h('path', { d: 'M7.6,11.4q1.2,-2.2 3,-2.6', fill: 'none', stroke: '#ffffff', strokeWidth: 0.8, strokeLinecap: 'round', opacity: 0.5 }),
          )
        case 'dragonfly':
          return h('svg', props,
            h('ellipse', { cx: 11.4, cy: 7, rx: 6.4, ry: 1.9, transform: 'rotate(24 11.4 7)', ...wing }),
            h('ellipse', { cx: 17.4, cy: 6.6, rx: 5.6, ry: 1.8, transform: 'rotate(-42 17.4 6.6)', ...wing }),
            h('ellipse', { cx: 11.4, cy: 17, rx: 6.4, ry: 1.9, transform: 'rotate(-24 11.4 17)', ...wing }),
            h('ellipse', { cx: 17.4, cy: 17.4, rx: 5.6, ry: 1.8, transform: 'rotate(42 17.4 17.4)', ...wing }),
            h('path', { d: 'M2.4,12H15', stroke: '#2f8fb0', strokeWidth: 1.6, strokeLinecap: 'round' }),
            h('path', { d: 'M5,12h.01M7.6,12h.01M10.2,12h.01', stroke: '#1d5f78', strokeWidth: 1.7, strokeLinecap: 'round' }),
            h('ellipse', { cx: 16.4, cy: 12, rx: 2.6, ry: 1.9, fill: '#2a7c98' }),
            h('circle', { cx: 20, cy: 12, r: 2, fill: '#3fa58a', stroke: '#1d5f78', strokeWidth: 0.4 }),
            h('path', { d: 'M20.6,11.2h.01M20.6,12.8h.01', stroke: '#16323a', strokeWidth: 1, strokeLinecap: 'round' }),
          )
        case 'firefly':
          return h('svg', props,
            h('circle', { className: 'fg-glow', cx: 12, cy: 16.4, r: 7, fill: '#eef26a', opacity: 0.4 }),
            h('ellipse', { cx: 8.6, cy: 11, rx: 2.4, ry: 5, transform: 'rotate(26 8.6 11)', ...wing }),
            h('ellipse', { cx: 15.4, cy: 11, rx: 2.4, ry: 5, transform: 'rotate(-26 15.4 11)', ...wing }),
            h('ellipse', { cx: 12, cy: 11.4, rx: 2.9, ry: 4.6, fill: '#3b3029' }),
            h('ellipse', { cx: 12, cy: 16.6, rx: 2.7, ry: 2.9, fill: '#f3f45e', stroke: '#c9c63a', strokeWidth: 0.4 }),
            h('circle', { cx: 12, cy: 6.6, r: 2, fill: '#b9472f' }),
            h('path', { d: 'M11.2,5q-.8,-2 -2.4,-2.2M12.8,5q.8,-2 2.4,-2.2', fill: 'none', stroke: ink, strokeWidth: 0.5, strokeLinecap: 'round' }),
          )
        case 'moth':
          return h('svg', props,
            h('path', { d: 'M12.6,11C9,5.6 3.6,4.4 1.8,6.2C3.8,9.6 8,11.6 12.6,12.2Z', fill: '#8c7b6a', stroke: '#54483c', strokeWidth: 0.5 }),
            h('path', { d: 'M12.6,13C9.4,13 6.6,14.6 5.6,17.4C8.6,17.8 11.4,16 12.8,14Z', fill: '#e58a3a', stroke: '#a05a20', strokeWidth: 0.4 }),
            h('path', { d: 'M4.4,6.6l4.6,3M6.6,5.8l3.8,3.6', fill: 'none', stroke: '#54483c', strokeWidth: 0.4, opacity: 0.7 }),
            h('ellipse', { cx: 14.6, cy: 13, rx: 5.2, ry: 2.5, transform: 'rotate(8 14.6 13)', fill: '#a39483', stroke: '#54483c', strokeWidth: 0.5 }),
            h('path', { d: 'M16.4,11.2v4M18,11.8v3.2', stroke: '#f3ede3', strokeWidth: 0.8 }),
            h('path', { d: 'M19.4,13.6l2.6,1.4 -2.4,.8Z', fill: '#32261c' }),
            h('circle', { cx: 10.6, cy: 12.2, r: 0.8, fill: ink }),
            h('path', { d: 'M9.8,12.8Q4,15 2.6,20.6', fill: 'none', stroke: ink, strokeWidth: 0.5, strokeLinecap: 'round' }),
            h('path', { d: 'M10.4,11.2q-1.4,-2.6 -3.2,-3', fill: 'none', stroke: ink, strokeWidth: 0.5, strokeLinecap: 'round' }),
          )
        case 'robin':
          return h('svg', props,
            h('path', { d: 'M17,13.6l5,-3.4 -.6,4.4Z', fill: '#6f5946' }),
            h('ellipse', { cx: 12.4, cy: 13.6, rx: 6.6, ry: 5.6, fill: '#8d735a', stroke: '#5a4634', strokeWidth: 0.5 }),
            h('circle', { cx: 8.4, cy: 9.2, r: 4, fill: '#8d735a', stroke: '#5a4634', strokeWidth: 0.5 }),
            h('path', { d: 'M5.2,9.4C5.4,12.6 6.6,16.6 10.4,17.8C13.4,17 13.6,13 11.6,10.4C10,8.6 6.4,8 5.2,9.4Z', fill: '#e8743b' }),
            h('path', { d: 'M9,17.6C11.4,19.2 15,19 17,17.2C14.6,17.6 11.4,17.4 9,17.6Z', fill: '#f3ede3' }),
            h('path', { d: 'M12.6,11.4C15.4,11 17.6,12.4 18,14.8C15.6,15.4 13.6,14.2 12.6,11.4Z', fill: '#6f5946' }),
            h('path', { d: 'M4.8,9.2L1.8,9.9 4.7,10.6Z', fill: ink }),
            h('circle', { cx: 7.4, cy: 8.4, r: 0.8, fill: '#1a1410' }),
            h('path', { d: 'M11,19v2.6M13.6,19.2v2.4', stroke: ink, strokeWidth: 0.6, strokeLinecap: 'round' }),
          )
        case 'honeycreeper':
          return h('svg', props,
            h('path', { d: 'M17.6,14.6l4.8,3 -5.6,-.2Z', fill: '#2a2226' }),
            h('ellipse', { cx: 12.8, cy: 13.6, rx: 6.2, ry: 4.5, transform: 'rotate(14 12.8 13.6)', fill: '#dd3a2c', stroke: '#8c1f1a', strokeWidth: 0.5 }),
            h('circle', { cx: 8.4, cy: 9.6, r: 3.5, fill: '#dd3a2c', stroke: '#8c1f1a', strokeWidth: 0.5 }),
            h('path', { d: 'M11.6,11.4C14.6,10.6 18,12.4 19,15.8C15.6,16.4 12.6,14.6 11.6,11.4Z', fill: '#2a2226' }),
            h('path', { d: 'M13.6,13.2l2.6,.8', stroke: '#f3ede3', strokeWidth: 0.7, strokeLinecap: 'round' }),
            h('path', { d: 'M5.4,9.4Q1.8,10 2,14.6', fill: 'none', stroke: '#f0a172', strokeWidth: 1.2, strokeLinecap: 'round' }),
            h('circle', { cx: 7.6, cy: 8.9, r: 0.75, fill: '#1a1410' }),
            h('path', { d: 'M11.6,18v3M14,18.2v2.8', stroke: '#f0a172', strokeWidth: 0.6, strokeLinecap: 'round' }),
          )
        default:
          return h('svg', props,
            h('path', { d: 'M17.4,14.4l4.2,1.8 -4.6,1Z', fill: '#176f8a' }),
            h('ellipse', { cx: 13, cy: 13.6, rx: 5.6, ry: 4.8, fill: '#e9853a', stroke: '#a8561c', strokeWidth: 0.5 }),
            h('path', { d: 'M9.4,9.6C13,8 17.6,10 18.6,15.4C15.2,16 11.6,14.4 9.4,9.6Z', fill: '#1f93ad', stroke: '#14627a', strokeWidth: 0.5 }),
            h('circle', { cx: 9.6, cy: 9, r: 3.6, fill: '#1f93ad', stroke: '#14627a', strokeWidth: 0.5 }),
            h('path', { d: 'M7.6,10.2C8.6,11.4 10.4,11.6 11.6,10.8C10.4,10.2 9,10 7.6,10.2Z', fill: '#f6f1e6' }),
            h('path', { d: 'M8,10.8C7.4,11.8 7.8,12.8 8.8,13.2', fill: 'none', stroke: '#e9853a', strokeWidth: 1.1, strokeLinecap: 'round' }),
            h('path', { d: 'M6.4,8.4L0.8,9.6 6.3,10.2Z', fill: '#2a2a30' }),
            h('circle', { cx: 8.6, cy: 8.2, r: 0.8, fill: '#101014' }),
            h('path', { d: 'M12,18.2v2.4M14.2,18.2v2.4', stroke: '#d0552a', strokeWidth: 0.7, strokeLinecap: 'round' }),
          )
      }
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
      if (id === 'compost') {
        return h('svg', common,
          h('path', { d: 'M6 9.4c0-1 1-1.8 2.4-1.8h7.2c1.4 0 2.4.8 2.4 1.8l-.8 9a2 2 0 0 1-2 1.8H8.8a2 2 0 0 1-2-1.8Z', fill: '#8a6242' }),
          h('path', { d: 'M9.4 7.6c.4-1.6 1.4-2.6 2.6-2.6s2.2 1 2.6 2.6', fill: 'none', stroke: '#6a4a30', strokeWidth: 1.4 }),
          h('path', { d: 'M12 16.6c0-2.4 1.2-3.8 3.2-4.2-.2 2.2-1.2 3.6-3.2 4.2ZM12 16.6c0-1.8-.8-2.8-2.4-3.2.2 1.6 1 2.8 2.4 3.2Z', fill: '#9fd07a' }),
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
    function bloomName(item, t) {
      let name = item.tint ? t('hybrid.name', { form: t(`species.${item.species}`), tint: t(`species.${item.tint}`) }) : t(`species.${item.species}`)
      if (item.trait) name = t('trait.named', { trait: traitLabel(item.trait, t), flower: name })
      return name
    }

    function BloomPreview({ id, speciesId, variant, dna, trait, tint, t, meta = [], worth, armed, onSell, onClose, modal = false, onPrev, onNext, individuals = [], onSellOne, quoteOne, observations = 0, allowSpecimen = false }) {
      const species = SPECIES_BY_ID.get(speciesId) ?? SPECIES[0]
      const dialogRef = React.useRef(null)
      const [individual, setIndividual] = React.useState(0)
      const chosen = individuals[Math.min(individual, Math.max(0, individuals.length - 1))]
      const [oneArmed, setOneArmed] = React.useState(false)
      React.useEffect(() => setOneArmed(false), [chosen])
      React.useEffect(() => {
        if (!oneArmed) return undefined
        const timer = window.setTimeout(() => setOneArmed(false), 4000)
        return () => window.clearTimeout(timer)
      }, [oneArmed])
      const [sample, setSample] = React.useState(null), [specimenMode,setSpecimenMode] = React.useState(false)
      React.useEffect(() => {setSample(null);setSpecimenMode(false)}, [speciesId, variant, trait, tint, dna])
      React.useEffect(() => {
        if (!modal) return undefined
        const dialog = dialogRef.current
        showModalPinned(dialog)
        return () => { if (dialog?.open) dialog.close() }
      }, [modal])
      const card = h('div', { className: 'fg-preview', id, tabIndex: -1, role: 'group', 'aria-label': t(`species.${species.id}`) },
        h('div', { className: 'fg-previewArt' },
          h(FlowerArt, { speciesId: species.id, stage: 'bloom', variant, dna: sample ?? chosen?.dna ?? dna, trait, tint, presentation:specimenMode?'specimen':'living' }),
        ),
        h('div', { className: 'fg-previewBody' },
          h('div', { className: 'fg-previewHead' },
            h('span', { className: 'fg-previewName' }, bloomName({ species: species.id, tint, trait }, t)),
            h('span', { className: 'fg-previewVariant', 'data-variant': variant }, t(`variant.${variant}`)),
          ),
          h('div', { className: 'fg-previewLatin' }, t(`latin.${species.id}`)),
          modal ? h(SpeciesPurpose, { speciesId: species.id, t, observations }) : null,
          modal && species.source ? h('a', { className: 'fg-source', href: species.source, target: '_blank', rel: 'noopener noreferrer' }, t('eco.source')) : null,
          h('div', { className: 'fg-previewMeaning' }, t(`codex.${species.id}`)),
          modal ? h('span', { className: 'fg-note' }, t(specimenMode?'card.specimenTitle':sample!==null?'card.example':'card.living')) : null,
          modal ? h('p', { className: 'fg-cardFact' }, t(`fact.${species.id}`)) : null,
          trait ? h('p', { className: 'fg-note' }, traitCauseText(trait, t)) : null,
          trait && TRAIT_BY_ID.get(trait)?.source ? h('div', { className: 'fg-purpose' }, h('p',null,t(`trait.${traitFactId(trait)}.fact`)), h('a',{href:TRAIT_BY_ID.get(trait).source,target:'_blank',rel:'noopener noreferrer'},t('trait.source'))) : null,
          tint ? h('p', { className: 'fg-note' }, t('hybrid.how')) : null,
          modal ? h('div', { className: 'fg-previewStats' },
            h('span', null, `${t('card.ground')} · ${t(`scene.${SCENES.find(ground => ground.species.includes(species.id)).id}`)}`),
            h('span', null, `${t('card.grow')} · ${formatDuration(growMsOf(species), t)}`),
            h('span', null, `${t('card.seed')} · ${species.cost}`)) : null,
          (chosen?.dna ?? dna) ? h(GeneCard, { dna: chosen?.dna ?? dna, t }) : null,
          h('div', { className: 'fg-previewStats' },
            meta.filter(Boolean).map((line, index) => h('span', { key: index }, line)),
          ),
        ),
        h('div', { className: 'fg-previewActions' },
          individuals.length > 1 ? h('label', { className: 'fg-note' }, t('basket.individual'),
            h('select', { className: 'fg-btn', value: Math.min(individual, individuals.length - 1), onChange: event => setIndividual(Number(event.target.value)) },
              individuals.map((item, index) => h('option', { key: index, value: index }, t('basket.individualNo', { n: index + 1, max: individuals.length }))))) : null,
          chosen && onSellOne ? h('button', { type: 'button', className: oneArmed ? 'fg-btn fg-btnDanger' : 'fg-btn fg-btnPrimary', onClick: () => {
            if (!oneArmed) { setOneArmed(true); return }
            setOneArmed(false)
            onSellOne(chosen)
          } }, t(oneArmed ? 'basket.confirmOne' : 'basket.sellOne', { n: quoteOne(chosen) })) : null,
          onSell === undefined
            ? null
            : h('button', {
              type: 'button',
              className: armed ? 'fg-btn fg-btnDanger' : 'fg-btn fg-btnPrimary',
              onClick: onSell,
            }, armed ? t('basket.confirm', { n: worth }) : t('basket.sellAll', { n: worth })),
          modal ? h('button', { type: 'button', className: 'fg-btn', onClick: () => {setSpecimenMode(false);setSample(value => (value ?? dna ?? 0) + 7919)}, title: t('card.individual') }, t('card.another')) : null,
          modal && (sample!==null || specimenMode) ? h('button', { type: 'button', className: 'fg-btn fg-btnGhost', onClick: () => {setSample(null);setSpecimenMode(false)} }, t('card.returnLiving')) : null,
          modal && allowSpecimen && dna ? h('button', { type: 'button', className: 'fg-btn fg-btnGhost', 'aria-pressed':specimenMode, onClick: () => {setSample(null);setSpecimenMode(true)} }, t('card.specimen')) : null,
          onPrev ? h('button', { type: 'button', className: 'fg-btn fg-btnGhost', onClick: onPrev }, t('card.prev')) : null,
          onNext ? h('button', { type: 'button', className: 'fg-btn fg-btnGhost', onClick: onNext }, t('card.next')) : null,
          h('button', { type: 'button', className: 'fg-btn fg-btnGhost', onClick: onClose }, t('preview.close')),
        ),
      )
      return modal ? h('dialog', {
        ref: dialogRef, className: 'fg-dialog', 'aria-label': bloomName({ species: species.id, tint, trait }, t),
        onCancel: event => { event.preventDefault(); onClose() },
        onClick: event => { if (event.target === event.currentTarget) onClose() },
      }, card) : card
    }

    /** Optional activity panels; the owning view commits every returned transition. */
    function GardenActivities({ state, t, clock, onChange }) {
      const [armed, setArmed] = React.useState(null)
      const [notice, setNotice] = React.useState(null)
      const [selected, setSelected] = React.useState({})
      const show = showAt(state, clock)
      const entry = showEntry(state, clock)
      const nextTier = SHOW_TIERS.find(tier => tier.points > entry.points)
      const groups = new Map()
      for (const item of state.basket) {
        if (!showAccepts(show, item)) continue
        const key = itemKey(item)
        const previous = groups.get(key)
        groups.set(key, { key, items: [...(previous?.items ?? []), item], count: (previous?.count ?? 0) + 1 })
      }
      function nameOf(item) {
        const name = item.tint === undefined
          ? t(`species.${item.species}`)
          : t('hybrid.name', { tint: t(`species.${item.tint}`), form: t(`species.${item.species}`) })
        return [name, t(`variant.${item.variant}`), item.trait === undefined ? null : traitLabel(item.trait, t)]
          .filter(Boolean).join(' · ')
      }
      function enter(key, item) {
        const current = getState()
        const now = Date.now()
        const currentShow = showAt(current, now)
        const currentEntry = showEntry(current, now)
        const individualIndex = current.basket.indexOf(item)
        if (currentShow.id !== show.id || individualIndex < 0 || !showAccepts(currentShow, item)
          || currentEntry.entered >= SHOW_SLOTS) {
          setArmed(null)
          return
        }
        const points = showPoints(item, currentEntry)
        if (armed === null || armed.key !== key || armed.showId !== currentShow.id
          || armed.item !== item || armed.entered !== currentEntry.entered || armed.points !== points || armed.until < now) {
          setArmed({ key, item, showId: currentShow.id, entered: currentEntry.entered, points, until: now + 5000 })
          setNotice(null)
          return
        }
        setArmed(null)
        const next = exhibit(current, key, now, individualIndex)
        if (next === null) return
        onChange(next)
        setNotice({ kind: 'show', item, points: next.show.points - currentEntry.points,
          ribbons: (next.ribbons ?? 0) - (current.ribbons ?? 0) })
      }
      function upgrade(id) {
        const next = upgradeFacility(getState(), id)
        if (next === null) return
        setArmed(null)
        onChange(next)
        setNotice({ kind: 'facility', id, level: facilityLevel(next, id) })
      }
      const status = notice === null ? null : notice.kind === 'show'
        ? t('show.sent', { name: nameOf(notice.item), n: notice.points })
          + (notice.ribbons > 0 ? t('show.won', { n: notice.ribbons }) : '')
        : t('facility.done', { name: t(`facility.${notice.id}`), n: notice.level })
      return h(React.Fragment, null,
        h('section', { className: 'fg-section', id: 'fg-show', tabIndex: -1, 'aria-label': t('show.title') },
          h('div', { className: 'fg-sectionHead' },
            h('h2', { className: 'fg-sectionTitle' }, t('show.title')),
            h('span', { className: 'fg-sectionMeta' }, t('show.left', { n: formatDuration(Math.max(0, show.endsAt - clock), t) })),
            h('span', { className: 'fg-chip' },
              h('span', { className: 'fg-chipKey' }, t('ribbon.label')),
              h('span', { className: 'fg-chipValue' }, state.ribbons ?? 0))),
          h('div', { className: 'fg-order' },
            h('div', { className: 'fg-orderHead' },
              h('span', { className: 'fg-orderId' }, t('show.name', {
                season: t(`show.season.${show.season}`),
                theme: t(`show.theme.${show.theme}`, { scene: t(`scene.${show.sceneId}`) }),
              })),
              h('span', { className: 'fg-orderReward' }, t('show.points', { n: entry.points }))),
            h('p', { className: 'fg-hint' }, t(`show.desc.${show.theme}`, { scene: t(`scene.${show.sceneId}`) }), ' ', t('show.exception')),
            h('p', { className: 'fg-hint' }, t('show.rules', {
              slots: SHOW_SLOTS, a: SHOW_TIERS[0].points, b: SHOW_TIERS[1].points, c: SHOW_TIERS[2].points,
            })),
            h('div', { className: 'fg-sectionHead' },
              h('span', { className: 'fg-sectionMeta' }, t('show.entered', { n: entry.entered, max: SHOW_SLOTS })),
              h('span', { className: 'fg-sectionMeta' }, nextTier === undefined
                ? t('show.done') : t('show.next', { n: nextTier.points - entry.points })))),
          h('details', { className: 'fg-showChoices' },
            h('summary', { className: 'fg-btn' }, t('show.choose')),
          entry.entered >= SHOW_SLOTS
            ? h('p', { className: 'fg-empty' }, t('show.full'))
            : groups.size === 0
              ? h('p', { className: 'fg-empty' }, t('show.none'))
              : h('div', { className: 'fg-orders' }, Array.from(groups.values(), ({ key, items, count }) => {
                const selectedIndex = Math.min(selected[key] ?? 0, items.length - 1)
                const item = items[selectedIndex]
                const points = showPoints(item, entry)
                const confirming = armed !== null && armed.key === key && armed.showId === show.id && armed.item === item
                  && armed.entered === entry.entered && armed.points === points && armed.until >= clock
                return h('div', { className: 'fg-order', key },
                  h('div', { className: 'fg-art' }, h(FlowerArt, {
                    speciesId: item.species, stage: 'bloom', variant: item.variant,
                    dna: item.dna, trait: item.trait, tint: item.tint,
                  })),
                  h('div', { className: 'fg-orderHead' },
                    h('span', { className: 'fg-orderId' }, nameOf(item)),
                    h('span', { className: 'fg-orderReward' }, `×${count}`)),
                  count > 1 ? h('label', { className: 'fg-note' }, t('basket.individual'),
                    h('select', { className: 'fg-btn', value: selectedIndex, onChange: event => { setSelected(value => ({ ...value, [key]: Number(event.target.value) })); setArmed(null) } },
                      items.map((bloom, index) => h('option', { key: index, value: index }, t('basket.individualNo', { n: index + 1, max: count }))))) : null,
                  h('button', {
                    type: 'button', className: confirming ? 'fg-btn fg-btnDanger' : 'fg-btn fg-btnPrimary',
                    onClick: () => enter(key, item),
                  }, t(confirming ? 'show.confirm' : 'show.enter', { n: points })))
              })),
        ),
        ),
        h('section', { className: 'fg-section', 'aria-label': t('facility.title') },
          h('h2', { className: 'fg-sectionTitle' }, t('facility.title')),
          h('p', { className: 'fg-hint' }, t('facility.note')),
          h('div', { className: 'fg-orders' }, FACILITIES.map(facility => {
            const level = facilityLevel(state, facility.id)
            const cost = facilityCost(facility.id, level)
            const shortCoins = cost === null ? 0 : Math.max(0, cost.coins - state.coins)
            const shortRibbons = cost === null ? 0 : Math.max(0, cost.ribbons - (state.ribbons ?? 0))
            return h('div', { className: 'fg-order', key: facility.id },
              h('div', { className: 'fg-orderHead' },
                h('span', { className: 'fg-orderId' }, t(`facility.${facility.id}`)),
                h('span', { className: 'fg-orderReward' }, t('facility.level', { n: level, max: FACILITY_MAX }))),
              h('p', { className: 'fg-hint' }, t(`facility.${facility.id}.note`, { n: Math.round(level * facility.step * 100) })),
              cost === null ? h('span', { className: 'fg-sectionMeta' }, t('facility.max'))
                : h(React.Fragment, null,
                  h('span', { className: 'fg-sectionMeta' }, t(cost.ribbons > 0 ? 'facility.costRibbon' : 'facility.cost', cost)),
                  shortCoins > 0 ? h('span', { className: 'fg-sectionWarn' }, t('facility.short', { n: shortCoins })) : null,
                  shortRibbons > 0 ? h('span', { className: 'fg-sectionWarn' }, t('facility.shortRibbon', { n: shortRibbons })) : null,
                  h('button', {
                    type: 'button', className: 'fg-btn fg-btnPrimary', disabled: shortCoins > 0 || shortRibbons > 0,
                    onClick: () => upgrade(facility.id),
                  }, t('facility.upgrade'))))
          }))),
        h('div', { className: 'fg-sectionMeta', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' }, status),
      )
    }


// Drawings for the seventeen species of the alpine, rainforest, coast and eastern-garden grounds.
function turned(key, deg, x, y, kids) { return h('g', { key, transform: `rotate(${deg} ${x} ${y})` }, ...kids) }
function tuft(ink, count, len, w, spread) { return Array.from({ length: count }, (_, i) => leaf(ink, `t${i}`, { x: 50, y: 88, len: len - (i % 3) * 2, w, rot: -spread + (i * 2 * spread) / (count - 1) })) }
const MORE_PLANTS = {
 alpineaster(ink,st){const y=st.top+6,parts=[stem(ink,y+4,{w:1.7}),...tuft(ink,6,20,4,70)];if(!st.bloom)return[...parts,bud(ink,'b',50,y+4,{len:10,w:6})];return[...parts,...regionRay(ink,'ray',50,y,22,13,2.6),regionCore(ink,'core',50,y,4.6)]},
 pasqueflower(ink,st){const y=st.top+10,parts=[stem(ink,y+4,{w:2.2})];for(let i=0;i<5;i++)parts.push(leaf(ink,`f${i}`,{x:50,y:86,len:24,w:11,rot:-80+i*40,shape:'pinnate',veins:4}));parts.push(...[-1,0,1].map(i=>leaf(ink,`c${i}`,{x:50,y:y+14,len:9,w:3,rot:i*60})));if(!st.bloom)return[...parts,bud(ink,'b',50,y+4,{len:12,w:8})];return[...parts,...regionRay(ink,'tep',50,y,6,14,9.5),regionCore(ink,'boss',50,y,5.4)]},
 gentian(ink,st){const y=st.top+24,parts=[stem(ink,y+6,{w:1.8})];for(let i=0;i<6;i++)parts.push(leaf(ink,`r${i}`,{x:50,y:88,len:15,w:6,rot:-75+i*30}));if(!st.bloom)return[...parts,bud(ink,'b',50,y+8,{len:13,w:6})];return[...parts,h('path',{key:'tube',d:`M45,${y+10}Q43,${y-6} 37,${y-15}L44,${y-10}L50,${y-17}L56,${y-10}L63,${y-15}Q57,${y-6} 55,${y+10}Z`,fill:ink.petal,stroke:ink.line,strokeWidth:.5}),h('path',{key:'throat',d:`M45,${y-9}Q50,${y-1} 55,${y-9}`,fill:'none',stroke:ink.pal.center,strokeWidth:1.3}),h('path',{key:'stripe',d:`M48,${y+7}L47,${y-6}M52,${y+7}L53,${y-6}`,fill:'none',stroke:ink.pal.petalDeep,strokeWidth:.6})]},
 alpinecolumbine(ink,st){const y=st.top+8,parts=[stemPath('scape',`M50,88Q46,60 50,${y+6}`,ink.pal.stem,1.7)];for(let i=0;i<3;i++)parts.push(turned(`lf${i}`,-50+i*50,50,84,[...regionRay(ink,`l${i}`,50,74,3,8,7,ink.leaf)]));if(!st.bloom)return[...parts,bud(ink,'b',50,y+6,{len:12,w:6,rot:160})];const spurs=Array.from({length:5},(_,i)=>turned(`sp${i}`,i*72+36,50,y,[h('path',{key:'s',d:`M50,${y-9}Q48,${y-19} 53,${y-21}`,fill:'none',stroke:ink.pal.petalDeep,strokeWidth:1.4,strokeLinecap:'round'})]));return[...parts,...spurs,...regionRay(ink,'sep',50,y,5,15,7),turned('cup',36,50,y,regionRay(ink,'cup',50,y,5,8,5.5,ink.pal.center)),regionCore(ink,'core',50,y,2.6)]},
 anthurium(ink,st){const y=st.top+12,parts=[stemPath('pet',`M50,89Q54,66 50,${y+12}`,ink.pal.stem,2),nfHeartLeaf(ink,'la',34,80,.95,-35),nfHeartLeaf(ink,'lb',68,82,.85,40)];if(!st.bloom)return[...parts,bud(ink,'b',50,y+12,{len:15,w:7})];return[...parts,h('path',{key:'spathe',d:`M50,${y+14}C30,${y+8} 26,${y-12} 38,${y-17}C45,${y-20} 49,${y-13} 50,${y-10}C51,${y-13} 56,${y-20} 63,${y-16}C74,${y-10} 70,${y+8} 50,${y+14}Z`,fill:ink.petal,stroke:ink.line,strokeWidth:.5}),h('path',{key:'gloss',d:`M36,${y-9}Q33,${y} 41,${y+6}`,fill:'none',stroke:'#fff',strokeWidth:1.6,opacity:.35,strokeLinecap:'round'}),h('path',{key:'spadix',d:`M49,${y-9}Q51,${y-22} 56,${y-25}Q58,${y-14} 52,${y-8}Z`,fill:ink.pal.center,stroke:ink.pal.centerDeep,strokeWidth:.4})]},
 heliconia(ink,st){const parts=[stemPath('cane','M46,90Q42,50 52,16',ink.pal.stem,2.4),leaf(ink,'pa',{x:46,y:70,len:38,w:13,rot:-48,veins:7}),leaf(ink,'pb',{x:47,y:58,len:32,w:11,rot:42,veins:6})];if(!st.bloom)return[...parts,bud(ink,'b',52,18,{len:14,w:6,rot:150})];parts.push(stemPath('rachis','M52,16Q62,22 60,74',ink.pal.petalDeep,1.3));for(let i=0;i<7;i++){const y=24+i*7,s=i%2?1:-1;parts.push(h('g',{key:`br${i}`,transform:`translate(60 ${y}) scale(${s} 1)`},h('path',{d:'M0,0Q9,-1 13,7Q6,8 0,5Z',fill:ink.petal,stroke:ink.line,strokeWidth:.4}),h('path',{d:'M9,3.4Q12,4 13,7Q10.5,7.4 8.4,6.8Z',fill:ink.pal.center}),h('path',{d:'M11.6,5.4L13,7',stroke:ink.pal.centerDeep,strokeWidth:.9})))}return parts},
 passionflower(ink,st){const y=st.top+6,parts=[stemPath('vine',`M44,90Q58,70 46,54Q40,44 50,${y+4}`,ink.pal.stem,1.6),stemPath('tendril','M47,56q9,-2 8,5q-1,5 -6,3',ink.pal.stem,.7)];for(const[i,x,ly,r]of[[0,45,74,-60],[1,54,62,55]])parts.push(turned(`pl${i}`,r,x,ly,regionRay(ink,`p${i}`,x,ly-9,3,9,6,ink.leaf)));if(!st.bloom)return[...parts,bud(ink,'b',50,y+4,{len:12,w:7})];const corona=Array.from({length:30},(_,i)=>{const a=polar(50,y,4.5,i*12),b=polar(50,y,10.5,i*12);return h('path',{key:`c${i}`,d:`M${n(a.x??a[0])},${n(a.y??a[1])}L${n(b.x??b[0])},${n(b.y??b[1])}`,stroke:ink.pal.petalDeep,strokeWidth:.7})});return[...parts,...regionRay(ink,'tep',50,y,10,15,5.5),...corona,h('circle',{key:'ring',cx:50,cy:y,r:5,fill:ink.pal.centerDeep,opacity:.55}),h('circle',{key:'eye',cx:50,cy:y,r:3,fill:ink.pal.center}),...[0,120,240].map(a=>turned(`st${a}`,a,50,y,[h('path',{key:'s',d:`M50,${y}L50,${y-6}M48,${y-6}L52,${y-6}`,stroke:ink.pal.centerDeep,strokeWidth:.9,fill:'none'})]))]},
 moonorchid(ink,st){const parts=[stemPath('spray','M48,88Q40,52 58,30Q66,22 72,26',ink.pal.stem,1.5),leaf(ink,'la',{x:48,y:88,len:26,w:11,rot:-72,veins:1}),leaf(ink,'lb',{x:48,y:88,len:22,w:10,rot:68,veins:1}),stemPath('root','M48,88q-9,2 -12,6M49,88q8,3 11,5','#b9c7b0',1.4)];const spots=[[46,52,1],[57,34,.9],[70,27,.72]];for(const[i,[x,y,k]]of spots.entries()){if(!st.bloom){parts.push(bud(ink,`b${i}`,x,y,{len:9*k,w:6*k,rot:i*40-30}));continue}parts.push(h('g',{key:`o${i}`,transform:`translate(${x} ${y}) scale(${k})`},...regionRay(ink,'sep',0,0,3,10,5.5,ink.back),h('ellipse',{cx:-7,cy:-1,rx:7,ry:6,fill:ink.petal,stroke:ink.line,strokeWidth:.4}),h('ellipse',{cx:7,cy:-1,rx:7,ry:6,fill:ink.petal,stroke:ink.line,strokeWidth:.4}),h('path',{d:'M-3,1Q0,8 3,1Q0,-2 -3,1Z',fill:ink.pal.center,stroke:ink.pal.centerDeep,strokeWidth:.5}),h('circle',{cx:0,cy:0,r:1.2,fill:ink.pal.centerDeep})))}return parts},
 seathrift(ink,st){const parts=[...tuft(ink,11,17,2.2,82)];for(const[i,[x,y]]of[[40,st.top+14],[51,st.top+4],[62,st.top+16]].entries()){parts.push(stemPath(`s${i}`,`M50,88Q${x},64 ${x},${y+5}`,ink.pal.stem,1));if(!st.bloom){parts.push(bud(ink,`b${i}`,x,y+5,{len:7,w:6}));continue}parts.push(h('circle',{key:`g${i}`,cx:x,cy:y,r:6.4,fill:ink.back}),...regionRay(ink,`f${i}`,x,y,9,6.6,4.2),h('circle',{key:`c${i}`,cx:x,cy:y,r:2.3,fill:ink.pal.center}))}return parts},
 spanishlavender(ink,st){const y=st.top+12,parts=[stem(ink,y+10,{w:1.5})];for(let i=0;i<8;i++)parts.push(leaf(ink,`g${i}`,{x:50,y:88-(i>>1)*7,len:15,w:2.8,rot:i%2?52:-52,fill:ink.leafBack}));if(!st.bloom)return[...parts,bud(ink,'b',50,y+10,{len:12,w:6})];for(let r=0;r<5;r++)for(const dx of[-2.6,0,2.6])parts.push(h('ellipse',{key:`k${r}${dx}`,cx:50+dx,cy:y+9-r*3.4,rx:2.2,ry:2.1,fill:ink.pal.petalDeep,stroke:ink.line,strokeWidth:.3}));return[...parts,...[-24,0,24].map(a=>petal(`ear${a}`,{x:50,y:y-6,rot:a,len:12,w:4.6,fill:ink.petal,stroke:ink.line,vein:ink.line}))]},
 rockrose(ink,st){const y=st.top+8,parts=[stem(ink,y+4,{w:2})];for(let i=0;i<6;i++)parts.push(leaf(ink,`o${i}`,{x:50,y:84-(i>>1)*9,len:15,w:8,rot:i%2?62:-62,veins:4}));if(!st.bloom)return[...parts,bud(ink,'b',50,y+4,{len:11,w:8})];return[...parts,...regionRay(ink,'pet',50,y,5,14,13.5),...Array.from({length:5},(_,i)=>turned(`cr${i}`,i*72,50,y,[h('path',{key:'c',d:`M47,${y-11}q3,-2 6,0M46,${y-8}q4,-2 8,0`,fill:'none',stroke:ink.line,strokeWidth:.4,opacity:.6})])),regionCore(ink,'boss',50,y,4.4)]},
 oleander(ink,st){const top=st.top+2,parts=[stem(ink,top+12,{w:2.3})];for(let i=0;i<9;i++)parts.push(leaf(ink,`w${i}`,{x:50,y:84-Math.floor(i/3)*12,len:25,w:4.4,rot:[-62,0,62][i%3]+(i%3===1?(i>4?14:-14):0),veins:1}));for(const[i,[x,y]]of[[41,top+10],[59,top+9],[50,top]].entries()){if(!st.bloom){parts.push(bud(ink,`b${i}`,x,y+4,{len:9,w:4}));continue}parts.push(turned(`fl${i}`,i*24,x,y,[...regionRay(ink,`l${i}`,x,y,5,8.6,6.4),h('circle',{key:'t',cx:x,cy:y,r:2.4,fill:ink.pal.center,stroke:ink.pal.centerDeep,strokeWidth:.5})]))}return parts},
 bougainvillea(ink,st){const parts=[stemPath('cane','M44,90Q36,58 58,34Q68,24 76,30',ink.pal.stem,2),stemPath('thorn','M41,70l-4,-2M47,52l-4,-3',ink.pal.stem,.8)];for(const[i,[x,y,r]]of[[40,74,-70],[44,58,60],[52,44,-40],[66,30,50]].entries())parts.push(leaf(ink,`ov${i}`,{x,y,len:14,w:8,rot:r,veins:3}));for(const[i,[x,y]]of[[46,48],[60,31],[73,29]].entries()){if(!st.bloom){parts.push(bud(ink,`b${i}`,x,y,{len:8,w:5,rot:i*30}));continue}parts.push(turned(`cl${i}`,i*40,x,y,[...regionRay(ink,`br${i}`,x,y,3,11,9.5),...[0,120,240].map(a=>{const p=polar(x,y,1.8,a);return h('circle',{key:`w${a}`,cx:n(p.x??p[0]),cy:n(p.y??p[1]),r:1,fill:ink.pal.center,stroke:ink.pal.centerDeep,strokeWidth:.3})})]))}return parts},
 azalea(ink,st){const parts=[stemPath('twig','M50,90Q48,70 50,54M50,66Q40,58 38,46M50,62Q60,54 63,44',ink.pal.stem,1.9)];for(const[i,[x,y,r]]of[[44,76,-65],[56,74,62],[42,60,-40],[59,58,44],[50,58,0]].entries())parts.push(leaf(ink,`e${i}`,{x,y,len:12,w:6.5,rot:r,veins:2}));for(const[i,[x,y]]of[[38,st.top+8],[63,st.top+7],[50,st.top-2]].entries()){if(!st.bloom){parts.push(bud(ink,`b${i}`,x,y+5,{len:10,w:5}));continue}parts.push(...regionRay(ink,`f${i}`,x,y,5,10.5,8),h('path',{key:`sp${i}`,d:`M${x-1.6},${y-6}h.1M${x+1.2},${y-7}h.1M${x},${y-4.6}h.1`,stroke:ink.pal.centerDeep,strokeWidth:1.1,strokeLinecap:'round'}),h('path',{key:`an${i}`,d:`M${x},${y}l-3,5M${x},${y}l0,6M${x},${y}l3,5`,stroke:ink.pal.center,strokeWidth:.6}))}return parts},
 chrysanthemum(ink,st){const y=st.top+8,parts=[stem(ink,y+4,{w:2.2})];for(let i=0;i<5;i++)parts.push(leaf(ink,`lo${i}`,{x:50,y:84-i*7,len:18,w:10,rot:i%2?58:-58,shape:'runcinate',veins:4}));if(!st.bloom)return[...parts,bud(ink,'b',50,y+4,{len:11,w:9})];return[...parts,...regionRay(ink,'outer',50,y,26,16,3,ink.back),turned('mid',7,50,y,regionRay(ink,'mid',50,y,20,12,3)),turned('in',15,50,y,regionRay(ink,'in',50,y,13,7.5,2.8)),h('circle',{key:'eye',cx:50,cy:y,r:2.2,fill:ink.pal.center})]},
 wisteria(ink,st){const parts=[stemPath('trunk','M40,90Q34,54 44,24Q56,12 78,20',ink.pal.stem,2.6),stemPath('twine','M41,70q8,-3 5,-11q-3,-7 4,-10',ink.pal.stem,.9)];for(const[bx,by,r]of[[44,26,-150],[70,18,165]])for(let i=0;i<5;i++)for(const s of[-1,1])parts.push(turned(`pn${bx}${i}${s}`,r,bx,by,[leaf(ink,'l',{x:bx,y:by-4-i*4.5,len:7,w:3.2,rot:s*70,veins:0})]));for(const[k,[x,y0,rows]]of[[56,18,9],[68,20,6]].entries()){parts.push(stemPath(`ax${k}`,`M${x},${y0}L${x},${y0+rows*4.6}`,ink.pal.stem,.6));for(let i=0;i<rows;i++){const y=y0+4+i*4.6,w=Math.max(1.4,4.6-i*.42);if(!st.bloom){parts.push(h('ellipse',{key:`bd${k}${i}`,cx:x,cy:y,rx:w*.5,ry:1.6,fill:ink.back}));continue}parts.push(h('ellipse',{key:`wl${k}${i}`,cx:x-w*.6,cy:y,rx:w*.62,ry:2.2,fill:ink.petal,stroke:ink.line,strokeWidth:.3}),h('ellipse',{key:`wr${k}${i}`,cx:x+w*.6,cy:y,rx:w*.62,ry:2.2,fill:ink.petal,stroke:ink.line,strokeWidth:.3}),h('circle',{key:`wk${k}${i}`,cx:x,cy:y+.6,r:w*.26,fill:ink.pal.center}))}}return parts},
 treepeony(ink,st){const y=st.top+9,parts=[stemPath('wood',`M50,90Q46,72 50,${y+8}`,ink.pal.stem,2.8)];for(let i=0;i<4;i++)parts.push(leaf(ink,`dv${i}`,{x:50,y:82-(i>>1)*10,len:22,w:13,rot:i%2?60:-60,shape:'pinnate',veins:5}));if(!st.bloom)return[...parts,bud(ink,'b',50,y+6,{len:14,w:11})];return[...parts,...regionRay(ink,'guard',50,y,9,18,13,ink.back),turned('two',20,50,y,regionRay(ink,'two',50,y,8,14.5,11)),turned('three',44,50,y,regionRay(ink,'three',50,y,7,10.5,9)),turned('four',10,50,y,regionRay(ink,'four',50,y,5,6.5,6.5,ink.back)),regionCore(ink,'gold',50,y,3.4)]},
}
Object.assign(PLANTS, MORE_PLANTS)
const MORE_GROUND = {
 alpine:()=>h('g',{key:'ground'},h('ellipse',{cx:50,cy:90,rx:26,ry:6,fill:'#7c8a78'}),h('path',{d:'M27 89Q40 82 52 87Q64 82 74 89Q54 95 27 89Z',fill:'#7fa66a'}),h('path',{d:'M33 88l4 -4 5 4ZM60 89l5 -5 5 5Z',fill:'#a9b1ad'})),
 rainforest:()=>h('g',{key:'ground'},h('ellipse',{cx:50,cy:90,rx:26,ry:6,fill:'#4a3a2b'}),h('path',{d:'M26 89Q38 83 50 88Q62 83 75 89Q55 95 26 89Z',fill:'#2f6b4a'}),h('path',{d:'M31 88q4,-7 9,-1M62 88q5,-7 9,0',fill:'none',stroke:'#58a06b',strokeWidth:1.4})),
 coast:()=>h('g',{key:'ground'},h('ellipse',{cx:50,cy:90,rx:26,ry:6,fill:'#d9c79a'}),h('path',{d:'M27 90Q44 86 73 89',fill:'none',stroke:'#f3e8c8',strokeWidth:1.2}),h('circle',{cx:35,cy:89,r:1.6,fill:'#a79f92'}),h('circle',{cx:65,cy:91,r:1.2,fill:'#bdb3a2'}),h('path',{d:'M58 88q3,-3 6,0',fill:'none',stroke:'#e9a0a8',strokeWidth:1})),
 garden:()=>h('g',{key:'ground'},h('ellipse',{cx:50,cy:90,rx:26,ry:6,fill:'#7a6850'}),h('path',{d:'M27 89Q39 84 50 88Q62 84 74 89Q55 94 27 89Z',fill:'#84a86a'}),h('ellipse',{cx:36,cy:89,rx:4,ry:1.8,fill:'#9a9a94'}),h('ellipse',{cx:64,cy:90,rx:3,ry:1.5,fill:'#b0b0a8'})),
}

// Six more woodland and six more desert plants.
Object.assign(PLANTS, {
 woodsorrel(ink,st){const y=st.top+22,parts=[stemPath('sc',`M50,88Q52,72 50,${y+4}`,ink.pal.stem,1.2)];for(const[i,[x,ly]]of[[35,80],[65,82],[50,87]].entries())for(const r of[0,120,240])parts.push(nfHeartLeaf(ink,`h${i}${r}`,x,ly,.42,r));if(!st.bloom)return[...parts,bud(ink,'b',50,y+4,{len:9,w:5})];return[...parts,...regionRay(ink,'pet',50,y,5,11,7.5),...Array.from({length:5},(_,i)=>turned(`v${i}`,i*72,50,y,[h('path',{key:'v',d:`M49,${y-3}L48.4,${y-8}M51,${y-3}L51.6,${y-8}`,stroke:'#d77f9c',strokeWidth:.4,fill:'none'})])),regionCore(ink,'c',50,y,2.2)]},
 wildgarlic(ink,st){const y=st.top+10,parts=[stem(ink,y+6,{w:1.6}),leaf(ink,'la',{x:50,y:88,len:36,w:13,rot:-34,veins:5}),leaf(ink,'lb',{x:50,y:88,len:32,w:12,rot:38,veins:5})];if(!st.bloom)return[...parts,bud(ink,'b',50,y+6,{len:12,w:7})];for(let i=0;i<9;i++){const[x,fy]=i===0?[50,y]:polar(50,y,9,i*45);parts.push(stemPath(`r${i}`,`M50,${y+6}L${x},${fy}`,ink.pal.stem,.4),...regionRay(ink,`s${i}`,x,fy,6,4.4,1.9),h('circle',{key:`c${i}`,cx:x,cy:fy,r:.9,fill:ink.pal.centerDeep}))}return parts},
 sweetviolet(ink,st){const y=st.top+24,parts=[];for(const[i,[x,ly,r,k]]of[[36,84,-40,.75],[64,84,40,.75],[50,88,0,.85],[42,76,-20,.55],[59,76,24,.55]].entries())parts.push(nfHeartLeaf(ink,`k${i}`,x,ly,k,r));parts.push(stemPath('ped',`M50,86Q46,${y+16} 50,${y+2}`,ink.pal.stem,1.1));if(!st.bloom)return[...parts,bud(ink,'b',50,y+2,{len:9,w:5,rot:150})];return[...parts,...[-28,28].map(r=>petal(`up${r}`,{x:50,y,rot:r,len:10,w:6.5,fill:ink.back,stroke:ink.line})),...[-105,105].map(r=>petal(`side${r}`,{x:50,y,rot:r,len:9,w:6,fill:ink.petal,stroke:ink.line})),petal('lip',{x:50,y,rot:180,len:10,w:8,fill:ink.petal,stroke:ink.line,vein:ink.pal.petalDeep}),h('circle',{key:'eye',cx:50,cy:y,r:1.7,fill:ink.pal.center,stroke:ink.pal.centerDeep,strokeWidth:.4})]},
 lilyofthevalley(ink,st){const parts=[leaf(ink,'la',{x:48,y:88,len:44,w:15,rot:-22,veins:6}),leaf(ink,'lb',{x:50,y:88,len:38,w:14,rot:26,veins:6}),stemPath('scape','M50,88Q50,52 64,34',ink.pal.stem,1.1)];for(let i=0;i<7;i++){const t=i/6,x=52+t*11,y=62-t*26;if(!st.bloom){parts.push(h('circle',{key:`b${i}`,cx:x+3,cy:y+3,r:1.7,fill:ink.back,stroke:ink.line,strokeWidth:.3}));continue}parts.push(h('g',{key:`bell${i}`,transform:`translate(${n(x+4)} ${n(y+2)})`},h('path',{d:'M-4,-2q4,-3 0,-3',fill:'none',stroke:ink.pal.stem,strokeWidth:.5}),h('path',{d:'M-3,0Q-4,-5 0,-5Q4,-5 3,0L4,2L2,1L0,2.4L-2,1L-4,2Z',fill:ink.petal,stroke:ink.line,strokeWidth:.4})))}return parts},
 solomonsseal(ink,st){const parts=[stemPath('arch','M40,90Q34,44 78,34',ink.pal.stem,1.8)];for(let i=0;i<7;i++){const t=(i+1)/8,x=40+(78-40)*t*t+(-12)*2*t*(1-t),y=90+(34-90)*t*t+(-92)*t*(1-t);parts.push(leaf(ink,`l${i}`,{x:n(x),y:n(y),len:17,w:8,rot:i%2?40:-25,veins:4}));if(i<1)continue;if(!st.bloom){parts.push(h('ellipse',{key:`b${i}`,cx:n(x+1),cy:n(y+5),rx:1.2,ry:2.6,fill:ink.back}));continue}parts.push(h('g',{key:`f${i}`,transform:`translate(${n(x+1)} ${n(y+2)})`},h('path',{d:'M-1.6,0L-1.9,7Q0,8.4 1.9,7L1.6,0Z',fill:ink.petal,stroke:ink.line,strokeWidth:.35}),h('path',{d:'M-1.9,7L-2.6,9L-.8,8.2L0,9.6L.8,8.2L2.6,9L1.9,7Z',fill:ink.pal.petalDeep})))}return parts},
 trillium(ink,st){const y=st.top+12,parts=[stem(ink,y+10,{w:2.2}),...[-100,0,100].map(r=>petal(`br${r}`,{x:50,y:y+10,rot:r,len:26,w:19,fill:ink.leaf,stroke:ink.leafLine,vein:ink.rib}))];if(!st.bloom)return[...parts,bud(ink,'b',50,y+8,{len:13,w:8})];return[...parts,...[60,180,300].map(r=>petal(`sep${r}`,{x:50,y,rot:r,len:13,w:5,fill:ink.leafBack,stroke:ink.leafLine})),...regionRay(ink,'pet',50,y,3,18,13),regionCore(ink,'c',50,y,2.8)]},
 sandverbena(ink,st){const parts=[stemPath('trail','M30,89Q44,84 50,70Q54,60 50,48',ink.pal.stem,1.5),stemPath('side','M48,78Q60,74 68,62',ink.pal.stem,1.2)];for(const[i,[x,y,r]]of[[34,88,-80],[42,84,60],[50,74,-60],[52,62,70],[60,72,80]].entries())parts.push(leaf(ink,`o${i}`,{x,y,len:11,w:8,rot:r,veins:2}));for(const[k,[cx,cy,rad]]of[[50,st.top+12,9],[68,60,6.5]].entries()){if(!st.bloom){parts.push(bud(ink,`b${k}`,cx,cy+3,{len:8,w:6}));continue}parts.push(h('circle',{key:`g${k}`,cx,cy,r:rad,fill:ink.back}));for(let i=0;i<9;i++){const[x,y]=i===0?[cx,cy]:polar(cx,cy,rad*.66,i*45);parts.push(...regionRay(ink,`f${k}${i}`,x,y,5,rad*.36,rad*.26),h('circle',{key:`e${k}${i}`,cx:x,cy:y,r:.8,fill:ink.pal.center}))}}return parts},
 globemallow(ink,st){const parts=[stemPath('cane','M50,90Q46,60 52,22',ink.pal.stem,1.8)];for(let i=0;i<5;i++)parts.push(leaf(ink,`g${i}`,{x:49,y:86-i*9,len:15,w:11,rot:i%2?62:-62,shape:'runcinate',veins:3,fill:ink.leafBack}));for(const[i,[x,y,k]]of[[42,58,1],[58,46,1],[46,36,.9],[53,st.top-4,.8]].entries()){if(!st.bloom){parts.push(bud(ink,`b${i}`,x,y,{len:7,w:5}));continue}parts.push(...regionRay(ink,`c${i}`,x,y,5,7.5*k,6.4*k),h('circle',{key:`t${i}`,cx:x,cy:y,r:1.9*k,fill:ink.pal.center,stroke:ink.pal.centerDeep,strokeWidth:.4}))}return parts},
 brittlebush(ink,st){const parts=[];for(let i=0;i<11;i++)parts.push(leaf(ink,`m${i}`,{x:50,y:88,len:17+(i%3)*3,w:9,rot:-85+i*17,fill:ink.leafBack,veins:2}));for(const[i,[x,y]]of[[36,st.top+16],[50,st.top+4],[65,st.top+14]].entries()){parts.push(stemPath(`s${i}`,`M50,82Q${x},60 ${x},${y+4}`,ink.pal.stem,.9));if(!st.bloom){parts.push(bud(ink,`b${i}`,x,y+4,{len:7,w:5}));continue}parts.push(...regionRay(ink,`r${i}`,x,y,13,8,3),h('circle',{key:`d${i}`,cx:x,cy:y,r:3,fill:ink.pal.center,stroke:ink.pal.centerDeep,strokeWidth:.4}))}return parts},
 desertlily(ink,st){const parts=[stem(ink,st.top+6,{w:2})];for(const[i,r]of[-70,-38,36,72].entries())parts.push(h('path',{key:`w${i}`,transform:`translate(50 88) rotate(${r})`,d:'M0,0q-3,-5 0,-9q3,-5 0,-9q-3,-5 0,-9q2,-3 0,-6q-1,3 1.6,6q3,5 0,9q-3,5 0,9q3,5 0,9Z',fill:ink.leaf,stroke:ink.leafLine,strokeWidth:.4}));for(const[i,[y,r]]of[[st.top+22,-58],[st.top+14,56],[st.top+4,-20]].entries()){if(!st.bloom){parts.push(bud(ink,`b${i}`,50,y,{len:11,w:4,rot:r}));continue}parts.push(h('g',{key:`f${i}`,transform:`translate(50 ${y}) rotate(${r})`},h('path',{d:'M-1.6,0Q-3,-9 -8,-15L-3.4,-13L0,-18L3.4,-13L8,-15Q3,-9 1.6,0Z',fill:ink.petal,stroke:ink.line,strokeWidth:.45}),h('path',{d:'M0,-2L0,-15M-2,-4L-5,-13M2,-4L5,-13',fill:'none',stroke:ink.pal.petalDeep,strokeWidth:.7}),h('path',{d:'M-1,-10l0,-4M1,-10l0,-4',stroke:ink.pal.center,strokeWidth:.7})))}return parts},
 ocotillo(ink,st){const parts=[];for(const[i,[tx,ty,cx]]of[[26,30,38],[38,18,44],[50,12,50],[62,18,56],[74,30,62]].entries()){parts.push(stemPath(`c${i}`,`M50,90Q${cx},56 ${tx},${ty}`,ink.pal.stem,1.7));for(let j=1;j<6;j++){const t=j/6,x=50*(1-t)*(1-t)+2*cx*t*(1-t)+tx*t*t,y=90*(1-t)*(1-t)+2*56*t*(1-t)+ty*t*t;parts.push(leaf(ink,`l${i}${j}`,{x:n(x),y:n(y),len:4.5,w:2.4,rot:j%2?70:-70,veins:0}))}if(!st.bloom){parts.push(bud(ink,`b${i}`,tx,ty,{len:6,w:3,rot:(tx-50)*1.4}));continue}parts.push(h('g',{key:`t${i}`,transform:`translate(${tx} ${ty}) rotate(${(tx-50)*1.4})`},...[-24,0,24].map(r=>petal(`p${r}`,{x:0,y:0,rot:r,len:10,w:3,fill:ink.petal,stroke:ink.line})),h('path',{d:'M0,-9l0,-3M-3,-8l-1,-3M3,-8l1,-3',stroke:ink.pal.center,strokeWidth:.6})))}return parts},
 saguaro(ink,st){const g=ink.pal.stem,parts=[h('path',{key:'armL',d:'M43,64Q30,64 30,52L30,44Q30,40 33.500,40Q37,40 37,44L37,52Q37,57 43,57Z',fill:g,stroke:ink.leafLine,strokeWidth:.5}),h('path',{key:'armR',d:'M57,70Q71,70 71,58L71,48Q71,44 67.500,44Q64,44 64,48L64,58Q64,63 57,63Z',fill:g,stroke:ink.leafLine,strokeWidth:.5}),h('path',{key:'col',d:'M42,90L42,26Q42,17 50,17Q58,17 58,26L58,90Z',fill:g,stroke:ink.leafLine,strokeWidth:.5}),h('path',{key:'ribs',d:'M46,88L46,22M50,88L50,18M54,88L54,22M33.5,54L33.5,42M67.5,60L67.5,46',fill:'none',stroke:ink.rib,strokeWidth:.5,opacity:.7})];for(const[i,[x,y]]of[[45,18],[55,18],[50,14],[33.5,39],[67.5,43]].entries()){if(!st.bloom){parts.push(h('ellipse',{key:`b${i}`,cx:x,cy:y,rx:1.6,ry:2.4,fill:ink.leafBack,stroke:ink.leafLine,strokeWidth:.3}));continue}parts.push(...regionRay(ink,`f${i}`,x,y-1,9,4.6,2.4),h('circle',{key:`y${i}`,cx:x,cy:y-1,r:1.7,fill:ink.pal.center,stroke:ink.pal.centerDeep,strokeWidth:.3}))}return parts},
})

// Six more alpine and six more rainforest plants.
Object.assign(PLANTS, {
 mosscampion(ink,st){const parts=[h('ellipse',{key:'cush',cx:50,cy:82,rx:27,ry:11,fill:ink.leaf,stroke:ink.leafLine,strokeWidth:.5}),...tuft(ink,9,9,2,80)];for(const[i,[x,y]]of[[32,80],[41,75],[50,73],[59,75],[68,80],[45,82],[56,82],[37,86],[63,86]].entries()){if(!st.bloom){if(i%2===0)parts.push(h('circle',{key:`b${i}`,cx:x,cy:y,r:1.6,fill:ink.back,stroke:ink.line,strokeWidth:.3}));continue}parts.push(...regionRay(ink,`f${i}`,x,y,5,4.2,2.6),h('circle',{key:`c${i}`,cx:x,cy:y,r:.9,fill:ink.pal.center}))}return parts},
 mountainavens(ink,st){const y=st.top+20,parts=[stem(ink,y+4,{w:1.5})];for(let i=0;i<7;i++)parts.push(leaf(ink,`l${i}`,{x:50,y:87,len:15,w:7,rot:-84+i*28,shape:'serrate',veins:4}));if(!st.bloom)return[...parts,bud(ink,'b',50,y+4,{len:10,w:6})];return[...parts,...regionRay(ink,'pet',50,y,8,12,7),regionCore(ink,'boss',50,y,4.2)]},
 snowbell(ink,st){const parts=[stemPath('sc','M50,88Q48,60 52,34',ink.pal.stem,1.3)];for(const[i,[x,y,k]]of[[38,84,5.5],[60,85,5],[49,88,6],[44,79,4]].entries())parts.push(h('circle',{key:`r${i}`,cx:x,cy:y,r:k,fill:ink.leaf,stroke:ink.leafLine,strokeWidth:.4}));for(const r of[-42,0,42]){if(!st.bloom){parts.push(bud(ink,`b${r}`,52,34,{len:9,w:4,rot:180+r}));continue}parts.push(h('g',{key:`bell${r}`,transform:`translate(52 34) rotate(${r})`},h('path',{d:'M0,0L0,4',stroke:ink.pal.stem,strokeWidth:.7}),h('path',{d:'M-4,4Q-5,10 -6,15L-4,13L-2,16L0,13L2,16L4,13L6,15Q5,10 4,4Z',fill:ink.petal,stroke:ink.line,strokeWidth:.45})))}return parts},
 auricula(ink,st){const y=st.top+14,parts=[stem(ink,y+10,{w:1.8})];for(let i=0;i<7;i++)parts.push(leaf(ink,`e${i}`,{x:50,y:88,len:19,w:10,rot:-90+i*30,fill:ink.leafBack,veins:1}));for(const[i,[x,fy]]of[[41,y+5],[59,y+5],[50,y-2],[45,y+11],[56,y+11]].entries()){if(!st.bloom){parts.push(bud(ink,`b${i}`,x,fy+2,{len:6,w:4}));continue}parts.push(...regionRay(ink,`f${i}`,x,fy,5,5.5,5),h('circle',{key:`c${i}`,cx:x,cy:fy,r:1.8,fill:ink.pal.center,stroke:ink.pal.centerDeep,strokeWidth:.3}))}return parts},
 arnica(ink,st){const y=st.top+6,parts=[stem(ink,y+4,{w:2})];for(let i=0;i<4;i++)parts.push(leaf(ink,`b${i}`,{x:50,y:87,len:20,w:10,rot:-75+i*50,veins:4}));parts.push(leaf(ink,'ua',{x:50,y:60,len:11,w:4,rot:-60}),leaf(ink,'ub',{x:50,y:60,len:11,w:4,rot:60}));if(!st.bloom)return[...parts,bud(ink,'b',50,y+4,{len:10,w:7})];return[...parts,...regionRay(ink,'ray',50,y,13,15,4),h('circle',{key:'disc',cx:50,cy:y,r:5.6,fill:ink.pal.center,stroke:ink.pal.centerDeep,strokeWidth:.6}),dots('fl',Array.from({length:10},(_,i)=>polar(50,y,3.2,i*36)),.5,ink.pal.centerDeep)]},
 alpenrose(ink,st){const top=st.top+22,parts=[stemPath('twig',`M50,90Q47,68 50,${top}`,ink.pal.stem,2.2)];for(let i=0;i<8;i++)parts.push(leaf(ink,`l${i}`,{x:50,y:84-(i>>1)*9,len:17,w:6,rot:(i%2?1:-1)*(55+(i>>1)*6),veins:1}));for(const r of[-52,-18,18,52]){if(!st.bloom){parts.push(bud(ink,`b${r}`,50,top,{len:10,w:4,rot:r}));continue}parts.push(h('g',{key:`f${r}`,transform:`translate(50 ${top}) rotate(${r})`},h('path',{d:'M-2,0Q-3,-8 -6,-14L-3,-12L0,-15L3,-12L6,-14Q3,-8 2,0Z',fill:ink.petal,stroke:ink.line,strokeWidth:.45}),h('path',{d:'M0,-6l0,-7',stroke:ink.pal.center,strokeWidth:.6})))}return parts},
 guzmania(ink,st){const parts=[];for(let i=0;i<11;i++)parts.push(leaf(ink,`s${i}`,{x:50,y:88,len:34-(i%2)*6,w:6,rot:-80+i*16,veins:1}));if(!st.bloom)return[...parts,bud(ink,'b',50,62,{len:14,w:7})];for(let i=0;i<9;i++)parts.push(petal(`br${i}`,{x:50,y:66,rot:-72+i*18,len:22-Math.abs(i-4)*1.5,w:6,fill:ink.petal,stroke:ink.line,vein:ink.line}));for(let i=0;i<5;i++)parts.push(petal(`in${i}`,{x:50,y:60,rot:-40+i*20,len:10,w:4,fill:ink.pal.center,stroke:ink.pal.centerDeep}));return parts},
 redginger(ink,st){const parts=[stemPath('cane','M50,90Q47,60 51,34',ink.pal.stem,2.4)];for(let i=0;i<5;i++)parts.push(leaf(ink,`p${i}`,{x:50,y:84-i*9,len:28-i*2,w:9,rot:i%2?56:-56,veins:5}));if(!st.bloom)return[...parts,bud(ink,'b',51,34,{len:14,w:6})];for(let r=0;r<7;r++)for(const s of[-1,1])parts.push(petal(`c${r}${s}`,{x:51+s*1.5,y:36-r*3.6,rot:s*(34-r*3),len:10-r*.5,w:5,fill:r%2?ink.back:ink.petal,stroke:ink.line}));parts.push(petal('tip',{x:51,y:13,rot:0,len:8,w:4,fill:ink.petal,stroke:ink.line}));return parts},
 medinilla(ink,st){const parts=[stemPath('br','M44,90Q40,52 56,30',ink.pal.stem,2.2),leaf(ink,'la',{x:46,y:66,len:30,w:16,rot:-70,veins:5}),leaf(ink,'lb',{x:48,y:54,len:30,w:16,rot:58,veins:5}),leaf(ink,'lc',{x:54,y:34,len:22,w:12,rot:-20,veins:4}),stemPath('hang','M56,30Q70,30 68,78',ink.pal.petalDeep,1)];if(!st.bloom)return[...parts,bud(ink,'b',68,62,{len:12,w:7,rot:180})];for(let i=0;i<3;i++)for(const s of[-1,1])parts.push(petal(`bt${i}${s}`,{x:68,y:38+i*10,rot:s*118,len:12-i,w:8,fill:ink.petal,stroke:ink.line,vein:ink.line}));for(let i=0;i<9;i++)parts.push(h('circle',{key:`g${i}`,cx:68+((i%3)-1)*3.2,cy:64+Math.floor(i/3)*5,r:2.3,fill:ink.back,stroke:ink.line,strokeWidth:.3}));return parts},
 torchginger(ink,st){const y=st.top+10,parts=[stem(ink,y+10,{w:3}),leaf(ink,'la',{x:50,y:88,len:40,w:11,rot:-30,veins:6}),leaf(ink,'lb',{x:50,y:88,len:36,w:10,rot:32,veins:6})];if(!st.bloom)return[...parts,bud(ink,'b',50,y+10,{len:16,w:9})];parts.push(...regionRay(ink,'skirt',50,y+6,11,15,7,ink.back));for(let r=0;r<4;r++)for(let i=0;i<7-r;i++)parts.push(petal(`t${r}${i}`,{x:50,y:y+6-r*2.5,rot:-54+r*8+i*(108-r*16)/(6-r),len:13-r*1.5,w:6-r*.6,fill:r%2?ink.back:ink.petal,stroke:ink.line}));return parts},
 cattleya(ink,st){const cx=58,cy=st.top+6,parts=[h('ellipse',{key:'pb',cx:40,cy:80,rx:5,ry:10,fill:ink.pal.stem,stroke:ink.leafLine,strokeWidth:.4}),leaf(ink,'lf',{x:40,y:72,len:34,w:11,rot:-18,veins:1}),stemPath('sc',`M42,74Q50,56 ${cx},${cy+6}`,ink.pal.stem,1.3),stemPath('root','M40,89q-8,2 -11,5M41,89q7,3 10,5','#b9c7b0',1.3)];if(!st.bloom)return[...parts,bud(ink,'b',cx,cy+6,{len:13,w:6,rot:30})];return[...parts,...[0,125,235].map(r=>petal(`sp${r}`,{x:cx,y:cy,rot:r,len:17,w:5,fill:ink.back,stroke:ink.line})),...[-62,62].map(r=>petal(`pt${r}`,{x:cx,y:cy,rot:r,len:16,w:12,fill:ink.petal,stroke:ink.line,vein:ink.line})),h('path',{key:'lip',d:`M${cx-4},${cy}Q${cx-9},${cy+10} ${cx-5},${cy+15}Q${cx},${cy+18} ${cx+5},${cy+15}Q${cx+9},${cy+10} ${cx+4},${cy}Z`,fill:ink.pal.petalDeep,stroke:ink.line,strokeWidth:.4}),h('ellipse',{key:'throat',cx,cy:cy+7,rx:2.4,ry:4,fill:ink.pal.center})]},
 rafflesia(ink,st){const parts=[h('path',{key:'vine',d:'M12,90Q40,82 88,90',fill:'none',stroke:ink.pal.stem,strokeWidth:3,strokeLinecap:'round'})];if(!st.bloom)return[...parts,h('circle',{key:'cab',cx:50,cy:78,r:11,fill:ink.back,stroke:ink.line,strokeWidth:.5}),h('path',{key:'fold',d:'M41,74Q50,66 59,74M43,82Q50,74 57,82',fill:'none',stroke:ink.pal.petalDeep,strokeWidth:.8})];const y=62,spots=[];for(let i=0;i<5;i++)for(const[d,a]of[[14,-12],[19,6],[11,14],[22,-8]])spots.push(polar(50,y,d,i*72+a));return[...parts,...regionRay(ink,'lobe',50,y,5,27,25),dots('spots',spots,1.1,'#f6e3d2',.9),h('circle',{key:'ring',cx:50,cy:y,r:9.5,fill:ink.pal.petalDeep,stroke:ink.line,strokeWidth:.5}),h('circle',{key:'well',cx:50,cy:y,r:6,fill:ink.pal.centerDeep}),dots('spikes',Array.from({length:7},(_,i)=>i===0?[50,y]:polar(50,y,3.4,i*60)),.7,ink.pal.center)]},
})

// Five more coast and six more eastern-garden plants.
Object.assign(PLANTS, {
 seabindweed(ink,st){const y=st.top+26,parts=[stemPath('run','M22,89Q40,82 52,86Q66,90 80,84',ink.pal.stem,1.4),stemPath('ped',`M50,86Q48,74 50,${y+6}`,ink.pal.stem,1)];for(const[i,[x,ly,r]]of[[28,86,-20],[40,83,10],[62,86,-10],[74,84,25]].entries())parts.push(nfHeartLeaf(ink,`k${i}`,x,ly,.5,r));if(!st.bloom)return[...parts,bud(ink,'b',50,y+6,{len:10,w:5})];return[...parts,h('path',{key:'fun',d:`M48,${y+7}Q40,${y} 36,${y-8}Q50,${y-14} 64,${y-8}Q60,${y} 52,${y+7}Z`,fill:ink.petal,stroke:ink.line,strokeWidth:.5}),h('ellipse',{key:'rim',cx:50,cy:y-8,rx:14,ry:4.5,fill:ink.back,stroke:ink.line,strokeWidth:.4}),h('path',{key:'st',d:`M50,${y-8}L39,${y-9}M50,${y-8}L44,${y-12}M50,${y-8}L56,${y-12}M50,${y-8}L61,${y-9}M50,${y-8}L50,${y-4}`,stroke:'#fff',strokeWidth:1,opacity:.8}),h('circle',{key:'eye',cx:50,cy:y-8,r:1.6,fill:ink.pal.center})]},
 seaholly(ink,st){const y=st.top+12,parts=[stem(ink,y+6,{w:2})];for(let i=0;i<5;i++)parts.push(leaf(ink,`h${i}`,{x:50,y:86-i*4,len:20,w:12,rot:-80+i*40,shape:'runcinate',veins:3,fill:ink.leafBack}));if(!st.bloom)return[...parts,bud(ink,'b',50,y+6,{len:10,w:7})];return[...parts,...Array.from({length:9},(_,i)=>leaf(ink,`br${i}`,{x:50,y:y+3,len:15,w:6,rot:-120+i*30,shape:'serrate',veins:1,fill:ink.leafBack})),h('ellipse',{key:'head',cx:50,cy:y-1,rx:6.5,ry:8,fill:ink.petal,stroke:ink.line,strokeWidth:.5}),dots('fl',[[47,y-4],[53,y-4],[50,y-7],[50,y-1],[47,y+2],[53,y+2]],.8,ink.pal.center)]},
 hornedpoppy(ink,st){const y=st.top+12,parts=[stem(ink,y+4,{w:2}),stemPath('side','M50,74Q62,62 70,40',ink.pal.stem,1.3),h('path',{key:'horn',d:'M70,40Q76,26 72,10',fill:'none',stroke:ink.pal.stem,strokeWidth:2.2,strokeLinecap:'round'})];for(let i=0;i<5;i++)parts.push(leaf(ink,`g${i}`,{x:50,y:87,len:22,w:12,rot:-88+i*40,shape:'pinnate',veins:3,fill:ink.leafBack}));if(!st.bloom)return[...parts,bud(ink,'b',50,y+4,{len:12,w:7})];return[...parts,...regionRay(ink,'pet',50,y,4,15,15),regionCore(ink,'boss',50,y,3.6)]},
 agapanthus(ink,st){const y=st.top+6,parts=[stem(ink,y+8,{w:2}),...tuft(ink,7,36,5,58)];if(!st.bloom)return[...parts,bud(ink,'b',50,y+8,{len:14,w:8})];for(let i=0;i<11;i++){const[x,fy]=i===0?[50,y-2]:polar(50,y,i%2?12:8,i*36);parts.push(stemPath(`r${i}`,`M50,${y+8}L${x},${fy}`,ink.pal.stem,.4),...regionRay(ink,`s${i}`,x,fy,6,4.6,2.2),h('path',{key:`m${i}`,d:`M${x},${fy}h.01`,stroke:ink.pal.petalDeep,strokeWidth:1.4,strokeLinecap:'round'}))}return parts},
 seadaffodil(ink,st){const y=st.top+10,parts=[stem(ink,y+8,{w:2.2}),...tuft(ink,5,30,4.5,52)];if(!st.bloom)return[...parts,bud(ink,'b',50,y+8,{len:15,w:5})];return[...parts,...regionRay(ink,'tep',50,y,6,18,4),h('path',{key:'cup',d:`M43,${y+2}Q42,${y-7} 44,${y-8}L46.5,${y-6}L48.5,${y-9}L50,${y-6}L51.5,${y-9}L53.5,${y-6}L56,${y-8}Q58,${y-7} 57,${y+2}Q50,${y+5} 43,${y+2}Z`,fill:ink.back,stroke:ink.line,strokeWidth:.45}),h('path',{key:'an',d:`M47,${y-2}l0,-4M50,${y-1}l0,-5M53,${y-2}l0,-4`,stroke:ink.pal.center,strokeWidth:.8})]},
 balloonflower(ink,st){const y=st.top+10,parts=[stem(ink,y+6,{w:1.8})];for(let i=0;i<6;i++)parts.push(leaf(ink,`l${i}`,{x:50,y:84-(i>>1)*10,len:14,w:7,rot:i%2?60:-60,shape:'serrate',veins:3}));if(!st.bloom)return[...parts,h('path',{key:'bal',d:`M50,${y+8}L43,${y+3}L45,${y-6}L50,${y-10}L55,${y-6}L57,${y+3}Z`,fill:ink.back,stroke:ink.line,strokeWidth:.5,strokeLinejoin:'round'}),h('path',{key:'seam',d:`M50,${y+8}L50,${y-10}M43,${y+3}L50,${y-2}L57,${y+3}`,fill:'none',stroke:ink.pal.petalDeep,strokeWidth:.4})];return[...parts,...regionRay(ink,'lobe',50,y,5,14,11),...Array.from({length:5},(_,i)=>turned(`v${i}`,i*72,50,y,[h('path',{key:'v',d:`M50,${y-2}L50,${y-12}`,stroke:ink.pal.petalDeep,strokeWidth:.5})])),h('circle',{key:'eye',cx:50,cy:y,r:2.6,fill:ink.pal.center,stroke:ink.pal.centerDeep,strokeWidth:.4})]},
 floweringquince(ink,st){const parts=[stemPath('twig','M46,90Q42,62 54,38Q60,26 70,20M50,56Q38,48 32,36',ink.pal.stem,2.2),stemPath('thorn','M45,72l-5,-2M52,46l5,-1M40,46l-1,-5',ink.pal.stem,.9)];for(const[i,[x,y,r]]of[[45,78,-70],[47,66,65],[58,32,60],[36,42,-50]].entries())parts.push(leaf(ink,`o${i}`,{x,y,len:11,w:6,rot:r,veins:2}));for(const[i,[x,y]]of[[52,44],[66,22],[33,34],[45,60]].entries()){if(!st.bloom){parts.push(bud(ink,`b${i}`,x,y,{len:6,w:5}));continue}parts.push(...regionRay(ink,`f${i}`,x,y,5,7,6.4),dots(`a${i}`,[0,72,144,216,288].map(a=>polar(x,y,1.6,a)),.5,ink.pal.center))}return parts},
 osmanthus(ink,st){const parts=[stemPath('twig','M50,90Q46,60 52,26',ink.pal.stem,2.2)];for(let i=0;i<8;i++)parts.push(leaf(ink,`l${i}`,{x:50,y:82-(i>>1)*14,len:20,w:7,rot:i%2?58:-58,veins:3}));for(const[k,[cx,cy]]of[[46,74],[54,60],[47,46],[53,32]].entries())for(let i=0;i<5;i++){const[x,y]=i===0?[cx,cy]:polar(cx,cy,3.2,i*90+k*30);if(!st.bloom){parts.push(h('circle',{key:`b${k}${i}`,cx:x,cy:y,r:.9,fill:ink.back}));continue}parts.push(...regionRay(ink,`f${k}${i}`,x,y,4,2.4,1.8))}return parts},
 japaneseiris(ink,st){const y=st.top+10,parts=[stem(ink,y+8,{w:2}),...tuft(ink,5,40,4,26)];if(!st.bloom)return[...parts,bud(ink,'b',50,y+8,{len:16,w:5})];return[...parts,...[-115,115,180].map(r=>petal(`fall${r}`,{x:50,y,rot:r,len:20,w:15,fill:ink.petal,stroke:ink.line,vein:ink.line})),...[-115,115,180].map(r=>petal(`fl${r}`,{x:50,y,rot:r,len:9,w:3,fill:ink.pal.center,stroke:ink.pal.centerDeep})),...[-35,0,35].map(r=>petal(`std${r}`,{x:50,y,rot:r,len:11,w:5,fill:ink.back,stroke:ink.line}))]},
 spiderlily(ink,st){const y=st.top+12,parts=[stem(ink,y+6,{w:2}),h('ellipse',{key:'bulb',cx:50,cy:88,rx:6,ry:4,fill:'#8a6a4a',opacity:.7})];if(!st.bloom)return[...parts,...[-20,0,20].map(r=>bud(ink,`b${r}`,50,y+6,{len:13,w:3.4,rot:r}))];for(let i=0;i<6;i++)parts.push(h('g',{key:`f${i}`,transform:`translate(50 ${y}) rotate(${i*60})`},h('path',{d:'M0,0Q-5,-9 -3,-15Q-1,-19 3,-17',fill:'none',stroke:ink.pal.petal,strokeWidth:1.8,strokeLinecap:'round'}),h('path',{d:'M0,0Q5,-8 4,-14Q3,-18 -1,-18',fill:'none',stroke:ink.pal.petalDeep,strokeWidth:1.5,strokeLinecap:'round'}),h('path',{d:'M0,0Q9,-12 8,-24M0,0Q-8,-12 -9,-23',fill:'none',stroke:ink.pal.petal,strokeWidth:.45}),h('circle',{cx:8,cy:-24,r:.8,fill:ink.pal.center}),h('circle',{cx:-9,cy:-23,r:.8,fill:ink.pal.center})));return parts},
 yulan(ink,st){const parts=[stemPath('br','M44,90Q40,60 50,40M46,66Q62,58 68,40M44,74Q32,64 30,50',ink.pal.stem,2.4)];for(const[i,[x,y,r]]of[[50,st.top+4,0],[68,40,14],[30,50,-14]].entries()){if(!st.bloom){parts.push(bud(ink,`b${i}`,x,y+6,{len:11,w:6,rot:r}));continue}parts.push(h('g',{key:`c${i}`,transform:`translate(${x} ${y}) rotate(${r})`},...[-34,34].map(a=>petal(`o${a}`,{x:0,y:6,rot:a,len:17,w:8,fill:ink.back,stroke:ink.line})),...[-16,16].map(a=>petal(`m${a}`,{x:0,y:6,rot:a,len:18,w:8,fill:ink.petal,stroke:ink.line,vein:ink.line})),petal('f',{x:0,y:6,rot:0,len:16,w:8,fill:ink.petal,stroke:ink.line}),h('path',{key:'cal',d:'M-3,6Q0,9 3,6',fill:'none',stroke:ink.pal.stem,strokeWidth:1.6})))}return parts},
})
    // ---------------------------------------------------------------------
    // §6 View.
    // ---------------------------------------------------------------------
const GARDEN_TABS = ['garden','basket','studio','album','orders','ecology','show','shop','flowers','visitors','settings']
// The tab bar shows five groups; each saved section id still names one panel, so old saves open where they left off.
// Settings sits behind the gear button instead of taking a tab.
const TAB_GROUPS = { garden: ['garden'], bag: ['basket', 'shop'], studio: ['studio', 'album'], tasks: ['orders', 'ecology', 'show'], book: ['flowers', 'visitors'] }
const TAB_GROUP_IDS = Object.keys(TAB_GROUPS)
function tabGroupOf(id) { return TAB_GROUP_IDS.find(group => TAB_GROUPS[group].includes(id)) ?? null }
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
    item.type==='flower'?h('p',null,t(`variant.${item.variant}`),item.trait?' · '+traitLabel(item.trait, t):'',item.tint?' · '+t('hybrid.tag'):''):null,
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
  for(const id of GOODS){const gain=goodsCount(next,id)-goodsCount(before,id);if(gain>0)entries.push({id,label:t(`item.${id}`),amount:`+${gain}`,owned:goodsCount(next,id)})}
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
Object.assign(zh, {'mini.sown':'已种下{flower}'})
Object.assign(en, {'mini.sown':'Planted {flower}'})
function MiniGarden({t}) {
  const state=useSyncExternalStore(subscribeGarden,getState,getState)
  const [clock,setClock]=React.useState(()=>Date.now()), [notice,setNotice]=React.useState(null), [discovery,setDiscovery]=React.useState(null)
  const [selection,setSelection]=React.useState({}), [preview,setPreview]=React.useState(null)
  const miniRoot=React.useRef(null), opener=React.useRef(null)
  function restoreMiniFocus(){window.setTimeout(()=>{const target=opener.current?.isConnected?opener.current:miniRoot.current?.querySelector('select,button');target?.focus()},0)}
  React.useEffect(()=>{const id=window.setInterval(()=>{tick();setClock(Date.now())},1000);return()=>window.clearInterval(id)},[])
  const scene=sceneOf(state.scene), slot=state.scenes[state.scene], weather=weatherAt(clock), period=gardenClock(clock).period
  React.useEffect(()=>{setSelection({})},[scene.id])
  const ripeCount=slot.plots.slice(0,slot.unlocked).filter(plot=>plot&&!plot.resident&&stageOf(plot)==='bloom').length
  function feedback(text, tone = 'ok') {
    setNotice(previous => ({text, tone, id:(previous?.id ?? 0) + 1}))
  }
  function act(transition,kind,index,label) {
    tick()
    const before=getState(), next=transition(before)
    if(!next){feedback(t('mini.error'), 'error');return}
    const items=kind?discoveryItems(before,next,kind,before.scene,index):[]
    const recorded=recordDiscoveries(next,items,Date.now())
    commit(recorded,true)
    const gained = rewardForChange(before,recorded,t)
    const summary = gained?.entries.map(entry => `${entry.label} ${entry.amount}`).join(' · ')
    const picked = items.find(item => item.type === 'flower')
    const discoveryText = picked ? `${t(`bag.rarity.${rarityOf(picked)}`)} · ${bloomName(picked,t)}` : t('discovery.noted')
    feedback([items.length ? discoveryText : label, summary].filter(Boolean).join(' · ') || t('mini.saved'), items.length || gained ? 'gold' : 'ok')
  }
  return h('div',{ref:miniRoot,className:'fg-view fg-miniView','data-scene':scene.id},
    h('div',{className:'fg-miniTools'},
      h('select',{'aria-label':t('plot.section'),value:scene.id,onChange:event=>{commit({...getState(),scene:event.target.value},true);setSelection({})}},SCENES.filter(entry=>(state.scenes[entry.id]?.unlocked??0)>0).map(entry=>h('option',{key:entry.id,value:entry.id},t(`scene.${entry.id}`)))),
      h('button',{type:'button',className:'fg-btn',onClick:()=>act(before=>waterAll(before,before.scene),null,null,t('plot.watered'))},t('mini.water')),
      ripeCount>0?h('button',{type:'button',className:'fg-btn fg-btnPrimary','data-mini':'harvestAll',onClick:()=>act(before=>{let next=before;const live=before.scenes[before.scene];for(let i=0;i<live.unlocked;i++){const plot=next.scenes[before.scene].plots[i];if(!plot||plot.resident)continue;const done=harvestAt(next,before.scene,i,Date.now(),weatherAt(Date.now()),false);if(done)next=done}return next===before?null:next},'harvest',0)},t('mini.harvestAll',{n:ripeCount})):null,
      visitorCount(state,scene.id,clock)>0?h('button',{type:'button',className:'fg-btn fg-btnPrimary','data-mini':'greetAll',onClick:()=>act(before=>greetAll(before,before.scene,Date.now()),'visitor',0)},'👋 ',t('bulk.greet',{n:visitorCount(state,scene.id,clock)})):null,
      emptyCount(slot)>0?h('button',{type:'button',className:'fg-btn','data-mini':'sowAll',onClick:()=>act(before=>sowRandom(before,before.scene))},'🎲 ',t('bulk.sow',{n:emptyCount(slot)})):null,
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
        const variant = plot && ((plot.resident || plot.identified) ? plot.variant : plot.tint ? 'base' : plotVariant(species,index))
         const rarity = plot && stage === 'bloom' ? rarityOf({...plot,variant}) : null
         return h('article',{key:index,className:'fg-miniPlot','data-mini-plot':index,'data-rarity':rarity,'data-variant':variant,'data-trait':plot?.trait},
          h('div',{className:'fg-miniPlant'},plot?h(FlowerArt,{speciesId:plot.species,stage,variant,trait:plot.trait,tint:plot.tint,dna:plot.dna}):EmptyArt(),
            visitor?h('button',{type:'button',className:'fg-miniVisitor','data-mini-visitor':visitor.id,title:t('visitor.greet',{name:t(`visitor.${visitor.id}`)}),'aria-label':t('visitor.greet',{name:t(`visitor.${visitor.id}`)}),onClick:()=>act(before=>greetVisitor(before,scene.id,index,Date.now(),weatherAt(Date.now())),'visitor',index)},h(VisitorArt,{id:visitor.id})):null),
          h('strong',null,plot?bloomName({...plot,variant:plot.variant??'base'},t):t('mini.empty')),
          plot?h('span',{className:'fg-note'},t(`stage.${stage}`),' · ',t('mini.moisture',{n:Math.round(plot.moisture)})):null,
          rarity && rarity!=='base'?h('span',{className:'fg-badge fg-miniRarity'},'✦ ',t(`bag.rarity.${rarity}`)):null,
          plot?h('div',{className:'fg-miniActions'},
            h('button',{type:'button',className:'fg-btn',disabled:plot.moisture>=99.5,onClick:()=>act(before=>waterAt(before,scene.id,index),null,index,t('plot.watered'))},t('plot.water')),
            stage==='bloom'?h('button',{type:'button',className:'fg-btn',disabled:state.basket.length>=basketCapacity(state),onClick:()=>{
              if(plot.resident&&selection.retire!==`${scene.id}:${index}`){setSelection(current=>({...current,retire:`${scene.id}:${index}`}));return}
              setSelection(current=>({...current,retire:undefined}))
              act(before=>harvestAt(before,scene.id,index,Date.now(),weatherAt(Date.now()),plot.resident===true),'harvest',index)
            }},plot.resident?t(selection.retire===`${scene.id}:${index}`?'eco.retireConfirm':'eco.retire'):t('plot.harvest')):
              h('button',{type:'button',className:'fg-btn',disabled:(state.bag.fertilizer??0)<=0,onClick:()=>act(before=>fertilizeAt(before,scene.id,index),null,index,t('item.fertilized',{flower:t(`species.${plot.species}`)}))},t('item.fertilizer')),
            stage==='bloom'&&!plot.resident?h('button',{type:'button',className:'fg-btn',onClick:()=>act(before=>retainAt(before,scene.id,index,Date.now()),'retain',index)},t('eco.retain')):null,
            visitor?h('span',{className:'fg-note'},t(`visitor.${visitor.id}`)):null):
          h('div',{className:'fg-miniActions'},
            h('select',{'aria-label':`${t('mini.seed')} ${index+1}`,value:seed,onChange:event=>{const value=event.target.value;setSelection(current=>({...current,[index]:value}))}},scene.species.map(id=>h('option',{key:id,value:id},`${t(`species.${id}`)} · ${SPECIES_BY_ID.get(id).cost}`))),
            h('button',{type:'button',className:'fg-btn',disabled:state.coins<seedSpecies.cost,onClick:()=>act(before=>plantAt(before,scene.id,index,seed),null,index,t('mini.sown',{flower:t(`species.${seed}`)}))},t('mini.plant'))))
      }))),
    h('p',{className:'fg-miniNotice',role:'status','aria-live':'polite','data-tone':notice?.tone,'data-feedback-id':notice?.id},notice?.text),
    discovery?h(DiscoveryCard,{entry:discovery,t,onClose:()=>{setDiscovery(null);restoreMiniFocus()},onOpen:item=>{setDiscovery(null);setPreview(item)}}):null,
    preview?(preview.type==='visitor'?h(VisitorPreview,{visitorId:preview.visitor,state,t,onClose:()=>{setPreview(null);restoreMiniFocus()}}):h(BloomPreview,{id:'fg-mini-preview',speciesId:preview.species,variant:preview.variant??'base',trait:preview.trait,tint:preview.tint,dna:preview.dna,t,modal:true,onClose:()=>{setPreview(null);restoreMiniFocus()}})):null)
}
function FloatingGarden() {
  const mini=useSyncExternalStore(subscribeMini,getMini,getMini), drag=React.useRef(null)
  const t=boundT
  const body=React.useRef(null)
  const desktop=useDesktopGarden(body,t)
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
      h('button',{type:'button',className:'fg-desktopPin',disabled:desktop.phase==='opening'||(mini.minimized&&desktop.phase==='idle'),onClick:desktop.toggle},t(desktop.phase==='idle'?'desktop.pin':desktop.phase==='opening'?'desktop.opening':desktop.phase==='preparing'?'desktop.cancelWait':'desktop.unpin')),
      h('button',{type:'button',title:t(mini.minimized?'mini.restore':'mini.minimize'),'aria-label':t(mini.minimized?'mini.restore':'mini.minimize'),onClick:()=>updateMini({minimized:!mini.minimized})},mini.minimized?'▢':'−'),
      h('button',{type:'button',title:t('mini.close'),'aria-label':t('mini.close'),onClick:()=>{if(desktop.phase!=='idle')desktop.toggle();updateMini({open:false})}},'×')),
    desktop.message?h('p',{className:'fg-miniNotice',role:'status'},t(desktop.message)):null,
    (!mini.minimized||desktop.phase!=='idle')?h('div',{className:'fg-floatingBody',ref:body,hidden:mini.minimized},h(MiniGarden,{t})):null,
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
.fg-miniPlot[data-rarity="spirit"]{--fg-mini-rarity:var(--fg-r-spirit)}
.fg-miniPlot[data-rarity="curio"]{--fg-mini-rarity:var(--fg-r-curio)}
.fg-miniPlot[data-rarity="hybrid"]{--fg-mini-rarity:var(--fg-r-hybrid)}
.fg-miniPlot[data-rarity="alt"]{--fg-mini-rarity:var(--fg-r-alt)}
.fg-miniPlot[data-rarity]:not([data-rarity="base"]){border-color:var(--fg-mini-rarity);box-shadow:inset 0 2px 0 var(--fg-mini-rarity)}
.fg-miniRarity{align-self:flex-start;border:1px solid var(--fg-mini-rarity);background:color-mix(in srgb,var(--fg-mini-rarity) 18%,var(--dsw-alias-bg-layer-1))}
.fg-miniView .fg-miniNotice:not(:empty){position:sticky;bottom:0;z-index:2;margin:0;padding:8px 12px;background:var(--dsw-alias-bg-layer-1);border-inline-start:3px solid var(--fg-accent);color:var(--dsw-alias-label-primary)}
.fg-miniView .fg-miniNotice[data-tone="gold"]{border-color:var(--fg-r-spirit)}
.fg-miniView .fg-miniNotice[data-tone="error"]{border-color:var(--dsw-alias-state-error-primary)}

`

// Capture the finished album drawing on click. Mounted album cards can disappear
// when navigating, so window ownership and the immutable snapshot live separately.
Object.assign(zh, {'desktop.working':'处理中…','desktop.route':'桌面窗口服务未连接，请重新载入花园插件。','desktop.artMissing':'无法读取这张花束卡的插花图。','desktop.launchFailed':'桌面花瓶启动失败，请关闭旧桌面小窗后重试。','desktop.tooLarge':'这束插花的绘图超过桌面窗口大小限制。','desktop.pinBouquet':'钉到桌面', 'desktop.unpinBouquet':'从桌面收回', 'desktop.unpinFailed':'未能收回花瓶，请再试一次。'})
Object.assign(en, {'desktop.working':'Working…','desktop.route':'The desktop service is unavailable. Reload the garden plugin.','desktop.artMissing':'The artwork on this bouquet card could not be read.','desktop.launchFailed':'The vase could not open. Close any previous desktop garden windows and try again.','desktop.tooLarge':'This arrangement exceeds the desktop drawing size limit.','desktop.pinBouquet':'Pin vase to desktop', 'desktop.unpinBouquet':'Remove vase from desktop', 'desktop.unpinFailed':'Could not close the vase. Try again.'})
const bouquetSvgTags = new Set('svg g defs path circle ellipse rect polygon polyline line stop linearGradient radialGradient clipPath mask pattern'.split(' '))
const bouquetSvgAttrs = new Set('viewBox preserveAspectRatio id d x y x1 y1 x2 y2 cx cy r rx ry width height fill fill-rule fill-opacity stroke stroke-width stroke-linecap stroke-linejoin stroke-dasharray stroke-opacity transform opacity points offset stop-color stop-opacity gradientUnits gradientTransform clip-path clip-rule mask vector-effect'.split(' '))
const bouquetStyles = new Map([
  ['animation-delay', /^-?[\d.]+m?s$/], ['transform-origin', /^-?[\d.]+px -?[\d.]+px$/],
  ['fill', /^(?:#[\da-f]{3,8}|none)$/i], ['stroke', /^(?:#[\da-f]{3,8}|none)$/i],
  ['stroke-width', /^[\d.]+(?:px)?$/], ['stroke-linecap', /^(?:round|butt|square)$/], ['stroke-dasharray', /^[\d., px]+$/],
])
function encodeDesktopArtwork(root, stems = []) {
  function encode(node) {
    const tag = node.localName
    const isSvg = node.namespaceURI === 'http://www.w3.org/2000/svg'
    if (isSvg ? !bouquetSvgTags.has(tag) : tag !== 'div' && tag !== 'span') return null
    const attrs = {}
    for (const attr of node.attributes) {
      if (attr.name === 'class') {
        attrs.class = attr.value.split(/\s+/).filter(name => /^fg-[\w-]+$/.test(name)).join(' ')
      } else if (isSvg && bouquetSvgAttrs.has(attr.name)) {
        if (/url\s*\(/i.test(attr.value) && !/^url\(#[\w:.-]+\)(?:\s+#[\da-f]+)?$/i.test(attr.value)) continue
        attrs[attr.name] = attr.value
      }
    }
    for (const [property, rule] of bouquetStyles) {
      const value = node.style?.getPropertyValue(property)
      if (value && rule.test(value)) attrs[`$${property}`] = value
    }
    const index = stems.indexOf(node)
    if (index !== -1) attrs.$transform = stemTilt(index, stems.length)
    return [tag, attrs, Array.from(node.children, encode).filter(Boolean)]
  }
  return encode(root)
}

function snapshotBouquet(container, title) {
  const root = container?.querySelector('.fg-cardVase > .fg-vaseStill')
  if (!root) throw new Error('Bouquet artwork missing')
  const stems = Array.from(root.children).filter(node => node.classList.contains('fg-vaseStem'))
  if (!stems.length || stems.length > BOUQUET_MAX) throw new Error('Invalid bouquet drawing')
  return {mode:'bouquet', tree:encodeDesktopArtwork(root, stems), title, lang:document.documentElement.lang || 'en'}
}

const bouquetPins = new Map()
const bouquetPinListeners = new Set()
const noBouquetPin = Object.freeze({phase:'idle'})
function subscribeBouquetPins(listener) {
  bouquetPinListeners.add(listener)
  return () => bouquetPinListeners.delete(listener)
}
function updateBouquetPin(id, entry) {
  if (entry) bouquetPins.set(id, entry)
  else bouquetPins.delete(id)
  for (const listener of bouquetPinListeners) listener()
}
const pinStoragePrefix = 'flower-garden.desktop-pin.v1.'
function artWindowKey(id) { return typeof id === 'string' ? id : `bouquet:${id}` }
function artIdFromWindowKey(key) {
  if (/^bloom:[\w:.~-]{1,122}$/.test(key)) return key
  if (/^bouquet:\d{1,16}$/.test(key)) {
    const id = Number(key.slice(8))
    if (Number.isSafeInteger(id) && artWindowKey(id) === key) return id
  }
  return null
}
function rememberArtPin(id, pinned) {
  const key = pinStoragePrefix + artWindowKey(id)
  try {
    if (pinned) window.localStorage.setItem(key, '1')
    else window.localStorage.removeItem(key)
  } catch { /* A window remains usable when browser storage is unavailable. */ }
}
function bouquetRequest(id, op, snapshot) {
  return desktopGardenRequest({op, owner:desktopOwner(), windowKey:artWindowKey(id), snapshot})
}
function watchBouquet(id, entry) {
  entry.timer = window.setTimeout(() => reconcileArtPin(id, entry, false), 15000)
}
async function reconcileArtPin(id, entry, restore) {
  if (bouquetPins.get(id) !== entry) return
  try {
    let result = await bouquetRequest(id, restore ? 'restore' : 'sync')
    if (bouquetPins.get(id) !== entry) return
    // A restarted broker has no live windows. Restore replays its saved artwork.
    // A user-dismissed window has no saved record and returns closed here.
    if (!restore && result.ok && !result.open) result = await bouquetRequest(id, 'restore')
    if (bouquetPins.get(id) !== entry) return
    if (result.ok && !result.open) {
      rememberArtPin(id, false)
      updateBouquetPin(id, null)
      return
    }
    if (!result.ok) throw new Error(result.error)
    if (entry.error) {
      entry = {phase:'open'}
      updateBouquetPin(id, entry)
    }
  } catch (error) {
    if (bouquetPins.get(id) !== entry) return
    const message = error.message === 'busy' ? 'desktop.busy' : 'desktop.error'
    if (entry.error !== message) {
      entry = {phase:'open', error:message}
      updateBouquetPin(id, entry)
    }
  }
  watchBouquet(id, entry)
}
// Keep one small hint per confirmed pin. The host owns its artwork and geometry.
function trackDesktopArtPins() {
  if (typeof window === 'undefined' || !window.addEventListener) return
  function hydrate(key) {
    if (!key?.startsWith(pinStoragePrefix)) return
    const id = artIdFromWindowKey(key.slice(pinStoragePrefix.length))
    if (id === null || bouquetPins.has(id)) return
    const entry = {phase:'open'}
    updateBouquetPin(id, entry)
    reconcileArtPin(id, entry, true)
  }
  function onStorage(event) {
    if (!event.key?.startsWith(pinStoragePrefix)) return
    if (event.newValue === '1') hydrate(event.key)
    else if (event.newValue === null) {
      const id = artIdFromWindowKey(event.key.slice(pinStoragePrefix.length))
      const entry = bouquetPins.get(id)
      if (entry?.phase === 'open') { window.clearTimeout(entry.timer); updateBouquetPin(id, null) }
    }
  }
  window.addEventListener('storage', onStorage)
  try {
    const storage = window.localStorage
    for (let i = 0; i < storage.length; i++) hydrate(storage.key(i))
  } catch { /* Storage can be disabled in the browser. */ }
  return () => {
    window.removeEventListener('storage', onStorage)
    for (const entry of bouquetPins.values()) { window.clearTimeout(entry.timer); entry.controller?.abort() }
    bouquetPins.clear()
  }
}
function toggleBouquetPin(card, container, t) {
  return toggleArtPin(card.id, () => snapshotBouquet(container, card.title || t(`vase.${card.vase}`)))
}

function toggleBloomPin(id, svg, title) {
  return toggleArtPin(id, () => {
    if (svg?.localName !== 'svg') throw new Error('Bloom artwork missing')
    const tree = ['div', {class:'fg-desktopBloom'}, [encodeDesktopArtwork(svg)]]
    return {mode:'bloom', tree, title, lang:document.documentElement.lang || 'en'}
  })
}

function cancelArtOpen(id) {
  const entry = bouquetPins.get(id)
  if (!entry?.controller) return
  entry.controller.abort()
  updateBouquetPin(id, null)
  bouquetRequest(id, 'close').catch(() => {})
}

async function toggleArtPin(id, capture) {
  const previous = bouquetPins.get(id)
  if (previous?.phase === 'pending') return
  if (previous?.phase === 'preparing') { cancelArtOpen(id); return }
  const closing = previous?.phase === 'open'
  window.clearTimeout(previous?.timer)
  const controller = closing ? null : new AbortController()
  updateBouquetPin(id, {phase:'pending', controller})
  try {
    const snapshot = closing ? undefined : capture()
    const result = closing ? await bouquetRequest(id, 'close') : await waitForDesktopOpen(
      () => bouquetRequest(id, 'open', snapshot), controller.signal,
      () => updateBouquetPin(id, {phase:'preparing', controller, status:'desktop.downloading'}),
    )
    if (controller?.signal.aborted) return
    if (!result.ok || closing === !!result.open) throw new Error(result.error || 'unavailable')
    rememberArtPin(id, !closing)
    if (closing) updateBouquetPin(id, null)
    else {
      const entry = {phase:'open'}
      updateBouquetPin(id, entry)
      watchBouquet(id, entry)
    }
  } catch (error) {
    if (controller?.signal.aborted) return
    if (controller && (error.message === 'runtime-wait-expired' || error.name === 'TimeoutError')) bouquetRequest(id, 'close').catch(() => {})
    const message = closing ? 'desktop.unpinFailed' : desktopSetupError(error.message) ?? ({'Bloom artwork missing':'desktop.artMissing','render-failed':'desktop.artMissing','Bouquet artwork missing':'desktop.artMissing','Invalid bouquet drawing':'desktop.artMissing','launch-failed':'desktop.launchFailed','invalid-snapshot':'desktop.tooLarge','too-large':'desktop.tooLarge','route-unavailable':'desktop.route',busy:'desktop.busy','runtime-unavailable':'desktop.unavailable'}[error.message] || 'desktop.error')
    const bloomErrors = {'desktop.artMissing':'bag.pinArtError','desktop.launchFailed':'bag.pinLaunchError','desktop.unpinFailed':'bag.unpinError','desktop.tooLarge':'bag.pinSizeError'}
    const pinError = typeof id === 'string' ? bloomErrors[message] ?? message : message
    const failed = {phase:closing ? 'open' : 'idle', error:pinError}
    updateBouquetPin(id, failed)
    if (closing) watchBouquet(id, failed)
  }
}

Object.assign(zh, { 'bulk.harvest':'一键收获 · {n}', 'bulk.sow':'随机播种 · {n}', 'bulk.harvested':'收获了 {n} 朵花', 'bulk.sown':'随机种下了 {n} 株', 'bulk.none':'做不了：金币不够，或者花篮满了' })
Object.assign(en, { 'bulk.harvest':'Harvest all · {n}', 'bulk.sow':'Random sow · {n}', 'bulk.harvested':'Harvested {n} flowers', 'bulk.sown':'Sowed {n} random seeds', 'bulk.none':'Not possible: too few coins, or the basket is full' })
Object.assign(zh, { 'bulk.greet':'一键问候 · {n}', 'bulk.greeted':'问候了 {n} 位访客，小费 +{coins}', 'bulk.nobody':'现在没有访客' })
Object.assign(en, { 'bulk.greet':'Greet all · {n}', 'bulk.greeted':'Greeted {n} visitors, tips +{coins}', 'bulk.nobody':'No visitors right now' })
// The desktop window mirrors this mounted MiniGarden. All commands resolve against
// current, connected controls here, where React and the garden store live.
Object.assign(zh, {
  'desktop.downloading':'正在下载桌面组件。完成后会自动打开。', 'desktop.cancelWait':'取消等待',
  'desktop.installFailed':'桌面组件安装失败。请检查网络连接和可用磁盘空间，然后点按钮重试。',
  'desktop.waitExpired':'等待桌面组件超时，请点按钮再试一次。',
  'desktop.pin':'放到桌面', 'desktop.unpin':'收回桌面小窗', 'desktop.opening':'正在打开…',
  'desktop.error':'桌面小窗未连接。请确认桌面运行环境可用后重试。',
  'desktop.busy':'另一扇窗口正在控制桌面花园。请先在那里收回小窗。', 'desktop.close':'关闭桌面小窗',
  'desktop.unavailable':'当前环境无法启动桌面窗口。你可以继续使用随身花园。',
})
Object.assign(en, {
  'desktop.downloading':'Downloading the desktop runtime. Your window will open when it is ready.', 'desktop.cancelWait':'Cancel wait',
  'desktop.installFailed':'Desktop setup failed. Check your connection and free disk space, then try the button again.',
  'desktop.waitExpired':'Timed out waiting for desktop setup. Try the button again.',
  'desktop.pin':'Pin to desktop', 'desktop.unpin':'Bring garden back', 'desktop.opening':'Opening…',
  'desktop.error':'Desktop garden disconnected. Check the desktop runtime and try again.',
  'desktop.unavailable':'This environment cannot open a desktop window. Your pocket garden is still available.',
  'desktop.busy':'Another window controls the desktop garden. Close its desktop garden first.', 'desktop.close':'Close desktop garden',
})

function createDesktopMirror(root, t) {
  const identities = new WeakMap()
  let nextId = 0, controls = new Map()
  const meaning = node => {
    const plot = node.closest('[data-mini-plot]')
    const state = getState()
    const flower = plot && state.scenes[state.scene]?.plots[Number(plot.dataset.miniPlot)]
    return [state.scene, plot?.dataset.miniPlot, flower?.species, flower?.dna, node.textContent, node.value, node.title].join('|')
  }
  const colorKeys = 'bg-base bg-layer-1 bg-layer-2 label-primary label-secondary border-l1 border-l2 brand-primary state-success-primary state-error-primary state-warn-primary state-idle-primary'.split(' ')
  // Resolve host theme colors here, including modern CSS color functions, then
  // normalize to sRGB pixels. The companion receives colors rather than CSS.
  const colorCanvas = document.createElement('canvas')
  colorCanvas.width = colorCanvas.height = 1
  const paint = colorCanvas.getContext('2d', {willReadFrequently:true})
  const colors = new Map()
  function palette(live) {
    const theme = {}
    if (!paint) return theme
    const style = window.getComputedStyle(live)
    for (const key of colorKeys) {
      const value = style.getPropertyValue(`--dsw-alias-${key}`).trim()
      if (!value || !window.CSS.supports('color',value)) continue
      if (!colors.has(value)) {
        paint.clearRect(0,0,1,1)
        paint.fillStyle = value
        paint.fillRect(0,0,1,1)
        colors.set(value,'#'+Array.from(paint.getImageData(0,0,1,1).data, n=>n.toString(16).padStart(2,'0')).join(''))
      }
      theme[key] = colors.get(value)
    }
    return theme
  }
  function snapshot() {
    const live = root.current?.firstElementChild
    if (!live) return undefined
    const fresh = new Map()
    function encode(node) {
      if (node.nodeType === 3) return node.nodeValue
      if (node.nodeType !== 1) return ''
      const attrs = Object.fromEntries(Array.from(node.attributes).filter(attr => attr.name !== 'style').map(attr => [attr.name, attr.value]))
      for (const property of ['animation-delay','transform-origin','fill','stroke','stroke-width','stroke-linecap','stroke-dasharray','background-color']) {
        const value = node.style?.getPropertyValue(property)
        if (value) attrs[`$${property}`] = value
      }
      if (node.matches('button,select')) {
        const signature = meaning(node)
        let identity = identities.get(node)
        if (identity?.signature !== signature) {
          identity = { id: String(++nextId), signature }
          identities.set(node, identity)
        }
        fresh.set(identity.id, { node, signature })
        attrs['data-command'] = identity.id
        if (node.localName === 'select') attrs['data-selection'] = node.value
      }
      return [node.localName, attrs, Array.from(node.childNodes, encode)]
    }
    const tree = encode(live)
    controls = fresh
    return { tree, theme:palette(live), title:t('mini.title'), close:t('desktop.close'), lang:document.documentElement.lang || 'en' }
  }
  function act(action) {
    const target = controls.get(action?.id)
    if (!target) return
    const {node, signature} = target
    if (!root.current?.contains(node) || node.disabled || meaning(node) !== signature) return
    if (node.localName === 'button' && action.value === undefined) node.click()
    if (node.localName === 'select' && Array.from(node.options).some(option => option.value === action.value)) {
      node.value = action.value
      node.dispatchEvent(new Event('change', {bubbles:true}))
    }
  }
  return {snapshot, act}
}

async function desktopGardenRequest(payload) {
  const path = '/api/flower-garden/desktop'
  const options = {method:'POST',credentials:'same-origin',signal:AbortSignal.timeout(22000),headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}
  const response = await globalThis.fetch(path, options)
  if ([401,403,404,405].includes(response.status)) throw new Error('route-unavailable')
  if (response.status === 413) throw new Error('too-large')
  const result = await response.json()
  if (!response.ok && !result?.error) throw new Error('Desktop garden request failed')
  return result
}

let desktopOwnerId
function desktopOwner() {
  if (desktopOwnerId) return desktopOwnerId
  const key = 'flower-garden.desktop-owner.v1'
  try {
    const saved = window.sessionStorage.getItem(key)
    if (/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(saved ?? '')) return (desktopOwnerId = saved)
    desktopOwnerId = crypto.randomUUID()
    window.sessionStorage.setItem(key, desktopOwnerId)
  } catch { desktopOwnerId ??= crypto.randomUUID() }
  return desktopOwnerId
}

// The host prepares one shared runtime. Re-submit an open only while its original
// control is active, using the same owner, key and artwork on every request.
async function waitForDesktopOpen(open, signal, preparing) {
  const deadline = Date.now() + 600000
  for (let attempt = 0; attempt < 150 && Date.now() < deadline; attempt++) {
    if (signal.aborted) throw new Error('cancelled')
    const result = await open()
    if (signal.aborted) throw new Error('cancelled')
    if (result?.error !== 'runtime-preparing') return result
    if (attempt === 0) preparing()
    await new Promise(resolve => {
      function resume() {
        window.clearTimeout(timer)
        signal.removeEventListener('abort', resume)
        resolve()
      }
      const timer = window.setTimeout(resume, 4000)
      signal.addEventListener('abort', resume, {once:true})
      if (signal.aborted) resume()
    })
  }
  return {ok:false, open:false, error:'runtime-wait-expired'}
}

function desktopSetupError(error) {
  if (error === 'runtime-install-failed') return 'desktop.installFailed'
  if (error === 'runtime-wait-expired') return 'desktop.waitExpired'
}

function useDesktopGarden(body, t) {
  const [phase, setPhase] = React.useState('idle')
  const [message, setMessage] = React.useState('')
  const session = React.useRef(null)
  function stop() {
    const active = session.current
    if (!active) return
    session.current = null
    active.controller.abort()
    window.clearTimeout(active.timer)
    window.removeEventListener('pagehide',active.cleanup)
    desktopGardenRequest({op:'close',owner:active.owner}).catch(()=>{})
  }
  React.useEffect(()=>()=>stop(),[])
  async function toggle() {
    if (session.current) { stop(); setPhase('idle'); setMessage(''); return }
    const active = {owner:desktopOwner(), controller:new AbortController(), timer:0, cleanup:stop, previous:null}
    const mirror = createDesktopMirror(body,t)
    session.current = active
    window.addEventListener('pagehide',stop)
    setPhase('opening'); setMessage('')
    async function sync(op) {
      if (session.current !== active) return
      try {
        const snapshot = mirror.snapshot()
        const encoded = JSON.stringify(snapshot)
        const payload = {op,owner:active.owner,snapshot:encoded===active.previous ? undefined : snapshot}
        const result = op === 'open'
          ? await waitForDesktopOpen(() => desktopGardenRequest(payload), active.controller.signal, () => { setPhase('preparing'); setMessage('desktop.downloading') })
          : await desktopGardenRequest(payload)
        active.previous = encoded
        if (session.current !== active) return
        if (!result?.ok || !result.open) {
          stop()
          setPhase('idle')
          const errors = {busy:'desktop.busy', 'runtime-unavailable':'desktop.unavailable'}
          setMessage(result?.ok ? '' : desktopSetupError(result?.error) ?? errors[result?.error] ?? 'desktop.error')
          return
        }
        setPhase('open'); setMessage('')
        for (const action of result.actions ?? []) mirror.act(action)
        active.timer = window.setTimeout(()=>sync('sync'), 450)
      } catch {
        if (session.current === active) { stop(); setPhase('idle'); setMessage('desktop.error') }
      }
    }
    await sync('open')
  }
  return {phase,message,toggle,stop}
}

// The pocket garden's "today" strip: everything worth a click, without leaving the conversation.
Object.assign(zh, {
  'mini.daily':'签到 · {reward}', 'mini.wish':'心愿 {n}/{max}', 'mini.wishClaim':'领心愿 +{n}', 'mini.want':'交{flower} +{n}', 'mini.wantCount':'征花 {n}/{max}',
  'mini.harvestAll':'全部收获 · {n}', 'mini.sprinkle':'洒水器 ×{n}', 'mini.trip':'小队 {n}',
})
Object.assign(en, {
  'mini.daily':'Check in · {reward}', 'mini.wish':'Wishes {n}/{max}', 'mini.wishClaim':'Wish +{n}', 'mini.want':'Deliver {flower} +{n}', 'mini.wantCount':'Wanted {n}/{max}',
  'mini.harvestAll':'Harvest all · {n}', 'mini.sprinkle':'Sprinkler ×{n}', 'mini.trip':'Party {n}',
})

function MiniToday({ state, t, clock, run }) {
  const now = () => Date.now()
  const daily = dailyStatus(state, clock), gift = giftAt(state, clock), event = eventAt(state, clock)
  const quests = dailyQuests(state, clock)
  const wantList = wantedAt(state, clock), wanted = wantedState(state, clock)
  const trip = state.expedition, jobs = state.workshop?.jobs ?? []
  const btn = (key, label, transition) => h('button', { key, type: 'button', className: 'fg-btn fg-btnSmall fg-btnPrimary', 'data-mini': key, onClick: () => run(transition) }, label)
  const chip = (key, label, tone) => h('span', { key, className: 'fg-questChip', 'data-tone': tone }, label)
  return h('div', { className: 'fg-miniToday' },
    daily.available ? btn('daily', `🗓 ${t('mini.daily', { reward: rewardText(daily.reward, t) })}`, current => claimDaily(current, now())) : null,
    gift ? btn('gift', `🎁 ${t('play.gift')}`, current => openGift(current, now())) : null,
    event ? btn('event', `${EVENT_ICON[event.type]} ${t(`event.${event.type}`)}`, current => joinEvent(current, now())) : null,
    boostBonus(state, clock) > 0 ? chip('boost', `🌈 ${formatDuration(state.boost.until - clock, t)}`, 'gold') : null,
    quests.filter(quest => quest.done && !quest.claimed).map(quest => btn(`wish-${quest.id}`, `⭐ ${t('mini.wishClaim', { n: quest.coins })}`, current => claimQuest(current, quest.id, now()))),
    chip('wishes', t('mini.wish', { n: quests.filter(quest => quest.claimed).length, max: quests.length })),
    wantList.filter(id => !wanted.done.includes(id) && state.basket.some(item => item.species === id))
      .map(id => btn(`want-${id}`, `💐 ${t('mini.want', { flower: t(`species.${id}`), n: wantedPay(id) })}`, current => deliverWanted(current, id, now()))),
    chip('wanted', t('mini.wantCount', { n: wanted.done.length, max: wantList.length })),
    trip ? (clock >= trip.end ? btn('trip', `🧺 ${t('trip.claim')}`, current => claimExpedition(current, now())) : chip('trip', `🧺 ${t('mini.trip', { n: formatDuration(trip.end - clock, t) })}`)) : null,
    jobs.map((job, index) => (clock >= job.end ? btn(`job-${index}`, t('work.claim', { name: t(`work.${job.recipe}`), n: job.coins }), current => claimJob(current, index, now())) : null)))
}

// The garden's "today" card: one lit cell per daily thing, a click does it or jumps to where it lives.
Object.assign(zh, { 'today.title':'今日', 'today.daily':'签到', 'today.wish':'心愿', 'today.gift':'礼盒', 'today.wanted':'征花', 'today.brief':'花束订单', 'today.event':'奇遇' })
Object.assign(en, { 'today.title':'Today', 'today.daily':'Check-in', 'today.wish':'Wishes', 'today.gift':'Gift', 'today.wanted':'Wanted', 'today.brief':'Bouquet brief', 'today.event':'Event' })

function todayTasks(state, now) {
  const daily = dailyStatus(state, now), quests = dailyQuests(state, now), gift = giftAt(state, now), event = eventAt(state, now)
  const wantList = wantedAt(state, now), wanted = wantedState(state, now), brief = briefAt(now)
  const wish = quests.find(quest => quest.done && !quest.claimed)
  const give = wantList.find(id => !wanted.done.includes(id) && state.basket.some(item => item.species === id))
  return [
    { id: 'daily', icon: '🗓', done: !daily.available, run: daily.available ? current => claimDaily(current, Date.now()) : null },
    { id: 'wish', icon: '⭐', done: quests.every(quest => quest.claimed), progress: `${quests.filter(quest => quest.claimed).length}/${quests.length}`,
      run: wish ? current => claimQuest(current, wish.id, Date.now()) : null },
    gift ? { id: 'gift', icon: '🎁', done: false, run: current => openGift(current, Date.now()) } : null,
    { id: 'wanted', icon: '💐', done: wanted.done.length >= wantList.length, progress: `${wanted.done.length}/${wantList.length}`,
      run: give ? current => deliverWanted(current, give, Date.now()) : null, jump: 'basket' },
    { id: 'brief', icon: '📋', done: (state.briefDay ?? -1) >= brief.day, run: null, jump: 'studio' },
    event ? { id: 'event', icon: EVENT_ICON[event.type], done: false, run: current => joinEvent(current, Date.now()) } : null,
  ].filter(Boolean)
}

function TodayCard({ state, t, clock, hidden, onChange, onJump }) {
  const tasks = todayTasks(state, clock)
  return h('section', { className: 'fg-today', hidden, 'aria-label': t('today.title') },
    h('strong', { className: 'fg-todayTitle' }, t('today.title'), ' ', h('span', { className: 'fg-note' }, `${tasks.filter(task => task.done).length}/${tasks.length}`)),
    tasks.map(task => {
      const ready = !task.done && task.run !== null
      return h('button', { key: task.id, type: 'button', className: 'fg-todayCell', 'data-today': task.id,
        'data-state': task.done ? 'done' : ready ? 'ready' : 'open', disabled: task.done && !task.jump,
        title: t(`today.${task.id}`),
        onClick: () => {
          if (ready) { tick(); const next = task.run(getState()); if (next !== null) onChange(next) }
          else if (task.jump) onJump(task.jump)
        } },
        h('span', { className: 'fg-todayIcon', 'aria-hidden': true }, task.done ? '✓' : task.icon),
        h('span', { className: 'fg-todayLabel' }, t(`today.${task.id}`), task.progress && !task.done ? ` ${task.progress}` : ''))
    }))
}

// Backdrops and colours for the alpine, rainforest, coast and eastern-garden grounds.
Object.assign(PANORAMA_GROUND, { alpine: '#5f8a63', rainforest: '#234f3a', coast: '#c9b58a', garden: '#6f8f62' })
const MORE_PANORAMA = {
  alpine: () => h('g', { key: 'alpine' },
    h('path', { d: 'M0 190L150 70L300 175L470 40L640 170L800 60L960 172L1090 90L1200 160V300H0Z', fill: '#6f7f93' }),
    h('path', { d: 'M110 102L150 70L196 108L170 100L150 116L132 98ZM425 78L470 40L520 80L492 72L470 92L448 70ZM760 92L800 60L846 96L820 88L800 106L780 86ZM1056 114L1090 90L1124 114L1104 108L1090 122L1076 106Z', fill: '#f4f8fa' }),
    h('path', { d: 'M0 205Q200 160 420 204T820 190T1200 200V300H0Z', fill: '#7fa66a' }),
    h('path', { d: 'M0 250Q260 215 520 250T1200 240V300H0Z', fill: '#5f8a63' }),
    ...Array.from({ length: 26 }, (_, i) => h('circle', { key: i, cx: 30 + (i * 137) % 1150, cy: 222 + (i * 29) % 60, r: 3, fill: ['#f4f1e2', '#6f8fe6', '#f2c94c', '#9a86dc'][i % 4] }))),
  rainforest: () => h('g', { key: 'rainforest' },
    h('path', { d: 'M0 150Q150 90 300 140T600 120T900 138T1200 110V300H0Z', fill: '#2f7355' }),
    ...Array.from({ length: 13 }, (_, i) => h('ellipse', { key: `c${i}`, cx: i * 100, cy: 130 + (i % 3) * 22, rx: 86, ry: 62, fill: i % 2 ? '#2a6a4c' : '#1f5a40' })),
    ...Array.from({ length: 9 }, (_, i) => h('path', { key: `v${i}`, d: `M${60 + i * 135} 60q${i % 2 ? 14 : -14} 70 0 150`, fill: 'none', stroke: '#3d8a5c', strokeWidth: 4, opacity: .8 })),
    ...Array.from({ length: 7 }, (_, i) => { const x = 90 + i * 170; return h('path', { key: `p${i}`, d: `M${x} 290q-10 -70 -50 -96M${x} 290q0 -78 6 -112M${x} 290q14 -66 54 -90`, fill: 'none', stroke: '#58a06b', strokeWidth: 7, strokeLinecap: 'round' }) }),
    h('path', { d: 'M0 262Q300 236 600 262T1200 254V300H0Z', fill: '#234f3a' })),
  coast: () => h('g', { key: 'coast' },
    h('path', { d: 'M0 150H1200V300H0Z', fill: '#4f9fc4' }),
    h('path', { d: 'M0 172q60 -8 120 0t120 0t120 0t120 0t120 0t120 0t120 0t120 0t120 0t120 0', fill: 'none', stroke: '#d8f0f6', strokeWidth: 3, opacity: .7 }),
    h('path', { d: 'M0 196q75 -8 150 0t150 0t150 0t150 0t150 0t150 0t150 0t150 0', fill: 'none', stroke: '#d8f0f6', strokeWidth: 3, opacity: .5 }),
    h('path', { d: 'M0 120L90 108L170 150L210 230L0 250Z', fill: '#b9a98c' }),
    h('path', { d: 'M0 120L90 108L120 124L40 138Z', fill: '#8fae78' }),
    h('path', { d: 'M930 80h14v80h-14ZM922 72h30v10h-30Z', fill: '#f4efe6' }), h('path', { d: 'M930 100h14v12h-14Z', fill: '#cf5f5f' }), h('circle', { cx: 937, cy: 66, r: 7, fill: '#f7dc7a' }),
    h('path', { d: 'M860 160L1010 150L1200 170V300H800Z', fill: '#b9a98c' }),
    h('path', { d: 'M0 232Q300 206 620 240T1200 226V300H0Z', fill: '#e2d2a6' }),
    h('path', { d: 'M0 268Q320 248 640 270T1200 262V300H0Z', fill: '#c9b58a' })),
  garden: () => h('g', { key: 'garden' },
    h('path', { d: 'M0 180Q200 120 420 172T820 150T1200 168V300H0Z', fill: '#8fb08a' }),
    h('path', { d: 'M150 200h150M165 200v-46h120v46M140 156q85 -46 170 0q-85 -18 -170 0ZM178 142q47 -30 94 0q-47 -12 -94 0Z', fill: '#7a4a3c', stroke: '#5c3329', strokeWidth: 3 }),
    h('path', { d: 'M520 226Q700 196 880 226Q700 252 520 226Z', fill: '#7fb7c4' }),
    h('path', { d: 'M560 222Q700 150 840 222', fill: 'none', stroke: '#b5483f', strokeWidth: 9 }), h('path', { d: 'M580 222Q700 168 820 222', fill: 'none', stroke: '#8a2f2a', strokeWidth: 3 }),
    ...Array.from({ length: 6 }, (_, i) => { const x = 940 + i * 44; return h('g', { key: `t${i}` }, h('path', { d: `M${x} 240v-52`, stroke: '#6a5140', strokeWidth: 6 }), h('circle', { cx: x, cy: 176, r: 26, fill: i % 2 ? '#f3b4c8' : '#f7cbd8' })) }),
    ...Array.from({ length: 5 }, (_, i) => h('path', { key: `b${i}`, d: `M${40 + i * 22} 250v-${70 + i * 8}`, stroke: '#5f9058', strokeWidth: 5 })),
    h('path', { d: 'M0 256Q300 232 600 258T1200 248V300H0Z', fill: '#6f8f62' })),
}

// Using a bloom for its role, and the daily wanted flowers.
Object.assign(zh, {
  'use.nectar':'酿成花蜜', 'use.pollen':'撒花粉', 'use.seed':'收种做肥', 'use.shelter':'铺作花泥', 'use.water':'洒作花露', 'use.night':'点作夜香',
  'use.nectar.note':'用途：偏爱它的访客好感 +2', 'use.pollen.note':'用途：给当前花地一株花授粉', 'use.seed.note':'用途：换一份肥料',
  'use.shelter.note':'用途：当前花地每个花圃地力 +20', 'use.water.note':'用途：把当前花地的花全部浇透', 'use.night.note':'用途：五分钟内仙品率 +2%',
  'use.done':'用掉了{flower}：{effect}', 'use.cannot':'现在用不上{flower}，先留着',
  'want.title':'今日征花', 'want.have':'花篮里有 {n} 朵', 'want.give':'交付 · +{n}', 'want.done':'已交付', 'want.count':'累计交付 {n} 朵',
  'want.rules':'每天点名三种花，按顺序把已解锁花地的每一种花都轮一遍。交一朵得到两倍卖价再加 10 金币，不受跌价影响；三种都交齐再得 1 条绶带。另外，背包里每朵花都能直接用掉：蜜源花涨访客好感，花粉花授粉，种实花换肥料，庇护花养地力，水岸花浇水，夜花提高仙品率；杂交、奇珍和仙品效果加倍。',
})
Object.assign(en, {
  'use.nectar':'Make nectar', 'use.pollen':'Scatter pollen', 'use.seed':'Seed into feed', 'use.shelter':'Mulch the beds', 'use.water':'Sprinkle as dew', 'use.night':'Burn as night scent',
  'use.nectar.note':'Use: +2 bond with the visitor that loves it', 'use.pollen.note':'Use: pollinates one plant in this ground', 'use.seed.note':'Use: becomes one fertiliser',
  'use.shelter.note':'Use: +20 soil for every plot in this ground', 'use.water.note':'Use: waters every plant in this ground', 'use.night.note':'Use: +2% spirit chance for five minutes',
  'use.done':'Used {flower}: {effect}', 'use.cannot':'No use for {flower} right now; keep it',
  'want.title':'Wanted today', 'want.have':'{n} in the basket', 'want.give':'Deliver · +{n}', 'want.done':'Delivered', 'want.count':'{n} delivered so far',
  'want.rules':'Three species are wanted each day, walking through every flower of your opened grounds in turn. One bloom pays twice its price plus 10 coins, whatever the market slump; all three add a ribbon. Besides, any bloom in the backpack can be used up: nectar flowers raise a bond, pollen flowers pollinate, seed flowers become fertiliser, shelter flowers feed the soil, waterside flowers water, night flowers raise the spirit chance; hybrids, curiosities and spirit blooms count double.',
})

function WantedBoard({ state, t, clock, onChange }) {
  const list = wantedAt(state, clock), wanted = wantedState(state, clock)
  return h('section', { className: 'fg-section fg-wanted', id: 'fg-wanted' },
    h('div', { className: 'fg-sectionHead' },
      h('h3', { className: 'fg-sectionTitle' }, t('want.title')),
      h('span', { className: 'fg-sectionMeta' }, `${wanted.done.length}/${list.length}`),
      (state.wantedDone ?? 0) > 0 ? h('span', { className: 'fg-sectionMeta' }, t('want.count', { n: state.wantedDone })) : null,
      h(InfoTip, { t, lines: [t('want.rules')] })),
    h('div', { className: 'fg-wantGrid' }, list.map(id => {
      const have = state.basket.filter(item => item.species === id).length, done = wanted.done.includes(id)
      return h('article', { key: id, className: 'fg-want', 'data-wanted': id, 'data-done': done ? 'true' : 'false' },
        h('span', { className: 'fg-wantArt' }, h(FlowerArt, { speciesId: id, stage: 'bloom', variant: 'base' })),
        h('strong', null, t(`species.${id}`)),
        h('span', { className: 'fg-note' }, `${t(`scene.${SCENE_ID_OF.get(id)}`)} · ${t('want.have', { n: have })}`),
        done ? h('span', { className: 'fg-questChip', 'data-tone': 'gold' }, '✓ ', t('want.done'))
          : h('button', { type: 'button', className: 'fg-btn fg-btnSmall fg-btnPrimary', 'data-action': 'wantedGive', disabled: have === 0,
            onClick: () => { tick(); const next = deliverWanted(getState(), id, Date.now()); if (next !== null) onChange(next) } }, t('want.give', { n: wantedPay(id) })))
    })))
}

// Companions, garden events, the daily bouquet brief, flower-language greeting cards and the two new tabs.
Object.assign(zh, {
  'tabs.studio':'工坊', 'tabs.album':'收藏册',
  'tabs.group.garden':'花园', 'tabs.group.bag':'背包', 'tabs.group.studio':'工坊', 'tabs.group.tasks':'任务', 'tabs.group.book':'图鉴', 'tabs.basket.short':'花篮',
  'pal.title':'常驻伙伴', 'pal.count':'{n}/{max}', 'pal.none':'和一位访客的好感升满后，可以邀请它住下来帮忙。',
  'pal.invite':'邀请住下 · {n} 金币', 'pal.confirm':'确认 · {n} 金币', 'pal.leave':'请它回去', 'pal.home':'已住下',
  'pal.do.pollinator':'每小时给一株花授粉', 'pal.do.waterside':'每小时把最干的一株浇透', 'pal.do.guardian':'每小时给最瘦的花圃 +15 地力',
  'pal.rules':'好感满四级的访客可以花金币邀请住下，最多三位。传粉的每小时给一株花授粉，水岸的每小时把最干的一株浇透，护园的每小时给地力最低的花圃 +15。关掉页面再回来，只补最近一小时的那一次。',
  'event.rainbow':'雨后彩虹', 'event.swarm':'蜂群过境', 'event.dew':'晨露降临', 'event.meteor':'流星划过',
  'event.rainbow.do':'追彩虹 · 十分钟仙品率 +2%', 'event.swarm.do':'迎蜂群 · 这块地全部授粉', 'event.dew.do':'接晨露 · 所有花浇透', 'event.meteor.do':'许个愿 · 幸运符生效',
  'event.left':'{n}后消失', 'event.boost':'彩虹还在 · 仙品率 +2% · {n}', 'event.done':'{name}！',
  'brief.title':'今日花束订单', 'brief.need':'{stars}★ 以上 · 至少 {count} 朵 · {theme}主题', 'brief.reward':'奖 {reward}', 'brief.done':'今日已交',
  'greet.open':'做成花语贺卡', 'greet.toPh':'写给谁', 'greet.to':'致 {name}', 'greet.title':'送你一束花语', 'greet.save':'存成贺卡',
})
Object.assign(en, {
  'tabs.studio':'Studio', 'tabs.album':'Album',
  'tabs.group.garden':'Garden', 'tabs.group.bag':'Bag', 'tabs.group.studio':'Studio', 'tabs.group.tasks':'Tasks', 'tabs.group.book':'Guide', 'tabs.basket.short':'Basket',
  'pal.title':'Companions', 'pal.count':'{n}/{max}', 'pal.none':'Complete the bond with a visitor and you can invite it to stay and help.',
  'pal.invite':'Invite to stay · {n} coins', 'pal.confirm':'Confirm · {n} coins', 'pal.leave':'Send home', 'pal.home':'Living here',
  'pal.do.pollinator':'Pollinates one plant an hour', 'pal.do.waterside':'Waters the driest plant every hour', 'pal.do.guardian':'Adds 15 soil to the poorest plot every hour',
  'pal.rules':'A visitor at bond level four can be invited to stay for coins, up to three. Pollinators pollinate one plant an hour, waterside visitors water the driest plant, guardians add 15 soil to the poorest plot. After time away only the latest hour is made up.',
  'event.rainbow':'A rainbow', 'event.swarm':'A passing swarm', 'event.dew':'Morning dew', 'event.meteor':'A shooting star',
  'event.rainbow.do':'Chase it · spirit chance +2% for ten minutes', 'event.swarm.do':'Welcome it · pollinates this whole ground', 'event.dew.do':'Catch it · waters every plant', 'event.meteor.do':'Make a wish · arms a lucky charm',
  'event.left':'gone in {n}', 'event.boost':'Rainbow still up · spirit chance +2% · {n}', 'event.done':'{name}!',
  'brief.title':'Today’s bouquet brief', 'brief.need':'{stars}★ or better · {count}+ flowers · {theme} theme', 'brief.reward':'Pays {reward}', 'brief.done':'Delivered today',
  'greet.open':'Make a flower-language card', 'greet.toPh':'Who is it for', 'greet.to':'For {name}', 'greet.title':'A bouquet of meanings', 'greet.save':'Save the card',
})

const EVENT_ICON = { rainbow: '🌈', swarm: '🐝', dew: '💧', meteor: '🌠' }

function CompanionBoard({ state, t, onChange }) {
  const [armed, setArmed] = React.useState(null)
  const home = state.companions ?? []
  const ready = VISITORS.filter(visitor => affinityLevel(state, visitor.id) >= AFFINITY_LEVELS.length && !home.includes(visitor.id))
  const apply = transition => { tick(); const next = transition(getState()); if (next !== null) onChange(next) }
  const card = (id, living) => h('article', { key: id, className: 'fg-pal', 'data-companion': id, 'data-home': living ? 'true' : 'false' },
    h('span', { className: 'fg-palArt' }, h(VisitorArt, { id })),
    h('strong', null, t(`visitor.${id}`)),
    h('span', { className: 'fg-note' }, t(`pal.do.${companionRole(id)}`)),
    living
      ? h('button', { type: 'button', className: 'fg-btn fg-btnSmall fg-btnGhost', onClick: () => apply(current => dismissCompanion(current, id)) }, t('pal.leave'))
      : h('button', { type: 'button', className: armed === id ? 'fg-btn fg-btnSmall fg-btnDanger' : 'fg-btn fg-btnSmall fg-btnPrimary', 'data-action': 'palInvite',
        disabled: home.length >= COMPANION_MAX || state.coins < COMPANION_COST,
        onClick: () => { if (armed !== id) { setArmed(id); return } setArmed(null); apply(current => inviteCompanion(current, id)) } }, t(armed === id ? 'pal.confirm' : 'pal.invite', { n: COMPANION_COST })))
  return h('div', { className: 'fg-pals', id: 'fg-pals' },
    h('div', { className: 'fg-sectionHead' },
      h('h3', { className: 'fg-sectionTitle' }, t('pal.title')),
      h('span', { className: 'fg-sectionMeta' }, t('pal.count', { n: home.length, max: COMPANION_MAX })),
      h(InfoTip, { t, lines: [t('pal.rules')] })),
    home.length === 0 && ready.length === 0 ? h('p', { className: 'fg-empty' }, t('pal.none'))
      : h('div', { className: 'fg-palGrid' }, home.map(id => card(id, true)), ready.map(visitor => card(visitor.id, false))))
}

/** A passing event to catch, and the rainbow's countdown while it lasts. */
function EventBanner({ state, t, clock, hidden, onJoin }) {
  const event = eventAt(state, clock)
  const boost = boostBonus(state, clock) > 0 ? state.boost : null
  if (event === null && boost === null) return null
  return h('div', { className: 'fg-event', hidden },
    event === null ? null : h('button', { type: 'button', className: 'fg-eventGo', 'data-action': 'event', 'data-event': event.type,
      onClick: () => { tick(); const next = joinEvent(getState(), Date.now()); if (next !== null) onJoin(next, t('event.done', { name: t(`event.${event.type}`) })) } },
    h('span', { className: 'fg-eventIcon', 'aria-hidden': true }, EVENT_ICON[event.type]),
    h('strong', null, t(`event.${event.type}`)), h('span', null, t(`event.${event.type}.do`)),
    h('span', { className: 'fg-note' }, t('event.left', { n: formatDuration(Math.max(0, event.until - clock), t) }))),
    boost === null ? null : h('span', { className: 'fg-questChip', 'data-tone': 'gold' }, '🌈 ', t('event.boost', { n: formatDuration(boost.until - clock, t) })))
}

function BriefChip({ state, t, clock, items, score }) {
  const brief = briefAt(clock)
  const done = (state.briefDay ?? -1) >= brief.day
  const met = !done && briefMet(brief, items, score)
  return h('div', { className: 'fg-brief', 'data-brief': done ? 'done' : met ? 'met' : 'open' },
    h('strong', null, '📋 ', t('brief.title')),
    h('span', null, t('brief.need', { stars: brief.stars, count: brief.count, theme: t(`arrange.theme.${brief.theme}`) })),
    h('span', { className: 'fg-questChip', 'data-tone': 'gold', 'data-done': met ? 'true' : undefined }, done ? t('brief.done') : `${met ? '✓ ' : ''}${t('brief.reward', { reward: `${rewardText(BRIEF_REWARD, t)} + ${t('ribbon.label')} ×${BRIEF_REWARD.ribbons}` })}`))
}

/** Turn a bouquet card into a greeting: the meanings of its flowers, addressed to someone. */
function GreetingEditor({ t, card }) {
  const [to, setTo] = React.useState('')
  const meanings = [...new Set(card.items.map(item => item.species))].slice(0, 2).map(id => t(`codex.${id}`))
  const head = to.trim() ? t('greet.to', { name: to.trim().slice(0, 16) }) : t('greet.title')
  return h('div', { className: 'fg-cardEdit fg-greet' },
    h('input', { type: 'text', maxLength: 16, value: to, placeholder: t('greet.toPh'), 'aria-label': t('greet.toPh'), onChange: event => setTo(event.target.value) }),
    h('div', { className: 'fg-cardInscription' }, h('strong', null, head), meanings.map((line, index) => h('span', { key: index }, line))),
    h('button', { type: 'button', className: 'fg-btn fg-btnSmall fg-btnPrimary', 'data-action': 'greetSave', onClick: event => saveCard(event.currentTarget.closest('.fg-keepCard'), [head, ...meanings], `flower-garden-greeting-${card.id}`) }, t('greet.save')))
}

const TAB_ICONS = { garden: '🌱', basket: '🧺', studio: '💐', album: '📔', orders: '✉️', ecology: '🔬', show: '🎀', shop: '🛒', flowers: '📖', visitors: '🦋', settings: '⚙️', bag: '🎒', tasks: '📋', book: '📖' }

// Copy for the new uses of reputation, study notes and ribbons, and the added achievements.
Object.assign(zh, {
  'rush.go':'用 1 条绶带立刻完成', 'trip.patron':'委托声望 {n} · 多带回 {bonus} 样',
  'ach.bouquets10.name':'花艺熟手', 'ach.bouquets10.desc':'完成 10 束花', 'ach.trips10.name':'远行常客', 'ach.trips10.desc':'迎回 10 支采种小队',
  'ach.crafted20.name':'花坊师傅', 'ach.crafted20.desc':'在花坊做出 20 件成品', 'ach.contest3.name':'赛场常胜', 'ach.contest3.desc':'在每周花束赛夺冠 3 次',
  'ach.fund10.name':'花园赞助', 'ach.fund10.desc':'花园基金升到 10 级', 'ach.bonds3.name':'知心朋友', 'ach.bonds3.desc':'与 3 位访客好感全满',
  'ach.breeder7.name':'育种名家', 'ach.breeder7.desc':'完成全部 7 个育种目标', 'ach.cards30.name':'收藏家', 'ach.cards30.desc':'收藏册里有 30 张花卡',
})
Object.assign(en, {
  'rush.go':'Finish now for 1 ribbon', 'trip.patron':'Reputation {n} · {bonus} extra finds',
  'ach.bouquets10.name':'Practised florist', 'ach.bouquets10.desc':'Finish 10 bouquets', 'ach.trips10.name':'Seasoned traveller', 'ach.trips10.desc':'Welcome back 10 expeditions',
  'ach.crafted20.name':'Workshop master', 'ach.crafted20.desc':'Make 20 things in the workshop', 'ach.contest3.name':'Contest champion', 'ach.contest3.desc':'Win the weekly bouquet contest 3 times',
  'ach.fund10.name':'Garden patron', 'ach.fund10.desc':'Raise the garden fund to level 10', 'ach.bonds3.name':'Close friends', 'ach.bonds3.desc':'Complete the bond with 3 visitors',
  'ach.breeder7.name':'Master breeder', 'ach.breeder7.desc':'Finish all 7 breeding goals', 'ach.cards30.name':'Collector', 'ach.cards30.desc':'Keep 30 flower cards in the album',
})
zh['eco.milestones'] = (zh['eco.milestones'] ?? '') + ' 研究等级每升一级，这个品种的仙品率 +1%。'
en['eco.milestones'] = (en['eco.milestones'] ?? '') + ' Each study level adds 1% spirit chance for that species.'

// The garden fund board.
Object.assign(zh, {
  'fund.title':'花园基金', 'fund.level':'{rank} · 第 {n} 级', 'fund.give':'捐建 · {n} 金币', 'fund.confirm':'确认捐出 {n} 金币', 'fund.short':'还差 {n} 金币',
  'fund.rank.0':'新芽园丁', 'fund.rank.1':'熟手园丁', 'fund.rank.2':'花艺师', 'fund.rank.3':'园林主理', 'fund.rank.4':'花园赞助人', 'fund.rank.5':'传奇园主',
  'fund.rules':'把多余的金币捐给花园基金。每一级比上一级贵 15%，没有上限。每升一级得 1 条绶带，每逢第五级再得一枚幸运符，每五级换一个头衔。基金不返还金币，传承后也会保留。',
})
Object.assign(en, {
  'fund.title':'Garden fund', 'fund.level':'{rank} · level {n}', 'fund.give':'Contribute · {n} coins', 'fund.confirm':'Confirm giving {n} coins', 'fund.short':'{n} coins short',
  'fund.rank.0':'Seedling gardener', 'fund.rank.1':'Seasoned gardener', 'fund.rank.2':'Florist', 'fund.rank.3':'Head gardener', 'fund.rank.4':'Garden patron', 'fund.rank.5':'Legendary keeper',
  'fund.rules':'Give spare coins to the garden fund. Each level costs 15% more than the last, with no cap. A level pays 1 ribbon, every fifth level adds a lucky charm, and every five levels bring a new title. The fund never pays coins back, and it survives a legacy restart.',
})

function FundBoard({ state, t, onChange }) {
  const [armed, setArmed] = React.useState(false)
  const level = fundLevel(state), cost = fundCost(level)
  return h('section', { className: 'fg-section fg-fund', id: 'fg-fund' },
    h('div', { className: 'fg-sectionHead' },
      h('h3', { className: 'fg-sectionTitle' }, t('fund.title')),
      h('span', { className: 'fg-questChip', 'data-tone': 'gold' }, t('fund.level', { rank: t(`fund.rank.${fundRank(level)}`), n: level })),
      h(InfoTip, { t, lines: [t('fund.rules')] })),
    h('div', { className: 'fg-tripRow' },
      h('progress', { max: 5, value: level % 5, 'aria-label': t('fund.title') }),
      h('button', { type: 'button', className: armed ? 'fg-btn fg-btnDanger' : 'fg-btn fg-btnPrimary', 'data-action': 'fund', disabled: state.coins < cost,
        onClick: () => {
          if (!armed) { setArmed(true); return }
          setArmed(false); tick()
          const next = donateFund(getState())
          if (next !== null) onChange(next)
        } }, t(armed ? 'fund.confirm' : 'fund.give', { n: cost })),
      state.coins < cost ? h('span', { className: 'fg-note' }, t('fund.short', { n: cost - state.coins })) : null))
}

// Workshop, collection pages, weekly bouquet contest and legacy restart.
Object.assign(zh, {
  'work.title':'花坊', 'work.bench':'加一个工位 · {n} 金币', 'work.benches':'工位 {n}/{max}', 'work.none':'先添置一个工位，才能加工花材。',
  'work.dried':'干花', 'work.tea':'花茶', 'work.perfume':'香水', 'work.recipe':'{name} · {count} 朵 · {time} · 工费 {fee}', 'work.pick':'再选 {n} 朵花', 'work.start':'开工 · 成品值 {n}',
  'work.busy':'{name} · 还要 {time}', 'work.claim':'取走{name} · +{n}', 'work.count':'已加工 {n} 件',
  'work.rules':'工位要花金币添置，最多三个。干花用 1 朵、花茶 3 朵、香水 5 朵，按花的原价计算，不受同种花跌价影响，成品分别值原价的 90%、100%、110%，另收工费并需要等待。跌价的花拿来加工最划算。',
  'page.title':'卡册', 'page.scene':'{scene}花卡', 'page.rarity':'五种稀有度', 'page.traits':'四种奇珍', 'page.claim':'领取 · {reward}', 'page.done':'已集齐',
  'page.rules':'卡册看的是收藏册里的花卡。每块花地集齐四个不同品种、五种稀有度各一张、四种不同奇珍，各有一次奖励。花卡取下后进度会掉，但已领的奖励不收回。',
  'contest.title':'每周花束赛', 'contest.enter':'送这张参赛 · {n} 金币', 'contest.score':'{n} 分', 'contest.rank':'本周第 {n} 名 · {score} 分', 'contest.need':'先插一束花，才有花束卡可以参赛。', 'contest.wins':'夺冠 {n} 次',
  'contest.rival.iris':'鸢尾夫人', 'contest.rival.moss':'苔先生', 'contest.rival.wren':'鹪鹩小姐', 'contest.you':'你',
  'contest.rules':'每周可以送一张花束卡参赛，报名费 100 金币。得分 = 星级 ×10 + 花朵数，花瓶相配再 +5。和三位对手比：第一名得 300 金币和 3 条绶带，第二名 2 条，第三名 1 条。对手每周换一次状态。',
  'legacy.title':'花园传承', 'legacy.need':'等级达到 {n} 并解锁全部花地后开启', 'legacy.go':'开启新一代花园', 'legacy.confirm':'再点一次确认：金币、等级、花圃都会重置', 'legacy.count':'第 {n} 代', 'legacy.done':'新一代花园开始了',
  'legacy.rules':'重新开始：金币、等级、花圃、花篮、道具和已解锁的花地都会重置。留下的有：收藏册、花瓶、展示架、图鉴、访客好感、育种记录，以及最多三粒杂交种子。每传一代，起始金币多 100，仙品率永久 +1%，最多 +5%。',
})
Object.assign(en, {
  'work.title':'Workshop', 'work.bench':'Add a bench · {n} coins', 'work.benches':'Benches {n}/{max}', 'work.none':'Add a bench first to process flowers.',
  'work.dried':'Dried flowers', 'work.tea':'Flower tea', 'work.perfume':'Perfume', 'work.recipe':'{name} · {count} blooms · {time} · fee {fee}', 'work.pick':'Pick {n} more', 'work.start':'Start · worth {n}',
  'work.busy':'{name} · {time} to go', 'work.claim':'Collect {name} · +{n}', 'work.count':'{n} made so far',
  'work.rules':'Benches cost coins, up to three. Dried flowers take 1 bloom, tea 3, perfume 5, priced at list value whatever the market slump, and come out worth 90%, 100% and 110% of it, for a fee and a wait. Slumped flowers are the best ones to process.',
  'page.title':'Card pages', 'page.scene':'{scene} cards', 'page.rarity':'Five rarities', 'page.traits':'Four curiosities', 'page.claim':'Collect · {reward}', 'page.done':'Complete',
  'page.rules':'Pages count the flower cards in your album. Four different species from one ground, one card of each of the five rarities, and four different curiosities each pay once. Taking a card down lowers the progress but never takes a reward back.',
  'contest.title':'Weekly bouquet contest', 'contest.enter':'Enter this card · {n} coins', 'contest.score':'{n} pts', 'contest.rank':'Rank {n} this week · {score} pts', 'contest.need':'Arrange a bouquet first to have a card to enter.', 'contest.wins':'{n} wins',
  'contest.rival.iris':'Lady Iris', 'contest.rival.moss':'Mr Moss', 'contest.rival.wren':'Miss Wren', 'contest.you':'You',
  'contest.rules':'Enter one bouquet card a week for 100 coins. Score = stars ×10 + number of flowers, plus 5 when the vase suits them. Against three rivals: first place wins 300 coins and 3 ribbons, second 2 ribbons, third 1. The rivals change form every week.',
  'legacy.title':'Garden legacy', 'legacy.need':'Opens at level {n} with every ground unlocked', 'legacy.go':'Begin a new generation', 'legacy.confirm':'Click again to confirm: coins, level and plots all reset', 'legacy.count':'Generation {n}', 'legacy.done':'A new generation of the garden begins',
  'legacy.rules':'Start over: coins, level, plots, basket, supplies and opened grounds reset. You keep the album, vases, shelf, flower book, visitor bonds, breeding records and up to three hybrid seeds. Each generation adds 100 starting coins and 1% spirit chance for good, up to 5%.',
})

function Workshop({ state, t, clock, onChange }) {
  const [recipeId, setRecipe] = React.useState('dried')
  const [picked, setPicked] = React.useState([])
  const recipe = RECIPES.find(entry => entry.id === recipeId)
  const benches = benchCount(state), jobs = state.workshop?.jobs ?? []
  const chosen = picked.filter(item => state.basket.includes(item)).slice(0, recipe.count)
  const entries = bagEntries(state, t).filter(entry => entry.kind === 'bloom')
    .map(entry => ({ ...entry, free: entry.items.filter(item => !chosen.includes(item)) }))
    .map(entry => ({ ...entry, count: entry.free.length })).filter(entry => entry.count > 0)
  const apply = transition => { tick(); const next = transition(getState(), Date.now()); if (next !== null) onChange(next) }
  const worth = Math.round(chosen.reduce((sum, item) => sum + itemValue(item), 0) * recipe.mult)
  return h('section', { className: 'fg-section fg-work', id: 'fg-work' },
    h('div', { className: 'fg-sectionHead' },
      h('h3', { className: 'fg-sectionTitle' }, t('work.title')),
      h('span', { className: 'fg-sectionMeta' }, t('work.benches', { n: benches, max: BENCH_PRICES.length })),
      (state.crafted ?? 0) > 0 ? h('span', { className: 'fg-sectionMeta' }, t('work.count', { n: state.crafted })) : null,
      benches < BENCH_PRICES.length ? h('button', { type: 'button', className: 'fg-btn fg-btnSmall', 'data-action': 'benchBuy', disabled: state.coins < BENCH_PRICES[benches], onClick: () => apply(buyBench) }, t('work.bench', { n: BENCH_PRICES[benches] })) : null,
      h(InfoTip, { t, lines: [t('work.rules')] })),
    h(GoodsShelf, { state, t, clock, onChange }),
    benches === 0 ? h('p', { className: 'fg-empty' }, t('work.none')) : null,
    jobs.map((job, index) => h('div', { key: index, className: 'fg-tripRow', 'data-job': job.recipe },
      h('progress', { max: job.end - job.start, value: Math.max(0, Math.min(job.end - job.start, clock - job.start)), 'aria-label': t(`work.${job.recipe}`) }),
      clock >= job.end
        ? h(React.Fragment, null, h('strong', null, t(`work.${job.recipe}`)), h('button', { type: 'button', className: 'fg-btn fg-btnPrimary', 'data-action': 'jobKeep', onClick: () => apply((current, now) => claimJob(current, index, now, true)) }, t('goods.keep', { name: t(`item.${job.recipe}`) })), h('button', { type: 'button', className: 'fg-btn', 'data-action': 'jobClaim', onClick: () => apply((current, now) => claimJob(current, index, now)) }, t('goods.sell', { n: job.coins })))
        : h('span', { className: 'fg-note' }, t('work.busy', { name: t(`work.${job.recipe}`), time: formatDuration(job.end - clock, t) })),
      clock < job.end ? h('button', { type: 'button', className: 'fg-btn fg-btnSmall', 'data-action': 'jobRush', disabled: (state.ribbons ?? 0) < RUSH_RIBBONS, onClick: () => apply((current, now) => rushJob(current, index, now)) }, t('rush.go')) : null)),
    jobs.length < benches ? h('div', { className: 'fg-workNew' },
      h('div', { className: 'fg-bagFilters', role: 'group', 'aria-label': t('work.title') }, RECIPES.map(entry =>
        h('button', { key: entry.id, type: 'button', className: 'fg-bagFilter', 'data-recipe': entry.id, 'aria-pressed': entry.id === recipeId ? 'true' : 'false', onClick: () => { setRecipe(entry.id); setPicked([]) } },
          t('work.recipe', { name: t(`work.${entry.id}`), count: entry.count, time: formatDuration(entry.ms, t), fee: entry.fee })))),
      h(BagGrid, { entries, onSelect: key => { const entry = entries.find(candidate => candidate.key === key); if (entry && chosen.length < recipe.count) setPicked([...chosen, entry.free[0]]) } }),
      h('button', { type: 'button', className: 'fg-btn fg-btnPrimary', 'data-action': 'jobStart', disabled: chosen.length < recipe.count || state.coins < recipe.fee,
        onClick: () => { apply((current, now) => { const indices = chosen.map(item => current.basket.indexOf(item)); return indices.includes(-1) ? null : startJob(current, recipe.id, indices, now) }); setPicked([]) } },
      chosen.length < recipe.count ? t('work.pick', { n: recipe.count - chosen.length }) : t('work.start', { n: worth }))) : null)
}

function CardPages({ state, t, onChange }) {
  return h('div', { className: 'fg-pages', id: 'fg-pages' },
    h('div', { className: 'fg-sectionHead' }, h('strong', null, t('page.title')), h(InfoTip, { t, lines: [t('page.rules')] })),
    h('div', { className: 'fg-goalGrid' }, PAGES.map(page => {
      const progress = pageProgress(state, page)
      const name = page.kind === 'scene' ? t('page.scene', { scene: t(`scene.${page.scene}`) }) : t(`page.${page.kind}`)
      return h('article', { key: page.id, className: 'fg-goal', 'data-page': page.id, 'data-done': progress.done ? 'true' : 'false' },
        h('strong', null, progress.done ? '✓ ' : '', name),
        h('progress', { max: page.need, value: progress.count, 'aria-label': name }),
        progress.done ? h('span', { className: 'fg-questChip', 'data-tone': 'gold' }, t('page.done'))
          : progress.count >= page.need
            ? h('button', { type: 'button', className: 'fg-btn fg-btnSmall fg-btnPrimary', 'data-action': 'pageClaim', onClick: () => { tick(); const next = claimPage(getState(), page.id); if (next !== null) onChange(next) } }, t('page.claim', { reward: rewardText(page.reward, t) }))
            : h('span', { className: 'fg-note' }, `${progress.count}/${page.need} · ${rewardText(page.reward, t)}`))
    })))
}

function Contest({ state, t, clock, onChange }) {
  const week = contestWeek(clock)
  const entered = state.contest?.week === week ? state.contest : null
  const cards = (state.bouquets ?? []).slice().reverse()
  const [pick, setPick] = React.useState(null)
  const card = cards.find(entry => entry.id === pick) ?? cards[0]
  const board = [...contestRivals(week).map(rival => ({ name: t(`contest.rival.${rival.id}`), score: rival.score })),
    ...(entered ? [{ name: t('contest.you'), score: entered.score, you: true }] : [])].sort((a, b) => b.score - a.score || (b.you ? 1 : 0) - (a.you ? 1 : 0))
  return h('section', { className: 'fg-section fg-contest', id: 'fg-contest' },
    h('div', { className: 'fg-sectionHead' },
      h('h3', { className: 'fg-sectionTitle' }, t('contest.title')),
      (state.contestWins ?? 0) > 0 ? h('span', { className: 'fg-sectionMeta' }, t('contest.wins', { n: state.contestWins })) : null,
      h(InfoTip, { t, lines: [t('contest.rules')] })),
    h('div', { className: 'fg-ecoTargets' }, board.map((row, index) =>
      h('span', { key: index, className: 'fg-questChip', 'data-tone': row.you ? 'gold' : undefined }, `${index + 1}. ${row.name} · ${t('contest.score', { n: row.score })}`))),
    entered ? h('p', { className: 'fg-sectionOk' }, t('contest.rank', { n: entered.rank, score: entered.score }))
      : cards.length === 0 ? h('p', { className: 'fg-empty' }, t('contest.need'))
        : h('div', { className: 'fg-tripRow' },
          h('select', { className: 'fg-btn', value: card.id, 'aria-label': t('contest.title'), onChange: event => setPick(Number(event.target.value)) },
            cards.map(entry => h('option', { key: entry.id, value: entry.id }, `${entry.title || '#' + entry.id} · ${'★'.repeat(entry.stars)} · ${t('contest.score', { n: bouquetScore(entry) })}`))),
          h('button', { type: 'button', className: 'fg-btn fg-btnPrimary', 'data-action': 'contestEnter', disabled: state.coins < CONTEST_FEE,
            onClick: () => { tick(); const next = enterContest(getState(), card.id, Date.now()); if (next !== null) onChange(next) } }, t('contest.enter', { n: CONTEST_FEE }))))
}

function LegacyBoard({ state, t, onStart }) {
  const [armed, setArmed] = React.useState(false)
  const ready = legacyReady(state)
  return h('section', { className: 'fg-section fg-legacy', id: 'fg-legacy' },
    h('div', { className: 'fg-sectionHead' },
      h('h2', { className: 'fg-sectionTitle' }, t('legacy.title')),
      (state.legacy ?? 0) > 0 ? h('span', { className: 'fg-questChip', 'data-tone': 'gold' }, t('legacy.count', { n: state.legacy + 1 })) : null,
      h(InfoTip, { t, lines: [t('legacy.rules')] })),
    ready
      ? h('button', { type: 'button', className: armed ? 'fg-btn fg-btnDanger' : 'fg-btn', 'data-action': 'legacy', onClick: () => { if (!armed) { setArmed(true); return } setArmed(false); onStart() } }, t(armed ? 'legacy.confirm' : 'legacy.go'))
      : h('p', { className: 'fg-note' }, t('legacy.need', { n: LEGACY_LEVEL })))
}

// Buying vases, the display shelf, naming bouquet cards and saving a card as a picture.
Object.assign(zh, {
  'vase.buy':'{name} · {n} 金币', 'vase.buyConfirm':'确认购买 · {n} 金币', 'vase.bought':'买下了{name}', 'vase.matched':'花瓶相配 · +5%',
  'vase.like.wide':'偏爱花幅宽的花', 'vase.like.high':'偏爱高株', 'vase.like.mixed':'偏爱四种以上混搭', 'vase.like.white':'偏爱素白的花', 'vase.like.rare':'偏爱杂交、奇珍和仙品',
  'shelf.title':'展示架', 'shelf.buy':'加一格 · {n} 金币', 'shelf.full':'展示架已满格', 'shelf.put':'摆上展示架', 'shelf.take':'从展示架取下', 'shelf.empty':'空位',
  'shelf.fx.sale':'卖价 +{n}%', 'shelf.fx.spirit':'仙品率 +{n}%', 'shelf.fx.hybrid':'杂交率 +{n}%', 'shelf.fx.visitor':'访客率 +{n}%',
  'shelf.rules':'花金币添置格子，最多五格。把收藏册里的卡摆上来才有加成：花束卡每星卖价 +1%，仙品花卡仙品率 +1%，杂交或奇珍花卡杂交率 +2%，其他花卡访客率 +1%。取下卡片加成就消失。',
  'keep.save':'存成图片', 'keep.name':'起名题字', 'keep.titlePh':'花束的名字', 'keep.notePh':'写一句话', 'keep.done':'写好了', 'keep.saved':'图片已保存',
})
Object.assign(en, {
  'vase.buy':'{name} · {n} coins', 'vase.buyConfirm':'Confirm · {n} coins', 'vase.bought':'Bought the {name}', 'vase.matched':'Vase suits the flowers · +5%',
  'vase.like.wide':'Likes wide blooms', 'vase.like.high':'Likes tall plants', 'vase.like.mixed':'Likes four or more kinds', 'vase.like.white':'Likes white flowers', 'vase.like.rare':'Likes hybrids, curiosities and spirit blooms',
  'shelf.title':'Display shelf', 'shelf.buy':'Add a slot · {n} coins', 'shelf.full':'The shelf is complete', 'shelf.put':'Put on the shelf', 'shelf.take':'Take off the shelf', 'shelf.empty':'Empty',
  'shelf.fx.sale':'Sale price +{n}%', 'shelf.fx.spirit':'Spirit chance +{n}%', 'shelf.fx.hybrid':'Hybrid chance +{n}%', 'shelf.fx.visitor':'Visitor chance +{n}%',
  'shelf.rules':'Buy slots with coins, up to five. Only cards placed here give a bonus: a bouquet card adds 1% sale price per star, a spirit flower card 1% spirit chance, a hybrid or curiosity card 2% hybrid chance, any other flower card 1% visitor chance. Take a card down and its bonus goes.',
  'keep.save':'Save as a picture', 'keep.name':'Name and inscribe', 'keep.titlePh':'Name of the bouquet', 'keep.notePh':'Write a line', 'keep.done':'Done', 'keep.saved':'Picture saved',
})

function fxText(effect, t) {
  return t(`shelf.fx.${effect.type}`, { n: Math.round(effect.amount * 100) })
}

/** Vases as labelled cards: owned ones are chosen, earned ones show a price, the rest say what unlocks them. */
function VaseShelf({ state, t, vase, onPick, onChange }) {
  const [armed, setArmed] = React.useState(null)
  const like = VASE_LIKES[vase]
  const paint = color => { const next = setVaseTint(getState(), vase, color); if (next !== null) onChange(next) }
  return h('div', { className: 'fg-vaseShelf' },
    h('div', { className: 'fg-vasePicker', role: 'group', 'aria-label': t('vase.pick') }, VASES.map(entry => {
      const owned = vaseOwned(state, entry.id), earned = vaseUnlocked(state, entry.id), price = VASE_PRICE[entry.id]
      const need = entry.stars !== undefined ? t('vase.needStars') : t('vase.need', { n: Math.max(0, entry.need - (state.arranged ?? 0)) })
      const likes = VASE_LIKES[entry.id] ? ` · ${t(`vase.like.${VASE_LIKES[entry.id]}`)}` : ''
      const label = owned ? t(`vase.${entry.id}`) + likes
        : earned ? t(armed === entry.id ? 'vase.buyConfirm' : 'vase.buy', { name: t(`vase.${entry.id}`), n: price }) + likes : `${t(`vase.${entry.id}`)} · ${need}`
      return h('button', {
        key: entry.id, type: 'button', className: 'fg-vaseChoice', 'data-vase': entry.id, 'data-earned': earned ? 'true' : 'false', 'data-owned': owned ? 'true' : 'false',
        'data-armed': armed === entry.id ? 'true' : undefined, 'aria-pressed': vase === entry.id ? 'true' : 'false',
        disabled: !earned || (!owned && state.coins < price), title: label, 'aria-label': label,
        onClick: () => {
          if (owned) { onPick(entry.id); return }
          if (armed !== entry.id) { setArmed(entry.id); return }
          setArmed(null); tick()
          const next = buyVase(getState(), entry.id)
          if (next !== null) { onChange(next); onPick(entry.id) }
        },
      },
      h(VaseArt, { id: entry.id, tint: vaseTint(state, entry.id) }),
      h('span', { className: 'fg-vaseName' }, t(`vase.${entry.id}`)),
      h('span', { className: 'fg-vaseState' }, owned ? t(vase === entry.id ? 'vase.using' : 'vase.owned')
        : !earned ? `🔒 ${need}` : armed === entry.id ? t('vase.again') : [CoinGlyph(), h('span', { key: 'p', className: 'fg-vasePrice' }, String(price))]))
    })),
    h('p', { className: 'fg-vaseHint' }, h('strong', null, t(`vase.${vase}`)), '：', like ? `${t(`vase.like.${like}`)}，${t('vase.bonus')}` : t('vase.like.none')),
    h('div', { className: 'fg-vaseTints', role: 'group', 'aria-label': t('vase.tint') },
      h('span', { className: 'fg-note' }, t('vase.tint')),
      VASE_SWATCHES.map(color => h('button', { key: color, type: 'button', className: 'fg-vaseTint', 'data-tint': color, 'aria-pressed': vaseTint(state, vase) === color ? 'true' : 'false', style: { background: color }, title: color, 'aria-label': `${t('vase.tint')} ${color}`, onClick: () => paint(color) })),
      h('input', { type: 'color', className: 'fg-vaseTintPick', value: vaseTint(state, vase) ?? VASE_LOOKS[vase].base, title: t('vase.tintCustom'), 'aria-label': t('vase.tintCustom'), onChange: event => paint(event.target.value) }),
      vaseTint(state, vase) ? h('button', { type: 'button', className: 'fg-btn fg-btnSmall fg-btnGhost', 'data-action': 'vaseTintReset', onClick: () => paint(null) }, t('vase.tintReset')) : null),
    h('p', { className: 'fg-vaseHint' }, t('vase.how')))
}

function Shelf({ state, t, onChange, compact = false }) {
  const shown = shelfCards(state), slots = shelfSlots(state)
  if (compact && shown.length === 0) return null
  const thumbs = shown.map(ref => h('span', { key: `${ref.kind}-${ref.id}`, className: 'fg-shelfCard', 'data-shelf': `${ref.kind}-${ref.id}`, title: fxText(shelfEffect(ref), t) },
    ref.kind === 'bouquets'
      ? h('span', { className: 'fg-shelfStars' }, '★'.repeat(ref.card.stars))
      : h(FlowerArt, { speciesId: ref.card.item.species, stage: 'bloom', variant: ref.card.item.variant, dna: ref.card.item.dna, trait: ref.card.item.trait, tint: ref.card.item.tint }),
    h('span', { className: 'fg-shelfFx' }, fxText(shelfEffect(ref), t))))
  if (compact) return h('div', { className: 'fg-shelf fg-shelfCompact', 'aria-label': t('shelf.title') }, thumbs)
  return h('div', { className: 'fg-shelf', id: 'fg-shelf' },
    h('strong', null, t('shelf.title')),
    thumbs,
    Array.from({ length: slots - shown.length }, (_, index) => h('span', { key: `e${index}`, className: 'fg-shelfCard fg-shelfEmpty' }, t('shelf.empty'))),
    slots < SHELF_PRICES.length
      ? h('button', { type: 'button', className: 'fg-btn fg-btnSmall', 'data-action': 'shelfBuy', disabled: state.coins < SHELF_PRICES[slots], onClick: () => { tick(); const next = buyShelfSlot(getState()); if (next !== null) onChange(next) } }, t('shelf.buy', { n: SHELF_PRICES[slots] }))
      : h('span', { className: 'fg-note' }, t('shelf.full')),
    h(InfoTip, { t, lines: [t('shelf.rules')] }))
}

function xmlText(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** A standalone SVG picture of one album card, built from the drawings already on the page. */
function cardSvg(node, lines) {
  const serial = new XMLSerializer()
  const place = (svg, x, y, w, hgt) => {
    const copy = svg.cloneNode(true)
    copy.removeAttribute('class'); copy.removeAttribute('style')
    for (const [name, value] of [['x', x], ['y', y], ['width', w], ['height', hgt]]) copy.setAttribute(name, String(value))
    return serial.serializeToString(copy)
  }
  const flowers = [...node.querySelectorAll('svg.fg-flowerLiving')]
  const vase = node.querySelector('svg.fg-vaseArt')
  const parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="600" height="760" viewBox="0 0 600 760">',
    '<rect width="600" height="760" rx="36" fill="#fffdf6"/><rect x="14" y="14" width="572" height="732" rx="26" fill="none" stroke="#d4af37" stroke-width="4"/>']
  if (vase) {
    flowers.forEach((svg, index) => {
      const angle = flowers.length === 1 ? 0 : -34 + (68 * index) / (flowers.length - 1)
      parts.push(`<g transform="rotate(${angle} 300 440)">${place(svg, 180, 130 + Math.round(Math.abs(angle) * 0.8), 240, 310)}</g>`)
    })
    parts.push(place(vase, 196, 392, 208, 198))
  } else if (flowers[0]) parts.push(place(flowers[0], 90, 70, 420, 420))
  lines.filter(Boolean).slice(0, 3).forEach((line, index) => parts.push(
    `<text x="300" y="${index === 0 ? 650 : 650 + index * 38}" text-anchor="middle" font-family="Georgia, 'Songti SC', serif" font-size="${index === 0 ? 36 : 22}" fill="${index === 0 ? '#2a2a22' : '#6b6a5c'}">${xmlText(line)}</text>`))
  parts.push('</svg>')
  return parts.join('')
}

/** Download the card as a PNG, or as the SVG itself where the browser cannot rasterise it. */
function saveCard(node, lines, name) {
  const svg = cardSvg(node, lines)
  const download = (blob, ext) => {
    const url = URL.createObjectURL(blob), anchor = document.createElement('a')
    anchor.href = url; anchor.download = `${name}.${ext}`
    document.body.appendChild(anchor); anchor.click(); anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const plain = () => download(new Blob([svg], { type: 'image/svg+xml' }), 'svg')
  try {
    const image = new Image()
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 1200; canvas.height = 1520
        canvas.getContext('2d').drawImage(image, 0, 0, 1200, 1520)
        canvas.toBlob(blob => (blob ? download(blob, 'png') : plain()), 'image/png')
      } catch (error) { plain() }
    }
    image.onerror = plain
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  } catch (error) { plain() }
}

/** The little buttons on an album card: save picture, shelf, and for bouquets a name and a line. */
function CardTools({ state, t, kind, card, onChange }) {
  const [editing, setEditing] = React.useState(false)
  const [greeting, setGreeting] = React.useState(false)
  const [title, setTitle] = React.useState(card.title ?? ''), [note, setNote] = React.useState(card.note ?? '')
  const pin = useSyncExternalStore(subscribeBouquetPins, () => bouquetPins.get(card.id) ?? noBouquetPin, () => noBouquetPin)
  React.useEffect(() => () => { if (kind === 'bouquets') cancelArtOpen(card.id) }, [kind, card.id])
  const pinLabel = t(pin.phase === 'preparing' ? 'desktop.cancelWait' : pin.phase === 'pending' ? 'desktop.working' : pin.phase === 'open' ? 'desktop.unpinBouquet' : 'desktop.pinBouquet')
  const onShelf = shelfCards(state).some(ref => ref.kind === kind && ref.id === card.id)
  const room = shelfCards(state).length < shelfSlots(state)
  const apply = transition => { tick(); const next = transition(getState()); if (next !== null) onChange(next) }
  const lines = kind === 'bouquets'
    ? [card.title || t('arrange.title'), card.note || `${'★'.repeat(card.stars)} · ${t(`vase.${card.vase}`)}`, new Date(card.at).toLocaleDateString()]
    : [bloomName(card.item, t), t(`bag.rarity.${rarityOf(card.item)}`), new Date(card.at).toLocaleDateString()]
  return h('div', { className: 'fg-cardTools' },
    h('div', { className: 'fg-cardToolRow' },
      h('button', { type: 'button', className: 'fg-cardTool', 'data-action': 'cardSave', title: t('keep.save'), 'aria-label': t('keep.save'), onClick: event => saveCard(event.currentTarget.closest('.fg-keepCard'), lines, `flower-garden-card-${card.id}`) }, '⬇'),
      onShelf || room ? h('button', { type: 'button', className: 'fg-cardTool', 'data-action': 'cardShelf', 'aria-pressed': onShelf ? 'true' : 'false', title: t(onShelf ? 'shelf.take' : 'shelf.put'), 'aria-label': t(onShelf ? 'shelf.take' : 'shelf.put'), onClick: () => apply(current => toggleShelf(current, kind, card.id)) }, '📌') : null,
      kind === 'bouquets' ? h('button', { type:'button', className:'fg-btn fg-btnSmall', 'data-action':'cardPinDesktop', disabled:pin.phase==='pending', 'aria-pressed':pin.phase==='open', onClick:event=>toggleBouquetPin(card,event.currentTarget.closest('.fg-keepCard'),t) }, pinLabel) : null,
      kind === 'bouquets' ? h('button', { type: 'button', className: 'fg-cardTool', 'data-action': 'cardGreet', 'aria-pressed': greeting ? 'true' : 'false', title: t('greet.open'), 'aria-label': t('greet.open'), onClick: () => setGreeting(!greeting) }, '💌') : null,
      kind === 'bouquets' ? h('button', { type: 'button', className: 'fg-cardTool', 'data-action': 'cardName', 'aria-pressed': editing ? 'true' : 'false', title: t('keep.name'), 'aria-label': t('keep.name'), onClick: () => setEditing(!editing) }, '✎') : null),
    kind === 'bouquets' && (pin.status || pin.error) ? h('p', {className:'fg-note', role:'status'}, t(pin.status || pin.error)) : null,
    greeting ? h(GreetingEditor, { t, card }) : null,
    editing ? h('div', { className: 'fg-cardEdit' },
      h('input', { type: 'text', maxLength: 20, value: title, placeholder: t('keep.titlePh'), 'aria-label': t('keep.titlePh'), onChange: event => setTitle(event.target.value) }),
      h('input', { type: 'text', maxLength: 60, value: note, placeholder: t('keep.notePh'), 'aria-label': t('keep.notePh'), onChange: event => setNote(event.target.value) }),
      h('button', { type: 'button', className: 'fg-btn fg-btnSmall fg-btnPrimary', 'data-action': 'cardNameSave', onClick: () => { apply(current => nameBouquet(current, card.id, title, note)); setEditing(false) } }, t('keep.done')))
      : kind === 'bouquets' && (card.title || card.note) ? h('div', { className: 'fg-cardInscription' }, card.title ? h('strong', null, card.title) : null, card.note ? h('span', null, card.note) : null) : null)
}

Object.assign(zh, {
  'vase.owned':'已拥有', 'vase.using':'使用中', 'vase.again':'再点一次购买', 'vase.bonus':'半数以上相配时花束多卖 5%', 'vase.like.none':'什么花都能插，没有额外加成',
  'vase.how':'花瓶先靠插花数量解锁，再用金币买下；带锁的写着还差多少。',
})
Object.assign(en, {
  'vase.owned':'Owned', 'vase.using':'In use', 'vase.again':'Click again to buy', 'vase.bonus':'bouquets sell 5% higher when half or more fit', 'vase.like.none':'takes any flower, with no extra bonus',
  'vase.how':'A vase is unlocked by arranging bouquets, then bought with coins; locked ones say what is still needed.',
})

Object.assign(zh, { 'vase.tint':'花瓶颜色', 'vase.tintCustom':'自己调一个颜色', 'vase.tintReset':'恢复原色' })
Object.assign(en, { 'vase.tint':'Vase colour', 'vase.tintCustom':'Mix your own colour', 'vase.tintReset':'Original glaze' })

// Season chip, vases, keepsake album and seed expeditions.
Object.assign(zh, {
  'season.now':'{season} · 当季花 {n} 种 · 仙品率 +1%', 'season.night':'夜花 {n} 种 +1%',
  'vase.pick':'选花瓶', 'vase.classic':'青瓷瓶', 'vase.round':'圆肚瓶', 'vase.tall':'长颈瓶', 'vase.basket':'藤编篮', 'vase.moon':'月亮罐', 'vase.gold':'鎏金瓶',
  'vase.need':'再插 {n} 束解锁', 'vase.needStars':'插出一束五星解锁',
  'album.title':'收藏册', 'album.bouquets':'花束卡 {n}/{max}', 'album.cards':'花卡 {n}/{max}', 'album.empty':'完成的花束会自动留下一张卡；在背包里选一朵花，可以做成花卡留念。',
  'album.keep':'做成花卡', 'album.kept':'已做成花卡，收进收藏册', 'album.full':'花卡册满了，先取下几张', 'album.remove':'取下这张卡', 'album.removeConfirm':'再点一次取下',
  'album.rules':'每完成一束花，收藏册里就多一张花束卡，记下花、花瓶、星级和日期，最多留 30 张，满了会挤掉最早的。花卡是把一朵花留下来而不是卖掉，保留它的花色、奇珍和基因，最多 60 张。花瓶靠插花数量解锁，鎏金瓶要插出一束五星。',
  'trip.title':'采种远行', 'trip.short':'1 小时', 'trip.day':'4 小时', 'trip.long':'8 小时', 'trip.go':'{time} · {n} 金币', 'trip.where':'去哪块花地',
  'trip.out':'小队在{scene}采种', 'trip.left':'还要 {n}', 'trip.claim':'迎接小队回来', 'trip.count':'已远行 {n} 次',
  'trip.rules':'派一支小队去已解锁的花地，关掉页面也照常走。时间越长带回的东西越多：金币、那块地的杂交种子、肥料、堆肥，偶尔有绶带或幸运符。带回什么在出发时就定了。一次只能派一支。',
})
Object.assign(en, {
  'season.now':'{season} · {n} flowers in season · spirit chance +1%', 'season.night':'{n} night flowers +1%',
  'vase.pick':'Choose a vase', 'vase.classic':'Celadon vase', 'vase.round':'Round vase', 'vase.tall':'Tall vase', 'vase.basket':'Wicker basket', 'vase.moon':'Moon jar', 'vase.gold':'Gilded vase',
  'vase.need':'{n} more bouquets to unlock', 'vase.needStars':'Make one five-star bouquet to unlock',
  'album.title':'Keepsake album', 'album.bouquets':'Bouquet cards {n}/{max}', 'album.cards':'Flower cards {n}/{max}', 'album.empty':'Every finished bouquet leaves a card here. Pick a flower in the backpack to keep it as a flower card.',
  'album.keep':'Keep as a card', 'album.kept':'Kept as a flower card in the album', 'album.full':'The flower cards are full; take a few down first', 'album.remove':'Take this card down', 'album.removeConfirm':'Click again to take it down',
  'album.rules':'Each finished bouquet adds a bouquet card with its flowers, vase, stars and date; the album keeps 30 and drops the oldest. A flower card keeps one bloom instead of selling it, with its colour, curiosity and genes; up to 60. Vases unlock as you arrange more bouquets, and the gilded vase needs one five-star bouquet.',
  'trip.title':'Seed expedition', 'trip.short':'1 hour', 'trip.day':'4 hours', 'trip.long':'8 hours', 'trip.go':'{time} · {n} coins', 'trip.where':'Which ground',
  'trip.out':'A party is collecting in the {scene}', 'trip.left':'{n} to go', 'trip.claim':'Welcome the party back', 'trip.count':'{n} expeditions so far',
  'trip.rules':'Send a party to an opened ground; it keeps going with the page closed. Longer trips bring back more: coins, hybrid seeds of that ground, fertiliser, compost, and now and then a ribbon or a charm. The haul is fixed when the party sets out. One party at a time.',
})

function SeasonChip({ t, clock, sceneId }) {
  const season = SEASONS[realSeason(clock)]
  const scene = SCENE_BY_ID.get(sceneId)
  const fresh = scene.species.filter(id => inSeason(id, clock))
  const night = scene.species.filter(id => nightBloom(id, clock))
  return h('span', { className: 'fg-seasonChip', 'data-season': season, title: [...fresh, ...night].map(id => t(`species.${id}`)).join(' / ') },
    { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' }[season], ' ',
    t('season.now', { season: t(`show.season.${season}`), n: fresh.length }),
    night.length > 0 ? ` · 🌙 ${t('season.night', { n: night.length })}` : null)
}

const VASE_LOOKS = {
  classic: { d: 'M30,8C30,14 14,20 14,36C14,54 24,66 28,70L52,70C56,66 66,54 66,36C66,20 50,14 50,8Z', ry0: 8, rx: 10, rr: 3, foot: 12, base: '#a9cdb8', light: '#e4f3ea', dark: '#6f9a84', line: '#5c8672', rim: '#c9e2d3', inside: '#4f6f60', shine: 'M22,28C19,38 21,50 27,60',
    deco: V => [h('path', { key: 'crackle', d: 'M22,30l6,8l-4,9M34,22l5,10l8,4l-3,10M50,26l-4,9M56,40l-6,8l4,9M30,52l8,4l6,-5', fill: 'none', stroke: V.dark, strokeWidth: .5, opacity: .4 }), h('path', { key: 'band', d: 'M29,14Q40,18 51,14', fill: 'none', stroke: V.dark, strokeWidth: .8, opacity: .6 })] },
  round: { d: 'M33,7C33,13 10,18 10,42C10,60 24,71 40,71C56,71 70,60 70,42C70,18 47,13 47,7Z', ry0: 7, rx: 7, rr: 2.4, foot: 10, base: '#f1f4f7', light: '#ffffff', dark: '#b9c4d0', line: '#8f9db0', rim: '#ffffff', inside: '#5a6678', shine: 'M19,30C15,40 17,54 25,63',
    deco: () => { const blue = '#2f55a8'; return [
      h('path', { key: 'bands', d: 'M10,28Q40,35 70,28M10,56Q40,64 70,56M30,13Q40,16 50,13', fill: 'none', stroke: blue, strokeWidth: 1.2 }),
      ...[0, 72, 144, 216, 288].map(a => h('ellipse', { key: `p${a}`, cx: 40, cy: 37.5, rx: 2.4, ry: 4.6, fill: blue, opacity: .85, transform: `rotate(${a} 40 43)` })),
      h('circle', { key: 'eye', cx: 40, cy: 43, r: 1.8, fill: '#f1f4f7', stroke: blue, strokeWidth: .8 }),
      h('path', { key: 'scroll', d: 'M18,46q6,-9 13,-2M62,46q-6,-9 -13,-2M22,40q4,7 10,4M58,40q-4,7 -10,4M16,38q3,-4 6,-1M64,38q-3,-4 -6,-1', fill: 'none', stroke: blue, strokeWidth: 1, strokeLinecap: 'round' })] } },
  tall: { d: 'M35,4L35,30C35,38 22,44 22,56C22,66 30,71 40,71C50,71 58,66 58,56C58,44 45,38 45,30L45,4Z', ry0: 4, rx: 5, rr: 1.8, foot: 9, base: '#7a5aa8', light: '#b9a0dc', dark: '#4a3470', line: '#3f2c60', rim: '#a48ad0', inside: '#2c1f44', shine: 'M38,8L38,28M28,50C27,58 31,65 35,67', shineW: 2,
    deco: V => [h('path', { key: 'rings', d: 'M34,11Q40,13 46,11M34,27Q40,29 46,27', fill: 'none', stroke: V.light, strokeWidth: .8, opacity: .7 }), h('ellipse', { key: 'pool', cx: 40, cy: 68, rx: 20, ry: 6, fill: '#000', opacity: .16 })] },
  basket: { d: 'M13,22L67,22L60,67Q40,73 20,67Z', ry0: 22, rx: 27, rr: 5, foot: 18, base: '#c79a5b', light: '#e6c48c', dark: '#8f6632', line: '#7a5526', rim: '#a87a3e', inside: '#5c3f1c',
    deco: V => { const out = []; for (let row = 0; row < 8; row += 1) for (let col = 0; col < 9; col += 1) { const x = 8 + col * 8 + (row % 2) * 4, y = 30 + row * 5.6; out.push(h('path', { key: `w${row}-${col}`, d: `M${x},${y}q3,-2.6 6,0`, fill: 'none', stroke: row % 2 ? V.dark : V.light, strokeWidth: 2.2, strokeLinecap: 'round', opacity: .8 })) } out.push(h('path', { key: 'ribs', d: 'M24,24L28,69M40,24L40,71M56,24L52,69', fill: 'none', stroke: V.line, strokeWidth: .7, opacity: .5 })); return out } },
  moon: { d: 'M32,8C14,12 8,26 8,40C8,58 22,71 40,71C58,71 72,58 72,40C72,26 66,12 48,8Z', ry0: 8, rx: 8, rr: 2.6, foot: 13, base: '#f4f1e8', light: '#ffffff', dark: '#cbc5b4', line: '#aaa390', rim: '#fffdf6', inside: '#6a6456', shine: 'M20,24C14,36 15,52 23,62', shineW: 4,
    deco: () => [h('path', { key: 'seam', d: 'M8,40Q40,45 72,40', fill: 'none', stroke: '#8a8472', strokeWidth: .6, opacity: .25 }), h('ellipse', { key: 'shade', cx: 44, cy: 64, rx: 30, ry: 11, fill: '#8f9db0', opacity: .14 })] },
  gold: { d: 'M33,6C33,12 26,14 22,22C16,34 20,52 30,62L28,70L52,70L50,62C60,52 64,34 58,22C54,14 47,12 47,6Z', ry0: 6, rx: 7, rr: 2.4, foot: 12, base: '#e2b93b', light: '#fff0b0', dark: '#9a7210', line: '#7a580a', rim: '#f6da7a', inside: '#5a4208', shine: 'M27,22C23,34 26,50 32,58', handles: 'M23,21C9,19 9,39 21,41M57,21C71,19 71,39 59,41',
    deco: V => [h('path', { key: 'bands', d: 'M18,27Q40,32 62,27M18,47Q40,53 62,47', fill: 'none', stroke: V.line, strokeWidth: 1 }),
      ...[0, 1, 2, 3, 4, 5, 6].map(i => i === 3 ? null : h('path', { key: `d${i}`, d: `M${21 + i * 6.3},38l2.4,-3.4l2.4,3.4l-2.4,3.4Z`, fill: V.light, stroke: V.line, strokeWidth: .5 })),
      h('ellipse', { key: 'gem', cx: 40, cy: 38, rx: 3.6, ry: 4.6, fill: '#b8243a', stroke: V.line, strokeWidth: .8 }), h('ellipse', { key: 'glint', cx: 38.8, cy: 36.4, rx: 1, ry: 1.4, fill: '#fff', opacity: .7 })] },
}

/** A vase with a rounded body: glaze gradient, an open mouth you can see into, a highlight and a cast shadow. */
function VaseArt({ id, tint }) {
  const raw = typeof React.useId === 'function' ? React.useId() : 'v'
  const own = VASE_LOOKS[id] ?? VASE_LOOKS.classic
  const paint = cleanTint(tint)
  const V = paint === null ? own : { ...own, base: paint, light: lighten(paint, 0.45), dark: darken(paint, 0.35), line: darken(paint, 0.55), rim: lighten(paint, 0.25), inside: darken(paint, 0.65) }
  const u = `fgv-${VASE_LOOKS[id] ? id : 'classic'}-${String(raw).replace(/[^a-zA-Z0-9_-]/g, '')}`
  return h('svg', { viewBox: '0 0 80 76', width: 80, height: 76, 'aria-hidden': 'true', focusable: 'false', className: 'fg-vaseArt' },
    h('defs', null,
      h('linearGradient', { id: `${u}-g`, x1: 0, y1: 0, x2: 1, y2: 0 },
        h('stop', { offset: '0%', stopColor: V.dark }), h('stop', { offset: '28%', stopColor: V.light }), h('stop', { offset: '58%', stopColor: V.base }), h('stop', { offset: '100%', stopColor: V.dark })),
      h('clipPath', { id: `${u}-c` }, h('path', { d: V.d }))),
    h('ellipse', { cx: 42, cy: 72.6, rx: V.foot + 8, ry: 2.6, fill: '#000', opacity: .16 }),
    V.handles ? h('path', { d: V.handles, fill: 'none', stroke: V.dark, strokeWidth: 2.6, strokeLinecap: 'round' }) : null,
    h('path', { d: V.d, fill: `url(#${u}-g)`, stroke: V.line, strokeWidth: 1.1, strokeLinejoin: 'round' }),
    h('g', { clipPath: `url(#${u}-c)` }, ...V.deco(V)),
    V.shine ? h('path', { d: V.shine, fill: 'none', stroke: '#fff', strokeWidth: V.shineW ?? 3, strokeLinecap: 'round', opacity: .5 }) : null,
    h('ellipse', { cx: 40, cy: V.ry0, rx: V.rx, ry: V.rr, fill: V.inside, stroke: V.rim, strokeWidth: 1.6 }),
    h('path', { d: `M${40 - V.foot},70.6H${40 + V.foot}`, stroke: V.line, strokeWidth: 1.8, strokeLinecap: 'round' }))
}

function stemTilt(index, count) {
  const angle = count === 1 ? 0 : -34 + (68 * index) / (count - 1)
  return `rotate(${angle}deg) translateY(${Math.round(Math.abs(angle) * 0.3)}px)`
}

/** A finished bouquet, drawn the way the arranging table shows it. */
function BouquetArt({ items, vase, tint }) {
  return h('div', { className: 'fg-vase fg-vaseStill' },
    items.map((item, index) => h('span', { key: index, className: 'fg-vaseStem', style: { transform: stemTilt(index, items.length) } },
      h(FlowerArt, { speciesId: item.species, stage: 'bloom', variant: item.variant, dna: item.dna, trait: item.trait, tint: item.tint }))),
    h('div', { className: 'fg-vasePot' }, h(VaseArt, { id: vase, tint })))
}

function VasePicker({ state, t, vase, onPick }) {
  return h('div', { className: 'fg-vasePicker', role: 'group', 'aria-label': t('vase.pick') }, VASES.map(entry => {
    const open = vaseUnlocked(state, entry.id)
    const need = entry.stars !== undefined ? t('vase.needStars') : t('vase.need', { n: Math.max(0, entry.need - (state.arranged ?? 0)) })
    return h('button', {
      key: entry.id, type: 'button', className: 'fg-vaseChoice', 'data-vase': entry.id, 'data-earned': open ? 'true' : 'false',
      'aria-pressed': vase === entry.id ? 'true' : 'false', disabled: !open,
      title: open ? t(`vase.${entry.id}`) : `${t(`vase.${entry.id}`)} · ${need}`, 'aria-label': open ? t(`vase.${entry.id}`) : `${t(`vase.${entry.id}`)} · ${need}`,
      onClick: () => onPick(entry.id),
    }, h(VaseArt, { id: entry.id }))
  }))
}

function Album({ state, t, onChange }) {
  const [armed, setArmed] = React.useState(null)
  const bouquets = (state.bouquets ?? []).slice().reverse()
  const cards = (state.cards ?? []).slice().reverse()
  function remove(kind, id) {
    const key = `${kind}:${id}`
    if (armed !== key) return
    setArmed(null)
    tick()
    const next = removeCard(getState(), kind, id)
    if (next !== null) onChange(next)
  }
  React.useEffect(() => {
    if (armed === null) return undefined
    const id = window.setTimeout(() => setArmed(null), 6000)
    return () => window.clearTimeout(id)
  }, [armed])
  const del = (kind, id) => {
    const on = armed === `${kind}:${id}`
    return h(React.Fragment, null,
      h('button', { type: 'button', className: 'fg-cardDel', 'data-armed': on ? 'true' : 'false', title: t('album.remove'), 'aria-label': t('album.remove'), onClick: () => setArmed(on ? null : `${kind}:${id}`) }, '×'),
      on ? h('div', { className: 'fg-cardWarn', role: 'alert' },
        h('strong', null, t('album.warnTitle')),
        h('span', null, t(kind === 'cards' ? 'album.warnFlower' : 'album.warnBouquet')),
        h('div', { className: 'fg-cardWarnActions' },
          h('button', { type: 'button', className: 'fg-btn fg-btnSmall', 'data-action': 'cardKeep', autoFocus: true, onClick: () => setArmed(null) }, t('album.keepIt')),
          h('button', { type: 'button', className: 'fg-btn fg-btnSmall fg-btnDanger', 'data-action': 'cardDelete', onClick: () => remove(kind, id) }, t('album.delete')))) : null)
  }
  const day = at => new Date(at).toLocaleDateString()
  return h('section', { className: 'fg-section fg-album', id: 'fg-album' },
    h('div', { className: 'fg-sectionHead' },
      h('h3', { className: 'fg-sectionTitle' }, t('album.title')),
      h('span', { className: 'fg-sectionMeta' }, t('album.bouquets', { n: bouquets.length, max: BOUQUET_CARD_CAP })),
      h('span', { className: 'fg-sectionMeta' }, t('album.cards', { n: cards.length, max: FLOWER_CARD_CAP })),
      h(InfoTip, { t, lines: [t('album.rules')] })),
    h(Shelf, { state, t, onChange }),
    h(CardPages, { state, t, onChange }),
    bouquets.length === 0 && cards.length === 0 ? h('p', { className: 'fg-empty' }, t('album.empty')) : null,
    bouquets.length > 0 ? h('div', { className: 'fg-cardGrid' }, bouquets.map(card =>
      h('article', { key: card.id, className: 'fg-keepCard', 'data-card': `bouquet-${card.id}`, 'data-stars': card.stars },
        del('bouquets', card.id),
        h('div', { className: 'fg-cardVase' }, h(BouquetArt, { items: card.items, vase: card.vase, tint: card.tint })),
        h('span', { className: 'fg-vaseStars', 'data-stars': card.stars }, '★'.repeat(card.stars) + '☆'.repeat(5 - card.stars)),
        h('span', { className: 'fg-note' }, t(`vase.${card.vase}`), ' · ', t(`arrange.theme.${card.theme}`)),
        h('time', { className: 'fg-note', dateTime: new Date(card.at).toISOString() }, day(card.at)),
        h(CardTools, { state, t, kind: 'bouquets', card, onChange })))) : null,
    cards.length > 0 ? h('div', { className: 'fg-cardGrid' }, cards.map(card =>
      h('article', { key: card.id, className: 'fg-keepCard fg-flowerCard', 'data-card': `flower-${card.id}`, 'data-rarity': rarityOf(card.item) },
        del('cards', card.id),
        h('div', { className: 'fg-cardFlower' }, h(FlowerArt, { speciesId: card.item.species, stage: 'bloom', variant: card.item.variant, dna: card.item.dna, trait: card.item.trait, tint: card.item.tint })),
        h('strong', null, bloomName(card.item, t)),
        h('span', { className: 'fg-rarityTag', 'data-rarity': rarityOf(card.item) }, t(`bag.rarity.${rarityOf(card.item)}`)),
        card.item.dna ? h(GeneBars, { dna: card.item.dna, t }) : null,
        h('time', { className: 'fg-note', dateTime: new Date(card.at).toISOString() }, day(card.at)),
        h(CardTools, { state, t, kind: 'cards', card, onChange })))) : null)
}

function ExpeditionBoard({ state, t, clock, onChange }) {
  const open = SCENES.filter(scene => (state.scenes[scene.id]?.unlocked ?? 0) > 0)
  const [choice, setChoice] = React.useState(state.scene)
  const sceneId = open.some(scene => scene.id === choice) ? choice : open[0].id
  const trip = state.expedition
  function run(transition) {
    tick()
    const next = transition(getState(), Date.now())
    if (next !== null) onChange(next)
  }
  return h('section', { className: 'fg-section fg-trip', id: 'fg-trip' },
    h('div', { className: 'fg-sectionHead' },
      h('h3', { className: 'fg-sectionTitle' }, t('trip.title')),
      (state.trips ?? 0) > 0 ? h('span', { className: 'fg-sectionMeta' }, t('trip.count', { n: state.trips })) : null,
      patronBonus(state) > 0 ? h('span', { className: 'fg-questChip' }, t('trip.patron', { n: state.patronage, bonus: patronBonus(state) })) : null,
      h(InfoTip, { t, lines: [t('trip.rules')] })),
    trip ? h('div', { className: 'fg-tripRow' },
      h('strong', null, '🧺 ', t('trip.out', { scene: t(`scene.${trip.scene}`) })),
      h('progress', { max: trip.end - trip.start, value: Math.max(0, Math.min(trip.end - trip.start, clock - trip.start)), 'aria-label': t('trip.title') }),
      clock >= trip.end
        ? h('button', { type: 'button', className: 'fg-btn fg-btnPrimary', 'data-action': 'tripClaim', onClick: () => run(claimExpedition) }, t('trip.claim'))
        : h('span', { className: 'fg-note' }, t('trip.left', { n: formatDuration(trip.end - clock, t) })),
      clock < trip.end ? h('button', { type: 'button', className: 'fg-btn fg-btnSmall', 'data-action': 'tripRush', disabled: (state.ribbons ?? 0) < RUSH_RIBBONS, onClick: () => run(rushExpedition) }, t('rush.go')) : null)
      : h('div', { className: 'fg-tripRow' },
        h('label', { className: 'fg-note' }, t('trip.where'), ' ',
          h('select', { className: 'fg-btn', value: sceneId, onChange: event => setChoice(event.target.value) }, open.map(scene => h('option', { key: scene.id, value: scene.id }, t(`scene.${scene.id}`))))),
        EXPEDITIONS.map(entry => h('button', {
          key: entry.id, type: 'button', className: 'fg-btn', 'data-expedition': entry.id, disabled: state.coins < entry.cost,
          onClick: () => run((current, now) => startExpedition(current, sceneId, entry.id, now)),
        }, t('trip.go', { time: t(`trip.${entry.id}`), n: entry.cost })))))
}

Object.assign(zh, {
  'album.remove':'删除这张卡', 'album.warnTitle':'永久删除这张卡？', 'album.warnFlower':'花不会回到花篮，展示架加成和卡册进度也会跟着掉。', 'album.warnBouquet':'花束卡删掉就找不回来，展示架加成也会消失。', 'album.keepIt':'留着', 'album.delete':'删除',
})
Object.assign(en, {
  'album.remove':'Delete this card', 'album.warnTitle':'Delete this card for good?', 'album.warnFlower':'The flower does not go back to the basket, and its shelf bonus and page progress go with it.', 'album.warnBouquet':'A deleted bouquet card cannot be recovered, and its shelf bonus goes with it.', 'album.keepIt':'Keep it', 'album.delete':'Delete',
})

// Gene bars, family tree, cross prediction and the breeding goal board.
Object.assign(zh, {
  'gene.title':'基因', 'gene.light':'色泽', 'gene.warm':'色调', 'gene.height':'株高', 'gene.width':'花幅',
  'gene.light.lo':'浓', 'gene.light.mid':'适中', 'gene.light.hi':'淡', 'gene.warm.lo':'冷', 'gene.warm.mid':'中性', 'gene.warm.hi':'暖',
  'gene.height.lo':'矮', 'gene.height.mid':'中等', 'gene.height.hi':'高', 'gene.width.lo':'窄', 'gene.width.mid':'中等', 'gene.width.hi':'宽',
  'gene.gen':'第 {n} 代', 'gene.wild':'原种', 'gene.mother':'母本', 'gene.father':'父本', 'gene.predict':'后代',
  'goal.title':'育种目标', 'goal.done':'已育成', 'goal.gen':'至少第 {n} 代', 'goal.achieved':'育成「{name}」',
  'goal.tall':'参天', 'goal.petite':'袖珍', 'goal.lush':'丰硕', 'goal.moon':'月白', 'goal.sunset':'晚霞', 'goal.dynasty':'三代同堂', 'goal.champion':'名种',
  'goal.rules':'每株花有四条基因，各分五档，和你看到的样子一致。授粉过的花和隔壁开着的另一种花结出的杂交种子，会记住父母；种下后，后代的每条基因落在父母之间，偶尔小幅突变。收获自己育出的花时，只要基因符合目标就立刻得到奖励，买来的种子不算。想要极端的基因，就挑两株都偏向那一头的做父母，一代代选下去。',
})
Object.assign(en, {
  'gene.title':'Genes', 'gene.light':'Shade', 'gene.warm':'Tone', 'gene.height':'Height', 'gene.width':'Spread',
  'gene.light.lo':'Deep', 'gene.light.mid':'Medium', 'gene.light.hi':'Pale', 'gene.warm.lo':'Cool', 'gene.warm.mid':'Neutral', 'gene.warm.hi':'Warm',
  'gene.height.lo':'Short', 'gene.height.mid':'Medium', 'gene.height.hi':'Tall', 'gene.width.lo':'Narrow', 'gene.width.mid':'Medium', 'gene.width.hi':'Wide',
  'gene.gen':'Generation {n}', 'gene.wild':'Wild type', 'gene.mother':'Mother', 'gene.father':'Father', 'gene.predict':'Offspring',
  'goal.title':'Breeding goals', 'goal.done':'Bred', 'goal.gen':'Generation {n} or later', 'goal.achieved':'Bred “{name}”',
  'goal.tall':'Skyward', 'goal.petite':'Miniature', 'goal.lush':'Bountiful', 'goal.moon':'Moon white', 'goal.sunset':'Sunset', 'goal.dynasty':'Three generations', 'goal.champion':'Champion',
  'goal.rules':'Every plant has four genes in five grades, matching what you see. A hybrid seed set by a pollinated flower and a different open flower next door remembers both parents; when sown, each of the child’s genes lands between the parents, with an occasional small mutation. Harvest a flower you bred yourself and any goal its genes meet pays at once; bought seeds do not count. For an extreme gene, pick two parents that both lean that way and keep selecting.',
})

function GeneBars({ dna, t }) {
  const genes = genesOf(dna)
  return h('div', { className: 'fg-genes' }, GENES.map(gene => [
    h('span', { key: `${gene.id}-n`, className: 'fg-geneName' }, t(`gene.${gene.id}`)),
    h('span', { key: `${gene.id}-p`, className: 'fg-genePips', role: 'img', 'aria-label': `${t(`gene.${gene.id}`)} ${genes[gene.id]}/5` },
      [1, 2, 3, 4, 5].map(n => h('i', { key: n, 'data-on': n <= genes[gene.id] ? 'true' : 'false' }))),
    h('span', { key: `${gene.id}-e`, className: 'fg-geneEnd' }, t(`gene.${gene.id}.${genes[gene.id] >= 4 ? 'hi' : genes[gene.id] <= 2 ? 'lo' : 'mid'}`)),
  ]))
}

/** One plant with its parents and grandparents, as far as the garden remembers them. */
function Pedigree({ dna, state, t, depth = 0, role }) {
  const entry = state.pedigree?.[dna]
  if (!entry) return null
  return h('div', { className: 'fg-kinTree' },
    h('div', { className: 'fg-kin', 'data-kin': dna },
      h('span', { className: 'fg-kinArt' }, h(FlowerArt, { speciesId: entry.s, stage: 'bloom', variant: 'base', dna, tint: entry.t })),
      h('span', null, role ? `${t(`gene.${role}`)} · ` : '', bloomName({ species: entry.s, tint: entry.t }, t)),
      h('span', null, entry.g >= 1 ? t('gene.gen', { n: entry.g }) : t('gene.wild'))),
    depth < 2 && entry.m && entry.f ? h('div', { className: 'fg-kinParents' },
      h(Pedigree, { dna: entry.m, state, t, depth: depth + 1, role: 'mother' }),
      h(Pedigree, { dna: entry.f, state, t, depth: depth + 1, role: 'father' })) : null)
}

function GeneCard({ dna, t }) {
  const state = getState()
  const entry = state.pedigree?.[dna]
  return h('div', { className: 'fg-geneCard' },
    h('div', { className: 'fg-geneHead' }, h('strong', null, t('gene.title')),
      h('span', { className: 'fg-questChip', 'data-tone': entry?.g >= 1 ? 'gold' : undefined }, entry?.g >= 1 ? t('gene.gen', { n: entry.g }) : t('gene.wild'))),
    h(GeneBars, { dna, t }),
    entry?.m ? h(Pedigree, { dna, state, t }) : null)
}

/** Shown on a pollinated plant with a partner next door: what the cross is likely to give. */
function CrossHint({ slot, index, t }) {
  const mother = slot.plots[index]
  const father = mother?.pollinated === true ? partnerPlot(slot, index) : null
  if (father === null) return null
  const range = mother.dna > 0 && father.dna > 0 ? predictGenes(mother.dna, father.dna) : null
  return h('div', { className: 'fg-crossHint', title: t('hybrid.how') },
    h('span', { className: 'fg-note' }, t('hybrid.hint')),
    range === null ? null : GENES.map(gene => h('span', { key: gene.id, className: 'fg-questChip' },
      `${t(`gene.${gene.id}`)} ${range[gene.id][0] === range[gene.id][1] ? range[gene.id][0] : `${range[gene.id][0]}–${range[gene.id][1]}`}`)))
}

function BreedingGoals({ state, t }) {
  const done = BREED_GOALS.filter(goal => state.goalsDone?.[goal.id] === true).length
  return h('section', { className: 'fg-section fg-goals', id: 'fg-goals' },
    h('div', { className: 'fg-sectionHead' },
      h('h3', { className: 'fg-sectionTitle' }, t('goal.title')),
      h('span', { className: 'fg-sectionMeta' }, `${done}/${BREED_GOALS.length}`),
      h(InfoTip, { t, lines: [t('goal.rules')] })),
    h('div', { className: 'fg-goalGrid' }, BREED_GOALS.map(goal => {
      const finished = state.goalsDone?.[goal.id] === true
      return h('article', { key: goal.id, className: 'fg-goal', 'data-goal': goal.id, 'data-done': finished ? 'true' : 'false' },
        h('strong', null, finished ? '✓ ' : '', t(`goal.${goal.id}`)),
        h('div', { className: 'fg-ecoTargets' },
          goal.gen ? h('span', { className: 'fg-questChip' }, t('goal.gen', { n: goal.gen })) : null,
          Object.entries(goal.need).map(([id, [lo, hi]]) => h('span', { key: id, className: 'fg-questChip' }, `${t(`gene.${id}`)} ${lo === hi ? lo : `${lo}–${hi}`}`))),
        h('span', { className: 'fg-questChip', 'data-tone': 'gold' }, finished ? t('goal.done') : rewardText(goal.reward, t)))
    })))
}

// Arranging table and visitor bonds.
Object.assign(zh, {
  'arrange.title':'插花台', 'arrange.theme':'今日主题 · {name}', 'arrange.theme.warm':'暖阳', 'arrange.theme.rosy':'粉红', 'arrange.theme.cool':'清凉', 'arrange.theme.white':'素白',
  'arrange.check.harmony':'配色和谐', 'arrange.check.variety':'三种以上', 'arrange.check.focal':'一朵主花', 'arrange.check.theme':'贴合主题',
  'arrange.make':'完成花束 · +{n}', 'arrange.need':'选 3–7 朵花', 'arrange.count':'已插 {n} 束 · 最佳 {best}★', 'arrange.remove':'取出{flower}', 'arrange.empty':'花篮里还没有花',
  'arrange.rules':'从下面点花放进花瓶，点花瓶里的花可以取出。花束按四项各加一星：颜色相邻或互补、至少三个品种、有且只有一朵明显更珍贵的主花、半数以上贴合今日主题色。星越多，卖得比散卖越贵，五星多三成，而且不受同种花跌价影响。',
  'bond.title':'访客好感', 'bond.none':'先在花园里问候一位访客，就能和它交朋友。', 'bond.level':'好感 {n}/4', 'bond.fav':'偏爱', 'bond.next':'下一级 · {reward}', 'bond.max':'好感已满',
  'bond.gift':'送一朵花', 'bond.gifted':'{name}收下了{flower}，好感 +{n}', 'bond.noFlowers':'背包里没有花可送',
  'bond.rules':'问候一次好感 +1。送花 +2，送它偏爱的花再 +4，送杂交、奇珍或仙品再 +3。每升一级立刻得到奖励，之后每次问候的小费也多 1 金币。',
})
Object.assign(en, {
  'arrange.title':'Arranging table', 'arrange.theme':'Today’s theme · {name}', 'arrange.theme.warm':'Sunny', 'arrange.theme.rosy':'Rosy', 'arrange.theme.cool':'Cool', 'arrange.theme.white':'White',
  'arrange.check.harmony':'Colours agree', 'arrange.check.variety':'Three kinds', 'arrange.check.focal':'One star bloom', 'arrange.check.theme':'On theme',
  'arrange.make':'Finish bouquet · +{n}', 'arrange.need':'Pick 3–7 flowers', 'arrange.count':'{n} bouquets · best {best}★', 'arrange.remove':'Take out {flower}', 'arrange.empty':'No flowers in the basket yet',
  'arrange.rules':'Click flowers below to put them in the vase; click one in the vase to take it out. Each of four things adds a star: neighbouring or opposite colours, at least three species, exactly one clearly more precious bloom, and half or more in today’s theme colour. More stars sell for more than loose flowers, up to 30% more, and ignore the falling price of repeated species.',
  'bond.title':'Visitor bonds', 'bond.none':'Greet a visitor in the garden first to make a friend.', 'bond.level':'Bond {n}/4', 'bond.fav':'Favourites', 'bond.next':'Next level · {reward}', 'bond.max':'Bond complete',
  'bond.gift':'Give a flower', 'bond.gifted':'{name} accepted {flower}: bond +{n}', 'bond.noFlowers':'No flowers to give',
  'bond.rules':'A greeting adds 1. A gift adds 2, plus 4 for a favourite flower and 3 for a hybrid, curiosity or spirit bloom. Each level pays a reward at once and adds 1 coin to every later greeting.',
})

function ArrangeTable({ state, t, clock, onChange }) {
  const [picked, setPicked] = React.useState([])
  const [vaseChoice, setVase] = React.useState('classic')
  const [useDried, setUseDried] = React.useState(false)
  const dried = useDried && goodsCount(state, 'dried') > 0
  const vase = vaseOwned(state, vaseChoice) ? vaseChoice : 'classic'
  const chosen = picked.filter(item => state.basket.includes(item))
  const score = arrangeScore(chosen, clock, vase, dried)
  const theme = bouquetTheme(clock)
  const entries = bagEntries(state, t).filter(entry => entry.kind === 'bloom')
    .map(entry => ({ ...entry, free: entry.items.filter(item => !chosen.includes(item)) }))
    .map(entry => ({ ...entry, count: entry.free.length })).filter(entry => entry.count > 0)
  function add(key) {
    const entry = entries.find(candidate => candidate.key === key)
    if (entry === undefined || chosen.length >= BOUQUET_MAX) return
    setPicked([...chosen, entry.free[0]])
  }
  function finish() {
    tick()
    const current = getState()
    const indices = chosen.map(item => current.basket.indexOf(item))
    const next = indices.includes(-1) ? null : arrangeBouquet(current, indices, Date.now(), vase, dried)
    setPicked([])
    if (next !== null) onChange(next)
  }
  return h('section', { className: 'fg-section fg-arrange', id: 'fg-arrange' },
    h('div', { className: 'fg-sectionHead' },
      h('h3', { className: 'fg-sectionTitle' }, t('arrange.title')),
      h('span', { className: 'fg-questChip', 'data-tone': 'gold', 'data-theme': theme }, t('arrange.theme', { name: t(`arrange.theme.${theme}`) })),
      (state.arranged ?? 0) > 0 ? h('span', { className: 'fg-sectionMeta' }, t('arrange.count', { n: state.arranged, best: state.bouquetBest ?? 0 })) : null,
      h(InfoTip, { t, lines: [t('arrange.rules')] })),
    h(BriefChip, { state, t, clock, items: chosen, score }),
    h('div', { className: 'fg-arrangeBody' },
      h('div', { className: 'fg-vaseCard' },
        h('div', { className: 'fg-vase' },
          chosen.map((item, index) => {
            return h('button', {
              key: index, type: 'button', className: 'fg-vaseStem', 'data-rarity': rarityOf(item),
              style: { transform: stemTilt(index, chosen.length) },
              title: t('arrange.remove', { flower: bloomName(item, t) }), 'aria-label': t('arrange.remove', { flower: bloomName(item, t) }),
              onClick: () => setPicked(chosen.filter(other => other !== item)),
            }, h(FlowerArt, { speciesId: item.species, stage: 'bloom', variant: item.variant, dna: item.dna, trait: item.trait, tint: item.tint }))
          }),
          h('div', { className: 'fg-vasePot' }, h(VaseArt, { id: vase, tint: vaseTint(state, vase) }))),
        h(VaseShelf, { state, t, vase, onPick: setVase, onChange }),
        score?.match ? h('span', { className: 'fg-questChip', 'data-tone': 'gold' }, t('vase.matched')) : null,
        h('div', { className: 'fg-vaseStars', 'data-stars': score?.stars ?? 0, 'aria-label': `${score?.stars ?? 0}/5` }, '★'.repeat(score?.stars ?? 0) + '☆'.repeat(5 - (score?.stars ?? 0))),
        h('div', { className: 'fg-ecoTargets' }, ['harmony', 'variety', 'focal', 'theme'].map(id =>
          h('span', { key: id, className: 'fg-questChip', 'data-done': score?.checks[id] ? 'true' : 'false' }, score?.checks[id] ? '✓ ' : '○ ', t(`arrange.check.${id}`)))),
        goodsCount(state, 'dried') > 0 ? h('button', { type: 'button', className: 'fg-bagFilter', 'data-action': 'arrangeDried', 'aria-pressed': dried ? 'true' : 'false', onClick: () => setUseDried(!useDried) }, '🌾 ', t('goods.dried', { n: goodsCount(state, 'dried') })) : null,
        h('button', { type: 'button', className: 'fg-btn fg-btnPrimary fg-btnBlock', 'data-action': 'arrange', disabled: score === null, onClick: finish },
          score === null ? t('arrange.need') : t('arrange.make', { n: score.coins }))),
      entries.length === 0 && chosen.length === 0
        ? h('p', { className: 'fg-empty' }, t('arrange.empty'))
        : h(BagGrid, { entries, onSelect: add })))
}

function AffinityBoard({ state, t, onChange }) {
  const [selected, setSelected] = React.useState(null)
  const [notice, setNotice] = React.useState('')
  const met = VISITORS.filter(visitor => (state.visitors?.[visitor.id] ?? 0) > 0)
  if (met.length === 0) return h('p', { className: 'fg-empty fg-bondNone' }, t('bond.none'))
  const current = met.find(visitor => visitor.id === selected) ?? met[0]
  const level = affinityLevel(state, current.id)
  const points = state.affinity?.[current.id] ?? 0
  const favourites = visitorFavourites(current.id)
  const blooms = bagEntries(state, t).filter(entry => entry.kind === 'bloom')
  const hearts = n => '♥'.repeat(n) + '♡'.repeat(AFFINITY_LEVELS.length - n)
  function gift(key) {
    const entry = blooms.find(candidate => candidate.key === key)
    if (entry === undefined) return
    tick()
    const before = getState()
    const next = giftVisitor(before, current.id, before.basket.findIndex(item => itemKey(item) === entry.groupKey))
    if (next === null) return
    onChange(next)
    setNotice(t('bond.gifted', { name: t(`visitor.${current.id}`), flower: entry.name, n: (next.affinity[current.id] ?? 0) - (before.affinity?.[current.id] ?? 0) }))
  }
  return h('div', { className: 'fg-bond', id: 'fg-bond' },
    h('div', { className: 'fg-sectionHead' }, h('h3', { className: 'fg-sectionTitle' }, t('bond.title')), h(InfoTip, { t, lines: [t('bond.rules')] })),
    h('div', { className: 'fg-bondGuests', role: 'group', 'aria-label': t('bond.title') }, met.map(visitor =>
      h('button', { key: visitor.id, type: 'button', className: 'fg-bondGuest', 'data-bond': visitor.id, 'aria-pressed': visitor.id === current.id ? 'true' : 'false', title: t(`visitor.${visitor.id}`), onClick: () => { setSelected(visitor.id); setNotice('') } },
        h('span', { className: 'fg-bondArt' }, h(VisitorArt, { id: visitor.id })),
        h('span', { className: 'fg-hearts' }, hearts(affinityLevel(state, visitor.id)))))),
    h('div', { className: 'fg-bondDetail' },
      h('div', { className: 'fg-bondInfo' },
        h('strong', null, t(`visitor.${current.id}`), ' ', h('span', { className: 'fg-hearts' }, hearts(level))),
        level < AFFINITY_LEVELS.length
          ? h('progress', { max: AFFINITY_LEVELS[level], value: points, 'aria-label': t('bond.level', { n: level }) })
          : null,
        h('span', { className: 'fg-questChip', 'data-tone': 'gold' }, level < AFFINITY_LEVELS.length ? t('bond.next', { reward: rewardText(AFFINITY_REWARDS[level], t) }) : t('bond.max')),
        h('div', { className: 'fg-ecoTargets' }, h('span', { className: 'fg-note' }, t('bond.fav')),
          favourites.slice(0, 6).map(id => h('span', { key: id, className: 'fg-questChip' }, h(BloomDot, { speciesId: id }), ' ', t(`species.${id}`))))),
      h('div', { className: 'fg-bondGift' },
        goodsCount(state, 'tea') > 0 && level < AFFINITY_LEVELS.length ? h('button', { type: 'button', className: 'fg-btn fg-btnSmall fg-btnPrimary', 'data-action': 'bondTea', onClick: () => { tick(); const next = serveTea(getState(), current.id); if (next === null) return; onChange(next); setNotice(t('goods.teaServed', { name: t(`visitor.${current.id}`), n: TEA_BOND })) } }, '🍵 ', t('goods.teaServe', { n: goodsCount(state, 'tea') })) : null,
        h('span', { className: 'fg-note' }, t('bond.gift')),
        blooms.length === 0 ? h('p', { className: 'fg-empty' }, t('bond.noFlowers')) : h(BagGrid, { entries: blooms, onSelect: gift }))),
    h('p', { role: 'status', 'aria-live': 'polite', className: 'fg-sectionOk' }, notice))
}

// Feedback layer: synthesised sounds (off by default), fly-to animations and the item hotbar.
Object.assign(zh, {
  'discovery.noted':'新发现已记入图鉴', 'settings.sound':'音效',
  'bar.title':'快捷道具栏', 'bar.drag':'拖到花圃上使用', 'bar.pick':'点一个花圃使用{item}', 'bar.cannot':'这里用不了{item}',
})
Object.assign(en, {
  'discovery.noted':'new discovery recorded', 'settings.sound':'Sound effects',
  'bar.title':'Quick supplies', 'bar.drag':'Drag onto a plot to use', 'bar.pick':'Pick a plot for {item}', 'bar.cannot':'{item} cannot be used here',
})

const SOUNDS = {
  harvest: [[660, 0, 0.09], [880, 0.08, 0.12]],
  coin: [[988, 0, 0.06], [1319, 0.06, 0.1]],
  water: [[420, 0, 0.08], [340, 0.07, 0.1]],
  plant: [[330, 0, 0.08], [392, 0.07, 0.08]],
  gold: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.2]],
  error: [[200, 0, 0.15]],
}
let audioContext = null
/** Short synthesised tones; no audio files, and silent unless the player turned sound on. */
function playSound(kind) {
  try {
    if (typeof window === 'undefined' || getState().ui?.sound !== true) return
    const Ctor = window.AudioContext ?? window.webkitAudioContext
    if (Ctor === undefined) return
    audioContext = audioContext ?? new Ctor()
    const start = audioContext.currentTime
    for (const [freq, at, len] of SOUNDS[kind] ?? []) {
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, start + at)
      gain.gain.exponentialRampToValueAtTime(0.12, start + at + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + at + len)
      osc.connect(gain)
      gain.connect(audioContext.destination)
      osc.start(start + at)
      osc.stop(start + at + len + 0.02)
    }
  } catch (error) {
    // Sound is decoration; a browser that refuses audio must not break the action.
  }
}

/** A glyph that flies from one element to another, then the target gives a small bump. */
function flyTo(source, target, glyph) {
  try {
    if (!source || !target || typeof document === 'undefined' || typeof target.getBoundingClientRect !== 'function') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const from = source.getBoundingClientRect(), to = target.getBoundingClientRect()
    const node = document.createElement('span')
    if (typeof node.animate !== 'function') return
    node.className = 'fg-fly'
    node.textContent = glyph
    node.style.left = `${from.left + from.width / 2}px`
    node.style.top = `${from.top + from.height / 2}px`
    document.body.appendChild(node)
    const dx = to.left + to.width / 2 - (from.left + from.width / 2), dy = to.top + to.height / 2 - (from.top + from.height / 2)
    const flight = node.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 50}px) scale(1.35)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) scale(.45)`, opacity: 0.25 },
    ], { duration: 650, easing: 'cubic-bezier(.3,.7,.4,1)' })
    const done = () => node.remove()
    flight.onfinish = done
    flight.oncancel = done
    window.setTimeout(done, 900) // fallback when the browser never finishes the animation
    target.animate?.([{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 320, delay: 560 })
  } catch (error) {
    // Animation is decoration as well.
  }
}

/** Supplies the player owns, as slots above the plots: drag one onto a plot, or click it and then a plot. */
function QuickBar({ state, t, tool, onPick, onUse, onDragItem }) {
  const items = ITEMS.filter(item => item.kind === 'consumable' && (state.bag?.[item.id] ?? 0) > 0)
  if (items.length === 0) return null
  return h('div', { className: 'fg-hotbar', role: 'toolbar', 'aria-label': t('bar.title') },
    items.map(item => {
      const targeted = item.id === 'fertilizer' || item.id === 'compost'
      return h('button', {
        key: item.id, type: 'button', className: 'fg-slot fg-hotSlot', draggable: true, 'data-hot': item.id,
        'aria-pressed': targeted ? (tool === item.id ? 'true' : 'false') : undefined,
        title: `${t(`item.${item.id}`)} · ${t(`item.${item.id}.note`)}`,
        'aria-label': `${t(`item.${item.id}`)} ×${state.bag[item.id]}`,
        onDragStart: event => { onDragItem(item.id); event.dataTransfer?.setData('text/plain', item.id) },
        onDragEnd: () => onDragItem(null),
        onClick: () => (targeted ? onPick(item.id) : onUse(item.id)),
      },
      h('span', { className: 'fg-slotArt' }, h(ItemIcon, { id: item.id })),
      h('span', { className: 'fg-slotCount' }, `×${state.bag[item.id]}`))
    }),
    h('span', { className: 'fg-hotHint' }, tool ? t('bar.pick', { item: t(`item.${tool}`) }) : t('bar.drag')))
}

// Slot backpack, daily play strip, away card and the collapsible rule tip.
Object.assign(zh, {
  'inventory.title':'背包', 'inventory.open':'背包 · {n}',
  'bag.filters':'背包分类', 'bag.all':'全部', 'bag.bloom':'花', 'bag.seed':'种子', 'bag.item':'道具',
  'bag.flowers':'花 {n}/{max}', 'bag.empty':'这里还空着', 'bag.pick':'点一格看看',
  'bag.worth':'估价 {n}', 'bag.sell':'卖出 · +{n}', 'bag.sellConfirm':'确认卖出 · +{n}', 'bag.view':'查看详情', 'bag.plant':'去花园种下',
  'bag.rarity.base':'原色', 'bag.rarity.alt':'别色', 'bag.rarity.hybrid':'杂交', 'bag.rarity.curio':'奇珍', 'bag.rarity.spirit':'仙品',
  'tip.rules':'玩法说明',
  'play.title':'今日', 'play.daily':'每日签到', 'play.streak':'连续 {n} 天', 'play.claim':'领取', 'play.claimed':'今日已领', 'play.day':'第 {n} 天',
  'play.quests':'今日心愿', 'play.quest.harvested':'收获 {n} 朵花', 'play.quest.planted':'种下 {n} 株', 'play.quest.greeted':'问候 {n} 位访客',
  'play.quest.delivered':'交付 {n} 份花束订单', 'play.quest.pollinated':'完成 {n} 次授粉', 'play.questClaim':'领取 +{n}', 'play.questDone':'已领',
  'play.bonus':'三项全清再送肥料 ×2', 'play.gift':'惊喜礼盒', 'play.giftLeft':'{n}后消失',
  'play.away':'你离开了 {time}', 'play.awayBloomed':'{n} 株新开花', 'play.awayThirsty':'{n} 株等水喝', 'play.awayOk':'花园一切安好', 'play.dismiss':'知道了',
})
Object.assign(en, {
  'inventory.title':'Backpack', 'inventory.open':'Backpack · {n}',
  'bag.filters':'Backpack filters', 'bag.all':'All', 'bag.bloom':'Flowers', 'bag.seed':'Seeds', 'bag.item':'Supplies',
  'bag.flowers':'Flowers {n}/{max}', 'bag.empty':'Nothing here yet', 'bag.pick':'Pick a slot to inspect',
  'bag.worth':'Worth {n}', 'bag.sell':'Sell · +{n}', 'bag.sellConfirm':'Confirm sell · +{n}', 'bag.view':'View details', 'bag.plant':'Plant in the garden',
  'bag.rarity.base':'Plain', 'bag.rarity.alt':'Second colour', 'bag.rarity.hybrid':'Hybrid', 'bag.rarity.curio':'Curiosity', 'bag.rarity.spirit':'Spirit',
  'tip.rules':'How it works',
  'play.title':'Today', 'play.daily':'Daily check-in', 'play.streak':'{n}-day streak', 'play.claim':'Collect', 'play.claimed':'Collected today', 'play.day':'Day {n}',
  'play.quests':'Today’s wishes', 'play.quest.harvested':'Harvest {n} flowers', 'play.quest.planted':'Plant {n} seeds', 'play.quest.greeted':'Greet {n} visitors',
  'play.quest.delivered':'Deliver {n} bouquet order', 'play.quest.pollinated':'Get {n} pollinations', 'play.questClaim':'Collect +{n}', 'play.questDone':'Collected',
  'play.bonus':'Clear all three for Fertiliser ×2', 'play.gift':'Surprise box', 'play.giftLeft':'gone in {n}',
  'play.away':'You were away for {time}', 'play.awayBloomed':'{n} new blooms', 'play.awayThirsty':'{n} plants need water', 'play.awayOk':'The garden is doing fine', 'play.dismiss':'Got it',
})

/** Rules live behind a native disclosure instead of standing paragraphs. */
function InfoTip({ t, label, lines }) {
  return h('details', { className: 'fg-tip' },
    h('summary', { className: 'fg-tipToggle' }, h('span', { className: 'fg-tipMark', 'aria-hidden': true }, '?'), h('span', null, label ?? t('tip.rules'))),
    h('div', { className: 'fg-tipBody' }, lines.filter(Boolean).map((line, index) => h('p', { key: index }, line))))
}

function SeedGlyph({ species, tint }) {
  const pal = paletteOf(SPECIES_BY_ID.get(tint ?? species) ?? SPECIES[0], 'base')
  return h('svg', { viewBox: '0 0 24 24', width: 24, height: 24, 'aria-hidden': 'true', focusable: 'false' },
    h('path', { d: 'M12 21c-3.6 0-6-2.3-6-5.6C6 11.6 9 8.6 12 5c3 3.6 6 6.6 6 10.4 0 3.3-2.4 5.6-6 5.6Z', fill: pal.petal, stroke: pal.petalDeep, strokeWidth: 1.2 }),
    h('path', { d: 'M12 9c0-2.6 1.4-4.4 3.8-5-.2 2.6-1.4 4.3-3.8 5Z', fill: '#7fbf6a' }),
    h('path', { d: 'M9.6 15.4c.5 1.5 1.4 2.3 2.8 2.6', fill: 'none', stroke: '#ffffffaa', strokeWidth: 1.1, strokeLinecap: 'round' }))
}

/** Everything the player carries as one list of stacks: blooms, hybrid seeds, supplies. */
function bagEntries(state, t) {
  const entries = []
  const groups = new Map()
  for (const item of state.basket ?? []) {
    const key = itemKey(item)
    if (!groups.has(key)) groups.set(key, { kind: 'bloom', key: `bloom:${key}`, groupKey: key, item, items: [] })
    groups.get(key).items.push(item)
  }
  const blooms = [...groups.values()].map(group => ({ ...group, count: group.items.length, name: bloomName(group.item, t), rarity: rarityOf(group.item) }))
  blooms.sort((a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity] || itemValue(b.item) - itemValue(a.item))
  entries.push(...blooms)
  for (const [key, count] of Object.entries(state.seeds ?? {})) {
    const [species, tint] = key.split('~')
    if (count <= 0 || !SPECIES_BY_ID.has(species)) continue
    entries.push({ kind: 'seed', key: `seed:${key}`, species, tint, count, name: bloomName({ species, tint }, t), rarity: 'hybrid' })
  }
  for (const item of ITEMS) {
    const count = state.bag?.[item.id] ?? 0
    if (item.kind !== 'consumable' || count <= 0) continue
    entries.push({ kind: 'item', key: `item:${item.id}`, id: item.id, count, name: t(`item.${item.id}`), rarity: 'base' })
  }
  for (const id of GOODS) if (goodsCount(state, id) > 0) entries.push({ kind: 'item', key: `item:${id}`, id, count: goodsCount(state, id), name: t(`item.${id}`), rarity: 'base' })
  return entries
}

function bagArt(entry) {
  if (entry.kind === 'bloom') return h(FlowerArt, { speciesId: entry.item.species, stage: 'bloom', variant: entry.item.variant, dna: entry.item.dna, trait: entry.item.trait, tint: entry.item.tint })
  if (entry.kind === 'seed') return h(SeedGlyph, { species: entry.species, tint: entry.tint })
  return GOODS.includes(entry.id) ? h('span', { className: 'fg-goodsIcon', 'aria-hidden': true }, GOODS_ICON[entry.id]) : h(ItemIcon, { id: entry.id })
}

function BagSlot({ entry, selected, onSelect }) {
  const interactive = typeof onSelect === 'function'
  return h(interactive ? 'button' : 'div', {
    ...(interactive ? { type: 'button', 'aria-pressed': selected ? 'true' : 'false', onClick: () => onSelect(entry.key) } : { role: 'img' }),
    className: 'fg-slot', 'data-kind': entry.kind, 'data-rarity': entry.rarity, 'data-slot': entry.key,
    'data-supply': entry.kind === 'item' ? entry.id : undefined,
    title: entry.name, 'aria-label': `${entry.name} ×${entry.count}`,
  },
  h('span', { className: 'fg-slotArt' }, bagArt(entry)),
  h('span', { className: 'fg-slotName' }, entry.name),
  h('span', { className: 'fg-slotCount' }, `×${entry.count}`))
}

function BagGrid({ entries, picked, onSelect, min = 0 }) {
  const empty = Math.max(0, min - entries.length)
  return h('div', { className: 'fg-slotGrid' },
    entries.map(entry => h(BagSlot, { key: entry.key, entry, selected: entry.key === picked, onSelect })),
    Array.from({ length: empty }, (_, index) => h('span', { key: `empty-${index}`, className: 'fg-slot fg-slotEmpty', 'aria-hidden': true })))
}

/** Supplies and seeds as slots; the shop shows this beside its counter. */
function InventoryContents({ state, t }) {
  const entries = bagEntries(state, t).filter(entry => entry.kind !== 'bloom')
  return h('div', { className: 'fg-inventoryContents' },
    state.charm ? h('p', { className: 'fg-badge fg-badgeWarn' }, t('item.charmReady')) : null,
    entries.length === 0 ? h('p', { className: 'fg-empty' }, t('bag.empty')) : h(BagGrid, { entries }))
}

Object.assign(zh, {
  'bag.pinBloom':'钉住这朵花', 'bag.unpinBloom':'从桌面收回', 'bag.pinArtError':'无法读取这朵花的绘图。',
  'bag.pinLaunchError':'桌面花朵启动失败，请再试一次。', 'bag.unpinError':'未能收回这朵花，请再试一次。', 'bag.pinSizeError':'这朵花的绘图超过窗口大小限制。',
})
Object.assign(en, {
  'bag.pinBloom':'Pin this flower', 'bag.unpinBloom':'Remove from desktop', 'bag.pinArtError':'Could not read this flower’s artwork.',
  'bag.pinLaunchError':'Could not open the desktop flower. Try again.', 'bag.unpinError':'Could not close this flower. Try again.', 'bag.pinSizeError':'This flower exceeds the desktop drawing size limit.',
})

function individualBloomPins(stack) {
  const duplicates = new Map()
  return stack.items.map(item => {
    const signature = `${itemKey(item).replaceAll('+','.')}:${item.dna ?? 'legacy'}`
    const ordinal = duplicates.get(signature) ?? 0
    duplicates.set(signature, ordinal + 1)
    return {item, key:`bloom:${signature}:${ordinal}`}
  })
}

function InventoryDialog({ state, t, clock = Date.now(), onClose, onGarden, onShop, onSell, onUse, onOpenBloom, onKeep, onUseBloom }) {
  const ref = React.useRef(null); useGardenDialog(ref)
  const [filter, setFilter] = React.useState('all')
  const [picked, setPicked] = React.useState(null)
  const [armed, setArmed] = React.useState(null)
  const [pickedBloom, setPickedBloom] = React.useState(null)
  const artRef = React.useRef(null)
  const all = bagEntries(state, t)
  const shown = all.filter(entry => filter === 'all' || entry.kind === filter)
  const current = shown.find(entry => entry.key === picked) ?? shown[0] ?? null
  const individuals = current?.kind === 'bloom' ? individualBloomPins(current) : []
  const individual = individuals.find(bloom => bloom.key === pickedBloom) ?? individuals[0]
  const displayed = individual ? {...current,item:individual.item} : current
  const pin = useSyncExternalStore(subscribeBouquetPins, () => bouquetPins.get(individual?.key) ?? noBouquetPin, () => noBouquetPin)
  const pinId = individual?.key
  React.useEffect(() => () => cancelArtOpen(pinId), [pinId])
  const worth = current?.kind === 'bloom' ? quoteSale(state, current.items, clock).coins : 0
  function pick(key) { setPicked(key); setArmed(null) }
  function sell() {
    if (armed !== current.key) { setArmed(current.key); return }
    setArmed(null); onSell?.(current.groupKey)
  }
  const actions = current === null ? [] : current.kind === 'bloom' ? [
    h('button', { key: 'sell', type: 'button', className: armed === current.key ? 'fg-btn fg-btnDanger' : 'fg-btn fg-btnPrimary', 'data-action': 'bagSell', onClick: sell }, t(armed === current.key ? 'bag.sellConfirm' : 'bag.sell', { n: worth })),
    h('button', { key:'pin', type:'button', className:'fg-btn', 'data-action':'bagPinDesktop', disabled:pin.phase==='pending', 'aria-pressed':pin.phase==='open', onClick:()=>toggleBloomPin(individual.key, artRef.current?.querySelector('svg'), current.name) }, t(pin.phase==='preparing' ? 'desktop.cancelWait' : pin.phase==='pending' ? 'desktop.working' : pin.phase==='open' ? 'bag.unpinBloom' : 'bag.pinBloom')),
    h('button', { key: 'view', type: 'button', className: 'fg-btn', onClick: () => onOpenBloom?.(current.groupKey) }, t('bag.view')),
    h('button', { key: 'use', type: 'button', className: 'fg-btn', 'data-action': 'bagUse', onClick: () => onUseBloom?.(current.groupKey) }, t('use.' + flowerUse(current.item.species))),
    h('button', { key: 'keep', type: 'button', className: 'fg-btn', 'data-action': 'bagKeep', onClick: () => onKeep?.(current.groupKey) }, t('album.keep')),
  ] : current.kind === 'seed' ? [
    h('button', { key: 'plant', type: 'button', className: 'fg-btn fg-btnPrimary', onClick: onGarden }, t('bag.plant')),
  ] : GOODS.includes(current.id) ? (current.id === 'perfume' ? [h('button', { key: 'use', type: 'button', className: 'fg-btn fg-btnPrimary', onClick: () => onUse?.('perfume') }, t('goods.spray'))] : []) : current.id === 'sprinkler' ? [
    h('button', { key: 'use', type: 'button', className: 'fg-btn fg-btnPrimary', onClick: () => onUse?.('sprinkler') }, t('item.useGround')),
  ] : current.id === 'charm' ? [
    state.charm ? h('span', { key: 'on', className: 'fg-badge fg-badgeWarn' }, t('item.charmReady'))
      : h('button', { key: 'use', type: 'button', className: 'fg-btn fg-btnPrimary', onClick: () => onUse?.('charm') }, t('item.useCharm')),
  ] : [
    h('button', { key: 'go', type: 'button', className: 'fg-btn fg-btnPrimary', onClick: onGarden }, t('inventory.grow')),
  ]
  return h('dialog', { ref, className: 'fg-dialog fg-inventoryDialog fg-bagDialog', 'aria-label': t('inventory.title'), onCancel: event => { event.preventDefault(); onClose() } },
    h('header', { className: 'fg-inventoryHead' },
      h('h2', null, t('inventory.title')),
      h('span', { className: 'fg-chip' }, t('bag.flowers', { n: (state.basket ?? []).length, max: basketCapacity(state) })),
      h('span', { className: 'fg-chip' }, CoinGlyph(), h('span', { className: 'fg-chipValue' }, String(state.coins))),
      h('button', { type: 'button', className: 'fg-btn fg-bagClose', onClick: onClose, 'aria-label': t('inventory.close') }, '×')),
    h('div', { className: 'fg-bagFilters', role: 'group', 'aria-label': t('bag.filters') },
      ['all', 'bloom', 'seed', 'item'].map(id => h('button', { key: id, type: 'button', className: 'fg-bagFilter', 'aria-pressed': filter === id ? 'true' : 'false', onClick: () => { setFilter(id); setArmed(null) } },
        t(`bag.${id}`), ' ', h('span', { className: 'fg-bagFilterCount' }, String(all.filter(entry => id === 'all' || entry.kind === id).length))))),
    h('div', { className: 'fg-bagBody' },
      h(BagGrid, { entries: shown, picked: current?.key, onSelect: pick, min: 12 }),
      h('aside', { className: 'fg-bagDetail', 'data-rarity': current?.rarity, 'aria-live': 'polite' },
        current === null ? h('p', { className: 'fg-empty' }, t('bag.empty')) : [
          h('div', { key: 'art', ref:artRef, className: 'fg-bagDetailArt' }, bagArt(displayed)),
          h('h3', { key: 'name' }, current.name),
          individuals.length > 1 ? h('label', {key:'individual', className:'fg-note'}, t('basket.individual'),
            h('select', {className:'fg-btn', value:individual.key, onChange:event=>setPickedBloom(event.target.value)},
              individuals.map((bloom,index)=>h('option',{key:bloom.key,value:bloom.key},t('basket.individualNo',{n:index+1,max:individuals.length}))))) : null,
          h('div', { key: 'tags', className: 'fg-bagTags' },
            h('span', { className: 'fg-rarityTag', 'data-rarity': current.rarity }, current.kind === 'item' ? t('bag.item') : current.kind === 'seed' ? t('bag.seed') : t(`bag.rarity.${current.rarity}`)),
            h('span', { className: 'fg-note' }, `×${current.count}`),
            current.kind === 'bloom' ? h('span', { className: 'fg-note' }, t('bag.worth', { n: worth })) : null),
          current.kind === 'bloom' ? h('span', { key: 'use', className: 'fg-questChip' }, t('use.' + flowerUse(current.item.species) + '.note')) : null,
          individual && Number.isFinite(individual.item.dna) ? h(GeneBars, { key: 'genes', dna: individual.item.dna, t }) : null,
          current.kind === 'item' ? h('p', { key: 'note', className: 'fg-note' }, t(`item.${current.id}.note`)) : null,
          h('div', { key: 'actions', className: 'fg-bagActions' }, actions),
           individual && (pin.status || pin.error) ? h('p', {key:'pinError',className:'fg-note',role:'status'}, t(pin.status || pin.error)) : null,
        ])),
    h('footer', { className: 'fg-rewardActions' },
      h('button', { type: 'button', className: 'fg-btn', onClick: onShop }, t('tabs.shop')),
      h('button', { type: 'button', className: 'fg-btn fg-btnPrimary', onClick: onClose, autoFocus: true }, t('inventory.close'))))
}

function rewardText(reward, t) {
  return [reward.coins ? `${reward.coins} ${t('stat.coins')}` : null,
    ...Object.entries(reward.bag ?? {}).map(([id, n]) => `${t(`item.${id}`)} ×${n}`)].filter(Boolean).join(' + ')
}

/** The strip above the garden: check-in dots, three wishes, and the surprise box when one is around. */
function PlayStrip({ state, t, clock, hidden, onChange }) {
  const daily = dailyStatus(state, clock)
  const quests = dailyQuests(state, clock)
  const gift = giftAt(state, clock)
  function run(transition) {
    tick()
    const next = transition(getState(), Date.now())
    if (next !== null) onChange(next)
  }
  return h('section', { className: 'fg-play', hidden, 'aria-label': t('play.title') },
    h('div', { className: 'fg-playCard fg-daily' },
      h('div', { className: 'fg-playHead' }, h('strong', null, t('play.daily')), h('span', { className: 'fg-note' }, t('play.streak', { n: daily.streak }))),
      h('ol', { className: 'fg-dailyDots' }, DAILY_REWARDS.map((reward, index) => h('li', {
        key: index, className: 'fg-dailyDot', title: `${t('play.day', { n: index + 1 })} · ${rewardText(reward, t)}`,
        'data-state': index < daily.index || (index === daily.index && !daily.available) ? 'done' : index === daily.index ? 'today' : 'todo',
      }, reward.bag ? h(ItemIcon, { id: Object.keys(reward.bag)[0] }) : CoinGlyph(), h('span', null, String(index + 1))))),
      daily.available
        ? h('button', { type: 'button', className: 'fg-btn fg-btnPrimary fg-playClaim', 'data-action': 'daily', onClick: () => run(claimDaily) }, `${t('play.claim')} · ${rewardText(daily.reward, t)}`)
        : h('span', { className: 'fg-note' }, t('play.claimed'))),
    h('div', { className: 'fg-playCard fg-quests', title: t('play.bonus') },
      h('div', { className: 'fg-playHead' }, h('strong', null, t('play.quests')), h('span', { className: 'fg-note' }, `${quests.filter(quest => quest.claimed).length}/${quests.length}`)),
      quests.map(quest => h('div', { key: quest.id, className: 'fg-quest', 'data-quest': quest.id, 'data-done': quest.done ? 'true' : 'false' },
        h('span', { className: 'fg-questName' }, t(`play.quest.${quest.id}`, { n: quest.target })),
        h('progress', { max: quest.target, value: quest.progress, 'aria-label': t(`play.quest.${quest.id}`, { n: quest.target }) }),
        quest.claimed ? h('span', { className: 'fg-note' }, t('play.questDone'))
          : quest.done ? h('button', { type: 'button', className: 'fg-btn fg-btnSmall fg-btnPrimary', 'data-action': 'quest', onClick: () => run((current, now) => claimQuest(current, quest.id, now)) }, t('play.questClaim', { n: quest.coins }))
            : h('span', { className: 'fg-note' }, `${quest.progress}/${quest.target}`)))),
    gift === null ? null : h('button', { type: 'button', className: 'fg-gift', 'data-action': 'gift', onClick: () => run(openGift) },
      h('span', { className: 'fg-giftBox', 'aria-hidden': true }, '🎁'), h('strong', null, t('play.gift')),
      h('span', { className: 'fg-note' }, t('play.giftLeft', { n: formatDuration(Math.max(0, gift.until - clock), t) }))))
}

function AwayCard({ report, t, onClose }) {
  return h('div', { className: 'fg-away', role: 'status' },
    h('strong', null, t('play.away', { time: formatDuration(report.awayMs, t) })),
    report.bloomed > 0 ? h('span', { className: 'fg-badge fg-badgeOk' }, t('play.awayBloomed', { n: report.bloomed })) : null,
    report.thirsty > 0 ? h('span', { className: 'fg-badge fg-badgeWarn' }, t('play.awayThirsty', { n: report.thirsty })) : null,
    report.bloomed === 0 && report.thirsty === 0 ? h('span', { className: 'fg-note' }, t('play.awayOk')) : null,
    h('button', { type: 'button', className: 'fg-btn fg-btnSmall fg-btnGhost', 'aria-label': t('play.dismiss'), onClick: onClose }, '×'))
}
    function GardenView(props) {
      const t = (props !== null && props !== undefined && typeof props.t === 'function') ? props.t : boundT
      const state = useSyncExternalStore(subscribeGarden, getState, getState)
      const [picker, setPicker] = React.useState(null)
      const [confirmReset, setConfirmReset] = React.useState(false)
      const [codexOpen, setCodexOpen] = React.useState(() => sanitizeUi(state.ui).tab === 'flowers')
      const [achOpen, setAchOpen] = React.useState(false)
      const [armed, setArmed] = React.useState(null)
      // Which basket bloom the player opened to look at.
      const [preview, setPreview] = React.useState(null)
      // Which flower-book entry the player opened to look at.
      const [codexPreview, setCodexPreview] = React.useState(null)
      const [guestPreview, setGuestPreview] = React.useState(null)
      const [guideRegion,setGuideRegion]=React.useState(state.scene)
      const [discovery, setDiscovery] = React.useState(null)
      const [reward, setReward] = React.useState(null)
      const [inventoryOpen, setInventoryOpen] = React.useState(false)
      const [away, setAway] = React.useState(getAway)
      const found = React.useRef(false)
      const [tool, setTool] = React.useState(null)
      const dragging = React.useRef(null)
      React.useEffect(() => {
        if (!away) return undefined
        const id = window.setTimeout(() => { clearAway(); setAway(null) }, 12000)
        return () => window.clearTimeout(id)
      }, [away])
      // A parsed save file waiting for the player to confirm the overwrite.
      const [pendingImport, setPendingImport] = React.useState(null)
      const saveInput = React.useRef(null)
      const [toast, setToast] = React.useState({ text: '', key: 0, tone: 'ok', species: null })
      const [clock, setClock] = React.useState(() => Date.now())
      const rootRef = React.useRef(null)
      const scrollRef = React.useRef(null)
      // The element a dialog took focus from, so closing it can hand focus back
      // without scrolling the session pane to the top.
      const modalOpener = React.useRef(null)
      function rememberOpener() { modalOpener.current = typeof document === 'undefined' ? null : document.activeElement }
      function restoreOpener() {
        const previous = modalOpener.current
        modalOpener.current = null
        window.setTimeout(() => {
          const target = previous?.isConnected && !previous.closest('[hidden]')
            ? previous
            : rootRef.current?.querySelector('[role="tab"][aria-selected="true"]')
          if (target !== null && target !== undefined && typeof target.focus === 'function') target.focus({ preventScroll: true })
        }, 0)
      }
      function openGuide(id) { rememberOpener(); setGuideRegion(SCENE_ID_OF.get(id)); setCodexOpen(true); setCodexPreview(`${id}:base`) }
      function openGuest(id) { rememberOpener(); setGuestPreview(id) }
      const scrollPositions = React.useRef({})
      const ui = sanitizeUi(state.ui)
      const activeTab = ui.tab
      const clockInfo = gardenClock(clock)
      const fontFamilies = {system:'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',serif:'"Songti SC", "Noto Serif CJK SC", "SimSun", Georgia, serif',rounded:'"SF Pro Rounded", "Arial Rounded MT Bold", "PingFang SC", sans-serif'}
      function updateUi(patch) { commit({...getState(),ui:sanitizeUi({...getState().ui,...patch})},true) }
      function selectTab(id, keyboard = false) {
        if (!GARDEN_TABS.includes(id)) return
        if (scrollRef.current) scrollPositions.current[activeTab] = scrollRef.current.scrollTop
        updateUi({tab:id})
        setArmed(null);setPicker(null);setConfirmReset(false)
        if(id==='flowers')setCodexOpen(true)
        window.setTimeout(()=>{if(scrollRef.current)scrollRef.current.scrollTop=scrollPositions.current[id]??0;if(keyboard)(rootRef.current?.querySelector(`#fg-tab-${id}`)??rootRef.current?.querySelector(`#fg-group-${tabGroupOf(id)}`))?.focus({preventScroll:true})},0)
      }
      // The last section opened in each group, so switching groups returns to it.
      const lastSection = React.useRef({})
      const activeGroup = tabGroupOf(activeTab)
      if (activeGroup !== null) lastSection.current[activeGroup] = activeTab
      function selectGroup(group, keyboard = false) { selectTab(lastSection.current[group] ?? TAB_GROUPS[group][0], keyboard) }
      function cycleKeys(event, list, current, pick) {
        const index=list.indexOf(current)
        const next=event.key==='ArrowRight'?(index+1)%list.length:event.key==='ArrowLeft'?(index+list.length-1)%list.length:event.key==='Home'?0:event.key==='End'?list.length-1:null
        if(next===null)return
        event.preventDefault();pick(list[next])
      }
      function tabKeys(event,group) { cycleKeys(event,TAB_GROUP_IDS,group,next=>{selectGroup(next);window.setTimeout(()=>rootRef.current?.querySelector(`#fg-group-${next}`)?.focus({preventScroll:true}),0)}) }
      function subKeys(event,id) { cycleKeys(event,TAB_GROUPS[activeGroup],id,next=>selectTab(next,true)) }
      function panel(id,...children) {
        const group=tabGroupOf(id), sections=group===null?[]:TAB_GROUPS[group]
        const subTabs=sections.length>1?h('div',{className:'fg-subTabs',role:'tablist','aria-label':t(`tabs.group.${group}`)},sections.map(section=>h('button',{
          key:section,id:`fg-tab-${section}`,type:'button',role:'tab','aria-selected':section===id,'aria-controls':`fg-panel-${section}`,tabIndex:section===id?0:-1,
          className:'fg-subTab',onClick:()=>selectTab(section),onKeyDown:event=>subKeys(event,section)},h('span',{className:'fg-tabIcon','aria-hidden':true},TAB_ICONS[section]),t(`tabs.${section}`)))):null
        return h('div',{key:id,id:`fg-panel-${id}`,role:'tabpanel','aria-labelledby':sections.length>1?`fg-tab-${id}`:group!==null?`fg-group-${group}`:'fg-tab-settings',hidden:activeTab!==id,tabIndex:0,className:'fg-tabPanel'},subTabs,...children)
      }


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
        }, 6500)
        return () => {
          window.clearTimeout(id)
        }
      }, [toastKey])

      function commitDiscovered(before,next,kind,index) {
        const items=discoveryItems(before,next,kind,before.scene,index)
        const recorded=recordDiscoveries(next,items,Date.now())
        commit(recorded,true)
        found.current=items.length>0
        return false
      }
      function openDiscovered(item) {
        setDiscovery(null)
        if(item.type==='visitor'){selectTab('visitors');setGuestPreview(item.visitor)}
        else{selectTab('flowers');setGuideRegion(SCENE_ID_OF.get(item.species));setCodexOpen(true);setCodexPreview(item.type==='seed'?`${item.species}:base`:itemKey(item))}
        modalOpener.current=null
      }
      function commitReward(next) {
        const result=rewardForChange(getState(),next,t)
        commit(next,true)
        if(result){playSound('coin');flyTo(typeof document==='undefined'?null:document.activeElement,rootRef.current?.querySelector('.fg-stats .fg-chip'),'🪙');announce(result.entries.map(entry=>`${entry.label} ${entry.amount}`).join(' · '),'gold')}
      }
      function announce(text, tone, species) {
        if (tone === 'warn') playSound('error')
        setToast({ text, key: Date.now(), tone: tone ?? 'ok', species: species ?? null })
      }

      function focusTarget(selector) {
        window.setTimeout(() => {
          const root = rootRef.current
          if (root === null) return
          const candidate = root.querySelector(selector) ?? (selector.startsWith('[data-codex=') ? root.querySelector('#fg-codex-toggle') : null)
          const target = candidate && !candidate.closest('[hidden]') ? candidate : null
          // Falling back to the tab bar used to scroll the whole view to the top when
          // the wanted control had just disappeared. Leave focus where it is instead.
          if (target === null || typeof target.focus !== 'function') return
          target.focus({ preventScroll: true })
          if (typeof target.scrollIntoView === 'function') target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
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
        rememberOpener()
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
      function showBloom(key) {
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
      const featured = featuredSpecies(state, clock)
      const basketValueNow = basketValue(state, clock)
      const marketPercent = Math.round((MARKET_BONUS - 1) * 100)
      const readyAchievements = ACHIEVEMENTS.filter(entry => achievementReady(state, entry))
      const metKinds = Object.keys(state.visitors ?? {}).length
      const capacity = basketCapacity(state)
      const basketFull = state.basket.length >= capacity
      const sprinklerLeftMs = Math.max(0, (slot.sprinklerUntil ?? 0) - clock)
      const discovered = Object.keys(state.seen).length
      const totalEntries = CODEX_ENTRIES.length
      const grownCount = SPECIES.filter(species => state.seen[`${species.id}:base`] !== undefined
        || state.seen[`${species.id}:alt`] !== undefined
        || state.seen[`${species.id}:hidden`] !== undefined).length
      const sceneSpecies = scene.species.map(id => SPECIES_BY_ID.get(id))
      const guideScene=sceneOf(guideRegion)
      const weatherNote = [
        growth === 1 ? t('weather.steady') : t('weather.growth', { n: `${growth > 1 ? '+' : ''}${Math.round((growth - 1) * 100)}%` }),
        rainy ? (scene.rainWets ? t('weather.soilWet') : t('weather.soilDry')) : null,
      ].filter(Boolean).join(' · ')

      function plant(index, speciesId, tintId) {
        const species = SPECIES_BY_ID.get(speciesId)
        if (species === undefined) return
        if (tintId === undefined && getState().coins < species.cost) {
          announce(t('error.coins'), 'warn')
          return
        }
        const next = plantAt(getState(), state.scene, index, speciesId, tintId)
        if (next === null) return
        playSound('plant')
        commit(next, true)
        setPicker(null)
        focusPlot(index, 'card')
      }

      function water(index) {
        playSound('water')
        commit(waterAt(getState(), state.scene, index), true)
      }

      function harvestEvery() {
        tick()
        const before = getState(), next = harvestAll(before, before.scene, Date.now())
        if (next === null) { announce(t('bulk.none'), 'warn'); return }
        flyTo(rootRef.current?.querySelector('.fg-grid'), rootRef.current?.querySelector('.fg-bagButton'), '🌸')
        commitDiscovered(before, next, 'harvest', 0)
        playSound(found.current ? 'gold' : 'harvest')
        announce(t('bulk.harvested', { n: next.basket.length - before.basket.length }) + (found.current ? ` · ${t('discovery.noted')}` : ''), found.current ? 'gold' : 'ok')
      }
      function greetEvery() {
        tick()
        const now = Date.now(), before = getState(), n = visitorCount(before, before.scene, now), next = greetAll(before, before.scene, now)
        if (next === null) { announce(t('bulk.nobody'), 'warn'); return }
        commitDiscovered(before, next, 'visitor', 0)
        playSound('coin')
        flyTo(rootRef.current?.querySelector('.fg-grid'), rootRef.current?.querySelector('.fg-stats .fg-chip'), '🪙')
        announce(t('bulk.greeted', { n, coins: next.coins - before.coins }) + (found.current ? ` · ${t('discovery.noted')}` : ''), found.current ? 'gold' : 'ok')
      }
      function sowEvery() {
        tick()
        const before = getState(), next = sowRandom(before, before.scene)
        if (next === null) { announce(t('bulk.none'), 'warn'); return }
        commit(next, true); playSound('plant'); setPicker(null)
        announce(t('bulk.sown', { n: (next.planted ?? 0) - (before.planted ?? 0) }), 'ok')
      }

      function waterEvery() {
        commit(waterAll(getState(), state.scene), true)
      }

      function greet(index) {
        const now = Date.now()
        const before = getState()
        const currentSlot = before.scenes[before.scene]
        const plot = currentSlot === undefined ? null : currentSlot.plots[index]
        const visitor = visitorAt(before.scene, index, plot, now, weatherAt(now), facilityLevel(before, 'hive'), gardenEcology(before, now).visitorBonus, before)
        const next = greetVisitor(before, before.scene, index, now, weatherAt(now))
        if (visitor === null || next === null) return
        const hasDiscovery = commitDiscovered(before,next,'visitor',index)
        const words = {
          name: t(`visitor.${visitor.id}`),
          coins: next.coins - before.coins,
          flower: t(`species.${plot.species}`),
        }
        const fresh = (before.visitors[visitor.id] ?? 0) === 0 ? ` ${t('visitor.new')}` : ''
        announce(t('guest.greeted', { name: words.name, coins: words.coins, effect: t(`guest.effect.${VISITOR_INFO[visitor.id].role}`) }) + fresh, 'ok')
        if (!hasDiscovery) focusPlot(index, 'harvest')
      }

      function claim(achievementId) {
        const entry = ACHIEVEMENT_BY_ID.get(achievementId)
        const next = claimAchievement(getState(), achievementId)
        if (entry === undefined || next === null) return
        commitReward(next)
        announce(t('ach.done', { name: t(`ach.${entry.id}.name`), n: entry.coins }), 'ok')
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
        commitReward(next)
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

      function harvest(index, endResidency = false) {
        if (endResidency && armed !== `retire:${state.scene}:${index}`) { setArmed(`retire:${state.scene}:${index}`); return }
        setArmed(null)
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
        const next = harvestAt(before, before.scene, index, Date.now(), weatherAt(Date.now()), endResidency)
        if (next === null) return
        flyTo(rootRef.current?.querySelector(`[data-plot="${index}"] .fg-art`),rootRef.current?.querySelector('.fg-bagButton'),'🌸')
        const hasDiscovery = commitDiscovered(before,next,'harvest',index)
        const first = next.basket[before.basket.length]
        const spirit = first?.variant === 'hidden'
        let text = spirit ? t('reward.gold', { flower: bloomName(first, t), n: 3 })
          : first?.trait ? t('reward.trait', { name: bloomName(first, t), n: traitPrice(first.trait) })
            : t(next.basket.length - before.basket.length > 1 ? 'reward.double' : 'reward.gain', { flower: bloomName(first, t), xp: species.xp })
        if (next.lastBred) {
          const [form, tint] = next.lastBred.split('~')
          text += ` · ${t('hybrid.seed', { name: t('hybrid.name', { form: t(`species.${form}`), tint: t(`species.${tint}`) }) })}`
        }
        const won = BREED_GOALS.filter(goal => next.goalsDone?.[goal.id] === true && before.goalsDone?.[goal.id] !== true)
        if (won.length > 0) text += ` · ${t('goal.achieved', { name: won.map(goal => t(`goal.${goal.id}`)).join(' / ') })}`
        const special = spirit || found.current || won.length > 0
        playSound(special ? 'gold' : 'harvest')
        announce(text + (found.current ? ` · ${t('discovery.noted')}` : ''), special ? 'gold' : 'ok', spirit ? species.id : null)
        if (!hasDiscovery) focusPlot(index, 'plant')
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

      function sell(kind) {
        const key = kind ?? 'all:all'
        if (armed !== key) {
          setArmed(key)
          return
        }
        const before = getState()
        const next = kind === undefined ? sellBasket(before, undefined, undefined, Date.now()) : sellKind(before, kind, Date.now())
        setArmed(null)
        setPreview(null)
        if (next === null) return
        const gain = next.coins - before.coins
        commit(next, true)
        playSound('coin')
        flyTo(rootRef.current?.querySelector('.fg-basket'),rootRef.current?.querySelector('.fg-stats .fg-chip'),'🪙')
        announce(t('reward.sellMany', { n: before.basket.length - next.basket.length, coins: gain }), 'ok')
        focusSection('basket')
      }

      function sellOne(item) {
        const before = getState()
        const index = before.basket.indexOf(item)
        const next = sellIndividual(before, index, Date.now())
        if (next === null) return
        commit(next, true)
        setArmed(null)
        if (!next.basket.some(bloom => itemKey(bloom) === itemKey(item))) {
          setPreview(null)
          focusSection('basket')
        }
        announce(t('reward.sell', { flower: bloomName(item, t), coins: next.coins - before.coins }))
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

      // A save file is the only copy that leaves this browser, so the export is a
      // plain JSON download and the import never replaces a garden before the
      // player confirms it.
      function exportFile() {
        const text = JSON.stringify(exportSave(getState(), Date.now()), null, 2)
        const stamp = new Date().toISOString().slice(0, 10)
        try {
          const blob = new Blob([text], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const anchor = document.createElement('a')
          anchor.href = url
          anchor.download = `flower-garden-${stamp}.json`
          anchor.rel = 'noopener'
          document.body.appendChild(anchor)
          anchor.click()
          anchor.remove()
          window.setTimeout(() => URL.revokeObjectURL(url), 1000)
          announce(t('action.exported'), 'ok')
        } catch (error) {
          announce(t('action.exportFailed'), 'warn')
        }
      }

      function pickSaveFile() {
        const input = saveInput.current
        if (input === null || input === undefined) return
        input.value = ''
        input.click()
      }

      function readSaveFile(event) {
        const file = event.target.files?.[0]
        if (file === undefined) return
        const reader = new FileReader()
        reader.onload = () => {
          let parsed = null
          try {
            parsed = JSON.parse(String(reader.result))
          } catch (error) {
            parsed = null
          }
          const restored = parsed === null ? null : importSave(parsed, Date.now())
          if (restored === null) {
            announce(t('action.importBad'), 'warn')
            return
          }
          setConfirmReset(false)
          setPendingImport(restored)
        }
        reader.onerror = () => announce(t('action.importBad'), 'warn')
        reader.readAsText(file)
        event.target.value = ''
      }

      function confirmImport() {
        if (pendingImport === null) return
        commit(pendingImport, true)
        setPendingImport(null)
        setPicker(null)
        announce(t('action.imported'), 'ok')
      }

      function onKeyDown(event) {
        if (event.key !== 'Escape' || picker === null) return
        const index = picker
        setPicker(null)
        focusPlot(index, 'plant')
      }

      // Keep curiosities and hybrids separate, using the same quote as the sale.
      const groups = new Map()
      for (const item of state.basket) {
        const key = itemKey(item)
        if (!groups.has(key)) groups.set(key, { ...item, key, speciesId: item.species, items: [] })
        groups.get(key).items.push(item)
      }
      const basketGroups = [...groups.values()].map(group => ({ ...group, species: SPECIES_BY_ID.get(group.speciesId), count: group.items.length, worth: quoteSale(state, group.items, clock).coins }))

      const previewGroup = basketGroups.find(group => group.key === preview)
      const archive = Object.entries(state.specimens ?? {}).map(([key, item]) => ({
        ...item, key, recorded: true, species: SPECIES_BY_ID.get(item.species),
        count: !item.trait && !item.tint ? Math.max(item.count, state.seen[key] ?? 0) : item.count,
      }))
      for (const [key, count] of Object.entries(state.seen)) {
        const [speciesId, variant] = key.split(':')
        if (count > 0 && !archive.some(entry => entry.key === key)) archive.push({ key, species: SPECIES_BY_ID.get(speciesId), variant, count })
      }
      for (const [key, count] of Object.entries(state.exotics ?? {})) {
        const [speciesId, trait] = key.split(':')
        if (count > 0 && !archive.some(entry => entry.species.id === speciesId && entry.trait === trait)) archive.push({ key: `trait:${key}`, species: SPECIES_BY_ID.get(speciesId), variant: 'base', trait, count })
      }
      for (const [key, count] of Object.entries(state.hybrids ?? {})) {
        const [speciesId, tint] = key.split('~')
        if (count > 0 && !archive.some(entry => entry.species.id === speciesId && entry.tint === tint)) archive.push({ key: `hybrid:${key}`, species: SPECIES_BY_ID.get(speciesId), variant: 'base', tint, count })
      }
      const codexPreviewEntry = archive.find(entry => entry.key === codexPreview) ?? (() => {
        const [speciesId, variant] = (codexPreview ?? '').split(':')
        const species = SPECIES_BY_ID.get(speciesId)
        return species && variant === 'base' ? { key: codexPreview, species, variant: 'base', count: 0 } : undefined
      })()
      function stepCodex(delta) {
        const guide = SPECIES.map(species => `${species.id}:base`)
        const at = Math.max(0, guide.indexOf(`${codexPreviewEntry.species.id}:base`))
        setCodexPreview(guide[(at + delta + guide.length) % guide.length])
      }
      function renderArchive() {
        return h('div', { className: 'fg-archive' },
          h('h3', { className: 'fg-sectionTitle' }, t('trait.title')),
          h('p', { className: 'fg-hint' }, t('trait.note')),
          h('p', { className: 'fg-hint' }, t('trait.boundary')),
          h('details', { className: 'fg-ecoDetails' }, h('summary', null, t('trait.guide')),
            h('div', { className: 'fg-archiveGrid' }, TRAITS.filter(trait=>trait.source).map(trait=>h('article',{key:trait.id,className:'fg-ecoProject'},
              h(FlowerArt,{speciesId:trait.specimen,stage:'bloom',variant:'base',trait:trait.id}),
              h('strong',null,traitLabel(trait.id, t)),h('p',{className:'fg-hint'},t(`trait.${traitFactId(trait.id)}.fact`)),h('p',{className:'fg-hint'},traitCauseText(trait.id, t)),
              h('a',{href:trait.source,target:'_blank',rel:'noopener noreferrer',className:'fg-source'},t('trait.source')))))),
          h('div', { className: 'fg-basket' }, TRAITS.map(trait => h('span', { key: trait.id, className: 'fg-badge', title: traitCauseText(trait.id, t) }, traitLabel(trait.id, t), ' · ', t(`trait.${trait.id}.clue`)))),
          h('p', { className: 'fg-hint' }, t('hybrid.how')),
          h('div', { className: 'fg-archiveGrid' }, archive.filter(entry => (entry.trait || entry.tint) && guideScene.species.includes(entry.species.id)).map(entry =>
            h('button', { key: entry.key, type: 'button', className: 'fg-archiveEntry', 'data-codex': entry.key, onClick: () => { rememberOpener(); setCodexPreview(entry.key) } },
              h(FlowerArt, { speciesId: entry.species.id, stage: 'bloom', variant: entry.variant, trait: entry.trait, tint: entry.tint, dna: entry.dna }),
              h('span', null, bloomName({ species: entry.species.id, trait: entry.trait, tint: entry.tint }, t)),
              h('span', { className: 'fg-note' }, t(entry.recorded ? 'card.recorded' : 'codex.harvests', { n: entry.count }))))))
      }

      function tend(action, index) {
        tick()
        const before = getState(), now = Date.now()
        const transition = action === 'retain' ? retainAt : action === 'observe' ? observeAt : rebloomAt
        const next = transition(before, state.scene, index, now)
        if (!next) { announce(t('eco.error'), 'warn'); return }
        if(action==='retain')commitDiscovered(before,next,'retain',index);else commit(next,true)
        const plot = next.scenes[state.scene].plots[index]
        announce(t(action === 'retain' ? 'eco.retained' : action === 'observe' ? 'eco.observed' : 'eco.rebloomed', { name: t(`species.${plot.species}`), n: next.study?.[plot.species]?.observations ?? 0 }))
      }

      function renderResidentActions(plot, index, species) {
        const mature = plot.growthMs >= growMsOf(species)
        const wait = plot.observedAt === undefined ? 0 : Math.max(0, plot.observedAt + ECO_OBSERVE_MS - clock)
        const fee = researchFee(state, species), prune = researchFee(state, species, true)
        return h('div', { className: 'fg-residentActions' },
          h('button', { type: 'button', className: 'fg-btn fg-btnSmall', disabled: plot.moisture >= 99.5, onClick: () => water(index) }, t('plot.water')),
          h('button', { type: 'button', className: 'fg-btn fg-btnSmall fg-btnPrimary', disabled: !mature || plot.moisture < 30 || wait > 0 || state.coins < fee, onClick: () => tend('observe',index) }, t('eco.observe',{n:fee})),
          mature && plot.observedAt !== undefined ? h('button', { type: 'button', className: 'fg-btn fg-btnSmall', disabled: state.coins < prune, title: t('eco.rebloomNote'), onClick: () => tend('rebloom',index) }, t('eco.rebloom',{n:prune})) : null,
          h('span', { className: 'fg-hint' }, t('eco.observations',{n:state.study?.[species.id]?.observations??0})),
          wait > 0 ? h('span',{className:'fg-hint'},t('eco.cooldown',{n:formatDuration(wait,t)})) : null,
          plot.moisture < 30 ? h('span',{className:'fg-noteWarn'},t('eco.needWater')) : null)
      }

      /** Use a supply from the hotbar on one plot (drag-and-drop, or click the slot and then the plot). */
      function applyItem(id, index) {
        setTool(null)
        if (id === 'sprinkler') { sprinkle(); return }
        if (id === 'charm') { armCharm(); return }
        tick()
        const before = getState()
        const plot = before.scenes[before.scene]?.plots[index]
        const next = id === 'fertilizer' ? fertilizeAt(before, before.scene, index) : compostAt(before, before.scene, index)
        if (next === null) { announce(t('bar.cannot', { item: t(`item.${id}`) }), 'warn'); return }
        commit(next, true)
        playSound('plant')
        announce(id === 'fertilizer'
          ? t('item.fertilized', { flower: t(`species.${plot.species}`) })
          : t('item.composted', { n: index + 1, soil: Math.round(soilOf(next.scenes[before.scene], index)) }), 'ok')
      }
      function plotDrop(index) {
        return {
          'data-target': tool ? 'true' : undefined,
          onDragOver: event => { if (dragging.current) event.preventDefault() },
          onDrop: event => { const id = dragging.current; dragging.current = null; if (!id) return; event.preventDefault(); applyItem(id, index) },
          onClick: tool ? event => { if (!event.target.closest('button,select,a')) applyItem(tool, index) } : undefined,
        }
      }

      function renderSoil(index) {
        const soil = Math.round(soilOf(slot, index))
        return h('div', { className: 'fg-row', title: t('soil.tip') },
          h('span', { className: soil < 40 ? 'fg-note fg-noteWarn' : 'fg-note' }, t('soil.label', { n: soil })),
          (state.bag.compost ?? 0) > 0 && soil < 100 ? h('button', {
            type: 'button', className: 'fg-btn fg-btnSmall', 'data-action': 'compost',
            onClick: () => {
              tick()
              const next = compostAt(getState(), state.scene, index)
              if (next === null) return
              commit(next, true)
              announce(t('item.composted', { n: index + 1, soil: Math.round(soilOf(next.scenes[state.scene], index)) }))
            },
          }, t('item.compost')) : null,
        )
      }

      function renderSeedPicker(index) {
        const cheapest = sceneSpecies.reduce((min, species) => Math.min(min, species.cost), Infinity)
        const short = state.coins < cheapest
        return h('div', { className: 'fg-seeds' },
          h('div', { className: 'fg-seedsHead' }, t('seed.pick')),
          short ? h('div', { className: 'fg-seedHint' }, t('error.coins')) : null,
          h('div', { className: 'fg-seedGrid' },
            Object.entries(state.seeds ?? {}).filter(([key, count]) => count > 0 && scene.species.includes(key.split('~')[0])).map(([key, count]) => {
              const [form, tint] = key.split('~')
              return h('button', { key, type: 'button', className: 'fg-seed', 'data-action': 'seed', onClick: () => plant(index, form, tint) },
                h('span', { className: 'fg-seedName' }, t('hybrid.name', { form: t(`species.${form}`), tint: t(`species.${tint}`) })),
                h('span', { className: 'fg-seedMeta' }, t('hybrid.free', { n: count })))
            }),
            sceneSpecies.map(species => h('button', {
              key: species.id,
              type: 'button',
              className: 'fg-seed',
              'data-action': 'seed',
              disabled: state.coins < species.cost,
              title: `${t(`species.${species.id}`)} · ${t(`eco.role.${ecoProfile(species.id).role}`)} · ${t('eco.affinity',{name:t(`visitor.${ecoProfile(species.id).visitor}`)})} · ${formatDuration(growMsOf(species), t)}`,
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
            'data-plot': index, ...plotDrop(index),
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
            'data-plot': index, ...plotDrop(index),
            role: 'group',
            tabIndex: -1,
            'aria-label': `${t('plot.empty')} #${position}`,
          },
          h('div', { className: 'fg-art' }, EmptyArt()),
          h('div', { className: 'fg-plotHead' },
            h('span', { className: 'fg-species' }, t('plot.empty')),
            h('span', { className: 'fg-stage' }, `#${position}`),
          ),
          renderSoil(index),
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
        const dryInMs = (plot.moisture / 100) * (plot.resident ? 45 * 60 * 1000 : growMs * DRY_SHARE)
        const growLeftMs = (growMs - plot.growthMs) / (growth * soilFactor(soilOf(slot, index)))
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
        const visitor = visitorAt(state.scene, index, plot, clock, weather, facilityLevel(state, 'hive'), gardenEcology(state, clock).visitorBonus, state)

        return h('div', {
          key: index,
          className: 'fg-plot',
          'data-state': stage,
          'data-variant':plot.variant,
          'data-trait':plot.trait,
          'data-plot': index, ...plotDrop(index),
          'data-paused': wet ? 'false' : 'true',
          role: 'group',
          tabIndex: -1,
          'aria-label': `${bloomName({...plot,variant:plot.variant??'base'},t)} ${t(`stage.${stage}`)}`,
        },
        h('div', { className: 'fg-art' },
          h(FlowerArt, { speciesId: plot.species, stage, variant: (plot.resident || plot.identified) ? plot.variant : plot.tint ? 'base' : plotVariant(species, index), dna: plot.dna, trait: plot.trait, tint: plot.tint }),
          visitor === null ? null : h('button', {
            type: 'button',
            className: 'fg-visitor',
            'data-action': 'greet',
            'data-visitor': visitor.id,
            title: t('visitor.greet', { name: t(`visitor.${visitor.id}`) }),
            'aria-label': t('visitor.greet', { name: t(`visitor.${visitor.id}`) }),
            onClick: () => {
              greet(index)
            },
          }, h(VisitorArt, { id: visitor.id })),
        ),
        h('div', { className: 'fg-plotHead' },
          h('span', { className: 'fg-species' }, t(`species.${species.id}`)),
          h('span', { className: 'fg-stage' }, t(`stage.${stage}`)),
        ),
        plot.trait ? h('span',{className:'fg-badge fg-badgeWarn'},'✦ ',traitLabel(plot.trait, t)) : plot.variant==='hidden' ? h('span',{className:'fg-badge fg-badgeWarn'},'✦ ',t('variant.hidden')) : null,
        renderSoil(index),
        plot.resident ? h('span', { className: 'fg-badge fg-badgeOk' }, t('eco.resident'), ' · ', t('eco.history', { n: plot.careCount ?? 0, cycles: plot.reblooms ?? 0 })) : null,
        plot.resident ? renderResidentActions(plot, index, species) : bloomed ? h('button', { type: 'button', className: 'fg-btn fg-btnPrimary', onClick: () => tend('retain', index) }, t('eco.retain')) : null,
        plot.tint ? h('span', { className: 'fg-badge' }, t('hybrid.name', { form: t(`species.${plot.species}`), tint: t(`species.${plot.tint}`) })) : null,
        h(CrossHint, { slot, index, t }),
        plot.dried === true && !bloomed
          ? h('span', { className: 'fg-badgeWarn fg-badge' }, t('plot.driedBadge'))
          : null,
        plot.pollinated === true
          ? h('span', { className: 'fg-badgeOk fg-badge' }, t('plot.pollinated'))
          : null,
        h('div', {
          className: 'fg-meter',
          role: 'progressbar',
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': percent,
          'aria-label': `${bloomName({...plot,variant:plot.variant??'base'},t)} ${t(`stage.${stage}`)}`,
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
                harvest(index, plot.resident === true)
              },
            }, plot.resident ? t(armed === `retire:${state.scene}:${index}` ? 'eco.retireConfirm' : 'eco.retire') : t('plot.harvest'))
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
        const representative=state.specimens?.[`${species.id}:${showcase}`]
        return h('div', {
          key: species.id,
          className: 'fg-codexCard',
          'data-seen': known ? 'true' : 'false',
          'data-spirit': showcase === 'hidden' ? 'true' : 'false',
        },
          h('button', {
              type: 'button',
              className: 'fg-codexArt fg-codexArtBtn',
              style: known ? undefined : { filter: 'grayscale(1)', opacity: 0.55 },
              'data-codex': `${species.id}:${showcase}`,
              'aria-expanded': codexPreview === `${species.id}:${showcase}` ? 'true' : 'false',
              'aria-controls': codexPreview === `${species.id}:${showcase}` ? 'fg-codex-preview' : undefined,
              'aria-label': t('preview.open', { flower: `${t(`species.${species.id}`)} · ${t(`variant.${showcase}`)}` }),
              onClick: () => {
                showCodexEntry(species.id, showcase)
              },
            },
            h(FlowerArt, { speciesId: species.id, stage: 'bloom', variant: showcase, dna:representative?.dna, trait:representative?.trait, tint:representative?.tint }),
            ),
          h('div', { className: 'fg-codexBody' },
            h('div', { className: 'fg-codexName' }, t(`species.${species.id}`)),
            h('div', { className: 'fg-note' }, t(`eco.role.${ecoProfile(species.id).role}`)),
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

      const sceneOrder = SCENES.map(ground=>ground.id)
      // Plots the water-all button would actually change.
      const thirsty = sprinklerLeftMs > 0 || rainWets ? 0 : slot.plots.filter(plot => {
        if (plot === null || plot === undefined || plot.moisture >= 99.5) return false
        const species = SPECIES_BY_ID.get(plot.species)
        return species !== undefined && (plot.resident || plot.growthMs < growMsOf(species))
      }).length

      function renderGuest(visitor) {
        const count = state.visitors[visitor.id] ?? 0
        const met = count > 0
        const where = [
          visitor.scenes.map(id => t(`scene.${id}`)).join(' / '),
          t(`visitor.when.${visitor.when}`),
          visitor.dry === true ? t('visitor.dry') : null,
        ].filter(Boolean).join(' · ')
        return h('button', { type: 'button', key: visitor.id, className: 'fg-guest', 'data-guest': visitor.id, 'data-met': met ? 'true' : 'false', 'aria-label': t('guest.book') + ' · ' + t(`visitor.${visitor.id}`), onClick: () => openGuest(visitor.id) },
          h('span', { className: 'fg-guestArt' }, h(VisitorArt, { id: visitor.id })),
          h('div', { className: 'fg-guestBody' },
            h('div', { className: 'fg-guestName' },
              met ? t(`visitor.${visitor.id}`) : t('visitor.unknown'),
              met ? h('span', { className: 'fg-itemOwn' }, `×${count}`) : null,
              met ? h('span', { className: 'fg-hearts' }, '♥'.repeat(affinityLevel(state, visitor.id)) + '♡'.repeat(AFFINITY_LEVELS.length - affinityLevel(state, visitor.id))) : null,
              visitor.special ? h('span', { className: 'fg-badge' }, t('visitor.special')) : null,
            ),
            h('div', { className: 'fg-guestWhere', title: where }, where),
          ),
        )
      }

      function renderAchievement(entry) {
        const value = Math.min(entry.target, achievementValue(state, entry.metric))
        const claimed = state.claimed[entry.id] === true
        const ready = !claimed && value >= entry.target
        return h('div', {
          key: entry.id,
          className: 'fg-ach',
          'data-state': claimed ? 'claimed' : ready ? 'ready' : 'open',
        },
        h('div', { className: 'fg-achBody' },
          h('div', { className: 'fg-achName' }, t(`ach.${entry.id}.name`)),
          h('div', { className: 'fg-achDesc' }, t(`ach.${entry.id}.desc`)),
          h('div', { className: 'fg-row' },
            h('div', {
              className: 'fg-meter fg-achMeter',
              role: 'progressbar',
              'aria-valuemin': 0,
              'aria-valuemax': entry.target,
              'aria-valuenow': value,
              'aria-label': t(`ach.${entry.id}.name`),
            }, h('div', { className: 'fg-meterFill', style: { width: `${(value / entry.target) * 100}%` } })),
            h('span', { className: 'fg-note fg-noteWet' }, t('ach.count', { n: value, total: entry.target })),
          ),
        ),
        claimed
          ? h('span', { className: 'fg-itemMax' }, t('ach.claimed'))
          : ready
            ? h('button', {
              type: 'button',
              className: 'fg-btn fg-btnSmall fg-btnPrimary',
              'data-action': 'claim',
              onClick: () => {
                claim(entry.id)
              },
            }, t('ach.claim', { n: entry.coins }))
            : h('span', { className: 'fg-itemMax' }, t('ach.reward', { n: entry.coins })),
        )
      }
      const sceneFound = new Map(sceneOrder.map(id => {
        const found = sceneOf(id).species.filter(speciesId => ['base', 'alt', 'hidden']
          .some(variant => (state.seen[`${speciesId}:${variant}`] ?? 0) > 0)).length
        return [id, found]
      }))

      return h('div', { className: 'fg-view', ref: rootRef, onKeyDown: onKeyDown, style: {'--fg-font-size':`${ui.fontSize}px`,'--fg-font-family':fontFamilies[ui.font]}, 'data-tab':activeTab, 'data-scene':state.scene },
        h('style', { key: 'fg-style' }, CSS),
        h('div', { className: 'fg-topbar' },
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
              featured === null ? null : h('span', {
                className: 'fg-chip fg-chipMarket',
                title: t('market.note', { flower: t(`species.${featured}`), n: marketPercent }),
              },
              h(BloomDot, { speciesId: featured }),
              h('span', { className: 'fg-chipKey' }, t('market.title')),
              h('span', { className: 'fg-chipValue' }, t(`species.${featured}`)),
              h('span', { className: 'fg-chipKey' }, t('market.bonus', { n: marketPercent })),
              ),
              h('time',{className:'fg-liveClock',dateTime:new Date(clock).toISOString(),title:t('clock.note')},
                h('strong',null,clockInfo.time),h('span',null,t(`clock.${clockInfo.period}`)),h('small',null,clockInfo.date,' · ',clockInfo.zone)),
              h('span', { className: 'fg-chip', 'data-weather': weather },
                h(WeatherGlyph, { kind: weather }),
                h('span', { className: 'fg-chipValue' }, t(`weather.${scene.id}.${weather}`)),
                h('span', { className: 'fg-chipKey' }, t('weather.left', { n: weatherLeft })),
              ),
            ),
          ),

          h('div',{className:'fg-toolbar'},
            h('div',{className:'fg-tabs',role:'tablist','aria-label':t('tabs.label')},TAB_GROUP_IDS.map(group=>h('button',{
              key:group,id:`fg-group-${group}`,type:'button',role:'tab','aria-selected':activeGroup===group,'aria-controls':`fg-panel-${lastSection.current[group]??TAB_GROUPS[group][0]}`,tabIndex:activeGroup===group?0:-1,
              className:'fg-tab',onClick:()=>selectGroup(group),onKeyDown:event=>tabKeys(event,group)},h('span',{className:'fg-tabIcon','aria-hidden':true},TAB_ICONS[group]),t(`tabs.group.${group}`),group==='bag'?` ${state.basket.length}/${capacity}`:group==='tasks'&&state.orders.some(order=>orderReady(state,order))?' •':null))),
            h('button',{type:'button',className:activeTab==='settings'?'fg-btn fg-btnSmall fg-gear fg-btnPrimary':'fg-btn fg-btnSmall fg-gear',id:'fg-tab-settings','aria-pressed':activeTab==='settings','aria-label':t('tabs.settings'),title:t('tabs.settings'),onClick:()=>selectTab(activeTab==='settings'?(lastSection.current.garden??'garden'):'settings')},'⚙️'),
            h('button',{type:'button',className:'fg-btn fg-btnSmall',title:t('mini.note'),onClick:openMini},t('mini.open')),
            h('button',{type:'button',className:'fg-btn fg-btnSmall fg-bagButton',onClick:()=>{rememberOpener();setInventoryOpen(true)}},t('inventory.open',{n:inventoryCount(state)+state.basket.length})),
            (state.discoveries??[]).length?h('button',{type:'button',className:'fg-btn fg-btnSmall fg-latestDiscovery',onClick:()=>{rememberOpener();setDiscovery(state.discoveries[state.discoveries.length-1])}},t('discovery.return')):null,
            h('label',{className:'fg-quickSize'},t('settings.size'),h('select',{'aria-label':t('settings.size'),value:ui.fontSize,onChange:event=>updateUi({fontSize:Number(event.target.value)})},[13,15,17,19].map(size=>h('option',{key:size,value:size},`${size}px`)))))),
        h('div',{className:'fg-scroll',ref:scrollRef},
          away && activeTab === 'garden' ? h(AwayCard, { report: away, t, onClose: () => { clearAway(); setAway(null) } }) : null,
          activeTab === 'garden' ? h(Shelf, { state, t, compact: true }) : null,
          h(EventBanner, { state, t, clock, hidden: activeTab !== 'garden', onJoin: (next, text) => { commit(next, true); playSound('gold'); announce(text, 'gold') } }),
          h(TodayCard, { state, t, clock, hidden: activeTab !== 'garden', onChange: commitReward, onJump: id => selectTab(id) }),
          h('div', { className: 'fg-scenes', hidden: activeTab !== 'garden', role: 'group', 'aria-label': t('plot.section') },
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

          h('div', { className: 'fg-tipRow', hidden: activeTab !== 'garden' },
            h('span', { className: 'fg-hintWeather' }, weatherNote),
            h(SeasonChip, { t, clock, sceneId: state.scene }),
            h(InfoTip, { t, lines: [t('hint.body'), t('soil.tip'), t('hybrid.how')] }),
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

          panel('garden',
 h('section', {className:'fg-section fg-ground fg-landscape','data-period':clockInfo.period,'data-scene':scene.id,style:{borderColor:scene.edge}},
           h('div',{className:'fg-gardenBackdrop',style:{backgroundColor:PANORAMA_GROUND[scene.id],backgroundImage:clockInfo.period==='night'?'linear-gradient(#08101dcc,#08101dcc)':'linear-gradient(#20363e45,#20363e45)'}},h(ScenePanorama,{sceneId:scene.id,period:clockInfo.period,weather,garden:true})),
           h('div',{className:'fg-gardenContent'},
           h('header',{className:'fg-gardenHeading'},
             h('div',{className:'fg-landscapeCaption'},h('span',null,t(`scene.${scene.id}`)),h('strong',null,t(`clock.${clockInfo.period}`)),h('span',null,t(`weather.${scene.id}.${weather}`))),
             h('div',{className:'fg-landscapeTime'},h('strong',null,clockInfo.time),h('span',null,clockInfo.date,' · ',clockInfo.zone))),
           h('div',{className:'fg-gardenBar'},
             h(QuickBar, { state, t, tool, onPick: id => setTool(current => (current === id ? null : id)), onUse: id => applyItem(id, 0), onDragItem: id => { dragging.current = id } }),
             sprinklerLeftMs > 0 ? h('span', { className: 'fg-sectionOk' }, t('item.sprinklerLeft', { n: formatDuration(sprinklerLeftMs, t) })) : null,
             ripeCount(slot) > 0 ? h('button', { type: 'button', className: 'fg-btn fg-btnSmall fg-btnPrimary', 'data-action': 'harvestAll', onClick: harvestEvery }, t('bulk.harvest', { n: ripeCount(slot) })) : null,
             visitorCount(state, state.scene, clock) > 0 ? h('button', { type: 'button', className: 'fg-btn fg-btnSmall fg-btnPrimary', 'data-action': 'greetAll', onClick: greetEvery }, '👋 ', t('bulk.greet', { n: visitorCount(state, state.scene, clock) })) : null,
             emptyCount(slot) > 0 ? h('button', { type: 'button', className: 'fg-btn fg-btnSmall', 'data-action': 'sowAll', onClick: sowEvery }, '🎲 ', t('bulk.sow', { n: emptyCount(slot) })) : null,
             thirsty > 1 ? h('button', { type: 'button', className: 'fg-btn fg-btnSmall fg-headAction', 'data-action': 'waterAll', onClick: waterEvery }, t('plot.waterAll', { n: thirsty })) : null),
           h('div', { className: 'fg-grid' }, slot.plots.map(renderPlot)),
           ))
          ),
          panel('basket',
h(WantedBoard, { state, t, clock, onChange: commitReward }),
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
                    sell()
                  },
                }, armed === 'all:all' ? t('basket.confirm', { n: basketValueNow }) : t('basket.sellAll', { n: basketValueNow }))
                : null,
            ),
            basketGroups.length > 0 ? h(InfoTip, { t, lines: [t('basket.pricing')] }) : null,
            basketGroups.length === 0
              ? h('p', { className: 'fg-empty' }, t('basket.empty'))
              : [
                h('div', { className: 'fg-basket', key: 'chips' },
                  basketGroups.map(group => {
                    const key = group.key
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
                        flower: `${bloomName(group.items[0], t)} · ${t(`variant.${group.variant}`)}`,
                      }),
                      onClick: () => {
                        showBloom(group.key)
                      },
                    },
                    (group.variant === 'hidden' || group.trait || group.tint)
                      ? h('span', { className: 'fg-bloomArt' },
                        h(FlowerArt, { speciesId: group.species.id, stage: 'bloom', variant: group.variant, dna: group.dna, trait: group.trait, tint: group.tint }),
                        )
                      : h(BloomDot, { speciesId: group.species.id, variant: group.variant }),
                    h('span', { className: 'fg-bloomName' }, bloomName(group.items[0], t)),
                    group.variant === 'hidden' ? h('span', { className: 'fg-goldTag' }, t('variant.goldTag')) : null,
                    group.species.id === featured ? h('span', { className: 'fg-marketTag' }, t('market.tag')) : null,
                    glutSteps(state, group.species.id, clock) > 0 ? h('span', {
                      className: 'fg-noteWarn',
                      title: t('glut.note', { n: Math.round((1 - glutFactor(glutSteps(state, group.species.id, clock))) * 100) }),
                    }, t('glut.tag', { n: Math.round((1 - glutFactor(glutSteps(state, group.species.id, clock))) * 100) })) : null,
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
                  dna: previewGroup.dna, trait: previewGroup.trait, tint: previewGroup.tint,
                  individuals: previewGroup.items, onSellOne: sellOne, quoteOne: item => quoteSale(state, [item], clock).coins,
                  t,
                  meta: [
                    `×${previewGroup.count}`,
                    t('basket.first', { n: quoteSale(state, [previewGroup.items[0]], clock).coins }),
                    previewGroup.species.id === featured ? `${t('market.title')} · ${t('market.bonus', { n: marketPercent })}` : null,
                    t('basket.total', { n: previewGroup.worth }),
                  ],
                  worth: previewGroup.worth,
                  armed: armed === previewGroup.key,
                  onSell: () => {
                    sell(previewGroup.key)
                  },
                  onClose: () => {
                    const key = previewGroup.key
                    setPreview(null)
                    setArmed(null)
                    focusTarget(`[data-basket="${key}"]`)
                  },
                }),
              ],
          ),
          ),
          panel('studio',
          h(ArrangeTable, { state, t, clock, onChange: commitReward }),
          h(Workshop, { state, t, clock, onChange: commitReward })
          ),
          panel('album',
          h(Album, { state, t, onChange: commitReward })
          ),
          panel('orders',
h('section', { className: 'fg-section' },
            h('div', { className: 'fg-sectionHead' },
              h('h3', { className: 'fg-sectionTitle', 'data-focus': 'orders', tabIndex: -1 }, t('order.title')),
            ),
            state.orders.length === 0
              ? h('p', { className: 'fg-empty' }, t('order.empty'))
              : h('div', { className: 'fg-orders' }, state.orders.map(renderOrder)),
          ),
h(ExpeditionBoard, { state, t, clock, onChange: commitReward }),
h(SpecialCommissionBoard, { state, t, clock, onChange: commitReward, onSpecies: openGuide, onVisitor: openGuest })
          ),
          panel('ecology',
h(GardenEcology, { state, t, clock, onChange: commitReward, onSpecies: openGuide })
          ),
          panel('show',
h(GardenActivities, { state, t, clock, onChange: commitReward }),
h(Contest, { state, t, clock, onChange: commitReward })
          ),
          panel('shop',
h(FundBoard, { state, t, onChange: commitReward }),
h('section',{className:'fg-section fg-inventorySection'},h('h2',{className:'fg-sectionTitle'},t('inventory.title')),h(InventoryContents,{state,t})),
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
          )
          ),
          panel('flowers',
 h(BreedingGoals, { state, t }),
 h('section',{className:'fg-section'},h('h2',{className:'fg-sectionTitle'},t('regions.title')),h('p',{className:'fg-hint'},t('regions.note')),
 h('div',{className:'fg-regionCards'},SCENES.map(region=>h('article',{key:region.id,className:'fg-regionCard','data-current':guideRegion===region.id},
   h(ScenePanorama,{sceneId:region.id,period:clockInfo.period,weather:'clear'}),h('h3',null,t(`scene.${region.id}`)),
   (state.scenes[region.id]?.unlocked??0)===0?h('span',{className:'fg-note'},t('regions.locked',{n:region.cost})):null,
   h('button',{type:'button',className:'fg-btn',onClick:()=>{setGuideRegion(region.id);setCodexOpen(true)}},t('regions.flowers',{n:region.species.length})),
   h('button',{type:'button',className:'fg-btn fg-btnGhost',onClick:()=>{selectTab('garden',true);if(state.scenes[region.id].unlocked>0)openScene(region.id);else setArmed(`scene:${region.id}`)}},t('regions.grow')))))),
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
            h('span', { className: 'fg-sectionTitle' }, `${t('codex.title')} · ${t(`scene.${guideScene.id}`)}`),
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
                    w: t(`weather.${guideScene.id}.${guideScene.rainWets ? 'rain' : 'clear'}`),
                  }), ' · ', t('codex.otherGround')),
                ),
                guideScene.species.map(id=>renderCodexCard(SPECIES_BY_ID.get(id))),
                renderArchive(),

              )
              : null,
          )
          ),
          panel('visitors',
h('section', { className: 'fg-section' },
            h('div', { className: 'fg-sectionHead' },
              h('h3', { className: 'fg-sectionTitle' }, t('guest.book')),
              h('span', { className: 'fg-sectionMeta' }, t('ach.count', { n: metKinds, total: VISITORS.length })),
            ),
            h(AffinityBoard, { state, t, onChange: commitReward }),
            h(CompanionBoard, { state, t, onChange: commitReward }),
            h('p', { className: 'fg-empty' }, t('guest.boundary')),
            h('div', { className: 'fg-guests' }, VISITORS.map(renderGuest)),
          )
          ),
          panel('settings',
h('section',{className:'fg-section'},h('h2',{className:'fg-sectionTitle'},t('discovery.history')),h('p',{className:'fg-hint'},t('discovery.historyNote')),
 (state.discoveries??[]).length?h('div',{className:'fg-discoveryHistory'},state.discoveries.slice().reverse().map(entry=>h('button',{type:'button',key:entry.id,className:'fg-btn',onClick:()=>{rememberOpener();setDiscovery(entry)}},new Date(entry.at).toLocaleString(),' · ',entry.items.map(item=>item.type==='visitor'?t(`visitor.${item.visitor}`):bloomName(item,t)).join(' / ')))):h('p',{className:'fg-hint'},t('discovery.empty'))),
h(LegacyBoard, { state, t, onStart: () => { const next = startLegacy(getState(), Date.now()); if (next === null) return; commit(next, true); playSound('gold'); announce(t('legacy.done'), 'gold') } }),
h('section',{className:'fg-section fg-settings'},
 h('h2',{className:'fg-sectionTitle'},t('settings.title')),
 h('label',{className:'fg-settingRow'},t('settings.size'),h('select',{value:ui.fontSize,onChange:event=>updateUi({fontSize:Number(event.target.value)}),className:'fg-btn'},[13,15,17,19].map(size=>h('option',{key:size,value:size},`${size}px`)))),
 h('label',{className:'fg-settingRow'},t('settings.font'),h('select',{value:ui.font,onChange:event=>updateUi({font:event.target.value}),className:'fg-btn'},['system','serif','rounded'].map(font=>h('option',{key:font,value:font},t(`settings.${font}`))))),
 h('label',{className:'fg-settingRow'},t('settings.sound'),h('input',{type:'checkbox',checked:ui.sound,onChange:event=>updateUi({sound:event.target.checked})})),
 h('p',{className:'fg-fontPreview'},t('settings.preview')),h('p',{className:'fg-hint'},t('settings.note'))),
h('section', { className: 'fg-section' },
            h('button', {
              type: 'button',
              className: 'fg-codexToggle',
              id: 'fg-ach-toggle',
              'aria-expanded': achOpen ? 'true' : 'false',
              'aria-controls': 'fg-ach',
              onClick: () => {
                setAchOpen(value => !value)
              },
            },
            h('span', { className: 'fg-sectionTitle' }, t('ach.title')),
            h('span', { className: 'fg-sectionMeta' }, t('ach.count', {
              n: ACHIEVEMENTS.filter(entry => state.claimed[entry.id] === true).length,
              total: ACHIEVEMENTS.length,
            })),
            readyAchievements.length > 0
              ? h('span', { className: 'fg-sectionOk' }, t('ach.ready', { n: readyAchievements.length }))
              : null,
            h('span', { className: 'fg-caret', 'data-open': achOpen ? 'true' : 'false' }, '▾'),
            ),
            // Collapsed, the list still surfaces whatever is waiting to be collected.
            achOpen || readyAchievements.length > 0
              ? h('div', { className: 'fg-achs', id: 'fg-ach', role: 'region', 'aria-labelledby': 'fg-ach-toggle' },
                (achOpen ? ACHIEVEMENTS : readyAchievements).map(renderAchievement))
              : null,
          ),
h('footer', { className: 'fg-footer' },
            h('div', { className: 'fg-save' },
              h('button', { type: 'button', className: 'fg-btn fg-btnGhost', id: 'fg-export', onClick: exportFile }, t('action.export')),
              h('button', { type: 'button', className: 'fg-btn fg-btnGhost', id: 'fg-import', onClick: pickSaveFile }, t('action.import')),
              h('input', {
                ref: saveInput,
                type: 'file',
                accept: 'application/json,.json',
                className: 'fg-fileInput',
                tabIndex: -1,
                'aria-hidden': 'true',
                onChange: readSaveFile,
              }),
            ),
            pendingImport === null
              ? null
              : h('div', { className: 'fg-savePending', id: 'fg-import-confirm', role: 'alertdialog', 'aria-label': t('action.importReview') },
                h('span', { className: 'fg-saveAsking' }, t('action.importReview')),
                h('button', { type: 'button', className: 'fg-btn fg-btnDanger', id: 'fg-import-confirm-yes', onClick: confirmImport }, t('action.importYes')),
                h('button', { type: 'button', className: 'fg-btn fg-btnGhost', id: 'fg-import-cancel', onClick: () => setPendingImport(null) }, t('action.importNo')),
              ),
            h('button', {
              type: 'button',
              className: confirmReset ? 'fg-btn fg-btnDanger' : 'fg-btn fg-btnGhost',
              id: 'fg-reset',
              onClick: reset,
            }, confirmReset ? t('action.resetConfirm') : t('action.reset')),
          )
          ),
          codexPreviewEntry === undefined ? null : h(BloomPreview, {
                  key: 'codex-preview',
                  id: 'fg-codex-preview',
                  speciesId: codexPreviewEntry.species.id,
                  variant: codexPreviewEntry.variant,
                  trait: codexPreviewEntry.trait, tint: codexPreviewEntry.tint, dna: codexPreviewEntry.dna,
                  observations: state.study?.[codexPreviewEntry.species.id]?.observations ?? 0,
                  modal: true, allowSpecimen:true, onPrev: () => stepCodex(-1), onNext: () => stepCodex(1),
                  t,
                  meta: [
                    t(`variant.${codexPreviewEntry.variant}`),
                    t(codexPreviewEntry.recorded && (codexPreviewEntry.trait || codexPreviewEntry.tint) ? 'card.recorded' : 'codex.harvests', { n: codexPreviewEntry.count }),
                    codexPreviewEntry.trait ? t('card.traitHistory', { n: state.exotics[`${codexPreviewEntry.species.id}:${codexPreviewEntry.trait}`] ?? 0 }) : null,
                    codexPreviewEntry.tint ? t('card.hybridHistory', { n: state.hybrids[`${codexPreviewEntry.species.id}~${codexPreviewEntry.tint}`] ?? 0 }) : null,
                  ],
                  onClose: () => {
                    const key = codexPreviewEntry.key
                    setCodexPreview(null)
                    restoreOpener()
                  },
                }),

          reward ? h(RewardDialog,{reward,state,t,onClose:()=>{setReward(null);restoreOpener()},onBag:()=>{setReward(null);setInventoryOpen(true)}}) : null,
          inventoryOpen ? h(InventoryDialog,{state,t,clock,onClose:()=>{setInventoryOpen(false);restoreOpener()},onGarden:()=>{setInventoryOpen(false);selectTab('garden',true)},onShop:()=>{setInventoryOpen(false);selectTab('shop',true)},
            onSell:key=>{const before=getState(),next=sellKind(before,key,Date.now());if(next===null)return;commit(next,true);playSound('coin');announce(t('reward.sellMany',{n:before.basket.length-next.basket.length,coins:next.coins-before.coins}),'ok')},
            onUse:id=>{if(id==='perfume'){tick();const next=sprayPerfume(getState(),Date.now());if(next===null){announce(t('goods.sprayBusy'),'warn');return}commit(next,true);playSound('plant');announce(t('goods.sprayed'),'ok');return}if(id==='sprinkler')sprinkle();else armCharm()},
            onUseBloom:key=>{tick();const before=getState(),at=before.basket.findIndex(item=>itemKey(item)===key),item=before.basket[at];if(!item)return;const next=useBloom(before,at,Date.now());if(next===null){announce(t('use.cannot',{flower:bloomName(item,t)}),'warn');return}commit(next,true);playSound('plant');announce(t('use.done',{flower:bloomName(item,t),effect:t('use.'+flowerUse(item.species)+'.note').replace(/^[^：:]*[：:]\s*/u,'')}),'ok')},
            onKeep:key=>{const before=getState(),next=pressCard(before,before.basket.findIndex(item=>itemKey(item)===key),Date.now());if(next===null){announce(t('album.full'),'warn');return}commit(next,true);playSound('plant');announce(t('album.kept'),'ok')},
            onOpenBloom:key=>{setInventoryOpen(false);selectTab('basket');setPreview(key)}}) : null,
          discovery ? h(DiscoveryCard,{entry:discovery,t,onClose:()=>{setDiscovery(null);restoreOpener()},onOpen:openDiscovered}) : null,
          guestPreview ? h(VisitorPreview, { key: guestPreview, visitorId: guestPreview, state, t, onClose: () => { setGuestPreview(null); restoreOpener() } }) : null,

        ),
      )
    }


// Workshop goods on a shelf, and their copy.
const GOODS_ICON = { dried: '🌾', tea: '🍵', perfume: '🧴' }
Object.assign(zh, {
  'item.dried':'干花', 'item.tea':'花茶', 'item.perfume':'香水',
  'item.dried.note':'插花时加一枝，花束多一颗星，最多五星',
  'item.tea.note':'在访客图鉴的好感里请一位访客喝，好感 +8',
  'item.perfume.note':'喷洒后全花园访客出现率 +15%，持续 30 分钟',
  'goods.keep':'收下{name}', 'goods.sell':'卖掉 · +{n}', 'goods.spray':'喷洒香水', 'goods.sprayed':'花园里香起来了，访客会多起来',
  'goods.sprayBusy':'香气还没散，或者手里没有香水', 'goods.scentLeft':'香气还剩 {n}',
  'goods.dried':'加一枝干花 · +1★ · 有 {n} 枝', 'goods.teaServe':'请喝花茶 · 好感 +8 · 有 {n} 杯', 'goods.teaServed':'{name}喝了花茶，好感 +{n}',
})
Object.assign(en, {
  'item.dried':'Dried flowers', 'item.tea':'Flower tea', 'item.perfume':'Perfume',
  'item.dried.note':'Add a sprig while arranging for one more star, up to five',
  'item.tea.note':'Serve it to a visitor under Visitor bonds for +8 bond',
  'item.perfume.note':'Spray it for +15% visitor chance across the garden for 30 minutes',
  'goods.keep':'Keep the {name}', 'goods.sell':'Sell · +{n}', 'goods.spray':'Spray perfume', 'goods.sprayed':'The garden smells sweet; more visitors will come',
  'goods.sprayBusy':'The scent has not faded yet, or there is no perfume', 'goods.scentLeft':'Scent lasts {n}',
  'goods.dried':'Add a dried sprig · +1★ · {n} left', 'goods.teaServe':'Serve tea · +8 bond · {n} left', 'goods.teaServed':'{name} enjoyed the tea: bond +{n}',
})
zh['work.rules'] += '成品做好后可以收下当物品用：干花给花束加一颗星，花茶请访客喝涨 8 点好感，香水让全花园访客多起来；也可以照旧直接卖掉。等不及可以用 1 条绶带让一件成品立刻完成。'
en['work.rules'] += ' A finished product can be kept and used: dried flowers add a star to a bouquet, tea gives a visitor 8 bond, perfume brings more visitors; or sell it as before. One ribbon finishes a job at once.'
zh['trip.rules'] += '委托声望每满 10 点，小队多带回一样东西，最多三样。赶时间可以用 1 条绶带让小队立刻回来。'
en['trip.rules'] += ' Every 10 points of commission reputation adds one more find, up to three. In a hurry, 1 ribbon brings the party back at once.'

function GoodsShelf({ state, t, clock, onChange }) {
  const scentLeft = scentBonus(state, clock) > 0 ? state.scent.until - clock : 0
  return h('div', { className: 'fg-goods', id: 'fg-goods' }, GOODS.map(id =>
    h('div', { key: id, className: 'fg-good', 'data-good': id, 'data-have': goodsCount(state, id) > 0 ? 'true' : 'false' },
      h('span', { className: 'fg-goodsIcon', 'aria-hidden': true }, GOODS_ICON[id]),
      h('strong', null, t(`item.${id}`), ' ×', goodsCount(state, id)),
      h('span', { className: 'fg-note' }, t(`item.${id}.note`)),
      id !== 'perfume' ? null : scentLeft > 0
        ? h('span', { className: 'fg-questChip', 'data-tone': 'gold' }, t('goods.scentLeft', { n: formatDuration(scentLeft, t) }))
        : h('button', { type: 'button', className: 'fg-btn fg-btnSmall fg-btnPrimary', 'data-action': 'goodsSpray', disabled: goodsCount(state, 'perfume') <= 0,
          onClick: () => { tick(); const next = sprayPerfume(getState(), Date.now()); if (next !== null) onChange(next) } }, t('goods.spray')))))
}
    // ---------------------------------------------------------------------
    // §7 Stylesheet. Rendered as a React element so unmounting the view
    //    removes it; only `--dsw-alias-*` tokens carry furniture colors.
    // ---------------------------------------------------------------------
    const BASE_CSS = `
.fg-flowerLiving>.fg-plant{filter:saturate(1.16) drop-shadow(0 1px 1px #203b2326)}
.fg-flowerSpecimen{filter:saturate(.72);opacity:.9}

.fg-dialog.fg-rewardDialog{--fg-reward-gold:#c89b2b;width:min(620px,calc(100vw - 28px));border:2px solid var(--fg-reward-gold);background:var(--dsw-alias-bg-layer-1);box-shadow:0 0 60px #d4af3733,0 24px 100px #0006}
.fg-dialog.fg-rewardDialog::backdrop{background:#151008b8;backdrop-filter:blur(7px)}
.fg-rewardHead{text-align:center;padding:28px 24px 20px;background:linear-gradient(145deg,#d4af372b,transparent);border-bottom:1px solid var(--fg-reward-gold)}
.fg-rewardHead h2{margin:6px 0;font-size:1.7em;line-height:1.4;color:var(--dsw-alias-label-primary)}
.fg-rewardHead p{margin:8px 0 0;color:var(--dsw-alias-label-secondary);line-height:1.6}
.fg-rewardStar{display:block;font-size:3.4em;color:#d4af37;line-height:1.1;text-shadow:0 0 24px #d4af3766}
.fg-rewardList{padding:22px;display:flex;flex-direction:column;gap:12px}
.fg-rewardItem{display:flex;align-items:center;gap:14px;padding:16px;border:1px solid var(--fg-reward-gold);border-radius:14px;background:linear-gradient(100deg,#d4af3712,transparent)}
.fg-rewardItem>div{min-width:0;flex:1}.fg-rewardItem h3{margin:0;font-size:1.1em;line-height:1.5}.fg-rewardItem p{margin:5px 0 0;line-height:1.6}
.fg-rewardAmount{font-size:1.3em;color:var(--fg-reward-gold);white-space:normal;text-align:right;max-width:42%;overflow-wrap:anywhere}
.fg-rewardBalance{padding:0 22px;margin:0 0 18px;line-height:1.7;text-align:center;color:var(--dsw-alias-label-secondary)}
.fg-rewardActions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px;padding:0 22px 24px}
.fg-rewardConfirm{background:#d4af37!important;color:#241b07!important;border-color:#d4af37!important;font-weight:700}
.fg-bagButton{flex:none;border-color:#c89b2b!important}.fg-inventoryDialog{width:min(780px,calc(100vw - 28px))}
.fg-inventoryHead{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 0;gap:16px}.fg-inventoryHead h2{margin:0;line-height:1.5}
.fg-inventoryContents{padding:18px 24px 24px}.fg-inventorySection .fg-inventoryContents{padding:0}
.fg-inventoryGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:12px;margin-top:14px}
.fg-inventoryItem{display:flex;align-items:flex-start;gap:14px;padding:16px;border:1px solid var(--dsw-alias-border-l2);border-radius:14px;background:var(--dsw-alias-bg-base)}
.fg-inventoryItem>div{min-width:0;flex:1}.fg-inventoryItem h3{font-size:1.05em;margin:0 0 6px;line-height:1.5}.fg-inventoryItem p{margin:6px 0 0;font-size:.9em;line-height:1.7}
.fg-inventoryIcon{display:flex;align-items:center;justify-content:center;flex:0 0 44px;width:44px;height:44px;border-radius:12px;background:#d4af371c;color:#c89b2b;font-size:1.7em}.fg-inventoryIcon svg{width:34px;height:34px}
.fg-inventoryCount{font-size:1.3em;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary)}
@media(max-width:480px){.fg-rewardItem{flex-wrap:wrap}.fg-rewardAmount{max-width:100%;margin-left:auto}.fg-rewardHead{padding:22px 16px}.fg-rewardList{padding:16px}.fg-inventoryContents{padding:16px}.fg-rewardActions .fg-btn{flex:1}}

.fg-discoveryDialog{width:min(780px,calc(100vw - 28px))}
.fg-discoveryHead{padding:24px 26px 16px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.fg-discoveryHead h2{margin:10px 0;font-size:1.6em;line-height:1.4}
.fg-discoveryHead time{font-size:.8em;color:var(--dsw-alias-label-secondary)}
.fg-discoveryList{display:flex;flex-direction:column;gap:16px;padding:20px 26px}
.fg-discoveryItem{display:flex;align-items:center;gap:20px;border:1px solid var(--dsw-alias-border-l1);border-radius:16px;padding:14px;background:var(--dsw-alias-bg-layer-2)}
.fg-discoveryArt{flex:0 0 150px;width:150px;height:150px;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse,#f3edcf,#d9e4d6);border-radius:14px}
.fg-discoveryArt svg{width:140px;height:140px}
.fg-discoveryCopy{min-width:0;display:flex;flex-direction:column;gap:8px}
.fg-discoveryCopy h3{margin:0;font-size:1.3em;line-height:1.5}
.fg-discoveryCopy p{margin:0;line-height:1.7}
.fg-discoveryFooter{padding:0 26px 24px;display:flex;justify-content:flex-end}
.fg-discoveryHistory{display:flex;flex-direction:column;gap:8px;max-height:380px;overflow:auto}
.fg-regionCards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
.fg-regionCard{display:flex;flex-direction:column;gap:9px;border:1px solid var(--dsw-alias-border-l1);border-radius:14px;padding:10px;min-width:0}
.fg-regionCard[data-current=true]{border-color:var(--dsw-alias-state-success-primary)}
.fg-regionCard .fg-panorama{height:90px;border-radius:9px}
.fg-regionCard h3{margin:0;font-size:1em}
.fg-view .fg-toast[data-show=true]{padding:12px 18px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:1em;line-height:1.6;box-shadow:0 4px 16px #0002;margin:0}
@media(max-width:550px){.fg-discoveryItem{flex-direction:column;align-items:stretch}.fg-discoveryArt{align-self:center}.fg-latestDiscovery{max-width:100px}}

.fg-view [hidden]{display:none!important}
.fg-view{font-family:var(--fg-font-family,system-ui);font-size:var(--fg-font-size,15px)}
.fg-view button,.fg-view input,.fg-view select,.fg-view dialog{font-family:inherit}
.fg-topbar{flex:none;max-height:42%;overflow:auto;padding:14px 24px 0;background:var(--dsw-alias-bg-base);border-bottom:1px solid var(--dsw-alias-border-l1);z-index:3}
.fg-toolbar{display:flex;align-items:center;gap:12px;min-width:0}
@media(max-width:650px){.fg-toolbar{flex-wrap:wrap;gap:8px;padding-bottom:8px}.fg-toolbar .fg-tabs{order:-1;flex:1 0 100%}.fg-toolbar .fg-quickSize{margin-left:auto}}
.fg-tabs{display:flex;gap:3px;overflow-x:auto;min-width:0;flex:1;scrollbar-width:thin;padding:8px 0 0}
.fg-tab{flex:none;border:0;border-bottom:3px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);font-size:.9em;padding:12px 10px;cursor:pointer;white-space:nowrap}
.fg-tab[aria-selected=true]{border-bottom-color:var(--dsw-alias-state-success-primary);color:var(--dsw-alias-label-primary);font-weight:650}
.fg-tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-3px}
.fg-quickSize{display:flex;align-items:center;gap:6px;font-size:.8em;white-space:nowrap}
.fg-quickSize select{background:var(--dsw-alias-bg-layer-1);color:inherit;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;padding:5px;font-size:inherit}
.fg-tabPanel{display:flex;flex-direction:column;gap:20px;outline:none}
.fg-tabPanel:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:3px}
.fg-liveClock{display:grid;grid-template-columns:auto auto;gap:1px 8px;align-items:center;font-variant-numeric:tabular-nums;font-size:.85em}
.fg-liveClock strong{font-size:1.15em;font-weight:600;letter-spacing:.04em}
.fg-liveClock small{grid-column:1/-1;font-size:.78em;color:var(--dsw-alias-label-secondary)}
.fg-settings{max-width:640px;padding:20px;border:1px solid var(--dsw-alias-border-l1);border-radius:16px}
.fg-settingRow{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 0}
.fg-fontPreview{font-size:1.25em;line-height:1.8;padding:22px;border-radius:12px;background:var(--dsw-alias-bg-layer-2)}
.fg-ground.fg-landscape{position:relative;isolation:isolate;overflow:hidden;border-radius:18px;min-height:580px;padding:0;background:#233d43;gap:0}
.fg-gardenBackdrop{position:absolute;inset:0;z-index:0;pointer-events:none}
.fg-gardenBackdrop .fg-panorama{height:clamp(420px,75vw,900px);mask-image:linear-gradient(#000 85%,transparent 100%)}
.fg-gardenContent{position:relative;z-index:1;display:flex;flex-direction:column;gap:18px;padding:24px}
.fg-gardenHeading{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:18px;min-height:100px}
.fg-gardenHeading .fg-landscapeCaption,.fg-gardenHeading .fg-landscapeTime{position:static}
.fg-gardenHeading .fg-landscapeTime{margin-left:auto}
.fg-gardenControls{display:flex;flex-direction:column;gap:10px;padding:16px;border:1px solid var(--dsw-alias-border-l2);border-radius:14px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 92%,transparent)}
.fg-gardenContent .fg-plot{background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 82%,transparent);backdrop-filter:blur(3px)}
.fg-gardenContent .fg-plot[data-state=locked]{background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 70%,transparent)}
@media(max-width:650px){.fg-gardenContent{padding:14px;gap:14px}.fg-gardenHeading{min-height:100px}.fg-gardenControls{padding:12px}.fg-gardenHeading .fg-landscapeTime{align-items:flex-start;margin-left:0}}
.fg-panorama{display:block;width:100%;height:100%}
.fg-landscape::after{content:'';position:absolute;inset:0;z-index:0;background:linear-gradient(90deg,#091c2490,transparent 60%),linear-gradient(0deg,#071a2860,transparent 50%);pointer-events:none}
.fg-landscapeCaption{position:absolute;z-index:1;left:26px;top:24px;display:flex;flex-direction:column;gap:8px;color:#fff9e9;text-shadow:0 2px 8px #10222b}
.fg-landscapeCaption strong{font-size:2em;line-height:1.3;font-weight:500}
.fg-landscapeCaption span{font-size:.9em}
.fg-landscapeTime{position:absolute;z-index:1;right:22px;bottom:20px;display:flex;flex-direction:column;gap:6px;align-items:flex-end;color:#fff9e9;text-shadow:0 2px 8px #10222b;font-variant-numeric:tabular-nums}
.fg-landscapeTime strong{font-size:1.6em;font-weight:500;letter-spacing:.04em}
.fg-landscapeTime span{font-size:.75em}
.fg-view .fg-btn{height:auto;min-height:2em;line-height:1.3;padding-top:.4em;padding-bottom:.4em;white-space:normal}
.fg-view .fg-variant{height:auto;min-height:1.6em;line-height:1.4;padding-top:.15em;padding-bottom:.15em}
.fg-view .fg-sceneChip{height:auto;min-height:2em;padding-top:.35em;padding-bottom:.35em}
.fg-view .fg-chip{height:auto;min-height:1.9em}
.fg-view .fg-seed,.fg-view .fg-bloom{height:auto;min-height:2em;padding-top:.35em;padding-bottom:.35em}
.fg-view .fg-note,.fg-view .fg-itemNote{white-space:normal}
@media(max-width:650px){.fg-topbar{padding:10px 12px 0}.fg-view .fg-scroll{padding:12px}.fg-topbar .fg-sub{display:none}.fg-topbar .fg-header{gap:8px}.fg-quickSize{font-size:.7em}.fg-landscapeCaption{left:18px;top:18px}.fg-landscapeTime{right:16px;bottom:14px}}

.fg-ecology{padding:18px;border:1px solid var(--dsw-alias-border-l2);border-radius:20px;background:var(--dsw-alias-bg-layer-1)}
.fg-ecoLead{margin:0;font-size:calc(var(--fg-font-size,15px) * 1.3846);line-height:1.6;font-weight:600}
.fg-ecoDetails>summary{padding:10px 0;cursor:pointer;font-size:calc(var(--fg-font-size,15px) * 1.0);font-weight:600}
.fg-ecoProjects{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:12px;margin-top:12px}
.fg-ecoProject{display:flex;flex-direction:column;gap:8px;padding:16px;border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-base)}
.fg-ecoProject h3{margin:0 0 4px;font-size:calc(var(--fg-font-size,15px) * 1.0769);line-height:1.6}
.fg-ecoTargets{display:flex;gap:5px;flex-wrap:wrap}
.fg-purpose{display:flex;flex-direction:column;gap:5px;padding:12px;border-left:3px solid var(--dsw-alias-state-success-primary);background:var(--dsw-alias-bg-layer-2);font-size:calc(var(--fg-font-size,15px) * 0.9231);line-height:1.6}
.fg-source{font-size:calc(var(--fg-font-size,15px) * 0.9231);color:var(--dsw-alias-brand-primary);text-decoration:underline}
.fg-residentActions{display:flex;flex-wrap:wrap;gap:6px}
.fg-residentActions>.fg-hint{flex-basis:100%}
.fg-notebooks{display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:8px;margin-top:12px}
.fg-notebook{display:flex;flex-direction:column;gap:6px;align-items:stretch;text-align:left;padding:10px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-base);color:inherit;font:inherit;cursor:pointer}
.fg-notebook progress{width:100%;height:5px;accent-color:var(--dsw-alias-state-success-primary)}
.fg-journal{display:flex;flex-direction:column;gap:8px;max-height:250px;overflow:auto}
.fg-journalEntry{display:flex;flex-direction:column;gap:4px;padding:10px;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:calc(var(--fg-font-size,15px) * 0.9231)}
.fg-guestNote strong{font-size:calc(var(--fg-font-size,15px) * 0.9231);color:var(--dsw-alias-label-secondary)}
.fg-guestNote p{margin:3px 0 0;font-size:calc(var(--fg-font-size,15px) * 1.0);line-height:1.7}
.fg-guest{appearance:none;color:inherit;font:inherit;text-align:left;cursor:pointer}
.fg-guest:hover{border-color:var(--dsw-alias-brand-primary)}
.fg-guest:focus-visible,.fg-notebook:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-dialog .fg-visitorPortrait{background:radial-gradient(ellipse,#f5f2d9,#d6e6dd)}
.fg-dialog .fg-visitorPortrait svg{width:210px;height:210px}

.fg-showChoices>summary{cursor:pointer;margin-bottom:12px}
.fg-showChoices>summary::after{content:'⌄';margin-left:8px}
.fg-showChoices[open]>summary::after{transform:rotate(180deg)}
.fg-dialog{box-sizing:border-box;width:min(760px,calc(100vw - 32px));max-height:calc(100dvh - 40px);padding:0;border:1px solid var(--dsw-alias-border-l2);border-radius:24px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);box-shadow:0 24px 100px #0006;overflow:auto}
.fg-dialog::backdrop{background:rgba(12,24,19,.65);backdrop-filter:blur(6px)}
.fg-dialog .fg-preview{border:0;border-radius:0;padding:28px;gap:24px;align-items:center;background:transparent}
.fg-dialog .fg-previewArt{width:260px;height:300px;border-radius:160px 160px 18px 18px;background:radial-gradient(ellipse at 50% 40%,#f9f7e8,#dfe9dc);box-shadow:inset 0 0 0 1px #68826d30}
.fg-dialog .fg-previewArt svg{width:244px;height:244px}
.fg-dialog .fg-note{white-space:normal;overflow:visible}
.fg-dialog .fg-previewBody{gap:12px;flex-basis:260px}
.fg-dialog .fg-previewName{font-size:calc(var(--fg-font-size,15px) * 1.8462);line-height:1.4;font-weight:600}
.fg-dialog .fg-previewLatin{font-family:Georgia,serif;font-size:calc(var(--fg-font-size,15px) * 1.1538);line-height:1.5}
.fg-dialog .fg-previewMeaning{font-size:calc(var(--fg-font-size,15px) * 1.1538);line-height:1.8}
.fg-cardFact{margin:0;padding-top:12px;border-top:1px solid var(--dsw-alias-border-l1);font-size:calc(var(--fg-font-size,15px) * 0.9231);line-height:1.8;color:var(--dsw-alias-label-secondary)}
.fg-dialog .fg-previewActions{width:100%;flex-direction:row;flex-wrap:wrap;justify-content:flex-end;padding-top:16px;border-top:1px solid var(--dsw-alias-border-l1)}
.fg-archive{grid-column:1/-1;display:flex;flex-direction:column;gap:12px;padding-top:16px;border-top:1px solid var(--dsw-alias-border-l1)}
.fg-archiveGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.fg-archiveEntry{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:16px;background:var(--dsw-alias-bg-layer-1);color:inherit;font:inherit;cursor:pointer}
.fg-archiveEntry svg{width:120px;height:120px}
.fg-archiveEntry:hover{background:var(--dsw-alias-bg-layer-2)}
.fg-archiveEntry:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
@media(max-width:600px){.fg-dialog .fg-preview{padding:20px;justify-content:center}.fg-dialog .fg-previewArt{width:200px;height:220px}.fg-dialog .fg-previewArt svg{width:190px;height:190px}.fg-dialog .fg-previewBody{flex-basis:100%}.fg-dialog .fg-previewName{font-size:calc(var(--fg-font-size,15px) * 1.6154)}}

.fg-view{box-sizing:border-box;width:100%;height:100%;flex:1 1 auto;min-height:0;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:calc(var(--fg-font-size,15px) * 1.0);line-height:calc(var(--fg-font-size,15px) * 1.5385)}
.fg-scroll{box-sizing:border-box;flex:1 1 auto;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:16px;padding:16px 24px 32px}
.fg-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;padding-bottom:14px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.fg-titleBlock{min-width:0;max-width:520px}
.fg-title{margin:0;font-size:calc(var(--fg-font-size,15px) * 1.2308);line-height:calc(var(--fg-font-size,15px) * 1.8462);font-weight:600}
.fg-sub{margin:2px 0 0;font-size:calc(var(--fg-font-size,15px) * 0.9231);line-height:calc(var(--fg-font-size,15px) * 1.3846);color:var(--dsw-alias-label-secondary)}
.fg-stats{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.fg-chip{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;background:var(--dsw-alias-bg-layer-1)}
.fg-chipValue{font-size:calc(var(--fg-font-size,15px) * 1.0);font-weight:600;font-variant-numeric:tabular-nums}
.fg-chipKey{font-size:calc(var(--fg-font-size,15px) * 0.8462);color:var(--dsw-alias-label-secondary)}
.fg-xpBar{display:inline-block;width:44px;height:4px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);overflow:hidden}
.fg-xpFill{display:block;height:100%;border-radius:999px;background:var(--dsw-alias-state-success-primary)}
.fg-scenes{display:flex;gap:8px;flex-wrap:wrap}
.fg-sceneChip{appearance:none;display:inline-flex;align-items:center;gap:8px;height:30px;padding:0 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;background:transparent;color:var(--dsw-alias-label-primary);font-family:inherit;font-size:calc(var(--fg-font-size,15px) * 0.9231);font-weight:600;cursor:pointer;transition:border-color .15s ease}
.fg-sceneChip:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-sceneChip[data-active="true"]{box-shadow:inset 0 0 0 1px var(--dsw-alias-label-primary)}
.fg-sceneChipArmed{border-color:var(--dsw-alias-state-error-primary)!important}
.fg-sceneChipArmed .fg-sceneMeta{color:var(--dsw-alias-state-error-primary)}
.fg-sceneChip[data-locked="true"]{opacity:.62;font-weight:500}
.fg-sceneName{white-space:nowrap}
.fg-sceneMeta{font-size:calc(var(--fg-font-size,15px) * 0.7692);font-weight:500;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;white-space:nowrap}
.fg-hint{margin:0;font-size:calc(var(--fg-font-size,15px) * 0.8462);line-height:calc(var(--fg-font-size,15px) * 1.3077);color:var(--dsw-alias-label-secondary)}
.fg-hintWeather{display:inline-block;margin-left:8px;color:var(--dsw-alias-label-primary)}
.fg-toast{position:sticky;top:0;z-index:1;min-height:18px;margin:0 -24px;padding:2px 24px 2px;font-size:calc(var(--fg-font-size,15px) * 0.9231);line-height:calc(var(--fg-font-size,15px) * 1.3846);color:var(--dsw-alias-state-success-primary)}
.fg-toast[data-show="true"]{background:var(--dsw-alias-bg-base)}
.fg-toast[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary)}
.fg-toast[data-tone="info"]{color:var(--dsw-alias-label-secondary)}
.fg-toast[data-tone="gold"]{color:var(--dsw-alias-state-warn-primary);font-weight:600;display:flex;align-items:center;gap:8px}
.fg-toastArt{display:inline-flex;width:26px;height:26px;flex:none}
.fg-toastArt svg{width:26px;height:26px;overflow:visible}
.fg-section{display:flex;flex-direction:column;gap:10px}
.fg-ground{padding:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:16px}
.fg-sectionHead{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.fg-sectionTitle{margin:0;font-size:calc(var(--fg-font-size,15px) * 0.9231);line-height:calc(var(--fg-font-size,15px) * 1.3846);font-weight:600;letter-spacing:.02em}
.fg-sectionMeta{font-size:calc(var(--fg-font-size,15px) * 0.8462);color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.fg-sectionWarn{font-size:calc(var(--fg-font-size,15px) * 0.8462);color:var(--dsw-alias-state-warn-primary)}
.fg-sectionOk{font-size:calc(var(--fg-font-size,15px) * 0.8462);color:var(--dsw-alias-state-success-primary)}
.fg-items{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr));gap:10px}
.fg-item{display:grid;grid-template-columns:20px minmax(0,1fr);grid-template-rows:1fr auto;align-items:start;gap:10px;padding:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);min-width:0}
.fg-itemIcon{flex:none;display:inline-flex;width:20px;height:20px}
.fg-itemBody{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px}
.fg-itemName{display:flex;align-items:baseline;gap:6px;font-size:calc(var(--fg-font-size,15px) * 0.9231);font-weight:600}
.fg-itemOwn{font-size:calc(var(--fg-font-size,15px) * 0.7692);font-weight:500;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.fg-itemNote{font-size:calc(var(--fg-font-size,15px) * 0.8462);line-height:calc(var(--fg-font-size,15px) * 1.2308);color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fg-itemActions{grid-column:2;display:flex;align-items:center;flex-wrap:wrap;gap:6px}
.fg-itemName{flex-wrap:wrap;row-gap:2px}
.fg-order > .fg-btn{margin-top:auto}
.fg-itemMax{font-size:calc(var(--fg-font-size,15px) * 0.8462);color:var(--dsw-alias-label-secondary)}
.fg-empty{margin:0;font-size:calc(var(--fg-font-size,15px) * 0.9231);line-height:calc(var(--fg-font-size,15px) * 1.3846);color:var(--dsw-alias-label-secondary)}
.fg-orders{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr));gap:10px}
.fg-order{display:flex;flex-direction:column;gap:8px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1)}
.fg-order[data-ready="true"]{border-color:var(--dsw-alias-state-success-primary)}
.fg-orderHead{display:flex;align-items:baseline;justify-content:space-between;gap:8px;flex-wrap:wrap}
.fg-orderId{font-size:calc(var(--fg-font-size,15px) * 0.9231);font-weight:600}
.fg-orderReward{font-size:calc(var(--fg-font-size,15px) * 0.8462);color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.fg-orderItems{display:flex;flex-direction:column;gap:3px}
.fg-orderItem{display:flex;align-items:center;gap:6px;font-size:calc(var(--fg-font-size,15px) * 0.9231);color:var(--dsw-alias-label-secondary)}
.fg-orderItem[data-have="true"]{color:var(--dsw-alias-label-primary)}
.fg-orderHave{margin-left:auto;font-size:calc(var(--fg-font-size,15px) * 0.8462);font-variant-numeric:tabular-nums}
.fg-orderNote{margin:0;font-size:calc(var(--fg-font-size,15px) * 0.8462);line-height:calc(var(--fg-font-size,15px) * 1.2308);color:var(--dsw-alias-state-warn-primary)}
.fg-dot{flex:none;display:inline-block;width:11px;height:11px;border-radius:50%;border:1px solid transparent;box-sizing:border-box}
.fg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,186px),1fr));gap:12px}
.fg-plot{box-sizing:border-box;display:flex;flex-direction:column;gap:8px;min-height:198px;padding:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-layer-1)}
.fg-plot[data-state="bloom"]{border-color:var(--dsw-alias-state-success-primary)}
.fg-plot[data-state="locked"]{background:transparent;border-style:dashed}
.fg-plot[data-paused="true"] .fg-meter:not(.fg-meterWet) .fg-meterFill{background:var(--dsw-alias-state-idle-primary)}
.fg-plot:focus{outline:none}
.fg-plot:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-art{position:relative;display:flex;align-items:flex-end;justify-content:center;height:116px}
.fg-art svg{display:block;width:116px;height:116px;overflow:visible}
.fg-visitor{appearance:none;position:absolute;top:0;right:4px;box-sizing:border-box;width:38px;height:38px;padding:4px;border:1px solid var(--dsw-alias-state-success-primary);border-radius:50%;background:var(--dsw-alias-bg-layer-1);cursor:pointer;animation:fg-bob 1.7s ease-in-out infinite alternate}
.fg-visitor:hover{background:var(--dsw-alias-bg-layer-2)}
.fg-visitor:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-art .fg-visitor svg{width:100%;height:100%}
.fg-glow{transform-box:fill-box;transform-origin:center;animation:fg-twinkle 2.2s ease-in-out infinite}
@keyframes fg-bob{from{transform:translateY(-2px)}to{transform:translateY(3px)}}
.fg-plant{transform-box:view-box;transform-origin:50px 90px;animation:fg-sway 5.5s ease-in-out infinite alternate}
.fg-sparkle{transform-box:view-box;transform-origin:center;animation:fg-twinkle 2.9s ease-in-out infinite}
.fg-mote{transform-box:view-box;animation:fg-drift 4.8s ease-in-out infinite}
.fg-haloRing{transform-box:view-box;animation:fg-turn 26s linear infinite}
@keyframes fg-twinkle{0%,100%{opacity:.3;transform:scale(.75)}50%{opacity:1;transform:scale(1.2)}}
@keyframes fg-drift{0%{opacity:0;transform:translateY(3px)}28%{opacity:.9}100%{opacity:0;transform:translateY(-11px)}}
@keyframes fg-turn{to{transform:rotate(360deg)}}
@keyframes fg-sway{from{transform:rotate(-1.6deg)}to{transform:rotate(1.6deg)}}
.fg-plotHead{display:flex;align-items:baseline;justify-content:space-between;gap:8px;min-width:0}
.fg-species{min-width:0;font-size:calc(var(--fg-font-size,15px) * 1.0);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fg-stage{flex:none;font-size:calc(var(--fg-font-size,15px) * 0.8462);color:var(--dsw-alias-label-secondary)}
.fg-meter{position:relative;height:4px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);overflow:hidden}
.fg-meterFill{display:block;height:100%;border-radius:999px;background:var(--dsw-alias-state-success-primary);transition:width .4s linear}
.fg-meterWet .fg-meterFill{background:var(--dsw-alias-label-secondary);opacity:.55}
.fg-meterWet[data-low="true"] .fg-meterFill{background:var(--dsw-alias-state-error-primary);opacity:1}
.fg-row{display:flex;align-items:baseline;justify-content:space-between;gap:8px;min-width:0}
.fg-note{min-width:0;font-size:calc(var(--fg-font-size,15px) * 0.8462);line-height:calc(var(--fg-font-size,15px) * 1.2308);color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fg-noteWarn{color:var(--dsw-alias-state-warn-primary)}
.fg-noteWet{flex:none;font-variant-numeric:tabular-nums}
.fg-actions{margin-top:auto;display:flex;gap:8px}
.fg-btn{appearance:none;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:28px;padding:0 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:calc(var(--fg-font-size,15px) * 0.9231);font-weight:500;line-height:1;cursor:pointer;transition:background .15s ease,border-color .15s ease}
.fg-btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2)}
.fg-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-btn:disabled{opacity:.45;cursor:not-allowed}
.fg-btnBlock{width:100%}
.fg-btnGrow{flex:1 1 0;min-width:0;padding:0 8px}
.fg-btnSmall{height:24px;padding:0 10px;font-size:calc(var(--fg-font-size,15px) * 0.8462)}
.fg-btnPrimary{border-color:var(--dsw-alias-state-success-primary);color:var(--dsw-alias-state-success-primary)}
.fg-btnPrimary:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2)}
.fg-btnGhost{border-color:transparent;background:transparent;color:var(--dsw-alias-label-secondary)}
.fg-btnGhost:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.fg-btnDanger{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary);background:transparent}
.fg-seeds{display:flex;flex-direction:column;gap:6px}
.fg-seedsHead{font-size:calc(var(--fg-font-size,15px) * 0.8462);line-height:calc(var(--fg-font-size,15px) * 1.2308);color:var(--dsw-alias-label-secondary)}
.fg-seedHint{font-size:calc(var(--fg-font-size,15px) * 0.8462);line-height:calc(var(--fg-font-size,15px) * 1.2308);color:var(--dsw-alias-state-warn-primary)}
.fg-seedGrid{display:flex;flex-direction:column;gap:4px;max-height:150px;overflow:auto;padding-right:2px}
.fg-seed{display:flex;align-items:center;gap:5px;height:28px;padding:0 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:calc(var(--fg-font-size,15px) * 0.8462);cursor:pointer;text-align:left;min-width:0}
.fg-seed:hover:not(:disabled){border-color:var(--dsw-alias-border-l2)}
.fg-seed:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-seed:disabled{opacity:.45;cursor:not-allowed}
.fg-seedName{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fg-seedMeta{margin-left:auto;flex:none;font-size:calc(var(--fg-font-size,15px) * 0.7692);color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.fg-seedCancel{align-self:flex-start;margin-top:2px}
.fg-basket{display:flex;flex-wrap:wrap;gap:6px}
.fg-bloom{display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:calc(var(--fg-font-size,15px) * 0.8462);cursor:pointer}
.fg-bloom:hover{border-color:var(--dsw-alias-state-success-primary);background:var(--dsw-alias-bg-layer-2)}
.fg-bloom:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-bloom[data-variant="hidden"]{border-color:#c99a1f;background:rgba(242,201,76,0.16)}
.fg-bloomArmed{border-color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-bg-layer-2)}
.fg-bloomOpen{border-color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}
.fg-preview{display:flex;align-items:flex-start;gap:14px;padding:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-layer-1);flex-wrap:wrap}
.fg-preview:focus{outline:none}
.fg-preview:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-previewArt{flex:none;width:168px;height:168px;display:flex;align-items:center;justify-content:center}
.fg-previewArt svg{width:168px;height:168px;overflow:visible}
.fg-previewBody{flex:1 1 200px;min-width:0;display:flex;flex-direction:column;gap:3px}
.fg-previewHead{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.fg-previewName{font-size:calc(var(--fg-font-size,15px) * 1.0769);font-weight:600}
.fg-previewVariant{align-self:center;padding:0 6px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);font-size:calc(var(--fg-font-size,15px) * 0.7692);line-height:calc(var(--fg-font-size,15px) * 1.2308);color:var(--dsw-alias-label-secondary)}
.fg-previewVariant[data-variant="hidden"]{border-color:#c99a1f;color:var(--dsw-alias-state-warn-primary)}
.fg-previewLatin{font-size:calc(var(--fg-font-size,15px) * 0.8462);font-style:italic;color:var(--dsw-alias-label-secondary)}
.fg-previewMeaning{font-size:calc(var(--fg-font-size,15px) * 0.9231);line-height:calc(var(--fg-font-size,15px) * 1.3846);color:var(--dsw-alias-label-primary)}
.fg-previewStats{display:flex;gap:12px;flex-wrap:wrap;font-size:calc(var(--fg-font-size,15px) * 0.8462);color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.fg-previewActions{flex:none;display:flex;flex-direction:column;gap:6px;margin-left:auto}
.fg-bloomArmed .fg-bloomPrice{color:var(--dsw-alias-state-error-primary)}
.fg-bloomArt{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;flex:none}
.fg-bloomArt svg{width:22px;height:22px;overflow:visible}
.fg-bloomCount{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.fg-bloomPrice{color:var(--dsw-alias-state-success-primary);font-variant-numeric:tabular-nums}
.fg-codexToggle{appearance:none;display:flex;align-items:center;gap:10px;width:100%;padding:0;border:0;background:transparent;color:var(--dsw-alias-label-primary);font-family:inherit;cursor:pointer;text-align:left}
.fg-codexToggle:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:4px;border-radius:6px}
.fg-caret{font-size:calc(var(--fg-font-size,15px) * 0.7692);color:var(--dsw-alias-label-secondary);transition:transform .15s ease}
.fg-caret[data-open="true"]{transform:rotate(180deg)}
.fg-codexNotes{grid-column:1/-1;display:flex;flex-direction:column;gap:2px;margin-bottom:2px}
.fg-codexHint{margin:0;font-size:calc(var(--fg-font-size,15px) * 0.8462);line-height:calc(var(--fg-font-size,15px) * 1.2308);color:var(--dsw-alias-label-secondary)}
.fg-codexTeaser{font-size:calc(var(--fg-font-size,15px) * 0.7692);color:var(--dsw-alias-state-warn-primary)}
.fg-goldTag{display:inline-block;padding:0 4px;border-radius:4px;background:rgba(242,201,76,0.35);color:var(--dsw-alias-label-primary);font-size:calc(var(--fg-font-size,15px) * 0.6923);line-height:calc(var(--fg-font-size,15px) * 1.0)}
.fg-badge{display:inline-block;width:fit-content;padding:0 6px;border-radius:999px;border:1px solid currentColor;font-size:calc(var(--fg-font-size,15px) * 0.7692);line-height:calc(var(--fg-font-size,15px) * 1.0769)}
.fg-codex{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px}
.fg-codexCard{display:flex;align-items:flex-start;gap:10px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);min-width:0}
.fg-codexCard[data-seen="false"]{background:transparent;border-style:dashed}
.fg-codexCard[data-spirit="true"]{border-color:var(--dsw-alias-state-warn-primary)}
.fg-codexArt{flex:none;width:60px;height:60px;display:flex;align-items:center;justify-content:center}
.fg-codexArtBtn{appearance:none;padding:0;border:0;background:transparent;cursor:pointer;border-radius:10px}
.fg-codexArtBtn:hover{background:var(--dsw-alias-bg-layer-2)}
.fg-codexArtBtn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-variantBtn{appearance:none;background:transparent;font-family:inherit;cursor:pointer}
.fg-variantBtn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.fg-variantBtn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-codexArt svg{width:60px;height:60px;overflow:visible}
.fg-codexBody{min-width:0;display:flex;flex-direction:column;gap:2px}
.fg-codexName{font-size:calc(var(--fg-font-size,15px) * 0.9231);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fg-codexLatin{font-size:calc(var(--fg-font-size,15px) * 0.7692);font-style:italic;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fg-codexMeaning{font-size:calc(var(--fg-font-size,15px) * 0.8462);line-height:calc(var(--fg-font-size,15px) * 1.2308);color:var(--dsw-alias-label-primary)}
.fg-codexVariants{display:flex;flex-wrap:wrap;gap:4px;margin-top:2px}
.fg-variant{display:inline-flex;align-items:center;gap:4px;height:18px;padding:0 6px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;font-size:calc(var(--fg-font-size,15px) * 0.7692);color:var(--dsw-alias-label-secondary)}
.fg-variant[data-found="true"]{color:var(--dsw-alias-label-primary)}
.fg-variant[data-variant="hidden"][data-found="true"]{border-color:#c99a1f;color:var(--dsw-alias-state-warn-primary)}
.fg-variantCount{font-variant-numeric:tabular-nums}
.fg-variantArt{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;flex:none}
.fg-variantArt svg{width:16px;height:16px;overflow:visible}
.fg-chipMarket{border-color:#c99a1f}
.fg-marketTag{display:inline-block;padding:0 4px;border-radius:4px;border:1px solid #c99a1f;color:var(--dsw-alias-state-warn-primary);font-size:calc(var(--fg-font-size,15px) * 0.6923);line-height:calc(var(--fg-font-size,15px) * 1.0)}
.fg-headAction{margin-left:auto}
.fg-badgeOk{color:var(--dsw-alias-state-success-primary)}
.fg-badgeWarn{color:var(--dsw-alias-state-warn-primary)}
.fg-guests{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}
.fg-guest{display:flex;align-items:center;gap:10px;padding:6px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);min-width:0}
.fg-guest[data-met="false"]{background:transparent;border-style:dashed}
.fg-guest[data-met="false"] .fg-guestArt{filter:grayscale(1) brightness(.75);opacity:.35}
.fg-guestArt{flex:none;display:inline-flex;width:32px;height:32px}
.fg-guestArt svg{width:32px;height:32px}
.fg-guestBody{min-width:0;display:flex;flex-direction:column;gap:1px}
.fg-guestName{display:flex;align-items:baseline;gap:6px;font-size:calc(var(--fg-font-size,15px) * 0.9231);font-weight:600}
.fg-guestWhere{font-size:calc(var(--fg-font-size,15px) * 0.7692);line-height:calc(var(--fg-font-size,15px) * 1.1538);color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fg-achs{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px}
.fg-ach{display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);min-width:0}
.fg-ach[data-state="ready"]{border-color:var(--dsw-alias-state-success-primary)}
.fg-ach[data-state="claimed"]{opacity:.6}
.fg-achBody{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:2px}
.fg-achName{font-size:calc(var(--fg-font-size,15px) * 0.9231);font-weight:600}
.fg-achDesc{font-size:calc(var(--fg-font-size,15px) * 0.8462);line-height:calc(var(--fg-font-size,15px) * 1.2308);color:var(--dsw-alias-label-secondary)}
.fg-achMeter{flex:1 1 auto}
.fg-footer{display:flex;align-items:flex-start;justify-content:flex-end;gap:16px;flex-wrap:wrap;padding-top:12px;border-top:1px solid var(--dsw-alias-border-l1)}
.fg-footer .fg-save{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-right:auto}
.fg-fileInput{display:none}
.fg-savePending{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-1)}
.fg-saveAsking{font-size:calc(var(--fg-font-size,15px) * 0.9231);color:var(--dsw-alias-label-secondary)}
@media (prefers-reduced-motion:reduce){.fg-plant,.fg-sparkle,.fg-mote,.fg-haloRing,.fg-visitor,.fg-miniVisitor,.fg-glow{animation:none}.fg-sparkle{opacity:.85}.fg-meterFill{transition:none}.fg-caret{transition:none}}
`


    // §7c Region themes, readable primary buttons, hotbar, skill tree and task chips.
    const EXTRA_CSS = `
.fg-view{--fg-accent:#2f9e5b;--fg-accent-soft:#2f9e5b1f}
.fg-view[data-scene="meadow"]{--fg-accent:#3f9e5a;--fg-accent-soft:#3f9e5a22}
.fg-view[data-scene="snow"]{--fg-accent:#3f83d0;--fg-accent-soft:#3f83d022}
.fg-view[data-scene="volcano"]{--fg-accent:#cf4f36;--fg-accent-soft:#cf4f3622}
.fg-view[data-scene="lake"]{--fg-accent:#23909c;--fg-accent-soft:#23909c22}
.fg-view[data-scene="woodland"]{--fg-accent:#5a8436;--fg-accent-soft:#5a843622}
.fg-view[data-scene="desert"]{--fg-accent:#b9781f;--fg-accent-soft:#b9781f22}
.fg-view .fg-topbar{background:linear-gradient(180deg,var(--fg-accent-soft),var(--dsw-alias-bg-base) 75%)}
.fg-view .fg-tab[aria-selected="true"]{border-bottom-color:var(--fg-accent);color:var(--dsw-alias-label-primary);font-weight:600}
.fg-view .fg-btnPrimary,.fg-view .fg-btnPrimary:hover:not(:disabled),.fg-view .fg-btnPrimary:focus-visible{background:var(--fg-accent);color:#fff;border-color:transparent}
.fg-view .fg-btnPrimary:hover:not(:disabled){filter:brightness(1.1)}
.fg-view .fg-btnDanger:hover:not(:disabled){background:var(--dsw-alias-state-error-primary);color:#fff}
.fg-view .fg-playCard{border-color:var(--fg-accent-soft)}
.fg-view .fg-dailyDot[data-state="done"]{background:var(--fg-accent)}
.fg-view .fg-quest progress,.fg-view .fg-meterFill{accent-color:var(--fg-accent)}
.fg-view .fg-toast[data-show=true][data-tone="gold"]{border-color:#d4af37;box-shadow:0 0 0 2px #d4af3733,0 6px 20px #0002}
.fg-fly{position:fixed;z-index:2147483000;pointer-events:none;font-size:26px;line-height:1;margin:-13px 0 0 -13px}
.fg-hotbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;width:fit-content;max-width:100%;padding:8px 12px;border-radius:16px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);box-shadow:0 4px 14px #0002}
.fg-hotSlot{width:56px;flex:none;cursor:grab}
.fg-hotSlot:active{cursor:grabbing}
.fg-hotSlot .fg-slotArt svg{width:30px;height:30px}
.fg-hotHint{font-size:.85em;color:var(--dsw-alias-label-secondary)}
.fg-plot[data-target="true"]{outline:2px dashed #d4af37;outline-offset:2px;cursor:copy}
.fg-skillTree{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:12px;margin-top:12px}
.fg-skillBranch{display:flex;flex-direction:column;align-items:center;gap:10px;padding:16px 14px;border-radius:18px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);text-align:center}
.fg-skillNodes{display:flex;align-items:center;padding-bottom:8px}
.fg-skillNode{appearance:none;font:inherit;position:relative;width:54px;height:54px;border-radius:50%;border:3px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center}
.fg-skillNode+.fg-skillNode{margin-left:46px}
.fg-skillNode+.fg-skillNode::before{content:"";position:absolute;right:100%;top:50%;width:46px;height:4px;margin-right:3px;background:var(--dsw-alias-border-l2);transform:translateY(-50%)}
.fg-skillNode[data-state="done"]{background:var(--fg-accent);border-color:var(--fg-accent);color:#fff;cursor:default;opacity:1}
.fg-skillNode[data-state="done"]+.fg-skillNode::before{background:var(--fg-accent)}
.fg-skillNode[data-state="next"]{border-color:#d4af37;color:var(--dsw-alias-label-primary)}
.fg-skillNode[data-state="next"]:not(:disabled){animation:fg-ready 2.4s ease-in-out infinite}
.fg-skillNode[data-state="confirm"]{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}
.fg-skillNode[data-state="closed"],.fg-skillNode[data-state="next"]:disabled{opacity:.55;cursor:not-allowed}
.fg-skillCost{position:absolute;bottom:-10px;padding:0 7px;border-radius:999px;background:#d4af37;color:#241b07;font-size:.72em;line-height:1.5}
.fg-view .fg-ecoProject{border-radius:18px;border-left:5px solid var(--fg-accent)}
.fg-ecoProject progress{width:100%;height:8px;accent-color:var(--fg-accent)}
.fg-questChip{display:inline-flex;align-items:center;gap:4px;padding:.1em .7em;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);font-size:.85em;color:var(--dsw-alias-label-secondary)}
.fg-questChip[data-done="true"]{background:var(--fg-accent-soft);border-color:var(--fg-accent);color:var(--dsw-alias-label-primary)}
.fg-questChip[data-tone="gold"]{border-color:#d4af37;color:var(--dsw-alias-label-primary)}
@media (prefers-reduced-motion:reduce){.fg-skillNode{animation:none!important}}
.fg-gardenBar{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.fg-gardenBar:empty{display:none}
.fg-gardenBar .fg-sectionOk{padding:.25em .9em;border-radius:999px;background:var(--dsw-alias-bg-layer-1)}
.fg-gardenBar .fg-headAction{margin-left:0}
.fg-arrange{padding:18px;border-radius:20px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.fg-arrangeBody{display:grid;grid-template-columns:260px minmax(0,1fr);gap:18px;align-items:start}
.fg-vaseCard{display:flex;flex-direction:column;align-items:center;gap:10px;padding:14px;border-radius:18px;background:linear-gradient(180deg,var(--fg-accent-soft),var(--dsw-alias-bg-layer-2))}
.fg-vase{position:relative;width:230px;height:210px}
.fg-vaseStem{appearance:none;position:absolute;left:50%;bottom:52px;width:92px;height:118px;margin-left:-46px;padding:0;border:0;background:transparent;cursor:pointer;transform-origin:50% 100%;transition:filter .12s ease}
.fg-vaseStem:hover{filter:brightness(1.12) drop-shadow(0 0 6px #d4af37)}
.fg-vaseStem svg{width:92px;height:118px;overflow:visible}
.fg-vasePot{position:absolute;left:50%;bottom:0;width:78px;height:74px;margin-left:-39px;border-radius:14px 14px 30px 30px;background:linear-gradient(90deg,#7fb2c9,#b7dbe8 45%,#6fa0b8);box-shadow:inset 0 8px 0 #ffffff55,0 6px 14px #0003}
.fg-vaseStars{font-size:1.5em;letter-spacing:.12em;color:#d4af37;line-height:1}
.fg-vaseStars[data-stars="0"]{color:var(--dsw-alias-border-l2)}
.fg-vaseStars[data-stars="5"]{text-shadow:0 0 12px #d4af3799}
.fg-bond{display:flex;flex-direction:column;gap:12px;padding:16px;border-radius:18px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.fg-bondGuests{display:flex;gap:8px;flex-wrap:wrap}
.fg-bondGuest{appearance:none;font:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 10px;border-radius:14px;border:2px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:inherit}
.fg-bondGuest[aria-pressed="true"]{border-color:var(--fg-accent);background:var(--fg-accent-soft)}
.fg-bondArt{display:inline-flex;width:40px;height:40px}.fg-bondArt svg{width:40px;height:40px}
.fg-hearts{color:#e2557a;font-size:.85em;letter-spacing:.05em;white-space:nowrap}
.fg-bondDetail{display:grid;grid-template-columns:minmax(0,300px) minmax(0,1fr);gap:16px;align-items:start}
.fg-bondInfo,.fg-bondGift{display:flex;flex-direction:column;gap:8px;min-width:0;align-items:flex-start}
.fg-bondGift .fg-slotGrid{width:100%}
.fg-bondInfo progress{width:100%;height:8px;accent-color:#e2557a}
.fg-questChip .fg-dot{vertical-align:middle}
@media(max-width:650px){.fg-arrangeBody,.fg-bondDetail{grid-template-columns:1fr}.fg-vaseCard{width:100%;box-sizing:border-box}}
.fg-genes{display:grid;grid-template-columns:auto auto auto;gap:4px 8px;align-items:center;justify-content:start;font-size:.85em}
.fg-geneName,.fg-geneEnd{color:var(--dsw-alias-label-secondary)}
.fg-genePips{display:inline-flex;gap:3px}
.fg-genePips i{display:block;width:13px;height:8px;border-radius:3px;background:var(--dsw-alias-border-l1)}
.fg-genePips i[data-on="true"]{background:var(--fg-accent)}
.fg-geneCard{display:flex;flex-direction:column;align-items:flex-start;gap:8px;padding:10px 12px;border-radius:12px;background:var(--dsw-alias-bg-layer-2)}
.fg-geneHead{display:flex;align-items:center;gap:8px}
.fg-kinTree{display:flex;flex-direction:column;align-items:center;gap:4px}
.fg-kinParents{display:flex;align-items:flex-start;gap:10px;padding-top:6px;border-top:2px solid var(--dsw-alias-border-l2)}
.fg-kin{display:flex;flex-direction:column;align-items:center;gap:1px;font-size:.75em;line-height:1.3;color:var(--dsw-alias-label-secondary);text-align:center}
.fg-kinArt{display:inline-flex;width:44px;height:44px}.fg-kinArt svg{width:44px;height:44px;overflow:visible}
.fg-crossHint{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.fg-crossHint .fg-questChip{font-size:.75em}
.fg-goalGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,210px),1fr));gap:10px}
.fg-goal{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:12px;border-radius:14px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.fg-goal[data-done="true"]{border-color:#d4af37;background:#d4af371a}
.fg-bagDetail .fg-genes{text-align:left}
.fg-seasonChip{display:inline-flex;align-items:center;padding:.1em .8em;border-radius:999px;border:1px solid var(--fg-accent);background:var(--fg-accent-soft);font-size:.88em;color:var(--dsw-alias-label-primary)}
.fg-vasePot{width:80px;height:76px;margin-left:-40px;background:none;box-shadow:none;border-radius:0;filter:drop-shadow(0 6px 8px #0003)}
.fg-vaseStill .fg-vaseStem{pointer-events:none;cursor:default}
.fg-vasePicker{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
.fg-vaseChoice{appearance:none;cursor:pointer;width:46px;height:46px;padding:4px;border-radius:12px;border:2px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);display:flex;align-items:center;justify-content:center}
.fg-vaseChoice svg{width:34px;height:32px}
.fg-vaseChoice[aria-pressed="true"]{border-color:var(--fg-accent);background:var(--fg-accent-soft)}
.fg-vaseChoice:disabled{cursor:not-allowed;opacity:.4;filter:grayscale(1)}
.fg-album,.fg-trip{padding:18px;border-radius:20px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.fg-cardGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(164px,1fr));gap:12px}
.fg-keepCard{position:relative;display:flex;flex-direction:column;align-items:center;gap:5px;padding:14px 10px 10px;border-radius:16px;border:2px solid var(--dsw-alias-border-l1);background:linear-gradient(180deg,#fffdf6,#f3efe2);color:#2a2a22;box-shadow:0 4px 12px #0002;text-align:center}
.fg-keepCard .fg-note{color:#6b6a5c}
.fg-keepCard[data-stars="5"],.fg-keepCard[data-rarity="spirit"]{border-color:#d4af37;box-shadow:0 0 18px #d4af3755}
.fg-keepCard[data-rarity="alt"]{border-color:var(--fg-r-alt)}.fg-keepCard[data-rarity="hybrid"]{border-color:var(--fg-r-hybrid)}.fg-keepCard[data-rarity="curio"]{border-color:var(--fg-r-curio)}
.fg-cardVase{width:138px;height:126px}
.fg-cardVase .fg-vase{transform:scale(.6);transform-origin:0 0}
.fg-cardFlower{width:110px;height:110px;display:flex;align-items:center;justify-content:center}.fg-cardFlower svg{width:106px;height:106px;overflow:visible}
.fg-keepCard .fg-genes{font-size:.72em}.fg-keepCard .fg-geneName,.fg-keepCard .fg-geneEnd{color:#6b6a5c}
.fg-cardDel{appearance:none;position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;border:0;background:#0000001a;color:#2a2a22;cursor:pointer;font:inherit;line-height:1;opacity:.45}
.fg-cardDel:hover,.fg-cardDel[data-armed="true"]{opacity:1}
.fg-cardDel[data-armed="true"]{background:var(--dsw-alias-state-error-primary);color:#fff}
.fg-tripRow{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.fg-tripRow progress{flex:1 1 160px;height:10px;accent-color:var(--fg-accent)}
.fg-vaseChoice{position:relative}
.fg-vasePrice{position:absolute;left:50%;bottom:-9px;transform:translateX(-50%);padding:0 5px;border-radius:999px;background:#d4af37;color:#241b07;font-size:.62em;line-height:1.5;white-space:nowrap}
.fg-vaseChoice[data-armed="true"]{border-color:var(--dsw-alias-state-error-primary)}
.fg-vaseChoice[data-earned="true"][data-owned="false"]:not(:disabled){opacity:1;filter:none}
.fg-vasePicker{padding-bottom:8px}
.fg-shelf{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 12px;border-radius:14px;border:1px solid #d4af3766;background:linear-gradient(180deg,#d4af3714,transparent)}
.fg-shelfCompact{padding:6px 10px}
.fg-shelfCard{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;width:74px;height:74px;border-radius:12px;border:2px solid #d4af37;background:#fffdf6;color:#2a2a22;font-size:.68em;text-align:center}
.fg-shelfCard svg{width:40px;height:40px;overflow:visible}
.fg-shelfStars{color:#d4af37;font-size:1.3em;line-height:1.6}
.fg-shelfFx{line-height:1.2;color:#6b6a5c}
.fg-shelfEmpty{border-style:dashed;border-color:var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary)}
.fg-cardTools{display:flex;flex-direction:column;align-items:center;gap:5px;width:100%}
.fg-cardToolRow{display:flex;gap:6px}
.fg-cardTool{appearance:none;font:inherit;cursor:pointer;width:28px;height:28px;border-radius:50%;border:1px solid #cfc8b4;background:#fff;color:#2a2a22;line-height:1}
.fg-cardTool:hover{border-color:#d4af37}
.fg-cardTool[aria-pressed="true"]{background:#d4af37;border-color:#d4af37}
.fg-cardEdit{display:flex;flex-direction:column;gap:4px;width:100%}
.fg-cardEdit input{font:inherit;font-size:.85em;padding:.3em .5em;border-radius:8px;border:1px solid #cfc8b4;background:#fff;color:#2a2a22;min-width:0}
.fg-cardInscription{display:flex;flex-direction:column;gap:1px;font-size:.85em;line-height:1.35;overflow-wrap:anywhere}
.fg-cardInscription span{color:#6b6a5c;font-style:italic}
.fg-work,.fg-contest,.fg-legacy{padding:18px;border-radius:20px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.fg-workNew{display:flex;flex-direction:column;gap:10px;align-items:flex-start}
.fg-workNew .fg-bagFilters{padding:0}.fg-workNew .fg-slotGrid{width:100%}
.fg-pages{display:flex;flex-direction:column;gap:10px}
.fg-goal progress{width:100%;height:8px;accent-color:var(--fg-accent)}
.fg-fund{padding:18px;border-radius:20px;border:1px solid #d4af3766;background:linear-gradient(180deg,#d4af3714,var(--dsw-alias-bg-layer-1))}
.fg-view .fg-tabs{gap:6px;padding:8px 0;flex-wrap:wrap;overflow-x:visible}
.fg-view .fg-toolbar{align-items:center;flex-wrap:wrap}
.fg-view .fg-topbar{max-height:none}
@media(max-width:650px){.fg-view .fg-tabs{flex-wrap:nowrap;overflow-x:auto}.fg-view .fg-topbar{max-height:48%}}
.fg-view .fg-tab{display:inline-flex;align-items:center;gap:.4em;padding:.45em .95em;border:1px solid transparent;border-radius:999px;transition:background .12s ease,color .12s ease}
.fg-view .fg-tab:hover{background:var(--fg-accent-soft);color:var(--dsw-alias-label-primary)}
.fg-view .fg-tab[aria-selected="true"]{background:var(--fg-accent);color:#fff;border-color:transparent;font-weight:600;box-shadow:0 3px 10px #0002}
.fg-tabIcon{font-size:1.05em;line-height:1}
.fg-view .fg-tabPanel>.fg-section:not(.fg-ground){padding:18px;border-radius:20px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);box-shadow:0 2px 10px #0000000d}
.fg-view .fg-sectionTitle{font-size:1.08em}
.fg-pals{display:flex;flex-direction:column;gap:12px;padding:16px;border-radius:18px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.fg-palGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,190px),1fr));gap:10px}
.fg-pal{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 10px;border-radius:16px;border:2px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);text-align:center}
.fg-pal[data-home="true"]{border-color:var(--fg-accent);background:linear-gradient(180deg,var(--fg-accent-soft),var(--dsw-alias-bg-base))}
.fg-palArt{display:inline-flex;width:56px;height:56px}.fg-palArt svg{width:56px;height:56px}
.fg-event{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.fg-eventGo{appearance:none;font:inherit;cursor:pointer;display:inline-flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 18px;border-radius:999px;border:2px solid #d4af37;background:linear-gradient(90deg,#d4af3733,#8f7be022,#4fa3d822);color:var(--dsw-alias-label-primary);animation:fg-ready 2.4s ease-in-out infinite}
.fg-eventIcon{font-size:1.6em;line-height:1;animation:fg-wiggle 1.6s ease-in-out infinite}
.fg-brief{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;border-radius:14px;border:1px dashed var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);font-size:.95em}
.fg-brief[data-brief="met"]{border:1px solid #d4af37;background:#d4af371a}
.fg-brief[data-brief="done"]{opacity:.65}
.fg-greet{padding-top:4px;border-top:1px dashed #cfc8b4}
@media (prefers-reduced-motion:reduce){.fg-eventGo,.fg-eventIcon{animation:none!important}}
.fg-wantGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:12px}
.fg-want{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 10px;border-radius:16px;border:2px dashed var(--fg-accent);background:var(--dsw-alias-bg-base);text-align:center}
.fg-want[data-done="true"]{border-style:solid;border-color:#d4af37;background:#d4af371a}
.fg-wantArt{display:inline-flex;width:84px;height:84px}.fg-wantArt svg{width:84px;height:84px;overflow:visible}
.fg-view[data-scene="alpine"]{--fg-accent:#4a78c8;--fg-accent-soft:#4a78c822}
.fg-view[data-scene="rainforest"]{--fg-accent:#1f8a62;--fg-accent-soft:#1f8a6222}
.fg-view[data-scene="coast"]{--fg-accent:#2f8fb8;--fg-accent-soft:#2f8fb822}
.fg-view[data-scene="garden"]{--fg-accent:#c2506e;--fg-accent-soft:#c2506e22}
.fg-miniTools{flex-wrap:wrap}
.fg-miniToday{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:0 12px 10px}
.fg-miniToday .fg-questChip{font-size:.85em}
.fg-miniNotice{position:sticky;bottom:0;margin:0;padding:6px 12px;background:var(--dsw-alias-bg-layer-1);font-weight:600;color:var(--fg-accent)}
.fg-miniNotice:empty{display:none}
.fg-cardWarn{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:14px;border-radius:14px;background:#fffdf6f2;color:#2a2a22;text-align:center;line-height:1.5}
.fg-cardWarn strong{color:var(--dsw-alias-state-error-primary);font-size:1.05em}
.fg-cardWarn span{font-size:.88em}
.fg-cardWarnActions{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.fg-cardDel[data-armed="true"]{z-index:3}
.fg-vaseShelf{display:flex;flex-direction:column;gap:6px;width:100%}
.fg-vasePicker{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;padding-bottom:0}
.fg-vaseChoice{width:auto;height:auto;flex-direction:column;gap:2px;padding:6px 2px 5px;color:var(--dsw-alias-label-primary);font:inherit;min-width:0}
.fg-vaseChoice svg{width:46px;height:44px}
.fg-vaseChoice:disabled{opacity:1;filter:none}
.fg-vaseChoice:disabled svg{filter:grayscale(1);opacity:.45}
.fg-vaseName{font-size:.74em;font-weight:600;line-height:1.2}
.fg-vaseState{display:inline-flex;align-items:center;justify-content:center;gap:3px;flex-wrap:wrap;font-size:.64em;line-height:1.25;color:var(--dsw-alias-label-secondary);text-align:center}
.fg-vaseChoice[data-owned="true"] .fg-vaseState{color:var(--fg-accent);font-weight:600}
.fg-vasePrice{position:static;transform:none;padding:0;background:none;color:#a67c12;font-size:1.1em;font-weight:700}
.fg-vaseHint{margin:0;font-size:.8em;line-height:1.5;text-align:center;color:var(--dsw-alias-label-secondary)}
.fg-vasePot{filter:drop-shadow(0 4px 5px #0002)}
.fg-goods{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:10px}
.fg-good{display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:12px;border-radius:14px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base)}
.fg-good[data-have="false"]{opacity:.6}
.fg-goodsIcon{font-size:1.7em;line-height:1}
.fg-slotArt .fg-goodsIcon{font-size:2em}
.fg-vaseTints{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap}
.fg-vaseTint{appearance:none;width:22px;height:22px;padding:0;border-radius:50%;border:2px solid var(--dsw-alias-border-l2);cursor:pointer}
.fg-vaseTint[aria-pressed="true"]{outline:2px solid var(--fg-accent);outline-offset:2px}
.fg-vaseTintPick{appearance:none;width:30px;height:26px;padding:0;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:none;cursor:pointer}
`

    // §7b Backpack slots, daily play strip, rule tips and motion polish.
    const CSS = BASE_CSS + `
.fg-view{--fg-r-base:#9aa7a0;--fg-r-alt:#4fa3d8;--fg-r-hybrid:#8f7be0;--fg-r-curio:#e0762f;--fg-r-spirit:#d4af37}
.fg-view .fg-btn{border-radius:10px;transition:transform .12s ease,box-shadow .12s ease,background .12s ease}
.fg-view .fg-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 3px 10px #0002}
.fg-view .fg-btn:active:not(:disabled){transform:translateY(0) scale(.97)}
.fg-view .fg-btnPrimary{background:var(--dsw-alias-state-success-primary);color:#fff;border-color:transparent;font-weight:600}
.fg-plot{transition:transform .16s ease,box-shadow .16s ease;border-radius:18px}
.fg-plot:hover{transform:translateY(-2px);box-shadow:0 8px 22px #0002}
.fg-plot[data-state="bloom"]{border-color:var(--fg-r-spirit);animation:fg-ready 2.4s ease-in-out infinite}
.fg-plot[data-variant="hidden"]{box-shadow:0 0 0 2px #d4af3755,0 8px 26px #d4af3733}
@keyframes fg-ready{0%,100%{box-shadow:0 0 0 0 #d4af3700}50%{box-shadow:0 0 0 5px #d4af3738}}
.fg-view .fg-toast[data-show=true]{animation:fg-pop .28s cubic-bezier(.2,1.4,.4,1)}
@keyframes fg-pop{from{opacity:0;transform:translateY(8px) scale(.94)}to{opacity:1;transform:none}}
.fg-tipRow{display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap}
.fg-tip{font-size:.9em;color:var(--dsw-alias-label-secondary)}
.fg-tipToggle{display:inline-flex;align-items:center;gap:6px;cursor:pointer;list-style:none;user-select:none}
.fg-tipToggle::-webkit-details-marker{display:none}
.fg-tipMark{display:inline-flex;align-items:center;justify-content:center;width:1.5em;height:1.5em;border-radius:50%;border:1px solid var(--dsw-alias-border-l2);font-weight:700}
.fg-tip[open] .fg-tipMark{background:var(--dsw-alias-brand-primary);color:#fff;border-color:transparent}
.fg-tipBody{margin-top:8px;padding:10px 14px;border-radius:12px;background:var(--dsw-alias-bg-layer-2);max-inline-size:min(36em,100%);box-sizing:border-box;overflow-wrap:anywhere}
.fg-tipBody p{margin:0;line-height:1.65}
.fg-tipBody p+p{margin-top:.55em;padding-top:.55em;border-top:1px solid var(--dsw-alias-border-l1)}
.fg-slotGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(78px,1fr));gap:8px;align-content:start}
.fg-slot{appearance:none;position:relative;box-sizing:border-box;aspect-ratio:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 4px 4px;border:2px solid var(--fg-r-base);border-radius:14px;background:linear-gradient(160deg,var(--dsw-alias-bg-layer-1),var(--dsw-alias-bg-layer-2));color:var(--dsw-alias-label-primary);font:inherit;box-shadow:inset 0 -6px 12px #0000000f}
button.fg-slot{cursor:pointer;transition:transform .12s ease,box-shadow .12s ease}
button.fg-slot:hover{transform:translateY(-2px) scale(1.03);box-shadow:0 6px 16px #0003}
button.fg-slot[aria-pressed="true"]{outline:3px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-slot[data-rarity="alt"]{border-color:var(--fg-r-alt)}
.fg-slot[data-rarity="hybrid"]{border-color:var(--fg-r-hybrid)}
.fg-slot[data-rarity="curio"]{border-color:var(--fg-r-curio);background:linear-gradient(160deg,#e0762f1f,var(--dsw-alias-bg-layer-2))}
.fg-slot[data-rarity="spirit"]{border-color:var(--fg-r-spirit);background:linear-gradient(160deg,#d4af3738,var(--dsw-alias-bg-layer-2));animation:fg-shine 2.6s ease-in-out infinite}
@keyframes fg-shine{0%,100%{box-shadow:0 0 0 0 #d4af3700,inset 0 -6px 12px #0000000f}50%{box-shadow:0 0 14px 2px #d4af3766,inset 0 -6px 12px #0000000f}}
.fg-slotEmpty{border-style:dashed;border-color:var(--dsw-alias-border-l1);background:transparent;box-shadow:none}
.fg-slotArt{flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center;width:100%}
.fg-slotArt svg{width:44px;height:44px;overflow:visible}
.fg-slotName{max-width:100%;font-size:.72em;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--dsw-alias-label-secondary)}
.fg-slotCount{position:absolute;right:4px;top:3px;padding:0 5px;border-radius:999px;background:#000a;color:#fff;font-size:.72em;font-weight:700;font-variant-numeric:tabular-nums;line-height:1.5}
.fg-bagDialog{width:min(880px,calc(100vw - 28px))}
.fg-bagDialog .fg-inventoryHead{justify-content:flex-start;flex-wrap:wrap}.fg-bagClose{margin-left:auto}
.fg-bagFilters{display:flex;gap:6px;flex-wrap:wrap;padding:14px 24px 0}
.fg-bagFilter{appearance:none;font:inherit;cursor:pointer;padding:.35em .9em;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary)}
.fg-bagFilter[aria-pressed="true"]{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-base);border-color:transparent;font-weight:600}
.fg-bagFilterCount{opacity:.7;font-variant-numeric:tabular-nums}
.fg-bagBody{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:18px;padding:16px 24px 20px}
.fg-bagBody .fg-slotGrid{max-height:min(52vh,420px);overflow:auto;padding:4px}
.fg-bagDetail{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px;border-radius:18px;border:2px solid var(--fg-r-base);background:var(--dsw-alias-bg-layer-2);text-align:center}
.fg-bagDetail[data-rarity="alt"]{border-color:var(--fg-r-alt)}.fg-bagDetail[data-rarity="hybrid"]{border-color:var(--fg-r-hybrid)}.fg-bagDetail[data-rarity="curio"]{border-color:var(--fg-r-curio)}.fg-bagDetail[data-rarity="spirit"]{border-color:var(--fg-r-spirit);box-shadow:0 0 24px #d4af3740}
.fg-bagDetail h3{margin:0;font-size:1.15em;line-height:1.4}
.fg-bagDetailArt{width:140px;height:140px;display:flex;align-items:center;justify-content:center}.fg-bagDetailArt svg{width:132px;height:132px;overflow:visible}
.fg-bagTags{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;align-items:center}
.fg-rarityTag{padding:0 8px;border-radius:999px;font-size:.8em;font-weight:700;color:#fff;background:var(--fg-r-base)}
.fg-rarityTag[data-rarity="alt"]{background:var(--fg-r-alt)}.fg-rarityTag[data-rarity="hybrid"]{background:var(--fg-r-hybrid)}.fg-rarityTag[data-rarity="curio"]{background:var(--fg-r-curio)}.fg-rarityTag[data-rarity="spirit"]{background:var(--fg-r-spirit);color:#241b07}
.fg-bagActions{display:flex;flex-direction:column;gap:8px;width:100%;margin-top:auto}
.fg-inventoryContents .fg-slotGrid{grid-template-columns:repeat(auto-fill,minmax(72px,84px))}
.fg-scroll>:empty{display:none}
.fg-tabPanel>.fg-subTabs{margin:-10px 0 -8px}
.fg-subTabs{display:flex;gap:6px;flex-wrap:wrap}
.fg-subTab{border:1px solid var(--dsw-alias-border-secondary,#0002);background:transparent;color:var(--dsw-alias-label-secondary);border-radius:999px;padding:5px 12px;font-size:.88em;cursor:pointer}
.fg-subTab[aria-selected=true]{background:var(--fg-accent,#2f9e5b);border-color:transparent;color:#fff;font-weight:600}
.fg-subTab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-gear{font-size:1.05em;padding-inline:8px}
.fg-today{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:8px 12px;border-radius:16px;border:1px solid var(--fg-accent-soft,#0001);background:var(--dsw-alias-bg-layer-1)}
.fg-todayTitle{margin-right:4px}
.fg-todayCell{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--dsw-alias-border-l1);background:transparent;border-radius:999px;padding:4px 10px;font-size:.88em;color:var(--dsw-alias-label-secondary);cursor:pointer}
.fg-todayCell[data-state=done]{background:var(--fg-accent-soft);border-color:var(--fg-accent);color:var(--dsw-alias-label-primary);cursor:default}
.fg-todayCell[data-state=ready]{border-color:#d4af37;color:var(--dsw-alias-label-primary);font-weight:600;animation:fg-todayPulse 1.6s ease-in-out infinite}
@keyframes fg-todayPulse{50%{transform:translateY(-2px);box-shadow:0 3px 8px #d4af3755}}
@media(prefers-reduced-motion:reduce){.fg-todayCell[data-state=ready]{animation:none}}
.fg-play{display:flex;gap:12px;flex-wrap:wrap;align-items:stretch}
.fg-playCard{flex:1 1 260px;min-width:0;display:flex;flex-direction:column;gap:8px;padding:12px 14px;border-radius:16px;border:1px solid var(--dsw-alias-border-l1);background:linear-gradient(150deg,var(--dsw-alias-bg-layer-1),var(--dsw-alias-bg-layer-2))}
.fg-playHead{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.fg-dailyDots{display:flex;gap:6px;margin:0;padding:0;list-style:none}
.fg-dailyDot{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;gap:2px;padding:5px 0;border-radius:10px;border:1px solid var(--dsw-alias-border-l1);font-size:.75em;color:var(--dsw-alias-label-secondary)}
.fg-dailyDot svg{width:18px;height:18px}
.fg-dailyDot[data-state="done"]{background:var(--dsw-alias-state-success-primary);color:#fff;border-color:transparent}
.fg-dailyDot[data-state="today"]{border-color:var(--fg-r-spirit);box-shadow:0 0 0 2px #d4af3755;color:var(--dsw-alias-label-primary);font-weight:700}
.fg-quest{display:grid;grid-template-columns:minmax(0,1fr) 70px auto;align-items:center;gap:8px;font-size:.92em}
.fg-quest progress{width:100%;height:8px;accent-color:var(--dsw-alias-state-success-primary)}
.fg-quest[data-done="true"] .fg-questName{font-weight:600}
.fg-gift{appearance:none;font:inherit;cursor:pointer;flex:0 0 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:10px 18px;border-radius:16px;border:2px solid var(--fg-r-spirit);background:#d4af371f;color:var(--dsw-alias-label-primary)}
.fg-giftBox{font-size:2em;line-height:1.1;animation:fg-wiggle 1.6s ease-in-out infinite}
@keyframes fg-wiggle{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg) scale(1.08)}}
.fg-away{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;border-radius:14px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);animation:fg-pop .3s ease}
.fg-away .fg-btn{margin-left:auto}
@media(max-width:650px){.fg-bagBody{grid-template-columns:1fr}.fg-bagDetail{flex-direction:row;flex-wrap:wrap;text-align:left}.fg-bagDetailArt{width:84px;height:84px}.fg-bagDetailArt svg{width:80px;height:80px}}
@media (prefers-reduced-motion:reduce){.fg-plot,.fg-slot,.fg-giftBox,.fg-away,.fg-view .fg-toast[data-show=true]{animation:none!important}.fg-view .fg-btn,.fg-plot,button.fg-slot{transition:none}}
` + EXTRA_CSS
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
        ...ECOLOGY_API, ...PLAY_API, ...CRAFT_API, ...GENE_API, ...ALBUM_API, ...ECONOMY_API, ...LONGTERM_API, ...FUND_API, ...USES_API, ...FUN_API, ...FLOWER_API, ...GOODS_API, ...TINT_API, ...BULK_API, ...TRAIT_API, HIDDEN_CAP, CHARM_CAP, bagEntries, getAway, adoptStored, getState, playSound, miniGeometry, revealBloom, revealGarden, inventoryCount, rewardForChange, RESEARCH_BRANCHES, RESEARCH_OFFERS, sanitizeResearch, researchLevel, researchFee, researchCost, upgradeResearch, exchangeResearch, hybridChance, ECO_PROFILES, VISITOR_INFO, studyLevel, GARDEN_TABS, TAB_GROUPS, TAB_GROUP_IDS, todayTasks, tabGroupOf, sanitizeUi, dayPeriod, gardenClock,
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
