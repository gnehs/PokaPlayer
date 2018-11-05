const template = {
    getSpinner: () => `<div class="mdui-spinner mdui-spinner-colorful mdui-center" style="margin:50px 0"></div>`,
    parseHome: data => {
        let result = ``
        for (let i = 0; i < data.length; i++) {
            result += `
            <div class="mdui-typo">
                <h1>
                    <strong>${data[i].title}</strong>
                    </br>
                    <small>${data[i].description}</small>
                </h1>
            </div>`
            result += template.parseSearch(data[i])
            result += (i + 1 != data.length) ? `<div class="mdui-typo"><hr /></div>` : '' // 最後不加分隔線
        }
        return result
    },
    parseSearch: data => {
        let tab = `<div class="mdui-tab" mdui-tab>`
        let tabItem = (href, label, icon) => `<a href="#${href}" class="mdui-ripple">
            <i class="mdui-icon">${icon}</i>
            <label>${label}</label>
        </a>`
        let r = ``;
        if (data.albums && data.albums.length > 0) {
            let randomId = Math.random().toString(36).substring(8)
            tab += tabItem(randomId, '專輯', data.albums.length)
            r += `<div id="${randomId}" class="mdui-p-a-2">${template.parseAlbums(data.albums)}</div>`
        }
        if (data.artists && data.artists.length > 0) {
            let randomId = Math.random().toString(36).substring(8)
            tab += tabItem(randomId, '演出者', data.artists.length)
            r += `<div id="${randomId}" class="mdui-p-a-2">${template.parseArtists(data.artists)}</div>`
        }
        if (data.composers && data.composers.length > 0) {
            let randomId = Math.random().toString(36).substring(8)
            tab += tabItem(randomId, '作曲者', data.composers.length)
            r += `<div id="${randomId}" class="mdui-p-a-2">${template.parseComposers(data.composers)}</div>`
        }
        if (data.playlists && data.playlists.length > 0) {
            let randomId = Math.random().toString(36).substring(8)
            tab += tabItem(randomId, '播放清單', data.playlists.length)
            r += `<div id="${randomId}" class="mdui-p-a-2">${template.parsePlaylists(data.playlists)}</div>`
        }
        if (data.folders && data.folders.length > 0) {
            let randomId = Math.random().toString(36).substring(8)
            tab += tabItem(randomId, '資料夾', data.folders.length)
            r += `<div id="${randomId}" class="mdui-p-a-2">${template.parseFolder(data.folders)}</div>`
        }
        if (data.songs && data.songs.length > 0) {
            let randomId = Math.random().toString(36).substring(8)
            tab += tabItem(randomId, '歌曲', data.songs.length)
            r += `<div id="${randomId}" class="mdui-p-a-2">${template.parseSongs(data.songs)}</div>`
        }
        tab += `</div>`
        return (tab + r)
    },
    parseFolder: (folders, showBackButton = false) => {
        let html = `<ul class="mdui-list">`
        html += showBackButton ? `<li class="mdui-list-item mdui-ripple" onclick="history.go(-1)">
            <i class="mdui-list-item-icon mdui-icon material-icons">arrow_back</i>
            <div class="mdui-list-item-content">回上一頁</div>
        </li>` : ``
        for (i = 0; i < folders.length; i++) {
            let folder = folders[i]
            html += `<li class="mdui-list-item mdui-ripple" href="folder/${folder.source}/${folder.id}" data-navigo>
                    <i class="mdui-list-item-icon mdui-icon material-icons">folder</i>
                    <div class="mdui-list-item-content">${folder.name}</div>
                </li>`
        }
        html += `</ul>`
        return html
    },
    parseSongs: songs => {
        songList = songs
        let html = `<div class="songs"><div class="mdui-row-xs-1 mdui-row-sm-2 mdui-row-md-2 mdui-row-lg-3">`
        for (i = 0; i < songs.length; i++) {
            let song = songs[i]
            let title = song.name
            let artist = song.artist
            let clickAction = `onclick="playSongs(songList,'${song.id}');router.navigate('now');" `
            let addAction = `onclick="addSong(songList,'${song.id}')"`
            let songAction = `onclick="songAction(\`${song.id}\`,\`${song.source}\`)"`

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
                <button class="mdui-btn mdui-btn-icon mdui-ripple" 
                        ${songAction}
                        title="更多選項">
                    <i class="mdui-icon material-icons">more_horiz</i>
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
            <div class="cover" 
                 style="background-image:url('${cover.replace(/'/g, "\\'")}');${cover!=''?``:`box-shadow:none;`}"></div>
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