/**
 * Regenerate docs/preview.svg from the artwork the plugin actually renders.
 * Run with: npm run preview
 */
const fs = require('node:fs')
const path = require('node:path')
const { createRequire } = require('node:module')

const ROOT = path.join(__dirname, '..')
const projectRequire = createRequire(path.join(ROOT, 'package.json'))
const React = projectRequire('react')
const { renderToStaticMarkup } = projectRequire('react-dom/server')

global.window = { __ModuleLoader__: { load(definition) { global.__plugin = definition } } }
// eslint-disable-next-line no-eval
eval(fs.readFileSync(path.join(ROOT, 'client.js'), 'utf8'))
const plugin = global.__plugin.factory(name => {
  if (name !== 'react') throw new Error(`unexpected require(${name})`)
  return React
})
const { FlowerArt } = plugin.__components

function inner(speciesId) {
  const markup = renderToStaticMarkup(React.createElement(FlowerArt, { speciesId, stage: 'bloom', variant: 'base' }))
  return markup.replace(/^<svg[^>]*>/u, '').replace(/<\/svg>$/u, '')
}

const CARDS = [
  { x: 24, species: 'daisy', tint: 'rgba(122,168,106,0.10)', edge: 'rgba(122,168,106,0.35)' },
  { x: 180, species: 'snowdrop', tint: 'rgba(122,164,222,0.12)', edge: 'rgba(122,164,222,0.40)' },
  { x: 336, species: 'lehua', tint: 'rgba(196,96,72,0.12)', edge: 'rgba(196,96,72,0.40)' },
  { x: 492, species: 'lotus', tint: 'rgba(84,158,166,0.12)', edge: 'rgba(84,158,166,0.40)' },
]

const parts = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="300" viewBox="0 0 640 300" role="img">',
]
for (const card of CARDS) {
  parts.push(`  <rect x="${card.x}" y="46" width="140" height="204" rx="18" fill="${card.tint}"/>`)
  parts.push(`  <rect x="${card.x}" y="46" width="140" height="204" rx="18" fill="none" stroke="${card.edge}" stroke-width="1.5"/>`)
  parts.push(`  <svg x="${card.x + 10}" y="70" width="120" height="120" viewBox="0 0 100 100">`)
  parts.push(inner(card.species))
  parts.push('  </svg>')
}
parts.push('  <circle cx="576" cy="272" r="9" fill="#f2b53a"/>')
parts.push('  <circle cx="576" cy="272" r="5.5" fill="none" stroke="#c98a14" stroke-width="1.8"/>')
parts.push('  <circle cx="598" cy="272" r="6" fill="#f2b53a"/>')
parts.push('  <path d="M16 268h560" fill="none" stroke="#8d97a8" stroke-opacity="0.35" stroke-width="1.5" stroke-linecap="round"/>')
parts.push('</svg>')

fs.writeFileSync(path.join(ROOT, 'docs', 'preview.svg'), parts.join('\n') + '\n')
console.log('wrote docs/preview.svg')
