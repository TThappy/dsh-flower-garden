const { app, BrowserWindow, ipcMain, session, screen } = require('electron')
const path = require('node:path')
const { mkdirSync } = require('node:fs')
const { pathToFileURL } = require('node:url')

const directory = path.join(app.getPath('appData'), 'dsh-flower-garden-desktop')
mkdirSync(directory, { recursive: true, mode: 0o700 })
app.setPath('userData', directory)
app.setPath('sessionData', directory)
app.setName('Pocket garden')
const page = path.join(__dirname, 'garden.html')
const pageUrl = pathToFileURL(page).href
let win
function focus() {
  if (!win || win.isDestroyed()) return
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
}
function senderIsGarden(event) {
  return win && !win.isDestroyed() && event.sender === win.webContents && event.senderFrame === win.webContents.mainFrame && event.senderFrame.url === pageUrl
}
if (!process.send || !app.requestSingleInstanceLock()) {
  app.quit()
} else {
  process.on('disconnect', () => app.quit())
  process.on('message', message => {
    if (!win || win.isDestroyed()) return
    if (message?.type === 'snapshot') win.webContents.send('flower-garden:snapshot', message.snapshot)
    if (message?.type === 'focus') focus()
  })
  app.on('second-instance', focus)
  app.on('window-all-closed', () => app.quit())
  app.whenReady().then(async () => {
    const partition = session.fromPartition('flower-garden')
    const assets = new Set(['garden.html', 'garden.css', 'garden-shared.css', 'garden.js', 'window-controls.css', 'window-controls.js'].map(name => pathToFileURL(path.join(__dirname, name)).href))
    partition.webRequest.onBeforeRequest((details, callback) => callback({cancel: !assets.has(details.url)}))
    partition.setPermissionCheckHandler(() => false)
    partition.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
    partition.on('will-download', event => event.preventDefault())
    win = new BrowserWindow({
      width: 400, height: 465, minWidth: 285, minHeight: 230, show: false, frame: false,
      alwaysOnTop: true, autoHideMenuBar: true, backgroundColor: '#f6f7f2',
      webPreferences: {session: partition, preload: path.join(__dirname, 'preload.cjs'),
        sandbox: true, contextIsolation: true, nodeIntegration: false, devTools: false},
    })
    win.webContents.setWindowOpenHandler(() => ({action: 'deny'}))
    win.webContents.on('will-navigate', event => event.preventDefault())
    win.webContents.on('will-attach-webview', event => event.preventDefault())
    win.webContents.on('render-process-gone', () => app.quit())
    ipcMain.on('flower-garden:action', (event, action) => {
      if (senderIsGarden(event) && process.connected) process.send({type: 'action', action})
    })
    let expandedSize
    ipcMain.on('flower-garden:toggle-compact', event => {
      if (!senderIsGarden(event)) return
      const bounds = win.getBounds()
      if (expandedSize) {
        const area = screen.getDisplayMatching(bounds).workArea
        const width = Math.min(area.width, expandedSize.width)
        const height = Math.min(area.height, expandedSize.height)
        win.setResizable(true)
        win.setMinimumSize(285, 230)
        win.setBounds({
          x: Math.max(area.x, Math.min(bounds.x, area.x + area.width - width)),
          y: Math.max(area.y, Math.min(bounds.y, area.y + area.height - height)),
          width, height,
        })
        expandedSize = undefined
      } else {
        expandedSize = {width: bounds.width, height: bounds.height}
        win.setMinimumSize(240, 44)
        win.setBounds({...bounds, width: 240, height: 44})
        win.setResizable(false)
      }
      win.webContents.send('flower-garden:compact', Boolean(expandedSize))
    })
    ipcMain.on('flower-garden:close', event => { if (senderIsGarden(event)) win.close() })
    await win.loadFile(page)
    win.show()
    if (process.connected) process.send({type: 'ready'})
  }).catch(() => app.quit())
}
