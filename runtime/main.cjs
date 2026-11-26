const { app, BrowserWindow, ipcMain, session, screen } = require('electron')
const path = require('node:path')
const { mkdirSync } = require('node:fs')
const { pathToFileURL } = require('node:url')
const { createPinStore, validSnapshot, pinMode } = require('./pin-store.cjs')
const { petDimensions } = require('./pet-size.cjs')
const directory = path.join(app.getPath('appData'), 'dsh-flower-garden-desktop')
mkdirSync(directory, { recursive: true, mode: 0o700 })
app.setPath('userData', directory); app.setPath('sessionData', directory); app.setName('Pocket garden')
const gardenPage = path.join(__dirname, 'garden.html')
const bouquetPage = path.join(__dirname, 'bouquet.html')
function pageFor(key) {
  if (key === 'garden') return gardenPage
  return key.startsWith('bloom:') ? path.join(__dirname, 'bloom.html') : bouquetPage
}
const windows = new Map()
const compact = new Map()
const pendingArt = new Map()
const pinnedKeys = new Set()
let store
let quitting = false
function report(message) { if (process.connected) process.send(message) }
function saveGeometry(key) {
  const win = windows.get(key)
  if (!pinnedKeys.has(key) || !win || win.isDestroyed()) return
  try { store.move(key, {bounds:win.getBounds(), compact:compact.get(key) || null}) }
  catch (error) { console.warn('[flower-garden] could not save window position', error.message) }
}
function clampBounds(bounds) {
  const area = screen.getDisplayMatching(bounds).workArea
  const width = Math.min(bounds.width, area.width), height = Math.min(bounds.height, area.height)
  return {width, height, x:Math.max(area.x, Math.min(bounds.x, area.x + area.width - width)), y:Math.max(area.y, Math.min(bounds.y, area.y + area.height - height))}
}
function forget(key) {
  pinnedKeys.delete(key)
  if (pinMode(key)) store?.remove(key)
}
function keyOf(message) { return message?.windowKey === undefined ? 'garden' : String(message.windowKey).slice(0, 128) }
function focus(key) { const win=windows.get(key); if(!win||win.isDestroyed())return; if(win.isMinimized())win.restore(); win.show(); win.focus() }
function senderWindow(event) { for(const [key,win] of windows) if(!win.isDestroyed()&&event.sender===win.webContents&&event.senderFrame===win.webContents.mainFrame&&event.senderFrame.url===pathToFileURL(pageFor(key)).href)return [key,win]; return null }
function closeWindow(key) {
  const win = windows.get(key)
  if (win && !win.isDestroyed()) win.close()
}
function applyPetSize(key, petSize) {
  const win = windows.get(key)
  if (!pinMode(key) || !win || win.isDestroyed()) return
  const current = win.getBounds()
  const bounds = clampBounds({...current, ...petDimensions(petSize)})
  if (Object.keys(bounds).some(prop => bounds[prop] !== current[prop])) win.setBounds(bounds)
}
if (!process.send || !app.requestSingleInstanceLock()) app.quit()
else {
 app.on('before-quit', () => { quitting = true; for (const key of pinnedKeys) saveGeometry(key) })
 process.on('disconnect',()=>app.quit())
 process.on('message',message=>{
   if (message?.type === 'pet-size') {
     const keys = message.windowKey ? [message.windowKey] : windows.keys()
     for (const key of keys) applyPetSize(key, message.petSize)
     return
   }
   const key=keyOf(message)
   if (key !== 'garden' && !pinMode(key)) return
   if (message?.type === 'restore-window' && pinMode(key)) app.whenReady().then(() => {
     if (windows.has(key)) return report({type:'restored',windowKey:key})
     const record = store.load(key)
     if (!record) return report({type:'missing',windowKey:key})
     createWindow(key, record, message.petSize)
   }).catch(() => report({type:'closed',windowKey:key}))
   if(message?.type==='open-window') app.whenReady().then(() => createWindow(key, null, message.petSize)).catch(() => app.quit())
   if(message?.type==='focus') focus(key)
   if (message?.type === 'snapshot') {
     const win = windows.get(key)
     if (!win || win.isDestroyed()) return
     if (pinMode(key)) {
       if (!Number.isSafeInteger(message.id) || !validSnapshot(key, message.snapshot)) return report({type:'rendered',windowKey:key,id:message.id,ok:false})
       pendingArt.set(key,{id:message.id,snapshot:message.snapshot})
     }
     win.webContents.send('flower-garden:snapshot',message.snapshot,message.id)
   }
   if(message?.type==='close-window') { forget(key); closeWindow(key) }
 })
 app.on('second-instance',()=>focus('garden'))
 app.on('window-all-closed',()=>app.quit())
 app.whenReady().then(()=>{
   store = createPinStore(app.getPath('userData'))
    const partition=session.fromPartition('flower-garden')
   const assets=new Set(['garden.html','garden.css','garden-shared.css','garden.js','window-controls.css','window-controls.js','bouquet.html','bouquet.css','bloom.html','bloom.css'].map(name=>pathToFileURL(path.join(__dirname,name)).href))
   partition.webRequest.onBeforeRequest((details,callback)=>callback({cancel:!assets.has(details.url)}))
   partition.setPermissionCheckHandler(()=>false); partition.setPermissionRequestHandler((_c,_p,cb)=>cb(false)); partition.on('will-download',event=>event.preventDefault())

 }).catch(()=>app.quit())
}
function createWindow(key, restored, petSize) {
 const bouquet = key !== 'garden'
 if(windows.has(key)){focus(key);return}
 const size = bouquet ? petDimensions(petSize) : {width:400, height:465}
 const bounds = restored?.geometry ? clampBounds({...restored.geometry.bounds, ...size}) : size
 const win=new BrowserWindow({...bounds,minWidth:bouquet?1:285,minHeight:bouquet?1:230,show:false,frame:false,alwaysOnTop:true,autoHideMenuBar:true,backgroundColor:bouquet?'#00000000':'#f6f7f2',transparent:bouquet,hasShadow:!bouquet,resizable:!bouquet,webPreferences:{session:session.fromPartition('flower-garden'),preload:path.join(__dirname,'preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,devTools:false}})
 windows.set(key,win)
 win.webContents.setWindowOpenHandler(()=>({action:'deny'})); win.webContents.on('will-navigate',event=>event.preventDefault()); win.webContents.on('will-attach-webview',event=>event.preventDefault()); win.webContents.on('render-process-gone',()=>{win.preserveRecord=true;closeWindow(key)}); win.on('move',()=>saveGeometry(key)); win.on('resize',()=>saveGeometry(key)); win.on('close',()=>{if(!quitting && !win.preserveRecord) forget(key)}); win.once('closed',()=>{windows.delete(key);compact.delete(key);pendingArt.delete(key);pinnedKeys.delete(key);if(process.connected)process.send({type:'closed',windowKey:key})})
 win.loadFile(pageFor(key)).then(() => {
   if (win.isDestroyed()) return
   if (restored) {
     pendingArt.set(key, {id:-1, restored:true})
     win.webContents.send('flower-garden:snapshot', restored.snapshot, -1)
   } else { if (!bouquet) win.show(); report({type:'ready',windowKey:key}) }
 }).catch(() => { win.preserveRecord = true; closeWindow(key) })
}
ipcMain.on('flower-garden:rendered', (event, id, ok) => {
  const found = senderWindow(event)
  if (!found || !pinMode(found[0])) return
  const [key, win] = found
  const art = pendingArt.get(key)
  if (!art || art.id !== id) return
  pendingArt.delete(key)
  let accepted = ok === true
  if (accepted) {
    try {
      if (!art.restored) store.save(key, art.snapshot)
      pinnedKeys.add(key)
      saveGeometry(key)
      if (art.restored) win.showInactive(); else win.show()
    } catch { accepted = false }
  }
  if (art.restored) {
    if (accepted) report({type:'restored',windowKey:key})
    else { win.preserveRecord = true; closeWindow(key) }
  } else report({type:'rendered',windowKey:key,id,ok:accepted})
})
ipcMain.on('flower-garden:action',(event,action)=>{const found=senderWindow(event);if(found&&process.connected)process.send({type:'action',windowKey:found[0],action})})
ipcMain.on('flower-garden:close',event=>{const found=senderWindow(event);if(found)closeWindow(found[0])})
ipcMain.on('flower-garden:toggle-compact',event=>{const found=senderWindow(event);if(!found||found[0]!=='garden')return;const [key,win]=found;const current=compact.get(key);const bounds=win.getBounds();if(current){const area=screen.getDisplayMatching(bounds).workArea;win.setResizable(true);win.setMinimumSize(key==='garden'?285:180,key==='garden'?230:160);win.setBounds({x:Math.max(area.x,Math.min(bounds.x,area.x+area.width-current.width)),y:Math.max(area.y,Math.min(bounds.y,area.y+area.height-current.height)),width:current.width,height:current.height});compact.delete(key)}else{compact.set(key,{width:bounds.width,height:bounds.height});win.setMinimumSize(240,44);win.setBounds({...bounds,width:240,height:44});win.setResizable(false)}saveGeometry(key);win.webContents.send('flower-garden:compact',!current)})
