const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('flowerGardenDesktop', {
  onMode(callback) {
    const listener = (_event, mode) => callback(mode === 'pot' ? 'pot' : 'garden')
    ipcRenderer.on('flower-garden:mode', listener)
    return () => ipcRenderer.removeListener('flower-garden:mode', listener)
  },
  onSnapshot(callback) {
    if (typeof callback !== 'function') throw new TypeError('Expected snapshot listener')
    const listener = (_event, snapshot, id) => callback(snapshot, id)
    ipcRenderer.on('flower-garden:snapshot', listener)
    return () => ipcRenderer.removeListener('flower-garden:snapshot', listener)
  },
  rendered(id, ok) { if (Number.isSafeInteger(id)) ipcRenderer.send('flower-garden:rendered', id, ok === true) },
  act(action) {
    if (typeof action?.id !== 'string' || !/^\d{1,16}$/.test(action.id)) return
    if (action.value !== undefined && (typeof action.value !== 'string' || action.value.length > 256)) return
    ipcRenderer.send('flower-garden:action', {id: action.id, value: action.value})
  },
  toggleCompact() { ipcRenderer.send('flower-garden:toggle-compact') },
  onCompact(callback) {
    const listener = (_event, compact) => callback(compact === true)
    ipcRenderer.on('flower-garden:compact', listener)
    return () => ipcRenderer.removeListener('flower-garden:compact', listener)
  },
  close() { ipcRenderer.send('flower-garden:close') },
})
