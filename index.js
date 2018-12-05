const fs = require("fs"); //檔案系統
const config = fs.existsSync("./config.json") ? require("./config.json") : !1; // 設定檔
const package = require("./package.json"); // 設定檔
const schedule = require("node-schedule"); // 很會計時ㄉ朋友
const base64 = require("base-64");
const git = require("simple-git/promise")(__dirname);
//express
const express = require("express");
const FileStore = require("session-file-store")(require("express-session")); // session
const session = require("express-session")({
    store: new FileStore({
        reapInterval: -1
    }),
    secret: config ? config.PokaPlayer.sessionSecret : "no config.json",
    resave: true,
    saveUninitialized: true,
    cookie: {
        expires: new Date(Date.now() + 60 * 60 * 1000 * 24 * 7)
    }
});
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
    app.use("/installapi", require("./checkConnection.js"));


//
app.set("views", __dirname + "/views");
app.set("view engine", "pug");
app.use(bodyParser.urlencoded({
    extended: true
}));
// SASS 好朋友
if (config.PokaPlayer.debug) {
    const sassMiddleware = require('node-sass-middleware');
    app.use(sassMiddleware({
        src: __dirname + '/sass',
        dest: __dirname + '/public',
        outputStyle: 'compressed',
        indentedSyntax: true,
        prefix: '/css'
    }));
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

// 設定 js icon css 目錄
app.use(express.static("public"));

// 啟動囉
server.listen(3000, () => {
    let TTTTTTTTTTTTTime = moment().format("YYYY/MM/DD HH:mm:ss")
    console.log(`
|￣￣￣￣￣￣￣￣￣￣￣￣|  \x1b[34m[version]\x1b[32m ${package.version}
| PokaPlayer             |  ${config && config.PokaPlayer.debug?"\x1b[34m[info]\x1b[32m Debug 模式\x1b[0m":''}
| http://localhost:3000  |  ${!config?"\x1b[31m未讀取到 config.json，請訪問 /install\x1b[0m":''}
| ${TTTTTTTTTTTTTime}    |  ${!config?"\x1b[31m或是使用 config-simple.json 來建立設定檔\x1b[0m":''}
|＿＿＿＿＿＿＿＿＿＿＿＿|  
    (\\__/) || 
    (•ㅅ•) || 
    / 　 づ`)
});

//安裝頁面
if (!config || config.PokaPlayer.debug) app.get("/install", (req, res) => res.render("install", {
    version: package.version
}));

// 隨機圖圖
app.get("/og/og.png", (req, res) => {
    let files = fs.readdirSync("./ogimage/").filter((i, n) => ((i.toString().indexOf(".png") > -1 || i.toString().indexOf(".jpg") > -1) && i.toString().indexOf("._") < 0));
    //og
    let imgnum = Math.floor(Math.random() * files.length);
    let img = __dirname + "/ogimage/" + files[imgnum];

    res.sendFile(img);
});
// 登入
app
    .get("/login/", (req, res) =>
        config.PokaPlayer.passwordSwitch && (req.session.pass != config.PokaPlayer.password) ?
        res.render("login") :
        res.redirect("/"))
    .post("/login/", (req, res) => {
        req.session.pass = req.body["userPASS"];
        if (config.PokaPlayer.passwordSwitch && req.body["userPASS"] != config.PokaPlayer.password)
            res.send("fail");
        else res.send("success");
    })
    .get("/logout/", (req, res) => {
        // 登出
        req.session.pass = ''
        res.redirect("/")
    });

// PONG
app.get("/ping", (req, res) => res.send("PONG"));

// 沒設定檔給設定頁面，沒登入給登入頁
app.use((req, res, next) => {
    if (!config)
        res.redirect("/install/");
    else if (config.PokaPlayer.passwordSwitch && (req.session.pass != config.PokaPlayer.password))
        res.redirect("/login/");
    else next();
});
// 首頁
app.get("/", (req, res) => res.render("index", {
    version: package.version
}));

if (config.PokaPlayer.debug)
    app.get("/share", (req, res) => res.render("share"));

io.on("connection", socket => {
    socket.emit("hello");
    // Accept a login event with user's data
    socket.on("login", function (userdata) {
        socket.handshake.session.userdata = userdata;
        socket.handshake.session.save();
    });
    socket.on("logout", function (userdata) {
        if (socket.handshake.session.userdata) {
            delete socket.handshake.session.userdata;
            socket.handshake.session.save();
        }
    });
    socket.on("update", userdata => {
        if (socket.handshake.session.pass == config.PokaPlayer.password) {
            socket.emit("init");
            git.raw(["config", "--global", "user.email", '"you@example.com"'])
                .then(() => git.fetch(["--all"]))
                .then(() => socket.emit("git", "fetch"))
                .then(() =>
                    git.reset(["--hard", "origin/" + (config.PokaPlayer.debug ? "dev" : "master")])
                )
                .then(() => git.checkout(config.PokaPlayer.debug ? "dev" : "master"))
                .then(() => socket.emit("git", "reset"))
                .then(() => socket.emit("restart"))
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
// 更新
app.get("/upgrade", (req, res) => {
    if (!config.PokaPlayer.instantUpgradeProcess) {
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
    } else {
        res.send("socket");
    }
});

// get info
app.get("/info", (req, res) => res.json(package));
app.get("/debug", async (req, res) =>
    res.send(
        config.PokaPlayer.debug ?
        (await git.raw(["rev-parse", "--short", "HEAD"])).slice(0, -1) :
        "false"
    ));

app.post("/restart", (req, res) => {
    res.send("k");
    process.exit();
});

app.use((req, res, next) => res.render("index", {
    version: package.version
}));
// 報錯處理
process.on("uncaughtException", err => {
    if (config && config.PokaPlayer.debug) console.log(err);
});