//-- 常用 HTML
var HTML = {
        getHeader: title => {
            let style = window.localStorage["randomImg"] ? `background-image: url(${window.localStorage["randomImg"]});` : `background-image: url(/og/og.png);`
            return `<div class="mdui-container-fluid mdui-valign mdui-typo mdui-color-theme" id="header-wrapper" style="${style}">
                    <h1 class="mdui-center mdui-text-color-white">${title}</h1>
                </div>`
        },
        getSpinner: () => `<div class="mdui-spinner mdui-spinner-colorful mdui-center" style="margin-top:80px"></div>`,
        showPins: items => {
                //var album = '<div class="mdui-row-md-4 mdui-row-sm-3 mdui-row-xs-2">'
                let html = '<div class="albums">'
                for (i = 0; i < items.length; i++) {　
                    let pin = items[i]
                    let type = pin.type
                    let img, title, subtitle, link, onclickActions = ''
                    switch (type) {
                        case "artist":
                            //演出者
                            img = getCover(type, pin.criteria.artist)
                            title = pin.name
                            subtitle = '演出者'
                            link = `artist/${encodeURIComponent(pin.criteria.artist)}`
                            break;
                        case "composer":
                            //作曲者
                            img = getCover(type, pin.criteria.composer)
                            title = pin.name
                            subtitle = '作曲者'
                            link = `composer/${encodeURIComponent(pin.criteria.composer)}`
                            break;
                        case "genre":
                            //類型
                            img = getCover(type, pin.criteria.genre)
                            title = pin.name
                            subtitle = '類型'
                            link = 'home'
                            onclickActions = `mdui.snackbar({message: '沒打算做喔，不過資料都給了就給你看一下啦',timeout:500,position:'${getSnackbarPosition()}'});`
                            break;
                        case "folder":
                            //資料夾
                            img = getCover(type, pin.criteria.folder)
                            title = pin.name
                            subtitle = '資料夾'
                            link = `folder/${encodeURIComponent(pin.criteria.folder)}`
                            break;
                        case "playlist":
                            //播放清單
                            img = getBackground()
                            title = pin.name
                            subtitle = '播放清單'
                            link = `playlist/${pin.criteria.playlist} `
                            break;
                        case "album":
                            //專輯
                            let artist = pin.criteria.artist || pin.criteria.album_artist || ''
                            let album_artist = pin.criteria.album_artist || ''
                            let name = pin.criteria.album || '';
                            // 輸出資料
                            img = getCover("album", name, artist, album_artist)
                            title = name
                            subtitle = artist
                            link = `album/${artist?encodeURIComponent(artist):'#'}/${name?encodeURIComponent(name):'#'}/${album_artist?encodeURIComponent(album_artist):'#'}`
                            break;
                    }
                    html += `<div class="mdui-card mdui-ripple mdui-hoverable album" 
                          href="${link}" 
                          style="background-image:url(${img});" 
                          title="${title}&#10;${subtitle}"
                          ${onclickActions?`onclick="${onclickActions}"`:''}
                          data-navigo>
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
    },
    showFolder: items => {
        songList = items;
        let html = `<ul class="mdui-list">`
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
                    <div class="mdui-list-item-content" onclick="playSongs(songList,\`${id}\`);router.navigate('now');">
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
                html += `<li class="mdui-list-item mdui-ripple" href="folder/${id}" data-navigo>
                            <i class="mdui-list-item-avatar mdui-icon material-icons">${icon}</i>
                            <div class="mdui-list-item-content">${title}</div>
                        </li>`
            }
        }
        html += `</ul>`
        return html
    },
    showAlbums: items => {
        //var album = '<div class="mdui-row-md-4 mdui-row-sm-3 mdui-row-xs-2">'
        let album = '<div class="albums">'
        for (i = 0; i < items.length; i++) {　
            let albumData = items[i]
            let artist = albumData.album_artist || albumData.display_artist || ''
            let album_artist = albumData.album_artist || ''
            let name = albumData.name || ''
            let img = getCover("album", name, artist, album_artist)
            if (albumData.criteria) {
                let artist = artist || albumData.criteria.artist || albumData.criteria.album_artist || '未知'
                let album_artist = album_artist || albumData.criteria.album_artist || ''
                let name = name || albumData.criteria.album || ''
            }
            //await getAlbumSong(albumData.criteria.album, albumData.criteria.album_artist, albumData.criteria.artist)
            album += `
            <div class="mdui-card mdui-ripple mdui-hoverable album" 
                href="album/${artist?encodeURIComponent(artist):'#'}/${name?encodeURIComponent(name):'#'}/${album_artist?encodeURIComponent(album_artist):'#'}"  
                style="background-image:url(${img});"
                title="${name}${artist ? '&#10;' + artist : ''}"
                data-navigo>
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
    },
    showPlaylists: playlists => {
        let html = `<ul class="mdui-list">`
        for (i = 0; i < playlists.length; i++) {
            let playlist = playlists[i]
            let name = playlist.name
            let id = playlist.id
            html += `
            <li class="mdui-list-item mdui-ripple" href="playlist/${id}" data-navigo>
                <i class="mdui-list-item-avatar mdui-icon material-icons">playlist_play</i>
                <div class="mdui-list-item-content">
                   ${name}
                </div>
            </li>`　
        }
        html += '</ul>'
        return html
    },
    showSongs: songs => {
        songList = songs
        let html = `<div class="songs"><div class="mdui-row-xs-1 mdui-row-sm-2 mdui-row-md-3 mdui-row-lg-4">`
        for (i = 0; i < songs.length; i++) {
            let song = songs[i]
            let title = song.title
            let artist = song.additional.song_tag.artist
            let album_artist = song.additional.song_tag.album_artist
            let album = song.additional.song_tag.album
            let clickAction = `onclick="playSongs(songList,\`${song.id}\`);router.navigate('now');" `
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
    },
    showArtist: artists => {
        let html = `<ul class="mdui-list">`
        for (i = 0; i < artists.length; i++) {
            let artist = artists[i]
            let name = artist.name ? artist.name : "未知"
            let img = window.localStorage["imgRes"] == "true" ? '' : `<div class="mdui-list-item-avatar"><img src="${getCover("artist", name)}"/></div>`
            html += `
            <li class="mdui-list-item mdui-ripple" href="artist/${encodeURIComponent(name)}" data-navigo>
                ${img}
                <div class="mdui-list-item-content">
                   ${name}
                </div>
            </li>`　
        }
        html += '</ul>'
        return html
    },
    showComposer: composers => {
    let html = `<ul class="mdui-list">`
    for (i = 0; i < composers.length; i++) {
        let composer = composers[i]
        let name = composer.name ? composer.name : "未知"
        let img = window.localStorage["imgRes"] == "true" ? '' : `<div class="mdui-list-item-avatar"><img src="${getCover("composer", name)}"/></div>`
        html += `
        <li class="mdui-list-item mdui-ripple" href="composer/${encodeURIComponent(name)}" data-navigo>
            ${img}
            <div class="mdui-list-item-content">
               ${name}
            </div>
        </li>`　
    }
    html += '</ul>'
    return html
    }
}