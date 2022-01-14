const mongoose = require('mongoose')
const LogSchema = new mongoose.Schema({
    level: String,
    type: String,
    event: String,
    user: String,
    description: String,
    time: {
        type: Date,
        default: Date.now
    },
});
const model = mongoose.model('Log', LogSchema)
// type:
// - user (login, logout)
// - system

// level:
// - info
// - warn
// - error 
async function addLog({ level, type, event, user = "System", description }) {
    await (new model({
        level, type, event, user, description
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
    clearLogs,
    model
}