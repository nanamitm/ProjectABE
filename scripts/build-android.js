const fs = require('fs');
const path = require('path');
const {spawnSync} = require('child_process');

const root = path.resolve(__dirname, '..');
const buildScript = path.join(__dirname, 'build-target.js');
const buildDir = path.join(root, 'build');

const sdk = path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');
if( !process.env.ANDROID_HOME && fs.existsSync(sdk) )
    process.env.ANDROID_HOME = sdk;
if( !process.env.ANDROID_SDK_ROOT && process.env.ANDROID_HOME )
    process.env.ANDROID_SDK_ROOT = process.env.ANDROID_HOME;

function findGradle(){
    const rootDir = path.join(process.env.USERPROFILE || '', '.gradle', 'wrapper', 'dists');
    let found = [];
    if( !fs.existsSync(rootDir) ) return found;
    for( const distribution of fs.readdirSync(rootDir) ){
	const distributionDir = path.join(rootDir, distribution);
	if( !fs.statSync(distributionDir).isDirectory() ) continue;
	for( const hash of fs.readdirSync(distributionDir) ){
	    const hashDir = path.join(distributionDir, hash);
	    if( !fs.statSync(hashDir).isDirectory() ) continue;
	    for( const version of fs.readdirSync(hashDir) ){
		const bin = path.join(hashDir, version, 'bin');
		if( fs.existsSync(path.join(bin, 'gradle.bat')) ) found.push(bin);
	    }
	}
    }
    return found.sort().reverse();
}

const gradleBin = findGradle()[0];
if( gradleBin ){
    process.env.GRADLE_HOME = path.dirname(gradleBin);
    process.env.PATH = gradleBin + path.delimiter + process.env.PATH;
}

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
