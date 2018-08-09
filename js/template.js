//-- 常用 HTML
function HTML_getHeader(title) {
    if (window.localStorage["randomImg"]) var style = `background-image: url(${window.localStorage["randomImg"]});`
    else var style = `background-image: url(/og/og.png);`
    return `<div class="mdui-container-fluid mdui-valign mdui-typo mdui-color-theme" id="header-wrapper" style="${style}">
                <h1 class="mdui-center mdui-text-color-white">${title}</h1>
            </div>`
}

function HTML_getSpinner() {
    return `<div class="mdui-spinner mdui-spinner-colorful mdui-center" style="margin-top:80px"></div>`
}

function HTML_showPins(items) {
    //var album = '<div class="mdui-row-md-4 mdui-row-sm-3 mdui-row-xs-2">'
    var html = '<div class="albums">'
    for (i = 0; i < items.length; i++) {　
        let pin = items[i]
        var title = pin.name
        var type = pin.type
        switch (type) {
            case "artist":
                //演出者
                var img = getCover(type, pin.criteria.artist)
                var title = pin.name
                var subtitle = '演出者'
                var onclickActions = `show_artist(\`${pin.criteria.artist}\`)`
                break;
            case "composer":
                //作曲者
                var img = getCover(type, pin.criteria.composer)
                var title = pin.name
                var subtitle = '作曲者'
                var onclickActions = `show_composer(\`${pin.criteria.composer}\`)`
                break;
            case "genre":
                //作曲者
                var img = getCover(type, pin.criteria.genre)
                var title = pin.name
                var subtitle = '類型'
                var onclickActions = `mdui.snackbar({message: '沒打算做喔，不過資料都給了就給你看一下啦',timeout:500,position:'${getSnackbarPosition()}'});`
                break;
            case "folder":
                //資料夾
                var img = getCover(type, pin.criteria.folder)
                var title = pin.name
                var subtitle = '資料夾'
                var onclickActions = `show_folder(\`${pin.criteria.folder}\`)`
                break;
            case "playlist":
                //資料夾
                var img = getBackground()
                var title = pin.name
                var subtitle = '播放清單'
                var onclickActions = `show_playlist_songs(\`${pin.criteria.playlist}\`) `
                break;
            case "album":
                //專輯
                var artist = pin.criteria.artist || pin.criteria.album_artist || ''
                var album_artist = pin.criteria.album_artist || ''
                var name = pin.criteria.album || '';
                // 輸出資料
                var img = getCover("album", name, artist, album_artist)
                var title = name
                var subtitle = artist
                var onclickActions = `show_album_songs(\`${artist}\`,\`${name}\`,\`${album_artist}\`)`
                break;
        }
        //await getAlbumSong(albumData.criteria.album, albumData.criteria.album_artist, albumData.criteria.artist)
        html += `<div class="mdui-card mdui-ripple mdui-hoverable album" 
                      onclick="${onclickActions}" 
                      style="background-image:url(${img});" 
                      title="${title}&#10;${subtitle}">
                <div class="mdui-card-media">
                    <div class="mdui-card-media-covered mdui-card-media-covered-gradient">
                        <div class="mdui-card-primary">
                        <div class="mdui-card-primary-title mdui-text-truncate">${title}</div>
                        <div class="mdui-card-primary-subtitle mdui-text-truncate">${subtitle}</div>
                        </div>
                    </div>
                </div>
            </div>`
    }
    html += "</div>"
    return html
}

function HTML_showFolder(items) {
    songList = items;
    var html = `<ul class="mdui-list">`
    for (i = 0; i < items.length; i++) {　
        let item = items[i]
        let type = item.type
        let title = item.title
        let id = item.id
        let icon = type == "folder" ? "folder" : type == "file" ? "music_note" : "help"
        if (type == "file") {
            let codec = item.additional.song_audio.codec.toUpperCase()
            let bitrate = item.additional.song_audio.bitrate / 1000 + 'K'
            let size = Math.round(item.additional.song_audio.filesize / 100000) / 10 + 'MB'
            let filedetail = codec + " " + bitrate + " " + size
            let artist = item.additional.song_tag.artist
            let album_artist = item.additional.song_tag.album_artist
            let album_album = item.additional.song_tag.album
            let img = window.localStorage["imgRes"] == "true" ? '' : `<div class="mdui-list-item-avatar"><img src="${getCover("song", item.id)}"/></div>`
            let subtitle = ''
            subtitle += artist ? artist : ''
            subtitle += album_album ? (artist ? ' / ' + album_album : album_album) : ''

            html += `
            <li class="mdui-list-item mdui-ripple">
                ${img}
                <div class="mdui-list-item-content" onclick="playSongs(songList,\`${id}\`)">
                    <div class="mdui-list-item-title">${title}</div>
                    <div class="mdui-list-item-text">${subtitle}</div>
                    <div class="mdui-list-item-text">${filedetail}</div>
                </div>
                <button class="mdui-btn mdui-btn-icon mdui-ripple add" 
                        onclick="addSong(songList,'${id}')">
                        <i class="mdui-icon material-icons">add</i>
                </button>
            </li>`
        } else {
            html += `<li class="mdui-list-item mdui-ripple" onclick="show_folder(\`${id}\`)">
                        <i class="mdui-list-item-avatar mdui-icon material-icons">${icon}</i>
                        <div class="mdui-list-item-content">${title}</div>
                    </li>`
        }
    }
    html += `</ul>`
    return html
}

function HTML_showAlbums(items) {
    //var album = '<div class="mdui-row-md-4 mdui-row-sm-3 mdui-row-xs-2">'
    var album = '<div class="albums">'
    for (i = 0; i < items.length; i++) {　
        let albumData = items[i]
        var artist = albumData.album_artist || albumData.display_artist || ''
        var album_artist = albumData.album_artist || ''
        var name = albumData.name || ''
        var img = getCover("album", name, artist, album_artist)
        if (albumData.criteria) {
            var artist = artist || albumData.criteria.artist || albumData.criteria.album_artist || '未知'
            var album_artist = album_artist || albumData.criteria.album_artist || ''
            var name = name || albumData.criteria.album || ''
        }
        //await getAlbumSong(albumData.criteria.album, albumData.criteria.album_artist, albumData.criteria.artist)
        album += `
        <div class="mdui-card mdui-ripple mdui-hoverable album" 
            onclick="show_album_songs(\`${artist}\`,\`${name}\`,\`${album_artist}\`)"  
            style="background-image:url(${img});"
            title="${name}${artist ? '&#10;' + artist : ''}">
            <div class="mdui-card-media">
                <div class="mdui-card-media-covered mdui-card-media-covered-gradient">
                    <div class="mdui-card-primary">
                    <div class="mdui-card-primary-title mdui-text-truncate">${name}</div>
                    <div class="mdui-card-primary-subtitle mdui-text-truncate">${artist}</div>
                    </div>
                </div>
            </div>
        </div>`
    }
    album += "</div>"
    return album
}

function HTML_showPlaylists(playlists) {
    var html = `<ul class="mdui-list">`
    for (i = 0; i < playlists.length; i++) {
        let playlist = playlists[i]
        let name = playlist.name
        let id = playlist.id
        html += `
        <li class="mdui-list-item mdui-ripple" onclick="show_playlist_songs(\`${id}\`)">
            <i class="mdui-list-item-avatar mdui-icon material-icons">playlist_play</i>
            <div class="mdui-list-item-content">
               ${name}
            </div>
        </li>`　
    }
    html += '</ul>'
    return html
}

function HTML_showSongs(songs) {
    songList = songs
    var html = `<div class="songs"><div class="mdui-row-xs-1 mdui-row-sm-2 mdui-row-md-3 mdui-row-lg-4">`
    for (i = 0; i < songs.length; i++) {
        let song = songs[i]
        let title = song.title
        let artist = song.additional.song_tag.artist
        let album_artist = song.additional.song_tag.album_artist
        let album = song.additional.song_tag.album
        let clickAction = `onclick="playSongs(songList,\`${song.id}\`);show_now()" `
        let addAction = `onclick="addSong(songList,'${song.id}')"`

        let img = window.localStorage["imgRes"] == "true" ? '' :
            `<div class="mdui-list-item-avatar" ${clickAction}>
                <img src="${getCover("album", album,artist,album_artist)}"/>
            </div>`

        html += `
        <div class="mdui-col"><li class="mdui-list-item mdui-ripple">
            ${img}
            <div class="mdui-list-item-content" 
                 ${clickAction}
                 title="${title}${artist?'&#10;'+artist:''}">
                <div class="mdui-list-item-title mdui-list-item-one-line">${title}</div>
                <div class="mdui-list-item-text mdui-list-item-one-line">${artist}</div>
            </div>
            <button class="mdui-btn mdui-btn-icon mdui-ripple add" 
                    ${addAction}
                    title="加入這首歌曲到現正播放">
                <i class="mdui-icon material-icons">add</i>
            </button>
        </li></div>`　
    }
    html += '</div></div>'
    return html
}


function HTML_showArtist(artists) {
    var html = `<ul class="mdui-list">`
    for (i = 0; i < artists.length; i++) {
        let artist = artists[i]
        let name = artist.name ? artist.name : "未知"
        let img = window.localStorage["imgRes"] == "true" ? '' : `<div class="mdui-list-item-avatar"><img src="${getCover("artist", name)}"/></div>`
        html += `
        <li class="mdui-list-item mdui-ripple" onclick="show_artist(\`${name}\`)">
            ${img}
            <div class="mdui-list-item-content">
               ${name}
            </div>
        </li>`　
    }
    html += '</ul>'
    return html
}

function HTML_showComposer(composers) {
    var html = `<ul class="mdui-list">`
    for (i = 0; i < composers.length; i++) {
        let composer = composers[i]
        let name = composer.name ? composer.name : "未知"
        let img = window.localStorage["imgRes"] == "true" ? '' : `<div class="mdui-list-item-avatar"><img src="${getCover("composer", name)}"/></div>`
        html += `
        <li class="mdui-list-item mdui-ripple" onclick="show_composer(\`${name}\`)">
            ${img}
            <div class="mdui-list-item-content">
               ${name}
            </div>
        </li>`　
    }
    html += '</ul>'
    return html
}