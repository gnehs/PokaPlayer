const mongoose = require('mongoose')
const LyricSchema = new mongoose.Schema({
    title: String,
    artist: String,
    songId: String,
    source: String,
    lyric: String
});
LyricSchema.index({ title: 'text', artist: 'text' })
const model = mongoose.model('Lyric', LyricSchema)
async function saveLyric({
    title,
    artist,
    songId,
    source,
    lyric
}) {
    let lyricData
    lyricData = await model.findOne({
        songId,
        source
    })
    if (lyricData) {
        lyricData.title = title
        lyricData.artist = artist
        lyricData.lyric = lyric
    } else {
        lyricData = new model({
            title,
            artist,
            songId,
            source,
            lyric
        })
    }
    await lyricData.save(err => err ? console.error(err) : null)
    return ({
        success: true,
        data: lyricData
    })
}
async function getLyric(data) {
    let result = await model.findOne(data, err => err ? console.error(err) : null)
    if (result)
        return result.lyric
    else
        return false
}
async function searchLyric(keyword) {
    let result = await model.find({ $text: { $search: keyword } }, err => err ? console.error(err) : null).limit(10)
    return result
}
module.exports = {
    model,
    saveLyric,
    getLyric,
    searchLyric
}