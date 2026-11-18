/* global document, window */
'use strict'
const bridge = window.flowerGardenDesktop
const garden = document.querySelector('#garden')
const closeButton = document.querySelector('#close')
const svgNS = 'http://www.w3.org/2000/svg'
const htmlTags = new Set('div span strong p button select option article'.split(' '))
const svgTags = new Set('svg g defs path circle ellipse rect polygon polyline line stop linearGradient radialGradient clipPath mask pattern symbol use title'.split(' '))
const svgAttrs = new Set('viewBox preserveAspectRatio id d x y x1 y1 x2 y2 cx cy r rx ry width height fill fill-rule fill-opacity stroke stroke-width stroke-linecap stroke-linejoin stroke-dasharray stroke-opacity transform opacity points offset stop-color stop-opacity gradientUnits gradientTransform clip-path clip-rule mask vector-effect'.split(' '))
const htmlAttrs = new Set('class title disabled value aria-label aria-live aria-hidden role data-command data-mini-plot data-tone data-scene data-rarity data-variant data-trait data-feedback-id data-done data-presentation'.split(' '))
const themeKeys = 'bg-base bg-layer-1 bg-layer-2 label-primary label-secondary border-l1 border-l2 brand-primary state-success-primary state-error-primary state-warn-primary state-idle-primary'.split(' ')
const color = /^(?:#[\da-f]{3,8}|rgba?\([\d\s.,%/]+\)|var\(--dsw-alias-(?:border-l2|label-secondary)\)|none)$/i
const styleRules = new Map([
  ['fill',color], ['stroke',color], ['background-color',color],
  ['stroke-width',/^\d+(?:\.\d+)?(?:px)?$/], ['stroke-linecap',/^(round|butt|square)$/],
  ['stroke-dasharray',/^[\d., px]+$/], ['animation-delay',/^-?\d+(?:\.\d+)?m?s$/],
  ['transform-origin',/^-?\d+(?:\.\d+)?px -?\d+(?:\.\d+)?px$/],
])
function patchStyles(node,attrs) {
  for (const [name,rule] of styleRules) {
    const value = attrs[`$${name}`]
    if (typeof value === 'string' && rule.test(value)) {
      if (node.style.getPropertyValue(name) !== value) node.style.setProperty(name,value)
    } else if (node.style.getPropertyValue(name)) node.style.removeProperty(name)
  }
}

// Reconcile only inert mini-view markup. Keep focused controls, an open select
// and scrolling intact across the frequent moisture and growth updates.
function patch(parent, index, tree, inSVG = false) {
  let node = parent.childNodes[index]
  const text = typeof tree === 'string'
  const tag = text ? null : tree[0]
  const svg = inSVG || tag === 'svg'
  if (!text && !(svg ? svgTags : htmlTags).has(tag)) return patch(parent,index,'')
  if (!text && (!node || node.getAttribute?.('data-feedback-id') !== (tree[1]['data-feedback-id'] ?? null)) && tree[1]['data-feedback-id']) {
    // Remount this live notice so repeated successful actions replay the feedback.
    if (node) { node.replaceWith(document.createTextNode('')); node = parent.childNodes[index] }
  }
  if (!node || (text ? node.nodeType !== 3 : node.localName !== tag)) {
    const replacement = text ? document.createTextNode(tree) : svg ? document.createElementNS(svgNS,tag) : document.createElement(tag)
    if (node) node.replaceWith(replacement)
    else parent.append(replacement)
    node = replacement
  }
  if (text) { if (node.nodeValue !== tree) node.nodeValue = tree; return }
  const [, attrs, children] = tree
  for (const attr of Array.from(node.attributes)) if (attr.name !== 'style' && !(attr.name in attrs)) node.removeAttribute(attr.name)
  patchStyles(node,attrs)
  for (const [name,value] of Object.entries(attrs)) {
    if (!htmlAttrs.has(name) && !(svg && svgAttrs.has(name))) continue
    if (/url\s*\(/i.test(value) && !/^url\(#[\w:.-]+\)(?:\s+#[\da-f]+)?$/i.test(value)) continue
    if (node.getAttribute(name) !== value) node.setAttribute(name,value)
  }
  children.forEach((child,i)=>patch(node,i,child,svg))
  while (node.childNodes.length > children.length) node.lastChild.remove()
  if (tag === 'select' && node.value !== attrs['data-selection']) node.value = attrs['data-selection']
}
bridge.onSnapshot(snapshot => {
  if (!snapshot?.tree) return
  const rootStyle = document.documentElement.style
  for (const key of themeKeys) {
    const value = snapshot.theme?.[key]
    if (typeof value === 'string' && /^#[\da-f]{8}$/i.test(value)) rootStyle.setProperty(`--dsw-alias-${key}`,value)
    else rootStyle.removeProperty(`--dsw-alias-${key}`)
  }
  document.title = snapshot.title
  document.documentElement.lang = snapshot.lang
  document.querySelector('#title').textContent = `✿ ${snapshot.title}`
  closeButton.setAttribute('aria-label',snapshot.close)
  closeButton.title = snapshot.close
  patch(garden,0,snapshot.tree)
})
closeButton.addEventListener('click',()=>bridge.close())
garden.addEventListener('click',event=>{
  const button = event.target.closest('button[data-command]')
  if (button && !button.disabled) bridge.act({id:button.dataset.command})
})
garden.addEventListener('change',event=>{
  const select = event.target.closest('select[data-command]')
  if (select && !select.disabled) bridge.act({id:select.dataset.command,value:select.value})
})
