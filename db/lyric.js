const mongoose = require('mongoose')
const LyricSchema = new mongoose.Schema({
    title: String,
    artist: String,
    songId: String,
    source: String,
    lyric: String
});
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
    await lyricData.save()
    return ({
        success: true,
        data: lyricData
    })
}
async function getLyric(data) {
    let result = await model.findOne(data)
    if (result)
        return result.lyric
    else
        return false
}
module.exports = {
    model,
    saveLyric,
    getLyric
}