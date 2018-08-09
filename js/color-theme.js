$(function() {
    // 檢查有沒有設定顏色
    if (!window.localStorage["mdui-theme-primary"])
        window.localStorage["mdui-theme-primary"] = "indigo"
    if (!window.localStorage["mdui-theme-accent"])
        window.localStorage["mdui-theme-accent"] = "pink"

    // 顏色設定
    $('body').addClass(`mdui-theme-primary-${window.localStorage["mdui-theme-primary"]}`)
    $('body').addClass(`mdui-theme-accent-${window.localStorage["mdui-theme-accent"]}`)
    if (window.localStorage["mdui-theme-color"] == "true")
        $('body').addClass("mdui-theme-layout-dark")

    // 設定狀態欄顏色
    var metaThemeColor = document.querySelector("meta[name=theme-color]");
    metaThemeColor.setAttribute("content", $('header>div:first-child').css("background-color"));
});