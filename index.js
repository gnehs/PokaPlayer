const fs = require("fs"); //檔案系統
const jsonfile = require('jsonfile')
const packageData = require("./package.json"); // package
const { session } = require("./db/db"); // DB
const User = require("./db/user"); // userDB
const pokaLog = require("./log"); // 可愛控制台輸出
const path = require('path');
const git = require("simple-git")(__dirname);
const child_process = require('child_process');
//express
const express = require("express");
const helmet = require("helmet");
const compression = require('compression')
const app = express();
const server = require("http").createServer(app)
const io = require("socket.io")(server)

const { addLog } = require("./db/log");
const updateDatabase = require("./update-database");


const delay = interval => new Promise(resolve => setTimeout(resolve, interval));
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
app.use(helmet({ contentSecurityPolicy: false }))
app.use(compression())
// disable X-Powered-By
app.set('x-powered-by', false);
// session
app.use(session)

// convert a connect middleware to a Socket.IO middleware
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
io.use(wrap(session));


app.use(async (req, res, next) => {
    if (req.session.user && await User.isUserAdmin(req.session.user)) next()
    else res.sendFile(path.join(__dirname + '/public/index.html'))
});


app.use((req, res, next) => {
    res.sendFile(path.join(__dirname + '/public/index.html'))
});

io.on("connection", socket => {
    socket.emit("hello");
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
        if (await User.isUserAdmin(socket.request.session.user)) {
            if (!config.PokaPlayer.debug) {
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
                    .then(() => {
                        if (process.env.NODE_ENV == 'production') {
                            child_process.execSync('npm install --production', { stdio: [0, 1, 2], cwd: "/app/" });
                        } else {
                            child_process.execSync('npm install --production', { stdio: [0, 1, 2] });
                        }
                    })
                    .then(() => socket.emit("git", "package_updated"))
                    .then(() => socket.emit("restart"))
                    .then(async () => {
                        await delay(3000)
                    })
                    .then(() => process.exit())
                    .catch(err => {
                        console.error("failed: ", err);
                        socket.emit("err", err.toString());
                    });
            } else if (config.PokaPlayer.debug) {
                // for ui test
                socket.emit("git", "fetch")
                await delay(1500)
                socket.emit("git", "reset")
                await delay(1500)
                socket.emit("git", "package_updated")
                await delay(1500)
                socket.emit("restart")
                await delay(3000)
                socket.emit("hello");
            }
        }
        else {
            socket.emit("err", "Permission Denied Desu");
        }
    });
    socket.on("restart", async () => {
        if (await User.isUserAdmin(socket.request.session.user)) {
            addLog({
                level: "info",
                type: "system",
                event: "Restart",
                description: `PokaPlayer restart.`
            })
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
    await updateDatabase()

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