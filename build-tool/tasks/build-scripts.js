var gulp = require( "gulp" );
var babel = require( "gulp-babel" );

var onError = require( "../utils" ).onError;

// var sourcemaps = require( "gulp-sourcemaps" );

var SRC_GLOB =  "./src/**/*.js";

gulp.task( "build:scripts", function() {
  return gulp.src( SRC_GLOB )
            //  .pipe( sourcemaps.init() )
             .pipe( babel( {
                  presets: ['es2015']
              } ) )
             .on( "error", onError )
            //  .pipe( sourcemaps.write( "." ) )
             .pipe( gulp.dest( "build" ) );
});

gulp.tasks[ "build:scripts" ].SRC_GLOB = SRC_GLOB;
