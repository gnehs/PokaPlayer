//- 取得背景
function getBackground() {
    if (window.localStorage["randomImg"])
        return window.localStorage["randomImg"]
    else
        return "/og/og.png"
}
//- 請求
async function request(url) {
    let result;
    try {
        result = (await axios.get(url)).data
    } catch (e) {
        result = null
        console.log(e)
        mdui.snackbar({
            message: `哎呀！請求出錯了，請再試一次看看：（`,
            timeout: 400,
            position: getSnackbarPosition()
        });
    }
    return result
}
/*===== Pin =====*/
async function isPinned(source, type, id, name) {
    let result = (await axios.post(`/pokaapi/isPinned/?moduleName=${source}&type=${type}&id=${id}&name=${name}`))
    return result.data
}
async function addPin(source, type, id, name) {
    let result = (await axios.post(`/pokaapi/addPin/?moduleName=${source}&type=${type}&id=${id}&name=${name}`)).data
    if (result != true)
        mdui.snackbar({
            message: `釘選失敗`,
            timeout: 400,
            position: getSnackbarPosition()
        })
    else
        caches.open('PokaPlayer').then(function (cache) {
            cache.delete('/pokaapi/home')
        })
    return result
}
async function unPin(source, type, id, name) {
    let result = (await axios.post(`/pokaapi/unPin/?moduleName=${source}&type=${type}&id=${id}&name=${name}`)).data
    if (result != true)
        mdui.snackbar({
            message: `取消釘選失敗`,
            timeout: 400,
            position: getSnackbarPosition()
        })
    else
        caches.open('PokaPlayer').then(function (cache) {
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
    for (i = 0; i < (result.data.lyrics.length > 10 ? 10 : result.data.lyrics.length); i++)
        if (result.data.lyrics[i]) {
            let lrcTitle = result.data.lyrics[i].name.toLowerCase().replace(/\.|\*|\~|\&|。|，|\ |\-|\!|！|\(|\)/g, '')
            let songTitle = title.toLowerCase().replace(/\.|\*|\~|\&|。|，|\ |\-|\!|！|\(|\)/g, '')
            if (lrcTitle == songTitle && result.data.lyrics[i].lyric.match(lyricRegex))
                return result.data.lyrics[i].lyric
        }
    return false
}
async function searchLrc(keyword) {
    return await axios.get(`/pokaapi/searchLyrics/?keyword=${encodeURIComponent(keyword)}`)
}

/*===== 評等 =====*/
async function canRating(moduleName) {
    let result;
    try {
        result = (await axios.get(`/pokaapi/ratingSong/?moduleName=${encodeURIComponent(moduleName)}`)).data
    } catch (e) {
        result = false
    }
    return result
}
async function ratingSong(moduleName, songId, rating) {
    let result;
    try {
        result = (await axios.post(`/pokaapi/ratingSong/`, {
            moduleName: moduleName,
            songId: songId,
            rating: rating
        })).data
    } catch (e) {
        result = false
    }
    return result
}
/*===== 加入到播放清單 =====*/
async function getUserPlaylists(module) {
    let result
    try {
        result = (await axios.get(`/pokaapi/getUserPlaylists/?moduleName=${encodeURIComponent(module)}`)).data
    } catch (e) {
        result = false
    }
    return result
}

async function playlistExist(moduleName, songIds, playlistId) {
    let exist, result;
    // 確定存在
    try {
        result = (await axios.get(`/pokaapi/playlistOperation/?moduleName=${encodeURIComponent(moduleName)}&songIds=${encodeURIComponent(JSON.stringify([songIds]))}&playlistId=${encodeURIComponent(playlistId)}`)).data
    } catch (e) {
        result = false
    }
    return result
}
async function playlistOperation(moduleName, songIds, playlistId) {
    let exist, result;
    // 確定存在
    try {
        result = (await playlistExist(moduleName, songIds, playlistId))
        exist = result.code
    } catch (e) {
        exist = false
    }
    // 刪除或新增
    if (exist == 200) {
        try {
            result = (await axios.delete(`/pokaapi/playlistOperation/?moduleName=${encodeURIComponent(moduleName)}&songIds=${encodeURIComponent(JSON.stringify([songIds]))}&playlistId=${encodeURIComponent(playlistId)}`)).data
        } catch (e) {
            result = false
        }
    } else if (exist == 404 || !exist) {
        //嘗試新增
        try {
            result = (await axios.post('/pokaapi/playlistOperation/', {
                moduleName: moduleName,
                songIds: songIds,
                playlistId: playlistId
            })).data
        } catch (e) {
            result = false
        }
    }
    return {
        result,
        exist
    }
}
/*===== 喜歡 =====*/
async function canLike(module) {
    let result
    try {
        result = (await axios.get(`/pokaapi/canLike/?moduleName=${encodeURIComponent(module)}`)).data
    } catch (e) {
        result = false
    }
    return result
}
async function isLiked(module, songId) {
    let result
    //嘗試新增
    try {
        result = (await axios.post('/pokaapi/isLiked/', {
            moduleName: module,
            songId: songId
        })).data
        console.log(result)
    } catch (e) {
        result = false
    }
    return result
}
async function like(module, songId) {
    let result
    //嘗試新增
    try {
        result = (await axios.post('/pokaapi/like/', {
            moduleName: module,
            songId: songId
        })).data
    } catch (e) {
        result = false
    }
    return result
}
async function disLike(module, songId) {
    let result
    //嘗試新增
    try {
        result = (await axios.post('/pokaapi/disLike/', {
            moduleName: module,
            songId: songId
        })).data
    } catch (e) {
        result = false
    }
    return result
}