// 初始化網頁
$(function () {
    let userPASS = localStorage["userPASS"]
    if (userPASS && userPASS != "false") {
        $("#userPASS").val(userPASS)
    }
    $("#userPASS").keypress(function (event) {
        if (event.keyCode == 13) {
            check()
        }
    });
    $(`input[id="userPASS"]`).focus()
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
            $("main").animateCss('zoomOut', function () {
                $("main").remove()
                document.location.href = "/";
            })
        } else mdui.snackbar({
            message: '登入失敗',
            timeout: 1000
        });
    });
}