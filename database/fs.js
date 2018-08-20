const fs = require('fs-extra')

class Database {
    constructor(userFilesDir) {
        fs.ensureDir(userFilesDir)
            .then(() => {
                let userPath = x => userFilesDir + x + '.usr';
                let checkFileExists = s => new Promise(r => fs.access(s, fs.F_OK, e => r(!e)))

                this.isUserExist = username => checkFileExists(userPath(username))
                this.remove = username => fs.remove(userPath(username))
                this.write = (username, content) => fs.outputFile(userPath(username), content, "binary")
                this.read = username => fs.readFile(userPath(username))
            })
            .catch(err => {throw err})
    }
}

exports.Database = x => new Database(x)