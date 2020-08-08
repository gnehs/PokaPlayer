const router = require("express").Router();
const Pin = require("../db/pin"); // pin db
router.get("/", async (req, res) => {
    res.send("Poka API v2 Pin")
})
router.post("/pins", async (req, res) => {
    let pinRes = await Pin.getPins(req.session.user)
    res.json(pinRes)
})
router.post("/pin", async (req, res) => {
    let {
        name,
        artist,
        id,
        type,
        cover,
        source } = req.body
    let owner = req.session.user
    let pinRes = await Pin.addPin({
        name,
        artist,
        id,
        type,
        cover,
        source,
        owner
    })
    res.json(pinRes)
})
router.post("/ispinned", async (req, res) => {
    let { id, type, source } = req.body
    let owner = req.session.user
    let pinRes = await Pin.isPinned({
        id,
        type,
        source,
        owner
    })
    res.json(!!pinRes)
})
router.post("/unpin", async (req, res) => {
    let { id, type, source } = req.body
    let owner = req.session.user
    let pinRes = await Pin.unPin({
        id,
        type,
        source,
        owner
    })
    res.json(pinRes)
})
module.exports = router;