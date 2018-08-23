const config = require('../config.json'), // 很會設定ㄉ朋友
    schedule = require('node-schedule'), // 很會計時ㄉ朋友
    request = require('request').defaults({ jar: require('request').jar() }), //很會請求ㄉ朋友
    dsmURL = `${config.DSM.protocol}://${config.DSM.host}:${config.DSM.port}`

async function onLoaded() {
    login();
    schedule.scheduleJob("'* */12 * * *'", async function() {
        console.log("[DataModules][DSM] 正在重新登入...")
        login();
    });
}
async function login() {
    let url = `${dsmURL}/webapi/auth.cgi?api=SYNO.API.Auth&method=Login&version=1&account=${config.DSM.account}&passwd=${config.DSM.password}&session=AudioStation&format=cookie`
    console.log("[DataModules][DSM] 正在登入...")
    request(url, async function(error, res, body) {
        if (!error && res.statusCode == 200) {
            if (JSON.parse(body).success) {
                console.log("[DataModules][DSM] 登入成功！")
            } else {
                console.error("[DataModules][DSM] 登入失敗，請檢查您的設定檔是否正確")
            }
        } else {
            console.error("[DataModules][DSM] 登入時遇到錯誤：", error)
        }
    });
}
//- API 請求
async function getAPI(CGI_PATH, API_NAME, METHOD, PARAMS_JSON = [], VERSION = 1) {
    return new Promise(function(resolve, reject) {
        let PARAMS = ''
        for (i = 0; i < PARAMS_JSON.length; i++) {　
            PARAMS += '&' + PARAMS_JSON[i].key + '=' + encodeURIComponent(PARAMS_JSON[i].value)
        }
        request(`${dsmURL}/webapi/${CGI_PATH}?api=${API_NAME}&method=${METHOD}&version=${VERSION}${PARAMS}`, function(error, res, body) {
            if (!error && res.statusCode == 200) {
                resolve(JSON.parse(body));
            } else {
                reject(error);
            }
        });
    });
}

async function getSongs(song) {
    return [{ name: 'song form testa', link: 'blah' }];
}

async function getCover(data) {
    coverData = JSON.parse(data)
    let url = `${dsmURL}/webapi/AudioStation/cover.cgi?api=SYNO.AudioStation.Cover&output_default=true&is_hr=false&version=3&library=shared&method=getcover&view=default`
    switch (coverData.type) {
        case 'artist': //演出者
            url += coverData.info ? `&artist_name=${encodeURIComponent(coverData.info)}` : ``
            break;
        case 'composer': //作曲者
            url += coverData.info ? `&composer_name=${encodeURIComponent(coverData.info)}` : ``
            break;
        case 'genre': //類型
            url += coverData.info ? `&genre_name=${encodeURIComponent(coverData.info)}` : ``
            break;
        case 'song': //歌曲
            url = `${dsmURL}/webapi/AudioStation/cover.cgi?api=SYNO.AudioStation.Cover&output_default=true&is_hr=false&version=3&library=shared&method=getsongcover&view=large&id=${coverData.info}`
            break;
        case 'folder': //資料夾
            url = `${dsmURL}/webapi/AudioStation/cover.cgi?api=SYNO.AudioStation.Cover&output_default=true&is_hr=false&version=3&library=shared&method=getfoldercover&view=default&id=${coverData.info}`
            break;
        case 'album': //專輯
            url += `&album_name=${encodeURIComponent(coverData.info.album_name)||''}`
            url += `&artist_name=${encodeURIComponent(coverData.info.artist_name)||''}`
            url += `&album_artist_name=${encodeURIComponent(coverData.info.album_artist_name)||''}`
            break;
    }
    console.log(url)
    return request.get(url)
}

async function search(keyword, options = {}) {
    return [{ name: 'song form testa', link: 'blah' }];
}

async function getAlbumSongs(id) {
    return [{ name: 'song form testa', link: 'blah' }];
}

async function getFolders() {
    return [{ name: 'song form testa', link: 'blah' }];
}

async function getFolderFiles(id) {
    return [{ name: 'song form testa', link: 'blah' }];
}

async function getArtists() {
    return [{ name: 'song form testa', link: 'blah' }];
}

async function getArtistAlbums(id) {
    return [{ name: 'song form testa', link: 'blah' }];
}

async function getComposers() {
    return [{ name: 'song form testa', link: 'blah' }];
}

async function getComposerAlbums(id) {
    return [{ name: 'song form testa', link: 'blah' }];
}

async function getPlaylists() {
    return [{ name: 'song form testa', link: 'blah' }];
}

async function getPlaylistSongs(id) {
    return [{ name: 'song form testa', link: 'blah' }];
}
async function getRandomPlaylistSongs(id) {
    return [{ name: 'song form testa', link: 'blah' }];
}

async function getLrc(id) {
    return [{ name: 'song form testa', link: 'blah' }];
}

async function searchLrc(keyword) {
    return [{ name: 'song form testa', link: 'blah' }];
}

module.exports = {
    name: 'DSM',
    onLoaded,
    getSongs,
    getCover,
    search,
    getAlbumSongs,
    getFolders,
    getFolderFiles,
    getArtists,
    getArtistAlbums,
    getComposers,
    getComposerAlbums,
    getPlaylists,
    getPlaylistSongs,
    getRandomPlaylistSongs,
    getLrc,
    searchLrc
};