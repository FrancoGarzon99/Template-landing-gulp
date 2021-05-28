var pkg 		= require('./src/theme.json'),
    browserSync = require('browser-sync'),
    clean 		= require('del'),
    gulp 		= require('gulp'),
    cssnano 	= require('gulp-cssnano'),
    gulpif 		= require('gulp-if'),
    header 		= require('gulp-header'),
    less 		= require('gulp-less'),
    rename 		= require('gulp-rename'),
    runSequence = require('gulp-sequence'),
    twig 		= require('gulp-twig');
	uglify 		= require('gulp-uglify'),
    useref 		= require('gulp-useref'),
    watch 		= require('gulp-watch'),
    zip 		= require('gulp-zip');

var banner = "/*! <%= pkg.title %> v<%= pkg.version %> | <%= pkg.author.homepage %> | (c) <%= pkg.date %> <%= pkg.author.name %> | MIT License */\n\n";

var paths = {
    css: {
        src: './src/less/theme.less',
        dist: './dist/css',
        minify: ['!./dist/css/**/*.min.css', './dist/css/**/*.css']
    },
    js: {
        src: 'src/js/**/*.js',
        dis: './dist/js'
    },
    theme: {
        tmp: 'src',
        src: 'src/*.html',
        dist: './dist',
        pages: './src/template/*.html'
    },
    watch: {
        less: 'src/less/**/*.less',
        html: 'src/template/**/*.+(html|json|twig)',
        js: 'src/js/**/*.js',
        images: './src/images/**/*',
        theme: './src/vendor/theme/**/*'
    }
};

gulp.task('dist-template', function() {
    return gulp.src(paths.theme.pages).pipe(twig({
        data: {
            theme: pkg
        },
        functions: [
            {
                name: "loadjson",
                func: function(file) {
                    return require(file);
                }
            },
            {
                name: "is_string",
                func: function(str) {
                    if (typeof str === 'string' || str instanceof String) {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        ],
        filters: [
            {
                // Ejemplo: {{"info@dominio.com.uy" | emailCloak}}
                name: "emailCloak",
                func: function (args) {

                    text = Buffer.from('<a href="mailto:' + args + '">' + args + '</a>').toString('base64');

                    return `
                        <script>
                            document.write(window.atob('${text}')); 
                        </script>
                    `;
                }
            }
        ]
    })).pipe(gulp.dest(paths.theme.tmp));
});

// Less to CSS	
gulp.task('dist-css', function(done) {
    var modifyVars = {
        'global-image-path': ('"../images"'),
        'global-font-path': ('"../fonts"'),
        'icon-font-path': ('"../fonts"')
    };
    gulp.src(paths.css.src).pipe(less({
        "modifyVars": modifyVars
    })).pipe(rename({
        suffix: '.min'
    })).pipe(cssnano({
        advanced: false,
        rebase: false
    })).pipe(header(banner, {
        'pkg': pkg
    })).pipe(gulp.dest(paths.css.dist)).on('end', function() {
        done();
    });
});

// useref
gulp.task('dist-assets', function() {
    return gulp.src(paths.theme.src).pipe(useref()).pipe(gulpif('*.js', uglify())).pipe(gulpif('*.js', header(banner, {
        'pkg': pkg
    }))).pipe(gulp.dest(paths.theme.dist));
});

// Remove tmp index.html
gulp.task('tmp-remove', function(done) {
    return clean([paths.theme.src]);
});

// Clean dist folder
gulp.task('dist-clean', function(done) {
    return clean([paths.theme.dist]);
});

// Copy files
gulp.task('copy-fonts', function() {
    return gulp.src(['./src/vendor/uikit/fonts/*', './src/fonts/*']).pipe(gulp.dest('./dist/fonts'));
});

gulp.task('copy-phpmailer', function() {
    return gulp.src(['./src/vendor/phpmailer/**']).pipe(gulp.dest('./dist/vendor/phpmailer'));
});

gulp.task('remove-theme', function() {
    return clean(['./dist/vendor/theme']);
});

gulp.task('copy-theme', function() {
    return gulp.src(['./src/vendor/theme/**']).pipe(gulp.dest('./dist/vendor/theme'));
});

gulp.task('remove-images', function() {
    return clean(['./dist/images']);
});

gulp.task('copy-images', function() {
    return gulp.src(['./src/images/**']).pipe(gulp.dest('./dist/images'));
});

gulp.task('dist-copy', function(done) {
    runSequence('copy-fonts', 'copy-phpmailer', 'copy-theme', 'copy-images', done);
});

// All dist
gulp.task('dist', function(done) {
    runSequence('dist-clean', 'dist-template', 'dist-css', 'dist-assets', 'dist-copy', 'tmp-remove', done);
});

// use default task to launch BrowserSync
gulp.task('sync', ['dist'], function() {
    
    // Serve files from the root of this project
    browserSync({
        server: {
            baseDir: paths.theme.dist
        },
        port: 8080
    });

    // add browserSync.reload to the tasks array to make
    // all browsers reload after tasks are complete.
    watch(paths.watch.less, function() {
        runSequence('dist-css', browserSync.reload);
    });
    watch(paths.watch.js, function() {
        runSequence('dist-template', 'dist-assets', 'tmp-remove', browserSync.reload);
    });
    watch(paths.watch.html, function() {
        runSequence('dist-template', 'dist-assets', 'tmp-remove', browserSync.reload);
    });
    watch(paths.watch.images, function() {
        runSequence('remove-images', 'copy-images', browserSync.reload);
    });
    watch(paths.watch.theme, function(event) {
        runSequence('remove-theme', 'copy-theme', browserSync.reload);
    });
});

// generate dist zip file
gulp.task('zip', ['dist-clean'], function(done) {
    runSequence('dist', function() {
        gulp.src(['./dist/**'], {
            base: "./dist"
        }).pipe(zip('theme-' + pkg.name + '-' + pkg.version + '.zip')).pipe(gulp.dest(paths.theme.dist)).on('end', done);
    });
});

// Default task
gulp.task('default', ['dist']);