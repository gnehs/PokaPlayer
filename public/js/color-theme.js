$(() => {
    if (localStorage["change-color"] == "true") {
        $("#colortheme").text(`:root {
             --poka-theme-primary-color: ${localStorage["poka-theme-primary"]};
             --poka-theme-primary-text-color: ${localStorage["poka-theme-primary-text"]};
         }`)
        $('head').append(`<link rel="stylesheet" type="text/css" href="/css/color-theme.css?${Math.random()}">`);
    }
    // 顏色設定
    $('body').addClass(`mdui-theme-primary-${window.localStorage["mdui-theme-primary"]}`)
    $('body').addClass(`mdui-theme-accent-${window.localStorage["mdui-theme-accent"]}`)
    if (window.localStorage["mdui-theme-color"] == "true")
        $('body').addClass("mdui-theme-layout-dark")

    // 設定狀態欄顏色
    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    metaThemeColor.setAttribute("content", $('header>div:first-child').css("background-color"));
});