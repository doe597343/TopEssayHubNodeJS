var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var fileUpload = require('express-fileupload');
var routes = require('./routes/routes');
var app = express();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());
app.use(cors());
app.use('/', routes);
app.use(function (request, response, next) {
  response.status(404).json({ status: false, message: "404 Error" });
});
app.use(function (err, request, response, next) {
  response.status(500).json({ status: false, message: "500 Error" });
});
app.listen(process.env.PORT || 3000, () => {
  console.log(`App listening at ${process.env.PORT}`);
})