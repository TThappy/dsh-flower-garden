
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
