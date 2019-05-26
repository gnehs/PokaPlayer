const request = require("request");
const jar = require("request").jar();
const rp = require("request-promise").defaults({
    jar
});
const router = require("express").Router();
const bodyParser = require("body-parser");
const fs = require("fs-extra");
const passwordHash = require('password-hash');

router.use(bodyParser.json());

// 首頁
router.get("/", (req, res) => {
    res.send("PokaPlayer Install API");
});
router.post("/netease2", async (req, res) => {
    async function netease2(config) {
        const options = (url, qs = {}) => ({
            uri: url,
            qs,
            json: true // Automatically parses the JSON string in the response
        });

        async function login(config) {
            const server = config.server;
            if (config.login.phone)
                return await rp(
                    options(
                        `${server}login/cellphone?phone=${config.login.phone}&password=${
                            config.login.password
                        }`
                    )
                );
            else
                return await rp(
                    options(
                        `${server}login?email=${config.login.email}&password=${
                            config.login.password
                        }`
                    )
                );

        }

        return (await login(config)).code == 200;
    }

    try {
        res.send(await netease2(req.body));
    } catch (e) {
        res.send('error');
    }
});
router.post("/dsm", async (req, res) => {
    //- API 請求
    async function getAPI(CGI_PATH, API_NAME, METHOD, PARAMS_JSON = [], VERSION = 1, config) {
        return new Promise(function (resolve, reject) {
            let PARAMS = "";
            for (i = 0; i < PARAMS_JSON.length; i++) {
                PARAMS += "&" + PARAMS_JSON[i].key + "=" + encodeURIComponent(PARAMS_JSON[i].value);
            }
            request(
                `${config.protocol}://${config.host}:${config.port}/webapi/${CGI_PATH}?api=${API_NAME}&method=${METHOD}&version=${VERSION}${PARAMS}`,
                function (error, res, body) {
                    if (!error && res.statusCode == 200) {
                        resolve(JSON.parse(body));
                    } else {
                        reject(error);
                    }
                }
            );
        });
    }
    async function login(config) {
        if (!config.account && !config.password) {
            return false;
        }
        let result = await getAPI("auth.cgi", "SYNO.API.Auth", "Login", [{
                key: "account",
                value: config.account
            },
            {
                key: "passwd",
                value: config.password
            },
            {
                key: "session",
                value: "AudioStation"
            },
            {
                key: "format",
                value: "cookie"
            }
        ], 1, config);
        if (result.success) {
            return true;
        } else {
            return false;
        }
    }

    try {
        res.send(await login(req.body));
    } catch (e) {
        res.send('error');
    }
})
router.post("/config", async (req, res) => {
    try {
        let salt = Math.random().toString(36).substring(7)
        req.body["PokaPlayer"].salt = salt
        req.body["PokaPlayer"].password = passwordHash.generate(salt + req.body["PokaPlayer"].password)
        req.body["PokaPlayer"].adminPassword = passwordHash.generate(salt + req.body["PokaPlayer"].adminPassword)
        await fs.writeJson('./config.json', req.body)
        await fs.writeJson('./playlist.json', [])
        await res.send('done')
        process.exit()
    } catch (e) {
        res.send(e);
    }
})
module.exports = router;