const playlistDB = require('../db/playlist')
async function onLoaded() {
    return true
}
async function getPlaylists() {
    return ({
        playlists: (await playlistDB.getParsedPlaylists())
    })
}
async function getPlaylistSongs(id) {
    return (await playlistDB.getParsedPlaylistById(id))
}
module.exports = {
    name: "poka",
    enabled: true,
    onLoaded,
    getPlaylists,
    getPlaylistSongs,
};