const { app, BrowserWindow, ipcMain, session, screen } = require('electron')
const path = require('node:path')
const { mkdirSync } = require('node:fs')
const { pathToFileURL } = require('node:url')
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
function keyOf(message) { return message?.windowKey === undefined ? 'garden' : String(message.windowKey).slice(0, 128) }
function focus(key) { const win=windows.get(key); if(!win||win.isDestroyed())return; if(win.isMinimized())win.restore(); win.show(); win.focus() }
function senderWindow(event) { for(const [key,win] of windows) if(!win.isDestroyed()&&event.sender===win.webContents&&event.senderFrame===win.webContents.mainFrame&&event.senderFrame.url===pathToFileURL(pageFor(key)).href)return [key,win]; return null }
function closeWindow(key) { const win=windows.get(key); if(win&&!win.isDestroyed())win.close(); windows.delete(key); compact.delete(key) }
if (!process.send || !app.requestSingleInstanceLock()) app.quit()
else {
 process.on('disconnect',()=>app.quit())
 process.on('message',message=>{
   const key=keyOf(message)
   if(message?.type==='open-window') app.whenReady().then(() => createWindow(key)).catch(() => app.quit())
   if(message?.type==='focus') focus(key)
   if(message?.type==='snapshot'){const win=windows.get(key);if(win&&!win.isDestroyed())win.webContents.send('flower-garden:snapshot',message.snapshot,message.id)}
   if(message?.type==='close-window') closeWindow(key)
 })
 app.on('second-instance',()=>focus('garden'))
 app.on('window-all-closed',()=>app.quit())
 app.whenReady().then(()=>{
   const partition=session.fromPartition('flower-garden')
   const assets=new Set(['garden.html','garden.css','garden-shared.css','garden.js','window-controls.css','window-controls.js','bouquet.html','bouquet.css','bloom.html','bloom.css'].map(name=>pathToFileURL(path.join(__dirname,name)).href))
   partition.webRequest.onBeforeRequest((details,callback)=>callback({cancel:!assets.has(details.url)}))
   partition.setPermissionCheckHandler(()=>false); partition.setPermissionRequestHandler((_c,_p,cb)=>cb(false)); partition.on('will-download',event=>event.preventDefault())

 }).catch(()=>app.quit())
}
function createWindow(key) {
 const bouquet = key !== 'garden'
 if(windows.has(key)){focus(key);return}
 const win=new BrowserWindow({width:bouquet?280:400,height:bouquet?300:465,minWidth:bouquet?180:285,minHeight:bouquet?160:230,show:false,frame:false,alwaysOnTop:true,autoHideMenuBar:true,backgroundColor:bouquet?'#00000000':'#f6f7f2',transparent:bouquet,hasShadow:!bouquet,resizable:!bouquet,webPreferences:{session:session.fromPartition('flower-garden'),preload:path.join(__dirname,'preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,devTools:false}})
 windows.set(key,win); win.webContents.setWindowOpenHandler(()=>({action:'deny'})); win.webContents.on('will-navigate',event=>event.preventDefault()); win.webContents.on('will-attach-webview',event=>event.preventDefault()); win.webContents.on('render-process-gone',()=>closeWindow(key)); win.once('closed',()=>{windows.delete(key);compact.delete(key);if(process.connected)process.send({type:'closed',windowKey:key})})
 win.loadFile(pageFor(key)).then(()=>{if(win.isDestroyed())return;win.show();if(process.connected)process.send({type:'ready',windowKey:key})}).catch(()=>closeWindow(key))
}
ipcMain.on('flower-garden:rendered', (event, id, ok) => {
  const found = senderWindow(event)
  if (found && found[0] !== 'garden' && Number.isSafeInteger(id) && process.connected) {
    process.send({type:'rendered', windowKey:found[0], id, ok:ok === true})
  }
})
ipcMain.on('flower-garden:action',(event,action)=>{const found=senderWindow(event);if(found&&process.connected)process.send({type:'action',windowKey:found[0],action})})
ipcMain.on('flower-garden:close',event=>{const found=senderWindow(event);if(found)closeWindow(found[0])})
ipcMain.on('flower-garden:toggle-compact',event=>{const found=senderWindow(event);if(!found)return;const [key,win]=found;const current=compact.get(key);const bounds=win.getBounds();if(current){const area=screen.getDisplayMatching(bounds).workArea;win.setResizable(true);win.setMinimumSize(key==='garden'?285:180,key==='garden'?230:160);win.setBounds({x:Math.max(area.x,Math.min(bounds.x,area.x+area.width-current.width)),y:Math.max(area.y,Math.min(bounds.y,area.y+area.height-current.height)),width:current.width,height:current.height});compact.delete(key)}else{compact.set(key,{width:bounds.width,height:bounds.height});win.setMinimumSize(240,44);win.setBounds({...bounds,width:240,height:44});win.setResizable(false)}win.webContents.send('flower-garden:compact',!current)})
