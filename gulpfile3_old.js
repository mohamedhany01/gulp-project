const gulp = require("gulp"),
  concat = require("gulp-concat"),
  sass = require("gulp-sass")(require("sass")),
  prefixer = require("gulp-autoprefixer"),
  sourcemaps = require("gulp-sourcemaps"),
  terser = require("gulp-terser"),
  del = require("del"),
  notify = require("gulp-notify"),
  zip = require("gulp-zip"),
  ftp = require("vinyl-ftp"),
  browserSync = require("browser-sync").create();

// Clear dist folder
gulp.task("clean", () => {
  return del("dist/**", { force: true });
});

/*
	A simple task
		take index html and move it from src to dist folder
*/
gulp.task("html-task", () => {
  return gulp.src("src/index.html").pipe(gulp.dest("dist"));
});

/*
	A pug task
*/

gulp.task("pug-html", () => {
  return gulp
    .src("src/index.pug")
    .pipe(
      pug({
        //   Don't compress HTML file
        pretty: true,
      })
    )
    .pipe(gulp.dest("dist"));
});

/*
	A css task
		take both files "only two files" of CSS form src to dist
*/
gulp.task("two-css", () => {
  return gulp
    .src(["src/css/style.css", "src/css/header.css"])
    .pipe(gulp.dest("dist/css"));
});

/*
	A css task
		take all files of CSS form src to dist
*/
gulp.task("all-css", () => {
  return gulp.src("src/css/*.css").pipe(gulp.dest("dist/css"));
});

/*
	A full css task
		add prefix to all css files and concatenate to one file
	
*/
gulp.task("full-css", () => {
  return gulp
    .src("src/css/*.css")
    .pipe(prefixer("last 5 versions"))
    .pipe(concat("main.css"))
    .pipe(gulp.dest("dist/css"));
});

/*
	A full sass task
		add convert sass to css and add prefix to all sass files and concatenate to one file
	
*/
gulp.task("full-sass", () => {
  return (
    gulp
      .src("src/style/main.scss")
      .pipe(sass({ outputStyle: "compressed" }))
      .pipe(prefixer("last 5 versions"))
      /*
			If you have 3rd part library that is a css
			you can use concat() function "you can use concat many time"
		*/
      //   .pipe(concat("lib-name.css"))
      .pipe(gulp.dest("dist/css"))
    // .pipe(
    //   open({
    //     uri: "localhost:8020",
    //     app: "firefox-developer-edition",
    //   })
    // )
  );
});

/*
  A watch task
    watch files changes
*/
gulp.task("watch", () => {
  gulp.watch("src/index.html", gulp.series("html-task"));
  gulp.watch("src/style/**/*.scss", gulp.series("full-sass"));
});

// gulp.task(
//   "default",
//   gulp.series(["html-task", "full-sass", "watch"])
// );

/* 
  Gulp v4
*/

require("dotenv").config();

const cleanDist = () => {
  return del.sync(["dist/**", "dist-compressed/**"], { force: true });
};

const compressDist = () => {
  return gulp
    .src("dist/**/*.*")
    .pipe(zip("dist.zip"))
    .pipe(gulp.dest("dist-compressed"))
    .pipe(notify("Zipping is DONE!"));
};

const ftpDeploy = () => {
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

const moveHTMLToDist = () => {
  return gulp.src("src/index.html").pipe(gulp.dest("dist"));
  // .pipe(notify("HTML is DONE!"));
};

const compileCSSAndMoveToDist = () => {
  return gulp
    .src("src/css/*.css")
    .pipe(prefixer("last 5 versions"))
    .pipe(concat("main.css"))
    .pipe(gulp.dest("dist/style"));
};

const compileSASSAndMoveToDist = () => {
  return (
    gulp
      .src("src/style/main.scss")
      .pipe(sourcemaps.init())
      .pipe(sass({ outputStyle: "compressed" }).on("error", sass.logError))
      .pipe(prefixer("last 5 versions"))
      /*
			If you have 3rd part library that is a css
			you can use concat() function "you can use concat many time"
		*/
      //   .pipe(concat("lib-name.css"))
      .pipe(sourcemaps.write("."))
      .pipe(gulp.dest("dist/style"))
      // .pipe(notify("SASS is DONE!"))
      .pipe(browserSync.stream())
  );
};

const compileJSAndMoveToDist = () => {
  return (
    gulp
      .src("src/js/*.js")
      .pipe(sourcemaps.init())
      .pipe(concat("main.js"))
      .pipe(terser())
      .pipe(sourcemaps.write("."))
      // .pipe(notify("JavaScript is DONE!"))
      .pipe(gulp.dest("dist/scripts"))
  );
};

/*
	An excluded task
		exclude a file or more than file
*/
// const excludeJSAndMoveToDist = () => {
//   return (
//     gulp
//       .src(["src/js/*.js", "!src/js/excluded-file.js"])
//       .pipe(sourcemaps.init())
//       .pipe(concat("main.js"))
//       .pipe(terser())
//       .pipe(sourcemaps.write("."))
//       .pipe(gulp.dest("dist/scripts"))
//   );
// };

const watchChanges = () => {
  browserSync.init({
    server: {
      baseDir: "./dist",
    },
    // proxy: "your-proxy",
    notify: false, // Don't show any notifications in the browser.
    browser: ["firefox-developer-edition"], // Open in a browser or array of browsers
  });

  gulp.watch("src/style/**/*.scss", gulp.series("compileSASSAndMoveToDist"));
  gulp
    .watch("src/*.html", gulp.series("moveHTMLToDist"))
    .on("change", browserSync.reload);
  gulp
    .watch("src/js/**/*.js", gulp.series("compileJSAndMoveToDist"))
    .on("change", browserSync.reload);
  gulp.watch("dist/**/*.*", gulp.series("compressDist"));

  // Upload to server on refresh
  // gulp.watch("dist/**/*.*", gulp.series("ftpDeploy"));
};

exports.cleanDist = cleanDist;
exports.compressDist = compressDist;
exports.ftpDeploy = ftpDeploy;
exports.moveHTMLToDist = moveHTMLToDist;
exports.compileSASSAndMoveToDist = compileSASSAndMoveToDist;
exports.compileJSAndMoveToDist = compileJSAndMoveToDist;
exports.watchChanges = watchChanges;

/* 
  Default task
  "It's a task which running when no task is defined"
  ex: gulp
*/
// https://gulpjs.com/docs/en/getting-started/creating-tasks/
