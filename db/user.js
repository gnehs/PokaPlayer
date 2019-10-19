const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const {
    db
} = require('./db.js')
const userSchema = new mongoose.Schema({
    name: String,
    username: String,
    password: String,
    createTime: {
        type: Date,
        default: Date.now
    },
    role: {
        type: String,
        default: 'user'
    },
    settings: {
        type: String,
        default: `{}`
    }
});
const model = mongoose.model('User', userSchema)
async function create({
    name,
    username,
    password,
    role
}) {
    password = bcrypt.hashSync(password, 10)
    let user = new model({
        name,
        username,
        password,
        role
    })
    await user.save()
    return ({
        success: true,
        user
    })
}
async function changeName(_id, name) {
    let user = await getUserById(_id)
    if (!user) return {
        success: false,
        error: 'user not found'
    }
    user.name = name
    await user.save()
    return ({
        success: true
    })
}
async function changeUsername(_id, username) {
    // is username available
    let usernameCheck = await getUserByUsername(username)
    if (usernameCheck) return {
        success: false,
        error: 'username already taken'
    }
    // change username
    let user = await getUserById(_id)
    if (!user) return {
        success: false,
        error: 'user not found'
    }
    user.username = username
    await user.save()
    return ({
        success: true
    })
}
async function changePassword(_id, oldpassword, password) {
    let user = await getUserById(_id)
    if (!user) return {
        success: false,
        error: 'user not found'
    }

    if (comparePassword(oldpassword, user.password)) {
        user.password = bcrypt.hashSync(password, 10)
        await user.save()
        return {
            success: true,
            error: null,
            user: user._id
        }
    } else
        return {
            success: false,
            error: 'password invalid'
        }
}
async function getSetting(_id) {
    let user = await getUserById(_id)
    if (!user) return {
        success: false,
        error: 'user not found'
    }
    return ({
        success: true,
        settings: JSON.parse(user.settings)
    })
}
async function changeSetting(_id, settings) {
    let user = await getUserById(_id)
    if (!user) return {
        success: false,
        error: 'user not found'
    }
    let s = JSON.parse(user.settings)
    for (i in settings)
        s[i] = settings[i]
    user.settings = JSON.stringify(s)
    await user.save()
    return ({
        success: true,
        settings: s
    })
}
async function login({
    username,
    password
}) {
    let user = await getUserByUsername(username)
    if (!user)
        return {
            success: false,
            error: 'user not found'
        }
    if (comparePassword(password, user.password))
        return {
            success: true,
            error: null,
            user: user._id
        }
    else
        return {
            success: false,
            error: 'password invalid'
        }
}
async function getUserByUsername(username) {
    return (await model.findOne({
        username: username
    }))
}
async function isUserAdmin(id) {
    let userData = await model.findById(id)
    return userData && userData.role == 'admin'
}
async function getAllUsers() {
    return (await model.findOne({}))
}
async function getUserById(id) {
    return (await model.findById(id))
}

function comparePassword(s, hash) {
    return bcrypt.compareSync(s, hash)
}

module.exports = {
    create,
    login,
    getAllUsers,
    getUserByUsername,
    getUserById,
    getSetting,
    changeName,
    changeSetting,
    changeUsername,
    changePassword,
    isUserAdmin
}