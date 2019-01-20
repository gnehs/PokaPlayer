const template = {
    getSpinner: () => `<div class="mdui-spinner mdui-spinner-colorful mdui-center" style="margin:50px 0"></div>`,
    getPlacehoader(style = 'card') {
        let randomText = () => {
            let randomA = Math.floor(Math.random() * 10)
            let randomB = Math.floor(Math.random() * 21) + 10
            return "loadinging loading loooooading loadinggggg".slice(randomA, randomB)
        }
        let randomLabel = () => {
            let random = Math.floor(Math.random() * 7) + 3
            return "loadinging".slice(0, random)
        }
        switch (style) {
            case "card":
                let r = `<div class="poka cards placeholder">`
                for (i = 0; i < 30; i++)
                    r += `<a class="card" 
                        title="${randomText()}"
                        data-source="POKA" 
                        data-navigo>
                        <div class="image mdui-ripple"><i class="mdui-icon eva eva-play-circle"></i></div>
                        <div class="title mdui-text-color-theme-text mdui-text-truncate">${randomLabel()}</div>
                        <div class="subtitle mdui-text-color-theme-text mdui-text-truncate">${randomText()}</div>
                    </a>`
                r += `</div>`
                return r
            case "list":
                let html = `<div class="mdui-list placeholder">`
                for (i = 0; i < 30; i++) {
                    html += `<div class="mdui-list-item" 
                         data-source="${randomText()}" 
                         data-navigo>
                            <i class="mdui-list-item-icon mdui-icon material-icons">folder</i>
                            <div class="mdui-list-item-content">${randomText()}</div>`
                    if (localStorage["pokaCardSource"] == "true")
                        html += `<div class="mdui-list-item-source">poka</div>`
                    html += `</div>`
                }
                html += `</div>`
                return html
            case "tab":
                return `<div class="mdui-tab placeholder" mdui-tab="" style="margin-bottom: 10px;">
                    <a class="mdui-ripple mdui-tab-active">
                        <i class="mdui-icon">30</i>
                        <label>${randomLabel()}</label>
                    </a>
                    <a class="mdui-ripple">
                        <i class="mdui-icon">19</i>
                        <label>${randomLabel()}</label>
                    </a>
                    <a class="mdui-ripple">
                        <i class="mdui-icon">30</i>
                        <label>${randomLabel()}</label>
                    </a>
                    <a class="mdui-ripple">
                        <i class="mdui-icon">30</i>
                        <label>${randomLabel()}</label>
                    </a>
                    <div class="mdui-tab-indicator" style="left: 0px; width: 112px;"></div>
                </div>`
            case "filter":
                return `<div class="mdui-text-right placeholder" style="margin-bottom: 10px;">
                            <button class="poka button toggle active"><i class="mdui-icon eva eva-funnel-outline"></i> ${randomLabel()}</button>
                            <button class="poka button toggle active"><i class="mdui-icon eva eva-funnel-outline"></i> ${randomLabel()}</button>
                        </div>`
            case "header":
                return `<div class="mdui-typo placeholder">
                            <h1><strong>${randomText()}</strong><br><small>${randomLabel()} ${randomText()}</small></h1>
                        </div>`

        }
    },
    parseHome(data) {
        let filter = `<div class="mdui-text-right">`
        let filterSource = {}
        let result = ``
        for (let i in data) {
            let showName = moduleShowName[data[i].source] || data[i].source
            /* 篩選器 */
            if (!filterSource[data[i].source])
                filter += `<button class="poka button toggle active" 
                                   data-filter="${showName}">
                                   <i class="mdui-icon eva eva-funnel-outline"></i>
                                   ${showName}
                           </button>`
            filterSource[data[i].source] = true
            /* HTML */
            result += `<div data-source="${showName}">`
            result += `
            <div class="mdui-typo">
                <h1>
                    <strong>${data[i].title}</strong>
                    </br>
                    <small>${data[i].description?`${showName} / ${data[i].description}`:''}</small>
                </h1>
            </div>`
            result += template.parseSearch(data[i], true)
            result += (data[i] != data[data.length - 1]) ? `<div class="mdui-typo"><hr /></div>` : '' // 最後不加分隔線
            result += `</div>`
        }
        filter += `</div>`
        filter = Object.keys(filterSource).length > 1 && localStorage["poka-filter"] == "true" ? filter : ""
        return filter + result //篩選器項目大於一個才輸出篩選器
    },
    parseSearch(data, home = false) {
        let sources = new Set()
        let tabsCount = 0
        let tab = `<div class="mdui-tab" mdui-tab>`
        let tabItem = (href, label, icon) => `<a href="#${href}" class="mdui-ripple">
            <i class="mdui-icon">${icon}</i>
            <label>${label}</label>
        </a>`
        let r = ``;
        if (data.albums && data.albums.length > 0) {
            data.albums.map(bibi => sources.add(bibi.source))
            tabsCount++
            let randomId = Math.random().toString(36).substring(8)
            tab += tabItem(randomId, '專輯', data.albums.length)
            r += `<div id="${randomId}" class="mdui-p-a-2">${template.parseAlbums(data.albums)}</div>`
        }
        if (data.artists && data.artists.length > 0) {
            data.artists.map(bibi => sources.add(bibi.source))
            tabsCount++
            let randomId = Math.random().toString(36).substring(8)
            tab += tabItem(randomId, '演出者', data.artists.length)
            r += `<div id="${randomId}" class="mdui-p-a-2">${template.parseArtists(data.artists)}</div>`
        }
        if (data.composers && data.composers.length > 0) {
            data.composers.map(bibi => sources.add(bibi.source))
            tabsCount++
            let randomId = Math.random().toString(36).substring(8)
            tab += tabItem(randomId, '作曲者', data.composers.length)
            r += `<div id="${randomId}" class="mdui-p-a-2">${template.parseComposers(data.composers)}</div>`
        }
        if (data.playlists && data.playlists.length > 0) {
            data.playlists.map(bibi => sources.add(bibi.source))
            tabsCount++
            let randomId = Math.random().toString(36).substring(8)
            tab += tabItem(randomId, '播放清單', data.playlists.length)
            r += `<div id="${randomId}" class="mdui-p-a-2">${template.parsePlaylists(data.playlists)}</div>`
        }
        if (data.folders && data.folders.length > 0) {
            data.folders.map(bibi => sources.add(bibi.source))
            tabsCount++
            let randomId = Math.random().toString(36).substring(8)
            tab += tabItem(randomId, '資料夾', data.folders.length)
            r += `<div id="${randomId}" class="mdui-p-a-2">${template.parseFolder(data.folders)}</div>`
        }
        if (data.songs && data.songs.length > 0) {
            data.songs.map(bibi => sources.add(bibi.source))
            tabsCount++
            let randomId = Math.random().toString(36).substring(8)
            tab += tabItem(randomId, '歌曲', data.songs.length)
            r += `<div id="${randomId}" class="mdui-p-a-2">${template.parseSongs(data.songs)}</div>`
        }
        tab += `</div>`
        /* 篩選器 */
        let filter = `<div class="mdui-text-right">`
        for (let item of sources) {
            let showName = moduleShowName[item] || item
            filter += `<button class="poka button toggle active" 
                                data-filter="${showName}">
                                <i class="mdui-icon eva eva-funnel-outline"></i>
                                ${showName}
                            </button>`
        }
        filter += `</div>`
        if (1 >= [...sources].length || home || localStorage["poka-filter"] != "true") filter = ``
        return tabsCount > 1 ? (filter + tab + r) : (filter + r)
    },
    parseFolder(folders, showBackButton = false) {
        let html = `<ul class="mdui-list">`
        html += showBackButton ? `<li class="mdui-list-item" onclick="history.go(-1)">
            <i class="mdui-list-item-icon mdui-icon eva eva-arrow-ios-back-outline"></i>
            <div class="mdui-list-item-content">回上一頁</div>
        </li>` : ``
        for (let {
                source,
                id,
                name
            } of folders) {
            let showName = moduleShowName[source] || source
            html += `<li class="mdui-list-item" 
                         href="folder/${source}/${id}" 
                         data-source="${showName}" 
                         data-navigo>
                    <i class="mdui-list-item-icon mdui-icon material-icons">folder</i>
                    <div class="mdui-list-item-content">${name}</div>`
            if (localStorage["pokaCardSource"] == "true")
                html += `<div class="mdui-list-item-source">${showName}</div>`
            html += `</li>`
        }
        html += `</ul>`
        return html
    },
    parseSongs(songs) {
        songList = songs
        let html = `<div class="songs"><div class="mdui-row-xs-1 mdui-row-sm-2 mdui-row-md-2 mdui-row-lg-3">`
        for (let {
                name: title,
                artist,
                id,
                source,
                cover
            } of songs) {
            let showName = moduleShowName[source] || source

            let clickAction = `onclick="playSongs(songList,'${id}');router.navigate('now');" `
            let addAction = `onclick="addSong(songList,'${id}')"`
            let songAction = `onclick="songAction(\`${id}\`,\`${source}\`)"`

            let img = localStorage["imgRes"] == "true" ? '' :
                `<div class="mdui-list-item-avatar" ${clickAction}>
                    <img src="${cover || getBackground()}"/>
                </div>`

            html += `
            <div class="mdui-col" data-source="${showName}"><li class="mdui-list-item">
                ${img}
                <div class="mdui-list-item-content" 
                     ${clickAction}
                     title="${title}${artist ? '&#10;' + artist : ''}">
                    <div class="mdui-list-item-title mdui-list-item-one-line">${title}</div>
                    <div class="mdui-list-item-text mdui-list-item-one-line">${artist}</div>
                </div>
                <button class="mdui-btn mdui-btn-icon add" 
                        ${addAction}
                        title="加入這首歌曲到現正播放">
                    <i class="mdui-icon eva eva-plus-outline"></i>
                </button>
                <button class="mdui-btn mdui-btn-icon" 
                        ${songAction}
                        title="更多選項">
                    <i class="mdui-icon eva eva-more-horizotnal-outline"></i>
                </button>
            </li></div>`
        }
        html += '</div></div>'
        return html
    },
    parseAlbums(albums) {
        let html = `<div class="poka cards">`
        for (let {
                name,
                artist,
                cover,
                id,
                source
            } of albums) {
            let img = localStorage["imgRes"] == "true" ? localStorage["randomImg"] : cover.replace(/'/g, "\\'") || getBackground()
            html += `
               <a class="card" 
                  title="${name}${artist ? '&#10;' + artist : ''}"
                  href="album/${source}/${encodeURIComponent(id)}" 
                  data-source="${moduleShowName[source]||source}" 
                  data-navigo>
                   <div class="image mdui-ripple" style="background-image:url('${img}')"></div>
                   <div class="title mdui-text-color-theme-text mdui-text-truncate">${name}</div>
                   <div class="subtitle mdui-text-color-theme-text mdui-text-truncate">${artist}</div>
               </a>`
        }
        html += "</div>"
        return html
    },
    parseArtists(artists) {
        let html = `<div class="poka cards">`
        for (let {
                name,
                cover,
                source,
                id
            } of artists) {
            name = name ? name : '未知'
            let img = localStorage["imgRes"] == "true" ? getBackground() : cover.replace("'", "\\'") || getBackground()
            html += `
            <a class="card" 
               title="${name}"
               href="artist/${encodeURIComponent(source)}/${encodeURIComponent(source == 'DSM' ? name : id)}" 
               data-source="${moduleShowName[source]||source}" 
               data-navigo>
                <div class="image mdui-ripple" style="background-image:url('${img}')"></div>
                <div class="title mdui-text-color-theme-text mdui-text-truncate">${name}</div>
            </a>`
        }
        html += '</div>'
        return html
    },
    parseComposers(composers) {
        let html = `<div class="poka cards">`
        for (let {
                name,
                cover,
                source,
                id
            } of composers) {
            name = name ? name : "未知"
            let img = localStorage["imgRes"] == "true" ? getBackground() : cover.replace("'", "\\'") || getBackground()
            html += `
            <a class="card" 
               title="${name}"
               href="composer/${encodeURIComponent(source)}/${encodeURIComponent(source == 'DSM' ? name : id)}" 
               data-source="${moduleShowName[source]||source}" 
               data-navigo>
                <div class="image mdui-ripple" style="background-image:url('${img}')"></div>
                <div class="title mdui-text-color-theme-text mdui-text-truncate">${name}</div>
            </a>`
        }
        html += '</div>'
        return html
    },
    parsePlaylists(playlists) {
        let temporalPlaylist = sessionStorage.temporalPlaylist ? JSON.parse(sessionStorage.temporalPlaylist) : {}
        let filter = `<div class="mdui-text-right" style="margin-bottom: 10px;">`
        let filterSource = {}
        let html = `<div class="poka cards">`
        for (let playlist of playlists) {
            let {
                image,
                source,
                id,
                type,
                name
            } = playlist
            /* 篩選器 */
            if (!filterSource[source]) {
                let showName = moduleShowName[source] || source
                filter += `<button class="poka button toggle active" 
                                   data-filter="${showName}">
                                   <i class="mdui-icon eva eva-funnel-outline"></i>
                                   ${showName}
                           </button>`
            }
            filterSource[source] = true
            /* HTML */
            let img, icon
            let showName = moduleShowName[source] || source
            if (image && localStorage["imgRes"] != "true") {
                img = `style="background-image:url('${image}')"`
                icon = ``
            } else if (id == "random") {
                img = ``
                icon = `<i class="mdui-icon eva eva-shuffle"></i>`
            } else {
                img = ``
                icon = `<i class="mdui-icon eva eva-play-circle"></i>`
            }
            let href = `playlist/${encodeURIComponent(source)}/${encodeURIComponent(id)}`
            if (type == 'folder') {
                if (img == "") icon = `<i class="mdui-icon eva eva-folder"></i>`
                let randomLink = Math.random().toString(36).substring(8)
                href = `playlistFolder/${id}-${randomLink}`
                temporalPlaylist[`${id}-${randomLink}`] = playlist
            }
            html += `
            <a class="card" 
               title="${name}"
               href="${href}"
               data-source="${showName}" 
               data-navigo>
                <div class="image mdui-ripple" ${img}>${icon}</div>
                <div class="title mdui-text-color-theme-text mdui-text-truncate">${name}</div>
            </a>`
        }
        sessionStorage.temporalPlaylist = JSON.stringify(temporalPlaylist)
        html += '</div>'
        filter += `</div>`
        filter = Object.keys(filterSource).length > 1 && localStorage["poka-filter"] == "true" ? filter : "" //篩選器項目大於一個才輸出篩選器
        return filter + html
    },
    infoHeader(cover, name, artist) {
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