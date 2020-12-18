const mongoose = require('mongoose')
const RecordSchema = new mongoose.Schema({
    name: String,
    cover: String,
    url: String,
    artist: String,
    artistId: String,
    album: String,
    albumId: String,
    songId: String,
    source: String,
    userId: String,
    playedTimes: { type: [Date], index: true },
});
const model = mongoose.model('Record', RecordSchema)
async function addRecord({
    name,
    cover,
    url,
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
    if (!recordData) {
        recordData = new model({
            name,
            cover,
            url,
            artist,
            artistId,
            album,
            albumId,
            songId,
            source,
            userId
        })
    }
    recordData.playedTimes.push(Date.now())
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
async function fetchListenedRecently(userId) {
    let res = (await model.find({ userId }))
    let deepcopy = x => JSON.parse(JSON.stringify(x))
    return deepcopy(res)
        .map(x => {
            x.lastListened = x.playedTimes[x.playedTimes.length - 1]
            if (!x.name) x.name = x.title // fixed name 
            x.url = `/pokaapi/song/?moduleName=${x.source}&songId=${x.songId}`
            x.id = x.songId
            return x
        })
        .sort((a, b) => Date.parse(b.lastListened) - Date.parse(a.lastListened))
        .filter((_, i) => i < 25)
}
module.exports = {
    model,
    addRecord,
    clearUserRecords,
    countRecords,
    countUserRecords,
    fetchListenedRecently
}