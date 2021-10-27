const router = require("express").Router();
const packageData = require("../package.json"); // package
const jsonfile = require('jsonfile')
const git = require("simple-git/promise")(__dirname);
const config = jsonfile.readFileSync("./config.json")
router.get("/", async (req, res) => {
    let result = {
        uid: req.session.user,
        version: packageData.version,
        debug: config.PokaPlayer.debug
    }
    if (config.PokaPlayer.debug) {
        result['debugString'] = (await git.raw(["rev-parse", "--short", "HEAD"])).slice(0, -1)
    }
    res.json(result)
});
module.exports = router;