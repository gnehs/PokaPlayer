const router = require("express").Router();
router.get("/", (_, res) => res.send("Poka API v2"))
router.use("/playlist", require("./playlist"));
router.use("/user", require("./user"));
module.exports = router;