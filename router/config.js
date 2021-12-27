const router = require("express").Router();
const playlistDB = require("../db/playlist");
const recordDB = require("../db/record");
const dsm = require("../dataModule/dsm");
router.get("/dsm-music-id-fix", async (req, res) => {
  res.json({
    success: true,
  })
  console.log('fixing music id...')
  // fix record
  let records = await recordDB.getAllRecords();
  for (let record of records) {
    if (record.source == "DSM") {

      if (!record.albumId)
        record.albumId = JSON.stringify({
          album_name: record.album,
          artist_name: record.artist,
        })
      try {
        let album = await dsm.getAlbum(record.albumId);
        if (album) {
          let filteredSong = album.songs.filter(x => x.name == record.name)
          if (filteredSong.length) {
            if (record.songId !== filteredSong[0].id) {
              console.log(`[Record] ${record.name} ${record.songId} => ${filteredSong[0].id}`)
              record.url = filteredSong[0].url
              record.songId = filteredSong[0].id
              await record.save()
            }
          } else {
            console.log(`[Record] ${record.name} not found in ${album.name}`)
          }
        }
      } catch (e) {
        console.log(e)
      }
    }
  }
  // fix playlist
  let playlists = await playlistDB.getAllPlaylists()
  for (let playlist of playlists) {
    for (let song of playlist.songs) {
      if (song.source == "DSM") {
        try {
          if (!song.albumId)
            song.albumId = JSON.stringify({
              album_name: song.album,
              artist_name: song.artist,
            })
          // get album data
          let album = await dsm.getAlbum(song.albumId);
          if (album) {
            let filteredSong = album.songs.filter(x => x.name == song.name)
            if (filteredSong.length) {
              if (song.id !== filteredSong[0].id) {
                console.log(`[Playlist] ${song.name} ${song.id} => ${filteredSong[0].id}`)
                song.url = filteredSong[0].url
                song.id = filteredSong[0].id
              }
            } else {
              console.log(`[Playlist] ${song.name} not found in ${album.name}`)
            }
          }
        } catch (e) {
          console.log(song, e)
        }
      }
    }
    await playlist.save()
  }
  console.log('done')
})
module.exports = router;