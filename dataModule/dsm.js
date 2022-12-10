const config = require("../config.json"), // 很會設定ㄉ朋友
    schedule = require("node-schedule"), // 很會計時ㄉ朋友
    pokaLog = require("../log"), // 可愛控制台輸出
    dsmURL = `${config.DSM.protocol}://${config.DSM.host}:${config.DSM.port}`,
    lyricRegex = /\[([0-9.:]*)\]/i

const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const jar = new CookieJar();
const client = wrapper(axios.create({ jar, baseURL: dsmURL }));
const transformRequest = (jsonData = {}) => Object.entries(jsonData).map(x => `${encodeURIComponent(x[0])}=${encodeURIComponent(x[1])}`).join('&');
let SynoToken = "";
let sid = "";

const decodeBase64 = x => Buffer.from(x, "base64url").toString("utf8");
const encodeBase64 = x => Buffer.from(x).toString("base64url");

function parseSongs(songs) {
    return songs.map(x => {
        let albumInfo = [
            x.additional.song_tag.album || "",
            "",
            x.additional.song_tag.album_artist || ""
        ];
        let cover =
            `/pokaapi/cover/?moduleName=DSM&data=` +
            encodeURIComponent(encodeBase64(
                JSON.stringify({
                    type: "album",
                    info: albumInfo
                })));
        return {
            artist: x.additional.song_tag.artist,
            artistId: x.additional.song_tag.artist,
            album: x.additional.song_tag.album,
            albumId: encodeBase64(JSON.stringify(albumInfo)),
            bitrate: x.additional.song_audio.bitrate,
            cover,
            codec: x.additional.song_audio.codec,
            id: x.id,
            source: "DSM",
            lrc: "",
            name: x.title,
            track: x.additional.song_tag.track,
            url: "/pokaapi/song/?moduleName=DSM&songId=" + x.id,
            year: x.additional.song_tag.year,
        }
    });
}

function parseAlbums(albums) {
    return albums.map(x => {
        let coverInfo = [
            x.name || "",
            x.artist || "",
            x.album_artist || ""
        ];
        let cover =
            `/pokaapi/cover/?moduleName=DSM&data=` +
            encodeURIComponent(encodeBase64(
                JSON.stringify({
                    type: "album",
                    info: coverInfo
                })));
        return {
            artist: x.display_artist,
            cover,
            id: encodeBase64(JSON.stringify(coverInfo)),
            name: x.name,
            source: "DSM",
            year: x.year,
        }
    });
}

function parsePlaylists(playlists) {
    return playlists.map(x => ({
        id: x.id,
        name: x.name,
        source: "DSM",
    }));
}
function parseArtists(data, type = "artist") {
    return data.map(x => ({
        id: x.name == '' ? `DSM_unknown` : x.name,
        name: x.name == '' ? `Unknown` : x.name,
        cover: `/pokaapi/cover/?moduleName=DSM&data=${encodeURIComponent(encodeBase64(JSON.stringify({ type, info: x.name || "" })))}`,
        source: "DSM",
    }));
}

function parseComposers(data) {
    return parseArtists(data, type = "composer")
}

//自動重新登入
schedule.scheduleJob("0 0 * * *", function () {
    pokaLog.logDM('DSM', '正在重新登入...')
    login();
});
async function onLoaded() {
    return await login();
}
async function login() {
    if (!config.DSM.account && !config.DSM.password) {
        pokaLog.logDMErr('DSM', '登入失敗，未設定帳號密碼')
        return false;
    }
    let result = await requestAPI({
        path: "entry.cgi",
        name: "SYNO.API.Auth",
        method: "login",
        params: {
            account: config.DSM.account,
            passwd: config.DSM.password,
            enable_syno_token: 'yes'
        },
        version: 7
    })
    if (result.success) {
        SynoToken = result.data.synotoken;
        sid = result.data.sid;
        pokaLog.logDM('DSM', `${config.DSM.account} 登入成功！(DSM 7.0)`)
        return true;
    } else {
        pokaLog.logDM('DSM', `正在嘗試以舊版 API 登入...`)
        // 嘗試舊版 API (6.0 以下)
        let oldApiResult = await requestAPI({
            path: "auth.cgi",
            name: "SYNO.API.Auth",
            method: "Login",
            params: {
                account: config.DSM.account,
                passwd: config.DSM.password,
                session: "AudioStation",
                format: "cookie"
            },
            version: 3
        })
        if (oldApiResult.success) {
            pokaLog.logDM('DSM', `${config.DSM.account} 登入成功！ (DSM 6.0)`)
            return true;
        } else {
            pokaLog.logDMErr('DSM', `${config.DSM.account} 登入失敗，請檢查您的設定檔是否正確`)
            return false;
        }
    }
}

async function requestAPI({
    path,
    name,
    method,
    params = {},
    version = 1,
    requestMethod = "POST"
}) {
    params = { ...params, SynoToken }
    let form = Object.assign({
        api: name,
        method,
        version,
    }, params);
    try {
        let { data } = await client.post(`/webapi/${path}?api=${name}`, transformRequest(form), {
            method: requestMethod,
            params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'x-syno-token': SynoToken
            }
        })
        // console.log(name, params, data)
        return data;
    } catch (e) {
        pokaLog.logDMErr('DSM', `${name} API request error:\n${e.message}`)
        return false;
    }
}

async function getHome() {
    let latestAlbum = await getAlbums(25, "time", "desc")
    latestAlbum.title = "home_recentAlbums"
    latestAlbum.source = "DSM"
    latestAlbum.icon = "album"
    return latestAlbum.albums.length ? [latestAlbum] : []
}
async function getSong(req, songRes = "high", songId) {
    let url = dsmURL;
    switch (songRes) {
        case "high":
            url += `/webapi/AudioStation/stream.cgi/0.wav?api=SYNO.AudioStation.Stream&version=2&method=transcode&SynoToken=${SynoToken}&format=wav&id=`;
            break;
        case "low": //128K
            url += `/webapi/AudioStation/stream.cgi/0.mp3?api=SYNO.AudioStation.Stream&version=2&method=transcode&SynoToken=${SynoToken}&format=mp3&id=`;
            break;
        case "medium": //128K
            url += `/webapi/AudioStation/stream.cgi/0.mp3?api=SYNO.AudioStation.Stream&version=2&method=transcode&SynoToken=${SynoToken}&format=mp3&id=`;
            break;
        case "original":
            url += `/webapi/AudioStation/stream.cgi/0.mp3?api=SYNO.AudioStation.Stream&version=2&method=stream&SynoToken=${SynoToken}&id=`;
            break;
        default:
            url += `/webapi/AudioStation/stream.cgi/0.mp3?api=SYNO.AudioStation.Stream&version=2&method=stream&SynoToken=${SynoToken}&id=`;
            break;
    }
    url += songId;
    return (await client.get(url, {
        responseType: 'stream',
        headers: {
            ...req.headers,
            Host: config.DSM.host
        },
    }))
}

async function getCover(data) {
    function deReq(x) {
        const b2a = x => Buffer.from(x, "base64").toString("utf8");
        const decode = x => /(.{5})(.+)3C4C7CB3(.+)/.exec(x);
        let [_, rand, link, checkSum] = decode(x);
        [_, rand, link, checkSum] = [_, rand, b2a(link), b2a(checkSum)];
        if (!Number.isInteger(Math.log10(rand.charCodeAt(0) + checkSum.charCodeAt(0)))) {
            return false;
        }
        return link;
    }
    let coverData;
    if (data.startsWith("Poka-")) {
        coverData = JSON.parse(deReq(data));
        coverData.info = Object.values(coverData.info)
    } else {
        coverData = JSON.parse(decodeBase64(data));
    }
    let url = `/webapi/AudioStation/cover.cgi?api=SYNO.AudioStation.Cover&output_default=true&is_hr=false&version=3&library=shared&method=getcover&view=default&SynoToken=${SynoToken}`;
    switch (coverData.type) {
        case "artist": //演出者
            url += coverData.info ?
                `&artist_name=${encodeURIComponent(coverData.info)}` :
                `&artist_name=`;
            break;
        case "composer": //作曲者
            url += coverData.info ?
                `&composer_name=${encodeURIComponent(coverData.info)}` :
                `&composer_name=`;
            break;
        case "genre": //類型
            url += coverData.info ? `&genre_name=${encodeURIComponent(coverData.info)}` : ``;
            break;
        case "song": //歌曲
            url = `/webapi/AudioStation/cover.cgi?api=SYNO.AudioStation.Cover&output_default=true&is_hr=false&version=3&library=shared&method=getsongcover&view=large&id=${coverData.info}`;
            break;
        case "folder": //資料夾
            url = `/webapi/AudioStation/cover.cgi?api=SYNO.AudioStation.Cover&output_default=true&is_hr=false&version=3&library=shared&method=getfoldercover&view=default&id=${coverData.info}`;
            break;
        case "album": //專輯
            url += coverData.info[0] ? `&album_name=${encodeURIComponent(coverData.info[0])}` : ``;
            url += coverData.info[1] ? `&artist_name=${encodeURIComponent(coverData.info[1])}` : ``;
            url += `&album_artist_name=${encodeURIComponent(coverData.info[2] || '')}`;
            break;
    }
    return (await client.get(url, {
        responseType: 'stream',
    })).data
}

async function search(keyword) {
    let result = await requestAPI({
        path: "AudioStation/search.cgi",
        name: "SYNO.AudioStation.Search",
        method: "list",
        params: {
            additional: "song_tag,song_audio,song_rating",
            library: "shared",
            limit: 50,
            sort_by: "title",
            sort_direction: "ASC",
            keyword
        },
        version: 1
    })
    return {
        albums: parseAlbums(result.data.albums || []),
        songs: parseSongs(result.data.songs || []),
        artists: parseArtists(result.data.artists || [])
    };
}

async function getAlbums(limit = 1000, sort_by = "name", sort_direction = "ASC") {
    let result = await requestAPI({
        path: "AudioStation/album.cgi",
        name: "SYNO.AudioStation.Album",
        method: "list",
        params: {
            additional: "avg_rating",
            library: "shared",
            limit: limit,
            sort_by,
            sort_direction,
        },
        version: 3
    })
    return {
        albums: parseAlbums(result.data.albums)
    };
}
async function getAlbum(id) {
    let [album, album_artist, artist] = JSON.parse(decodeBase64(id));
    let params = {
        additional: "song_tag,song_audio,song_rating",
        library: "shared",
        limit: 100000,
        sort_by: "title",
        sort_direction: "ASC",
    }
    if (album != '') params["album"] = album
    if (album_artist != '') params["album_artist"] = album_artist
    if (artist != '') params["artist"] = artist
    let result = await requestAPI({
        path: "AudioStation/song.cgi",
        name: "SYNO.AudioStation.Song",
        method: "list",
        params,
        version: 3
    })
    let cover = `/pokaapi/cover/?moduleName=DSM&data=` + encodeURIComponent(encodeBase64(JSON.stringify({ type: "album", info: [album, album_artist, artist] })))
    // sort by track
    result.data.songs.sort((a, b) => a.additional.song_tag.track - b.additional.song_tag.track)
    return {
        name: album,
        artist: artist || album_artist,
        artistId: artist,
        cover: cover,
        songs: parseSongs(result.data.songs)
    };
}

async function getFolders() {
    return await getFolderFiles();
}

async function getFolderFiles(id) {
    let result = await requestAPI({
        path: "AudioStation/folder.cgi",
        name: "SYNO.AudioStation.Folder",
        method: "list",
        params: {
            additional: "song_tag,song_audio,song_rating",
            library: "shared",
            limit: 1000,
            method: "list",
            sort_by: "title",
            sort_direction: "ASC",
            id: id || "",
        },
        version: 2
    })
    let songs = parseSongs(result.data.items.filter(({ type }) => type === "file"))
    let folders = result.data.items.filter(({ type }) => type === "folder").map(x => ({
        id: x.id,
        name: x.title,
        cover: `/pokaapi/cover/?moduleName=DSM&data=` +
            encodeURIComponent(
                encodeBase64(
                    JSON.stringify({
                        type: "folder",
                        info: x.id
                    })
                )
            ),
        source: "DSM"
    }))
    return {
        songs: songs,
        folders: folders
    };
}

async function getArtists() {
    let result = await requestAPI({
        path: "AudioStation/artist.cgi",
        name: "SYNO.AudioStation.Artist",
        method: "list",
        params: {
            additional: "avg_rating",
            library: "shared",
            limit: 1000,
            sort_by: "name",
            sort_direction: "ASC"
        },
        version: 4
    })
    return {
        artists: parseArtists(result.data.artists)
    };
}

async function getArtist(id) {
    let result = {}
    result.name = id;
    result.cover = `/pokaapi/cover/?moduleName=DSM&data=${encodeURIComponent(encodeBase64(JSON.stringify({ type: "artist", info: id })))}`;
    return result;
}
async function getArtistAlbums(id) {
    if (id == `DSM_unknown`) id = ''
    let result = await requestAPI({
        path: "AudioStation/album.cgi",
        name: "SYNO.AudioStation.Album",
        method: "list",
        params: {
            additional: "avg_rating",
            library: "shared",
            limit: 1000,
            method: "list",
            sort_by: "display_artist",
            sort_direction: "ASC",
            artist: id
        },
        version: 3
    })
    return {
        albums: parseAlbums(result.data.albums)
    };
}

async function getComposer(id) {
    let result = {}
    result.name = id;
    result.cover = `/pokaapi/cover/?moduleName=DSM&data=${encodeURIComponent(encodeBase64(JSON.stringify({ type: "composer", info: id })))}`;
    return result;
}
async function getComposers() {
    let result = await requestAPI({
        path: "AudioStation/composer.cgi",
        name: "SYNO.AudioStation.Composer",
        method: "list",
        params: {
            additional: "avg_rating",
            library: "shared",
            limit: 1000,
            sort_by: "name",
            sort_direction: "ASC"
        },
        version: 2
    })
    return {
        composers: parseComposers(result.data.composers)
    };
}

async function getComposerAlbums(id) {
    if (id == `DSM_unknown`) id = ''
    let result = await requestAPI({
        path: "AudioStation/album.cgi",
        name: "SYNO.AudioStation.Album",
        method: "list",
        params: {
            additional: "avg_rating",
            library: "shared",
            limit: 1000,
            method: "list",
            sort_by: "display_artist",
            sort_direction: "ASC",
            composer: id
        },
        version: 3
    })
    return {
        albums: parseAlbums(result.data.albums)
    };
}

async function getPlaylists() {
    let result = await requestAPI({
        path: "AudioStation/playlist.cgi",
        name: "SYNO.AudioStation.Playlist",
        method: "list",
        params: {
            limit: 1000,
            library: "shared",
            sort_by: "",
            sort_direction: "ASC"
        },
        version: 3
    })
    return {
        playlists: parsePlaylists(result.data.playlists)
    };
}

async function getPlaylistSongs(id) {
    let result = await requestAPI({
        path: "AudioStation/playlist.cgi",
        name: "SYNO.AudioStation.Playlist",
        method: "getinfo",
        params: {
            additional: "songs_song_tag,songs_song_audio,songs_song_rating,sharing_info",
            limit: 1000,
            library: "shared",
            sort_by: "",
            sort_direction: "ASC",
            id
        },
        version: 3
    })
    result = result.data.playlists[0];
    return {
        songs: parseSongs(result.additional.songs),
        playlists: [{
            name: result.name,
            source: "DSM",
            id: result.id
        }]
    };
}
async function getRandomSongs(id) {
    let result = await requestAPI({
        path: "AudioStation/song.cgi",
        name: "SYNO.AudioStation.Song",
        method: "list",
        params: {
            additional: "song_tag,song_audio,song_rating",
            library: "shared",
            limit: 100,
            sort_by: "random",
        },
        version: 1
    })
    return {
        songs: parseSongs(result.data.songs)
    };
}

async function getLyric(id) {
    let result = await requestAPI({
        path: "AudioStation/lyrics.cgi",
        name: "SYNO.AudioStation.Lyrics",
        method: "getlyrics",
        params: { id },
        version: 2
    })
    result = result && result.lyrics ? result.lyrics : false;
    if (result && result.match(lyricRegex)) return result;
    else return false;
}

module.exports = {
    name: "DSM",
    enabled: config.DSM.enabled,
    onLoaded,
    getHome,
    getSong,
    getCover,
    search,
    getAlbums,
    getAlbum,
    //getAlbumSongs,
    getFolders,
    getFolderFiles,
    getArtist,
    getArtists,
    getArtistAlbums,
    getComposer,
    getComposers,
    getComposerAlbums,
    getPlaylists,
    getPlaylistSongs,
    getRandomSongs,
    getLyric
};