String.prototype.render = function (context) {
    return this.replace(/{{(.*?)}}/g, (match, key) => context[key.trim()]);
};
window.onload = async () => {
    $("#player .song-info .artist").text(lang("nowplaying_clickPlayRandom"))
    setDrawerLang()
    console.log(`[Lang] ${localStorage["pokaLang"]}`)
    await updateLang()
}


function lang(code) {
    return JSON.parse(localStorage["pokaLangData"])[code] || JSON.parse(localStorage["pokaLangDataEn"])[code] || ""
}
async function setLang(code) {
    let langData = await getLangs()
    if (langData[code]) {
        console.log(`[Lang] set as ${code}`)
        localStorage["pokaLang"] = code
        await updateLang()
        setDrawerLang()
        // 隨便更新下語言設定頁面的 Header
        if (location.pathname == "/settings/lang") {
            pokaHeader(lang("settings_lang"), lang("settings"))
            $(`[onclick="router.navigate('settings')"] .mdui-list-item-content`).text(lang("back"))
        }
    } else {
        console.error(`[Lang] No such language`)
    }
}

async function updateLang() {
    let langinitialization = localStorage["pokaLangData"] == `{}`
    localStorage["pokaLangData"] = JSON.stringify(await getLang(localStorage["pokaLang"]))
    localStorage["pokaLangDataEn"] = JSON.stringify(await getLang('en-US'))
    if (langinitialization) {
        console.log(langinitialization);
        location.reload();
    }
}

async function getLangs() {
    let getLangJson = await fetch("/langs/lang.json")
    return (await getLangJson.json())
}
async function getLang(code) {
    let getLangJson = await fetch(`/langs/${code}.json`)
    return (await getLangJson.json())
}

function setDrawerLang() {
    let drawerItems = {
        "home": lang("home"),
        "now": lang("nowplaying"),
        "lrc": lang("lrc"),
        "search": lang("search"),
        "album": lang("album"),
        "folder": lang("folder"),
        "artist": lang("artist"),
        "composer": lang("composer"),
        "playlist": lang("playlist"),
        "settings": lang("settings")
    }

    for (item of Object.keys(drawerItems)) {
        $(`#drawer .item[href="${item}"]>.content`).text(drawerItems[item])
    }
}