$(function() { //初始化
    show_pin()
});
async function show_pin() {
    var header = `<div class="mdui-container-fluid mdui-valign mdui-typo" style="height: 300px;background-image:url(https://i.imgur.com/ErJMEsh.jpg)">
        <h1 class="mdui-center mdui-text-color-white">PokaPlayer</h1>
    </div>`,
        data = await getAPI("entry.cgi", "SYNO.AudioStation.Pin", "list", [{ key: "limit", "value": -1 }, { key: "offset", "value": 0 }]),
        album = '<div class="mdui-row-md-3 mdui-row-sm-2 mdui-row-xs-1">'

    for (i = 0; i < data.data.items.length; i++) {　
        let albumData = data.data.items[i]
        album += `<div class="mdui-col">
            <div class="mdui-card">
                <div class="mdui-card-media">
                <img src=".${getAlbumCover(albumData.criteria.album, albumData.criteria.album_artist, albumData.criteria.artist)}"/>
                <div class="mdui-card-media-covered mdui-card-media-covered-gradient">
                    <div class="mdui-card-primary">
                    <div class="mdui-card-primary-title">${albumData.name}</div>
                    <div class="mdui-card-primary-subtitle">${albumData.criteria.artist||albumData.criteria.album_artist}</div>
                    </div>
                </div>
                </div>
            </div>
        </div>`
    }
    album += "</div>"
    $("#content").html(header + album)
    console.log(album)
}

function getAlbumCover(album_name, album_artist_name, artist_name) {
    return '/nas/' + pp_encode(`webapi/AudioStation/cover.cgi?api=SYNO.AudioStation.Cover&output_default=true&is_hr=false&version=3&library=shared&_dc=1532262672737&method=getcover&view=album&album_name=${encodeURIComponent(album_name)}&album_artist_name=${encodeURIComponent(album_artist_name)}&artist_name=${encodeURIComponent(artist_name)}`)
}

function pp_encode(str) {
    return encodeURIComponent(base64.encode(str))
}
async function getAPI(CGI_PATH, API_NAME, METHOD, PARAMS_JSON = [], VERSION = 1) {
    var PARAMS = ''
    for (i = 0; i < PARAMS_JSON.length; i++) {　
        var PARAMS = PARAMS + '&' + PARAMS_JSON[i].key + '=' + PARAMS_JSON[i].value
    }
    var req_json = {
        "CGI_PATH": CGI_PATH,
        "API_NAME": API_NAME,
        "METHOD": METHOD,
        "VERSION": VERSION,
        "PARAMS": PARAMS
    }
    req_json = JSON.stringify(req_json)
    const response = await axios.get('/api/' + encodeURIComponent(req_json));
    return response.data
}