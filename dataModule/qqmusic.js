const fetch = require('node-fetch')
const { migrate, zhconvert } = require('./lyricUtils')
const pokaLog = require("../log"); // 可愛控制台輸出
const lyricTimeout = new Promise(function (resolve, reject) {
    setTimeout(resolve, 5000, null);
});
async function searchLyrics(keyword) {
    let searchResult = await fetch(`https://c.y.qq.com/soso/fcgi-bin/client_search_cp?w=${encodeURI(keyword)}&format=json&cr=1&g_tk=5381`, {
        method: "GET",
        headers: {
            "Referer": "y.qq.com/portal/player.html",
            "User-Agent": 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:46.0) Gecko/20100101 Firefox/46.0'
        }
    })
        .then(res => res.json())
        .then(x => x.data.song.list)
        .then(x => x.slice(0, 5))
    searchResult = searchResult.map(async y => {
        if (!y.songmid || !y.songmid) return null
        let lyric = await getLyric(y.songmid)
        if (!lyric) {
            // console.log(`${y.songname} timeout.`)
            return null
        }
        return {
            name: y.songname,
            artist: y.singer.map(x => x.name).join(`、`),
            source: "QQMusic",
            id: y.songmid,
            lyric
        }
    })

    return { lyrics: (await Promise.all(searchResult)).filter(x => x) };
}
function getLyric(id) {
    return fetch(`https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=${encodeURI(id)}&g_tk=5381&format=json`, {
        method: "GET",
        headers: {
            Referer: 'https://y.qq.com',
        }
    })
        .then(res => res.json())
        .then(async x => {
            if (x.lyric) {
                let lyric, tlyric, result
                lyric = Buffer.from(x.lyric, 'base64').toString()
                try {
                    tlyric = Buffer.from(x.trans, 'base64').toString()
                } catch (e) { }
                if (tlyric) {
                    tlyric = await zhconvert(tlyric)
                    result = migrate(lyric, tlyric)
                } else {
                    lyric = await zhconvert(lyric, "Traditional")
                    result = lyric
                }
                return result
            }
        })
}
async function onLoaded() {
    console.time("QQMusic Lyric Test");
    try {
        let res = await searchLyrics(`世界で一番恋してる 喜多修平`)
        if (res.lyrics.length) {
            pokaLog.logDM('QQMusic', `Lyric loaded`)
            console.timeEnd("QQMusic Lyric Test");
        }
        return res.lyrics.length
    } catch (e) {
        console.log(e)
        return false
    }
}

module.exports = {
    name: "QQMusic",
    enabled: true,
    onLoaded,
    searchLyrics,
};
