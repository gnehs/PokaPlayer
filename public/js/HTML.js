//-- 常用 HTML
var HTML = {
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
}