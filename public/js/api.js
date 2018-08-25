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
    if (result.data.lyrics[0].name == title)
        return result.data.lyrics[0].lyric

    return false
}
async function searchLrc(keyword) {
    return await axios.get(`/pokaapi/searchLyrics/?keyword=${encodeURIComponent(keyword)}`)
}
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
//- 取得封面 (棄用)
function getCover(type, info, artist_name, album_artist_name) {
    let url;
    if (type == "album") {
        let q = ''
        q += info ? `&album_name=${encodeURIComponent(info)}` : ``
        q += artist_name ? `&artist_name=${encodeURIComponent(artist_name)}` : ``
        q += album_artist_name ? `&album_artist_name=${encodeURIComponent(album_artist_name)}` : `&album_artist_name=`
        url = `/cover/album/` + ppEncode(q)
    } else {
        url = `/cover/${encodeURIComponent(type)}/${encodeURIComponent(info)}`
    }
    if (window.localStorage["imgRes"] == "true")
        return getBackground()
    else
        return url
}
//- 取得歌曲連結(棄用)
function getSong(song) {
    if (song.url) return song.url //過度用
    let id = song.id
    let res = window.localStorage["musicRes"].toLowerCase()
    let bitrate = song.additional.song_audio.bitrate / 1000
    if (res == "wav" && bitrate > 320)
        res = "wav"
    else
        res = "original"
    return '/song/' + res + '/' + id
}

//- 取得搜尋結果(棄用)
async function searchAll(keyword) {
    let PARAMS_JSON = [
        { key: "additional", "value": "song_tag,song_audio,song_rating" },
        { key: "library", "value": "shared" },
        { key: "limit", "value": 1000 },
        { key: "sort_by", "value": "title" },
        { key: "sort_direction", "value": "ASC" },
        { key: "keyword", "value": keyword },
    ]
    let result = await getAPI("AudioStation/search.cgi", "SYNO.AudioStation.Search", "list", PARAMS_JSON, 1)
    return result.data
}
//- API 請求(棄用)
async function getAPI(CGI_PATH, API_NAME, METHOD, PARAMS_JSON = [], VERSION = 1) {
    let PARAMS = '',
        reqUrl, reqJson
    for (i = 0; i < PARAMS_JSON.length; i++) {　
        PARAMS += '&' + PARAMS_JSON[i].key + '=' + encodeURIComponent(PARAMS_JSON[i].value)
    }
    //如果是隨機的會新增一組隨機字串來讓 SW 辨識為不同的請求
    if (PARAMS.indexOf('random') > -1) {
        PARAMS += '&ramdomhash=' + Math.random().toString(36).substring(7);
    }
    //location.origin
    reqJson = {
        "CGI_PATH": CGI_PATH,
        "API_NAME": API_NAME,
        "METHOD": METHOD,
        "VERSION": VERSION,
        "PARAMS": PARAMS
    }
    reqUrl = '/api/' + ppEncode(JSON.stringify(reqJson))

    return (await axios.get(reqUrl)).data
}