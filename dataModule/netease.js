const metingUrl = require(__dirname + '/../config.json').Meting.url
const rp = require('request-promise');
const userAgent = 'PokaPlayer'

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
                    'User-Agent': userAgent
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
                'User-Agent': userAgent
            },
            json: true // Automatically parses the JSON string in the response
        };

        return (await rp(options))
    }
}

async function getCovers(id) {
    if (Array.isArray(id)) {
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
                'pic': id
            },
            headers: {
                'User-Agent': userAgent
            },
            json: true // Automatically stringifies the body to JSON
        };
    
        return (await rp(options)).pic
    } else {
        let options = {
            method: 'GET',
            uri: metingUrl,
            qs: {
                'server': 'netease',
                'type': 'pic',
                id
            },
            headers: {
                'User-Agent': userAgent
            },
            json: true, // Automatically parses the JSON string in the response,
        };
    
        return (await rp(options))
    }
    
}

async function search(keyword) {
    let options = {
        method: 'GET',
        uri: metingUrl,
        qs: {
            'server': 'netease',
            'type': 'search',
            keyword
        },
        headers: {
            'User-Agent': userAgent
        },
        json: true, // Automatically parses the JSON string in the response,
    };

    return (await rp(options))
}

async function getLrc(id) {
    let options = {
        method: 'GET',
        uri: metingUrl,
        qs: {
            'server': 'netease',
            'type': 'lrc',
            id
        },
        headers: {
            'User-Agent': userAgent
        },
        json: true, // Automatically parses the JSON string in the response,
    };

    return (await rp(options))
}

async function getAlbumSongs(id) {
    let options = {
        method: 'GET',
        uri: metingUrl,
        qs: {
            'server': 'netease',
            'type': 'album',
            id
        },
        headers: {
            'User-Agent': userAgent
        },
        json: true, // Automatically parses the JSON string in the response,
    };

    return (await rp(options))
}

async function getPlaylistSongs(id) {
    let options = {
        method: 'GET',
        uri: metingUrl,
        qs: {
            'server': 'netease',
            'type': 'playlist',
            id
        },
        headers: {
            'User-Agent': userAgent
        },
        json: true, // Automatically parses the JSON string in the response,
    };

    return (await rp(options))
}

async function getArtistSongs(id) {
    let options = {
        method: 'GET',
        uri: metingUrl,
        qs: {
            'server': 'netease',
            'type': 'artist',
            id
        },
        headers: {
            'User-Agent': userAgent
        },
        json: true, // Automatically parses the JSON string in the response,
    };

    return (await rp(options))
}

async function getSongsUrl(song) {
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
                'url': song
            },
            headers: {
                'User-Agent': userAgent
            },
            json: true // Automatically stringifies the body to JSON
        }
    
        return (await rp(options)).url
    } else {
        let options = {
            method: 'GET',
            uri: metingUrl,
            qs: {
                'server': 'netease',
                'type': 'url',
                id
            },
            headers: {
                'User-Agent': userAgent
            },
            json: true, // Automatically parses the JSON string in the response,
        };

        return (await rp(options))}
}

module.exports = {
    name: 'Netease',
    getSongs,
    getSongsUrl,
    getCovers,
    search,
    getAlbumSongs,
    // getFolders,
    // getFolderFiles,
    // getArtists,
    getArtistSongs,
    // getArtistAlbums,
    // getComposers,
    // getComposerAlbums,
    // getPlaylists,
    getPlaylistSongs,
    getLrc,
    // searchLrc
};