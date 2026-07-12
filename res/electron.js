const path = require('path');
const {app, BrowserWindow, ipcMain, shell, Menu, dialog} = require('electron');

let mainWindow;

const argv = process.argv.slice(2);

ipcMain.on('projectabe:get-argv', event => {
  event.returnValue = argv;
});

ipcMain.on('projectabe:get-user-data-path', event => {
  event.returnValue = app.getPath('userData');
});

ipcMain.on('projectabe:resize-window', (event, width, height) => {
  if( mainWindow && Number.isFinite(width) && Number.isFinite(height) )
    mainWindow.setContentSize(Math.max(320, width), Math.max(240, height));
});

ipcMain.on('projectabe:open-external', (event, url) => {
  if( typeof url === 'string' && /^https?:\/\//i.test(url) )
    shell.openExternal(url);
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
	  sandbox: false,
	  devTools: false
      }
  /* */
    // fullscreen:true
    // frame:false
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {label: 'File', submenu: [{role: 'quit'}]},
    {label: 'Edit', submenu: [{role: 'undo'}, {role: 'redo'}, {type: 'separator'},
      {role: 'cut'}, {role: 'copy'}, {role: 'paste'}, {role: 'selectAll'}]},
    {label: 'View', submenu: [{role: 'reload'}, {role: 'toggleDevTools'}]},
    {label: 'Window', submenu: [
      {label: 'Open HEX File...', click: async () => {
        if( !mainWindow ) return;
        let result = await dialog.showOpenDialog(mainWindow, {
          properties: ['openFile'],
          filters: [{name: 'HEX files', extensions: ['hex']}, {name: 'All files', extensions: ['*']}]
        });
        if( !result.canceled && result.filePaths[0] )
          mainWindow.webContents.send('projectabe:open-hex', result.filePaths[0]);
      }},
      {role: 'minimize'}, {role: 'close'}
    ]}
  ]));

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
