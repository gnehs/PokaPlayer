/*
    For Install Page
    /install
    @author gnehs 
*/
$(() => {
    $('.ui.dropdown').dropdown()
    $('.ui.radio.checkbox').checkbox()
    $('input[name="pokasessionsecret"]').val(Math.random().toString(36).substring(2))
    $('#submit').click(async function() {
        let poka = $(`.ui.form[data-install="poka"]`).submit().hasClass('success')
        let netease = $(`.ui.form[data-install="netease"]`).submit().hasClass('success')
        let dsm = $(`.ui.form[data-install="dsm"]`).submit().hasClass('success')
        if (poka && netease && dsm) {
            let data = $('#content').form('get values')
            let config = {
                "PokaPlayer": {
                    "password": data.pokapassword,
                    "passwordSwitch": data.pokapass == "on",
                    "adminPassword": data.pokaadminpassword,
                    "sessionSecret": data.pokasessionsecret,
                    "instantUpgradeProcess": data.instantUpgradeProcess == "true",
                    "debug": data.pokadev == "true"
                },
                "DSM": {
                    "enabled": data.dsmenabled == "on",
                    "protocol": data.dsmprotocol,
                    "host": data.dsmhost,
                    "port": data.dsmport,
                    "account": data.dsmaccount,
                    "password": data.dsmpassword
                },
                "Netease2": {
                    "enabled": data.neteaseenabled == "on",
                    "server": data.neteaseprotocol + '://' + data.neteasehost + ':' + data.neteaseport + '/',
                    "isPremium": false,
                    "topPlaylist": {
                        "enabled": data.neteaseplaylist.includes('topPlaylist'),
                        "category": "ACG",
                        "limit": 5,
                        "order": "hot",
                        "image": "/img/topPlaylist.png"
                    },
                    "login": {
                        "phone": data.neteaseaccounttype == "phone" ? data.neteaseaccount : null,
                        "email": data.neteaseaccounttype == "email" ? data.neteaseaccount : null,
                        "password": data.neteasepassword
                    },
                    "dailyRecommendSongs": {
                        "enabled": data.neteaseplaylist.includes('dailyRecommendsongs'),
                        "image": "/img/dailyRecommendSongs.png"
                    },
                    "dailyRecommendPlaylists": {
                        "enabled": data.neteaseplaylist.includes('dailyRecommendplaylist'),
                        "image": "/img/dailyRecommendPlaylists.png"
                    },
                    "hqPlaylist": {
                        "enabled": data.neteaseplaylist.includes('hqPlaylist'),
                        "category": "ACG",
                        "limit": 5,
                        "image": "/img/hqPlaylist.png"
                    }
                }
            }
            let testDsm = data.dsmenabled == "on" ? (await axios.post('/installapi/dsm', config["DSM"])).data : true,
                testNetease = data.neteaseenabled == "on" ? (await axios.post('/installapi/netease2', config["Netease2"])).data : true;
            if (testDsm && testNetease) {
                let sendConfig = (await axios.post('/installapi/config', config)).data
                if (sendConfig == "done") {
                    $('#done').modal({ closable: false }).modal('show')
                    self.setInterval("pingServer()", 3000)
                } else {
                    $('#error>.content').html(sendConfig)
                    $('#error').modal('show')
                }
            } else {
                let content = `<p>您填寫的資料不正確</p>`
                content += testDsm ? `` : `<p>DSM 填寫有誤</p>`
                content += testNetease ? `` : `<p>Netease 填寫有誤</p>`
                $('#error>.content').html(content)
                $('#error').modal('show')
            }
        } else
            $('#somthingError').modal('show');
    })
    $('.ui.form[data-install="poka"]').form({
        inline: true,
        on: 'blur',
        fields: {
            pokasessionsecret: {
                identifier: 'pokasessionsecret',
                rules: [{
                    type: 'empty',
                    prompt: 'Session secret 不得為空'
                }]
            },
            pokapassword: {
                identifier: 'pokapassword',
                depends: 'pokapass',
                rules: [{
                    type: 'empty',
                    prompt: '請輸入密碼或關閉使用密碼登入'
                }, {
                    type: 'minLength[6]',
                    prompt: '密碼至少要 {ruleValue} 個字元'
                }, {
                    type: 'different[pokaadminpassword]',
                    prompt: '密碼不得與管理員密碼相同'
                }]
            },
            pokapasswordcom: {
                identifier: 'pokapasswordcom',
                depends: 'pokapass',
                rules: [{
                    type: 'match[pokapassword]',
                    prompt: '密碼不一致'
                }]
            },
            pokaadminpassword: {
                identifier: 'pokaadminpassword',
                rules: [{
                    type: 'empty',
                    prompt: '請輸入管理員密碼'
                }, {
                    type: 'minLength[6]',
                    prompt: '管理員密碼至少要 {ruleValue} 個字元'
                }, {
                    type: 'different[pokapassword]',
                    prompt: '密碼不得與登入密碼相同'
                }]
            },
            pokaadminpasswordcom: {
                identifier: 'pokaadminpasswordcom',
                rules: [{
                    type: 'match[pokaadminpassword]',
                    prompt: '密碼不一致'
                }]
            }
        }
    });
    $('.ui.form[data-install="netease"]').form({
        inline: true,
        on: 'blur',
        fields: {
            neteasehost: {
                identifier: 'neteasehost',
                depends: 'neteaseenabled',
                rules: [{
                    type: 'empty',
                    prompt: '需填入網域、IP 或別名'
                }]
            },
            neteaseport: {
                identifier: 'neteaseport',
                depends: 'neteaseenabled',
                rules: [{
                    type: 'empty',
                    prompt: '請輸入 Port'
                }]
            },
            neteaseaccount: {
                identifier: 'neteaseaccount',
                depends: 'neteaseenabled',
                rules: [{
                    type: 'empty',
                    prompt: '請輸入帳號'
                }]
            },
            neteasepassword: {
                identifier: 'neteasepassword',
                depends: 'neteaseenabled',
                rules: [{
                    type: 'empty',
                    prompt: '請輸入密碼'
                }]
            }
        }
    });
    $('.ui.form[data-install="dsm"]').form({
        inline: true,
        on: 'blur',
        fields: {
            dsmhost: {
                identifier: 'dsmhost',
                depends: 'dsmenabled',
                rules: [{
                    type: 'empty',
                    prompt: '需填入網域、IP'
                }]
            },
            dsmport: {
                identifier: 'dsmport',
                depends: 'dsmenabled',
                rules: [{
                    type: 'empty',
                    prompt: '請輸入 Port'
                }]
            },
            dsmaccount: {
                identifier: 'dsmaccount',
                depends: 'dsmenabled',
                rules: [{
                    type: 'empty',
                    prompt: '請輸入帳號'
                }]
            },
            dsmpassword: {
                identifier: 'dsmpassword',
                depends: 'dsmenabled',
                rules: [{
                    type: 'empty',
                    prompt: '請輸入密碼'
                }]
            }
        }
    });
});

async function pingServer() {
    let ping = (await axios.get('/ping')).data
    if (ping == 'PONG')
        location.href = '/'
}