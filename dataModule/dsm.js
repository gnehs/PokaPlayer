const config = require('../config.json'), // 很會設定ㄉ朋友
    schedule = require('node-schedule'), // 很會計時ㄉ朋友
    request = require('request').defaults({ jar: require('request').jar() }) //很會請求ㄉ朋友

async function onLoaded() {
    let url = `${config.DSM.protocol}://${config.DSM.host}:${config.DSM.port}/webapi/auth.cgi?api=SYNO.API.Auth&method=Login&version=1&account=${config.DSM.account}&passwd=${config.DSM.password}&session=AudioStation&format=cookie`
    console.log("[DataModules][DSM] 正在登入...")
    request(url, async function(error, res, body) {
        if (!error && res.statusCode == 200) {
            if (JSON.parse(body).success)
                console.log("[DataModules][DSM] 登入成功")
            else
                console.error("[DataModules][DSM] 登入失敗，請檢查您的設定檔是否正確")
        } else
            console.error("[DataModules][DSM]", error);
    });
}

async function getSongs(song) {
    return [{ name: 'song form testa', link: 'blah' }];
}

async function getCover(data) {
    let url = `${config.DSM.protocol}://${config.DSM.host}:${config.DSM.port}/webapi/AudioStation/cover.cgi?api=SYNO.AudioStation.Cover&output_default=true&is_hr=false&version=3&library=shared&method=getcover&view=default`
    let type = req.params.type
    let info = req.params.info
    switch (type) {
        case "artist":
            //演出者
            url += info ? `&artist_name=${encodeURIComponent(info)}` : ``
            break;
        case "composer":
            //作曲者
            url += info ? `&composer_name=${encodeURIComponent(info)}` : ``
            break;
        case "genre":
            //作曲者
            url += info ? `&genre_name=${encodeURIComponent(info)}` : ``
            break;
        case "song":
            //歌曲
            url = `${config.DSM.protocol}://${config.DSM.host}:${config.DSM.port}/webapi/AudioStation/cover.cgi?api=SYNO.AudioStation.Cover&output_default=true&is_hr=false&version=3&library=shared&method=getsongcover&view=large&id=${info}`
            break;
        case "folder":
            //資料夾
            url = `${config.DSM.protocol}://${config.DSM.host}:${config.DSM.port}/webapi/AudioStation/cover.cgi?api=SYNO.AudioStation.Cover&output_default=true&is_hr=false&version=3&library=shared&method=getfoldercover&view=default&id=${info}`
            break;
        case "album":
            //專輯
            var info = pp_decode(req.params.info)
            url += info
            break;
    }
    return url
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
    getLrc,
    searchLrc
};