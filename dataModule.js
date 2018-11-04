const fs = require("fs");
const path = require("path");
const config = require("./config.json"); // 設定檔
const playlist = fs.existsSync("./playlist.json") ? require("./playlist.json") : []; // 歌單
const router = require("express").Router();
const FileStore = require("session-file-store")(require("express-session")); // session
const session = require("express-session")({
    store: new FileStore(),
    secret: config.PokaPlayer.sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: new Date(Date.now() + 60 * 60 * 1000 * 24 * 7)
    }
});
const bodyParser = require("body-parser");

router.use(session);
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

let moduleList = {};
fs.readdir(__dirname + "/dataModule", (err, files) => {
    if (err) return console.error(err);
    files.forEach(async file => {
        if (path.extname(file) == ".js") {
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
        }
    });
});

// 首頁
router.get("/", (req, res) => {
    res.send("PokaPlayer API");
});
// 先在這裡蹦蹦蹦再轉交給其他好朋友
router.use((req, res, next) => {
    if (req.session.pass != config.PokaPlayer.password && config.PokaPlayer.passwordSwitch)
        res.status(403).send("Permission Denied Desu");
    else {
        if (req.method.toUpperCase() === "GET" && config.PokaPlayer.debug) {
            res.header("Cache-Control", "max-age=7200") //快取 2hr
        }
        next();
    }
});
//-----------------------------> 首頁
// 取得想推薦的東西(?
router.get("/home/", async(req, res) => {
    //http://localhost:3000/pokaapi/home
    let resData = {
        folders: [],
        songs: [],
        albums: [],
        songs: [],
        artists: [],
        composers: [],
        playlists: []
    };
    for (var i in Object.keys(moduleList)) {
        let x = moduleList[Object.keys(moduleList)[i]];
        let y = require(x.js);
        if (x.active.indexOf("getHome") > -1) {
            try {
                let result = (await y.getHome(playlist)) || null;
                if (result) {
                    if (result.folders)
                        for (i = 0; i < result.folders.length; i++)
                            resData.folders.push(result.folders[i]);
                    if (result.songs)
                        for (i = 0; i < result.songs.length; i++)
                            resData.songs.push(result.songs[i]);
                    if (result.albums)
                        for (i = 0; i < result.albums.length; i++)
                            resData.albums.push(result.albums[i]);
                    if (result.artists)
                        for (i = 0; i < result.artists.length; i++)
                            resData.artists.push(result.artists[i]);
                    if (result.composers)
                        for (i = 0; i < result.composers.length; i++)
                            resData.composers.push(result.composers[i]);
                    if (result.playlists)
                        for (i = 0; i < result.playlists.length; i++)
                            resData.playlists.push(result.playlists[i]);
                }
            } catch (e) {
                showError(x.name, e)
            }
        }
    }
    return res.json(resData);
});
//-----------------------------> 釘選好朋油
router.post("/addPin/", async(req, res) => {
    //http://localhost:3000/pokaapi/addPin/?moduleName=DSM&type=album&id={%22album%22:%22%E4%B8%96%E7%95%8C%E3%81%AE%E6%9E%9C%E3%81%A6%E3%81%AB%E5%90%9B%E3%81%8C%E3%81%84%E3%81%A6%E3%82%82%22,%22album_artist%22:%22%E5%96%9C%E5%A4%9A%E4%BF%AE%E5%B9%B3%22}&name=%E4%B8%96%E7%95%8C%E3%81%AE%E6%9E%9C%E3%81%A6%E3%81%AB%E5%90%9B%E3%81%8C%E3%81%84%E3%81%A6%E3%82%82
    //[{"type":"album","criteria":{"album":"世界の果てに君がいても","album_artist":"喜多修平"},"name":"世界の果てに君がいても"}]
    let moduleName = req.query.moduleName;
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module || moduleList[moduleName].active.indexOf("addPin") == -1)
        return res.send("disabled");
    try {
        res.json(await _module.addPin(req.query.type, req.query.id, req.query.name));
    } catch (e) {
        showError(moduleList[moduleName].name, e)
        return res.send("disabled");
    }
});
router.post("/unPin/", async(req, res) => {
    //http://localhost:3000/pokaapi/unPin/?moduleName=DSM&type=album&id={%22album%22:%22%E4%B8%96%E7%95%8C%E3%81%AE%E6%9E%9C%E3%81%A6%E3%81%AB%E5%90%9B%E3%81%8C%E3%81%84%E3%81%A6%E3%82%82%22,%22album_artist%22:%22%E5%96%9C%E5%A4%9A%E4%BF%AE%E5%B9%B3%22}&name=%E4%B8%96%E7%95%8C%E3%81%AE%E6%9E%9C%E3%81%A6%E3%81%AB%E5%90%9B%E3%81%8C%E3%81%84%E3%81%A6%E3%82%82
    //[{"type":"album","criteria":{"album":"世界の果てに君がいても","album_artist":"喜多修平"},"name":"世界の果てに君がいても"}]
    let moduleName = req.query.moduleName;
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module || moduleList[moduleName].active.indexOf("unPin") == -1)
        return res.send("disabled");

    try {
        res.json(await _module.unPin(req.query.type, req.query.id, req.query.name));
    } catch (e) {
        showError(moduleList[moduleName].name, e)
        return res.send("disabled");
    }
});
router.post("/isPinned/", async(req, res) => {
    //http://localhost:3000/pokaapi/isPinned/?moduleName=DSM&type=album&id={%22album%22:%22%E4%B8%96%E7%95%8C%E3%81%AE%E6%9E%9C%E3%81%A6%E3%81%AB%E5%90%9B%E3%81%8C%E3%81%84%E3%81%A6%E3%82%82%22,%22album_artist%22:%22%E5%96%9C%E5%A4%9A%E4%BF%AE%E5%B9%B3%22}&name=%E4%B8%96%E7%95%8C%E3%81%AE%E6%9E%9C%E3%81%A6%E3%81%AB%E5%90%9B%E3%81%8C%E3%81%84%E3%81%A6%E3%82%82
    //[{"type":"album","criteria":{"album":"世界の果てに君がいても","album_artist":"喜多修平"},"name":"世界の果てに君がいても"}]
    let moduleName = req.query.moduleName;
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module || moduleList[moduleName].active.indexOf("isPinned") == -1)
        return res.send("disabled");

    try {
        res.json(await _module.isPinned(req.query.type, req.query.id, req.query.name));
    } catch (e) {
        showError(moduleList[moduleName].name, e)
        return res.send("disabled");
    }
});

//-----------------------------> 資料夾
// 取得資料夾清單(根目錄)
router.get("/folders/", async(req, res) => {
    //http://localhost:3000/pokaapi/folders
    let folders = { folders: [], songs: [] };
    for (var i in Object.keys(moduleList)) {
        let x = moduleList[Object.keys(moduleList)[i]];
        let y = require(x.js);
        if (x.active.indexOf("getFolders") > -1) {
            try {
                let folderList = (await y.getFolders()) || null;
                if (folderList) {
                    for (i = 0; i < folderList.folders.length; i++)
                        folders.folders.push(folderList.folders[i]);
                    for (i = 0; i < folderList.songs.length; i++)
                        folders.songs.push(folderList.songs[i]);
                }
            } catch (e) {
                showError(x.name, e)
            }
        }
    }
    res.json(folders);
});
// 透過取得資料夾內檔案清單
router.get("/folderFiles/", async(req, res) => {
    //http://localhost:3000/pokaapi/folderFiles/?moduleName=DSM&id=dir_636
    let moduleName = req.query.moduleName;
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module || moduleList[moduleName].active.indexOf("getFolderFiles") == -1)
        return res.status(501).send("The required module is currently unavailable :(");

    let resData = { folders: [], songs: [] };

    try {
        let info = await _module.getFolderFiles(req.query.id);
        for (i = 0; i < info.folders.length; i++) resData.folders.push(info.folders[i]);
        for (i = 0; i < info.songs.length; i++) resData.songs.push(info.songs[i]);
    } catch (e) {
        showError(moduleName, e)
    }
    return res.json(resData);
});

//-----------------------------> 搜尋
// 搜尋
router.get("/search/", async(req, res) => {
    //http://localhost:3000/pokaapi/search/?keyword=a
    let resData = {
        folders: [],
        songs: [],
        albums: [],
        songs: [],
        artists: [],
        composers: [],
        playlists: []
    };
    for (var i in Object.keys(moduleList)) {
        let x = moduleList[Object.keys(moduleList)[i]];
        let y = require(x.js);
        if (x.active.indexOf("search") > -1) {
            try {
                let result = (await y.search(req.query.keyword)) || null;
                if (result) {
                    if (result.folders)
                        for (i = 0; i < result.folders.length; i++)
                            resData.folders.push(result.folders[i]);
                    if (result.songs)
                        for (i = 0; i < result.songs.length; i++)
                            resData.songs.push(result.songs[i]);
                    if (result.albums)
                        for (i = 0; i < result.albums.length; i++)
                            resData.albums.push(result.albums[i]);
                    if (result.artists)
                        for (i = 0; i < result.artists.length; i++)
                            resData.artists.push(result.artists[i]);
                    if (result.composers)
                        for (i = 0; i < result.composers.length; i++)
                            resData.composers.push(result.composers[i]);
                    if (result.playlists)
                        for (i = 0; i < result.playlists.length; i++)
                            resData.playlists.push(result.playlists[i]);
                }
            } catch (e) {
                showError(x.name, e)
            }
        }
    }
    return res.json(resData);
});
//-----------------------------> 專輯
// 取得專輯清單
router.get("/albums/", async(req, res) => {
    //http://localhost:3000/pokaapi/albums
    let albums = { albums: [] };
    for (var i in Object.keys(moduleList)) {
        let x = moduleList[Object.keys(moduleList)[i]];
        let y = require(x.js);
        if (x.active.indexOf("getAlbums") > -1) {
            try {
                let albumList = (await y.getAlbums()) || null;
                if (albumList) {
                    for (i = 0; i < albumList.albums.length; i++)
                        albums.albums.push(albumList.albums[i]);
                }
            } catch (e) {
                showError(x.name, e)
            }
        }
    }
    res.json(albums);
});
// 取得專輯歌曲
router.get("/albumSongs/", async(req, res) => {
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
        albumSongs = { songs: [] };
        showError(moduleName, e)
    }
    return res.json(albumSongs);
});
// 取得專輯資料
router.get("/album/", async(req, res) => {
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
router.get("/playlists/", async(req, res) => {
    //http://localhost:3000/pokaapi/playlists
    let r = { playlists: [] };
    for (var i in Object.keys(moduleList)) {
        let x = moduleList[Object.keys(moduleList)[i]];
        let y = require(x.js);
        if (x.active.indexOf("getPlaylists") > -1) {
            try {
                let list = (await y.getPlaylists(playlist)) || null;
                if (list) {
                    for (i = 0; i < list.playlists.length; i++) r.playlists.push(list.playlists[i]);
                }
            } catch (e) {
                showError(x.name, e)
            }
        }
    }
    res.json(r);
});

// 取得播放清單資料夾
router.post("/playlists/", async(req, res) => {
    let moduleName = req.query.moduleName;
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module || moduleList[moduleName].active.indexOf("getPlaylists") == -1)
        return res.status(501).send("The required module is currently unavailable :(");
    let r;
    try {
        r = await _module.getPlaylists(req.body.playlists);
    } catch (e) {
        showError(moduleName, e)
    }
    return res.json(r || null);
});

// 取得播放清單的歌曲
router.get("/playlistSongs/", async(req, res) => {
    //http://localhost:3000/pokaapi/playlistSongs/?moduleName=DSM&id=playlist_shared_normal/15
    let moduleName = req.query.moduleName;
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module || moduleList[moduleName].active.indexOf("getPlaylistSongs") == -1)
        return res.status(501).send("The required module is currently unavailable :(");
    let r;
    try {
        r = await _module.getPlaylistSongs(req.query.id);
    } catch (e) {
        showError(moduleName, e)
    }
    return res.json(r || null);
});
// 取得可加入的播放清單
router.get("/userPlaylists/", async(req, res) => {
    //http://localhost:3000/pokaapi/userPlaylists/?moduleName=netease2
    let moduleName = req.query.moduleName;
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module || moduleList[moduleName].active.indexOf("getUserPlaylists") == -1)
        return res.status(501).send("The required module is currently unavailable :(");
    let r;
    try {
        r = await _module.getUserPlaylists();
    } catch (e) {
        showError(moduleName, e)
    }
    return res.json(r || null);
});

//-----------------------------> 演出者
// 取得演出者資料
router.get("/artist/", async(req, res) => {
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
router.get("/artists/", async(req, res) => {
    //http://localhost:3000/pokaapi/artists
    let r = { artists: [] };
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
router.get("/artistAlbums/", async(req, res) => {
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
// 取得作曲者清單
router.get("/composers/", async(req, res) => {
    //http://localhost:3000/pokaapi/composers
    let r = { composers: [] };
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
router.get("/composerAlbums/", async(req, res) => {
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
    return res.json(r || { albums: [] });
});
//-----------------------------> 歌曲
// 取得歌曲串流
router.get("/song/", async(req, res) => {
    // http://localhost:3000/pokaapi/song/?moduleName=DSM&songRes=original&songId=music_758 //這首 Chrome 會出錯
    // http://localhost:3000/pokaapi/song/?moduleName=DSM&songRes=original&songId=music_941
    // -> getSong(req, "original", "music_758")
    let moduleName = req.query.moduleName;
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module) return res.status(501).send("The required module is currently unavailable :(");
    let song = await _module.getSong(req, req.query.songRes, req.query.songId);
    if (typeof song == "string") return res.redirect(song);
    else
        return song
            .on("response", function(response) {
                //針對 Audio 寫入 Header 避免 Chrome 時間軸不能跳
                res.writeHead(206, {
                    "Accept-Ranges": response.headers["accept-ranges"] ?
                        response.headers["accept-ranges"] : "",
                    "Content-Length": response.headers["content-length"] ?
                        response.headers["content-length"] : "",
                    "Content-Range": response.headers["content-range"] ?
                        response.headers["content-range"] : "",
                    "Content-Type": response.headers["content-type"] ?
                        response.headers["content-type"] : ""
                });
            })
            .pipe(res);
});
//- 評分
router
    .get("/ratingSong/", async(req, res) => { // 戳戳看能不能用
        //http://localhost:3000/pokaapi/ratingSong/?moduleName=DSM
        let moduleName = req.query.moduleName;
        let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
        // 沒這東西
        if (!_module || moduleList[moduleName].active.indexOf("ratingSong") == -1)
            return res.status(501).send("The required module is currently unavailable :(");
        return res.json(true)
    })
    .post("/ratingSong/", async(req, res) => {
        /*
            req.body: {
                moduleName: "Netease2",
                songId: [songId <int>],
                rating: 0-5
            }
        */
        let moduleName = req.body.moduleName;
        let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
        // 沒這東西
        if (!_module || moduleList[moduleName].active.indexOf("ratingSong") == -1)
            return res.status(501).send("The required module is currently unavailable :(");
        return res.json(await _module.ratingSong(req.body.songId, req.body.rating))
    })

//-----------------------------> 封面
// 取得封面
router.get("/cover/", async(req, res) => {
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
    return cover.pipe(res);
});

router.get("/req/", async(req, res) => {
    let moduleName = req.query.moduleName;
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module || moduleList[moduleName].active.indexOf("req") == -1)
        return res.status(501).send("The required module is currently unavailable :(");

    //http://localhost:3000/pokaapi/req/?moduleName=Netease2&data=http%3A%2F%2Fp3.music.126.net%2FJB1yLZyVMPsbbSlSkfJdRw%3D%3D%2F6630055116648156.jpg
    // -> Image
    let cover = await _module.req(req.query.data);
    return cover ? cover.pipe(res) : false;
});
//-----------------------------> 歌詞
// 搜尋歌詞
router.get("/searchLyrics/", async(req, res) => {
    //http://localhost:3000/pokaapi/searchLyrics/?keyword=a
    let resData = { lyrics: [] };
    for (var i in Object.keys(moduleList)) {
        let x = moduleList[Object.keys(moduleList)[i]];
        let y = require(x.js);
        if (x.active.indexOf("searchLyrics") > -1) {
            try {
                let result = (await y.searchLyrics(req.query.keyword)) || null;
                if (result && result.lyrics)
                    for (i = 0; i < result.lyrics.length; i++)
                        resData.lyrics.push(result.lyrics[i]);
            } catch (e) {
                showError(x.name, e)
            }
        }
    }
    return res.json(resData);
});
router.get("/lyric/", async(req, res) => {
    //http://localhost:3000/pokaapi/lyric/?moduleName=DSM&id=music_1801
    let moduleName = req.query.moduleName;
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module || moduleList[moduleName].active.indexOf("getLyric") == -1)
        return res.status(501).send("The required module is currently unavailable :(");
    let lyric = ``;
    try {
        lyric = await _module.getLyric(req.query.id);
    } catch (e) {
        showError(moduleName, e)
    }
    return res.json({
        lyrics: [{
            source: req.query.moduleName,
            id: req.query.id,
            lyric: lyric
        }]
    });
});
//-----------------------------> 加入清單
router.get("/getUserPlaylists", async(req, res) => {
    //http://localhost:3000/pokaapi/getUserPlaylists/?moduleName=Netease2
    let moduleName = req.query.moduleName;
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module || moduleList[moduleName].active.indexOf("getUserPlaylists") == -1)
        return res.status(501).send("The required module is currently unavailable :(");
    let result;
    try {
        result = await _module.getUserPlaylists()
    } catch (e) {
        result = false
        showError(moduleName, e)
    }
    return res.json(result);
})

//-----------------------------> 清單動作
router
    .get("/playlistOperation", async(req, res) => {
        // http://localhost:3000/pokaapi/playlistOperation/
        /*
            ------->>>>>req.query: {
                moduleName: "Netease2",
                songIds: [songId <int>],
                playlistId <int>
            }
        */
        let moduleName = req.query.moduleName;
        let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
        // 沒這東西
        if (!_module || moduleList[moduleName].active.indexOf("playlistOperation") == -1)
            return res.status(501).send("The required module is currently unavailable :(");
        let result;
        try {
            result = await _module.playlistOperation("get")(JSON.parse(req.query.songIds), req.query.playlistId)
        } catch (e) {
            result = false
            showError(moduleName, e)
        }
        res.header("Cache-Control", "max-age=0") //快取 0
        return res.json(result);
    })
    .post("/playlistOperation", async(req, res) => {
        // http://localhost:3000/pokaapi/playlistOperation/
        /*
            req.body: {
                moduleName: "Netease2",
                songIds: [songId <int>],
                playlistId <int>
            }
        */
        let moduleName = req.body.moduleName;
        let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
        // 沒這東西
        if (!_module || moduleList[moduleName].active.indexOf("playlistOperation") == -1)
            return res.status(501).send("The required module is currently unavailable :(");
        let result;
        try {
            console.log(req.body.songIds, req.body.playlistId)
            result = await _module.playlistOperation("add")(req.body.songIds, req.body.playlistId)
        } catch (e) {
            result = false
            showError(moduleName, e)
        }
        return res.json(result);
    })
    .delete("/playlistOperation", async(req, res) => {
        // http://localhost:3000/pokaapi/playlistOperation/
        /*
            req.query: {
                moduleName: "Netease2",
                songIds: [songId <int>],
                playlistId <int>
            }
        */
        let moduleName = req.query.moduleName;
        let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
        // 沒這東西
        if (!_module || moduleList[moduleName].active.indexOf("playlistOperation") == -1)
            return res.status(501).send("The required module is currently unavailable :(");
        let result;
        try {
            result = await _module.playlistOperation("delete")(JSON.parse(req.query.songIds), req.query.playlistId)
        } catch (e) {
            result = false
            showError(moduleName, e)
        }
        res.header("Cache-Control", "max-age=0") //快取 0
        return res.json(result);
    })

//-----------------------------> 隨機
// 隨機歌曲
router.get("/randomSongs/", async(req, res) => {
    //http://localhost:3000/pokaapi/randomSongs/
    let resData = { songs: [] };
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
    console.log(`[DataModules]${moduleName ? `[${moduleName}]` : ''}發生了錯誤：（`);
    console.error(error);
}
module.exports = router;