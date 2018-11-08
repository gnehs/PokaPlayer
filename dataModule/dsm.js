const config = require("../config.json"), // 很會設定ㄉ朋友
    schedule = require("node-schedule"), // 很會計時ㄉ朋友
    request = require("request").defaults({
        jar: require("request").jar()
    }), //很會請求ㄉ朋友
    dsmURL = `${config.DSM.protocol}://${config.DSM.host}:${config.DSM.port}`,
    lyricRegex = /\[([0-9.:]*)\]/i;

function parseSongs(songs) {
    let r = [];
    for (i = 0; i < songs.length; i++) {
        let song = songs[i];
        let cover =
            `/pokaapi/cover/?moduleName=DSM&data=` +
            encodeURIComponent(
                JSON.stringify({
                    type: "album",
                    info: {
                        album_name: song.additional.song_tag.album || "",
                        artist_name: song.additional.song_tag.artist || "",
                        album_artist_name: song.additional.song_tag.album_artist || ""
                    }
                })
            );
        r.push({
            name: song.title,
            artist: song.additional.song_tag.artist,
            album: song.additional.song_tag.album,
            cover: cover,
            url: "/pokaapi/song/?moduleName=DSM&songId=" + song.id,
            bitrate: song.additional.song_audio.bitrate,
            codec: song.additional.song_audio.codec,
            lrc: "",
            source: "DSM",
            id: song.id
        });
    }
    return r;
}

function parseAlbums(albums) {
    let r = [];
    for (i = 0; i < albums.length; i++) {
        let album = albums[i];
        let coverInfo = {
            album_name: album.name || "",
            artist_name: album.artist || "",
            album_artist_name: album.album_artist || ""
        };
        let cover =
            `/pokaapi/cover/?moduleName=DSM&data=` +
            encodeURIComponent(
                JSON.stringify({
                    type: "album",
                    info: coverInfo
                })
            );
        r.push({
            name: album.name,
            artist: album.display_artist,
            year: album.year,
            cover: cover,
            source: "DSM",
            id: JSON.stringify(coverInfo)
        });
    }
    return r;
}

function parsePlaylists(playlists) {
    let r = [];
    for (i = 0; i < playlists.length; i++) {
        r.push({
            name: playlists[i].name,
            source: "DSM",
            id: playlists[i].id
        });
    }
    return r;
}

function parseArtists(artists) {
    let r = [];
    for (i = 0; i < artists.length; i++) {
        r.push({
            name: artists[i].name,
            source: "DSM",
            cover: `/pokaapi/cover/?moduleName=DSM&data=${encodeURIComponent(
                JSON.stringify({ type: "artist", info: artists[i].name || "" })
            )}`,
            id: artists[i].name
        });
    }
    return r;
}

function parseComposers(composers) {
    let r = [];
    for (i = 0; i < composers.length; i++) {
        r.push({
            name: composers[i].name,
            source: "DSM",
            cover: `/pokaapi/cover/?moduleName=DSM&data=${encodeURIComponent(
                JSON.stringify({ type: "composer", info: composers[i].name || "" })
            )}`,
            id: composers[i].name
        });
    }
    return r;
}

function parseLyrics(lyrics) {
    let r = [];
    for (i = 0; i < lyrics.length; i++) {
        if (lyrics[i].additional.full_lyrics.match(lyricRegex))
            r.push({
                name: lyrics[i].title,
                artist: lyrics[i].artist,
                source: "DSM",
                id: lyrics[i].id,
                lyric: lyrics[i].additional.full_lyrics
            });
    }
    return r;
}
async function onLoaded() {
    schedule.scheduleJob("'* */12 * * *'", async function () {
        console.log("[DataModules][DSM] 正在重新登入...");
        login();
    });
    return await login();
}
async function login() {
    console.log("[DataModules][DSM] 正在登入...");
    if (!config.DSM.account && !config.DSM.password) {
        console.error("[DataModules][DSM] 登入失敗，未設定帳號密碼");
        return false;
    }
    let result = await getAPI("auth.cgi", "SYNO.API.Auth", "Login", [{
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
    if (result.success) {
        console.log("[DataModules][DSM] 登入成功！");
        return true;
    } else {
        console.error("[DataModules][DSM] 登入失敗，請檢查您的設定檔是否正確");
        return false;
    }
}
//- API 請求
async function getAPI(CGI_PATH, API_NAME, METHOD, PARAMS_JSON = [], VERSION = 1) {
    return new Promise(function (resolve, reject) {
        let PARAMS = "";
        for (i = 0; i < PARAMS_JSON.length; i++) {
            PARAMS += "&" + PARAMS_JSON[i].key + "=" + encodeURIComponent(PARAMS_JSON[i].value);
        }
        request(
            `${dsmURL}/webapi/${CGI_PATH}?api=${API_NAME}&method=${METHOD}&version=${VERSION}${PARAMS}`,
            function (error, res, body) {
                if (!error && res.statusCode == 200) {
                    resolve(JSON.parse(body));
                } else {
                    reject(error);
                }
            }
        );
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
        request.post(
            `${dsmURL}/webapi/${CGI_PATH}`, {
                form: form
            },
            function (error, res, body) {
                if (!error && res.statusCode == 200) {
                    resolve(JSON.parse(body));
                } else {
                    reject(error);
                }
            }
        );
    });
}

async function getHome() {
    let result = await getAPI("entry.cgi", "SYNO.AudioStation.Pin", "list", [{
            key: "limit",
            value: -1
        },
        {
            key: "offset",
            value: 0
        }
    ]);
    let home = {
        title: '釘選',
        description: '釘選在首頁的項目',
        source: "DSM",
        artists: [],
        composers: [],
        folders: [],
        playlists: [],
        albums: []
    };
    for (i = 0; i < result.data.items.length; i++) {
        let pin = result.data.items[i];
        let type = pin.type;
        switch (type) {
            case "artist":
                //演出者
                home.artists.push({
                    name: pin.name,
                    source: "DSM",
                    cover: `/pokaapi/cover/?moduleName=DSM&data=${encodeURIComponent(
                        JSON.stringify({ type: "artist", info: pin.name || "未知" })
                    )}`,
                    id: pin.name
                });
                break;
            case "composer":
                //作曲者
                home.composers.push({
                    name: pin.name,
                    source: "DSM",
                    cover: `/pokaapi/cover/?moduleName=DSM&data=${encodeURIComponent(
                        JSON.stringify({ type: "composer", info: pin.name || "未知" })
                    )}`,
                    id: pin.name
                });
                break;
            case "folder":
                //資料夾
                home.folders.push({
                    name: pin.name,
                    source: "DSM",
                    id: pin.criteria.folder,
                    cover: `/pokaapi/cover/?moduleName=DSM&data=${encodeURIComponent(
                        JSON.stringify({ type: "folder", info: pin.criteria.folder })
                    )}`
                });
                break;
            case "playlist":
                //播放清單
                home.playlists.push({
                    name: pin.name,
                    source: "DSM",
                    id: pin.criteria.playlist
                });
                break;
            case "album":
                //專輯
                let coverInfo = {
                    album_name: pin.criteria.album || "",
                    artist_name: pin.criteria.artist || "",
                    album_artist_name: (album_artist = pin.criteria.album_artist || "")
                };
                let cover =
                    `/pokaapi/cover/?moduleName=DSM&data=` +
                    encodeURIComponent(
                        JSON.stringify({
                            type: "album",
                            info: coverInfo
                        })
                    );
                home.albums.push({
                    name: pin.name,
                    artist: pin.criteria.artist || pin.criteria.album_artist || "",
                    year: 0,
                    cover: cover,
                    source: "DSM",
                    id: JSON.stringify(coverInfo)
                });
                break;
        }
    }
    let r = []
    let latestAlbum = await getAlbums(20, "time", "desc")
    latestAlbum.title = "最近加入的專輯"
    latestAlbum.description = "Audio Station 裡最新的專輯"
    latestAlbum.source = "DSM"
    r.push(home)
    if (latestAlbum.albums.length > 0) r.push(latestAlbum)
    return r
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
async function getSong(req, songRes, songId) {
    let url = dsmURL;
    switch (songRes) {
        case "high":
            url += `/webapi/AudioStation/stream.cgi/0.wav?api=SYNO.AudioStation.Stream&version=2&method=transcode&format=wav&id=`;
            break;
        case "low":
            url += `/webapi/AudioStation/stream.cgi/0.mp3?api=SYNO.AudioStation.Stream&version=2&method=transcode&format=mp3&id=`;
            break;
        case "medium":
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
    return request.get({
        url: url,
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36",
            Range: req.headers.range,
            Accept: req.headers.accept,
            Host: config.DSM.host
        }
    });
}

async function getCover(data) {
    coverData = JSON.parse(data);
    let url = `${dsmURL}/webapi/AudioStation/cover.cgi?api=SYNO.AudioStation.Cover&output_default=true&is_hr=false&version=3&library=shared&method=getcover&view=default`;
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
            url = `${dsmURL}/webapi/AudioStation/cover.cgi?api=SYNO.AudioStation.Cover&output_default=true&is_hr=false&version=3&library=shared&method=getsongcover&view=large&id=${
                coverData.info
            }`;
            break;
        case "folder": //資料夾
            url = `${dsmURL}/webapi/AudioStation/cover.cgi?api=SYNO.AudioStation.Cover&output_default=true&is_hr=false&version=3&library=shared&method=getfoldercover&view=default&id=${
                coverData.info
            }`;
            break;
        case "album": //專輯
            url += coverData.info.album_name ?
                `&album_name=${encodeURIComponent(coverData.info.album_name)}` :
                ``;
            url += coverData.info.artist_name ?
                `&artist_name=${encodeURIComponent(coverData.info.artist_name)}` :
                ``;
            url += coverData.info.album_artist_name ?
                `&album_artist_name=${encodeURIComponent(coverData.info.album_artist_name)}` :
                `&album_artist_name=`;
            break;
    }
    return request.get(url);
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
async function getAlbumSongs(id) {
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
    return {
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
                cover: `/pokaapi/cover/?moduleName=DSM&data=${encodeURIComponent(
                    JSON.stringify({ type: "folder", info: item.id })
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

function playlistOperation(operation) {
    /*
    req.body: {
        moduleName: "Netease2",
        songIds: [songId <int>],
        playlistId <int>
    }
*/
    switch (operation) {
        case "in":
            return async (songIds, playlistId) => {
                let offset = false;
                let playlist = (await getPlaylistSongs(playlistId)).songs
                for (let i = 0; i < playlist.length; i++)
                    if (playlist[i].id == songIds)
                        offset = true
                return {
                    code: offset ? 200 : 404
                }
            }
        case "add":
            return async (songIds, playlistId) => {
                let result = await getAPI(
                    "AudioStation/playlist.cgi",
                    "SYNO.AudioStation.Playlist",
                    "updatesongs", [{
                            key: "offset",
                            value: -1
                        },
                        {
                            key: "limit",
                            value: 0
                        },
                        {
                            key: "id",
                            value: playlistId
                        },
                        {
                            key: "songs",
                            value: songIds
                        }
                    ]
                );
                return {
                    code: result.success ? 200 : 400
                }
            }
        case "delete":
            return async (songIds, playlistId) => {
                let offset;
                let playlist = (await getPlaylistSongs(playlistId)).songs
                for (let i = 0; i < playlist.length; i++)
                    if (playlist[i].id == songIds)
                        offset = i
                let result = await getAPI(
                    "AudioStation/playlist.cgi",
                    "SYNO.AudioStation.Playlist",
                    "updatesongs", [{
                            key: "offset",
                            value: offset
                        },
                        {
                            key: "limit",
                            value: 1
                        },
                        {
                            key: "id",
                            value: playlistId
                        },
                        {
                            key: "songs",
                            value: ''
                        }
                    ],
                    3
                );
                return {
                    code: result.success ? 200 : 400
                }
            };

    }
}
async function ratingSong(songid, rating) {
    let result = await getAPI("AudioStation/song.cgi", "SYNO.AudioStation.Song", "setrating", [{
            key: "id",
            value: songid
        },
        {
            key: "rating",
            value: rating
        }
    ], 3);
    return result.success
}
async function getUserPlaylists() {
    let info = await getAPI("AudioStation/info.cgi", "SYNO.AudioStation.Info", "getinfo", [], 4);
    let result = (await getPlaylists()).playlists
    // 看看 484 管理員
    return info.data.is_manager ? result : result.filter(i => i.id.match(/^playlist_personal_normal/g));
}
async function searchLyrics(keyword) {
    let PARAMS_JSON = [{
            key: "additional",
            value: "full_lyrics"
        },
        {
            key: "limit",
            value: 30
        },
        {
            key: "title",
            value: keyword
        },
        {
            key: "artist",
            value: ""
        }
    ];
    result = (await getAPI(
        "AudioStation/lyrics_search.cgi",
        "SYNO.AudioStation.LyricsSearch",
        "searchlyrics",
        PARAMS_JSON,
        2
    )).data;
    if (result) return {
        lyrics: parseLyrics(result.lyrics)
    };
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
    getAlbumSongs,
    getFolders,
    getFolderFiles,
    getArtists,
    getArtistAlbums,
    getComposers,
    getComposerAlbums,
    getPlaylists,
    getPlaylistSongs,
    getRandomSongs,
    getLyric,
    playlistOperation,
    getUserPlaylists,
    ratingSong
    //searchLyrics //太慢
};