const fs = require('fs');
const path = require('path');
const browserify = require('browserify');
const babelify = require('babelify');
const sourcemapify = require('sourcemapify');

const root = path.resolve(__dirname, '..');
const buildDir = path.join(root, 'build');
const target = process.argv[2];

const targets = {
    web: {
	entry: path.join(root, 'src', 'web.js'),
	output: path.join(buildDir, 'app.js'),
	resources: path.join(root, 'res'),
	resourceRoot: buildDir
    },
    mobile: {
	entry: path.join(root, 'src', 'mobile.js'),
	output: path.join(buildDir, 'www', 'app.js'),
	resources: path.join(root, 'res-pg'),
	resourceRoot: buildDir,
	additionalResources: [{
	    source: path.join(root, 'res'),
	    destination: path.join(buildDir, 'www')
	}]
    }
};

if( !targets[target] )
    throw new Error(`Unknown build target: ${target}`);

const config = targets[target];
fs.rmSync(buildDir, {recursive: true, force: true});
fs.cpSync(config.resources, config.resourceRoot, {recursive: true});
for( const resource of config.additionalResources || [] )
    fs.cpSync(resource.source, resource.destination, {recursive: true});

const bundler = browserify({entries: config.entry, debug: true});
bundler.plugin(sourcemapify, {root: '../'});
bundler.transform(babelify, {
    plugins: [['transform-class-properties'], ['import-glob']],
    presets: [['env', {targets: {uglify: []}}]]
});

bundler.bundle()
    .on('error', error => {
	console.error(error.stack || error);
	process.exitCode = 1;
    })
    .pipe(fs.createWriteStream(config.output))
    .on('finish', () => console.log(`${target} build completed: ${path.relative(root, config.output)}`));
