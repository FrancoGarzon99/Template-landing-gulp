(() => {
    'use strict';

    const 
        pkg = require('./src/theme.json'),
        gulp        = require('gulp'),
        del         = require('del'),
        browsersync = require('browser-sync').create(),
        useref 		= require('gulp-useref'),
        gulpif 		= require('gulp-if'),
        uglify 		= require('gulp-uglify'),
        header 		= require('gulp-header'),
        twig 		= require('gulp-twig'),
        less 		= require('gulp-less'),
        rename 		= require('gulp-rename'),
        cssnano 	= require('gulp-cssnano'),

        banner = "/*! <%= pkg.title %> v<%= pkg.version %> | <%= pkg.author.homepage %> | (c) <%= pkg.date %> <%= pkg.author.name %> | MIT License */\n\n",

        paths = {
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
        }
    ;

    /**************** dist-clean task ****************/

    function distClean() {
        return del([paths.theme.dist]);
    }
    exports.clean = distClean;
    exports.wipe = distClean;

    
    /**************** tmp-remove task ****************/

    function tmpRemove() {
        return del([paths.theme.src]);
    }
    exports.tmpRemove = tmpRemove;

    
    /**************** remove-theme task ****************/

    function removeTheme() {
        return del(['./dist/vendor/theme']);
    }
    exports.removeTheme = removeTheme;

    
    /**************** remove-images task ****************/

    function removeImages() {
        return del(['./dist/images']);
    }
    exports.removeImages = removeImages;
    
    
    /**************** dist-assets task ****************/

    function distAssets() {
        return gulp.src(paths.theme.src).pipe(useref()).pipe(gulpif('*.js', uglify())).pipe(gulpif('*.js', header(banner, {
            'pkg': pkg
        }))).pipe(gulp.dest(paths.theme.dist));
    }
    exports.distAssets = distAssets;

   
    /**************** copy-fonts task ****************/

    function copyFonts() {
        return gulp.src(['./src/vendor/uikit/fonts/*', './src/fonts/*']).pipe(gulp.dest('./dist/fonts'));
    }
    exports.copyFonts = copyFonts;


    /**************** copy-phpmailer task ****************/

    function copyPhpmailer() {
        return gulp.src(['./src/vendor/phpmailer/**']).pipe(gulp.dest('./dist/vendor/phpmailer'));
    }
    exports.copyPhpmailer = copyPhpmailer;

    
    /**************** copy-theme task ****************/

    function copyTheme() {
        return gulp.src(['./src/vendor/theme/**']).pipe(gulp.dest('./dist/vendor/theme'));
    }
    exports.copyTheme = copyTheme;

    
    /**************** copy-images task ****************/

    function copyImages() {
        return gulp.src(['./src/images/**']).pipe(gulp.dest('./dist/images'));
    }
    exports.copyImages = copyImages;

    
    /**************** dist-copy task ****************/

    function distCopy() {
        // runSequence('copy-fonts', 'copy-phpmailer', 'copy-theme', 'copy-images', done);
        return gulp.series(copyFonts, copyPhpmailer, copyTheme, copyImages);
    }
    exports.distCopy = gulp.series(copyFonts, copyPhpmailer, copyTheme, copyImages);
    
    
    /**************** dist-css task ****************/

    function distCss(done) {
        const modifyVars = {
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
    }
    exports.distCss = distCss;

    
    /**************** dist-template ****************/

    function distTemplate() {
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
    }
    exports.distTemplate = distTemplate;

    
    /**************** dist task ****************/

    exports.dist = gulp.series(distClean, distTemplate, distCss, distAssets, exports.distCopy, tmpRemove);


    /**************** server task (now private) ****************/

    const syncConfig = {
        server: {
            baseDir: paths.theme.dist,
        },
        port: 8080,
        open: true
    };

    // browser-sync
    function server(done) {
        if (browsersync) browsersync.init(syncConfig);
        done();
    }

    // BrowserSync Reload
    function browserSyncReload(done) {
        browsersync.reload();
        done();
    }


    /**************** watch task ****************/

    function watch(done) {

        // image changes
        gulp.watch(paths.watch.images, gulp.series(removeImages, copyImages, browserSyncReload));
        
        // Less changes
        gulp.watch(paths.watch.less, gulp.series(distCss, browserSyncReload));
        
        // Js changes
        gulp.watch(paths.watch.js, gulp.series(distTemplate, distAssets, tmpRemove, browserSyncReload));

        // HTML changes
        gulp.watch(paths.watch.html, gulp.series(distTemplate, distAssets, tmpRemove, browserSyncReload));

        // Theme changes
        gulp.watch(paths.watch.theme, gulp.series(removeTheme, copyTheme, browserSyncReload));

        done();

    }

    
    /**************** default task ****************/

    exports.default = gulp.series(exports.dist, watch, server);

})();