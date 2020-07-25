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
router.post("/migrate", async (req, res) => {
    // migrate db: 將播放清單所有權移交給首次抓取播放清單的管理員
    let userId = req.session.user
    if (await userDB.isUserAdmin(userId)) {
        let playlists = await playlistDB.getPlaylists()
        for (let { _id } of playlists) {
            let playlist = await playlistDB.getPlaylistById(_id)
            playlist.owner = userId
            playlist.save()
        }
        pokaLog.log('Playlist Migrated', userId)
        res.json({
            success: true,
            error: null,
        })
    } else {
        res.status(403).json({
            success: true,
            error: 'Permission Denied',
        })
    }
})
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