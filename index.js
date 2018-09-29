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
    store: new FileStore({ reapInterval: -1, logFn: void 0 }),
    secret: config ? config.PokaPlayer.sessionSecret : "no config.json",
    resave: false,
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
app.use("/pokaapi", config ? require("./dataModule.js") : require("./checkConnection.js"));


//
app.set("views", __dirname + "/views");
app.set("view engine", "pug");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
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
    console.log("[PokaPlayer]  URL: http://localhost:3000");
    console.log(`[PokaPlayer] Time: ${moment().format("YYYY/MM/DD HH:mm:ss")}`);
    if (config && config.PokaPlayer.debug) console.log("[PokaPlayer] Debug 模式已開啟");
    if (!config)
        console.log("[PokaPlayer] 未讀取到 config.json 請訪問 /install 或是使用 config-simple.json 來建立設定檔");
});

//安裝頁面
if (!config) app.get("/install", (req, res) => res.render("install", { version: package.version }));

// 隨機圖圖
app.get("/og/og.png", (req, res) => {
    var files = fs.readdirSync("./ogimage/").filter(function(i, n) {
        if ((i.toString().indexOf(".png") > -1 || i.toString().indexOf(".jpg") > -1) && i.toString().indexOf("._") < 0)
            return i;
    });
    //og
    var imgnum = Math.floor(Math.random() * files.length);
    var img = __dirname + "/ogimage/" + files[imgnum];

    res.sendFile(img);
});
// 登入
app.get("/login/", (req, res) => res.render("login"))
    .post("/login/", (req, res) => {
        req.session.pass = req.body["userPASS"];
        if (config.PokaPlayer.passwordSwitch && req.body["userPASS"] != config.PokaPlayer.password)
            res.send("fail");
        else res.send("success");
    })
    .get("/logout/", (req, res) => {
        // 登出
        req.session.destroy();
        res.redirect("/");
    });

// PONG
app.get("/ping", (req, res) => res.send("PONG"));

// 沒設定檔給設定頁面，沒登入給登入頁
app.use((req, res, next) => {
    if (!config) res.redirect("/install/");
    else if (req.session.pass != config.PokaPlayer.password && config.PokaPlayer.passwordSwitch)
        res.redirect("/login/");
    else next();
});
// 首頁
app.get("/", (req, res) => res.render("index", { version: package.version }));

io.on("connection", socket => {
    socket.emit("hello");
    // Accept a login event with user's data
    socket.on("login", function(userdata) {
        socket.handshake.session.userdata = userdata;
        socket.handshake.session.save();
    });
    socket.on("logout", function(userdata) {
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
app.get("/debug", async(req, res) =>
    res.send(
        config.PokaPlayer.debug ?
        (await git.raw(["rev-parse", "--short", "HEAD"])).slice(0, -1) :
        "false"
    )
);

app.post("/restart", (req, res) => {
    res.send("k");
    process.exit();
});

app.use((req, res, next) => {
    res.status(404).redirect("/");
});
// 報錯處理
process.on("uncaughtException", err => {
    if (config && config.PokaPlayer.debug) console.log(err);
});