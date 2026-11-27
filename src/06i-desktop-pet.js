Object.assign(zh, {'pet.xiaohei.pin':'让小黑住到桌面', 'pet.xiaohei.unpin':'收回小黑', 'pet.xiaohei.hint':'轻点摸摸，双击玩耍，按住拖动。', 'pet.xiaohei.error':'小黑未能显示，请重试。'})
Object.assign(en, {'pet.xiaohei.pin':'Pin Xiaohei to desktop', 'pet.xiaohei.unpin':'Bring Xiaohei back', 'pet.xiaohei.hint':'Click to pet, double-click to play, or drag to move.', 'pet.xiaohei.error':'Xiaohei could not appear. Try again.'})

function XiaoheiPetButton({t}) {
  const key = 'pet:xiaohei'
  const pin = useSyncExternalStore(subscribeBouquetPins, () => bouquetPins.get(key) ?? noBouquetPin, () => noBouquetPin)
  function toggle(event) {
    const svg = event.currentTarget.closest('[data-gardener="xiaohei"]')?.querySelector('.fg-staffPortrait svg.fg-xiaoheiArt')
    toggleArtPin(key, () => {
      if (!svg) throw new Error('render-failed')
      const tree = ['div', {class:'fg-desktopPet'}, [encodeDesktopArtwork(svg)]]
      return {mode:'pet', title:/^zh/i.test(document.documentElement.lang) ? '小黑' : 'Xiaohei', lang:document.documentElement.lang || 'en', tree}
    })
  }
  const label = pin.phase === 'open' ? 'pet.xiaohei.unpin' : pin.phase === 'preparing' ? 'desktop.cancelWait' : pin.phase === 'pending' ? 'desktop.working' : 'pet.xiaohei.pin'
  return h('div', null,
    h('button', {type:'button', className:'fg-btn fg-btnSmall', 'data-action':'xiaoheiPet', disabled:pin.phase === 'pending', 'aria-pressed':pin.phase === 'open', onClick:toggle}, t(label)),
    pin.phase === 'open' && h('p', {className:'fg-note'}, t('pet.xiaohei.hint')),
    pin.error && h('p', {className:'fg-note', role:'status'}, t(pin.error.startsWith('bag.') ? 'pet.xiaohei.error' : pin.error)))
}
