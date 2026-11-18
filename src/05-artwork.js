    // ---------------------------------------------------------------------
    // §5 Artwork. Every plant is modelled on the real one: its habit (clump,
    //    twig, pad, rosette, floating leaf), its foliage and its flower, with
    //    base-to-tip shading and veins on the petals. `PLANTS[species.head]`
    //    draws the bud and bloom stages; the ground follows the species' scene.
    // ---------------------------------------------------------------------
    const SVG_PROPS = { viewBox: '0 0 100 100', 'aria-hidden': 'true', focusable: 'false' }
    const HEAD_X = 50
    const HEAD_Y = 36
    const GROUND_Y = 87
    const UP = { x1: '0.5', y1: '1', x2: '0.5', y2: '0' }

    function n(value) {
      return Math.round(value * 100) / 100
    }

    function mix(a, b, t) {
      const x = parseInt(a.slice(1), 16)
      const y = parseInt(b.slice(1), 16)
      let out = '#'
      for (const shift of [16, 8, 0]) {
        const from = (x >> shift) & 255
        const to = (y >> shift) & 255
        out += Math.round(from + (to - from) * t).toString(16).padStart(2, '0')
      }
      return out
    }

    function lighten(color, t) {
      return mix(color, '#ffffff', t)
    }

    function darken(color, t) {
      return mix(color, '#1d1620', t)
    }

    /** Deterministic jitter in [-0.5, 0.5): petals and leaves are never perfectly regular. */
    let artSalt = 0
    function jit(i, salt) {
      const v = Math.sin(i * 12.9898 + (salt + artSalt) * 78.233) * 43758.5453
      return v - Math.floor(v) - 0.5
    }

    /** Point at distance `r` from (x, y); 0° points up and angles run clockwise. */
    function polar(x, y, r, deg) {
      const a = (deg * Math.PI) / 180
      return [n(x + r * Math.sin(a)), n(y - r * Math.cos(a))]
    }

    /**
     * Paints for one drawing. Gradients are created on demand and collected in
     * `defs`; ids are unique per species and variant, so identical copies on
     * other cards are harmless.
     */
    /** No two plants share a shade: each individual's genes nudge its colours. */
    function individualPal(pal, dna) {
      const a = hashUnit(dna, 1, 9) - 0.5
      const b = hashUnit(dna, 2, 9) - 0.5
      const c = hashUnit(dna, 3, 9) - 0.5
      const shade = color => mix(a >= 0 ? lighten(color, a * 0.34) : darken(color, -a * 0.24), b >= 0 ? '#ffc48a' : '#a9b8ff', Math.abs(b) * 0.18)
      const green = color => (c >= 0 ? lighten(color, c * 0.22) : darken(color, -c * 0.22))
      return { ...pal, petal: shade(pal.petal), petalDeep: shade(pal.petalDeep), leaf: green(pal.leaf), stem: green(pal.stem) }
    }

    function makeInk(species, variant, look) {
      const hidden = variant === 'hidden'
      const dna = look?.dna ?? 0
      const trait = hidden ? undefined : TRAIT_BY_ID.get(look?.trait)
      const repaint = trait !== undefined && trait.stops !== undefined
      let pal = paletteOf(species, variant, look?.tint)
      if (repaint) pal = { ...pal, ...trait.pal }
      if (!hidden && dna !== 0) pal = individualPal(pal, dna)
      const prefix = (hidden ? `fg-hid-${species.id}` : `fg-${species.id}-${variant}`)
        + (look?.tint !== undefined ? `-x${look.tint}` : '')
        + (trait !== undefined ? `-${trait.id}` : '')
        + (dna !== 0 ? `-${dna.toString(36)}` : '')
        + (look?.paintId ? `-${look.paintId}` : '')
      const defs = []
      const made = new Map()
      const add = (tag, name, props, stops) => {
        if (!made.has(name)) {
          defs.push(h(tag, { key: name, id: `${prefix}-${name}`, ...props },
            ...stops.map(([offset, color, alpha], index) => h('stop', {
              key: index, offset: `${offset}%`, stopColor: color, stopOpacity: alpha,
            }))))
          made.set(name, `url(#${prefix}-${name}) ${stops[Math.floor(stops.length / 2)]?.[1] ?? pal.petal}`)
        }
        return made.get(name)
      }
      const ink = {
        pal, hidden, variant, defs,
        lin: (name, stops, dir) => add('linearGradient', name, dir ?? UP, stops),
        rad: (name, stops, props) => add('radialGradient', name, props ?? {}, stops),
        /** A species-specific petal gradient; the spirit bloom keeps its pearl paint. */
        tone: (name, stops) => (hidden || repaint ? ink.petal : ink.lin(name, stops)),
        line: hidden ? '#d8c08e' : darken(pal.petalDeep, 0.2),
        leafLine: darken(pal.leaf, 0.34),
        rib: lighten(pal.leaf, 0.38),
      }
      const lazy = (name, build) => Object.defineProperty(ink, name, { get: build })
      lazy('petal', () => ink.lin('petal', hidden
        ? [[0, HIDDEN_GOLD.tip], [55, HIDDEN_PAL.petal], [100, HIDDEN_GOLD.light]]
        : repaint
          ? trait.stops
          : [[0, pal.petalDeep], [52, pal.petal], [100, lighten(pal.petal, 0.3)]]))
      lazy('back', () => ink.lin('back', hidden
        ? [[0, '#e6c5e0'], [60, HIDDEN_PAL.petalDeep], [100, HIDDEN_PAL.petal]]
        : [[0, darken(pal.petalDeep, 0.14)], [58, mix(pal.petal, pal.petalDeep, 0.6)], [100, pal.petal]]))
      lazy('core', () => ink.rad('core',
        [[0, lighten(pal.center, 0.4)], [55, pal.center], [100, pal.centerDeep]], { cx: '40%', cy: '34%', r: '72%' }))
      // Variegated plants carry cream margins on every leaf.
      const across = { x1: '0', y1: '0.5', x2: '1', y2: '0.5' }
      const margin = (edge, heart) => [[0, edge], [20, edge], [34, heart], [66, heart], [80, edge], [100, edge]]
      const striped = !hidden && traitParts(look?.trait).includes('variegated')
      lazy('leaf', () => (striped
        ? ink.lin('leaf', margin('#f6efc8', pal.leaf), across)
        : ink.lin('leaf', [[0, darken(pal.leaf, 0.22)], [100, lighten(pal.leaf, 0.14)]])))
      lazy('leafBack', () => (striped
        ? ink.lin('leafBack', margin('#e6dcae', darken(pal.leaf, 0.16)), across)
        : ink.lin('leafBack', [[0, darken(pal.leaf, 0.36)], [100, darken(pal.leaf, 0.08)]])))
      return ink
    }

    /** Petal outline: base at the origin, tip straight up; `belly` is where it is widest. */
    function petalD(len, w, tip, belly) {
      const hw = w / 2
      const L = -len
      const B = -len * (belly ?? 0.58)
      const m = B + (L - B) * 0.62
      const rise = `M0,0C${n(-hw * 0.6)},${n(L * 0.06)} ${n(-hw)},${n(B * 0.5)} ${n(-hw)},${n(B)}`
      const fall = `C${n(hw)},${n(B * 0.5)} ${n(hw * 0.6)},${n(L * 0.06)} 0,0Z`
      if (tip === 'point') {
        return `${rise}C${n(-hw)},${n(m)} ${n(-hw * 0.28)},${n(L * 0.94)} 0,${n(L)}`
          + `C${n(hw * 0.28)},${n(L * 0.94)} ${n(hw)},${n(m)} ${n(hw)},${n(B)}${fall}`
      }
      if (tip === 'notch') {
        return `${rise}C${n(-hw)},${n(m)} ${n(-hw * 0.8)},${n(L)} ${n(-hw * 0.36)},${n(L)}`
          + `Q${n(-hw * 0.08)},${n(L)} 0,${n(L * 0.9)}Q${n(hw * 0.08)},${n(L)} ${n(hw * 0.36)},${n(L)}`
          + `C${n(hw * 0.8)},${n(L)} ${n(hw)},${n(m)} ${n(hw)},${n(B)}${fall}`
      }
      return `${rise}C${n(-hw)},${n(m)} ${n(-hw * 0.62)},${n(L)} 0,${n(L)}`
        + `C${n(hw * 0.62)},${n(L)} ${n(hw)},${n(m)} ${n(hw)},${n(B)}${fall}`
    }

    function place(o) {
      return `translate(${n(o.x ?? HEAD_X)} ${n(o.y ?? HEAD_Y)}) rotate(${n(o.rot ?? 0)})`
    }

    /** One petal with an optional midrib and a soft sheen. */
    function petal(key, o) {
      const kids = [h('path', {
        key: 'p', d: o.d ?? petalD(o.len, o.w, o.tip, o.belly),
        fill: o.fill, stroke: o.stroke, strokeWidth: o.sw ?? 0.4, strokeLinejoin: 'round',
      })]
      if (o.vein !== undefined) {
        kids.push(h('path', {
          key: 'v', d: `M0,${n(-o.len * 0.14)}L0,${n(-o.len * 0.8)}`,
          fill: 'none', stroke: o.vein, strokeWidth: 0.32, strokeLinecap: 'round', opacity: o.veinOpacity ?? 0.45,
        }))
      }
      if (o.sheen === true) {
        kids.push(h('path', {
          key: 's', d: `M${n(-o.w * 0.2)},${n(-o.len * 0.3)}Q${n(-o.w * 0.3)},${n(-o.len * 0.6)} ${n(-o.w * 0.12)},${n(-o.len * 0.84)}`,
          fill: 'none', stroke: '#ffffff', strokeWidth: n(o.w * 0.09), strokeLinecap: 'round', opacity: 0.32,
        }))
      }
      return h('g', { key, opacity: o.opacity, transform: place(o) }, ...kids)
    }

    /** Many round dots as one path. */
    function dots(key, points, r, color, opacity) {
      return h('path', {
        key, d: points.map(([x, y]) => `M${n(x)},${n(y)}h.01`).join(''),
        fill: 'none', stroke: color, strokeWidth: n(r * 2), strokeLinecap: 'round', opacity,
      })
    }

    /** Many straight hairs (stamens, veins, spines) as one path. */
    function strokes(key, segments, w, color, opacity) {
      return h('path', {
        key, d: segments.map(([x1, y1, x2, y2]) => `M${n(x1)},${n(y1)}L${n(x2)},${n(y2)}`).join(''),
        fill: 'none', stroke: color, strokeWidth: w, strokeLinecap: 'round', opacity,
      })
    }

    const LEAF_SHAPES = {
      serrate: (t, i) => (i % 2 === 0 ? 1 : 0.86),
      runcinate: (t, i) => (i % 3 === 0 ? 0.3 : i % 3 === 1 ? 1 : 0.62),
      pinnate: (t, i) => (i % 4 === 0 ? 0.26 : i % 4 === 2 ? 1 : 0.7),
    }

    /** Leaf outline from a half-width profile: one routine gives toothed and lobed blades. */
    function profileD(len, w, steps, shape, pow) {
      const left = []
      const right = []
      for (let i = 1; i < steps; i += 1) {
        const t = i / steps
        const half = (w / 2) * Math.sin(Math.PI * Math.pow(t, pow ?? 0.72)) * shape(t, i)
        left.push(`${n(-half)},${n(-len * t)}`)
        right.unshift(`${n(half)},${n(-len * t)}`)
      }
      return `M0,0L${left.join(' ')} 0,${n(-len)} ${right.join(' ')}Z`
    }

    /** A leaf growing from (x, y) toward `rot`, with a midrib and side veins. */
    function leaf(ink, key, o) {
      const { len, w } = o
      const d = o.d ?? (o.shape !== undefined
        ? profileD(len, w, o.steps ?? 16, LEAF_SHAPES[o.shape], o.pow)
        : petalD(len, w, o.tip ?? 'point', o.belly ?? 0.42))
      const rib = o.rib ?? ink.rib
      const kids = [
        h('path', { key: 'b', d, fill: o.fill ?? ink.leaf, stroke: o.stroke ?? ink.leafLine, strokeWidth: 0.38, strokeLinejoin: 'round' }),
        h('path', { key: 'm', d: `M0,0L0,${n(-len * 0.9)}`, fill: 'none', stroke: rib, strokeWidth: 0.4, strokeLinecap: 'round', opacity: 0.8 }),
      ]
      const veins = o.veins ?? 3
      if (veins > 0) {
        let vd = ''
        for (let k = 1; k <= veins; k += 1) {
          const t = k / (veins + 1.3)
          const reach = (w / 2) * 0.7 * Math.sin(Math.PI * Math.pow(Math.min(1, t + 0.12), 0.72))
          vd += `M0,${n(-len * t)}L${n(-reach)},${n(-len * (t + 0.13))}M0,${n(-len * t)}L${n(reach)},${n(-len * (t + 0.13))}`
        }
        kids.push(h('path', { key: 'v', d: vd, fill: 'none', stroke: rib, strokeWidth: 0.25, opacity: 0.6 }))
      }
      if (o.sheen === true) {
        kids.push(h('path', {
          key: 's', d: `M${n(-w * 0.2)},${n(-len * 0.25)}Q${n(-w * 0.32)},${n(-len * 0.55)} ${n(-w * 0.1)},${n(-len * 0.8)}`,
          fill: 'none', stroke: '#ffffff', strokeWidth: n(w * 0.1), strokeLinecap: 'round', opacity: 0.3,
        }))
      }
      return h('g', { key, transform: place(o) }, ...kids)
    }

    /** A strap or sword leaf whose tip leans `curve` units sideways. */
    function blade(ink, key, o) {
      const { len, w } = o
      const curve = o.curve ?? 0
      const kids = [
        h('path', {
          key: 'b',
          d: `M${n(-w * 0.3)},0C${n(-w / 2)},${n(-len * 0.35)} ${n(curve * 0.35 - w / 2)},${n(-len * 0.72)} ${n(curve)},${n(-len)}`
            + `C${n(curve * 0.5 + w / 2)},${n(-len * 0.68)} ${n(w / 2)},${n(-len * 0.3)} ${n(w * 0.3)},0Z`,
          fill: o.fill ?? ink.leaf, stroke: o.stroke ?? ink.leafLine, strokeWidth: o.sw ?? 0.38, strokeLinejoin: 'round',
        }),
      ]
      if (o.plain !== true) {
        kids.push(h('path', {
          key: 'm', d: `M0,0Q${n(curve * 0.1)},${n(-len * 0.6)} ${n(curve * 0.9)},${n(-len * 0.93)}`,
          fill: 'none', stroke: o.rib ?? ink.rib, strokeWidth: 0.35, strokeLinecap: 'round', opacity: 0.7,
        }))
      }
      if (o.spine !== undefined) {
        kids.push(h('path', {
          key: 'sp', d: `M${n(curve)},${n(-len)}l${n(curve * 0.04)},-1.7`,
          fill: 'none', stroke: o.spine, strokeWidth: 0.55, strokeLinecap: 'round',
        }))
      }
      return h('g', { key, transform: place(o) }, ...kids)
    }

    /** A rounded stalk: dark body plus a lit edge. */
    function stemPath(key, d, color, w) {
      return h('g', { key },
        h('path', { d, fill: 'none', stroke: darken(color, 0.2), strokeWidth: w, strokeLinecap: 'round' }),
        h('path', {
          d, fill: 'none', stroke: lighten(color, 0.16), strokeWidth: n(w * 0.42), strokeLinecap: 'round',
          transform: `translate(${n(-w * 0.14)} 0)`,
        }),
      )
    }

    function stem(ink, topY, o) {
      const w = o?.w ?? 2.4
      const bend = o?.bend ?? 2
      const x = o?.x ?? HEAD_X
      const bx = o?.bx ?? 50
      const by = o?.by ?? GROUND_Y
      const span = by - topY
      return stemPath(o?.key ?? 'stem',
        `M${bx},${by}C${n(bx + bend)},${n(by - span * 0.35)} ${n(x - bend)},${n(topY + span * 0.3)} ${x},${n(topY)}`,
        o?.color ?? ink.pal.stem, w)
    }

    /** A closed bud held by two sepals, growing from (x, y). */
    function bud(ink, key, x, y, o) {
      const len = o?.len ?? 12
      const w = o?.w ?? 7
      const sepal = petalD(len * 0.64, w * 0.66, 'point', 0.4)
      return h('g', { key, transform: place({ x, y, rot: o?.rot ?? 0 }) },
        h('path', { d: petalD(len, w, 'point', 0.45), fill: o?.fill ?? ink.petal, stroke: ink.line, strokeWidth: 0.4 }),
        h('path', { d: `M0,${n(-len * 0.3)}L0,${n(-len * 0.88)}`, fill: 'none', stroke: ink.line, strokeWidth: 0.3, opacity: 0.5 }),
        h('path', { d: sepal, fill: ink.leaf, stroke: ink.leafLine, strokeWidth: 0.33, transform: `translate(${n(-w * 0.16)} 0) rotate(-20)` }),
        h('path', { d: sepal, fill: ink.leaf, stroke: ink.leafLine, strokeWidth: 0.33, transform: `translate(${n(w * 0.16)} 0) rotate(20)` }),
      )
    }

    const LAKE = '#9ccfd2'

    /** What the plant stands in: meadow soil, a snow drift, cooled lava, or lake water. */
    function ground(sceneId) {
      if(MORE_GROUND[sceneId])return MORE_GROUND[sceneId]()
      if(sceneId==='desert')return h('g',{key:'ground'},h('ellipse',{cx:50,cy:90,rx:26,ry:6,fill:'#c4a16e'}),h('path',{d:'M27 89Q45 84 73 88M31 92Q54 88 70 91',fill:'none',stroke:'#ead4a5',strokeWidth:1}),h('path',{d:'M35 87l3 -2 3 2M63 89l3 -2 2 2',fill:'#8e785b'}))
      if(sceneId==='woodland')return h('g',{key:'ground'},h('ellipse',{cx:50,cy:90,rx:25,ry:6,fill:'#66533b'}),h('path',{d:'M27 88Q38 81 50 86Q63 81 75 88Q56 94 27 88Z',fill:'#6a8750'}),h('path',{d:'M33 87l5 -3 4 3 -5 2ZM59 88l5 -3 5 3 -5 2Z',fill:'#ae8d53'}))

      if (sceneId === 'snow') {
        return h('g', { key: 'ground' },
          h('ellipse', { cx: 50, cy: 90.2, rx: 23, ry: 4.6, fill: '#6f5a4b' }),
          h('path', { d: 'M26,89.5C28,83.6 40,81.6 50,82C60,81.6 72,83.6 74,89.5C66,93 34,93 26,89.5Z', fill: '#f6f9fd', stroke: '#c3d1e2', strokeWidth: 0.5 }),
          h('path', { d: 'M32,89.4C40,91.6 60,91.6 68,89.2', fill: 'none', stroke: '#cbd9ea', strokeWidth: 1.3, strokeLinecap: 'round', opacity: 0.85 }),
          h('path', { d: 'M35,85.6h.01M62,85h.01M44,84h.01M56,86.4h.01', fill: 'none', stroke: '#ffffff', strokeWidth: 1.1, strokeLinecap: 'round' }),
        )
      }
      if (sceneId === 'volcano') {
        return h('g', { key: 'ground' },
          h('ellipse', { cx: 50, cy: 90, rx: 23, ry: 5, fill: '#2b2523' }),
          h('path', { d: 'M27,89C29,84 38,82.4 50,82.6C62,82.4 71,84 73,89C66,92.4 34,92.4 27,89Z', fill: '#473d3a' }),
          h('path', { d: 'M31,87.6l5,-3 6,1.4 -3,3.4ZM58,84.4l7,.4 3,3.2 -6,.8Z', fill: '#5d524e' }),
          h('path', { d: 'M40,90.2l4,-2.2 5,1M55,90.6l5,-1.6 4,.4', fill: 'none', stroke: '#f08a3c', strokeWidth: 0.6, strokeLinecap: 'round', opacity: 0.9 }),
          h('path', { d: 'M46,85h.01M69,88.6h.01', fill: 'none', stroke: '#f6b45a', strokeWidth: 0.9, strokeLinecap: 'round' }),
        )
      }
      if (sceneId === 'lake') {
        return h('g', { key: 'ground' },
          h('ellipse', { cx: 50, cy: 88.6, rx: 26, ry: 5.8, fill: '#7fb9c2' }),
          h('ellipse', { cx: 50, cy: 88, rx: 26, ry: 5.4, fill: LAKE }),
          h('path', { d: 'M30,88.4c5,-1.6 11,-1.6 15,0M56,90.4c4,-1.2 9,-1.2 13,0M40,91.6c3,-.8 7,-.8 10,0', fill: 'none', stroke: '#e9f7f7', strokeWidth: 0.55, strokeLinecap: 'round', opacity: 0.9 }),
        )
      }
      return h('g', { key: 'ground' },
        h('ellipse', { cx: 50, cy: 90, rx: 22, ry: 5, fill: '#5f402a' }),
        h('path', { d: 'M28,89C30,84.4 40,82.8 50,83C60,82.8 70,84.4 72,89C65,92.2 35,92.2 28,89Z', fill: '#8b5f3c' }),
        h('path', { d: 'M33,87.4c6,-2.6 14,-3 20,-2.6', fill: 'none', stroke: '#a67a52', strokeWidth: 1, strokeLinecap: 'round', opacity: 0.8 }),
        h('path', { d: 'M38,89.6h.01M60,88h.01M52,90.4h.01M66,89.4h.01', fill: 'none', stroke: '#5f402a', strokeWidth: 1, strokeLinecap: 'round' }),
        h('path', { d: 'M31,88.6q-.6,-3.4 -2.4,-5M32.4,88.4q.6,-2.6 2,-3.8M68,88.6q.4,-3.2 2.2,-4.6M66.6,88.4q-.4,-2.4 -1.6,-3.4', fill: 'none', stroke: '#7fae5c', strokeWidth: 0.8, strokeLinecap: 'round' }),
      )
    }

    function seedArt(ink, sceneId) {
      return [
        h('ellipse', { key: 'seed', cx: 50, cy: 85, rx: 3.8, ry: 2.8, fill: '#4a3423', stroke: '#2f2016', strokeWidth: 0.4, transform: 'rotate(-14 50 85)' }),
        h('path', { key: 'shine', d: 'M48,84.2q1.4,-1.2 3,-.8', fill: 'none', stroke: '#8a6a4c', strokeWidth: 0.5, strokeLinecap: 'round' }),
        h('path', { key: 'crack', d: 'M51,83.2c.4,-2.4 2.2,-3.8 4.2,-3.6', fill: 'none', stroke: ink.pal.leaf, strokeWidth: 1.3, strokeLinecap: 'round' }),
        h('path', { key: 'tip', d: petalD(3.4, 2.2, 'point', 0.5), fill: lighten(ink.pal.leaf, 0.15), transform: 'translate(55.2 79.6) rotate(58)' }),
        sceneId === 'lake' ? h('path', { key: 'ring', d: 'M44,87.4c3,1.4 9,1.4 12,0', fill: 'none', stroke: '#e9f7f7', strokeWidth: 0.5 }) : null,
      ]
    }

    /** The young plant: each habit starts differently. */
    function sproutArt(ink, species) {
      const { pal } = ink
      const kind = species.leaf
      if (kind === 'pad') {
        return [
          h('path', { key: 'pad', d: padD(6.5, 8), fill: ink.leaf, stroke: ink.leafLine, strokeWidth: 0.45, transform: 'translate(50 88) rotate(3)' }),
          dots('areole', [[48, 80], [52.4, 78], [49.6, 74.6], [52, 83]], 0.5, '#efe6c0'),
        ]
      }
      if (kind === 'rosette' || kind === 'silver') {
        return [-58, 54, -30, 28, 0].map((rot, i) => blade(ink, `b${i}`, {
          x: 50, y: GROUND_Y, rot, len: 11 + (i % 2) * 2, w: kind === 'silver' ? 2 : 3.6, curve: rot * 0.03,
          fill: kind === 'silver' ? lighten(pal.leaf, 0.25) : ink.leaf,
        }))
      }
      if (kind === 'float') {
        return [
          h('ellipse', { key: 'pad', cx: 50, cy: 84, rx: 11, ry: 3.6, fill: ink.leaf, stroke: ink.leafLine, strokeWidth: 0.4 }),
          h('path', { key: 'cut', d: 'M50,84L57,87.6 60,86.2Z', fill: LAKE }),
          blade(ink, 'roll', { x: 44, y: 85, rot: -8, len: 9, w: 2.4, curve: 1 }),
        ]
      }
      if (kind === 'peltate') {
        return [
          stem(ink, 70, { w: 1.5, bend: 1 }),
          h('path', { key: 'roll', d: petalD(11, 4.4, 'point', 0.5), fill: ink.leaf, stroke: ink.leafLine, strokeWidth: 0.4, transform: 'translate(50 73) rotate(-12)' }),
          h('ellipse', { key: 'pad', cx: 61, cy: 85.4, rx: 7, ry: 2.2, fill: ink.leafBack }),
        ]
      }
      if (kind === 'strap' || kind === 'sword' || kind === 'needle') {
        const thin = kind === 'needle'
        return [-16, 13, -2].map((rot, i) => blade(ink, `b${i}`, {
          x: 50 + rot * 0.08, y: GROUND_Y, rot, len: 15 + i * 3.5, w: thin ? 1.6 : 4, curve: rot * 0.2,
          fill: i === 2 ? ink.leaf : ink.leafBack,
        }))
      }
      const woody = kind === 'twig' || kind === 'glossy' || kind === 'leathery' || kind === 'paddle'
      const parts = [stem(ink, 71, { w: woody ? 2 : 1.6, bend: 1.2 })]
      parts.push(leaf(ink, 'c1', { x: 50, y: 79, rot: -66, len: 8, w: 5.4, tip: 'round', belly: 0.6, veins: 0, fill: ink.leafBack }))
      parts.push(leaf(ink, 'c2', { x: 50, y: 79, rot: 62, len: 8, w: 5.4, tip: 'round', belly: 0.6, veins: 0 }))
      parts.push(leaf(ink, 't1', { x: 50, y: 71.4, rot: -34, len: 7.5, w: 3.8, veins: 2 }))
      parts.push(leaf(ink, 't2', { x: 50, y: 71.4, rot: 30, len: 8.5, w: 4, veins: 2 }))
      return parts
    }

    // ── meadow ────────────────────────────────────────────────────────────

    /** Dandelion: a dense head of strap florets on a hollow scape, over a toothed rosette. */
    function plantDandelion(ink, st) {
      const { pal } = ink
      const parts = []
      ;[-76, 74, -50, 48, -24, 22].forEach((rot, i) => {
        parts.push(leaf(ink, `l${i}`, {
          x: 50 + rot * 0.025, y: GROUND_Y, rot, len: (16 + (i % 3) * 3) * st.k + 4, w: 7, shape: 'runcinate', steps: 19, pow: 1.3,
          veins: 0, fill: i < 2 ? ink.leafBack : ink.leaf,
        }))
      })
      parts.push(stem(ink, st.top + 1, { w: 1.8, bend: 1.6, color: mix(pal.stem, '#dcc7b4', 0.35) }))
      if (!st.bloom) {
        parts.push(h('path', { key: 'tuft', d: petalD(9, 4.6, 'round', 0.7), fill: ink.petal, stroke: ink.line, strokeWidth: 0.4, transform: `translate(50 ${st.top + 1})` }))
        parts.push(h('path', { key: 'cup', d: petalD(8, 6.6, 'point', 0.36), fill: ink.leaf, stroke: ink.leafLine, strokeWidth: 0.4, transform: `translate(50 ${st.top + 3.4})` }))
        return parts
      }
      const rings = [[24, 15.5, 2.7, ink.back, 0], [19, 12, 2.6, ink.petal, 6], [14, 8.6, 2.4, ink.petal, 14], [9, 5.4, 2.1, ink.petal, 3]]
      rings.forEach(([count, len, w, fill, off], r) => {
        for (let i = 0; i < count; i += 1) {
          parts.push(petal(`r${r}-${i}`, {
            y: st.top, rot: (360 / count) * i + off + jit(i, r) * 5, len: len + jit(i, r + 9) * 1.4, w,
            tip: 'round', belly: 0.8, fill, stroke: ink.line, sw: 0.28,
          }))
        }
      })
      parts.push(h('circle', { key: 'eye', cx: 50, cy: st.top, r: 2.3, fill: ink.core }))
      return parts
    }

    /** Daisy: white rays flushed pink at the tip around a domed yellow disc. */
    function plantDaisy(ink, st) {
      const { pal } = ink
      const parts = []
      ;[-78, 76, -50, 46, -20, 18].forEach((rot, i) => {
        parts.push(leaf(ink, `l${i}`, {
          x: 50 + rot * 0.02, y: GROUND_Y, rot, len: 12 + (i % 2) * 2.5, w: 6.4, tip: 'round', belly: 0.68, veins: 2,
          fill: i < 2 ? ink.leafBack : ink.leaf,
        }))
      })
      parts.push(stem(ink, st.top + 1, { w: 1.6, bend: 2.2 }))
      if (!st.bloom) {
        parts.push(bud(ink, 'bud', 50, st.top + 3, { len: 9, w: 6.5 }))
        return parts
      }
      const ray = ink.tone('ray', [[0, pal.petalDeep], [40, pal.petal], [82, pal.petal], [100, mix(pal.petal, '#ee9db6', 0.42)]])
      for (let i = 0; i < 17; i += 1) {
        parts.push(petal(`b${i}`, { y: st.top, rot: (360 / 17) * i + 10.6, len: 16 + jit(i, 1) * 1.2, w: 4, tip: 'round', belly: 0.66, fill: ink.back, stroke: ink.line, sw: 0.3 }))
      }
      for (let i = 0; i < 17; i += 1) {
        parts.push(petal(`f${i}`, { y: st.top, rot: (360 / 17) * i + jit(i, 2) * 4, len: 15 + jit(i, 3) * 1.2, w: 3.8, tip: 'round', belly: 0.66, fill: ray, stroke: ink.line, sw: 0.3, vein: ink.line, veinOpacity: 0.3 }))
      }
      parts.push(h('circle', { key: 'disc', cx: 50, cy: st.top, r: 5.7, fill: ink.core, stroke: pal.centerDeep, strokeWidth: 0.5 }))
      const florets = []
      for (let i = 0; i < 34; i += 1) florets.push(polar(50, st.top, 5 * Math.sqrt((i + 0.5) / 34), i * 137.5))
      parts.push(dots('florets', florets, 0.36, darken(pal.centerDeep, 0.1), 0.55))
      parts.push(h('ellipse', { key: 'shine', cx: 48.2, cy: st.top - 2, rx: 2, ry: 1.2, fill: '#ffffff', opacity: 0.35 }))
      return parts
    }

    /** One five-petalled Prunus blossom with its fan of stamens. */
    function blossom(ink, key, x, y, r, o) {
      const { pal } = ink
      const fill = ink.tone('blossom', [[0, o.flush], [34, pal.petal], [100, lighten(pal.petal, 0.4)]])
      const parts = []
      for (let i = 0; i < 5; i += 1) {
        parts.push(petal(`p${i}`, { x, y, rot: i * 72 + o.spin, len: r, w: r * o.wide, tip: o.tip, belly: 0.64, fill, stroke: ink.line, sw: 0.32 }))
      }
      const hairs = []
      const anthers = []
      for (let i = 0; i < o.stamens; i += 1) {
        const angle = (360 / o.stamens) * i + jit(i, 5) * 16
        const reach = r * o.reach * (0.82 + jit(i, 6) * 0.4)
        const [tx, ty] = polar(x, y, reach, angle)
        hairs.push([x, y, tx, ty])
        anthers.push([tx, ty])
      }
      parts.push(strokes('hair', hairs, 0.28, o.filament))
      parts.push(dots('anther', anthers, r * 0.055 + 0.2, '#e9b23a'))
      parts.push(h('circle', { key: 'eye', cx: x, cy: y, r: r * 0.09 + 0.3, fill: '#a9bd62' }))
      return h('g', { key }, ...parts)
    }

    function roundBud(ink, key, x, y, r, calyx) {
      return h('g', { key },
        h('circle', { cx: x, cy: y, r, fill: ink.petal, stroke: ink.line, strokeWidth: 0.35 }),
        h('path', { d: `M${n(x - r)},${n(y + r * 0.1)}A${r},${r} 0 0 0 ${n(x + r)},${n(y + r * 0.1)}Q${n(x)},${n(y - r * 0.5)} ${n(x - r)},${n(y + r * 0.1)}Z`, fill: calyx }),
      )
    }

    /** Cherry and plum flower on bare wood, so the plant is a twig with spurs. */
    function plantTwig(ink, st, o) {
      const { pal } = ink
      const top = st.top
      const bark = pal.stem
      const parts = [
        stemPath('trunk', `M50,${GROUND_Y}C51.5,77 46.5,69 49,${n(top + 24)}C50.5,${n(top + 16)} 51,${n(top + 10)} 50,${n(top + 4)}`, bark, 2.8),
        stemPath('spurL', `M48.8,${n(top + 27)}C45,${n(top + 23)} 40,${n(top + 21)} 36.6,${n(top + 16.6)}`, bark, 1.5),
        stemPath('spurR', `M50.2,${n(top + 19)}C54,${n(top + 17)} 59,${n(top + 15)} 63,${n(top + 10)}`, bark, 1.4),
        strokes('lenticel', [[49.4, 80, 50.8, 80], [48.6, 72, 49.8, 71.6], [49.6, top + 30, 50.8, top + 30]], 0.4, lighten(bark, 0.35), 0.8),
      ]
      const calyx = mix(pal.centerDeep, bark, 0.45)
      if (o.leaves) {
        parts.push(leaf(ink, 'lf1', { x: 49, y: top + 34, rot: -62, len: 9, w: 4.4, shape: 'serrate', veins: 2 }))
        parts.push(leaf(ink, 'lf2', { x: 50.4, y: top + 28, rot: 58, len: 8, w: 4, shape: 'serrate', veins: 2, fill: ink.leafBack }))
      }
      if (!st.bloom) {
        parts.push(roundBud(ink, 'b0', 50, top + 2.6, 3, calyx))
        parts.push(roundBud(ink, 'b1', 36.2, top + 15.2, 2.4, calyx))
        parts.push(roundBud(ink, 'b2', 63.4, top + 8.8, 2.2, calyx))
        return parts
      }
      const look = { ...o, flush: o.flush ?? mix(pal.petalDeep, pal.centerDeep, 0.5) }
      parts.push(roundBud(ink, 'b1', 64, top + 8.4, 2.5, calyx))
      parts.push(roundBud(ink, 'b2', 57.6, top + 15.4, 1.9, calyx))
      parts.push(roundBud(ink, 'b3', 44, top + 22.4, 1.7, calyx))
      parts.push(blossom(ink, 'side', 35.6, top + 14.6, 8.2, { ...look, spin: 24 }))
      parts.push(blossom(ink, 'main', 50, top, 13.4, { ...look, spin: 0 }))
      return parts
    }

    function plantCherry(ink, st) {
      return plantTwig(ink, st, { leaves: true, tip: 'notch', wide: 1.02, stamens: 13, reach: 0.46, filament: lighten(ink.pal.centerDeep, 0.2) })
    }

    function plantPlum(ink, st) {
      return plantTwig(ink, st, { leaves: false, tip: 'round', wide: 1.08, stamens: 19, reach: 0.66, filament: '#fff6dc' })
    }

    /** Tulip: a cup of overlapping pointed tepals above broad glaucous leaves. */
    function plantTulip(ink, st) {
      const { pal } = ink
      const base = st.top + 11
      const parts = [
        blade(ink, 'l0', { x: 49, y: GROUND_Y, rot: -9, len: 37 * st.k, w: 9.5, curve: -9, fill: ink.leafBack }),
        blade(ink, 'l1', { x: 51, y: GROUND_Y, rot: 11, len: 31 * st.k, w: 9, curve: 9 }),
        stem(ink, base, { w: 2.8, bend: 1.4 }),
      ]
      if (!st.bloom) {
        const green = ink.lin('tbud', [[0, pal.leaf], [55, mix(pal.leaf, pal.petal, 0.55)], [100, pal.petal]])
        parts.push(petal('bud', { x: 50, y: base + 1, len: 16, w: 8, tip: 'point', belly: 0.46, fill: green, stroke: ink.leafLine, vein: ink.leafLine }))
        return parts
      }
      const tepal = { tip: 'point', belly: 0.5, stroke: ink.line, sw: 0.4 }
      parts.push(petal('bl', { ...tepal, x: 48.6, y: base, rot: -17, len: 22.5, w: 11.5, fill: ink.back }))
      parts.push(petal('br', { ...tepal, x: 51.4, y: base, rot: 17, len: 22.5, w: 11.5, fill: ink.back }))
      parts.push(petal('fl', { ...tepal, x: 46.6, y: base, rot: -7, len: 22, w: 11.4, fill: ink.petal, vein: ink.line }))
      parts.push(petal('fr', { ...tepal, x: 53.4, y: base, rot: 7, len: 22, w: 11.4, fill: ink.petal, vein: ink.line }))
      parts.push(petal('fc', { ...tepal, x: 50, y: base + 0.5, len: 20.5, w: 12, fill: ink.petal, vein: ink.line, sheen: true }))
      return parts
    }

    /** A lavender spike: whorls of tubular florets, the lowest whorl set apart. */
    function whorlSpike(ink, key, x, yBot, yTop, s, green) {
      const { pal } = ink
      const tones = green
        ? [mix(pal.petal, pal.leaf, 0.6), mix(pal.petalDeep, pal.leaf, 0.5), pal.leaf]
        : [pal.petal, pal.petalDeep, mix(pal.petal, pal.petalDeep, 0.5)]
      const rows = Math.max(3, Math.round((yBot - yTop) / (3 * s)))
      const parts = []
      const open = []
      for (let r = 0; r < rows; r += 1) {
        const t = r / (rows - 1)
        const y = yBot - (yBot - yTop) * t + (r === 0 ? 2.4 * s : 0)
        const size = s * (1.08 - t * 0.5)
        for (const [j, dx] of [[0, -1.9], [1, 1.9], [2, 0]]) {
          const cx = x + dx * size
          parts.push(h('ellipse', {
            key: `${r}-${j}`, cx: n(cx), cy: n(y - (j === 2 ? 0.8 : 0)), rx: n(1.5 * size), ry: n(2.2 * size),
            fill: ink.hidden ? ink.petal : tones[(r + j) % 3], stroke: darken(pal.petalDeep, 0.28), strokeWidth: 0.25,
            transform: `rotate(${dx * 13} ${n(cx)} ${n(y)})`,
          }))
          if (!green && jit(r * 3 + j, 4) > -0.1) open.push([cx + dx * 0.35, y - 1.1 * size])
        }
      }
      if (open.length > 0) parts.push(dots('open', open, 0.5 * s, lighten(pal.petal, 0.45)))
      return h('g', { key }, ...parts)
    }

    function plantLavender(ink, st) {
      const { pal } = ink
      const top = st.top
      const parts = []
      for (let i = 0; i < 9; i += 1) {
        const rot = -52 + i * 13
        parts.push(blade(ink, `n${i}`, { x: 50 + rot * 0.05, y: GROUND_Y, rot, len: 12 + (i % 3) * 4, w: 1.7, curve: rot * 0.04, plain: true, fill: i % 2 === 0 ? ink.leafBack : ink.leaf }))
      }
      parts.push(stemPath('sL', `M49,${GROUND_Y}C46,72 41,62 39.6,${n(top + 20)}`, pal.stem, 1.1))
      parts.push(stemPath('sR', `M51,${GROUND_Y}C54,74 59,64 60.6,${n(top + 17)}`, pal.stem, 1.1))
      parts.push(stemPath('sM', `M50,${GROUND_Y}C50.6,70 49.4,56 50,${n(top + 10)}`, pal.stem, 1.3))
      parts.push(whorlSpike(ink, 'kL', 39.6, top + 20, st.bloom ? top + 5 : top + 12, 0.8, !st.bloom))
      parts.push(whorlSpike(ink, 'kR', 60.6, top + 17, st.bloom ? top + 3 : top + 10, 0.8, !st.bloom))
      parts.push(whorlSpike(ink, 'kM', 50, top + 10, st.bloom ? top - 13 : top - 1, 1, !st.bloom))
      return parts
    }

    /** A fan-shaped, crinkled petal (poppy): narrow claw, wavy outer edge. */
    function fanD(len, half, seed) {
      const points = []
      for (let i = 0; i <= 14; i += 1) {
        const angle = -half + (2 * half * i) / 14
        const reach = len * (1 + 0.05 * Math.sin(i * 2.3 + seed) + 0.03 * jit(i, seed))
        points.push(polar(0, 0, reach, angle).join(','))
      }
      const [sx] = polar(0, 0, len * 0.45, -half)
      return `M0,0Q${n(sx * 1.25)},${n(-len * 0.2)} ${points.join(' ')}Q${n(-sx * 1.25)},${n(-len * 0.2)} 0,0Z`
    }

    /** Corn poppy: four silky petals with black basal blotches round a ribbed capsule. */
    function plantPoppy(ink, st) {
      const { pal } = ink
      const top = st.top
      const parts = [
        leaf(ink, 'l0', { x: 50, y: GROUND_Y - 6, rot: -64, len: 19, w: 9, shape: 'pinnate', steps: 21, veins: 0, fill: ink.leafBack }),
        leaf(ink, 'l1', { x: 50, y: GROUND_Y - 10, rot: 60, len: 18, w: 9, shape: 'pinnate', steps: 21, veins: 0 }),
        leaf(ink, 'l2', { x: 50, y: GROUND_Y - 2, rot: -32, len: 14, w: 7, shape: 'pinnate', steps: 17, veins: 0 }),
        stem(ink, top + 2, { w: 1.6, bend: 3 }),
      ]
      const hairs = []
      for (let i = 0; i < 9; i += 1) {
        const y = GROUND_Y - 6 - i * 4.6
        if (y < top + 12) break
        hairs.push([50, y, 50 + (i % 2 === 0 ? -1.5 : 1.5), y - 0.8])
      }
      parts.push(strokes('hairs', hairs, 0.25, darken(pal.stem, 0.2), 0.8))
      const podFill = ink.lin('pod', [[0, darken(pal.leaf, 0.15)], [100, lighten(pal.leaf, 0.2)]])
      if (!st.bloom) {
        parts.push(stemPath('hook', `M50,${n(top + 6)}C50,${n(top - 4)} 57,${n(top - 5)} 57.4,${n(top + 2)}`, pal.stem, 1.3))
        parts.push(h('ellipse', { key: 'pod', cx: 57.4, cy: top + 6.4, rx: 3.6, ry: 5.2, fill: podFill, stroke: ink.leafLine, strokeWidth: 0.4 }))
        parts.push(h('path', { key: 'slit', d: `M57.4,${n(top + 2.4)}v7.6`, stroke: ink.hidden ? pal.petalDeep : pal.petal, strokeWidth: 0.7, strokeLinecap: 'round' }))
        return parts
      }
      // The nodding bud beside the open flower is as characteristic as the bloom.
      parts.push(stemPath('side', `M50,${n(top + 34)}C55,${n(top + 26)} 60,${n(top + 16)} 64,${n(top + 15)}C67,${n(top + 14.6)} 68.4,${n(top + 17)} 68,${n(top + 20)}`, pal.stem, 1.1))
      parts.push(h('ellipse', { key: 'pod', cx: 67.8, cy: top + 23.4, rx: 2.7, ry: 4, fill: podFill, stroke: ink.leafLine, strokeWidth: 0.35, transform: `rotate(8 67.8 ${n(top + 23.4)})` }))
      const silk = ink.tone('silk', [[0, '#221620'], [15, '#221620'], [27, darken(pal.petalDeep, 0.1)], [62, pal.petal], [100, lighten(pal.petal, 0.14)]])
      ;[[90, 17.5, 66, 1], [270, 17.5, 66, 2], [0, 16.5, 60, 3], [180, 16, 60, 4]].forEach(([rot, len, half, seed], i) => {
        const folds = [-0.5, 0, 0.5].map(f => {
          const [x1, y1] = polar(0, 0, len * 0.36, f * half)
          const [x2, y2] = polar(0, 0, len * 0.9, f * half * 1.1)
          return [x1, y1, x2, y2]
        })
        parts.push(h('g', { key: `p${i}`, transform: place({ y: top, rot }) },
          h('path', { d: fanD(len, half, seed), fill: silk, stroke: ink.line, strokeWidth: 0.4, strokeLinejoin: 'round', opacity: 0.96 }),
          strokes('fold', folds, 0.3, darken(pal.petalDeep, 0.2), 0.3),
        ))
      })
      const stamens = []
      for (let i = 0; i < 30; i += 1) stamens.push(polar(50, top, 3.9 + (i % 3) * 0.9, i * 12 + jit(i, 2) * 8))
      parts.push(dots('stamens', stamens, 0.55, '#2c2030'))
      parts.push(h('circle', { key: 'ovary', cx: 50, cy: top, r: 3, fill: '#b9c77c', stroke: '#6c7a3a', strokeWidth: 0.4 }))
      parts.push(strokes('stigma', [0, 45, 90, 135, 180, 225, 270, 315].map(a => [50, top, ...polar(50, top, 2.5, a)]), 0.4, '#4c5528'))
      return parts
    }

    /** Sunflower: two rows of rays round a disc whose florets follow the golden angle. */
    function plantSunflower(ink, st) {
      const { pal } = ink
      const top = st.top
      const heart = (len, w) => `M0,0C${n(-w * 0.72)},${n(len * 0.14)} ${n(-w * 0.62)},${n(-len * 0.52)} 0,${n(-len)}C${n(w * 0.62)},${n(-len * 0.52)} ${n(w * 0.72)},${n(len * 0.14)} 0,0Z`
      const parts = [
        strokes('petiole', [[50, top + 30, 45, top + 27], [50, top + 39, 55, top + 36]], 1.1, darken(pal.stem, 0.1)),
        leaf(ink, 'l0', { x: 45, y: top + 27, rot: -64, len: 19 * st.k, w: 17 * st.k, d: heart(19 * st.k, 17 * st.k), veins: 3, fill: ink.leafBack }),
        leaf(ink, 'l1', { x: 55, y: top + 36, rot: 62, len: 17 * st.k, w: 15 * st.k, d: heart(17 * st.k, 15 * st.k), veins: 3 }),
        stem(ink, top + 3, { w: 3.2, bend: 1.6 }),
      ]
      if (!st.bloom) {
        for (let i = 0; i < 9; i += 1) {
          parts.push(petal(`s${i}`, { y: top + 5, rot: -64 + i * 16, len: 10 + (i % 2) * 2, w: 5, tip: 'point', belly: 0.4, fill: i % 2 === 0 ? ink.leafBack : ink.leaf, stroke: ink.leafLine }))
        }
        parts.push(petal('peek', { y: top - 1, len: 6, w: 4.6, tip: 'point', fill: ink.petal, stroke: ink.line }))
        return parts
      }
      for (let i = 0; i < 16; i += 1) {
        parts.push(petal(`b${i}`, { y: top, rot: 22.5 * i + 11.25, len: 19.5 + jit(i, 1) * 1.2, w: 5.6, tip: 'point', belly: 0.64, fill: ink.back, stroke: ink.line, sw: 0.3 }))
      }
      for (let i = 0; i < 16; i += 1) {
        parts.push(petal(`f${i}`, { y: top, rot: 22.5 * i + jit(i, 2) * 4, len: 18 + jit(i, 3) * 1.4, w: 5.2, tip: 'point', belly: 0.64, fill: ink.petal, stroke: ink.line, sw: 0.3, vein: ink.line }))
      }
      const disc = ink.rad('disc', [[0, mix(pal.centerDeep, '#7c8a3a', 0.4)], [34, pal.centerDeep], [72, pal.center], [100, mix(pal.center, '#e0a53a', 0.5)]])
      parts.push(h('circle', { key: 'disc', cx: 50, cy: top, r: 8.6, fill: disc, stroke: darken(pal.centerDeep, 0.1), strokeWidth: 0.5 }))
      const inner = []
      const outer = []
      for (let i = 0; i < 72; i += 1) {
        const point = polar(50, top, 8 * Math.sqrt((i + 0.5) / 72), i * 137.5)
        if (i < 40) inner.push(point)
        else outer.push(point)
      }
      parts.push(dots('seedIn', inner, 0.42, darken(pal.centerDeep, 0.3), 0.75))
      parts.push(dots('seedOut', outer, 0.5, '#e2b04e', 0.9))
      return parts
    }

    /** Lily: six recurved tepals, long stamens with heavy rust anthers, leaves up the stem. */
    function plantLily(ink, st) {
      const { pal } = ink
      const top = st.top
      const parts = []
      const span = GROUND_Y - 6 - (top + 15)
      for (let i = 0; i < 8; i += 1) {
        const t = i / 7
        const side = i % 2 === 0 ? -1 : 1
        parts.push(leaf(ink, `l${i}`, {
          x: 50, y: GROUND_Y - 6 - span * t, rot: side * (64 - t * 22), len: 13 - t * 4, w: 2.9, veins: 0,
          fill: side < 0 ? ink.leafBack : ink.leaf,
        }))
      }
      parts.push(stem(ink, top + 4, { w: 2.2, bend: 1.2 }))
      const pale = ink.lin('lbud', [[0, mix(pal.petal, '#a8c66c', 0.6)], [100, pal.petal]])
      if (!st.bloom) {
        parts.push(petal('bud', { y: top + 6, rot: 4, len: 17, w: 5.6, tip: 'round', belly: 0.6, fill: pale, stroke: ink.line, vein: ink.line }))
        return parts
      }
      parts.push(strokes('pedicel', [[50, top + 14, 59, top + 9]], 1, pal.stem))
      parts.push(petal('side', { x: 59, y: top + 9, rot: 42, len: 13, w: 4.4, tip: 'round', belly: 0.6, fill: pale, stroke: ink.line, vein: ink.line }))
      const throat = ink.tone('throat', [[0, mix(pal.petal, '#a8c66c', 0.5)], [26, pal.petal], [100, lighten(pal.petal, 0.35)]])
      for (let i = 0; i < 3; i += 1) {
        parts.push(petal(`o${i}`, { y: top, rot: i * 120 + 60, len: 18, w: 7.4, tip: 'point', belly: 0.52, fill: ink.back, stroke: ink.line, vein: ink.line }))
      }
      for (let i = 0; i < 3; i += 1) {
        parts.push(petal(`i${i}`, { y: top, rot: i * 120, len: 18.5, w: 9, tip: 'point', belly: 0.52, fill: throat, stroke: ink.line, vein: ink.line, sheen: i === 0 }))
      }
      if (ink.variant === 'alt') {
        const specks = []
        for (let i = 0; i < 18; i += 1) specks.push(polar(50, top, 4 + (i % 3) * 2.2, i * 20 + jit(i, 3) * 10))
        parts.push(dots('speck', specks, 0.4, darken(pal.petalDeep, 0.3), 0.7))
      }
      const filaments = []
      const anthers = []
      for (let i = 0; i < 6; i += 1) {
        const angle = i * 60 + 30
        const [x, y] = polar(50, top, 8.4, angle)
        filaments.push([50, top, x, y])
        anthers.push(h('ellipse', { key: `a${i}`, cx: x, cy: y, rx: 2, ry: 0.85, fill: '#c5651f', stroke: '#8e4313', strokeWidth: 0.3, transform: `rotate(${angle} ${x} ${y})` }))
      }
      parts.push(strokes('filament', filaments, 0.45, '#dbe6b4'), ...anthers)
      const [px, py] = polar(50, top, 10.4, 196)
      parts.push(strokes('style', [[50, top, px, py]], 0.6, '#c9dba0'))
      parts.push(h('circle', { key: 'stigma', cx: px, cy: py, r: 1.15, fill: '#8fb552', stroke: '#5f7f35', strokeWidth: 0.3 }))
      return parts
    }

    /** Rings of petals sharing one centre, widest first: roses and camellias. */
    function petalRings(key, x, y, rings, look) {
      const parts = []
      rings.forEach(([count, len, w, off, fill], r) => {
        for (let i = 0; i < count; i += 1) {
          parts.push(petal(`${r}-${i}`, {
            x, y, rot: (360 / count) * i + off + jit(i, r) * 6, len: len + jit(i, r + 4) * 0.8, w,
            tip: look.tip, belly: look.belly, fill, stroke: look.stroke, sw: 0.36,
          }))
        }
      })
      return h('g', { key }, ...parts)
    }

    /** A pinnate rose leaf: a terminal leaflet and one pair, all toothed. */
    function roseLeaf(ink, key, x, y, rot, s, back) {
      const fill = back ? ink.leafBack : ink.leaf
      return h('g', { key, transform: place({ x, y, rot }) },
        h('path', { d: `M0,0L0,${n(-9 * s)}`, stroke: darken(ink.pal.stem, 0.15), strokeWidth: 0.7, strokeLinecap: 'round' }),
        leaf(ink, 'a', { x: 0, y: -4.6 * s, rot: -62, len: 7.4 * s, w: 4.6 * s, shape: 'serrate', steps: 12, veins: 2, fill }),
        leaf(ink, 'b', { x: 0, y: -4.6 * s, rot: 62, len: 7.4 * s, w: 4.6 * s, shape: 'serrate', steps: 12, veins: 2, fill }),
        leaf(ink, 'c', { x: 0, y: -9 * s, rot: 0, len: 9.4 * s, w: 5.8 * s, shape: 'serrate', steps: 14, veins: 3, fill }),
      )
    }

    /** Rose: a spiral of cupped petals, darkest at the heart, on a thorned cane. */
    function plantRose(ink, st) {
      const { pal } = ink
      const top = st.top
      const cane = darken(pal.stem, 0.08)
      const parts = [
        roseLeaf(ink, 'l0', 50, top + 34, -58, st.k, true),
        roseLeaf(ink, 'l1', 50, top + 26, 56, st.k, false),
        stem(ink, top + 5, { w: 2.2, bend: 2, color: cane }),
        h('path', { key: 'thorns', d: `M50.6,${n(top + 42)}l2.6,-1.4 -1.8,2.4ZM49.6,${n(top + 30)}l-2.6,-1.4 1.8,2.4ZM50.4,${n(top + 19)}l2.4,-1.4 -1.6,2.2Z`, fill: mix(cane, '#a05a4a', 0.5) }),
      ]
      if (!st.bloom) {
        parts.push(bud(ink, 'bud', 50, top + 8, { len: 14, w: 8 }))
        return parts
      }
      for (let i = 0; i < 5; i += 1) {
        parts.push(petal(`s${i}`, { y: top, rot: i * 72 + 36, len: 19.5, w: 4.6, tip: 'point', belly: 0.4, fill: ink.leaf, stroke: ink.leafLine }))
      }
      const cup = ink.tone('cup', [[0, darken(pal.petalDeep, 0.34)], [46, pal.petalDeep], [80, pal.petal], [100, lighten(pal.petal, 0.3)]])
      const heart = ink.tone('heart', [[0, darken(pal.petalDeep, 0.4)], [60, darken(pal.petalDeep, 0.1)], [100, pal.petal]])
      parts.push(petalRings('rings', 50, top, [
        [5, 17.6, 19, 0, cup], [5, 14.2, 15.6, 36, cup], [4, 10.8, 12.4, 14, cup], [3, 7.4, 8.8, 52, heart],
      ], { tip: 'round', belly: 0.64, stroke: ink.line }))
      parts.push(h('path', {
        key: 'swirl',
        d: `M47.4,${n(top + 0.6)}C47.2,${n(top - 2.8)} 52.6,${n(top - 3)} 52.8,${top}C52.9,${n(top + 2.3)} 49,${n(top + 2.6)} 48.7,${n(top + 0.6)}C48.6,${n(top - 1)} 50.9,${n(top - 1.2)} 51.1,${n(top + 0.1)}`,
        fill: 'none', stroke: ink.hidden ? ink.line : darken(pal.petalDeep, 0.42), strokeWidth: 0.6, strokeLinecap: 'round',
      }))
      return parts
    }

    /** Hydrangea mophead: a dome of four-sepalled florets, lit from the upper left. */
    function plantHydrangea(ink, st) {
      const { pal } = ink
      const top = st.top
      const big = { shape: 'serrate', steps: 16, veins: 4 }
      const parts = [
        leaf(ink, 'l0', { ...big, x: 50, y: top + 36, rot: -60, len: 17 * st.k, w: 11 * st.k, fill: ink.leafBack }),
        leaf(ink, 'l1', { ...big, x: 50, y: top + 36, rot: 62, len: 17 * st.k, w: 11 * st.k }),
        leaf(ink, 'l2', { ...big, x: 50, y: top + 20, rot: -76, len: 20 * st.k, w: 13 * st.k }),
        leaf(ink, 'l3', { ...big, x: 50, y: top + 20, rot: 74, len: 20 * st.k, w: 13 * st.k, fill: ink.leafBack }),
        stem(ink, top + 8, { w: 2.5, bend: 1.4 }),
      ]
      const count = st.bloom ? 25 : 9
      const reach = st.bloom ? 13.6 : 6
      const cy = st.bloom ? top : top + 6
      const sepal = petalD(4.7, 4.5, 'round', 0.62)
      parts.push(h('circle', { key: 'under', cx: 50, cy, r: reach + 1.4, fill: st.bloom ? darken(pal.petalDeep, 0.2) : darken(pal.leaf, 0.1) }))
      for (let i = count - 1; i >= 0; i -= 1) {
        const [x, y] = polar(50, cy, reach * Math.sqrt((i + 0.5) / count), i * 137.5)
        const shade = Math.max(0, Math.min(1, 0.45 + ((x - 50) * 0.6 + (y - cy)) / 30 + jit(i, 3) * 0.3))
        const tone = st.bloom ? mix(lighten(pal.petal, 0.22), pal.petalDeep, shade) : mix(lighten(pal.leaf, 0.3), mix(pal.leaf, pal.petal, 0.5), shade)
        const size = (st.bloom ? 1.06 : 0.62) - (i / count) * 0.14
        const spin = 45 + jit(i, 7) * 50
        parts.push(h('g', { key: `f${i}`, transform: `translate(${x} ${y}) rotate(${n(spin)}) scale(${n(size)})` },
          ...[0, 90, 180, 270].map(a => h('path', {
            key: a, d: sepal, transform: `rotate(${a})`,
            fill: ink.hidden ? ink.petal : (a % 180 === 0 ? tone : mix(tone, pal.center, 0.4)),
            stroke: ink.hidden ? ink.line : darken(tone, 0.22), strokeWidth: 0.3,
          })),
          h('circle', { r: 0.75, fill: ink.hidden ? pal.centerDeep : darken(pal.centerDeep, 0.15) }),
        ))
      }
      return parts
    }

    // ── snowfield ─────────────────────────────────────────────────────────

    /** Snowdrop: one nodding flower on an arched scape; the inner cup carries the green mark. */
    function plantSnowdrop(ink, st) {
      const { pal } = ink
      const top = st.top
      const parts = [
        blade(ink, 'l0', { x: 47, y: GROUND_Y, rot: -7, len: 31 * st.k, w: 4.4, curve: -5, fill: ink.leafBack }),
        blade(ink, 'l1', { x: 52, y: GROUND_Y, rot: 9, len: 27 * st.k, w: 4.4, curve: 6 }),
        stemPath('scape', `M49.5,${GROUND_Y}C49,72 46.6,${n(top + 8)} 47,${n(top - 8)}C47.4,${n(top - 14.6)} 52.6,${n(top - 15)} 53,${n(top - 10.4)}`, pal.stem, 1.5),
        blade(ink, 'spathe', { x: 47.6, y: top - 11, rot: 22, len: 7.5, w: 1.8, curve: 2, plain: true }),
      ]
      const hx = 53
      const hy = top - 6
      parts.push(h('ellipse', { key: 'ovary', cx: hx, cy: top - 8.4, rx: 2.1, ry: 2.7, fill: pal.center, stroke: pal.centerDeep, strokeWidth: 0.4 }))
      if (!st.bloom) {
        parts.push(petal('bud', { x: hx, y: hy, rot: 176, len: 10.5, w: 4.6, tip: 'round', belly: 0.62, fill: ink.petal, stroke: ink.line, vein: ink.line }))
        return parts
      }
      parts.push(petal('back', { x: hx, y: hy, rot: 180, len: 15, w: 7, tip: 'round', belly: 0.64, fill: ink.back, stroke: ink.line }))
      parts.push(h('g', { key: 'cup', transform: place({ x: hx, y: hy, rot: 180 }) },
        h('path', { d: petalD(9.6, 6.6, 'notch', 0.7), fill: ink.hidden ? ink.petal : lighten(pal.petal, 0.5), stroke: ink.line, strokeWidth: 0.4 }),
        h('path', { d: 'M-2.4,-6.2C-2.4,-8.8 2.4,-8.8 2.4,-6.2C1.2,-7.5 -1.2,-7.5 -2.4,-6.2Z', fill: pal.center, stroke: pal.centerDeep, strokeWidth: 0.25 }),
      ))
      parts.push(petal('left', { x: hx, y: hy, rot: 212, len: 16.5, w: 7.6, tip: 'round', belly: 0.64, fill: ink.petal, stroke: ink.line, vein: ink.line, veinOpacity: 0.3 }))
      parts.push(petal('right', { x: hx, y: hy, rot: 148, len: 16.5, w: 7.6, tip: 'round', belly: 0.64, fill: ink.petal, stroke: ink.line, vein: ink.line, veinOpacity: 0.3, sheen: true }))
      return parts
    }

    /** A hellebore leaf: five toothed leaflets fanning from the petiole. */
    function palmate(ink, key, x, y, rot, s, back) {
      return h('g', { key, transform: place({ x, y, rot }) },
        h('path', { d: `M0,0L0,${n(-8 * s)}`, stroke: darken(ink.pal.stem, 0.1), strokeWidth: 0.9, strokeLinecap: 'round' }),
        ...[-70, 70, -35, 35, 0].map((a, i) => leaf(ink, `f${i}`, {
          x: 0, y: -8 * s, rot: a, len: (a === 0 ? 13 : 11.5) * s, w: 3.9 * s, shape: 'serrate', steps: 14, veins: 0,
          fill: back || i < 2 ? ink.leafBack : ink.leaf,
        })),
      )
    }

    /** Hellebore: five broad sepals, a ring of green nectaries, a boss of pale stamens. */
    function plantHellebore(ink, st) {
      const { pal } = ink
      const top = st.top
      const stalk = mix(pal.stem, '#8a5266', 0.3)
      const parts = [
        palmate(ink, 'l0', 50, GROUND_Y - 2, -50, st.k, true),
        palmate(ink, 'l1', 50, GROUND_Y - 3, 48, st.k, false),
        stem(ink, top + 4, { w: 2.2, bend: 3, color: stalk }),
        leaf(ink, 'bract', { x: 50, y: top + 15, rot: 118, len: 8, w: 4, veins: 0 }),
      ]
      if (!st.bloom) {
        parts.push(bud(ink, 'bud', 50, top + 6, { len: 11, w: 8, rot: 14 }))
        return parts
      }
      const sepal = ink.tone('sepal', [[0, mix(pal.petal, '#a9c47a', 0.6)], [34, pal.petal], [100, lighten(pal.petal, 0.3)]])
      for (let i = 0; i < 5; i += 1) {
        parts.push(petal(`p${i}`, { y: top, rot: i * 72 + 8, len: 16, w: 16, tip: 'round', belly: 0.6, fill: i < 2 ? ink.back : sepal, stroke: ink.line, vein: ink.line, veinOpacity: 0.3 }))
      }
      parts.push(h('circle', { key: 'boss', cx: 50, cy: top, r: 6, fill: '#ece5bb', opacity: 0.55 }))
      const nectary = []
      for (let i = 0; i < 11; i += 1) nectary.push(polar(50, top, 4.9, i * (360 / 11)))
      parts.push(dots('nectary', nectary, 0.7, '#9cbd58'))
      const stamens = []
      for (let i = 0; i < 30; i += 1) stamens.push(polar(50, top, 4.2 * Math.sqrt((i + 0.5) / 30), i * 137.5))
      parts.push(dots('stamenRim', stamens, 0.68, '#cdb658'))
      parts.push(dots('stamens', stamens, 0.5, '#f6e9a8'))
      parts.push(dots('carpel', [[49.3, top - 0.4], [50.8, top - 0.3], [50, top + 0.8]], 0.6, '#8fae4e'))
      return parts
    }

    /** Edelweiss: felted, uneven bracts round a cluster of small yellowish flower heads. */
    function plantEdelweiss(ink, st) {
      const { pal } = ink
      const top = st.top
      const parts = []
      ;[-70, 66, -40, 38].forEach((rot, i) => {
        parts.push(leaf(ink, `b${i}`, { x: 50, y: GROUND_Y, rot, len: 12, w: 3.6, tip: 'round', belly: 0.6, veins: 0, fill: i < 2 ? ink.leafBack : ink.leaf }))
      })
      for (let i = 0; i < 5; i += 1) {
        const side = i % 2 === 0 ? -1 : 1
        parts.push(leaf(ink, `s${i}`, { x: 50, y: GROUND_Y - 12 - i * 6.4 * st.k, rot: side * (52 - i * 4), len: 9.5 - i * 0.7, w: 2.5, veins: 0 }))
      }
      parts.push(stem(ink, top + 3, { w: 1.7, bend: 1.5, color: lighten(pal.stem, 0.12) }))
      const felt = ink.tone('felt', [[0, mix(pal.petal, '#c2c9a6', 0.6)], [44, pal.petal], [100, lighten(pal.petal, 0.3)]])
      const edge = ink.hidden ? ink.line : darken(pal.petalDeep, 0.16)
      if (!st.bloom) {
        for (let i = 0; i < 5; i += 1) {
          parts.push(petal(`p${i}`, { y: top + 5, rot: -56 + i * 28, len: 9, w: 3.6, tip: 'point', belly: 0.42, fill: felt, stroke: edge }))
        }
        return parts
      }
      const fuzz = { fill: 'none', stroke: '#ffffff', strokeWidth: 0.7, strokeDasharray: '0.5 1.1', strokeLinecap: 'round', opacity: 0.85 }
      const bract = (key, rot, len, w, fill) => h('g', { key, transform: place({ y: top, rot }) },
        h('path', { d: petalD(len, w, 'point', 0.42), fill, stroke: edge, strokeWidth: 0.4, strokeLinejoin: 'round' }),
        h('path', { d: `M0,${n(-len * 0.24)}L0,${n(-len * 0.86)}`, ...fuzz }),
      )
      for (let i = 0; i < 8; i += 1) parts.push(bract(`o${i}`, i * 45 + 12 + jit(i, 1) * 12, 16 + jit(i, 2) * 5, 5.4, ink.hidden ? ink.back : felt))
      for (let i = 0; i < 6; i += 1) parts.push(bract(`i${i}`, i * 60 + 38 + jit(i, 3) * 10, 10.5 + jit(i, 4) * 3, 4.8, felt))
      const heads = [[50, top, 2.5], ...[0, 1, 2, 3, 4, 5].map(i => [...polar(50, top, 4.3, i * 60 + 12), 1.9])]
      heads.slice(1).concat([heads[0]]).forEach(([x, y, r], i) => {
        parts.push(h('circle', { key: `h${i}`, cx: x, cy: y, r, fill: ink.core, stroke: '#fffbea', strokeWidth: 0.55 }))
        parts.push(dots(`hd${i}`, [[x - r * 0.3, y - r * 0.2], [x + r * 0.35, y + r * 0.1], [x, y + r * 0.45], [x + r * 0.1, y - r * 0.5]], 0.28, darken(pal.centerDeep, 0.2), 0.7))
      })
      return parts
    }

    /** Camellia: two tiers of rounded petals round a golden boss, glossy leaves on wood. */
    function plantCamellia(ink, st) {
      const { pal } = ink
      const top = st.top
      const wood = mix(pal.stem, '#7a6450', 0.7)
      const glossy = { tip: 'point', belly: 0.5, veins: 3, sheen: true }
      const parts = [
        leaf(ink, 'l0', { ...glossy, x: 50, y: top + 38, rot: -62, len: 15 * st.k, w: 8.4 * st.k, fill: ink.leafBack }),
        leaf(ink, 'l1', { ...glossy, x: 50, y: top + 30, rot: 60, len: 16 * st.k, w: 8.8 * st.k }),
        leaf(ink, 'l2', { ...glossy, x: 50, y: top + 19, rot: -72, len: 14 * st.k, w: 8 * st.k }),
        stem(ink, top + 5, { w: 2.4, bend: 1.6, color: wood }),
      ]
      if (!st.bloom) {
        parts.push(bud(ink, 'bud', 50, top + 8, { len: 12, w: 9 }))
        return parts
      }
      const satin = ink.tone('satin', [[0, darken(pal.petalDeep, 0.2)], [42, pal.petal], [100, lighten(pal.petal, 0.26)]])
      parts.push(petalRings('rings', 50, top, [
        [6, 17.4, 16.4, 0, ink.back], [6, 14, 14, 30, satin], [5, 10.4, 11, 8, satin],
      ], { tip: 'notch', belly: 0.66, stroke: ink.line }))
      const hairs = []
      const anthers = []
      for (let i = 0; i < 26; i += 1) {
        const [x, y] = polar(50, top, 3 + (i % 3) * 0.9, i * (360 / 26) + jit(i, 2) * 6)
        hairs.push([50, top, x, y])
        anthers.push([x, y])
      }
      parts.push(h('circle', { key: 'boss', cx: 50, cy: top, r: 5, fill: '#f3e3a2', stroke: '#d8b545', strokeWidth: 0.3 }))
      parts.push(strokes('hair', hairs, 0.3, '#fbf3cf'))
      parts.push(dots('anther', anthers, 0.6, '#e2a72a'))
      return parts
    }

    // ── volcanic crater ───────────────────────────────────────────────────

    /** Obovate cactus pad: base at the origin, `2 × ry` tall. */
    function padD(rx, ry) {
      return `M0,0C${n(-rx * 1.25)},${n(-ry * 0.5)} ${n(-rx * 1.05)},${n(-ry * 2)} 0,${n(-ry * 2)}`
        + `C${n(rx * 1.05)},${n(-ry * 2)} ${n(rx * 1.25)},${n(-ry * 0.5)} 0,0Z`
    }

    /** Prickly pear: flat pads studded with areoles; the satin flower sits on a pad's rim. */
    function plantCactus(ink, st) {
      const { pal } = ink
      const top = st.top
      const height = GROUND_Y + 1 - (top + 12)
      const rx = Math.min(13, height * 0.36)
      const skin = ink.lin('pad', [[0, darken(pal.leaf, 0.24)], [100, lighten(pal.leaf, 0.12)]], { x1: '1', y1: '0.6', x2: '0', y2: '0.4' })
      const parts = []
      const areoles = []
      const spines = []
      const stud = (x, y) => {
        areoles.push([x, y])
        spines.push([x, y, x - 1.5, y - 1.2], [x, y, x + 1.6, y - 1], [x, y, x + 0.2, y - 1.9])
      }
      if (st.bloom) {
        parts.push(h('path', { key: 'side', d: padD(7, 9), fill: skin, stroke: ink.leafLine, strokeWidth: 0.45, transform: `translate(40.6 ${n(top + 31)}) rotate(-36)` }))
        parts.push(h('ellipse', { key: 'fruit', cx: 30.4, cy: top + 15.4, rx: 2.5, ry: 3.3, fill: '#b53a5c', stroke: '#7e2440', strokeWidth: 0.35, transform: `rotate(-36 30.4 ${n(top + 15.4)})` }))
        ;[[38, top + 27], [34.6, top + 22], [39, top + 20.6], [35.6, top + 17.4]].forEach(([x, y]) => stud(x, y))
      }
      parts.push(h('path', { key: 'pad', d: padD(rx, height / 2), fill: skin, stroke: ink.leafLine, strokeWidth: 0.5, transform: `translate(50 ${GROUND_Y + 1}) rotate(3)` }))
      for (let row = 1; row <= 5; row += 1) {
        const t = 0.1 + row * 0.15
        const half = rx * 0.95 * Math.sin(Math.PI * Math.pow(t, 0.75)) * 0.8
        const y = GROUND_Y + 1 - height * t
        const lean = (GROUND_Y + 1 - y) * 0.05
        const cols = row % 2 === 0 ? [-0.62, 0, 0.62] : [-0.3, 0.3]
        for (const c of cols) stud(50 + lean + c * half, y)
      }
      parts.push(strokes('spines', spines, 0.25, '#f6efd2', 0.95))
      parts.push(dots('areoles', areoles, 0.55, '#e7dcae'))
      const bx = 52
      const by = top + 12.6
      if (!st.bloom) {
        parts.push(bud(ink, 'bud', bx - 1, by + 0.6, { len: 8, w: 5.4, rot: 4 }))
        return parts
      }
      parts.push(bud(ink, 'bud2', 60.6, top + 22, { len: 6.5, w: 4.2, rot: 38 }))
      parts.push(h('ellipse', { key: 'tube', cx: bx, cy: by + 0.4, rx: 3.6, ry: 3, fill: ink.leaf, stroke: ink.leafLine, strokeWidth: 0.4 }))
      // The open flower is seen from a little above: a face-on rosette, foreshortened.
      const satin = ink.tone('satin', [[0, mix(pal.petalDeep, '#d9641e', 0.45)], [40, pal.petal], [100, lighten(pal.petal, 0.4)]])
      const flower = []
      for (let i = 0; i < 11; i += 1) {
        flower.push(petal(`b${i}`, { x: 0, y: 0, rot: (360 / 11) * i + 8, len: 15.5 + jit(i, 1) * 1.4, w: 7.6, tip: 'point', belly: 0.66, fill: ink.back, stroke: ink.line }))
      }
      for (let i = 0; i < 9; i += 1) {
        flower.push(petal(`f${i}`, { x: 0, y: 0, rot: 40 * i + 26, len: 11.5 + jit(i, 3), w: 7, tip: 'point', belly: 0.66, fill: satin, stroke: ink.line, vein: ink.line, veinOpacity: 0.3 }))
      }
      flower.push(h('circle', { key: 'boss', r: 4.4, fill: '#f6de7c', stroke: '#d6b03c', strokeWidth: 0.4 }))
      const pollen = []
      for (let i = 0; i < 22; i += 1) pollen.push(polar(0, 0, 3.7 * Math.sqrt((i + 0.5) / 22), i * 137.5))
      flower.push(dots('pollen', pollen, 0.5, '#e0a52c'))
      flower.push(dots('stigma', [[-0.9, -0.3], [0.9, -0.3], [0, 0.9]], 0.75, '#8fb552'))
      parts.push(h('g', { key: 'flower', transform: `translate(${bx} ${n(by - 8.6)}) scale(1 0.66)` }, ...flower))
      return parts
    }

    /** ʻŌhiʻa lehua: no showy petals at all, only a pompom of long stamens. */
    function plantLehua(ink, st) {
      const { pal } = ink
      const top = st.top
      const wood = mix(pal.stem, '#7d6652', 0.65)
      const leather = { tip: 'round', belly: 0.56, veins: 0 }
      const parts = [
        leaf(ink, 'l0', { ...leather, x: 50, y: top + 40, rot: -66, len: 12 * st.k, w: 8 * st.k, fill: ink.leafBack }),
        leaf(ink, 'l1', { ...leather, x: 50, y: top + 40, rot: 68, len: 12 * st.k, w: 8 * st.k }),
        leaf(ink, 'l2', { ...leather, x: 50, y: top + 27, rot: -58, len: 11 * st.k, w: 7.4 * st.k }),
        leaf(ink, 'l3', { ...leather, x: 50, y: top + 27, rot: 60, len: 11 * st.k, w: 7.4 * st.k, fill: ink.leafBack }),
        leaf(ink, 'l4', { ...leather, x: 50, y: top + 15, rot: -48, len: 8, w: 5.4, fill: ink.lin('young', [[0, pal.leaf], [100, mix(pal.leaf, '#c98a7a', 0.5)]]) }),
        leaf(ink, 'l5', { ...leather, x: 50, y: top + 15, rot: 50, len: 8, w: 5.4 }),
        stem(ink, top + 6, { w: 2.2, bend: 1.8, color: wood }),
      ]
      if (!st.bloom) {
        const knobs = [[50, top + 3, 2.6], [46.4, top + 5.6, 2.1], [53.6, top + 5.6, 2.1]]
        knobs.forEach(([x, y, r], i) => parts.push(h('circle', { key: `k${i}`, cx: x, cy: y, r, fill: lighten(pal.leaf, 0.3), stroke: ink.leafLine, strokeWidth: 0.35 })))
        parts.push(dots('peek', knobs.map(([x, y]) => [x, y - 0.6]), 0.7, ink.hidden ? pal.petalDeep : pal.petal))
        return parts
      }
      parts.push(h('circle', { key: 'glow', cx: 50, cy: top, r: 10.5, fill: pal.petalDeep, opacity: 0.28 }))
      const passes = [[30, 14.2, 3.4, pal.petalDeep, 0.6], [24, 11.6, 3.4, pal.petal, 0.55], [18, 7.2, 3, lighten(pal.petal, 0.25), 0.5]]
      passes.forEach(([count, len, vary, color, w], pass) => {
        const hairs = []
        const tips = []
        for (let i = 0; i < count; i += 1) {
          const angle = (360 / count) * i + jit(i, pass) * 9 + pass * 5
          const [x1, y1] = polar(50, top, 1.4, angle)
          const [x2, y2] = polar(50, top, len + jit(i, pass + 5) * vary, angle + jit(i, pass + 9) * 6)
          hairs.push([x1, y1, x2, y2])
          tips.push([x2, y2])
        }
        parts.push(strokes(`hair${pass}`, hairs, w, ink.hidden ? [pal.petalDeep, HIDDEN_GOLD.tip, '#ffffff'][pass] : color))
        parts.push(dots(`tip${pass}`, tips, 0.48, pal.center))
      })
      parts.push(h('circle', { key: 'eye', cx: 50, cy: top, r: 1.9, fill: darken(pal.petalDeep, 0.3) }))
      return parts
    }

    /** A flat-topped cluster of upright agave florets with their protruding stamens. */
    function umbel(ink, key, x, y, s) {
      const { pal } = ink
      const parts = []
      const hairs = []
      const tips = []
      for (let i = 0; i < 6; i += 1) {
        const dx = (i - 2.5) * 1.15 * s
        const fy = y - Math.abs(i - 2.5) * -0.3 * s
        parts.push(h('ellipse', { key: i, cx: n(x + dx), cy: n(fy - 1.6 * s), rx: n(0.8 * s), ry: n(2 * s), fill: i % 2 === 0 ? pal.petal : pal.petalDeep, stroke: darken(pal.petalDeep, 0.25), strokeWidth: 0.22, transform: `rotate(${n(dx * 5)} ${n(x + dx)} ${n(fy)})` }))
        hairs.push([x + dx, fy - 3 * s, x + dx * 1.25, fy - 5.2 * s])
        tips.push([x + dx * 1.25, fy - 5.2 * s])
      }
      parts.push(strokes('h', hairs, 0.22, lighten(pal.petal, 0.3)))
      parts.push(dots('t', tips, 0.34 * s + 0.1, lighten(pal.petal, 0.45)))
      return h('g', { key }, ...parts)
    }

    function agaveRosette(ink) {
      const { pal } = ink
      const flesh = ink.lin('flesh', [[0, darken(pal.leaf, 0.26)], [100, lighten(pal.leaf, 0.2)]])
      return [0, -14, 14, -30, 30, -48, 48, -66, 66, -84, 84].map((rot, i) => blade(ink, `r${i}`, {
        x: 50 + rot * 0.03, y: GROUND_Y + 0.5, rot, len: 27 - Math.abs(rot) * 0.07, w: 7, curve: rot * 0.07,
        fill: flesh, stroke: lighten(pal.leaf, 0.42), sw: 0.55, rib: darken(pal.leaf, 0.2), spine: '#5a3b2a',
      }))
    }

    /** Agave: a rosette of armed leaves and, once in a lifetime, a tall branching mast. */
    function plantAgave(ink, st) {
      const { pal } = ink
      const top = st.top
      const mastColor = mix(pal.stem, '#bcc58c', 0.4)
      const parts = []
      if (!st.bloom) {
        parts.push(stemPath('mast', `M50,${GROUND_Y - 12}L50,${n(top - 4)}`, mastColor, 2.6))
        parts.push(petal('tip', { y: top - 2, len: 8, w: 3.6, tip: 'point', belly: 0.3, fill: lighten(pal.leaf, 0.2), stroke: ink.leafLine }))
        parts.push(strokes('scale', [[48.8, top + 8, 50, top + 6], [51.2, top + 14, 50, top + 12], [48.8, top + 20, 50, top + 18]], 0.5, ink.leafLine, 0.7))
        parts.push(...agaveRosette(ink))
        return parts
      }
      parts.push(stemPath('mast', `M50,${GROUND_Y - 12}L50,${n(top - 17)}`, mastColor, 2))
      const levels = [top + 17, top + 11, top + 5, top - 1, top - 7, top - 12]
      levels.forEach((y, i) => {
        const reach = 15.5 - i * 2.1
        for (const side of [-1, 1]) {
          const by = y + (side > 0 ? 2.4 : 0)
          const ex = 50 + side * reach
          parts.push(h('path', { key: `br${i}${side}`, d: `M50,${n(by)}Q${n(50 + side * reach * 0.6)},${n(by - 0.4)} ${n(ex)},${n(by - 3.4)}`, fill: 'none', stroke: darken(mastColor, 0.18), strokeWidth: 0.9, strokeLinecap: 'round' }))
          parts.push(umbel(ink, `u${i}${side}`, ex, by - 3.2, 1.06 - i * 0.07))
        }
      })
      parts.push(umbel(ink, 'crown', 50, top - 17, 0.72))
      parts.push(...agaveRosette(ink))
      return parts
    }

    /** Silversword: a silver sphere of sword leaves, then a column of nodding wine-red heads. */
    function plantSilversword(ink, st) {
      const { pal } = ink
      const top = st.top
      const silver = ink.lin('silver', [[0, darken(pal.leaf, 0.24)], [100, lighten(pal.leaf, 0.62)]])
      const parts = []
      const rosette = []
      for (let i = 0; i < 31; i += 1) {
        const rot = -88 + i * (176 / 30)
        rosette.push([Math.abs(rot), blade(ink, `r${i}`, {
          x: 50 + rot * 0.035, y: GROUND_Y + 1, rot, len: 16.5 + jit(i, 1) * 3 - Math.abs(rot) * 0.02, w: 2, curve: rot * 0.02,
          fill: silver, stroke: darken(pal.leaf, 0.3), sw: 0.25, plain: true,
        })])
      }
      rosette.sort((a, b) => a[0] - b[0])
      const apex = st.bloom ? top - 21 : top + 2
      const foot = GROUND_Y - 12
      parts.push(h('path', { key: 'column', d: `M47.2,${foot}L49,${n(apex)}Q50,${n(apex - 2)} 51,${n(apex)}L52.8,${foot}Z`, fill: mix(pal.stem, '#6f6a55', 0.5), stroke: darken(pal.stem, 0.3), strokeWidth: 0.4 }))
      const rays = []
      const stalks = []
      const discs = []
      const rows = Math.floor((foot - 2 - apex) / 4.4)
      for (let j = 0; j <= rows; j += 1) {
        const y = foot - 3 - j * 4.4
        const size = (st.bloom ? 1 : 0.6) * (1 - j * 0.036)
        const half = 6.6 - j * 0.36
        for (const [x, hy] of [[50 - half, y], [50 + half, y + 1.8], [50 + jit(j, 2) * 2, y - 2.2]]) {
          stalks.push([50, hy + 1.6, x, hy])
          for (let a = 0; a < 9; a += 1) rays.push([x, hy, ...polar(x, hy, 2.5 * size, a * 40 + j * 13)])
          discs.push([x, hy, size])
        }
      }
      parts.push(strokes('stalks', stalks, 0.5, darken(pal.stem, 0.25)))
      if (st.bloom) parts.push(strokes('rays', rays, 0.85, ink.hidden ? HIDDEN_GOLD.tip : pal.petal))
      parts.push(dots('discRim', discs, st.bloom ? 1.3 : 1.1, st.bloom ? pal.petalDeep : darken(pal.leaf, 0.2)))
      parts.push(dots('disc', discs, 0.8, st.bloom ? pal.center : lighten(pal.leaf, 0.3)))
      parts.push(...rosette.map(entry => entry[1]))
      return parts
    }

    /** One plumeria flower: five overlapping pinwheel petals, yellow at the throat. */
    function pinwheel(ink, key, x, y, r, spin) {
      const { pal } = ink
      const d = `M0,0C${n(-r * 0.22)},${n(-r * 0.3)} ${n(-r * 0.52)},${n(-r * 0.76)} ${n(-r * 0.2)},${n(-r)}`
        + `C${n(r * 0.3)},${n(-r * 1.06)} ${n(r * 0.64)},${n(-r * 0.7)} ${n(r * 0.44)},${n(-r * 0.34)}`
        + `C${n(r * 0.3)},${n(-r * 0.14)} ${n(r * 0.12)},${n(-r * 0.04)} 0,0Z`
      const wax = ink.tone('wax', [[0, pal.centerDeep], [16, pal.center], [36, mix(pal.center, pal.petal, 0.6)], [58, pal.petal], [100, lighten(pal.petal, 0.3)]])
      return h('g', { key },
        ...[0, 1, 2, 3, 4].map(i => h('path', { key: i, d, fill: wax, stroke: ink.line, strokeWidth: 0.36, strokeLinejoin: 'round', transform: place({ x, y, rot: i * 72 + spin }) })),
        h('circle', { cx: x, cy: y, r: r * 0.07, fill: pal.centerDeep }),
      )
    }

    /** Plumeria: waxy pinwheels clustered at the tip of a thick, scarred branch. */
    function plantPlumeria(ink, st) {
      const { pal } = ink
      const top = st.top
      const bark = mix(pal.stem, '#aaa293', 0.7)
      const fork = top + 22
      const parts = [
        stemPath('branch', `M50,${GROUND_Y}C50.6,78 49,70 50,${fork}`, bark, 3.6),
        strokes('scar', [[48.6, 80, 51.2, 79.4], [48.8, 73, 51.2, 72.4], [48.8, 66, 51.2, 65.4]], 0.4, darken(bark, 0.25), 0.7),
      ]
      ;[-100, 98, -66, 64, -34, 32].forEach((rot, i) => {
        parts.push(leaf(ink, `l${i}`, { x: 50, y: fork, rot, len: (20 + (i % 2) * 2) * st.k, w: 7.4 * st.k, tip: 'point', belly: 0.6, veins: 6, fill: i < 2 ? ink.leafBack : ink.leaf }))
      })
      parts.push(stemPath('stalk', `M50,${fork}L50,${n(top + 7)}`, pal.stem, 1.6))
      const blush = ink.lin('blush', [[0, mix(pal.petal, '#e58aa6', 0.55)], [100, pal.petal]])
      if (!st.bloom) {
        ;[-26, 0, 24].forEach((rot, i) => parts.push(petal(`b${i}`, { y: top + 9, rot, len: 9 + (i === 1 ? 2 : 0), w: 3, tip: 'round', belly: 0.66, fill: blush, stroke: ink.line })))
        return parts
      }
      parts.push(petal('b0', { x: 45, y: top + 4, rot: -16, len: 15, w: 3, tip: 'round', belly: 0.68, fill: blush, stroke: ink.line }))
      parts.push(petal('b1', { x: 56, y: top + 4, rot: 13, len: 16, w: 3.2, tip: 'round', belly: 0.68, fill: blush, stroke: ink.line }))
      parts.push(pinwheel(ink, 'f1', 40, top + 6.6, 9.8, 22))
      parts.push(pinwheel(ink, 'f2', 60.4, top + 7.4, 9.4, -14))
      parts.push(pinwheel(ink, 'f0', 50, top - 0.6, 13, 8))
      return parts
    }

    // ── lakeside ──────────────────────────────────────────────────────────

    /** Pickerelweed's leaf: a long heart with veins that follow the margin. */
    function arrowLeaf(ink, key, x, y, rot, s, back) {
      return h('g', { key, transform: `${place({ x, y, rot })} scale(${s})` },
        h('path', { d: 'M0,0C-3,3.2 -7.8,2 -7.2,-5C-6.6,-13 -2.6,-21 0,-25C2.6,-21 6.6,-13 7.2,-5C7.8,2 3,3.2 0,0Z', fill: back ? ink.leafBack : ink.leaf, stroke: ink.leafLine, strokeWidth: 0.4, strokeLinejoin: 'round' }),
        h('path', { d: 'M0,0L0,-23M0,-1C-4,-3 -5,-12 -1.4,-21M0,-1C4,-3 5,-12 1.4,-21M0,-1C-2,-5 -2.6,-12 -.6,-20M0,-1C2,-5 2.6,-12 .6,-20', fill: 'none', stroke: ink.rib, strokeWidth: 0.3, opacity: 0.7 }),
        h('path', { d: 'M-4.6,-5Q-4.8,-11 -2.6,-16', fill: 'none', stroke: '#ffffff', strokeWidth: 1, strokeLinecap: 'round', opacity: 0.28 }),
      )
    }

    /** Pickerelweed: a blunt spike of violet-blue flowers, each upper lip marked yellow. */
    function plantPickerel(ink, st) {
      const { pal } = ink
      const top = st.top
      const parts = [
        stemPath('petL', `M47,${GROUND_Y}C44,77 39.4,70 36.4,${n(top + 27)}`, pal.stem, 1.8),
        arrowLeaf(ink, 'leafL', 36.4, top + 27, -22, st.k, false),
        stemPath('petR', `M53,${GROUND_Y}C56,80 60,76 63,${n(top + 36)}`, pal.stem, 1.5),
        arrowLeaf(ink, 'leafR', 63, top + 36, 30, 0.66 * st.k, true),
        stem(ink, top + 12, { w: 2, bend: 1.2 }),
        blade(ink, 'sheath', { x: 50, y: top + 30, rot: 7, len: 13, w: 3.6, curve: 2.4, plain: true }),
      ]
      const rows = st.bloom ? 11 : 6
      const foot = top + 12.4
      const tip = st.bloom ? top - 13 : top + 1
      parts.push(h('path', { key: 'axis', d: `M46.4,${n(foot)}Q46,${n((foot + tip) / 2)} 50,${n(tip - 1)}Q54,${n((foot + tip) / 2)} 53.6,${n(foot)}Z`, fill: st.bloom ? darken(pal.petalDeep, 0.22) : darken(pal.leaf, 0.12) }))
      const spots = []
      for (let r = 0; r < rows; r += 1) {
        const t = r / (rows - 1)
        const y = foot - (foot - tip) * t
        const half = 4.2 * (1 - t * t * 0.78)
        const closed = !st.bloom || t > 0.72
        for (const [j, c] of [[0, -1], [1, 1], [2, 0]]) {
          const x = 50 + c * half + jit(r * 3 + j, 1) * 0.8
          const cy = y - (j === 2 ? 1.3 : 0) + jit(r * 3 + j, 2) * 0.6
          const tone = closed
            ? (st.bloom ? pal.petalDeep : mix(pal.leaf, pal.petal, 0.35))
            : [pal.petal, lighten(pal.petal, 0.22), mix(pal.petal, pal.petalDeep, 0.6)][(r + j) % 3]
          parts.push(h('ellipse', {
            key: `f${r}-${j}`, cx: n(x), cy: n(cy), rx: closed ? 1.2 : 2, ry: closed ? 1.7 : 1.6,
            fill: ink.hidden ? ink.petal : tone, stroke: darken(pal.petalDeep, 0.3), strokeWidth: 0.25,
            transform: `rotate(${n(c * 24 + jit(r + j, 3) * 30)} ${n(x)} ${n(cy)})`,
          }))
          if (!closed && (r + j) % 2 === 0) spots.push([x, cy - 0.4])
        }
      }
      if (spots.length > 0) parts.push(dots('spots', spots, 0.42, '#f4d64e'))
      return parts
    }

    /** A loosestrife spire: whorled six-petalled stars, still in bud toward the tip. */
    function starSpire(ink, key, x0, y0, x1, y1, rows, s, open) {
      const { pal } = ink
      const parts = [h('path', {
        key: 'axis', d: `M${n(x0 - 2.2 * s)},${n(y0)}L${n(x1)},${n(y1 - 2)}L${n(x0 + 2.2 * s)},${n(y0)}Z`,
        fill: mix(pal.leaf, pal.petalDeep, open ? 0.45 : 0.15),
      })]
      const light = []
      const dark = []
      const eyes = []
      const buds = []
      for (let r = 0; r < rows; r += 1) {
        const t = r / (rows - 1)
        const cx = x0 + (x1 - x0) * t
        const cy = y0 + (y1 - y0) * t
        const half = 3.6 * s * (1 - t * 0.72)
        const size = 2.2 * s * (1 - t * 0.3)
        for (const [j, c] of [[0, -1], [1, 1], [2, 0.1]]) {
          const x = cx + c * half + jit(r * 3 + j, 4) * 0.7
          const y = cy - (j === 2 ? 1.4 : 0) + jit(r * 3 + j, 5) * 0.8
          if (!open || t > 0.74) {
            buds.push([x, y])
            continue
          }
          const target = (r + j) % 2 === 0 ? light : dark
          for (let a = 0; a < 6; a += 1) target.push([x, y, ...polar(x, y, size, a * 60 + r * 17)])
          eyes.push([x, y])
        }
      }
      parts.push(strokes('dark', dark, 0.95 * s, ink.hidden ? HIDDEN_GOLD.tip : pal.petalDeep))
      parts.push(strokes('light', light, 0.95 * s, ink.hidden ? '#ffffff' : pal.petal))
      parts.push(dots('eyes', eyes, 0.5 * s, '#f3d86e'))
      parts.push(dots('buds', buds, 0.9 * s, open ? darken(pal.petalDeep, 0.1) : mix(pal.leaf, pal.petal, 0.4)))
      return h('g', { key }, ...parts)
    }

    function plantLoosestrife(ink, st) {
      const { pal } = ink
      const top = st.top
      const foot = top + 17
      const parts = []
      for (let i = 0; i < 4; i += 1) {
        const y = GROUND_Y - 5 - i * ((GROUND_Y - 9 - foot) / 3.4)
        for (const side of [-1, 1]) {
          parts.push(leaf(ink, `l${i}${side}`, { x: 50, y, rot: side * (64 - i * 5), len: 11.5 - i * 1.2, w: 3.2, veins: 0, fill: side < 0 ? ink.leafBack : ink.leaf }))
        }
      }
      parts.push(stemPath('sideStem', `M50,${n(top + 34)}C54,${n(top + 28)} 59.6,${n(top + 22)} 61,${n(top + 13)}`, pal.stem, 1.1))
      parts.push(stem(ink, foot, { w: 1.9, bend: 1 }))
      parts.push(starSpire(ink, 'sideSpire', 61, top + 13, 62.6, st.bloom ? top - 5 : top + 5, st.bloom ? 7 : 4, 0.72, st.bloom))
      parts.push(starSpire(ink, 'spire', 50, foot, 50, st.bloom ? top - 18 : top - 2, st.bloom ? 13 : 7, 1, st.bloom))
      return parts
    }

    /** Yellow flag: three broad falls marked with brown veins, three small standards. */
    function plantIris(ink, st) {
      const { pal } = ink
      const top = st.top
      const parts = [
        blade(ink, 's0', { x: 50, y: GROUND_Y, rot: 3, len: 37 * st.k, w: 4.8, curve: 2, fill: ink.leafBack }),
        blade(ink, 's1', { x: 46, y: GROUND_Y, rot: -8, len: 44 * st.k, w: 4.8, curve: -3 }),
        blade(ink, 's2', { x: 54, y: GROUND_Y, rot: 10, len: 40 * st.k, w: 4.6, curve: 4, fill: ink.leafBack }),
        blade(ink, 's3', { x: 47, y: GROUND_Y, rot: -22, len: 27 * st.k, w: 4.4, curve: -6 }),
        blade(ink, 's4', { x: 53, y: GROUND_Y, rot: 24, len: 25 * st.k, w: 4.4, curve: 7 }),
        stem(ink, top + 7, { w: 2.2, bend: 1.2 }),
      ]
      if (!st.bloom) {
        parts.push(petal('tip', { y: top + 6, len: 13, w: 4.6, tip: 'point', belly: 0.5, fill: ink.petal, stroke: ink.line }))
        parts.push(petal('spathe', { y: top + 8, rot: -6, len: 10, w: 5.4, tip: 'point', belly: 0.42, fill: ink.leaf, stroke: ink.leafLine }))
        return parts
      }
      parts.push(petal('spathe', { x: 50, y: top + 15, rot: 30, len: 10, w: 3.6, tip: 'point', belly: 0.45, fill: ink.leaf, stroke: ink.leafLine }))
      const fall = ink.tone('fall', [[0, mix(pal.petal, '#d08a1a', 0.5)], [36, pal.petal], [100, lighten(pal.petal, 0.3)]])
      const signal = ink.hidden ? '#c9a45a' : '#7a4a16'
      const drawFall = (key, rot, len, w) => h('g', { key, transform: place({ y: top + 1, rot }) },
        h('path', { d: petalD(len, w, 'round', 0.7), fill: fall, stroke: ink.line, strokeWidth: 0.4, strokeLinejoin: 'round' }),
        h('ellipse', { cx: 0, cy: n(-len * 0.4), rx: n(w * 0.26), ry: n(len * 0.2), fill: mix(pal.petal, '#d98a1e', ink.hidden ? 0.15 : 0.55), opacity: 0.8 }),
        strokes('sig', [-0.34, -0.17, 0, 0.17, 0.34].map(f => [0, -len * 0.14, f * w, -len * (0.58 - Math.abs(f) * 0.3)]), 0.3, signal, 0.75),
      )
      for (const rot of [-25, 0, 25]) {
        parts.push(petal(`std${rot}`, { y: top, rot, len: 11.5, w: 4.8, tip: 'point', belly: 0.55, fill: ink.back, stroke: ink.line, vein: ink.line }))
      }
      parts.push(drawFall('fallL', -112, 18.5, 10.5))
      parts.push(drawFall('fallR', 112, 18.5, 10.5))
      for (const rot of [-64, 64]) {
        parts.push(petal(`arm${rot}`, { y: top + 0.6, rot, len: 8, w: 4.6, tip: 'notch', belly: 0.7, fill: ink.hidden ? ink.petal : lighten(pal.petal, 0.2), stroke: ink.line }))
      }
      parts.push(drawFall('fallC', 180, 18, 14.5))
      parts.push(petal('armC', { y: top - 0.6, rot: 180, len: 6.4, w: 5, tip: 'notch', belly: 0.7, fill: ink.hidden ? ink.petal : lighten(pal.petal, 0.2), stroke: ink.line }))
      return parts
    }

    /** Water lily: a floating, notched pad and a bowl of pointed petals round golden stamens. */
    function plantWaterlily(ink, st) {
      const { pal } = ink
      const padFill = ink.lin('pad', [[0, darken(pal.leaf, 0.2)], [100, lighten(pal.leaf, 0.16)]], { x1: '1', y1: '0.5', x2: '0', y2: '0.3' })
      const parts = [
        h('ellipse', { key: 'pad2', cx: 27, cy: 76, rx: 10, ry: 3.2, fill: ink.leafBack, stroke: ink.leafLine, strokeWidth: 0.35 }),
        h('ellipse', { key: 'pad', cx: 50, cy: 81, rx: 25, ry: 7.4, fill: padFill, stroke: ink.leafLine, strokeWidth: 0.45 }),
        h('path', { key: 'cut', d: 'M50,81L65,89.4 72.6,86.2Z', fill: LAKE }),
        strokes('veins', [-150, -110, -70, -30, 10, 150].map(a => [50, 81, 50 + 22 * Math.sin((a * Math.PI) / 180), 81 - 6.4 * Math.cos((a * Math.PI) / 180)]), 0.3, ink.rib, 0.6),
        h('path', { key: 'rim', d: 'M27,79.4C32,75.4 42,74 52,74.2', fill: 'none', stroke: '#ffffff', strokeWidth: 0.7, strokeLinecap: 'round', opacity: 0.3 }),
      ]
      if (!st.bloom) {
        parts.push(bud(ink, 'bud', 50, 79, { len: 16, w: 8.4, rot: 3 }))
        return parts
      }
      const row = (key, rots, len, w, y, fill, extra) => rots.forEach((rot, i) => parts.push(petal(`${key}${i}`, {
        y, rot, len: len + jit(i, len) * 1.2, w, tip: 'point', belly: 0.5, fill, stroke: ink.line, vein: ink.line, veinOpacity: 0.28, ...extra,
      })))
      row('b', [-54, -36, -18, 0, 18, 36, 54], 23, 7.8, 75, ink.back)
      row('m', [-68, -42, -15, 15, 42, 68], 20, 7.8, 76, ink.petal)
      const hairs = []
      const tips = []
      for (let i = 0; i < 15; i += 1) {
        const [x, y] = polar(50, 73, 7 + jit(i, 2) * 2.4, -46 + i * 6.6)
        hairs.push([50, 73, x, y])
        tips.push([x, y])
      }
      parts.push(strokes('stamen', hairs, 0.9, pal.center))
      parts.push(dots('anther', tips, 0.55, pal.centerDeep))
      const lit = ink.tone('lit', [[0, pal.petalDeep], [40, lighten(pal.petal, 0.2)], [100, lighten(pal.petal, 0.55)]])
      row('s', [-90, 90], 21, 7.6, 77, ink.petal)
      row('q', [-106, 106], 16, 6.6, 77.6, ink.back)
      row('f', [-50, -25, 0, 25, 50], 10.5, 7.6, 78.4, lit, { sheen: true })
      return parts
    }

    /** A lotus leaf seen from the side: a round, wavy-rimmed shield on its own stalk. */
    function shieldLeaf(ink, key, x, y, rx, ry, tilt) {
      const rim = []
      const veins = []
      for (let i = 0; i < 36; i += 1) {
        const a = (i / 36) * Math.PI * 2
        const wave = 1 + 0.045 * Math.sin(i * 1.75)
        rim.push(`${n(rx * wave * Math.cos(a))},${n(ry * wave * Math.sin(a))}`)
        if (i % 3 === 0) veins.push([0, -ry * 0.15, rx * 0.92 * Math.cos(a), ry * 0.92 * Math.sin(a)])
      }
      const fill = ink.rad('shield', [[0, darken(ink.pal.leaf, 0.3)], [22, ink.pal.leaf], [100, lighten(ink.pal.leaf, 0.12)]], { cx: '50%', cy: '42%', r: '60%' })
      return h('g', { key, transform: `translate(${x} ${n(y)}) rotate(${tilt})` },
        h('path', { d: `M${rim.join('L')}Z`, fill, stroke: ink.leafLine, strokeWidth: 0.45, strokeLinejoin: 'round' }),
        strokes('v', veins, 0.3, ink.rib, 0.6),
        h('path', { d: `M${n(-rx * 0.8)},${n(-ry * 0.3)}Q${n(-rx * 0.3)},${n(-ry * 0.95)} ${n(rx * 0.4)},${n(-ry * 0.78)}`, fill: 'none', stroke: '#ffffff', strokeWidth: 0.7, strokeLinecap: 'round', opacity: 0.3 }),
      )
    }

    /** Lotus: held high above the water, petals pale at the base and rose at the tip. */
    function plantLotus(ink, st) {
      const { pal } = ink
      const top = st.top
      const base = top + 11
      const parts = [
        stemPath('leafStalk', `M41,${GROUND_Y}C40,79 35,72 33.4,${n(top + 25)}`, pal.stem, 1.7),
        shieldLeaf(ink, 'leaf', 33, top + 24, 15.5 * st.k, 5.6 * st.k, -7),
        stemPath('stalk', `M56,${GROUND_Y}C57,75 51,64 50,${n(base + 1)}`, pal.stem, 2),
        dots('prickle', [[55.6, 80], [54.2, 73], [52.2, 66]], 0.35, darken(pal.stem, 0.3)),
      ]
      const blush = ink.tone('blush', [[0, lighten(pal.petal, 0.8)], [44, lighten(pal.petal, 0.36)], [82, pal.petal], [100, pal.petalDeep]])
      const shade = ink.hidden ? ink.back : ink.lin('shade', [[0, lighten(pal.petal, 0.55)], [50, pal.petal], [100, darken(pal.petalDeep, 0.1)]])
      if (!st.bloom) {
        parts.push(bud(ink, 'bud', 50, base + 1, { len: 18, w: 10, fill: blush }))
        return parts
      }
      parts.push(stemPath('budStalk', `M60,${GROUND_Y}C62,77 66,68 66.6,${n(top + 24)}`, pal.stem, 1.3))
      parts.push(bud(ink, 'sideBud', 66.6, top + 24, { len: 11, w: 6, rot: 6, fill: blush }))
      const row = (key, rots, len, w, y, fill, extra) => rots.forEach((rot, i) => parts.push(petal(`${key}${i}`, {
        y, rot, len, w, tip: 'point', belly: 0.52, fill, stroke: ink.line, vein: ink.line, veinOpacity: 0.3, ...extra,
      })))
      row('d', [-114, 114], 16.5, 8.4, base, shade)
      row('b', [-38, -19, 0, 19, 38], 24, 10, base, shade)
      row('s', [-80, 80], 20.5, 9.4, base, blush)
      row('m', [-59, 59], 23, 10, base, blush)
      const hairs = []
      for (let i = 0; i < 17; i += 1) hairs.push([50, top + 6, ...polar(50, top + 6, 7 + jit(i, 3) * 2, -80 + i * 10)])
      parts.push(strokes('stamen', hairs, 0.6, '#f3d76a'))
      parts.push(h('path', { key: 'cone', d: `M45,${n(top - 1)}L48,${n(top + 7)}L52,${n(top + 7)}L55,${n(top - 1)}Z`, fill: mix(pal.center, '#a9b85a', 0.55), stroke: '#8a9a44', strokeWidth: 0.3 }))
      parts.push(h('ellipse', { key: 'pod', cx: 50, cy: top - 1, rx: 5, ry: 2.3, fill: pal.center, stroke: pal.centerDeep, strokeWidth: 0.4 }))
      parts.push(dots('seeds', [[47.4, top - 1], [50, top - 1.8], [52.6, top - 1], [48.8, top - 0.2], [51.2, top - 0.2]], 0.42, pal.centerDeep))
      row('f', [-31, 31], 12.5, 9.6, base + 1, blush, { sheen: true })
      row('c', [0], 9.6, 10, base + 1.4, blush)
      return parts
    }

    /** One drawing routine per `species.head`; each handles the bud and the open flower. */
// Common drawing vocabulary; each species below has its own habit and floral geometry.
function nfRay(ink, key, x, y, count, len, width, options = {}) {
  return Array.from({ length: count }, (_, i) => petal(`${key}${i}`, {
    x, y, rot: i * 360 / count + (options.offset ?? 0), len: len + jit(i, 4) * .9, w: width,
    fill: options.fill ?? ink.petal, stroke: ink.line, vein: ink.line, veinOpacity: .25,
    tip: options.tip ?? 'round', ...options,
  }))
}
function nfCore(ink, key, x, y, r) {
  return h('g', { key }, h('circle', { cx: x, cy: y, r, fill: ink.core, stroke: ink.pal.centerDeep, strokeWidth: .35 }),
    dots('pollen', Array.from({ length: 13 }, (_, i) => polar(x, y, r * Math.sqrt((i + .4) / 13), i * 137.5)), .38, lighten(ink.pal.center, .4)))
}
function nfFern(ink, key, x, y, len, rotation) {
  return h('g', { key, transform: place({ x, y, rot: rotation }) },
    stemPath('axis', `M0,0Q2,${-len / 2} 0,${-len}`, ink.pal.stem, .65),
    ...Array.from({ length: 7 }, (_, i) => h('g', { key: i },
      leaf(ink, 'l', { x: 1, y: -i * len / 8, len: (len - i * len / 8) * .45, w: 2.7, rot: -65, veins: 0 }),
      leaf(ink, 'r', { x: 1, y: -i * len / 8, len: (len - i * len / 8) * .45, w: 2.7, rot: 65, veins: 0 }))))
}
function nfHeartLeaf(ink, key, x, y, scale, rotation = 0) {
  return h('g', { key, transform: `${place({ x, y, rot: rotation })} scale(${scale})` },
    h('path', { d: 'M0,0C-19,-4 -23,-17 -13,-21C-6,-24 -2,-17 0,-14C2,-17 7,-24 14,-20C24,-14 15,-4 0,0Z', fill: ink.leaf, stroke: ink.leafLine, strokeWidth: .5 }),
    h('path', { d: 'M0,0L0,-14M0,-5L-12,-16M0,-7L12,-16', fill: 'none', stroke: ink.rib, strokeWidth: .55 }))
}
const NEW_PLANTS = {
  cosmos(ink, st) {
    const y = st.top, parts = [stem(ink, y, { w: 1.5, bend: 4 }), nfFern(ink, 'left', 49, 75, 24, -61), nfFern(ink, 'right', 52, 67, 22, 57)]
    if (!st.bloom) return [...parts, bud(ink, 'bud', 50, y + 3, { len: 11, w: 7 })]
    parts.push(...nfRay(ink, 'ray', 50, y, 8, 21, 12, { tip: 'notch', offset: 22.5 }), nfCore(ink, 'disk', 50, y, 4.8))
    return parts
  },
  zinnia(ink, st) {
    const y = st.top + 2, parts = [stem(ink, y + 7, { w: 3 }), leaf(ink, 'l', { x: 50, y: 73, len: 24, w: 12, rot: -58, veins: 5 }), leaf(ink, 'r', { x: 51, y: 73, len: 24, w: 12, rot: 58, veins: 5 })]
    if (!st.bloom) return [...parts, bud(ink, 'bud', 50, y + 7, { len: 13, w: 12 })]
    for (let row = 0; row < 4; row++) parts.push(...nfRay(ink, `r${row}`, 50, y - row * 1.3, 14 - row * 2, 21 - row * 4, 7.4 - row * .8, { offset: row * 13, fill: row % 2 ? ink.petal : ink.back }))
    parts.push(nfCore(ink, 'disk', 50, y - 3, 4), ...nfRay(ink, 'florets', 50, y - 3, 7, 5, 2.3, { fill: ink.core }))
    return parts
  },
  cornflower(ink, st) {
    const y = st.top, parts = [stem(ink, y + 8, { w: 1.7 }), leaf(ink, 'l', { x: 50, y: 77, len: 27, w: 5, rot: -24 }), leaf(ink, 'r', { x: 51, y: 65, len: 22, w: 4, rot: 40 })]
    parts.push(h('ellipse', { key: 'involucre', cx: 50, cy: y + 6, rx: 7, ry: 9, fill: ink.leaf, stroke: ink.leafLine, strokeWidth: .5 }))
    for (let i = 0; i < 9; i++) parts.push(h('path', { key: `scale${i}`, d: `M${45 + i % 3 * 4},${y + 1 + Math.floor(i / 3) * 4}l2,-2 2,2 -2,3Z`, fill: ink.leafBack, stroke: '#5b4f3f', strokeWidth: .4 }))
    if (!st.bloom) return [...parts, bud(ink, 'bud', 50, y + 1, { len: 10, w: 6 })]
    for (let i = 0; i < 10; i++) parts.push(h('path', { key: `funnel${i}`, transform: place({ x: 50, y: y - 1, rot: i * 36 }), d: 'M-1,0L-3,-10 -8,-16 -6,-19 -2,-15 0,-22 2,-15 6,-19 8,-16 3,-10 1,0Z', fill: ink.petal, stroke: ink.line, strokeWidth: .45 }))
    parts.push(...nfRay(ink, 'corefloret', 50, y - 1, 14, 7, 2, { fill: ink.back }), nfCore(ink, 'eye', 50, y - 1, 2.6))
    return parts
  },
  calendula(ink, st) {
    const y = st.top + 3, parts = [stem(ink, y, { w: 2.7 }), leaf(ink, 'l', { x: 49, y: 82, len: 27, w: 12, rot: -55, tip: 'round', belly: .68 }), leaf(ink, 'r', { x: 51, y: 69, len: 21, w: 10, rot: 49, tip: 'round', belly: .7 })]
    if (!st.bloom) return [...parts, bud(ink, 'bud', 50, y, { len: 12, w: 9 })]
    parts.push(...nfRay(ink, 'outer', 50, y, 25, 21, 4.4), ...nfRay(ink, 'inner', 50, y, 19, 15, 4, { offset: 7, fill: ink.back }), nfCore(ink, 'disk', 50, y, 6.7))
    return parts
  },
  snapdragon(ink, st) {
    const top = st.top - 14, parts = [stem(ink, top + 2, { w: 2.2 })]
    for (let i = 0; i < 4; i++) for (const side of [-1, 1]) parts.push(leaf(ink, `leaf${i}:${side}`, { x: 50, y: 83 - i * 7, len: 18 - i * 2, w: 5, rot: side * 65 }))
    const count = st.bloom ? 8 : 4
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? 1 : -1, x = 50 + side * (7 - i * .35), y = top + 39 - i * 5.5
      parts.push(stemPath(`pedicel${i}`, `M50,${y + 2}L${x},${y}`, ink.pal.stem, .7))
      if (!st.bloom || i > 5) parts.push(bud(ink, `bud${i}`, x, y, { len: 6, w: 4, rot: side * 30 }))
      else parts.push(h('g', { key: `mouth${i}`, transform: `translate(${x} ${y}) scale(${side} 1)` },
        h('path', { d: 'M-3,3Q-6,-2 -3,-7Q3,-12 9,-7L10,-2Q5,0 3,-2Q8,2 11,3Q11,9 5,8Q-1,9 -3,3Z', fill: ink.petal, stroke: ink.line, strokeWidth: .5 }),
        h('path', { d: 'M1,0Q5,-2 9,1', fill: 'none', stroke: ink.pal.center, strokeWidth: 2.2 })))
    }
    return parts
  },
  crocus(ink, st) {
    const y = st.top + 20, parts = []
    for (let i = 0; i < 7; i++) parts.push(blade(ink, `leaf${i}`, { x: 50, y: 90, len: 34 + i % 3 * 7, w: 2.4, curve: (i - 3) * 6, rib: '#e6e8d0' }))
    parts.push(stem(ink, y, { w: 2, by: 88 }))
    if (!st.bloom) return [...parts, bud(ink, 'bud', 50, y + 2, { len: 19, w: 7 })]
    for (const angle of [-28, 0, 28]) parts.push(petal(`back${angle}`, { x: 50, y: y + 8, rot: angle, len: 29, w: 14, fill: ink.back, stroke: ink.line, vein: ink.line }))
    parts.push(strokes('anthers', [[48, y - 1, 46, y - 9], [50, y - 1, 50, y - 12], [52, y - 1, 54, y - 9]], 1.6, ink.pal.center))
    for (const angle of [-62, 62]) parts.push(petal(`front${angle}`, { x: 50, y: y + 8, rot: angle, len: 21, w: 12, fill: ink.petal, stroke: ink.line, vein: ink.line }))
    parts.push(petal('centre', { x: 50, y: y + 8, len: 14, w: 16, fill: ink.petal, stroke: ink.line }))
    return parts
  },
  daffodil(ink, st) {
    const y = st.top + 3, parts = [stemPath('scape', `M48,90L48,${y + 6}Q48,${y - 5} 54,${y}`, ink.pal.stem, 2)]
    for (let i = 0; i < 5; i++) parts.push(blade(ink, `leaf${i}`, { x: 50, y: 90, len: 42 + i % 2 * 10, w: 4.2, curve: (i - 2) * 7 }))
    if (!st.bloom) return [...parts, bud(ink, 'bud', 54, y + 5, { rot: 55, len: 16, w: 7 })]
    parts.push(...nfRay(ink, 'tepal', 52, y, 6, 22, 13, { offset: 30, tip: 'point' }))
    parts.push(h('path', { key: 'trumpet', d: `M47,${y - 4}L41,${y + 8}Q51,${y + 17} 63,${y + 8}L57,${y - 4}Z`, fill: ink.core, stroke: ink.pal.centerDeep, strokeWidth: .6 }),
      h('ellipse', { key: 'rim', cx: 52, cy: y + 8, rx: 11, ry: 5.2, fill: ink.pal.centerDeep, stroke: ink.pal.center, strokeWidth: 2 }), dots('pollen', [[49,y+8],[52,y+7],[55,y+8]], .6, lighten(ink.pal.center,.4)))
    return parts
  },
  primrose(ink, st) {
    const parts = []
    for (let i = 0; i < 8; i++) parts.push(leaf(ink, `rosette${i}`, { x: 50, y: 88, len: 27, w: 13, rot: -85 + i * 24, shape: 'serrate', veins: 7, tip: 'round' }))
    for (const [i,x,y] of [[0,35,st.top+16],[1,53,st.top+2],[2,68,st.top+20]]) {
      parts.push(stem(ink, y, { key: `stem${i}`, x, bx: 50, w: 1.2 }))
      if (!st.bloom) parts.push(bud(ink, `bud${i}`, x, y + 3, { len: 8, w: 5 }))
      else parts.push(...nfRay(ink, `p${i}`, x, y, 5, 12, 10, { tip: 'notch', offset: i * 15 }), nfCore(ink, `eye${i}`, x, y, 2.8))
    }
    return parts
  },
  pansy(ink, st) {
    const y = st.top + 8, parts = [stem(ink, y, { w: 1.7, bend: 5 }), leaf(ink, 'left', { x: 50, y: 81, len: 22, w: 12, rot: -55, shape: 'serrate' }), leaf(ink, 'right', { x: 52, y: 70, len: 18, w: 10, rot: 52, shape: 'serrate' })]
    if (!st.bloom) return [...parts, bud(ink, 'bud', 50, y, { len: 10, w: 7, rot: -15 })]
    for (const [i,rot,len,w] of [[0,-27,24,19],[1,27,24,19],[2,-88,20,17],[3,88,20,17],[4,180,24,27]]) {
      parts.push(petal(`petal${i}`, { x: 50, y, rot, len, w, fill: i < 2 ? ink.back : ink.petal, stroke: ink.line, tip: 'round' }))
      if (i > 1) parts.push(petal(`face${i}`, { x: 50, y, rot, len: len*.6, w: w*.42, fill: ink.hidden ? ink.back : ink.pal.centerDeep, opacity: .75 }))
    }
    parts.push(h('path', { key: 'eye', d: `M46,${y}Q50,${y-4} 54,${y}Q50,${y+5} 46,${y}`, fill: ink.pal.center }))
    return parts
  },
  bleedingheart(ink, st) {
    const top = st.top, parts = [stemPath('arch', `M47,90C45,62 33,${top-7} 74,${top+6}`, ink.pal.stem, 1.7), nfFern(ink, 'l', 48, 82, 30, -58), nfFern(ink, 'r', 49, 76, 29, 64)]
    for (let i = 0; i < 5; i++) {
      const x = 35 + i * 9, y = top + 8 + (i - 1) * (i - 1) * .8
      parts.push(stemPath(`hang${i}`, `M${x},${y-7}L${x},${y+1}`, ink.pal.stem, .65))
      if (!st.bloom) parts.push(bud(ink, `bud${i}`, x, y + 8, { len: 9, w: 5, rot: 180 }))
      else parts.push(h('g', { key: `heart${i}`, transform: `translate(${x} ${y}) scale(${1-i*.07})` },
        h('path', { d: 'M0,12C-3,7 -10,3 -8,-3C-6,-8 -1,-6 0,-2C1,-6 6,-8 8,-3C10,3 3,7 0,12Z', fill: ink.petal, stroke: ink.line, strokeWidth: .5 }),
        h('path', { d: 'M0,6C-1,10 -4,13 0,17C4,13 1,10 0,6Z', fill: ink.hidden ? ink.petal : ink.pal.center, stroke: ink.line, strokeWidth: .35 })))
    }
    return parts
  },
  hibiscus(ink, st) {
    const y = st.top + 3, parts = [stem(ink, y + 7, { w: 3, color: '#82775b' }), leaf(ink, 'left', { x: 50, y: 78, len: 26, w: 17, rot: -60, shape: 'serrate', veins: 5 }), leaf(ink, 'right', { x: 51, y: 67, len: 22, w: 14, rot: 55, shape: 'serrate' })]
    if (!st.bloom) return [...parts, bud(ink, 'bud', 50, y + 3, { len: 18, w: 8 })]
    parts.push(...nfRay(ink, 'petal', 50, y, 5, 27, 25, { offset: 18, tip: 'round' }), h('circle', { key: 'throat', cx: 50, cy: y, r: 5, fill: ink.back }))
    parts.push(stemPath('column', `M50,${y}Q54,${y-8} 66,${y-18}`, ink.pal.center, 1.6))
    const pollen = Array.from({ length: 14 }, (_, i) => [54 + i * .7 + (i%2 ? 2 : -1), y - 6 - i * .7])
    parts.push(dots('anthers', pollen, .85, ink.pal.center), strokes('stigmas', [[65,y-17,65,y-22],[65,y-17,69,y-20],[65,y-17,70,y-16]], .6, ink.line), dots('tips', [[65,y-22],[69,y-20],[70,y-16]], 1, ink.pal.petalDeep))
    return parts
  },
  birdofparadise(ink, st) {
    const y = st.top + 5, parts = [stem(ink, y + 5, { w: 3 }), stemPath('leafstem1','M45,90L29,64',ink.pal.stem,1.8), stemPath('leafstem2','M52,90L71,58',ink.pal.stem,1.8), leaf(ink,'leaf1',{x:29,y:64,len:34,w:17,rot:-22,veins:8,sheen:true}), leaf(ink,'leaf2',{x:71,y:58,len:38,w:18,rot:18,veins:8,sheen:true})]
    parts.push(h('path',{key:'spathe',d:`M32,${y+7}Q48,${y+2} 78,${y+2}Q66,${y+13} 44,${y+13}Z`,fill:ink.leafBack,stroke:ink.leafLine,strokeWidth:.6}))
    if (!st.bloom) return parts
    for (const [i,x,rot,len] of [[0,47,-24,29],[1,53,-6,35],[2,60,17,28]]) parts.push(petal(`orange${i}`,{x,y:y+6,rot,len,w:7,tip:'point',fill:ink.petal,stroke:ink.line,vein:ink.line}))
    parts.push(h('path',{key:'blue',d:`M48,${y+6}Q66,${y-11} 81,${y-8}L64,${y+4}L59,${y+8}Z`,fill:ink.hidden?ink.petal:ink.pal.center,stroke:ink.hidden?ink.line:ink.pal.centerDeep,strokeWidth:.5}))
    return parts
  },
  gazania(ink, st) {
    const y = st.top + 9, parts = [stem(ink,y,{w:1.8})]
    for(let i=0;i<7;i++) parts.push(leaf(ink,`leaf${i}`,{x:50,y:89,len:30,w:7,rot:-78+i*26,shape:'pinnate',veins:2,fill:i%2?ink.leaf:ink.leafBack}))
    if(!st.bloom) return [...parts,bud(ink,'bud',50,y+2,{len:12,w:7})]
    parts.push(...nfRay(ink,'ray',50,y,16,23,6.4,{tip:'point'}))
    for(let i=0;i<16;i++) parts.push(petal(`mark${i}`,{x:50,y,rot:i*22.5,len:12,w:4,fill:ink.hidden?ink.back:ink.pal.centerDeep,opacity:.85}))
    parts.push(nfCore(ink,'disk',50,y,6.5))
    return parts
  },
  redhotpoker(ink, st) {
    const top=st.top-16, parts=[stem(ink,top+39,{w:2.5})]
    for(let i=0;i<8;i++) parts.push(blade(ink,`leaf${i}`,{x:50,y:90,len:38+i%3*7,w:3.4,curve:(i-3.5)*7}))
    const fill=ink.tone('torch',[[0,ink.pal.center],[45,ink.pal.petal],[100,ink.pal.petalDeep]])
    for(let row=0;row<(st.bloom?9:5);row++) {
      const width=3+Math.sin(row/10*Math.PI)*6, y=top+row*4
      for(let col=-1;col<=1;col++) parts.push(h('path',{key:`tube${row}:${col}`,d:`M${50+col*width-2},${y}q-1,4 0,8q2,2 4,0q1,-4 0,-8Z`,fill:st.bloom?fill:ink.back,stroke:ink.line,strokeWidth:.35}))
    }
    return parts
  },
  desertrose(ink, st) {
    const y=st.top+5, parts=[h('path',{key:'caudex',d:`M35,89Q42,78 43,65L40,${y+15}L47,${y+12}L51,64L59,${y+11}L64,${y+15}L56,67Q57,80 66,89Q52,95 35,89Z`,fill:ink.pal.stem,stroke:darken(ink.pal.stem,.3),strokeWidth:.7}),h('path',{key:'bark',d:'M44,70Q47,82 41,88M52,73Q51,85 57,90',fill:'none',stroke:lighten(ink.pal.stem,.2),strokeWidth:1.4})]
    for(const [i,x,rot] of [[0,42,-55],[1,44,10],[2,60,50],[3,59,-12]]) parts.push(leaf(ink,`leaf${i}`,{x,y:y+20,len:19,w:9,rot,tip:'round',sheen:true}))
    for(const [i,x,fy] of [[0,38,y],[1,62,y-4],[2,52,y+12]]) {
      if(!st.bloom)parts.push(bud(ink,`bud${i}`,x,fy+7,{len:10,w:5}))
      else {parts.push(...nfRay(ink,`flower${i}`,x,fy,5,12,10,{offset:i*16}),h('circle',{key:`throat${i}`,cx:x,cy:fy,r:3,fill:ink.hidden?ink.core:ink.pal.center}));parts.push(strokes(`veins${i}`,Array.from({length:5},(_,j)=>[x,fy,...polar(x,fy,7,j*72)]),.45,ink.line,.55))}
    }
    return parts
  },
  marshmarigold(ink, st) {
    const y=st.top+13, parts=[stem(ink,y,{w:2.1}),stem(ink,y+13,{key:'side',x:68,bx:50,w:1.5}),nfHeartLeaf(ink,'left',42,85,.9,-40),nfHeartLeaf(ink,'right',58,77,.78,52)]
    for(const [i,x,fy,r] of [[0,47,y,15],[1,68,y+13,10]]) {
      if(!st.bloom)parts.push(bud(ink,`bud${i}`,x,fy+2,{len:9,w:6}))
      else {parts.push(...nfRay(ink,`sepal${i}`,x,fy,5,r,r*.94,{offset:18,sheen:true}),nfCore(ink,`disk${i}`,x,fy,r*.32));parts.push(dots(`anthers${i}`,Array.from({length:18},(_,j)=>polar(x,fy,r*.39,j*20)),.6,ink.pal.center))}
    }
    return parts
  },
  forgetmenot(ink, st) {
    const y=st.top+9, parts=[stemPath('curl',`M49,90Q58,67 47,${y+15}Q35,${y+2} 49,${y-8}Q62,${y-13} 65,${y-4}Q67,${y+3} 60,${y+4}`,ink.pal.stem,1.5)]
    for(let i=0;i<4;i++)parts.push(leaf(ink,`leaf${i}`,{x:50,y:83-i*7,len:18-i*2,w:5.5,rot:i%2?58:-62}))
    for(const [i,x,fy] of [[0,41,y+12],[1,36,y+1],[2,43,y-9],[3,56,y-12],[4,65,y-4],[5,60,y+4]]) {
      if(!st.bloom||i>3)parts.push(bud(ink,`bud${i}`,x,fy,{len:4.6,w:3.5,rot:35}))
      else parts.push(...nfRay(ink,`flower${i}`,x,fy,5,6.6,5.7,{offset:i*9}),nfCore(ink,`eye${i}`,x,fy,1.6))
    }
    return parts
  },
  astilbe(ink, st) {
    const top=st.top-16, parts=[stem(ink,top,{w:1.6}),nfFern(ink,'left',50,84,28,-55),nfFern(ink,'right',51,78,26,65)]
    for(let row=0;row<8;row++) {
      const y=top+row*5, reach=3+row*2.1
      for(const side of [-1,1]) {
        parts.push(stemPath(`branch${row}:${side}`,`M50,${y+3}Q${50+side*reach*.5},${y} ${50+side*reach},${y-3}`,ink.pal.stem,.6))
        for(let k=0;k<(st.bloom?5:2);k++) {
          const x=50+side*reach*(k+1)/5, fy=y-3*(k+1)/5
          parts.push(...nfRay(ink,`f${row}:${side}:${k}`,x,fy,5,st.bloom?2.3:1.4,1.6,{offset:row*9,fill:st.bloom?ink.petal:ink.back}))
        }
      }
    }
    return parts
  },
  cardinalflower(ink, st) {
    const top=st.top-11, parts=[stem(ink,top+2,{w:1.8})]
    for(let i=0;i<5;i++)parts.push(leaf(ink,`leaf${i}`,{x:50,y:85-i*7,len:22-i*2,w:6,rot:i%2?62:-62,shape:'serrate'}))
    for(let i=0;i<7;i++){
      const side=i%2?1:-1,x=50+side*5,y=top+32-i*5
      if(!st.bloom||i>4){parts.push(bud(ink,`bud${i}`,x,y,{len:7,w:3,rot:side*28}));continue}
      parts.push(h('g',{key:`flower${i}`,transform:`translate(${x} ${y}) scale(${side} 1)`},
        h('path',{d:'M-2,4Q3,0 6,-6L9,-4Q7,4 1,8Z',fill:ink.back,stroke:ink.line,strokeWidth:.4}),
        petal('upper1',{x:7,y:-4,rot:12,len:8,w:2.7,tip:'point',fill:ink.petal,stroke:ink.line}),petal('upper2',{x:7,y:-4,rot:48,len:8,w:2.7,tip:'point',fill:ink.petal,stroke:ink.line}),
        ...[-35,0,35].map((a,j)=>petal(`lower${j}`,{x:8,y:0,rot:140+a,len:9,w:4.3,tip:'point',fill:ink.petal,stroke:ink.line}))))
    }
    return parts
  },
  arrowhead(ink, st) {
    const y=st.top+2,parts=[stem(ink,y-6,{w:1.9})]
    for(const [i,x,ly,rot] of [[0,29,69,-25],[1,69,64,20]]){
      parts.push(stemPath(`stalk${i}`,`M50,90L${x},${ly}`,ink.pal.stem,1.5),h('g',{key:`arrow${i}`,transform:place({x,y:ly,rot})},h('path',{d:'M0,-31L14,4 2,-4 0,7 -2,-4 -14,4Z',fill:ink.leaf,stroke:ink.leafLine,strokeWidth:.55}),h('path',{d:'M0,6L0,-27M0,-5L-11,1M0,-5L11,1',fill:'none',stroke:ink.rib,strokeWidth:.5})))
    }
    for(const [i,x,fy] of [[0,50,y-4],[1,34,y+13],[2,66,y+13],[3,50,y+26]]){
      parts.push(stemPath(`pedicel${i}`,`M50,${fy+5}L${x},${fy}`,ink.pal.stem,.8))
      if(!st.bloom)parts.push(bud(ink,`bud${i}`,x,fy+2,{len:6,w:4}))
      else parts.push(...nfRay(ink,`petal${i}`,x,fy,3,i===0?10:8,11,{offset:30}),nfCore(ink,`eye${i}`,x,fy,2.7))
    }
    return parts
  },
}
    const PLANTS = {
      dandelion: plantDandelion,
      daisy: plantDaisy,
      cherry: plantCherry,
      tulip: plantTulip,
      lavender: plantLavender,
      poppy: plantPoppy,
      sunflower: plantSunflower,
      lily: plantLily,
      rose: plantRose,
      mophead: plantHydrangea,
      snowdrop: plantSnowdrop,
      hellebore: plantHellebore,
      plum: plantPlum,
      edelweiss: plantEdelweiss,
      camellia: plantCamellia,
      cactus: plantCactus,
      pompom: plantLehua,
      agave: plantAgave,
      silversword: plantSilversword,
      plumeria: plantPlumeria,
      pickerel: plantPickerel,
      loosestrife: plantLoosestrife,
      iris: plantIris,
      waterlily: plantWaterlily,
      lotus: plantLotus,
    }

    /** Where the open flower sits, so the spirit aura centres on it. */
    function headYOf(species) {
      return species.head === 'waterlily' ? 62 : HEAD_Y
    }

    /** Small six-armed crystals for a frost bloom, or a heat glow for an ember one. */
    function mergeLayers(list) { return { under: list.flatMap(layer => layer.under), over: list.flatMap(layer => layer.over) } }
    function traitExtrasAll(traitId, headY) { return mergeLayers(traitParts(traitId).map(part => traitExtras(part, headY))) }
    function specialTraitArtAll(ink, traitId, headY) { return mergeLayers(traitParts(traitId).map(part => specialTraitArt(ink, part, headY))) }
    function traitExtras(traitId, headY) {
      if (traitId === 'frost') {
        const arms = [[27, headY - 14, 2.6], [73, headY - 8, 2.2], [68, headY + 16, 1.8], [30, headY + 12, 2]]
        return { under: [], over: arms.map(([x, y, r], index) => h('path', {
          key: `ice${index}`, className: 'fg-sparkle',
          d: [0, 60, 120].map(a => `M${polar(x, y, r, a).join(',')}L${polar(x, y, r, a + 180).join(',')}`).join(''),
          fill: 'none', stroke: '#8fc4ea', strokeWidth: 0.6, strokeLinecap: 'round',
          style: { animationDelay: `${index * 0.5}s` },
        })) }
      }
      if (traitId === 'ember') {
        return { under: [h('circle', { key: 'heat', cx: HEAD_X, cy: headY, r: 24, fill: '#ff8a2b', opacity: 0.16 }),
          h('circle', { key: 'heat2', cx: HEAD_X, cy: headY, r: 15, fill: '#ffc24a', opacity: 0.18 })], over: [] }
      }
      return { under: [], over: [] }
    }

    /**
     * One plant. `dna` makes it an individual (lean, height, girth, facing,
     * shade, petal lengths); `trait` a curiosity; `tint` a hybrid. Without
     * `dna` it is the textbook specimen the flower book shows.
     */
function regionRay(ink,key,x,y,count,len,width,fill) {
 return Array.from({length:count},(_,i)=>petal(`${key}${i}`,{x,y,rot:i*360/count,len,w:width,fill:fill??ink.petal,stroke:ink.line,vein:ink.line,veinOpacity:.22}))
}
function regionCore(ink,key,x,y,r) { return h('g',{key},h('circle',{cx:x,cy:y,r,fill:ink.core,stroke:ink.pal.centerDeep,strokeWidth:.4}),dots(`${key}-dots`,Array.from({length:8},(_,i)=>polar(x,y,r*.6,i*45)),.42,ink.pal.center)) }
const REGION_PLANTS = {
 foxglove(ink,st){const top=st.top-5,parts=[stem(ink,top+40,{w:2.1}),leaf(ink,'base',{x:50,y:82,len:30,w:15,rot:-50,shape:'serrate',veins:6})];for(let i=0;i<7;i++){const x=44+(i%2)*9,y=top+i*5;parts.push(stemPath(`spike${i}`,`M50,${y+4}L${x},${y}`,ink.pal.stem,.7));if(!st.bloom)parts.push(bud(ink,`b${i}`,x,y,{len:8,w:4,rot:i%2?25:-25}));else parts.push(h('g',{key:`fox${i}`,transform:`translate(${x} ${y}) rotate(${i%2?18:-18})`},h('path',{d:'M-5,0Q-8,-8 -4,-13Q2,-17 8,-12Q10,-4 5,3Q0,7 -5,0Z',fill:ink.petal,stroke:ink.line,strokeWidth:.45}),h('ellipse',{cx:1,cy:-6,rx:2.2,ry:3.6,fill:ink.back,opacity:.7}))) }return parts},
 bluebell(ink,st){const parts=[stemPath('scape','M50,90Q47,68 55,38',ink.pal.stem,1.5)];for(let i=0;i<6;i++)parts.push(leaf(ink,`leaf${i}`,{x:50,y:88,len:32-i*2,w:4,rot:-45+i*18}));for(let i=0;i<7;i++){const x=55+i*1.2,y=38+i*4;if(!st.bloom)parts.push(bud(ink,`b${i}`,x,y,{len:7,w:4,rot:70}));else parts.push(h('g',{key:`bell${i}`,transform:`translate(${x} ${y}) rotate(70)`},h('path',{d:'M0,0Q-6,4 -7,11Q0,14 7,11Q6,4 0,0Z',fill:ink.petal,stroke:ink.line,strokeWidth:.45}))) }return parts},
 cyclamen(ink,st){const cx=54,cy=st.top+28,parts=[stemPath('pedicel',`M49,90Q44,${cy+20} ${cx},${cy-11}`,ink.pal.stem,1.8),h('ellipse',{key:'tuber',cx:49,cy:87,rx:13,ry:5,fill:ink.pal.stem,opacity:.5})]
  for(let i=0;i<5;i++)parts.push(h('g',{key:`ivy${i}`,transform:`translate(49 82) rotate(${i*72})`},leaf(ink,'l',{x:0,y:0,len:21,w:13,rot:0,veins:5})))
  if(!st.bloom)return [...parts,bud(ink,'b',cx,cy-9,{len:11,w:6,rot:160})]
  parts.push(h('circle',{key:'back',cx,cy,r:8,fill:ink.back,stroke:ink.line,strokeWidth:.5}))
  parts.push(h('circle',{key:'mouth',cx,cy:cy+2,r:3.4,fill:ink.core,stroke:ink.line,strokeWidth:.4}))
  for(let i=0;i<5;i++){const ang=-160+i*35;const fill=i%2===0?ink.back:ink.petal;parts.push(petal(`unfurl${i}`,{x:cx+Math.cos(ang*Math.PI/180)*6,y:cy+6,rot:(i-2)*22,len:19,w:7.5,fill:fill,stroke:ink.line,tip:'point'}))}
  return parts},
 woodanemone(ink,st){const parts=[stem(ink,st.top+6,{w:1.5}),nfHeartLeaf(ink,'left',39,83,.7,-25),nfHeartLeaf(ink,'right',61,78,.65,35)];if(!st.bloom)return [...parts,bud(ink,'b',50,st.top+7,{len:11,w:6})];return [...parts,...regionRay(ink,'p',50,st.top,7,20,11,ink.petal),regionCore(ink,'k',50,st.top,3.8)]},
 californiapoppy(ink,st){const y=st.top+7,parts=[stem(ink,y+12,{w:1.6}),nfFern(ink,'fern',50,85,28,-55)];if(!st.bloom)return [...parts,bud(ink,'b',50,y,{len:13,w:7})];return [...parts,...regionRay(ink,'p',50,y,4,28,19,ink.petal),h('circle',{key:'cup',cx:50,cy:y,r:4,fill:ink.core})]},
 desertmarigold(ink,st){const y=st.top+4,parts=[stem(ink,y+5,{w:2})];for(let i=0;i<7;i++)parts.push(leaf(ink,`s${i}`,{x:50,y:88,len:28,w:6,rot:-70+i*23,fill:ink.leafBack}));if(!st.bloom)return [...parts,bud(ink,'b',50,y,{len:11,w:8})];return [...parts,...regionRay(ink,'p',50,y,28,20,4),regionCore(ink,'k',50,y,5.5)]},
 penstemon(ink,st){const top=st.top-13,parts=[stem(ink,top+40,{w:1.8})];for(let i=0;i<5;i++)parts.push(leaf(ink,`l${i}`,{x:50,y:85-i*8,len:24-i*2,w:4,rot:i%2?55:-55}));for(let i=0;i<8;i++){const x=50+(i%2?5:-5),y=top+30-i*5;if(!st.bloom)parts.push(bud(ink,`b${i}`,x,y,{len:7,w:3,rot:i%2?20:-20}));else parts.push(h('g',{key:`tube${i}`,transform:`translate(${x} ${y}) rotate(${i%2?20:-20})`},h('path',{d:'M-3,5Q-4,-7 0,-11Q4,-7 3,5Q0,9 -3,5Z',fill:ink.petal,stroke:ink.line,strokeWidth:.45}),h('path',{d:'M-1,-1Q1,0 2,4',stroke:ink.pal.center,strokeWidth:1,fill:'none'}))) }return parts},
 eveningprimrose(ink,st){const top=st.top-10,parts=[stemPath('tall',`M50,90Q49,55 50,${top}`,ink.pal.stem,2),leaf(ink,'base',{x:48,y:83,len:27,w:9,rot:-48})];for(let i=0;i<6;i++){const x=47+(i%2)*6,y=top+8+i*4;if(!st.bloom)parts.push(bud(ink,`b${i}`,x,y,{len:8,w:4,rot:i%2?25:-25}));else parts.push(...regionRay(ink,`p${i}`,x,y,4,13,9,ink.petal),regionCore(ink,`k${i}`,x,y,2.2))}return parts},
}
    Object.assign(PLANTS, NEW_PLANTS)
    Object.assign(PLANTS, REGION_PLANTS)

    function FlowerArt({ speciesId, stage, variant, dna, trait, tint, presentation = 'living' }) {
      // Every mounted SVG owns its paint: hidden tabs, dialogs and the mini window
      // must never resolve their gradients through another copy of this plant.
      const paintId = typeof React.useId === 'function' ? `svg${React.useId().replace(/[^a-zA-Z0-9_-]/g, '_')}` : 'svg-static'
      const species = SPECIES_BY_ID.get(speciesId) ?? SPECIES[0]
      const look = variant ?? 'base'
      const hidden = look === 'hidden'
      const recordedGenes = typeof dna === 'number' && dna > 0 ? Math.floor(dna) : 0
      // Old count-only entries get a stable live posture without inventing saved DNA.
      const displayGenes = 1 + [...species.id].reduce((seed,char)=>(seed*31+char.charCodeAt(0))%2147483646,17)
      const genes = recordedGenes || (presentation==='living'?displayGenes:0)
      const traitId = hidden || stage !== 'bloom' ? undefined : trait
      const ink = makeInk(species, look, { dna: recordedGenes, trait: traitId, tint, paintId })
      const sceneId = SCENE_ID_OF.get(species.id) ?? 'meadow'
      const headY = headYOf(species)
      const floating = species.leaf === 'float'
      const drawBase = () => (stage === 'seed'
        ? seedArt(ink, sceneId)
        : stage === 'sprout'
          ? sproutArt(ink, species)
          : PLANTS[species.head](ink, { bloom: stage === 'bloom', top: stage === 'bloom' ? HEAD_Y : 54, k: stage === 'bloom' ? 1 : 0.74 }))
      const draw = () => { const layers = specialTraitArtAll(ink, traitId, headY); return [...layers.under, ...drawBase(), ...layers.over] }
      artSalt = genes === 0 ? 0 : (genes % 9973) / 97
      // Floating and pad plants do not sway on a stem.
      const sway = stage === 'seed' || floating ? undefined : 'fg-plant'
      const about = (lean, sx, sy) => `translate(50 ${GROUND_Y}) rotate(${n(lean)}) scale(${n(sx)} ${n(sy)}) translate(-50 ${-GROUND_Y})`
      let bodies
      try {
        const grown = stage !== 'seed' && genes !== 0
        const lean = grown && !floating ? (hashUnit(genes, 4, 9) - 0.5) * 12 : 0
        const big = traitParts(traitId).includes('giant') ? 1.2 : 1
        const sy = (grown ? 0.84 + hashUnit(genes, 5, 9) * 0.25 : 1) * big
        const sx = (grown ? 0.9 + hashUnit(genes, 6, 9) * 0.2 : 1) * big
        const flip = grown && hashUnit(genes, 7, 9) < 0.5 ? -1 : 1
        if (traitParts(traitId).includes('twin')) {
          // Two flowers on one root: the second is the first one's mirror, a little smaller.
          const spread = floating ? 0 : 11
          bodies = [
            h('g', { key: 'twinB', transform: `${floating ? 'translate(13 -5) ' : ''}${about(lean + spread, -flip * sx * 0.8, sy * 0.8)}` }, ...draw()),
            h('g', { key: 'twinA', transform: `${floating ? 'translate(-9 0) ' : ''}${about(lean - spread, flip * sx * 0.92, sy * 0.92)}` }, ...draw()),
          ]
        } else if (lean !== 0 || sx !== 1 || sy !== 1 || flip !== 1) {
          bodies = [h('g', { key: 'self', transform: about(lean, flip * sx, sy) }, ...draw())]
        } else {
          bodies = draw()
        }
      } finally {
        artSalt = 0
      }
      const extras = traitExtrasAll(traitId, headY)
      return h('svg', {...SVG_PROPS,className:presentation==='specimen'?'fg-flowerSpecimen':'fg-flowerLiving','data-presentation':presentation},
        h('defs', null, ...ink.defs, hidden ? hiddenAuraDef(`${species.id}-${paintId}`) : null),
        ...(hidden ? hiddenAura(`${species.id}-${paintId}`, headY) : []),
        ...extras.under,
        ground(sceneId),
        h('g', { className: sway }, ...bodies),
        ...extras.over,
        ...(hidden && stage === 'bloom' ? hiddenLights(headY) : []),
      )
    }

    function hiddenAuraDef(speciesId) {
      return h('radialGradient', { key: 'aura', id: `fg-hid-${speciesId}-aura` },
        h('stop', { offset: '0%', stopColor: HIDDEN_GOLD.aura, stopOpacity: '0.9' }),
        h('stop', { offset: '52%', stopColor: HIDDEN_GOLD.auraEdge, stopOpacity: '0.34' }),
        h('stop', { offset: '100%', stopColor: HIDDEN_GOLD.auraEdge, stopOpacity: '0' }),
      )
    }

    function hiddenAura(speciesId, headY) {
      return [
        h('circle', { key: 'aura', cx: HEAD_X, cy: headY, r: 32, fill: `url(#fg-hid-${speciesId}-aura)` }),
        h('circle', {
          key: 'ring', cx: HEAD_X, cy: headY, r: 21,
          fill: 'none', stroke: HIDDEN_GOLD.spark, strokeWidth: 0.8,
          strokeDasharray: '3 5', opacity: 0.75, className: 'fg-haloRing',
          style: { transformOrigin: `${HEAD_X}px ${headY}px` },
        }),
      ]
    }

    /** Four-point stars around the bloom, plus a few motes drifting upward. */
    function hiddenLights(headY) {
      const dy = headY - HEAD_Y
      const stars = [[22, 15, 3.4], [78, 20, 2.8], [74, 55, 3.2], [26, 54, 2.3], [50, 6, 2.6]]
      const parts = stars.map(([x, rawY, r], index) => {
        const y = Math.max(5, rawY + dy)
        return h('path', {
          key: `star${index}`,
          className: 'fg-sparkle',
          d: `M${x},${y - r} L${x + r * 0.26},${y - r * 0.26} L${x + r},${y} L${x + r * 0.26},${y + r * 0.26}`
            + ` L${x},${y + r} L${x - r * 0.26},${y + r * 0.26} L${x - r},${y} L${x - r * 0.26},${y - r * 0.26} Z`,
          fill: HIDDEN_GOLD.spark,
          stroke: '#e9c96a',
          strokeWidth: 0.3,
          style: { animationDelay: `${index * 0.42}s` },
        })
      })
      const motes = [[38, 62, 1.5], [61, 66, 1.2], [47, 72, 1.0]]
      for (const [index, [x, y, r]] of motes.entries()) {
        parts.push(h('circle', {
          key: `mote${index}`,
          className: 'fg-mote',
          cx: x, cy: y, r,
          fill: HIDDEN_GOLD.light,
          style: { animationDelay: `${0.6 + index * 0.9}s` },
        }))
      }
      return parts
    }

    function EmptyArt() {
      return h('svg', SVG_PROPS,
        h('rect', {
          x: 28, y: 28, width: 44, height: 48, rx: 12,
          style: { fill: 'none', stroke: 'var(--dsw-alias-border-l2)', strokeWidth: 2, strokeDasharray: '6 5' },
        }),
        h('path', {
          d: 'M50 42v20M40 52h20',
          style: { fill: 'none', stroke: 'var(--dsw-alias-label-secondary)', strokeWidth: 2.4, strokeLinecap: 'round' },
        }),
      )
    }

    function LockArt() {
      return h('svg', SVG_PROPS,
        h('rect', {
          x: 33, y: 48, width: 34, height: 26, rx: 7,
          style: { fill: 'none', stroke: 'var(--dsw-alias-border-l2)', strokeWidth: 2.4 },
        }),
        h('path', {
          d: 'M41 48v-7a9 9 0 0 1 18 0v7',
          style: { fill: 'none', stroke: 'var(--dsw-alias-border-l2)', strokeWidth: 2.4, strokeLinecap: 'round' },
        }),
        h('circle', { cx: 50, cy: 60, r: 3.2, style: { fill: 'var(--dsw-alias-label-secondary)' } }),
      )
    }

    /** The small creatures that visit open flowers, drawn on a 24 × 24 field. */
// Insert inside the client factory. Depends only on h and the existing ink object.
// SpecialVisitorArt uses the same 24x24 coordinate system as VisitorArt.
function SpecialVisitorArt({ id }) {
  const props = { viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false', 'data-special-visitor': id }
  const dark = '#29272b'
  const wing = { fill: '#e8f1ee', fillOpacity: .82, stroke: '#81979e', strokeWidth: .45 }
  if (id === 'bumblebee') {
    return h('svg', props,
      h('ellipse', { cx: 10, cy: 7, rx: 5, ry: 2.7, transform: 'rotate(-35 10 7)', ...wing }),
      h('ellipse', { cx: 16, cy: 7.8, rx: 4.6, ry: 2.8, transform: 'rotate(26 16 7.8)', ...wing }),
      h('path', { d: 'M10,7L6,5M16,8L19,7', fill: 'none', stroke: '#b2c7ca', strokeWidth: .45 }),
      h('path', { d: 'M10,16L7,20M13,17L12,21M16,16L18,19', fill: 'none', stroke: dark, strokeWidth: .7, strokeLinecap: 'round' }),
      h('ellipse', { cx: 13.5, cy: 13.5, rx: 7.5, ry: 5.5, fill: dark, stroke: '#524232', strokeWidth: .9, strokeDasharray: '.4 .55' }),
      h('path', { d: 'M8.5,9.1Q10.2,7.8 11.5,8.2L11.5,18.5Q9.6,18.1 8.5,17Z', fill: '#e6b938' }),
      h('path', { d: 'M14.4,8.2Q16.1,8.6 17.1,9.4L17.1,17.8Q16,18.4 14.4,18.8Z', fill: '#f0c747' }),
      h('path', { d: 'M18,10.2Q23,13.5 18,17.2Q19.1,13.6 18,10.2Z', fill: '#f4f0dd', stroke: '#d6d6c9', strokeWidth: .3 }),
      ...Array.from({ length: 12 }, (_, i) => {
        const a = i * Math.PI / 6
        return h('path', { key: `fur${i}`, d: `M${13.5 + Math.cos(a) * 7.1},${13.5 + Math.sin(a) * 5.1}l${Math.cos(a) * .8},${Math.sin(a) * .8}`, stroke: i % 3 ? '#ad9863' : '#f1d56e', strokeWidth: .4, strokeLinecap: 'round' })
      }),
      h('circle', { cx: 5.8, cy: 12.7, r: 3.1, fill: dark }),
      h('circle', { cx: 4.7, cy: 11.9, r: .65, fill: '#f9f6e9' }),
      h('path', { d: 'M4.7,10.1Q3.8,7.8 2.3,8M6.5,9.8Q7.1,7.7 8.2,7.4', fill: 'none', stroke: dark, strokeWidth: .65, strokeLinecap: 'round' }))
  }
  if (id === 'swallowtail') {
    return h('svg', props,
      h('path', { d: 'M11.9,11.9C9.4,5 4.8,1.1 1.5,2.4L3.1,12.2Q5.6,14.3 11.9,13ZM12.1,11.9C14.6,5 19.2,1.1 22.5,2.4L20.9,12.2Q18.4,14.3 12.1,13Z', fill: '#f6d770', stroke: dark, strokeWidth: .7, strokeLinejoin: 'round' }),
      h('path', { d: 'M11.7,12.8Q5.2,11.2 3.7,16.2L5.3,18.4L4.6,22L7,19.2Q10.7,20.4 11.9,14ZM12.3,12.8Q18.8,11.2 20.3,16.2L18.7,18.4L19.4,22L17,19.2Q13.3,20.4 12.1,14Z', fill: '#edc65f', stroke: dark, strokeWidth: .8, strokeLinejoin: 'round' }),
      h('path', { d: 'M2.2,3.1L10.4,11M4.3,3.9L4.8,9.4M7,6.2L7.5,11.3M3,11.2L10.4,12.6M21.8,3.1L13.6,11M19.7,3.9L19.2,9.4M17,6.2L16.5,11.3M21,11.2L13.6,12.6', fill: 'none', stroke: dark, strokeWidth: 1.1 }),
      h('path', { d: 'M4.4,16.3Q8,18.7 10.2,15.8M19.6,16.3Q16,18.7 13.8,15.8', fill: 'none', stroke: dark, strokeWidth: 2.1 }),
      ...[[5.6,16.9],[7.5,17.4],[9.3,16.7],[18.4,16.9],[16.5,17.4],[14.7,16.7]].map(([cx,cy], i) => h('circle', { key: `blue${i}`, cx, cy, r: .48, fill: '#7eafd0' })),
      h('circle', { cx: 10.2, cy: 15.3, r: .9, fill: '#c76545', stroke: dark, strokeWidth: .3 }),
      h('circle', { cx: 13.8, cy: 15.3, r: .9, fill: '#c76545', stroke: dark, strokeWidth: .3 }),
      h('path', { d: 'M12,8.8L12,18.2', stroke: dark, strokeWidth: 1.35, strokeLinecap: 'round' }),
      h('circle', { cx: 12, cy: 8.5, r: 1.1, fill: dark }),
      h('path', { d: 'M11.7,7.8Q9.7,5.4 9.3,4.6M12.3,7.8Q14.3,5.4 14.7,4.6', fill: 'none', stroke: dark, strokeWidth: .5, strokeLinecap: 'round' }))
  }
  if (id === 'hawkmoth') {
    return h('svg', props,
      h('path', { d: 'M10,11.8L14.9,18.8Q18.6,20 19.2,16.9L13.6,10.5Z', fill: '#d18b3c', stroke: '#765035', strokeWidth: .5 }),
      h('path', { d: 'M9.5,11Q5,5.4 7.4,2.3Q13.2,1.2 17.2,7.5L12.3,13.3Z', fill: '#9d8e7d', stroke: '#665d54', strokeWidth: .6 }),
      h('path', { d: 'M8,3.6L12.5,11M9.5,3.5L15,7.7M7.4,6.4L13,10.7', fill: 'none', stroke: '#7e7062', strokeWidth: .55 }),
      h('path', { d: 'M6.1,3.2Q4,6.2 6.1,9.5M17.9,6.5L20,8.4', fill: 'none', stroke: '#b8c3bb', strokeWidth: .55, strokeLinecap: 'round' }),
      h('ellipse', { cx: 13.2, cy: 13, rx: 6.2, ry: 2.6, transform: 'rotate(18 13.2 13)', fill: '#7a6c5a', stroke: '#4e453f', strokeWidth: .6 }),
      h('path', { d: 'M14.4,10.8L13.4,15.3M16.3,11.6L15.5,15.6', stroke: '#f1e9d8', strokeWidth: .95 }),
      h('path', { d: 'M17.6,12.5L21,12.9L20.4,14.5L21.4,15.5L17.5,15.4Z', fill: '#44413d' }),
      h('circle', { cx: 7.1, cy: 11, r: 2.6, fill: '#827969', stroke: '#4c443c', strokeWidth: .5 }),
      h('circle', { cx: 6, cy: 10.4, r: .85, fill: '#242326' }),
      h('circle', { cx: 5.8, cy: 10.2, r: .25, fill: '#f7f7ee' }),
      h('path', { d: 'M5.2,11.6Q3.4,13.6 1.2,15.2M7,8.7L6.2,6.5M8.3,8.8L9.8,7.2M9.2,13.1L7.2,16.1M11.2,14.3L10.3,17', fill: 'none', stroke: '#4d4540', strokeWidth: .6, strokeLinecap: 'round' }))
  }
  if (id === 'hoverfly') {
    return h('svg', props,
      h('path', { d: 'M11,10.5Q7.1,4.7 3.3,5.3Q1.9,10.5 10.7,13.2ZM13,10.5Q16.9,4.7 20.7,5.3Q22.1,10.5 13.3,13.2Z', ...wing }),
      h('path', { d: 'M10.5,11.7L4.1,6.5M8.3,9.4L5.1,10M13.5,11.7L19.9,6.5M15.7,9.4L18.9,10', fill: 'none', stroke: '#afc2c2', strokeWidth: .4 }),
      h('path', { d: 'M10.2,12L7.6,15M10.3,14L7.2,18M13.8,12L16.4,15M13.7,14L16.8,18', fill: 'none', stroke: dark, strokeWidth: .55, strokeLinecap: 'round' }),
      h('path', { d: 'M9.8,12.1Q9.2,17.8 12,21.6Q14.8,17.8 14.2,12.1Z', fill: '#e8bb3d', stroke: dark, strokeWidth: .6 }),
      h('path', { d: 'M9.8,14.4L14.2,14.4M10.1,17.3L13.9,17.3M11,19.6L13,19.6', stroke: dark, strokeWidth: 1 }),
      h('ellipse', { cx: 12, cy: 10.9, rx: 2.8, ry: 3.4, fill: '#504c35', stroke: dark, strokeWidth: .5 }),
      h('path', { d: 'M11.3,8.6L11.3,12.5M12.7,8.6L12.7,12.5', stroke: '#d7bd61', strokeWidth: .45 }),
      h('ellipse', { cx: 10.5, cy: 6.8, rx: 1.9, ry: 2.2, fill: '#9e5844', stroke: dark, strokeWidth: .4 }),
      h('ellipse', { cx: 13.5, cy: 6.8, rx: 1.9, ry: 2.2, fill: '#9e5844', stroke: dark, strokeWidth: .4 }),
      h('path', { d: 'M11.7,5.9L11.1,4.3M12.3,5.9L12.9,4.3', fill: 'none', stroke: dark, strokeWidth: .45, strokeLinecap: 'round' }),
      h('circle', { cx: 10.1, cy: 6.2, r: .4, fill: '#e7b69b' }),
      h('circle', { cx: 13.9, cy: 6.2, r: .4, fill: '#e7b69b' }))
  }
  return null
}

// Returns layers at flower coordinates. Put them inside the same DNA-transformed
// plant group as the original drawing. Optional headY supports floating flowers.
// These are stylized visual identifiers, not species-specific anatomical diagrams.
function specialTraitArt(ink, traitId, headY = HEAD_Y) {
  const under = [], over = []
  const cx = 50, cy = headY
  if (traitId === 'fasciated') {
    const fill = ink.lin('fasciated-stem', [[0, ink.pal.stem], [45, ink.rib], [100, ink.pal.leaf]], { x1: '0', y1: '0', x2: '1', y2: '0' })
    over.push(h('path', { key: 'fasciated-ribbon', d: `M43,89C44,73 40,${cy + 22} 36,${cy + 11}Q48,${cy + 4} 64,${cy + 11}C60,${cy + 25} 57,72 57,89Z`, fill, stroke: ink.leafLine, strokeWidth: .8 }))
    for (let i = 0; i < 5; i++) over.push(h('path', { key: `fasciated-rib${i}`, d: `M${45 + i * 2.2},87Q${43 + i * 3.5},${cy + 36} ${39 + i * 5.4},${cy + 12}`, fill: 'none', stroke: i % 2 ? ink.rib : ink.leafLine, strokeWidth: .65, opacity: .7 }))
    over.push(h('path', { key: 'fasciated-tip', d: `M36,${cy + 11}Q40,${cy + 5} 45,${cy + 10}Q50,${cy + 3} 55,${cy + 9}Q60,${cy + 4} 64,${cy + 11}`, fill: 'none', stroke: ink.pal.stem, strokeWidth: 2.2, strokeLinecap: 'round' }))
  } else if (traitId === 'radial') {
    for (let i = 0; i < 6; i++) {
      const angle = i * 60
      over.push(h('g', { key: `radial-lobe${i}`, transform: `translate(${cx} ${cy}) rotate(${angle})` },
        h('path', { d: 'M-2,1C-7,-5 -13,-14 -8,-20Q0,-28 8,-20C13,-14 7,-5 2,1Z', fill: i % 2 ? ink.back : ink.petal, stroke: ink.line, strokeWidth: .55 }),
        h('path', { d: 'M0,-2L0,-18M0,-8L-4,-14M0,-8L4,-14', fill: 'none', stroke: ink.line, strokeWidth: .45, opacity: .5 })))
    }
    over.push(h('circle', { key: 'radial-throat', cx, cy, r: 4.4, fill: ink.core, stroke: ink.line, strokeWidth: .5 }))
    for (let i = 0; i < 6; i++) over.push(h('circle', { key: `radial-stamen${i}`, cx: cx + Math.cos(i * Math.PI / 3) * 3, cy: cy + Math.sin(i * Math.PI / 3) * 3, r: .65, fill: ink.pal.centerDeep }))
  } else if (traitId === 'double') {
    for (let row = 0; row < 3; row++) {
      const count = 14 - row * 3, len = 22 - row * 5.5, width = 8 - row * 1.2
      for (let i = 0; i < count; i++) over.push(h('path', { key: `double-${row}-${i}`, transform: `translate(${cx} ${cy}) rotate(${i * 360 / count + row * 13})`, d: `M-1,1C${-width},${-len * .35} ${-width},${-len * .9} -2,${-len}Q0,${-len - 2} 2,${-len}C${width},${-len * .9} ${width},${-len * .35} 1,1Z`, fill: row % 2 ? ink.back : ink.petal, stroke: ink.line, strokeWidth: .45 }))
    }
    over.push(h('ellipse', { key: 'double-heart', cx, cy, rx: 3.1, ry: 2.5, fill: ink.back, stroke: ink.line, strokeWidth: .5 }))
  } else if (traitId === 'leafy') {
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 5; i++) {
        const len = row ? 15 : 25, width = row ? 5 : 8
        over.push(h('g', { key: `leafy-${row}-${i}`, transform: `translate(${cx} ${cy}) rotate(${i * 72 + row * 36})` },
          h('path', { d: `M0,2Q${-width},${-len * .2} ${-width},${-len * .6}Q-2,${-len * .85} 0,${-len}Q2,${-len * .85} ${width},${-len * .6}Q${width},${-len * .2} 0,2Z`, fill: row ? ink.leafBack : ink.leaf, stroke: ink.leafLine, strokeWidth: .6 }),
          h('path', { d: `M0,0L0,${-len + 3}M0,${-len * .3}L${-width * .7},${-len * .48}M0,${-len * .3}L${width * .7},${-len * .48}M0,${-len * .55}L${-width * .52},${-len * .73}M0,${-len * .55}L${width * .52},${-len * .73}`, fill: 'none', stroke: ink.rib, strokeWidth: .65 })))
      }
    }
    over.push(h('circle', { key: 'leafy-bud', cx, cy, r: 2.5, fill: ink.pal.stem, stroke: ink.leafLine, strokeWidth: .5 }))
  }
  return { under, over }
}

    function VisitorArt({ id }) {
      if (VISITOR_BY_ID.get(id)?.special) return h(SpecialVisitorArt, { id })
      const props = { viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' }
      const wing = { fill: '#eaf4fb', stroke: '#8fa9bd', strokeWidth: 0.5, opacity: 0.88 }
      const ink = '#32261c'
      switch (id) {
        case 'bee':
          return h('svg', props,
            h('ellipse', { cx: 10, cy: 7.8, rx: 4.6, ry: 2.6, transform: 'rotate(-30 10 7.8)', ...wing }),
            h('ellipse', { cx: 15, cy: 7.6, rx: 4.2, ry: 2.4, transform: 'rotate(22 15 7.6)', ...wing }),
            h('ellipse', { cx: 12.6, cy: 14, rx: 6.2, ry: 4.5, fill: '#f6c443', stroke: ink, strokeWidth: 0.7 }),
            h('path', { d: 'M11.2,10.2v7.6M14.6,10v8', stroke: ink, strokeWidth: 1.7 }),
            h('circle', { cx: 6.6, cy: 13.6, r: 2.7, fill: ink }),
            h('circle', { cx: 5.7, cy: 13, r: 0.65, fill: '#ffffff' }),
            h('path', { d: 'M5.6,11.3q-1.2,-2.4 -2.8,-2.2M7.2,11q.2,-2.4 1.4,-3M18.6,14.4l2,.5', fill: 'none', stroke: ink, strokeWidth: 0.6, strokeLinecap: 'round' }),
          )
        case 'butterfly':
          return h('svg', props,
            h('path', { d: 'M12,12.4C8.4,4.4 2,3.6 2.4,8.8C2.8,12.6 8,13.2 12,12.4ZM12,12.4C15.6,4.4 22,3.6 21.6,8.8C21.2,12.6 16,13.2 12,12.4Z', fill: '#fffbe4', stroke: '#8a7d55', strokeWidth: 0.5 }),
            h('path', { d: 'M12,12.8C8,13 4.8,15.2 6.2,18.6C8.2,20.8 11.2,17.4 12,13.8ZM12,12.8C16,13 19.2,15.2 17.8,18.6C15.8,20.8 12.8,17.4 12,13.8Z', fill: '#f6efc4', stroke: '#8a7d55', strokeWidth: 0.5 }),
            h('path', { d: 'M2.4,8.8C2.2,5.6 4.4,4.8 6.6,5.6C4.8,6.2 3.4,7.4 2.4,8.8ZM21.6,8.8C21.8,5.6 19.6,4.8 17.4,5.6C19.2,6.2 20.6,7.4 21.6,8.8Z', fill: '#4a4034' }),
            h('path', { d: 'M6.4,9.2h.01M17.6,9.2h.01', stroke: '#4a4034', strokeWidth: 1.7, strokeLinecap: 'round' }),
            h('path', { d: 'M12,8.8v8.4', stroke: ink, strokeWidth: 1.4, strokeLinecap: 'round' }),
            h('path', { d: 'M12,8.8q-1.4,-3 -3,-3.4M12,8.8q1.4,-3 3,-3.4', fill: 'none', stroke: ink, strokeWidth: 0.5, strokeLinecap: 'round' }),
          )
        case 'ladybug':
          return h('svg', props,
            h('path', { d: 'M8.6,8.4q-1.6,-2.6 -3.4,-2.4M15.4,8.4q1.6,-2.6 3.4,-2.4', fill: 'none', stroke: ink, strokeWidth: 0.6, strokeLinecap: 'round' }),
            h('circle', { cx: 12, cy: 8.6, r: 3.6, fill: '#241a1a' }),
            h('path', { d: 'M9.8,7.4h.01M14.2,7.4h.01', stroke: '#ffffff', strokeWidth: 1.5, strokeLinecap: 'round' }),
            h('ellipse', { cx: 12, cy: 14.2, rx: 7, ry: 6.6, fill: '#d93a30', stroke: '#241a1a', strokeWidth: 0.7 }),
            h('path', { d: 'M12,7.8v13', stroke: '#241a1a', strokeWidth: 0.8 }),
            h('path', { d: 'M8.4,11.6h.01M15.6,11.6h.01M7.6,15.6h.01M16.4,15.6h.01M10,18.4h.01M14,18.4h.01M12,10.4h.01', stroke: '#241a1a', strokeWidth: 2.2, strokeLinecap: 'round' }),
            h('path', { d: 'M7.6,11.4q1.2,-2.2 3,-2.6', fill: 'none', stroke: '#ffffff', strokeWidth: 0.8, strokeLinecap: 'round', opacity: 0.5 }),
          )
        case 'dragonfly':
          return h('svg', props,
            h('ellipse', { cx: 11.4, cy: 7, rx: 6.4, ry: 1.9, transform: 'rotate(24 11.4 7)', ...wing }),
            h('ellipse', { cx: 17.4, cy: 6.6, rx: 5.6, ry: 1.8, transform: 'rotate(-42 17.4 6.6)', ...wing }),
            h('ellipse', { cx: 11.4, cy: 17, rx: 6.4, ry: 1.9, transform: 'rotate(-24 11.4 17)', ...wing }),
            h('ellipse', { cx: 17.4, cy: 17.4, rx: 5.6, ry: 1.8, transform: 'rotate(42 17.4 17.4)', ...wing }),
            h('path', { d: 'M2.4,12H15', stroke: '#2f8fb0', strokeWidth: 1.6, strokeLinecap: 'round' }),
            h('path', { d: 'M5,12h.01M7.6,12h.01M10.2,12h.01', stroke: '#1d5f78', strokeWidth: 1.7, strokeLinecap: 'round' }),
            h('ellipse', { cx: 16.4, cy: 12, rx: 2.6, ry: 1.9, fill: '#2a7c98' }),
            h('circle', { cx: 20, cy: 12, r: 2, fill: '#3fa58a', stroke: '#1d5f78', strokeWidth: 0.4 }),
            h('path', { d: 'M20.6,11.2h.01M20.6,12.8h.01', stroke: '#16323a', strokeWidth: 1, strokeLinecap: 'round' }),
          )
        case 'firefly':
          return h('svg', props,
            h('circle', { className: 'fg-glow', cx: 12, cy: 16.4, r: 7, fill: '#eef26a', opacity: 0.4 }),
            h('ellipse', { cx: 8.6, cy: 11, rx: 2.4, ry: 5, transform: 'rotate(26 8.6 11)', ...wing }),
            h('ellipse', { cx: 15.4, cy: 11, rx: 2.4, ry: 5, transform: 'rotate(-26 15.4 11)', ...wing }),
            h('ellipse', { cx: 12, cy: 11.4, rx: 2.9, ry: 4.6, fill: '#3b3029' }),
            h('ellipse', { cx: 12, cy: 16.6, rx: 2.7, ry: 2.9, fill: '#f3f45e', stroke: '#c9c63a', strokeWidth: 0.4 }),
            h('circle', { cx: 12, cy: 6.6, r: 2, fill: '#b9472f' }),
            h('path', { d: 'M11.2,5q-.8,-2 -2.4,-2.2M12.8,5q.8,-2 2.4,-2.2', fill: 'none', stroke: ink, strokeWidth: 0.5, strokeLinecap: 'round' }),
          )
        case 'moth':
          return h('svg', props,
            h('path', { d: 'M12.6,11C9,5.6 3.6,4.4 1.8,6.2C3.8,9.6 8,11.6 12.6,12.2Z', fill: '#8c7b6a', stroke: '#54483c', strokeWidth: 0.5 }),
            h('path', { d: 'M12.6,13C9.4,13 6.6,14.6 5.6,17.4C8.6,17.8 11.4,16 12.8,14Z', fill: '#e58a3a', stroke: '#a05a20', strokeWidth: 0.4 }),
            h('path', { d: 'M4.4,6.6l4.6,3M6.6,5.8l3.8,3.6', fill: 'none', stroke: '#54483c', strokeWidth: 0.4, opacity: 0.7 }),
            h('ellipse', { cx: 14.6, cy: 13, rx: 5.2, ry: 2.5, transform: 'rotate(8 14.6 13)', fill: '#a39483', stroke: '#54483c', strokeWidth: 0.5 }),
            h('path', { d: 'M16.4,11.2v4M18,11.8v3.2', stroke: '#f3ede3', strokeWidth: 0.8 }),
            h('path', { d: 'M19.4,13.6l2.6,1.4 -2.4,.8Z', fill: '#32261c' }),
            h('circle', { cx: 10.6, cy: 12.2, r: 0.8, fill: ink }),
            h('path', { d: 'M9.8,12.8Q4,15 2.6,20.6', fill: 'none', stroke: ink, strokeWidth: 0.5, strokeLinecap: 'round' }),
            h('path', { d: 'M10.4,11.2q-1.4,-2.6 -3.2,-3', fill: 'none', stroke: ink, strokeWidth: 0.5, strokeLinecap: 'round' }),
          )
        case 'robin':
          return h('svg', props,
            h('path', { d: 'M17,13.6l5,-3.4 -.6,4.4Z', fill: '#6f5946' }),
            h('ellipse', { cx: 12.4, cy: 13.6, rx: 6.6, ry: 5.6, fill: '#8d735a', stroke: '#5a4634', strokeWidth: 0.5 }),
            h('circle', { cx: 8.4, cy: 9.2, r: 4, fill: '#8d735a', stroke: '#5a4634', strokeWidth: 0.5 }),
            h('path', { d: 'M5.2,9.4C5.4,12.6 6.6,16.6 10.4,17.8C13.4,17 13.6,13 11.6,10.4C10,8.6 6.4,8 5.2,9.4Z', fill: '#e8743b' }),
            h('path', { d: 'M9,17.6C11.4,19.2 15,19 17,17.2C14.6,17.6 11.4,17.4 9,17.6Z', fill: '#f3ede3' }),
            h('path', { d: 'M12.6,11.4C15.4,11 17.6,12.4 18,14.8C15.6,15.4 13.6,14.2 12.6,11.4Z', fill: '#6f5946' }),
            h('path', { d: 'M4.8,9.2L1.8,9.9 4.7,10.6Z', fill: ink }),
            h('circle', { cx: 7.4, cy: 8.4, r: 0.8, fill: '#1a1410' }),
            h('path', { d: 'M11,19v2.6M13.6,19.2v2.4', stroke: ink, strokeWidth: 0.6, strokeLinecap: 'round' }),
          )
        case 'honeycreeper':
          return h('svg', props,
            h('path', { d: 'M17.6,14.6l4.8,3 -5.6,-.2Z', fill: '#2a2226' }),
            h('ellipse', { cx: 12.8, cy: 13.6, rx: 6.2, ry: 4.5, transform: 'rotate(14 12.8 13.6)', fill: '#dd3a2c', stroke: '#8c1f1a', strokeWidth: 0.5 }),
            h('circle', { cx: 8.4, cy: 9.6, r: 3.5, fill: '#dd3a2c', stroke: '#8c1f1a', strokeWidth: 0.5 }),
            h('path', { d: 'M11.6,11.4C14.6,10.6 18,12.4 19,15.8C15.6,16.4 12.6,14.6 11.6,11.4Z', fill: '#2a2226' }),
            h('path', { d: 'M13.6,13.2l2.6,.8', stroke: '#f3ede3', strokeWidth: 0.7, strokeLinecap: 'round' }),
            h('path', { d: 'M5.4,9.4Q1.8,10 2,14.6', fill: 'none', stroke: '#f0a172', strokeWidth: 1.2, strokeLinecap: 'round' }),
            h('circle', { cx: 7.6, cy: 8.9, r: 0.75, fill: '#1a1410' }),
            h('path', { d: 'M11.6,18v3M14,18.2v2.8', stroke: '#f0a172', strokeWidth: 0.6, strokeLinecap: 'round' }),
          )
        default:
          return h('svg', props,
            h('path', { d: 'M17.4,14.4l4.2,1.8 -4.6,1Z', fill: '#176f8a' }),
            h('ellipse', { cx: 13, cy: 13.6, rx: 5.6, ry: 4.8, fill: '#e9853a', stroke: '#a8561c', strokeWidth: 0.5 }),
            h('path', { d: 'M9.4,9.6C13,8 17.6,10 18.6,15.4C15.2,16 11.6,14.4 9.4,9.6Z', fill: '#1f93ad', stroke: '#14627a', strokeWidth: 0.5 }),
            h('circle', { cx: 9.6, cy: 9, r: 3.6, fill: '#1f93ad', stroke: '#14627a', strokeWidth: 0.5 }),
            h('path', { d: 'M7.6,10.2C8.6,11.4 10.4,11.6 11.6,10.8C10.4,10.2 9,10 7.6,10.2Z', fill: '#f6f1e6' }),
            h('path', { d: 'M8,10.8C7.4,11.8 7.8,12.8 8.8,13.2', fill: 'none', stroke: '#e9853a', strokeWidth: 1.1, strokeLinecap: 'round' }),
            h('path', { d: 'M6.4,8.4L0.8,9.6 6.3,10.2Z', fill: '#2a2a30' }),
            h('circle', { cx: 8.6, cy: 8.2, r: 0.8, fill: '#101014' }),
            h('path', { d: 'M12,18.2v2.4M14.2,18.2v2.4', stroke: '#d0552a', strokeWidth: 0.7, strokeLinecap: 'round' }),
          )
      }
    }

    function CoinGlyph() {
      return h('svg', { viewBox: '0 0 12 12', width: 12, height: 12, 'aria-hidden': 'true', focusable: 'false' },
        h('circle', { cx: 6, cy: 6, r: 5, fill: '#f2b53a' }),
        h('circle', { cx: 6, cy: 6, r: 3.1, fill: 'none', stroke: '#c98a14', strokeWidth: 1 }),
      )
    }

    function WeatherGlyph({ kind }) {
      const sun = h('circle', { key: 'sun', cx: 8, cy: 8, r: 3.4, fill: '#f2b53a' })
      const rays = [0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
        const rad = (angle * Math.PI) / 180
        return h('line', {
          key: angle,
          x1: 8 + 5 * Math.cos(rad), y1: 8 + 5 * Math.sin(rad),
          x2: 8 + 6.6 * Math.cos(rad), y2: 8 + 6.6 * Math.sin(rad),
          stroke: '#f2b53a', strokeWidth: 1.1, strokeLinecap: 'round',
        })
      })
      const cloud = h('path', {
        key: 'cloud',
        d: 'M4 11.5h8.2a2.3 2.3 0 0 0 0-4.6 3.1 3.1 0 0 0-5.9-.8A2.7 2.7 0 0 0 4 11.5Z',
        fill: kind === 'rain' ? '#8a9bb5' : '#9aa7b8',
      })
      const drops = [-4, 0, 4].map(dx => h('line', {
        key: dx, x1: 8 + dx, y1: 12.4, x2: 7.2 + dx, y2: 14.4,
        stroke: '#5b9bd5', strokeWidth: 1.1, strokeLinecap: 'round',
      }))
      return h('svg', { viewBox: '0 0 16 16', width: 13, height: 13, 'aria-hidden': 'true', focusable: 'false' },
        kind === 'clear' ? [sun, ...rays] : kind === 'rain' ? [cloud, ...drops] : [cloud],
      )
    }

    function ItemIcon({ id }) {
      const common = { viewBox: '0 0 24 24', width: 20, height: 20, 'aria-hidden': 'true', focusable: 'false' }
      if (id === 'fertilizer') {
        return h('svg', common,
          h('path', { d: 'M7 8h10l-1.4 10.3a2 2 0 0 1-2 1.7h-3.2a2 2 0 0 1-2-1.7Z', fill: '#c9a227' }),
          h('path', { d: 'M8.6 8c0-2.3 1.6-4.2 3.4-4.2S15.4 5.7 15.4 8', fill: 'none', stroke: '#8a6a1a', strokeWidth: 1.5 }),
          h('path', { d: 'M10 12.6h4M10 15.8h4', stroke: '#6b520e', strokeWidth: 1.3, strokeLinecap: 'round' }),
        )
      }
      if (id === 'compost') {
        return h('svg', common,
          h('path', { d: 'M6 9.4c0-1 1-1.8 2.4-1.8h7.2c1.4 0 2.4.8 2.4 1.8l-.8 9a2 2 0 0 1-2 1.8H8.8a2 2 0 0 1-2-1.8Z', fill: '#8a6242' }),
          h('path', { d: 'M9.4 7.6c.4-1.6 1.4-2.6 2.6-2.6s2.2 1 2.6 2.6', fill: 'none', stroke: '#6a4a30', strokeWidth: 1.4 }),
          h('path', { d: 'M12 16.6c0-2.4 1.2-3.8 3.2-4.2-.2 2.2-1.2 3.6-3.2 4.2ZM12 16.6c0-1.8-.8-2.8-2.4-3.2.2 1.6 1 2.8 2.4 3.2Z', fill: '#9fd07a' }),
        )
      }
      if (id === 'sprinkler') {
        return h('svg', common,
          h('path', { d: 'M12 4.4c2.7 3.1 4.1 5.2 4.1 7.2a4.1 4.1 0 0 1-8.2 0c0-2 1.4-4.1 4.1-7.2Z', fill: '#7fb2e8' }),
          h('path', { d: 'M3.6 15.6h3.2M17.2 15.6h3.2M12 19.2v2', stroke: '#7fb2e8', strokeWidth: 1.5, strokeLinecap: 'round' }),
        )
      }
      if (id === 'charm') {
        return h('svg', common,
          h('circle', { cx: 12, cy: 12, r: 8.3, fill: 'none', stroke: '#e0b83c', strokeWidth: 1.5 }),
          h('path', { d: 'M12 6.4l1.5 3.7 3.9.4-2.9 2.6.8 3.8-3.3-2-3.3 2 .8-3.8-2.9-2.6 3.9-.4Z', fill: '#f2c94c' }),
        )
      }
      return h('svg', common,
        h('path', { d: 'M5 10.2h14l-1.6 8.2a2 2 0 0 1-2 1.6H8.6a2 2 0 0 1-2-1.6Z', fill: 'none', stroke: '#a1793f', strokeWidth: 1.5 }),
        h('path', { d: 'M8.5 10.2c0-3 1.6-5 3.5-5s3.5 2 3.5 5', fill: 'none', stroke: '#a1793f', strokeWidth: 1.5 }),
        h('path', { d: 'M8 14h8M8.6 17h6.8', stroke: '#c9a227', strokeWidth: 1.2, strokeLinecap: 'round' }),
      )
    }

    /** Small colour swatch standing in for one species/variant in dense rows. */
    function BloomDot({ speciesId, variant }) {
      const species = SPECIES_BY_ID.get(speciesId) ?? SPECIES[0]
      const pal = paletteOf(species, variant ?? 'base')
      return h('span', {
        className: 'fg-dot',
        style: { background: pal.petal, borderColor: pal.petalDeep },
        'aria-hidden': 'true',
      })
    }

    /** One flower detail card: drawing, name, variant, Latin, meaning, figures, actions. */
    function bloomName(item, t) {
      let name = item.tint ? t('hybrid.name', { form: t(`species.${item.species}`), tint: t(`species.${item.tint}`) }) : t(`species.${item.species}`)
      if (item.trait) name = t('trait.named', { trait: traitLabel(item.trait, t), flower: name })
      return name
    }

    function BloomPreview({ id, speciesId, variant, dna, trait, tint, t, meta = [], worth, armed, onSell, onClose, modal = false, onPrev, onNext, individuals = [], onSellOne, quoteOne, observations = 0, allowSpecimen = false }) {
      const species = SPECIES_BY_ID.get(speciesId) ?? SPECIES[0]
      const dialogRef = React.useRef(null)
      const [individual, setIndividual] = React.useState(0)
      const chosen = individuals[Math.min(individual, Math.max(0, individuals.length - 1))]
      const [oneArmed, setOneArmed] = React.useState(false)
      React.useEffect(() => setOneArmed(false), [chosen])
      React.useEffect(() => {
        if (!oneArmed) return undefined
        const timer = window.setTimeout(() => setOneArmed(false), 4000)
        return () => window.clearTimeout(timer)
      }, [oneArmed])
      const [sample, setSample] = React.useState(null), [specimenMode,setSpecimenMode] = React.useState(false)
      React.useEffect(() => {setSample(null);setSpecimenMode(false)}, [speciesId, variant, trait, tint, dna])
      React.useEffect(() => {
        if (!modal) return undefined
        const dialog = dialogRef.current
        showModalPinned(dialog)
        return () => { if (dialog?.open) dialog.close() }
      }, [modal])
      const card = h('div', { className: 'fg-preview', id, tabIndex: -1, role: 'group', 'aria-label': t(`species.${species.id}`) },
        h('div', { className: 'fg-previewArt' },
          h(FlowerArt, { speciesId: species.id, stage: 'bloom', variant, dna: sample ?? chosen?.dna ?? dna, trait, tint, presentation:specimenMode?'specimen':'living' }),
        ),
        h('div', { className: 'fg-previewBody' },
          h('div', { className: 'fg-previewHead' },
            h('span', { className: 'fg-previewName' }, bloomName({ species: species.id, tint, trait }, t)),
            h('span', { className: 'fg-previewVariant', 'data-variant': variant }, t(`variant.${variant}`)),
          ),
          h('div', { className: 'fg-previewLatin' }, t(`latin.${species.id}`)),
          modal ? h(SpeciesPurpose, { speciesId: species.id, t, observations }) : null,
          modal && species.source ? h('a', { className: 'fg-source', href: species.source, target: '_blank', rel: 'noopener noreferrer' }, t('eco.source')) : null,
          h('div', { className: 'fg-previewMeaning' }, t(`codex.${species.id}`)),
          modal ? h('span', { className: 'fg-note' }, t(specimenMode?'card.specimenTitle':sample!==null?'card.example':'card.living')) : null,
          modal ? h('p', { className: 'fg-cardFact' }, t(`fact.${species.id}`)) : null,
          trait ? h('p', { className: 'fg-note' }, traitCauseText(trait, t)) : null,
          trait && TRAIT_BY_ID.get(trait)?.source ? h('div', { className: 'fg-purpose' }, h('p',null,t(`trait.${traitFactId(trait)}.fact`)), h('a',{href:TRAIT_BY_ID.get(trait).source,target:'_blank',rel:'noopener noreferrer'},t('trait.source'))) : null,
          tint ? h('p', { className: 'fg-note' }, t('hybrid.how')) : null,
          modal ? h('div', { className: 'fg-previewStats' },
            h('span', null, `${t('card.ground')} · ${t(`scene.${SCENES.find(ground => ground.species.includes(species.id)).id}`)}`),
            h('span', null, `${t('card.grow')} · ${formatDuration(growMsOf(species), t)}`),
            h('span', null, `${t('card.seed')} · ${species.cost}`)) : null,
          (chosen?.dna ?? dna) ? h(GeneCard, { dna: chosen?.dna ?? dna, t }) : null,
          h('div', { className: 'fg-previewStats' },
            meta.filter(Boolean).map((line, index) => h('span', { key: index }, line)),
          ),
        ),
        h('div', { className: 'fg-previewActions' },
          individuals.length > 1 ? h('label', { className: 'fg-note' }, t('basket.individual'),
            h('select', { className: 'fg-btn', value: Math.min(individual, individuals.length - 1), onChange: event => setIndividual(Number(event.target.value)) },
              individuals.map((item, index) => h('option', { key: index, value: index }, t('basket.individualNo', { n: index + 1, max: individuals.length }))))) : null,
          chosen && onSellOne ? h('button', { type: 'button', className: oneArmed ? 'fg-btn fg-btnDanger' : 'fg-btn fg-btnPrimary', onClick: () => {
            if (!oneArmed) { setOneArmed(true); return }
            setOneArmed(false)
            onSellOne(chosen)
          } }, t(oneArmed ? 'basket.confirmOne' : 'basket.sellOne', { n: quoteOne(chosen) })) : null,
          onSell === undefined
            ? null
            : h('button', {
              type: 'button',
              className: armed ? 'fg-btn fg-btnDanger' : 'fg-btn fg-btnPrimary',
              onClick: onSell,
            }, armed ? t('basket.confirm', { n: worth }) : t('basket.sellAll', { n: worth })),
          modal ? h('button', { type: 'button', className: 'fg-btn', onClick: () => {setSpecimenMode(false);setSample(value => (value ?? dna ?? 0) + 7919)}, title: t('card.individual') }, t('card.another')) : null,
          modal && (sample!==null || specimenMode) ? h('button', { type: 'button', className: 'fg-btn fg-btnGhost', onClick: () => {setSample(null);setSpecimenMode(false)} }, t('card.returnLiving')) : null,
          modal && allowSpecimen && dna ? h('button', { type: 'button', className: 'fg-btn fg-btnGhost', 'aria-pressed':specimenMode, onClick: () => {setSample(null);setSpecimenMode(true)} }, t('card.specimen')) : null,
          onPrev ? h('button', { type: 'button', className: 'fg-btn fg-btnGhost', onClick: onPrev }, t('card.prev')) : null,
          onNext ? h('button', { type: 'button', className: 'fg-btn fg-btnGhost', onClick: onNext }, t('card.next')) : null,
          h('button', { type: 'button', className: 'fg-btn fg-btnGhost', onClick: onClose }, t('preview.close')),
        ),
      )
      return modal ? h('dialog', {
        ref: dialogRef, className: 'fg-dialog', 'aria-label': bloomName({ species: species.id, tint, trait }, t),
        onCancel: event => { event.preventDefault(); onClose() },
        onClick: event => { if (event.target === event.currentTarget) onClose() },
      }, card) : card
    }

    /** Optional activity panels; the owning view commits every returned transition. */
    function GardenActivities({ state, t, clock, onChange }) {
      const [armed, setArmed] = React.useState(null)
      const [notice, setNotice] = React.useState(null)
      const [selected, setSelected] = React.useState({})
      const show = showAt(state, clock)
      const entry = showEntry(state, clock)
      const nextTier = SHOW_TIERS.find(tier => tier.points > entry.points)
      const groups = new Map()
      for (const item of state.basket) {
        if (!showAccepts(show, item)) continue
        const key = itemKey(item)
        const previous = groups.get(key)
        groups.set(key, { key, items: [...(previous?.items ?? []), item], count: (previous?.count ?? 0) + 1 })
      }
      function nameOf(item) {
        const name = item.tint === undefined
          ? t(`species.${item.species}`)
          : t('hybrid.name', { tint: t(`species.${item.tint}`), form: t(`species.${item.species}`) })
        return [name, t(`variant.${item.variant}`), item.trait === undefined ? null : traitLabel(item.trait, t)]
          .filter(Boolean).join(' · ')
      }
      function enter(key, item) {
        const current = getState()
        const now = Date.now()
        const currentShow = showAt(current, now)
        const currentEntry = showEntry(current, now)
        const individualIndex = current.basket.indexOf(item)
        if (currentShow.id !== show.id || individualIndex < 0 || !showAccepts(currentShow, item)
          || currentEntry.entered >= SHOW_SLOTS) {
          setArmed(null)
          return
        }
        const points = showPoints(item, currentEntry)
        if (armed === null || armed.key !== key || armed.showId !== currentShow.id
          || armed.item !== item || armed.entered !== currentEntry.entered || armed.points !== points || armed.until < now) {
          setArmed({ key, item, showId: currentShow.id, entered: currentEntry.entered, points, until: now + 5000 })
          setNotice(null)
          return
        }
        setArmed(null)
        const next = exhibit(current, key, now, individualIndex)
        if (next === null) return
        onChange(next)
        setNotice({ kind: 'show', item, points: next.show.points - currentEntry.points,
          ribbons: (next.ribbons ?? 0) - (current.ribbons ?? 0) })
      }
      function upgrade(id) {
        const next = upgradeFacility(getState(), id)
        if (next === null) return
        setArmed(null)
        onChange(next)
        setNotice({ kind: 'facility', id, level: facilityLevel(next, id) })
      }
      const status = notice === null ? null : notice.kind === 'show'
        ? t('show.sent', { name: nameOf(notice.item), n: notice.points })
          + (notice.ribbons > 0 ? t('show.won', { n: notice.ribbons }) : '')
        : t('facility.done', { name: t(`facility.${notice.id}`), n: notice.level })
      return h(React.Fragment, null,
        h('section', { className: 'fg-section', id: 'fg-show', tabIndex: -1, 'aria-label': t('show.title') },
          h('div', { className: 'fg-sectionHead' },
            h('h2', { className: 'fg-sectionTitle' }, t('show.title')),
            h('span', { className: 'fg-sectionMeta' }, t('show.left', { n: formatDuration(Math.max(0, show.endsAt - clock), t) })),
            h('span', { className: 'fg-chip' },
              h('span', { className: 'fg-chipKey' }, t('ribbon.label')),
              h('span', { className: 'fg-chipValue' }, state.ribbons ?? 0))),
          h('div', { className: 'fg-order' },
            h('div', { className: 'fg-orderHead' },
              h('span', { className: 'fg-orderId' }, t('show.name', {
                season: t(`show.season.${show.season}`),
                theme: t(`show.theme.${show.theme}`, { scene: t(`scene.${show.sceneId}`) }),
              })),
              h('span', { className: 'fg-orderReward' }, t('show.points', { n: entry.points }))),
            h('p', { className: 'fg-hint' }, t(`show.desc.${show.theme}`, { scene: t(`scene.${show.sceneId}`) }), ' ', t('show.exception')),
            h('p', { className: 'fg-hint' }, t('show.rules', {
              slots: SHOW_SLOTS, a: SHOW_TIERS[0].points, b: SHOW_TIERS[1].points, c: SHOW_TIERS[2].points,
            })),
            h('div', { className: 'fg-sectionHead' },
              h('span', { className: 'fg-sectionMeta' }, t('show.entered', { n: entry.entered, max: SHOW_SLOTS })),
              h('span', { className: 'fg-sectionMeta' }, nextTier === undefined
                ? t('show.done') : t('show.next', { n: nextTier.points - entry.points })))),
          h('details', { className: 'fg-showChoices' },
            h('summary', { className: 'fg-btn' }, t('show.choose')),
          entry.entered >= SHOW_SLOTS
            ? h('p', { className: 'fg-empty' }, t('show.full'))
            : groups.size === 0
              ? h('p', { className: 'fg-empty' }, t('show.none'))
              : h('div', { className: 'fg-orders' }, Array.from(groups.values(), ({ key, items, count }) => {
                const selectedIndex = Math.min(selected[key] ?? 0, items.length - 1)
                const item = items[selectedIndex]
                const points = showPoints(item, entry)
                const confirming = armed !== null && armed.key === key && armed.showId === show.id && armed.item === item
                  && armed.entered === entry.entered && armed.points === points && armed.until >= clock
                return h('div', { className: 'fg-order', key },
                  h('div', { className: 'fg-art' }, h(FlowerArt, {
                    speciesId: item.species, stage: 'bloom', variant: item.variant,
                    dna: item.dna, trait: item.trait, tint: item.tint,
                  })),
                  h('div', { className: 'fg-orderHead' },
                    h('span', { className: 'fg-orderId' }, nameOf(item)),
                    h('span', { className: 'fg-orderReward' }, `×${count}`)),
                  count > 1 ? h('label', { className: 'fg-note' }, t('basket.individual'),
                    h('select', { className: 'fg-btn', value: selectedIndex, onChange: event => { setSelected(value => ({ ...value, [key]: Number(event.target.value) })); setArmed(null) } },
                      items.map((bloom, index) => h('option', { key: index, value: index }, t('basket.individualNo', { n: index + 1, max: count }))))) : null,
                  h('button', {
                    type: 'button', className: confirming ? 'fg-btn fg-btnDanger' : 'fg-btn fg-btnPrimary',
                    onClick: () => enter(key, item),
                  }, t(confirming ? 'show.confirm' : 'show.enter', { n: points })))
              })),
        ),
        ),
        h('section', { className: 'fg-section', 'aria-label': t('facility.title') },
          h('h2', { className: 'fg-sectionTitle' }, t('facility.title')),
          h('p', { className: 'fg-hint' }, t('facility.note')),
          h('div', { className: 'fg-orders' }, FACILITIES.map(facility => {
            const level = facilityLevel(state, facility.id)
            const cost = facilityCost(facility.id, level)
            const shortCoins = cost === null ? 0 : Math.max(0, cost.coins - state.coins)
            const shortRibbons = cost === null ? 0 : Math.max(0, cost.ribbons - (state.ribbons ?? 0))
            return h('div', { className: 'fg-order', key: facility.id },
              h('div', { className: 'fg-orderHead' },
                h('span', { className: 'fg-orderId' }, t(`facility.${facility.id}`)),
                h('span', { className: 'fg-orderReward' }, t('facility.level', { n: level, max: FACILITY_MAX }))),
              h('p', { className: 'fg-hint' }, t(`facility.${facility.id}.note`, { n: Math.round(level * facility.step * 100) })),
              cost === null ? h('span', { className: 'fg-sectionMeta' }, t('facility.max'))
                : h(React.Fragment, null,
                  h('span', { className: 'fg-sectionMeta' }, t(cost.ribbons > 0 ? 'facility.costRibbon' : 'facility.cost', cost)),
                  shortCoins > 0 ? h('span', { className: 'fg-sectionWarn' }, t('facility.short', { n: shortCoins })) : null,
                  shortRibbons > 0 ? h('span', { className: 'fg-sectionWarn' }, t('facility.shortRibbon', { n: shortRibbons })) : null,
                  h('button', {
                    type: 'button', className: 'fg-btn fg-btnPrimary', disabled: shortCoins > 0 || shortRibbons > 0,
                    onClick: () => upgrade(facility.id),
                  }, t('facility.upgrade'))))
          }))),
        h('div', { className: 'fg-sectionMeta', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' }, status),
      )
    }

