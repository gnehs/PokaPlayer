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
mongoose.set('useCreateIndex', true)
mongoose.connect(config.mongodb, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

/*=======================*/
/*       session         */
/*=======================*/
const _session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(_session);
const store = new MongoDBStore({
    uri: config.mongodb,
    collection: 'Sessions'
});
const session = _session({
    secret: config ? config.PokaPlayer.sessionSecret : "no config.json",
    resave: true,
    saveUninitialized: true,
    store,
    cookie: {
        httpOnly: true
    }
})

module.exports = {
    db,
    session
}