const config = require('../config.json'), // 很會設定ㄉ朋友
    schedule = require('node-schedule'), // 很會計時ㄉ朋友
    request = require('request').defaults({ jar: require('request').jar() }), //很會請求ㄉ朋友
    dsmURL = `${config.DSM.protocol}://${config.DSM.host}:${config.DSM.port}`

function parseSongs(songs) {
    let r = []
    for (i = 0; i < songs.length; i++) {
        let song = songs[i]
        let cover = `/pokaapi/cover/?moduleName=DSM&data=` + encodeURIComponent(JSON.stringify({
            "type": "album",
            "info": {
                "album_name": song.additional.song_tag.album || '',
                "artist_name": song.additional.song_tag.artist || '',
                "album_artist_name": song.additional.song_tag.album_artist || ''
            }
        }))
        r.push({
            name: song.title,
            artist: song.additional.song_tag.artist,
            album: song.additional.song_tag.album,
            cover: cover,
            url: '/pokaapi/song/?moduleName=DSM&songId=' + song.id,
            bitrate: song.additional.song_audio.bitrate,
            codec: song.additional.song_audio.codec,
            lrc: '',
            source: "DSM",
            id: song.id,
        })
    }
    return r
}

function parseAlbums(albums) {
    let r = []
    for (i = 0; i < albums.length; i++) {
        let album = albums[i]
        let coverInfo = {
            "album_name": album.name || '',
            "artist_name": album.artist || '',
            "album_artist_name": album.album_artist || ''
        }
        let cover = `/pokaapi/cover/?moduleName=DSM&data=` + encodeURIComponent(JSON.stringify({
            "type": "album",
            "info": coverInfo
        }))
        r.push({
            name: album.name,
            artist: album.artist,
            year: album.year,
            cover: cover,
            source: 'DSM',
            id: JSON.stringify(coverInfo)
        })
    }
    return r
}

function parsePlaylists(playlists) {
    let r = []
    for (i = 0; i < playlists.length; i++) {
        r.push({
            name: playlists[i].name,
            source: 'DSM',
            id: playlists[i].id
        })
    }
    return r
}

function parseArtists(artists) {
    let r = []
    for (i = 0; i < artists.length; i++) {
        r.push({
            name: artists[i].name,
            source: 'DSM',
            cover: `/pokaapi/cover/?moduleName=DSM&data=${encodeURIComponent(JSON.stringify({"type":"artist","info":artists[i].name}))}`,
            id: artists[i].name
        })
    }
    return r
}

function parseComposers(composers) {
    let r = []
    for (i = 0; i < composers.length; i++) {
        r.push({
            name: composers[i].name,
            source: 'DSM',
            cover: `/pokaapi/cover/?moduleName=DSM&data=${encodeURIComponent(JSON.stringify({"type":"composer","info":composers[i].name}))}`,
            id: composers[i].name
        })
    }
    return r
}
async function onLoaded() {
    login();
    schedule.scheduleJob("'* */12 * * *'", async function() {
        console.log("[DataModules][DSM] 正在重新登入...")
        login();
    });
}
async function login() {
    let url = `${dsmURL}/webapi/auth.cgi?api=SYNO.API.Auth&method=Login&version=1&account=${config.DSM.account}&passwd=${config.DSM.password}&session=AudioStation&format=cookie`
    console.log("[DataModules][DSM] 正在登入...")
    request(url, async function(error, res, body) {
        if (!error && res.statusCode == 200) {
            if (JSON.parse(body).success) {
                console.log("[DataModules][DSM] 登入成功！")
            } else {
                console.error("[DataModules][DSM] 登入失敗，請檢查您的設定檔是否正確")
            }
        } else {
            console.error("[DataModules][DSM] 登入時遇到錯誤：", error)
        }
    });
}
//- API 請求
async function getAPI(CGI_PATH, API_NAME, METHOD, PARAMS_JSON = [], VERSION = 1) {
    return new Promise(function(resolve, reject) {
        let PARAMS = ''
        for (i = 0; i < PARAMS_JSON.length; i++) {　
            PARAMS += '&' + PARAMS_JSON[i].key + '=' + encodeURIComponent(PARAMS_JSON[i].value)
        }
        request(`${dsmURL}/webapi/${CGI_PATH}?api=${API_NAME}&method=${METHOD}&version=${VERSION}${PARAMS}`, function(error, res, body) {
            if (!error && res.statusCode == 200) {
                resolve(JSON.parse(body));
            } else {
                reject(error);
            }
        });
    });
}

async function getSong(req, songRes, songId) {
    let url = dsmURL
    switch (songRes) {
        case "wav":
            url += `/webapi/AudioStation/stream.cgi/0.wav?api=SYNO.AudioStation.Stream&version=2&method=transcode&format=wav&id=`
            break;
        case "mp3":
            url += `/webapi/AudioStation/stream.cgi/0.mp3?api=SYNO.AudioStation.Stream&version=2&method=transcode&format=mp3&id=`
            break;
        case "original":
            url += `/webapi/AudioStation/stream.cgi/0.mp3?api=SYNO.AudioStation.Stream&version=2&method=stream&id=`
            break;
        default:
            url += `/webapi/AudioStation/stream.cgi/0.mp3?api=SYNO.AudioStation.Stream&version=2&method=stream&id=`
            break;
    }
    url += songId
    return request.get({
        url: url,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
            'Range': req.headers.range,
            'Accept': req.headers.accept,
            'Host': config.DSM.host
        }
    })
}

async function getCover(data) {
    coverData = JSON.parse(data)
    let url = `${dsmURL}/webapi/AudioStation/cover.cgi?api=SYNO.AudioStation.Cover&output_default=true&is_hr=false&version=3&library=shared&method=getcover&view=default`
    switch (coverData.type) {
        case 'artist': //演出者
            url += coverData.info ? `&artist_name=${encodeURIComponent(coverData.info)}` : ``
            break;
        case 'composer': //作曲者
            url += coverData.info ? `&composer_name=${encodeURIComponent(coverData.info)}` : ``
            break;
        case 'genre': //類型
            url += coverData.info ? `&genre_name=${encodeURIComponent(coverData.info)}` : ``
            break;
        case 'song': //歌曲
            url = `${dsmURL}/webapi/AudioStation/cover.cgi?api=SYNO.AudioStation.Cover&output_default=true&is_hr=false&version=3&library=shared&method=getsongcover&view=large&id=${coverData.info}`
            break;
        case 'folder': //資料夾
            url = `${dsmURL}/webapi/AudioStation/cover.cgi?api=SYNO.AudioStation.Cover&output_default=true&is_hr=false&version=3&library=shared&method=getfoldercover&view=default&id=${coverData.info}`
            break;
        case 'album': //專輯
            url += coverData.info.album_name ? `&album_name=${encodeURIComponent( coverData.info.album_name)}` : ``
            url += coverData.info.artist_name ? `&artist_name=${encodeURIComponent(coverData.info.artist_name)}` : ``
            url += coverData.info.album_artist_name ? `&album_artist_name=${encodeURIComponent(coverData.info.album_artist_name)}` : `&album_artist_name=`
            break;
    }
    return request.get(url)
}

async function search(keyword, options = {}) {
    let PARAMS_JSON = [
        { key: "additional", "value": "song_tag,song_audio,song_rating" },
        { key: "library", "value": "shared" },
        { key: "limit", "value": 1000 },
        { key: "sort_by", "value": "title" },
        { key: "sort_direction", "value": "ASC" },
        { key: "keyword", "value": keyword },
    ]
    let result = await getAPI("AudioStation/search.cgi", "SYNO.AudioStation.Search", "list", PARAMS_JSON, 1)
    return {
        albums: parseAlbums(result.data.albums || ''),
        songs: parseSongs(result.data.songs || ''),
        artists: parseArtists(result.data.artists || '')
    }
}

async function getAlbums() {
    let result = await getAPI("AudioStation/album.cgi", "SYNO.AudioStation.Album", "list", [
        { key: "additional", "value": "avg_rating" },
        { key: "library", "value": "shared" },
        { key: "limit", "value": 1000 },
        { key: "sort_by", "value": "name" },
        { key: "sort_direction", "value": "ASC" },
    ], 3)
    return { albums: parseAlbums(result.data.albums) }
}
async function getAlbumSongs(id) {
    albumData = JSON.parse(id)
    let PARAMS_JSON = [
        { key: "additional", "value": "song_tag,song_audio,song_rating" },
        { key: "library", "value": "shared" },
        { key: "limit", "value": 100000 },
        { key: "sort_by", "value": "title" },
        { key: "sort_direction", "value": "ASC" },
    ]
    if (albumData.album_name) PARAMS_JSON.push({ key: "album", "value": albumData.album_name })
    if (albumData.album_artist_name) PARAMS_JSON.push({ key: "album_artist", "value": albumData.album_artist_name })
    if (albumData.artist_name) PARAMS_JSON.push({ key: "artist", "value": albumData.artist_name })
    let result = await getAPI("AudioStation/song.cgi", "SYNO.AudioStation.Song", "list", PARAMS_JSON, 3)
    return { songs: parseSongs(result.data.songs) }
}

async function getFolders() {
    return await getFolderFiles()
}

async function getFolderFiles(id) {
    let paramsJson = [
        { key: "additional", "value": "song_tag,song_audio,song_rating" },
        { key: "library", "value": "shared" },
        { key: "limit", "value": 1000 },
        { key: "method", "value": 'list' },
        { key: "sort_by", "value": "title" },
        { key: "sort_direction", "value": "ASC" }
    ]
    if (id) paramsJson.push({ key: "id", "value": id })
    let result = await getAPI("AudioStation/folder.cgi", "SYNO.AudioStation.Folder", "list", paramsJson, 2)
    let songs = parseSongs((result.data.items).filter(({ type }) => type === 'file')),
        folders = []

    for (i = 0; i < result.data.items.length; i++) {
        let item = result.data.items[i]
        if (item.type == 'folder')
            folders.push({
                name: item.title,
                source: 'DSM',
                id: item.id
            })
    }
    return {
        songs: songs,
        folders: folders
    }
}

async function getArtists() {
    let PARAMS_JSON = [
        { key: "limit", "value": 1000 },
        { key: "library", "value": "shared" },
        { key: "additional", "value": "avg_rating" },
        { key: "sort_by", "value": "name" },
        { key: "sort_direction", "value": "ASC" }
    ]
    let result = await getAPI("AudioStation/artist.cgi", "SYNO.AudioStation.Artist", "list", PARAMS_JSON, 4)
    return { artists: parseArtists(result.data.artists) }
}

async function getArtistAlbums(id) {
    let PARAMS_JSON = [
            { key: "additional", "value": "avg_rating" },
            { key: "library", "value": "shared" },
            { key: "limit", "value": 1000 },
            { key: "method", "value": 'list' },
            { key: "sort_by", "value": "display_artist" },
            { key: "sort_direction", "value": "ASC" },
            { key: "artist", "value": id },
        ],
        result = await getAPI("AudioStation/album.cgi", "SYNO.AudioStation.Album", "list", PARAMS_JSON, 3)
    return { albums: parseAlbums(result.data.albums) }
}

async function getComposers() {
    let PARAMS_JSON = [
            { key: "limit", "value": 1000 },
            { key: "library", "value": "shared" },
            { key: "additional", "value": "avg_rating" },
            { key: "sort_by", "value": "name" },
            { key: "sort_direction", "value": "ASC" }
        ],
        result = await getAPI("AudioStation/composer.cgi", "SYNO.AudioStation.Composer", "list", PARAMS_JSON, 2)
    return { composers: parseComposers(result.data.composers) }
}

async function getComposerAlbums(id) {
    let PARAMS_JSON = [
            { key: "additional", "value": "avg_rating" },
            { key: "library", "value": "shared" },
            { key: "limit", "value": 1000 },
            { key: "method", "value": 'list' },
            { key: "sort_by", "value": "display_artist" },
            { key: "sort_direction", "value": "ASC" },
            { key: "composer", "value": id },
        ],
        result = await getAPI("AudioStation/album.cgi", "SYNO.AudioStation.Album", "list", PARAMS_JSON, 3)
    return { albums: parseAlbums(result.data.albums) }
}

async function getPlaylists() {
    let playlist = await getAPI("AudioStation/playlist.cgi", "SYNO.AudioStation.Playlist", "list", [
        { key: "limit", "value": 1000 },
        { key: "library", "value": "shared" },
        { key: "sort_by", "value": "" },
        { key: "sort_direction", "value": "ASC" }
    ], 3)
    return { playlists: parsePlaylists(playlist.data.playlists) }
}

async function getPlaylistSongs(id) {
    let playlist = await getAPI("AudioStation/playlist.cgi", "SYNO.AudioStation.Playlist", "getinfo", [
        { key: "limit", "value": 1000 },
        { key: "library", "value": "shared" },
        { key: "sort_by", "value": "" },
        { key: "additional", "value": "songs_song_tag,songs_song_audio,songs_song_rating,sharing_info" },
        { key: "id", "value": id },
        { key: "sort_direction", "value": "ASC" }
    ], 3)
    let result = playlist.data.playlists[0]
    return {
        songs: parseSongs(result.additional.songs),
        playlists: [{
            name: result.name,
            source: 'DSM',
            id: result.id
        }]
    }
}
async function getRandomPlaylistSongs(id) {
    return [{ name: 'song form testa', link: 'blah' }];
}

async function getLrc(id) {
    return [{ name: 'song form testa', link: 'blah' }];
}

async function searchLrc(keyword) {
    return [{ name: 'song form testa', link: 'blah' }];
}

module.exports = {
    name: 'DSM',
    onLoaded, //done 
    getSong, //done 
    getCover, //done 
    search, //done 
    getAlbums, //done 
    getAlbumSongs, //done
    getFolders, //done 
    getFolderFiles, //done 
    getArtists, //done 
    getArtistAlbums, //done
    getComposers, //done 
    getComposerAlbums, //done
    getPlaylists, //done 
    getPlaylistSongs, //done 
    getRandomPlaylistSongs,
    getLrc,
    searchLrc
};