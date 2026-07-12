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
	    if( p.toLowerCase() == 'libraries' ) return;
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

	let ext = this.compilerExt;
	let queue = [PATH.resolve('.'), ...process.env.PATH.split(PATH.delimiter)];
	if( process.env.programfiles ){
	    queue.push(process.env.programfiles + PATH.sep + 'arduino');
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

    async build( srcdata, main ){
	if( !this.findCompiler() )
	    throw "No Arduino IDE found";

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

	let args = [ ...this.prefixArgs,
	    '--board', 'arduino:avr:leonardo',
	    '--pref', 'build.path=' + lbp,
	    '--verify', PATH.resolve(lsp, main)
	];
	let result = await runtime.spawn(this.compilerExec, args);
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
    }

    async _disassemble( obj ){
	if( !obj.elfpath ) return obj;

	let elfpath = PATH.resolve(obj.lbp, obj.elfpath);
	let cmd = PATH.resolve(this.compilerPath,
	    ...'hardware/tools/avr/bin/avr-objdump'.split('/')) + this.compilerExt;
	if( !fs.existsSync(cmd) ) return obj;

	let result = await runtime.spawn(cmd, ['-dl', elfpath]);
	if( !result.code ) obj.disassembly = result.stdout + result.stderr;
	return obj;
    }
}

module.exports = LocalCompiler;
