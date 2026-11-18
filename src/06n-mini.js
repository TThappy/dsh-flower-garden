
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
