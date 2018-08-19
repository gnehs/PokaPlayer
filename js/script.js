// 初始化播放器
const ap = new APlayer({
    container: document.getElementById('aplayer'),
    fixed: true
});
// 初始化歌詞解析
const lrc = new Lyrics(`[00:00.000]`);
// 路由
const router = new Navigo(null, true, '#!');
router
    .on({
        'search/:keyword': params => showSearch(params.keyword),
        'search': showSearch,
        'album/:artist/:name/:albumArtist': params => showAlbumSongs(params.artist, params.name, params.albumArtist),
        'album': showAlbum,
        'folder/:dir': params => showFolder(params.dir),
        'folder': showFolder,
        'artist/:artist': params => showArtist(params.artist),
        'artist': showArtist,
        'composer/:composer': params => showComposer(params.composer),
        'composer': showComposer,
        'playlist/:playlistType/:playlistID': params => showPlaylistSongs(params.playlistType + '/' + params.playlistID),
        'playlist': showPlaylist,
        'random': showRandom,
        'now': showNow,
        'lrc': showLrc,
        'settings': showSettings,
        'settings/theme': showSettingsTheme,
        'settings/pic': showSettingsPic,
        'settings/about': showSettingsAbout,
        '*': showHome
    })
    .resolve()
router
    .hooks({
        before: (done, params) => {
            $("#player").removeClass('hide')
            done()
        },
        after: params => {
            $('#drawer a').removeClass('mdui-list-item-active')
            $(`#drawer a[href="${$('#content').attr('data-page')}"]`).addClass('mdui-list-item-active')
        }
    })

// 初始化網頁
$(() => {
    // 在進入網頁時嘗試登入
    tryRelogin()

    // 離線提示
    var offlineDialog = new mdui.Dialog("#offline", { history: false });
    Offline.options = {
        checks: { xhr: { url: '/ping' } },
        checkOnLoad: true,
        interceptRequests: false
    }
    Offline.check()
    Offline.on('down', function() {
        offlineDialog.open()
    });
    Offline.on('up', function() {
        offlineDialog.close()
    });


    $(`#drawer a[href="${$('#content').attr('data-page')}"]`).addClass('mdui-list-item-active')
    if ($(window).width() < 1024) {
        $('#drawer a').attr("mdui-drawer", "{target: '#drawer', swipe: true}")
        mdui.mutation()
    }
    $('#player>*:not(.ctrl)').click(() => router.navigate('now'));
    // 初始化 MediaSession
    updateMediaSession()
});
// 宣告全域變數
songList = [];
const socket = io();
socket.on("hello", () => {
    socket.emit('login')
});
ap.on("play", async() => {
    //沒歌就隨機播放
    if (ap.list.audios.length == 0) playRandom().then(() => {
        router.navigate('now');
        showNow()
    })
    let nowPlaying = ap.list.audios[ap.list.index],
        name, artist
    if (nowPlaying) {
        name = nowPlaying.name
        artist = nowPlaying.artist
        $(document).attr("title", `${name} - ${artist}`);
    }
    updateMediaSession()
})
ap.on("loadedmetadata", async() => {
    lrc.load(`[00:00.000]歌詞讀取中`)
    $("div[data-lrc=\"inner\"]").html(`<p class="loading">歌詞讀取中</p>`)
    let nowPlaying = ap.list.audios[ap.list.index],
        name = nowPlaying.name,
        id = nowPlaying.id,
        artist = nowPlaying.artist
    $(document).attr("title", `${name} - ${artist}`);

    let lrcResult = await getLrc(artist, name, id)
    setLrc(lrcResult)
})

function setLrc(lrcResult) {
    if (lrcResult) {
        lrc.load(lrcResult);
    } else
        lrc.load(`[00:00.000]無歌詞`)
    if ($("div[data-lrc]").length > 0) {
        let html = ``
        for (i = 0; i < lrc.getLyrics().length; i++) {
            let text = lrc.getLyrics()[i].text
            html += `<p>${text}</p>`
        }
        $("div[data-lrc=\"inner\"]").html(html)
    }
}
ap.on("timeupdate", () => {
    let name = ap.list.audios[ap.list.index].name || "",
        artist = ap.list.audios[ap.list.index].artist || "",
        img = window.localStorage["imgRes"] != "true" ? ap.list.audios[ap.list.index].cover : getBackground() //一定會有圖片
    $('#player button.play[onclick="ap.toggle()"] i').text("pause")
    $('#player .song-info .name').text(name)
    $('#player .song-info .artist').text(artist)
    $('#player img').attr('src', img)
    updateMediaSession()
})
ap.on("pause", () => {
    $('#player button.play[onclick="ap.toggle()"] i').text("play_arrow")
    $(document).attr("title", `Pokaplayer`);
})

function updateMediaSession() {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: $('#player .song-info .name').text(),
            artist: $('#player .song-info .artist').text(),
            artwork: [{ src: $('#player img').attr('src'), type: 'image/png' }]
        });
        navigator.mediaSession.setActionHandler('play', () => { ap.toggle() });
        navigator.mediaSession.setActionHandler('pause', () => { ap.pause() });
        navigator.mediaSession.setActionHandler('seekbackward', () => { ap.seek(ap.audio.currentTime - 10) });
        navigator.mediaSession.setActionHandler('seekforward', () => { ap.seek(ap.audio.currentTime + 10) });
        navigator.mediaSession.setActionHandler('previoustrack', () => { ap.skipBack() });
        navigator.mediaSession.setActionHandler('nexttrack', () => { ap.skipForward() });
    }
}


var loginFailureCount = 0

function tryRelogin() {
    //如果有存到密碼或是嘗試次數少於 10 次就嘗試登入
    if (window.localStorage["userPASS"] || loginFailureCount <= 10) {
        console.log("[Login] 正在嘗試登入")
        $.post("/login/", { userPASS: window.localStorage["userPASS"] }, data => {
            if (data == 'success') {
                console.log("[Login] 登入成功")
                loginFailureCount = 0
            } else {
                console.error("[Login] 登入失敗")
                mdui.snackbar({ message: 'Session 過期，請重新登入', timeout: 1000, position: getSnackbarPosition() });
                document.location.href = "/login/";
            }
        });
    } else if (loginFailureCount > 10) {
        console.log("[Login] 登入失敗超過十次，已放棄")
        mdui.snackbar({ message: '發生了未知錯誤', timeout: 1000, position: getSnackbarPosition() });
    }
}
//-- 加解密
function ppEncode(str) {
    return encodeURIComponent(base64.encode(str))
}

function ppDecode(str) {
    return base64.decode(decodeURIComponent(str))
}
//-- 秒數轉時間
function secondToTime(second) {
    let MM = Math.floor(second / 60)
    let SS = Math.floor(second % 60)
    SS = SS < 10 ? '0' + SS : SS
    return MM + ":" + SS
}

// 首頁
async function showHome() {
    $('#content').attr('data-page', 'home')
        // 展示讀取中
    let header = HTML.getHeader("PokaPlayer")
    $("#content").html(header + HTML.getSpinner())
    mdui.mutation()

    let data = await getAPI("entry.cgi", "SYNO.AudioStation.Pin", "list", [{ key: "limit", "value": -1 }, { key: "offset", "value": 0 }]),
        album = HTML.showPins(data.data.items)
    $("#content").html(header + album)
    $("#content>:not(#header-wrapper)")
    router.updatePageLinks()
}
//- 搜尋
async function showSearch(keyword) {

    $('#content').attr('data-page', 'search')
    let html = `
    <div class="mdui-row">
        <div class="mdui-col-md-6 mdui-col-offset-md-3">
            <div class="mdui-textfield">
                <i class="mdui-icon material-icons">search</i>
                <input class="mdui-textfield-input" 
                       id="search" 
                       type="text" 
                       placeholder="搜尋" 
                       value="${$('#search').val()||''}" 
                       required/>
                <div class="mdui-textfield-error">尚未輸入關鍵字</div>
                <div class="mdui-textfield-helper">輸入完後按下 Enter 開始搜尋音樂、專輯或演出者</div>
            </div>
        </div>
    </div>`
    let noResultTexts = [
        '嘿，我們沒聽說過那個！',
        '也許試試其他關鍵字',
        '找不到啦QQQ',
        '嘿！搜尋結果不見了',
        '糟糕！搜尋結果被吃掉了',
        '找不到：（',
        '哈囉！這裡是太虛之境，啥都沒有',
        '尼484打錯字',
        '偶們看不懂關鍵字：（',
        '什麼～都～沒有',
        '找不到結果，請不要太難過',
        '萬物皆空',
        '喔不，搜尋結果被搶走了',
        '飛鴿傳書也找不到，咕咕咕',
        '我們把搜尋結果拿去餵魚了'
    ]
    const noResult = () => { return `<div class="mdui-valign" style="height:150px"><p class="mdui-center">${noResultTexts[Math.floor(Math.random() * noResultTexts.length)]}</p></div>` }
    if (keyword) {
        let result = await searchAll(keyword)
        let tabs = `<div class="mdui-tab" mdui-tab style="margin-bottom:16px;">
            <a class="mdui-tab-active mdui-ripple" href="#search-songs">歌曲 (${result.songTotal})</a>
            <a class="mdui-ripple" href="#search-albums">專輯 (${result.albumTotal})</a>
            <a class="mdui-ripple" href="#search-artists">演出者 (${result.artistTotal})</a>
        </div>`
        let resultHtml = ``
            // 歌曲
        if (result.songTotal > 0) resultHtml += `<div id="search-songs">${HTML.showSongs(result.songs)}</div>`
        else resultHtml += `<div id="search-songs">${noResult()}</div>`
            // 專輯
        if (result.albumTotal > 0) resultHtml += `<div id="search-albums">${HTML.showAlbums(result.albums)}</div>`
        else resultHtml += `<div id="search-albums">${noResult()}</div>`
            // 演出者
        if (result.artistTotal > 0) resultHtml += `<div id="search-artists">${HTML.showArtist(result.artists)}</div>`
        else resultHtml += `<div id="search-artists">${noResult()}</div>`
        if ($("#content").attr('data-page') == 'search') {
            $("#content").html(html + tabs + resultHtml)
            mdui.mutation()
        }
    } else
        $("#content").html(html)
    mdui.mutation() //初始化

    $('#search').change(async function() {
        $('#search+.mdui-textfield-error+.mdui-textfield-helper').text('搜尋中...')
        router.navigate('search/' + $(this).val())
    });
}
//- 列出專輯
async function showAlbum() {
    // 展示讀取中
    let header = HTML.getHeader("專輯")
    $('#content').attr('data-page', 'album')
    $("#content").html(header + HTML.getSpinner())
    mdui.mutation()
    let albums = await getAPI("AudioStation/album.cgi", "SYNO.AudioStation.Album", "list", [
            { key: "additional", "value": "avg_rating" },
            { key: "library", "value": "shared" },
            { key: "limit", "value": 1000 },
            { key: "sort_by", "value": "name" },
            { key: "sort_direction", "value": "ASC" },
        ], 3),
        album = HTML.showAlbums(albums.data.albums),
        recentlyAlbums = await getAPI("AudioStation/album.cgi", "SYNO.AudioStation.Album", "list", [
            { key: "additional", "value": "avg_rating" },
            { key: "library", "value": "shared" },
            { key: "limit", "value": 1000 },
            { key: "method", "value": 'list' },
            { key: "sort_by", "value": "time" },
            { key: "sort_direction", "value": "desc" },
        ], 3),
        recently = HTML.showAlbums(recentlyAlbums.data.albums),
        tabs = `<div class="mdui-tab" mdui-tab>
            <a href="#album-albums" class="mdui-tab-active mdui-ripple">專輯列表</a>
            <a href="#recently-albums" class="mdui-ripple">最近加入</a>
        </div>`,
        html = `<div id="album-albums">${album}</div>
                <div id="recently-albums">${recently}</div>`
    if ($("#content").attr('data-page') == 'album') {
        $("#content").html(header + tabs + html)
        $("#content>:not(#header-wrapper):not(#recently-albums)")
        mdui.mutation()
        router.updatePageLinks()
    }
}
//- 展示專輯歌曲
async function showAlbumSongs(a, b, c) {
    let artist = a == '#' ? '' : a,
        album = b == '#' ? '' : b,
        albumArtist = c == '#' ? '' : c

    //如果從首頁按進去頁籤沒切換
    $("#content").attr('data-page', 'album')
    let albumInfo = `
    <div class="album-info">
        <div class="cover mdui-shadow-1" 
             style="background-image:url(${getCover("album", album,artist,albumArtist)})"></div>
        <div class="info">
            <div class="album-name mdui-text-truncate mdui-text-color-theme-text" 
                 title="${album}">${album}</div>
            <div class="artist-name mdui-text-truncate mdui-text-color-theme-secondary" 
                 title="${artist}">${artist}</div>
            <div class="grow"></div>
            <div class="footer">
                <div class="time mdui-text-color-theme-disabled mdui-text-truncate"></div>
                <div class="actions">
                </div>
            </div>
        </div>
    </div>
    <div class="mdui-divider" style="margin: 10px 0"></div>`
    let actions = `
    <button class="mdui-btn mdui-btn-icon mdui-ripple" 
            onclick="addSong(songList)" 
            title="將此頁面歌曲全部加入到現正播放">
        <i class="mdui-icon material-icons">playlist_add</i>
    </button>`

    // 展示讀取中
    $("#content").html(albumInfo + HTML.getSpinner())
    mdui.mutation()

    //抓資料
    let data = await getAlbumSong(album, albumArtist, artist),
        html = HTML.showSongs(data.data.songs)
    if ($("#content").attr('data-page') == 'album') {
        $("#content").html(albumInfo + html)
        $("#content>:not(.album-info):not(.mdui-divider)")
    }

    // 獲取總時間
    let time = 0
    for (i = 0; i < data.data.songs.length; i++) time += data.data.songs[i].additional.song_audio.duration
    $("#content .album-info .time").html(`${data.data.songs.length} 首歌曲/${secondToTime(time)}`)
    $("#content .album-info .actions").html(actions)

}
// 資料夾
async function showFolder(folder) {
    $("#content").attr('data-page', 'folder')
        // 展示讀取中
    let header = HTML.getHeader("資料夾")
    $("#content").html(header + HTML.getSpinner())
    mdui.mutation()
    let PARAMS_JSON = [
        { key: "additional", "value": "song_tag,song_audio,song_rating" },
        { key: "library", "value": "shared" },
        { key: "limit", "value": 1000 },
        { key: "method", "value": 'list' },
        { key: "sort_by", "value": "title" },
        { key: "sort_direction", "value": "ASC" },
    ]
    if (folder) {
        PARAMS_JSON.push({ key: "id", "value": folder })
    }
    let data = await getAPI("AudioStation/folder.cgi", "SYNO.AudioStation.Folder", "list", PARAMS_JSON, 2),
        folderHTML = HTML.showFolder(data.data.items)
    if ($("#content").attr('data-page') == 'folder') {
        $("#content").html(header + folderHTML)
        $("#content>:not(#header-wrapper)")
        router.updatePageLinks()
    }
}
async function showArtist(artist) {
    let header = HTML.getHeader("演出者")
    $("#content").attr('data-page', 'artist')
    $("#content").html(header + HTML.getSpinner())
    mdui.mutation()
    if (artist) {
        let header = HTML.getHeader("演出者 / " + artist)
        let PARAMS_JSON = [
            { key: "additional", "value": "avg_rating" },
            { key: "library", "value": "shared" },
            { key: "limit", "value": 1000 },
            { key: "method", "value": 'list' },
            { key: "sort_by", "value": "display_artist" },
            { key: "sort_direction", "value": "ASC" },
            { key: "artist", "value": artist != "未知" ? artist : '' },
        ]
        let data = await getAPI("AudioStation/album.cgi", "SYNO.AudioStation.Album", "list", PARAMS_JSON, 3),
            albumHTML = HTML.showAlbums(data.data.albums)
        if ($("#content").attr('data-page') == 'artist')
            $("#content").html(header + albumHTML)
    } else {
        //請求資料囉
        let PARAMS_JSON = [
            { key: "limit", "value": 1000 },
            { key: "library", "value": "shared" },
            { key: "additional", "value": "avg_rating" },
            { key: "sort_by", "value": "name" },
            { key: "sort_direction", "value": "ASC" }
        ]
        let data = await getAPI("AudioStation/artist.cgi", "SYNO.AudioStation.Artist", "list", PARAMS_JSON, 4),
            artistsHTML = HTML.showArtist(data.data.artists)
        if ($("#content").attr('data-page') == 'artist')
            $("#content").html(header + artistsHTML)
    }
    if ($("#content").attr('data-page') == 'artist') {
        $("#content>:not(#header-wrapper)")
        router.updatePageLinks()
    }
}
async function showComposer(composer) {
    let header = HTML.getHeader("作曲者")
    $("#content").attr('data-page', 'composer')
    $("#content").html(header + HTML.getSpinner())
    mdui.mutation()
    if (composer) {
        let header = HTML.getHeader("作曲者 / " + composer)
        let PARAMS_JSON = [
                { key: "additional", "value": "avg_rating" },
                { key: "library", "value": "shared" },
                { key: "limit", "value": 1000 },
                { key: "method", "value": 'list' },
                { key: "sort_by", "value": "display_artist" },
                { key: "sort_direction", "value": "ASC" },
                { key: "composer", "value": composer != "未知" ? composer : '' },
            ],
            data = await getAPI("AudioStation/album.cgi", "SYNO.AudioStation.Album", "list", PARAMS_JSON, 3),
            albumHTML = HTML.showAlbums(data.data.albums)
        if ($("#content").attr('data-page') == 'composer')
            $("#content").html(header + albumHTML)
    } else {
        //請求資料囉
        let PARAMS_JSON = [
                { key: "limit", "value": 1000 },
                { key: "library", "value": "shared" },
                { key: "additional", "value": "avg_rating" },
                { key: "sort_by", "value": "name" },
                { key: "sort_direction", "value": "ASC" }
            ],
            data = await getAPI("AudioStation/composer.cgi", "SYNO.AudioStation.Composer", "list", PARAMS_JSON, 2),
            composersHTML = HTML.showComposer(data.data.composers)
        if ($("#content").attr('data-page') == 'composer')
            $("#content").html(header + composersHTML)
    }
    if ($("#content").attr('data-page') == 'composer') {
        $("#content>:not(#header-wrapper)")
        router.updatePageLinks()
    }
}
//- 播放清單
async function showPlaylist() {
    // 展示讀取中
    let header = HTML.getHeader("所有清單")
    $("#content").html(header + HTML.getSpinner())
    $('#content').attr('data-page', 'playlist')
    mdui.mutation()
    let playlist = await getAPI("AudioStation/playlist.cgi", "SYNO.AudioStation.Playlist", "list", [
        { key: "limit", "value": 1000 },
        { key: "library", "value": "shared" },
        { key: "sort_by", "value": "" },
        { key: "sort_direction", "value": "ASC" }
    ], 3)
    if ($("#content").attr('data-page') == 'playlist') {
        if (playlist.data.playlists.length < 0) {
            $("#content").html(header + `<div class="mdui-valign" style="height:150px"><p class="mdui-center">沒有任何播放清單</p></div>`)
        }
        $("#content").html(header + HTML.showPlaylists(playlist.data.playlists))
        router.updatePageLinks()
    }
}
//- 播放清單歌曲
async function showPlaylistSongs(id) {
    //如果從首頁按進去
    $("#content").attr('data-page', 'playlist')

    // 展示讀取中
    let header = HTML.getHeader("正在讀取播放清單")
    $("#content").html(header + HTML.getSpinner())
    mdui.mutation()

    //抓資料
    let playlist = await getAPI("AudioStation/playlist.cgi", "SYNO.AudioStation.Playlist", "getinfo", [
        { key: "limit", "value": 1000 },
        { key: "library", "value": "shared" },
        { key: "sort_by", "value": "" },
        { key: "additional", "value": "songs_song_tag,songs_song_audio,songs_song_rating,sharing_info" },
        { key: "id", "value": id },
        { key: "sort_direction", "value": "ASC" }
    ], 3)
    let result = playlist.data.playlists[0]
    let name = result.name
    let songs = HTML.showSongs(result.additional.songs)
    header = HTML.getHeader(name)
    if ($("#content").attr('data-page') == 'playlist') {
        $("#content").html(header + songs)
        $("#content>:not(#header-wrapper)")
    }
}
//- 隨機播放
async function showRandom() {
    // 展示讀取中
    let header = HTML.getHeader("隨機播放")
    $("#content").html(header + HTML.getSpinner())
    $('#content').attr('data-page', 'random')
    mdui.mutation()
    let PARAMS_JSON = [
            { key: "additional", "value": "song_tag,song_audio,song_rating" },
            { key: "library", "value": "shared" },
            { key: "limit", "value": 100 },
            { key: "sort_by", "value": "random" }
        ],
        data = await getAPI("AudioStation/song.cgi", "SYNO.AudioStation.Song", "list", PARAMS_JSON, 1),
        album = HTML.showSongs(data.data.songs)
    if ($("#content").attr('data-page') == 'random') {
        $("#content").html(header + album)
        $("#content>:not(#header-wrapper)")
    }
}
async function playRandom() {
    router.navigate('now')
    let PARAMS_JSON = [
            { key: "additional", "value": "song_tag,song_audio,song_rating" },
            { key: "library", "value": "shared" },
            { key: "limit", "value": 100 },
            { key: "sort_by", "value": "random" }
        ],
        data = await getAPI("AudioStation/song.cgi", "SYNO.AudioStation.Song", "list", PARAMS_JSON, 1)
    playSongs(data.data.songs, false, false)
}
//- 現正播放
async function showNow() {
    $('#content').attr('data-page', 'now')
    let html = `<ul class="mdui-list songs">`
    for (i = 0; i < ap.list.audios.length; i++) {
        let focus = ap.list.index == i ? 'mdui-list-item-active' : '',
            title = ap.list.audios[i].name,
            artist = ap.list.audios[i].artist,
            albumArtist = ap.list.audios[i].albumArtist,
            album = ap.list.audios[i].album,
            img = window.localStorage["imgRes"] == "true" ? '' : `<div class="mdui-list-item-avatar"><img src="${ap.list.audios[i].cover}"/></div>`
        html += `<li class="mdui-list-item mdui-ripple song ${focus}" >
            ${img}
            <div class="mdui-list-item-content songinfo" data-now-play-id="${i}">
                <div class="mdui-list-item-title mdui-list-item-one-line">${title}</div>
                <div class="mdui-list-item-text mdui-list-item-one-line">${artist}</div>
            </div>
            <button class="mdui-btn mdui-btn-icon mdui-ripple close" data-now-play-id="${i}">
                <i class="mdui-icon material-icons">close</i>
            </button>
        </li>`　
    }
    html += `</ul>`


    let nowPlaying = ap.list.audios[ap.list.index],
        name = nowPlaying ? nowPlaying.name : "PokaPlayer",
        artist = nowPlaying ? nowPlaying.artist || "未知的歌手" : "點擊播放鍵開始隨機播放",
        album = nowPlaying ? `</br>${nowPlaying.album}` || "" : "</br>",
        img = (nowPlaying && window.localStorage["imgRes"] != "true") ? nowPlaying.cover : getBackground()
    currentTime = ap.audio.currentTime ? secondToTime(ap.audio.currentTime) : "0:00",
        duration = ap.audio.currentTime ? secondToTime(ap.audio.duration) : "0:00",
        timer = currentTime + '/' + duration,
        info = `
    <div data-player>
        <div class="mdui-card" style="background-image:url(${img});">
        </div>
        <div class="info">
            <div class="title  mdui-text-truncate mdui-text-color-theme-accent">${name}</div>
            <div class="artist mdui-text-truncate mdui-text-color-theme-text">${artist+album}</div>
            <div data-lrc>
                <div data-lrc="inner"></div>
            </div>
            <div class="ctrl">
                <button class="mdui-btn mdui-btn-icon mdui-ripple random"><i class="mdui-icon material-icons">skip_previous</i></button>
                <button class="mdui-btn mdui-btn-icon mdui-ripple" onclick="ap.skipBack()"><i class="mdui-icon material-icons">skip_previous</i></button>
                <button class="mdui-btn mdui-btn-icon mdui-ripple mdui-color-theme-accent play" onclick="ap.toggle()"><i class="mdui-icon material-icons">play_arrow</i></button>
                <button class="mdui-btn mdui-btn-icon mdui-ripple" onclick="ap.skipForward()"><i class="mdui-icon material-icons">skip_next</i></button>
                <button class="mdui-btn mdui-btn-icon mdui-ripple loop"><i class="mdui-icon material-icons">skip_previous</i></button>
            </div>
            <div class="player-bar">
                <label class="mdui-slider">
                    <input type="range" step="0.000001" min="0" max="100" value="${ap.audio.currentTime / ap.audio.duration * 100||0}"/>
                </label>
                <div class="timer mdui-typo-body-1-opacity mdui-text-right">${timer}</div>
            </div>
        </div>
    </div>`;
    // 輸出
    $("#content").html(`<div data-player-container>${info+html}</div>`);
    // 隱藏原本ㄉ播放器
    $("#player").addClass('hide');
    // random＆loop
    $("[data-player]>.info>.ctrl>.random").html($('.aplayer-icon.aplayer-icon-order').html())
    $("[data-player]>.info>.ctrl>.loop").html($('.aplayer-icon.aplayer-icon-loop').html())
    $("[data-player]>.info>.ctrl>.random").click(function() {
        $('#aplayer .aplayer-icon.aplayer-icon-order').click()
        $(this).html($('.aplayer-icon.aplayer-icon-order').html())
    })
    $("[data-player]>.info>.ctrl>.loop").click(function() {
        $('#aplayer .aplayer-icon.aplayer-icon-loop').click()
        $(this).html($('.aplayer-icon.aplayer-icon-loop').html())
    });
    //初始化滑塊
    mdui.mutation();
    // 確認播放鈕狀態
    if (ap.audio.paused)
        $('[data-player] button.play[onclick="ap.toggle()"] i').text("play_arrow");
    else
        $('[data-player] button.play[onclick="ap.toggle()"] i').text("pause");
    //捲動清單
    if ($(window).width() > 850 && $(window).height() > 560) {
        $('.mdui-list.songs').scrollTop(72 * ap.list.index - 100);
    }
    // 歌詞
    if (lrc.getLyrics()) {
        let html = ``
        for (i = 0; i < lrc.getLyrics().length; i++) {
            let text = lrc.getLyrics()[i].text
            if (text == "歌詞讀取中")
                html += `<p class="loading">${text}</p>`
            else
                html += `<p>${text}</p>`
        }
        $('div[data-lrc="inner"]').html(html)
        let nowLrc = lrc.select(ap.audio.currentTime)
        if (nowLrc > -1) {
            $('[data-player] div[data-lrc="inner"] p').eq(nowLrc).addClass('mdui-text-color-theme-accent')
            let sh = $('div[data-lrc="inner"] p.mdui-text-color-theme-accent')[0].offsetTop - $('[data-player] .info>div[data-lrc]').height() / 2 - $('div[data-lrc="inner"] p.mdui-text-color-theme-accent')[0].clientHeight
            $('[data-player] .info>div[data-lrc]').scrollTop(sh);
        }
    }

    ap.on("pause", () => {
        $('[data-player] button.play[onclick="ap.toggle()"] i').text("play_arrow")
    })
    ap.on("play", async() => {
        //卷軸轉轉
        if ($(window).width() > 850 && $(window).height() > 560) {
            $('.mdui-list.songs').animate({ scrollTop: 72 * ap.list.index - 100 }, 400);
        }
        //- list 切換 active
        $(".songs>li.song").removeClass('mdui-list-item-active')
        $(".songs>li.song").eq(ap.list.index).addClass('mdui-list-item-active');
        //- 播放器
        $('[data-player] button.play[onclick="ap.toggle()"] i').text("pause")
        let nowPlaying = ap.list.audios[ap.list.index]
        let name = nowPlaying ? nowPlaying.name : "PokaPlayer"
        let artist = nowPlaying ? nowPlaying.artist || "未知的歌手" : "點擊播放鍵開始隨機播放"
        let album = nowPlaying ? `</br>${nowPlaying.album}` || "" : "</br>"
        let img = (nowPlaying && window.localStorage["imgRes"] != "true") ? nowPlaying.cover : getBackground(); //一定會有圖片
        $('[data-player]>.mdui-card').attr('style', `background-image:url(${img});`)
        $('[data-player]>.info .title').text(name)
        $('[data-player]>.info .artist').html(artist + album)

        // 更新 timer
        $("[data-player]>.info>.player-bar input[type=range]").val(0);
        mdui.updateSliders()

        // 歌詞
        if (lrc.getLyrics()) {
            let html = ``
            for (i = 0; i < lrc.getLyrics().length; i++) {
                let text = lrc.getLyrics()[i].text
                if (text == "歌詞讀取中")
                    html += `<p class="loading">${text}</p>`
                else
                    html += `<p>${text}</p>`
            }
            $('[data-lrc="inner"]').html(html)
        }
    })
    ap.on("timeupdate", () => {
        currentTime = ap.audio.currentTime ? secondToTime(ap.audio.currentTime) : "0:00"
        duration = ap.audio.currentTime ? secondToTime(ap.audio.duration) : "0:00"
        let cent = ap.audio.currentTime / ap.audio.duration * 100
        $('[data-player]>.info>.player-bar>.timer').text(currentTime + '/' + duration);
        // 更新 timer
        $("[data-player]>.info>.player-bar input[type=range]").val(cent);
        mdui.updateSliders();
        // 歌詞亮亮
        if ($(window).width() > 850 && $(window).height() > 750) {
            let nowLrc = lrc.select(ap.audio.currentTime)
            let before = $('[data-player] div[data-lrc="inner"] p.mdui-text-color-theme-accent')[0]
            let after = $('[data-player] div[data-lrc="inner"] p').eq(nowLrc)[0]
            if (before != after && nowLrc > -1) {
                $('[data-player] div[data-lrc="inner"] p').removeClass('mdui-text-color-theme-accent')
                $('[data-player] div[data-lrc="inner"] p').eq(nowLrc).addClass('mdui-text-color-theme-accent')
                let sh = $('div[data-lrc="inner"] p.mdui-text-color-theme-accent')[0].offsetTop - $('[data-player] .info>div[data-lrc]').height() / 2 - $('div[data-lrc="inner"] p.mdui-text-color-theme-accent')[0].clientHeight
                $('[data-player] .info>div[data-lrc]').animate({ scrollTop: sh }, 300);
            }
        }
    });
    $('[data-player] .info>div[data-lrc]').dblclick(function() {
        showLrcChoose()
    })
    $("[data-player]>.info>.player-bar input[type=range]").on("input", () => {
        let time = $("[data-player]>.info>.player-bar input[type=range]").val() / 100 * ap.audio.duration
        ap.seek(time);
    })

    $(".songs [data-now-play-id].songinfo").click(function() {
        $(".songs>li.song").removeClass('mdui-list-item-active')
        $(this).parent().eq(0).addClass('mdui-list-item-active')
        let song = $(this).attr('data-now-play-id')
        ap.list.switch(song)
        ap.play()
    })
    $(".songs [data-now-play-id].close").click(function() {
        let song = $(this).attr('data-now-play-id')
        if (song == ap.list.index) ap.skipForward()
        ap.list.remove(song)
        showNow()
    })
}
//- 歌詞
function showLrc() {
    $("#content").html(`<div data-lrc><div data-lrc="inner"></div></div>`)
    $('#content').attr('data-page', 'lrc')

    // 歌詞
    if (lrc.getLyrics()) {
        let html = ``
        for (i = 0; i < lrc.getLyrics().length; i++) {
            let text = lrc.getLyrics()[i].text
            if (text == "歌詞讀取中")
                html += `<p class="loading">${text}</p>`
            else
                html += `<p>${text}</p>`
        }
        $("#content>div[data-lrc]>[data-lrc=\"inner\"]").html(html)
        let nowLrc = lrc.select(ap.audio.currentTime)
        if (nowLrc > -1) {
            $('#content>div[data-lrc]>div[data-lrc="inner"] p').eq(nowLrc).addClass('mdui-text-color-theme-accent')
            let top = $('div[data-lrc="inner"] p.mdui-text-color-theme-accent')[0].offsetTop - $('div[data-lrc]').height() / 2 - $('div[data-lrc="inner"] p.mdui-text-color-theme-accent')[0].clientHeight * 2
            $('#content>div[data-lrc]').animate({ scrollTop: top }, 0);
        }
    }
    ap.on("timeupdate", () => {
        // 歌詞亮亮
        let nowLrc = lrc.select(ap.audio.currentTime)
        let before = $('#content>div[data-lrc]>div[data-lrc="inner"] p.mdui-text-color-theme-accent')[0]
        let after = $('#content>div[data-lrc]>div[data-lrc="inner"] p').eq(nowLrc)[0]
        if (before != after && nowLrc > -1) {
            $('#content>div[data-lrc]>div[data-lrc="inner"] p').removeClass('mdui-text-color-theme-accent')
            $('#content>div[data-lrc]>div[data-lrc="inner"] p').eq(nowLrc).addClass('mdui-text-color-theme-accent')
            let top = $('div[data-lrc="inner"] p.mdui-text-color-theme-accent')[0].offsetTop - $('div[data-lrc]').height() / 2 - $('div[data-lrc="inner"] p.mdui-text-color-theme-accent')[0].clientHeight * 2
            $('#content>div[data-lrc]').animate({ scrollTop: top }, 300);
        }
    });
    $('#content>div[data-lrc]').dblclick(function() {
        showLrcChoose()
    })
}
//- 播放音樂

function playSongs(songlist, song = false, clear = true) {
    if (clear) ap.list.clear()
    let playlist = []
    for (i = 0; i < songlist.length; i++) {
        let nowsong = songlist[i]
        if (nowsong.id.match(/dir_/)) continue; //這是資料夾
        let src = getSong(nowsong)
        let name = nowsong.title
        let artist = nowsong.additional.song_tag.artist
        let album = nowsong.additional.song_tag.album
        let albumArtist = nowsong.additional.song_tag.album_artist
        let poster = getCover("album", album, artist, albumArtist)
        playlist.push({
            url: src,
            cover: poster,
            name: name,
            artist: artist,
            album: album,
            id: nowsong.id,
            albumArtist: albumArtist
        })
        if (nowsong.id == song) { songtoplay = i }
    }
    ap.list.add(playlist)
    if (song)
        for (i = 0; i < ap.list.audios.length; i++)
            if (ap.list.audios[i].id == song) ap.list.switch(i)
    if (clear) ap.play()
}

//- 加入音樂
function addSong(songlist, songID = 0) {
    let playlist = []
    let apList = ap.list.audios.length
    for (i = 0; i < songlist.length; i++) {
        let nowsong = songlist[i]
        if (nowsong.id == songID || songID == 0) {
            let src = getSong(nowsong)
            let name = nowsong.title
            let artist = nowsong.additional.song_tag.artist
            let album = nowsong.additional.song_tag.album
            let albumArtist = nowsong.additional.song_tag.album_artist
            let poster = getCover("album", album, artist, albumArtist)
            playlist.push({
                url: src,
                cover: poster,
                name: name,
                artist: artist,
                album: album,
                id: nowsong.id,
                albumArtist: albumArtist
            })
        }
    }
    if (songID == 0) {
        mdui.snackbar({
            message: `已添加 ${songlist.length} 首歌`,
            timeout: 400,
            position: getSnackbarPosition()
        });
    } else {
        mdui.snackbar({
            message: `已添加 ${playlist[0].name}`,
            timeout: 400,
            position: getSnackbarPosition()
        });
    }
    ap.list.add(playlist)
    if (apList == 0) ap.play() //如果原本沒歌直接開播
}

//- 取得 Snackbar 位置
function getSnackbarPosition() {
    if ($(window).width() < 768)
        return "left-top"
    else
        return "left-bottom"
}

async function showLrcChoose() {
    if (ap.list.audios[ap.list.index] && window.localStorage["lrcSource"] == 'Meting') {
        let nowPlaying = ap.list.audios[ap.list.index],
            name = nowPlaying.name || '',
            artist = nowPlaying.artist || ''
        let list = (items, keyword = '') => {
            r = `<div class="mdui-row">
                            <div class="mdui-col-md-6 mdui-col-offset-md-3">
                                <div class="mdui-textfield">
                                    <i class="mdui-icon material-icons">search</i>
                                    <input class="mdui-textfield-input" 
                                        id="searchLrc" 
                                        type="text" 
                                        placeholder="搜尋歌詞" 
                                        value="${keyword}" 
                                        required/>
                                    <div class="mdui-textfield-error">尚未輸入關鍵字</div>
                                    <div class="mdui-textfield-helper">輸入完後按下 Enter 開始搜尋歌詞</div>
                                </div>
                            </div>
                        </div>
                    <ul class="mdui-list">`;
            r += `<li class="mdui-list-item mdui-ripple" data-lrc-id="no">
                    <div class="mdui-list-item-content">
                        <div class="mdui-list-item-title mdui-list-item-one-line">不載入歌詞</div>
                        <div class="mdui-list-item-text mdui-list-item-one-line">點選清除目前的歌詞</div>
                    </div>
                </li>`
            if (items && items.length > 0) {
                for (i = 0; i < items.length; i++) {
                    let item = items[i]
                    r += `<li class="mdui-list-item mdui-ripple" data-lrc-id="${item.id}">
                            <div class="mdui-list-item-content">
                                <div class="mdui-list-item-title mdui-list-item-one-line">${item.name}</div>
                                <div class="mdui-list-item-text mdui-list-item-one-line">${item.artist[0]} / ${item.album}</div>
                            </div>
                        </li>`
                }
            }


            r += `</ul></div>`
            return r
        }
        mdui.dialog({
            title: '歌詞選擇',
            content: `<div lrc-choose style="min-height:400px">${list()}</div>
            <div class="mdui-dialog-actions">
                <button class="mdui-btn mdui-ripple" mdui-dialog-confirm data-lrc-done>完成</button>
            </div>`,
            history: false
        });
        //初始化
        $("input#searchLrc").attr('value', `${name} ${artist}`)
        $("input#searchLrc + * + .mdui-textfield-helper").text('搜尋中...')
        mdui.mutation();

        async function search(keyword) {
            let searchResult = await getMetingSearchResult(keyword, 30)
            if ($("[lrc-choose]").length > 0) {
                $("[lrc-choose]").html(list(searchResult, keyword))
                mdui.mutation();
            }
            $("[data-lrc-id]").click(async function() {
                let lrcid = $(this).attr('data-lrc-id')
                var text = $(this).children().children('.mdui-list-item-text').text()
                $(this).children().children('.mdui-list-item-text').text('歌詞載入中...')
                if (lrcid != "no") {
                    let metinglrc = await getMetingLrcById(lrcid)
                    setLrc(metinglrc)
                } else {
                    setLrc(false)
                }
                $(this).children().children('.mdui-list-item-text').text(text)
                $('[data-lrc-done]').click()
            })
            $("input#searchLrc").change(function() {
                $("input#searchLrc + * + .mdui-textfield-helper").text('搜尋中...')
                search($(this).val())
            })
        }
        search(`${name} ${artist}`)
    }
}