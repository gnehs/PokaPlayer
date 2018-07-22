var request = require('request');
var j = request.jar()
var request = request.defaults({ jar: j })
exports.login = async(dsm) => {
    return new Promise(function(resolve, reject) {
        var url = `${dsm.protocol}://${dsm.host}:${dsm.port}/webapi/auth.cgi?api=SYNO.API.Auth&method=Login&version=1&account=${dsm.account}&passwd=${dsm.password}&session=AudioStation&format=cookie`
        request(url, function(error, res, body) {
            if (!error && res.statusCode == 200) {
                resolve(JSON.parse(body));
            } else {
                resolve(error);
            }
        });
    });
}
exports.proxy = async(url) => {
    return new Promise(function(resolve, reject) {
        request(url, function(error, res, body) {
            if (!error && res.statusCode == 200) {
                resolve(JSON.parse(body));
            } else {
                resolve(error);
            }
        });
    });
}
exports.api = async(dsm, CGI_PATH, API_NAME, METHOD, VERSION = 1, PARAMS) => {
    return new Promise(function(resolve, reject) {
        request(`${dsm.protocol}://${dsm.host}:${dsm.port}/webapi/${CGI_PATH}?api=${API_NAME}&method=${METHOD}&version=${VERSION}${PARAMS}`, function(error, res, body) {
            if (!error && res.statusCode == 200) {
                resolve(JSON.parse(body));
            } else {
                resolve(error);
            }
        });
    });
}
exports.random100 = async(dsm) => {
    return new Promise(function(resolve, reject) {
        request(`${dsm.protocol}://${dsm.host}:${dsm.port}/webapi/AudioStation/song.cgi?api=SYNO.AudioStation.Song&method=list&additional=song_tag,song_audio,song_rating&library=shared&limit=100&sort_by=random&version=1`, function(error, res, body) {
            if (!error && res.statusCode == 200) {
                resolve(JSON.parse(body));
            } else {
                resolve(error);
            }
        });
    });
}