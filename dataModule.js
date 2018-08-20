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
        if (moduleData.active.indexOf('onLoaded')) { // 如果模組想要初始化
            _module.onLoaded()
        }
        moduleList[moduleData.name] = moduleData;
    });
    console.log("moduleList:", moduleList)
})


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
    if (!_module) return res.send("The required module is currently unavailable :(")

    let cover = await _module.getCover(data)
    return res.send(cover)
        // 不然我要怎麼傳圖片
});
// 取得歌曲
router.get('/song', (req, res) => {
    let songs = []
    Object.keys(moduleList).forEach(x => {
        x = moduleList[x]
        let y = require(x.js)
        if (x.active.indexOf('getSongs') > -1) {
            let items = y.getSongs() || null
            console.log(items)
            if (items)
                songs.push({ moduleName: x.name, data: items })
        }
    })
    res.json(songs);
});

module.exports = router;