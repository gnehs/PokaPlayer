$(() => {
    if (localStorage["change-color"] == "true") {
        $("#colortheme").text(`:root {
             --poka-theme-primary-color: ${localStorage["poka-theme-primary"]};
             --poka-theme-primary-text-color: ${localStorage["poka-theme-primary-text"]};
         }`)
        $('body').attr('color-theme', 'true')
    }
    // 顏色設定
    $('body').addClass(`mdui-theme-primary-${localStorage["mdui-theme-primary"]}`)
    $('body').addClass(`mdui-theme-accent-${localStorage["mdui-theme-accent"]}`)
    if (localStorage["mdui-theme-color"] == "true")
        $('body').addClass("mdui-theme-layout-dark")

    // 設定狀態欄顏色
    $("meta[name=theme-color]").attr("content", $('header>div:first-child').css("background-color"));
});