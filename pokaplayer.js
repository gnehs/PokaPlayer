const pokaLog = require("./log"); // 可愛控制台輸出
const jsonfile = require('jsonfile')
let config
try {
    config = jsonfile.readFileSync("./config.json")
} catch (e) {

}
if (config) {
    const { pokaStart } = require('./index')
    pokaStart()
} else {
    const express = require("express");
    const app = express(); // Node.js Web 架構
    pokaLog.log('INSTALL', `未讀取到 config.json`)
    pokaLog.log('INSTALL', `請參考 config-simple.json 與 Wiki 來建立設定檔`)
    app.use(express.static("install"))
    const server = require("http").createServer(app)
    server.listen(3000, () => {
        pokaLog.log('INFO', 'http://localhost:3000/')
    });
}