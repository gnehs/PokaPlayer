const router = require("express").Router();
const recordDB = require('../db/record')
router.get("/", async (req, res) => {
    res.send("Poka API v2 Record")
})
router.post("/add", async (req, res) => {
    let {
        name,
        artist,
        artistId,
        album,
        albumId,
        source,
        originalCover: cover,
        id: songId
    } = req.body
    res.json(await recordDB.addRecord({
        name,
        artist,
        artistId,
        album,
        albumId,
        source,
        cover,
        songId,
        userId: req.session.user
    }))
})
router.get("/count", async (req, res) => {
    res.json(await recordDB.countRecords())
})
router.get("/count/user", async (req, res) => {
    res.json(await recordDB.countUserRecords(req.session.user))
})
router.post("/clear", async (req, res) => {
    res.json(await recordDB.clearUserRecords(req.session.user))
})
module.exports = router;