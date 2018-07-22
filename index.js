const fs = require('fs'); //檔案系統
var programData = { "DSM": { "cookie": "" } }
const config = require('./config.json'); // 設定檔
const syno = require('./modules/DSM.js'); // 請求小夥伴
const schedule = require('node-schedule'); // 很會計時ㄉ朋友
const express = require('express'); // Node.js Web 架構
const session = require('express-session');
const helmet = require('helmet'); // 防範您的應用程式出現已知的 Web 漏洞
const bodyParser = require('body-parser'); // 讀入 post 請求
const app = express()
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

    var a = await syno.login(config.DSM)
    if (!a.success) {
        console.error("登入失敗，請檢查您的設定檔是否正確")
        process.exit()
    } else {
        // 拿到ㄌ騙吃騙喝的餅乾ㄌ
        programData.DSM.cookie = a.cookie[0]
    }
})

// 首頁
app.get('/', (req, res) => {
    console.log(programData)
        // 沒登入的快去啦
    if (req.session.pass != config.PokaPlayer.password && config.PokaPlayer.passwordSwitch)
        res.redirect("/login/")
    else
        res.render('index') //有登入給首頁吼吼
})

// 登入
app.get('/', (req, res) => {
    res.render('login')
})
var updateCookie = schedule.scheduleJob("'* */12 * * *'", async function() {
    //請求登入 Cookie
    console.log("正在自動更新令牌")
    var a = await syno.login(config.DSM)
    programData.DSM.cookie = a.cookie
});