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

    if (result.data.lyrics[0]) {
        let lrcTitle = result.data.lyrics[0].name.toLowerCase().replace(/\.|\*|\~|\&|。|，|\ |\-|\!|！|\(|\)/g, '')
        let songTitle = title.toLowerCase().replace(/\.|\*|\~|\&|。|，|\ |\-|\!|！|\(|\)/g, '')
        console.log(lrcTitle, songTitle)
        if (lrcTitle == songTitle)
            return result.data.lyrics[0].lyric
    }

    return false
}
async function searchLrc(keyword) {
    return await axios.get(`/pokaapi/searchLyrics/?keyword=${encodeURIComponent(keyword)}`)
}