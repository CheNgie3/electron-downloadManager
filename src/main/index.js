const { app, BrowserWindow } = require('electron')
const path = require('path')
const BRIDGE_NAME='jsbridge';
let isReady = app.whenReady();


async function createWindow(options, webPreferences = {}) {
  options = options || {};
  await isReady;
  let window = new BrowserWindow({
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: false,
      webSecurity: false,
      webviewTag: true,
      contextIsolation: false,
      ...webPreferences,
      preload: `${__dirname}/${BRIDGE_NAME}.js`,
    },
    ...options,
  });

  if (!options.show) {
    window.once('ready-to-show', () => {
      !options.showByClient && window.show();
    });
  }

  if (options.maximize) {
    window.maximize();
  }

  window.on('closed', () => {
    window.destroy();
    // window = null;
  });

  return {
    id: window.id,
    loadRouter(router) {
      window.loadURL(router.path);
    },
  };
}


app.whenReady().then(() => {
    createWindow()
  
    app.on('activate', function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
  })