const config = require("./config.json").share;
const secret = config.secret || "test";
const jwtIss = config.issuer || "PokaPlayer";

const jwt = require("jsonwebtoken");

function sign(data, expire, subject = "guest") {
    return new Promise((resolve, reject) =>
        jwt.sign(
            { data: JSON.stringify(data) },
            secret,
            {
                expiresIn: expire,
                issuer: jwtIss,
                subject
            },
            (err, data) => (err ? reject(err) : resolve(data))
        )
    );
}

function verify(token, songIds) {
    return new Promise((resolve, reject) =>
        jwt.verify(
            token,
            secret,
            { issuer: jwtIss },
            (err, decoded) =>
                err
                    ? reject(err)
                    : resolve(
                          songIds
                              ? Array.isArray(songIds)
                                  ? songIds.filter(JSON.parse(decoded.data).includes)
                                  : JSON.parse(decoded.data).includes(songIds)
                              : JSON.parse(decoded.data)
                      )
        )
    );
}

module.exports = {
    sign,
    verify
};
