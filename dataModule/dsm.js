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

function genReq(link) {
    const a2b = x => Buffer.from(x).toString("base64");
    const rand = "Poka-"
    const checkSum = N => 10 ** Number(N).toString().length - N;
    return `${rand}${a2b(link)}3C4C7CB3${a2b(String.fromCharCode(checkSum(rand.charCodeAt(0))))}`;
}


function parseSongs(songs) {
    return songs.map(x => {
        let albumInfo = {
            album_name: x.additional.song_tag.album || "",
            artist_name: "",
            album_artist_name: x.additional.song_tag.album_artist || ""
        };
        let cover =
            `/pokaapi/cover/?moduleName=DSM&data=` +
            encodeURIComponent(genReq(
                JSON.stringify({
                    type: "album",
                    info: albumInfo
                })));
        return {
            artist: x.additional.song_tag.artist,
            artistId: x.additional.song_tag.artist,
            album: x.additional.song_tag.album,
            albumId: JSON.stringify(albumInfo),
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
        let coverInfo = {
            album_name: x.name || "",
            artist_name: x.artist || "",
            album_artist_name: x.album_artist || ""
        };
        let cover =
            `/pokaapi/cover/?moduleName=DSM&data=` +
            encodeURIComponent(genReq(
                JSON.stringify({
                    type: "album",
                    info: coverInfo
                })));
        return {
            artist: x.display_artist,
            cover,
            id: JSON.stringify(coverInfo),
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
function parseArtists(artists, type = "artist") {
    return artists.map(x => ({
        id: x.name,
        name: x.name,
        cover: `/pokaapi/cover/?moduleName=DSM&data=${encodeURIComponent(genReq(JSON.stringify({ type, info: x.name || "" })))}`,
        source: "DSM",
    }));
}

function parseComposers(composers) {
    return parseArtists(artists, type = "composer")
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
    let result = await postAPI("entry.cgi", "SYNO.API.Auth", "login", [{
        key: "account",
        value: config.DSM.account
    },
    {
        key: "passwd",
        value: config.DSM.password
    }
    ], 7);
    if (result.success) {
        pokaLog.logDM('DSM', `${config.DSM.account} 登入成功！(DSM 7.0)`)
        return true;
    } else {
        pokaLog.logDM('DSM', `正在嘗試以舊版 API 登入...`)
        // 嘗試舊版 API (6.0 以下)
        let oldApiResult = await getAPI("auth.cgi", "SYNO.API.Auth", "Login", [{
            key: "account",
            value: config.DSM.account
        },
        {
            key: "passwd",
            value: config.DSM.password
        },
        {
            key: "session",
            value: "AudioStation"
        },
        {
            key: "format",
            value: "cookie"
        }
        ]);
        if (oldApiResult.success) {
            pokaLog.logDM('DSM', `${config.DSM.account} 登入成功！`)
            return true;
        } else {
            pokaLog.logDMErr('DSM', `${config.DSM.account} 登入失敗，請檢查您的設定檔是否正確`)
            return false;
        }
    }
}
//- API 請求
async function getAPI(CGI_PATH, API_NAME, METHOD, PARAMS_JSON = [], VERSION = 1) {
    return new Promise(function (resolve, reject) {
        let PARAMS = "";
        for (i = 0; i < PARAMS_JSON.length; i++) {
            PARAMS += "&" + PARAMS_JSON[i].key + "=" + encodeURIComponent(PARAMS_JSON[i].value);
        }
        client.get(`/webapi/${CGI_PATH}?api=${API_NAME}&method=${METHOD}&version=${VERSION}${PARAMS}`)
            .then(({ data }) => resolve(data))
            .catch(err => reject(err))
    });
}
async function postAPI(CGI_PATH, API_NAME, METHOD, PARAMS_JSON = [], VERSION = 3) {
    return new Promise(function (resolve, reject) {
        let form = {}
        form.api = API_NAME
        form.method = METHOD
        form.version = VERSION
        for (i = 0; i < PARAMS_JSON.length; i++) {
            form[PARAMS_JSON[i].key] = PARAMS_JSON[i].value
        }
        client.post(`/webapi/${CGI_PATH}?api=${API_NAME}`, transformRequest(form), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            }
        })
            .then(({ data }) => resolve(data))
            .catch(err => reject(err))
    })
}

async function getHome() {
    let latestAlbum = await getAlbums(25, "time", "desc")
    latestAlbum.title = "home_recentAlbums"
    latestAlbum.source = "DSM"
    latestAlbum.icon = "album"
    return latestAlbum.albums.length ? [latestAlbum] : []
}
async function addPin(type, id, name) {
    let PARAMS_JSON;
    if (type == "album") {
        let albumData = JSON.parse(id);
        let criteria = "{";
        criteria += albumData.album_name ? `"album":"${albumData.album_name}",` : "";
        criteria += albumData.album_artist_name ?
            `"album_artist":"${albumData.album_artist_name || albumData.artist_name}"` :
            "";
        criteria += "}";
        PARAMS_JSON = [{
            key: "items",
            value: `[{"type":"${type}","criteria":${criteria},"name":"${name}"}]`
        }];
    } else
        PARAMS_JSON = [{
            key: "items",
            value: `[{"type":"${type}","criteria":{"${type}":"${id}"},"name":"${name}"}]`
        }];
    result = await getAPI("entry.cgi", "SYNO.AudioStation.Pin", "pin", PARAMS_JSON);
    if (result.success) return result.success;
    else return result.error;
}
async function isPinned(type, id, name) {
    let result = (await getAPI("entry.cgi", "SYNO.AudioStation.Pin", "list", [{
        key: "limit",
        value: -1
    },
    {
        key: "offset",
        value: 0
    }
    ])).data;
    for (i = 0; i < result.items.length; i++) {
        let pin = result.items[i];
        if (pin.type == type)
            if (pin.name == name) return pin.id;
    }
    return false;
}
async function unPin(type, id, name) {
    let PARAMS_JSON = [{
        key: "items",
        value: `["${await isPinned(type, id, name)}"]`
    }],
        result = await getAPI("entry.cgi", "SYNO.AudioStation.Pin", "unpin", PARAMS_JSON);
    if (result.success) return result.success;
    else return result.error;
}
async function getSong(req, songRes = "high", songId) {
    let url = dsmURL;
    switch (songRes) {
        case "high":
            url += `/webapi/AudioStation/stream.cgi/0.wav?api=SYNO.AudioStation.Stream&version=2&method=transcode&format=wav&id=`;
            break;
        case "low": //128K
            url += `/webapi/AudioStation/stream.cgi/0.mp3?api=SYNO.AudioStation.Stream&version=2&method=transcode&format=mp3&id=`;
            break;
        case "medium": //128K
            url += `/webapi/AudioStation/stream.cgi/0.mp3?api=SYNO.AudioStation.Stream&version=2&method=transcode&format=mp3&id=`;
            break;
        case "original":
            url += `/webapi/AudioStation/stream.cgi/0.mp3?api=SYNO.AudioStation.Stream&version=2&method=stream&id=`;
            break;
        default:
            url += `/webapi/AudioStation/stream.cgi/0.mp3?api=SYNO.AudioStation.Stream&version=2&method=stream&id=`;
            break;
    }
    url += songId;
    return (await client.get(url, {
        responseType: 'stream',
        headers: {
            Range: req.headers.range,
            Accept: req.headers.accept,
            Host: config.DSM.host
        },
    }))
}

async function getCover(data) {
    coverData = JSON.parse(deReq(data));
    let url = `/webapi/AudioStation/cover.cgi?api=SYNO.AudioStation.Cover&output_default=true&is_hr=false&version=3&library=shared&method=getcover&view=default`;
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
            url += coverData.info.album_name ? `&album_name=${encodeURIComponent(coverData.info.album_name)}` : ``;
            url += coverData.info.artist_name ? `&artist_name=${encodeURIComponent(coverData.info.artist_name)}` : ``;
            url += `&album_artist_name=${encodeURIComponent(coverData.info.album_artist_name || '')}`;
            break;
    }
    return (await client.get(url, {
        responseType: 'stream',
    })).data
}

async function search(keyword, options = {}) {
    let PARAMS_JSON = [{
        key: "additional",
        value: "song_tag,song_audio,song_rating"
    },
    {
        key: "library",
        value: "shared"
    },
    {
        key: "limit",
        value: 50
    },
    {
        key: "sort_by",
        value: "title"
    },
    {
        key: "sort_direction",
        value: "ASC"
    },
    {
        key: "keyword",
        value: keyword
    }
    ];
    let result = await getAPI(
        "AudioStation/search.cgi",
        "SYNO.AudioStation.Search",
        "list",
        PARAMS_JSON,
        1
    );
    return {
        albums: parseAlbums(result.data.albums || ""),
        songs: parseSongs(result.data.songs || ""),
        artists: parseArtists(result.data.artists || "")
    };
}

async function getAlbums(limit = 1000, sort_by = "name", sort_direction = "ASC") {
    let result = await getAPI(
        "AudioStation/album.cgi",
        "SYNO.AudioStation.Album",
        "list", [{
            key: "additional",
            value: "avg_rating"
        },
        {
            key: "library",
            value: "shared"
        },
        {
            key: "limit",
            value: limit
        },
        {
            key: "sort_by",
            value: sort_by
        },
        {
            key: "sort_direction",
            value: sort_direction
        }
    ],
        3
    );
    return {
        albums: parseAlbums(result.data.albums)
    };
}
async function getAlbum(id) {
    albumData = JSON.parse(id);
    let PARAMS_JSON = [{
        key: "additional",
        value: "song_tag,song_audio,song_rating"
    },
    {
        key: "library",
        value: "shared"
    },
    {
        key: "limit",
        value: 100000
    },
    {
        key: "sort_by",
        value: "title"
    },
    {
        key: "sort_direction",
        value: "ASC"
    }
    ];
    if (albumData.album_name) PARAMS_JSON.push({
        key: "album",
        value: albumData.album_name
    });
    if (albumData.album_artist_name)
        PARAMS_JSON.push({
            key: "album_artist",
            value: albumData.album_artist_name
        });
    if (albumData.artist_name) PARAMS_JSON.push({
        key: "artist",
        value: albumData.artist_name
    });
    let result = await getAPI(
        "AudioStation/song.cgi",
        "SYNO.AudioStation.Song",
        "list",
        PARAMS_JSON,
        3
    );
    let cover = `/pokaapi/cover/?moduleName=DSM&data=` +
        encodeURIComponent(genReq(
            JSON.stringify({
                type: "album",
                info: albumData
            })))
    // sort by track
    result.data.songs.sort((a, b) => a.additional.song_tag.track - b.additional.song_tag.track)
    return {
        name: albumData.album_name,
        artist: albumData.artist_name || albumData.album_artist_name,
        cover: cover,
        songs: parseSongs(result.data.songs)
    };
}

async function getFolders() {
    return await getFolderFiles();
}

async function getFolderFiles(id) {
    let paramsJson = [{
        key: "additional",
        value: "song_tag,song_audio,song_rating"
    },
    {
        key: "library",
        value: "shared"
    },
    {
        key: "limit",
        value: 1000
    },
    {
        key: "method",
        value: "list"
    },
    {
        key: "sort_by",
        value: "title"
    },
    {
        key: "sort_direction",
        value: "ASC"
    }
    ];
    if (id) paramsJson.push({
        key: "id",
        value: id
    });
    let result = await getAPI(
        "AudioStation/folder.cgi",
        "SYNO.AudioStation.Folder",
        "list",
        paramsJson,
        2
    );
    let songs = parseSongs(result.data.items.filter(({
        type
    }) => type === "file")),
        folders = [];

    for (i = 0; i < result.data.items.length; i++) {
        let item = result.data.items[i];
        if (item.type == "folder")
            folders.push({
                name: item.title,
                source: "DSM",
                id: item.id,
                cover: `/pokaapi/cover/?moduleName=DSM&data=${encodeURIComponent(genReq(
                    JSON.stringify({ type: "folder", info: item.id }))
                )}`
            });
    }
    return {
        songs: songs,
        folders: folders
    };
}

async function getArtists() {
    let PARAMS_JSON = [{
        key: "limit",
        value: 1000
    },
    {
        key: "library",
        value: "shared"
    },
    {
        key: "additional",
        value: "avg_rating"
    },
    {
        key: "sort_by",
        value: "name"
    },
    {
        key: "sort_direction",
        value: "ASC"
    }
    ];
    let result = await getAPI(
        "AudioStation/artist.cgi",
        "SYNO.AudioStation.Artist",
        "list",
        PARAMS_JSON,
        4
    );
    return {
        artists: parseArtists(result.data.artists)
    };
}

async function getArtist(id) {
    let result = {}
    result.name = id;
    result.cover = `/pokaapi/cover/?moduleName=${encodeURIComponent(
        "DSM"
    )}&data=${encodeURIComponent(genReq(
        JSON.stringify({
            type: "artist",
            info: id
        }))
    )}`;
    return result;
}
async function getArtistAlbums(id) {
    let PARAMS_JSON = [{
        key: "additional",
        value: "avg_rating"
    },
    {
        key: "library",
        value: "shared"
    },
    {
        key: "limit",
        value: 1000
    },
    {
        key: "method",
        value: "list"
    },
    {
        key: "sort_by",
        value: "display_artist"
    },
    {
        key: "sort_direction",
        value: "ASC"
    },
    {
        key: "artist",
        value: id
    }
    ],
        result = await getAPI(
            "AudioStation/album.cgi",
            "SYNO.AudioStation.Album",
            "list",
            PARAMS_JSON,
            3
        );
    return {
        albums: parseAlbums(result.data.albums)
    };
}

async function getComposer(id) {
    let result = {}
    result.name = id;
    result.cover = `/pokaapi/cover/?moduleName=${encodeURIComponent(
        "DSM"
    )}&data=${encodeURIComponent(genReq(
        JSON.stringify({
            type: "composer",
            info: id
        }))
    )}`;
    return result;
}
async function getComposers() {
    let PARAMS_JSON = [{
        key: "limit",
        value: 1000
    },
    {
        key: "library",
        value: "shared"
    },
    {
        key: "additional",
        value: "avg_rating"
    },
    {
        key: "sort_by",
        value: "name"
    },
    {
        key: "sort_direction",
        value: "ASC"
    }
    ],
        result = await getAPI(
            "AudioStation/composer.cgi",
            "SYNO.AudioStation.Composer",
            "list",
            PARAMS_JSON,
            2
        );
    return {
        composers: parseComposers(result.data.composers)
    };
}

async function getComposerAlbums(id) {
    let PARAMS_JSON = [{
        key: "additional",
        value: "avg_rating"
    },
    {
        key: "library",
        value: "shared"
    },
    {
        key: "limit",
        value: 1000
    },
    {
        key: "method",
        value: "list"
    },
    {
        key: "sort_by",
        value: "display_artist"
    },
    {
        key: "sort_direction",
        value: "ASC"
    },
    {
        key: "composer",
        value: id
    }
    ],
        result = await getAPI(
            "AudioStation/album.cgi",
            "SYNO.AudioStation.Album",
            "list",
            PARAMS_JSON,
            3
        );
    return {
        albums: parseAlbums(result.data.albums)
    };
}

async function getPlaylists() {
    let playlist = await getAPI(
        "AudioStation/playlist.cgi",
        "SYNO.AudioStation.Playlist",
        "list", [{
            key: "limit",
            value: 1000
        },
        {
            key: "library",
            value: "shared"
        },
        {
            key: "sort_by",
            value: ""
        },
        {
            key: "sort_direction",
            value: "ASC"
        }
    ],
        3
    );
    return {
        playlists: parsePlaylists(playlist.data.playlists)
    };
}

async function getPlaylistSongs(id) {
    let playlist = await getAPI(
        "AudioStation/playlist.cgi",
        "SYNO.AudioStation.Playlist",
        "getinfo", [{
            key: "limit",
            value: 1000
        },
        {
            key: "library",
            value: "shared"
        },
        {
            key: "sort_by",
            value: ""
        },
        {
            key: "additional",
            value: "songs_song_tag,songs_song_audio,songs_song_rating,sharing_info"
        },
        {
            key: "id",
            value: id
        },
        {
            key: "sort_direction",
            value: "ASC"
        }
    ],
        3
    );
    let result = playlist.data.playlists[0];
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
    let result = await getAPI(
        "AudioStation/song.cgi",
        "SYNO.AudioStation.Song",
        "list", [{
            key: "additional",
            value: "song_tag,song_audio,song_rating"
        },
        {
            key: "library",
            value: "shared"
        },
        {
            key: "limit",
            value: 100
        },
        {
            key: "sort_by",
            value: "random"
        }
    ],
        1
    );
    return {
        songs: parseSongs(result.data.songs)
    };
}

async function getLyric(id) {
    let result = (await getAPI(
        "AudioStation/lyrics.cgi",
        "SYNO.AudioStation.Lyrics",
        "getlyrics", [{
            key: "id",
            value: id
        }],
        2
    )).data;
    result = result && result.lyrics ? result.lyrics : false;
    if (result && result.match(lyricRegex)) return result;
    else return false;
}

module.exports = {
    name: "DSM",
    enabled: config.DSM.enabled,
    onLoaded,
    getHome,
    addPin,
    unPin,
    isPinned,
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