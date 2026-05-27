import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { register } from 'node:module';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}


const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

function registerDbIpc() {
  ipcMain.handle('db:listNotes', async () => await listNotes());
  ipcMain.handle('db:addNote', async (_event, text) => await addNote(text));
  ipcMain.handle('db:deleteNote', async (_event, id) => await deleteNote(id));
}
const sessionsByWebContentsId = new Map();

function registerAuthIpc() {
  ipcMain.handle('auth:login', async (_event, { username, password }) => {
    const webContentsId = _event.sender.id;
    const session = sessionsByWebContentsId.get(webContentsId);
    if (session) {
      throw new Error('Already logged in');
    }

    // Here you would normally check the username and password against your database
    if (username === 'admin' && password === 'password') {
      const newSession = { username };
      sessionsByWebContentsId.set(webContentsId, newSession);
      return { success: true };
    } else {
      return { success: false, message: 'Invalid credentials' };
    }
  });

  ipcMain.handle('auth:getSession', async (_event) => {
    const webContentsId = _event.sender.id;
    return sessionsByWebContentsId.get(webContentsId) || null;
  });

  ipcMain.handle('auth:logout', async (_event) => {
    const webContentsId = _event.sender.id;
    sessionsByWebContentsId.delete(webContentsId);
    return { success: true };
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  console.log(`Initializing DB at the path: ${app.getPath('userData')}`);
  return initDb({ userDataPath: app.getPath('userData') });
}).then(() => {
  registerDbIpc();
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});


// Si database.js exporte initDb
const { initDb } = require('./db.js'); 
// ou avec ES Modules :
// import { initDb } from './database.js';

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('will-quit', () => {
  void closeDb();
});


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
