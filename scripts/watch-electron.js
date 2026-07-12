const fs = require('fs');
const path = require('path');
const {spawnSync} = require('child_process');

const root = path.resolve(__dirname, '..');
const buildScript = path.join(__dirname, 'build-electron.js');
let timer;

function build() {
    const result = spawnSync(process.execPath, [buildScript], {
        cwd: root,
        stdio: 'inherit'
    });
    if( result.status !== 0 )
        process.exitCode = result.status || 1;
}

function scheduleBuild() {
    clearTimeout(timer);
    timer = setTimeout(build, 100);
}

build();
for( const directory of ['src', 'res'] ) {
    fs.watch(path.join(root, directory), {recursive: true}, scheduleBuild);
}

console.log('Watching src and res for Electron changes');
