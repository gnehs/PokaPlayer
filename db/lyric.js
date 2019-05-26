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
    let data
    data = await getLyric({
        songId,
        source
    })
    if (data)
        data = {
            title,
            artist,
            songId,
            source,
            lyric
        }
    else
        data = new model({
            title,
            artist,
            songId,
            source,
            lyric
        })
    data.save()
    return ({
        success: true,
        data
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