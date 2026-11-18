
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
