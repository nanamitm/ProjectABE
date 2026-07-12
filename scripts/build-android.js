const fs = require('fs');
const path = require('path');
const {spawnSync} = require('child_process');

const root = path.resolve(__dirname, '..');
const buildScript = path.join(__dirname, 'build-target.js');
const buildDir = path.join(root, 'build');

const bundle = spawnSync(process.execPath, [buildScript, 'mobile'], {
    cwd: root,
    stdio: 'inherit'
});
if( bundle.status !== 0 )
    process.exit(bundle.status || 1);

const cordova = require('cordova-lib').cordova;
process.env.PWD = buildDir;
process.chdir(buildDir);

(async () => {
    try{
	const platformDir = path.join(buildDir, 'platforms');
	fs.rmSync(platformDir, {recursive: true, force: true});
	const addPlatform = spawnSync(process.execPath, [
	    path.join(root, 'node_modules', 'cordova', 'bin', 'cordova'),
	    'platform', 'add', 'android@15.0.0'
	], {cwd: buildDir, stdio: 'inherit'});
	if( addPlatform.status !== 0 )
	    throw new Error('cordova platform add failed');

	await cordova.build({
	    platforms: ['android'],
	    options: {
		argv: ['--release', '--gradleArg=--no-daemon']
	    }
	});
	console.log('Android build completed');
    }catch( error ){
	console.error(error.stack || error);
	process.exitCode = 1;
    }
})();
