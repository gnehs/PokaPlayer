$(() => {
    $("#colortheme").text(`:root {
        --poka-theme-primary-color: ${localStorage["poka-theme-primary"]};
        --poka-theme-primary-text-color: ${localStorage["poka-theme-primary-text"]};
    }`)

    // 顏色設定
    $('body').addClass(`mdui-theme-primary-${localStorage["mdui-theme-primary"]}`)
    if (localStorage["mdui-theme-color"] == "true")
        $('body').addClass("mdui-theme-layout-dark theme-dark")

    // 設定狀態欄顏色
    $("meta[name=theme-color]").attr("content", $('header>div:first-child').css("background-color"));
});