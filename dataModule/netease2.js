const jar = require("request").jar();
const rp = require("request-promise")
const rpxc = require("request-promise") // request without cookie
const request = require("request").defaults({
    jar
});
const fs = require("fs-extra");
const pokaLog = require("../log"); // 可愛控制台輸出
const schedule = require("node-schedule"); // 很會計時ㄉ朋友
const franc = require("franc-min");
const config = require(__dirname + "/../config.json").Netease2; // 設定
const server = config.server || "http://localhost:4000/";
const pin = __dirname + "/netease2Pin.json";
const options = (url, qs = {}, resolveWithFullResponse = false, cookie = true) => ({
    uri: url,
    qs,
    json: true, // Automatically parses the JSON string in the response
    jar: cookie ? jar : null,
    resolveWithFullResponse
});
try {
    fs.readFileJSON(pin, "utf8");
} catch (e) {
    fs.writeFile(pin, "[]");
}
const defaultImage = config.isPremium ? "https://i.imgur.com/ZFaycMw.gif" : false;

const {
    Resolver
} = require("dns").promises;
const resolver = new Resolver();

const m10s = resolver.resolve4("ws.acgvideo.com");

// flatMap
const concat = (x, y) => x.concat(y);
const flatMap = (f, xs) => xs.map(f).reduce(concat, []);

function idPlusName(id, name) {
    const a2b = x => Buffer.from(x).toString("base64");
    return `${Math.random().toString(36).substring(2, 7)}${a2b(name)}BJmemv4fx${a2b(id.toString())}`;
}

function decomposeIdName(idName) {
    const b2a = x => Buffer.from(x, "base64").toString("utf8");
    const decode = x => /(?:.{5})(.+)BJmemv4fx(.+)/.exec(x);
    let [_, name, id] = decode(idName);
    return [Number(b2a(id)), b2a(name)];
}

function isIdName(id) {
    return /(?:.{5})(.+)BJmemv4fx(.+)/.test(id);
}

var isLoggedin;

const normalOptions = async (url, req = {}) => {
    async function m10() {
        return (await m10s)[Math.floor(Math.random() * (await m10s).length)];
    }
    const randomUserAgent = () => {
        const userAgentList = [
            'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
            'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_2 like Mac OS X) AppleWebKit/603.2.4 (KHTML, like Gecko) Mobile/14F89;GameHelper',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 10_0 like Mac OS X) AppleWebKit/602.1.38 (KHTML, like Gecko) Version/10.0 Mobile/14A300 Safari/602.1',
            'Mozilla/5.0 (iPad; CPU OS 10_0 like Mac OS X) AppleWebKit/602.1.38 (KHTML, like Gecko) Version/10.0 Mobile/14A300 Safari/602.1',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:46.0) Gecko/20100101 Firefox/46.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/603.2.4 (KHTML, like Gecko) Version/10.1.1 Safari/603.2.4',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:46.0) Gecko/20100101 Firefox/46.0',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/13.10586',
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
        ]
        let index = Math.floor(Math.random() * userAgentList.length)
        return userAgentList[index]
    }
    return {
        method: "GET",
        uri: url.replace("m10.music.126.net", `${await m10()}/m10.music.126.net`),
        headers: {
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
            "Accept-Encoding": "gzip, deflate",
            "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
            Connection: "keep-alive",
            "Cache-Control": "max-age=0",
            DNT: 1,
            "Upgrade-Insecure-Requests": 1,
            "User-Agent": randomUserAgent(),
            Range: req.headers && req.headers.range ? req.headers.range : "",
            Accept: req.headers && req.headers.accept ? req.headers.accept : ""
        },
        json: true, // Automatically parses the JSON string in the response
        followAllRedirects: true
    };
};

const imageUrl = x => `/pokaapi/req/?moduleName=Netease2&data=${encodeURIComponent(genReq(x))}`;

function migrate(org, t, offset = 10 ** -3) {
    const isDigit = x => !isNaN(Number(x));

    const plus = (num1, num2, ...others) => {
        // 精確加法
        if (others.length > 0) return plus(plus(num1, num2), others[0], ...others.slice(1));
        const baseNum = Math.pow(10, Math.max(digitLength(num1), digitLength(num2)));
        return (times(num1, baseNum) + times(num2, baseNum)) / baseNum;
    };
    const digitLength = num => {
        // Get digit length of e
        const eSplit = num.toString().split(/[eE]/);
        const len = (eSplit[0].split(".")[1] || "").length - +(eSplit[1] || 0);
        return len > 0 ? len : 0;
    };
    const times = (num1, num2, ...others) => {
        // 精確乘法
        function checkBoundary(num) {
            if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
                console.warn(`${num} is beyond boundary when transfer to integer, the results may not be accurate`);
            }
        }

        function float2Fixed(num) {
            if (num.toString().indexOf("e") === -1) return Number(num.toString().replace(".", ""));
            const dLen = digitLength(num);
            return dLen > 0 ? num * Math.pow(10, dLen) : num;
        }

        if (others.length > 0) return times(times(num1, num2), others[0], ...others.slice(1));
        const num1Changed = float2Fixed(num1);
        const num2Changed = float2Fixed(num2);
        const baseNum = digitLength(num1) + digitLength(num2);
        const leftValue = num1Changed * num2Changed;

        checkBoundary(leftValue);

        return leftValue / Math.pow(10, baseNum);
    };
    const minus = (num1, num2, ...others) => {
        // 精確減法
        if (others.length > 0) return minus(minus(num1, num2), others[0], ...others.slice(1));
        const baseNum = Math.pow(10, Math.max(digitLength(num1), digitLength(num2)));
        return (times(num1, baseNum) - times(num2, baseNum)) / baseNum;
    };
    const strip = (x, precision = 12) => +parseFloat(x.toPrecision(precision)); // 數字精確化

    const tagToTime = tag =>
        isDigit(tag[0]) ?
            tag
                .split(":")
                .reverse()
                .reduce((acc, cur, index) => plus(acc, Number(cur) * 60 ** index), 0) :
            tag;
    const parse = (x, isTranslated = false) => {
        let pLyricLines = x
            .split("\n")
            .filter(x => x != "")
            .map(str => {
                const regex = /\[(\d+:\d+\.\d+)\]/gm;
                let m;

                let result = [];

                while ((m = regex.exec(str)) !== null) {
                    if (m.index === regex.lastIndex) regex.lastIndex++;
                    result.push(m[1]);
                }
                result.push(str.match(/.+\]((?:.|^$)*)/)[1]);
                return result;
            });
        let result = [];
        for (let pLyricLine of pLyricLines) {
            let lyric = pLyricLine.pop();
            for (let time of pLyricLine) {
                result.push([tagToTime(time), lyric, isTranslated]);
            }
        }
        return result;
    };

    const timeToTag = seconds => {
        let minute = Math.floor(seconds / 60);
        let second = minus(seconds, minute * 60);
        return `${minute}:${second}`;
    };

    // 開始切成 [(tag, lyric)]

    parsedLyrics = parse(org)
        .concat(parse(t, true))
        .sort((a, b) => {
            if ((typeof a[0] == typeof b[0]) == "string") return 0;
            else if (typeof a[0] == "string") return -1;
            else if (typeof b[0] == "string") return 1;
            else {
                if (a[0] == b[0]) return a[2] ? 1 : -1;
                else return a[0] < b[0] ? -1 : 1;
            }
        });

    // 整理成 [[time, [orgLyric, tLyric]]]
    let parsedLyricPairs = [];

    let i = 0;
    while (i < parsedLyrics.length) {
        if (typeof parsedLyrics[i][0] == "string") {
            parsedLyricPairs.push(parsedLyrics[i]);
            i += 1;
        } else if (i != parsedLyrics.length - 1) {
            if (parsedLyrics[i][0] == parsedLyrics[i + 1][0]) {
                parsedLyricPairs.push([parsedLyrics[i][0],
                [parsedLyrics[i][1], parsedLyrics[i + 1][1]]
                ]);
                i += 2;
            } else {
                parsedLyricPairs.push([parsedLyrics[i][0],
                [parsedLyrics[i][1], parsedLyrics[i][1]]
                ]);
                i += 1;
            }
        } else {
            parsedLyricPairs.push([parsedLyrics[i][0],
            [parsedLyrics[i][1], parsedLyrics[i][1]]
            ]);
            i += 1;
        }
    }

    // 壓回 LRC
    let result = "";
    for (let i in parsedLyricPairs) {
        i = Number(i);
        if (typeof parsedLyricPairs[i][0] == "string") result += `[${parsedLyricPairs[i][0]}]\n`;
        else {
            if (i != parsedLyricPairs.length - 1) {
                result += `[${timeToTag(parsedLyricPairs[i][0])}]${parsedLyricPairs[i][1][0]}\n[${timeToTag(
                    plus(parsedLyricPairs[i + 1][0], -offset)
                )}]${parsedLyricPairs[i][1][1]}\n`;
            } else {
                result += `[${timeToTag(parsedLyricPairs[i][0])}]${parsedLyricPairs[i][1][0]}\n[${timeToTag(
                    parsedLyricPairs[i][0]
                )}]${parsedLyricPairs[i][1][1]}\n`;
            }
        }
    }

    return result;
}

async function login(config) {
    let result;
    if (config.login.phone) {
        result = await rp(
            options(`${server}login/cellphone?phone=${config.login.phone}&password=${config.login.password}`)
        );
    } else {
        result = await rp(options(`${server}login?email=${config.login.email}&password=${config.login.password}`));
    }
    isLoggedin = result.code == 200;
    pokaLog.logDM('Netease2', `${result.profile.nickname} 登入${isLoggedin ? "成功" : "失敗"}`)
    return result;
}

//自動重新登入
schedule.scheduleJob("'* */12 * * *'", async function () {
    pokaLog.logDM('Netease2', `正在重新登入...`)
    await login(config);
});
async function onLoaded() {
    if (!config.enabled) return false;
    //console.log("[DataModules][Netease2] 正在登入...");
    return await fs.ensureFile(pin).then(async () => {
        if (config && config.login && (config.login.phone || config.login.email) && config.login.password) {
            let result = await login(config);
            if ((await result.code) == 200) {
                return true;
            } else {
                pokaLog.logDM('Netease2', `登入失敗`)
                return false;
            }
        } else {
            pokaLog.logDM('Netease2', `登入失敗，尚未設定帳號密碼`)
            return false;
        }
    });
}

async function req(x) {
    function deReq(x) {
        const b2a = x => Buffer.from(x, "base64").toString("utf8");
        const decode = x => /(.{5})(.+)3C4C7CB3(.+)/.exec(x);

        let [_, rand, link, checkSum] = decode(x);
        [_, rand, link, checkSum] = [_, rand, b2a(link), b2a(checkSum)];
        if (!Number.isInteger(Math.log10(rand.charCodeAt(0) + checkSum.charCodeAt(0)))) {
            return false;
        }
        return link;
    }
    let link = deReq(x);
    if (!link) return false;
    const re = /^(http|https)\:\/\/p(\d+)\.music\.126\.net\/(?:.+)/;
    if (!re.test(link)) return false;
    else return request(await normalOptions(link));
}

function genReq(link) {
    const a2b = x => Buffer.from(x).toString("base64");
    const rand = Math.random().toString(36).substring(2, 7)
    const checkSum = N => 10 ** Number(N).toString().length - N;
    return `${rand}${a2b(link)}3C4C7CB3${a2b(String.fromCharCode(checkSum(rand.charCodeAt(0))))}`;
}

async function parseSongs(songs, br = 999000) {
    return await Promise.all(
        (await songs).map(async (song, index) => {
            song = await song;
            return {
                name: song.name,
                artist: song.ar.map(x => x.name || "").join(", "),
                artistId: song.ar[0].id,
                album: song.al.name || "",
                albumId: song.al.id || null,
                cover: song.al.picUrl ? imageUrl(song.al.picUrl) : 'https://i.imgur.com/qxy800z.png',
                url: `/pokaapi/song/?moduleName=Netease2&songId=${song.id}`,
                codec: "mp3",
                // lrc: song.id,
                source: "Netease2",
                id: song.id
            };
        })
    );
}

async function getSong(req, songRes, id) {
    let br = {
        low: 128000,
        medium: 192000,
        high: 320000,
        original: 320000
    }[songRes];
    let isArray = Array.isArray(id);
    id = isArray ? id : [id];
    let result = await Promise.all(
        (await getSongsUrl(id, br)).map(async x => {
            let url = x.url ? x.url : `http://music.163.com/song/media/outer/url?id=${x.id}.mp3`;
            return request(await normalOptions(url, req));
        })
    );
    return isArray ? result : result[0];
}

async function getSongs(songs, br = 999000) {
    let isArray = Array.isArray(songs);
    songs = isArray ? songs : [songs];
    let result = await parseSongs(
        await Promise.all(songs.map(async x => (await rp(options(`${server}song/detail?ids=${x}`, {}, false, false))).songs[0])),
        br
    );
    return isArray ? result : result[0];
}

async function getAlbum(id) {
    let result = await rp(options(`${server}album?id=${id}`));
    let album = (await parseAlbums([result.album]))[0];
    album.songs = await parseSongs(result.songs);
    return album;
}

async function getSongsUrl(songs, br = 999000) {
    let isArray = Array.isArray(songs);
    songs = isArray ? songs : [songs];
    let result = await rp(options(`${server}song/url?br=${br}&id=${songs.join()}`));
    return isArray ? result.data : result.data[0];
}

async function getCover(id) {
    return (await getCovers([id]))[0];
}

async function getCovers(ids) {
    return await Promise.all((await getSongs(ids)).map(async x => request(await normalOptions((await x).cover))));
}

async function parseAlbums(albums) {
    return (await albums).map(x => ({
        name: x.name,
        artist: x.artists.map(i => i.name).join(" ,"),
        year: new Date(x.publishTime).getFullYear(),
        cover: imageUrl(x.picUrl),
        source: "Netease2",
        id: x.id
    }));
}

async function parseArtists(artists) {
    return (await artists).map(x => ({
        name: x.name,
        cover: imageUrl(x.picUrl || x.img1v1Url),
        source: "Netease2",
        id: x.id
    }));
}

async function parsePlaylists(playlists) {
    return (await playlists).map(x => ({
        name: x.name,
        image: imageUrl(x.coverImgUrl || x.picUrl),
        source: "Netease2",
        id: x.id
    }));
}

async function search(keywords, limit = 30) {
    async function parseSearchResults(results = [], type) {
        switch (type) {
            case "song":
                return await getSongs(results.map(x => x.id));
            case "album":
                return await parseAlbums(results);
            case "artist":
                return await parseArtists(results);
            case "playlist":
                return await parsePlaylists(results);
        }
    }

    function isPromise(x) {
        return Promise.resolve(x) == x;
    }

    let typeNums = {
        song: 1,
        album: 10,
        artist: 100,
        playlist: 1000
        // user: 1002,
        // mv: 1004,
        // lyric: 1006,
        // radio: 1009
    };

    let result = await Object.keys(typeNums).reduce(async (results, type) => {
        let types = type + "s";
        let typeNum = typeNums[type];
        let result;
        try {
            result = (await rp(options(`${server}search?keywords=${keywords}&type=${typeNum}&limit=${limit}`))).result[
                types
            ];
        } catch (e) {
            result = [];
        }
        if (isPromise(results)) results = await results;
        results[types] = await parseSearchResults(result, type);
        return results;
    }, {});

    return result;
}

async function getArtist(id) {
    let info = await rp(options(`${server}artists?id=${id}`));
    let result = (await parseArtists([info.artist]))[0];
    result.songs = await parseSongs(info.hotSongs);
    return result;
}

async function getAlbumSongs(id) {
    let info = await rp(options(`${server}album?id=${id}`));
    return {
        songs: await parseSongs(info.songs)
    };
}

async function getArtistSongs(id) {
    let info = await rp(options(`${server}artists?id=${id}`));
    return {
        songs: await parseSongs(info.hotSongs)
    };
}

async function getArtistAlbums(id, limit = 50, offset = 0) {
    let info = await rp(options(`${server}artist/album?id=${id}&limit=${limit}&offset=${offset}`));
    let result = await parseAlbums(info.hotAlbums);
    return {
        albums: result
    };
}

async function getCatList() {
    let info = await rp(options(`${server}playlist/catlist`));
    let result = info.sub.map(x => x.name);
    result.push(info.all.name);
    return result;
}

async function resolveTopPlaylistStack(topPlaylistStack) {
    if (topPlaylistStack.length === 0) return topPlaylistStack;
    let playlists = flatMap(
        x => x,
        (await Promise.all(topPlaylistStack)).map(x => (x[0] ? x[0].playlists : x.playlists))
    ).map(x =>
        x ? {
            name: x.name,
            source: "Netease2",
            id: x.id,
            image: imageUrl(x.coverImgUrl || x.picUrl),
            from: "topPlaylistStack"
        } :
            false
    );
    return [].concat(...playlists);
}

async function resolvePlaylistStack(playlistStack) {
    if (playlistStack.length === 0) return playlistStack;
    return (await Promise.all(playlistStack)).map(x =>
        Array.isArray(x) ? {
            name: x[1].name || x[0].playlist.name,
            source: "Netease2",
            id: x[0].playlist.id,
            image: x[1].image || imageUrl(x[0].playlist.coverImgUrl || x[0].playlist.picUrl),
            from: "playlistStack"
        } : {
                name: x.playlist.name,
                source: "Netease2",
                id: x.playlist.id,
                image: imageUrl(x.playlist.coverImgUrl || x.playlist.picUrl),
                from: "playlistStack"
            }
    );
}

async function resolvedailyRecommendStack(dailyRecommendStack) {
    if (dailyRecommendStack.length === 0) return dailyRecommendStack;
    return [].concat(
        ...flatMap(
            x => x,
            (await Promise.all(dailyRecommendStack)).map(x => (Array.isArray(x) ? [x[0], x[1].recommend] : x.recommend))
        ).map(x =>
            Array.isArray(x) ? {
                name: x[1].name,
                id: x[1].id,
                image: x[0] || imageUrl(x.coverImgUrl || x.picUrl),
                source: "Netease2",
                from: "dailyRecommendStack"
            } : {
                    name: x.name,
                    id: x.id,
                    image: imageUrl(x.coverImgUrl || x.picUrl),
                    source: "Netease2",
                    from: "dailyRecommendStack"
                }
        )
    );
}

async function getPlaylists(playlists) {
    // cat 可以從 getCatList() 抓
    async function resolveUserList(userList) {
        if (userList.length === 0) return userList;
        return [].concat(...(await Promise.all(userList)));
    }

    async function getCustomPlaylists(id) {
        let result = await rp(options(`${server}user/playlist?uid=${id}`));
        return result.playlist.map(x => ({
            name: x.name,
            source: "Netease2",
            id: x.id,
            image: imageUrl(x.coverImgUrl || x.picUrl),
            from: "getCustomPlaylists"
        }));
    }

    async function processPlaylist(playlists) {
        let r = [];
        let playlistStack = [];
        let userList = [];
        for (let x of playlists) {
            if (x.source != "Netease2") continue;
            else {
                switch (x.type) {
                    case "playlist":
                        if (x.name && x.image) {
                            x.id = isIdName(x.id) ? x.id : idPlusName(x.id, x.name);
                            r.push(x);
                        } else {
                            if (x.name || x.image)
                                playlistStack.push(
                                    new Promise((resolve, reject) => {
                                        rp(options(`${server}playlist/detail?id=${x.id}`))
                                            .then(data => {
                                                resolve([data, {
                                                    name: x.name,
                                                    image: x.image
                                                }]);
                                            })
                                            .catch(e => reject(e));
                                    })
                                );
                            else playlistStack.push(rp(options(`${server}playlist/detail?id=${x.id}`)));
                        }
                        break;
                    case "user":
                        if (isLoggedin === undefined) {
                            login.then(x => {
                                if (x.code == 200) {
                                    userList.push(getCustomPlaylists(x.id));
                                } else pokaLog.logDMErr('Netease2', `未登入，無法獲取用戶歌單。`)
                            });
                        } else if (!isLoggedin) {
                            pokaLog.logDMErr('Netease2', `未登入，無法獲取用戶歌單。`)
                        } else {
                            userList.push(getCustomPlaylists(x.id));
                        }
                        break;
                    case "folder":
                        let data = await processPlaylist(x.playlists);
                        r.push({
                            name: x.name,
                            type: "folder",
                            image: x.image,
                            source: "Netease2",
                            id: x.id,
                            playlists: data[0].concat(
                                ...(await resolvePlaylistStack(data[1])),
                                ...(await resolveUserList(data[2]))
                            ),
                            songs: x.songs
                        });
                        break;
                }
            }
        }
        return [r, playlistStack, userList];
    }

    let [r, playlistStack, userList] = await processPlaylist(playlists);
    let catList = await getCatList();

    if (config.topPlaylist.enabled) {
        if (!config.topPlaylist.category in catList) {
            pokaLog.logDMErr('Netease2', `topPlaylist 的分類出錯，已預設為 ACG`)
            config.topPlaylist.category = "ACG";
        }
        let c = config.topPlaylist;
        r.push({
            name: "網友精選碟歌單",
            source: "Netease2",
            image: config.topPlaylist.image || defaultImage,
            type: "folder",
            id: "topPlaylist",
            playlists: await resolveTopPlaylistStack([
                rp(
                    options(
                        `${server}top/playlist?limit=${c.limit}&order=${
                        c.order in ["hot", "new"] ? c.order : "hot"
                        }&cat=${c.category}`
                    )
                )
            ])
        });
    }

    if (config.hqPlaylist.enabled) {
        if (!config.hqPlaylist.category in catList) {
            pokaLog.logDMErr('Netease2', `topPlaylist 的分類出錯，已預設為 ACG`)
            config.hqPlaylist.category = "ACG";
        }
        let c = config.hqPlaylist;
        r.push({
            name: "精品歌單",
            source: "Netease2",
            image: config.hqPlaylist.image || defaultImage,
            type: "folder",
            id: "hqPlaylist",
            playlists: await resolveTopPlaylistStack([
                rp(options(`${server}top/playlist/highquality?limit=${c.limit}&cat=${c.category}`))
            ])
        });
    }

    if (config.dailyRecommendSongs.enabled) {
        if (isLoggedin === undefined) {
            login.then(x => {
                r.push({
                    name: "每日推薦歌曲",
                    source: "Netease2",
                    id: "dailyRecommendSongs",
                    image: config.dailyRecommendSongs.image || defaultImage
                });
            });
        } else if (!isLoggedin) {
            pokaLog.logDMErr('Netease2', `未登入，無法獲取每日推薦歌曲。`)
        } else {
            r.push({
                name: "每日推薦歌曲",
                source: "Netease2",
                id: "dailyRecommendSongs",
                image: config.dailyRecommendSongs.image || defaultImage
            });
        }
    }

    if (config.dailyRecommendPlaylists.enabled) {
        if (isLoggedin === undefined) {
            login.then(async x => {
                if (x.code == 200)
                    r.push({
                        name: "每日推薦歌單",
                        source: "Netease2",
                        image: config.dailyRecommendPlaylists.image || defaultImage,
                        type: "folder",
                        id: "dailyRecommendPlaylists",
                        playlists: await resolvedailyRecommendStack([
                            rp(options(`${server}recommend/resource?timestamp=${Math.floor(Date.now() / 1000)}`))
                        ])
                    });
                else pokaLog.logDMErr('Netease2', `未登入，無法獲取每日推薦歌單。`)
            });
        } else if (!isLoggedin) {
            pokaLog.logDMErr('Netease2', `未登入，無法獲取每日推薦歌單。`)
        } else
            r.push({
                name: "每日推薦歌單",
                source: "Netease2",
                image: config.dailyRecommendPlaylists.image || defaultImage,
                type: "folder",
                id: "dailyRecommendPlaylists",
                playlists: await resolvedailyRecommendStack([
                    rp(options(`${server}recommend/resource?timestamp=${Math.floor(Date.now() / 1000)}`))
                ])
            });
    }
    let result = r.concat(...(await resolveUserList(userList)), ...(await resolvePlaylistStack(playlistStack)));
    return {
        playlists: result
    };
}

async function getPlaylistSongs(id, br = 999000) {
    let name;
    if (isIdName(id)) [id, name] = decomposeIdName(id);
    if (id == "dailyRecommendSongs") {
        let result = await rp(options(`${server}recommend/songs`));
        if (result.code == 200) {
            let r = result.recommend.map((x, index) => ({
                name: x.name,
                artist: x.artists.map(x => x.name).join(", "),
                artistId: x.artists[0].id,
                album: x.album.name,
                albumId: x.album.id,
                cover: x.album.picUrl.replace("http", "https"),
                url: `/pokaapi/song/?moduleName=Netease2&songId=${x.id}`,
                codec: "mp3",
                source: "Netease2",
                id: x.id
            }));
            return {
                songs: r,
                playlists: [{
                    name: "每日推薦歌曲",
                    source: "Netease2",
                    id
                }]
            };
        } else {
            pokaLog.logDMErr('Netease2', `無法獲取每日推薦歌單。(${result.code})`)
            return null;
        }
    } else if (id == "yunPan") {
        let result = await rp(options(`${server}user/cloud?limit=2147483646`));
        if (result.code == 200) {
            return {
                songs: await parseSongs(result.data.map(x => x.simpleSong)),
                playlists: [{
                    name: "網易雲音樂雲盤",
                    source: "Netease2",
                    id: "yunPan"
                }]
            };
        } else {
            pokaLog.logDMErr('Netease2', `無法獲取網易雲音樂雲盤。(${result.code})`)
            return null;
        }
    } else {
        let result = await rp(options(`${server}playlist/detail?id=${id}`));
        if (result.code == 200) {
            return {
                songs: await parseSongs(result.playlist.tracks),
                playlists: [{
                    name: name ? name : result.playlist.name,
                    source: "Netease2",
                    id: id,
                    image: imageUrl(result.playlist.coverImgUrl || result.playlist.picUrl)
                }]
            };
        } else {
            pokaLog.logDMErr('Netease2', `無法獲取歌單 ${id}。(${result.code})`)
            return null;
        }
    }
}

async function getLyric(id) {
    async function chsToCht(text, converter = "Taiwan") {
        let result = await rp({
            method: "POST",
            uri: "https://api.zhconvert.org/convert",
            body: {
                converter,
                text
            },
            json: true
        });
        return result.data.text;
    }
    let result = await rp(options(`${server}lyric?id=${id}`, {}, false, false));
    let lyric;
    if (result.code == 200) {
        if (result.nolyric) lyric = "[0:0] 純音樂";
        else if (result.tlyric && result.tlyric.lyric) { //翻譯後的歌詞
            try {
                lyric = migrate(result.lrc.lyric, await chsToCht(result.tlyric.lyric));
            } catch (e) {
                lyric = result.lrc.lyric;
            }
        } else if (result.lrc && result.lrc.lyric) { // 中文歌詞
            //if (franc(result.lrc.lyric) == "cmn") {
            try {
                lyric = await chsToCht(result.lrc.lyric, "Traditional");
            } catch (e) {
                lyric = result.lrc.lyric;
            }
            //} else lyric = result.lrc.lyric;
        } else lyric = null;
        return lyric;
    } else {
        pokaLog.logDMErr('Netease2', `無法獲取歌詞 ${id}。(${result.code})`)
        return null;
    }
}

async function searchLyrics(keyword) {
    let songs = (await search(keyword, 30, "song")).songs;
    let result = (await Promise.all(
        songs.map(async x => ({
            name: x.name,
            artist: x.artist,
            source: "Netease2",
            id: x.id,
            lyric: await getLyric(x.id)
        }))
    )).filter(x => x.lyric && x.lyric != "[0:0] 純音樂");
    return {
        lyrics: result
    };
}

async function addPin(type, id, name) {
    let data = await fs.readJson(pin);
    let artist = type == "album" ? (await getAlbum(id)).artist : undefined;

    data = data.concat({
        type,
        id,
        name,
        artist,
        source: "Netease2"
    });
    try {
        return await fs.writeJson(pin, data).then(() => true);
    } catch (e) {
        return e;
    }
}

async function unPin(type, id, name) {
    let data = (await fs.readJson(pin)).filter(x => !(x.id == id && x.type == type));
    try {
        return await fs.writeJson(pin, data).then(() => true);
    } catch (e) {
        return e;
    }
}

async function isPinned(type, id, name) {
    let data = await fs.readJson(pin);

    return data.some(x => x.type == type && x.id == id) || false;
}

async function getHome() {
    let r = []; let result = []

    let pinData = {
        songs: [],
        albums: [],
        artists: [],
        composers: [],
        playlists: []
    };

    let catList = await getCatList();

    try {
        (await fs.readJson(pin)).forEach(x => {
            pinData[x.type + "s"].push(x);
        });
    } catch (e) {
        pokaLog.logDMErr('Netease2', e)
    }
    if (config.topPlaylist.enabled) {
        if (!config.topPlaylist.category in catList) {
            pokaLog.logDMErr('Netease2', `topPlaylist 的分類出錯，已預設為 ACG`)
            config.topPlaylist.category = "ACG";
        }
        let c = config.topPlaylist;
        let topPlaylistResult = []
        topPlaylistResult.push(
            new Promise((resolve, reject) => {
                rp(
                    options(
                        `${server}top/playlist?limit=${c.limit}&order=${
                        c.order in ["hot", "new"] ? c.order : "hot"
                        }&cat=${c.category}`
                    )
                )
                    .then(data => resolve([data, {
                        image: config.topPlaylist.image || defaultImage
                    }]))
                    .catch(e => reject(e));
            })
        );
        result.push({
            title: "home_topPlaylist_netease",
            source: "Netease2",
            playlists: (await resolveTopPlaylistStack(topPlaylistResult)),
        })
    }

    if (config.hqPlaylist.enabled) {
        if (!config.hqPlaylist.category in catList) {
            pokaLog.logDMErr('Netease2', `topPlaylist 的分類出錯，已預設為 ACG`)
            config.hqPlaylist.category = "ACG";
        }
        let c = config.hqPlaylist;
        let hqPlaylistResult = []
        hqPlaylistResult.push(
            new Promise((resolve, reject) => {
                rp(options(`${server}top/playlist/highquality?limit=${c.limit}&cat=${c.category}`))
                    .then(data => resolve([data, {
                        image: config.hqPlaylist.image || defaultImage
                    }]))
                    .catch(e => reject(e));
            })
        );
        result.push({
            title: "home_hqPlaylist_netease",
            source: "Netease2",
            playlists: (await resolveTopPlaylistStack(hqPlaylistResult)),
        })
    }

    if (config.dailyRecommendSongs.enabled) {
        if (isLoggedin === undefined) {
            login.then(x => {
                r.push({
                    name: "每日推薦歌曲",
                    source: "Netease2",
                    id: "dailyRecommendSongs",
                    image: config.dailyRecommendSongs.image
                });
            });
        } else if (!isLoggedin) {
            pokaLog.logDMErr('Netease2', `未登入，無法獲取每日推薦歌曲。`)
        } else {
            r.push({
                name: "每日推薦歌曲",
                source: "Netease2",
                id: "dailyRecommendSongs",
                image: config.dailyRecommendSongs.image
            });
        }
    }

    if (config.dailyRecommendPlaylists.enabled) {
        let dailyRecommendStack = [];
        if (isLoggedin === undefined) {
            login.then(async x => {
                if (x.code == 200)
                    dailyRecommendStack.push(
                        rp(options(`${server}recommend/resource?timestamp=${Math.floor(Date.now() / 1000)}`))
                    );
                else pokaLog.logDMErr('Netease2', `未登入，無法獲取每日推薦歌單。`)
            });
        } else if (!isLoggedin) {
            pokaLog.logDMErr('Netease2', `未登入，無法獲取每日推薦歌單。`)
        } else
            dailyRecommendStack.push(
                rp(options(`${server}recommend/resource?timestamp=${Math.floor(Date.now() / 1000)}`))
            );

        result.push({
            title: "home_dailyRecommend_netease",
            source: "Netease2",
            playlists: (await resolvedailyRecommendStack(dailyRecommendStack)).slice(0, config.dailyRecommendPlaylists.limit || 50)
        })
    }
    result.push({
        title: "home_netease",
        source: "Netease2",
        playlists: r.concat(
            ...pinData.playlists
        ),
        songs: pinData.songs,
        albums: await Promise.all(
            pinData.albums.map(async x => {
                x.cover = (await getAlbum(x.id)).cover;
                return x;
            })
        ),
        artists: await Promise.all(
            pinData.artists.map(async x => {
                x.cover = (await getArtist(x.id)).cover;
                return x;
            })
        ),
        composers: pinData.composers
    })
    return result;
}

function playlistOperation(operation) {
    switch (operation) {
        case "in":
            return async (songIds, playlistId) => {
                let playlistIds = (await getPlaylistSongs(playlistId)).songs.map(x => x.id);
                if (!Array.isArray(songIds)) return playlistIds.includes(songIds);
                else {
                    let result = {};
                    for (const i of songIds) {
                        result[i] = playlistIds.includes(i);
                    }
                    return result;
                }
            };
        case "add":
            return async (songIds, playlistId) => {
                if (Array.isArray(songIds)) songIds = songIds.join(",");
                let response = await rp(
                    options(`${server}playlist/tracks?op=add&pid=${playlistId}&tracks=${songIds}`, {}, true)
                );
                return response.body;
            };
        case "delete":
            return async (songIds, playlistId) => {
                if (Array.isArray(songIds)) songIds = songIds.join(",");
                let response = await rp(
                    options(`${server}playlist/tracks?op=del&pid=${playlistId}&tracks=${songIds}`, {}, true)
                );
                return response.body;
            };
    }
}

async function getUserPlaylists(uid) {
    while (!uid) {
        if (isLoggedin === undefined) {
            login.then(async x => {
                if (x.code == 200) {
                    uid = (await rp(options(`${server}login/status`))).profile.userId;
                } else pokaLog.logDMErr('Netease2', `未登入，無法獲取用戶歌單。`)
            });
        } else if (!isLoggedin) {
            pokaLog.logDMErr('Netease2', `未登入，無法獲取用戶歌單。`)
        } else {
            uid = (await rp(options(`${server}login/status`))).profile.userId;
        }
    }
    return (await rp(options(`${server}user/playlist?uid=${uid}`))).playlist
        .filter(x => x.creator.userId == uid)
        .map(x => ({
            name: x.name,
            source: "Netease2",
            image: imageUrl(x.coverImgUrl) || defaultImage,
            type: "playlist",
            id: x.id
        }));
}

async function like(songId, like = true) {
    let response = await rp(
        options(`${server}like?id=${songId}${like ? "&like=true" : ""}&timestamp=${Date.now()}`, {}, true)
    );
    return response.body;
}

async function isLiked(songId) {
    let likeList = (await rp(options(`${server}likelist`))).ids;
    return likeList.includes(songId);
}

module.exports = {
    name: "Netease2",
    enabled: config.enabled,
    onLoaded,
    getSong,
    getSongs, // test
    getSongsUrl, // test
    getCover,
    getCovers,
    search,
    getAlbum,
    getAlbumSongs,
    // getFolders,
    // getFolderFiles,
    // getArtists,
    getArtist,
    getArtistSongs,
    getArtistAlbums,
    // getComposers,
    // getComposerAlbums,
    getPlaylists,
    getPlaylistSongs,
    getCatList,
    getLyric,
    searchLyrics,
    addPin,
    unPin,
    isPinned,
    getHome,
    req,
    getUserPlaylists,
    playlistOperation,
    like,
    isLiked
};