/* global window, document */
'use strict'
const petSurface = document.querySelector('#garden')
let gesture = null
let resetPose = 0
function respondToPet(pose) {
  window.clearTimeout(resetPose)
  petSurface.dataset.pose = pose
  resetPose = window.setTimeout(() => { delete petSurface.dataset.pose }, pose === 'play' ? 1100 : 700)
}
petSurface.addEventListener('pointerdown', event => {
  if (event.button !== 0 || !event.isPrimary || !event.target.closest('.fg-desktopPet')) return
  petSurface.setPointerCapture(event.pointerId)
  gesture = {id:event.pointerId, x:event.screenX, y:event.screenY, moved:false}
  window.flowerGardenDesktop.petDrag('start')
})
petSurface.addEventListener('pointermove', event => {
  if (gesture?.id !== event.pointerId) return
  if (!gesture.moved && Math.hypot(event.screenX - gesture.x, event.screenY - gesture.y) > 5) {
    gesture.moved = true
    window.clearTimeout(resetPose)
    petSurface.dataset.pose = 'carried'
  }
  if (gesture.moved) window.flowerGardenDesktop.petDrag('move')
})
function releasePet(event) {
  if (gesture?.id !== event.pointerId) return
  const tapped = event.type === 'pointerup' && !gesture.moved
  const carried = gesture.moved
  gesture = null
  window.flowerGardenDesktop.petDrag('end')
  if (carried) respondToPet('landing')
  else if (tapped) respondToPet('happy')
}
petSurface.addEventListener('pointerup', releasePet)
petSurface.addEventListener('lostpointercapture', releasePet)
petSurface.addEventListener('pointercancel', releasePet)
petSurface.addEventListener('dblclick', () => respondToPet('play'))
petSurface.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    respondToPet(event.key === 'Enter' ? 'happy' : 'play')
  }
})
