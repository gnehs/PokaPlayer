const fs = require("fs"); //檔案系統
const jsonfile = require('jsonfile')
const packageData = require("./package.json"); // package
const { session } = require("./db/db"); // DB
const User = require("./db/user"); // userDB
const pokaLog = require("./log"); // 可愛控制台輸出
const path = require('path');
const git = require("simple-git/promise")(__dirname);
//express
const express = require("express");
const helmet = require("helmet");
const compression = require('compression')
const app = express();
const server = require("http").createServer(app)
const io = require("socket.io")(server)
const sharedsession = require("express-socket.io-session");

const { addLog } = require("./db/log");
//
// config init
//
let _c = false
if (fs.existsSync("./config.json")) {
    let edited = false
    _c = jsonfile.readFileSync("./config.json")
    // sessionSecret
    if (!_c.PokaPlayer.sessionSecret) {
        _c.PokaPlayer.sessionSecret = Math.random().toString(36).substring(7)
        edited = true
    }
    if (!_c.PokaPlayer.sc2tc) {
        _c.PokaPlayer.sc2tc = true
        edited = true
    }
    if (!_c.PokaPlayer.fixPunctuation) {
        _c.PokaPlayer.fixPunctuation = true
        edited = true
    }
    if (_c.Netease2.login) {
        if (_c.Netease2.login.email) {
            _c.Netease2.login.method = "email"
            _c.Netease2.login.account = _c.Netease2.login.email
            delete _c.Netease2.login.email
            edited = true
        }
        if (_c.Netease2.login.phone) {
            _c.Netease2.login.method = "phone"
            _c.Netease2.login.account = _c.Netease2.login.phone
            delete _c.Netease2.login.phone
            edited = true
        }
    }
    jsonfile.writeFileSync("./config.json", _c, {
        spaces: 4,
        EOL: '\r\n'
    })
    if (edited) {
        //exit 
        pokaLog.logDB('config', `config changed, restarting`)
        process.exit()
    }
}
const config = _c; // 設定檔

// 資料模組
app.use("/pokaapi", require("./dataModule.js"));

// cors for debug
if (config.PokaPlayer.debug) {
    app.use(require('cors')({
        credentials: true,
        origin: true
    }))
}

// 檢查 branch
git.raw(["symbolic-ref", "--short", "HEAD"]).then(branch => {
    branch = branch.slice(0, -1); // 結果會多一個換行符
    if (branch != (config.PokaPlayer.debug ? "dev" : "master")) {
        git.fetch(["--all"])
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

//
app.use(express.json());
app.use(express.static("public"))
app.use(helmet({ contentSecurityPolicy: false, }))
app.use(compression())
// disable X-Powered-By
app.set('x-powered-by', false);
//session
app.use(session)
io.use(sharedsession(session, {
    autoSave: true
}))

// 登入
app
    .post("/login/", async (req, res) => {
        let { username, password } = req.body
        let u = await User.login({ username, password })
        if (u.success) {
            req.session.user = u.user
            addLog({
                level: "info",
                type: "user",
                event: "Login",
                user: req.session.user,
                description: `User {${req.session.user}} login from ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`
            })
        } else {
            addLog({
                level: "warn",
                type: "user",
                event: "Login",
                description: `User ${username} login failed from ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`
            })
        }
        res.json(u)
    })
    .get("/logout/", (req, res) => {
        // 登出
        if (req.session.user) {
            addLog({
                level: "info",
                type: "user",
                event: "Logout",
                user: req.session.user,
                description: `User {${req.session.user}} logout`
            })
        }
        req.session.destroy(err => {
            if (err) {
                console.error(err);
            }
            res.clearCookie();
            res.redirect('/');
        });
    })
// 取得狀態
app.get("/status", async (req, res) => {
    res.json({
        login: req.session.user,
        version: req.session.user ? packageData.version : '0.0.0',
        debug: config.PokaPlayer.debug && req.session.user ? (await git.raw(["rev-parse", "--short", "HEAD"])).slice(0, -1) : false
    })
});

app.use(async (req, res, next) => {
    if (req.session.user && await User.isUserAdmin(req.session.user)) next()
    else res.sendFile(path.join(__dirname + '/public/index.html'))
});
// get info
app.get("/info", async (req, res) => {
    let _p = {}
    _p.version = packageData.version
    _p.debug = config.PokaPlayer.debug ? (await git.raw(["rev-parse", "--short", "HEAD"])).slice(0, -1) : false
    res.json(_p)
});

app.post("/restart", (req, res) => process.exit());

app.use((req, res, next) => {
    res.sendFile(path.join(__dirname + '/public/index.html'))
});

io.on("connection", socket => {
    socket.emit("hello");
    // Accept a login event with user's data
    socket.on("login", async userdata => {
        let { user } = await User.login(userdata)
        socket.join(user);
        socket.handshake.session.userdata = user;
        socket.handshake.session.save();
    });
    socket.on("logout", () => {
        if (socket.handshake.session.userdata) {
            delete socket.handshake.session.userdata;
            socket.handshake.session.save();
        }
    });
    socket.on('send-nickname', nickname => {
        socket.nickname = nickname;
    });
    // 更新
    socket.on("update", async () => {
        await git.raw(['config', '--global', 'user.email']).then(r => {
            if (r == '\n') {
                git.raw(['config', '--global', 'user.email', 'poka@pokaplayer.poka'])
                git.raw(['config', '--global', 'user.name', 'pokaUpdater'])
            }
        })
        if (await User.isUserAdmin(socket.handshake.session.userdata) && !config.PokaPlayer.debug) {
            addLog({
                level: "info",
                type: "system",
                event: "Update",
                description: `PokaPlayer update.`
            })
            socket.emit("init");
            git.reset(["--hard", "HEAD"])
                .then(() => socket.emit("git", "fetch"))
                .then(() => git.remote(["set-url", "origin", "https://github.com/gnehs/PokaPlayer.git"]))
                .then(() => git.fetch())
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
        } else if (config.PokaPlayer.debug) {
            const delay = interval => {
                return new Promise(resolve => {
                    setTimeout(resolve, interval);
                });
            };
            socket.emit("git", "fetch")
            await delay(1000)
            socket.emit("git", "reset")
            await delay(1000)
            socket.emit("restart")
            await delay(3000)
            process.exit()
        } else {
            socket.emit("err", "Permission Denied Desu");
        }
    });
});
async function pokaStart() {
    // 如果資料庫裡沒有使用者自動建立一個
    async function autoCreateUser() {
        let userlist = await User.getAllUsers()
        if (!userlist || userlist.length <= 0) {
            let username = "poka",
                password = "poka"
            User.create({
                name: "Admin",
                username,
                password,
                role: "admin"
            })
            pokaLog.logDB('init', `已自動建立使用者`)
            pokaLog.logDB('init', `User has been created automatically`)
            pokaLog.logDB('init', `username: ${username}`)
            pokaLog.logDB('init', `password: ${password}`)
        }
    }
    await autoCreateUser()

    // 啟動囉
    server.listen(3000, () => {
        pokaLog.log('PokaPlayer', packageData.version)
        if (config.PokaPlayer.debug)
            pokaLog.log('INFO', 'Debug Mode')
        pokaLog.log('INFO', 'http://localhost:3000/')
        pokaLog.log('TIME', new Date().toLocaleString())
        if (!config.PokaPlayer.debug)
            addLog({
                level: "info",
                type: "system",
                event: "Start",
                description: `PokaPlayer started. version: ${packageData.version}`
            })
    });
}
module.exports = {
    pokaStart
}