const {contextBridge, ipcRenderer} = require('electron');
const fs = require('fs');
const path = require('path');

contextBridge.exposeInMainWorld('projectabe', {
    argv: ipcRenderer.sendSync('projectabe:get-argv'),
    userDataPath: ipcRenderer.sendSync('projectabe:get-user-data-path'),
    path: {
        sep: path.sep,
        resolve: (...args) => path.resolve(...args)
    },
    fs: {
        mkdir: (filePath, callback) => fs.mkdir(filePath, callback),
        readFile: (filePath, encoding, callback) => {
            if( typeof encoding === 'function' )
                return fs.readFile(filePath, encoding);
            return fs.readFile(filePath, encoding, callback);
        },
        writeFile: (filePath, data, callback) => fs.writeFile(filePath, data, callback),
        readdir: (filePath, callback) => fs.readdir(filePath, callback),
        mkdirSync: filePath => fs.mkdirSync(filePath),
        existsSync: filePath => fs.existsSync(filePath),
        lstatSync: filePath => ({
            isDirectory: () => fs.lstatSync(filePath).isDirectory()
        }),
        unlinkSync: filePath => fs.unlinkSync(filePath),
        writeFileSync: (filePath, data) => fs.writeFileSync(filePath, data),
        watch: (filePath, callback) => {
            const watcher = fs.watch(filePath, callback);
            return {close: () => watcher.close()};
        }
    }
});
