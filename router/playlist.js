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
    let playlists = await playlistDB.getPlaylists(req.session.user)
    let result = {
        playlists: [],
        existsPlaylists: []
    }
    for (let playlist of playlists) {
        if (playlist.songs && playlist.songs.filter(x => x.source == song.source && x.id == song.id).length > 0) {
            result.existsPlaylists.push(playlist)
        }
        result.playlists.push(playlist)
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