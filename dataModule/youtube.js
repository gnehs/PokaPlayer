const yt = require('youtube-search-without-api-key');
const YTDlpWrap = require('yt-dlp-wrap').default;
const config = require('../config.json').YouTube;
const pokaLog = require("../log"); // 可愛控制台輸出
const axios = require('axios');
const fs = require('fs');
const YTDLP_PATH = "./temp/yt-dlp";
fs.mkdirSync('./temp', { recursive: true });
// clear temp folder
fs.readdirSync('./temp').forEach(file => {
  if (file == "yt-dlp") return;
  fs.unlink(`./temp/${file}`, err => {
    if (err) throw err;
  });
});
let ytDlpWrap;
async function onLoaded() {
  try {
    await YTDlpWrap.downloadFromGithub(YTDLP_PATH)
    ytDlpWrap = new YTDlpWrap(YTDLP_PATH)
    pokaLog.logDM("YouTube", "YouTube Loaded");
    return true
  } catch (e) {
    pokaLog.logDMErr("YouTube", "YouTube Load Failed");
    return false
  }
}
async function parseSongs(songs) {
  let result = []
  await Promise.all(songs.map(async x => {
    let id = x.id.videoId
    let metadata = await ytDlpWrap.getVideoInfo(`https://www.youtube.com/watch?v=${id}`);
    result.push({
      id,
      name: metadata.fulltitle,
      artist: metadata.channel,
      // artistId: metadata.channel_id,
      album: metadata.channel,
      cover: x.snippet.thumbnails.url,
      url: `/pokaapi/song/?moduleName=YouTube&songId=${x.id.videoId}`,
      duration: x.duration_raw,
      source: "YouTube"
    })
  }))
  return result
}
async function search(keyword) {
  let res = await yt.search(keyword)
  return { songs: await parseSongs(res) }
}
async function getSong(req, songRes = "high", id, res) {
  let readableStream = ytDlpWrap.execStream([
    `https://www.youtube.com/watch?v=${id}`,
    '-f',
    'bestaudio',
  ]);
  readableStream.pipe(res)
  return
}
async function getLyric(id) {
  let subtitlesDownloadOrder = ['zh-TW', 'zh-Hant', 'zh-Hans', 'zh-HK', 'zh-CN', 'zh-SG', 'zh-MO', 'zh', 'ja', 'en']
  let metadata = await ytDlpWrap.getVideoInfo(`https://www.youtube.com/watch?v=${id}`);
  for (let lang of subtitlesDownloadOrder) {
    let subtitle = metadata.subtitles[lang]
    if (subtitle) {
      let json3Url = subtitle.find(x => x.ext == 'json3').url
      let json3 = (await axios.get(json3Url)).data
      let lrc = json3toLrc(json3)
      return lrc
    }
  }
  return
}
function json3toLrc(json3) {
  let events = json3.events
  let lrc = ``
  const timeToTag = seconds => {
    let minute = Math.floor(seconds / 60);
    let second = seconds - minute * 60
    return `${minute}:${second}`;
  };
  for (let event of events) {
    let time = timeToTag(event.tStartMs / 1000)
    lrc += `[${time}]${event.segs[0].utf8}\n`
  }
  return lrc
}
module.exports = {
  name: "YouTube",
  enabled: config && config.enabled,
  onLoaded,
  getSong,
  search,
  getLyric,
};
