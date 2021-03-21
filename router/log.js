const router = require("express").Router();
const Log = require("../db/log"); // userDB

router.get("/", async (req, res) => {
    let { page = 0, limit = 50 } = req.query;
    res.json(await Log.getLogs(limit, page))
})
router.post("/clear", async (req, res) => {
    try {
        await Log.clearLogs()
        res.json({
            success: true, error: null
        })
    } catch (e) {
        res.json({
            success: false, error: e
        })
    }

})

module.exports = router;