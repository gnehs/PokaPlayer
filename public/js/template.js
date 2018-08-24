const template = {
    getHeader: title => {
        let style = window.localStorage["randomImg"] ? `background-image: url(${window.localStorage["randomImg"]});` : `background-image: url(/og/og.png);`
        return `<div class="mdui-container-fluid mdui-valign mdui-typo mdui-color-theme" id="header-wrapper" style="${style}">
                <h1 class="mdui-center mdui-text-color-white">${title}</h1>
            </div>`
    },
    getSpinner: () => `<div class="mdui-spinner mdui-spinner-colorful mdui-center" style="margin-top:80px"></div>`,

    praseFolder: folders => {
        let html = `<ul class="mdui-list">`
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
    praseSongs: songs => {
        songList = songs
        let html = `<div class="songs"><div class="mdui-row-xs-1 mdui-row-sm-2 mdui-row-md-3 mdui-row-lg-4">`
        for (i = 0; i < songs.length; i++) {
            let song = songs[i]
            let title = song.name
            let artist = song.artist
            let album = song.album
            let clickAction = `onclick="playSongs(songList,\`${song.id}\`);router.navigate('now');" `
            let addAction = `onclick="addSong(songList,'${song.id}')"`

            let img = window.localStorage["imgRes"] == "true" ? '' :
                `<div class="mdui-list-item-avatar" ${clickAction}>
                    <img src="${song.cover}"/>
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
}