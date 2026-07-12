import {bind, inject, getInstanceOf} from 'dry-di';


import App from './App.js';
import IStore from './store/IStore.js';
import Store from './store/Electron.js';
import { Model, boot } from './lib/mvc.js';

import * as entities from './entities/*.js';
import * as components from './components/*.js';

import LocalCompiler from './compilers/LocalCompiler.js';
import Flasher from './flashers/AVRGirl.js';

const runtime = window.projectabe || {};
const fs = runtime.fs;
const path = runtime.path;
const argv = runtime.argv || [];
const input = argv.find(arg => !/^--/.test(arg));
const skinArg = argv.find(arg => /^--skin=/.test(arg));

document.addEventListener( "DOMContentLoaded", () => {

    bind(Store).to(IStore).singleton();
    bind(LocalCompiler).to('Compiler').singleton();
    bind(Flasher).to('Plugin').singleton();

//    console.log( argv );

    let url, app, skin = skinArg ? skinArg.substr(7) : null;

	if( input && /^https?:\/\//i.test(input) ){
	url = input;
    }else if( input && !/.*\.js$/.test(input) ){
	let file = path.resolve(input);
	let hnd = 0;
	let watcher;

	function watch(){

	    if( watcher )
		watcher.close();

	watcher = fs.watch(file, _ => {
		    if( hnd ) clearTimeout(hnd);
		    hnd = setTimeout(
			_=>{
			    app.root.removeItem("app.AT32u4");
			    app.root.setItem("app.AT32u4.url", url);
			    app.pool.call("loadFlash");
			    watch();
			},
			1000
		    );
	});
	    
	}

	watch();
	
	url = "file://" + file.replace(/\\/g, "/");

    }else{
	let match = location.search.match(/[?&](?:file|hex|url)=([^&]+)/);
	if( match ){
	    url = match[1];
	    if( /^https?%/.test(url) )
		url = decodeURIComponent(url);
	}
	let querySkin = location.search.match(/[?&]skin=([^&]+)/);
	if( querySkin ) skin = decodeURIComponent(querySkin[1]);
    }

    app = boot({
        main:App,
        element:document.body,
        components,
        entities,
        model:{
	    ram:{
		autoRun: url,
		hasFlasher: true,
		debuggerEnabled: true,
		skin,
		isNativeBuild: true
	    }
	}
    });

    if( runtime.onOpenHex )
	runtime.onOpenHex(filePath => {
	    fs.readFile(filePath, "utf-8", (err, text) => {
		if( !err ) app.pool.call("loadHexFile", filePath, text);
	    });
	});

    app.pool.add(new Flasher( app ));

} );
