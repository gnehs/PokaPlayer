const config = require('./config.json');
const jwtPassword = config.auth.jwtPassword || 'test';
const jwtIss = config.auth.jwtIss || 'PokaPlayer';
const jwtExpirePeriod = config.auth.jwtExpirePeriod || 600;
const userFilesDir = config.auth.userFilesDir || __dirname + '/users/';
const dbType = config.auth.dbType || 'fs';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const jsonfile = require('jsonfile');
const algorithm = 'aes-256-ctr';
const hash = {...require('js-sha3'), ...{debug: x=>x}}[config.auth.hash || 'sha3_512']

const base64 = data => Buffer.from(data).toString("base64");
const db = require(__dirname + '/database/' + dbType + '.js').Database(userFilesDir)

class CustomError extends Error {
    constructor(message) {
      super(message);
      this.name = this.constructor.name;
    }
  }

class UsernameOccupiedError extends CustomError {
    constructor(username) {
      super("Username occupied.");
      this.username = username;
    }
  }

class UserNotFoundError extends CustomError {
    constructor(username) {
      super("User not exist.");
      this.username = username;
    }
  }

class PasswordError extends CustomError {
    constructor() {
      super("Password error.");
    }
  }

class User {
    constructor(username, password) {
        this.init(username, password)
    }

    init(username, password) {
        this.session = {}
        this.username = username;
        this.token = undefined;
        if (typeof(username) != 'undefined') db.isUserExist(username)
            .then(userExist => userExist ? this.login(username, password) : this.register(username, password))
            .catch(console.error)
    }

    register(username, password) {
        return new Promise(async(resolve, reject) => {
            if (await db.isUserExist(username)) reject(new UsernameOccupiedError(username))
            else {
                encrypt(username, hash(password), {
                        'username': username,
                        'servers': {}
                    })
                    .then(_ => this.login(username, hash(password)))
                    .then(resolve)
                    .catch(reject)
                    }
            })
    }

    login(username, password) {
        return new Promise(async(resolve, reject) => {
            if (!(await db.isUserExist(username))) reject(new UserNotFoundError(username))
            else {
                decrypt(username, password)
                    .then(data => {
                        this.username = username
                        jwt.sign({ "data": encryptText(JSON.stringify(data), password) }, 
                            jwtPassword, {
                                expiresIn: jwtExpirePeriod,
                                issuer: jwtIss,
                                subject: username
                            }, 
                            (err, data) => {
                                if (err) reject(err);
                                else {
                                    this.token = data;
                                    resolve(data);
                                }
                            })
                    })
                    .catch(reject)
                }
            })
    }

    getData() {
        return new Promise((resolve, reject) => {
            jwt.verify(this.token, jwtPassword, { issuer: jwtIss }, (err, decoded) => {
                if (err) this.logout().then(_ => reject(err)).catch(e => reject[e, err])
                else resolve(decoded.data)
            });
        })
    }

    changePassword(oldPassword, newPassword) {
        return new Promise((resolve, reject) => {
            decrypt(this.username, oldPassword)
                .then(data => encrypt(this.username, newPassword, data))
                .then(_ => this.login(this.username, newPassword))
                .then(_ => resolve(true))
                .catch(reject)
            })
    }

    modifyData(password, newServer) {
        return new Promise((resolve, reject) => {
            decrypt(this.username, password)
                .then(data => encrypt(this.username, password, {...data, ...{servers: newServer}}))
                .then(_ => this.login(this.username, password))
                .then(resolve)
                .catch(reject)
            })
    }

    logout() {
        return new Promise((resolve, reject) => {
            try {
                this.init()
                delete this
                resolve(true)
            } catch(e) {
                reject(e)
            }
        })
    }

    perish() {
        return new Promise((resolve, reject) => {
            db.remove(this.username)
                .then(() => this.logout())
                .then(_ => resolve(true))
                .catch(reject)
        })
    }
}

exports.User = User

function encrypt(username, password, data) {
    return new Promise(async(resolve, reject) => {
        let cipher = crypto.createCipher(algorithm, password);
        let crypted = Buffer.concat([cipher.update(Buffer.from(JSON.stringify(data))), cipher.final()]);
        db.write(username, crypted)
            .then(() => resolve(true))
            .catch(reject)
        })
}

function decrypt(username, password) {
    return new Promise((resolve, reject) => {
        let decipher = crypto.createDecipher(algorithm, password);
        let dec = buffer => Buffer.concat([decipher.update(buffer), decipher.final()]).toString('utf8');
        db.read(username)
            .then(data => resolve(JSON.parse(dec(data))))
            .catch(_ => reject(new PasswordError()))
        })
}

// https://github.com/crypto-browserify/browserify-aes
// https://lollyrock.com/articles/nodejs-encryption/

function encryptText(text, password) {
    let cipher = crypto.createCipher(algorithm, password)
    let crypted = cipher.update(text, 'utf8', 'hex')
    crypted += cipher.final('hex');
    return crypted;
}