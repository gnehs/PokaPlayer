$(function() {
    // 檢查有沒有設定顏色
    if (window.localStorage["mdui-theme-primary"]) {
        var classStr = $('body').attr('class');
        var classs = classStr.split(' ');
        for (i = 0, len = classs.length; i < len; i++) {
            if (classs[i].indexOf('mdui-theme-primary-') === 0) {
                $('body').removeClass(classs[i])
            }
        }
        $('body').addClass(`mdui-theme-primary-${window.localStorage["mdui-theme-primary"]}`)
            //設定顏色
        var metaThemeColor = document.querySelector("meta[name=theme-color]");
        metaThemeColor.setAttribute("content", $('header>div:first-child').css("background-color"));
    } else {
        window.localStorage["mdui-theme-primary"] = indigo
    }
    if (window.localStorage["mdui-theme-accent"]) {
        var classStr = $('body').attr('class');
        var classs = classStr.split(' ');
        for (i = 0, len = classs.length; i < len; i++) {
            if (classs[i].indexOf('mdui-theme-accent-') === 0) {
                $('body').removeClass(classs[i])
            }
        }
        $('body').addClass(`mdui-theme-accent-${window.localStorage["mdui-theme-accent"]}`)
    } else window.localStorage["mdui-theme-accent"] = pink
    if (window.localStorage["mdui-theme-color"] == "true") {
        $('body').addClass("mdui-theme-layout-dark")
    }

});