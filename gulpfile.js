/* 

  Gulp v4 setup 

*/

/*
  ---------------------------
  | Required configurations |
  ---------------------------
*/

const gulp = require("gulp"),
  babel = require("gulp-babel"),
  concat = require("gulp-concat"),
  sass = require("gulp-sass")(require("sass")),
  autoprefixer = require("autoprefixer"),
  postcss = require("gulp-postcss"),
  sourcemaps = require("gulp-sourcemaps"),
  terser = require("gulp-terser"),
  imagemin = require("gulp-imagemin"),
  del = require("del"),
  notify = require("gulp-notify"),
  zip = require("gulp-zip"),
  ftp = require("vinyl-ftp"),
  browserSync = require("browser-sync").create();

/*
  ------------------------
  | Extra configurations |
  ------------------------
*/

// require("dotenv").config(); // Enable and load .env file variables

/* 
  
  Project paths 

*/
const PROJECT_PATHS = {
  index: "src/index.html",

  // Style paths
  allCSSSrc: "src/css/*.css",
  styleDist: "dist/style",
  SASSEntryFile: "src/style/main.scss",

  // Script paths
  allScripts: "src/js/*.js",
  scriptDist: "dist/scripts",

  // Assets paths
  allImages: "src/images/*.{jpg,png}",
  imagesDist: "dist/images",
  allFonts: "TODO",
  fontsDist: "dist/fonts",
  // Watch
  allHTML: "src/*.html",
  allSASS: "src/style/**/*.scss",
  allJS: "src/js/**/*.js",
  allDist: "dist/**/*.*",

  // Extra
  sameLocation: ".",
  compressedLocation: "compressed",
  dist: "dist",
};

/*
  --------------
  | Core Tasks |
  --------------
*/

/* HTML Task */
const HTMLTask = () => {
  return gulp.src(PROJECT_PATHS.index).pipe(gulp.dest(PROJECT_PATHS.dist));
};

const STYLE_BUNDLE_NAME = "main.min.css";

/* CSS Task */
const CSSTask = () => {
  return gulp
    .src(PROJECT_PATHS.allCSSSrc)
    .pipe(postcss([autoprefixer()]))
    .pipe(concat(STYLE_BUNDLE_NAME))
    .pipe(gulp.dest(PROJECT_PATHS.styleDist));
};

/* SASS Task */
const SASSTask = () => {
  return (
    gulp
      .src(PROJECT_PATHS.SASSEntryFile)
      .pipe(sourcemaps.init())
      .pipe(sass({ outputStyle: "compressed" }).on("error", sass.logError))
      .pipe(postcss([autoprefixer()]))
      .pipe(concat(STYLE_BUNDLE_NAME))
      /*
			If you have 3rd part library that is a css
			you can use concat() function "you can use concat many time"
		*/
      //   .pipe(concat("lib-name.css"))
      .pipe(sourcemaps.write(PROJECT_PATHS.sameLocation))
      .pipe(gulp.dest(PROJECT_PATHS.styleDist))
      // .pipe(notify("SASS is DONE!"))
      .pipe(browserSync.stream())
  );
};

const JS_BUNDLE_NAME = "main.min.js";

/* JS Task */
const JSTask = () => {
  return (
    gulp
      .src(PROJECT_PATHS.allScripts)
      .pipe(sourcemaps.init())
      .pipe(
        babel({
          presets: ["@babel/preset-env"],
        })
      )
      .pipe(concat(JS_BUNDLE_NAME))
      .pipe(terser())
      .pipe(sourcemaps.write(PROJECT_PATHS.sameLocation))
      // .pipe(notify("JavaScript is DONE!"))
      .pipe(gulp.dest(PROJECT_PATHS.scriptDist))
  );
};

/* Images Task */
const ImagesTask = () => {
  return gulp
    .src(PROJECT_PATHS.allImages)
    .pipe(
      imagemin(
        [
          imagemin.gifsicle({ interlaced: true }),
          imagemin.mozjpeg({ quality: 75, progressive: true }),
          imagemin.optipng({ optimizationLevel: 2 }),
          imagemin.svgo({
            plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
          }),
        ],
        { verbose: true }
      )
    )
    .pipe(gulp.dest(PROJECT_PATHS.imagesDist));
};

/*
  ---------------
  | Extra Tasks |
  ---------------
*/

/* Clean Dist and Compressed Folders*/
const cleanTask = async () => {
  return del.sync(["dist/**", "compressed/**"], { force: true });
};

/* Compress All files in The Dist Folder */
const COMPRESS_BUNDLE_NAME = "dist.zip";
const compressTask = () => {
  return gulp
    .src(PROJECT_PATHS.allDist)
    .pipe(zip(COMPRESS_BUNDLE_NAME))
    .pipe(gulp.dest(PROJECT_PATHS.compressedLocation));
  // .pipe(notify("Zipping is DONE!"));
};

/* Upload to file to the server using FTP */
const deployFTPTask = () => {
  const connection = ftp.create({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.USER_PASSWORD,
    parallel: 10,
  });

  // Custom files to upload
  // const filesToUpload = ["src/**", "css/**", "js/**", "fonts/**", "index.html"];

  const filesToUpload = ["dist/**/*.*"]; // All files inside dist

  // using base = '.' will transfer everything to /public_html correctly
  // turn off buffering in gulp.src for best performance

  return gulp
    .src(filesToUpload, { base: ".", buffer: false })
    .pipe(connection.newer("/public_html")) // only upload newer files
    .pipe(connection.dest("/public_html"));
};

const BROWSERS = {
  windows: {
    chrome: "google chrome",
    firefox: "firefox",
    "firefox-dev": "firefox-developer-edition",
    brave: "breve",
    all: ["breve", "firefox", "google chrome"],
  },
  linux: {
    chrome: "google chrome",
    firefox: "firefox",
    "firefox-dev": "firefox-developer-edition",
    brave: "breve",
    all: ["breve", "firefox", "google chrome"],
  },
  mac: {
    chrome: "google chrome",
    firefox: "firefox",
    "firefox-dev": "firefox-developer-edition",
    brave: "breve",
    all: ["breve", "firefox", "google chrome"],
  },
};

/* Watch Changes */
const watch = () => {
  // Init BrowserSyn
  browserSync.init({
    server: {
      baseDir: PROJECT_PATHS.dist,
    },
    // proxy: "your-proxy",
    notify: false, // Don't show any notifications in the browser.
    browser: BROWSERS.linux.firefox,
  });

  // Tasks to be watched
  gulp
    .watch(PROJECT_PATHS.allHTML, gulp.series("HTMLTask"))
    .on("change", browserSync.reload);
  gulp.watch(PROJECT_PATHS.allSASS, gulp.series("SASSTask"));
  gulp
    .watch(PROJECT_PATHS.allJS, gulp.series("JSTask"))
    .on("change", browserSync.reload);
  // gulp.watch(PROJECT_PATHS.allDist, gulp.series("compressTask"));
};

exports.HTMLTask = HTMLTask;
exports.SASSTask = SASSTask;
exports.JSTask = JSTask;
(exports.ImagesTask = ImagesTask), (exports.watch = watch);
exports.compressTask = compressTask;
exports.build = gulp.series(cleanTask, HTMLTask, SASSTask, JSTask, ImagesTask);
exports.start = gulp.series(HTMLTask, SASSTask, JSTask, ImagesTask, watch);
exports.compress = gulp.series(
  cleanTask,
  HTMLTask,
  SASSTask,
  JSTask,
  ImagesTask,
  compressTask
);
