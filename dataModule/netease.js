const metingUrl = require(__dirname + '/../config.json').Meting.url
const rp = require('request-promise');

async function getSongs(song) {
    if (typeof(song) == 'object') {
        if (Array.isArray(song)) {
            // 傳入的資料是 list

            let options = {
                method: 'POST',
                uri: metingUrl,
                headers: {
                    'content-type': 'application/json' 
                },
                qs: {
                    'server': 'netease',
                    'type': 'multi'
                },
                body: {
                    'song': song
                },
                headers: {
                    'User-Agent': 'PokaPlayer'
                },
                json: true // Automatically stringifies the body to JSON
            };
        
            return (await rp(options)).song
        } else {
            // 傳入的資料是 object
        }
    } else {
        // 傳入的是 string 或 number
        song = parseInt(song)

        let options = {
            uri: metingUrl,
            qs: {
                'server': 'netease',
                'type': 'song',
                'id': song
            },
            headers: {
                'User-Agent': 'PokaPlayer'
            },
            json: true // Automatically parses the JSON string in the response
        };

        return (await rp(options))
    }
}

module.exports = {
    name: 'Netease',
    getSongs,
    // getCover,
    // search,
    // getAlbumSongs,
    // getFolders,
    // getFolderFiles,
    // getArtists,
    // getArtistAlbums,
    // getComposers,
    // getComposerAlbums,
    // getPlaylists,
    // getPlaylistSongs,
    // getLrc,
    // searchLrc
};