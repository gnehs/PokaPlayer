// 初始化設定值
$(async() => {
    ///給定預設值
    if (!window.localStorage["musicRes"]) window.localStorage["musicRes"] = "wav"
    if (!window.localStorage["randomImg"]) window.localStorage["randomImg"] = "/og/og.png"
    if (!window.localStorage["randomImgName"]) window.localStorage["randomImgName"] = "預設圖庫"
    if (!window.localStorage["lrcSource"]) window.localStorage["lrcSource"] = "dsm"
    window.localStorage["PokaPlayerVersion"] = (await axios.get('/info/')).data.version
});

//- 設定
async function showSettings() {
    $('#content').attr('data-page', 'settings')
    let header = HTML.getHeader("設定")
    let item = (title, text = '', icon = '', link = '', data = '') => {
            return `<li class="mdui-list-item mdui-ripple" ${link?`onclick="router.navigate('${link}')"`:''} ${data}>
            <i class="mdui-list-item-icon mdui-icon material-icons">${icon}</i>
            <div class="mdui-list-item-content">
                <div class="mdui-list-item-title mdui-list-item-one-line">${title}</div>
                <div class="mdui-list-item-text mdui-list-item-one-line">${text}</div>
            </div>
        </li>`
    }
    let settingItems = `<ul class="mdui-list">
        ${item("主題","設定主題色、主色及強調色","color_lens","settings/theme")}
        ${item("音質",window.localStorage["musicRes"].toUpperCase(),"music_note","","data-music-res")}
        <li class="mdui-list-item mdui-ripple" data-imgRes>
            <i class="mdui-list-item-icon mdui-icon material-icons">image</i>
            <div class="mdui-list-item-content">
                <div class="mdui-list-item-title mdui-list-item-one-line">圖片流量節省</div>
                <div class="mdui-list-item-text mdui-list-item-one-line">${window.localStorage["imgRes"]=="true"? "已開啟" : "已關閉"}</div>
            </div>
            <label class="mdui-switch">
                <input type="checkbox" ${window.localStorage["imgRes"]=="true"?"checked":""}/>
                <i class="mdui-switch-icon"></i>
            </label>
        </li>
        ${item("隨機圖片",window.localStorage["randomImgName"],"shuffle","settings/pic")}
        ${item("歌詞來源",window.localStorage["lrcSource"].toUpperCase(),"subtitles","","data-lrc-source")}
        ${item("關於","PokaPlayer "+window.localStorage["PokaPlayerVersion"],"info","settings/about","data-about")}
    </ul>`
    $("#content").html(header + settingItems);
    // 音質設定
    $("[data-music-res]").click(function() {
        mdui.dialog({
            title: '音質設定',
            content: `<ul class="mdui-list">
            <li class="mdui-list-item mdui-ripple" onclick="window.localStorage['musicRes']='mp3'" mdui-dialog-close>
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title">MP3</div>
                    <div class="mdui-list-item-text">128K，夭壽靠北，在網路夭壽慢的情況下請選擇此選項</div>
                </div>
            </li>
            <li class="mdui-list-item mdui-ripple" onclick="window.localStorage['musicRes']='wav'" mdui-dialog-close> 
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title">WAV</div>
                    <div class="mdui-list-item-text">較高音質，音質較原始音質略差，可在 4G 網路下流暢的串流</div>
                </div>
            </li>
            <li class="mdui-list-item mdui-ripple" onclick="window.localStorage['musicRes']='original'" mdui-dialog-close>
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title">Original</div>
                    <div class="mdui-list-item-text">原始音質，在網路狀況許可下，建議選擇此選項聆聽高音質音樂</div>
                </div>
            </li>
        </ul>`,
            history: false,
            buttons: [{
                text: '取消'
              }],
            onClose: ()=>$("[data-music-res] .mdui-list-item-text").text(window.localStorage["musicRes"].toUpperCase())
          });
          
    });
    // 圖片流量節省
    $("[data-imgRes]").click(function() {
        $("[data-imgRes] input").prop('checked', !$("[data-imgRes] input").prop('checked'))
        window.localStorage["imgRes"] = $("[data-imgRes] input").prop('checked');
        $("[data-imgRes] .mdui-list-item-text").text($("[data-imgRes] input").prop('checked') ? "已開啟" : "已關閉");
    });
    $("[data-lrc-source]").click(async function() {
        let isMetingEnabled = (await axios.get('/meting')).data.enabled
        mdui.dialog({
            title: '歌詞來源',
            content: `<ul class="mdui-list">
            <li class="mdui-list-item mdui-ripple" onclick="window.localStorage['lrcSource']='dsm'" mdui-dialog-close>
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title">DSM</div>
                    <div class="mdui-list-item-text">使用 DSM 當中的歌詞搜尋器</div>
                </div>
            </li>
            <li class="mdui-list-item mdui-ripple ${isMetingEnabled?"":"mdui-hidden"}" onclick="${isMetingEnabled?"window.localStorage['lrcSource']='meting'":''}" mdui-dialog-close> 
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title">Meting</div>
                    <div class="mdui-list-item-text">Meting, such a powerful music API framework</div>
                </div>
            </li>
        </ul>`,
            history: false,
            buttons: [{
                text: '取消'
              }],
            onClose: ()=>$("[data-lrc-source] .mdui-list-item-text").text(window.localStorage["lrcSource"].toUpperCase())
          });
    });
}
async function showSettingsTheme() {
    $('#content').attr('data-page', 'settings')
    let header = HTML.getHeader("設定 / 主題"), 
        settingItems = `<ul class="mdui-list">
        <li class="mdui-list-item mdui-ripple" onclick="router.navigate('settings')">
            <i class="mdui-list-item-icon mdui-icon material-icons">arrow_back</i>
            <div class="mdui-list-item-content">
                <div class="mdui-list-item-title mdui-list-item-one-line">返回</div>
                <div class="mdui-list-item-text mdui-list-item-one-line">回到設定頁面</div>
            </div>
        </li>
        <li class="mdui-list-item mdui-ripple" data-theme="mdui-theme-color">
            <i class="mdui-list-item-icon mdui-icon material-icons">color_lens</i>
            <div class="mdui-list-item-content">
                <div class="mdui-list-item-title mdui-list-item-one-line">主題色</div>
                <div class="mdui-list-item-text mdui-list-item-one-line">${window.localStorage["mdui-theme-color"]=='true'?'Dark':'Light'}</div>
            </div>
        </li>
        <li class="mdui-list-item mdui-ripple" data-theme="mdui-theme-primary">
            <i class="mdui-list-item-icon mdui-icon material-icons">color_lens</i>
            <div class="mdui-list-item-content">
                <div class="mdui-list-item-title mdui-list-item-one-line">主色</div>
                <div class="mdui-list-item-text mdui-list-item-one-line" style="text-transform:capitalize;">${window.localStorage["mdui-theme-primary"].replace("-"," ")}</div>
            </div>
        </li>
        <li class="mdui-list-item mdui-ripple" data-theme="mdui-theme-accent">
            <i class="mdui-list-item-icon mdui-icon material-icons">color_lens</i>
            <div class="mdui-list-item-content">
                <div class="mdui-list-item-title mdui-list-item-one-line">強調色</div>
                <div class="mdui-list-item-text mdui-list-item-one-line" style="text-transform:capitalize;">${window.localStorage["mdui-theme-accent"].replace("-"," ")}</div>
            </div>
        </li>
    </ul>`
    $("#content").html(header + settingItems)
    $('[data-theme="mdui-theme-color"]').click(function() {
        mdui.dialog({
            title: '設定主題色',
            content: `<ul class="mdui-list">
            <li class="mdui-list-item mdui-ripple" onclick="window.localStorage['mdui-theme-color']='false'" mdui-dialog-close>
                <div class="mdui-list-item-content">Light</div>
            </li>
            <li class="mdui-list-item mdui-ripple" onclick="window.localStorage['mdui-theme-color']='true'" mdui-dialog-close> 
                <div class="mdui-list-item-content">Dark</div>
            </li>
        </ul>`,
            history: false,
            buttons: [{
                text: '取消'
              }],
            onClose: ()=>{
                $('[data-theme="mdui-theme-color"] .mdui-list-item-text').text(window.localStorage["mdui-theme-color"]=='true'?'Dark':'Light')
                if (window.localStorage["mdui-theme-color"]== "true")
                    $('body').addClass("mdui-theme-layout-dark")
                else
                    $('body').removeClass("mdui-theme-layout-dark")
                    //設定顏色
                let metaThemeColor = document.querySelector("meta[name=theme-color]");
                metaThemeColor.setAttribute("content", $('header>div:first-child').css("background-color"));
            }
          });  
    });
    $('[data-theme="mdui-theme-primary"]').click(function() {
        let colorOption = (colors) => {
            let option = ''
            for (i = 0; i < colors.length; i++) {
                let color = colors[i]
                option += `
                <li class="mdui-list-item mdui-ripple" data-primary-color="${color}"> 
                    <div class="mdui-list-item-content mdui-text-color-${color}">${color.replace("-"," ")}</div>
                </li>`
            }
            return option
        }, 
        colors = ['red','pink','purple','deep-purple','indigo','blue','light-blue','cyan','teal','green','light-green','lime','yellow','amber','orange','deep-orange','brown','grey','blue-grey']
        mdui.dialog({
            title: '設定主色',
            content: `<ul class="mdui-list" style="text-transform:capitalize;">${colorOption(colors)}</ul>`,
            history: false,
            buttons: [{text: '確定'}]
        });  
        $('[data-primary-color]').click(function(){
            let color = $(this).attr('data-primary-color')
            let classStr = $('body').attr('class');
            let classes = classStr.split(' ');
            for (i = 0, len = classes.length; i < len; i++) {
                if (classes[i].indexOf('mdui-theme-primary-') === 0) {
                    $('body').removeClass(classes[i])
                }
            }
            $('[data-theme="mdui-theme-primary"] .mdui-list-item-text').text(color)
            $('body').addClass(`mdui-theme-primary-${color}`)
            window.localStorage["mdui-theme-primary"] = color
            //設定顏色
            let metaThemeColor = document.querySelector("meta[name=theme-color]");
            metaThemeColor.setAttribute("content", $('header>div:first-child').css("background-color"));
        })
    });
    $('[data-theme="mdui-theme-accent"]').click(function() {
        let colorOption = (colors, accent = false) => {
            let option = ''
            for (i = 0; i < colors.length; i++) {
                let color = colors[i]
                option += `
                <li class="mdui-list-item mdui-ripple" data-accent-color="${color}"> 
                    <div class="mdui-list-item-content mdui-text-color-${color}-accent">${color.replace("-"," ")}</div>
                </li>`
            }
            return option
        }, 
        colors = ['red','pink','purple','deep-purple','indigo','blue','light-blue','cyan','teal','green','light-green','lime','yellow','amber','orange','deep-orange']
        mdui.dialog({
            title: '設定強調色',
            content: `<ul class="mdui-list" style="text-transform:capitalize;">${colorOption(colors)}</ul>`,
            history: false,
            buttons: [{text: '確定'}]
        });  
        $('[data-accent-color]').click(function(){
            let color = $(this).attr('data-accent-color')
            let classStr = $('body').attr('class');
            let classes = classStr.split(' ');
            for (i = 0, len = classes.length; i < len; i++) {
                if (classes[i].indexOf('mdui-theme-accent-') === 0) {
                    $('body').removeClass(classes[i])
                }
            }
            $('[data-theme="mdui-theme-accent"] .mdui-list-item-text').text(color)
            window.localStorage["mdui-theme-accent"] = color
            $('body').addClass(`mdui-theme-accent-${color}`)
        })
    });
}
async function showSettingsPic() {
    $('#content').attr('data-page', 'settings')
    let header = HTML.getHeader("設定 / 隨機圖片")
    let settingItems = `<ul class="mdui-list">
        <li class="mdui-list-item mdui-ripple" onclick="router.navigate('settings')">
            <i class="mdui-list-item-icon mdui-icon material-icons">arrow_back</i>
            <div class="mdui-list-item-content">
                <div class="mdui-list-item-title mdui-list-item-one-line">返回</div>
                <div class="mdui-list-item-text mdui-list-item-one-line">回到設定頁面</div>
            </div>
        </li>
        <li class="mdui-list-item mdui-ripple" data-pic-source>
            <i class="mdui-list-item-icon mdui-icon material-icons">image</i>
            <div class="mdui-list-item-content">
                <div class="mdui-list-item-title mdui-list-item-one-line">圖片來源</div>
                <div class="mdui-list-item-text mdui-list-item-one-line">${window.localStorage["randomImgName"]}</div>
            </div>
        </li>
        <li class="mdui-list-item mdui-ripple" data-pic-custom-link>
            <i class="mdui-list-item-icon mdui-icon material-icons">link</i>
            <div class="mdui-list-item-content">
                <div class="mdui-list-item-title mdui-list-item-one-line">自訂圖片來源</div>
                <div class="mdui-list-item-text mdui-list-item-one-line">${window.localStorage["randomImg"]}</div>
            </div>
        </li>
    </ul>`
    $("#content").html(header + settingItems)
    $('[data-pic-source]').click(function() {
        let imgsOption = (imgs) => {
            let option = ''
            for (i = 0; i < imgs.length; i++) {
                let img = imgs[i]
                option += `
                <li class="mdui-list-item mdui-ripple" data-img-src="${img.src}" mdui-dialog-close> 
                    <div class="mdui-list-item-content">${img.name}</div>
                </li>`
            }
            return option
        }, 
         imgs = [{
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
        mdui.dialog({
            title: '設定圖片來源',
            content: `<ul class="mdui-list">${imgsOption(imgs)}</ul>`,
            history: false
        });
        $('[data-img-src]').click(function(){
            let src = $(this).attr('data-img-src')
            let name = $(this).children().text()
            window.localStorage["randomImg"] = src
            window.localStorage["randomImgName"] = name
            $('#header-wrapper').attr("style", `background-image: url(${src});`)
            $('[data-pic-source] .mdui-list-item-text').text(name)
            $('[data-pic-custom-link] .mdui-list-item-text').text(src)
        })
    });
    $('[data-pic-custom-link]').click(function(){
        mdui.prompt('請輸入圖片網址', '自訂圖片來源',
            value => {
                if (value){
                    window.localStorage["randomImg"] = value
                    $('[data-pic-custom-link] .mdui-list-item-text').text(value)
                    window.localStorage["randomImgName"] = "自訂"
                    $('#header-wrapper').attr("style", `background-image: url(${value});`)
                }
            },
            function (value) {},
            {
                history: false
            }
        );
    })
}
async function showSettingsAbout() {
    $('#content').attr('data-page', 'settings')
    let header = HTML.getHeader("設定 / 關於")
    let settingItems = `<ul class="mdui-list">
        <li class="mdui-list-item mdui-ripple" onclick="router.navigate('settings')">
            <i class="mdui-list-item-icon mdui-icon material-icons">arrow_back</i>
            <div class="mdui-list-item-content">
                <div class="mdui-list-item-title mdui-list-item-one-line">返回</div>
                <div class="mdui-list-item-text mdui-list-item-one-line">回到設定頁面</div>
            </div>
        </li>
        <li class="mdui-list-item mdui-ripple" data-upgrade>
            <i class="mdui-list-item-icon mdui-icon material-icons">system_update</i>
            <div class="mdui-list-item-content">
                <div class="mdui-list-item-title mdui-list-item-one-line">更新</div>
                <div class="mdui-list-item-text mdui-list-item-one-line">正在檢查更新...</div>
            </div>
        </li>
        <li class="mdui-list-item mdui-ripple" data-dev>
            <i class="mdui-list-item-icon mdui-icon material-icons">supervisor_account</i>
            <div class="mdui-list-item-content">
                <div class="mdui-list-item-title mdui-list-item-one-line">開發者</div>
                <div class="mdui-list-item-text mdui-list-item-one-line">載入中...</div>
            </div>
        </li>
        <a class="mdui-list-item mdui-ripple" href="https://github.com/gnehs/PokaPlayer" target="_blank">
            <i class="mdui-list-item-icon mdui-icon material-icons">language</i>
            <div class="mdui-list-item-content">
                <div class="mdui-list-item-title mdui-list-item-one-line">GitHub</div>
                <div class="mdui-list-item-text mdui-list-item-one-line">前往 PokaPlayer 的 GitHub</div>
            </div>
        </a>
        <li class="mdui-list-item mdui-ripple" data-restart>
            <i class="mdui-list-item-icon mdui-icon material-icons">refresh</i>
            <div class="mdui-list-item-content">
                <div class="mdui-list-item-title mdui-list-item-one-line">重新啟動</div>
                <div class="mdui-list-item-text mdui-list-item-one-line">process.exit()</div>
            </div>
        </li>
        <li class="mdui-list-item mdui-ripple" data-as-version>
            <i class="mdui-list-item-icon mdui-icon material-icons">info</i>
            <div class="mdui-list-item-content">
                <div class="mdui-list-item-title mdui-list-item-one-line">Audio Station 版本</div>
                <div class="mdui-list-item-text mdui-list-item-one-line">載入中...</div>
            </div>
        </li>
        <li class="mdui-list-item mdui-ripple" data-version>
            <i class="mdui-list-item-icon mdui-icon material-icons">info</i>
            <div class="mdui-list-item-content">
                <div class="mdui-list-item-title mdui-list-item-one-line">PokaPlayer 版本</div>
                <div class="mdui-list-item-text mdui-list-item-one-line">${window.localStorage["PokaPlayerVersion"]}</div>
            </div>
        </li>
    </ul>`
    $("#content").html(header + settingItems)
    
    // DSM 詳細資料
    let getDSMInfo = await getAPI("AudioStation/info.cgi", "SYNO.AudioStation.Info", "getinfo", [], 4)
    $("[data-as-version] .mdui-list-item-text").text(getDSMInfo.data.version_string?getDSMInfo.data.version_string:"未知")

    // PokaPlayer 詳細資料
    let getInfo = await axios.get('/info/');
    $("[data-dev] .mdui-list-item-text").text(getInfo.data.author)
    let debug = await axios.get('/debug/')
    let checkUpdate = await axios.get(`https://api.github.com/repos/gnehs/PokaPlayer/releases`);
    let update = getInfo.data.version != checkUpdate.data[0].tag_name ? `更新到 ${checkUpdate.data[0].tag_name}` : debug.data == false ? `您的 PokaPlayer 已是最新版本` : `與開發分支同步`
    $("[data-upgrade] .mdui-list-item-text").text(update)
    if (getInfo.data.version != checkUpdate.data[0].tag_name || debug.data)
        $("[data-upgrade]").attr('data-upgrade', true)
    if (debug.data)
        $("[data-version] .mdui-list-item-text").text(`${window.localStorage["PokaPlayerVersion"]}(${debug.data})`)
    //重啟
    $("[data-restart]").click(() => {
        mdui.confirm('這將導致您在重新啟動完畢前暫時無法使用 PokaPlayer', '確定要重新啟動嗎', 
            function(){
                mdui.alert('正在重新啟動','','',{history: false});
                axios.post('/restart')
            },'',{history: false})
    })
    //更新
    $("[data-upgrade=\"true\"]").click(() => {
        mdui.dialog({
            title: '您確定要更新嗎',
            content: '這將導致您在更新完畢前暫時無法使用 PokaPlayer',
            history: false,
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