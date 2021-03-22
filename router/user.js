const router = require("express").Router();
const User = require("../db/user");
const { addLog } = require("../db/log");
router.get("/", async (req, res) => {
    let result = await User.getUserById(req.session.user)
    if (result)
        result.password = null
    res.json(result)
})
router.get("/setting/", async (req, res) => {
    res.json(await User.getSetting(req.session.user))
})
router.post("/setting/", async (req, res) => {
    res.json(await User.changeSetting(req.session.user, req.body.n))
})
router.post("/name/", async (req, res) => {
    res.json(await User.changeName(req.session.user, req.body.n))
    addLog({
        level: "info",
        type: "user",
        event: "Name changed",
        user: req.session.user,
        discription: `User {${req.session.user}} changed name to "${req.body.n}".`
    })
})
router.post("/username/", async (req, res) => {
    res.json(await User.changeUsername(req.session.user, req.body.n))
    addLog({
        level: "info",
        type: "user",
        event: "Username changed",
        user: req.session.user,
        discription: `User {${req.session.user}} changed username to "${req.body.n}".`
    })
})
router.post("/password/", async (req, res) => {
    res.json(await User.changePassword(req.session.user, req.body.oldpassword, req.body.password))
    addLog({
        level: "info",
        type: "user",
        event: "Password changed",
        user: req.session.user,
        discription: `User {${req.session.user}} password changed.`
    })
})
module.exports = router;