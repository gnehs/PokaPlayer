const fs = require('fs')
const router = require('express').Router()
const modules = new Array()
fs.readdir(__dirname + "/dataModule", (err, files) => {
    files.forEach(file => {
        let uri = __dirname + "/dataModule/" + file,
            module = require(uri)
        let modulesData = {
            "js": uri,
            "name": module.name,
            "active": Object.keys(module)
        }
        modules.push(modulesData);
    });
    console.log(modules)
})

// 先在這裡蹦蹦蹦再轉交給其他好朋友
router.use((req, res, next) => {
    next();
});
// 首頁
router.get('/', (req, res) => {
    res.send('PokaPlayer API');
});
// 獲取歌曲
router.get('/song', (req, res) => {
    let songs = []
    modules.forEach(x => {
        let y = require(x.js)
        if (x.active.indexOf('getSongs') > -1) {
            let items = y.getSongs() || false
            console.log(items)
            if (items)
                songs.push({ moduleName: x.name, data: items })
        }
    })
    res.json(songs);
});

module.exports = router;