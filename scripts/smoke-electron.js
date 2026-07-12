const path = require('path');
const {spawn} = require('child_process');

const electron = require('electron');
const buildDir = path.resolve(__dirname, '..', 'build');
const entry = path.join(buildDir, 'electron.js');
const child = spawn(electron, [entry], {
    cwd: buildDir,
    stdio: 'ignore',
    windowsHide: true
});

let stopping = false;
const timeout = setTimeout(() => {
    stopping = true;
    child.kill();
    console.log('Electron smoke test passed');
}, 5000);

child.once('error', error => {
    clearTimeout(timeout);
    console.error(error.stack || error);
    process.exitCode = 1;
});

child.once('exit', (code, signal) => {
    if( stopping ) return;

    clearTimeout(timeout);
    console.error(`Electron exited before the smoke test completed (code=${code}, signal=${signal})`);
    process.exitCode = 1;
});
