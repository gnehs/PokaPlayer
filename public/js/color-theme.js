$(() => {
    $("#colortheme").text(`:root {
        --poka-theme-primary-color: ${_setting(`themeColor`)};
        --poka-theme-primary-text-color: ${_setting(`themeTextColor`)};
    }`)

    // 顏色設定
    $('body').addClass(`mdui-theme-primary-${localStorage["mdui-theme-primary"]}`)
    if (_setting(`darkMode`))
        $('body').addClass("mdui-theme-layout-dark theme-dark")

    // 設定狀態欄顏色
    $("meta[name=theme-color]").attr("content", $('header>div:first-child').css("background-color"));
});