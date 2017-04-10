var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
// Added by me
var session = require('express-session');

var index = require('./routes/index');
var login = require('./routes/login');
var start = require('./routes/start');

var isUser = require('./policies');
// ---

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Added by me
app.use(session({
  secret: 'doesnt matter for this project',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Middleware to add fixed vars to response
app.use(function (req, res, next) {
    res.locals = {
        username: req.session.username,
        userdata: req.session.userdata
    };
    next();
});

// --------------------  Custom setup  ---------------------
// ArrowDB key from where you want to extract the data
var keys = require("./keys");
var ArrowDB = require('arrowdb');
global.arrowDBApp = new ArrowDB(keys.ARROW.APP_KEY);

// Parse server config where you want to import the extracted data
var Parse = require('parse/node');
// APP_KEY, JS_KEY
Parse.initialize(keys.PARSE.APP_KEY, keys.PARSE.JS_KEY);
Parse.serverURL = keys.PARSE.SERVER_URL;
//global.Parse = Parse;
// ------------------  End Custom setup  --------------------

// Routing
app.use('/', index);
app.use('/login', login);
app.use('/logout', isUser, login);
app.use('/start', isUser, start);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    console.log(err);
    res.render('error', {
        page: 'Error',
        errorMsg: err.message
    });
});

module.exports = app;
