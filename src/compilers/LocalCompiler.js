const runtime = window.projectabe.compiler;
const PATH = runtime.path;
const process = runtime.process;
const fs = runtime.fs;
const os = runtime.os;

import { Model } from '../lib/mvc.js';
import IStore from '../store/IStore.js';

class LocalCompiler {

    static "@inject" = {
	model: [Model, {scope:"root"}],
	store: IStore
    }

    constructor(){
	this.compilerPath = "";
	this.compilerExec = "";
	this.useCli = false;
	this.compilerExt = process.platform == 'win32' ? '.exe' : '';
	this.prefixArgs = [];
    }

    getSketchDir(){
	return [os.homedir(), 'Arduino'].join(PATH.sep);
    }

    getUserGames( out ){
	let sketchDir = this.getSketchDir();
	let dirs;
	try{
	    dirs = fs.readdirSync(sketchDir);
	}catch(ex){
	    console.log("Sketch dir not found in " + sketchDir);
	    return;
	}

	dirs.forEach( p => {
	    if( !p || p.toLowerCase() == 'libraries' || p.toLowerCase() == 'null' ) return;
	    let fp = sketchDir + PATH.sep + p;
	    try{
		fp = fs.readlinkSync(fp);
		fp = PATH.resolve(sketchDir, fp);
	    }catch(ex){}

	    try{
		if( fs.lstatSync(fp).isDirectory() )
		    out.push({title:p, localSourcePath:fp});
	    }catch(ex){}
	} );
    }

    findCompiler(){
	if( this.compilerPath ) return this.compilerPath;

	let cliCandidates = [];
	let programFiles = process.env.ProgramFiles || process.env.programfiles;
	let localAppData = process.env.LOCALAPPDATA || process.env.localappdata;
	if( programFiles )
	    cliCandidates.push(PATH.resolve(programFiles,
		'Arduino IDE/resources/app/lib/backend/resources/arduino-cli' + (process.platform == 'win32' ? '.exe' : '')));
	if( localAppData )
	    cliCandidates.push(PATH.resolve(localAppData,
		'Programs/Arduino IDE/resources/app/lib/backend/resources/arduino-cli' + (process.platform == 'win32' ? '.exe' : '')));
	cliCandidates.push('arduino-cli' + (process.platform == 'win32' ? '.exe' : ''));
	for( let candidate of cliCandidates ){
	    if( candidate.indexOf(PATH.sep) == -1 || fs.existsSync(candidate) ){
		this.compilerExec = candidate;
		this.compilerPath = candidate.indexOf(PATH.sep) == -1 ? '.' : PATH.dirname(candidate);
		this.useCli = true;
		return this.compilerPath;
	    }
	}

	let ext = this.compilerExt;
	let queue = [PATH.resolve('.'), ...process.env.PATH.split(PATH.delimiter)];
	if( programFiles ){
	    queue.push(programFiles + PATH.sep + 'arduino');
	}else if( process.platform == 'darwin' ){
	    queue.push('/Applications');
	    queue.push(os.homedir() + '/Applications');
	    ext = '.app';
	}

	let found;
	queue.find( base => {
	    if( !fs.existsSync(base + PATH.sep + 'arduino' + ext) ) return false;

	    let exec = base + PATH.sep + 'arduino_debug' + ext;
	    if( !fs.existsSync(exec) ) exec = base + PATH.sep + 'arduino' + ext;
	    try{
		exec = PATH.resolve(base, fs.readlinkSync(exec));
	    }catch(ex){}

	    this.compilerExec = exec;
	    if( process.platform == 'darwin' )
		this.compilerExec += '/Contents/MacOS/Arduino';
	    found = PATH.dirname(exec);
	    return true;
	});

	return this.compilerPath = found;
    }

    build( srcdata, main ){
	if( !this.findCompiler() )
	    return Promise.reject("No Arduino IDE found");

	let lsp = this.model.getItem("ram.localSourcePath");
	let lbp = this.model.getItem("ram.localBuildPath");

	if( !lsp ){
	    lsp = fs.mkdtempSync(PATH.resolve(this.store.root, "src_"));
	    this.model.setItem("ram.localSourcePath", lsp);
	    for( let k in srcdata )
		this.store.saveFile(lsp + PATH.sep + k, srcdata[k]);
	}
	if( !lbp ){
	    lbp = fs.mkdtempSync(PATH.resolve(this.store.root, "build_"));
	    this.model.setItem("ram.localBuildPath", lbp);
	}

	let args = this.useCli ? [ ...this.prefixArgs,
	    'compile',
	    '--fqbn', 'arduino:avr:leonardo',
	    '--build-path', lbp,
	    lsp
	] : [ ...this.prefixArgs,
	    '--board', 'arduino:avr:leonardo',
	    '--pref', 'build.path=' + lbp,
	    '--verify', PATH.resolve(lsp, main)
	];
	return runtime.spawn(this.compilerExec, args).then(result => {
	    let output = args.join(" ") + '\n' + result.stdout + result.stderr;
	    if( result.code ) throw output;

	    let hexpath, elfpath;
	    fs.readdirSync(lbp).forEach( file => {
		if( /.*\.hex$/i.test(file) && file.indexOf("with_bootloader") == -1 )
		    hexpath = file;
		else if( /.*\.elf$/i.test(file) )
		    elfpath = file;
	    });
	    if( !hexpath ) throw output + "\nNo HEX output found";

	    return this._disassemble({
		lbp,
		elfpath,
		hex: fs.readFileSync(PATH.resolve(lbp, hexpath), 'utf-8'),
		stdout: output
	    });
	});
    }

    _disassemble( obj ){
	if( this.useCli || !obj.elfpath ) return Promise.resolve(obj);

	let elfpath = PATH.resolve(obj.lbp, obj.elfpath);
	let cmd = PATH.resolve(this.compilerPath,
	    ...'hardware/tools/avr/bin/avr-objdump'.split('/')) + this.compilerExt;
	if( !fs.existsSync(cmd) ) return Promise.resolve(obj);

	return runtime.spawn(cmd, ['-dl', elfpath]).then(result => {
	    if( !result.code ) obj.disassembly = result.stdout + result.stderr;
	    return obj;
	});
    }
}

module.exports = LocalCompiler;
