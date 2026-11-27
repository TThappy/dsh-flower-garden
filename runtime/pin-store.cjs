'use strict'
const fs = require('node:fs')
const path = require('node:path')
const { createHash, randomUUID } = require('node:crypto')

const MAX_RECORD = 1024 * 1024 + 2048
const tags = new Set('div span svg g defs path circle ellipse rect polygon polyline line stop linearGradient radialGradient clipPath mask pattern'.split(' '))
const attrs = new Set('class viewBox preserveAspectRatio id d x y x1 y1 x2 y2 cx cy r rx ry width height fill fill-rule fill-opacity stroke stroke-width stroke-linecap stroke-linejoin stroke-dasharray stroke-opacity transform opacity points offset stop-color stop-opacity gradientUnits gradientTransform clip-path clip-rule mask vector-effect $animation-delay $transform-origin $fill $stroke $stroke-width $stroke-linecap $stroke-dasharray $transform'.split(' '))
function pinMode(key) {
  if (key === 'pet:xiaohei') return 'pet'
  const match = typeof key === 'string' && key.length <= 128 && /^(bloom|bouquet):[\w:.~-]+$/.exec(key)
  return match ? match[1] : null
}
function validSnapshot(key, snapshot) {
  const mode = pinMode(key)
  if (!mode || snapshot?.mode !== mode || typeof snapshot.title !== 'string' || snapshot.title.length > 1024 || typeof snapshot.lang !== 'string' || snapshot.lang.length > 128) return false
  let nodes = 0
  function validNode(node, depth) {
    if (++nodes > 24000 || depth > 64 || !Array.isArray(node) || node.length !== 3) return false
    const [tag, attributes, children] = node
    if (!tags.has(tag) || !attributes || typeof attributes !== 'object' || Array.isArray(attributes) || !Array.isArray(children)) return false
    for (const [name, value] of Object.entries(attributes)) {
      if (!attrs.has(name) || typeof value !== 'string' || value.length > 65536) return false
      if (/url\s*\(/i.test(value) && !/^url\(#[\w:.-]+\)(?:\s+#[\da-f]+)?$/i.test(value)) return false
    }
    return children.every(child => validNode(child, depth + 1))
  }
  return snapshot.tree?.[0] === 'div' && snapshot.tree[1]?.class === ({pet:'fg-desktopPet', bloom:'fg-desktopBloom', bouquet:'fg-vase fg-vaseStill'})[mode] && validNode(snapshot.tree, 0) && Buffer.byteLength(JSON.stringify(snapshot)) <= 1024 * 1024
}
function validBounds(bounds) {
  return bounds && ['x','y','width','height'].every(k => Number.isSafeInteger(bounds[k]) && Math.abs(bounds[k]) <= 1000000) && bounds.width > 0 && bounds.height > 0
}
function validGeometry(geometry) {
  return validBounds(geometry?.bounds) && (geometry.compact === null || validBounds(geometry.compact))
}
function createPinStore(userData) {
  const directory = path.join(userData, 'pins-v1')
  fs.mkdirSync(directory, {recursive:true, mode:0o700})
  const stat = fs.lstatSync(directory)
  if (!stat.isDirectory() || (process.getuid && stat.uid !== process.getuid())) throw new Error('Invalid pin storage directory')
  if (process.platform !== 'win32') fs.chmodSync(directory, 0o700)
  function file(key, suffix) {
    if (!pinMode(key)) throw new Error('Invalid pinned window key')
    return path.join(directory, createHash('sha256').update(key).digest('hex') + suffix)
  }
  function write(target, data) {
    const tmp = path.join(directory, randomUUID() + '.tmp')
    try {
      fs.writeFileSync(tmp, JSON.stringify(data), {flag:'wx', mode:0o600})
      fs.renameSync(tmp, target)
    } finally { fs.rmSync(tmp, {force:true}) }
  }
  function read(target, maxBytes) {
    if (!fs.existsSync(target)) return null
    const stat = fs.lstatSync(target)
    if (!stat.isFile() || stat.size > maxBytes) return null
    const fd = fs.openSync(target, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0))
    try {
      const data = Buffer.alloc(stat.size)
      let offset = 0
      while (offset < data.length) {
        const n = fs.readSync(fd, data, offset, data.length-offset, null)
        if (!n) return null
        offset += n
      }
      try {return JSON.parse(data.toString('utf8'))} catch {return null}
    } finally {fs.closeSync(fd)}
  }
  return {
    load(key) {
      const record = read(file(key,'.json'), MAX_RECORD)
      if (!record || record.version !== 1 || record.windowKey !== key || record.mode !== pinMode(key) || !validSnapshot(key, record.snapshot)) return null
      const geom = read(file(key,'.geometry.json'), 2048)
      return {...record, geometry:validGeometry(geom) ? geom : null}
    },
    save(key, snapshot) {
      if (!validSnapshot(key,snapshot)) throw new Error('Invalid pin snapshot')
      write(file(key,'.json'), {version:1, windowKey:key, mode:pinMode(key), snapshot:{mode:snapshot.mode,title:snapshot.title,lang:snapshot.lang,tree:snapshot.tree}})
    },
    move(key, geometry) {
      if (validGeometry(geometry)) write(file(key,'.geometry.json'), geometry)
    },
    remove(key) {
      fs.rmSync(file(key,'.json'), {force:true})
      fs.rmSync(file(key,'.geometry.json'), {force:true})
    },
  }
}
module.exports = { createPinStore, validSnapshot, pinMode }
