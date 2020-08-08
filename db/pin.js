const mongoose = require('mongoose')
const PinSchema = new mongoose.Schema({
    name: String,
    artist: String,
    id: String,
    type: String,
    cover: String,
    source: String,
    owner: String
});
const model = mongoose.model('Pin', PinSchema)
async function addPin({
    name,
    artist,
    id,
    type,
    cover,
    source,
    owner
}) {
    let pin = new model({
        name,
        artist,
        id,
        type,
        cover,
        source,
        owner
    })
    await pin.save()
    return ({
        success: true,
        pin
    })
}
async function unPin({
    id,
    type,
    source,
    owner
}) {
    try {
        await model.deleteOne({
            id,
            type,
            source,
            owner
        })
        return ({
            success: true
        })
    }
    catch (e) {
        return ({
            success: false,
            error: e
        })
    }
}
async function isPinned({
    id,
    type,
    source,
    owner
}) {
    return await model.findOne({
        id,
        type,
        source,
        owner
    })
}
async function getPins(userId) {
    return (await model.find({ owner: userId }))
}
module.exports = {
    getPins,
    addPin,
    unPin,
    isPinned,
    model,
}