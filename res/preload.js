const {ipcRenderer} = require('electron');

window.projectabe = Object.freeze({
    argv: ipcRenderer.sendSync('projectabe:get-argv'),
    userDataPath: ipcRenderer.sendSync('projectabe:get-user-data-path')
});
