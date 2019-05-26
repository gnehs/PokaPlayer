const fs = require("fs"); //檔案系統
const pokaLog = require("../log"); // 可愛控制台輸出
/*=======================*/
/*       mongoose        */
/*=======================*/
const mongoose = require('mongoose');
let config
try {
    config = require('../config.json')
} catch (e) {
    config = false
}
const db = mongoose.connection;
mongoose.Promise = global.Promise;
if (config && config.mongodb.enabled) {
    pokaLog.log('INFO', 'mongodb enabled')
    mongoose.connect(config.mongodb.uri, {
        useNewUrlParser: true
    });
} else {
    pokaLog.log('INFO', 'mongodb disabled')
}
/*=======================*/
/*       session         */
/*=======================*/
const _session = require('express-session');
const sessionStore = (config && config.mongodb.enabled) ? new(require('connect-mongo')(_session))({
    mongooseConnection: db
}) : new(require("session-file-store")(_session))({
    reapInterval: -1
})
const session = _session({
    secret: config ? config.PokaPlayer.sessionSecret : "no config.json",
    resave: true,
    saveUninitialized: true,
    store: sessionStore,
    cookie: {
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 60 * 1000 * 24 * 7)
    }
})

module.exports = {
    db: (config && config.mongodb.enabled) ? db : false,
    session
}