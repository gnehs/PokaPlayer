const pokaLog = require("./log"); // 可愛控制台輸出
const Pin = require('./db/pin')
const Playlist = require('./db/playlist')
const Record = require('./db/record')
const encodeBase64 = require('./dataModule/cryptoUtils').encodeBase64


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
async function updateDatabase() {
  Pin.model.find({}).then(async pins => {
    let count = 0
    for (let pin of pins) {
      if (pin.type == 'album' && pin.source == 'DSM' && !pin.id.match(/^Wy/)) {
        pin.id = encodeBase64(JSON.stringify(Object.values(JSON.parse(pin.id))))
        await pin.save()
        count++
      }
    }
    if (count)
      pokaLog.logDB('UPDATE', `${count} pins updated`)
  })
  Playlist.model.find({}).then(async playlists => {
    let count = 0
    for (let playlist of playlists) {
      for (let song of playlist.songs) {
        if (song.source == 'DSM' && song.albumId && !song.albumId.match(/^Wy/)) {
          song.albumId = encodeBase64(JSON.stringify(Object.values(JSON.parse(song.albumId))))
          count++
        }
      }
      await playlist.save()
    }
    if (count)
      pokaLog.logDB('UPDATE', `${count} playlist songs updated`)
  })
  Record.model.find({}).then(async records => {
    let count = 0
    for (let record of records) {
      if (record.source == 'DSM' && record.albumId && !record.albumId.match(/^Wy/)) {
        record.albumId = encodeBase64(JSON.stringify(Object.values(JSON.parse(record.albumId))))
        await record.save()
        count++
      }
    }
    if (count)
      pokaLog.logDB('UPDATE', `${count} records updated`)
  })
}
module.exports = updateDatabase