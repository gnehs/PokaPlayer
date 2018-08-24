//- 取得背景
function getBackground() {
    if (window.localStorage["randomImg"])
        return window.localStorage["randomImg"]
    else
        return "/og/og.png"
}
//- 取得封面
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

//- 取得歌詞
async function getLrc(artist, title, id = false) {
    let lyricRegex = /\[([0-9.:]*)\]/i,
        result = false,
        lrc;
    // 如果沒有設定或是設定是 DSM，進行 DSM 搜尋
    if (window.localStorage["lrcSource"] == 'DSM' || !window.localStorage["lrcSource"]) {
        if (id) {
            result = (await getAPI("AudioStation/lyrics.cgi", "SYNO.AudioStation.Lyrics", "getlyrics", [{ key: "id", "value": id }], 2)).data.lyrics
            if (result.match(lyricRegex))
                return result
            else
                result = false
        }
        if (!result) {
            let PARAMS_JSON = [
                { key: "additional", "value": "full_lyrics" },
                { key: "limit", "value": 1 }
            ]
            if (artist) PARAMS_JSON.push({ key: "artist", "value": artist })
            if (title) PARAMS_JSON.push({ key: "title", "value": title })
            result = (await getAPI("AudioStation/lyrics_search.cgi", "SYNO.AudioStation.LyricsSearch", "searchlyrics", PARAMS_JSON, 2)).data
            if (result && result.lyrics[0].title == title && result.lyrics[0].artist == artist)
                result = result.lyrics[0].additional.full_lyrics
            else
                result = false
            return result && result.match(lyricRegex) ? result : false
        }
    }
    // 如果設定是 meting
    if (window.localStorage["lrcSource"] == 'Meting') {
        let search = await getMetingSearchResult(`${title} ${artist}`)
            // 歌名必須匹配才找歌詞
        if (search && search.name.toUpperCase() == title.toUpperCase())
            return await getMetingLrcById(search.id)
        else
            return false
    }
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

//- 取得歌曲連結
function getSong(song) {
    let id = song.id
    let res = window.localStorage["musicRes"].toLowerCase()
    let bitrate = song.additional.song_audio.bitrate / 1000
    if (res == "wav" && bitrate > 320)
        res = "wav"
    else
        res = "original"
    return '/song/' + res + '/' + id
}

//- 取得專輯歌曲
async function getAlbumSong(album_name, album_artist_name, artist_name) {
    let PARAMS_JSON = [
        { key: "additional", "value": "song_tag,song_audio,song_rating" },
        { key: "library", "value": "shared" },
        { key: "limit", "value": 100000 },
        { key: "sort_by", "value": "title" },
        { key: "sort_direction", "value": "ASC" },
    ]
    if (album_name) PARAMS_JSON.push({ key: "album", "value": album_name })
    if (album_artist_name) PARAMS_JSON.push({ key: "album_artist", "value": album_artist_name })
    if (artist_name) PARAMS_JSON.push({ key: "artist", "value": artist_name })
    let info = await getAPI("AudioStation/song.cgi", "SYNO.AudioStation.Song", "list", PARAMS_JSON, 3)
    return info
}
//- 取得搜尋結果
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
//- API 請求
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