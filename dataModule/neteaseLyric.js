const rp = require("request-promise")
const pokaLog = require("../log"); // 可愛控制台輸出
const config = require(__dirname + "/../config.json").neteaseLyric; // 設定

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
async function onLoaded() {
    //檢測歌詞模組是否正常運作
    let testSearch = await searchLyrics('玫瑰少年')
    if (testSearch) pokaLog.logDM('neteaseLyric', `載入完成！`)
    return !!testSearch
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
    let result = await rp({
        uri: `https://api.imjad.cn/cloudmusic/?type=lyric&id=${id}`,
        json: true
    });
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
            try {
                lyric = await chsToCht(result.lrc.lyric, "Traditional");
            } catch (e) {
                lyric = result.lrc.lyric;
            }
        } else lyric = null;
        try {
            lyric = lyric.replace(/作词/g, '作詞')
        } catch (e) {
            lyric = lyric
        }
        return lyric;
    } else {
        pokaLog.logDMErr('neteaseLyric', `無法獲取歌詞 ${id}。(${result.code})`)
        return null;
    }
}
async function searchLyrics(keyword) {
    let songSearch = await rp({
        method: "POST",
        uri: "http://music.163.com/api/search/pc",
        form: {
            s: keyword,
            offset: 0,
            limit: 20,
            type: 1,
        },
        json: true
    });
    if (songSearch.code != 200) return false
    let songs = songSearch.result.songs
    let result = (await Promise.all(
        songs.map(async x => ({
            name: x.name,
            artist: x.artists.map(x => x.name || "").join(", "),
            source: "neteaseLyric",
            id: x.id,
            lyric: await getLyric(x.id)
        }))
    )).filter(x => x.lyric && x.lyric != "[0:0] 純音樂");

    return {
        lyrics: result
    };
}
module.exports = {
    name: "neteaseLyric",
    enabled: config.enabled,
    onLoaded,
    searchLyrics
}