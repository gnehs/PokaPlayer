//- 設定
async function showSettings() {

    $('#content').attr('data-page', 'settings')
        ///給定預設值
    if (!window.localStorage["musicRes"]) window.localStorage["musicRes"] = "wav"
    if (!window.localStorage["randomImg"]) window.localStorage["randomImg"] = "/og/og.png"
    if (!window.localStorage["lrcSource"]) window.localStorage["lrcSource"] = "dsm"
        ///
    let header = HTML.getHeader("設定")
    let title = title => `<h2 class="mdui-text-color-theme">${title}</h2>`
    let subtitle = subtitle => `<h4>${subtitle}</h4>`
    let colors = [
        'red',
        'pink',
        'purple',
        'deep-purple',
        'indigo',
        'blue',
        'light-blue',
        'cyan',
        'teal',
        'green',
        'light-green',
        'lime',
        'yellow',
        'amber',
        'orange',
        'deep-orange',
        'brown',
        'grey',
        'blue-grey'
    ]
    let colorOption = (colors, accent = false) => {
        let option = ''
        for (i = 0; i < colors.length; i++) {
            let color = colors[i]
            let checked = window.localStorage[accent ? "mdui-theme-accent" : "mdui-theme-primary"] == color ? " checked" : ''
            if (i <= (colors.length - 3 - 1) && accent || !accent)
                option += `<div class="mdui-col"><label class="mdui-radio mdui-text-color-${color}${accent?"-accent":''}">
            <input type="radio" name="group${accent?"1":"2"}" value="${color}"${checked}/>
            <i class="mdui-radio-icon"></i>${color.replace("-"," ")}</label></div>`
        }
        return option
    }
    let themecolor = s => { return `<div class="mdui-col"><label class="mdui-radio"><input type="radio" name="themecolor" value="false" ${s=="true"?"":"checked"}/><i class="mdui-radio-icon"></i>Light</label></div>
  <div class="mdui-col"><label class="mdui-radio"><input type="radio" name="themecolor" value="true" ${s=="true"?"checked":""}/><i class="mdui-radio-icon"></i>Dark</label></div>` }
    let musicRes = s => { return `<div class="mdui-col">
        <label class="mdui-radio">
            <input type="radio" name="musicres" value="mp3" ${s=="mp3"?"checked":""}/>
            <i class="mdui-radio-icon"></i>
            MP3
        </label>
        <div class="mdui-typo-caption-opacity">128K，夭壽靠北，在網路夭壽慢的情況下請選擇此選項</div>
    </div>
    <div class="mdui-col">
        <label class="mdui-radio">
            <input type="radio" name="musicres" value="wav" ${s=="wav"?"checked":""}/>
            <i class="mdui-radio-icon"></i>
            WAV
        </label>
        <div class="mdui-typo-caption-opacity">較高音質，音質較原始音質略差，可在 4G 網路下流暢的串流</div>
    </div>
    <div class="mdui-col">
        <label class="mdui-radio">
            <input type="radio" name="musicres" value="original" ${s=="original"?"checked":""}/>
            <i class="mdui-radio-icon"></i>
            Original
        </label>
        <div class="mdui-typo-caption-opacity">原始音質，在網路狀況許可下，建議選擇此選項聆聽高音質音樂</div>
    </div>` }
    let imgRes = s => { return `<div class="mdui-col">
        <label class="mdui-radio">
            <input type="radio" name="musicres" value="true" ${s=="true"?"checked":""}/>
            <i class="mdui-radio-icon"></i>
            開啟
        </label>
        <div class="mdui-typo-caption-opacity">停止載入所有圖片，以節省流量及讀取時間，音樂仍會按照您所設定的音質播放</div>
    </div>
    <div class="mdui-col">
        <label class="mdui-radio">
            <input type="radio" name="musicres" value="false" ${s=="true"?"":"checked"}/>
            <i class="mdui-radio-icon"></i>
            關閉
        </label>
        <div class="mdui-typo-caption-opacity">載入所有圖片，就像平常那樣</div>
    </div>` }
    let lrcSource = async(s) => {
        let metingIsEnabled = (await axios.get('/meting')).data.enabled
        let result = `<div class="mdui-col">
        <label class="mdui-radio">
            <input type="radio" name="lrcSource" value="dsm" ${s=='dsm'?"checked":""}/>
            <i class="mdui-radio-icon"></i>
            DSM
        </label>
        <div class="mdui-typo-caption-opacity">使用 DSM 當中的歌詞搜尋器</div>
        </div>
        `
        if (metingIsEnabled) {
            result += `
            <div class="mdui-col">
            <label class="mdui-radio">
                <input type="radio" name="lrcSource" value="meting" ${s=="meting"?"checked":""}/>
                <i class="mdui-radio-icon"></i>
                Meting
            </label>
            <div class="mdui-typo-caption-opacity">Meting, such a powerful music API framework</div>
            </div>
            `
        }
        return result
    }

    let bg = s => { return `<div class="mdui-textfield">
        <input class="mdui-textfield-input" placeholder="隨機圖片" value="${s}"/>
        <div class="mdui-textfield-helper">填入網址或是點擊下方來源來取代原本的隨機圖片</div>
    </div>` }
    let bgSrc = () => {
        let imgs = [{
            name: '預設圖庫',
            src: '/og/og.png'
        }, {
            name: 'The Dog API',
            src: 'https://api.thedogapi.com/v1/images/search?format=src&mime_types=image/gif'
        }, {
            name: 'The Cat API',
            src: 'https://thecatapi.com/api/images/get?format=src&type=gif'
        }, {
            name: 'LoremFlickr',
            src: 'https://loremflickr.com/1920/1080'
        }, {
            name: 'Unsplash Source',
            src: 'https://source.unsplash.com/random'
        }, {
            name: 'Picsum Photos',
            src: 'https://picsum.photos/1920/1080/?random'
        }]
        let html = ''
        for (i = 0; i < imgs.length; i++) {
            let img = imgs[i]
            html += `<a class="mdui-btn mdui-ripple mdui-btn-raised" data-src="${img.src}">${img.name}</a>`
        }
        return html
    }

    let settingTheme = title("主題") +
        subtitle("主題色") + `<form class="mdui-row-xs-2 mdui-row-sm-3 mdui-row-md-5 mdui-row-lg-6" id="PP_Theme">${themecolor(window.localStorage["mdui-theme-color"])}</form>` +
        subtitle("主色") + `<form class="mdui-row-xs-2 mdui-row-sm-3 mdui-row-md-5 mdui-row-lg-6" id="PP_Primary" style="text-transform:capitalize;">${colorOption(colors)}</form>` +
        subtitle("強調色") + `<form class="mdui-row-xs-2 mdui-row-sm-3 mdui-row-md-5 mdui-row-lg-6" id="PP_Accent" style="text-transform:capitalize;">${colorOption(colors,true)}</form>`

    musicRes = title("音質") + `<form class="mdui-row-xs-1 mdui-row-sm-2 mdui-row-md-3 mdui-row-lg-4" id="PP_Res">${musicRes(window.localStorage["musicRes"])}</form>`

    lrcSource = title("歌詞來源") + `<form class="mdui-row-xs-1 mdui-row-sm-2 mdui-row-md-3 mdui-row-lg-4" id="PP_lrcSource">${await lrcSource(window.localStorage["lrcSource"])}</form>`

    imgRes = title("圖片流量節省") + `<form class="mdui-row-xs-1 mdui-row-sm-2 mdui-row-md-3 mdui-row-lg-4" id="PP_imgRes">${imgRes(window.localStorage["imgRes"])}</form>`

    bg = title("隨機圖片設定") + `<form id="PP_bg">${bg(window.localStorage["randomImg"])}<br>${bgSrc()}</form>`

    let info = title("Audio Station 狀態") + `<div id="DSMinfo" class="mdui-typo"><strong>版本</strong> 載入中</div>`

    let about = title("關於 PokaPlayer") + `<div id="about" class="mdui-typo">
    PokaPlayer 是 Synology Audio Ststion 的新朋友！ <a href="https://github.com/gnehs/PokaPlayer" target="_blank">GitHub</a>
        <p><strong>版本</strong> 載入中 / <strong>開發者</strong> 載入中 / 正在檢查更新</p>
    </div>`

    let html = header + settingTheme + musicRes + lrcSource + imgRes + bg + info + about
    $("#content").html(html)

    //初始化
    mdui.mutation();

    $("#PP_bg input").change(function() {
        window.localStorage["randomImg"] = $(this).val()
        $('#header-wrapper').attr("style", `background-image: url(${$(this).val()});`)
        mdui.snackbar({
            message: `隨機圖片已變更為 ${$(this).val()}`,
            position: getSnackbarPosition(),
            timeout: 1500
        });
    })
    $("#PP_bg [data-src]").click(function() {
        let name = $(this).text()
        let src = $(this).attr('data-src')
        window.localStorage["randomImg"] = src
        $('#header-wrapper').attr("style", `background-image: url(${src});`)
        $('#PP_bg input').val(src);
        mdui.snackbar({
            message: `隨機圖片已變更為 ${name}`,
            position: getSnackbarPosition(),
            timeout: 1500
        });

    })
    $("#PP_Res input").change(function() {
        window.localStorage["musicRes"] = $(this).val()
        mdui.snackbar({
            message: `音質已設定為 ${$(this).val().toUpperCase()}，該設定並不會在現正播放中生效，請重新加入歌曲`,
            position: getSnackbarPosition(),
            timeout: 1500
        });
    })
    $("#PP_lrcSource input").change(function() {
        window.localStorage["lrcSource"] = $(this).val()
        mdui.snackbar({
            message: `歌詞來源已設定為 ${$(this).val().toUpperCase()}`,
            position: getSnackbarPosition(),
            timeout: 1500
        });
    })
    $("#PP_imgRes input").change(function() {
        window.localStorage["imgRes"] = $(this).val()
        mdui.snackbar({
            message: `圖片流量節省已${$(this).val()=="true"?"開啟":"關閉"}`,
            position: getSnackbarPosition(),
            timeout: 1500
        });
    })
    $("#PP_Theme input").change(function() {
        window.localStorage["mdui-theme-color"] = $(this).val()
        if ($(this).val() == "true")
            $('body').addClass("mdui-theme-layout-dark")
        else
            $('body').removeClass("mdui-theme-layout-dark")
            //設定顏色
        let metaThemeColor = document.querySelector("meta[name=theme-color]");
        metaThemeColor.setAttribute("content", $('header>div:first-child').css("background-color"));
    })
    $("#PP_Primary input").change(function() {
        let classStr = $('body').attr('class');
        let classes = classStr.split(' ');
        for (i = 0, len = classes.length; i < len; i++) {
            if (classes[i].indexOf('mdui-theme-primary-') === 0) {
                $('body').removeClass(classes[i])
            }
        }
        $('body').addClass(`mdui-theme-primary-${$(this).val()}`)
        window.localStorage["mdui-theme-primary"] = $(this).val()
            //設定顏色
        let metaThemeColor = document.querySelector("meta[name=theme-color]");
        metaThemeColor.setAttribute("content", $('header>div:first-child').css("background-color"));
    })
    $("#PP_Accent input").change(function() {
        let classStr = $('body').attr('class');
        let classes = classStr.split(' ');
        for (i = 0, len = classes.length; i < len; i++) {
            if (classes[i].indexOf('mdui-theme-accent-') === 0) {
                $('body').removeClass(classes[i])
            }
        }
        window.localStorage["mdui-theme-accent"] = $(this).val()
        $('body').addClass(`mdui-theme-accent-${$(this).val()}`)
    })


    // DSM 詳細資料
    let getDSMInfo = await getAPI("AudioStation/info.cgi", "SYNO.AudioStation.Info", "getinfo", [], 4)
    $("#DSMinfo").html(`<strong>版本</strong> ${getDSMInfo.data.version_string?getDSMInfo.data.version_string:"版本：未知"}`)

    // PokaPlayer 詳細資料
    let getInfo = await axios.get('/info/');
    let debug = await axios.get('/debug/')
    let checkUpdate = await axios.get(`https://api.github.com/repos/gnehs/PokaPlayer/releases`);
    let update = getInfo.data.version != checkUpdate.data[0].tag_name ?
        `新版本 <a href="${checkUpdate.data[0].html_url}" target="_blank">${checkUpdate.data[0].tag_name}</a> 已發佈，請立即更新 <a href="javascript:void(0)" data-upgrade>更新</a>` :
        debug.data == false ?
        `您的 PokaPlayer 已是最新版本` :
        `<a href="javascript:void(0)" data-upgrade>與開發分支同步</a>`
    let version = debug.data == false ? getInfo.data.version : debug.data
    about = `PokaPlayer 是 Synology Audio Ststion 的新朋友！ <a href="https://github.com/gnehs/PokaPlayer" target="_blank">GitHub</a>
        <p><strong>版本</strong> ${version} / <strong>開發者</strong> ${getInfo.data.author} / ${update}</p>`
    $("#about").html(about)


    $("[data-upgrade]").click(() => {
        mdui.dialog({
            title: '您確定要現在更新嗎',
            content: '這將導致您在更新完畢前暫時無法使用 PokaPlayer',
            buttons: [{
                    text: '算ㄌ'
                },
                {
                    text: '對啦',
                    onClick: async inst => {
                        mdui.snackbar('正在更新...', { position: getSnackbarPosition() });
                        let update = await axios.get('/upgrade/')
                        if (update.data == "upgrade") {
                            mdui.snackbar('伺服器重新啟動', {
                                buttonText: '重新連接',
                                onButtonClick: () => window.location.reload(),
                            })
                        } else if (update.data == "socket") {
                            socket.emit('update')
                            socket.on('Permission Denied Desu', () => mdui.snackbar('Permission Denied', {
                                timeout: 3000,
                                position: getSnackbarPosition()
                            }))
                            socket.on('init', () => mdui.snackbar('正在初始化...', {
                                timeout: 3000,
                                position: getSnackbarPosition()
                            }))
                            socket.on('git', data => mdui.snackbar({
                                fetch: '初始化完成',
                                reset: '更新檔下載完成'
                            }[data], {
                                timeout: 3000,
                                position: getSnackbarPosition()
                            }))
                            socket.on('restart', () => {
                                socket.emit('restart')
                                mdui.snackbar('伺服器正在重新啟動...', {
                                    buttonText: '重新連接',
                                    onButtonClick: () => window.location.reload(),
                                    position: getSnackbarPosition()
                                })
                            })
                            socket.on('err', data => mdui.snackbar('錯誤: ' + data, {
                                timeout: 8000,
                                position: getSnackbarPosition()
                            }))
                        }
                    }
                }
            ]
        });
    })


}