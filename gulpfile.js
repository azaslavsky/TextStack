//Include gulp, and launch the task loader
var gulp = require('gulp');

//Manage CLI flags
var args = require('yargs').argv;

//Get all the other modules necessary to build this out
var bump = require('gulp-bump');
var concat = require('gulp-concat');
var debug = require('gulp-debug');
var doc = require('gulp-jsdoc-to-markdown');
var regrep = require('gulp-regex-replace');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var uglify = require('gulp-uglify');

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
	gulp.src(['./package.json'])
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