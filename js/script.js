//宣告全域變數
songList = [];
// 初始化播放器
const ap = new APlayer({
    container: document.getElementById('aplayer'),
    fixed: true
});
ap.on("play", function() {
    $('#player button.play[onclick="ap.toggle()"] i').text("pause")
    var name = ap.list.audios[ap.list.index].name || ""
    var artist = ap.list.audios[ap.list.index].artist || ""
    var img = ap.list.audios[ap.list.index].cover || "https://i.imgur.com/ErJMEsh.jpg"
    $('#player .song-info .name').text(name)
    $('#player .song-info .artist').text(artist)
    $('#player img').attr('src', img)
})
ap.on("pause", function() {
    $('#player button.play[onclick="ap.toggle()"] i').text("play_arrow")
})
ap.on("error", function() {
    mdui.snackbar({
        message: '播放器發生了錯誤：（',
        position: 'top'
    });
})
$(function() { //初始化
    show_home()
    $('[data-link="home"]').click(function() { show_home() })
    $('[data-link="album"]').click(function() { show_album() })
    $('[data-link="random"]').click(function() { show_random() })
    $('[data-link="now"]').click(function() { show_now() })
    $('[data-link]').click(function() {
        $('[data-link]').removeClass('mdui-list-item-active')
        $(this).addClass('mdui-list-item-active')
    })
});
//-- 加解密
function pp_encode(str) {
    return encodeURIComponent(base64.encode(str))
}

function pp_decode(str) {
    return decodeURIComponent(base64.decode(str))
}
//-- 常用 HTML
function HTML_getHeader(title) {
    return `<div class="mdui-container-fluid mdui-valign mdui-typo" style="height: 300px;background-image:url(https://i.imgur.com/ErJMEsh.jpg);background-size: cover;" id="header-wrapper">
    <h1 class="mdui-center mdui-text-color-white">${title}</h1>
</div>`
}

function HTML_showAlbums(items) {
    //var album = '<div class="mdui-row-md-4 mdui-row-sm-3 mdui-row-xs-2">'
    var album = '<div class="albums">'
    for (i = 0; i < items.length; i++) {　
        let albumData = items[i]
        var artist = albumData.album_artist || albumData.display_artist || ''
        var album_artist = albumData.album_artist || ''
        var name = albumData.name || ''
        if (albumData.criteria) {
            var artist = artist || albumData.criteria.artist || albumData.criteria.album_artist || '未知'
            var album_artist = album_artist || albumData.criteria.album_artist || ''
            var name = name || albumData.criteria.album || ''
        }
        //await getAlbumSong(albumData.criteria.album, albumData.criteria.album_artist, albumData.criteria.artist)
        album += `<div class="mdui-card mdui-ripple mdui-hoverable album" data-album="${name}" data-artist="${artist}" data-album-artist="${album_artist}">
                <div class="mdui-card-media">
                <img src=".${getAlbumCover(name, album_artist, artist)}"/>
                <div class="mdui-card-media-covered mdui-card-media-covered-gradient">
                    <div class="mdui-card-primary">
                    <div class="mdui-card-primary-title">${name}</div>
                    <div class="mdui-card-primary-subtitle">${artist}</div>
                    </div>
                </div>
                </div>
            </div>`
    }
    album += "</div>"
    return album
}

function HTML_showSongs(songs) {
    songList = JSON.stringify(songs)
    var html = `<ul class="mdui-list songs">`
    for (i = 0; i < songs.length; i++) {
        let song = songs[i]
        let title = song.title
        let artist = song.additional.song_tag.artist
        html += `<li class="mdui-list-item mdui-ripple">
            <div class="mdui-list-item-content" data-song-id="${song.id}">
                <div class="mdui-list-item-title mdui-list-item-one-line">${title}</div>
                <div class="mdui-list-item-text mdui-list-item-one-line">${artist}</div>
            </div>
            <button class="mdui-btn mdui-btn-icon mdui-ripple add" data-song-id="${song.id}">
                <i class="mdui-icon material-icons">add</i>
            </button>
        </li>`　
    }
    html += '</ul>'
    return html
}
// 首頁
async function show_home() {
    $("#title").text("首頁")
    var data = await getAPI("entry.cgi", "SYNO.AudioStation.Pin", "list", [{ key: "limit", "value": -1 }, { key: "offset", "value": 0 }]),
        header = HTML_getHeader("PokaPlayer"),
        album = HTML_showAlbums(data.data.items)
    $("#content").html(header + album)

    $('[data-album]').click(function() {
        show_album_songs(
            $(this).attr('data-artist'),
            $(this).attr('data-album'),
            $(this).attr('data-album-artist'))
    })
}
//- 列出專輯
async function show_album() {
    $("#title").text("專輯")
    var PARAMS_JSON = [
        { key: "additional", "value": "avg_rating" },
        { key: "library", "value": "shared" },
        { key: "limit", "value": 1000 },
        { key: "sort_by", "value": "display_artist" },
        { key: "sort_direction", "value": "ASC" },
    ]
    var data = await getAPI("AudioStation/album.cgi", "SYNO.AudioStation.Album", "list", PARAMS_JSON, 3),
        header = HTML_getHeader("專輯"),
        album = HTML_showAlbums(data.data.albums)
    $("#content").html(header + album)

    $('[data-album]').click(function() {
        show_album_songs(
            $(this).attr('data-artist'),
            $(this).attr('data-album'),
            $(this).attr('data-album-artist'))
    })
}
//- 隨機播放
async function show_random() {
    $("#title").text("隨機播放")
    var PARAMS_JSON = [
        { key: "additional", "value": "song_tag,song_audio,song_rating" },
        { key: "library", "value": "shared" },
        { key: "limit", "value": 100 },
        { key: "sort_by", "value": "random" }
    ]
    var data = await getAPI("AudioStation/song.cgi", "SYNO.AudioStation.Song", "list", PARAMS_JSON, 1),
        header = HTML_getHeader("隨機播放"),
        album = HTML_showSongs(data.data.songs)
    $("#content").html(header + album)
    $(".songs [data-song-id].mdui-list-item-content").click(function() {
        playSongs(JSON.parse(songList), $(this).attr('data-song-id'))
        show_now()
    })
    $(".songs [data-song-id].add").click(function() {
        addSong(JSON.parse(songList), $(this).attr('data-song-id'))
    })
}
//- 現正播放
async function show_now() {
    $('[data-link]').removeClass('mdui-list-item-active')
    $('[data-link="now"]').addClass('mdui-list-item-active')
    $("#title").text("現正播放")
    var header = HTML_getHeader("現正播放")
    var html = `<ul class="mdui-list songs">`
    for (i = 0; i < ap.list.audios.length; i++) {
        let focus = ap.list.index == i ? 'mdui-list-item-active' : ''
        let title = ap.list.audios[i].name
        let artist = ap.list.audios[i].artist
        html += `<li class="mdui-list-item mdui-ripple song ${focus}" >
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

    $("#content").html(header + html)
    $(".songs [data-now-play-id].songinfo").click(function() {
        $(".songs>li.song").removeClass('mdui-list-item-active')
        $(this).parent().eq(0).addClass('mdui-list-item-active')
        var song = $(this).attr('data-now-play-id')
        ap.list.switch(song)
    })
    $(".songs [data-now-play-id].close").click(function() {
        var song = $(this).attr('data-now-play-id')
        ap.list.remove(song)
        show_now()
    })

    ap.on("play", function() {
        $(".songs>li.song").removeClass('mdui-list-item-active')
        $(".songs>li.song").eq(ap.list.index).addClass('mdui-list-item-active')
    })
}
//- 展示專輯歌曲
async function show_album_songs(artist, album, album_artist) {
    $("#title").text('專輯 / ' + album)
    var data = await getAlbumSong(album, album_artist, artist),
        header = HTML_getHeader(album + (artist ? ' / ' + artist : '')),
        html = HTML_showSongs(data.data.songs)
    $("#content").html(header + html)
    $(".songs [data-song-id].mdui-list-item-content").click(function() {
        playSongs(JSON.parse(songList), $(this).attr('data-song-id'))
        show_now()
    })
    $(".songs [data-song-id].add").click(function() {
        addSong(JSON.parse(songList), $(this).attr('data-song-id'))
    })
}


function playSongs(songlist, song, clear = true) {
    if (clear) ap.list.clear()
    var playlist = []
    var songtoplay = 0
    for (i = 0; i < songlist.length; i++) {
        let nowsong = songlist[i]
        let src = getSong(nowsong.id)
        let name = nowsong.title
        let artist = nowsong.additional.song_tag.artist
        let album = nowsong.additional.song_tag.album
        let poster = getAlbumCover(album, nowsong.additional.song_tag.album_artist, artist)
        playlist.push({
            url: src,
            cover: poster,
            name: name,
            artist: artist,
            album: album
        })
        if (nowsong.id == song) { songtoplay = i }
    }
    ap.list.add(playlist)
    if (song) ap.list.switch(songtoplay)
    if (clear) ap.play()
}

function addSong(songlist, songID) {
    var playlist = []
    for (i = 0; i < songlist.length; i++) {
        let nowsong = songlist[i]
        if (nowsong.id == songID) {
            let src = getSong(nowsong.id)
            let name = nowsong.title
            let artist = nowsong.additional.song_tag.artist
            let album = nowsong.additional.song_tag.album
            let poster = getAlbumCover(album, nowsong.additional.song_tag.album_artist, artist)
            playlist.push({
                url: src,
                cover: poster,
                name: name,
                artist: artist,
                album: album
            })
        }
    }
    ap.list.add(playlist)
    if (ap.list.audios.length == 1) ap.play() //如果只有一首直接開播
}

function getAlbumCover(album_name, album_artist_name, artist_name) {
    var url = "webapi/AudioStation/cover.cgi?api=SYNO.AudioStation.Cover&output_default=true&is_hr=false&version=3&library=shared&_dc=1532262672737&method=getcover&view=album"
    url += album_name ? `&album_name=${encodeURIComponent(album_name)}` : ``
    url += artist_name ? `&artist_name=${encodeURIComponent(artist_name)}` : ``
    url += album_artist_name ? `&album_artist_name=${encodeURIComponent(album_artist_name)}` : `&album_artist_name=`
    return '/nas/' + pp_encode(url)
}

function getSong(id) {
    var url = "webapi/AudioStation/stream.cgi/0.mp3?api=SYNO.AudioStation.Stream&version=2&method=transcode&format=mp3&id=" + id
    return '/nas/' + pp_encode(url)
}
async function getAlbumSong(album_name, album_artist_name, artist_name) {
    var PARAMS_JSON = [
        { key: "additional", "value": "song_tag,song_audio,song_rating" },
        { key: "library", "value": "shared" },
        { key: "limit", "value": 100000 },
        { key: "sort_by", "value": "title" },
        { key: "sort_direction", "value": "ASC" },
    ]
    if (album_name) PARAMS_JSON.push({ key: "album", "value": album_name })
    if (album_artist_name) PARAMS_JSON.push({ key: "album_artist", "value": album_artist_name })
    if (artist_name) PARAMS_JSON.push({ key: "artist", "value": artist_name })
    console.log(PARAMS_JSON)
    var info = await getAPI("AudioStation/song.cgi", "SYNO.AudioStation.Song", "list", PARAMS_JSON, 3)
    console.log(info)
    return info
}

async function getAPI(CGI_PATH, API_NAME, METHOD, PARAMS_JSON = [], VERSION = 1) {
    var PARAMS = ''
    for (i = 0; i < PARAMS_JSON.length; i++) {　
        var PARAMS = PARAMS + '&' + PARAMS_JSON[i].key + '=' + encodeURIComponent(PARAMS_JSON[i].value)
    }
    var req_json = {
        "CGI_PATH": CGI_PATH,
        "API_NAME": API_NAME,
        "METHOD": METHOD,
        "VERSION": VERSION,
        "PARAMS": PARAMS
    }
    req_json = JSON.stringify(req_json)
    const response = await axios.get('/api/' + pp_encode(req_json));
    return response.data
}