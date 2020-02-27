const package = require( './package.json' );
const spawn = require( 'child_process' ).spawn;

function tscSpawn( watch ) {
  return spawn( 'tsc', 
                watch ? ['--watch'] : [], 
                { cwd: __dirname, stdio: 'inherit', shell: true } );
}

// build task
const build = () => tscSpawn( false );
build.displayName = package.name + ' build';

// watch:build task
const watchBuild = () => tscSpawn( true );
watchBuild.displayName = package.name + ' watch:build';

// exports
module.exports['build'] = build;
module.exports['watch:build'] = watchBuild;
