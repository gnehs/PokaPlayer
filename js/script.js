// 宣告全域變數
songList = [];
const lrc = new Lyrics(`[00:00.000]`);
const socket = io();
socket.on("hello", () => {
    //console.log('hello')
    socket.emit('login')
});
// 初始化播放器
const ap = new APlayer({
    container: document.getElementById('aplayer'),
    fixed: true
});

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

ap.on("play", async() => {
    //沒歌就隨機播放
    if (ap.list.audios.length == 0) playRandom().then(() => {
        router.navigate('now');
        showNow()
    })
    updateMediaSession()
})
ap.on("loadedmetadata", async() => {
    lrc.load(`[00:00.000]歌詞讀取中`)
    $("div[data-lrc=\"inner\"]").html(`<p class="loading">歌詞讀取中</p>`)
    let nowPlaying = ap.list.audios[ap.list.index],
        name = nowPlaying.name,
        id = nowPlaying.id,
        artist = nowPlaying.artist,
        lyricRegex = /\[([0-9.:]*)\]/i

    let lrcResult = await getLrcByID(id),
        lrcs = lrcResult.lyrics
    if (lrcs == "" || !lrcs.match(lyricRegex)) {
        lrcResult = await getLrc(artist, name)
        lrcs = lrcResult ? lrcResult.lyrics[0].additional.full_lyrics : false
    }
    if (lrcs && lrcs.match(lyricRegex)) {
        lrc.load(lrcs);
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
})
ap.on("timeupdate", () => {
    let name = ap.list.audios[ap.list.index].name || ""
    let artist = ap.list.audios[ap.list.index].artist || ""

    let img = window.localStorage["imgRes"] != "true" ? ap.list.audios[ap.list.index].cover : getBackground() //一定會有圖片
    $('#player button.play[onclick="ap.toggle()"] i').text("pause")
    if (name != $('#player .song-info .name').text()) { //歌名有變才更新
        $('#player .song-info .name').text(name)
        $('#player .song-info .artist').text(artist)
        $('#player img').attr('src', img)
    }
    updateMediaSession()
})
ap.on("pause", () => {
    $('#player button.play[onclick="ap.toggle()"] i').text("play_arrow")
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
// 初始化網頁
$(() => {
    $(`#drawer a[href="${$('#content').attr('data-page')}"]`).addClass('mdui-list-item-active')
    if ($(window).width() < 1024) {
        $('#drawer a').attr("mdui-drawer", "{target: '#drawer', swipe: true}")
        mdui.mutation()
    }
    $('#player>*:not(.ctrl)').click(() => router.navigate('now'));
    // 初始化 MediaSession
    updateMediaSession()
});

var loginFailureCount = 0

function tryRelogin() {
    if (window.localStorage["userPASS"] || loginFailureCount <= 10) { //如果有存到密碼或是嘗試次數少於 10 次就嘗試登入
        $.post("/login/", { userPASS: window.localStorage["userPASS"] }, data => {
            if (data == 'success') {
                loginFailureCount = 0
                    //mdui.snackbar({ message: 'Session 過期，重新登入成功', timeout: 1000 });
            } else {
                mdui.snackbar({ message: 'Session 過期，請重新登入', timeout: 1000 });
                document.location.href = "/login/";
            }
        });
    } else if (loginFailureCount > 10) {
        mdui.snackbar({ message: '發生了未知錯誤', timeout: 1000 });
    }
}
//-- 加解密
function ppEncode(str) {
    return encodeURIComponent(base64.encode(str))
}

function ppDecode(str) {
    return decodeURIComponent(base64.decode(str))
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
        let img = (nowPlaying && window.localStorage["imgRes"] != "true") ? nowPlaying.cover : getBackground() //一定會有圖片
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
}
//- 設定
async function showSettings() {

    $('#content').attr('data-page', 'settings')
        ///給定預設值
    if (!window.localStorage["musicRes"]) window.localStorage["musicRes"] = "wav"
    if (!window.localStorage["randomImg"]) window.localStorage["randomImg"] = "/og/og.png"
        ///
    let header = HTML.getHeader("設定")
    let title = title => `<h2 class="mdui-text-color-theme">${title}</h2>`
    let subtitle = subtitle => `<h4>${subtitle}</h4>`
    let colors = [
        'red',
        'pink',
        'purple',
        'deep-purple',
        'indigo',
        'blue',
        'light-blue',
        'cyan',
        'teal',
        'green',
        'light-green',
        'lime',
        'yellow',
        'amber',
        'orange',
        'deep-orange',
        'brown',
        'grey',
        'blue-grey'
    ]
    let colorOption = (colors, accent = false) => {
        let option = ''
        for (i = 0; i < colors.length; i++) {
            let color = colors[i]
            let checked = window.localStorage[accent ? "mdui-theme-accent" : "mdui-theme-primary"] == color ? " checked" : ''
            if (i <= (colors.length - 3 - 1) && accent || !accent)
                option += `<div class="mdui-col"><label class="mdui-radio mdui-text-color-${color}${accent?"-accent":''}">
            <input type="radio" name="group${accent?"1":"2"}" value="${color}"${checked}/>
            <i class="mdui-radio-icon"></i>${color.replace("-"," ")}</label></div>`
        }
        return option
    }
    let themecolor = s => { return `<div class="mdui-col"><label class="mdui-radio"><input type="radio" name="themecolor" value="false" ${s=="true"?"":"checked"}/><i class="mdui-radio-icon"></i>Light</label></div>
  <div class="mdui-col"><label class="mdui-radio"><input type="radio" name="themecolor" value="true" ${s=="true"?"checked":""}/><i class="mdui-radio-icon"></i>Dark</label></div>` }
    let musicRes = s => { return `<div class="mdui-col">
        <label class="mdui-radio">
            <input type="radio" name="musicres" value="mp3" ${s=="mp3"?"checked":""}/>
            <i class="mdui-radio-icon"></i>
            MP3
        </label>
        <div class="mdui-typo-caption-opacity">128K，夭壽靠北，在網路夭壽慢的情況下請選擇此選項</div>
    </div>
    <div class="mdui-col">
        <label class="mdui-radio">
            <input type="radio" name="musicres" value="wav" ${s=="wav"?"checked":""}/>
            <i class="mdui-radio-icon"></i>
            WAV
        </label>
        <div class="mdui-typo-caption-opacity">較高音質，音質較原始音質略差，可在 4G 網路下流暢的串流</div>
    </div>
    <div class="mdui-col">
        <label class="mdui-radio">
            <input type="radio" name="musicres" value="original" ${s=="original"?"checked":""}/>
            <i class="mdui-radio-icon"></i>
            Original
        </label>
        <div class="mdui-typo-caption-opacity">原始音質，在網路狀況許可下，建議選擇此選項聆聽高音質音樂</div>
    </div>` }
    let imgRes = s => { return `<div class="mdui-col">
        <label class="mdui-radio">
            <input type="radio" name="musicres" value="true" ${s=="true"?"checked":""}/>
            <i class="mdui-radio-icon"></i>
            開啟
        </label>
        <div class="mdui-typo-caption-opacity">停止載入所有圖片，以節省流量及讀取時間，音樂仍會按照您所設定的音質播放</div>
    </div>
    <div class="mdui-col">
        <label class="mdui-radio">
            <input type="radio" name="musicres" value="false" ${s=="true"?"":"checked"}/>
            <i class="mdui-radio-icon"></i>
            關閉
        </label>
        <div class="mdui-typo-caption-opacity">載入所有圖片，就像平常那樣</div>
    </div>` }
    let bg = s => { return `<div class="mdui-textfield">
        <input class="mdui-textfield-input" placeholder="隨機圖片" value="${s}"/>
        <div class="mdui-textfield-helper">填入網址或是點擊下方來源來取代原本的隨機圖片</div>
    </div>` }
    let bgSrc = () => {
        let imgs = [{
            name: '預設圖庫',
            src: '/og/og.png'
        }, {
            name: 'The Dog API',
            src: 'https://api.thedogapi.com/v1/images/search?format=src&mime_types=image/gif'
        }, {
            name: 'The Cat API',
            src: 'https://thecatapi.com/api/images/get?format=src&type=gif'
        }, {
            name: 'LoremFlickr',
            src: 'https://loremflickr.com/1920/1080'
        }, {
            name: 'Unsplash Source',
            src: 'https://source.unsplash.com/random'
        }, {
            name: 'Picsum Photos',
            src: 'https://picsum.photos/1920/1080/?random'
        }]
        let html = ''
        for (i = 0; i < imgs.length; i++) {
            let img = imgs[i]
            html += `<a class="mdui-btn mdui-ripple mdui-btn-raised" data-src="${img.src}">${img.name}</a>`
        }
        return html
    }

    let settingTheme = title("主題") +
        subtitle("主題色") + `<form class="mdui-row-xs-2 mdui-row-sm-3 mdui-row-md-5 mdui-row-lg-6" id="PP_Theme">${themecolor(window.localStorage["mdui-theme-color"])}</form>` +
        subtitle("主色") + `<form class="mdui-row-xs-2 mdui-row-sm-3 mdui-row-md-5 mdui-row-lg-6" id="PP_Primary" style="text-transform:capitalize;">${colorOption(colors)}</form>` +
        subtitle("強調色") + `<form class="mdui-row-xs-2 mdui-row-sm-3 mdui-row-md-5 mdui-row-lg-6" id="PP_Accent" style="text-transform:capitalize;">${colorOption(colors,true)}</form>`

    musicRes = title("音質") + `<form class="mdui-row-xs-1 mdui-row-sm-2 mdui-row-md-3 mdui-row-lg-4" id="PP_Res">${musicRes(window.localStorage["musicRes"])}</form>`

    imgRes = title("圖片流量節省") + `<form class="mdui-row-xs-1 mdui-row-sm-2 mdui-row-md-3 mdui-row-lg-4" id="PP_imgRes">${imgRes(window.localStorage["imgRes"])}</form>`

    bg = title("隨機圖片設定") + `<form id="PP_bg">${bg(window.localStorage["randomImg"])}<br>${bgSrc()}</form>`

    let info = title("Audio Station 狀態") + `<div id="DSMinfo" class="mdui-typo"><strong>版本</strong> 載入中</div>`

    let about = title("關於 PokaPlayer") + `<div id="about" class="mdui-typo">
    PokaPlayer 是 Synology Audio Ststion 的新朋友！ <a href="https://github.com/gnehs/PokaPlayer" target="_blank">GitHub</a>
        <p><strong>版本</strong> 載入中 / <strong>開發者</strong> 載入中 / 正在檢查更新</p>
    </div>`

    let html = header + settingTheme + musicRes + imgRes + bg + info + about
    $("#content").html(html)

    //初始化
    mdui.mutation();

    $("#PP_bg input").change(function() {
        window.localStorage["randomImg"] = $(this).val()
        $('#header-wrapper').attr("style", `background-image: url(${$(this).val()});`)
        mdui.snackbar({
            message: `隨機圖片已變更為 ${$(this).val()}`,
            position: getSnackbarPosition(),
            timeout: 1500
        });
    })
    $("#PP_bg [data-src]").click(function() {
        let name = $(this).text()
        let src = $(this).attr('data-src')
        window.localStorage["randomImg"] = src
        $('#header-wrapper').attr("style", `background-image: url(${src});`)
        $('#PP_bg input').val(src);
        mdui.snackbar({
            message: `隨機圖片已變更為 ${name}`,
            position: getSnackbarPosition(),
            timeout: 1500
        });

    })
    $("#PP_Res input").change(function() {
        window.localStorage["musicRes"] = $(this).val()
        mdui.snackbar({
            message: `音質已設定為 ${$(this).val().toUpperCase()}，該設定並不會在現正播放中生效，請重新加入歌曲`,
            position: getSnackbarPosition(),
            timeout: 1500
        });
    })
    $("#PP_imgRes input").change(function() {
        window.localStorage["imgRes"] = $(this).val()
        mdui.snackbar({
            message: `圖片流量節省已${$(this).val()=="true"?"開啟":"關閉"}`,
            position: getSnackbarPosition(),
            timeout: 1500
        });
    })
    $("#PP_Theme input").change(function() {
        window.localStorage["mdui-theme-color"] = $(this).val()
        if ($(this).val() == "true")
            $('body').addClass("mdui-theme-layout-dark")
        else
            $('body').removeClass("mdui-theme-layout-dark")
            //設定顏色
        let metaThemeColor = document.querySelector("meta[name=theme-color]");
        metaThemeColor.setAttribute("content", $('header>div:first-child').css("background-color"));
    })
    $("#PP_Primary input").change(function() {
        let classStr = $('body').attr('class');
        let classes = classStr.split(' ');
        for (i = 0, len = classes.length; i < len; i++) {
            if (classes[i].indexOf('mdui-theme-primary-') === 0) {
                $('body').removeClass(classes[i])
            }
        }
        $('body').addClass(`mdui-theme-primary-${$(this).val()}`)
        window.localStorage["mdui-theme-primary"] = $(this).val()
            //設定顏色
        let metaThemeColor = document.querySelector("meta[name=theme-color]");
        metaThemeColor.setAttribute("content", $('header>div:first-child').css("background-color"));
    })
    $("#PP_Accent input").change(function() {
        let classStr = $('body').attr('class');
        let classes = classStr.split(' ');
        for (i = 0, len = classes.length; i < len; i++) {
            if (classes[i].indexOf('mdui-theme-accent-') === 0) {
                $('body').removeClass(classes[i])
            }
        }
        window.localStorage["mdui-theme-accent"] = $(this).val()
        $('body').addClass(`mdui-theme-accent-${$(this).val()}`)
    })


    // DSM 詳細資料
    let getDSMInfo = await getAPI("AudioStation/info.cgi", "SYNO.AudioStation.Info", "getinfo", [], 4)
    $("#DSMinfo").html(`<strong>版本</strong> ${getDSMInfo.data.version_string?getDSMInfo.data.version_string:"版本：未知"}`)

    // PokaPlayer 詳細資料
    let getInfo = await axios.get('/info/');
    let debug = await axios.get('/debug/')
    let checkUpdate = await axios.get(`https://api.github.com/repos/gnehs/PokaPlayer/releases`);
    let update = getInfo.data.version != checkUpdate.data[0].tag_name ?
        `新版本 <a href="${checkUpdate.data[0].html_url}" target="_blank">${checkUpdate.data[0].tag_name}</a> 已發佈，請立即更新 <a href="javascript:void(0)" data-upgrade>更新</a>` :
        debug.data == false ?
        `您的 PokaPlayer 已是最新版本` :
        `<a href="javascript:void(0)" data-upgrade>與開發分支同步</a>`
    let version = debug.data == false ? getInfo.data.version : debug.data
    about = `PokaPlayer 是 Synology Audio Ststion 的新朋友！ <a href="https://github.com/gnehs/PokaPlayer" target="_blank">GitHub</a>
        <p><strong>版本</strong> ${version} / <strong>開發者</strong> ${getInfo.data.author} / ${update}</p>`
    $("#about").html(about)


    $("[data-upgrade]").click(() => {
        mdui.dialog({
            title: '您確定要現在更新嗎',
            content: '這將導致您在更新完畢前暫時無法使用 PokaPlayer',
            buttons: [{
                    text: '算ㄌ'
                },
                {
                    text: '對啦',
                    onClick: async inst => {
                        mdui.snackbar('正在更新...', { position: getSnackbarPosition() });
                        let update = await axios.get('/upgrade/')
                        if (update.data == "upgrade") {
                            mdui.snackbar('伺服器重新啟動', {
                                buttonText: '重新連接',
                                onButtonClick: () => window.location.reload(),
                            })
                        } else if (update.data == "socket") {
                            socket.emit('update')
                            socket.on('Permission Denied Desu', () => mdui.snackbar('Permission Denied', {
                                timeout: 3000,
                                position: getSnackbarPosition()
                            }))
                            socket.on('init', () => mdui.snackbar('正在初始化...', {
                                timeout: 3000,
                                position: getSnackbarPosition()
                            }))
                            socket.on('git', data => mdui.snackbar({
                                fetch: '初始化完成',
                                reset: '更新檔下載完成'
                            }[data], {
                                timeout: 3000,
                                position: getSnackbarPosition()
                            }))
                            socket.on('restart', () => {
                                socket.emit('restart')
                                mdui.snackbar('伺服器正在重新啟動...', {
                                    buttonText: '重新連接',
                                    onButtonClick: () => window.location.reload(),
                                    position: getSnackbarPosition()
                                })
                            })
                            socket.on('err', data => mdui.snackbar('錯誤: ' + data, {
                                timeout: 8000,
                                position: getSnackbarPosition()
                            }))
                        }
                    }
                }
            ]
        });
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