const path = require('path');
const {app, BrowserWindow, ipcMain} = require('electron');

let mainWindow;

const argv = process.argv.slice(2);

ipcMain.on('projectabe:get-argv', event => {
  event.returnValue = argv;
});

ipcMain.on('projectabe:get-user-data-path', event => {
  event.returnValue = app.getPath('userData');
});

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    app.quit();
});

// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
      width: argv.some(arg => /.*\.hex$/i.test(arg)) ? 375 : 1024,
      height:600,
  /* */
      webPreferences:{
	  preload: path.join(__dirname, 'preload.js'),
	  nodeIntegration: false,
	  contextIsolation: true,
	  devTools: false
      }
  /* */
    // fullscreen:true
    // frame:false
  });

  // mainWindow.webContents.openDevTools();

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});
