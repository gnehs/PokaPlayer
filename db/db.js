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
mongoose.connect(config.mongodb, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

/*=======================*/
/*       session         */
/*=======================*/
const _session = require('express-session');
const sessionStore = new(require('connect-mongo')(_session))({
    mongooseConnection: db
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
    db,
    session
}