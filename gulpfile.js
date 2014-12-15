//Include gulp, and launch the task loader
var gulp = require('gulp');
var fs = require('fs-extra');

//Manage CLI flags
var args = require('yargs').argv;

//Get all the other modules necessary to build this out
var bump = require('gulp-bump');
var concat = require('gulp-concat');
var debug = require('gulp-debug');
var check = require('gulp-if');
var coveralls = require('gulp-coveralls');
var doc = require('gulp-jsdoc-to-markdown');
var forEach = require('gulp-foreach');
var karma = require('karma').server;
var open = require('gulp-open');
var regrep = require('gulp-regex-replace');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var uglify = require('gulp-uglify');



//Rename result folders
var splitPath = function(path){
	var output = {};

	//Get path segments
	output.path = path.split('\\');
	output.dir = output.path[output.path.length - 2];
	output.fileName = output.path[output.path.length - 1];
	output.fileType = output.fileName.lastIndexOf('.') > -1 ? output.fileName.substring(output.fileName.lastIndexOf('.')) : '';
	output.path.pop();

	return output;
};



//Jasmine tests, for simple in browser verification
gulp.task('jasmine', function() {
	gulp.src(['./test/jasmine.html'])
		.pipe(open('<%file.path%>'));
});

//Test for browser compatibility
gulp.task('browsers', function(done) {
	var opts = {
		configFile: __dirname+'/karma.conf.js',
		singleRun: true,
		browsers: ['PhantomJS', 'Chrome', 'ChromeCanary', 'Firefox', 'FirefoxDeveloper', 'IE11', 'IE10', 'IE9'],
		reporters: ['mocha', 'html'],
		preprocessors: {}
	};

	return karma.start(opts, done);
});

//USED FOR OLD karma-html-reporter plugin; since switching to karma-html-file-reporter, this is no longer necessary
/*gulp.task('compatibility', ['karma-compatibility'], function() {
	console.log('./test/browser/'+ (typeof args.open === 'string' ? args.open+'*' : '*') +'/index.html');

	//return gulp.src(['./test/browser/'+ (typeof args.open === 'string' ? args.open+'*' : '*') +'/index.html'])
		.pipe(forEach(function(stream, file){
			var output, justOS, justBrowser, segments, newName, pathing, dirContents;

			//Get path segments
			console.log(file.path);
			output = splitPath(file.path);
			output.path.pop();

			//Create the appropriate names
			justOS = output.dir.match(/ \(.*\)/i);
			justBrowser = output.dir.replace(/ \(.*\)/i, '');
			segments = justBrowser.split('.');
			newName = (segments.length < 3 ? segments.join('.') : segments[0] +'.'+ segments[1]);// + ((justOS && justOS[0]) || '');
			
			//Move the files, and clear the old directories
			console.log(newName);
			if (newName && output.fileType){
				pathing = output.path.join('\\');
				console.log(pathing +'\\'+ newName + output.fileType);
				fs.renameSync(file.path, pathing +'\\'+ newName + output.fileType);

				dirCotnents = fs.readdirSync(pathing +'\\'+ output.dir);
				if ( !dirContents || !dirContents.length ){
					fs.rmdirSync(pathing +'\\'+ output.dir);
				}
			}
		}))
		.pipe(check(args.open, open('<%file.path%>')));
});*/

//Full Karma run-through for coverage
gulp.task('karma-coverage', function(done) {
	var opts = {
		configFile: __dirname+'/karma.conf.js',
		singleRun: true,
		browsers: args.browsers ? [args.browsers] : ['PhantomJS'],
		reporters: ['mocha', 'coverage'],
	};

	return karma.start(opts, done);
});

//Test for basic completeness and coverage
gulp.task('coverage', ['karma-coverage'], function() {
	return gulp.src(['./test/results/Phantom*']) //'+ args.browser ? args.browser : 'Phantom' +'
		.pipe(forEach(function(stream, file){
			fs.copySync(file.path, splitPath(file.path).path.join('\\'));
			fs.removeSync(file.path);
		}))
});





//Make the markdown version of the API
gulp.task('api', function() {
	gulp.src(['./src/textStack.js'])
		.pipe(doc())
		.pipe(rename(function(path){
			path.basename = "API";
			path.extname = ".md";
		}))
		.pipe(replace('##', '###'))
		.pipe(replace('#class: TextStack', '## API'))
		.pipe(gulp.dest('./docs'))
});

//Make the readme file
gulp.task('docs', ['api'], function() {
	gulp.src(['./docs/NOTES.md', './docs/API.md', 'LICENSE.md'])
		.pipe(concat('README.md'))
		.pipe(gulp.dest('./'))
});

//Bump the version
gulp.task('bump', ['docs'], function() {
	gulp.src(['./package.json', './bower.json'])
		.pipe(bump({type: args.vers || 'patch'}))
		.pipe(gulp.dest('./'));
});

//Copy the original file to the dist folder
gulp.task('copy', ['bump'], function() {
	gulp.src(['./src/textStack.js'])
		.pipe(gulp.dest('./dist'))
});

//Build this sucker!
gulp.task('build', ['copy'], function() {
	gulp.src(['./src/textStack.js'])
		.pipe(uglify())
		.pipe(rename(function(path){
			path.basename += '.min';
		}))
		.pipe(gulp.dest('./dist'))
});



//Submit to coveralls
gulp.task('coveralls', function() {
	gulp.src('./test/**/lcov.info')
		.pipe(coveralls());
});