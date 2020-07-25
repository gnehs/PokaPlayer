const router = require("express").Router();
router.get("/", async (req, res) => {
    res.send("Poka API v2 User")
})
module.exports = router;