
const config = require(__dirname + "/../config.json").Netease2;
const server = config.server || "http://localhost:4000/";

const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const jar = new CookieJar();
const client = async x => (await wrapper(axios.create({ jar, baseURL: server }))(x)).data;

const { parseLyric, zhconvert } = require('./lyricUtils')
const fs = require("fs-extra");
const pokaLog = require("../log"); // 可愛控制台輸出
const schedule = require("node-schedule"); // 很會計時ㄉ朋友 
const pin = __dirname + "/netease2Pin.json";
const pangu = require('pangu');

try {
    fs.readFileJSON(pin, "utf8");
} catch (e) {
    fs.writeFile(pin, "[]");
}
const defaultImage = config.isPremium ? "https://i.imgur.com/ZFaycMw.gif" : "/img/icons/apple-touch-icon.png";

const { Resolver } = require("dns").promises;
const resolver = new Resolver();
let m10s;
try { m10s = resolver.resolve4("netease.ugcvideoss.ourdvs.com"); } catch (e) { console.log('cannot resolver m10s') }

// flatMap
const concat = (x, y) => x.concat(y);
const flatMap = (f, xs) => xs.map(f).reduce(concat, []);

// chinaIP
function generateRandomChinaIP() {
    let chinaIPList = [
        '36.56.0.0',
        '60.168.0.0',
        '211.161.244.0',
        '27.16.0.0',
        '1.202.0.0',
        '103.22.4.0',
        '61.159.64.0',
    ];
    let ip = chinaIPList[Math.floor(Math.random() * chinaIPList.length)];
    ip = ip.split('.').map(x => x === '0' ? Math.floor(Math.random() * 253 + 1) : x).join('.')
    return ip;
}
const chinaIP = generateRandomChinaIP();

// User agent
function randomUserAgent(){
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
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.75 Safari/537.36',
    ]
    let index = Math.floor(Math.random() * userAgentList.length)
    return userAgentList[index]
}
const userAgent = randomUserAgent();

const options = (url, qs = {}, resolveWithFullResponse = false, cookie = true) => {
    if (!url.match(/login/)) {
        url = `${url}${url.includes("?") ? "&" : "?"}realIP=${chinaIP}${config.proxy ? "&proxy=" + encodeURIComponent(config.proxy) : ""}`
    }
    return ({
        url: url,
        params: qs,
        jar: cookie ? jar : null,
        resolveWithFullResponse
    })
}

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
var userId;

const normalOptions = async (url, req = {}) => {
    async function m10() {
        return (await m10s)[Math.floor(Math.random() * (await m10s).length)];
    }
    
    return {
        method: "GET",
        url: url.replace("m10.music.126.net", `${await m10()}/m10.music.126.net`),
        responseType: 'stream',
        headers: {
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
            "Accept-Encoding": "gzip, deflate",
            "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
            Connection: "keep-alive",
            "Cache-Control": "max-age=0",
            DNT: 1,
            "Upgrade-Insecure-Requests": 1,
            "User-Agent": userAgent,
            Range: req.headers && req.headers.range ? req.headers.range : "",
            Accept: req.headers && req.headers.accept ? req.headers.accept : "",
            'X-Real-IP': chinaIP
        },
        //json: true, // Automatically parses the JSON string in the response
        //followAllRedirects: true
    };
};

const imageUrl = x => `/pokaapi/req/?moduleName=Netease2&data=${encodeURIComponent(genReq(x))}`;

async function login(config) {
    let result;
    if (config.login.method == 'phone') {
        if (config.login.countrycode) {
            result = await client(options(`/login/cellphone?phone=${config.login.account}&password=${config.login.password}&countrycode=${config.login.countrycode}`));
        } else {
            result = await client(options(`/login/cellphone?phone=${config.login.account}&password=${config.login.password}`));
        }
    } else {
        result = await client(options(`/login?email=${config.login.account}&password=${config.login.password}`));
    }
    if (!result) {
        pokaLog.logDMErr('Netease2', `登入失敗`)
        return
    }
    isLoggedin = result.code == 200;
    if (isLoggedin) {
        userId = result.profile.userId
        pokaLog.logDM('Netease2', `${result.profile.nickname}(${userId}) 登入成功`)
    } else if (result.msg) {
        pokaLog.logDMErr('Netease2', result.msg)
    }
    return result;
}
//自動重新登入
schedule.scheduleJob("0 0 * * *", async function () {
    pokaLog.logDM('Netease2', `正在重新登入...`)
    await login(config);
});
async function onLoaded() {
    if (!config.enabled) return false;
    return await fs.ensureFile(pin).then(async () => {
        if (config && config.login && config.login.method && config.login.password && config.login.account) {
            let result = await login(config);
            if ((await result.code) == 200) {
                return true;
            } else {
                pokaLog.logDMErr('Netease2', `登入失敗`)
                return false;
            }
        } else {
            pokaLog.logDMErr('Netease2', `登入失敗，尚未設定帳號密碼`)
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
    else return client(await normalOptions(link));
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
            let artist, artistId
            if (song.ar && song.ar.length) {
                artist = song.ar.map(x => x.name || "").join(", ")
                artistId = song.ar[0].id
            } else {
                artist = '未知'
            }
            return {
                name: song.name,
                artist,
                artistId,
                album: song.al?.name || "",
                albumId: song.al?.id || null,
                cover: song.al?.picUrl ? imageUrl(song.al.picUrl) : 'https://i.imgur.com/qxy800z.png',
                url: `/pokaapi/song/?moduleName=Netease2&songId=${song.id}`,
                codec: "mp3",
                // lrc: song.id,
                source: "Netease2",
                id: `${song.id}`
            };
        })
    );
}

async function getSong(req, songRes, id) {
    let br = {
        low: 128000,
        medium: 192000,
        high: 320000,
        ori: 999000,
        original: 999000
    }[songRes];
    let isArray = Array.isArray(id);
    id = isArray ? id : [id];
    let result = await Promise.all(
        (await getSongsUrl(id, br)).map(async x => {
            let url = x.url ? x.url : `http://music.163.com/song/media/outer/url?id=${x.id}.mp3`;
            return axios(await normalOptions(url, req));
        })
    );
    return isArray ? result : result[0];
}

async function getSongs(songs, br = 999000) {
    let isArray = Array.isArray(songs);
    songs = isArray ? songs : [songs];
    let result = await parseSongs(
        await Promise.all(songs.map(async x => (await client(options(`/song/detail?ids=${x}`, {}, false, false))).songs[0])),
        br
    );
    return isArray ? result : result[0];
}

async function getAlbum(id) {
    let result = await client(options(`/album?id=${id}`));
    let album = (await parseAlbums([result.album]))[0];
    album.songs = await parseSongs(result.songs);
    return album;
}

async function getSongsUrl(songs, br = 999000) {
    let isArray = Array.isArray(songs);
    songs = isArray ? songs : [songs];
    let level = "hires";
    if (br == 320000) level = "exhigh";
    if (br == 192000) level = "higher";
    if (br == 128000) level = "standard";
    let result = await client(options(`/song/url/v1?level=${level}&id=${songs.join()}`));
    return isArray ? result.data : result.data[0];
}

async function getCover(id) {
    return (await getCovers([id]))[0];
}

async function getCovers(ids) {
    return await Promise.all((await getSongs(ids)).map(async x => client(await normalOptions((await x).cover))));
}

async function parseAlbums(albums) {
    return albums ? (await albums).map(x => ({
        name: x.name,
        artist: x.artists.map(i => i.name).join(" ,"),
        year: new Date(x.publishTime).getFullYear(),
        cover: imageUrl(x.picUrl),
        source: "Netease2",
        id: `${x.id}`
    })) : []
}

async function parseArtists(artists) {
    return (await artists).map(x => ({
        name: x.name,
        cover: imageUrl(x.picUrl || x.img1v1Url),
        source: "Netease2",
        id: `${x.id}`
    }));
}

async function parsePlaylists(playlists) {
    return (await playlists).map(x => ({
        name: x.name,
        image: imageUrl(x.coverImgUrl || x.picUrl),
        source: "Netease2",
        id: `${x.id}`
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
            result = (await client(options(`/search?keywords=${encodeURIComponent(keywords)}&type=${typeNum}&limit=${limit}`, {}, false, false))).result[
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
    let info = await client(options(`/artists?id=${encodeURIComponent(id)}`));
    let result = (await parseArtists([info.artist]))[0];
    result.songs = await parseSongs(info.hotSongs);
    return result;
}

async function getAlbumSongs(id) {
    let info = await client(options(`/album?id=${encodeURIComponent(id)}`));
    return {
        songs: await parseSongs(info.songs)
    };
}

async function getArtistSongs(id) {
    let info = await client(options(`/artists?id=${encodeURIComponent(id)}`));
    return {
        songs: await parseSongs(info.hotSongs)
    };
}

async function getArtistAlbums(id, limit = 50, offset = 0) {
    let info = await client(options(`/artist/album?id=${encodeURIComponent(id)}&limit=${limit}&offset=${offset}`));
    console.log(info);
    let result = await parseAlbums(info.hotAlbums);
    return {
        albums: result
    };
}

async function getCatList() {
    let info = await client(options(`/playlist/catlist`));
    let result = info.sub.map(x => x.name);
    result.push(info.all.name);
    return result;
}

async function resolveTopPlaylistStack(topPlaylistStack) {
    if (topPlaylistStack.length === 0) return topPlaylistStack;
    let playlists = flatMap(x => x, (await Promise.all(topPlaylistStack)).map(x => (x[0] ? x[0].playlists : x.playlists))).map(x =>
        x ? {
            name: x.name,
            source: "Netease2",
            id: `${x.id}`,
            image: imageUrl(x.coverImgUrl || x.picUrl),
            from: "topPlaylistStack"
        } : false
    );
    return [...playlists]
}

async function resolvePlaylistStack(playlistStack) {
    if (playlistStack.length === 0) return playlistStack;
    return (await Promise.all(playlistStack)).map(x =>
        Array.isArray(x) ? {
            name: x[1].name || x[0].playlist.name,
            source: "Netease2",
            id: `${x[0].playlist.id}`,
            image: x[1].image || imageUrl(x[0].playlist.coverImgUrl || x[0].playlist.picUrl),
            from: "playlistStack"
        } : {
            name: x.playlist.name,
            source: "Netease2",
            id: `${x.playlist.id}`,
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
                id: `${x[1].id}`,
                image: x[0] || imageUrl(x.coverImgUrl || x.picUrl),
                source: "Netease2",
                from: "dailyRecommendStack"
            } : {
                name: x.name,
                id: `${x.id}`,
                image: imageUrl(x.coverImgUrl || x.picUrl),
                source: "Netease2",
                from: "dailyRecommendStack"
            }
        )
    );
}

async function getPlaylists(uid) {
    // cat 可以從 getCatList() 抓
    async function resolveUserList(userList) {
        if (userList.length === 0) return userList;
        return [].concat(...(await Promise.all(userList)));
    }

    async function getCustomPlaylists(id) {
        let result = await client(options(`/user/playlist?uid=${encodeURIComponent(id)}`));
        return result.playlist.map(x => ({
            name: x.name,
            source: "Netease2",
            id: `${x.id}`,
            image: imageUrl(x.coverImgUrl || x.picUrl),
            from: "getCustomPlaylists"
        }));
    }

    async function processPlaylist(playlists = []) {
        let r = [];
        let playlistStack = [];
        let userList = [];
        let playlistFolders = [];
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
                                        client(options(`/playlist/detail?id=${encodeURIComponent(x.id)}`))
                                            .then(data => {
                                                resolve([data, {
                                                    name: x.name,
                                                    image: x.image
                                                }]);
                                            })
                                            .catch(e => reject(e));
                                    })
                                );
                            else playlistStack.push(client(options(`/playlist/detail?id=${encodeURIComponent(x.id)}`)));
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
                        playlistFolders.push({
                            name: x.name,
                            type: "folder",
                            image: x.image,
                            source: "Netease2",
                            id: `${x.id}`,
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
        return [r, playlistStack, userList, playlistFolders];
    }

    let [r, playlistStack, userList, playlistFolders] = await processPlaylist();
    // get topPlaylist & hqPlaylist
    let catList = await getCatList()
    await Promise.all(['topPlaylist', 'hqPlaylist'].map(async playlistId => {
        if (config[playlistId].enabled) {
            let { order, categories, limit } = config[playlistId];
            await Promise.all(categories.map(async category => {
                if (!category in catList) {
                    pokaLog.logDMErr('Netease2', `${playlistId} 的分類出錯，已修正為預設`)
                    config[playlistId].category = ["ACG", "日语", "欧美"];
                }
                let translatedCategory = await zhconvert(category)
                playlistFolders.push({
                    name: `${translatedCategory} - ${playlistId == 'hqPlaylist' ? '精品' : '精選'}歌單`,
                    source: "Netease2",
                    type: "folder",
                    id: `${playlistId}_${translatedCategory}`,
                    playlists: await resolveTopPlaylistStack([
                        client(options(`/top/playlist${playlistId == 'hqPlaylist' ? '/highquality' : ''}?limit=${limit}&order=${order in ["hot", "new"] ? order : "hot"}&cat=${encodeURIComponent(category)}`))
                    ])
                });
            }))
        }
    }))
    // push yunPan
    r.push({
        name: "網易雲音樂雲盤",
        source: "Netease2",
        id: "yunPan"
    })
    // get user playlists
    playlistFolders.push({
        name: `收藏歌單`,
        source: "Netease2",
        type: "folder",
        id: `userPlaylists`,
        playlists: await getCustomPlaylists(userId)
    });

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
                    playlistFolders.push({
                        name: "每日推薦歌單",
                        source: "Netease2",
                        image: config.dailyRecommendPlaylists.image || defaultImage,
                        type: "folder",
                        id: "dailyRecommendPlaylists",
                        playlists: await resolvedailyRecommendStack([
                            client(options(`/recommend/resource?timestamp=${Math.floor(Date.now() / 1000)}`))
                        ])
                    });
                else pokaLog.logDMErr('Netease2', `未登入，無法獲取每日推薦歌單。`)
            });
        } else if (!isLoggedin) {
            pokaLog.logDMErr('Netease2', `未登入，無法獲取每日推薦歌單。`)
        } else
            playlistFolders.push({
                name: "每日推薦歌單",
                source: "Netease2",
                image: config.dailyRecommendPlaylists.image || defaultImage,
                type: "folder",
                id: "dailyRecommendPlaylists",
                playlists: await resolvedailyRecommendStack([
                    client(options(`/recommend/resource?timestamp=${Math.floor(Date.now() / 1000)}`))
                ])
            });
    }
    return {
        playlists: [
            ...r,
            ...(await resolveUserList(userList)),
            ...(await resolvePlaylistStack(playlistStack))
        ],
        playlistFolders
    };
}

async function getPlaylistSongs(id, br = 999000) {
    let name;
    if (isIdName(id)) [id, name] = decomposeIdName(id);
    if (id == "dailyRecommendSongs") {
        let result = await client(options(`/recommend/songs`));
        if (result.code == 200) {
            let r = result.data.dailySongs.map((x, index) => ({
                name: x.name,
                artist: x.ar.map(x => x.name).join(", "),
                artistId: x.ar[0].id,
                album: x.al.name,
                albumId: x.al.id,
                cover: x.al.picUrl.replace("http", "https"),
                url: `/pokaapi/song/?moduleName=Netease2&songId=${encodeURIComponent(x.id)}`,
                codec: "mp3",
                source: "Netease2",
                id: `${x.id}`
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
        let result = await client(options(`/user/cloud?limit=2147483646`));
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
        let result = await client(options(`/playlist/detail?id=${encodeURIComponent(id)}`));
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
    let result = await client(options(`/lyric?id=${encodeURIComponent(id)}`, {}, false, false));
    let lyric;
    if (result.code == 200) {
        if (result.nolyric) lyric = "[0:0] 純音樂";
        else if (result.lrc.lyric) {
            try {
                lyric = parseLyric(result.lrc.lyric, (result.tlyric && result.tlyric.lyric) ? result.tlyric.lyric : null)
            } catch (e) {
                pokaLog.logDMErr('Netease2', `歌詞繁化錯誤 ${e.toString()}`)
                lyric = result.lrc.lyric;
            }
        } else lyric = null;
        return lyric;
    } else {
        pokaLog.logDMErr('Netease2', `無法獲取歌詞 ${id}。(${result.code})`)
        return null;
    }
}

async function searchLyrics(keyword) {
    let songs = (await search(keyword, 15, "song")).songs;
    let result = (await Promise.all(
        songs.map(async x => ({
            name: x.name,
            artist: x.artist,
            source: "Netease2",
            id: `${x.id}`,
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
    let r = [];
    let result = []

    let pinData = {
        songs: [],
        albums: [],
        artists: [],
        composers: [],
        playlists: []
    };
    try {
        (await fs.readJson(pin)).forEach(x => {
            pinData[x.type + "s"].push(x);
        });
    } catch (e) {
        pokaLog.logDMErr('Netease2', e)
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
                        client(options(`/recommend/resource?timestamp=${Math.floor(Date.now() / 1000)}`))
                    );
                else pokaLog.logDMErr('Netease2', `未登入，無法獲取每日推薦歌單。`)
            });
        } else if (!isLoggedin) {
            pokaLog.logDMErr('Netease2', `未登入，無法獲取每日推薦歌單。`)
        } else
            dailyRecommendStack.push(
                client(options(`/recommend/resource?timestamp=${Math.floor(Date.now() / 1000)}`))
            );

        result.push({
            title: "home_dailyRecommend_netease",
            icon: "insert_emoticon",
            source: "Netease2",
            playlists: (await resolvedailyRecommendStack(dailyRecommendStack)).slice(0, config.dailyRecommendPlaylists.limit || 50)
        })
    }
    result.push({
        title: "home_netease",
        source: "Netease2",
        icon: "audiotrack",
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
    req
};
