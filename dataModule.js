const fs = require('fs')
const router = require('express').Router()

let moduleList = {};
fs.readdir(__dirname + "/dataModule", (err, files) => {
    if (err) return console.error(err)
    files.forEach(file => {
        let uri = __dirname + "/dataModule/" + file,
            _module = require(uri)
        let moduleData = {
            "name": _module.name,
            "active": Object.keys(_module),
            "js": uri
        }
        if (moduleData.active.indexOf('onLoaded') > -1) { // 如果模組想要初始化
            _module.onLoaded()
        }
        moduleList[moduleData.name] = moduleData;
    });
})

function pokaDecode(str) {
    return Buffer.from(str, 'base64').toString('utf-8')

}

// 先在這裡蹦蹦蹦再轉交給其他好朋友
router.use((req, res, next) => {
    next();
});
// 首頁
router.get('/', (req, res) => {
    res.send('PokaPlayer API');
});

/*
song {
    name:'',
    artist:'',
    album:'',
    cover:'',
    url:'',
    bitrate: 320000,
    lrc:'',
    source:'',
    id:'',
}
album {
    name:'',
    artist:'',
    year:'',
    source:'',
    id:''
}
artist {
    name:'',
    source:'',
    id:''
}
composer {
    name:'',
    source:'',
    id:''
}
folder {
    name:'',
    source:'',
    id:''
}
playlist {
    name: '',
    source:'',
    id: ''
}
*/
// 取得封面
router.get('/cover/', async(req, res) => {
    let moduleName = req.query.moduleName
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module) return res.status(501).send("The required module is currently unavailable :(")

    //http://localhost:3000/pokaapi/cover/?moduleName=DSM&data={%22type%22:%22artist%22,%22info%22:%22%E3%82%8D%E3%82%93%22}
    // -> {"type":"artist","info":"ろん"}
    //http://localhost:3000/pokaapi/cover/?moduleName=DSM&data={%22type%22:%22album%22,%22info%22:{%22album_name%22:%22%E6%AE%BF%E5%A0%82%E2%85%A2%22,%22artist_name%22:%22%E7%BA%AF%E7%99%BD,%20Digger%20feat.%20%E4%B9%90%E6%AD%A3%E7%BB%AB,%20%E6%B4%9B%E5%A4%A9%E4%BE%9D%22,%22album_artist_name%22:%22Various%20Artists%22}}
    // -> {"type":"album","info":{"album_name":"殿堂Ⅲ","artist_name":"纯白, Digger feat. 乐正绫, 洛天依","album_artist_name":"Various Artists"}}
    let cover = await _module.getCover(req.query.data)
    if (typeof cover == 'string')
        return res.redirect(cover)
    else
        return cover.pipe(res)
});
// 取得專輯歌曲
router.get('/albumSongs/', async(req, res) => {
    let moduleName = req.query.moduleName
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module) return res.status(501).send("The required module is currently unavailable :(")

    //http://localhost:3000/pokaapi/albumSongs/?moduleName=DSM&data={%22album_name%22:%22%E2%8A%BF%22,%22artist_name%22:%22Perfume%22,%22album_artist_name%22:%22Perfume%22}
    // -> {"album_name":"⊿","artist_name":"Perfume","album_artist_name":"Perfume"}
    let albumSongs = await _module.getAlbumSongs(req.query.data)
    return res.json(albumSongs)
});
// 取得歌曲
router.get('/song/', async(req, res) => {
    // http://localhost:3000/pokaapi/song/?moduleName=DSM&songRes=original&songId=music_758 //這首 Chrome 會出錯
    // http://localhost:3000/pokaapi/song/?moduleName=DSM&songRes=original&songId=music_941
    // -> getSong(req, "original", "music_758")
    let moduleName = req.query.moduleName
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module) return res.status(501).send("The required module is currently unavailable :(")
    let song = await _module.getSong(req, req.query.songRes, req.query.songId)
    if (typeof song == 'string')
        return res.redirect(song)
    else
        return song.on('response', function(response) {
            //針對 Audio 寫入 Header 避免 Chrome 時間軸不能跳
            res.writeHead(206, {
                "Accept-Ranges": response.headers['accept-ranges'] ? response.headers['accept-ranges'] : '',
                "Content-Length": response.headers['content-length'] ? response.headers['content-length'] : '',
                "Content-Range": response.headers['content-range'] ? response.headers['content-range'] : '',
                "Content-Type": response.headers['content-type'] ? response.headers['content-type'] : ''
            })
        }).pipe(res)
});
// 取得歌曲
/*router.get('/song/:moduleName/:data', (req, res) => {
    let songs = {}
    Object.keys(moduleList).forEach(async(x) => {
        x = moduleList[x]
        let y = require(x.js)
        if ('getSong' in x.active) {
            let songList = await y.getSongs() || null
            console.log(songList)
            if (songList) {
                if (!songs[moduleName]) songs[moduleName] = songList
                else songs[moduleName].concat(songList)
            }
        }
    })
    res.json(songs);
});*/
router.use((req, res, next) => {
    res
        .status(404)
        .send('PokaPlayer API - 404');
});

module.exports = router;