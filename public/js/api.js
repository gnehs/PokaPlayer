//- 取得背景
function getBackground() {
    if (window.localStorage["randomImg"])
        return window.localStorage["randomImg"]
    else
        return "/og/og.png"
}


//- 取得歌詞
async function getLrc(artist, title, id = false, source) {
    let result;
    if (id) {
        result = await axios.get(`/pokaapi/lyric/?moduleName=${encodeURIComponent(source)}&id=${encodeURIComponent(id)}`)
        if (result.data.lyrics[0].lyric)
            return result.data.lyrics[0].lyric
    }
    result = await axios.get(`/pokaapi/searchLyrics/?keyword=${encodeURIComponent(title+' '+artist)}`)
    if (result.data.lyrics[0].name.toLowerCase() == title.toLowerCase())
        return result.data.lyrics[0].lyric

    return false
}
async function searchLrc(keyword) {
    return await axios.get(`/pokaapi/searchLyrics/?keyword=${encodeURIComponent(keyword)}`)
}

// 備用
async function getMetingSearchResult(keyword, limit = 1) {
    let meting = window.localStorage["lrcMetingUrl"],
        server = 'netease',
        search = await axios.get(`${meting}?server=${server}&type=search&keyword=${encodeURIComponent(keyword)}`);
    if (limit == 1) return search.data[0]
    else return search.data
}
async function getMetingLrcById(id) {
    let meting = window.localStorage["lrcMetingUrl"],
        server = 'netease',
        lyricRegex = /\[([0-9.:]*)\]/i
    result = (await axios.get(`${meting}?server=${server}&type=lrc&id=${id}`)).data
    try {
        result = result.lyric && result.tlyric ? migrate(result.lyric, result.tlyric) : result.lyric
    } catch (e) {
        result = result.lyric
        console.error(e)
    }
    return result && result.match(lyricRegex) ? result : false
}