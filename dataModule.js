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
// 取得封面
router.get('/cover/:moduleName/:data', async(req, res) => {
    let moduleName = req.params.moduleName
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module) return res.status(501).send("The required module is currently unavailable :(")

    //http://localhost:3000/pokaapi/cover/DSM/eyJ0eXBlIjoiYXJ0aXN0IiwiaW5mbyI6IuOCjeOCkyJ9
    // -> {"type":"artist","info":"ろん"}
    //http://localhost:3000/pokaapi/cover/DSM/eyJ0eXBlIjoiYWxidW0iLCJpbmZvIjp7ImFsYnVtX25hbWUiOiLmrr%2FloILihaIiLCJhcnRpc3RfbmFtZSI6Iue6r%2BeZvSwgRGlnZ2VyIGZlYXQuIOS5kOato%2Be7qywg5rSb5aSp5L6dIiwiYWxidW1fYXJ0aXN0X25hbWUiOiJWYXJpb3VzIEFydGlzdHMifX0%3D
    // -> {"type":"album","info":{"album_name":"殿堂Ⅲ","artist_name":"纯白, Digger feat. 乐正绫, 洛天依","album_artist_name":"Various Artists"}}
    let cover = await _module.getCover(pokaDecode(req.params.data))
    if (typeof cover == 'string')
        return res.redirect(cover)
    else
        return cover.pipe(res)
});
// 取得歌曲
router.get('/song/:moduleName/:songRes/:songId', async(req, res) => {
    let moduleName = req.params.moduleName
    let _module = moduleName in moduleList ? require(moduleList[moduleName].js) : null;
    // 沒這東西
    if (!_module) return res.status(501).send("The required module is currently unavailable :(")
    let song = await _module.getSong(req, req.params.songRes, req.params.songId)
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

module.exports = router;