const router = require("express").Router();
router.get("/", (_, res) => res.send("Poka API v2"))
router.use("/playlist", require("./playlist"));
router.use("/user", require("./user"));
router.use("/pin", require("./pin"));
router.use("/record", require("./record"));

router.use("/playlists", require("./playlists"));
router.use("/users", require("./users"));
module.exports = router;