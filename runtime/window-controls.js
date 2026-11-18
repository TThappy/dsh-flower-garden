/* global document, window, MutationObserver */
(() => {
  const compactButton = document.getElementById('collapse')
  const gardenBody = document.getElementById('garden')
  const desktop = window.flowerGardenDesktop
  let compact = false

  function updateLabels() {
    const chinese = /^zh\b/i.test(document.documentElement.lang)
    const collapse = chinese ? '收起为标题栏' : 'Collapse to title bar'
    const expand = chinese ? '展开花园' : 'Expand garden'
    compactButton.title = compact ? expand : collapse
    compactButton.setAttribute('aria-label', compactButton.title)
    compactButton.setAttribute('aria-expanded', String(!compact))
    compactButton.textContent = compact ? '▾' : '▴'
  }

  compactButton.addEventListener('click', () => desktop.toggleCompact())
  desktop.onCompact(value => {
    compact = value
    gardenBody.hidden = compact
    updateLabels()
  })
  new MutationObserver(updateLabels).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']})
  updateLabels()
})()
