const router = require("express").Router();
const User = require("../db/user");
const { addLog } = require("../db/log");
router.get("/", async (req, res) => {
    let result = await User.getUserById(req.session.user)
    if (result)
        result.password = null
    res.json(result)
})
router.post("/login/", async (req, res) => {
    let { username, password } = req.body
    let u = await User.login({ username, password })
    if (u.success) {
        req.session.user = u.user
        addLog({
            level: "info",
            type: "user",
            event: "Login",
            user: req.session.user,
            description: `User {${req.session.user}} login from ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`
        })
    } else {
        addLog({
            level: "warn",
            type: "user",
            event: "Login",
            description: `User ${username} login failed from ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`
        })
    }
    res.json(u)
})
router.get("/logout/", (req, res) => {
    // 登出
    if (req.session?.user) {
        addLog({
            level: "info",
            type: "user",
            event: "Logout",
            user: req.session.user,
            description: `User {${req.session.user}} logout`
        })
    }
    req.session.destroy(err => {
        if (err) {
            console.error(err);
        }
        res.clearCookie();
        res.json({ success: true })
    });
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
        description: `User {${req.session.user}} changed name to "${req.body.n}".`
    })
})
router.post("/username/", async (req, res) => {
    let result = await User.changeUsername(req.session.user, req.body.n)
    res.json(result)
    if (result.success) {
        addLog({
            level: "info",
            type: "user",
            event: "Username changed",
            user: req.session.user,
            description: `User {${req.session.user}} changed username to "${req.body.n}".`
        })
    }
})
router.post("/password/", async (req, res) => {
    res.json(await User.changePassword(req.session.user, req.body.oldpassword, req.body.password))
    addLog({
        level: "info",
        type: "user",
        event: "Password changed",
        user: req.session.user,
        description: `User {${req.session.user}} password changed.`
    })
})
module.exports = router;