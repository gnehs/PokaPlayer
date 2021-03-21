const router = require("express").Router();
const User = require("../db/user");
const { addLog } = require("../db/log");
router.get("/", async (req, res) => {
    res.send("Poka API v2 Users")
})
router.get("/list", async (req, res) => {
    let userList = await User.getAllUsers()
    res.json(userList)
})
router.post("/create", async (req, res) => {
    res.json(await User.create(req.body))
})
router.post("/change-password", async (req, res) => {
    res.json(await User.changePasswordAdmin(req.body._id, req.body.password))
    addLog({
        level: "info",
        type: "user",
        event: "Password changed",
        user: req.session.user,
        discription: `Admin changed {${req.body._id}}'s password.`
    })
})
router.post("/delete", async (req, res) => {
    if (req.body._id != req.session.user) {
        res.json(await User.deleteUserById(req.body._id))
        addLog({
            level: "info",
            type: "user",
            event: "User deleted",
            user: req.session.user,
            discription: `Admin deleted {${req.body._id}}.`
        })
    } else {
        res.status(406).send('You CAN NOT delete yourself')
    }
})
module.exports = router;