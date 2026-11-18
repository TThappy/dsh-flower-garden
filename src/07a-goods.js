
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
