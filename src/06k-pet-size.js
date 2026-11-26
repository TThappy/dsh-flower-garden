// One local preference for every desktop flower and saved arrangement on this device.
const petSizeKey = 'flower-garden.desktop-pet-size.v1'
const petSizeListeners = new Set()
let petSizeValue
let petSizeTimer
let sendingPetSize = false
let petSizePending = false

function normalizePetSize(value) {
  if (value === null || value === undefined || String(value).trim() === '') return 100
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(50, Math.min(150, Math.round(number))) : 100
}
function currentPetSize() {
  if (petSizeValue === undefined) {
    try { petSizeValue = normalizePetSize(window.localStorage.getItem(petSizeKey)) }
    catch { petSizeValue = 100 }
  }
  return petSizeValue
}
function subscribePetSize(listener) {
  petSizeListeners.add(listener)
  return () => petSizeListeners.delete(listener)
}
async function sendPetSize() {
  if (sendingPetSize) return
  sendingPetSize = true
  try {
    while (petSizePending) {
      petSizePending = false
      await desktopGardenRequest({op:'pet-size', owner:desktopOwner(), petSize:currentPetSize()})
    }
  } catch { /* Each artwork sync also carries the latest preference. */ }
  finally {
    sendingPetSize = false
    if (petSizePending) queuePetSize()
  }
}
function queuePetSize() {
  petSizePending = true
  window.clearTimeout(petSizeTimer)
  petSizeTimer = window.setTimeout(sendPetSize, 75)
}
function setPetSize(value, persist = true) {
  const size = normalizePetSize(value)
  if (size === currentPetSize()) return
  petSizeValue = size
  if (persist) {
    try { window.localStorage.setItem(petSizeKey, String(size)) } catch { /* Keep the session preference. */ }
  }
  for (const listener of petSizeListeners) listener()
  queuePetSize()
}
function DesktopPetSizeSetting({t}) {
  const size = useSyncExternalStore(subscribePetSize, currentPetSize, () => 100)
  return h('div', {className:'fg-settingRow fg-petSizeRow'},
    h('label', {className:'fg-petSizeLabel'}, t('desktop.petSize'),
      h('input', {type:'range', min:50, max:150, step:1, value:size, 'aria-valuetext':`${size}%`,
        onChange:event => setPetSize(event.currentTarget.valueAsNumber)}),
      h('span', {'aria-hidden':'true', className:'fg-petSizeValue'}, `${size}%`)),
    h('button', {className:'fg-btn fg-btnSmall', type:'button', disabled:size === 100, onClick:() => setPetSize(100)}, t('desktop.resetPetSize')))
}
Object.assign(zh, {'desktop.petSize':'桌宠大小', 'desktop.resetPetSize':'恢复 100%'})
Object.assign(en, {'desktop.petSize':'Desktop pet size', 'desktop.resetPetSize':'Reset to 100%'})
