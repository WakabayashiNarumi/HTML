// gulpプラグイン読み込み
// ------------------------------------------
var gulp = require('gulp'),
  // CSS
  sass = require('gulp-sass'),
  postcss = require('gulp-postcss'),
  autoprefixer = require('autoprefixer'),
  sassGlob = require('gulp-sass-glob'),
  // cssWring = require('csswring'),

  // HTML
  pug = require('gulp-pug'),
  fs = require('fs'),
  path = require('path'),
  data = require('gulp-data'),
  plumber = require('gulp-plumber'),
  notify = require('gulp-notify'),

  // IMG
  imagemin = require('gulp-imagemin'),
  imageminPngquant = require('imagemin-pngquant'),
  imageminMozjpeg = require('imagemin-Mozjpeg'),

  // JS
  babel = require('gulp-babel'),

  // browserSync
  browserSync = require('browser-sync').create();


// ルートディレクトリ
// ------------------------------------------
var rootDir = 'src/';
var rootDirDist = 'dist/';

// 開発用ディレクトリ
// ------------------------------------------
var src = {
  'root': rootDir,
  'sass': [rootDir + 'assets/' + 'scss/**/*.scss'],
  'pug': [rootDir + 'pug/**/*.pug', '!' + rootDir + 'pug/**/_*.pug'],
  'json': [rootDir + 'pug/_data/'],
  'img': [rootDir + 'assets/' + 'img/**/*'],
  'js': [rootDir + 'assets/' + 'js/**/*'],
};

// 公開用ディレクトリ
// ------------------------------------------
var release = {
  'html': "dist/",
  'css': "dist/assets/css/",
  'js': "dist/assets/js/",
  'img': "dist/assets/img/",
};

// setting: Sass Options
// var postcssOption = [cssWring]
var postcssOption = [autoprefixer]

var browserSyncOption = {
  server: [rootDirDist]
}

// setting: img Options
var imageminOption = [
  imageminPngquant({ quality: [.65, .85] }),
  imageminMozjpeg({ quality: 80 }),
  imagemin.gifsicle(),
  imagemin.jpegtran(),
  imagemin.optipng(),
  imagemin.svgo()
]

/***************************************************************************
* scss コンパイル
***************************************************************************/
gulp.task('sass', function () {
  return gulp
    .src(src.sass)
    .pipe(sassGlob())
    .pipe(sass())
    .pipe(postcss(postcssOption))
    .pipe(gulp.dest(release.css))
});

/***************************************************************************
* pug コンパイル
***************************************************************************/
gulp.task('pug', function () {
  var locals = {
    'site': JSON.parse(fs.readFileSync(src.json + 'site.json'))
  }
  return gulp
    .src(src.pug)
    // コンパイルエラーを通知
    .pipe(plumber({ errorHandler: notify.onError("Error:<%= error.message %>") }))
    // 各ページごとの`/`を除いたルート相対パスを取得
    .pipe(data(function (file) {
      locals.relativePath = path.relative(file.base, file.path.replace(/.pug$/, '.html'));
      return locals;
    }))
    .pipe(pug({
      // JSONファイルとルート相対パスの情報を渡す
      locals: locals,
      // Pugファイルのルートディレクトリを指定する
      basedir: 'src',
      // Pugファイルの整形。
      pretty: true
    }))
    // .pipe(pug(pugOptions))
    .pipe(gulp.dest(release.html))
});

/***************************************************************************
* JS　トランスパイル
***************************************************************************/
gulp.task('babel', function () {
  return gulp
    .src(src.js)
    .pipe(babel({
      presets: ['@babel/preset-env']
    }))
    .pipe(gulp.dest(release.js))
})

/***************************************************************************
* 画像圧縮
***************************************************************************/
gulp.task('imagemin', () => {
  return gulp
    .src(src.img)
    .pipe(imagemin(imageminOption))
    .pipe(gulp.dest(release.img))
})

/***************************************************************************
* ローカルサーバー起動
***************************************************************************/
gulp.task('serve', (done) => {
  browserSync.init(browserSyncOption)
  done()
});

/***************************************************************************
* ファイルの監視
***************************************************************************/
gulp.task('watch', (done) => {
  var browserReload = (done) => {
    browserSync.reload()
    done()
  }
  gulp.watch(src.sass, gulp.series('sass'));
  gulp.watch(src.pug, gulp.series('pug'));
  // gulp.watch(src.img, gulp.series('imagemin'));
  gulp.watch(src.js, gulp.series('babel'));
  gulp.watch([rootDirDist], browserReload);
});

gulp.task('default', gulp.series('serve', 'watch'));