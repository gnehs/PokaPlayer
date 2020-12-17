const mongoose = require('mongoose')
const RecordSchema = new mongoose.Schema({
    title: String,
    cover: String,
    artist: String,
    artistId: String,
    album: String,
    albumId: String,
    songId: String,
    source: String,
    userId: String,
    times: Number
});
const model = mongoose.model('Record', RecordSchema)
async function addRecord({
    title,
    cover,
    artist,
    artistId,
    album,
    albumId,
    songId,
    source,
    userId
}) {
    let recordData
    recordData = await model.findOne({
        songId,
        source,
        userId
    })
    if (recordData) {
        recordData.times += 1
    } else {
        recordData = new model({
            title,
            cover,
            artist,
            artistId,
            album,
            albumId,
            songId,
            source,
            userId,
            times: 1
        })
    }
    await recordData.save(err => err ? console.error(err) : null)
    return ({
        success: true,
        data: recordData
    })
}
async function clearUserRecords(userId) {
    return await model.deleteMany({ userId })
}
async function countRecords() {
    return (await model.countDocuments({}))
}
async function countUserRecords(userId) {
    return (await model.countDocuments({ userId }))

}
module.exports = {
    model,
    addRecord,
    clearUserRecords,
    countRecords,
    countUserRecords
}