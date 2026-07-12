const fs = require('fs');
const path = require('path');
const browserify = require('browserify');
const babelify = require('babelify');
const sourcemapify = require('sourcemapify');

const root = path.resolve(__dirname, '..');
const buildDir = path.join(root, 'build');

fs.rmSync(buildDir, {recursive: true, force: true});
fs.cpSync(path.join(root, 'res'), buildDir, {recursive: true});

const bundler = browserify({
    entries: path.join(root, 'src', 'pc.js'),
    debug: true
});

bundler.plugin(sourcemapify, {root: '../'});
bundler.transform(babelify, {
    plugins: [
        ['transform-class-properties'],
        ['import-glob']
    ],
    presets: [
        ['env', {targets: {uglify: []}}]
    ]
});

const output = fs.createWriteStream(path.join(buildDir, 'app.js'));

bundler
    .bundle()
    .on('error', error => {
        console.error(error.stack || error);
        process.exitCode = 1;
    })
    .pipe(output)
    .on('finish', () => console.log('Electron build completed: build/app.js'));
