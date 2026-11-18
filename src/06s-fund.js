
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
