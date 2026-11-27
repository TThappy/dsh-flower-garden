// Bulk flower sales reuse the same quote/confirmation flow for both inventories.
Object.assign(zh, {
  'bulkSale.open':'批量出售花材', 'bulkSale.ordinary':'仅选原色普通花', 'bulkSale.clear':'清空选择',
  'bulkSale.hint':'按组选择，选中的组会整组出售。', 'bulkSale.preview':'核对售价', 'bulkSale.confirm':'确认出售',
  'bulkSale.cancel':'取消', 'bulkSale.summary':'{stacks} 组 · {n} 朵 · {coins} 金币', 'bulkSale.special':'含 {n} 朵特殊花材',
  'bulkSale.stale':'库存或市价已变化，请重新核对。', 'bulkSale.done':'已售出 {n} 朵，获得 {coins} 金币。',
  'bulkSale.basketUpgrade':'花篮扩至 {n} 朵', 'bulkSale.basketMax':'花篮已达到最大容量', 'bulkSale.basketDone':'花篮现可容纳 {n} 朵。',
})
Object.assign(en, {
  'bulkSale.open':'Sell flower stacks', 'bulkSale.ordinary':'Select plain flowers only', 'bulkSale.clear':'Clear selection',
  'bulkSale.hint':'Select the stacks to sell. Each selected stack is sold in full.', 'bulkSale.preview':'Review sale', 'bulkSale.confirm':'Confirm sale',
  'bulkSale.cancel':'Cancel', 'bulkSale.summary':'{stacks} stacks · {n} blooms · {coins} coins', 'bulkSale.special':'Includes {n} special blooms',
  'bulkSale.stale':'Stock or prices changed. Review the sale again.', 'bulkSale.done':'Sold {n} blooms for {coins} coins.',
  'bulkSale.basketUpgrade':'Expand basket to {n} blooms', 'bulkSale.basketMax':'Basket at maximum capacity', 'bulkSale.basketDone':'Basket capacity is now {n}.',
})

function FlowerBatchSale({state, source, t}) {
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState([])
  const [review, setReview] = React.useState(null)
  const [notice, setNotice] = React.useState('')
  const blooms = source === 'storage' ? state.gardeners.storage : state.basket
  const stacks = new Map()
  for (const flower of blooms) {
    const key = itemKey(flower)
    if (stacks.has(key)) stacks.get(key).count++
    else stacks.set(key, {key, flower, count:1, rarity:rarityOf(flower)})
  }
  const entries = [...stacks.values()]
  const keys = selected.filter(key => stacks.has(key))
  const quote = open && keys.length ? quoteFlowerBatch(state, source, keys, Date.now()) : null
  function updateSelection(next) { setSelected(next); setReview(null); setNotice('') }
  function finish(message) { setReview(null); setSelected([]); setOpen(false); setNotice(message) }
  function reviewSale() {
    const current = quoteFlowerBatch(getState(), source, keys, Date.now())
    if (!current || !quote || current.fingerprint !== quote.fingerprint || current.coins !== quote.coins) {
      setNotice(t('bulkSale.stale')); return
    }
    const special = entries.filter(entry => keys.includes(entry.key) && entry.rarity !== 'base').reduce((sum,entry) => sum + entry.count,0)
    setReview({...current, special}); setNotice('')
  }
  function confirmSale() {
    if (!review) return
    const next = sellFlowerBatch(getState(), review, Date.now())
    if (!next) { setReview(null); setNotice(t('bulkSale.stale')); return }
    commit(next, true)
    finish(t('bulkSale.done', {n:review.count, coins:review.coins}))
  }
  const summary = value => t('bulkSale.summary', {stacks:value?.keys.length ?? 0, n:value?.count ?? 0, coins:value?.coins ?? 0})
  return h('section', {className:'fg-batchSale', 'data-bulk-source':source},
    !open ? h('button', {type:'button', className:'fg-btn', 'data-action':'bulkSaleOpen', disabled:!entries.length, onClick:()=>{setNotice('');setOpen(true)}}, t('bulkSale.open')) :
      h('fieldset', {className:'fg-batchPanel'}, h('legend',null,t('bulkSale.open')),
        review ? h('div', {className:'fg-batchReview'},
          h('strong',null,summary(review)),
          review.special > 0 && h('span',{className:'fg-noteWarn'},t('bulkSale.special',{n:review.special})),
          h('button',{type:'button',className:'fg-btn fg-btnDanger','data-action':'bulkSaleConfirm',onClick:confirmSale},t('bulkSale.confirm')))
        : [h('p',{key:'hint',className:'fg-note'},t('bulkSale.hint')),
          h('div',{key:'shortcuts',className:'fg-batchTools'},
            h('button',{type:'button',className:'fg-btn fg-btnSmall',disabled:!entries.some(entry=>entry.rarity==='base'),onClick:()=>updateSelection(entries.filter(entry=>entry.rarity==='base').map(entry=>entry.key))},t('bulkSale.ordinary')),
            h('button',{type:'button',className:'fg-btn fg-btnSmall',disabled:!selected.length,onClick:()=>updateSelection([])},t('bulkSale.clear'))),
          h('div',{key:'stacks',className:'fg-batchChoices'},entries.map(entry=>h('label',{key:entry.key,className:'fg-batchChoice'},
            h('input',{type:'checkbox',checked:keys.includes(entry.key),onChange:event=>updateSelection(event.target.checked ? [...keys,entry.key] : keys.filter(key=>key!==entry.key))}),
            h('span',null,bloomName(entry.flower,t),' · ',t(`bag.rarity.${entry.rarity}`),' ×',entry.count)))),
          h('div',{key:'quote',className:'fg-batchReview'},h('strong',null,summary(quote)),
            h('button',{type:'button',className:'fg-btn fg-btnPrimary','data-action':'bulkSaleReview',disabled:!quote,onClick:reviewSale},t('bulkSale.preview')))],
        h('button',{type:'button',className:'fg-btn fg-btnSmall',onClick:()=>finish('')},t('bulkSale.cancel'))),
    h('span',{className:'fg-batchStatus',role:'status'},notice))
}

function BasketExpansion({state,t}) {
  const [notice, setNotice] = React.useState('')
  const cost = basketUpgradeCost(state)
  if (cost === null) return h('small',{className:'fg-note'},t('bulkSale.basketMax'))
  const nextCapacity = basketCapacity({...state,basketLevel:(state.basketLevel ?? 0) + 1})
  function upgrade() {
    const next = buyItem(getState(), 'basket')
    if (!next) { setNotice(t('staff.failed')); return }
    commit(next,true); setNotice(t('bulkSale.basketDone',{n:basketCapacity(next)}))
  }
  return h('div',{className:'fg-basketExpand'},
    h('button',{type:'button',className:'fg-btn fg-btnSmall','data-action':'expandBackpack',disabled:state.coins<cost,onClick:upgrade},
      t('bulkSale.basketUpgrade',{n:nextCapacity}),' · ',t('staff.coinCost',{coins:cost})),
    state.coins<cost && h('small',{className:'fg-note'},t('room.short',{n:cost-state.coins})),
    h('small',{role:'status'},notice))
}
