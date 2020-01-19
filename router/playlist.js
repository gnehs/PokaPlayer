const router = require("express").Router();
const playlistDB = require('../db/playlist')
router.get("/", async (req, res) => {
    res.json(await playlistDB.getParsedPlaylists())
})
router.post("/create", async (req, res) => {
    let {
        name
    } = req.body
    res.json(await playlistDB.createPlaylist(name))
})
router.post("/del", async (req, res) => {
    let {
        id
    } = req.body
    res.json(await playlistDB.delPlaylist(id))
})
router.post("/edit", async (req, res) => {
    let {
        data,
        id
    } = req.body
    res.json(await playlistDB.editPlaylist(id, data))
})
router.post("/song/exist", async (req, res) => {
    let song = req.body
    let playlists = await playlistDB.getPlaylists()
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
    let {
        playlistId,
        song
    } = req.body
    res.json(await playlistDB.toggleSongOfPlaylist({
        playlistId,
        song
    }))
})
module.exports = router;