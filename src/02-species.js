    // §2 Scenes, species and colour variants.
    //    `head` picks the drawing, `leaf` the foliage, `alt` the second colour
    //    that odd-numbered plots grow.
    // ---------------------------------------------------------------------
    /** The hidden bloom is not yellow paint: pearl petals, a pale gold aura, drifting light. */
    const HIDDEN_PAL = {
      petal: '#fff8e2', petalDeep: '#f4dfae', center: '#fffdf2', centerDeep: '#f3d79a',
      stem: '#cfe4c9', leaf: '#deecd7',
    }
    const HIDDEN_GOLD = { tip: '#f3d9f0', light: '#fffdf6', aura: '#fff6d6', auraEdge: '#ffedb8', spark: '#fff8dc' }

    const SCENES = [
      {
        id: 'meadow', cost: 0, tint: 'rgba(122,168,106,0.10)', edge: 'rgba(122,168,106,0.32)',
        weather: { clear: 1.15, overcast: 1, rain: 1 }, rainWets: true,
        species: ['dandelion', 'daisy', 'cherry', 'tulip', 'lavender', 'poppy', 'sunflower', 'lily', 'rose', 'hydrangea'],
      },
      {
        id: 'snow', cost: 150, tint: 'rgba(122,164,222,0.12)', edge: 'rgba(122,164,222,0.38)',
        weather: { clear: 1.05, overcast: 0.95, rain: 0.9 }, rainWets: true,
        species: ['snowdrop', 'hellebore', 'plum', 'edelweiss', 'camellia'],
      },
      {
        id: 'volcano', cost: 450, tint: 'rgba(196,96,72,0.12)', edge: 'rgba(196,96,72,0.38)',
        weather: { clear: 1.25, overcast: 0.9, rain: 0.85 }, rainWets: false,
        species: ['cactus', 'lehua', 'agave', 'silversword', 'plumeria'],
      },
      {
        id: 'lake', cost: 1200, tint: 'rgba(84,158,166,0.12)', edge: 'rgba(84,158,166,0.38)',
        weather: { clear: 1.1, overcast: 1.05, rain: 1.2 }, rainWets: true,
        species: ['pickerel', 'loosestrife', 'iris', 'waterlily', 'lotus'],
      },
    ]
    SCENES.push(
      {id:'woodland',cost:1800,tint:'rgba(69,119,83,.12)',edge:'rgba(69,119,83,.4)',weather:{clear:1.05,overcast:1.15,rain:1.1},rainWets:true,species:[]},
      {id:'desert',cost:2600,tint:'rgba(194,151,87,.12)',edge:'rgba(194,151,87,.4)',weather:{clear:1.2,overcast:1.05,rain:.85},rainWets:false,species:[]})
    SCENES.push(...MORE_SCENES)
    const SCENE_BY_ID = new Map(SCENES.map(scene => [scene.id, scene]))
    const SCENE_ID_OF = new Map()
    for (const scene of SCENES) for (const id of scene.species) SCENE_ID_OF.set(id, scene.id)

    const SPECIES = [
      // ── meadow ──────────────────────────────────────────────────────────
      {
        id: 'dandelion', cost: 3, growSec: 45, sell: 6, xp: 1, head: 'dandelion', leaf: 'runcinate',
        pal: { petal: '#f8cd4b', petalDeep: '#e0a923', center: '#f2b62f', centerDeep: '#c98a14', stem: '#8ab06a', leaf: '#95bf72' },
      },
      {
        id: 'daisy', cost: 5, growSec: 60, sell: 10, xp: 2, head: 'daisy', leaf: 'spoon',
        pal: { petal: '#fbfaf1', petalDeep: '#e4dcc4', center: '#f5c542', centerDeep: '#d99d20', stem: '#7aa86a', leaf: '#8bbf74' },
        alt: { petal: '#f7c6d4', petalDeep: '#e2a5b9' },
      },
      {
        id: 'cherry', cost: 10, growSec: 120, sell: 21, xp: 4, head: 'cherry', leaf: 'twig',
        pal: { petal: '#f9d5e0', petalDeep: '#eeb0c5', center: '#f3b3c6', centerDeep: '#d98ba0', stem: '#8a6d57', leaf: '#7fae72' },
        alt: { petal: '#fdfdfd', petalDeep: '#e6e2df', center: '#f3d7b8', centerDeep: '#dcc09c' },
      },
      {
        id: 'tulip', cost: 14, growSec: 150, sell: 29, xp: 5, head: 'tulip', leaf: 'strap',
        pal: { petal: '#f0718f', petalDeep: '#cf4d70', center: '#ffd9e4', centerDeep: '#e9a4b8', stem: '#6fa85f', leaf: '#82b872' },
        alt: { petal: '#f6d15c', petalDeep: '#d9ae33' },
      },
      {
        id: 'lavender', cost: 18, growSec: 180, sell: 38, xp: 7, head: 'lavender', leaf: 'needle',
        pal: { petal: '#9b86d8', petalDeep: '#7c68bd', center: '#b6a5e6', centerDeep: '#8d7cc9', stem: '#8fa87a', leaf: '#9db98a' },
      },
      {
        id: 'poppy', cost: 22, growSec: 210, sell: 47, xp: 9, head: 'poppy', leaf: 'pinnate',
        pal: { petal: '#e6483f', petalDeep: '#bb2f29', center: '#2f2b28', centerDeep: '#1c1a18', stem: '#7fa05f', leaf: '#88ab66' },
        alt: { petal: '#fbf6ef', petalDeep: '#e2d9cc' },
      },
      {
        id: 'sunflower', cost: 26, growSec: 240, sell: 56, xp: 11, head: 'sunflower', leaf: 'heart',
        pal: { petal: '#f7b733', petalDeep: '#dd9a1a', center: '#6b4226', centerDeep: '#4d2d18', stem: '#6f9c4f', leaf: '#7fae5c' },
      },
      {
        id: 'lily', cost: 32, growSec: 290, sell: 70, xp: 13, head: 'lily', leaf: 'whorl',
        pal: { petal: '#fbf6ec', petalDeep: '#e9c6cd', center: '#e8a63a', centerDeep: '#c8862a', stem: '#6fa05f', leaf: '#7fb46e' },
        alt: { petal: '#f6c9d6', petalDeep: '#dfa6ba' },
      },
      {
        id: 'rose', cost: 40, growSec: 340, sell: 88, xp: 17, head: 'rose', leaf: 'rose',
        pal: { petal: '#e2466c', petalDeep: '#b62f52', center: '#8e2242', centerDeep: '#6f1832', stem: '#5f8f52', leaf: '#6fa860' },
        alt: { petal: '#fbf5ec', petalDeep: '#e0d2c0', center: '#e8d8b8', centerDeep: '#c9b48c' },
      },
      {
        id: 'hydrangea', cost: 50, growSec: 400, sell: 112, xp: 22, head: 'mophead', leaf: 'serrate',
        pal: { petal: '#8f9bf0', petalDeep: '#6d78d8', center: '#b9c0f8', centerDeep: '#8a93e2', stem: '#7fa76a', leaf: '#8bb877' },
        alt: { petal: '#f2a8c6', petalDeep: '#d97fa6', center: '#f7c6d9', centerDeep: '#e5a0be' },
      },
      // ── snowfield ───────────────────────────────────────────────────────
      {
        id: 'snowdrop', cost: 8, growSec: 90, sell: 17, xp: 3, head: 'snowdrop', leaf: 'strap',
        pal: { petal: '#fbfdff', petalDeep: '#dbe4ee', center: '#8fbf7a', centerDeep: '#5f8f4f', stem: '#7fa07a', leaf: '#8fae8a' },
      },
      {
        id: 'hellebore', cost: 16, growSec: 170, sell: 35, xp: 6, head: 'hellebore', leaf: 'palmate',
        pal: { petal: '#f6f1ea', petalDeep: '#ddcfc0', center: '#a8c47f', centerDeep: '#7d9a58', stem: '#6f8a5c', leaf: '#7d9a68' },
        alt: { petal: '#e7b9cd', petalDeep: '#c992ab' },
      },
      {
        id: 'plum', cost: 24, growSec: 230, sell: 52, xp: 10, head: 'plum', leaf: 'twig',
        pal: { petal: '#f7b9cd', petalDeep: '#dd8fa9', center: '#f7d76a', centerDeep: '#d8b23c', stem: '#6b5548', leaf: '#7c9a6a' },
        alt: { petal: '#fdfbf7', petalDeep: '#e5dccd' },
      },
      {
        id: 'edelweiss', cost: 34, growSec: 300, sell: 75, xp: 14, head: 'edelweiss', leaf: 'woolly',
        pal: { petal: '#faf7ef', petalDeep: '#dfd8c6', center: '#e8c65a', centerDeep: '#c9a633', stem: '#8a9a72', leaf: '#9aa885' },
      },
      {
        id: 'camellia', cost: 46, growSec: 370, sell: 104, xp: 20, head: 'camellia', leaf: 'glossy',
        pal: { petal: '#e3588c', petalDeep: '#b8465f', center: '#8c2740', centerDeep: '#6b1930', stem: '#5f7f52', leaf: '#6f9a60' },
        alt: { petal: '#fdfbf6', petalDeep: '#e6ded1', center: '#e8ddc7', centerDeep: '#cbb999' },
      },
      // ── volcanic crater ─────────────────────────────────────────────────
      {
        id: 'cactus', cost: 12, growSec: 130, sell: 26, xp: 4, head: 'cactus', leaf: 'pad',
        pal: { petal: '#f6c34a', petalDeep: '#d9a02a', center: '#c9603f', centerDeep: '#9c4529', stem: '#6f9a5e', leaf: '#7fae6a' },
        alt: { petal: '#f08a4b', petalDeep: '#c96a30' },
      },
      {
        id: 'lehua', cost: 22, growSec: 200, sell: 46, xp: 8, head: 'pompom', leaf: 'leathery',
        pal: { petal: '#e34b3f', petalDeep: '#b93129', center: '#f6b23c', centerDeep: '#d18c1f', stem: '#6f7f52', leaf: '#7f9460' },
      },
      {
        id: 'agave', cost: 36, growSec: 310, sell: 80, xp: 15, head: 'agave', leaf: 'rosette',
        pal: { petal: '#e8d98a', petalDeep: '#c9b85c', center: '#b8a24a', centerDeep: '#8f7c2e', stem: '#7f9a6a', leaf: '#9aa885' },
      },
      {
        id: 'silversword', cost: 52, growSec: 420, sell: 120, xp: 23, head: 'silversword', leaf: 'silver',
        pal: { petal: '#b3567f', petalDeep: '#83365a', center: '#e6c47c', centerDeep: '#b08d3c', stem: '#9aa8a0', leaf: '#b6c2bb' },
      },
      {
        id: 'plumeria', cost: 64, growSec: 500, sell: 152, xp: 29, head: 'plumeria', leaf: 'paddle',
        pal: { petal: '#fdf4f6', petalDeep: '#efd3dc', center: '#f7cf5a', centerDeep: '#d9ab2c', stem: '#7f8f62', leaf: '#8fa870' },
        alt: { petal: '#f3a8bf', petalDeep: '#dc7f9c' },
      },
      // ── lakeside ────────────────────────────────────────────────────────
      {
        id: 'pickerel', cost: 14, growSec: 140, sell: 30, xp: 4, head: 'pickerel', leaf: 'arrow',
        pal: { petal: '#7d8ee0', petalDeep: '#5f6fc4', center: '#a9b6ef', centerDeep: '#818fce', stem: '#6f9a72', leaf: '#7fae80' },
      },
      {
        id: 'loosestrife', cost: 26, growSec: 220, sell: 55, xp: 10, head: 'loosestrife', leaf: 'opposite',
        pal: { petal: '#c95a9c', petalDeep: '#a53e7c', center: '#e3a0c4', centerDeep: '#c478a2', stem: '#6f9a62', leaf: '#82ae6c' },
      },
      {
        id: 'iris', cost: 38, growSec: 300, sell: 82, xp: 15, head: 'iris', leaf: 'sword',
        pal: { petal: '#f2c53d', petalDeep: '#d3a521', center: '#c98a2a', centerDeep: '#9c671a', stem: '#6f9a5c', leaf: '#82ae6a' },
        alt: { petal: '#f7f2e6', petalDeep: '#ded4c0' },
      },
      {
        id: 'waterlily', cost: 54, growSec: 400, sell: 120, xp: 22, head: 'waterlily', leaf: 'float',
        pal: { petal: '#fdf3f7', petalDeep: '#efc9da', center: '#f2c33c', centerDeep: '#d09d1f', stem: '#5f8f7a', leaf: '#6f9a78' },
        alt: { petal: '#f3b7cf', petalDeep: '#dd8fae' },
      },
      {
        id: 'lotus', cost: 70, growSec: 520, sell: 165, xp: 30, head: 'lotus', leaf: 'peltate',
        pal: { petal: '#f29ac0', petalDeep: '#d974a0', center: '#f8d96a', centerDeep: '#d8b53a', stem: '#6f9a6a', leaf: '#7fae74' },
        alt: { petal: '#fdfbf7', petalDeep: '#e8e0d2' },
      },
    ]
const NEW_SPECIES = [
  { id: 'cosmos', scene: 'meadow', cost: 8, growSec: 100, sell: 17, xp: 3, head: 'cosmos', leaf: 'pinnate', pal: { petal: '#e68bb7', petalDeep: '#b94584', center: '#f6cd45', centerDeep: '#a67818', stem: '#719958', leaf: '#82a766' }, alt: { petal: '#fff9f2', petalDeep: '#e3d8c9' } },
  { id: 'zinnia', scene: 'meadow', cost: 20, growSec: 195, sell: 42, xp: 8, head: 'zinnia', leaf: 'opposite', pal: { petal: '#e86870', petalDeep: '#b93053', center: '#e9ad32', centerDeep: '#98541b', stem: '#67874a', leaf: '#80a85c' }, alt: { petal: '#f2b546', petalDeep: '#d17f25' } },
  { id: 'cornflower', scene: 'meadow', cost: 16, growSec: 165, sell: 34, xp: 6, head: 'cornflower', leaf: 'needle', pal: { petal: '#688fe0', petalDeep: '#4053a8', center: '#655197', centerDeep: '#40335f', stem: '#6e9272', leaf: '#8ba88a' } },
  { id: 'calendula', scene: 'meadow', cost: 12, growSec: 135, sell: 26, xp: 5, head: 'calendula', leaf: 'spoon', pal: { petal: '#f6b442', petalDeep: '#dc7527', center: '#a95c23', centerDeep: '#6e391c', stem: '#739755', leaf: '#8aaf68' } },
  { id: 'snapdragon', scene: 'meadow', cost: 56, growSec: 450, sell: 128, xp: 25, head: 'snapdragon', leaf: 'opposite', pal: { petal: '#e685ae', petalDeep: '#ba4b83', center: '#f8de91', centerDeep: '#dba849', stem: '#6c8e55', leaf: '#83a76b' }, alt: { petal: '#f8e09a', petalDeep: '#ddba58' } },
  { id: 'crocus', scene: 'snow', cost: 10, growSec: 110, sell: 22, xp: 4, head: 'crocus', leaf: 'strap', pal: { petal: '#b391df', petalDeep: '#7e5ab2', center: '#efa735', centerDeep: '#bb651c', stem: '#7e9662', leaf: '#799b66' }, alt: { petal: '#f8f6ed', petalDeep: '#ded9d0' } },
  { id: 'daffodil', scene: 'snow', cost: 20, growSec: 200, sell: 44, xp: 8, head: 'daffodil', leaf: 'strap', pal: { petal: '#fae16c', petalDeep: '#d6b842', center: '#f7ae31', centerDeep: '#bb7621', stem: '#7e9c63', leaf: '#94ac76' } },
  { id: 'primrose', scene: 'snow', cost: 14, growSec: 150, sell: 31, xp: 5, head: 'primrose', leaf: 'spoon', pal: { petal: '#fbefba', petalDeep: '#ddce86', center: '#e4b337', centerDeep: '#a87a1d', stem: '#76985c', leaf: '#8aad6a' } },
  { id: 'pansy', scene: 'snow', cost: 30, growSec: 270, sell: 66, xp: 12, head: 'pansy', leaf: 'serrate', pal: { petal: '#a984d5', petalDeep: '#6b4794', center: '#f1cb51', centerDeep: '#4c305d', stem: '#729561', leaf: '#8ab075' }, alt: { petal: '#f5d25a', petalDeep: '#d9aa2b' } },
  { id: 'bleedingheart', scene: 'snow', cost: 60, growSec: 470, sell: 140, xp: 26, head: 'bleedingheart', leaf: 'pinnate', pal: { petal: '#eb85a6', petalDeep: '#bd4e7b', center: '#fff7f5', centerDeep: '#ddcbd2', stem: '#81976a', leaf: '#8da87c' } },
  { id: 'hibiscus', scene: 'volcano', cost: 28, growSec: 250, sell: 61, xp: 11, head: 'hibiscus', leaf: 'serrate', pal: { petal: '#ee7068', petalDeep: '#ba3b46', center: '#f5cc57', centerDeep: '#a76a20', stem: '#648950', leaf: '#7aa45f' }, alt: { petal: '#f5b257', petalDeep: '#d7833b' } },
  { id: 'birdofparadise', scene: 'volcano', cost: 82, growSec: 580, sell: 195, xp: 34, head: 'birdofparadise', leaf: 'paddle', pal: { petal: '#f39837', petalDeep: '#c56820', center: '#5070b4', centerDeep: '#304b8b', stem: '#658b62', leaf: '#7b9b71' } },
  { id: 'gazania', scene: 'volcano', cost: 18, growSec: 180, sell: 39, xp: 7, head: 'gazania', leaf: 'pinnate', pal: { petal: '#f8bf42', petalDeep: '#d4812d', center: '#9b6227', centerDeep: '#5b3627', stem: '#74895c', leaf: '#94a887' } },
  { id: 'redhotpoker', scene: 'volcano', cost: 44, growSec: 360, sell: 100, xp: 19, head: 'redhotpoker', leaf: 'strap', pal: { petal: '#ed813d', petalDeep: '#c14b2b', center: '#f5cf58', centerDeep: '#b49b35', stem: '#82905d', leaf: '#94a76c' } },
  { id: 'desertrose', scene: 'volcano', cost: 96, growSec: 650, sell: 232, xp: 39, head: 'desertrose', leaf: 'glossy', pal: { petal: '#ef96b8', petalDeep: '#bb527f', center: '#fff6df', centerDeep: '#d4b977', stem: '#9a9982', leaf: '#7e9f65' } },
  { id: 'marshmarigold', scene: 'lake', cost: 18, growSec: 170, sell: 39, xp: 6, head: 'marshmarigold', leaf: 'heart', pal: { petal: '#f7d143', petalDeep: '#d5a527', center: '#edb92f', centerDeep: '#a7781d', stem: '#72965e', leaf: '#82ab6c' } },
  { id: 'forgetmenot', scene: 'lake', cost: 22, growSec: 190, sell: 47, xp: 7, head: 'forgetmenot', leaf: 'opposite', pal: { petal: '#93c4ec', petalDeep: '#658fcb', center: '#f5d85b', centerDeep: '#b89b35', stem: '#739e71', leaf: '#8ab285' } },
  { id: 'astilbe', scene: 'lake', cost: 46, growSec: 350, sell: 105, xp: 19, head: 'astilbe', leaf: 'pinnate', pal: { petal: '#d79bc3', petalDeep: '#a96599', center: '#f0c6de', centerDeep: '#b47b9c', stem: '#7f9066', leaf: '#90a474' } },
  { id: 'cardinalflower', scene: 'lake', cost: 62, growSec: 460, sell: 146, xp: 27, head: 'cardinalflower', leaf: 'serrate', pal: { petal: '#e44d44', petalDeep: '#ac2f36', center: '#f79b68', centerDeep: '#c94e37', stem: '#79865a', leaf: '#8ca36b' } },
  { id: 'arrowhead', scene: 'lake', cost: 84, growSec: 590, sell: 202, xp: 35, head: 'arrowhead', leaf: 'arrow', pal: { petal: '#fffaf0', petalDeep: '#ddd8c8', center: '#e7c24d', centerDeep: '#a18b2c', stem: '#6d965f', leaf: '#80a86c' } },
]
    SPECIES.push(...NEW_SPECIES)
    for (const species of NEW_SPECIES) {
      SCENE_BY_ID.get(species.scene).species.push(species.id)
      SCENE_ID_OF.set(species.id, species.scene)
      species.source = ['crocus','astilbe','arrowhead'].includes(species.id)
        ? `https://en.wikipedia.org/wiki/${({crocus:'Crocus_vernus',astilbe:'Astilbe_chinensis',arrowhead:'Sagittaria_sagittifolia'})[species.id]}`
        : `https://plants.ces.ncsu.edu/plants/${({cosmos:'cosmos-bipinnatus',zinnia:'zinnia-elegans',cornflower:'centaurea-cyanus',calendula:'calendula-officinalis',snapdragon:'antirrhinum-majus',daffodil:'narcissus-pseudonarcissus',primrose:'primula-vulgaris',pansy:'viola-tricolor',bleedingheart:'lamprocapnos-spectabilis',hibiscus:'hibiscus-rosa-sinensis',birdofparadise:'strelitzia-reginae',gazania:'gazania-rigens',redhotpoker:'kniphofia-uvaria',desertrose:'adenium-obesum',marshmarigold:'caltha-palustris',forgetmenot:'myosotis-scorpioides',cardinalflower:'lobelia-cardinalis'})[species.id]}/`
    }
const REGION_SPECIES = [
  { id:'foxglove', scene:'woodland', cost:28, growSec:260, sell:68, xp:12, head:'foxglove', leaf:'serrate', pal:{petal:'#9d72bd',petalDeep:'#68417f',center:'#f2d9a2',centerDeep:'#ab7a4d',stem:'#66885a',leaf:'#7fa56b'}, source:'https://en.wikipedia.org/wiki/Digitalis_purpurea' },
  { id:'bluebell', scene:'woodland', cost:18, growSec:150, sell:38, xp:7, head:'bluebell', leaf:'strap', pal:{petal:'#6f83cf',petalDeep:'#46569c',center:'#f5ead0',centerDeep:'#c9b37d',stem:'#6f955e',leaf:'#8ca66b'}, source:'https://en.wikipedia.org/wiki/Hyacinthoides_non-scripta' },
  { id:'cyclamen', scene:'woodland', cost:46, growSec:380, sell:112, xp:21, head:'cyclamen', leaf:'ivy', pal:{petal:'#d97ca5',petalDeep:'#914568',center:'#f5e3df',centerDeep:'#b77e8a',stem:'#6f855e',leaf:'#8ea679'}, alt:{petal:'#f8f0e8',petalDeep:'#d8c7ba'}, source:'https://en.wikipedia.org/wiki/Cyclamen_hederifolium' },
  { id:'woodanemone', scene:'woodland', cost:12, growSec:115, sell:25, xp:4, head:'woodanemone', leaf:'palmate', pal:{petal:'#f8f5eb',petalDeep:'#d8d4c8',center:'#edc95b',centerDeep:'#a47b23',stem:'#789964',leaf:'#8eae72'}, alt:{petal:'#d9c5e8',petalDeep:'#aa8bc2'}, source:'https://en.wikipedia.org/wiki/Anemone_nemorosa' },
  { id:'californiapoppy', scene:'desert', cost:22, growSec:175, sell:44, xp:8, head:'californiapoppy', leaf:'fern', pal:{petal:'#f3a33e',petalDeep:'#c86b27',center:'#d8892c',centerDeep:'#8d4b20',stem:'#718f55',leaf:'#8da46d'}, alt:{petal:'#f3d55b',petalDeep:'#d2a62b'}, source:'https://en.wikipedia.org/wiki/Eschscholzia_californica' },
  { id:'desertmarigold', scene:'desert', cost:34, growSec:290, sell:78, xp:14, head:'desertmarigold', leaf:'silver', pal:{petal:'#f5d653',petalDeep:'#d09f28',center:'#b47729',centerDeep:'#744314',stem:'#84915e',leaf:'#b2b79b'}, source:'https://en.wikipedia.org/wiki/Baileya_multiradiata' },
  { id:'penstemon', scene:'desert', cost:52, growSec:420, sell:126, xp:23, head:'penstemon', leaf:'strap', pal:{petal:'#e74e4e',petalDeep:'#a62d35',center:'#efcf72',centerDeep:'#a98235',stem:'#6d8d5a',leaf:'#829e69'}, source:'https://en.wikipedia.org/wiki/Penstemon_barbatus' },
  { id:'eveningprimrose', scene:'desert', cost:64, growSec:610, sell:170, xp:31, head:'eveningprimrose', leaf:'lance', pal:{petal:'#f7dd67',petalDeep:'#d4ae35',center:'#f1b34b',centerDeep:'#a86b23',stem:'#72885d',leaf:'#8ca06c'}, source:'https://en.wikipedia.org/wiki/Oenothera_biennis' },
]
    SPECIES.push(...REGION_SPECIES, ...MORE_SPECIES)
    for(const species of MORE_SPECIES){SCENE_BY_ID.get(species.scene).species.push(species.id);SCENE_ID_OF.set(species.id,species.scene)}
    for(const species of REGION_SPECIES){SCENE_BY_ID.get(species.scene).species.push(species.id);SCENE_ID_OF.set(species.id,species.scene)}
    const SPECIES_BY_ID = new Map(SPECIES.map(species => [species.id, species]))
    for (const scene of SCENES) scene.species.sort((a,b) => SPECIES_BY_ID.get(a).cost - SPECIES_BY_ID.get(b).cost)


    /** Every codex entry: species × variant, including the gold hidden bloom. */
    Object.assign(ECO_PROFILES,{
      foxglove:{role:'nectar',season:1,visitor:'bumblebee'},bluebell:{role:'nectar',season:0,visitor:'bee'},cyclamen:{role:'shelter',season:2,visitor:'robin'},woodanemone:{role:'pollen',season:0,visitor:'bee'},
      californiapoppy:{role:'pollen',season:0,visitor:'bee'},desertmarigold:{role:'pollen',season:1,visitor:'butterfly'},penstemon:{role:'nectar',season:1,visitor:'hawkmoth'},eveningprimrose:{role:'night',season:2,visitor:'moth'}
    })
    const CODEX_ENTRIES = []
    for (const species of SPECIES) {
      CODEX_ENTRIES.push({ species: species.id, variant: 'base' })
      if (species.alt !== undefined) CODEX_ENTRIES.push({ species: species.id, variant: 'alt' })
      CODEX_ENTRIES.push({ species: species.id, variant: 'hidden' })
    }

    const STORAGE_KEY = 'dsh.flower-garden.v4'
    const LEGACY_KEYS = ['dsh.flower-garden.v3', 'dsh.flower-garden.v2', 'dsh.flower-garden.v1']
    const STATE_VERSION = 4
    const PLOT_COUNT = 6
    const START_COINS = 25
    const START_PLOTS = 3
    const UNLOCK_COSTS = [null, null, null, 40, 90, 160]
    const XP_PER_LEVEL = 60
    const BASKET_CAPACITY = 12
    const SPRINKLER_MS = 30 * 60 * 1000
    const CHARM_BONUS = 0.03
    /** Ceiling of the spirit chance, without and with a lucky charm. */
    const HIDDEN_CAP = 0.1
    const CHARM_CAP = 0.15

    /** Shop goods: consumables sit in the bag, the basket upgrade has levels. */
    const ITEMS = [
      { id: 'fertilizer', price: 35, kind: 'consumable' },
      { id: 'compost', price: 25, kind: 'consumable' },
      { id: 'sprinkler', price: 90, kind: 'consumable' },
      { id: 'charm', price: 120, kind: 'consumable' },
      { id: 'basket', price: 150, kind: 'upgrade', maxLevel: 4 },
    ]
    const ITEM_BY_ID = new Map(ITEMS.map(item => [item.id, item]))

    function basketCapacity(state) {
      return [BASKET_CAPACITY, 30, 50, 75, 100][Math.max(0,Math.min(4,Math.floor(finiteOr(state.basketLevel,0))))]
    }
    const ORDER_SLOTS = 2

    /** The flower market favours one species a day. */
    const MARKET_BONUS = 1.5

    /**
     * Keeping the garden in balance. Soil tires with every harvest and faster
     * under the same crop; rotation, rest and compost restore it. The market
     * tires of a flower sold in bulk and recovers with time. Facilities cost
     * more at every level and, past the first, ribbons from the flower show.
     */
    const SOIL_HARVEST = 14
    const SOIL_REPEAT = 10
    const SOIL_ROTATE = 8
    const SOIL_REST_MS = 60 * 1000
    const SOIL_FLOOR = 0.55
    const COMPOST_GAIN = 60
    const GLUT_STEP = 0.05
    const GLUT_FLOOR = 0.5
    const GLUT_RECOVER_MS = 2 * 60 * 1000
    const TRAIT_PRICE = 2
    const HYBRID_PRICE = 1.5
    const HYBRID_CHANCE = 0.45
    const FACILITIES = [
      { id: 'hive', base: 200, step: 0.025 },
      { id: 'greenhouse', base: 300, step: 0.1 },
      { id: 'bench', base: 250, step: 0.05 },
    ]
    const FACILITY_BY_ID = new Map(FACILITIES.map(entry => [entry.id, entry]))
    const FACILITY_MAX = 8
    const FACILITY_GROWTH = 1.8

    /** The flower show: a themed, time-limited exhibition that pays in ribbons, not coins. */
    const SHOW_MS = 6 * 60 * 60 * 1000
    const SHOW_SLOTS = 8
    const SHOW_TIERS = [{ points: 6, ribbons: 1 }, { points: 14, ribbons: 2 }, { points: 24, ribbons: 3 }]
    const SEASONS = ['spring', 'summer', 'autumn', 'winter']
    const SEASON_SCENE = { spring: 'meadow', summer: 'volcano', autumn: 'lake', winter: 'snow' }
    const SHOW_THEMES = ['ground', 'warm', 'cool', 'rare']

    /**
     * Visitors come to open flowers. A plot's visitor is a pure function of the
     * clock, so it needs no timers and survives a reload: each `VISIT_MS` window
     * rolls once per plot. `when` is day, night or any; `dry` visitors stay away in rain.
     */
    const VISIT_MS = 45 * 1000
    const VISIT_CHANCE = 0.34
    const VISITORS = [
      { id: 'bee', scenes: ['meadow', 'volcano', 'lake'], when: 'day', weight: 5, tip: 2 },
      { id: 'butterfly', scenes: ['meadow', 'lake'], when: 'day', dry: true, weight: 3, tip: 3 },
      { id: 'ladybug', scenes: ['meadow'], when: 'any', weight: 2, tip: 3 },
      { id: 'dragonfly', scenes: ['lake'], when: 'day', dry: true, weight: 3, tip: 4 },
      { id: 'firefly', scenes: ['meadow', 'lake'], when: 'night', weight: 4, tip: 5 },
      { id: 'moth', scenes: ['meadow', 'volcano', 'lake'], when: 'night', weight: 2, tip: 6 },
      { id: 'robin', scenes: ['snow'], when: 'any', weight: 3, tip: 5 },
      { id: 'honeycreeper', scenes: ['volcano'], when: 'day', weight: 2, tip: 8 },
      { id: 'kingfisher', scenes: ['lake'], when: 'day', weight: 1, tip: 12 },
      { id: 'bumblebee', scenes: ['meadow','snow','lake'], when: 'day', weight: 0.7, tip: 10, special: true },
      { id: 'swallowtail', scenes: ['meadow','lake'], when: 'day', dry: true, weight: 0.5, tip: 14, special: true },
      { id: 'hawkmoth', scenes: ['meadow','volcano','lake'], when: 'day', weight: 0.6, tip: 12, special: true },
      { id: 'hoverfly', scenes: ['meadow','lake'], when: 'day', dry: true, weight: 0.6, tip: 10, special: true },
    ]
    for(const visitor of VISITORS){
      if(['bee','butterfly','ladybug','firefly','moth','robin','bumblebee','hoverfly'].includes(visitor.id))visitor.scenes.push('woodland')
      if(['bee','butterfly','moth','hawkmoth','bumblebee'].includes(visitor.id))visitor.scenes.push('desert')
      for(const [sceneId,ids] of Object.entries(MORE_VISITORS))if(ids.includes(visitor.id))visitor.scenes.push(sceneId)
    }
    const VISITOR_BY_ID = new Map(VISITORS.map(visitor => [visitor.id, visitor]))

    /** Long-term goals. `metric` names a counter in `achievementValue`. */
    const ACHIEVEMENTS = [
      { id: 'firstBloom', metric: 'harvested', target: 1, coins: 10 },
      { id: 'harvest30', metric: 'harvested', target: 30, coins: 60 },
      { id: 'harvest150', metric: 'harvested', target: 150, coins: 300 },
      { id: 'firstGuest', metric: 'visitorKinds', target: 1, coins: 20 },
      { id: 'pollinator', metric: 'pollinated', target: 12, coins: 120 },
      { id: 'naturalist', metric: 'visitorKinds', target: VISITORS.length, coins: 400 },
      { id: 'florist5', metric: 'delivered', target: 5, coins: 80 },
      { id: 'florist25', metric: 'delivered', target: 25, coins: 350 },
      { id: 'firstSpirit', metric: 'spiritKinds', target: 1, coins: 80 },
      { id: 'spirit8', metric: 'spiritKinds', target: 8, coins: 400 },
      { id: 'meadowBook', metric: 'meadowKinds', target: 10, coins: 150 },
      { id: 'allGrounds', metric: 'grounds', target: 4, coins: 250 },
      { id: 'breeder', metric: 'hybridKinds', target: 5, coins: 200 },
      { id: 'curio', metric: 'traitKinds', target: 4, coins: 250 },
      { id: 'ribbons', metric: 'ribbonsEarned', target: 10, coins: 300 },
      { id: 'bouquets10', metric: 'arranged', target: 10, coins: 200 },
      { id: 'trips10', metric: 'trips', target: 10, coins: 200 },
      { id: 'crafted20', metric: 'crafted', target: 20, coins: 250 },
      { id: 'contest3', metric: 'contestWins', target: 3, coins: 400 },
      { id: 'fund10', metric: 'fund', target: 10, coins: 500 },
      { id: 'bonds3', metric: 'bondsMax', target: 3, coins: 400 },
      { id: 'breeder7', metric: 'goalsDone', target: 7, coins: 600 },
      { id: 'cards30', metric: 'cards', target: 30, coins: 300 },
      { id: 'fullBook', metric: 'entries', target: CODEX_ENTRIES.length, coins: 1500 },
    ]
    const ACHIEVEMENT_BY_ID = new Map(ACHIEVEMENTS.map(entry => [entry.id, entry]))
    const MAX_OFFLINE_MS = 12 * 60 * 60 * 1000
    const DRY_SHARE = 0.75

    /** Weather turns over on this period; each scene reads it differently. */
    const WEATHER_MS = 5 * 60 * 1000
    const WEATHER_KINDS = ['clear', 'overcast', 'rain']

    function growMsOf(species) {
      return species.growSec * 1000
    }

    function decayPerMs(species) {
      return 100 / (growMsOf(species) * DRY_SHARE)
    }

    function sceneOf(sceneId) {
      return SCENE_BY_ID.get(sceneId) ?? SCENES[0]
    }

    /** Deterministic weather bucket, so the same clock always gives the same sky. */
    function weatherAt(ms) {
      const bucket = Math.floor(ms / WEATHER_MS)
      let x = (bucket ^ 0x9e3779b9) | 0
      x = Math.imul(x ^ (x >>> 15), 0x85ebca6b)
      x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35)
      x ^= x >>> 16
      return WEATHER_KINDS[Math.abs(x) % WEATHER_KINDS.length]
    }

    function weatherEndsAt(ms) {
      return (Math.floor(ms / WEATHER_MS) + 1) * WEATHER_MS
    }

    /** The palette a plot or a codex entry draws with. */
    function paletteOf(species, variant, tintId) {
      if (variant === 'hidden') return { ...species.pal, ...HIDDEN_PAL }
      // A hybrid keeps its mother's form and wears the pollen parent's petal colours.
      const tint = tintId === undefined ? undefined : SPECIES_BY_ID.get(tintId)
      if (tint !== undefined) return { ...species.pal, petal: tint.pal.petal, petalDeep: tint.pal.petalDeep }
      if (variant === 'alt' && species.alt !== undefined) return { ...species.pal, ...species.alt }
      return species.pal
    }

    /**
     * Curiosities: rare forms a plant takes after an unusual life. `pal` and
     * `stops` repaint the petals; twin, giant and variegated change the plant itself.
     * `chance` is rolled at harvest once the cause in `traitCauses` holds.
     */
    const TRAITS = [
      { id: 'twin', chance: 0.4 },
      { id: 'giant', chance: 0.35 },
      { id: 'rainbow', chance: 0.12, pal: { petal: '#f7a8c8', petalDeep: '#8f7be0' }, stops: [[0, '#7d6be0'], [25, '#4fb8e8'], [50, '#6fd49a'], [72, '#f6d95a'], [100, '#f58ab0']] },
      { id: 'frost', chance: 0.12, pal: { petal: '#dff1fb', petalDeep: '#9cc7e6', center: '#f4fbff', centerDeep: '#a9cfe8' }, stops: [[0, '#8fbfe6'], [50, '#dff1fb'], [100, '#ffffff']] },
      { id: 'ember', chance: 0.12, pal: { petal: '#ff8a2b', petalDeep: '#c2261a', center: '#ffd35a', centerDeep: '#e2781c' }, stops: [[0, '#7a1410'], [40, '#e4361e'], [78, '#ff9a2e'], [100, '#ffe27a']] },
      { id: 'pearl', chance: 0.12, pal: { petal: '#f3eef8', petalDeep: '#c9bfe6', center: '#fff6d8', centerDeep: '#d9c48a' }, stops: [[0, '#c7b8ea'], [35, '#f6e6f1'], [70, '#dff3f1'], [100, '#ffffff']] },
      { id: 'ink', chance: 0.1, pal: { petal: '#3b2a4a', petalDeep: '#1c1426', center: '#c9a24a', centerDeep: '#7a5a1e' }, stops: [[0, '#120c1a'], [55, '#3b2a4a'], [100, '#7a4a8a']] },
      { id: 'variegated', chance: 0.14 },
      { id: 'fasciated', chance: 0.22, source: 'https://en.wikipedia.org/wiki/Fasciation', specimen: 'sunflower' },
      { id: 'radial', chance: 0.3, source: 'https://en.wikipedia.org/wiki/Floral_symmetry#Peloria', specimen: 'snapdragon' },
      { id: 'double', chance: 0.2, source: 'https://en.wikipedia.org/wiki/Double-flowered', specimen: 'rose' },
      { id: 'leafy', chance: 0.2, source: 'https://en.wikipedia.org/wiki/Phyllody', specimen: 'daisy' },
    ]
    const TRAIT_MAX = 4
    /** Odds of a further curiosity on a flower that already has 0, 1, 2 or 3. */
    const TRAIT_EXTRA = [1, 0.25, 0.15, 0.08]
    const TRAIT_BASE = new Map(TRAITS.map(trait => [trait.id, trait]))
    function traitParts(id) { return typeof id === 'string' && id !== '' ? id.split('+') : [] }
    /** One curiosity id for several: known ones only, no repeats, in the book's order, four at most. */
    function joinTraits(parts) {
      const order = TRAITS.map(trait => trait.id)
      return [...new Set(parts)].filter(id => TRAIT_BASE.has(id)).sort((a, b) => order.indexOf(a) - order.indexOf(b)).slice(0, TRAIT_MAX).join('+') || undefined
    }
    /** Several colour curiosities on one flower: each takes a band of the petal, and the base colours are mixed. */
    function blendPaints(painted) {
      const n = painted.length
      const stops = painted.flatMap((part, k) => part.stops.map(([offset, color]) => [Math.round(((k + offset / 100) / n) * 100), color]))
      const pal = {}
      for (const key of ['petal', 'petalDeep', 'center', 'centerDeep']) {
        const colors = painted.map(part => part.pal[key]).filter(Boolean)
        if (colors.length > 0) pal[key] = colors.reduce((acc, color, i) => mix(acc, color, 1 / (i + 1)))
      }
      return { stops, pal }
    }
    /** Looks up one curiosity or a combination such as "twin+frost". */
    const TRAIT_BY_ID = {
      has(id) { const parts = traitParts(id); return parts.length > 0 && parts.length <= TRAIT_MAX && new Set(parts).size === parts.length && parts.every(part => TRAIT_BASE.has(part)) },
      get(id) {
        if (TRAIT_BASE.has(id)) return TRAIT_BASE.get(id)
        if (!this.has(id)) return undefined
        const parts = traitParts(id).map(part => TRAIT_BASE.get(part))
        const painted = parts.filter(part => part.stops !== undefined), cited = parts.find(part => part.source !== undefined)
        const paint = painted.length > 1 ? blendPaints(painted) : painted[0]
        return { ...(paint ?? {}), id: traitParts(id).join('_'), parts: traitParts(id), chance: Math.min(...parts.map(part => part.chance)), source: cited?.source, specimen: cited?.specimen, factId: cited?.id }
      },
    }
    function traitPrice(trait) { const n = traitParts(trait).length; return n === 0 ? 1 : TRAIT_PRICE + n - 1 }
    function traitCountKeys(trait) { const parts = traitParts(trait); return parts.length > 1 ? [...parts, trait] : parts }
    function traitLabel(trait, t) { return traitParts(trait).map(part => t(`trait.${part}`)).join('·') }
    function traitCauseText(trait, t) { return traitParts(trait).map(part => t(`trait.${part}.cause`)).join(' · ') }
    function traitFactId(trait) { return TRAIT_BY_ID.get(trait)?.factId ?? trait }
    const TRAIT_API = { TRAIT_MAX, TRAIT_EXTRA, TRAIT_BY_ID, traitParts, joinTraits, traitPrice, traitLabel }
    /** The weather each ground turns into a curiosity: harvest in it for a chance. */
    const SCENE_TRAIT = {
      meadow: { trait: 'rainbow', weather: 'rain' },
      snow: { trait: 'frost', weather: 'rain' },
      volcano: { trait: 'ember', weather: 'clear' },
      lake: { trait: 'pearl', weather: 'rain' },
      woodland:{trait:'pearl',weather:'rain'},desert:{trait:'ember',weather:'clear'},
      alpine:{trait:'frost',weather:'clear'},rainforest:{trait:'rainbow',weather:'rain'},coast:{trait:'pearl',weather:'clear'},garden:{trait:'double',weather:'rain'},
    }

    /** Plots #1, #3 and #5 (even indexes) grow the species' second colour. */
    function plotVariant(species, index) {
      return index % 2 === 0 && species.alt !== undefined ? 'alt' : 'base'
    }

    function variantMultiplier(variant) {
      return variant === 'hidden' ? 3 : variant === 'alt' ? 1.3 : 1
    }

    function bloomPrice(species, variant) {
      return Math.round(species.sell * variantMultiplier(variant))
    }

    /** Uniform value in [0, 1) from three integers; the same inputs always agree. */
    function hashUnit(a, b, c) {
      let x = (Math.imul(a | 0, 0x9e3779b1) ^ Math.imul(b | 0, 0x85ebca6b) ^ Math.imul(c | 0, 0xc2b2ae35)) | 0
      x = Math.imul(x ^ (x >>> 16), 0x7feb352d)
      x = Math.imul(x ^ (x >>> 15), 0x846ca68b)
      x ^= x >>> 16
      return (x >>> 0) / 4294967296
    }

    /** Local calendar day, so the market turns over at the player's midnight. */
    function localDay(now) {
      return Math.floor((now - new Date(now).getTimezoneOffset() * 60000) / 86400000)
    }

    /**
     * Today's market favourite: the best-ranked species among the opened grounds.
     * Ranking by a per-day hash keeps the pick stable until a new ground opens.
     */
    function featuredSpecies(state, now) {
      if (now === undefined) return null
      const day = localDay(now)
      let best = null
      let bestRank = -1
      for (const [index, species] of SPECIES.entries()) {
        const slot = state.scenes[SCENE_ID_OF.get(species.id)]
        if (slot === undefined || slot.unlocked <= 0) continue
        const rank = hashUnit(day, index, 77)
        if (rank > bestRank) {
          best = species.id
          bestRank = rank
        }
      }
      return best
    }

    /** What one bloom sells for, market favourite included. */
    function salePrice(species, variant, featuredId) {
      const base = species.sell * variantMultiplier(variant)
      return Math.round(species.id === featuredId ? base * MARKET_BONUS : base)
    }

    /** Dusk to dawn, when the night visitors fly. */
    function isNight(now) {
      const hour = new Date(now).getHours()
      return hour >= 19 || hour < 6
    }

    function visitBucket(now) {
      return Math.floor(now / VISIT_MS)
    }

    /** The visitor at one plot right now, or null. Only open flowers attract one. */
    function visitorAt(sceneId, index, plot, now, weather, hiveLevel, ecologyBonus = 0, gardenState) {
      if (plot === null || plot === undefined) return null
      const species = SPECIES_BY_ID.get(plot.species)
      if (species === undefined || plot.growthMs < growMsOf(species)) return null
      const bucket = visitBucket(now)
      if (plot.greeted === bucket) return null
      const sceneIndex = SCENES.findIndex(scene => scene.id === sceneId)
      if (sceneIndex === -1) return null
      const spot = sceneIndex * 16 + index
      if (hashUnit(bucket, spot, 1) >= Math.min(0.85, VISIT_CHANCE + FACILITY_BY_ID.get('hive').step * (hiveLevel ?? 0) + ecologyBonus)) return null
      const night = isNight(now)
      const pool = VISITORS.filter(visitor => visitor.scenes.includes(sceneId)
        && (visitor.when === 'any' || (visitor.when === 'night') === night)
        && !(visitor.dry === true && weather === 'rain')
        && specialVisitorEligible(visitor, plot, gardenState, weather))
      const affinity = ecoProfile(species.id)?.visitor
      const weight = visitor => visitor.weight * (visitor.id === affinity ? 1.6 : 1)
      const total = pool.reduce((sum, visitor) => sum + weight(visitor), 0)
      if (total === 0) return null
      let pick = hashUnit(bucket, spot, 2) * total
      for (const visitor of pool) {
        pick -= weight(visitor)
        if (pick < 0) return visitor
      }
      return pool[pool.length - 1]
    }

    /** Chance that a harvest turns up the gold bloom; the flower book lists these. */
    function hiddenChance(plot, weather, now, scene) {
      let chance = 0.01
      if (plot.dried !== true) chance += 0.01
      const favoured = scene.rainWets ? weather === 'rain' : weather === 'clear'
      if (favoured) chance += 0.01
      const hour = new Date(now).getHours()
      if (hour >= 22 || hour < 5) chance += 0.01
      if (plot.moisture >= 80) chance += 0.01
      chance += seasonalBonus(plot.species, now)
      return Math.min(HIDDEN_CAP, chance)
    }

