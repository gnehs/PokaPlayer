const metingUrl = require(__dirname + '/../config.json').Meting.url,
    rp = require('request-promise'),
    request = require('request').defaults({ jar: require('request').jar() }),
    userAgent = 'PokaPlayer',
    lyricRegex = /\[([0-9.:]*)\]/i

//https://cdn.rawgit.com/rexx0520/LyriConv-js/f8316b3/modules/migrate.js
function migrate(org, t, offset = 10 ** -3) {
    const isDigit = x => !isNaN(Number(x))

    const plus = (num1, num2, ...others) => { // 精確加法
        if (others.length > 0) return plus(plus(num1, num2), others[0], ...others.slice(1));
        const baseNum = Math.pow(10, Math.max(digitLength(num1), digitLength(num2)));
        return (times(num1, baseNum) + times(num2, baseNum)) / baseNum;
    }
    const digitLength = num => {
        // Get digit length of e
        const eSplit = num.toString().split(/[eE]/);
        const len = (eSplit[0].split('.')[1] || '').length - (+(eSplit[1] || 0));
        return len > 0 ? len : 0;
    }
    const times = (num1, num2, ...others) => { // 精確乘法
        function checkBoundary(num) {
            if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) console.warn(`${num} is beyond boundary when transfer to integer, the results may not be accurate`);
        }

        function float2Fixed(num) {
            if (num.toString().indexOf('e') === -1) return Number(num.toString().replace('.', ''));
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
    }
    const minus = (num1, num2, ...others) => { // 精確減法
        if (others.length > 0) return minus(minus(num1, num2), others[0], ...others.slice(1));
        const baseNum = Math.pow(10, Math.max(digitLength(num1), digitLength(num2)));
        return (times(num1, baseNum) - times(num2, baseNum)) / baseNum;
    }
    const strip = (x, precision = 12) => +parseFloat(x.toPrecision(precision)) // 數字精確化


    const tagToTime = tag => isDigit(tag[0]) ? tag.split(':').reverse().reduce((acc, cur, index) => plus(acc, Number(cur) * (60 ** index)), 0) : tag
    const parse = (x, isTranslated = false) => {
        let pLyricLines = x
            .split("\n").filter(x => x != '')
            .map(str => {
                const regex = /\[(\d+:\d+\.\d+)\]/gm;
                let m, result = [];

                while ((m = regex.exec(str)) !== null) {
                    if (m.index === regex.lastIndex) regex.lastIndex++;
                    result.push(m[1])
                }
                result.push(str.match(/.+\]((?:.|^$)*)/)[1])
                return result
            })
        let result = []
        for (let pLyricLine of pLyricLines) {
            let lyric = pLyricLine.pop()
            for (let time of pLyricLine) {
                result.push([tagToTime(time), lyric, isTranslated])
            }
        }
        return result
    }

    const timeToTag = seconds => {
        let minute = Math.floor(seconds / 60)
        let second = minus(seconds, minute * 60)
        return `${minute}:${second}`
    }

    // 開始切成 [(tag, lyric)]

    parsedLyrics = parse(org).concat(parse(t, true)).sort((a, b) => {
        if (typeof(a[0]) == typeof(b[0]) == 'string') return 0
        else if (typeof(a[0]) == 'string') return -1
        else if (typeof(b[0]) == 'string') return 1
        else {
            if (a[0] == b[0]) return a[2] ? 1 : -1
            else return a[0] < b[0] ? -1 : 1
        }
    })

    // 整理成 [[time, [orgLyric, tLyric]]]
    let parsedLyricPairs = [],
        i = 0
    while (i < parsedLyrics.length) {
        if (typeof(parsedLyrics[i][0]) == 'string') {
            parsedLyricPairs.push(parsedLyrics[i])
            i += 1
        } else if (i != parsedLyrics.length - 1) {
            if (parsedLyrics[i][0] == parsedLyrics[i + 1][0]) {
                parsedLyricPairs.push([parsedLyrics[i][0],
                    [parsedLyrics[i][1], parsedLyrics[i + 1][1]]
                ])
                i += 2
            } else {
                parsedLyricPairs.push([parsedLyrics[i][0],
                    [parsedLyrics[i][1], parsedLyrics[i][1]]
                ])
                i += 1
            }
        } else {
            parsedLyricPairs.push([parsedLyrics[i][0],
                [parsedLyrics[i][1], parsedLyrics[i][1]]
            ])
            i += 1
        }
    }

    // 壓回 LRC
    let result = ''
    for (let i in parsedLyricPairs) {
        i = Number(i)
        if (typeof(parsedLyricPairs[i][0]) == 'string') result += `[${parsedLyricPairs[i][0]}]\n`
        else {
            if (i != parsedLyricPairs.length - 1) result += `[${timeToTag(parsedLyricPairs[i][0])}]${parsedLyricPairs[i][1][0]}\n[${timeToTag(plus(parsedLyricPairs[i+1][0], -offset))}]${parsedLyricPairs[i][1][1]}\n`
            else result += `[${timeToTag(parsedLyricPairs[i][0])}]${parsedLyricPairs[i][1][0]}\n[${timeToTag(parsedLyricPairs[i][0])}]${parsedLyricPairs[i][1][1]}\n`
        }
    }

    return result
}

function parseSongs(songs) {
    /*{ id: 22661895,
        name: 'A',
        artist: [ 'beatmania' ],
        album: 'Beatmania IIDX: 7th style',
        pic_id: '567347999954116',
        url_id: 22661895,
        lyric_id: 22661895,
        source: 'netease' } */
    return songs.map(song => +{
        name: song.name,
        artist: song.artist,
        album: song.album,
        cover: `/pokaapi/cover/?moduleName=Netease&data=${song.id}`,
        url: `/pokaapi/song/?moduleName=Netease&songId=${song.id}`,
        bitrate: 320000,
        codec: "mp3",
        lrc: song.lyric_id,
        source: "Netease",
        id: song.id,
    })
}

function getSong(req, songRes, songId) {
    let br = {low: 128, medium: 192, high:320, original:320}[songRes]
    return `${metingUrl}/?server=netease&type=url&id=${songId}&br=${br}`
}

function getSongs(song) {
    if (typeof(song) == 'object') {
        if (Array.isArray(song)) {
            // 傳入的資料是 list
            return song.reduce((acc, cur) => {
                acc[cur] = `${metingUrl}/?server=netease&type=url&id=${cur}`;
                return acc
            }, {})
        } else {
            // 傳入的資料是 object
        }
    }
}

function getCover(id) {
    return  `${metingUrl}/?server=netease&type=pic&id=${id}`
}

function getCovers(id) {
    if (typeof(song) == 'object') {
        if (Array.isArray(id)) {
            // 傳入的資料是 list

            return id.reduce((acc, cur) => {
                acc[cur] = `${metingUrl}/?server=netease&type=pic&id=${cur}`;
                return acc
            }, {})

        } else {
            // 傳入的資料是 object
        }
    }
}

async function search(keyword) {
    let options = {
        method: 'GET',
        uri: metingUrl,
        qs: {
            'server': 'netease',
            'type': 'search',
            keyword
        },
        headers: {
            'User-Agent': userAgent
        },
        json: true, // Automatically parses the JSON string in the response,
    };
    let result = await rp(options)
    return { songs: parseSongs(result) }
}

async function parseLyrics(lyrics) {
    /*{ id: 22661895,
        name: 'A',
        artist: [ 'beatmania' ],
        album: 'Beatmania IIDX: 7th style',
        pic_id: '567347999954116',
        url_id: 22661895,
        lyric_id: 22661895,
        source: 'netease' } */
    return Promise.all(lyrics.map(async cur => {
        if ((await getLyric(cur.lyric_id)))
            return {
                name: cur.name,
                artist: cur.artist[0],
                source: 'Netease',
                id: cur.lyric_id,
                lyric: await getLyric(cur.lyric_id)
            }
        return cur
    }))
}
async function searchLyric(keyword) {
    let options = {
        method: 'GET',
        uri: metingUrl,
        qs: {
            'server': 'netease',
            'type': 'search',
            keyword
        },
        headers: {
            'User-Agent': userAgent
        },
        json: true, // Automatically parses the JSON string in the response,
    };
    let result = await rp(options)
    return { lyrics: await parseLyrics(result) }
}

async function getLyric(id) {
    let options = {
        method: 'GET',
        uri: metingUrl,
        qs: {
            'server': 'netease',
            'type': 'lrc',
            id
        },
        headers: {
            'User-Agent': userAgent
        },
        json: true, // Automatically parses the JSON string in the response,
    };
    let result = await rp(options)
    if (result.tlyric)
        result = migrate(result.lyric, result.tlyric)
    else
        result = result.lyric
    return result.match(lyricRegex) ? result : false
}

async function getAlbumSongs(id) {
    let options = {
        method: 'GET',
        uri: metingUrl,
        qs: {
            'server': 'netease',
            'type': 'album',
            id
        },
        headers: {
            'User-Agent': userAgent
        },
        json: true, // Automatically parses the JSON string in the response,
    };

    return (await rp(options))
}

async function getPlaylistSongs(id) {
    let options = {
        method: 'GET',
        uri: metingUrl,
        qs: {
            'server': 'netease',
            'type': 'playlist',
            id
        },
        headers: {
            'User-Agent': userAgent
        },
        json: true, // Automatically parses the JSON string in the response,
    };

    return (await rp(options))
}

async function getArtistSongs(id) {
    let options = {
        method: 'GET',
        uri: metingUrl,
        qs: {
            'server': 'netease',
            'type': 'artist',
            id
        },
        headers: {
            'User-Agent': userAgent
        },
        json: true, // Automatically parses the JSON string in the response,
    };

    return (await rp(options))
}

function getSongsUrl(song) {
    if (Array.isArray(song)) {
        // 傳入的資料是 list
        return song.reduce((acc, cur) => {
            acc[cur] = `${metingUrl}/?server=netease&type=url&id=${cur}`
            return acc
        }, {})
    } else {
        return `${metingUrl}/?server=netease&type=url&id=${song}`
    }
}

module.exports = {
    name: 'Netease',
    getSong, //done
    getSongs,
    getSongsUrl,
    getCover, //done
    getCovers,
    search, //done
    getAlbumSongs,
    // getFolders,
    // getFolderFiles,
    // getArtists,
    getArtistSongs,
    // getArtistAlbums,
    // getComposers,
    // getComposerAlbums,
    // getPlaylists,
    getPlaylistSongs,
    getLyric, //done
    searchLyric //done
};