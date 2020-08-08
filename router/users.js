const router = require("express").Router();
const User = require("../db/user"); // userDB
const { logErr } = require("../log");
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
})
router.post("/delete", async (req, res) => {
    if (req.body._id != req.session.user) {
        res.json(await User.deleteUserById(req.body._id))
    } else {
        res.status(406).send('You CAN Not delete yourself')
    }
})
module.exports = router;