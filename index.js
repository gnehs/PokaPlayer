const fs = require('fs'); //檔案系統
const config = require('./config.json'); // 設定檔
const schedule = require('node-schedule'); // 很會計時ㄉ朋友
const base64 = require('base-64');
//express
const express = require('express');
const session = require('express-session');
const helmet = require('helmet'); // 防範您的應用程式出現已知的 Web 漏洞
const bodyParser = require('body-parser'); // 讀入 post 請求
const app = express(); // Node.js Web 架構
app.set('views', __dirname + '/views');
app.set('view engine', 'pug')
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet.hidePoweredBy({ setTo: 'PHP/5.2.1' }));
app.use(session({
    secret: 'ㄐㄐ讚' + Math.random().toString(36).substr(2),
    resave: false,
    saveUninitialized: false,
}));
// 時間處理
const moment = require('moment-timezone');
moment.locale('zh-tw');
moment.tz.setDefault("Asia/Taipei");
//請求
var request = require('request');
var j = request.jar()
var request = request.defaults({ jar: j })

// 設定 js icon css 目錄
app.use('/js', express.static('js'))
app.use('/css', express.static('css'))
app.use('/img', express.static('img'))

// 啟動囉
app.listen(3000, async() => {
    console.log("/////  PokaPlayer  /////")
    console.log("🌏 http://localhost:3000")
    console.log(moment().format("🕒 YYYY/MM/DD HH:mm"))
    console.log("////////////////////////")

    var a = await login(config.DSM)
    if (!a.success) {
        console.error("登入失敗，請檢查您的設定檔是否正確")
        process.exit()
    } else {
        //var b = await syno.random100(config.DSM)
        //console.log(b)
    }
})

// 隨機圖圖
app.get('/og/og.png', (req, res) => {
    var files = fs.readdirSync("./ogimage/").filter(function(i, n) {
        if ((i.toString().indexOf('.png') > -1 || i.toString().indexOf('.jpg') > -1) && i.toString().indexOf('._') < 0)
            return i
    });
    //og
    var imgnum = Math.floor(Math.random() * files.length);
    var img = __dirname + "/ogimage/" + files[imgnum]
    try {
        res.sendFile(img)
    } catch (err) {}
});
// 首頁
app.get('/', (req, res) => {
    // 沒登入的快去啦
    if (req.session.pass != config.PokaPlayer.password && config.PokaPlayer.passwordSwitch)
        res.redirect("/login/")
    else
        res.render('index') //有登入給首頁吼吼
})

function pp_decode(str) {
    return base64.decode(decodeURIComponent(str))
}
// Reverse Proxy
app.get('/nas/:url', async(req, res) => {
    if (req.session.pass != config.PokaPlayer.password && config.PokaPlayer.passwordSwitch)
        res.send('請登入')
    else {
        var url = `${config.DSM.protocol}://${config.DSM.host}:${config.DSM.port}/${pp_decode(req.params.url)}`
        try {
            request.get({
                url: url,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
                    'range': req.headers.range
                }
            }).on('response', function(response) {
                var contentType = response.headers['content-type']
                if (contentType && contentType.match(/wav|mp3|flac|audio/)) {
                    res.writeHead(206, {
                        "Content-Length": response.headers['content-length'],
                        "Content-Range": response.headers['content-range'],
                        "Content-Type": response.headers['content-type']
                    })
                }
            }).pipe(res)

        } catch (e) { console.log(e) }

    }
})

// api
app.get('/api/:apireq', async(req, res) => {
    var apireq = JSON.parse(pp_decode(req.params.apireq))
        /*
        apireq should be like this
        {
            "CGI_PATH":"",
            "API_NAME","",
            "METHOD":"",
            "PARAMS":"",
            "VERSION":2,
            "PARAMS":"&AAA=AAA&BBB=CCC"
        }
        */
    if (req.session.pass != config.PokaPlayer.password && config.PokaPlayer.passwordSwitch)
        res.send('請登入')
    else {
        var getRes = await api(config.DSM, apireq.CGI_PATH, apireq.API_NAME, apireq.METHOD, apireq.VERSION, apireq.PARAMS)
        res.send(getRes)
    }
})

// 登入
app.get('/login/', (req, res) => {
    if (req.session.pass == config.PokaPlayer.password && !config.PokaPlayer.passwordSwitch)
        res.redirect("/")
    else
        res.render('login')
});
app.post('/login/', (req, res) => {
    req.session.pass = req.body['userPASS']
    if (req.body['userPASS'] != config.PokaPlayer.password && config.PokaPlayer.passwordSwitch)
        res.send('fail')
    else
        res.send('success')
});
// 登出
app.get('/logout/', (req, res) => {
    req.session.destroy()
    res.redirect("/")
});
var updateCookie = schedule.scheduleJob("'* */12 * * *'", async function() {
    //請求登入 Cookie
    //console.log("正在自動更新令牌")
    var a = await syno.login(config.DSM)
});



async function login(dsm) {
    return new Promise(function(resolve, reject) {
        var url = `${dsm.protocol}://${dsm.host}:${dsm.port}/webapi/auth.cgi?api=SYNO.API.Auth&method=Login&version=1&account=${dsm.account}&passwd=${dsm.password}&session=AudioStation&format=cookie`
        request(url, function(error, res, body) {
            if (!error && res.statusCode == 200) {
                resolve(JSON.parse(body));
            } else {
                resolve(error);
            }
        });
    });
}

async function api(dsm, CGI_PATH, API_NAME, METHOD, VERSION = 1, PARAMS) {
    return new Promise(function(resolve, reject) {
        request(`${dsm.protocol}://${dsm.host}:${dsm.port}/webapi/${CGI_PATH}?api=${API_NAME}&method=${METHOD}&version=${VERSION}${PARAMS}`, function(error, res, body) {
            if (!error && res.statusCode == 200) {
                resolve(JSON.parse(body));
            } else {
                resolve(error);
            }
        });
    });
}