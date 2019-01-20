const moduleShowName = {
    DSM: lang("moduleShowName_DSM"),
    Netease2: lang("moduleShowName_Netease")
};
// 初始化播放器
const ap = new APlayer({
    container: document.getElementById('aplayer'),
    fixed: true,
    preload: 'metadata'
});
const nothingHere = () => {
    let n = [
        "哎呀，這裡沒有任何東西欸",
        "合理懷疑資料在送過來的途中被吃掉ㄌ",
        "哈囉！這裡是太虛之境，啥都沒有",
        "欲從海上覓仙跡，令人可望不可攀。",
        "資料被一隻大嘴怪吃掉了！",
        "喔不，你的法力不足，沒拿到任何資料",
        "～佛系讀資料～",
        "喔嗚...別哭啦，只是沒資料而已啦",
        "什麼～都～沒有",
        "找不到任何資料，請不要太難過",
        "❓❓🌚❓❓",
        "尼是不是故意來找沒有資料的",
        "🙈沒資料",
        "找不到 那些美好",
        "若您嘗試多次，請再次確認模組是否開啟",
        "沒有找到資料"
    ]
    let randomNotFound = localStorage.pokaLang == "zh-TW" ? n[Math.floor(Math.random() * n.length)] : lang("nothingFound")
    return `
    <div class="mdui-typo mdui-text-center">
        <div class="mdui-typo-display-2">
            <i class="mdui-icon eva eva-alert-triangle-outline" style="transform: scale(3.2);"></i>
        </div>
        <div class="mdui-typo-display-1">${randomNotFound}</div>
        <button class="mdui-btn mdui-ripple mdui-btn-raised" onclick="history.go(-1)">${lang("back")}</button>
        <hr/>
    </div>`
}

// 初始化歌詞解析
const lrc = new Lyrics(`[00:00.000]`);

// 路由
const router = new Navigo('/');
router
    .on({
        'search/:keyword': params => showSearch(params.keyword),
        'search': showSearch,
        'album/:source/:id': params => showAlbumSongs(params.source, params.id),
        'album': showAlbum,
        'folder/:source/:dir': params => showFolder(params.source, params.dir),
        'folder': showFolder,
        'artist/:source/:artist': params => showArtist(params.source, params.artist),
        'artist': showArtist,
        'composer/:source/:composer': params => showComposer(params.source, params.composer),
        'composer': showComposer,
        'playlist/Poka/random': showRandom,
        'playlist/:source/:playlistID': params => showPlaylistSongs(params.source, params.playlistID),
        'playlistFolder/:playlistID': params => showPlaylistFolder(params.playlistID),
        'playlist': showPlaylist,
        'now*': showNow,
        'lrc': showLrc,
        'settings': showSettings,
        'settings/network': showSettingsNetwork,
        'settings/customize': showSettingsCustomize,
        'settings/system': showSettingsSystem,
        'settings/about': showSettingsAbout,
        'settings/lang': showSettingsLang,
        '*': showHome
    })
    .resolve()
router
    .hooks({
        before: (done, params) => {
            $('#content').removeAttr('data-item')
            $("#player").removeClass('hide')
            done()
        },
        after: params => {
            $('html, body').scrollTop(0);
            $('#drawer a')
                .removeClass('active')
            $(`#drawer a[href="${$('#content').attr('data-page')}"]`)
                .addClass('active')
        }
    })

loadProgressBar()
// 初始化網頁
$(() => {
    // 在進入網頁時嘗試登入
    tryRelogin()

    $(`#drawer a[href="${$("#content").attr("data-page")}"]`).addClass("active");
    $(`#drawer a`).click(function () {
        if ($(window).width() < 1024) {
            new mdui.Drawer("#drawer").close();
        }
    });
    $("#player>*:not(.right)").click(() => router.navigate("now"));
    // 初始化 MediaSession
    updateMediaSession()
    // 綁定鍵盤控制
    keyboardJS.bind('space', e => {
        if (e.target.tagName.toUpperCase() == 'INPUT') return;
        ap.toggle()
    });
    keyboardJS.bind('w', e => {
        if (e.target.tagName.toUpperCase() == 'INPUT') return;
        ap.volume(ap.volume() + 0.01, true)
        let text = `音量：${Math.floor(ap.volume()*100)}%`
        if ($(".mdui-snackbar").length > 0)
            $(".mdui-snackbar .mdui-snackbar-text").text(text)
        else
            mdui.snackbar({
                message: text,
                timeout: 2000,
                position: getSnackbarPosition()
            });
    });
    keyboardJS.bind('s', e => {
        if (e.target.tagName.toUpperCase() == 'INPUT') return;
        ap.volume(ap.volume() - 0.01, true)
        let text = `音量：${Math.floor(ap.volume()*100)}%`
        if ($(".mdui-snackbar").length > 0)
            $(".mdui-snackbar .mdui-snackbar-text").text(text)
        else
            mdui.snackbar({
                message: text,
                timeout: 2000,
                position: getSnackbarPosition()
            });
    });
    keyboardJS.bind('a', e => {
        if (e.target.tagName.toUpperCase() == 'INPUT') return;
        ap.skipBack()
    });
    keyboardJS.bind('d', e => {
        if (e.target.tagName.toUpperCase() == 'INPUT') return;
        ap.skipForward()
    });
    keyboardJS.bind('h', function (e) {
        if (e.target.tagName.toUpperCase() == 'INPUT') return;
        router.navigate('home')
    });
    keyboardJS.bind('n', function (e) {
        if (e.target.tagName.toUpperCase() == 'INPUT') return;
        router.navigate('now')
    });
    keyboardJS.bind('r', function (e) {
        if (e.target.tagName.toUpperCase() == 'INPUT') return;
        let icon = changePlayMode()
        let text = icon == "shuffle" ? `<i class="mdui-icon material-icons">shuffle</i>已切換至隨機播放` :
            icon == "repeat" ?
            `<i class="mdui-icon material-icons">repeat</i>已切換至順序播放` :
            `<i class="mdui-icon material-icons">repeat_one</i>已切換至單曲循環`

        $("[data-player]>.info>.ctrl>.random i").text(icon)

        if ($(".mdui-snackbar").length > 0)
            $(".mdui-snackbar .mdui-snackbar-text").html(text)
        else
            mdui.snackbar({
                message: text,
                timeout: 400,
                position: getSnackbarPosition()
            });
        $(".mdui-snackbar .mdui-snackbar-text i").attr('style', 'font-size: 14px;width: 25.2px;transform: scale(1.8)')
    });
});

// 宣告全域變數
songList = [];
const socket = io();
socket.on("hello", () => {
    socket.emit('login')
});
ap.on("listswitch", async () => {
    lrc.load(`[00:00.000]${lang("loading")}`)
    $("div[data-lrc=\"inner\"]").html(`<p class="loading">${lang("loading")}</p>`)
})
ap.on("play", async () => {
    //沒歌就隨機播放
    if (ap.list.audios.length == 0) playRandom().then(() => {
        router.navigate('now');
        showNow()
    })
    let nowPlaying = ap.list.audios[ap.list.index],
        name, artist
    if (nowPlaying) {
        updateBottomPlayer()
        name = nowPlaying.name
        artist = nowPlaying.artist
        $(document).attr("title", `${name} - ${artist}`);
    }
    updateMediaSession()
})
ap.on("loadedmetadata", async () => {
    let nowPlaying = ap.list.audios[ap.list.index],
        name = nowPlaying.name,
        id = nowPlaying.id,
        artist = nowPlaying.artist,
        source = nowPlaying.source
    $(document).attr("title", `${name} - ${artist}`);

    let lrcResult = await getLrc(artist, name, id, source)
    setLrc(lrcResult)
    updateBottomPlayer()
})

function setLrc(lrcResult) {
    if (lrcResult)
        lrc.load(lrcResult)
    else
        lrc.load(`[00:00.000]無歌詞`)
    if ($("div[data-lrc]").length > 0) {
        let html = ``
        for (let {
                text
            } of lrc.getLyrics()) {
            html += `<p>${text}</p>`
        }
        $("div[data-lrc=\"inner\"]").html(html)
    }
}
ap.on("timeupdate", () => {
    updateMediaSession()
    updateBottomPlayer()
})
ap.on("pause", () => {
    $('#player button.play[onclick="ap.toggle()"] i').text("play_arrow")
    $(document).attr("title", `PokaPlayer`);
})

function updateBottomPlayer() {
    let nowPlaying = ap.list.audios[ap.list.index]
    if (nowPlaying) {
        let {
            name,
            artist,
            cover
        } = nowPlaying
        // 暫停鈕
        $('#player button.play[onclick="ap.toggle()"] i').text("pause")
        let currentTime = ap.audio.currentTime ? secondToTime(ap.audio.currentTime) : "0:00",
            duration = ap.audio.currentTime ? secondToTime(ap.audio.duration) : "0:00",
            timer = currentTime + '/' + duration,
            audioBuffered = ap.audio.currentTime > 1 ? ap.audio.buffered.end(ap.audio.buffered.length - 1) / ap.audio.duration * 100 : 0,
            cent = ap.audio.currentTime / ap.audio.duration * 100,
            timelineColor = `var(--poka-theme-primary-color)`,
            timelineBufferedColor = $('body').hasClass("theme-dark") ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'
        //更新時間
        $('#player .right .timer').text(timer)
        // 更新進度條
        let playProcess = `background-image:
        linear-gradient(to right,
            ${timelineColor} 0%,
            ${timelineColor} ${cent}%,
            ${timelineBufferedColor} ${cent}%,
            ${timelineBufferedColor} ${audioBuffered > 0 ? audioBuffered : cent}%,
            transparent ${audioBuffered > 0 ? audioBuffered : cent}%,
            transparent 100%
        );`
        let img = (localStorage["imgRes"] != "true" && cover) ? cover : getBackground()

        $('#player .song-info .name').text(name)
        $('#player .song-info .artist').text(artist)
        $('#player img').attr('src', img)
        $('#player').attr('style', playProcess)
    }
}

function updateMediaSession() {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: $('#player .song-info .name').text(),
            artist: $('#player .song-info .artist').text(),
            artwork: [{
                src: $('#player img').attr('src'),
                type: 'image/png'
            }]
        });
        navigator.mediaSession.setActionHandler('play', () => {
            ap.toggle()
        });
        navigator.mediaSession.setActionHandler('pause', () => {
            ap.pause()
        });
        navigator.mediaSession.setActionHandler('seekbackward', () => {
            ap.seek(ap.audio.currentTime - 10)
        });
        navigator.mediaSession.setActionHandler('seekforward', () => {
            ap.seek(ap.audio.currentTime + 10)
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            ap.skipBack()
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            ap.skipForward()
        });
    }
}


var loginFailureCount = 0

function tryRelogin() {
    //如果有存到密碼&&嘗試次數少於 10 次就嘗試登入
    if (localStorage["userPASS"] && loginFailureCount <= 10) {
        console.time('Login');
        $.post("/login/", {
            userPASS: localStorage["userPASS"]
        }, data => {
            console.timeEnd('Login'); // 測時間
            if (data == 'success') {
                loginFailureCount = 0
            } else {
                console.error("[Login] Login failed")
                mdui.snackbar({
                    message: lang("sessionExpired"),
                    timeout: 10 * 1000,
                    buttonText: lang("login"),
                    onButtonClick: () => document.location.href = "/login/",
                    position: getSnackbarPosition()
                });
            }
        });
    } else if (loginFailureCount > 10) {
        console.log("[Login] Login failed more than ten times, abandoned")
        mdui.snackbar({
            message: lang("requestError"),
            timeout: 1000,
            position: getSnackbarPosition()
        });
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

// 播放模式
var playMode;

function changePlayMode(get) {
    let loop = Number(playMode || 2)
    let icon;
    if (!playMode && get) {
        return `repeat`
    }
    if (get) {
        let modes = [
            `repeat_one`,
            `repeat`,
            `shuffle`,
        ]
        return modes[loop - 1]
    }
    switch (loop) {
        case 1:
            // 循環播放整個清單
            for (i = 0; i < 3; i++)
                if (ap.options.loop != "all") $("#aplayer .aplayer-icon.aplayer-icon-loop").click();
            for (i = 0; i < 3; i++)
                if (ap.options.loop != "all")
                    $('#aplayer .aplayer-icon.aplayer-icon-loop').click()
            for (i = 0; i < 3; i++)
                if (ap.options.order != "list")
                    $('#aplayer .aplayer-icon.aplayer-icon-order').click()
            icon = `repeat`
            playMode = 2 //下一次換到 2
            break;
        case 2:
            // 隨機
            for (i = 0; i < 3; i++)
                if (ap.options.loop != "all")
                    $("#aplayer .aplayer-icon.aplayer-icon-loop").click();
            for (i = 0; i < 3; i++)
                if (ap.options.loop != "all")
                    $('#aplayer .aplayer-icon.aplayer-icon-loop').click()
            for (i = 0; i < 3; i++)
                if (ap.options.order != "random")
                    $('#aplayer .aplayer-icon.aplayer-icon-order').click()
            icon = `shuffle`
            playMode = 3 //下一次換到 3
            break;
        case 3:
            // 循環播放該曲目
            $('#aplayer .aplayer-icon.aplayer-icon-order').click()
            for (i = 0; i < 3; i++)
                if (ap.options.loop != "one") {
                    if (ap.list.audios.length == 1 && ap.options.loop == "none")
                        $('#aplayer .aplayer-icon.aplayer-icon-loop').click()
                    else if (ap.list.audios.length > 1)
                        $('#aplayer .aplayer-icon.aplayer-icon-loop').click()
                }
            icon = `repeat_one`
            playMode = 1 //下一次換到 1
            break;
    }
    return icon
}

function pokaHeader(title, subtitle = '', image = false, hide = false, blur = true) {
    let style = image && localStorage["imgRes"] == "false" ?
        `background-image: url('${image.replace(/'/g, "\\'")}');` :
        `background-image: url('${getBackground().replace(/'/g, "\\'")}');`

    if (hide) $("#header-wrapper").addClass('hide')
    else $("#header-wrapper").removeClass('hide')

    $("#header-wrapper .title .title").text(title)
    $("#header-wrapper .title .subtitle").text(subtitle)

    //新增過度動畫
    if ($("#header-wrapper .bg").hasClass('blur'))
        $("#header-wrapper .bg2").addClass('blur')
    else
        $("#header-wrapper .bg2").removeClass('blur')

    if (image && blur && localStorage["imgRes"] == "false")
        $("#header-wrapper .bg").addClass('blur')
    else
        $("#header-wrapper .bg").removeClass('blur')

    if ($("#header-wrapper .bg").attr('style') != style) {
        $("#header-wrapper .bg2").attr('style', $("#header-wrapper .bg").attr('style'))
        $("#header-wrapper .bg").attr('style', style)
        $("#header-wrapper .bg,#header-wrapper .bg2").addClass('changeing')
        setTimeout(function () {
            $("#header-wrapper .bg,#header-wrapper .bg2").removeClass('changeing')
        }, 400)
    }
}
//- 綁定 filter
function bindFilter() {
    $('[data-filter]').click(function () {
        let source = $(this).attr("data-filter")
        $(this).hasClass("active") ? $(this).removeClass("active") : $(this).addClass("active")
        $(this).hasClass("active") ? $(`[data-source="${source}"]`).css('display', '') : $(`[data-source="${source}"]`).css('display', 'none')
    })
}
// 首頁
async function showHome() {
    $('#content').attr('data-page', 'home')
    // 展示讀取中
    pokaHeader(lang("header_welcome"), lang("header_version").render({
        version: localStorage["PokaPlayerVersion"] || ''
    }))

    let placehoader = (localStorage["poka-filter"] == "true" ? template.getPlacehoader('filter') : "") +
        template.getPlacehoader("header") +
        template.getPlacehoader()
    $("#content").html(placehoader)


    let result = await request(`/pokaapi/home`)

    if ($("#content").attr('data-page') == 'home') {
        let parseResult = template.parseHome(result)
        $("#content").html(parseResult != '' ? parseResult : nothingHere)
        //初始化
        mdui.mutation()
        router.updatePageLinks()
        //-篩選器
        bindFilter()
    }
}
//- 搜尋
async function showSearch(keyword) {
    pokaHeader('', '', false, true)
    $('#content').attr('data-page', 'search')
    let html = `
    <div class="mdui-row">
        <div class="mdui-col-md-6 mdui-col-offset-md-3">
            <div class="search-box">
                <input class="search-input" 
                       id="search" 
                       type="text" 
                       placeholder="${lang("search")}" 
                       value="${keyword|| ''}" 
                       autocomplete="off"
                       required/>
                <button class="search-button mdui-text-color-theme">
                    <i class="mdui-icon eva eva-search-outline"></i>
                </button>
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
    noResultTexts = localStorage.pokaLang == "zh-TW" ? noResultTexts[Math.floor(Math.random() * noResultTexts.length)] : lang("nothingFound")
    let noResult = `<div class="mdui-valign" style="height:150px"><p class="mdui-center">${noResultTexts}</p></div>`
    if (keyword) {
        // 先輸出搜尋中
        let placehoader = (localStorage["poka-filter"] == "true" ? template.getPlacehoader('filter') : "") +
            template.getPlacehoader('tab') +
            template.getPlacehoader()
        $("#content").html(html + placehoader)

        let result = await request(`/pokaapi/search/?keyword=${keyword}`);
        let searchResults = template.parseSearch(result);

        //無搜尋結果
        if (!searchResults) searchResults = noResult

        if ($("#content").attr('data-page') == 'search') {
            $("#content").html(html + searchResults)
            mdui.mutation()
            //-篩選器
            bindFilter()
        }
    } else
        $("#content").html(html)

    //初始化
    mdui.mutation()
    router.updatePageLinks()
    $("input").focus(function () {
        $("input").parent(".search-box").addClass('focus')
    });
    $("input").blur(function () {
        $("input").parent(".search-box").removeClass('focus')
    });
    $('.search-button').click(() => {
        router.navigate("search/" + encodeURIComponent($("#search").val()));
    })
    $("#search").change(async function () {
        router.navigate("search/" + encodeURIComponent($(this).val()));
    });
}
//- 列出專輯
async function showAlbum() {
    // 展示讀取中
    pokaHeader(lang("album"))
    $('#content').attr('data-page', 'album')
    $("#content").html(template.getPlacehoader())
    let result = await request('/pokaapi/albums')
    let html = template.parseAlbums(result.albums)
    if ($("#content").attr('data-page') == 'album') {
        $("#content").html(result.albums.length > 0 ? html : nothingHere())
        mdui.mutation()
        router.updatePageLinks()
    }
}
//- 展示專輯歌曲
async function showAlbumSongs(albumSource, albumID) {
    //如果從首頁按進去頁籤沒切換
    $("#content").attr('data-page', `album`)
    $("#content").attr('data-item', `album${albumID}`)

    // 展示讀取中
    let cover = '';
    if (albumSource == 'DSM') cover = `/pokaapi/cover/?moduleName=${encodeURIComponent(albumSource)}&data=${encodeURIComponent(JSON.stringify({ type: "album", info: JSON.parse(albumID) }))}`
    let albumInfo = template.infoHeader(cover, '', '')
    pokaHeader('', '', cover)
    $("#content").html(template.getSpinner())
    mdui.mutation()

    let name, artist, result;
    if (albumSource == 'DSM') {
        let albumData = JSON.parse(albumID)
        name = albumData.album_name
        artist = albumData.album_artist_name
        result = await request(`/pokaapi/albumSongs/?moduleName=${encodeURIComponent(albumSource)}&data=${encodeURIComponent(albumID)}`)
    } else {
        let albumData = (await request(`/pokaapi/album?moduleName=${encodeURIComponent(albumSource)}&id=${encodeURIComponent(albumID)}`))
        name = albumData.name
        artist = albumData.artist
        cover = albumData.cover
        result = {
            songs: albumData.songs
        }
    }


    // 釘選（？
    let isAlbumPinned = await isPinned(albumSource, 'album', albumID, name),
        actions = '';
    if (isAlbumPinned != 'disabled')
        if (isAlbumPinned)
            actions += `
                <button class="mdui-btn mdui-btn-icon mdui-ripple" 
                        title="${lang("unpin_album")}" data-pinned="true">
                    <i class="mdui-icon material-icons">turned_in</i>
                </button>`
    else
        actions += `
            <button class="mdui-btn mdui-btn-icon mdui-ripple" 
                    title="${lang("pin_album")}" data-pinned="false">
                <i class="mdui-icon material-icons">turned_in_not</i>
            </button>`
    actions += `
            <button class="mdui-btn mdui-btn-icon mdui-ripple" 
                    onclick="addSong(songList)" 
                    title="${lang("add2nowPlaying")}">
                <i class="mdui-icon material-icons">playlist_add</i>
            </button>`

    //抓資料
    html = template.parseSongs(result.songs)
    albumInfo = template.infoHeader(cover, name, artist)
    if ($("#content").attr('data-page') == `album` && $("#content").attr('data-item') == `album${albumID}`) {
        $("#content").html(result.songs.length > 0 ? albumInfo + html : nothingHere()).animateCss('fadeIn faster')
        pokaHeader('', '', cover)
        $("#content .info-header .time").html(lang("album_total").render({
            songs: result.songs.length
        }))
        $("#content .info-header .actions").html(actions)

        $("[data-pinned]").click(async function () {
            let pinStatus = $(this).attr('data-pinned')
            if (pinStatus == "true") {
                if (await unPin(albumSource, 'album', albumID, name) == true) {
                    $(this).attr("data-pinned", false)
                    $(this).attr("title", lang("pin_album"))
                    $(this).children("i").text('turned_in_not')
                }
            } else {
                if (await addPin(albumSource, 'album', albumID, name) == true) {
                    $(this).attr("data-pinned", true)
                    $(this).attr("title", lang("unpin_album"))
                    $(this).children("i").text('turned_in')
                }
            }
        })
    }
}
// 資料夾
async function showFolder(moduleName, folderId = false) {
    $("#content").attr('data-page', 'folder')
    $("#content").attr('data-item', 'folder' + folderId)
    // 展示讀取中
    pokaHeader(lang("folder"))
    $("#content").html(template.getPlacehoader('list'))

    let url;
    if (folderId) {
        url = `/pokaapi/folderFiles/?moduleName=${encodeURIComponent(moduleName)}&id=${encodeURIComponent(folderId)}`
    } else {
        url = `/pokaapi/folders`
    }
    let result = await request(url)
    let folderHTML = template.parseFolder(result.folders, folderId) + template.parseSongs(result.songs)
    folderHTML = result.folders.length > 0 || result.songs.length > 0 ? folderHTML : nothingHere()
    if ($("#content").attr('data-page') == 'folder' && $("#content").attr('data-item') == 'folder' + folderId) {
        $("#content").html(folderHTML)
        router.updatePageLinks()
    }
}
async function showArtist(moduleName, artist = false) {
    $("#content").attr('data-item', artist && moduleName ? `artist${artist}` : `artist`)

    let data = (moduleName != 'DSM' && artist) ? await request(`/pokaapi/artist/?moduleName=${encodeURIComponent(moduleName)}&id=${encodeURIComponent(artist)}`) : undefined;
    // 如果不是 DSM 的話去向模組取得該演出者的封面
    let cover = artist ? (moduleName == 'DSM' ?
        `/pokaapi/cover/?moduleName=${encodeURIComponent(moduleName)}&data=${encodeURIComponent(JSON.stringify({ "type": "artist", "info": artist == '未知' ? '' : artist }))}` :
        data.cover) : false
    if ($("#content").attr('data-item') == artist && moduleName ? `artist${artist}` : `artist`)
        pokaHeader(artist ? (moduleName == 'DSM' ? artist : data.name) : lang("artist"), artist ? moduleShowName[moduleName] : "", cover)
    $("#content").attr('data-page', 'artist')
    $("#content").html(template.getPlacehoader())
    if (artist && moduleName) {
        $("#content").attr('data-item', `artist${artist}`)
        let result = await request(`/pokaapi/artistAlbums/?moduleName=${encodeURIComponent(moduleName)}&id=${artist == '未知' ? '' : encodeURIComponent(artist)}`),
            isArtistPinned = await isPinned(moduleName, 'artist', artist, artist)
        let pinButton = ``
        if (isArtistPinned && isArtistPinned != 'disabled')
            pinButton = `<button class="mdui-fab mdui-color-theme mdui-fab-fixed mdui-ripple" title="${lang("unpin_artist")}" data-pinned="true"><i class="mdui-icon material-icons">turned_in</i></button>`
        else if (isArtistPinned != 'disabled')
            pinButton = `<button class="mdui-fab mdui-color-theme mdui-fab-fixed mdui-ripple" title="${lang("pin_artist")}" data-pinned="false"><i class="mdui-icon material-icons">turned_in_not</i></button>`
        let albumHTML = template.parseAlbums(result.albums)
        if ($("#content").attr('data-item') == `artist${artist}`) {
            $("#content").html(result.albums.length > 0 ? albumHTML + pinButton : nothingHere())
            $("[data-pinned]").click(async function () {
                let pinStatus = $(this).attr('data-pinned')
                if (pinStatus == "true") {
                    if (await unPin(moduleName, 'artist', artist, moduleName == 'DSM' ? artist : data.name) == true) {
                        $(this).attr("data-pinned", false)
                        $(this).attr("title", lang("pin_artist"))
                        $(this).children("i").text('turned_in_not')
                    }
                } else {
                    if (await addPin(moduleName, 'artist', artist, moduleName == 'DSM' ? artist : data.name) == true) {
                        $(this).attr("data-pinned", true)
                        $(this).attr("title", lang("unpin_artist"))
                        $(this).children("i").text('turned_in')
                    }
                }
            })
        }
    } else {
        let result = await request(`/pokaapi/artists`),
            artistsHTML = template.parseArtists(result.artists)
        if ($("#content").attr('data-page') == 'artist')
            $("#content").html(result.artists.length > 0 ? artistsHTML : nothingHere())
    }
    if ($("#content").attr('data-page') == 'artist')
        router.updatePageLinks()

}
async function showComposer(moduleName, composer) {
    let cover = `/pokaapi/cover/?moduleName=${encodeURIComponent(moduleName)}&data=${encodeURIComponent(JSON.stringify({ "type": "composer", "info": composer == '未知' ? '' : composer }))}`
    $("#content").attr('data-page', 'composer')
    $("#content").html(template.getPlacehoader())
    if (composer && moduleName) {
        pokaHeader(composer, lang("loading"), cover)
        $("#content").attr('data-item', `composer${composer}`)
        let result = await request(`/pokaapi/composerAlbums/?moduleName=${encodeURIComponent(moduleName)}&id=${composer == '未知' ? '' : encodeURIComponent(composer)}`),
            isComposerPinned = await isPinned(moduleName, 'composer', composer, composer)
        if ($("#content").attr('data-item') == `composer${composer}`)
            pokaHeader(composer, moduleShowName[moduleName], cover)
        let pinButton = ``
        if (isComposerPinned && isComposerPinned != 'disabled')
            pinButton = `<button class="mdui-fab mdui-color-theme mdui-fab-fixed mdui-ripple" title="${lang("unpin_composer")}" data-pinned="true"><i class="mdui-icon material-icons">turned_in</i></button>`
        else if (isComposerPinned != 'disabled')
            pinButton = `<button class="mdui-fab mdui-color-theme mdui-fab-fixed mdui-ripple" title="${lang("pin_composer")}" data-pinned="false"><i class="mdui-icon material-icons">turned_in_not</i></button>`
        let albumHTML = template.parseAlbums(result.albums)
        if ($("#content").attr('data-item') == `composer${composer}`) {
            $("#content").html(result.albums.length > 0 ? albumHTML + pinButton : nothingHere())
            $("[data-pinned]").click(async function () {
                let pinStatus = $(this).attr('data-pinned')
                if (pinStatus == "true") {
                    if (await unPin(moduleName, 'composer', composer, composer) == true) {
                        $(this).attr("data-pinned", false)
                        $(this).attr("title", lang("pin_composer"))
                        $(this).children("i").text('turned_in_not')
                    }
                } else {
                    if (await addPin(moduleName, 'composer', composer, composer) == true) {
                        $(this).attr("data-pinned", true)
                        $(this).attr("title", lang("unpin_composer"))
                        $(this).children("i").text('turned_in')
                    }
                }
            })
        }
    } else {
        pokaHeader(lang("composer"))
        //請求資料囉
        let result = await request(`/pokaapi/composers`),
            composersHTML = template.parseComposers(result.composers)
        if ($("#content").attr('data-page') == 'composer')
            $("#content").html(result.composers.length > 0 ? composersHTML : nothingHere())
    }
    if ($("#content").attr('data-page') == 'composer')
        router.updatePageLinks()
}
//- 播放清單
async function showPlaylist() {
    // 展示讀取中
    pokaHeader(lang("playlist"))

    let placehoader = (localStorage["poka-filter"] == "true" ? template.getPlacehoader('filter') : "") +
        template.getPlacehoader()
    $("#content").html(placehoader)
    $('#content').attr('data-page', 'playlist')
    let result = await request(`/pokaapi/playlists`)
    // 插入隨機播放清單
    result.playlists.unshift({
        id: "random",
        name: lang("playlist_random"),
        source: "Poka"
    })
    if ($("#content").attr('data-page') == 'playlist') {
        $("#content").html(result.playlists.length > 0 ? template.parsePlaylists(result.playlists) : nothingHere())
        router.updatePageLinks()
        //-篩選器
        bindFilter()
    }
}
//- 播放清單資料夾
async function showPlaylistFolder(playlistId) {
    $('#content').attr('data-page', 'playlist')
    $('#content').attr('data-item', `playlist${playlistId}`)
    mdui.mutation()
    let data = JSON.parse(sessionStorage.temporalPlaylist)

    if (!data[playlistId]) {
        pokaHeader('', '')
        $("#content").html(nothingHere())
    } else {
        let playlist = data[playlistId]
        let playlistName = playlist.name
        let playlists = playlist.playlists
        pokaHeader(playlistName, moduleShowName[playlist.source])
        $("#content").html(template.parsePlaylists(playlists))
    }
    router.updatePageLinks()

}
//- 播放清單歌曲
async function showPlaylistSongs(moduleName, playlistId) {
    //修正 Electron 會出錯
    if (moduleName == "Poka" && playlistId == "random") return showRandom()
    //如果從首頁按進去
    $("#content").attr('data-page', `playlist`)
    $("#content").attr('data-item', `playlist${playlistId}`)

    // 展示讀取中
    pokaHeader(lang("loading"), lang("playlist"))
    $("#content").html(template.getSpinner())
    mdui.mutation()

    //抓資料
    let result = await request(`/pokaapi/playlistSongs/?moduleName=${encodeURIComponent(moduleName)}&id=${encodeURIComponent(playlistId)}`)
    if (result == null && $("#content").attr('data-item') == `playlist${playlistId}`) {
        pokaHeader('', '')
        $("#content").html(nothingHere())
        return
    } else if (result == null) return
    let name = result.playlists[0].name
    let songs = template.parseSongs(result.songs)
    let isPlaylistPinned = await isPinned(moduleName, 'playlist', playlistId, result.playlists[0].name)
    let pinButton = ``
    if (isPlaylistPinned && isPlaylistPinned != 'disabled')
        pinButton = `<button class="mdui-fab mdui-fab-mini mdui-ripple mdui-color-theme" title="${lang("unpin_playlist")}" data-pinned="true"><i class="mdui-icon material-icons">turned_in</i></button>`
    else if (isPlaylistPinned != 'disabled')
        pinButton = `<button class="mdui-fab mdui-fab-mini mdui-ripple mdui-color-theme" title="${lang("pin_playlist")}" data-pinned="false"><i class="mdui-icon material-icons">turned_in_not</i></button>`
    let fab = `
    <div class="mdui-fab-wrapper" mdui-fab="{trigger: 'hover'}">
      <button class="mdui-fab mdui-ripple mdui-color-theme">
        <!-- 預設 icon -->
        <i class="mdui-icon material-icons">arrow_drop_up</i>
        <!-- 選單出現時的 icon -->
        <i class="mdui-icon mdui-fab-opened material-icons">arrow_drop_down</i>
      </button>
      <div class="mdui-fab-dial">
        ${pinButton}
        <button class="mdui-fab mdui-fab-mini mdui-ripple mdui-color-theme" 
                title="${lang("add2nowPlaying")}" 
                onclick="addSong(songList)">
            <i class="mdui-icon material-icons">playlist_add</i>
        </button>
      </div>
    </div>
    `

    if ($("#content").attr('data-item') == `playlist${playlistId}`) {
        pokaHeader(name, moduleShowName[result.playlists[0].source], result.playlists[0].image || false)
        $("#content").html(result.songs.length > 0 ? songs + fab : nothingHere())
        $("[data-pinned]").click(async function () {
            let pinStatus = $(this).attr('data-pinned')
            if (pinStatus == "true") {
                if (await unPin(moduleName, 'playlist', playlistId, result.playlists[0].name) == true) {
                    $(this).attr("data-pinned", false)
                    $(this).attr("title", lang("pin_playlist"))
                    $(this).children("i").text('turned_in_not')
                }
            } else {
                if (await addPin(moduleName, 'playlist', playlistId, result.playlists[0].name) == true) {
                    $(this).attr("data-pinned", true)
                    $(this).attr("title", lang("unpin_playlist"))
                    $(this).children("i").text('turned_in')
                }
            }
        })

    }
}
//- 隨機播放
async function showRandom() {
    // 展示讀取中
    pokaHeader(lang("playlist_random"), lang("playlist"))
    $("#content").html(template.getSpinner())
    $('#content').attr('data-page', 'playlist')
    $("#content").attr('data-item', `playlistrandom`)
    mdui.mutation()
    let result = await request(`/pokaapi/randomSongs`)
    let fab = `<button class="mdui-fab mdui-color-theme mdui-fab-fixed mdui-ripple" 
                       title="${lang("add2nowPlaying")}" 
                       onclick="addSong(songList)">
                       <i class="mdui-icon material-icons">playlist_add</i>
                </button>`
    if ($("#content").attr('data-page') == 'playlist' && $("#content").attr('data-item') == `playlistrandom`)
        $("#content").html(result.songs.length > 0 ? template.parseSongs(result.songs) + fab : nothingHere())
}
async function playRandom() {
    router.navigate('now')
    let result = await request(`/pokaapi/randomSongs`)
    playSongs(result.songs, false, false)
}
//- 現正播放
async function showNow() {
    pokaHeader('', '', false, true)
    $('#content').attr('data-page', 'now')
    let html = `<ul class="mdui-list songs" id="/now/songlist">`
    songList = ap.list.audios
    for (i = 0; i < ap.list.audios.length; i++) {
        let focus = ap.list.index == i ? 'mdui-color-theme' : '',
            song = ap.list.audios[i],
            title = song.name,
            artist = song.artist,
            album = song.album,
            img = localStorage["imgRes"] == "true" ? '' : `<div class="mdui-list-item-avatar"><img src="${ap.list.audios[i].cover || getBackground()}"/></div>`
        html += `<li class="mdui-list-item mdui-ripple song ${focus}" >
            ${img}
            <div class="mdui-list-item-content songinfo" data-now-play-id="${i}">
                <div class="mdui-list-item-title mdui-list-item-one-line">${title}</div>
                <div class="mdui-list-item-text mdui-list-item-one-line">${artist}</div>
            </div>
            <button class="mdui-btn mdui-btn-icon mdui-ripple close" data-now-play-id="${i}">
                <i class="mdui-icon material-icons">close</i>
            </button>
            <button class="mdui-btn mdui-btn-icon mdui-ripple" onclick="songAction(\`${song.id}\`, \`${song.source}\`)">
                <i class="mdui-icon material-icons">more_horiz</i>
            </button>
        </li>`
    }
    html += `</ul>`


    let nowPlaying = ap.list.audios[ap.list.index],
        name = nowPlaying ? nowPlaying.name : "PokaPlayer",
        artist = nowPlaying ? (nowPlaying.artist || "N/A") : lang("nowplaying_clickPlayRandom"),
        album = nowPlaying ? `</br>${nowPlaying.album}` || "" : "</br>",
        img = (nowPlaying && localStorage["imgRes"] != "true" && nowPlaying.cover) ? nowPlaying.cover : getBackground(),
        currentTime = ap.audio.currentTime ? secondToTime(ap.audio.currentTime) : "0:00",
        duration = ap.audio.currentTime ? secondToTime(ap.audio.duration) : "0:00",
        timer = currentTime + '/' + duration,
        info = `
    <div data-player>
        <div class="mdui-card" style="background-image:url('${img.replace(/'/g, "\\'")}');">
        </div>
        <div class="info">
            <div class="title  mdui-text-truncate mdui-text-color-theme">${name}</div>
            <div class="artist mdui-text-truncate mdui-text-color-theme-text">${artist + album}</div>
            <div data-lrc>
                <div data-lrc="inner"></div>
            </div>
            <div class="ctrl">
                <button class="mdui-btn mdui-btn-icon mdui-ripple random"><i class="mdui-icon material-icons"></i></button>
                <button class="mdui-btn mdui-btn-icon mdui-ripple" onclick="ap.skipBack()"><i class="mdui-icon material-icons">skip_previous</i></button>
                <button class="mdui-btn mdui-btn-icon mdui-ripple mdui-color-theme play" onclick="ap.toggle()"><i class="mdui-icon material-icons">play_arrow</i></button>
                <button class="mdui-btn mdui-btn-icon mdui-ripple" onclick="ap.skipForward()"><i class="mdui-icon material-icons">skip_next</i></button> 
                <button class="mdui-btn mdui-btn-icon mdui-ripple lrc" onclick="router.navigate('lrc')"><i class="mdui-icon material-icons">subtitles</i></button>
                <a href="#songlist" class="mdui-btn mdui-btn-icon mdui-ripple playlist"><i class="mdui-icon material-icons">playlist_play</i></a>
            </div>
            <div class="player-bar">
                <label class="mdui-slider">
                    <input type="range" step="0.000001" min="0" max="100" value="${ap.audio.currentTime / ap.audio.duration * 100 || 0}"/>
                </label>
                <div class="timer mdui-typo-body-1-opacity mdui-text-right">${timer}</div>
            </div>
        </div>
    </div>`;
    // 輸出
    $("#content").html(`<div data-player-container>${info + html}<a class="mdui-overlay"></a></div>`);
    if (ap.list.audios.length == 0) $("[data-player-container]>.mdui-list.songs").addClass('nosongs')
    // 隱藏原本ㄉ播放器
    $("#player").addClass('hide');
    // random＆loop
    $("[data-player]>.info>.ctrl>.random")
        .html(function () {
            return `<i class="mdui-icon material-icons">${changePlayMode(true)}</i>`
        })
        .click(function () {
            $(this).html(`<i class="mdui-icon material-icons">${changePlayMode()}</i>`)
        })
    $("[data-player]>.info>.ctrl>.playlist").click(function () {
        window.location.hash = '#songlist'
        setTimeout(() => {
            $('.mdui-list.songs').addClass('show')
            $('.mdui-list.songs').scrollTop(72 * ap.list.index - 100)
        }, 50)

        function listenHash(e) {
            if (e.oldURL.match(/songlist$/)) {
                window.removeEventListener("hashchange", listenHash);
                if (!e.newURL.match('mdui-dialog')) {
                    window.location.hash = ''
                }
                $('.mdui-list.songs').removeClass('show')
            }
        }
        window.addEventListener("hashchange", listenHash);
    })
    $(`[data-player-container]>a.mdui-overlay`).click(function () {
        window.location.hash = ''
    })

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
            if (text == lang("loading"))
                html += `<p class="loading">${text}</p>`
            else
                html += `<p>${text}</p>`
        }
        $('div[data-lrc="inner"]').html(html)
        let nowLrc = lrc.select(ap.audio.currentTime)
        if (nowLrc > -1) {
            $('[data-player] div[data-lrc="inner"] p').eq(nowLrc).addClass('mdui-text-color-theme')
            let sh = $('div[data-lrc="inner"] p.mdui-text-color-theme')[0].offsetTop - $('[data-player] .info>div[data-lrc]').height() / 2 - $('div[data-lrc="inner"] p.mdui-text-color-theme')[0].clientHeight
            $('[data-player] .info>div[data-lrc]').scrollTop(sh);
        }
    }

    ap.on("pause", () => {
        $('[data-player] button.play[onclick="ap.toggle()"] i').text("play_arrow")
    })
    ap.on("play", async () => {
        //卷軸轉轉
        if ($(window).width() > 850 && $(window).height() > 560) {
            $('.mdui-list.songs')
                .clearQueue()
                .animate({
                    scrollTop: 72 * ap.list.index - 100
                }, 250);
        }
        //- list 切換 active
        $(".songs>li.song").removeClass('mdui-color-theme')
        $(".songs>li.song").eq(ap.list.index).addClass('mdui-color-theme');
        //- 播放器
        $('[data-player] button.play[onclick="ap.toggle()"] i').text("pause")
        let nowPlaying = ap.list.audios[ap.list.index]
        let name = nowPlaying ? nowPlaying.name : "PokaPlayer"
        let artist = nowPlaying ? (nowPlaying.artist || "N/A") : lang("nowplaying_clickPlayRandom")
        let album = nowPlaying ? `</br>${nowPlaying.album}` || "" : "</br>"
        let img = (nowPlaying && localStorage["imgRes"] != "true" && nowPlaying.cover) ? nowPlaying.cover : getBackground(); //一定會有圖片
        $('[data-player]>.mdui-card').attr('style', `background-image:url('${img.replace(/'/g, "\\'")}');`)
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
                if (text == lang("loading"))
                    html += `<p class="loading">${text}</p>`
                else
                    html += `<p>${text}</p>`
            }
            $('[data-lrc="inner"]').html(html)
        }
    })
    ap.on("timeupdate", () => {
        let currentTime = ap.audio.currentTime ? secondToTime(ap.audio.currentTime) : "0:00",
            duration = ap.audio.currentTime ? secondToTime(ap.audio.duration) : "0:00",
            audioBuffered = ap.audio.currentTime > 1 ? ap.audio.buffered.end(ap.audio.buffered.length - 1) / ap.audio.duration * 100 : 0,
            cent = ap.audio.currentTime / ap.audio.duration * 100
        $('[data-player]>.info>.player-bar>.timer').text(currentTime + '/' + duration);
        // 更新 timer
        $("[data-player]>.info>.player-bar input[type=range]").val(cent);
        mdui.updateSliders();
        $("[data-player]>.info>.player-bar input[type=range]+*+.mdui-slider-fill").before(`<div class="mdui-slider-fill" style="width:${audioBuffered}%;" data-audio-buffered></div>`);
        // 歌詞亮亮
        if ($(window).width() > 850 && $(window).height() > 750) {
            let nowLrc = lrc.select(ap.audio.currentTime)
            let before = $('[data-player] div[data-lrc="inner"] p.mdui-text-color-theme')[0]
            let after = $('[data-player] div[data-lrc="inner"] p').eq(nowLrc)[0]
            if (before != after && nowLrc > -1) {
                $('[data-player] div[data-lrc="inner"] p').removeClass('mdui-text-color-theme')
                $('[data-player] div[data-lrc="inner"] p').eq(nowLrc).addClass('mdui-text-color-theme')
                let sh = $('div[data-lrc="inner"] p.mdui-text-color-theme')[0].offsetTop - $('[data-player] .info>div[data-lrc]').height() / 2 - $('div[data-lrc="inner"] p.mdui-text-color-theme')[0].clientHeight
                $('[data-player] .info>div[data-lrc]')
                    .clearQueue()
                    .animate({
                        scrollTop: sh
                    }, 250);
            }
        }
    });
    $('[data-player] .info>div[data-lrc]').dblclick(function () {
        showLrcChoose()
    })
    $("[data-player]>.info>.player-bar input[type=range]").on("input", () => {
        let time = $("[data-player]>.info>.player-bar input[type=range]").val() / 100 * ap.audio.duration
        ap.seek(time);
    })
    $('[data-player]>.mdui-card').click(function () {
        router.navigate('lrc')
    })
    $(".songs [data-now-play-id].songinfo").click(function () {
        $(".songs>li.song").removeClass('mdui-color-theme')
        $(this).parent().eq(0).addClass('mdui-color-theme')
        let song = $(this).attr('data-now-play-id')
        ap.list.switch(song)
        ap.play()
    })
    $(".songs [data-now-play-id].close").click(function () {
        let song = $(this).attr('data-now-play-id')
        if (song == ap.list.index) ap.skipForward()
        $(this).parent().eq(0).addClass('del')
        setTimeout(() => {
            ap.list.remove(song)
            $(this).parent().eq(0).remove()

            //重新賦予 play-id
            let songinfo = $(".mdui-list.songs>.song>.songinfo")
            let del = $(".mdui-list.songs>.song>.close")
            for (i = 0; i < songinfo.length; i++) {
                $(songinfo[i]).attr('data-now-play-id', i)
                $(del[i]).attr('data-now-play-id', i)
            }
        }, 301)
    })
}
//- 歌詞
function showLrc() {
    pokaHeader('', '', false, true)
    $("#content").html(`<div data-lrc><div data-lrc="inner"></div></div>`)
    $('#content').attr('data-page', 'lrc')

    // 歌詞
    if (lrc.getLyrics()) {
        let html = ``
        for (i = 0; i < lrc.getLyrics().length; i++) {
            let text = lrc.getLyrics()[i].text
            if (text == lang("loading"))
                html += `<p class="loading">${text}</p>`
            else
                html += `<p>${text}</p>`
        }
        $("#content>div[data-lrc]>[data-lrc=\"inner\"]").html(html)
        let nowLrc = lrc.select(ap.audio.currentTime)
        if (nowLrc > -1) {
            $('#content>div[data-lrc]>div[data-lrc="inner"] p').eq(nowLrc).addClass('mdui-text-color-theme')
            let top = $('div[data-lrc="inner"] p.mdui-text-color-theme')[0].offsetTop - $('div[data-lrc]').height() / 2 - $('div[data-lrc="inner"] p.mdui-text-color-theme')[0].clientHeight * 2
            $('#content>div[data-lrc]').scrollTop(top);
        }
    }
    ap.on("timeupdate", () => {
        // 歌詞亮亮
        let nowLrc = lrc.select(ap.audio.currentTime)
        let before = $('#content>div[data-lrc]>div[data-lrc="inner"] p.mdui-text-color-theme')[0]
        let after = $('#content>div[data-lrc]>div[data-lrc="inner"] p').eq(nowLrc)[0]
        if (before != after && nowLrc > -1) {
            $('#content>div[data-lrc]>div[data-lrc="inner"] p').removeClass('mdui-text-color-theme')
            $('#content>div[data-lrc]>div[data-lrc="inner"] p').eq(nowLrc).addClass('mdui-text-color-theme')
            let top = $('div[data-lrc="inner"] p.mdui-text-color-theme')[0].offsetTop - $('div[data-lrc]').height() / 2 - $('div[data-lrc="inner"] p.mdui-text-color-theme')[0].clientHeight * 2
            $('#content>div[data-lrc]')
                .clearQueue()
                .animate({
                    scrollTop: top
                }, 250);
        }
    });
    $('#content>div[data-lrc]').dblclick(function () {
        showLrcChoose()
    })
}

//- 播放音樂
function playSongs(songs, song = false, clear = true) {
    if (clear) ap.list.clear()
    let playlist = []
    for (i = 0; i < songs.length; i++) {
        let nowsong = songs[i],
            src = nowsong.url + '&songRes=' + localStorage["musicRes"].toLowerCase(),
            name = nowsong.name,
            artist = nowsong.artist,
            album = nowsong.album,
            poster = nowsong.cover,
            source = nowsong.source
        playlist.push({
            url: src,
            cover: poster,
            name: name,
            artist: artist,
            album: album,
            id: nowsong.id,
            source: source
        })
        if (nowsong.id == song) {
            songtoplay = i
        }
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
    for (let {
            id,
            name,
            artist,
            album,
            cover: poster,
            source,
            url
        } of songlist) {
        if (id == songID || songID == 0) {
            let src = url + '&songRes=' + localStorage["musicRes"].toLowerCase()
            playlist.push({
                url: src,
                cover: poster,
                name: name,
                artist: artist,
                album: album,
                id: id,
                source: source
            })
        }
    }
    if (songID == 0) {
        mdui.snackbar({
            message: lang("addSong_total").render({
                total: songlist.length
            }),
            timeout: 400,
            position: getSnackbarPosition()
        });
    } else {
        mdui.snackbar({
            message: lang("addSong_name").render({
                name: playlist[0].name
            }),
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
        return "bottom"
    else
        return "left-bottom"
}

//- 顯示歌詞選擇窗窗
async function showLrcChoose() {
    let nowPlaying = ap.list.audios[ap.list.index],
        name = nowPlaying.name || '',
        artist = nowPlaying.artist || ''
    let list = (lyrics, keyword = '') => {
        r = `<div class="mdui-row">
                <div class="mdui-col-md-6 mdui-col-offset-md-3">
                    <div class="mdui-textfield">
                        <i class="mdui-icon material-icons">search</i>
                        <input class="mdui-textfield-input" 
                            id="searchLrc" 
                            type="text" 
                            placeholder="${lang("lrc_search")}" 
                            value="${keyword}" 
                            required/>
                        <div class="mdui-textfield-error">${lang("lrc_noKeyword")}</div>
                        <div class="mdui-textfield-helper">${lang("lrc_enter2search")}</div>
                    </div>
                </div>
            </div>
        <ul class="mdui-list">`;
        r += `<li class="mdui-list-item mdui-ripple" data-lrc-id="no">
                    <div class="mdui-list-item-content">
                        <div class="mdui-list-item-title mdui-list-item-one-line">${lang("lrc_notLoad")}</div>
                        <div class="mdui-list-item-text mdui-list-item-one-line">${lang("lrc_notLoad_description")}</div>
                    </div>
                </li>`
        if (lyrics && lyrics.length > 0) {
            for (i = 0; i < lyrics.length; i++) {
                let lyric = lyrics[i]
                r += `<li class="mdui-list-item mdui-ripple" data-lrc-id="${i}">
                            <div class="mdui-list-item-content">
                                <div class="mdui-list-item-title mdui-list-item-one-line">${lyric.name}</div>
                                <div class="mdui-list-item-text mdui-list-item-one-line">[${lyric.source}] ${lyric.artist}</div>
                            </div>
                        </li>`
            }
        }
        r += `</ul></div>`
        return r
    }
    mdui.dialog({
        title: lang("lrc"),
        content: `<div lrc-choose style="min-height:400px">${list()}</div>
            <div class="mdui-dialog-actions">
                <button class="mdui-btn mdui-ripple" mdui-dialog-confirm data-lrc-done>${lang("ok")}</button>
            </div>`,
        history: false
    });
    //初始化
    $("input#searchLrc").attr('value', `${name} ${artist}`)
    $("input#searchLrc + * + .mdui-textfield-helper").text(lang("loading"))
    mdui.mutation();

    async function search(keyword) {
        let searchResult = (await searchLrc(keyword, 30)).data.lyrics
        if ($("[lrc-choose]").length > 0) {
            $("[lrc-choose]").html(list(searchResult, keyword))
            mdui.mutation();
        }
        $("[data-lrc-id]").click(async function () {
            let lrcid = $(this).attr('data-lrc-id')
            var text = $(this).children().children('.mdui-list-item-text').text()
            $(this).children().children('.mdui-list-item-text').text(lang("loading"))
            if (lrcid != "no") {
                setLrc(searchResult[lrcid].lyric)
            } else {
                setLrc(false)
            }
            $(this).children().children('.mdui-list-item-text').text(text)
            $('[data-lrc-done]').click()
        })
        $("input#searchLrc").change(function () {
            $("input#searchLrc + * + .mdui-textfield-helper").text(lang("loading"))
            search($(this).val())
        })
    }
    search(`${name} ${artist}`)
}
//- 彈出歌曲操作窗窗
async function songAction(songID, source) {
    let song = () => {
        for (i = 0; i < songList.length; i++)
            if (songList[i].id == songID)
                return songList[i]
    }
    song = song()
    mdui.dialog({
        title: `<div data-title>${lang("songAction_title")}</div>`,
        buttons: [{
            text: lang("cancel")
        }],
        content: `<div data-content>${template.getSpinner()}</div><data-close mdui-dialog-close></data-close>`
    });
    mdui.mutation();
    let userPlaylists = await getUserPlaylists(song.source)
    let iscanRating = await canRating(song.source)
    let songCanLike = await canLike(song.source)
    let isSongLiked = songCanLike ? await isLiked(song.source, song.id) : false
    let actions = `<ul class="mdui-list">
        <li class="mdui-list-item mdui-ripple" mdui-dialog-close data-action="like" ${songCanLike?``:`style="pointer-events: none; opacity: .5;"`}>
            <i class="mdui-list-item-icon mdui-icon material-icons">${isSongLiked?'turned_in':'turned_in_not'}</i>
            <div class="mdui-list-item-content">${lang(isSongLiked?'songAction_unlike':'songAction_like')}</div>
        </li>
        <li class="mdui-list-item mdui-ripple" data-action="rating" ${iscanRating?``:`style="pointer-events: none; opacity: .5;"`}>
            <i class="mdui-list-item-icon mdui-icon eva eva-star-outline"></i>
            <div class="mdui-list-item-content">${lang("songAction_rating")}</div>
        </li>
        <li class="mdui-list-item mdui-ripple" data-action="playlistAdd" ${userPlaylists.length>0?``:`style="pointer-events: none; opacity: .5;"`}>
            <i class="mdui-list-item-icon mdui-icon material-icons">playlist_add</i>
            <div class="mdui-list-item-content">${lang("songAction_add2playlist")}</div>
        </li>
    </ul>`
    $(`[data-content]`).html(actions)
    $(`[data-content]`).animateCss('fadeIn faster')
    $(`[data-action="like"]`).click(async () => {
        $(`data-close`).click()
        let result = isSongLiked ? await disLike(song.source, song.id) : await like(song.source, song.id)
        let message
        if (result && result.code == 200) {
            message = lang(isSongLiked ? `songAction_unlike_success` : `songAction_like_success`).render({
                name: song.name
            })
        } else {
            message = lang(isSongLiked ? `songAction_unlike_failed` : `songAction_like_failed`).render({
                name: song.name
            })
        }

        mdui.snackbar({
            message: message,
            timeout: 500,
            position: getSnackbarPosition()
        })
    })
    $(`[data-action="rating"]`).click(() => {
        $(`[data-title]`).text(lang("songAction_rating"))
        $(`[data-content]`).html(`
        <div id="rating" class="mdui-text-center">
            <button class="mdui-btn mdui-btn-icon" data-rating="1"><i class="mdui-icon eva eva-star"></i></button>
            <button class="mdui-btn mdui-btn-icon" data-rating="2"><i class="mdui-icon eva eva-star"></i></button>
            <button class="mdui-btn mdui-btn-icon" data-rating="3"><i class="mdui-icon eva eva-star"></i></button>
            <button class="mdui-btn mdui-btn-icon" data-rating="4"><i class="mdui-icon eva eva-star"></i></button>
            <button class="mdui-btn mdui-btn-icon" data-rating="5"><i class="mdui-icon eva eva-star"></i></button>
        </div>
        <div class="mdui-text-center">
            <p>${lang("songAction_rating4song").render({name:song.name})}</p>
            <button class="mdui-btn mdui-btn-raised mdui-text-center" data-rating="0">${lang("songAction_rating0")}</button>
        </div>
        `)
        $(`[data-content]`).animateCss('fadeIn faster')
        $(`[data-rating]`).click(async function () {
            $(`data-close`).click()
            let star = $(this).attr('data-rating')
            let rating = await ratingSong(song.source, song.id, star)
            let msg = leng(`songAction_rating${star==0?"0":""}_${rating?"success":"failed"}`)
            mdui.snackbar({
                message: msg,
                timeout: 500,
                position: getSnackbarPosition()
            });
        })
    })
    $(`[data-action="playlistAdd"]`).click(async function () {
        $(`[data-title]`).text(lang("songAction_add2playlist"))
        $(`[data-content]`).html(template.getSpinner())
        mdui.mutation();
        let content;
        /* */
        content = $(`<ul class="mdui-list"/>`)
        for (let i = 0; i < userPlaylists.length; i++) {
            let icon = userPlaylists[i].image ? `<div class="mdui-list-item-avatar"><img src="${userPlaylists[i].image}"/></div>` : ``
            let exist = (await playlistExist(userPlaylists[i].source, [song.id], userPlaylists[i].id))[song.id]
            content.append(
                $(`<li class="mdui-list-item mdui-ripple">
                        ${icon}
                        <div class="mdui-list-item-content">
                            <div class="mdui-list-item-title">${userPlaylists[i].name}</div>
                            <div class="mdui-list-item-text">${lang(`songAction_add2playlist_song${exist?``:`Not`}Exist`).render({source:moduleShowName[userPlaylists[i].source]})}</div>
                        </div>
                        <i class="mdui-list-item-icon mdui-icon ${exist?`eva eva-trash-2-outline`:`material-icons`} mdui-text-color-grey-400">${exist?``:`playlist_add`}</i>
                </li>`).click(async () => {
                    $(`data-close`).click()
                    let result = await playlistOperation(userPlaylists[i].source, [song.id], userPlaylists[i].id)
                    let message
                    if (!result.result) message = lang("songAction_add2playlist_failed").render({
                        name: song.name
                    })
                    if (result.exist == 404) message = lang("songAction_add2playlist_add_success").render({
                        name: song.name,
                        playlist: userPlaylists[i].name
                    })
                    if (result.exist == 200) message = lang("songAction_add2playlist_remove_success").render({
                        name: song.name,
                        playlist: userPlaylists[i].name
                    })
                    mdui.snackbar({
                        message: message,
                        timeout: 500,
                        position: getSnackbarPosition()
                    });
                })
            )
        }
        $(`[data-content]`).html('')
        $(`[data-content]`).append(content)
        $(`[data-content]`).animateCss('fadeIn faster')
    })
}