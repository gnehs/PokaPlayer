//- 取得背景
function getBackground() {
    if (window.localStorage["randomImg"])
        return window.localStorage["randomImg"]
    else
        return "/og/og.png"
}

/*===== Pin =====*/
async function isPinned(source, type, id, name) {
    let result = (await axios.get(`/pokaapi/isPinned/?moduleName=${source}&type=${type}&id=${id}&name=${name}`))
    if (result.status == 501)
        return 'disabled'
    else
        return result.data
}
async function addPin(source, type, id, name) {
    let result = (await axios.get(`/pokaapi/addPin/?moduleName=${source}&type=${type}&id=${id}&name=${name}`)).data
    if (result != true)
        mdui.snackbar({
            message: `釘選失敗`,
            timeout: 400,
            position: getSnackbarPosition()
        })
    else
        caches.open('PokaPlayer').then(function(cache) {
            cache.delete('/pokaapi/home')
        })
    return result
}
async function unPin(source, type, id, name) {
    let result = (await axios.get(`/pokaapi/unPin/?moduleName=${source}&type=${type}&id=${id}&name=${name}`)).data
    if (result != true)
        mdui.snackbar({
            message: `取消釘選失敗`,
            timeout: 400,
            position: getSnackbarPosition()
        })
    else
        caches.open('PokaPlayer').then(function(cache) {
            cache.delete('/pokaapi/home')
        })
    return result
}
/*===== 歌詞 =====*/
//- 取得歌詞
async function getLrc(artist, title, id = false, source) {
    let lyricRegex = /\[([0-9.:]*)\]/i
    let result;
    if (id) {
        result = await axios.get(`/pokaapi/lyric/?moduleName=${encodeURIComponent(source)}&id=${encodeURIComponent(id)}`)
        if (result.data.lyrics[0].lyric && result.data.lyrics[0].lyric.match(lyricRegex))
            return result.data.lyrics[0].lyric
    }
    result = await axios.get(`/pokaapi/searchLyrics/?keyword=${encodeURIComponent(title+' '+artist)}`)

    if (result.data.lyrics[0]) {
        let lrcTitle = result.data.lyrics[0].name.toLowerCase().replace(/\.|\*|\~|\&|。|，|\ |\-|\!|！|\(|\)/g, '')
        let songTitle = title.toLowerCase().replace(/\.|\*|\~|\&|。|，|\ |\-|\!|！|\(|\)/g, '')
        if (lrcTitle == songTitle && result.data.lyrics[0].lyric.match(lyricRegex))
            return result.data.lyrics[0].lyric
    }
    return false
}
async function searchLrc(keyword) {
    return await axios.get(`/pokaapi/searchLyrics/?keyword=${encodeURIComponent(keyword)}`)
}