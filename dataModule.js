const fs = require("fs");
const path = require("path");
const config = require("./config.json"); // 設定檔
const pokaLog = require("./log") // 可愛控制台輸出
const express = require("express")
const router = express.Router();
const db = require("./db/db.js");
const lyricdb = require("./db/lyric.js");
const { addLog } = require("./db/log");
if (config.PokaPlayer.debug) {
    router.use(require('cors')({
        credentials: true,
        origin: 'http://localhost:8080'
    }))
}

router.use(db.session);
router.use(express.json());
let moduleList = {};
fs.readdir(__dirname + "/dataModule", (err, files) => {
    if (err) return console.error(err);
    files.forEach(async file => {
        if (path.extname(file) == ".js" && !file.match(/^._/)) {
            let uri = __dirname + "/dataModule/" + file,
                _module = require(uri);
            let moduleData = {
                name: _module.name,
                active: Object.keys(_module),
                js: uri
            };
            let enabled = moduleData.active.indexOf("onLoaded") > -1 && _module.enabled ?
                await _module.onLoaded() :
                true;
            if (enabled && _module.enabled) moduleList[moduleData.name] = moduleData;
            else if (moduleData.name) pokaLog.logDB('dataModule', `Module ${moduleData.name} disabled`)
        }
    });
});
// 首頁
router.get("/", (req, res) => {
    res.send("PokaPlayer API");
});
// 先在這裡蹦蹦蹦再轉交給其他好朋友
router.use((req, res, next) => {
    if (req.path == "/v2/user/login/" || req.path == "/v2/user/logout/") {
        return next();
    }
    if (req.session.user) {
        return next();
    } else {
        return res.status(403).send("Permission Denied Desu");
    }
});
// router
router.use("/playlist", require("./router/playlist"));
router.use("/v2", require("./router/index"));
//-----------------------------> 首頁
// 取得想推薦的東西(?
router.get("/home/", async (req, res) => {
    //http://localhost:3000/pokaapi/home
    let resData = [];
    await Promise.all(
        Object.values(moduleList)
            .filter(x => x.active.includes("getHome"))
            .map(async x => {
                try {
                    let results = (await require(x.js).getHome(req.session.user)) || null;
                    for (let result of results) {
                        if (result) {
                            if (Object.values(result).filter(v => v.length).length > 0)
                                resData.push(result)
                        }
                    }
                } catch (e) {
                    showError(x.name, e)
                }
            })
    )
    return res.json(resData);
});

//-----------------------------> 資料夾
// 取得資料夾清單(根目錄)
router.get("/folders/", async (req, res) => {
    //http://localhost:3000/pokaapi/folders
    let resData = {
        folders: [],
        songs: []
    };
    await Promise.all(
        Object.values(moduleList)
            .filter(x => x.active.includes("getFolders"))
            .map(async x => {
                try {
                    let result = (await require(x.js).getFolders()) || null;
                    if (result) {
                        for (let item of Object.keys(result)) {
                            resData[item] = resData[item].concat(result[item])
                        }
                    }
                } catch (e) {
                    showError(x.name, e)
                }
            })
    )
    res.json(resData);
});
// 透過取得資料夾內檔案清單
router.get("/folderFiles/", async (req, res) => {
    //http://localhost:3000/pokaapi/folderFiles/?moduleName=DSM&id=dir_636
    let moduleName = req.query.moduleName;
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module || moduleList[moduleName].active.indexOf("getFolderFiles") == -1)
        return res.status(501).send("The required module is currently unavailable :(");

    let resData = { folders: [], songs: [] };

    try {
        resData = await _module.getFolderFiles(req.query.id);
    } catch (e) {
        showError(moduleName, e)
    }
    return res.json(resData);
});

//-----------------------------> 搜尋
// 搜尋
router.get("/search/", async (req, res) => {
    //http://localhost:3000/pokaapi/search/?keyword=a
    let resData = {
        folders: [],
        songs: [],
        albums: [],
        artists: [],
        composers: [],
        playlists: []
    };
    await Promise.all(
        Object.values(moduleList)
            .filter(x => x.active.includes("search"))
            .map(async x => {
                try {
                    let result = (await require(x.js).search(req.query.keyword)) || null;
                    if (result) {
                        for (let item of Object.keys(result)) {
                            resData[item] = resData[item].concat(result[item])
                        }
                    }
                } catch (e) {
                    showError(x.name, e)
                }
            })
    )
    return res.json(resData);
});
//-----------------------------> 專輯
// 取得專輯清單
router.get("/albums/", async (req, res) => {
    //http://localhost:3000/pokaapi/albums
    let resData = [];
    await Promise.all(
        Object.values(moduleList)
            .filter(x => x.active.includes("getAlbums"))
            .map(async x => {
                try {
                    let { albums } = (await require(x.js).getAlbums()) || null;
                    if (albums) {
                        resData = resData.concat(albums)
                    }
                } catch (e) {
                    showError(x.name, e)
                }
            })
    )
    res.json({ albums: resData });
});
// 取得專輯歌曲
router.get("/albumSongs/", async (req, res) => {
    let moduleName = req.query.moduleName;
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module || moduleList[moduleName].active.indexOf("getAlbumSongs") == -1)
        return res.status(501).send("The required module is currently unavailable :(");

    //http://localhost:3000/pokaapi/albumSongs/?moduleName=DSM&data={%22album_name%22:%22%E2%8A%BF%22,%22artist_name%22:%22Perfume%22,%22album_artist_name%22:%22Perfume%22}
    // -> {"album_name":"⊿","artist_name":"Perfume","album_artist_name":"Perfume"}
    let albumSongs;
    try {
        albumSongs = await _module.getAlbumSongs(req.query.data);
    } catch (e) {
        albumSongs = {
            songs: []
        };
        showError(moduleName, e)
    }
    return res.json(albumSongs);
});
// 取得專輯資料
router.get("/album/", async (req, res) => {
    let moduleName = req.query.moduleName;
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module || moduleList[moduleName].active.indexOf("getAlbum") == -1)
        return res.status(501).send("The required module is currently unavailable :(");

    //http://localhost:3000/pokaapi/album/?moduleName=Netease2&id=34841226
    // -> Album + Songs
    let album;
    try {
        album = await _module.getAlbum(req.query.id);
    } catch (e) {
        showError(x.name, e)
    }
    return res.json(album);
});
//-----------------------------> 播放清單
// 取得播放清單的清單
router.get("/playlists/", async (req, res) => {
    //http://localhost:3000/pokaapi/playlists
    let r = {
        playlists: [],
        playlistFolders: []
    };
    res.header("Cache-Control", "max-age=7200") //快取 2hr
    await Promise.all(
        Object.values(moduleList)
            .filter(x => x.active.includes("getPlaylists"))
            .map(async x => {
                try {
                    let res = (await require(x.js).getPlaylists(req.session.user)) || null;
                    if (res) {
                        if (res.playlists)
                            r.playlists = r.playlists.concat(res.playlists);
                        if (res.playlistFolders)
                            r.playlistFolders = r.playlistFolders.concat(res.playlistFolders);
                    }
                } catch (e) {
                    showError(x.name, e)
                }
            })
    )
    res.json(r);
});

// 取得播放清單的歌曲
router.get("/playlistSongs/", async (req, res) => {
    //http://localhost:3000/pokaapi/playlistSongs/?moduleName=DSM&id=playlist_shared_normal/15
    let moduleName = req.query.moduleName;
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module || moduleList[moduleName].active.indexOf("getPlaylistSongs") == -1)
        return res.status(501).send("The required module is currently unavailable :(");
    let r;
    try {
        r = await _module.getPlaylistSongs(req.query.id, req.session.user);
    } catch (e) {
        showError(moduleName, e)
    }
    return res.json(r || null);
});
//-----------------------------> 演出者
// 取得演出者資料
router.get("/artist/", async (req, res) => {
    //http://localhost:3000/pokaapi/artist/?moduleName=Netease2&id=19859
    let moduleName = req.query.moduleName;
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module || moduleList[moduleName].active.indexOf("getArtist") == -1)
        return res.status(501).send("The required module is currently unavailable :(");
    let r;
    try {
        r = await _module.getArtist(req.query.id);
    } catch (e) {
        showError(moduleName, e)
    }
    return res.json(r || null);
});

// 取得演出者清單
router.get("/artists/", async (req, res) => {
    //http://localhost:3000/pokaapi/artists
    let r = {
        artists: []
    };
    for (var i in Object.keys(moduleList)) {
        let x = moduleList[Object.keys(moduleList)[i]];
        let y = require(x.js);
        if (x.active.indexOf("getArtists") > -1) {
            try {
                let list = (await y.getArtists()) || null;
                if (list) {
                    for (i = 0; i < list.artists.length; i++) r.artists.push(list.artists[i]);
                }
            } catch (e) {
                showError(x.name, e)
            }
        }
    }
    res.json(r);
});
// 取得演出者的專輯
router.get("/artistAlbums/", async (req, res) => {
    //http://localhost:3000/pokaapi/artistAlbums/?moduleName=DSM&id=ひいらぎ
    let moduleName = req.query.moduleName;
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module || moduleList[moduleName].active.indexOf("getArtistAlbums") == -1)
        return res.status(501).send("The required module is currently unavailable :(");
    let r;
    try {
        r = await _module.getArtistAlbums(req.query.id);
    } catch (e) {
        showError(moduleName, e)
    }
    return res.json(r);
});
//-----------------------------> 作曲者

router.get("/composer/", async (req, res) => {
    //http://localhost:3000/pokaapi/composers/?moduleName=DSN&id=19859
    let moduleName = req.query.moduleName;
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module || moduleList[moduleName].active.indexOf("getComposer") == -1)
        return res.status(501).send("The required module is currently unavailable :(");
    let r;
    try {
        r = await _module.getComposer(req.query.id);
    } catch (e) {
        showError(moduleName, e)
    }
    return res.json(r || null);
});

// 取得作曲者清單
router.get("/composers/", async (req, res) => {
    //http://localhost:3000/pokaapi/composers
    let r = {
        composers: []
    };
    for (var i in Object.keys(moduleList)) {
        let x = moduleList[Object.keys(moduleList)[i]];
        let y = require(x.js);
        if (x.active.indexOf("getComposers") > -1) {
            try {
                let list = (await y.getComposers()) || null;
                if (list) {
                    for (i = 0; i < list.composers.length; i++) r.composers.push(list.composers[i]);
                }
            } catch (e) {
                showError(x.name, e)
            }
        }
    }
    res.json(r);
});

// 取得作曲者的專輯
router.get("/composerAlbums/", async (req, res) => {
    //http://localhost:3000/pokaapi/composerAlbums/?moduleName=DSM&id=飛内将大
    let moduleName = req.query.moduleName;
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module || moduleList[moduleName].active.indexOf("getComposerAlbums") == -1)
        return res.status(501).send("The required module is currently unavailable :(");
    let r;
    try {
        r = await _module.getComposerAlbums(req.query.id);
    } catch (e) {
        showError(moduleName, e)
    }
    return res.json(r || {
        albums: []
    });
});
//-----------------------------> 歌曲
// 取得歌曲串流
router.get("/song/", async (req, res) => {
    // http://localhost:3000/pokaapi/song/?moduleName=DSM&songRes=original&songId=music_758 //這首 Chrome 會出錯
    // http://localhost:3000/pokaapi/song/?moduleName=DSM&songRes=original&songId=music_941
    // -> getSong(req, "original", "music_758")
    let moduleName = req.query.moduleName;
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module) return res.status(501).send("The required module is currently unavailable :(");
    let song = await _module.getSong(req, req.query.songRes, req.query.songId, res);
    if (typeof song == "string") return res.redirect(song);
    else if (song) {
        let { headers: resHeaders } = song
        let ifNull = x => x ?? "";
        //針對 Audio 寫入 Header 避免 Chrome 時間軸不能跳
        let headers = {
            "Accept-Ranges": ifNull(resHeaders["accept-ranges"]),
            "Content-Length": ifNull(resHeaders["content-length"]),
            "Content-Range": ifNull(resHeaders["content-range"]),
            "Content-Type": ifNull(resHeaders["content-type"]),
        }
        // fix for iOS AVPlayer
        if (headers["Content-Type"] == "audio/x-flac") {
            headers["Content-Type"] = "audio/flac";
        }
        // disable keep-alive
        headers["Connection"] = "close";
        // send data
        res.writeHead(206, headers);
        return song.data.pipe(res);
    }
});
//-----------------------------> 封面
// 取得封面
router.get("/cover/", async (req, res) => {
    let moduleName = req.query.moduleName;
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module || moduleList[moduleName].active.indexOf("getCover") == -1)
        return res.status(501).send("The required module is currently unavailable :(");

    //http://localhost:3000/pokaapi/cover/?moduleName=DSM&data={%22type%22:%22artist%22,%22info%22:%22%E3%82%8D%E3%82%93%22}
    // -> {"type":"artist","info":"ろん"}
    //http://localhost:3000/pokaapi/cover/?moduleName=DSM&data={%22type%22:%22album%22,%22info%22:{%22album_name%22:%22%E6%AE%BF%E5%A0%82%E2%85%A2%22,%22artist_name%22:%22%E7%BA%AF%E7%99%BD,%20Digger%20feat.%20%E4%B9%90%E6%AD%A3%E7%BB%AB,%20%E6%B4%9B%E5%A4%A9%E4%BE%9D%22,%22album_artist_name%22:%22Various%20Artists%22}}
    // -> {"type":"album","info":{"album_name":"殿堂Ⅲ","artist_name":"纯白, Digger feat. 乐正绫, 洛天依","album_artist_name":"Various Artists"}}
    let cover = await _module.getCover(req.query.data);
    res.header("Cache-Control", "max-age=7200") //快取 2hr
    return cover.pipe(res);
});

router.get("/req/", async (req, res) => {
    let moduleName = req.query.moduleName;
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module || moduleList[moduleName].active.indexOf("req") == -1)
        return res.status(501).send("The required module is currently unavailable :(");

    //http://localhost:3000/pokaapi/req/?moduleName=Netease2&data=http%3A%2F%2Fp3.music.126.net%2FJB1yLZyVMPsbbSlSkfJdRw%3D%3D%2F6630055116648156.jpg
    // -> Image
    let cover = await _module.req(req.query.data);
    if (!cover) return res.sendStatus(404);

    if (typeof cover == "string" && cover.startsWith("http")) return res.redirect(cover);

    if (cover.pipe) {
        res.header("Cache-Control", "max-age=7200") //快取 2hr
        return cover.pipe(res);
    }

    if (cover instanceof Buffer) {
        res.header("Cache-Control", "max-age=7200") //快取 2hr
        return res.send(cover);
    }

    return res.sendStatus(500);
});
//-----------------------------> 歌詞
// 搜尋歌詞
router.get("/searchLyrics/", async (req, res) => {
    //http://localhost:3000/pokaapi/searchLyrics/?keyword=a
    let resData = {
        lyrics: []
    };
    await Promise.all(
        Object.values(moduleList)
            .filter(x => x.active.includes("searchLyrics"))
            .map(async x => new Promise(async (resolve, reject) => {
                let timeout = 10
                const timer = setTimeout(() => {
                    console.log(`${x.name} timed out after ${timeout}s`)
                    return resolve()
                }, timeout * 1000);
                try {
                    let { lyrics } = (await require(x.js).searchLyrics(req.query.keyword)) || null;
                    if (lyrics) resData.lyrics = [...resData.lyrics, ...lyrics]
                    clearTimeout(timer);
                    resolve()
                }
                catch (e) {
                    showError(x.name, e)
                }
            }))
    )

    function similarity(s1, s2) {
        function editDistance(s1, s2) {
            s1 = s1.toLowerCase();
            s2 = s2.toLowerCase();

            let costs = new Array();
            for (var i = 0; i <= s1.length; i++) {
                let lastValue = i;
                for (let j = 0; j <= s2.length; j++) {
                    if (i == 0)
                        costs[j] = j;
                    else {
                        if (j > 0) {
                            let newValue = costs[j - 1];
                            if (s1.charAt(i - 1) != s2.charAt(j - 1))
                                newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                            costs[j - 1] = lastValue;
                            lastValue = newValue;
                        }
                    }
                }
                if (i > 0)
                    costs[s2.length] = lastValue;
            }
            return costs[s2.length];
        }
        let longer = s1;
        let shorter = s2;
        if (s1.length < s2.length) {
            longer = s2;
            shorter = s1;
        }
        let longerLength = longer.length;
        if (longerLength == 0) {
            return 1.0;
        }
        return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
    }
    resData.lyrics = resData.lyrics
        .map(item => {
            let rate = similarity(req.query.keyword, `${item.name} ${item.artist}`)
            return { ...item, rate }
        })
        .sort((a, b) => b.rate - a.rate)

    return res.json(resData);
});
router.post("/lyric/", async (req, res) => {
    let {
        title,
        artist,
        songId,
        source,
        lyric
    } = req.body
    res.json(await lyricdb.saveLyric({
        title,
        artist,
        songId,
        source,
        lyric
    }))
})
router.get("/lyric/", async (req, res) => {
    //http://localhost:3000/pokaapi/lyric/?moduleName=DSM&id=music_1801
    let moduleName = req.query.moduleName;
    let lyric = ``;
    try {
        lyric = await lyricdb.getLyric({
            songId: req.query.id,
            source: moduleName
        });
        if (!lyric) {
            let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
            // 沒這東西
            if (!(!_module || moduleList[moduleName].active.indexOf("getLyric") == -1))
                lyric = await _module.getLyric(req.query.id);
        }
    } catch (e) {
        showError(moduleName, e)
    }
    return res.json({
        lyrics: lyric ? [{
            source: req.query.moduleName,
            id: req.query.id,
            lyric: lyric
        }] : []
    });
});
//-----------------------------> 隨機
// 隨機歌曲
router.get("/randomSongs/", async (req, res) => {
    //http://localhost:3000/pokaapi/randomSongs/
    let resData = {
        songs: []
    };
    for (var i in Object.keys(moduleList)) {
        let x = moduleList[Object.keys(moduleList)[i]];
        let y = require(x.js);
        if (x.active.indexOf("getRandomSongs") > -1) {
            try {
                let result = (await y.getRandomSongs(req.query.keyword)) || null;
                if (result && result.songs)
                    for (i = 0; i < result.songs.length; i++) resData.songs.push(result.songs[i]);
            } catch (e) {
                showError(x.name, e)
            }
        }
    }
    return res.json(resData);
});

router.use((req, res, next) => {
    res.status(404).send("PokaPlayer API - 404");
});

function showError(moduleName = false, error) {
    pokaLog.logDMErr(moduleName || '?', error)
    addLog({
        level: "error",
        type: "system",
        event: `${moduleName} Error`,
        description: error.stack
    })
}
// catch err
process.on('uncaughtException', err => {
    pokaLog.logErr('ERROR', err)
    addLog({
        level: "error",
        type: "system",
        event: `uncaughtException`,
        description: err.stack
    })
});
module.exports = router;