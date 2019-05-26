const fs = require("fs"); //檔案系統
const jsonfile = require('jsonfile')
const passwordHash = require('password-hash')
let _c = false
if (fs.existsSync("./config.json")) {
    _c = jsonfile.readFileSync("./config.json")
    // 加鹽
    if (!_c.PokaPlayer.salt) {
        _c.PokaPlayer.salt = Math.random().toString(36).substring(7)
    }
    if (!_c.PokaPlayer.sessionSecret) {
        _c.PokaPlayer.sessionSecret = Math.random().toString(36).substring(7)
    }
    //密碼 hash
    if (_c.PokaPlayer.password && !passwordHash.isHashed(_c.PokaPlayer.password)) {
        _c.PokaPlayer.password = passwordHash.generate(_c.PokaPlayer.salt + _c.PokaPlayer.password)
    }
    if (!_c.mongodb)
        _c.mongodb = {
            "enabled": false,
            "uri": "mongodb://"
        }
    jsonfile.writeFileSync("./config.json", _c, {
        spaces: 4,
        EOL: '\r\n'
    })
}
const config = _c; // 設定檔
const package = require("./package.json"); // 設定檔
const db = require("./db/db"); // 設定檔
const schedule = require("node-schedule"); // 很會計時ㄉ朋友
const pokaLog = require("./log"); // 可愛控制台輸出
const base64 = require("base-64");
const path = require('path');
const git = require("simple-git/promise")(__dirname);
//express
const express = require("express");
const session = db.session;
const helmet = require("helmet"); // 防範您的應用程式出現已知的 Web 漏洞
const bodyParser = require("body-parser"); // 讀入 post 請求
const app = express(); // Node.js Web 架構
const server = require("http").createServer(app),
    io = require("socket.io").listen(server),
    sharedsession = require("express-socket.io-session");

// 資料模組 or 連線測試模組
if (config)
    app.use("/pokaapi", require("./dataModule.js"));
if (!config || config.PokaPlayer.debug)
    app.use("/installapi", require("./install.js"));

//
app.use(bodyParser.urlencoded({
    extended: true
}));
// cors for debug
if (config && config.PokaPlayer.debug) {
    app.use(require('cors')({
        credentials: true,
        origin: 'http://localhost:8080'
    }))
}
app.use(helmet());
app.use(helmet.hidePoweredBy({
    setTo: 'PHP 4.2.0'
}))
app.use(session);
io.use(
    sharedsession(session, {
        autoSave: true
    })
);
// 檢查 branch
if (config) {
    git.raw(["symbolic-ref", "--short", "HEAD"]).then(branch => {
        branch = branch.slice(0, -1); // 結果會多一個換行符
        if (branch != (config.PokaPlayer.debug ? "dev" : "master")) {
            git.raw(["config", "--global", "user.email", '"you@example.com"'])
                .then(() => git.fetch(["--all"]))
                .then(() =>
                    git.reset(["--hard", "origin/" + (config.PokaPlayer.debug ? "dev" : "master")])
                )
                .then(() => git.checkout(config.PokaPlayer.debug ? "dev" : "master"))
                .then(() => process.exit())
                .catch(err => {
                    console.error("failed: ", err);
                    socket.emit("err", err.toString());
                });
        }
    });
}

// 時間處理
const moment = require("moment-timezone");
moment.locale("zh-tw");
moment.tz.setDefault("Asia/Taipei");


// 啟動囉
server.listen(3000, () => {
    pokaLog.log('PokaPlayer', package.version)
    if (config && config.PokaPlayer.debug)
        pokaLog.log('INFO', 'Debug Mode')
    pokaLog.log('INFO', 'http://localhost:3000/')
    pokaLog.log('TIME', moment().format("YYYY/MM/DD HH:mm:ss"))
    if (!config) {
        pokaLog.log('INSTALL', `未讀取到 config.json，請訪問 /install`)
        pokaLog.log('INSTALL', `或是使用 config-simple.json 來建立設定檔`)
    }
});

function verifyPassword(password) {
    /*
    驗證密碼是否正確
    */
    if (!config) return true //沒有設定檔
    if (!config.PokaPlayer.passwordSwitch) return true //未開啟密碼登入
    if (config.PokaPlayer.passwordSwitch) { //開啟密碼登入
        return passwordHash.verify(config.PokaPlayer.salt + password, config.PokaPlayer.password)
    }
}

// 登入
app
    .post("/login/", (req, res) => {
        req.session.pass = req.body["userPASS"];
        if (verifyPassword(req.body["userPASS"])) {
            req.session.pass = req.body["userPASS"]
            res.send("success");
        } else {
            res.send("fail");
        }
    })
    .get("/logout/", (req, res) => {
        // 登出
        req.session.pass = ''
        res.redirect("/")
    });

// 設定 public 目錄
app.use(express.static("public"));

// 取得狀態
app.get("/status", async (req, res) => res.json({
    login: verifyPassword(req.session.pass),
    install: !!config,
    version: package.version,
    debug: config && config.PokaPlayer.debug ?
        (await git.raw(["rev-parse", "--short", "HEAD"])).slice(0, -1) : false
}));

io.on("connection", socket => {
    socket.emit("hello");
    // Accept a login event with user's data
    socket.on("login", userdata => {
        socket.handshake.session.userdata = userdata;
        socket.handshake.session.save();
    });
    socket.on("logout", userdata => {
        if (socket.handshake.session.userdata) {
            delete socket.handshake.session.userdata;
            socket.handshake.session.save();
        }
    });
    socket.on("update", userdata => {
        if (verifyPassword(socket.handshake.session.pass)) {
            socket.emit("init");
            git.reset(["--hard", "HEAD"])
                .then(() => socket.emit("git", "fetch"))
                .then(() => git.remote(["set-url", "origin", "https://github.com/gnehs/PokaPlayer.git"]))
                .then(() => git.pull())
                .then(() => socket.emit("git", "reset"))
                .then(() => socket.emit("restart"))
                .then(async () => {
                    const delay = interval => {
                        return new Promise(resolve => {
                            setTimeout(resolve, interval);
                        });
                    };
                    await delay(3000)
                })
                .then(() => process.exit())
                .catch(err => {
                    console.error("failed: ", err);
                    socket.emit("err", err.toString());
                });
        } else {
            socket.emit("Permission Denied Desu");
        }
    });
});

app.use((req, res, next) => {
    if (verifyPassword(req.session.pass)) next()
    else res.sendFile(path.join(__dirname + '/public/index.html'))
});
// 更新
app.get("/upgrade", (req, res) => res.send("socket"));

// get info
app.get("/info", async (req, res) => {
    let _p = package
    _p.debug = config && config.PokaPlayer.debug ?
        (await git.raw(["rev-parse", "--short", "HEAD"])).slice(0, -1) :
        false
    res.json(_p)
});

app.post("/restart", (req, res) => process.exit());

app.use((req, res, next) => {
    res.sendFile(path.join(__dirname + '/public/index.html'))
});
// 報錯處理
process.on("uncaughtException", err => {
    if (config && config.PokaPlayer.debug) console.log(err);
});