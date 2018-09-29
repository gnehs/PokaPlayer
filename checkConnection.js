const jar = require("request").jar();
const rp = require("request-promise").defaults({ jar });
const router = require("express").Router();
const bodyParser = require("body-parser");

router.use(bodyParser.json());

router.get("netease2", async (req, res) => {
    async function netease2(config) {
        const options = (url, qs = {}) => ({
            uri: url,
            qs,
            json: true // Automatically parses the JSON string in the response
        });

        async function login(config) {
            const server = config.server;
            if (config.login.phone) {
                return await rp(
                    options(
                        `${server}login/cellphone?phone=${config.login.phone}&password=${
                            config.login.password
                        }`
                    )
                );
            } else {
                return await rp(
                    options(
                        `${server}login?email=${config.login.email}&password=${
                            config.login.password
                        }`
                    )
                );
            }
        }

        return (await login(config)).code == 200;
    }

    try {
        res.send(await netease2(req.body.config));
    } catch (e) {
        res.status(500).send(e.toString());
    }
});

module.exports = router;
