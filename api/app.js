const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const http = require('http');
const https = require('https');
const fs = require('fs');

const privateKey  = fs.readFileSync('/etc/letsencrypt/live/{{{YOUR SITE HERE USING LETS ENCRYPT}}/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/{{{YOUR SITE HERE USING LETS ENCRYPT}}/fullchain.pem', 'utf8');

const credentials = {key: privateKey, cert: certificate};

/**
 * Connect to MongoDB.
 */
mongoose.Promise = global.Promise;
mongoose.connect('{{{YOUR CONNECTION STRING HERE}}}')
    .then(() =>  console.log('connection succesful'))
    .catch((err) => console.error("wtf is this error" + err));

/**
 * Controllers (route handlers).
 */
const userController = require('./controllers/user');
const auth = require('./config/auth');

/**
 * Create Express server.
 */
const app = express();

/**
 * Express configuration.
 */
let httpServer = http.createServer(app);
let httpsServer = https.createServer(credentials, app);

app.use(express.static(__dirname + '/public'));
app.use(compression());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/**
 * Allow CORS all routes.
 */
app.use('/', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Expose-Headers', 'Content-Length');
    res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
    next();
});

/**
 * Primary app routes.
 */
app.get('/isLoggedIn', auth.isGetAuthenticated, userController.isLoggedIn);
app.post('/doRegister', userController.doRegister);
app.post('/doSignIn', userController.doSignIn);
app.get('/getProfile', auth.isGetAuthenticated, userController.getProfile);
app.post('/doManageProfile', auth.isPostAuthenticated, userController.doManageProfile);
app.get('/forgotPassword', userController.forgotPassword);
app.post('/doChangePassword', userController.doChangePassword);
/**
 * Start Express server.
 */
httpServer.listen(8080, () => {
    console.log('http server running.')
});
httpsServer.listen(8443, () => {
    console.log('https server running. ')
});

module.exports = app;