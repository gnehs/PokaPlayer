const request = require('request');

exports.login = async(dsm) => {
        return new Promise(function(resolve, reject) {
            var url = `${dsm.protocol}://${dsm.host}:${dsm.port}/webapi/auth.cgi?api=SYNO.API.Auth&method=Login&version=1&account=${dsm.account}&passwd=${dsm.password}&session=AudioStation&format=cookie`
            request(url, function(error, res, body) {
                if (!error && res.statusCode == 200) {
                    resolve({ "cookie": res.headers["set-cookie"], "success": JSON.parse(body).success });
                } else {
                    resolve(error);
                }
            });
        });
    }
    //https://nas.gnehs.net/webapi/AudioStation/song.cgi
    /*
    additional	song_tag,song_audio,song_rating
    api	SYNO.AudioStation.Song
    library	shared
    limit	100
    method	list
    sort_by	random
    version	3
    */
    //https://nas.gnehs.net/webapi/AudioStation/stream.cgi/0.mp3?sid=24oFv8yyNrnVw1820PEN591901&api=SYNO.AudioStation.Stream&version=2&method=stream&id=music_1678&_dc=1532249856580