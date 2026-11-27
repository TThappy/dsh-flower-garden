// Transparent cat artwork shared by the desktop pet and the recruitment plate.
// Proportions follow the seated kitten in the user's cursor reference sheet.
function XiaoheiArt({pose = 'idle'} = {}) {
  const fur = '#0e0a0b', outline = '#563e33', cream = '#fff9dd', pupil = '#090708'
  const closed = pose === 'happy' || pose === 'sleep'
  const poseTransform = {idle:'', happy:'rotate(-5 46 49)', wave:'rotate(-8 46 49)', walk:'translate(2 2) rotate(5 46 49)', sleep:'translate(0 3) rotate(7 46 49)'}
  const path = (d, fill, stroke = outline, width = 1.4) => h('path',{d,fill,stroke,strokeWidth:width,strokeLinecap:'round',strokeLinejoin:'round'})
  const line = (d, color = outline, width = 1.2) => path(d,'none',color,width)
  const ellipse = (cx,cy,rx,ry,fill) => h('ellipse',{cx,cy,rx,ry,fill})
  function eye(cx, cy, tilt) {
    return h('g',{transform:`rotate(${tilt} ${cx} ${cy})`},
      ellipse(cx,cy,14.1,19.8,cream),ellipse(cx + (pose === 'walk' ? 2 : .35),cy-.4,9.2,13.6,pupil))
  }
  // Place the feet on the same baseline for every expression and pet animation.
  return h('svg',{viewBox:'0 0 160 180',width:160,height:180,className:'fg-xiaoheiArt','aria-hidden':true,focusable:'false'},
    h('g',{transform:'translate(7 14) scale(1.44)'},
      h('g',{className:'fg-xh-tail'},
        line('M60 92C72 96 85 93 87 82C89 76 86 72 81 73',outline,6.4),
        line('M60 92C72 96 85 93 87 82C89 76 86 72 81 73',fur,4.4)),
      // Hind legs bracket the narrow chest and two small, round front feet.
      h('g',{className:'fg-xh-body'},
        path('M35 65Q32 74 29 80C23 83 21 91 24 96Q26 101 34 100L55 100C65 101 70 97 67 90Q66 83 60 80L56 65Z',fur),
        line('M30 88Q25 91 26 96M61 87Q67 91 64 96'),
        line('M40 81Q37 88 37 96M50 81Q52 89 52 96'),
        path('M32 93Q35 91 38 94Q40 98 37 100H31Q29 98 32 93Z',fur),
        path('M51 94Q54 91 58 94Q61 98 58 100H51Q49 98 51 94Z',fur),
        line('M33 97v2M36 97v2M53 97v2M56 97v2',outline,.7)),
      // A small leaf on a raised paw anchors the gardener's idle silhouette.
      h('g',{className:'fg-xh-paw',transform:pose === 'wave' ? 'rotate(19 34 79)' : undefined},
        line('M26 81Q18 68 7 56','#65543b',1.2),
        path('M18 66C10 67 4 60 2 50Q12 52 16 57Q20 61 18 66Z','#b4c980',outline,.9),
        line('M5 54Q12 58 17 64','#80955a',.65),
        path('M36 77Q31 77 26 72Q22 68 19 70C15 73 20 80 28 83Q33 85 36 82Z',fur)),
      h('g',{className:'fg-xh-head',transform:poseTransform[pose] || undefined},
        // Broad triangular ears, rounded tips and a small arc of black forehead.
        path('M15 40Q9 28 11 9Q11 4 16 6Q26 8 34 15Q45 10 56 15Q65 7 77 5Q81 5 81 10Q82 25 76 40Z',fur),
        path('M14 9Q12 20 16 33Q20 22 27 17Q22 11 14 9Z','#bece89',outline,.8),
        path('M77 8Q70 10 64 16Q71 20 75 31Q80 20 77 8Z','#bece89',outline,.8),
        path('M12 39C14 23 27 12 45 12C64 11 76 21 78 39C81 57 66 68 47 69C29 70 12 62 11 48Q11 43 12 39Z',fur),
        h('g',{className:'fg-xh-eye-open',opacity:closed?0:1},eye(30.1,39,-3),eye(60.7,39.3,3)),
        h('g',{className:'fg-xh-eye-closed',opacity:closed?1:0},
          ellipse(30.1,39,13.7,18.9,cream),ellipse(60.7,39.3,13.7,18.9,cream),
          line('M19 40Q30 52 41 40M50 40Q61 52 72 40',outline,2.3)),
        path('M43.7 58.2Q45.5 57.8 47.5 58.2L45.6 60.5Z','#839ca8',outline,.6),
        path('M44.4 61.4Q45.8 61.8 47.3 61.1L45.9 63.6Z','#94c5b5',outline,.45))))
}

function XiaoheiRecruitPlate() {
  return h('svg',{viewBox:'0 0 160 180',width:160,height:180,'aria-hidden':'true',focusable:'false',className:'fg-gardenerPortrait','data-portrait':'xiaohei',style:{display:'block',width:'100%',height:'100%'}},
    h('rect',{width:160,height:180,fill:'#f3f0df'}),
    h('circle',{cx:78,cy:86,r:65,fill:'#e4e9c8'}),
    h('ellipse',{cx:75,cy:160,rx:33,ry:3.6,fill:'#878564',opacity:.24}),
    h(XiaoheiArt,{pose:'idle'}))
}
