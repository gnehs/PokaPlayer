// 初始化網頁
$(function () {
    let userPASS = localStorage["userPASS"]
    if (userPASS && userPASS != "false") {
        mdui.snackbar({
            message: '偵測到已儲存的密碼',
            buttonText: '登入',
            onButtonClick: () => {
                login(userPASS)
            },
            timeout: 10 * 1000 //10s
        });
    }
    $("#userPASS").keypress(function (event) {
        if (event.keyCode == 13) {
            check()
        }
    });
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
            document.location.href = "/";
        } else mdui.snackbar({
            message: '登入失敗',
            timeout: 1000
        });
    });
}