
// Garden staff, recruitment and harvested-flower storage.
Object.assign(zh, {
  'tabs.gardeners':'园丁', 'staff.recruit':'园丁招募', 'staff.draw':'招募一次', 'staff.wallet':'持有 {coins} 金币 · 绶带 ×{ribbons}', 'staff.drawPrice':'{coins} 金币 + 绶带 ×{ribbons}', 'staff.needCoins':'{n} 金币', 'staff.needRibbons':'绶带 ×{n}', 'staff.short':'还差 {resources}', 'staff.odds':'招募概率', 'staff.new':'招募到{name}', 'staff.repeat':'再次招募{name}，碎片 +{n}', 'staff.roster':'园丁名册', 'staff.empty':'招募一位园丁，即可派往已开放的花地。', 'staff.idle':'待命', 'staff.harvest':'采花', 'staff.greet':'迎接访客', 'staff.common':'普通', 'staff.rare':'稀有', 'staff.epic':'史诗', 'staff.sprout':'芽芽', 'staff.finch':'雀儿', 'staff.clover':'三叶', 'staff.robin':'知更', 'staff.amber':'琥珀', 'staff.luna':'月露', 'staff.aurum':'金穗', 'staff.legendary':'传说', 'staff.stats':'{stars} 星 · {rank} 阶 · {shards} 碎片', 'staff.interval':'每 {time} 执勤', 'staff.post':'派驻花地', 'staff.occupied':'{scene} · 当前为{name}', 'staff.assign':'派驻', 'staff.recall':'召回', 'staff.stars':'升星', 'staff.rank':'升阶', 'staff.max':'已满', 'staff.cost':'{coins} 金币 · {shards} 碎片', 'staff.storage':'花材储藏室', 'staff.claim':'收入花篮 · {n} 朵', 'staff.storageEmpty':'园丁采到的花会放在这里。', 'staff.full':'花篮已满', 'staff.done':'已保存', 'staff.dismantle':'拆解', 'staff.dismantleConfirm':'确认拆解', 'staff.dismantleCancel':'取消', 'staff.dismantleAssigned':'请先召回园丁', 'staff.dismantleNote':'拆解会移除园丁、星级、阶级和碎片，返还 {n} 金币。', 'staff.shardBreak':'回收 1 碎片', 'staff.shardRefund':'返还 {n} 金币',
})
Object.assign(en, {
  'tabs.gardeners':'Gardeners', 'staff.recruit':'Recruitment', 'staff.draw':'Recruit once', 'staff.wallet':'Available: {coins} coins · ribbons ×{ribbons}', 'staff.drawPrice':'{coins} coins + ribbons ×{ribbons}', 'staff.needCoins':'{n} coins', 'staff.needRibbons':'ribbons ×{n}', 'staff.short':'Still needed: {resources}', 'staff.odds':'Recruitment odds', 'staff.new':'Recruited {name}', 'staff.repeat':'Recruited {name} again · +{n} shards', 'staff.roster':'Gardener roster', 'staff.empty':'Recruit a gardener to staff an open ground.', 'staff.idle':'Off duty', 'staff.harvest':'Harvests flowers', 'staff.greet':'Greets visitors', 'staff.common':'Common', 'staff.rare':'Rare', 'staff.epic':'Epic', 'staff.sprout':'Sprout', 'staff.finch':'Finch', 'staff.clover':'Clover', 'staff.robin':'Robin', 'staff.amber':'Amber', 'staff.luna':'Luna', 'staff.aurum':'Aurum', 'staff.legendary':'Legendary', 'staff.stats':'{stars}★ · Rank {rank} · {shards} shards', 'staff.interval':'Works every {time}', 'staff.post':'Assigned ground', 'staff.occupied':'{scene} · currently {name}', 'staff.assign':'Assign', 'staff.recall':'Recall', 'staff.stars':'Raise stars', 'staff.rank':'Raise rank', 'staff.max':'Max', 'staff.cost':'{coins} coins · {shards} shards', 'staff.storage':'Flower storeroom', 'staff.claim':'Move {n} to basket', 'staff.storageEmpty':'Flowers your gardeners harvest are stored here.', 'staff.full':'Basket full', 'staff.done':'Saved', 'staff.dismantle':'Dismantle', 'staff.dismantleConfirm':'Confirm dismantle', 'staff.dismantleCancel':'Cancel', 'staff.dismantleAssigned':'Recall this gardener first', 'staff.dismantleNote':'Removes the gardener, stars, rank and shards. Refunds {n} coins.', 'staff.shardBreak':'Recycle 1 shard', 'staff.shardRefund':'Refund {n} coins',
})

Object.assign(zh, {'staff.failed':'状态已变化，请再试一次。','staff.claimed':'已收入花篮 {n} 朵','staff.refunded':'已返还 {n} 金币','staff.result':'本次招募','staff.known':'已招募','staff.coinCost':'{coins} 金币'})
Object.assign(en, {'staff.failed':'The garden changed. Please try again.','staff.claimed':'Moved {n} blooms to the basket','staff.refunded':'Refunded {n} coins','staff.result':'Recruitment result','staff.known':'Recruited','staff.coinCost':'{coins} coins'})

Object.assign(zh, {'staff.rankBadge':'{n} 阶', 'staff.shardCount':'碎片 ×{n}'})
Object.assign(en, {'staff.rankBadge':'Rank {n}', 'staff.shardCount':'Shards ×{n}'})

Object.assign(zh, {
  'staff.proc':'触发 {n}', 'staff.drawRate':'招募概率 {n}', 'staff.baseInterval':'基础间隔 {time}', 'staff.currentInterval':'当前间隔 {time}',
  'staff.traitGrowth':'升星和升阶会缩短执勤间隔。每次成功采花或问候后，按固定概率触发一次特性。',
  'staff.trigger.harvest':'成功采花后，{effect}', 'staff.trigger.greet':'成功问候后，{effect}',
  'staff.perk.fertilizer':'草木堆肥', 'staff.reward.fertilizer':'获得肥料 ×{n}',
  'staff.perk.coins':'迎宾小费', 'staff.reward.coins':'获得 {n} 金币',
  'staff.perk.storedBloom':'并蒂采集', 'staff.reward.storedBloom':'额外入库 {n} 朵同花（需有空位）',
  'staff.perk.affinity':'知心来信', 'staff.reward.affinity':'该访客好感 +{n}',
  'staff.perk.ribbon':'花展珍藏', 'staff.reward.ribbon':'获得绶带 ×{n}',
  'staff.perk.charm':'月下祝福', 'staff.reward.charm':'获得幸运符 ×{n}',
  'staff.perk.hybridSeed':'金穗育种', 'staff.reward.hybridSeed':'获得杂交种子 ×{n}（采下的花与同地另一花种）',
})
Object.assign(en, {
  'staff.proc':'{n} proc chance', 'staff.drawRate':'Recruit chance {n}', 'staff.baseInterval':'Base interval {time}', 'staff.currentInterval':'Current interval {time}',
  'staff.traitGrowth':'Stars and ranks shorten the work interval. Each successful harvest or greeting rolls the gardener’s fixed trait chance once.',
  'staff.trigger.harvest':'After a successful harvest, {effect}.', 'staff.trigger.greet':'After a successful greeting, {effect}.',
  'staff.perk.fertilizer':'Leaf Compost', 'staff.reward.fertilizer':'gain {n} fertiliser',
  'staff.perk.coins':'Welcome Tip', 'staff.reward.coins':'gain {n} coins',
  'staff.perk.storedBloom':'Twin Blossom', 'staff.reward.storedBloom':'store {n} extra copy if space allows',
  'staff.perk.affinity':'Dear Friend', 'staff.reward.affinity':'gain {n} affinity with that visitor',
  'staff.perk.ribbon':'Show Ribbon', 'staff.reward.ribbon':'gain {n} ribbon',
  'staff.perk.charm':'Moon Blessing', 'staff.reward.charm':'gain {n} charm',
  'staff.perk.hybridSeed':'Golden Cross', 'staff.reward.hybridSeed':'gain {n} hybrid seed from that flower and another local species',
})

Object.assign(zh, {'staff.manageCard':'培养与管理'})
Object.assign(en, {'staff.manageCard':'Training & management'})

Object.assign(zh, {
  'staff.xiaohei':'罗小黑', 'staff.perk.compost':'林间小礼', 'staff.reward.compost':'获得堆肥 ×{n}',
  'staff.festival':'森林招募会','staff.featuredCat':'史诗园丁 · 罗小黑','staff.ten':'十连招募','staff.tenBenefit':'第十张必得史诗或传说',
  'staff.tenOdds':'十连概率','staff.tenFirst':'前九张各按卡池概率独立抽取。第十张只从以下园丁中抽取。',
  'staff.flip':'翻开第 {n} 张','staff.flipAll':'全部翻开','staff.newBadge':'新园丁','staff.dupeBadge':'碎片 +{n}',
  'staff.tenResult':'十连结果','staff.tenProgress':'已翻开 {n}/10', 'staff.guaranteedCard':'保底',
  'staff.tenPaid':'已招募十次，点选卡背查看园丁。',
})
Object.assign(en, {
  'staff.xiaohei':'Luo Xiaohei', 'staff.perk.compost':'Forest Gift', 'staff.reward.compost':'gain {n} compost',
  'staff.festival':'Woodland Recruitment','staff.featuredCat':'Epic gardener · Luo Xiaohei','staff.ten':'Recruit ten','staff.tenBenefit':'Tenth card is Epic or Legendary',
  'staff.tenOdds':'Ten-draw odds','staff.tenFirst':'The first nine draws each use the pool odds. The tenth uses this pool.',
  'staff.flip':'Reveal card {n}','staff.flipAll':'Reveal all','staff.newBadge':'New recruit','staff.dupeBadge':'+{n} shard',
  'staff.tenResult':'Ten-draw results','staff.tenProgress':'{n}/10 revealed','staff.guaranteedCard':'Guaranteed',
  'staff.tenPaid':'Ten gardeners recruited. Choose a card to reveal it.',
})

function GardenerSpread({results,t}) {
  const [open,setOpen]=React.useState([])
  return h('section',{className:'fg-gachaSpread','aria-label':t('staff.tenResult')},
    h('div',{className:'fg-sectionHead'},h('h4',null,t('staff.tenResult')),
      h('small',{className:'fg-note','aria-live':'polite'},t('staff.tenProgress',{n:open.length})),
      open.length < results.length && h('button',{type:'button',className:'fg-btn fg-btnSmall',onClick:()=>setOpen(results.map((_,i)=>i))},t('staff.flipAll'))),
    h('ol',{className:'fg-gachaTiles'},results.map((item,i)=>{
      const shown=open.includes(i), person=GARDENER_BY_ID.get(item.id)
      return h('li',{key:i},h('button',{type:'button',className:'fg-gachaTile','data-flipped':shown,'data-rarity':shown?person.rarity:undefined,
        'aria-label':shown?`${t(`staff.${item.id}`)} · ${t(item.isNew?'staff.newBadge':'staff.dupeBadge',{n:item.shards})}`:t('staff.flip',{n:i+1}),
        'aria-pressed':shown,onClick:()=>setOpen(prev=>prev.includes(i)?prev:[...prev,i])},
        shown?h(React.Fragment,null,h(GardenerPortrait,{id:item.id}),h('span',{className:'fg-gachaCaption'},h('strong',null,t(`staff.${item.id}`)),h('small',null,t(item.isNew?'staff.newBadge':'staff.dupeBadge',{n:item.shards})))):
        h(React.Fragment,null,h('span',{className:'fg-gachaSeal','aria-hidden':true},i===9?'✧':'❧'),h('small',null,i===9?t('staff.guaranteedCard'):String(i+1).padStart(2,'0')))))
    })))
}

Object.assign(zh, {
  'staff.assignHelp':'在园丁卡上选择花地，再点「派驻」。每块花地可派一人，派驻后切到聊天也会继续执勤。',
  'staff.workOrder':'每次执勤先处理本职工作，其次帮忙采花或问候。有空位时采下的花会进入储藏室。',
  'staff.autoSow':'空闲时自动播种', 'staff.sowHelp':'勾选后，园丁在没有可采花朵和可问候访客时，会在一个空花圃购买并种下本地最便宜的普通种子。金币不足时等待。',
  'staff.sowPrice':'本地种子：{flower} · {coins} 金币', 'staff.nextDuty':'下次执勤：{time}后', 'staff.dutyNow':'即将执勤',
  'staff.work.harvest':'最近收获了第 {n} 块花圃', 'staff.work.greet':'最近问候了第 {n} 块花圃的访客', 'staff.work.sow':'最近播种了第 {n} 块花圃',
})
Object.assign(en, {
  'staff.assignHelp':'Choose a ground on a gardener’s card, then select Assign. Each ground has one gardener. Assigned gardeners keep working in Chat.',
  'staff.workOrder':'On each shift a gardener tries their specialty first, then helps harvest or greet. Harvested flowers go to the storeroom when space allows.',
  'staff.autoSow':'Sow seeds when idle', 'staff.sowHelp':'When enabled, a gardener with no harvest or greeting buys the cheapest local ordinary seed for one empty plot. If coins run short, the gardener waits.',
  'staff.sowPrice':'Local seed: {flower} · {coins} coins', 'staff.nextDuty':'Next shift in {time}', 'staff.dutyNow':'Shift due',
  'staff.work.harvest':'Last harvested plot {n}', 'staff.work.greet':'Last greeted a visitor at plot {n}', 'staff.work.sow':'Last sowed plot {n}',
})

Object.assign(zh, {
  'room.level':'{n} 级储藏室', 'room.capacity':'花材容量', 'room.expand':'扩容至 {n} 朵',
  'room.expanded':'储藏室已扩容至 {n} 朵', 'room.full':'储藏室已满，领取或扩容后可继续入库。',
  'room.max':'已达最高等级', 'room.short':'还差 {n} 金币',
})
Object.assign(en, {
  'room.level':'Level {n} storeroom', 'room.capacity':'Flower capacity', 'room.expand':'Expand to {n} blooms',
  'room.expanded':'Storeroom expanded to {n} blooms', 'room.full':'Storeroom full. Claim flowers or expand to make space.',
  'room.max':'Maximum level reached', 'room.short':'Need {n} more coins',
})

function GardenerStoreroom({state, t, run}) {
  const storage = state.gardeners.storage
  const capacity = gardenerStorageCapacity(state)
  const cost = gardenerStorageUpgradeCost(state)
  const level = state.gardeners.storageLevel ?? 1
  const claimable = Math.min(storage.length, Math.max(0, basketCapacity(state) - state.basket.length))
  const full = storage.length >= capacity
  const stacks = new Map()
  for (const flower of storage) {
    const key = itemKey(flower)
    const stack = stacks.get(key)
    if (stack) stack.count++
    else stacks.set(key, {flower, count:1})
  }
  const nextCapacity = cost === null ? capacity : gardenerStorageCapacity({...state,gardeners:{...state.gardeners,storageLevel:level+1}})
  return h('section',{className:'fg-section fg-room', 'data-storage-level':level},
    h('header',{className:'fg-roomHead'},
      h('div',null,h('small',{className:'fg-note'},t('room.level',{n:level})),h('h3',{className:'fg-sectionTitle'},t('staff.storage'))),
      h('strong',{className:'fg-roomCounter'},storage.length,' / ',capacity)),
    h('progress',{className:'fg-roomMeter', 'aria-label':t('room.capacity'),max:capacity,value:storage.length}),
    full && h('p',{className:'fg-note fg-noteWarn'},t('room.full')),
    stacks.size ? h('ul',{className:'fg-roomShelf','aria-label':t('staff.storage')},Array.from(stacks,([key,{flower,count}])=>{
      const rarity = rarityOf(flower)
      return h('li',{key,className:'fg-roomStack','data-stack':key,'data-rarity':rarity},
        h('div',{className:'fg-roomArt','aria-hidden':true},h(FlowerArt,{speciesId:flower.species,stage:'bloom',variant:flower.variant,trait:flower.trait,tint:flower.tint,dna:flower.dna})),
        h('strong',{className:'fg-roomName'},bloomName(flower,t)),h('small',null,t(`bag.rarity.${rarity}`)),
        h('span',{className:'fg-roomQuantity'},'×',count))
    })) : h('p',{className:'fg-roomEmpty'},t('staff.storageEmpty')),
    h(FlowerBatchSale,{state,source:'storage',t}),
    h('div',{className:'fg-roomActions'},
      h('button',{className:'fg-btn fg-btnPrimary',type:'button','data-action':'claimGardenerFlowers',disabled:claimable===0,onClick:()=>run(claimGardenerFlowers,(before,after)=>t('staff.claimed',{n:after.basket.length-before.basket.length}))},storage.length && !claimable ? t('staff.full') : t('staff.claim',{n:claimable})),
      cost === null ? h('small',{className:'fg-note'},t('room.max')) : h('div',null,
        h('button',{className:'fg-btn',type:'button','data-action':'upgradeGardenerStorage',disabled:state.coins<cost,onClick:()=>run(upgradeGardenerStorage,(_before,after)=>t('room.expanded',{n:gardenerStorageCapacity(after)}))},t('room.expand',{n:nextCapacity}),' · ',t('staff.coinCost',{coins:cost})),
        state.coins<cost && h('small',{className:'fg-note'},t('room.short',{n:cost-state.coins}))))
  )
}

function GardenerBoard({state,t,onChange}) {
  const [reveal,setReveal] = React.useState(null)
  const [notice,setNotice] = React.useState('')
  const [choices,setChoices] = React.useState({})
  const [dismantle,setDismantle] = React.useState(null)
  const staff = state.gardeners
  const owned = GARDENERS.filter(person => staff?.roster?.[person.id])
  const posts = staff?.assignments ?? {}
  const grounds = SCENES.filter(scene => state.scenes[scene.id]?.unlocked > 0)
  const refund = GARDENER_RECYCLE_COINS
  function run(action,resultText) {
    const current = getState()
    const next = action(current)
    if (!next) { setNotice(t('staff.failed')); return }
    onChange(next)
    setNotice(resultText ? resultText(current,next) : t('staff.done'))
  }
  function recruit() {
    run(drawGardener,(before,after) => {
      const id = after.gardeners.lastDraw
      const previous = before.gardeners?.roster[id]
      const text = t(previous ? 'staff.repeat' : 'staff.new',{name:t(`staff.${id}`),n:after.gardeners.roster[id].shards-(previous?.shards ?? 0)})
      setReveal(last => ({id, text, sequence:(last?.sequence ?? 0) + 1}))
      return text
    })
  }
  function recruitTen() {
    const batch = drawGardenerTen(getState())
    if (!batch) { setNotice(t('staff.failed')); return }
    onChange(batch.state)
    setReveal(last => ({results:batch.results, sequence:(last?.sequence ?? 0) + 1}))
    setNotice(t('staff.tenPaid'))
  }
  function drawControl(count) {
    const single = count === 1
    const coins = single ? GARDENER_DRAW_COST : GARDENER_TEN_COST
    const ribbons = single ? GARDENER_DRAW_RIBBONS : GARDENER_TEN_RIBBONS
    const enabled = canRecruitGardeners(state, count)
    const missing = []
    if (state.coins < coins) missing.push(t('staff.needCoins', {n:coins - state.coins}))
    if ((state.ribbons ?? 0) < ribbons) missing.push(t('staff.needRibbons', {n:ribbons - (state.ribbons ?? 0)}))
    return h('div', {className:'fg-staffDrawOption'},
      h('button', {type:'button', className:single ? 'fg-btn' : 'fg-btn fg-gachaTen',
        'data-action':single ? 'recruitGardener' : 'recruitTen', disabled:!enabled, onClick:single ? recruit : recruitTen},
        t(single ? 'staff.draw' : 'staff.ten'), ' · ', t('staff.drawPrice',{coins,ribbons})),
      !enabled && h('small', {className:'fg-note'}, t('staff.short', {resources:missing.join(' + ')})))
  }
  function staffCard(person) {
    const id = person.id, member = staff.roster[id]
    const post = grounds.find(scene => posts[scene.id] === id)?.id ?? ''
    const choice = choices[id] ?? post
    const nextDuty = post ? (staff.workedAt[post] ?? state.lastTick) + gardenerInterval(state,id) - state.lastTick : 0
    const lastWork = post && staff.lastWork?.[post]
    const seed = post && SPECIES_BY_ID.get(SCENE_BY_ID.get(post).species[0])
    return h('article',{key:id,className:'fg-staffCard','data-gardener':id,'data-rarity':person.rarity},
      h('div',{className:'fg-staffMember'},
        portrait(id),
        h('div',null,
          h('div',{className:'fg-sectionHead'},h('strong',null,t(`staff.${id}`)),h('span',{className:'fg-badge'},t(`staff.${person.rarity}`)),h('small',{className:'fg-staffDuty'},post?t(`scene.${post}`):t('staff.idle'))),
          h('p',{className:'fg-note'},t(`staff.${person.role}`),' · ',t('staff.currentInterval',{time:formatDuration(gardenerInterval(state,id),t)})))),
      traitInfo(person),
      post && h('div',{className:'fg-note','data-shift':post},
        h('strong',null,nextDuty > 0 ? t('staff.nextDuty',{time:formatDuration(nextDuty,t)}) : t('staff.dutyNow')),
        lastWork?.id === id && h('div',null,t(`staff.work.${lastWork.action}`,{n:lastWork.index+1})),
        staff.autoSow && seed && h('div',null,t('staff.sowPrice',{flower:t(`species.${seed.id}`),coins:seed.cost}))),
      id === 'xiaohei' && h(XiaoheiPetButton,{t}),
      h('div',{className:'fg-staffProgress',role:'img','aria-label':t('staff.stats',member)},
        h('span',{className:'fg-staffStarRail','aria-hidden':true},Array.from({length:GARDENER_MAX_STARS},(_,i)=>
          h('span',{key:i,'data-lit':i < member.stars},i < member.stars ? '★' : '☆'))),
        h('strong',{className:'fg-staffRank','aria-hidden':true},t('staff.rankBadge',{n:['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ'][member.rank-1]})),
        h('small',{'aria-hidden':true},t('staff.shardCount',{n:member.shards}))),
      h('div',{className:'fg-staffRow'},h('select',{className:'fg-btn','aria-label':`${t(`staff.${id}`)} · ${t('staff.post')}`,value:choice,onChange:event=>setChoices({...choices,[id]:event.target.value})},
        h('option',{value:''},t('staff.idle')),grounds.map(scene=>h('option',{key:scene.id,value:scene.id}, posts[scene.id] && posts[scene.id]!==id ? t('staff.occupied',{scene:t(`scene.${scene.id}`),name:t(`staff.${posts[scene.id]}`)}) : t(`scene.${scene.id}`)))),
        h('button',{type:'button',className:'fg-btn',disabled:choice===post,onClick:()=>run(current=>assignGardener(current,id,choice||null,Date.now()),()=>{setChoices({});return t('staff.done')})},t(choice?'staff.assign':'staff.recall'))),
      h('details',{className:'fg-staffCare'},h('summary',null,t('staff.manageCard')),
      h('div',{className:'fg-staffUpgrades'},['stars','rank'].map(kind=>{
        const cost=gardenerUpgradeCost(state,id,kind)
        return h('div',{key:kind},h('button',{type:'button',className:'fg-btn fg-btnSmall',disabled:!cost||cost.coins>state.coins||cost.shards>member.shards,onClick:()=>run(current=>upgradeGardener(current,id,kind))},t(`staff.${kind}`)),h('small',{className:'fg-note'},cost?t(cost.shards?'staff.cost':'staff.coinCost',cost):t('staff.max')))
      })),
      h('div',{className:'fg-staffDismantle'},
        dismantle === id ? h('div',{className:'fg-staffConfirm'},
          h('p',{className:'fg-note'},t('staff.dismantleNote',{n:refund})),
          h('button',{type:'button',className:'fg-btn fg-btnDanger fg-btnSmall',disabled:!!post,onClick:()=>{
            run(current=>dismantleGardener(current,id),()=>t('staff.refunded',{n:refund}))
            setDismantle(null)
          }},t('staff.dismantleConfirm')),
          h('button',{type:'button',className:'fg-btn fg-btnSmall',onClick:()=>setDismantle(null)},t('staff.dismantleCancel'))
        ) : h('button',{type:'button',className:'fg-btn fg-btnSmall fg-btnGhost',disabled:!!post,onClick:()=>setDismantle(id)},t(post?'staff.dismantleAssigned':'staff.dismantle')),
        member.shards > 0 && h('button',{type:'button',className:'fg-btn fg-btnSmall fg-btnGhost',onClick:()=>run(current=>dismantleGardenerShard(current,id),()=>t('staff.refunded',{n:refund}))},t('staff.shardBreak'),' · ',t('staff.shardRefund',{n:refund})))))
  }
  function portrait(id) {
    return h('div',{className:'fg-staffPortrait','aria-hidden':true},h(GardenerPortrait,{id}))
  }
  function oddsLabel(person) {
    const value = person.weight
    return Number.isInteger(value) ? `${value}%` : `${value.toFixed(2).replace(/0+$/u,'').replace(/\.$/u,'')}%`
  }
  function traitInfo(person) {
    const effect = t(`staff.reward.${person.perk}`, {n:person.amount})
    return h('div',{className:'fg-staffTrait','data-staff-trait':person.id},
      h('div',{className:'fg-staffTraitHead'},h('strong',null,t(`staff.perk.${person.perk}`)),
        h('small',null,t('staff.proc',{n:`${person.chance}%`}))),
      h('span',{className:'fg-note'},t(`staff.trigger.${person.role}`,{effect})))
  }
  function galleryCard(person) {
    return h('li',{key:person.id,className:'fg-staffCandidate','data-candidate':person.id,'data-rarity':person.rarity},
      portrait(person.id),
      h('div',{className:'fg-staffCaption'},
        h('strong',null,t(`staff.${person.id}`)),
        h('span',{className:'fg-note'},t('staff.baseInterval',{time:formatDuration(person.baseSeconds*1000,t)})),
        h('small',null,t(`staff.${person.rarity}`),' · ',t('staff.drawRate',{n:oddsLabel(person)})),
        traitInfo(person)))
  }
  return h('div',{className:'fg-staffBoard'},
    h('section',{className:'fg-section fg-staffRecruit'},
      h('div',{className:'fg-gachaBanner'},
        h('div',{className:'fg-gachaCopy'},h('h3',null,t('staff.festival')),h('strong',null,t('staff.featuredCat')),
          h('span',null,'✦ ',t('staff.tenBenefit'))),
        h('div',{className:'fg-gachaHero','aria-hidden':'true'},h(GardenerPortrait,{id:'xiaohei'}))),
      h('div',{className:'fg-gachaControls'},
        drawControl(1), drawControl(10),
        h('small',{className:'fg-note'},t('staff.wallet',{coins:state.coins,ribbons:state.ribbons ?? 0}))),
      h('details',{className:'fg-gachaRules'},h('summary',null,t('staff.tenOdds')),
        h('p',null,t('staff.tenFirst')),h('ul',null,GARDENER_BONUS_POOL.map(person=>h('li',{key:person.id},t(`staff.${person.id}`),' · ',`${person.weight*100/GARDENER_BONUS_POOL.reduce((sum,entry)=>sum+entry.weight,0)}%`)))),
      reveal?.results && h(GardenerSpread,{key:reveal.sequence,results:reveal.results,t}),
      reveal?.id && h('div',{key:reveal.sequence,className:'fg-staffReveal','data-draw-result':reveal.id},
        portrait(reveal.id), h('div',null,h('small',null,t('staff.result')),h('strong',null,reveal.text),
          h('span',null,t(`staff.${GARDENER_BY_ID.get(reveal.id).rarity}`),' · ',t(`staff.${GARDENER_BY_ID.get(reveal.id).role}`)),traitInfo(GARDENER_BY_ID.get(reveal.id)))),
      h('small',{className:'fg-note'},t('staff.traitGrowth')),
      h('ul',{className:'fg-staffGallery','aria-label':t('staff.odds')},GARDENERS.map(galleryCard))),
    h('p',{role:'status',className:reveal && reveal.text===notice?'fg-staffSr':'fg-staffNotice'},notice),
    h('section',{className:'fg-section'},h('div',{className:'fg-sectionHead'},h('h3',{className:'fg-sectionTitle'},t('staff.roster')),h('span',{className:'fg-sectionMeta'},`${owned.length}/${GARDENERS.length}`)),
      h('p',{className:'fg-note'},t('staff.assignHelp')),
      h('label',{className:'fg-staffRow'},h('input',{type:'checkbox',checked:staff?.autoSow === true,'data-action':'gardenerAutoSow',onChange:event=>{const enabled=event.target.checked;run(current=>setGardenerAutoSow(current,enabled))}}),t('staff.autoSow')),
      h('p',{className:'fg-note'},t('staff.workOrder'),' ',t('staff.sowHelp')),
      owned.length?h('div',{className:'fg-staffGrid'},owned.map(staffCard)):h('p',{className:'fg-empty'},t('staff.empty'))),
    h(GardenerStoreroom,{state,t,run}))
}
