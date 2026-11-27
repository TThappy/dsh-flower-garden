// Original cut-paper character plates for the gardener cards. All coordinates use the same 160 × 180 artboard.
const GARDENER_PLATES = {
  sprout: {sky:'#cadba0', light:'#f8efbd', hill:'#9cb675', ink:'#594e38', hair:'#6f4432', skin:'#eabd89', blush:'#d98c69'},
  finch:  {sky:'#9ecbd2', light:'#faf0b9', hill:'#83afb0', ink:'#314e60', hair:'#543833', skin:'#bc784d', blush:'#a65a3e'},
  clover: {sky:'#88b9a3', light:'#dee5a7', hill:'#638f78', ink:'#284e48', hair:'#304746', skin:'#bd946c', blush:'#aa7053'},
  robin:  {sky:'#dab295', light:'#fff0c7', hill:'#c79476', ink:'#544042', hair:'#e4ddd3', skin:'#ab724f', blush:'#996149'},
  amber:  {sky:'#d39e59', light:'#fff1a9', hill:'#b47f49', ink:'#583937', hair:'#682f29', skin:'#cb8857', blush:'#b36b47'},
  luna:   {sky:'#535c91', light:'#f1e6b9', hill:'#434676', ink:'#403c63', hair:'#cac8ed', skin:'#d2a794', blush:'#bb887b'},
  aurum:  {sky:'#d8b34d', light:'#fff6c2', hill:'#a77a2e', ink:'#513b18', hair:'#f5d76b', skin:'#d99b5f', blush:'#c77745'},
}

function GardenerPortrait({id}) {
  const character = Object.prototype.hasOwnProperty.call(GARDENER_PLATES,id) ? id : 'sprout'
  const palette = GARDENER_PLATES[character]
  const {ink, skin, hair, blush} = palette
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g,'')
  if (id === 'xiaohei') return h(XiaoheiRecruitPlate)
  const sky = `fg-portrait-${character}-${uid}`
  const path = (d, fill, stroke, width=1.5) => h('path',{d,fill,stroke,strokeWidth:width,strokeLinejoin:'round',strokeLinecap:'round'})
  const line = (d, color=ink, width=1.5) => path(d,'none',color,width)
  const oval = (cx,cy,rx,ry,fill,stroke) => h('ellipse',{cx,cy,rx,ry,fill,stroke,strokeWidth:1.4})
  const group = (transform,...children) => h('g',{transform},...children)
  const star = (x,y,size,color) => group(`translate(${x} ${y}) scale(${size})`,path('M0 -5Q.7 -.7 4 0Q.7 .8 0 5Q-.8 .8 -4 0Q-.8 -.7 0 -5Z',color))
  const leaf = (x,y,angle,size,color) => group(`translate(${x} ${y}) rotate(${angle}) scale(${size})`,path('M0 0Q-9 -6 -5 -18Q5 -14 0 0Z',color),line('M0 -1L-4 -14',palette.light,.65))
  const sprig = (x,y,angle,size,color) => group(`translate(${x} ${y}) rotate(${angle}) scale(${size})`,line('M0 0Q-4 -23 4 -46',color,1.8),leaf(-1,-8,-38,.8,color),leaf(-1,-18,42,.8,color),leaf(0,-24,-20,.65,color),leaf(2,-34,40,.6,color))
  const face = (tilt,expression) => group(`rotate(${tilt} 78 73)`,
    path('M69 85L69 100Q77 109 90 99L87 84Z',skin,ink),path('M69 89Q79 97 87 89L88 94Q79 101 70 98Z',blush),
    oval(57,71,5,7,skin,ink),oval(99,70,5,7,skin,ink),
    path('M57 55Q65 39 84 42Q102 46 100 66L97 79Q94 87 81 92Q68 92 60 81Q54 72 57 55Z',skin,ink),
    oval(66,77,4.3,2,blush),oval(91,76,4,1.8,blush),line('M80 68L78 74L81 74',blush,1.2),
    line(expression==='wise'?'M62 62Q68 59 73 62M84 62Q90 58 95 61':'M63 63Q68 60 73 62M85 61Q90 58 95 61',hair,2.2),
    expression==='joy' ? group('',line('M64 69Q68 64 72 68',ink,2),line('M86 68Q89 64 93 67',ink,2)) : group('',
      path('M63 69Q68 65 73 67Q70 72 64 70Z','#fff5df'),oval(69,68,2,2.5,ink),path('M85 68Q89 64 95 66Q92 72 86 70Z','#fff5df'),oval(90,67.5,2,2.6,ink)),
    expression==='joy' ? path('M73 79Q80 82 88 77Q84 88 77 85Z','#793e39') : line(expression==='wise'?'M74 81Q81 83 87 79':'M75 81Q82 84 87 78','#895145',1.5))
  const braid = (x,y,angle) => group(`translate(${x} ${y}) rotate(${angle})`,path('M-5 0Q4 -8 7 1L5 8Q9 13 4 18Q8 23 3 29L6 38L-1 34L-4 39L-5 29Q-11 22 -6 17Q-12 9 -5 5Z',hair,ink),line('M-4 6L3 12L-4 18L2 24',ink,1),line('M-5 30L4 30','#efd782',3))
  const envelope = (x,y,angle) => group(`translate(${x} ${y}) rotate(${angle})`,path('M-11 -6H11V7H-11Z','#fff2cc',ink,1.2),line('M-10 -5L0 2L10 -5','#ad795d',1),oval(0,2,2,2,'#ba6250'))
  const bird = (x,y,size) => group(`translate(${x} ${y}) scale(${size})`,path('M-18 0L-8 2Q-6 -3 0 -3Q3 -15 11 -11Q17 -8 12 0Q14 8 4 10Q-7 11 -10 5Z','#ebce6a',ink),path('M-7 3Q0 -2 7 2Q1 9 -5 7Z','#767b58'),path('M13 -7L20 -5L13 -3Z','#ce843e'),oval(9,-7,1.3,1.3,ink),line('M0 10L-1 14M5 10L6 13',ink,1.2))

  function drawSprout() {
    return group('rotate(-4 82 107)',
      path('M62 46Q40 54 49 79Q40 86 47 98Q61 98 67 84L91 91Q109 96 107 85Q111 65 98 48Z',hair,ink),
      path('M65 96Q49 97 43 108L30 133L42 143L56 128L50 170L113 174L107 122L121 137L132 127L111 102L89 96Z','#e7d99e',ink,2),
      path('M58 99L66 98L70 113L85 114L90 98L98 99L96 120L104 143L110 174L47 174L54 138L58 121Z','#b86344',ink,2),
      path('M67 119L88 120L86 134Q77 141 67 130Z','#d88959','#8b513f'),line('M68 122L85 123M61 142L56 164M90 140L97 163','#f1b778',1.4),oval(65,112,2.3,2.3,'#f7d982'),oval(91,113,2.3,2.3,'#f7d982'),
      face(4,'joy'),path('M57 68Q50 63 54 52Q71 38 95 49L99 64L90 58L82 62L83 55Q75 61 67 62L68 57L59 68Z',hair,ink),
      path('M44 54Q48 32 66 28Q78 19 92 28L103 43L114 50Q109 58 91 57Q68 53 49 62Q40 64 40 59Z','#7e9c55',ink,2),path('M42 55Q70 42 100 45L114 50Q111 55 102 56Q76 49 49 60L41 60Z','#cad18b',ink),
      leaf(78,29,-24,.82,'#a7bd62'),leaf(78,29,64,.92,'#618554'),
      path('M89 139Q95 112 113 115Q130 116 132 139','none','#865b3c',4),path('M79 135Q108 144 142 132L134 160Q112 171 89 160Z','#d6a464',ink,2),
      line('M87 145Q111 151 137 141M90 151Q111 159 135 149M99 140L105 163M116 140L118 162M129 138L126 159','#aa784c'),
      sprig(100,138,-42,.54,'#6b9256'),sprig(111,141,35,.58,'#819d54'),oval(41,138,6,6,skin,ink),oval(126,130,6,5,skin,ink))
  }
  function drawFinch() {
    return group('rotate(4 78 109)',
      path('M48 110L33 149L58 141L77 169L87 131L107 151L105 107Z','#506e88',ink,2),
      path('M62 97L51 102L34 124L43 135L56 123L51 168L101 172L99 125L107 111L94 99Z','#648ca3',ink,2),
      path('M66 99L77 107L88 98L96 102L84 123L73 163L58 158L69 118L60 107Z','#e5d09a',ink),
      path('M95 104Q104 105 112 113L119 114L124 92L135 94L132 124Q129 134 119 131L99 121Z','#7299a9',ink,2),
      path('M121 98L123 87Q121 82 124 81L128 87L135 77Q137 76 137 79L133 88L140 84Q143 85 139 89L131 97Z',skin,ink),bird(131,72,.82),
      path('M57 58Q47 46 55 37Q60 26 74 29Q87 19 96 33Q109 35 102 54L101 70L94 65Z',hair,ink),face(-9,'bright'),
      path('M53 57Q50 45 68 42L93 42L100 55L90 52L83 58L79 51L73 59L66 55L60 71Q53 71 53 57Z',hair,ink),
      path('M44 48Q49 32 68 29Q85 20 97 36L110 38L95 48L64 52L45 58L50 50Z','#527e95',ink,2),path('M58 49Q78 33 108 38L99 45L71 51Z','#a8c8c5',ink),
      path('M56 37Q45 30 50 12Q59 18 61 27L62 19Q70 29 60 39Z','#f3d584',ink),
      path('M93 92Q79 103 64 95L61 100Q75 114 88 102L106 107L123 102L109 99L114 94L97 98Z','#da7850',ink),
      line('M61 108L93 150','#a26b49',5),path('M81 142L105 138L111 158L87 166Z','#bc8858',ink),envelope(96,146,-11),oval(40,132,6,5,skin,ink))
  }
  function drawClover() {
    return group('',
      path('M62 41Q40 54 43 85Q33 102 28 118L42 116L39 127L61 118L80 126L99 115L121 119Q115 106 107 88Q108 59 94 46Z','#477968',ink,2),
      path('M57 98Q40 108 38 137L34 165L52 162L54 175L108 173L116 147L114 122Q108 110 96 99Z','#395e55',ink,2),
      path('M61 102L78 112L91 102L104 111L91 139L89 172L62 172L60 141L53 122Z','#799785',ink),line('M62 114L74 125L69 155M91 113L83 126L79 165','#c2cc98',2),
      path('M48 122L67 146L96 132L101 139L68 159L57 157L39 137Z','#63877a',ink,2),
      face(2,'wise'),path('M54 67Q51 48 68 44Q86 38 100 52L101 65L95 59L89 64L90 55Q81 65 71 64L75 55L62 64L60 72Z',hair,ink),
      braid(55,75,10),braid(101,72,-7),path('M42 57Q42 41 58 29Q69 21 82 20Q103 31 111 50L98 53L88 47L69 49L54 59Z','#56866c',ink,2),
      group('translate(77 32)',path('M0 1Q-12 0 -11 -6Q-12 -12 -6 -12Q0 -12 1 -6Q4 -15 11 -12Q18 -8 13 -3L4 2Q14 6 10 12Q6 18 1 11L-2 6L-7 14L-9 12Z','#afd184',ink,1.2)),
      path('M100 126L122 87L127 90L106 134Z','#bb945a',ink,2),path('M118 96Q146 81 136 54Q132 44 127 41Q145 49 149 64Q154 92 126 106Z','#cfdbb8',ink,2),line('M131 98Q146 84 145 69','#f4f1cf'),oval(101,135,6,5,skin,ink),
      path('M41 140L54 143L51 158Q44 164 36 153Z','#ad8055',ink),sprig(42,144,-18,.43,'#abc38b'))
  }
  function drawRobin() {
    return group('rotate(-3 80 108)',
      path('M50 103Q40 110 36 132L31 151L45 159L59 138L55 170L110 171L110 134L124 141L132 131L115 110L96 97Z','#685f60',ink,2),
      path('M59 139L102 137L108 173L54 172Z','#7d7771',ink),line('M63 146L61 166M96 147L101 167','#aba08b',1.2),
      path('M55 99L67 92L86 93L102 99Q119 111 126 131L109 129L106 136L85 126L72 137L60 126L39 131L42 121Z','#aa5542',ink,2),
      path('M55 102Q72 117 82 117Q92 109 97 99L87 96L77 106L66 96Z','#e3b669',ink),oval(80,116,3.6,3.6,'#f5cd7e',ink),
      path('M53 66L49 52Q49 36 68 37Q88 28 101 43Q107 58 98 80L92 84L61 77Z',hair,ink),face(6,'wise'),
      path('M59 60Q68 55 73 47Q82 57 98 58L98 53Q87 40 72 42Q56 44 53 60L55 71L60 75Z',hair,ink),
      path('M68 78Q75 72 79 76Q85 71 92 77Q86 82 79 80Q73 83 68 78Z',hair,ink,1),
      oval(68,69,8,6,'none','#816b48'),oval(90,68,8,6,'none','#816b48'),line('M76 68Q79 66 82 68','#816b48',1.5),
      path('M42 48L52 46Q60 23 72 25L80 23Q95 25 103 41L113 43Q114 48 103 51Q81 47 58 54Q45 55 42 52Z','#995d44',ink,2),line('M57 43Q78 36 101 41','#cead76',4),
      path('M59 129L102 159','#75513b','#ad8355',5),path('M87 147L114 147L118 168L87 172Z','#a97350',ink,2),
      group('rotate(-16 116 127)',envelope(117,122,9),envelope(114,128,-3)),oval(126,134,6,5,skin,ink),oval(40,152,6,5,skin,ink))
  }
  function drawAmber() {
    const hex = (x,y,r,c) => group(`translate(${x} ${y}) scale(${r})`,path('M-1 0L-.5 -.87H.5L1 0L.5 .87H-.5Z',c))
    return group('',
      path('M53 48Q45 40 47 31Q51 20 61 23Q67 11 78 21Q92 9 101 23Q112 21 115 32Q120 45 107 56L100 82L56 87Z',hair,ink,2),
      path('M55 101L42 108L26 142L41 149L54 130L49 174L112 174L107 128L122 135L136 122L128 114L118 118L104 103L94 96Z','#bf8a50',ink,2),
      path('M59 100L71 98L77 110L90 97L101 102L96 123L106 148L99 170L53 170L51 144L63 122Z','#f1c469',ink,2),
      path('M64 127L91 123L94 140L79 149L64 142Z','#a86b44',ink),hex(78,136,5,'#ecc16e'),line('M54 154Q74 160 99 151',ink,4),
      face(-7,'bright'),path('M54 63Q48 56 52 47Q55 40 64 40Q67 34 74 36Q82 31 87 38Q98 33 102 44L99 61L94 57Q90 61 86 56Q79 60 75 53Q68 58 63 52L60 68Z',hair,ink),
      path('M46 44Q53 24 69 22L80 15L89 22Q102 25 109 42L98 48L82 42L66 46L50 53Z','#d7a444',ink,2),
      group('rotate(-6 75 44)',line('M51 44L100 40',ink,4),oval(68,43,9,7,'#8dc5b7',ink),oval(88,42,9,7,'#8dc5b7',ink),line('M64 42L69 39M84 41L90 38','#e7f1cd',2)),
      path('M47 103L57 98L64 104Q61 126 44 131L35 125Z','#e3b856',ink),line('M43 117L55 110M42 122L53 116','#9a673e',2),
      group('rotate(-18 118 113)',path('M115 104L103 78Q115 82 119 99L128 73Q135 89 121 106Z','#c3d6bb',ink,1.8),oval(115,111,4,7,'none','#b4783d'),oval(124,111,4,7,'none','#b4783d'),oval(119,104,2,2,'#d5aa53',ink)),
      oval(126,123,6,5,skin,ink),path('M30 138L42 137L47 145L42 154Q37 157 30 151Z','#72543c',ink),hex(35,148,2.5,'#e6bd6d'))
  }
  function drawLuna() {
    return group('',
      path('M65 41Q47 53 48 76Q43 85 31 89Q24 93 22 103Q41 94 51 99Q64 106 69 91L93 93Q101 111 123 102Q133 99 143 107Q140 95 126 90Q111 85 107 61Q101 38 84 38Z',hair,ink,2),
      path('M61 99Q48 100 40 107Q30 123 14 135L24 137L19 147L35 146L36 153L55 146L53 173L103 172L100 144L119 149L122 139L139 142L132 131Q116 115 103 99L91 95Z','#695e91',ink,2),
      path('M58 105Q39 124 25 134L39 134L36 140Q51 135 63 124M99 105Q108 121 127 134L115 132L116 138L95 125Z','#a098bb'),
      path('M67 100L79 113L91 99L102 108L90 136L99 173L58 172L67 137L59 110Z','#857aab',ink),line('M67 105L79 117L94 104M72 143L68 165','#e1c6a0',1.5),star(80,121,1,'#fff1bd'),
      face(-4,'calm'),path('M52 62Q53 39 72 38Q91 32 102 47Q109 62 98 75L95 57Q85 60 74 51Q70 61 57 67L55 74Z',hair,ink),
      path('M46 52Q50 36 64 31Q67 19 59 10Q82 16 94 30L103 32L100 37L111 46L101 53Q88 44 76 47Q58 47 49 61Z','#665680',ink,2),
      path('M78 26Q72 37 83 39Q88 40 93 36Q88 47 78 43Q67 37 75 28Z','#f7dc97'),line('M51 53Q70 40 98 46','#ccafd2',2),
      path('M47 120L54 134L77 128L82 134L53 147Q47 147 42 137L36 127Z','#82759e',ink),oval(80,131,6,4,skin,ink),
      path('M99 111L110 127L123 115L129 119L114 137Q108 142 102 134L93 122Z','#8e82a9',ink),oval(127,117,5,4,skin,ink),
      group('translate(128 143)',path('M-6 -12Q-5 -23 1 -24Q7 -24 8 -12','none','#e6c786',1.8),path('M-11 -10L0 -15L12 -10L9 8L2 15L-8 9Z','#f9d68c',ink,2),path('M-11 -10L1 -7L12 -10M1 -7L2 13','none','#997a62'),star(2,0,1.3,'#fff5c9'),path('M-9 9L2 15L10 8L6 14L2 18L-3 15Z','#aa8868',ink)),
      star(32,132,.6,'#f4dbab'),star(115,134,.5,'#f4dbab'))
  }
  function drawAurum() {
    return group('rotate(-2 80 108)',
      path('M55 103L36 129L23 163L41 168L59 137L54 174L108 174L104 137L125 164L141 155L119 112L101 98Z','#d2a239',ink,2),
      path('M61 103L78 114L93 101L103 111L92 139L99 173L58 173L67 139L57 111Z','#f5cf58',ink,2),
      face(-2,'joy'),
      path('M51 59Q49 39 66 32Q78 18 93 31Q107 37 101 62L95 76L58 72Z',hair,ink),
      path('M46 47Q54 24 73 22L80 10L88 23Q105 25 112 45L101 51L86 40L66 46L51 55Z','#e9bd43',ink,2),
      path('M80 8L86 22L99 19L91 30L102 38L86 36L80 51L74 36L58 39L69 29L60 18L75 22Z','#fff0a5',ink,1.4),
      line('M62 126L99 126','#fff0a5',3),
      path('M42 116L32 92L38 87L55 115Z','#f8df78',ink,2),
      path('M32 91L24 77L29 69L36 83L43 68L47 75L39 94Z','#fff3a4',ink,1.5),
      path('M112 119L132 91L138 97L120 130Z','#c99831',ink,2),
      path('M125 103L142 93L146 99L130 113Z','#f3d566',ink,1.5),
      star(126,48,1.1,'#fff5bd'), star(32,50,.7,'#fff5bd')
    )
  }

  const portraits = {sprout:drawSprout, finch:drawFinch, clover:drawClover, robin:drawRobin, amber:drawAmber, luna:drawLuna, aurum:drawAurum}
  const night = character === 'luna'
  const motif = {
    sprout:sprig(28,87,-19,.9,'#aec185'), finch:group('',line('M3 62Q21 50 42 54M9 69Q23 60 37 62','#8cb5b7',2)),
    clover:sprig(22,96,14,1.3,'#75a18b'), robin:group('',envelope(27,64,-17)),
    amber:group('translate(24 66)',path('M-12 0L-6 -10H6L12 0L6 10H-6Z M6 -10L12 -20H24L30 -10L24 0H12Z','none','#dfba78',1.6)),
    luna:group('',star(25,50,.85,'#d9d2c1'),star(36,71,.45,'#d9d2c1'),star(124,38,1,'#d9d2c1'),star(134,52,.45,'#d9d2c1')),
  }
  return h('svg',{viewBox:'0 0 160 180',width:160,height:180,className:'fg-gardenerPortrait','data-portrait':character,'aria-hidden':'true',focusable:'false',style:{display:'block',width:'100%',height:'100%'}},
    h('defs',null,h('linearGradient',{id:sky,x1:'0%',y1:'0%',x2:'90%',y2:'100%'},h('stop',{offset:0,stopColor:palette.sky}),h('stop',{offset:1,stopColor:palette.light}))),
    path('M0 0H160V180H0Z',`url(#${sky})`),oval(83,78,53,55,night?'#8d86ae':palette.light),oval(83,78,58,60,'none',night?'#aaa0bf':palette.light),motif[character],
    path('M0 130Q33 104 67 121Q114 150 160 103V180H0Z',palette.hill),path('M0 153Q46 129 85 151Q123 165 160 131V180H0Z',palette.sky),
    sprig(13,162,1,1.1,palette.hill),sprig(150,155,19,.88,palette.hill),portraits[character](),
    path('M0 171Q46 162 78 172Q112 181 160 158V180H0Z',palette.hill),sprig(3,179,44,.65,palette.hill),sprig(154,179,-30,.78,palette.hill))
}
