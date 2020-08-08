const playlistDB = require('../db/playlist')
const pinDB = require('../db/pin')
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
async function getHome(userId) {
    let pins = {
        title: 'home_pins',
        source: "poka",
        icon: "mdi-pin",
        artists: [],
        composers: [],
        folders: [],
        playlists: [],
        albums: []
    };
    let pinsData = await pinDB.getPins(userId)
    pinsData.map(x => {
        try {
            pins[{ artist: 'artists', composer: 'composers', folder: 'folders', playlist: 'playlists', album: 'albums' }[x.type]].push(x)
        }
        catch (e) {
            throw new Error(`${e} ${JSON.stringify(x)}`);
        }
    })
    return [pins]
}
module.exports = {
    name: "poka",
    enabled: true,
    onLoaded,
    getPlaylists,
    getPlaylistSongs,
    getHome,
};