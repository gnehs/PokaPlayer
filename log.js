let Reset = "\x1b[0m",
    Bright = "\x1b[1m",
    Dim = "\x1b[2m",
    Underscore = "\x1b[4m",
    Blink = "\x1b[5m",
    Reverse = "\x1b[7m",
    Hidden = "\x1b[8m",
    FgBlack = "\x1b[30m",
    FgRed = "\x1b[31m",
    FgGreen = "\x1b[32m",
    FgYellow = "\x1b[33m",
    FgBlue = "\x1b[34m",
    FgMagenta = "\x1b[35m",
    FgCyan = "\x1b[36m",
    FgWhite = "\x1b[37m",
    BgBlack = "\x1b[40m",
    BgRed = "\x1b[41m",
    BgGreen = "\x1b[42m",
    BgYellow = "\x1b[43m",
    BgBlue = "\x1b[44m",
    BgMagenta = "\x1b[45m",
    BgCyan = "\x1b[46m",
    BgWhite = "\x1b[47m"

const log = (a, b) => console.log(`${BgBlue}${FgBlue}[${FgWhite}%s${FgBlue}]${Reset} %s`, a, b)
const logErr = (a, b) => console.log(`${BgBlue}${FgBlue}[${FgWhite}%s${FgBlue}]${Reset} ${FgRed}%s${Reset}`, a, b)
const logDM = (a, b) => console.log(`${BgBlue}${FgBlue}[${FgWhite}DataModules${FgBlue}]${BgGreen}${FgGreen}[${FgWhite}%s${FgGreen}]${Reset} %s`, a, b)
const logDB = (a, b) => console.log(`${BgBlue}${FgBlue}[${FgWhite}DB${FgBlue}]${BgCyan}${FgCyan}[${FgWhite}%s${FgCyan}]${Reset} %s`, a, b)
const logDBErr = (a, b) => console.log(`${BgBlue}${FgBlue}[${FgWhite}DB${FgBlue}]${BgRed}${FgRed}[${FgWhite}%s${FgRed}]${Reset} %s`, a, b)
const logDMErr = (a, b) => console.log(`${BgBlue}${FgBlue}[${FgWhite}DataModules${FgBlue}]${BgRed}${FgRed}[${FgWhite}%s${FgRed}]${Reset} %s`, a, b)

module.exports = {
    log,
    logErr,
    logDM, logDMErr,
    logDB, logDBErr

}