const gulp = require( 'gulp' );
const sourcemaps = require( 'gulp-sourcemaps' );
const babel = require( 'gulp-babel' );

function watchTask( task ) {
  const watcher = gulp.watch( [task.SRC_GLOB], task);
  watcher.on( 'add', path => { console.log('File ' + path + ' was added, running tasks...'); });
  watcher.on( 'change', path => { console.log('File ' + path + ' was changed, running tasks...'); });
}

// build task
const SRC_GLOB =  './src/**/*.js';
const DEST = './build';

const build = () =>
  gulp.src( SRC_GLOB, { cwd: __dirname } )
      .pipe( sourcemaps.init() )
      .pipe(
        babel( {
          presets: [ [ '@babel/preset-env', { 'targets': { 'node': '6.10' } } ] ]
        } ) )
      .pipe( sourcemaps.write( '.' ) )
      .pipe( gulp.dest( DEST, { cwd: __dirname } ) );

build.displayName = 'build';
build.SRC_GLOB = SRC_GLOB;

// watch:build task
const watchBuild = () => watchTask( build );
watchBuild.displayName = 'watch:build';

// exports
module.exports[build.displayName] = build;
module.exports[watchBuild.displayName] = watchBuild;
