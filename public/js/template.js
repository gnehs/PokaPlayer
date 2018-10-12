const template = {
    getSpinner: () => `<div class="mdui-spinner mdui-spinner-colorful mdui-center" style="margin-top:80px"></div>`,
    parseHome: data => {
        let r = ``;
        if (data.albums.length > 0) {
            r += `<h1>專輯</h1>`
            r += template.parseAlbums(data.albums)
        }
        if (data.artists.length > 0) {
            r += `<h1>演出者</h1>`
            r += template.parseArtists(data.artists)
        }
        if (data.composers.length > 0) {
            r += `<h1>作曲者</h1>`
            r += template.parseComposers(data.composers)
        }
        if (data.playlists.length > 0) {
            r += `<h1>播放清單</h1>`
            r += template.parsePlaylists(data.playlists)
        }
        if (data.folders.length > 0) {
            r += `<h1>資料夾</h1>`
            r += template.parseFolder(data.folders)
        }
        if (data.songs.length > 0) {
            r += `<h1>歌曲</h1>`
            r += template.parseSongs(data.songs)
        }
        return r
    },
    parseFolder: (folders, isRootDirectory) => {
        let html = `<ul class="mdui-list">`
        html += isRootDirectory ? '' : `<li class="mdui-list-item mdui-ripple" onclick="history.go(-1)">
                <i class="mdui-list-item-avatar mdui-icon material-icons">arrow_back</i>
                <div class="mdui-list-item-content">回上一頁</div>
            </li>`
        for (i = 0; i < folders.length; i++) {
            let folder = folders[i]
            html += `<li class="mdui-list-item mdui-ripple" href="folder/${folder.source}/${folder.id}" data-navigo>
                    <i class="mdui-list-item-avatar mdui-icon material-icons">folder</i>
                    <div class="mdui-list-item-content">${folder.name}</div>
                </li>`
        }
        html += `</ul>`
        return html
    },
    parseSongs: songs => {
        songList = songs
        let html = `<div class="songs"><div class="mdui-row-xs-1 mdui-row-sm-2 mdui-row-md-3 mdui-row-lg-4">`
        for (i = 0; i < songs.length; i++) {
            let song = songs[i]
            let title = song.name
            let artist = song.artist
            let clickAction = `onclick="playSongs(songList,'${song.id}');router.navigate('now');" `
            let addAction = `onclick="addSong(songList,'${song.id}')"`

            let img = window.localStorage["imgRes"] == "true" ? '' :
                `<div class="mdui-list-item-avatar" ${clickAction}>
                    <img src="${song.cover || getBackground()}"/>
                </div>`

            html += `
            <div class="mdui-col"><li class="mdui-list-item mdui-ripple">
                ${img}
                <div class="mdui-list-item-content" 
                     ${clickAction}
                     title="${title}${artist ? '&#10;' + artist : ''}">
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
    parseAlbums: albums => {
        let html = `<div class="poka cards">`
        for (i = 0; i < albums.length; i++) {
            let album = albums[i]
            let name = album.name
            let artist = album.artist
            let img = window.localStorage["imgRes"] == "true" ? window.localStorage["randomImg"] : album.cover.replace(/'/g, "\\'") || getBackground()
            html += `
               <a class="card" 
                  title="${name}${artist ? '&#10;' + artist : ''}"
                  href="album/${album.source}/${encodeURIComponent(album.id)}" 
                  data-source="${album.source}" 
                  data-navigo>
                   <div class="image mdui-ripple" style="background-image:url('${img}')"></div>
                   <div class="title mdui-text-color-theme-text mdui-text-truncate">${name}</div>
                   <div class="subtitle mdui-text-color-theme-text mdui-text-truncate">${artist}</div>
               </a>`
        }
        html += "</div>"
        return html
    },
    parseArtists: artists => {
        let html = `<div class="poka cards">`
        for (i = 0; i < artists.length; i++) {
            let artist = artists[i]
            let name = artist.name ? artist.name : "未知"
            let img = window.localStorage["imgRes"] == "true" ? getBackground() : artist.cover.replace("'", "\\'") || getBackground()
            html += `
            <a class="card" 
               title="${name}"
               href="artist/${encodeURIComponent(artist.source)}/${encodeURIComponent(artist.source == 'DSM' ? name : artist.id)}" 
               data-source="${moduleShowName[artist.source]}" 
               data-navigo>
                <div class="image mdui-ripple" style="background-image:url('${img}')"></div>
                <div class="title mdui-text-color-theme-text mdui-text-truncate">${name}</div>
            </a>`
        }
        html += '</div>'
        return html
    },
    parseComposers: composers => {
        let html = `<div class="poka cards">`
        for (i = 0; i < composers.length; i++) {
            let composer = composers[i]
            let name = composer.name ? composer.name : "未知"
            let img = window.localStorage["imgRes"] == "true" ? getBackground() : composer.cover.replace("'", "\\'") || getBackground()
            html += `
            <a class="card" 
               title="${name}"
               href="composer/${encodeURIComponent(composer.source)}/${encodeURIComponent(composer.source == 'DSM' ? name : composer.id)}" 
               data-source="${moduleShowName[composer.source]}" 
               data-navigo>
                <div class="image mdui-ripple" style="background-image:url('${img}')"></div>
                <div class="title mdui-text-color-theme-text mdui-text-truncate">${name}</div>
            </a>`
        }
        html += '</div>'
        return html
    },
    parsePlaylists: playlists => {
        let temporalPlaylist = sessionStorage.temporalPlaylist ? JSON.parse(sessionStorage.temporalPlaylist) : {}
        let html = `<div class="poka cards">`
        for (i = 0; i < playlists.length; i++) {
            let playlist = playlists[i]
            let img = playlist.image && window.localStorage["imgRes"] != "true" ? `style="background-image:url('${playlist.image}')"` : ``
            let icon = playlist.image && window.localStorage["imgRes"] != "true" ? `` : `<i class="mdui-icon material-icons">playlist_play</i>`
            let href = `playlist/${encodeURIComponent(playlist.source)}/${encodeURIComponent(playlist.id)}`
            if (playlist.type == 'folder') {
                let randomLink = Math.random().toString(36).substring(8)
                href = `playlistFolder/${playlist.id}-${randomLink}`
                temporalPlaylist[`${playlist.id}-${randomLink}`] = playlist
            }
            html += `
            <a class="card" 
               title="${playlist.name}"
               href="${href}"
               data-source="${moduleShowName[playlist.source]}" 
               data-navigo>
                <div class="image mdui-ripple" ${img}>${icon}</div>
                <div class="title mdui-text-color-theme-text mdui-text-truncate">${playlist.name}</div>
            </a>`
        }
        sessionStorage.temporalPlaylist = JSON.stringify(temporalPlaylist)
        html += '</div>'
        return html
    },
    infoHeader: (cover, name, artist) => {
        return `
        <div class="info-header">
            <div class="cover mdui-shadow-1" 
                 style="background-image:url('${cover.replace(/'/g, "\\'")}')"></div>
            <div class="info">
                <div class="album-name mdui-text-truncate mdui-text-color-theme-text" 
                     title="${name}">${name}</div>
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
    }
}