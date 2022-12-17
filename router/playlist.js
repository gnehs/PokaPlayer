const router = require("express").Router();
const playlistDB = require('../db/playlist')
const userDB = require('../db/user')
const pokaLog = require("../log"); // 可愛控制台輸出
router.get("/", async (req, res) => {
    res.send("Poka Playlist API")
})
async function checkPlaylistOwner(playlistId, userId) {
    let playlist = await playlistDB.getPlaylistById(playlistId)
    return playlist.owner == userId
}
router.post("/create", async (req, res) => {
    let { name } = req.body
    if (!name) {
        res.status(400).send("name is required")
        return
    }
    res.json(await playlistDB.createPlaylist(name, req.session.user))
})
router.post("/del", async (req, res) => {
    let { id } = req.body
    if (await checkPlaylistOwner(id, req.session.user))
        res.json(await playlistDB.delPlaylist(id))
    else
        res.json({
            success: false,
            error: 'Permission Denied'
        })

})
router.post("/edit", async (req, res) => {
    let { data, id } = req.body
    if (await checkPlaylistOwner(id, req.session.user))
        res.json(await playlistDB.editPlaylist(id, data))
    else
        res.json({
            success: false,
            error: 'Permission Denied'
        })
})
router.post("/song/exist", async (req, res) => {
    let song = req.body
    let playlists = (await playlistDB.getPlaylists(req.session.user)).map(x => ({ id: x._id, ...JSON.parse(JSON.stringify(x)) }))
    let result = []
    for (let playlist of playlists) {
        playlist.exist = playlist.songs && playlist.songs.filter(x => x.source == song.source && x.id == song.id).length > 0
        delete playlist.songs
        result.push(playlist)
    }
    res.json(result)
})
router.post("/song", async (req, res) => {
    let { playlistId, song } = req.body
    if (await checkPlaylistOwner(playlistId, req.session.user))
        res.json(await playlistDB.toggleSongOfPlaylist({
            playlistId,
            song
        }))
    else
        res.json({
            success: false,
            error: 'Permission Denied'
        })
})
module.exports = router;