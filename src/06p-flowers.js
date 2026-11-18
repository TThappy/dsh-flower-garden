
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
