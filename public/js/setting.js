// 初始化設定值
$(async() => {
    ///給定預設值
    if (!window.localStorage["musicRes"]) window.localStorage["musicRes"] = "High"
    if (!window.localStorage["randomImg"]) window.localStorage["randomImg"] = "/og/og.png"
    if (!window.localStorage["randomImgName"]) window.localStorage["randomImgName"] = "預設圖庫"
    if (!window.localStorage["imgRes"]) window.localStorage["imgRes"] = "false"
    let version = (await request('/info/')).version
        //serviceWorker
    if ('serviceWorker' in navigator && !await request('/debug/')) {
        navigator.serviceWorker
            .register('/sw.js', { scope: '/' })
            .then(reg => {
                if (version != window.localStorage["PokaPlayerVersion"]) reg.update()
            })
            .catch(err => console.log('Error!', err));
    }
    // 更新版本號
    if (version != window.localStorage["PokaPlayerVersion"]) {
        if ($("#content").attr("data-page") == "settings" || $("#content").attr("data-page") == "home")
            $("#header-wrapper .title .subtitle").text(`PokaPlayer ${version}`)
    }
    window.localStorage["PokaPlayerVersion"] = version;
});
//- 設定頁面用的範本
var settingsItem = (title, text = '', icon = '', link = '', data = '', other = '', cssClass = '') => {
        return `<li class="mdui-list-item mdui-ripple ${cssClass}" ${link?`onclick="router.navigate('${link}')"`:''} ${data}>
    ${icon?`<i class="mdui-list-item-icon mdui-icon material-icons">${icon}</i>`:''}
    <!-- 有 text 才輸出 Title 跟 Text -->
    ${text != '' ? `<div class="mdui-list-item-content">
        <div class="mdui-list-item-title">${title}</div>
        <div class="mdui-list-item-text">${text}</div>
    </div>` : `<div class="mdui-list-item-content">${title}</div>`}
    ${other}
    </li>`
}
//- 設定
async function showSettings() {
    $('#content').attr('data-page', 'settings')
    
    pokaHeader('設定', "PokaPlayer "+window.localStorage["PokaPlayerVersion"])
    let settingItems = `<ul class="mdui-list">
        ${settingsItem("主題","設定主題色、主色及強調色","color_lens","settings/theme")}
        ${settingsItem("音質",window.localStorage["musicRes"],"music_note","","data-music-res")}
        ${settingsItem("圖片流量節省",window.localStorage["imgRes"]=="true"? "已開啟" : "已關閉","image","","data-imgRes",
        `<label class="mdui-switch">
            <input type="checkbox" ${window.localStorage["imgRes"]=="true"?"checked":""}/>
            <i class="mdui-switch-icon"></i>
        </label>`)} 
        ${settingsItem("隨機圖片",window.localStorage["randomImgName"],"shuffle","settings/pic")}
        ${settingsItem("關於","PokaPlayer "+window.localStorage["PokaPlayerVersion"],"info","settings/about","data-about")}
    </ul>`
    $("#content").html(settingItems);
    // 音質設定
    $("[data-music-res]").click(function() {
        mdui.dialog({
            title: '音質設定',
            content: `</br>
            <div class="poka four doubling cards">
                <div class="card" 
                    title="低音質"
                    onclick="window.localStorage['musicRes']='Low'"
                    mdui-dialog-close>
                    <div class="image mdui-ripple"><i class="mdui-icon">Low</i></div>
                    <div class="title mdui-text-color-theme-text">Low</div>
                    <div class="subtitle mdui-text-color-theme-text">
                        低音質，128K，跟 YouTube 差不多的爛音質，在網路夭壽慢的情況下請選擇此選項
                    </div>
               </div>
                <div class="card" 
                    title="中等音質"
                    onclick="window.localStorage['musicRes']='Medium'"
                    mdui-dialog-close>
                    <div class="image mdui-ripple"><i class="mdui-icon">Med</i></div>
                    <div class="title mdui-text-color-theme-text">Medium</div>
                    <div class="subtitle mdui-text-color-theme-text">
                        中等音質，音質只比 YouTube 好那麼一點點，可在 3G 網路下流暢的串流
                    </div>
               </div>
                <div class="card" 
                    title="高音質"
                    onclick="window.localStorage['musicRes']='High'"
                    mdui-dialog-close>
                    <div class="image mdui-ripple"><i class="mdui-icon">High</i></div>
                    <div class="title mdui-text-color-theme-text">High</div>
                    <div class="subtitle mdui-text-color-theme-text">
                        高音質，音質較原始音質略差，可在 4G 網路下流暢的串流
                    </div>
               </div>
                <div class="card" 
                    title="原始音質"
                    onclick="window.localStorage['musicRes']='Original'"
                    mdui-dialog-close>
                    <div class="image mdui-ripple"><i class="mdui-icon">Ori</i></div>
                    <div class="title mdui-text-color-theme-text">Original</div>
                    <div class="subtitle mdui-text-color-theme-text">
                        原始音質，在網路狀況許可下，建議選擇此選項聆聽高音質音樂
                    </div>
               </div>
            </div>`,
            history: false,
            buttons: [{
                text: '取消'
              }],
            onClose: ()=>$("[data-music-res] .mdui-list-item-text").text(window.localStorage["musicRes"])
          });
    });
    // 圖片流量節省
    $("[data-imgRes]").click(function() {
        $("[data-imgRes] input").prop('checked', !$("[data-imgRes] input").prop('checked'))
        window.localStorage["imgRes"] = $("[data-imgRes] input").prop('checked');
        $("[data-imgRes] .mdui-list-item-text").text($("[data-imgRes] input").prop('checked') ? "將會把所有圖片替換為您指定的隨機圖片" : "已關閉");
    });
}
async function showSettingsTheme() {
    $('#content').attr('data-page', 'settings')
    pokaHeader('設定', '主題' )
    let settingItems = `<ul class="mdui-list">
        ${settingsItem("返回","","arrow_back","settings")}
        ${settingsItem("主題色",window.localStorage["mdui-theme-color"]=='true'?'Dark':'Light',"color_lens","",`data-theme="mdui-theme-color"`)}
        ${settingsItem("主色",window.localStorage["mdui-theme-primary"].replace("-"," "),"color_lens","",`data-theme="mdui-theme-primary"`)}
        ${settingsItem("強調色",window.localStorage["mdui-theme-accent"].replace("-"," "),"color_lens","",`data-theme="mdui-theme-accent"`)}
    </ul>`
    $("#content").html( settingItems)
    $('[data-theme="mdui-theme-color"]').click(function() {
        mdui.dialog({
            title: '設定主題色',
            content: `<ul class="mdui-list">
            ${settingsItem("Light","","","",
                            `onclick="window.localStorage['mdui-theme-color']='false'" mdui-dialog-close`)}
            ${settingsItem("Dark","","","",
                            `onclick="window.localStorage['mdui-theme-color']='true'" mdui-dialog-close`)}
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
    $('[data-theme="mdui-theme-primary"],[data-theme="mdui-theme-accent"]').click(function() {
        let accent = $(this).attr('data-theme')=="mdui-theme-accent", 
            option = '',
            colors = ['red','pink','purple','deep-purple','indigo','blue','light-blue','cyan','teal','green','light-green','lime','yellow','amber','orange','deep-orange','brown','grey','blue-grey']
        for (i = 0 ; i < colors.length; i++) {
            if (i<= (colors.length - 3 - 1) && accent || !accent){
                let color = colors[i]
                option += `
                <li class="mdui-list-item mdui-ripple" 
                    data-color-type="${accent ? `accent` : `primary`}"
                    data-color="${color}"> 
                    <div class="mdui-list-item-content mdui-text-color-${color}${accent?'-accent':''}">${color.replace("-"," ")}</div>
                </li>`
            }
        }
        mdui.dialog({
            title: `設定${accent ? `強調色` : `主色`}`,
            content: `<ul class="mdui-list" style="text-transform:capitalize;">${option}</ul>`,
            history: false,
            buttons: [{text: '確定'}]
        });  
        $('[data-color-type]').click(function(){
            let isAccent= $(this).attr('data-color-type') == "accent"
            let color = $(this).attr('data-color')
            let classStr = $('body').attr('class');
            let classes = classStr.split(' ');
            for (i = 0, len = classes.length; i < len; i++) {
                if (classes[i].indexOf(`mdui-theme-${isAccent?'accent':'primary'}-`) === 0) {
                    $('body').removeClass(classes[i])
                }
            }
            $('[data-theme="mdui-theme-primary"] .mdui-list-item-text').text(color)
            $('body').addClass(`mdui-theme-${isAccent?'accent':'primary'}-${color}`)
            window.localStorage[`mdui-theme-${isAccent?'accent':'primary'}`] = color
            if(!isAccent){
                //設定顏色
                let metaThemeColor = document.querySelector("meta[name=theme-color]");
                metaThemeColor.setAttribute("content", $('header>div:first-child').css("background-color"));
            }
        })
    });
}
async function showSettingsPic() {
    $('#content').attr('data-page', 'settings')
    pokaHeader('設定', '隨機圖片' )
    let settingItems = `<ul class="mdui-list">
        ${settingsItem("返回","","arrow_back","settings")}
        ${settingsItem("圖片來源",window.localStorage["randomImgName"],"image","","data-pic-source")}
        ${settingsItem("自訂圖片來源",window.localStorage["randomImg"],"link","","data-pic-custom-link")}
    </ul>`
    $("#content").html(settingItems)
    $('[data-pic-source]').click(function() {
        let imgsOption = imgs => {
            /*let option = ''
            for (i = 0; i < imgs.length; i++) {
                let img = imgs[i]
                option += settingsItem(img.name,  '', '',  '', `data-img-src="${img.src}" mdui-dialog-close`)
            }
            return option*/
            let option =  `<div class="poka three cards">`
            for (i = 0; i < imgs.length; i++) {
                let img = imgs[i]
                option += `
                <a class="card" 
                   title="${img.name}&#10;${img.description}"
                   data-img-src="${img.src}" mdui-dialog-close>
                    <div class="image mdui-ripple" style="background-image:url('${img.src}')"></div>
                    <div class="title mdui-text-color-theme-text mdui-text-truncate">${img.name}</div>
                    <div class="subtitle mdui-text-color-theme-text mdui-text-truncate">${img.description}</div>
                </a>`
            }
            option += "</div>"
            return option
        }, 
         imgs = [{
            name: '預設圖庫',
            description: 'PokaPlayer 內建的圖庫',
            src: '/og/og.png'
        }, {
            name: '隨機精美圖片',
            description: 'yingjoy.cn 提供',
            src: 'https://api.yingjoy.cn/pic/?t=random&w=1920'
        }, {
            name: 'LoremFlickr',
            description: 'loremflickr.com 提供',
            src: 'https://loremflickr.com/1920/1080'
        }, {
            name: 'Bing 每日圖片',
            description: 'yingjoy.cn 提供',
            src: 'https://api.yingjoy.cn/pic/?t=bing&w=1920'
        }, {
            name: 'Bing 每日圖片',
            description: 'area.sinaapp.com 提供',
            src: 'https://area.sinaapp.com/bingImg/'
        }, {
            name: 'Bing 每日圖片',
            description: '阿星 Plus 提供',
            src: 'https://api.meowv.com/bing'
        }, {
            name: 'Bing 隨機圖片',
            description: 'uploadbeta.com 提供',
            src: 'https://uploadbeta.com/api/pictures/random/?key=BingEverydayWallpaperPicture'
        }, {
            name: 'Picsum Photos',
            description: 'picsum.photos 提供',
            src: 'https://picsum.photos/1920/1080/?random'
        }, {
            name: 'The Dog API',
            description: 'GIF 格式，thedogapi.com 提供',
            src: 'https://api.thedogapi.com/v1/images/search?format=src&mime_types=image/gif'
        }, {
            name: 'The Dog API',
            description: 'PNG 格式，thedogapi.com 提供',
            src: 'https://api.thedogapi.com/v1/images/search?format=src&mime_types=image/png'
        }, {
            name: 'The Cat API',
            description: 'GIF 格式，thecatapi.com 提供',
            src: 'https://thecatapi.com/api/images/get?format=src&type=gif'
        }, {
            name: 'The Cat API',
            description: 'PNG 格式，thecatapi.com 提供',
            src: 'https://thecatapi.com/api/images/get?format=src&type=png'
        },  {
            name: 'Unsplash Source',
            description: 'source.unsplash.com 提供',
            src: 'https://source.unsplash.com/random'
        },  {
            name: '隨機二次元圖片',
            description: '清風博客提供',
            src: 'https://api.3ewl.cc/acg/img.php'
        }, {
            name: '隨機二次元背景',
            description: '雲圖床提供',
            src: 'https://api.yuntuchuang.com/api/acg.php'
        },  {
            name: '隨機遊戲背景',
            description: '雲圖床提供',
            src: 'https://api.yuntuchuang.com/api/youxi.php'
        },  {
            name: '隨機簡約背景',
            description: '雲圖床提供',
            src: 'https://api.yuntuchuang.com/api/jianyue.php'
        }]
        mdui.dialog({
            title: '設定圖片來源',
            content: `<ul class="mdui-list">${imgsOption(imgs)}</ul>`,
            history: false,
            buttons: [{text: '取消'}]
        });
        $('[data-img-src]').click(function(){
            let src = $(this).attr('data-img-src')
            let name = $(this).children('.title').text()
            window.localStorage["randomImg"] = src
            window.localStorage["randomImgName"] = name
            pokaHeader('設定', '隨機圖片',src,false,false)
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
                    pokaHeader('設定', '隨機圖片',value,false,false)
                }
            },()=>{},{history: false}
        );
    })
}
async function showSettingsAbout() {
    $('#content').attr('data-page', 'settings')
    pokaHeader('設定', '關於')
    let settingItems = `<ul class="mdui-list">
        ${settingsItem("返回","","arrow_back","settings")}
        ${settingsItem("更新","正在檢查更新...","system_update","","data-upgrade")}
        ${settingsItem("開發者","載入中...","supervisor_account","","data-dev")}
        ${settingsItem("GitHub","前往 PokaPlayer 的 GitHub","language","",`onclick="window.open('https://github.com/gnehs/PokaPlayer')"`)}
        ${settingsItem("錯誤回報","若有任何錯誤或是建議歡迎填寫，並協助我們變得更好","feedback","",`onclick="window.open('https://github.com/gnehs/PokaPlayer/issues/new/choose')"`)}
        ${settingsItem("PokaPlayer 版本",window.localStorage["PokaPlayerVersion"],"info","","data-version")}
        ${settingsItem("嘗試重新登入","","account_circle","",`onclick="location.href='/login'"`)}
        ${settingsItem("清除 Service Worker 快取","","delete_forever","","data-clean")}
        ${settingsItem("重新啟動","","refresh","","data-restart")}
    </ul>`
    $("#content").html(settingItems)
    
    //重啟
    $("[data-restart]").click(() => {
        mdui.confirm('注意：若您未開啟 Docker 的自動重啟功能，您必須手動開啟 PokaPlayer', '確定要重新啟動嗎', 
            ()=>{
                mdui.alert('正在重新啟動','','',{history: false});
                axios.post('/restart')
            },()=>{},{history: false})
    })
    // 快取清理
    $("[data-clean]").click(() => {
        mdui.confirm('確定要清除嗎', '清除 Service Worker 快取', 
            ()=>caches.delete('PokaPlayer'),()=>{},{history: false})
    })
    
    // PokaPlayer 詳細資料
    let getInfo = await request('/info/');
    $("[data-dev] .mdui-list-item-text").text(getInfo.author)
    let debug = await request('/debug/')
    let checkUpdate = await request(`https://api.github.com/repos/gnehs/PokaPlayer/releases`);
    let update = getInfo.version != checkUpdate[0].tag_name ? `更新到 ${checkUpdate[0].tag_name}` : `您的 PokaPlayer 已是最新版本`
    if (debug){ 
        pokaHeader('設定', `開發模式`)
        $("[data-upgrade]").attr('data-upgrade', true)
        update = `與開發分支同步`
        $("[data-version] .mdui-list-item-text").text(`${window.localStorage["PokaPlayerVersion"]}(${debug})`)
    } else if (getInfo.version != checkUpdate[0].tag_name){
        $("[data-upgrade]").attr('data-upgrade', true)
        pokaHeader('設定', `可更新至 ${checkUpdate[0].tag_name}`)
    } 
    $("[data-upgrade] .mdui-list-item-text").text(update)
    
    //更新
    $("[data-upgrade=\"true\"]").click(() => {
        mdui.dialog({
            title:`${checkUpdate[0].tag_name} 更新日誌`,
            content: `<div class="mdui-typo">
                            <blockquote style="margin:0">
                                ${new showdown.Converter().makeHtml(checkUpdate[0].body)}
                            </blockquote>
                        <hr>
                        </div>
                        注意：若您未開啟 Docker 的自動重啟功能，您必須手動開啟 PokaPlayer`,
            history: false,
            buttons: [{
                    text: '取消'
                },
                {
                    text: '更新',
                    onClick: async inst => {
                        mdui.snackbar('正在更新...', { position: getSnackbarPosition() });
                        let update = await request('/upgrade/')
                        if (update == "upgrade") {
                            mdui.snackbar('伺服器重新啟動', {
                                buttonText: '重新連接',
                                onButtonClick: () => window.location.reload(),
                            })
                        } else if (update == "socket") {
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
                                reset: '更新檔下載完成',
                                api: 'API 更新完成'
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