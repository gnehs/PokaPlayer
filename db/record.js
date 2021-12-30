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
async function getReview(userId, year = 2021) {
    let res = {}
    res.songs = await model.aggregate([
        {
            $match: {
                userId: userId.toString(), playedTimes: {
                    $gte: new Date(year, 0, 1),
                    $lt: new Date(year + 1, 0, 1)
                }
            }
        },
        { $addFields: { count: { $size: '$playedTimes' } } },
        { $sort: { count: -1 } },
        { $limit: 16 }
    ])
    res.songs = res.songs.map(x => {
        if (!x.name) x.name = x.title // fixed name 
        x.url = `/pokaapi/song/?moduleName=${x.source}&songId=${x.songId}`
        x.id = x.songId
        return x
    })
    res.artists = await model.aggregate([
        {
            $match: {
                userId: userId.toString(), playedTimes: {
                    $gte: new Date(year, 0, 1),
                    $lt: new Date(year + 1, 0, 1)
                }
            }
        },
        { $addFields: { count: { $size: '$playedTimes' } } },
        {
            $group: {
                _id: "$artistId",
                count: { $sum: "$count" },
                name: { "$first": "$artist" },
                id: { "$first": "$artistId" },
                cover: { "$first": "$cover" },
                source: { "$first": "$source" }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 12 }
    ])
    res.albums = await model.aggregate([
        {
            $match: {
                userId: userId.toString(),
                playedTimes: {
                    $gte: new Date(year, 0, 1),
                    $lt: new Date(year + 1, 0, 1)
                }
            }
        },
        { $addFields: { count: { $size: '$playedTimes' } } },
        {
            $group: {
                _id: "$albumId",
                count: { $sum: "$count" },
                name: { "$first": "$album" },
                id: { "$first": "$albumId" },
                artist: { "$first": "$artist" },
                cover: { "$first": "$cover" },
                source: { "$first": "$source" }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 12 }
    ])
    res.days = await model.aggregate([
        {
            $match: {
                userId: userId.toString(), playedTimes: {
                    $gte: new Date(year, 0, 1),
                    $lt: new Date(year + 1, 0, 1)
                }
            }
        },
        { $addFields: { count: { $size: '$playedTimes' } } },
        { $unwind: "$playedTimes" },
        { $addFields: { date: { $dateToString: { format: "%Y-%m-%d", date: "$playedTimes" } } } },
        { $group: { _id: "$date", count: { $sum: 1 }, } },
        { $sort: { count: -1 } },
        { $limit: 12 }
    ])
    res.total = await model.countDocuments({
        userId,
        playedTimes: {
            $gte: new Date(year, 0, 1),
            $lt: new Date(year + 1, 0, 1)
        }
    })
    return res
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
async function getAllRecords() {
    return (await model.find({}))
}
module.exports = {
    model,
    addRecord,
    clearUserRecords,
    countRecords,
    countUserRecords,
    fetchListenedRecently,
    getReview,
    getAllRecords,
}