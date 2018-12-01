// 初始化網頁
$(function () {
    let userPASS = localStorage["userPASS"]
    if (userPASS && userPASS != "false") {
        $("#userPASS").val('userPASS')
    }
    $("#userPASS").keypress(function (event) {
        if (event.keyCode == 13) {
            check()
        }
    });
    $("main>.mdui-center").addClass($("body").hasClass("mdui-theme-layout-dark") ? "mdui-color-black" : "mdui-color-white")
    $("main").addClass('animated zoomIn')
    $("main").attr('style', 'margin-top:25vh;')
});

function check() {
    let userpass = $("#userPASS").val()
    localStorage["userPASS"] = userpass
    userpass ? login($("#userPASS").val()) : mdui.snackbar({
        message: '密碼不得為空',
        timeout: 1000
    });
}

function login(password) {
    $.post("/login/", {
        userPASS: password
    }, data => {
        if (data == 'success') {
            mdui.snackbar({
                message: '登入成功',
                timeout: 1000
            });
            $('header').removeAttr('style')
            document.location.href = "/";
        } else mdui.snackbar({
            message: '登入失敗',
            timeout: 1000
        });
    });
}