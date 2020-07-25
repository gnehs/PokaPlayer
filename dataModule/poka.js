const playlistDB = require('../db/playlist')
async function onLoaded() {
    return true
}
async function getPlaylists(userId) {
    return ({
        playlists: (await playlistDB.getParsedUserPlaylists(userId))
    })
}
async function getPlaylistSongs(id, userId) {
    return (await playlistDB.getParsedUserPlaylistById(id, userId))
}
module.exports = {
    name: "poka",
    enabled: true,
    onLoaded,
    getPlaylists,
    getPlaylistSongs,
};