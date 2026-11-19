
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
