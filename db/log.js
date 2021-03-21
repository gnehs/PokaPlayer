const mongoose = require('mongoose')
const LogSchema = new mongoose.Schema({
    level: String,
    type: String,
    event: String,
    user: String,
    discription: String,
    time: {
        type: Date,
        default: Date.now
    },
});
const model = mongoose.model('Log', LogSchema)
// type:
// - user (login, logout)
// - update
// - system
// - error

// level:
// - info
// - warn
// - error 
async function addLog({ level, type, event, user = "System", discription }) {
    await (new model({
        level, type, event, user, discription
    })).save(err => err ? console.error(err) : null)
}
async function getLogs(limit = 100, page = 0) {
    return await model.find({}).limit(limit).sort('-time').skip(limit * page)
}
async function clearLogs() {
    return await model.deleteMany({})
}

module.exports = {
    addLog,
    getLogs,
    clearLogs
}