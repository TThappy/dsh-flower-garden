
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
