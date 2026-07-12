const {contextBridge, ipcRenderer} = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const childProcess = require('child_process');

const fsApi = {
    mkdir: (filePath, callback) => fs.mkdir(filePath, callback),
    readFile: (filePath, encoding, callback) => {
        if( typeof encoding === 'function' )
            return fs.readFile(filePath, encoding);
        return fs.readFile(filePath, encoding, callback);
    },
    writeFile: (filePath, data, callback) => fs.writeFile(filePath, data, callback),
    readdir: (filePath, callback) => fs.readdir(filePath, callback),
    readdirSync: filePath => fs.readdirSync(filePath),
    mkdirSync: (filePath, options) => fs.mkdirSync(filePath, options),
    mkdtempSync: prefix => fs.mkdtempSync(prefix),
    existsSync: filePath => fs.existsSync(filePath),
    lstatSync: filePath => ({
        isDirectory: () => fs.lstatSync(filePath).isDirectory()
    }),
    readlinkSync: filePath => fs.readlinkSync(filePath),
    readFileSync: (filePath, encoding) => fs.readFileSync(filePath, encoding),
    unlinkSync: filePath => fs.unlinkSync(filePath),
    renameSync: (oldPath, newPath) => fs.renameSync(oldPath, newPath),
    writeFileSync: (filePath, data) => fs.writeFileSync(filePath, data),
    watch: (filePath, callback) => {
        const watcher = fs.watch(filePath, callback);
        return {close: () => watcher.close()};
    }
};

const pathApi = {
    sep: path.sep,
    delimiter: path.delimiter,
    normalize: value => path.normalize(value),
    resolve: (...args) => path.resolve(...args),
    dirname: value => path.dirname(value)
};

contextBridge.exposeInMainWorld('projectabe', {
    argv: ipcRenderer.sendSync('projectabe:get-argv'),
    userDataPath: ipcRenderer.sendSync('projectabe:get-user-data-path'),
    path: pathApi,
    fs: fsApi,
    resizeWindow: (width, height) => ipcRenderer.send('projectabe:resize-window', width, height),
    openExternal: url => ipcRenderer.send('projectabe:open-external', url),
    onOpenHex: callback => ipcRenderer.on('projectabe:open-hex', (_event, filePath) => callback(filePath)),
    compiler: {
        process: {
            platform: process.platform,
            env: {...process.env}
        },
        os: {
            homedir: () => os.homedir()
        },
        path: pathApi,
        fs: fsApi,
        spawn: (command, args) => new Promise(resolve => {
            const child = childProcess.spawn(command, args);
            let stdout = '';
            let stderr = '';
            if( child.stdout ) child.stdout.on('data', data => { stdout += data.toString(); });
            if( child.stderr ) child.stderr.on('data', data => { stderr += data.toString(); });
            child.on('error', error => resolve({code: -1, stdout, stderr: stderr + error.toString()}));
            child.on('close', code => resolve({code, stdout, stderr}));
        })
    }
});
