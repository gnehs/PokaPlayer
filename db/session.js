const mongoose = require('mongoose')
const model = mongoose.model('Session', new mongoose.Schema({}))
async function clearAll() {
    return await model.deleteMany({})
}
module.exports = {
    model,
    clearAll
}