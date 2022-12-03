const axios = require('axios')
const pangu = require('pangu');
const { decodeHTML } = require("entities")
const { parseLyric } = require('./lyricUtils')
const pokaLog = require("../log"); // 可愛控制台輸出
const config = require(__dirname + "/../config.json").QQMusic; // 設定
async function searchLyrics(keyword) {
    //  ?w=${encodeURIComponent(keyword)}&format=json&cr=1&g_tk=5381&t=0&n=5&p=1
    let searchResult = await axios(`https://u.y.qq.com/cgi-bin/musicu.fcg`, {
        method: "POST",
        headers: {
            Referer: 'https://y.qq.com',
        },
        data: {
            "music.search.SearchCgiService": {
                method: "DoSearchForQQMusicDesktop",
                module: "music.search.SearchCgiService",
                param: {
                    num_per_page: 5,
                    page_num: 1,
                    query: keyword,
                    search_type: 0,  // 0：单曲，2：歌单，7：歌词，8：专辑，9：歌手，12：mv
                },
            },
        }
    })
        .then(res => res.data['music.search.SearchCgiService'].data.body.song.list)
    searchResult = searchResult.map(async y => {
        if (!y.mid) return null
        let lyric = await getLyric(y.mid)
        if (!lyric) {
            return null
        }
        lyric = decodeHTML(lyric)
        return {
            name: y.title,
            artist: y.singer.map(x => x.name).join(`、`),
            source: "QQMusic",
            id: y.songmid,
            lyric
        }
    })

    return { lyrics: (await Promise.all(searchResult)).filter(x => x) };
}
function getLyric(id) {
    let url = `https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=${encodeURIComponent(id)}`
    url += `&pcachetime=${new Date().getTime()}`
    url += `&g_tk=5381`
    url += `&loginUin=0`
    url += `&hostUin=0`
    url += `&inCharset=utf8`
    url += `&outCharset=utf-8`
    url += `&notice=0`
    url += `&platform=yqq`
    url += `&needNewCode=0`

    return axios(url, {
        method: "GET",
        headers: {
            Referer: 'https://y.qq.com',
        }
    })
        .then(res => res.data)
        // decode jsonp
        .then(res => res.replace(/^.*?\(/, '').replace(/\);?$/, ''))
        .then(res => JSON.parse(res))
        .then(async x => {
            if (x.lyric) {
                let lyric, tlyric
                lyric = Buffer.from(x.lyric, 'base64').toString()
                try {
                    tlyric = Buffer.from(x.trans, 'base64').toString()
                } catch (e) { }
                let result = tlyric ? await parseLyric(lyric, tlyric) : await parseLyric(lyric)
                result = result
                    .split('\n')
                    .map(x => x.endsWith('//') ? x.replace(/\/\/$/, '') : x)
                    .join('\n')
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
    enabled: config && config.enabled,
    onLoaded,
    searchLyrics,
};
